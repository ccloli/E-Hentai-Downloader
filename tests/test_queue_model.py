from __future__ import annotations

import tempfile
import unittest
import json
from pathlib import Path

from desktop_gui.queue_model import (
    COMPLETED,
    DOWNLOADING,
    FAILED,
    PENDING,
    DownloadQueue,
    InstanceLockError,
    QueueStoreError,
    QueueStore,
    SingleInstanceLock,
)


URL_ONE = "https://e-hentai.org/g/123/abcdef1234/"
URL_TWO = "https://exhentai.org/g/456/0123456789/"
GAMEBUS_URL = "https://gamebus001.com/comic/1186"


class DownloadQueueTests(unittest.TestCase):
    def test_accepts_and_canonicalizes_gamebus_jobs(self) -> None:
        download_queue = DownloadQueue()
        (item,) = download_queue.add(
            ["http://www.gamebus001.com/comic/1186/?from=home"]
        )

        self.assertEqual(item.url, GAMEBUS_URL)
        self.assertEqual(item.status, PENDING)

    def test_adds_in_order_and_deduplicates_active_jobs(self) -> None:
        download_queue = DownloadQueue()
        added = download_queue.add([URL_ONE, URL_TWO, URL_ONE])

        self.assertEqual([item.url for item in added], [URL_ONE, URL_TWO])
        self.assertEqual(
            [item.status for item in download_queue.snapshot()],
            [PENDING, PENDING],
        )

    def test_processes_pending_jobs_in_order(self) -> None:
        download_queue = DownloadQueue()
        first, second = download_queue.add([URL_ONE, URL_TWO])

        self.assertEqual(download_queue.next_pending().id, first.id)
        download_queue.set_status(first.id, COMPLETED, "done")
        self.assertEqual(download_queue.next_pending().id, second.id)
        download_queue.set_status(second.id, FAILED, "failed")
        self.assertIsNone(download_queue.next_pending())

        self.assertEqual(download_queue.retry([second.id]), 1)
        self.assertEqual(download_queue.next_pending().id, second.id)

    def test_does_not_remove_active_job(self) -> None:
        download_queue = DownloadQueue()
        first, second = download_queue.add([URL_ONE, URL_TWO])
        download_queue.next_pending()

        self.assertEqual(download_queue.remove([first.id, second.id]), 1)
        remaining = download_queue.snapshot()
        self.assertEqual(len(remaining), 1)
        self.assertEqual(remaining[0].status, DOWNLOADING)

    def test_clears_pending_and_finished_jobs_separately(self) -> None:
        download_queue = DownloadQueue()
        first, second = download_queue.add([URL_ONE, URL_TWO])
        download_queue.next_pending()
        download_queue.set_status(first.id, COMPLETED)

        self.assertEqual(download_queue.clear_finished(), 1)
        self.assertEqual(download_queue.clear_pending(), 1)
        self.assertEqual(download_queue.snapshot(), ())

    def test_persists_and_recovers_interrupted_job(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store = QueueStore(Path(temp_dir) / "queue.json")
            original = DownloadQueue()
            first, second = original.add([URL_ONE, URL_TWO])
            original.next_pending()
            original.set_status(second.id, FAILED, "network error")
            store.save(original)

            restored = store.load()
            items = restored.snapshot()
            self.assertEqual([item.id for item in items], [first.id, second.id])
            self.assertEqual(items[0].status, PENDING)
            self.assertIn("中断", items[0].message)
            self.assertEqual(items[1].status, FAILED)
            self.assertEqual(items[1].message, "network error")

    def test_single_instance_lock_prevents_queue_overwrite(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "gui.lock"
            first = SingleInstanceLock(path)
            try:
                with self.assertRaises(InstanceLockError):
                    SingleInstanceLock(path)
            finally:
                first.close()

            replacement = SingleInstanceLock(path)
            replacement.close()

    def test_invalid_url_is_reported_as_queue_store_error(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "queue.json"
            path.write_text(
                json.dumps(
                    {
                        "version": 1,
                        "items": [
                            {
                                "id": "bad",
                                "url": "https://example.com/not-supported",
                                "status": PENDING,
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            with self.assertRaises(QueueStoreError):
                QueueStore(path).load()

    def test_corrupt_queue_is_backed_up_before_recovery(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "queue.json"
            path.write_bytes(b"\xff\xfeinvalid")
            store = QueueStore(path)
            with self.assertRaises(QueueStoreError):
                store.load()

            backup_path = store.backup_corrupt()
            self.assertFalse(path.exists())
            self.assertEqual(backup_path.read_bytes(), b"\xff\xfeinvalid")


if __name__ == "__main__":
    unittest.main()
