from __future__ import annotations

import json
import os
import threading
import time
import uuid
from dataclasses import asdict, dataclass, replace
from pathlib import Path
from typing import BinaryIO, Iterable

from .downloader import InvalidUrlError, validate_input_url


PENDING = "pending"
DOWNLOADING = "downloading"
COMPLETED = "completed"
FAILED = "failed"
VALID_STATUSES = {PENDING, DOWNLOADING, COMPLETED, FAILED}


class QueueStoreError(RuntimeError):
    """Raised when the persisted download queue cannot be read or written."""


class InstanceLockError(RuntimeError):
    """Raised when another GUI instance already owns the queue."""


class SingleInstanceLock:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._file: BinaryIO | None = None
        self._acquire()

    def _acquire(self) -> None:
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            lock_file = self.path.open("a+b")
            if lock_file.seek(0, os.SEEK_END) == 0:
                lock_file.write(b"\0")
                lock_file.flush()
            lock_file.seek(0)
            if os.name == "nt":
                import msvcrt

                msvcrt.locking(lock_file.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl

                fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except (OSError, ImportError) as exc:
            try:
                lock_file.close()
            except (NameError, OSError):
                pass
            raise InstanceLockError(
                "下载器已经打开。请使用现有窗口，避免队列被重复修改。"
            ) from exc
        self._file = lock_file

    def close(self) -> None:
        lock_file = self._file
        if lock_file is None:
            return
        self._file = None
        try:
            lock_file.seek(0)
            if os.name == "nt":
                import msvcrt

                msvcrt.locking(lock_file.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl

                fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
        finally:
            lock_file.close()


@dataclass
class QueueItem:
    id: str
    url: str
    status: str = PENDING
    message: str = ""
    created_at: float = 0.0

    def copy(self) -> QueueItem:
        return replace(self)


class DownloadQueue:
    def __init__(self, items: Iterable[QueueItem] = ()) -> None:
        self._items = list(items)
        self._lock = threading.RLock()

    def snapshot(self) -> tuple[QueueItem, ...]:
        with self._lock:
            return tuple(item.copy() for item in self._items)

    def add(self, urls: Iterable[str]) -> tuple[QueueItem, ...]:
        added: list[QueueItem] = []
        with self._lock:
            active_urls = {
                item.url
                for item in self._items
                if item.status in {PENDING, DOWNLOADING}
            }
            for raw_url in urls:
                url = validate_input_url(raw_url)
                if url in active_urls:
                    continue
                item = QueueItem(
                    id=uuid.uuid4().hex,
                    url=url,
                    created_at=time.time(),
                )
                self._items.append(item)
                active_urls.add(url)
                added.append(item.copy())
        return tuple(added)

    def next_pending(self) -> QueueItem | None:
        with self._lock:
            for item in self._items:
                if item.status == PENDING:
                    item.status = DOWNLOADING
                    item.message = "正在处理"
                    return item.copy()
        return None

    def set_status(self, item_id: str, status: str, message: str = "") -> QueueItem:
        if status not in VALID_STATUSES:
            raise ValueError(f"invalid queue status: {status}")
        with self._lock:
            item = self._find(item_id)
            item.status = status
            item.message = message
            return item.copy()

    def retry(self, item_ids: Iterable[str]) -> int:
        selected = set(item_ids)
        count = 0
        with self._lock:
            for item in self._items:
                if item.id in selected and item.status == FAILED:
                    item.status = PENDING
                    item.message = ""
                    count += 1
        return count

    def remove(self, item_ids: Iterable[str]) -> int:
        selected = set(item_ids)
        with self._lock:
            before = len(self._items)
            self._items = [
                item
                for item in self._items
                if item.id not in selected or item.status == DOWNLOADING
            ]
            return before - len(self._items)

    def clear_finished(self) -> int:
        with self._lock:
            before = len(self._items)
            self._items = [
                item
                for item in self._items
                if item.status not in {COMPLETED, FAILED}
            ]
            return before - len(self._items)

    def clear_pending(self) -> int:
        with self._lock:
            before = len(self._items)
            self._items = [item for item in self._items if item.status != PENDING]
            return before - len(self._items)

    def has_pending(self) -> bool:
        with self._lock:
            return any(item.status == PENDING for item in self._items)

    def counts(self) -> dict[str, int]:
        counts = {status: 0 for status in VALID_STATUSES}
        with self._lock:
            for item in self._items:
                counts[item.status] += 1
        return counts

    def to_payload(self) -> dict[str, object]:
        with self._lock:
            return {
                "version": 1,
                "items": [asdict(item) for item in self._items],
            }

    @classmethod
    def from_payload(cls, payload: object) -> DownloadQueue:
        if not isinstance(payload, dict) or payload.get("version") != 1:
            raise QueueStoreError("队列文件版本无效。")
        raw_items = payload.get("items")
        if not isinstance(raw_items, list):
            raise QueueStoreError("队列文件缺少任务列表。")

        items: list[QueueItem] = []
        seen_ids: set[str] = set()
        for raw in raw_items:
            if not isinstance(raw, dict):
                raise QueueStoreError("队列任务格式无效。")
            try:
                item_id = str(raw["id"])
                url = validate_input_url(str(raw["url"]))
                status = str(raw.get("status", PENDING))
                message = str(raw.get("message", ""))
                created_at = float(raw.get("created_at", 0.0))
            except (InvalidUrlError, KeyError, TypeError, ValueError) as exc:
                raise QueueStoreError("队列任务内容无效。") from exc
            if not item_id or item_id in seen_ids or status not in VALID_STATUSES:
                raise QueueStoreError("队列任务标识或状态无效。")
            seen_ids.add(item_id)
            if status == DOWNLOADING:
                status = PENDING
                message = "上次运行中断，等待继续"
            items.append(
                QueueItem(
                    id=item_id,
                    url=url,
                    status=status,
                    message=message,
                    created_at=created_at,
                )
            )
        return cls(items)

    def _find(self, item_id: str) -> QueueItem:
        for item in self._items:
            if item.id == item_id:
                return item
        raise KeyError(item_id)


class QueueStore:
    def __init__(self, path: Path) -> None:
        self.path = path

    def load(self) -> DownloadQueue:
        if not self.path.exists():
            return DownloadQueue()
        try:
            payload = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            raise QueueStoreError(f"无法读取下载队列：{exc}") from exc
        return DownloadQueue.from_payload(payload)

    def backup_corrupt(self) -> Path:
        if not self.path.exists():
            raise QueueStoreError("下载队列文件不存在，无法备份。")
        backup_path = self.path.with_name(
            f"{self.path.name}.corrupt-{time.strftime('%Y%m%d-%H%M%S')}"
            f"-{uuid.uuid4().hex[:8]}"
        )
        try:
            os.replace(self.path, backup_path)
        except OSError as exc:
            raise QueueStoreError(f"无法备份损坏的下载队列：{exc}") from exc
        return backup_path

    def save(self, download_queue: DownloadQueue) -> None:
        temp_path = self.path.with_name(
            f"{self.path.name}.{os.getpid()}.{uuid.uuid4().hex}.tmp"
        )
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            temp_path.write_text(
                json.dumps(
                    download_queue.to_payload(),
                    ensure_ascii=False,
                    indent=2,
                ),
                encoding="utf-8",
            )
            os.replace(temp_path, self.path)
        except OSError as exc:
            temp_path.unlink(missing_ok=True)
            raise QueueStoreError(f"无法保存下载队列：{exc}") from exc
