from __future__ import annotations

import http.cookiejar
import json
import mimetypes
import os
import re
import shutil
import subprocess
import threading
import time
import zipfile
from concurrent.futures import FIRST_COMPLETED, Future, ThreadPoolExecutor, wait
from dataclasses import dataclass, field, replace
from email.message import Message
from pathlib import Path
from typing import Callable, Iterable
from urllib.parse import parse_qsl, unquote, urlencode, urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageOps, UnidentifiedImageError
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:  # pragma: no cover - exercised implicitly by the AES-128 code path
    from Crypto.Cipher import AES
except ImportError:  # pragma: no cover - only hit when pycryptodome is missing
    AES = None

from .output_layout import (
    cbz_source_directory,
    image_source_directory,
    video_source_directory,
)


EHENTAI_DOMAINS = ("e-hentai.org", "exhentai.org")
H_MANHUA_DOMAIN = "h-manhua.org"
GAMEBUS_DOMAIN = "gamebus001.com"
GAMEBUS_IMAGE_DOMAIN = "image.gamebus001.com"
GAMEBUS_BASE_URL = f"https://{GAMEBUS_DOMAIN}"
HUANGGUO_DOMAIN = "huangguoai.com"
HUANGGUO_BASE_URL = f"https://{HUANGGUO_DOMAIN}"
SUPPORTED_DOMAINS = (*EHENTAI_DOMAINS, H_MANHUA_DOMAIN)
GALLERY_PATH_RE = re.compile(
    r"^/g/(?P<gid>\d+)/(?P<token>[0-9a-f]{10})(?:/|$)", re.IGNORECASE
)
IMAGE_PATH_RE = re.compile(r"^/s/[0-9a-f]{10}/\d+-\d+(?:/|$)", re.IGNORECASE)
FULL_IMAGE_PATH_RE = re.compile(r"/fullimg(?:\.php|/)", re.IGNORECASE)
H_MANHUA_CHAPTER_PATH_RE = re.compile(
    r"^/manga/comic/(?P<slug>[\w.%~-]+)/(?P<chapter>[\w.%~-]+)/?$",
    re.IGNORECASE,
)
GAMEBUS_COMIC_PATH_RE = re.compile(
    r"^/comic/(?P<comic_id>\d+)/?$",
    re.IGNORECASE,
)
GAMEBUS_CHAPTER_PATH_RE = re.compile(
    r"^/chapter/(?P<chapter_id>\d+)/?$",
    re.IGNORECASE,
)
HUANGGUO_VIDEO_PATH_RE = re.compile(
    r"^/video/(?P<video_id>\d+)(?:/ep-(?P<episode>\d+))?/?$",
    re.IGNORECASE,
)
HUANGGUO_INITIAL_DATA_RE = re.compile(
    r'<script[^>]+id="videoInitialData"[^>]*>(?P<payload>.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)
HLS_ATTRIBUTE_RE = re.compile(r'([A-Za-z0-9-]+)=("[^"]*"|[^,]*)')
INVALID_PATH_CHARS_RE = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
URL_RE = re.compile(r"https?://[^\s<>'\"]+", re.IGNORECASE)
WINDOWS_RESERVED_NAMES = {
    "CON",
    "PRN",
    "AUX",
    "NUL",
    *(f"COM{index}" for index in range(1, 10)),
    *(f"LPT{index}" for index in range(1, 10)),
}


class DownloaderError(RuntimeError):
    """Base error surfaced to the GUI."""


class InvalidUrlError(DownloaderError):
    """Raised for unsupported input URLs."""


class CancelledError(DownloaderError):
    """Raised after the user requests cancellation."""


@dataclass(frozen=True)
class DownloadOptions:
    output_dir: Path
    cookies_file: Path | None = None
    workers: int = 2
    retries: int = 3
    timeout: float = 35.0
    create_cbz: bool = True
    fallback_to_resized: bool = True
    convert_webp_to_jpeg: bool = False
    collection_page_limit: int = 0
    request_delay: float = 0.2
    video_remux_to_mp4: bool = True

    def __post_init__(self) -> None:
        if not 1 <= self.workers <= 8:
            raise ValueError("workers must be between 1 and 8")
        if self.retries < 0:
            raise ValueError("retries cannot be negative")
        if self.timeout <= 0:
            raise ValueError("timeout must be positive")
        if self.collection_page_limit < 0:
            raise ValueError("collection_page_limit cannot be negative")


@dataclass(frozen=True)
class ProgressEvent:
    kind: str
    message: str = ""
    current: int = 0
    total: int = 0
    detail: str = ""
    path: str = ""
    job_id: str = ""
    unit: str = ""


@dataclass
class DownloadSummary:
    galleries_total: int = 0
    galleries_completed: int = 0
    files_downloaded: int = 0
    files_skipped: int = 0
    files_fallback: int = 0
    files_failed: int = 0


@dataclass(frozen=True)
class ParsedGalleryPage:
    title: str
    page_urls: tuple[str, ...]
    page_count: int
    expected_images: int


@dataclass(frozen=True)
class ParsedImagePage:
    original_url: str | None
    resized_url: str | None
    source_name: str


@dataclass(frozen=True)
class ParsedMangaChapter:
    title: str
    image_urls: tuple[str, ...]


@dataclass(frozen=True)
class GameBusChapterSummary:
    chapter_id: int
    title: str
    order_index: int
    page_count: int
    is_locked: bool


@dataclass(frozen=True)
class ParsedGameBusChapter:
    comic_id: int
    comic_title: str
    chapter_id: int
    chapter_title: str
    order_index: int
    image_urls: tuple[str, ...]


@dataclass(frozen=True)
class HlsSegment:
    sequence: int
    url: str
    key_url: str = ""
    key_iv: bytes = b""


@dataclass(frozen=True)
class ParsedHlsPlaylist:
    segments: tuple[HlsSegment, ...] = ()
    variant_urls: tuple[str, ...] = ()


@dataclass(frozen=True)
class HuangGuoEpisode:
    episode: int
    url: str


@dataclass(frozen=True)
class ParsedHuangGuoVideo:
    video_id: int
    series_title: str
    episode: int
    playlist_url: str
    episodes: tuple[HuangGuoEpisode, ...] = ()


@dataclass(frozen=True)
class VideoEpisodeInfo:
    video_id: int
    series_title: str
    episode: int
    playlist_url: str
    segments: tuple[HlsSegment, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class GalleryInfo:
    url: str
    gid: str
    token: str
    title: str
    page_urls: tuple[str, ...]
    direct_images: bool = False
    source_url: str = ""
    source_title: str = ""


@dataclass(frozen=True)
class FileResult:
    status: str
    path: Path
    used_fallback: bool


@dataclass(frozen=True)
class GalleryDownloadResult:
    files: tuple[FileResult, ...]
    failures: int
    archive_error: str = ""


ProgressCallback = Callable[[ProgressEvent], None]
SessionFactory = Callable[[], requests.Session]


def is_supported_host(hostname: str | None) -> bool:
    if not hostname:
        return False
    hostname = hostname.lower().rstrip(".")
    return any(
        hostname == domain or hostname.endswith("." + domain)
        for domain in SUPPORTED_DOMAINS
    )


def is_ehentai_host(hostname: str | None) -> bool:
    if not hostname:
        return False
    hostname = hostname.lower().rstrip(".")
    return any(
        hostname == domain or hostname.endswith("." + domain)
        for domain in EHENTAI_DOMAINS
    )


def is_h_manhua_host(hostname: str | None) -> bool:
    if not hostname:
        return False
    hostname = hostname.lower().rstrip(".")
    return hostname == H_MANHUA_DOMAIN or hostname.endswith("." + H_MANHUA_DOMAIN)


def is_gamebus_host(hostname: str | None) -> bool:
    if not hostname:
        return False
    hostname = hostname.lower().rstrip(".")
    return hostname in {GAMEBUS_DOMAIN, f"www.{GAMEBUS_DOMAIN}"}


def is_gamebus_image_host(hostname: str | None) -> bool:
    return bool(hostname and hostname.lower().rstrip(".") == GAMEBUS_IMAGE_DOMAIN)


def is_huangguo_host(hostname: str | None) -> bool:
    if not hostname:
        return False
    hostname = hostname.lower().rstrip(".")
    return hostname in {HUANGGUO_DOMAIN, f"www.{HUANGGUO_DOMAIN}"}


def validate_input_url(value: str) -> str:
    value = value.strip().rstrip(",，;；")
    parsed = urlparse(value)
    try:
        port = parsed.port
    except ValueError as exc:
        raise InvalidUrlError(f"链接端口无效：{value}") from exc
    if (
        parsed.scheme.lower() not in {"http", "https"}
        or not (
            is_supported_host(parsed.hostname)
            or is_gamebus_host(parsed.hostname)
            or is_huangguo_host(parsed.hostname)
        )
        or parsed.username
        or parsed.password
        or port is not None
    ):
        raise InvalidUrlError(
            f"不支持的链接：{value}\n"
            "仅支持 E-Hentai、ExHentai、h-manhua.org 章节、"
            "gamebus001.com 的漫画或章节链接，以及 huangguoai.com 的短剧链接。"
        )
    normalized = urlunparse(
        (
            "https",
            (parsed.hostname or "").lower(),
            parsed.path or "/",
            "",
            parsed.query,
            "",
        )
    )
    if is_h_manhua_host(parsed.hostname):
        if not is_h_manhua_chapter_url(normalized):
            raise InvalidUrlError(
                f"不支持的 H漫画链接：{value}\n"
                "请粘贴具体章节链接，例如 "
                "https://a.h-manhua.org/manga/comic/qingluan/1/"
            )
        return canonical_h_manhua_chapter_url(normalized)
    if is_gamebus_host(parsed.hostname):
        if is_gamebus_comic_url(normalized):
            return canonical_gamebus_comic_url(normalized)
        if is_gamebus_chapter_url(normalized):
            return canonical_gamebus_chapter_url(normalized)
        raise InvalidUrlError(
            f"不支持的 GameBus 链接：{value}\n"
            "请粘贴具体漫画或章节链接，例如 "
            "https://gamebus001.com/comic/1186 或 "
            "https://gamebus001.com/chapter/2552"
        )
    if is_huangguo_host(parsed.hostname):
        if is_huangguo_video_url(normalized):
            return canonical_huangguo_video_url(normalized)
        raise InvalidUrlError(
            f"不支持的黄果短剧链接：{value}\n"
            "请粘贴具体短剧播放链接，例如 "
            "https://huangguoai.com/video/117/ 或 "
            "https://huangguoai.com/video/117/ep-5/"
        )
    return normalized


def parse_input_urls(text: str) -> list[str]:
    matches = URL_RE.findall(text)
    candidates = matches or [line.strip() for line in text.splitlines() if line.strip()]
    urls: list[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        url = validate_input_url(candidate)
        if url not in seen:
            seen.add(url)
            urls.append(url)
    if not urls:
        raise InvalidUrlError("请至少输入一个支持的漫画链接。")
    return urls


def is_gallery_url(url: str) -> bool:
    parsed = urlparse(url)
    return (
        is_ehentai_host(parsed.hostname)
        and GALLERY_PATH_RE.match(parsed.path) is not None
    )


def is_image_page_url(url: str) -> bool:
    parsed = urlparse(url)
    return (
        is_ehentai_host(parsed.hostname)
        and IMAGE_PATH_RE.match(parsed.path) is not None
    )


def is_h_manhua_chapter_url(url: str) -> bool:
    parsed = urlparse(url)
    match = H_MANHUA_CHAPTER_PATH_RE.match(parsed.path)
    if not is_h_manhua_host(parsed.hostname) or not match:
        return False
    chapter = match.group("chapter").lower()
    return chapter != "feed" and not chapter.startswith("comment-page-")


def is_gamebus_comic_url(url: str) -> bool:
    parsed = urlparse(url)
    return (
        is_gamebus_host(parsed.hostname)
        and GAMEBUS_COMIC_PATH_RE.match(parsed.path) is not None
    )


def is_gamebus_chapter_url(url: str) -> bool:
    parsed = urlparse(url)
    return (
        is_gamebus_host(parsed.hostname)
        and GAMEBUS_CHAPTER_PATH_RE.match(parsed.path) is not None
    )


def is_gamebus_url(url: str) -> bool:
    return is_gamebus_comic_url(url) or is_gamebus_chapter_url(url)


def is_huangguo_video_url(url: str) -> bool:
    parsed = urlparse(url)
    match = HUANGGUO_VIDEO_PATH_RE.match(parsed.path)
    if not is_huangguo_host(parsed.hostname) or not match:
        return False
    episode = match.group("episode")
    return episode is None or int(episode) >= 1


def is_direct_download_url(url: str) -> bool:
    return (
        is_gallery_url(url)
        or is_h_manhua_chapter_url(url)
        or is_gamebus_url(url)
        or is_huangguo_video_url(url)
    )


def safe_name(value: str, fallback: str = "untitled", limit: int = 150) -> str:
    value = INVALID_PATH_CHARS_RE.sub("_", value)
    value = re.sub(r"\s+", " ", value).strip(" .")
    if not value:
        value = fallback
    stem = value.split(".", 1)[0].upper()
    if stem in WINDOWS_RESERVED_NAMES:
        value = "_" + value
    if len(value) > limit:
        suffix = Path(value).suffix
        keep = max(1, limit - len(suffix))
        value = value[:keep].rstrip(" .") + suffix
    return value


def parse_collection_page(html: str, page_url: str) -> tuple[list[str], str | None]:
    soup = BeautifulSoup(html, "html.parser")
    galleries: list[str] = []
    seen: set[tuple[str, str]] = set()
    for anchor in soup.select("a[href]"):
        href = force_https(urljoin(page_url, anchor.get("href", "")))
        match = GALLERY_PATH_RE.match(urlparse(href).path)
        if not match or not is_supported_host(urlparse(href).hostname):
            continue
        key = (match.group("gid"), match.group("token").lower())
        if key not in seen:
            seen.add(key)
            galleries.append(canonical_gallery_url(href))

    next_anchor = soup.select_one("a#unext[href], a[rel~='next'][href]")
    next_url = (
        force_https(urljoin(page_url, next_anchor["href"])) if next_anchor else None
    )
    if not next_url:
        match = re.search(r'\bvar\s+nexturl\s*=\s*"([^"]*)"', html)
        if match and match.group(1):
            next_url = force_https(urljoin(page_url, match.group(1)))
    if next_url and not is_supported_host(urlparse(next_url).hostname):
        next_url = None
    return galleries, next_url


def parse_gallery_page(html: str, page_url: str) -> ParsedGalleryPage:
    soup = BeautifulSoup(html, "html.parser")
    title_node = soup.select_one("#gn")
    title = title_node.get_text(" ", strip=True) if title_node else ""
    if not title and soup.title:
        title = re.sub(
            r"\s+-\s+E-Hentai Galleries\s*$",
            "",
            soup.title.get_text(" ", strip=True),
            flags=re.IGNORECASE,
        )

    page_urls: list[str] = []
    seen: set[str] = set()
    gallery_grid = soup.select_one("#gdt")
    if gallery_grid:
        for anchor in gallery_grid.select("a[href]"):
            href = force_https(urljoin(page_url, anchor.get("href", "")))
            if IMAGE_PATH_RE.match(urlparse(href).path) and href not in seen:
                seen.add(href)
                page_urls.append(href)

    page_numbers: list[int] = []
    for cell in soup.select("table.ptt td"):
        text = cell.get_text(strip=True)
        if text.isdigit():
            page_numbers.append(int(text))
    page_count = max(page_numbers, default=1)

    expected_images = 0
    for row in soup.select("#gdd tr"):
        cells = row.find_all("td")
        if len(cells) >= 2 and cells[0].get_text(" ", strip=True).rstrip(":") == "Length":
            match = re.search(r"\d+", cells[1].get_text(" ", strip=True))
            if match:
                expected_images = int(match.group())
            break
    if not expected_images:
        count_node = soup.select_one(".gpc")
        if count_node:
            match = re.search(
                r"\bof\s+([\d,]+)\s+images?\b",
                count_node.get_text(" ", strip=True),
                re.IGNORECASE,
            )
            if match:
                expected_images = int(match.group(1).replace(",", ""))

    return ParsedGalleryPage(
        title=title,
        page_urls=tuple(page_urls),
        page_count=page_count,
        expected_images=expected_images,
    )


def parse_mpv_page(html: str, gallery_url: str, gid: str) -> tuple[str, ...]:
    match = re.search(r"\bvar\s+imagelist\s*=\s*(\[.+?\]);", html, re.DOTALL)
    if not match:
        return ()
    keys: list[str] = []
    try:
        values = json.loads(match.group(1))
        keys = [str(value["k"]) for value in values if value.get("k")]
    except (json.JSONDecodeError, TypeError, KeyError):
        keys = re.findall(
            r"""["']?k["']?\s*:\s*["']([0-9a-f]+)["']""",
            match.group(1),
            re.IGNORECASE,
        )
    origin = "https://{0.netloc}".format(urlparse(gallery_url))
    return tuple(
        f"{origin}/s/{key}/{gid}-{index}"
        for index, key in enumerate(keys, start=1)
    )


def parse_image_page(html: str, page_url: str) -> ParsedImagePage:
    soup = BeautifulSoup(html, "html.parser")
    original_url: str | None = None
    for anchor in soup.select("a[href]"):
        href = force_https(urljoin(page_url, anchor.get("href", "")))
        if FULL_IMAGE_PATH_RE.search(urlparse(href).path):
            original_url = href
            break

    image = soup.select_one("img#img, #i3 img")
    resized_url = (
        force_https(urljoin(page_url, image.get("src", ""))) if image else None
    )
    if resized_url and urlparse(resized_url).scheme not in {"http", "https"}:
        resized_url = None

    source_name = ""
    for selector in ("#i2 > div", "#i4 > div"):
        for node in soup.select(selector):
            match = re.match(r"\s*(.+?)\s+::", node.get_text(" ", strip=True))
            if match:
                source_name = match.group(1).strip()
                break
        if source_name:
            break
    if not source_name and original_url:
        source_name = Path(urlparse(original_url).path).name
    if not source_name and resized_url:
        source_name = Path(urlparse(resized_url).path).name

    return ParsedImagePage(
        original_url=original_url,
        resized_url=resized_url,
        source_name=source_name,
    )


def parse_h_manhua_chapter_page(html: str, page_url: str) -> ParsedMangaChapter:
    soup = BeautifulSoup(html, "html.parser")
    title_node = soup.select_one("h1")
    title = title_node.get_text(" ", strip=True) if title_node else ""
    if not title and soup.title:
        title = soup.title.get_text(" ", strip=True)
        title = re.sub(r"\s+[-–—]\s+H漫画\s*$", "", title).strip()

    image_nodes = soup.select("img.wp-manga-chapter-img")
    if not image_nodes:
        image_nodes = soup.select(".reading-content img")
    image_urls: list[str] = []
    seen: set[str] = set()
    for image in image_nodes:
        source = next(
            (
                str(image.get(attribute, "")).strip()
                for attribute in ("data-src", "data-lazy-src", "data-original", "src")
                if str(image.get(attribute, "")).strip()
            ),
            "",
        )
        if not source or source.lower().startswith("data:"):
            continue
        image_url = force_https(urljoin(page_url, source))
        parsed = urlparse(image_url)
        if (
            parsed.scheme != "https"
            or not is_h_manhua_host(parsed.hostname)
            or image_url in seen
        ):
            continue
        seen.add(image_url)
        image_urls.append(image_url)

    if not title:
        match = H_MANHUA_CHAPTER_PATH_RE.match(urlparse(page_url).path)
        if match:
            title = f"{unquote(match.group('slug'))} - {unquote(match.group('chapter'))}"
    return ParsedMangaChapter(title=title, image_urls=tuple(image_urls))


def _gamebus_api_data(api_json: str, context: str) -> dict[str, object]:
    try:
        payload = json.loads(api_json)
    except (json.JSONDecodeError, TypeError) as exc:
        raise DownloaderError(f"GameBus {context}接口返回了无效 JSON。") from exc
    if not isinstance(payload, dict):
        raise DownloaderError(f"GameBus {context}接口响应格式无效。")
    if payload.get("code") != 200:
        message = str(payload.get("message") or "未知错误")
        raise DownloaderError(f"GameBus {context}接口失败：{message}")
    data = payload.get("data")
    if not isinstance(data, dict):
        raise DownloaderError(f"GameBus {context}接口缺少数据。")
    return data


def _gamebus_positive_int(value: object, label: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise DownloaderError(f"GameBus {label}无效。")
    return value


def parse_gamebus_chapter_list(api_json: str) -> tuple[GameBusChapterSummary, ...]:
    data = _gamebus_api_data(api_json, "章节列表")
    raw_chapters = data.get("list")
    if not isinstance(raw_chapters, list):
        raise DownloaderError("GameBus 章节列表格式无效。")

    chapters: list[GameBusChapterSummary] = []
    seen_ids: set[int] = set()
    seen_indexes: set[int] = set()
    for raw in raw_chapters:
        if not isinstance(raw, dict):
            raise DownloaderError("GameBus 章节条目格式无效。")
        chapter_id = _gamebus_positive_int(raw.get("id"), "章节 ID")
        order_index = _gamebus_positive_int(raw.get("order_index"), "章节序号")
        page_count = _gamebus_positive_int(raw.get("pages"), "章节页数")
        title_value = raw.get("title")
        title = title_value.strip() if isinstance(title_value, str) else ""
        locked_value = raw.get("is_locked", False)
        if not isinstance(locked_value, bool):
            raise DownloaderError("GameBus 章节锁定状态无效。")
        if chapter_id in seen_ids or order_index in seen_indexes:
            raise DownloaderError("GameBus 章节列表包含重复 ID 或序号。")
        seen_ids.add(chapter_id)
        seen_indexes.add(order_index)
        chapters.append(
            GameBusChapterSummary(
                chapter_id=chapter_id,
                title=title or f"第 {order_index} 章",
                order_index=order_index,
                page_count=page_count,
                is_locked=locked_value,
            )
        )

    count = data.get("count")
    if count is not None:
        if isinstance(count, bool) or not isinstance(count, int) or count < 0:
            raise DownloaderError("GameBus 章节总数无效。")
        if count != len(chapters):
            raise DownloaderError(
                f"GameBus 章节列表不完整：应有 {count} 章，"
                f"只返回 {len(chapters)} 章。"
            )
    return tuple(sorted(chapters, key=lambda item: item.order_index))


def parse_gamebus_chapter_response(
    api_json: str,
    chapter_url: str,
) -> ParsedGameBusChapter:
    chapter_url = canonical_gamebus_chapter_url(chapter_url)
    requested_match = GAMEBUS_CHAPTER_PATH_RE.match(urlparse(chapter_url).path)
    if not requested_match:
        raise InvalidUrlError(f"无效的 GameBus 章节链接：{chapter_url}")
    requested_id = int(requested_match.group("chapter_id"))

    data = _gamebus_api_data(api_json, "章节图片")
    raw_chapter = data.get("chapter")
    if not isinstance(raw_chapter, dict):
        raise DownloaderError("GameBus 章节图片接口缺少章节信息。")
    chapter_id = _gamebus_positive_int(raw_chapter.get("id"), "章节 ID")
    if chapter_id != requested_id:
        raise DownloaderError(
            f"GameBus 章节 ID 不匹配：请求 {requested_id}，返回 {chapter_id}。"
        )

    locked_value = raw_chapter.get("is_locked", False)
    if not isinstance(locked_value, bool):
        raise DownloaderError("GameBus 章节锁定状态无效。")
    if locked_value:
        raise DownloaderError(f"GameBus 章节 {chapter_id} 已锁定，无法下载。")

    raw_comic = raw_chapter.get("comic")
    if not isinstance(raw_comic, dict):
        raise DownloaderError("GameBus 章节缺少所属漫画信息。")
    comic_id = _gamebus_positive_int(raw_comic.get("id"), "漫画 ID")
    comic_title_value = raw_comic.get("title")
    comic_title = (
        comic_title_value.strip() if isinstance(comic_title_value, str) else ""
    )
    if not comic_title:
        raise DownloaderError("GameBus 漫画标题为空。")

    order_index = _gamebus_positive_int(
        raw_chapter.get("order_index"),
        "章节序号",
    )
    chapter_title_value = raw_chapter.get("title")
    chapter_title = (
        chapter_title_value.strip()
        if isinstance(chapter_title_value, str)
        else ""
    )
    if not chapter_title:
        chapter_title = f"第 {order_index} 章"

    raw_pages = raw_chapter.get("pages")
    if not isinstance(raw_pages, list) or not raw_pages:
        raise DownloaderError("GameBus 章节没有可下载的图片。")

    pages: list[tuple[int, str]] = []
    seen_urls: set[str] = set()
    for raw_page in raw_pages:
        if not isinstance(raw_page, dict):
            raise DownloaderError("GameBus 图片条目格式无效。")
        page_index = _gamebus_positive_int(
            raw_page.get("order_index"),
            "图片序号",
        )
        source = raw_page.get("image_path")
        if not isinstance(source, str) or not source.strip():
            raise DownloaderError(f"GameBus 第 {page_index} 页缺少图片链接。")
        image_url = force_https(urljoin(GAMEBUS_BASE_URL, source.strip()))
        parsed = urlparse(image_url)
        try:
            port = parsed.port
        except ValueError as exc:
            raise DownloaderError(
                f"GameBus 第 {page_index} 页图片端口无效。"
            ) from exc
        if (
            parsed.scheme != "https"
            or not is_gamebus_image_host(parsed.hostname)
            or parsed.username
            or parsed.password
            or port is not None
        ):
            raise DownloaderError(
                f"GameBus 第 {page_index} 页图片域名无效：{image_url}"
            )
        if image_url in seen_urls:
            raise DownloaderError("GameBus 章节包含重复图片链接。")
        seen_urls.add(image_url)
        pages.append((page_index, image_url))

    pages.sort(key=lambda item: item[0])
    actual_indexes = [index for index, _ in pages]
    expected_indexes = list(range(1, len(pages) + 1))
    if actual_indexes != expected_indexes:
        raise DownloaderError(
            "GameBus 章节图片序号不连续，为避免生成残缺集合，本次未下载。"
        )
    return ParsedGameBusChapter(
        comic_id=comic_id,
        comic_title=comic_title,
        chapter_id=chapter_id,
        chapter_title=chapter_title,
        order_index=order_index,
        image_urls=tuple(url for _, url in pages),
    )


def _huangguo_positive_int(value: object, label: str) -> int:
    if isinstance(value, bool):
        raise DownloaderError(f"黄果短剧{label}无效。")
    if isinstance(value, int):
        number = value
    elif isinstance(value, str) and value.strip().isdigit():
        number = int(value.strip())
    else:
        raise DownloaderError(f"黄果短剧{label}无效。")
    if number <= 0:
        raise DownloaderError(f"黄果短剧{label}无效。")
    return number


def _huangguo_media_url(value: object, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise DownloaderError(f"黄果短剧{label}缺失。")
    url = force_https(value.strip())
    parsed = urlparse(url)
    try:
        port = parsed.port
    except ValueError as exc:
        raise DownloaderError(f"黄果短剧{label}端口无效。") from exc
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or port is not None
    ):
        raise DownloaderError(f"黄果短剧{label}无效：{url}")
    return url


def parse_huangguo_video_page(html: str, page_url: str) -> ParsedHuangGuoVideo:
    match = HUANGGUO_INITIAL_DATA_RE.search(html)
    if not match:
        raise DownloaderError(
            "黄果短剧页面没有播放数据。页面可能需要登录、已下架或站点结构已变化。\n"
            f"{page_url}"
        )
    try:
        data = json.loads(match.group("payload"))
    except json.JSONDecodeError as exc:
        raise DownloaderError("黄果短剧播放数据不是有效 JSON。") from exc
    if not isinstance(data, dict):
        raise DownloaderError("黄果短剧播放数据格式无效。")

    video_id = _huangguo_positive_int(data.get("id"), "剧集 ID")
    episode = _huangguo_positive_int(data.get("ep"), "集数")
    requested = HUANGGUO_VIDEO_PATH_RE.match(urlparse(page_url).path)
    if requested:
        requested_id = int(requested.group("video_id"))
        requested_episode = int(requested.group("episode") or 1)
        if requested_id != video_id or requested_episode != episode:
            raise DownloaderError(
                f"黄果短剧页面返回了其它剧集：请求 {requested_id} 第 "
                f"{requested_episode} 集，返回 {video_id} 第 {episode} 集。"
            )

    title_value = data.get("title")
    series_title = title_value.strip() if isinstance(title_value, str) else ""
    if not series_title:
        raise DownloaderError("黄果短剧标题为空。")

    playlist_source = data.get("videoSrc")
    if not isinstance(playlist_source, str) or not playlist_source.strip():
        sources = data.get("epPlaySrcs")
        if isinstance(sources, dict):
            playlist_source = sources.get(str(episode))
    playlist_url = _huangguo_media_url(playlist_source, "播放地址")

    episodes: list[HuangGuoEpisode] = []
    seen: set[int] = set()
    soup = BeautifulSoup(html, "html.parser")
    for anchor in soup.select("a[data-ep-id][href]"):
        href = force_https(urljoin(page_url, str(anchor.get("href", "")).strip()))
        parsed = urlparse(href)
        anchor_match = HUANGGUO_VIDEO_PATH_RE.match(parsed.path)
        if not is_huangguo_host(parsed.hostname) or not anchor_match:
            continue
        if int(anchor_match.group("video_id")) != video_id:
            continue
        number = int(anchor_match.group("episode") or 1)
        if number < 1 or number in seen:
            continue
        seen.add(number)
        episodes.append(
            HuangGuoEpisode(episode=number, url=huangguo_episode_url(video_id, number))
        )

    if episode not in seen:
        episodes.append(
            HuangGuoEpisode(
                episode=episode,
                url=huangguo_episode_url(video_id, episode),
            )
        )
    episodes.sort(key=lambda item: item.episode)
    return ParsedHuangGuoVideo(
        video_id=video_id,
        series_title=series_title,
        episode=episode,
        playlist_url=playlist_url,
        episodes=tuple(episodes),
    )


def _hls_attributes(value: str) -> dict[str, str]:
    return {
        key.upper(): raw.strip().strip('"')
        for key, raw in HLS_ATTRIBUTE_RE.findall(value)
    }


def _hls_iv(value: str, context: str) -> bytes:
    text = value.strip()
    if text.lower().startswith("0x"):
        text = text[2:]
    try:
        iv = bytes.fromhex(text)
    except ValueError as exc:
        raise DownloaderError(f"{context}的加密 IV 无效：{value}") from exc
    if len(iv) != 16:
        raise DownloaderError(f"{context}的加密 IV 长度无效：{value}")
    return iv


def parse_hls_playlist(
    text: str,
    playlist_url: str,
    context: str = "播放列表",
) -> ParsedHlsPlaylist:
    lines = [line.strip() for line in text.splitlines()]
    if not any(line.startswith("#EXTM3U") for line in lines[:3]):
        raise DownloaderError(f"{context}不是有效的 M3U8 播放列表：{playlist_url}")

    variants: list[tuple[int, str]] = []
    segments: list[HlsSegment] = []
    sequence = 0
    key_url = ""
    key_iv = b""
    pending_variant: dict[str, str] | None = None

    for line in lines:
        if not line:
            continue
        if line.startswith("#EXT-X-MEDIA-SEQUENCE:"):
            raw = line.partition(":")[2].strip()
            if not raw.isdigit():
                raise DownloaderError(f"{context}的媒体序号无效：{raw}")
            sequence = int(raw)
            continue
        if line.startswith("#EXT-X-KEY:"):
            attributes = _hls_attributes(line.partition(":")[2])
            method = attributes.get("METHOD", "").upper()
            if method in {"", "NONE"}:
                key_url = ""
                key_iv = b""
            elif method == "AES-128":
                key_url = _huangguo_media_url(attributes.get("URI"), "解密密钥地址")
                raw_iv = attributes.get("IV", "")
                key_iv = _hls_iv(raw_iv, context) if raw_iv else b""
            else:
                raise DownloaderError(
                    f"{context}使用了不支持的加密方式：{method}"
                )
            continue
        if line.startswith("#EXT-X-STREAM-INF:"):
            pending_variant = _hls_attributes(line.partition(":")[2])
            continue
        if line.startswith("#"):
            continue
        if pending_variant is not None:
            bandwidth_raw = pending_variant.get("BANDWIDTH", "0")
            bandwidth = int(bandwidth_raw) if bandwidth_raw.isdigit() else 0
            variants.append((bandwidth, force_https(urljoin(playlist_url, line))))
            pending_variant = None
            continue
        segments.append(
            HlsSegment(
                sequence=sequence,
                url=force_https(urljoin(playlist_url, line)),
                key_url=key_url,
                key_iv=key_iv,
            )
        )
        sequence += 1

    if segments and variants:
        raise DownloaderError(f"{context}同时包含分片和码率列表，无法解析。")
    if variants:
        variants.sort(key=lambda item: item[0], reverse=True)
        return ParsedHlsPlaylist(
            variant_urls=tuple(url for _, url in variants),
        )
    if not segments:
        raise DownloaderError(f"{context}中没有可下载的视频分片：{playlist_url}")
    for segment in segments:
        parsed = urlparse(segment.url)
        if parsed.scheme != "https" or not parsed.hostname:
            raise DownloaderError(f"{context}包含无效的分片地址：{segment.url}")
    return ParsedHlsPlaylist(segments=tuple(segments))


def decrypt_hls_segment(payload: bytes, key: bytes, iv: bytes) -> bytes:
    if AES is None:
        raise DownloaderError(
            "缺少 pycryptodome，无法解密 AES-128 加密的视频分片。\n"
            "请运行：pip install -r requirements.txt"
        )
    if len(key) != 16:
        raise DownloaderError(f"AES-128 密钥长度无效：{len(key)} 字节。")
    if len(iv) != 16:
        raise DownloaderError(f"AES-128 IV 长度无效：{len(iv)} 字节。")
    if not payload or len(payload) % 16:
        raise DownloaderError("加密视频分片长度不是 16 的倍数，数据可能不完整。")
    plain = AES.new(key, AES.MODE_CBC, iv).decrypt(payload)
    padding = plain[-1]
    if 1 <= padding <= 16 and plain[-padding:] == bytes([padding]) * padding:
        plain = plain[:-padding]
    if not plain:
        raise DownloaderError("解密后的视频分片为空。")
    return plain


def canonical_gallery_url(url: str) -> str:
    parsed = urlparse(url)
    match = GALLERY_PATH_RE.match(parsed.path)
    if not match:
        raise InvalidUrlError(f"不是有效的画廊链接：{url}")
    path = f"/g/{match.group('gid')}/{match.group('token').lower()}/"
    return urlunparse(("https", parsed.netloc, path, "", "", ""))

def canonical_h_manhua_chapter_url(url: str) -> str:
    parsed = urlparse(url)
    match = H_MANHUA_CHAPTER_PATH_RE.match(parsed.path)
    if not is_h_manhua_host(parsed.hostname) or not match:
        raise InvalidUrlError(f"不是有效的 H漫画章节链接：{url}")
    chapter = match.group("chapter").lower()
    if chapter == "feed" or chapter.startswith("comment-page-"):
        raise InvalidUrlError(f"不是有效的 H漫画章节链接：{url}")
    path = f"/manga/comic/{match.group('slug')}/{match.group('chapter')}/"
    return urlunparse(
        ("https", (parsed.hostname or "").lower(), path, "", "", "")
    )


def canonical_gamebus_comic_url(url: str) -> str:
    parsed = urlparse(url)
    match = GAMEBUS_COMIC_PATH_RE.match(parsed.path)
    if not is_gamebus_host(parsed.hostname) or not match:
        raise InvalidUrlError(f"不是有效的 GameBus 漫画链接：{url}")
    path = f"/comic/{match.group('comic_id')}"
    return urlunparse(("https", GAMEBUS_DOMAIN, path, "", "", ""))


def canonical_gamebus_chapter_url(url: str) -> str:
    parsed = urlparse(url)
    match = GAMEBUS_CHAPTER_PATH_RE.match(parsed.path)
    if not is_gamebus_host(parsed.hostname) or not match:
        raise InvalidUrlError(f"不是有效的 GameBus 章节链接：{url}")
    path = f"/chapter/{match.group('chapter_id')}"
    return urlunparse(("https", GAMEBUS_DOMAIN, path, "", "", ""))


def huangguo_episode_url(video_id: int, episode: int) -> str:
    if episode < 1:
        raise InvalidUrlError(f"黄果短剧集数无效：{episode}")
    path = f"/video/{video_id}/" if episode == 1 else f"/video/{video_id}/ep-{episode}/"
    return urlunparse(("https", HUANGGUO_DOMAIN, path, "", "", ""))


def canonical_huangguo_video_url(url: str) -> str:
    parsed = urlparse(url)
    match = HUANGGUO_VIDEO_PATH_RE.match(parsed.path)
    if not is_huangguo_host(parsed.hostname) or not match:
        raise InvalidUrlError(f"不是有效的黄果短剧链接：{url}")
    episode = int(match.group("episode") or 1)
    if episode < 1:
        raise InvalidUrlError(f"不是有效的黄果短剧链接：{url}")
    return huangguo_episode_url(int(match.group("video_id")), episode)


def huangguo_video_id(url: str) -> int:
    match = HUANGGUO_VIDEO_PATH_RE.match(urlparse(url).path)
    if not is_huangguo_host(urlparse(url).hostname) or not match:
        raise InvalidUrlError(f"不是有效的黄果短剧链接：{url}")
    return int(match.group("video_id"))


def force_https(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme.lower() == "http":
        return urlunparse(("https", parsed.netloc, parsed.path, "", parsed.query, ""))
    return url


def find_gallery_warning_url(html: str, gallery_url: str) -> str | None:
    source = urlparse(gallery_url)
    soup = BeautifulSoup(html, "html.parser")
    for anchor in soup.select("a[href]"):
        href = force_https(urljoin(gallery_url, anchor.get("href", "")))
        parsed = urlparse(href)
        query = dict(parse_qsl(parsed.query))
        if (
            parsed.hostname == source.hostname
            and parsed.path.rstrip("/") == source.path.rstrip("/")
            and query.get("nw") in {"session", "always"}
        ):
            return href
    return None


def gallery_page_url(gallery_url: str, page_index: int) -> str:
    parsed = urlparse(gallery_url)
    query = [(key, value) for key, value in parse_qsl(parsed.query) if key != "p"]
    if page_index:
        query.append(("p", str(page_index)))
    return urlunparse(
        (parsed.scheme, parsed.netloc, parsed.path, "", urlencode(query), "")
    )


def _page_number(url: str) -> int:
    match = re.search(r"-(\d+)(?:/)?$", urlparse(url).path)
    return int(match.group(1)) if match else 0


def _content_disposition_filename(header: str | None) -> str:
    if not header:
        return ""
    message = Message()
    message["content-disposition"] = header
    return message.get_filename() or ""


def _extension_from_content_type(content_type: str) -> str:
    mime = content_type.partition(";")[0].strip().lower()
    extension = mimetypes.guess_extension(mime) or ""
    return ".jpg" if extension == ".jpe" else extension


def _existing_image_files(directory: Path) -> dict[int, Path]:
    files: dict[int, Path] = {}
    if not directory.is_dir():
        return files
    for path in directory.iterdir():
        if not path.is_file() or path.name.endswith(".part") or not path.stat().st_size:
            continue
        match = re.match(r"^0*(\d+)\s+-\s+", path.name)
        if not match:
            continue
        index = int(match.group(1))
        previous = files.get(index)
        if previous is None or path.stat().st_mtime > previous.stat().st_mtime:
            files[index] = path
    return files


def _load_cookies(session: requests.Session, path: Path) -> None:
    if not path.is_file():
        raise DownloaderError(f"Cookie 文件不存在：{path}")
    jar = http.cookiejar.MozillaCookieJar(str(path))
    try:
        jar.load(ignore_discard=True, ignore_expires=True)
    except (http.cookiejar.LoadError, OSError) as exc:
        raise DownloaderError(
            "Cookie 文件格式无效。请使用 Netscape cookies.txt 格式导出。"
        ) from exc
    session.cookies.update(jar)


def create_session(options: DownloadOptions) -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=options.retries,
        connect=options.retries,
        read=options.retries,
        status=options.retries,
        allowed_methods=frozenset({"GET"}),
        status_forcelist=(429, 500, 502, 503, 504),
        backoff_factor=0.8,
        respect_retry_after_header=True,
        raise_on_status=False,
    )
    adapter = HTTPAdapter(
        max_retries=retry,
        pool_connections=max(4, options.workers + 1),
        pool_maxsize=max(4, options.workers + 1),
    )
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/138.0 Safari/537.36 EHD-Desktop/1.0"
            ),
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
        }
    )
    if options.cookies_file:
        _load_cookies(session, options.cookies_file)
    return session


class _RateLimiter:
    def __init__(self, delay: float) -> None:
        self.delay = max(0.0, delay)
        self._lock = threading.Lock()
        self._next_request = 0.0

    def wait(self, cancel_event: threading.Event) -> None:
        while True:
            if cancel_event.is_set():
                raise CancelledError("下载已停止。")
            with self._lock:
                now = time.monotonic()
                wait_for = self._next_request - now
                if wait_for <= 0:
                    self._next_request = now + self.delay
                    return
            cancel_event.wait(min(wait_for, 0.1))


class EHentaiDownloader:
    progress_unit = "页"
    file_unit = "张"

    def __init__(
        self,
        options: DownloadOptions,
        callback: ProgressCallback | None = None,
        cancel_event: threading.Event | None = None,
        session_factory: SessionFactory | None = None,
    ) -> None:
        self.options = options
        self.callback = callback or (lambda event: None)
        self.cancel_event = cancel_event or threading.Event()
        self._session_factory = session_factory or (lambda: create_session(options))
        self._sessions_lock = threading.Lock()
        self._sessions: list[requests.Session] = []
        self._main_session = self._new_session()
        self._thread_local = threading.local()
        self._rate_limiter = _RateLimiter(options.request_delay)

    def run(self, urls: Iterable[str]) -> DownloadSummary:
        self.options.output_dir.mkdir(parents=True, exist_ok=True)
        summary = DownloadSummary()
        try:
            targets: list[tuple[str, str]] = []
            seen_targets: set[tuple[str, str]] = set()
            for raw_url in urls:
                source_url = validate_input_url(raw_url)
                for gallery_url in self._resolve_inputs([source_url]):
                    target = (source_url, gallery_url)
                    if target not in seen_targets:
                        seen_targets.add(target)
                        targets.append(target)

            summary.galleries_total = len(targets)
            if not targets:
                raise DownloaderError("没有从输入链接中找到任何可下载内容。")
            self._emit(
                "plan",
                f"共发现 {len(targets)} 个下载项目。",
                total=len(targets),
            )

            for gallery_index, (source_url, gallery_url) in enumerate(
                targets,
                start=1,
            ):
                self._check_cancelled()
                try:
                    gallery = replace(
                        self._load_gallery(gallery_url),
                        source_url=source_url,
                    )
                    self._emit(
                        "gallery_start",
                        gallery.title,
                        current=gallery_index,
                        total=len(targets),
                        detail=str(len(gallery.page_urls)),
                        unit=self.progress_unit,
                    )
                    gallery_result = self._download_gallery(gallery)
                except CancelledError:
                    raise
                except Exception as exc:
                    summary.files_failed += 1
                    self._emit(
                        "error",
                        f"任务失败：{gallery_url}\n{self._format_error(exc)}",
                    )
                    continue

                for result in gallery_result.files:
                    if result.status == "downloaded":
                        summary.files_downloaded += 1
                    else:
                        summary.files_skipped += 1
                    if result.used_fallback:
                        summary.files_fallback += 1
                summary.files_failed += gallery_result.failures
                if gallery_result.archive_error:
                    summary.files_failed += 1
                    self._emit(
                        "error",
                        f"{gallery.title} 的图片已保存，但 CBZ 生成失败："
                        f"{gallery_result.archive_error}",
                    )
                if gallery_result.failures or gallery_result.archive_error:
                    if gallery_result.failures:
                        self._emit(
                            "error",
                            f"{gallery.title} 有 {gallery_result.failures} "
                            f"{self.progress_unit}失败；"
                            "已保留成功文件，再次运行会跳过它们并重试缺失部分。",
                        )
                    continue
                summary.galleries_completed += 1
                self._emit(
                    "gallery_done",
                    gallery.title,
                    current=gallery_index,
                    total=len(targets),
                    path=str(self._gallery_directory(gallery)),
                )

            self._emit("done", self._summary_message(summary))
            return summary
        except CancelledError:
            self._emit("cancelled", "下载已停止。")
            raise
        finally:
            self._close_sessions()

    def cancel(self) -> None:
        self.cancel_event.set()
        self._close_sessions()

    def _resolve_inputs(self, urls: Iterable[str]) -> list[str]:
        galleries: list[str] = []
        seen: set[str] = set()
        for raw_url in urls:
            self._check_cancelled()
            url = validate_input_url(raw_url)
            if is_h_manhua_chapter_url(url):
                discovered = [canonical_h_manhua_chapter_url(url)]
            elif is_gallery_url(url):
                discovered = [canonical_gallery_url(url)]
            elif is_image_page_url(url):
                discovered = [self._gallery_from_image_page(url)]
            else:
                discovered = self._crawl_collection(url)

            for gallery_url in discovered:
                if gallery_url not in seen:
                    seen.add(gallery_url)
                    galleries.append(gallery_url)
        return galleries

    def _gallery_from_image_page(self, url: str) -> str:
        html = self._get_text(self._main_session, url)
        soup = BeautifulSoup(html, "html.parser")
        for anchor in soup.select("a[href]"):
            href = force_https(urljoin(url, anchor.get("href", "")))
            if is_gallery_url(href):
                return canonical_gallery_url(href)
        raise DownloaderError(f"无法从图片页找到所属画廊：{url}")

    def _crawl_collection(self, first_url: str) -> list[str]:
        galleries: list[str] = []
        seen_galleries: set[tuple[str, str]] = set()
        visited_pages: set[str] = set()
        page_url: str | None = first_url
        page_number = 0

        while page_url and page_url not in visited_pages:
            self._check_cancelled()
            if (
                self.options.collection_page_limit
                and page_number >= self.options.collection_page_limit
            ):
                self._emit(
                    "warning",
                    "已达到集合页上限 "
                    f"{self.options.collection_page_limit}，后续页面未扫描。",
                )
                break
            visited_pages.add(page_url)
            page_number += 1
            self._emit(
                "discovery",
                f"正在扫描集合第 {page_number} 页：{page_url}",
                current=page_number,
            )
            html = self._get_text(self._main_session, page_url)
            page_galleries, next_url = parse_collection_page(html, page_url)
            for gallery_url in page_galleries:
                match = GALLERY_PATH_RE.match(urlparse(gallery_url).path)
                if not match:
                    continue
                key = (match.group("gid"), match.group("token").lower())
                if key not in seen_galleries:
                    seen_galleries.add(key)
                    galleries.append(gallery_url)
            page_url = validate_input_url(next_url) if next_url else None

        if not galleries:
            raise DownloaderError(
                "集合页面中没有找到画廊。若这是收藏夹或 ExHentai 链接，"
                "请提供已登录账号导出的 cookies.txt。"
            )
        self._emit(
            "log",
            f"集合扫描完成：{page_number} 页，发现 {len(galleries)} 个画廊。",
        )
        return galleries

    def _load_gallery(self, gallery_url: str) -> GalleryInfo:
        if is_h_manhua_chapter_url(gallery_url):
            return self._load_h_manhua_chapter(gallery_url)

        gallery_url = canonical_gallery_url(gallery_url)
        match = GALLERY_PATH_RE.match(urlparse(gallery_url).path)
        if not match:
            raise InvalidUrlError(f"无效的画廊链接：{gallery_url}")
        gid = match.group("gid")
        token = match.group("token").lower()

        title = f"Gallery {gid}"
        expected_images = 0
        page_urls: list[str] = []
        attempts = max(1, self.options.retries + 1)
        for attempt in range(attempts):
            first, discovered = self._read_gallery_directory(gallery_url)
            title = first.title or title
            expected_images = first.expected_images or expected_images
            merged_pages: dict[int | str, str] = {}
            for discovered_url in page_urls + discovered:
                number = _page_number(discovered_url)
                merged_pages[number or discovered_url] = discovered_url
            page_urls = list(merged_pages.values())
            if page_urls and (
                not expected_images or len(page_urls) == expected_images
            ):
                break
            if attempt + 1 < attempts:
                self._emit(
                    "warning",
                    f"{title} 的目录不完整（发现 {len(page_urls)}/"
                    f"{expected_images or '?'} 页），正在重新读取 "
                    f"{attempt + 2}/{attempts}。",
                )

        if not page_urls or (
            expected_images and len(page_urls) != expected_images
        ):
            origin = "https://{0.netloc}".format(urlparse(gallery_url))
            mpv_url = f"{origin}/mpv/{gid}/{token}/"
            try:
                mpv_html = self._get_text(
                    self._main_session, mpv_url, referer=gallery_url
                )
                mpv_urls = list(parse_mpv_page(mpv_html, gallery_url, gid))
                if len(mpv_urls) > len(page_urls):
                    page_urls = mpv_urls
            except DownloaderError as exc:
                self._emit("warning", f"MPV 目录读取失败：{exc}")
        page_urls.sort(key=_page_number)

        if not page_urls:
            raise DownloaderError(
                "未找到画廊图片页。页面可能需要登录、已被删除或站点结构已变化。"
            )
        if expected_images and len(page_urls) != expected_images:
            raise DownloaderError(
                f"画廊目录不完整：应有 {expected_images} 页，"
                f"只发现 {len(page_urls)} 页。为避免生成残缺集合，本次未下载。"
            )
        return GalleryInfo(
            url=gallery_url,
            gid=gid,
            token=token,
            title=title,
            page_urls=tuple(page_urls),
            source_title=title,
        )

    def _load_h_manhua_chapter(self, chapter_url: str) -> GalleryInfo:
        chapter_url = canonical_h_manhua_chapter_url(chapter_url)
        match = H_MANHUA_CHAPTER_PATH_RE.match(urlparse(chapter_url).path)
        if not match:
            raise InvalidUrlError(f"无效的 H漫画章节链接：{chapter_url}")

        parsed = parse_h_manhua_chapter_page(
            self._get_text(self._main_session, chapter_url),
            chapter_url,
        )
        if not parsed.image_urls:
            raise DownloaderError(
                "章节页面中没有找到图片。页面可能已失效或站点结构已变化。"
            )
        slug = match.group("slug")
        chapter = match.group("chapter")
        title = parsed.title or f"{unquote(slug)} - {unquote(chapter)}"
        return GalleryInfo(
            url=chapter_url,
            gid=safe_name(
                f"hm-{slug}-{chapter}",
                fallback="hm-chapter",
                limit=70,
            ),
            token="",
            title=title,
            page_urls=parsed.image_urls,
            direct_images=True,
            source_title=title,
        )

    def _read_gallery_directory(
        self, gallery_url: str
    ) -> tuple[ParsedGalleryPage, list[str]]:
        html = self._get_text(self._main_session, gallery_url)
        warning_url = find_gallery_warning_url(html, gallery_url)
        if warning_url:
            self._emit("log", "画廊包含内容确认页，正在进入画廊。")
            html = self._get_text(
                self._main_session,
                warning_url,
                referer=gallery_url,
            )
        first = parse_gallery_page(html, gallery_url)
        page_urls = list(first.page_urls)
        title = first.title or "未命名画廊"

        for page_index in range(1, first.page_count):
            self._check_cancelled()
            url = gallery_page_url(gallery_url, page_index)
            self._emit(
                "log",
                f"读取画廊目录 {page_index + 1}/{first.page_count}：{title}",
            )
            parsed = parse_gallery_page(
                self._get_text(self._main_session, url, referer=gallery_url),
                url,
            )
            page_urls.extend(parsed.page_urls)
        return first, list(dict.fromkeys(page_urls))

    def _download_gallery(self, gallery: GalleryInfo) -> GalleryDownloadResult:
        directory = self._gallery_directory(gallery)
        directory.mkdir(parents=True, exist_ok=True)
        total = len(gallery.page_urls)
        width = max(3, len(str(total)))
        existing_files = _existing_image_files(directory)
        futures: dict[Future[FileResult], int] = {}
        results: list[FileResult] = []
        errors: list[tuple[int, Exception]] = []

        executor = ThreadPoolExecutor(
            max_workers=self.options.workers,
            thread_name_prefix="ehd-download",
        )
        try:
            for index, page_url in enumerate(gallery.page_urls, start=1):
                future = executor.submit(
                    self._download_page,
                    gallery,
                    page_url,
                    index,
                    width,
                    directory,
                    existing_files.get(index),
                )
                futures[future] = index

            completed = 0
            pending = set(futures)
            while pending:
                self._check_cancelled()
                completed_futures, pending = wait(
                    pending,
                    timeout=0.2,
                    return_when=FIRST_COMPLETED,
                )
                for future in completed_futures:
                    index = futures[future]
                    try:
                        result = future.result()
                        results.append(result)
                    except CancelledError:
                        raise
                    except Exception as exc:
                        errors.append((index, exc))
                        self._emit(
                            "error",
                            f"{gallery.title} 第 {index} 页失败："
                            f"{self._format_error(exc)}",
                        )
                    completed += 1
                    self._emit(
                        "gallery_progress",
                        gallery.title,
                        current=completed,
                        total=total,
                        unit=self.progress_unit,
                    )
        finally:
            if self.cancel_event.is_set():
                for future in futures:
                    future.cancel()
            executor.shutdown(
                wait=True,
                cancel_futures=self.cancel_event.is_set(),
            )

        self._check_cancelled()
        if errors:
            return GalleryDownloadResult(
                files=tuple(sorted(results, key=lambda item: item.path.name)),
                failures=len(errors),
            )
        if self.options.create_cbz:
            try:
                cbz_path = self._create_cbz(gallery, directory)
                self._emit("log", f"已生成 CBZ：{cbz_path}", path=str(cbz_path))
            except CancelledError:
                raise
            except Exception as exc:
                return GalleryDownloadResult(
                    files=tuple(sorted(results, key=lambda item: item.path.name)),
                    failures=0,
                    archive_error=self._format_error(exc),
                )
        return GalleryDownloadResult(
            files=tuple(sorted(results, key=lambda item: item.path.name)),
            failures=0,
        )

    def _download_page(
        self,
        gallery: GalleryInfo,
        page_url: str,
        index: int,
        width: int,
        directory: Path,
        existing_path: Path | None,
    ) -> FileResult:
        self._check_cancelled()
        prefix = f"{index:0{width}d} - "
        if existing_path:
            target = self._convert_webp_to_jpeg(existing_path)
            return FileResult("skipped", target, False)

        session = self._thread_session()
        if gallery.direct_images:
            source_name = unquote(Path(urlparse(page_url).path).name)
            target = self._download_image_file(
                session=session,
                image_url=page_url,
                page_url=gallery.url,
                source_name=source_name,
                index=index,
                prefix=prefix,
                directory=directory,
            )
            return FileResult("downloaded", target, False)

        html = self._get_text(session, page_url, referer=gallery.url)
        parsed = parse_image_page(html, page_url)
        if parsed.original_url:
            try:
                target = self._download_image_file(
                    session=session,
                    image_url=parsed.original_url,
                    page_url=page_url,
                    source_name=parsed.source_name,
                    index=index,
                    prefix=prefix,
                    directory=directory,
                )
                return FileResult("downloaded", target, False)
            except CancelledError:
                raise
            except DownloaderError as exc:
                if not self.options.fallback_to_resized or not parsed.resized_url:
                    raise
                self._emit(
                    "warning",
                    f"{gallery.title} 第 {index} 页原图下载失败，"
                    f"改用当前最高可用图：{exc}",
                )
        elif not self.options.fallback_to_resized or not parsed.resized_url:
            raise DownloaderError("页面没有可用的原图链接。")
        else:
            self._emit(
                "warning",
                f"{gallery.title} 第 {index} 页无原图链接，使用当前最高可用图。",
            )

        resized_url = parsed.resized_url
        if not resized_url:
            raise DownloaderError("页面没有可用的回退图片链接。")
        resized_name = Path(urlparse(resized_url).path).name or parsed.source_name
        target = self._download_image_file(
            session=session,
            image_url=resized_url,
            page_url=page_url,
            source_name=resized_name,
            index=index,
            prefix=prefix,
            directory=directory,
        )
        return FileResult("downloaded", target, True)

    def _download_image_file(
        self,
        session: requests.Session,
        image_url: str,
        page_url: str,
        source_name: str,
        index: int,
        prefix: str,
        directory: Path,
    ) -> Path:
        image_url = force_https(image_url)
        if urlparse(image_url).scheme != "https":
            raise DownloaderError(f"图片链接协议无效：{image_url}")
        source_name = safe_name(
            source_name or Path(urlparse(image_url).path).name,
            fallback=f"page-{index}",
            limit=100,
        )
        target = directory / (prefix + source_name)
        if target.is_file() and target.stat().st_size:
            return self._convert_webp_to_jpeg(target)

        response = self._get(
            session,
            image_url,
            referer=page_url,
            stream=True,
        )
        part_path: Path | None = None
        completed = False
        try:
            self._raise_for_status(response, image_url)
            content_type = response.headers.get("Content-Type", "")
            if content_type.lower().startswith(("text/html", "text/plain")):
                preview = response.text[:300].replace("\n", " ").strip()
                raise DownloaderError(
                    "图片服务器返回了网页而不是图片。"
                    + (f" 响应：{preview}" if preview else "")
                )

            if not Path(source_name).suffix:
                header_name = _content_disposition_filename(
                    response.headers.get("Content-Disposition")
                )
                if header_name:
                    source_name = safe_name(
                        header_name,
                        fallback=f"page-{index}",
                        limit=100,
                    )
                else:
                    source_name += _extension_from_content_type(content_type)
                target = directory / (prefix + source_name)
            part_path = target.with_name(target.name + ".part")
            with part_path.open("wb") as output:
                for chunk in response.iter_content(chunk_size=256 * 1024):
                    self._check_cancelled()
                    if chunk:
                        output.write(chunk)
            if not part_path.stat().st_size:
                raise DownloaderError("图片响应为空。")
            os.replace(part_path, target)
            completed = True
        except requests.RequestException as exc:
            if self.cancel_event.is_set():
                raise CancelledError("下载已停止。") from exc
            raise DownloaderError(f"图片传输失败：{image_url}\n{exc}") from exc
        finally:
            response.close()
            if part_path and not completed:
                part_path.unlink(missing_ok=True)
        return self._convert_webp_to_jpeg(target)

    def _convert_webp_to_jpeg(self, source_path: Path) -> Path:
        if not self.options.convert_webp_to_jpeg:
            return source_path

        self._check_cancelled()
        target_path = source_path.with_suffix(".jpg")
        part_path = target_path.with_name(target_path.name + ".part")
        completed = False
        try:
            with Image.open(source_path) as image:
                if (image.format or "").upper() != "WEBP":
                    return source_path
                if getattr(image, "is_animated", False) and getattr(
                    image, "n_frames", 1
                ) > 1:
                    raise DownloaderError(
                        f"动态 WebP 无法转换为 JPG：{source_path.name}"
                    )

                working = ImageOps.exif_transpose(image)
                converted: Image.Image | None = None
                try:
                    has_alpha = (
                        "A" in working.getbands() or "transparency" in working.info
                    )
                    if has_alpha:
                        rgba = working.convert("RGBA")
                        try:
                            converted = Image.new("RGB", rgba.size, "white")
                            converted.paste(rgba, mask=rgba.getchannel("A"))
                        finally:
                            rgba.close()
                    else:
                        converted = working.convert("RGB")

                    try:
                        save_options: dict[str, object] = {
                            "format": "JPEG",
                            "quality": 95,
                            "subsampling": 0,
                            "optimize": True,
                        }
                        icc_profile = image.info.get("icc_profile")
                        if icc_profile:
                            save_options["icc_profile"] = icc_profile
                        converted.save(part_path, **save_options)
                    finally:
                        if converted is not None:
                            converted.close()
                finally:
                    if working is not image:
                        working.close()

            self._check_cancelled()
            os.replace(part_path, target_path)
            try:
                source_path.unlink()
            except OSError:
                target_path.unlink(missing_ok=True)
                raise
            completed = True
            return target_path
        except CancelledError:
            raise
        except DownloaderError:
            raise
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise DownloaderError(
                f"WebP 转 JPG 失败：{source_path.name}\n{exc}"
            ) from exc
        finally:
            if not completed:
                part_path.unlink(missing_ok=True)

    def _create_cbz(self, gallery: GalleryInfo, directory: Path) -> Path:
        self._check_cancelled()
        archive_directory = cbz_source_directory(
            self.options.output_dir,
            gallery.source_url or gallery.url,
            gallery.source_title,
        )
        archive_directory.mkdir(parents=True, exist_ok=True)
        cbz_path = archive_directory / f"{directory.name}.cbz"
        part_path = cbz_path.with_name(cbz_path.name + ".part")
        indexed_files = _existing_image_files(directory)
        files = [
            indexed_files[index]
            for index in range(1, len(gallery.page_urls) + 1)
            if index in indexed_files
        ]
        if len(files) != len(gallery.page_urls):
            raise DownloaderError("图片文件不完整，无法生成 CBZ。")
        completed = False
        try:
            with zipfile.ZipFile(
                part_path,
                mode="w",
                compression=zipfile.ZIP_STORED,
                allowZip64=True,
            ) as archive:
                for path in files:
                    self._check_cancelled()
                    archive.write(path, arcname=path.name)
            os.replace(part_path, cbz_path)
            completed = True
        finally:
            if not completed:
                part_path.unlink(missing_ok=True)
        return cbz_path

    def _gallery_directory(self, gallery: GalleryInfo) -> Path:
        name = safe_name(
            f"{gallery.gid} - {gallery.title}",
            fallback=gallery.gid,
            limit=120,
        )
        parent = image_source_directory(
            self.options.output_dir,
            gallery.source_url or gallery.url,
            gallery.source_title,
        )
        desired = parent / name
        if desired.exists():
            return desired
        existing = sorted(
            path
            for path in parent.glob(f"{gallery.gid} - *")
            if path.is_dir()
        )
        return existing[0] if existing else desired

    def _thread_session(self) -> requests.Session:
        session = getattr(self._thread_local, "session", None)
        if session is None:
            session = self._new_session()
            self._thread_local.session = session
        return session

    def _new_session(self) -> requests.Session:
        session = self._session_factory()
        with self._sessions_lock:
            self._sessions.append(session)
        return session

    def _close_sessions(self) -> None:
        with self._sessions_lock:
            sessions = self._sessions[:]
            self._sessions.clear()
        for session in sessions:
            close = getattr(session, "close", None)
            if close:
                close()

    def _get_text(
        self,
        session: requests.Session,
        url: str,
        referer: str | None = None,
    ) -> str:
        response = self._get(session, url, referer=referer)
        try:
            self._raise_for_status(response, url)
            text = response.text
            effective_url = response.url
        finally:
            response.close()
        self._check_site_page(text, effective_url)
        return text

    def _get(
        self,
        session: requests.Session,
        url: str,
        referer: str | None = None,
        stream: bool = False,
        rate_limit: bool = True,
    ) -> requests.Response:
        current_url = force_https(url)
        if urlparse(current_url).scheme != "https":
            raise DownloaderError(f"只允许 HTTPS 请求：{url}")
        headers = {"Referer": force_https(referer)} if referer else None

        for _ in range(10):
            self._check_cancelled()
            if rate_limit:
                self._rate_limiter.wait(self.cancel_event)
            try:
                response = session.get(
                    current_url,
                    headers=headers,
                    timeout=self.options.timeout,
                    stream=stream,
                    allow_redirects=False,
                )
            except requests.RequestException as exc:
                if self.cancel_event.is_set():
                    raise CancelledError("下载已停止。") from exc
                raise DownloaderError(
                    f"网络请求失败：{current_url}\n{exc}"
                ) from exc

            if response.status_code not in {301, 302, 303, 307, 308}:
                if urlparse(response.url).scheme.lower() != "https":
                    response.close()
                    raise DownloaderError("服务器尝试将请求降级到不安全的 HTTP。")
                return response

            location = response.headers.get("Location")
            response.close()
            if not location:
                raise DownloaderError(f"重定向响应缺少 Location：{current_url}")
            next_url = urljoin(current_url, location)
            if urlparse(next_url).scheme.lower() != "https":
                raise DownloaderError("服务器尝试将请求降级到不安全的 HTTP。")
            current_url = next_url

        raise DownloaderError(f"重定向次数过多：{url}")

    @staticmethod
    def _raise_for_status(response: requests.Response, url: str) -> None:
        if response.status_code == 509:
            raise DownloaderError("站点图片浏览额度已用尽（HTTP 509）。")
        try:
            response.raise_for_status()
        except requests.HTTPError as exc:
            raise DownloaderError(
                f"HTTP {response.status_code}：{url}"
            ) from exc

    @staticmethod
    def _check_site_page(html: str, url: str) -> None:
        lowered = html.lower()
        markers = (
            ("gallery not available", "画廊不可用或已删除。"),
            ("this gallery is currently unavailable", "画廊当前不可用。"),
            ("your ip address has been temporarily banned", "当前 IP 被站点临时限制。"),
            ("you are currently at your image limit", "站点图片浏览额度已用尽。"),
            ("sadpanda.jpg", "ExHentai 登录无效，请更新 cookies.txt。"),
        )
        for marker, message in markers:
            if marker in lowered:
                raise DownloaderError(f"{message}\n{url}")
        if "bounce_login.php" in response_path(url) or "/login" in response_path(url):
            raise DownloaderError("链接需要登录，请选择有效的 cookies.txt。")

    def _check_cancelled(self) -> None:
        if self.cancel_event.is_set():
            raise CancelledError("下载已停止。")

    def _emit(
        self,
        kind: str,
        message: str = "",
        current: int = 0,
        total: int = 0,
        detail: str = "",
        path: str = "",
        unit: str = "",
    ) -> None:
        self.callback(
            ProgressEvent(
                kind=kind,
                message=message,
                current=current,
                total=total,
                detail=detail,
                path=path,
                unit=unit,
            )
        )

    @staticmethod
    def _format_error(exc: Exception) -> str:
        if isinstance(exc, DownloaderError):
            return str(exc)
        return f"{type(exc).__name__}: {exc}"

    def _summary_message(self, summary: DownloadSummary) -> str:
        return (
            f"完成 {summary.galleries_completed}/{summary.galleries_total} 个项目；"
            f"新下载 {summary.files_downloaded} {self.file_unit}，"
            f"跳过 {summary.files_skipped} {self.file_unit}，"
            f"回退图片 {summary.files_fallback} 张，失败 {summary.files_failed} 项。"
        )


class GameBusDownloader(EHentaiDownloader):
    def __init__(
        self,
        options: DownloadOptions,
        callback: ProgressCallback | None = None,
        cancel_event: threading.Event | None = None,
        session_factory: SessionFactory | None = None,
    ) -> None:
        super().__init__(
            options=options,
            callback=callback,
            cancel_event=cancel_event,
            session_factory=session_factory,
        )
        self._chapter_expectations: dict[int, tuple[int, int]] = {}

    def _resolve_inputs(self, urls: Iterable[str]) -> list[str]:
        chapter_urls: list[str] = []
        seen: set[str] = set()
        for raw_url in urls:
            self._check_cancelled()
            url = validate_input_url(raw_url)
            if is_gamebus_chapter_url(url):
                discovered = [canonical_gamebus_chapter_url(url)]
            elif is_gamebus_comic_url(url):
                discovered = self._comic_chapter_urls(url)
            else:
                raise InvalidUrlError(
                    f"GameBus 下载器不支持此链接：{raw_url}"
                )
            for chapter_url in discovered:
                if chapter_url not in seen:
                    seen.add(chapter_url)
                    chapter_urls.append(chapter_url)
        return chapter_urls

    def _comic_chapter_urls(self, comic_url: str) -> list[str]:
        comic_url = canonical_gamebus_comic_url(comic_url)
        match = GAMEBUS_COMIC_PATH_RE.match(urlparse(comic_url).path)
        if not match:
            raise InvalidUrlError(f"无效的 GameBus 漫画链接：{comic_url}")
        comic_id = int(match.group("comic_id"))
        chapters = self._read_chapter_summaries(comic_id, comic_url)
        if not chapters:
            raise DownloaderError(f"GameBus 漫画 {comic_id} 没有可下载章节。")
        locked = [chapter for chapter in chapters if chapter.is_locked]
        if locked:
            self._emit(
                "warning",
                f"漫画包含 {len(locked)} 个锁定章节；这些章节会报告失败，"
                "不会被静默跳过。",
            )
        page_total = sum(chapter.page_count for chapter in chapters)
        self._emit(
            "log",
            f"GameBus 漫画 {comic_id}：发现 {len(chapters)} 章，"
            f"共 {page_total} 页。",
        )
        return [
            f"{GAMEBUS_BASE_URL}/chapter/{chapter.chapter_id}"
            for chapter in chapters
        ]

    def _read_chapter_summaries(
        self,
        comic_id: int,
        referer: str,
    ) -> tuple[GameBusChapterSummary, ...]:
        api_url = (
            f"{GAMEBUS_BASE_URL}/api/comic/chapters?"
            + urlencode({"comicId": comic_id})
        )
        self._emit("discovery", f"正在读取 GameBus 漫画 {comic_id} 的章节列表。")
        chapters = parse_gamebus_chapter_list(
            self._get_text(self._main_session, api_url, referer=referer)
        )
        for chapter in chapters:
            self._chapter_expectations[chapter.chapter_id] = (
                comic_id,
                chapter.page_count,
            )
        return chapters

    def _load_gallery(self, gallery_url: str) -> GalleryInfo:
        chapter_url = canonical_gamebus_chapter_url(gallery_url)
        match = GAMEBUS_CHAPTER_PATH_RE.match(urlparse(chapter_url).path)
        if not match:
            raise InvalidUrlError(f"无效的 GameBus 章节链接：{chapter_url}")
        chapter_id = int(match.group("chapter_id"))
        api_url = f"{GAMEBUS_BASE_URL}/api/comic/{chapter_id}/pages"
        parsed = parse_gamebus_chapter_response(
            self._get_text(self._main_session, api_url, referer=chapter_url),
            chapter_url,
        )
        expectation = self._chapter_expectations.get(chapter_id)
        if expectation is None:
            self._read_chapter_summaries(parsed.comic_id, chapter_url)
            expectation = self._chapter_expectations.get(chapter_id)
        if expectation is None:
            raise DownloaderError(
                f"GameBus 漫画 {parsed.comic_id} 的章节列表中"
                f"没有章节 {chapter_id}。"
            )
        expected_comic_id, expected_pages = expectation
        if parsed.comic_id != expected_comic_id:
            raise DownloaderError(
                f"GameBus 章节 {chapter_id} 的漫画 ID 不匹配："
                f"应为 {expected_comic_id}，返回 {parsed.comic_id}。"
            )
        if len(parsed.image_urls) != expected_pages:
            raise DownloaderError(
                f"GameBus 章节图片列表不完整：应有 {expected_pages} 页，"
                f"只返回 {len(parsed.image_urls)} 页。为避免生成残缺集合，"
                "本次未下载。"
            )
        gid = (
            f"gb-{parsed.comic_id}-"
            f"{parsed.order_index:04d}-{parsed.chapter_id}"
        )
        title = (
            f"{parsed.comic_title} - {parsed.order_index:03d} - "
            f"{parsed.chapter_title}"
        )
        return GalleryInfo(
            url=chapter_url,
            gid=gid,
            token="",
            title=title,
            page_urls=parsed.image_urls,
            direct_images=True,
            source_title=parsed.comic_title,
        )


class HuangGuoDownloader(EHentaiDownloader):
    progress_unit = "片段"
    file_unit = "集"

    def __init__(
        self,
        options: DownloadOptions,
        callback: ProgressCallback | None = None,
        cancel_event: threading.Event | None = None,
        session_factory: SessionFactory | None = None,
    ) -> None:
        super().__init__(
            options=options,
            callback=callback,
            cancel_event=cancel_event,
            session_factory=session_factory,
        )
        self._episodes: dict[str, VideoEpisodeInfo] = {}
        self._generations: dict[str, int] = {}
        self._refresh_lock = threading.Lock()
        self._keys: dict[str, bytes] = {}
        self._keys_lock = threading.Lock()
        self._ffmpeg_warned = False

    def _resolve_inputs(self, urls: Iterable[str]) -> list[str]:
        episode_urls: list[str] = []
        seen: set[str] = set()
        for raw_url in urls:
            self._check_cancelled()
            url = validate_input_url(raw_url)
            if not is_huangguo_video_url(url):
                raise InvalidUrlError(f"黄果短剧下载器不支持此链接：{raw_url}")
            for episode_url in self._series_episode_urls(url):
                if episode_url not in seen:
                    seen.add(episode_url)
                    episode_urls.append(episode_url)
        return episode_urls

    def _series_episode_urls(self, url: str) -> list[str]:
        page_url = canonical_huangguo_video_url(url)
        self._emit("discovery", f"正在读取黄果短剧选集：{page_url}")
        page = self._read_video_page(page_url, self._main_session)
        self._emit(
            "log",
            f"《{page.series_title}》：发现 {len(page.episodes)} 集，将逐集下载。",
        )
        return [episode.url for episode in page.episodes]

    def _read_video_page(
        self,
        episode_url: str,
        session: requests.Session,
    ) -> ParsedHuangGuoVideo:
        html = self._get_text(
            session,
            episode_url,
            referer=f"{HUANGGUO_BASE_URL}/",
        )
        return parse_huangguo_video_page(html, episode_url)

    def _load_episode(
        self,
        episode_url: str,
        session: requests.Session | None = None,
    ) -> VideoEpisodeInfo:
        session = session or self._main_session
        page = self._read_video_page(episode_url, session)
        playlist_url = page.playlist_url
        for _ in range(4):
            self._check_cancelled()
            playlist = parse_hls_playlist(
                self._get_text(session, playlist_url, referer=episode_url),
                playlist_url,
                context=f"《{page.series_title}》第 {page.episode} 集的播放列表",
            )
            if playlist.segments:
                return VideoEpisodeInfo(
                    video_id=page.video_id,
                    series_title=page.series_title,
                    episode=page.episode,
                    playlist_url=playlist_url,
                    segments=playlist.segments,
                )
            playlist_url = playlist.variant_urls[0]
        raise DownloaderError(
            f"《{page.series_title}》第 {page.episode} 集的播放列表嵌套过深。"
        )

    def _load_gallery(self, gallery_url: str) -> GalleryInfo:
        episode_url = canonical_huangguo_video_url(gallery_url)
        info = self._load_episode(episode_url)
        with self._refresh_lock:
            self._episodes[episode_url] = info
            self._generations[episode_url] = 0
        return GalleryInfo(
            url=episode_url,
            gid=f"hg-{info.video_id}-{info.episode:03d}",
            token="",
            title=f"{info.series_title} 第 {info.episode} 集",
            page_urls=tuple(segment.url for segment in info.segments),
            direct_images=True,
            source_title=info.series_title,
        )

    def _gallery_directory(self, gallery: GalleryInfo) -> Path:
        info = self._episodes.get(gallery.url)
        video_id = info.video_id if info else huangguo_video_id(gallery.url)
        series_title = info.series_title if info else gallery.title
        parent = video_source_directory(
            self.options.output_dir,
            gallery.source_url or gallery.url,
            gallery.source_title or series_title,
        )
        name = safe_name(
            f"{video_id} - {series_title}",
            fallback=str(video_id),
            limit=120,
        )
        return parent / name

    def _download_gallery(self, gallery: GalleryInfo) -> GalleryDownloadResult:
        info = self._episodes[gallery.url]
        directory = self._gallery_directory(gallery)
        directory.mkdir(parents=True, exist_ok=True)
        stem = safe_name(
            f"{info.episode:03d} - {info.series_title}",
            fallback=f"episode-{info.episode}",
            limit=110,
        )

        existing = self._existing_video(directory, stem)
        if existing:
            self._emit(
                "log",
                f"已存在，跳过：{existing.name}",
                path=str(existing),
            )
            return GalleryDownloadResult(
                files=(FileResult("skipped", existing, False),),
                failures=0,
            )

        parts_directory = directory / ".parts" / f"{info.episode:03d}"
        parts_directory.mkdir(parents=True, exist_ok=True)
        total = len(info.segments)
        futures: dict[Future[Path], int] = {}
        errors: list[tuple[int, Exception]] = []

        executor = ThreadPoolExecutor(
            max_workers=self.options.workers,
            thread_name_prefix="ehd-video",
        )
        try:
            for index in range(total):
                future = executor.submit(
                    self._download_segment,
                    gallery.url,
                    index,
                    parts_directory,
                )
                futures[future] = index

            completed = 0
            pending = set(futures)
            while pending:
                self._check_cancelled()
                completed_futures, pending = wait(
                    pending,
                    timeout=0.2,
                    return_when=FIRST_COMPLETED,
                )
                for future in completed_futures:
                    index = futures[future]
                    try:
                        future.result()
                    except CancelledError:
                        raise
                    except Exception as exc:
                        errors.append((index, exc))
                        self._emit(
                            "error",
                            f"{gallery.title} 第 {index + 1} 个片段失败："
                            f"{self._format_error(exc)}",
                        )
                    completed += 1
                    self._emit(
                        "gallery_progress",
                        gallery.title,
                        current=completed,
                        total=total,
                        unit=self.progress_unit,
                    )
        finally:
            if self.cancel_event.is_set():
                for future in futures:
                    future.cancel()
            executor.shutdown(
                wait=True,
                cancel_futures=self.cancel_event.is_set(),
            )

        self._check_cancelled()
        if errors:
            return GalleryDownloadResult(files=(), failures=len(errors))

        self._emit("log", f"正在合并 {total} 个片段：{gallery.title}")
        video_path = self._merge_segments(
            parts_directory,
            total,
            directory / f"{stem}.ts",
        )
        video_path = self._remux_to_mp4(video_path)
        self._cleanup_parts(parts_directory)
        self._emit("log", f"已保存视频：{video_path}", path=str(video_path))
        return GalleryDownloadResult(
            files=(FileResult("downloaded", video_path, False),),
            failures=0,
        )

    @staticmethod
    def _existing_video(directory: Path, stem: str) -> Path | None:
        for suffix in (".mp4", ".ts"):
            candidate = directory / f"{stem}{suffix}"
            if candidate.is_file() and candidate.stat().st_size:
                return candidate
        return None

    def _current_segment(
        self,
        episode_url: str,
        index: int,
    ) -> tuple[HlsSegment, int]:
        with self._refresh_lock:
            info = self._episodes[episode_url]
            generation = self._generations.get(episode_url, 0)
        return info.segments[index], generation

    def _refresh_episode(self, episode_url: str, seen_generation: int) -> bool:
        with self._refresh_lock:
            current = self._generations.get(episode_url, 0)
            if current != seen_generation:
                return True
            previous = self._episodes[episode_url]
            self._emit(
                "warning",
                f"《{previous.series_title}》第 {previous.episode} 集的分片地址"
                "可能已过期，正在重新获取播放列表。",
            )
            info = self._load_episode(episode_url, self._thread_session())
            if len(info.segments) != len(previous.segments):
                raise DownloaderError(
                    "刷新后的播放列表片段数量与之前不一致"
                    f"（{len(previous.segments)} -> {len(info.segments)}），"
                    "为避免生成残缺视频，本集未继续下载。"
                )
            self._episodes[episode_url] = info
            self._generations[episode_url] = current + 1
        return True

    def _download_segment(
        self,
        episode_url: str,
        index: int,
        parts_directory: Path,
    ) -> Path:
        self._check_cancelled()
        target = parts_directory / f"{index:05d}.ts"
        if target.is_file() and target.stat().st_size:
            return target

        session = self._thread_session()
        attempts = 2
        for attempt in range(attempts):
            segment, generation = self._current_segment(episode_url, index)
            try:
                return self._fetch_segment(session, segment, target)
            except CancelledError:
                raise
            except DownloaderError:
                if attempt + 1 >= attempts:
                    raise
                self._refresh_episode(episode_url, generation)
        raise DownloaderError(f"视频片段 {index + 1} 下载失败。")

    def _fetch_segment(
        self,
        session: requests.Session,
        segment: HlsSegment,
        target: Path,
    ) -> Path:
        referer = f"{HUANGGUO_BASE_URL}/"
        response = self._get(
            session,
            segment.url,
            referer=referer,
            stream=True,
            rate_limit=False,
        )
        payload = bytearray()
        try:
            self._raise_for_status(response, segment.url)
            for chunk in response.iter_content(chunk_size=256 * 1024):
                self._check_cancelled()
                if chunk:
                    payload.extend(chunk)
        except requests.RequestException as exc:
            if self.cancel_event.is_set():
                raise CancelledError("下载已停止。") from exc
            raise DownloaderError(f"视频片段传输失败：{segment.url}\n{exc}") from exc
        finally:
            response.close()

        if not payload:
            raise DownloaderError(f"视频片段响应为空：{segment.url}")

        data = bytes(payload)
        if segment.key_url:
            key = self._segment_key(session, segment.key_url, referer)
            iv = segment.key_iv or segment.sequence.to_bytes(16, "big")
            data = decrypt_hls_segment(data, key, iv)

        part_path = target.with_name(target.name + ".part")
        completed = False
        try:
            part_path.write_bytes(data)
            os.replace(part_path, target)
            completed = True
        finally:
            if not completed:
                part_path.unlink(missing_ok=True)
        return target

    def _segment_key(
        self,
        session: requests.Session,
        key_url: str,
        referer: str,
    ) -> bytes:
        with self._keys_lock:
            cached = self._keys.get(key_url)
        if cached is not None:
            return cached

        response = self._get(session, key_url, referer=referer)
        try:
            self._raise_for_status(response, key_url)
            key = response.content
        finally:
            response.close()
        if len(key) != 16:
            raise DownloaderError(
                f"AES-128 密钥长度无效（{len(key)} 字节）：{key_url}"
            )
        with self._keys_lock:
            self._keys[key_url] = key
        return key

    def _merge_segments(
        self,
        parts_directory: Path,
        total: int,
        target: Path,
    ) -> Path:
        part_path = target.with_name(target.name + ".part")
        completed = False
        try:
            with part_path.open("wb") as output:
                for index in range(total):
                    self._check_cancelled()
                    source = parts_directory / f"{index:05d}.ts"
                    if not source.is_file() or not source.stat().st_size:
                        raise DownloaderError(
                            f"缺少视频片段 {index + 1}/{total}，无法合并。"
                        )
                    with source.open("rb") as chunk_file:
                        shutil.copyfileobj(chunk_file, output, 1024 * 1024)
            if not part_path.stat().st_size:
                raise DownloaderError("合并后的视频文件为空。")
            os.replace(part_path, target)
            completed = True
        finally:
            if not completed:
                part_path.unlink(missing_ok=True)
        return target

    def _remux_to_mp4(self, source: Path) -> Path:
        if not self.options.video_remux_to_mp4:
            return source

        ffmpeg = shutil.which("ffmpeg")
        if not ffmpeg:
            if not self._ffmpeg_warned:
                self._ffmpeg_warned = True
                self._emit(
                    "warning",
                    "未找到 ffmpeg，视频保留为 .ts 格式；"
                    "安装 ffmpeg 后重新下载可自动转封装为 MP4。",
                )
            return source

        self._check_cancelled()
        target = source.with_suffix(".mp4")
        part_path = target.with_name(target.name + ".part")
        command = [
            ffmpeg,
            "-hide_banner",
            "-nostdin",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            "-bsf:a",
            "aac_adtstoasc",
            "-f",
            "mp4",
            str(part_path),
        ]
        extra: dict[str, object] = {}
        if os.name == "nt":
            extra["creationflags"] = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=3600,
                **extra,
            )
        except (OSError, subprocess.SubprocessError) as exc:
            part_path.unlink(missing_ok=True)
            self._emit("warning", f"ffmpeg 转封装失败，保留 .ts 文件：{exc}")
            return source

        if (
            result.returncode != 0
            or not part_path.is_file()
            or not part_path.stat().st_size
        ):
            part_path.unlink(missing_ok=True)
            detail = (result.stderr or result.stdout or "").strip().splitlines()
            self._emit(
                "warning",
                "ffmpeg 转封装失败，保留 .ts 文件："
                + (detail[-1] if detail else f"退出码 {result.returncode}"),
            )
            return source

        os.replace(part_path, target)
        source.unlink(missing_ok=True)
        return target

    def _cleanup_parts(self, parts_directory: Path) -> None:
        shutil.rmtree(parts_directory, ignore_errors=True)
        parent = parts_directory.parent
        try:
            if parent.is_dir() and not any(parent.iterdir()):
                parent.rmdir()
        except OSError:
            pass


def response_path(url: str) -> str:
    return urlparse(url).path.lower()