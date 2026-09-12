from __future__ import annotations

import copy
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

from yt_dlp.utils import DownloadError

from desktop_gui.downloader import (
    CancelledError,
    DownloadOptions,
    InvalidUrlError,
    is_direct_download_url,
    parse_input_urls,
    validate_input_url,
)
from desktop_gui.output_layout import source_folder_name
from desktop_gui.queue_model import DownloadQueue
from desktop_gui.x_downloader import XVideoDownloader


STATUS = "2098182800482390216"
URL = f"https://x.com/0xCodila/status/{STATUS}/video/1"
CANONICAL = f"https://x.com/i/status/{STATUS}/video/1"


class XUrlTests(unittest.TestCase):
    def test_normalizes_aliases_tracking_and_video_selection(self) -> None:
        for host in ("x.com", "www.x.com", "twitter.com", "mobile.twitter.com"):
            with self.subTest(host=host):
                self.assertEqual(
                    validate_input_url(
                        f"http://{host}/user/status/{STATUS}/video/1?s=20#fragment"
                    ),
                    CANONICAL,
                )
        self.assertEqual(
            validate_input_url(f"https://twitter.com/i/web/status/{STATUS}"),
            f"https://x.com/i/status/{STATUS}",
        )
        self.assertTrue(is_direct_download_url(URL))
        self.assertEqual(source_folder_name(URL), f"x-status-{STATUS}")

    def test_rejects_non_status_and_untrusted_urls(self) -> None:
        for url in (
            "https://x.com/user",
            "https://x.com/search?q=video",
            "https://x.com/i/spaces/123",
            "https://x.com/user/status/0",
            "https://x.com/user/status/123/video/0",
            "https://x.com/user/status/123/photo/1",
            "https://x.com/user/status/123/video/1/more",
            "https://x.com.evil.test/user/status/123",
            "https://evil.x.com/user/status/123",
            "https://user:password@x.com/user/status/123",
            "https://x.com:443/user/status/123",
            "https://x.com:invalid/user/status/123",
        ):
            with self.subTest(url=url), self.assertRaises(InvalidUrlError):
                validate_input_url(url)

    def test_queue_deduplicates_and_restores_x_links(self) -> None:
        urls = parse_input_urls(
            f"{URL}\nhttps://twitter.com/someone/status/{STATUS}/video/1?s=20\n"
            f"https://x.com/user/status/{STATUS}\n"
            f"https://x.com/user/status/{STATUS}/video/2"
        )
        self.assertEqual(len(urls), 3)
        queue = DownloadQueue()
        queue.add(urls)
        restored = DownloadQueue.from_payload(queue.to_payload())
        self.assertEqual([item.url for item in restored.snapshot()], urls)


class XDownloadTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.payload = b"\x00\x00\x00\x18ftypmp42" + b"test-video-data" * 2000
        cls.requests: list[str | None] = []

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self) -> None:
                if self.path.startswith("/missing"):
                    self.send_error(404)
                    return
                if self.path == "/playlist.m3u8":
                    playlist = (
                        b"#EXTM3U\n#EXT-X-TARGETDURATION:1\n"
                        b"#EXTINF:1,\n/video.ts\n"
                        b"#EXTINF:1,\n/missing.ts\n#EXT-X-ENDLIST\n"
                    )
                    self.send_response(200)
                    self.send_header("Content-Type", "application/vnd.apple.mpegurl")
                    self.send_header("Content-Length", str(len(playlist)))
                    self.end_headers()
                    self.wfile.write(playlist)
                    return
                range_header = self.headers.get("Range")
                cls.requests.append(range_header)
                start = int(range_header.partition("=")[2].partition("-")[0]) if range_header else 0
                payload = cls.payload[start:]
                self.send_response(206 if range_header else 200)
                self.send_header("Content-Type", "video/mp4")
                self.send_header("Content-Length", str(len(payload)))
                if range_header:
                    self.send_header(
                        "Content-Range",
                        f"bytes {start}-{len(cls.payload) - 1}/{len(cls.payload)}",
                    )
                self.end_headers()
                self.wfile.write(payload)

            def log_message(self, format: str, *args: object) -> None:
                pass

        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.server_thread = threading.Thread(target=cls.server.serve_forever)
        cls.server_thread.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.server_thread.join()

    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "100% output"
        self.options = DownloadOptions(
            output_dir=self.root, retries=0, request_delay=0
        )
        self.events = []
        self.requests.clear()
        self.info = {
            "id": "987654",
            "title": "Graph engineering",
            "extractor": "twitter",
            "extractor_key": "Twitter",
            "formats": [{
                "format_id": "http",
                "url": f"http://127.0.0.1:{self.server.server_port}/video.mp4",
                "ext": "mp4",
            }],
        }

    def run_download(self, info=None):
        with patch(
            "yt_dlp.extractor.twitter.TwitterIE._real_extract",
            return_value=copy.deepcopy(self.info if info is None else info),
        ):
            return XVideoDownloader(self.options, self.events.append).run([URL])

    def test_real_download_saves_under_video_and_skips_complete_file(self) -> None:
        summary = self.run_download()
        self.assertEqual(summary.galleries_completed, 1)
        self.assertEqual(summary.files_downloaded, 1)
        (video,) = self.root.rglob("*.mp4")
        self.assertEqual(video.read_bytes(), self.payload)
        self.assertEqual(
            video.relative_to(self.root).parts,
            ("VIDEO", "Graph engineering", f"x-{STATUS}", "x-987654.mp4"),
        )
        self.assertFalse(list(self.root.rglob("*.cbz")))
        self.assertTrue(any(event.kind == "gallery_progress" for event in self.events))
        self.requests.clear()
        summary = self.run_download()
        self.assertEqual(summary.files_skipped, 1)
        self.assertEqual(summary.files_downloaded, 0)
        self.assertEqual(self.requests, [])

    def test_resumes_partial_download(self) -> None:
        path = self.root / "VIDEO" / "Graph engineering" / f"x-{STATUS}"
        path.mkdir(parents=True)
        (path / "x-987654.mp4.part").write_bytes(self.payload[:1024])
        summary = self.run_download()
        self.assertEqual(summary.files_downloaded, 1)
        self.assertIn("bytes=1024-", self.requests)
        self.assertEqual((path / "x-987654.mp4").read_bytes(), self.payload)
        self.assertFalse((path / "x-987654.mp4.part").exists())

    def test_empty_final_file_is_redownloaded(self) -> None:
        path = self.root / "VIDEO" / "Graph engineering" / f"x-{STATUS}"
        path.mkdir(parents=True)
        (path / "x-987654.mp4").touch()
        summary = self.run_download()
        self.assertEqual(summary.files_downloaded, 1)
        self.assertEqual(summary.files_skipped, 0)
        self.assertEqual((path / "x-987654.mp4").read_bytes(), self.payload)

    def test_real_extractor_respects_video_number_and_reuses_status_folder(self) -> None:
        status = {
            "full_text": "Graph &amp; Loop",
            "extended_entities": {"media": [
                {
                    "id": index, "id_str": str(index), "type": "video",
                    "video_info": {"variants": [{
                        "url": self.info["formats"][0]["url"],
                        "content_type": "video/mp4", "bitrate": 1000,
                    }]},
                }
                for index in (987654, 987655)
            ]},
        }
        with patch(
            "yt_dlp.extractor.twitter.TwitterIE._extract_status",
            return_value=status,
        ):
            summary = XVideoDownloader(self.options).run([
                f"https://x.com/user/status/{STATUS}/video/2"
            ])
            self.assertEqual(summary.files_downloaded, 1)
            (video,) = self.root.rglob("*.mp4")
            self.assertEqual(video.name, "x-987655.mp4")
            self.assertEqual(video.parent.parent.name, "Graph & Loop")
            summary = XVideoDownloader(self.options).run([
                f"https://x.com/user/status/{STATUS}"
            ])
        self.assertEqual(summary.files_downloaded, 1)
        self.assertEqual(summary.files_skipped, 1)
        self.assertEqual(len(list(self.root.rglob("*.mp4"))), 2)

    def test_downloads_all_embedded_videos_with_distinct_media_ids(self) -> None:
        second = {**self.info, "id": "987655"}
        summary = self.run_download({
            "_type": "playlist", "title": "Two videos",
            "entries": [self.info, second],
        })
        self.assertEqual(summary.files_downloaded, 2)
        self.assertEqual(len(list(self.root.rglob("*.mp4"))), 2)

    def test_no_video_and_external_links_are_failures(self) -> None:
        for info in (
            {"id": "123", "title": "No video", "formats": []},
            {"_type": "url", "url": "https://example.com/external"},
            {"_type": "playlist", "entries": []},
            {**self.info, "is_live": True},
        ):
            with self.subTest(info=info):
                summary = self.run_download(info)
                self.assertEqual(summary.galleries_completed, 0)
                self.assertEqual(summary.files_failed, 1)
        self.assertEqual(self.requests, [])
        self.assertTrue(any(event.kind == "error" for event in self.events))

    def test_extractor_failure_has_actionable_error(self) -> None:
        with patch(
            "desktop_gui.x_downloader.YoutubeDL.extract_info",
            side_effect=DownloadError("HTTP 403"),
        ):
            summary = XVideoDownloader(self.options, self.events.append).run([URL])
        self.assertEqual(summary.files_failed, 1)
        self.assertTrue(any(
            "cookies.txt" in event.message and "403" in event.message
            for event in self.events if event.kind == "error"
        ))

    def test_cancel_during_download_is_not_success(self) -> None:
        stop = threading.Event()

        def progress(event):
            self.events.append(event)
            if event.kind == "gallery_progress":
                stop.set()

        with patch(
            "yt_dlp.extractor.twitter.TwitterIE._real_extract",
            return_value=copy.deepcopy(self.info),
        ), self.assertRaises(CancelledError):
            XVideoDownloader(self.options, progress, stop).run([URL])
        self.assertTrue(any(event.kind == "cancelled" for event in self.events))
        self.assertFalse(any(event.kind == "gallery_done" for event in self.events))

    def test_cookie_export_is_read_only_and_options_preserve_failures(self) -> None:
        cookie_path = Path(self.temp.name) / "cookies.txt"
        contents = (
            "# Netscape HTTP Cookie File\n"
            ".x.com\tTRUE\t/\tTRUE\t2147483647\tauth_token\ttest-token\n"
        )
        cookie_path.write_text(contents, encoding="utf-8")
        options = DownloadOptions(output_dir=self.root, cookies_file=cookie_path)
        downloader = XVideoDownloader(options)
        self.addCleanup(downloader.cancel)
        with downloader._youtube_dl() as ydl:
            self.assertEqual(
                [(cookie.name, cookie.value) for cookie in ydl.cookiejar],
                [("auth_token", "test-token")],
            )
            self.assertIsNone(ydl.params.get("cookiefile"))
            self.assertFalse(ydl.params["skip_unavailable_fragments"])
            self.assertTrue(ydl.params["noplaylist"])
        self.assertEqual(cookie_path.read_text(encoding="utf-8"), contents)

    def test_missing_download_output_is_not_success(self) -> None:
        with patch("desktop_gui.x_downloader.YoutubeDL.process_ie_result", return_value={}):
            summary = self.run_download()
        self.assertEqual(summary.galleries_completed, 0)
        self.assertEqual(summary.files_failed, 1)

    def test_partial_playlist_failure_preserves_success_counts(self) -> None:
        missing = {
            **self.info, "id": "987655",
            "formats": [{
                **self.info["formats"][0],
                "url": f"http://127.0.0.1:{self.server.server_port}/missing.mp4",
            }],
        }
        summary = self.run_download({
            "_type": "playlist", "title": "Two videos",
            "entries": [self.info, missing],
        })
        self.assertEqual(summary.files_downloaded, 1)
        self.assertEqual(summary.files_failed, 1)
        self.assertEqual(summary.galleries_completed, 0)
        self.assertEqual(len(list(self.root.rglob("*.mp4"))), 1)

    def test_missing_hls_fragment_never_marks_video_complete(self) -> None:
        summary = self.run_download({
            **self.info,
            "formats": [{
                "format_id": "hls", "ext": "mp4", "protocol": "m3u8_native",
                "url": f"http://127.0.0.1:{self.server.server_port}/playlist.m3u8",
            }],
        })
        self.assertEqual(summary.galleries_completed, 0)
        self.assertEqual(summary.files_failed, 1)
        self.assertFalse(list(self.root.rglob("*.mp4")))


if __name__ == "__main__":
    unittest.main()
