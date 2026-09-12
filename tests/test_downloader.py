from __future__ import annotations

import json
import tempfile
import unittest
import zipfile
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image

from desktop_gui.downloader import (
    DownloadOptions,
    DownloaderError,
    ComicDownloader,
    GameBusDownloader,
    GalleryInfo,
    HuangGuoDownloader,
    InvalidUrlError,
    create_session,
    decrypt_hls_segment,
    find_gallery_warning_url,
    parse_collection_page,
    parse_gallery_page,
    parse_gamebus_chapter_list,
    parse_gamebus_chapter_response,
    parse_h_manhua_chapter_page,
    parse_hls_playlist,
    parse_huangguo_video_page,
    parse_image_page,
    parse_input_urls,
    parse_mpv_page,
    safe_name,
)
from desktop_gui.output_layout import (
    cbz_source_directory,
    image_source_directory,
    video_source_directory,
)


def make_webp() -> bytes:
    image = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    try:
        image.paste((0, 0, 0, 255), (8, 8, 24, 24))
        output = BytesIO()
        image.save(output, format="WEBP", lossless=True)
        return output.getvalue()
    finally:
        image.close()


def make_jpeg(color: tuple[int, int, int]) -> bytes:
    image = Image.new("RGB", (16, 16), color)
    try:
        output = BytesIO()
        image.save(output, format="JPEG", quality=90)
        return output.getvalue()
    finally:
        image.close()


HUANGGUO_KEY = bytes(range(16))
HUANGGUO_IV = bytes(range(16, 32))


def encrypt_segment(payload: bytes, key: bytes = HUANGGUO_KEY, iv: bytes = HUANGGUO_IV) -> bytes:
    from Crypto.Cipher import AES

    padding = 16 - (len(payload) % 16)
    padded = payload + bytes([padding]) * padding
    return AES.new(key, AES.MODE_CBC, iv).encrypt(padded)


def huangguo_page(
    video_id: int,
    episode: int,
    title: str,
    playlist_url: str,
    episode_total: int,
) -> str:
    payload = json.dumps(
        {
            "id": str(video_id),
            "ep": episode,
            "title": title,
            "videoSrc": playlist_url,
        },
        ensure_ascii=False,
    )
    anchors = "".join(
        '<a class="hg-web-play__ep" href="{href}" data-ep-id="{number}">{number}</a>'.format(
            href=f"/video/{video_id}/" if number == 1 else f"/video/{video_id}/ep-{number}/",
            number=number,
        )
        for number in range(1, episode_total + 1)
    )
    return (
        f'<html><body><div class="hg-web-play__ep-grid">{anchors}</div>'
        f'<script id="videoInitialData" type="application/json">{payload}</script>'
        "</body></html>"
    )


class FakeResponse:
    def __init__(
        self,
        url: str,
        text: str = "",
        body: bytes = b"",
        headers: dict[str, str] | None = None,
        status: int = 200,
    ) -> None:
        self.url = url
        self.text = text
        self._body = body or text.encode("utf-8")
        self.headers = headers or {}
        self.status_code = status

    @property
    def content(self) -> bytes:
        return self._body

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise requests.HTTPError(
                f"HTTP {self.status_code}",
                response=self,
            )

    def iter_content(self, chunk_size: int = 1) -> list[bytes]:
        return [
            self._body[index : index + chunk_size]
            for index in range(0, len(self._body), chunk_size)
        ]

    def close(self) -> None:
        pass


class FakeSession:
    def __init__(self, routes: dict[str, dict[str, object]]) -> None:
        self.routes = routes

    def get(self, url: str, **kwargs: object) -> FakeResponse:
        route = self.routes.get(url)
        if route is None:
            raise AssertionError(f"Unexpected request: {url}")
        return FakeResponse(url=url, **route)

    def close(self) -> None:
        pass


class ParserTests(unittest.TestCase):
    def test_parse_input_urls_validates_and_deduplicates(self) -> None:
        text = (
            "first https://e-hentai.org/g/123/abcdef1234/\n"
            "https://e-hentai.org/g/123/abcdef1234/\n"
            "https://exhentai.org/?f_search=test"
        )
        self.assertEqual(
            parse_input_urls(text),
            [
                "https://e-hentai.org/g/123/abcdef1234/",
                "https://exhentai.org/?f_search=test",
            ],
        )
        with self.assertRaises(InvalidUrlError):
            parse_input_urls("https://example.com/g/123/abcdef1234/")
        self.assertEqual(
            parse_input_urls("http://e-hentai.org/g/123/abcdef1234/"),
            ["https://e-hentai.org/g/123/abcdef1234/"],
        )
        self.assertEqual(
            parse_input_urls(
                "http://a.h-manhua.org/manga/comic/qingluan/1/?style=paged"
            ),
            ["https://a.h-manhua.org/manga/comic/qingluan/1/"],
        )
        with self.assertRaises(InvalidUrlError):
            parse_input_urls("https://a.h-manhua.org/manga/comic/qingluan/")
        self.assertEqual(
            parse_input_urls(
                "http://www.gamebus001.com/comic/1186/?from=home\n"
                "https://gamebus001.com/chapter/2552#reader"
            ),
            [
                "https://gamebus001.com/comic/1186",
                "https://gamebus001.com/chapter/2552",
            ],
        )
        with self.assertRaises(InvalidUrlError):
            parse_input_urls("https://gamebus001.com/comic")
        with self.assertRaises(InvalidUrlError):
            parse_input_urls("https://image.gamebus001.com/comic/1186")
        self.assertEqual(
            parse_input_urls(
                "http://www.huangguoai.com/video/117?from=home\n"
                "https://huangguoai.com/video/117/ep-5/#play"
            ),
            [
                "https://huangguoai.com/video/117/",
                "https://huangguoai.com/video/117/ep-5/",
            ],
        )
        with self.assertRaises(InvalidUrlError):
            parse_input_urls("https://huangguoai.com/video/")
        with self.assertRaises(InvalidUrlError):
            parse_input_urls("https://huangguoai.com/tag/xiaoyuan/")

    def test_parse_collection_page_finds_galleries_and_next_page(self) -> None:
        html = """
        <a href="/g/123/abcdef1234/"><div class="glink">One</div></a>
        <a href="https://e-hentai.org/g/456/0123456789/">Two</a>
        <a id="unext" href="/?next=456">Next &gt;</a>
        """
        galleries, next_url = parse_collection_page(
            html, "https://e-hentai.org/?f_search=demo"
        )
        self.assertEqual(
            galleries,
            [
                "https://e-hentai.org/g/123/abcdef1234/",
                "https://e-hentai.org/g/456/0123456789/",
            ],
        )
        self.assertEqual(next_url, "https://e-hentai.org/?next=456")

    def test_parse_gallery_and_image_pages_prefers_original(self) -> None:
        gallery_html = """
        <title>Fallback - E-Hentai Galleries</title>
        <h1 id="gn">A Gallery: Title</h1>
        <div id="gdd"><table><tr><td>Length:</td><td>2 pages</td></tr></table></div>
        <table class="ptt"><tr><td><a>1</a></td><td><a>3</a></td></tr></table>
        <div id="gdt">
          <a href="/s/aaaaaaaaaa/123-1"><div></div></a>
          <a href="/s/bbbbbbbbbb/123-2"><div></div></a>
        </div>
        """
        parsed_gallery = parse_gallery_page(
            gallery_html, "https://e-hentai.org/g/123/abcdef1234/"
        )
        self.assertEqual(parsed_gallery.title, "A Gallery: Title")
        self.assertEqual(parsed_gallery.page_count, 3)
        self.assertEqual(parsed_gallery.expected_images, 2)
        self.assertEqual(len(parsed_gallery.page_urls), 2)

        image_html = """
        <div id="i2"><div class="sn"></div><div>source.png :: 2000 x 3000</div></div>
        <div id="i3"><img id="img" src="https://img.example/resized.webp"></div>
        <div id="i6"><a href="/fullimg/123/1/key/source.png">Download original</a></div>
        """
        parsed_image = parse_image_page(
            image_html, "https://e-hentai.org/s/aaaaaaaaaa/123-1"
        )
        self.assertEqual(
            parsed_image.original_url,
            "https://e-hentai.org/fullimg/123/1/key/source.png",
        )
        self.assertEqual(parsed_image.source_name, "source.png")

    def test_parses_h_manhua_chapter_images(self) -> None:
        chapter_url = "https://a.h-manhua.org/manga/comic/qingluan/1/"
        html = """
        <title>青鸾殇 - 1 - H漫画</title>
        <h1>青鸾殇 - 1</h1>
        <div class="reading-content">
          <img class="wp-manga-chapter-img"
               src="data:image/svg+xml;base64,placeholder"
               data-src=" /uploads/001.jpg ">
          <img class="wp-manga-chapter-img"
               data-lazy-src="//cdn.h-manhua.org/images/002.jpg">
          <img class="wp-manga-chapter-img" data-src="/uploads/001.jpg">
        </div>
        """

        parsed = parse_h_manhua_chapter_page(html, chapter_url)

        self.assertEqual(parsed.title, "青鸾殇 - 1")
        self.assertEqual(
            parsed.image_urls,
            (
                "https://a.h-manhua.org/uploads/001.jpg",
                "https://cdn.h-manhua.org/images/002.jpg",
            ),
        )

    def test_parses_gamebus_chapter_list_and_original_images(self) -> None:
        chapter_list = json.dumps(
            {
                "code": 200,
                "message": "OK",
                "data": {
                    "list": [
                        {
                            "id": 2552,
                            "title": "第三卷",
                            "order_index": 3,
                            "is_locked": False,
                            "pages": 2,
                        },
                        {
                            "id": 2550,
                            "title": "第一卷",
                            "order_index": 1,
                            "is_locked": False,
                            "pages": 1,
                        },
                    ],
                    "count": 2,
                },
            }
        )
        chapters = parse_gamebus_chapter_list(chapter_list)
        self.assertEqual(
            [(chapter.chapter_id, chapter.order_index) for chapter in chapters],
            [(2550, 1), (2552, 3)],
        )

        chapter_url = "https://gamebus001.com/chapter/2552"
        chapter_response = json.dumps(
            {
                "code": 200,
                "message": "OK",
                "data": {
                    "chapter": {
                        "id": 2552,
                        "comic": {"id": 1186, "title": "神雕外传"},
                        "title": "第三卷",
                        "order_index": 3,
                        "is_locked": False,
                        "pages": [
                            {
                                "order_index": 2,
                                "image_path": (
                                    "https://image.gamebus001.com/comic/"
                                    "slug/3/2.webp"
                                ),
                            },
                            {
                                "order_index": 1,
                                "image_path": (
                                    "https://image.gamebus001.com/comic/"
                                    "slug/3/1.webp"
                                ),
                            },
                        ],
                    }
                },
            }
        )
        parsed = parse_gamebus_chapter_response(chapter_response, chapter_url)
        self.assertEqual(parsed.comic_id, 1186)
        self.assertEqual(parsed.chapter_id, 2552)
        self.assertEqual(
            parsed.image_urls,
            (
                "https://image.gamebus001.com/comic/slug/3/1.webp",
                "https://image.gamebus001.com/comic/slug/3/2.webp",
            ),
        )

    def test_rejects_incomplete_or_external_gamebus_image_lists(self) -> None:
        chapter_url = "https://gamebus001.com/chapter/2552"

        def payload(pages: list[dict[str, object]]) -> str:
            return json.dumps(
                {
                    "code": 200,
                    "data": {
                        "chapter": {
                            "id": 2552,
                            "comic": {"id": 1186, "title": "Comic"},
                            "title": "Chapter",
                            "order_index": 1,
                            "is_locked": False,
                            "pages": pages,
                        }
                    },
                }
            )

        with self.assertRaises(DownloaderError):
            parse_gamebus_chapter_response(
                payload(
                    [
                        {
                            "order_index": 2,
                            "image_path": (
                                "https://image.gamebus001.com/comic/slug/1/2.webp"
                            ),
                        }
                    ]
                ),
                chapter_url,
            )
        with self.assertRaises(DownloaderError):
            parse_gamebus_chapter_response(
                payload(
                    [
                        {
                            "order_index": 1,
                            "image_path": "https://example.com/1.webp",
                        }
                    ]
                ),
                chapter_url,
            )

    def test_parse_mpv_page_and_safe_name(self) -> None:
        html = 'var imagelist = [{"k":"aaaaaaaaaa"},{"k":"bbbbbbbbbb"}];'
        self.assertEqual(
            parse_mpv_page(
                html,
                "https://e-hentai.org/g/123/abcdef1234/",
                "123",
            ),
            (
                "https://e-hentai.org/s/aaaaaaaaaa/123-1",
                "https://e-hentai.org/s/bbbbbbbbbb/123-2",
            ),
        )
        self.assertEqual(safe_name('CON: "bad"?'), 'CON_ _bad__')

    def test_finds_content_warning_bypass(self) -> None:
        gallery_url = "https://e-hentai.org/g/123/abcdef1234/"
        html = '<a href="/g/123/abcdef1234/?nw=session">View Gallery</a>'
        self.assertEqual(
            find_gallery_warning_url(html, gallery_url),
            gallery_url + "?nw=session",
        )

    def test_loads_netscape_cookie_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            cookie_path = Path(temp_dir) / "cookies.txt"
            cookie_path.write_text(
                "# Netscape HTTP Cookie File\n"
                ".e-hentai.org\tTRUE\t/\tTRUE\t2147483647\t"
                "ipb_member_id\t12345\n",
                encoding="utf-8",
            )
            session = create_session(
                DownloadOptions(
                    output_dir=Path(temp_dir),
                    cookies_file=cookie_path,
                )
            )
            self.assertEqual(session.cookies.get("ipb_member_id"), "12345")
            session.close()

    def test_parses_huangguo_video_page_and_episode_list(self) -> None:
        page_url = "https://huangguoai.com/video/117/"
        playlist = "https://cdn.example.com/videos/117-1.m3u8?auth_key=abc"
        parsed = parse_huangguo_video_page(
            huangguo_page(117, 1, "高三爱情故事", playlist, 3),
            page_url,
        )

        self.assertEqual(parsed.video_id, 117)
        self.assertEqual(parsed.episode, 1)
        self.assertEqual(parsed.series_title, "高三爱情故事")
        self.assertEqual(parsed.playlist_url, playlist)
        self.assertEqual(
            [episode.url for episode in parsed.episodes],
            [
                "https://huangguoai.com/video/117/",
                "https://huangguoai.com/video/117/ep-2/",
                "https://huangguoai.com/video/117/ep-3/",
            ],
        )

    def test_rejects_huangguo_page_for_another_episode(self) -> None:
        with self.assertRaises(DownloaderError):
            parse_huangguo_video_page(
                huangguo_page(117, 2, "高三爱情故事", "https://cdn.example.com/a.m3u8", 3),
                "https://huangguoai.com/video/117/",
            )

    def test_parses_encrypted_hls_playlist(self) -> None:
        playlist_url = "https://cdn.example.com/videos/117-1.m3u8"
        text = (
            "#EXTM3U\n"
            "#EXT-X-VERSION:3\n"
            '#EXT-X-KEY:METHOD=AES-128,URI="https://key.example.com/crypt.key",'
            "IV=0x000102030405060708090a0b0c0d0e0f\n"
            "#EXT-X-MEDIA-SEQUENCE:0\n"
            "#EXTINF:5.200,\n"
            "seg0.ts\n"
            "#EXTINF:4.800,\n"
            "https://other.example.com/seg1.ts\n"
            "#EXT-X-ENDLIST\n"
        )
        parsed = parse_hls_playlist(text, playlist_url)

        self.assertEqual(parsed.variant_urls, ())
        self.assertEqual(
            [segment.url for segment in parsed.segments],
            [
                "https://cdn.example.com/videos/seg0.ts",
                "https://other.example.com/seg1.ts",
            ],
        )
        self.assertEqual([segment.sequence for segment in parsed.segments], [0, 1])
        for segment in parsed.segments:
            self.assertEqual(segment.key_url, "https://key.example.com/crypt.key")
            self.assertEqual(segment.key_iv, bytes(range(16)))

    def test_hls_master_playlist_reports_best_variant_first(self) -> None:
        text = (
            "#EXTM3U\n"
            "#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n"
            "low.m3u8\n"
            "#EXT-X-STREAM-INF:BANDWIDTH=2400000,RESOLUTION=1280x720\n"
            "high.m3u8\n"
        )
        parsed = parse_hls_playlist(text, "https://cdn.example.com/videos/master.m3u8")

        self.assertEqual(parsed.segments, ())
        self.assertEqual(
            parsed.variant_urls,
            (
                "https://cdn.example.com/videos/high.m3u8",
                "https://cdn.example.com/videos/low.m3u8",
            ),
        )

    def test_rejects_unsupported_hls_encryption(self) -> None:
        text = (
            "#EXTM3U\n"
            '#EXT-X-KEY:METHOD=SAMPLE-AES,URI="https://key.example.com/k"\n'
            "#EXTINF:5,\n"
            "seg0.ts\n"
        )
        with self.assertRaises(DownloaderError):
            parse_hls_playlist(text, "https://cdn.example.com/a.m3u8")

    def test_decrypts_hls_segment_round_trip(self) -> None:
        payload = b"\x47\x40\x11\x10" + b"payload" * 9
        self.assertEqual(
            decrypt_hls_segment(
                encrypt_segment(payload),
                HUANGGUO_KEY,
                HUANGGUO_IV,
            ),
            payload,
        )


class EndToEndTests(unittest.TestCase):
    def test_downloads_original_images_and_creates_cbz(self) -> None:
        gallery_url = "https://e-hentai.org/g/123/abcdef1234/"
        page_one = "https://e-hentai.org/s/aaaaaaaaaa/123-1"
        page_two = "https://e-hentai.org/s/bbbbbbbbbb/123-2"
        image_one = "https://e-hentai.org/fullimg/123/1/key/one.png"
        image_two = "https://e-hentai.org/fullimg/123/2/key/two.jpg"
        routes: dict[str, dict[str, object]] = {
            gallery_url: {
                "text": f"""
                    <h1 id="gn">Test: Gallery</h1>
                    <div id="gdd"><table><tr><td>Length:</td><td>2 pages</td></tr></table></div>
                    <table class="ptt"><tr><td><a>1</a></td></tr></table>
                    <div id="gdt">
                      <a href="{page_one}"></a>
                      <a href="{page_two}"></a>
                    </div>
                """,
                "headers": {"Content-Type": "text/html"},
            },
            page_one: {
                "text": f"""
                    <div id="i2"><div></div><div>one.png :: 100 x 100</div></div>
                    <img id="img" src="https://img.example/one.webp">
                    <a href="{image_one}">Download original</a>
                """,
                "headers": {"Content-Type": "text/html"},
            },
            page_two: {
                "text": f"""
                    <div id="i2"><div></div><div>two.jpg :: 100 x 100</div></div>
                    <img id="img" src="https://img.example/two.webp">
                    <a href="{image_two}">Download original</a>
                """,
                "headers": {"Content-Type": "text/html"},
            },
            image_one: {
                "body": b"PNG DATA",
                "headers": {"Content-Type": "image/png"},
            },
            image_two: {
                "body": b"JPEG DATA",
                "headers": {"Content-Type": "image/jpeg"},
            },
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            options = DownloadOptions(
                output_dir=output,
                workers=2,
                request_delay=0,
                create_cbz=True,
            )
            downloader = ComicDownloader(
                options,
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([gallery_url])

            self.assertEqual(summary.galleries_completed, 1)
            self.assertEqual(summary.files_downloaded, 2)
            gallery_directory = (
                image_source_directory(output, gallery_url, "Test: Gallery")
                / "123 - Test_ Gallery"
            )
            self.assertEqual(
                (gallery_directory / "001 - one.png").read_bytes(),
                b"PNG DATA",
            )
            self.assertEqual(
                (gallery_directory / "002 - two.jpg").read_bytes(),
                b"JPEG DATA",
            )

            cbz_path = (
                cbz_source_directory(output, gallery_url, "Test: Gallery")
                / "123 - Test_ Gallery.cbz"
            )
            with zipfile.ZipFile(cbz_path) as archive:
                self.assertEqual(
                    archive.namelist(),
                    ["001 - one.png", "002 - two.jpg"],
                )

    def test_falls_back_when_original_request_fails(self) -> None:
        gallery_url = "https://e-hentai.org/g/123/abcdef1234/"
        page_url = "https://e-hentai.org/s/aaaaaaaaaa/123-1"
        original_url = "https://e-hentai.org/fullimg/123/1/key/one.png"
        resized_url = "https://img.example/resized.webp"
        routes: dict[str, dict[str, object]] = {
            gallery_url: {
                "text": f"""
                    <h1 id="gn">Fallback Gallery</h1>
                    <div id="gdd"><table><tr><td>Length:</td><td>1 page</td></tr></table></div>
                    <div id="gdt"><a href="{page_url}"></a></div>
                """,
            },
            page_url: {
                "text": f"""
                    <div id="i2"><div></div><div>one.png :: 100 x 100</div></div>
                    <img id="img" src="{resized_url}">
                    <a href="{original_url}">Download original</a>
                """,
            },
            original_url: {"text": "Login required", "status": 403},
            resized_url: {
                "body": b"WEBP DATA",
                "headers": {"Content-Type": "image/webp"},
            },
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            downloader = ComicDownloader(
                DownloadOptions(
                    output_dir=output,
                    workers=1,
                    request_delay=0,
                    create_cbz=False,
                ),
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([gallery_url])
            self.assertEqual(summary.galleries_completed, 1)
            self.assertEqual(summary.files_fallback, 1)
            self.assertEqual(
                (
                    image_source_directory(output, gallery_url, "Fallback Gallery")
                    / "123 - Fallback Gallery"
                    / "001 - resized.webp"
                ).read_bytes(),
                b"WEBP DATA",
            )

    def test_converts_fallback_webp_to_jpeg_and_packages_it(self) -> None:
        gallery_url = "https://e-hentai.org/g/123/abcdef1234/"
        page_url = "https://e-hentai.org/s/aaaaaaaaaa/123-1"
        resized_url = "https://img.example/resized.webp"
        routes: dict[str, dict[str, object]] = {
            gallery_url: {
                "text": f"""
                    <h1 id="gn">JPEG Gallery</h1>
                    <div id="gdd"><table><tr><td>Length:</td><td>1 page</td></tr></table></div>
                    <div id="gdt"><a href="{page_url}"></a></div>
                """,
            },
            page_url: {
                "text": f'<img id="img" src="{resized_url}">',
            },
            resized_url: {
                "body": make_webp(),
                "headers": {"Content-Type": "image/webp"},
            },
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            downloader = ComicDownloader(
                DownloadOptions(
                    output_dir=output,
                    workers=1,
                    request_delay=0,
                    create_cbz=True,
                    convert_webp_to_jpeg=True,
                ),
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([gallery_url])

            gallery_directory = (
                image_source_directory(output, gallery_url, "JPEG Gallery")
                / "123 - JPEG Gallery"
            )
            jpeg_path = gallery_directory / "001 - resized.jpg"
            self.assertTrue(jpeg_path.is_file())
            self.assertFalse((gallery_directory / "001 - resized.webp").exists())
            with Image.open(jpeg_path) as image:
                self.assertEqual(image.format, "JPEG")
                self.assertEqual(image.mode, "RGB")
                self.assertGreater(min(image.getpixel((0, 0))), 245)
                self.assertLess(max(image.getpixel((16, 16))), 10)
            self.assertEqual(summary.files_downloaded, 1)
            self.assertEqual(summary.files_fallback, 1)

            cbz_path = (
                cbz_source_directory(output, gallery_url, "JPEG Gallery")
                / "123 - JPEG Gallery.cbz"
            )
            with zipfile.ZipFile(cbz_path) as archive:
                self.assertEqual(archive.namelist(), ["001 - resized.jpg"])

    def test_converts_existing_webp_when_resuming(self) -> None:
        gallery_url = "https://e-hentai.org/g/123/abcdef1234/"
        page_url = "https://e-hentai.org/s/aaaaaaaaaa/123-1"
        routes: dict[str, dict[str, object]] = {
            gallery_url: {
                "text": f"""
                    <h1 id="gn">Resume Gallery</h1>
                    <div id="gdd"><table><tr><td>Length:</td><td>1 page</td></tr></table></div>
                    <div id="gdt"><a href="{page_url}"></a></div>
                """,
            },
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            gallery_directory = (
                image_source_directory(output, gallery_url, "Resume Gallery")
                / "123 - Resume Gallery"
            )
            gallery_directory.mkdir(parents=True)
            webp_path = gallery_directory / "001 - page.webp"
            webp_path.write_bytes(make_webp())

            downloader = ComicDownloader(
                DownloadOptions(
                    output_dir=output,
                    workers=1,
                    request_delay=0,
                    create_cbz=False,
                    convert_webp_to_jpeg=True,
                ),
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([gallery_url])

            self.assertFalse(webp_path.exists())
            self.assertTrue((gallery_directory / "001 - page.jpg").is_file())
            self.assertEqual(summary.files_downloaded, 0)
            self.assertEqual(summary.files_skipped, 1)

    def test_downloads_h_manhua_chapter_images_and_creates_cbz(self) -> None:
        chapter_url = "https://a.h-manhua.org/manga/comic/qingluan/1/"
        image_one = "https://a.h-manhua.org/uploads/qingluan/001.jpg"
        image_two = "https://a.h-manhua.org/uploads/qingluan/002.jpg"
        image_one_body = make_jpeg((255, 0, 0))
        image_two_body = make_jpeg((0, 0, 255))
        routes: dict[str, dict[str, object]] = {
            chapter_url: {
                "text": f"""
                    <title>青鸾殇 - 1 - H漫画</title>
                    <h1>青鸾殇 - 1</h1>
                    <div class="reading-content">
                      <img class="wp-manga-chapter-img" data-src="{image_one}">
                      <img class="wp-manga-chapter-img" data-src="{image_two}">
                    </div>
                """,
                "headers": {"Content-Type": "text/html; charset=UTF-8"},
            },
            image_one: {
                "body": image_one_body,
                "headers": {"Content-Type": "image/jpeg"},
            },
            image_two: {
                "body": image_two_body,
                "headers": {"Content-Type": "image/jpeg"},
            },
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            downloader = ComicDownloader(
                DownloadOptions(
                    output_dir=output,
                    workers=2,
                    request_delay=0,
                    create_cbz=True,
                    convert_webp_to_jpeg=True,
                ),
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([chapter_url])

            chapter_directory = (
                image_source_directory(output, chapter_url, "青鸾殇 - 1")
                / "hm-qingluan-1 - 青鸾殇 - 1"
            )
            self.assertEqual(
                (chapter_directory / "001 - 001.jpg").read_bytes(),
                image_one_body,
            )
            self.assertEqual(
                (chapter_directory / "002 - 002.jpg").read_bytes(),
                image_two_body,
            )
            self.assertEqual(summary.galleries_completed, 1)
            self.assertEqual(summary.files_downloaded, 2)
            self.assertEqual(summary.files_fallback, 0)

            cbz_path = (
                cbz_source_directory(output, chapter_url, "青鸾殇 - 1")
                / "hm-qingluan-1 - 青鸾殇 - 1.cbz"
            )
            with zipfile.ZipFile(cbz_path) as archive:
                self.assertEqual(
                    archive.namelist(),
                    ["001 - 001.jpg", "002 - 002.jpg"],
                )

    def test_downloads_every_gamebus_chapter_from_original_image_paths(self) -> None:
        comic_url = "https://gamebus001.com/comic/1186"
        chapters_api = (
            "https://gamebus001.com/api/comic/chapters?comicId=1186"
        )
        chapter_one_api = "https://gamebus001.com/api/comic/2550/pages"
        chapter_two_api = "https://gamebus001.com/api/comic/2551/pages"
        image_one = (
            "https://image.gamebus001.com/comic/demo/1/1.webp"
        )
        image_two = (
            "https://image.gamebus001.com/comic/demo/1/2.webp"
        )
        image_three = (
            "https://image.gamebus001.com/comic/demo/2/1.webp"
        )

        def chapter_payload(
            chapter_id: int,
            order_index: int,
            title: str,
            image_urls: list[str],
        ) -> str:
            return json.dumps(
                {
                    "code": 200,
                    "message": "OK",
                    "data": {
                        "chapter": {
                            "id": chapter_id,
                            "comic": {"id": 1186, "title": "Demo Comic"},
                            "title": title,
                            "order_index": order_index,
                            "is_locked": False,
                            "pages": [
                                {
                                    "order_index": index,
                                    "image_path": image_url,
                                }
                                for index, image_url in enumerate(
                                    image_urls,
                                    start=1,
                                )
                            ],
                        }
                    },
                }
            )

        routes: dict[str, dict[str, object]] = {
            chapters_api: {
                "text": json.dumps(
                    {
                        "code": 200,
                        "message": "OK",
                        "data": {
                            "list": [
                                {
                                    "id": 2550,
                                    "title": "First",
                                    "order_index": 1,
                                    "is_locked": False,
                                    "pages": 2,
                                },
                                {
                                    "id": 2551,
                                    "title": "Second",
                                    "order_index": 2,
                                    "is_locked": False,
                                    "pages": 1,
                                },
                            ],
                            "count": 2,
                        },
                    }
                ),
                "headers": {"Content-Type": "application/json"},
            },
            chapter_one_api: {
                "text": chapter_payload(
                    2550,
                    1,
                    "First",
                    [image_one, image_two],
                ),
                "headers": {"Content-Type": "application/json"},
            },
            chapter_two_api: {
                "text": chapter_payload(
                    2551,
                    2,
                    "Second",
                    [image_three],
                ),
                "headers": {"Content-Type": "application/json"},
            },
            image_one: {
                "body": b"ORIGINAL ONE",
                "headers": {"Content-Type": "image/webp"},
            },
            image_two: {
                "body": b"ORIGINAL TWO",
                "headers": {"Content-Type": "image/webp"},
            },
            image_three: {
                "body": b"ORIGINAL THREE",
                "headers": {"Content-Type": "image/webp"},
            },
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            downloader = GameBusDownloader(
                DownloadOptions(
                    output_dir=output,
                    workers=2,
                    request_delay=0,
                    create_cbz=True,
                ),
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([comic_url])

            first_directory = (
                image_source_directory(output, comic_url, "Demo Comic")
                / "gb-1186-0001-2550 - Demo Comic - 001 - First"
            )
            second_directory = (
                image_source_directory(output, comic_url, "Demo Comic")
                / "gb-1186-0002-2551 - Demo Comic - 002 - Second"
            )
            self.assertEqual(
                (first_directory / "001 - 1.webp").read_bytes(),
                b"ORIGINAL ONE",
            )
            self.assertEqual(
                (first_directory / "002 - 2.webp").read_bytes(),
                b"ORIGINAL TWO",
            )
            self.assertEqual(
                (second_directory / "001 - 1.webp").read_bytes(),
                b"ORIGINAL THREE",
            )
            self.assertEqual(summary.galleries_total, 2)
            self.assertEqual(summary.galleries_completed, 2)
            self.assertEqual(summary.files_downloaded, 3)
            self.assertEqual(
                len(
                    list(
                        cbz_source_directory(
                            output,
                            comic_url,
                            "Demo Comic",
                        ).glob("*.cbz")
                    )
                ),
                2,
            )

    def test_gamebus_declared_page_count_blocks_truncated_chapter(self) -> None:
        chapter_url = "https://gamebus001.com/chapter/2550"
        chapter_api = "https://gamebus001.com/api/comic/2550/pages"
        chapters_api = (
            "https://gamebus001.com/api/comic/chapters?comicId=1186"
        )
        image_url = "https://image.gamebus001.com/comic/demo/1/1.webp"
        routes: dict[str, dict[str, object]] = {
            chapter_api: {
                "text": json.dumps(
                    {
                        "code": 200,
                        "data": {
                            "chapter": {
                                "id": 2550,
                                "comic": {"id": 1186, "title": "Demo Comic"},
                                "title": "First",
                                "order_index": 1,
                                "is_locked": False,
                                "pages": [
                                    {
                                        "order_index": 1,
                                        "image_path": image_url,
                                    }
                                ],
                            }
                        },
                    }
                )
            },
            chapters_api: {
                "text": json.dumps(
                    {
                        "code": 200,
                        "data": {
                            "list": [
                                {
                                    "id": 2550,
                                    "title": "First",
                                    "order_index": 1,
                                    "is_locked": False,
                                    "pages": 2,
                                }
                            ],
                            "count": 1,
                        },
                    }
                )
            },
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            downloader = GameBusDownloader(
                DownloadOptions(
                    output_dir=output,
                    request_delay=0,
                    create_cbz=True,
                ),
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([chapter_url])

            self.assertEqual(summary.galleries_completed, 0)
            self.assertEqual(summary.files_downloaded, 0)
            self.assertEqual(summary.files_failed, 1)
            self.assertEqual(list(output.iterdir()), [])

    def test_incomplete_directory_is_not_downloaded(self) -> None:
        gallery_url = "https://e-hentai.org/g/123/abcdef1234/"
        page_url = "https://e-hentai.org/s/aaaaaaaaaa/123-1"
        mpv_url = "https://e-hentai.org/mpv/123/abcdef1234/"
        routes: dict[str, dict[str, object]] = {
            gallery_url: {
                "text": f"""
                    <h1 id="gn">Incomplete</h1>
                    <div id="gdd"><table><tr><td>Length:</td><td>2 pages</td></tr></table></div>
                    <div id="gdt"><a href="{page_url}"></a></div>
                """,
            },
            mpv_url: {"text": "<html>No MPV data</html>"},
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            downloader = ComicDownloader(
                DownloadOptions(
                    output_dir=output,
                    retries=0,
                    request_delay=0,
                    create_cbz=True,
                ),
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([gallery_url])
            self.assertEqual(summary.galleries_completed, 0)
            self.assertEqual(summary.files_failed, 1)
            self.assertFalse(list(output.rglob("*.cbz")))

    def test_reuses_directory_after_gallery_title_change(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            gallery_url = "https://e-hentai.org/g/123/abcdef1234/"
            old_directory = (
                image_source_directory(output, gallery_url)
                / "123 - Old title"
            )
            old_directory.mkdir(parents=True)
            downloader = ComicDownloader(
                DownloadOptions(output_dir=output, request_delay=0),
                session_factory=lambda: FakeSession({}),
            )
            gallery = GalleryInfo(
                url=gallery_url,
                gid="123",
                token="abcdef1234",
                title="New title",
                page_urls=(),
            )
            self.assertEqual(downloader._gallery_directory(gallery), old_directory)
            downloader._close_sessions()

    def test_content_warning_page_is_followed(self) -> None:
        gallery_url = "https://e-hentai.org/g/123/abcdef1234/"
        warning_url = gallery_url + "?nw=session"
        page_url = "https://e-hentai.org/s/aaaaaaaaaa/123-1"
        routes: dict[str, dict[str, object]] = {
            gallery_url: {
                "text": f'<a href="{warning_url}">View Gallery</a>',
            },
            warning_url: {
                "text": f"""
                    <h1 id="gn">Warned Gallery</h1>
                    <div id="gdd"><table><tr><td>Length:</td><td>1 page</td></tr></table></div>
                    <div id="gdt"><a href="{page_url}"></a></div>
                """,
            },
        }
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = ComicDownloader(
                DownloadOptions(output_dir=Path(temp_dir), request_delay=0),
                session_factory=lambda: FakeSession(routes),
            )
            gallery = downloader._load_gallery(gallery_url)
            self.assertEqual(gallery.title, "Warned Gallery")
            self.assertEqual(gallery.page_urls, (page_url,))
            downloader._close_sessions()

    def test_rejects_https_to_http_redirect(self) -> None:
        url = "https://e-hentai.org/g/123/abcdef1234/"
        routes: dict[str, dict[str, object]] = {
            url: {
                "status": 302,
                "headers": {"Location": "http://e-hentai.org/unsafe"},
            }
        }
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = ComicDownloader(
                DownloadOptions(output_dir=Path(temp_dir), request_delay=0),
                session_factory=lambda: FakeSession(routes),
            )
            with self.assertRaises(DownloaderError):
                downloader._get_text(downloader._main_session, url)
            downloader._close_sessions()


class HuangGuoTests(unittest.TestCase):
    series_url = "https://huangguoai.com/video/900/"
    key_url = "https://key.example.com/crypt.key"

    def build_routes(self, episode_total: int = 2) -> dict[str, dict[str, object]]:
        routes: dict[str, dict[str, object]] = {
            self.key_url: {"body": HUANGGUO_KEY},
        }
        for episode in range(1, episode_total + 1):
            page_url = (
                self.series_url
                if episode == 1
                else f"{self.series_url}ep-{episode}/"
            )
            playlist_url = f"https://cdn.example.com/900/{episode}.m3u8?auth=1"
            routes[page_url] = {
                "text": huangguo_page(
                    900,
                    episode,
                    "测试短剧",
                    playlist_url,
                    episode_total,
                ),
                "headers": {"Content-Type": "text/html"},
            }
            segment_lines = []
            for index in range(2):
                segment_url = (
                    f"https://cdn.example.com/900/{episode}-{index}.ts?auth=1"
                )
                segment_lines.append(f"#EXTINF:5.000,\n{segment_url}")
                routes[segment_url] = {
                    "body": encrypt_segment(
                        f"episode{episode}-segment{index}".encode("utf-8")
                    ),
                    "headers": {"Content-Type": "video/mp2t"},
                }
            routes[playlist_url] = {
                "text": (
                    "#EXTM3U\n"
                    "#EXT-X-VERSION:3\n"
                    f'#EXT-X-KEY:METHOD=AES-128,URI="{self.key_url}",'
                    f"IV=0x{HUANGGUO_IV.hex()}\n"
                    "#EXT-X-MEDIA-SEQUENCE:0\n"
                    + "\n".join(segment_lines)
                    + "\n#EXT-X-ENDLIST\n"
                ),
                "headers": {"Content-Type": "application/vnd.apple.mpegurl"},
            }
        return routes

    def test_downloads_every_episode_and_merges_decrypted_segments(self) -> None:
        routes = self.build_routes()
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            downloader = HuangGuoDownloader(
                DownloadOptions(
                    output_dir=output,
                    workers=2,
                    request_delay=0,
                    video_remux_to_mp4=False,
                ),
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([self.series_url])

            self.assertEqual(summary.galleries_total, 2)
            self.assertEqual(summary.galleries_completed, 2)
            self.assertEqual(summary.files_downloaded, 2)
            self.assertEqual(summary.files_failed, 0)

            directory = (
                video_source_directory(output, self.series_url, "测试短剧") / "900 - 测试短剧"
            )
            self.assertEqual(
                (directory / "001 - 测试短剧.ts").read_bytes(),
                b"episode1-segment0episode1-segment1",
            )
            self.assertEqual(
                (directory / "002 - 测试短剧.ts").read_bytes(),
                b"episode2-segment0episode2-segment1",
            )
            self.assertFalse((directory / ".parts").exists())

    def test_episode_link_still_downloads_the_whole_series(self) -> None:
        routes = self.build_routes()
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            downloader = HuangGuoDownloader(
                DownloadOptions(
                    output_dir=output,
                    request_delay=0,
                    video_remux_to_mp4=False,
                ),
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([f"{self.series_url}ep-2/"])

            self.assertEqual(summary.galleries_completed, 2)
            directory = (
                video_source_directory(output, f"{self.series_url}ep-2/", "测试短剧")
                / "900 - 测试短剧"
            )
            self.assertTrue((directory / "001 - 测试短剧.ts").is_file())
            self.assertTrue((directory / "002 - 测试短剧.ts").is_file())

    def test_existing_episode_file_is_skipped(self) -> None:
        routes = self.build_routes(episode_total=1)
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            directory = (
                video_source_directory(output, self.series_url, "测试短剧") / "900 - 测试短剧"
            )
            directory.mkdir(parents=True, exist_ok=True)
            (directory / "001 - 测试短剧.mp4").write_bytes(b"already downloaded")

            downloader = HuangGuoDownloader(
                DownloadOptions(
                    output_dir=output,
                    request_delay=0,
                    video_remux_to_mp4=False,
                ),
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([self.series_url])

            self.assertEqual(summary.files_downloaded, 0)
            self.assertEqual(summary.files_skipped, 1)
            self.assertEqual(
                (directory / "001 - 测试短剧.mp4").read_bytes(),
                b"already downloaded",
            )
            self.assertFalse((directory / "001 - 测试短剧.ts").exists())

    def test_failed_segment_keeps_partial_progress_and_reports_failure(self) -> None:
        routes = self.build_routes(episode_total=1)
        routes["https://cdn.example.com/900/1-1.ts?auth=1"] = {
            "text": "forbidden",
            "status": 403,
        }
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            downloader = HuangGuoDownloader(
                DownloadOptions(
                    output_dir=output,
                    request_delay=0,
                    video_remux_to_mp4=False,
                ),
                session_factory=lambda: FakeSession(routes),
            )
            summary = downloader.run([self.series_url])

            self.assertEqual(summary.galleries_completed, 0)
            self.assertEqual(summary.files_failed, 1)
            directory = (
                video_source_directory(output, self.series_url, "测试短剧") / "900 - 测试短剧"
            )
            self.assertFalse((directory / "001 - 测试短剧.ts").exists())
            self.assertEqual(
                (directory / ".parts" / "001" / "00000.ts").read_bytes(),
                b"episode1-segment0",
            )

    def test_rejects_links_from_other_sites(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = HuangGuoDownloader(
                DownloadOptions(output_dir=Path(temp_dir), request_delay=0),
                session_factory=lambda: FakeSession({}),
            )
            with self.assertRaises(InvalidUrlError):
                downloader._resolve_inputs(["https://e-hentai.org/g/123/abcdef1234/"])
            downloader._close_sessions()


if __name__ == "__main__":
    unittest.main()
