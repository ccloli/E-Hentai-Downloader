from __future__ import annotations

import queue
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from desktop_gui.app import DownloaderApp, _downloader_class_for_url
from desktop_gui.downloader import (
    CancelledError,
    DownloadOptions,
    DownloadSummary,
    EHentaiDownloader,
    GameBusDownloader,
    HuangGuoDownloader,
    ProgressEvent,
)
from desktop_gui.queue_model import COMPLETED, FAILED, PENDING, DownloadQueue
from desktop_gui.x_downloader import XVideoDownloader


URL_ONE = "https://e-hentai.org/g/123/abcdef1234/"
URL_TWO = "https://e-hentai.org/g/456/0123456789/"


def make_app() -> DownloaderApp:
    app = DownloaderApp.__new__(DownloaderApp)
    app.events = queue.Queue()
    app.download_queue = DownloadQueue()
    app.downloader = None
    app.closing = False
    return app


class QueueRunnerTests(unittest.TestCase):
    def test_selects_downloader_for_each_supported_site(self) -> None:
        self.assertIs(
            _downloader_class_for_url(
                "https://x.com/0xCodila/status/2098182800482390216/video/1"
            ),
            XVideoDownloader,
        )
        self.assertIs(_downloader_class_for_url(URL_ONE), EHentaiDownloader)
        self.assertIs(
            _downloader_class_for_url("https://gamebus001.com/comic/1186"),
            GameBusDownloader,
        )
        self.assertIs(
            _downloader_class_for_url("https://huangguoai.com/video/117/"),
            HuangGuoDownloader,
        )
        self.assertIs(
            _downloader_class_for_url("https://huangguoai.com/video/117/ep-5/"),
            HuangGuoDownloader,
        )

    def test_read_options_includes_webp_conversion(self) -> None:
        app = make_app()
        app.output_var = Mock()
        app.cookies_var = Mock()
        app.workers_var = Mock()
        app.collection_limit_var = Mock()
        app.cbz_var = Mock()
        app.fallback_var = Mock()
        app.convert_jpeg_var = Mock()
        app.video_mp4_var = Mock()
        app.cookies_var.get.return_value = ""
        app.workers_var.get.return_value = 2
        app.collection_limit_var.get.return_value = "0"
        app.cbz_var.get.return_value = True
        app.fallback_var.get.return_value = True
        app.convert_jpeg_var.get.return_value = True
        app.video_mp4_var.get.return_value = True

        with tempfile.TemporaryDirectory() as temp_dir:
            app.output_var.get.return_value = temp_dir
            options = app._read_options()

        self.assertTrue(options.convert_webp_to_jpeg)
        self.assertTrue(options.video_remux_to_mp4)

    def test_processes_link_added_while_queue_is_running(self) -> None:
        app = make_app()
        app.download_queue.add([URL_ONE])
        processed: list[str] = []

        class FakeDownloader:
            def __init__(self, **kwargs: object) -> None:
                pass

            def run(self, urls: list[str]) -> DownloadSummary:
                processed.append(urls[0])
                if len(processed) == 1:
                    app.download_queue.add([URL_TWO])
                return DownloadSummary(
                    galleries_total=1,
                    galleries_completed=1,
                    files_downloaded=2,
                )

        with tempfile.TemporaryDirectory() as temp_dir:
            options = DownloadOptions(output_dir=Path(temp_dir))
            with patch("desktop_gui.app.EHentaiDownloader", FakeDownloader):
                app._run_queue(options, threading.Event())

        self.assertEqual(processed, [URL_ONE, URL_TWO])
        self.assertEqual(
            [item.status for item in app.download_queue.snapshot()],
            [COMPLETED, COMPLETED],
        )
        finish_event = list(app.events.queue)[-1]
        self.assertEqual(finish_event.kind, "queue_worker_finished")
        self.assertEqual(finish_event.detail, "empty")

    def test_cancelled_job_returns_to_pending_queue(self) -> None:
        app = make_app()
        (item,) = app.download_queue.add([URL_ONE])
        stop_event = threading.Event()

        class CancellingDownloader:
            def __init__(self, **kwargs: object) -> None:
                pass

            def run(self, urls: list[str]) -> DownloadSummary:
                stop_event.set()
                raise CancelledError("stopped")

        with tempfile.TemporaryDirectory() as temp_dir:
            options = DownloadOptions(output_dir=Path(temp_dir))
            with patch(
                "desktop_gui.app.EHentaiDownloader",
                CancellingDownloader,
            ):
                app._run_queue(options, stop_event)

        restored = app.download_queue.snapshot()[0]
        self.assertEqual(restored.id, item.id)
        self.assertEqual(restored.status, PENDING)
        self.assertIn("等待继续", restored.message)
        finish_event = list(app.events.queue)[-1]
        self.assertEqual(finish_event.detail, "stopped")

    def test_constructor_failure_marks_job_failed(self) -> None:
        app = make_app()
        app.download_queue.add([URL_ONE])

        class FailingDownloader:
            def __init__(self, **kwargs: object) -> None:
                raise ValueError("bad cookie file")

        with tempfile.TemporaryDirectory() as temp_dir:
            options = DownloadOptions(output_dir=Path(temp_dir))
            with patch("desktop_gui.app.EHentaiDownloader", FailingDownloader):
                app._run_queue(options, threading.Event())

        item = app.download_queue.snapshot()[0]
        self.assertEqual(item.status, FAILED)
        self.assertIn("bad cookie", item.message)

    def test_stop_during_constructor_failure_returns_job_to_pending(self) -> None:
        app = make_app()
        app.download_queue.add([URL_ONE])
        stop_event = threading.Event()

        class FailingDownloader:
            def __init__(self, **kwargs: object) -> None:
                stop_event.set()
                raise ValueError("closed while stopping")

        with tempfile.TemporaryDirectory() as temp_dir:
            options = DownloadOptions(output_dir=Path(temp_dir))
            with patch("desktop_gui.app.EHentaiDownloader", FailingDownloader):
                app._run_queue(options, stop_event)

        item = app.download_queue.snapshot()[0]
        self.assertEqual(item.status, PENDING)
        self.assertIn("等待继续", item.message)

    def test_stop_request_suppresses_empty_queue_restart(self) -> None:
        app = make_app()
        app.download_queue.add([URL_ONE])
        app.queue_running = True
        app.queue_stop_event = threading.Event()
        app.queue_stop_event.set()
        app.gallery_var = Mock()
        app.status_var = Mock()
        app._persist_and_refresh_queue = Mock()
        app._set_running_state = Mock()
        app._append_log = Mock()
        app._start_queue = Mock()

        app._handle_event(ProgressEvent("queue_worker_finished", detail="empty"))

        app._start_queue.assert_not_called()
        app.gallery_var.set.assert_called_with("队列已停止")

    def test_close_aborts_when_queue_cannot_be_saved(self) -> None:
        app = make_app()
        app.queue_running = False
        app.root = Mock()
        app.instance_lock = Mock()
        app._persist_queue = Mock(return_value="disk full")

        with patch("desktop_gui.app.messagebox.showerror") as showerror:
            app._on_close()

        showerror.assert_called_once()
        app.instance_lock.close.assert_not_called()
        app.root.destroy.assert_not_called()


if __name__ == "__main__":
    unittest.main()
