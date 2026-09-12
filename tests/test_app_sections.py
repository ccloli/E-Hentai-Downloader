from __future__ import annotations

import json
import tempfile
import tkinter as tk
import unittest
from pathlib import Path
from unittest.mock import patch

from desktop_gui.app import APP_NAME, DownloaderApp, _queue_path, _settings_path
from desktop_gui.downloader import ProgressEvent
from desktop_gui.queue_model import (
    COMPLETED,
    DownloadQueue,
    InstanceLockError,
    QueueStore,
    SingleInstanceLock,
)


URL = "https://x.com/i/status/2098182800482390216/video/1"


class BrandingSettingsTests(unittest.TestCase):
    def test_new_installation_uses_comic_state_directory(self) -> None:
        with tempfile.TemporaryDirectory() as temp, patch.dict(
            "os.environ", {"APPDATA": temp}
        ):
            self.assertEqual(
                _settings_path(), Path(temp) / "Comic" / "gui-settings.json"
            )
            self.assertEqual(
                _queue_path(), Path(temp) / "Comic" / "download-queue.json"
            )

    def test_legacy_settings_queue_and_lock_are_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as temp, patch.dict(
            "os.environ", {"APPDATA": temp}
        ):
            legacy = Path(temp) / "E-Hentai-Downloader"
            legacy.mkdir()
            settings = {"output_dir": str(Path(temp) / "existing-downloads")}
            (legacy / "gui-settings.json").write_text(
                json.dumps(settings), encoding="utf-8"
            )
            queue = DownloadQueue()
            queue.add([URL])
            QueueStore(legacy / "download-queue.json").save(queue)
            self.assertEqual(_settings_path().parent, legacy)
            self.assertEqual(
                DownloaderApp.__new__(DownloaderApp)._load_settings(), settings
            )
            self.assertEqual(QueueStore(_queue_path()).load().snapshot()[0].url, URL)
            lock = SingleInstanceLock(legacy / "gui.lock")
            try:
                with self.assertRaises(InstanceLockError):
                    SingleInstanceLock(_settings_path().with_name("gui.lock"))
            finally:
                lock.close()


class CollapsibleAppTests(unittest.TestCase):
    def setUp(self) -> None:
        try:
            self.root = tk.Tk()
        except tk.TclError as exc:
            self.skipTest(f"Tk display unavailable: {exc}")
        self.addCleanup(self.root.destroy)
        self.root.withdraw()
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        settings = self.directory / "gui-settings.json"
        settings.write_text(
            json.dumps({"output_dir": str(self.directory / "output")}),
            encoding="utf-8",
        )
        patcher = patch("desktop_gui.app._settings_path", return_value=settings)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.app = DownloaderApp(self.root)
        self.addCleanup(self.app.instance_lock.close)
        self.sections = (
            self.app.queue_section,
            self.app.destination_section,
            self.app.options_section,
        )
        self.root.update_idletasks()

    def test_each_section_collapses_and_releases_height(self) -> None:
        self.assertIn("Comic", self.root.title())
        self.assertEqual(self.root.title(), APP_NAME)
        for section in self.sections:
            with self.subTest(section=section.title):
                self.assertTrue(section.expanded)
                self.assertEqual(section.body.winfo_manager(), "grid")
                expanded_height = section.winfo_reqheight()
                section.header.invoke()
                self.root.update_idletasks()
                self.assertFalse(section.expanded)
                self.assertEqual(section.body.winfo_manager(), "")
                self.assertLess(section.winfo_reqheight(), expanded_height)
                self.assertIn("展开", section.header.cget("text"))
                self.assertTrue(section.header.bind("<Return>"))
                section._on_return(tk.Event())
                self.root.update_idletasks()
                self.assertTrue(section.expanded)
                self.assertEqual(section.body.winfo_manager(), "grid")
                self.assertEqual(section.winfo_reqheight(), expanded_height)

    def test_hidden_panels_preserve_queue_selection_options_and_updates(self) -> None:
        (item,) = self.app.download_queue.add([URL])
        self.app._refresh_queue()
        self.app.queue_tree.selection_set(item.id)
        self.app.convert_jpeg_var.set(True)
        initial_options = self.app._read_options()
        self.app.queue_running = True
        self.app._set_running_state(True)
        for section in self.sections:
            section.header.invoke()
            self.assertFalse(section.header.instate(["disabled"]))
        self.assertEqual(self.app._read_options(), initial_options)
        self.assertEqual(self.app.queue_tree.selection(), (item.id,))
        self.assertFalse(self.app.stop_button.instate(["disabled"]))
        self.app.download_queue.set_status(item.id, COMPLETED, "saved")
        self.app._handle_event(ProgressEvent(
            "queue_job_changed", "saved", detail=COMPLETED, job_id=item.id,
        ))
        self.app._handle_event(ProgressEvent(
            "gallery_progress", current=50, total=100, unit="%",
        ))
        self.assertEqual(self.app.progress["value"], 50)
        for section in self.sections:
            self.assertFalse(section.expanded)
            section.header.invoke()
        self.assertEqual(self.app.queue_tree.selection(), (item.id,))
        self.assertEqual(
            self.app.queue_tree.item(item.id, "values")[0], "已完成"
        )
        self.assertTrue(self.app.output_entry.instate(["disabled"]))
        self.assertTrue(self.app.convert_jpeg_input.instate(["disabled"]))
        self.assertEqual(self.app._read_options(), initial_options)
        persisted = QueueStore(_queue_path()).load().snapshot()
        self.assertEqual(persisted[0].status, COMPLETED)
        self.app.queue_running = False
        self.app._set_running_state(False)

    def test_fresh_default_output_is_comic(self) -> None:
        (self.directory / "gui-settings.json").unlink()
        # Exercise the initialization default without touching real user folders.
        self.app.instance_lock.close()
        with patch("desktop_gui.app.Path.home", return_value=self.directory):
            second = DownloaderApp(self.root)
        self.addCleanup(second.instance_lock.close)
        self.assertEqual(
            Path(second.output_var.get()), self.directory / "Downloads" / "Comic"
        )


if __name__ == "__main__":
    unittest.main()
