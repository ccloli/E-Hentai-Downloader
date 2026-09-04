from __future__ import annotations

import hashlib
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import unquote, urlparse


JPG_ROOT_NAME = "JPG"
CBZ_ROOT_NAME = "CBZ"
VIDEO_ROOT_NAME = "VIDEO"

_GAMEBUS_COMIC_RE = re.compile(r"^/comic/(?P<id>\d+)/?$", re.IGNORECASE)
_GAMEBUS_CHAPTER_RE = re.compile(r"^/chapter/(?P<id>\d+)/?$", re.IGNORECASE)
_HUANGGUO_VIDEO_RE = re.compile(
    r"^/video/(?P<id>\d+)(?:/ep-(?P<episode>\d+))?/?$",
    re.IGNORECASE,
)
_EH_GALLERY_RE = re.compile(
    r"^/g/(?P<gid>\d+)/(?P<token>[0-9a-f]{10})(?:/|$)",
    re.IGNORECASE,
)
_EH_IMAGE_RE = re.compile(
    r"^/s/[0-9a-f]{10}/(?P<gid>\d+)-(?P<page>\d+)(?:/|$)",
    re.IGNORECASE,
)
_H_MANHUA_RE = re.compile(
    r"^/manga/comic/(?P<slug>[\w.%~-]+)/(?P<chapter>[\w.%~-]+)/?$",
    re.IGNORECASE,
)
_LEGACY_GAMEBUS_RE = re.compile(
    r"^gb-(?P<comic>\d+)-\d+-(?P<chapter>\d+)\s+-\s+",
    re.IGNORECASE,
)
_LEGACY_EH_RE = re.compile(r"^(?P<gid>\d+)\s+-\s+")
_LEGACY_H_MANHUA_RE = re.compile(
    r"^hm-(?P<slug>.+)-(?P<chapter>[^-]+)\s+-\s+",
    re.IGNORECASE,
)
_INVALID_COMPONENT_RE = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


@dataclass(frozen=True)
class MigrationItem:
    source: Path
    destination: Path
    kind: str


@dataclass
class MigrationSummary:
    image_directories: int = 0
    archives: int = 0
    merged_directories: int = 0
    duplicate_files: int = 0
    renamed_conflicts: int = 0

    @property
    def moved_items(self) -> int:
        return self.image_directories + self.archives


def source_folder_name(url: str) -> str:
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower().rstrip(".")
    path = parsed.path or "/"
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:12]

    if hostname in {"gamebus001.com", "www.gamebus001.com"}:
        comic = _GAMEBUS_COMIC_RE.match(path)
        if comic:
            return f"gamebus-comic-{comic.group('id')}"
        chapter = _GAMEBUS_CHAPTER_RE.match(path)
        if chapter:
            return f"gamebus-chapter-{chapter.group('id')}"

    if hostname in {"huangguoai.com", "www.huangguoai.com"}:
        video = _HUANGGUO_VIDEO_RE.match(path)
        if video:
            return f"huangguo-video-{video.group('id')}"

    if hostname.endswith("e-hentai.org") or hostname.endswith("exhentai.org"):
        site = "exhentai" if hostname.endswith("exhentai.org") else "e-hentai"
        gallery = _EH_GALLERY_RE.match(path)
        if gallery:
            return (
                f"{site}-gallery-{gallery.group('gid')}-"
                f"{gallery.group('token').lower()}"
            )
        image = _EH_IMAGE_RE.match(path)
        if image:
            return (
                f"{site}-image-{image.group('gid')}-"
                f"{image.group('page')}-{digest[:8]}"
            )
        if path.rstrip("/").lower() == "/favorites.php":
            return f"{site}-favorites-{digest}"
        if path.lower().startswith("/tag/"):
            return f"{site}-tag-{digest}"
        return f"{site}-collection-{digest}"

    if hostname == "h-manhua.org" or hostname.endswith(".h-manhua.org"):
        chapter = _H_MANHUA_RE.match(path)
        if chapter:
            slug = _safe_component(unquote(chapter.group("slug")), "manga", 45)
            index = _safe_component(
                unquote(chapter.group("chapter")),
                "chapter",
                25,
            )
            return f"h-manhua-{slug}-{index}-{digest[:8]}"

    host = _safe_component(hostname, "source", 40)
    return f"{host}-url-{digest}"


def image_source_directory(output_dir: Path, source_url: str) -> Path:
    return output_dir / JPG_ROOT_NAME / source_folder_name(source_url)


def cbz_source_directory(output_dir: Path, source_url: str) -> Path:
    return output_dir / CBZ_ROOT_NAME / source_folder_name(source_url)


def video_source_directory(output_dir: Path, source_url: str) -> Path:
    return output_dir / VIDEO_ROOT_NAME / source_folder_name(source_url)


def plan_legacy_migration(
    output_dir: Path,
    source_urls: Iterable[str],
) -> tuple[MigrationItem, ...]:
    if not output_dir.is_dir():
        return ()

    mappings = _legacy_mappings(source_urls)
    planned: list[MigrationItem] = []
    for source in sorted(output_dir.iterdir(), key=lambda path: path.name.lower()):
        if source.name in {JPG_ROOT_NAME, CBZ_ROOT_NAME, VIDEO_ROOT_NAME}:
            continue
        if source.is_dir():
            folder = _legacy_source_folder(source.name, mappings)
            if folder:
                planned.append(
                    MigrationItem(
                        source=source,
                        destination=output_dir
                        / JPG_ROOT_NAME
                        / folder
                        / source.name,
                        kind="images",
                    )
                )
            continue
        if not source.is_file():
            continue
        base_name = _archive_base_name(source.name)
        if base_name is None:
            continue
        folder = _legacy_source_folder(base_name, mappings)
        if folder:
            planned.append(
                MigrationItem(
                    source=source,
                    destination=output_dir
                    / CBZ_ROOT_NAME
                    / folder
                    / source.name,
                    kind="archive",
                )
            )
    return tuple(planned)


def migrate_legacy_output(
    output_dir: Path,
    source_urls: Iterable[str],
) -> MigrationSummary:
    summary = MigrationSummary()
    for item in plan_legacy_migration(output_dir, source_urls):
        try:
            _move_preserving_conflicts(item.source, item.destination, summary)
        except OSError as exc:
            raise OSError(
                f"Could not migrate {item.source} to {item.destination}: {exc}"
            ) from exc
        if item.kind == "images":
            summary.image_directories += 1
        else:
            summary.archives += 1
    return summary


def _legacy_mappings(
    source_urls: Iterable[str],
) -> dict[str, dict[str, str]]:
    mappings: dict[str, dict[str, str]] = {
        "gamebus_comic": {},
        "gamebus_chapter": {},
        "eh_gallery": {},
        "h_manhua": {},
    }
    for url in source_urls:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower().rstrip(".")
        folder = source_folder_name(url)
        if hostname in {"gamebus001.com", "www.gamebus001.com"}:
            comic = _GAMEBUS_COMIC_RE.match(parsed.path)
            if comic:
                mappings["gamebus_comic"][comic.group("id")] = folder
            chapter = _GAMEBUS_CHAPTER_RE.match(parsed.path)
            if chapter:
                mappings["gamebus_chapter"][chapter.group("id")] = folder
        elif hostname.endswith("e-hentai.org") or hostname.endswith("exhentai.org"):
            gallery = _EH_GALLERY_RE.match(parsed.path)
            if gallery:
                mappings["eh_gallery"][gallery.group("gid")] = folder
        elif hostname == "h-manhua.org" or hostname.endswith(".h-manhua.org"):
            chapter = _H_MANHUA_RE.match(parsed.path)
            if chapter:
                key = (
                    unquote(chapter.group("slug")).lower(),
                    unquote(chapter.group("chapter")).lower(),
                )
                mappings["h_manhua"]["\0".join(key)] = folder
    return mappings


def _legacy_source_folder(
    name: str,
    mappings: dict[str, dict[str, str]],
) -> str | None:
    gamebus = _LEGACY_GAMEBUS_RE.match(name)
    if gamebus:
        comic_id = gamebus.group("comic")
        chapter_id = gamebus.group("chapter")
        return (
            mappings["gamebus_comic"].get(comic_id)
            or mappings["gamebus_chapter"].get(chapter_id)
            or f"gamebus-comic-{comic_id}"
        )

    ehentai = _LEGACY_EH_RE.match(name)
    if ehentai:
        gid = ehentai.group("gid")
        return mappings["eh_gallery"].get(gid) or f"e-hentai-gallery-{gid}-legacy"

    h_manhua = _LEGACY_H_MANHUA_RE.match(name)
    if h_manhua:
        key = "\0".join(
            (
                h_manhua.group("slug").lower(),
                h_manhua.group("chapter").lower(),
            )
        )
        return mappings["h_manhua"].get(key) or (
            "h-manhua-"
            + _safe_component(h_manhua.group("slug"), "manga", 45)
            + "-"
            + _safe_component(h_manhua.group("chapter"), "chapter", 25)
            + "-legacy"
        )
    return None


def _archive_base_name(name: str) -> str | None:
    lowered = name.lower()
    if lowered.endswith(".cbz.part"):
        return name[:-9]
    if lowered.endswith(".cbz"):
        return name[:-4]
    return None


def _move_preserving_conflicts(
    source: Path,
    destination: Path,
    summary: MigrationSummary,
) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists():
        os.replace(source, destination)
        return

    if source.is_dir() and destination.is_dir():
        for child in tuple(source.iterdir()):
            _move_preserving_conflicts(
                child,
                destination / child.name,
                summary,
            )
        source.rmdir()
        summary.merged_directories += 1
        return

    if source.is_file() and destination.is_file() and _files_equal(
        source,
        destination,
    ):
        source.unlink()
        summary.duplicate_files += 1
        return

    conflict_path = _next_conflict_path(destination)
    os.replace(source, conflict_path)
    summary.renamed_conflicts += 1


def _files_equal(first: Path, second: Path) -> bool:
    if first.stat().st_size != second.stat().st_size:
        return False
    with first.open("rb") as first_file, second.open("rb") as second_file:
        while True:
            first_chunk = first_file.read(1024 * 1024)
            second_chunk = second_file.read(1024 * 1024)
            if first_chunk != second_chunk:
                return False
            if not first_chunk:
                return True


def _next_conflict_path(path: Path) -> Path:
    suffixes = "".join(path.suffixes)
    stem = path.name[: -len(suffixes)] if suffixes else path.name
    for index in range(1, 10_000):
        candidate = path.with_name(f"{stem}.legacy-{index}{suffixes}")
        if not candidate.exists():
            return candidate
    raise OSError(f"Too many migration conflicts for {path}")


def _safe_component(value: str, fallback: str, limit: int) -> str:
    value = _INVALID_COMPONENT_RE.sub("_", value)
    value = re.sub(r"\s+", " ", value).strip(" .")
    if not value:
        value = fallback
    return value[:limit].rstrip(" .") or fallback
