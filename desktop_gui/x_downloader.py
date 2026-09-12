from __future__ import annotations

import html
import re
from pathlib import Path
from typing import Any, Iterable

from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

from .downloader import (
    DownloaderError,
    ComicDownloader,
    FileResult,
    GalleryDownloadResult,
    GalleryInfo,
    InvalidUrlError,
    safe_name,
    validate_input_url,
)
from .output_layout import video_source_directory
from .x_urls import is_x_video_url, x_status_parts


class _Logger:
    def __init__(self, downloader: XVideoDownloader) -> None:
        self.downloader = downloader

    def debug(self, message: str) -> None:
        self.downloader._check_cancelled()
        if not message.startswith("[debug]"):
            self.downloader._emit("log", message)

    def warning(self, message: str) -> None:
        self.downloader._emit("warning", message)

    def error(self, message: str) -> None:
        self.downloader._emit("error", message)


class XVideoDownloader(ComicDownloader):
    progress_unit = "视频"
    file_unit = "个视频"

    def _youtube_dl(self, **overrides: Any) -> YoutubeDL:
        options = {
            "logger": _Logger(self),
            "quiet": True,
            "noprogress": True,
            "noplaylist": True,
            "ignoreerrors": False,
            "socket_timeout": self.options.timeout,
            "retries": self.options.retries,
            "fragment_retries": self.options.retries,
            "extractor_retries": self.options.retries,
            "concurrent_fragment_downloads": self.options.workers,
            "skip_unavailable_fragments": False,
            "continuedl": True,
            "overwrites": False,
            # Prefer a complete MP4 stream without requiring an external muxer.
            "format": "best[ext=mp4][protocol=https]/best[ext=mp4]/best",
            "hls_prefer_native": True,
            "fixup": "warn",
            **overrides,
        }
        ydl = YoutubeDL(options)
        # Import in memory; yt-dlp must not rewrite the user's exported cookies.
        for cookie in self._main_session.cookies:
            ydl.cookiejar.set_cookie(cookie)
        return ydl

    def _resolve_inputs(self, urls: Iterable[str]) -> list[str]:
        result: list[str] = []
        for raw_url in urls:
            self._check_cancelled()
            url = validate_input_url(raw_url)
            if not is_x_video_url(url):
                raise InvalidUrlError(f"X 视频下载器不支持此链接：{raw_url}")
            if url not in result:
                result.append(url)
        return result

    def _load_gallery(self, gallery_url: str) -> GalleryInfo:
        self._emit("discovery", f"正在解析 X/Twitter 视频：{gallery_url}")
        try:
            with self._youtube_dl() as ydl:
                # Do not follow external cards/links or other extractors.
                info = ydl.extract_info(
                    gallery_url, download=False, process=False, ie_key="Twitter"
                )
        except DownloadError as exc:
            self._check_cancelled()
            raise DownloaderError(
                "无法解析 X 视频。推文可能不可用、需要登录或触发站点限流。"
                "可在 GUI 中选择有访问权限的 Netscape cookies.txt 后重试；"
                f"也可更新 yt-dlp。\n{exc}"
            ) from exc
        self._check_cancelled()
        if not isinstance(info, dict):
            raise DownloaderError("X 未返回有效的视频信息。")
        entries = (
            list(info.get("entries") or ())
            if info.get("_type") in {"playlist", "multi_video"}
            else [info]
        )
        if not entries or any(
            not isinstance(entry, dict)
            or entry.get("_type", "video") != "video"
            or not entry.get("formats")
            or not entry.get("id")
            or entry.get("is_live")
            for entry in entries
        ):
            raise DownloaderError(
                "推文中没有可下载的内嵌视频，或包含不支持的外站视频/直播。"
            )
        parts = x_status_parts(gallery_url)
        if parts is None:
            raise InvalidUrlError(f"无效的 X 推文链接：{gallery_url}")
        self._video_entries = entries
        title = html.unescape(str(
            info.get("title") or entries[0].get("title") or parts[0]
        ))
        if parts[1]:
            title = re.sub(r" #\d+$", "", title)
        return GalleryInfo(
            url=gallery_url,
            gid=f"x-{parts[0]}",
            token="",
            title=title,
            source_title=title,
            page_urls=tuple(str(entry["id"]) for entry in entries),
            direct_images=True,
        )

    def _gallery_directory(self, gallery: GalleryInfo) -> Path:
        return video_source_directory(
            self.options.output_dir,
            gallery.source_url or gallery.url,
            gallery.source_title,
        ) / gallery.gid

    def _download_gallery(self, gallery: GalleryInfo) -> GalleryDownloadResult:
        directory = self._gallery_directory(gallery)
        directory.mkdir(parents=True, exist_ok=True)
        results: list[FileResult] = []
        failures = 0
        for index, entry in enumerate(self._video_entries, 1):
            self._check_cancelled()
            stem = f"x-{safe_name(str(entry['id']), limit=60)}"
            existing: set[Path] = set()
            for path in directory.glob(f"{stem}.*"):
                if path.is_file() and path.suffix.lower() in {
                    ".mp4", ".webm", ".mkv", ".ts",
                }:
                    if path.stat().st_size:
                        existing.add(path.resolve())
                    else:
                        path.unlink()
            completed: list[Path] = []

            def finished(filename: str) -> None:
                self._check_cancelled()
                path = Path(filename)
                if not path.is_file() or path.stat().st_size == 0:
                    raise DownloaderError("视频下载未生成完整文件。")
                completed.append(path)

            def progress(data: dict[str, Any]) -> None:
                self._check_cancelled()
                if data.get("status") == "downloading":
                    downloaded = data.get("downloaded_bytes") or 0
                    total = data.get("total_bytes") or data.get("total_bytes_estimate")
                    if total:
                        self._emit(
                            "gallery_progress",
                            current=min(99, int(downloaded * 100 / total)),
                            total=100,
                            unit=f"%（视频 {index}/{len(self._video_entries)}）",
                        )

            try:
                with self._youtube_dl(
                    # Escape literal percent signs in user-selected directories.
                    outtmpl=str(directory / stem).replace("%", "%%") + ".%(ext)s",
                    progress_hooks=[progress],
                    post_hooks=[finished],
                ) as ydl:
                    ydl.process_ie_result(dict(entry), download=True)
            except DownloadError as exc:
                self._check_cancelled()
                failures += 1
                self._emit(
                    "error",
                    "X 视频下载失败；已保留 .part 文件，可重试继续下载。\n"
                    f"{exc}",
                )
                continue
            self._check_cancelled()
            if not completed:
                failures += 1
                self._emit("error", "X 视频没有保存成功，任务未标记为完成。")
                continue
            for path in completed:
                status = "skipped" if path.resolve() in existing else "downloaded"
                results.append(FileResult(status, path, False))
                self._emit(
                    "log",
                    f"{'已存在，跳过' if status == 'skipped' else '已保存视频'}：{path}",
                    path=str(path),
                )
            self._emit(
                "gallery_progress",
                current=index,
                total=len(self._video_entries),
                unit=self.progress_unit,
            )
        return GalleryDownloadResult(files=tuple(results), failures=failures)
