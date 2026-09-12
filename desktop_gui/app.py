from __future__ import annotations

import json
import os
import queue
import threading
import tkinter as tk
from dataclasses import replace
from pathlib import Path
from tkinter import filedialog, messagebox, scrolledtext, ttk

from .downloader import (
    CancelledError,
    DownloadOptions,
    DownloadSummary,
    EHentaiDownloader,
    GameBusDownloader,
    HuangGuoDownloader,
    InvalidUrlError,
    ProgressEvent,
    is_direct_download_url,
    is_gamebus_url,
    is_huangguo_video_url,
    parse_input_urls,
)
from .output_layout import migrate_legacy_output, migrate_source_folders_to_titles
from .x_downloader import XVideoDownloader
from .x_urls import is_x_video_url
from .queue_model import (
    COMPLETED,
    DOWNLOADING,
    FAILED,
    PENDING,
    DownloadQueue,
    InstanceLockError,
    QueueStore,
    QueueStoreError,
    SingleInstanceLock,
)


APP_NAME = "漫画 / 黄果短剧 / X 视频 批量下载器"


def _settings_path() -> Path:
    root = Path(os.environ.get("APPDATA", Path.home()))
    return root / "E-Hentai-Downloader" / "gui-settings.json"


def _queue_path() -> Path:
    return _settings_path().with_name("download-queue.json")


def _downloader_class_for_url(url: str) -> type[EHentaiDownloader]:
    if is_x_video_url(url):
        return XVideoDownloader
    if is_huangguo_video_url(url):
        return HuangGuoDownloader
    return GameBusDownloader if is_gamebus_url(url) else EHentaiDownloader


class DownloaderApp:
    def __init__(
        self,
        root: tk.Tk,
        auto_start_queue: bool = False,
    ) -> None:
        self.root = root
        self.root.title(APP_NAME)
        self.root.geometry("1000x760")
        self.root.minsize(820, 620)
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

        self.instance_lock = SingleInstanceLock(
            _settings_path().with_name("gui.lock")
        )
        self.events: queue.Queue[ProgressEvent] = queue.Queue()
        self.queue_store = QueueStore(_queue_path())
        self.queue_load_error = ""
        try:
            self.download_queue = self.queue_store.load()
        except QueueStoreError as exc:
            try:
                backup_path = self.queue_store.backup_corrupt()
            except QueueStoreError as backup_exc:
                self.instance_lock.close()
                raise QueueStoreError(
                    f"{exc}\n{backup_exc}\n为避免覆盖原文件，程序未启动。"
                ) from backup_exc
            self.download_queue = DownloadQueue()
            self.queue_load_error = (
                f"{exc}\n损坏的队列已备份到：{backup_path}"
            )
        self.queue_stop_event = threading.Event()
        self.queue_worker: threading.Thread | None = None
        self.downloader: EHentaiDownloader | None = None
        self.queue_running = False
        self.closing = False
        self.settings = self._load_settings()

        default_output = Path.home() / "Downloads" / "E-Hentai"
        self.output_var = tk.StringVar(
            value=self.settings.get("output_dir", str(default_output))
        )
        self.cookies_var = tk.StringVar(value=self.settings.get("cookies_file", ""))
        self.workers_var = tk.IntVar(value=int(self.settings.get("workers", 2)))
        self.cbz_var = tk.BooleanVar(value=bool(self.settings.get("create_cbz", True)))
        self.fallback_var = tk.BooleanVar(
            value=bool(self.settings.get("fallback_to_resized", True))
        )
        self.convert_jpeg_var = tk.BooleanVar(
            value=bool(self.settings.get("convert_webp_to_jpeg", False))
        )
        self.video_mp4_var = tk.BooleanVar(
            value=bool(self.settings.get("video_remux_to_mp4", True))
        )
        self.collection_limit_var = tk.StringVar(
            value=str(self.settings.get("collection_page_limit", 0))
        )
        self.status_var = tk.StringVar(value="就绪")
        self.gallery_var = tk.StringVar(value="尚未开始")
        self.queue_count_var = tk.StringVar(value="")
        try:
            migration = migrate_legacy_output(
                Path(self.output_var.get()).expanduser(),
                (item.url for item in self.download_queue.snapshot()),
            )
            title_migration = migrate_source_folders_to_titles(
                Path(self.output_var.get()).expanduser(),
            )
        except OSError as exc:
            self.instance_lock.close()
            raise QueueStoreError(
                f"无法重新归类旧下载文件：\n{exc}"
            ) from exc
        self.layout_migration_message = ""
        messages: list[str] = []
        if migration.moved_items:
            messages.append(
                f"已重新归类旧文件：{migration.image_directories} 个图片目录、"
                f"{migration.archives} 个 CBZ。"
            )
        if title_migration.moved_items:
            messages.append(
                f"已按标题重命名来源目录：移动 "
                f"{title_migration.image_directories} 个目录、"
                f"{title_migration.archives} 个文件。"
            )
        self.layout_migration_message = "\n".join(messages)

        self._configure_style()
        self._build_ui()
        self._refresh_queue()
        if self.queue_load_error:
            self._append_log(self.queue_load_error + "\n", "error")
        if self.layout_migration_message:
            self._append_log(self.layout_migration_message + "\n", "success")
        self.root.after(100, self._poll_events)
        if auto_start_queue and self.download_queue.has_pending():
            self.root.after(250, self._start_queue)

    def _configure_style(self) -> None:
        style = ttk.Style(self.root)
        if "vista" in style.theme_names():
            style.theme_use("vista")
        style.configure("Title.TLabel", font=("Microsoft YaHei UI", 17, "bold"))
        style.configure("Hint.TLabel", foreground="#555555")
        style.configure("Warning.TLabel", foreground="#9a5b00")
        style.configure("Accent.TButton", font=("Microsoft YaHei UI", 10, "bold"))

    def _build_ui(self) -> None:
        container = ttk.Frame(self.root, padding=16)
        container.pack(fill=tk.BOTH, expand=True)
        container.columnconfigure(0, weight=1)
        container.rowconfigure(7, weight=1)

        ttk.Label(container, text=APP_NAME, style="Title.TLabel").grid(
            row=0, column=0, sticky=tk.W
        )
        ttk.Label(
            container,
            text=(
                "支持 E-Hentai 画廊、搜索、标签、收藏夹、图片页，"
                "H漫画章节，GameBus 整部漫画或章节，"
                "黄果短剧整部剧集，以及 X/Twitter 推文视频链接；每行一个。"
            ),
            style="Hint.TLabel",
        ).grid(row=1, column=0, sticky=tk.W, pady=(2, 10))

        input_frame = ttk.LabelFrame(container, text="添加链接", padding=8)
        input_frame.grid(row=2, column=0, sticky=tk.EW)
        input_frame.columnconfigure(0, weight=1)
        self.url_text = scrolledtext.ScrolledText(
            input_frame,
            height=3,
            wrap=tk.WORD,
            font=("Consolas", 10),
            undo=True,
        )
        self.url_text.grid(row=0, column=0, sticky=tk.EW)
        self.url_text.bind("<Control-Return>", self._add_to_queue)
        self.add_button = ttk.Button(
            input_frame,
            text="加入队列",
            style="Accent.TButton",
            command=self._add_to_queue,
        )
        self.add_button.grid(row=0, column=1, sticky=tk.NS, padx=(8, 0))
        ttk.Label(
            input_frame,
            text="下载过程中仍可继续加入；Ctrl+Enter 也可添加。",
            style="Hint.TLabel",
        ).grid(row=1, column=0, columnspan=2, sticky=tk.W, pady=(4, 0))

        queue_frame = ttk.LabelFrame(container, text="下载队列", padding=8)
        queue_frame.grid(row=3, column=0, sticky=tk.NSEW, pady=(10, 0))
        queue_frame.columnconfigure(0, weight=1)
        queue_frame.rowconfigure(0, weight=1)
        self.queue_tree = ttk.Treeview(
            queue_frame,
            columns=("status", "url", "message"),
            show="headings",
            height=7,
            selectmode="extended",
        )
        self.queue_tree.heading("status", text="状态")
        self.queue_tree.heading("url", text="链接")
        self.queue_tree.heading("message", text="结果")
        self.queue_tree.column("status", width=80, minwidth=70, stretch=False)
        self.queue_tree.column("url", width=520, minwidth=250)
        self.queue_tree.column("message", width=260, minwidth=140)
        self.queue_tree.tag_configure(PENDING, foreground="#555555")
        self.queue_tree.tag_configure(DOWNLOADING, foreground="#005fb8")
        self.queue_tree.tag_configure(COMPLETED, foreground="#18733c")
        self.queue_tree.tag_configure(FAILED, foreground="#b00020")
        self.queue_tree.grid(row=0, column=0, sticky=tk.NSEW)
        queue_scrollbar = ttk.Scrollbar(
            queue_frame,
            orient=tk.VERTICAL,
            command=self.queue_tree.yview,
        )
        queue_scrollbar.grid(row=0, column=1, sticky=tk.NS)
        self.queue_tree.configure(yscrollcommand=queue_scrollbar.set)

        queue_actions = ttk.Frame(queue_frame)
        queue_actions.grid(row=1, column=0, columnspan=2, sticky=tk.EW, pady=(7, 0))
        queue_actions.columnconfigure(6, weight=1)
        ttk.Button(
            queue_actions,
            text="删除选中",
            command=self._remove_selected,
        ).grid(row=0, column=0)
        ttk.Button(
            queue_actions,
            text="重试选中",
            command=self._retry_selected,
        ).grid(row=0, column=1, padx=(6, 0))
        ttk.Button(
            queue_actions,
            text="清除已结束",
            command=self._clear_finished,
        ).grid(row=0, column=2, padx=(6, 0))
        ttk.Button(
            queue_actions,
            text="清空等待",
            command=self._clear_pending,
        ).grid(row=0, column=3, padx=(6, 0))
        ttk.Label(
            queue_actions,
            textvariable=self.queue_count_var,
            style="Hint.TLabel",
        ).grid(row=0, column=6, sticky=tk.E)

        destination = ttk.LabelFrame(container, text="保存与登录", padding=8)
        destination.grid(row=4, column=0, sticky=tk.EW, pady=(10, 0))
        destination.columnconfigure(1, weight=1)
        ttk.Label(destination, text="输出根目录").grid(
            row=0, column=0, sticky=tk.W, padx=(0, 8)
        )
        self.output_entry = ttk.Entry(destination, textvariable=self.output_var)
        self.output_entry.grid(
            row=0, column=1, sticky=tk.EW
        )
        self.output_button = ttk.Button(
            destination,
            text="选择...",
            command=self._choose_output,
        )
        self.output_button.grid(
            row=0, column=2, padx=(8, 0)
        )
        ttk.Button(destination, text="打开", command=self._open_output).grid(
            row=0, column=3, padx=(6, 0)
        )

        ttk.Label(
            destination,
            text="图片、CBZ 与视频按作品标题保存到 JPG\\标题、CBZ\\标题 和 VIDEO\\标题 目录。",
            style="Hint.TLabel",
        ).grid(row=1, column=1, columnspan=3, sticky=tk.W, pady=(3, 0))

        ttk.Label(destination, text="cookies.txt").grid(
            row=2, column=0, sticky=tk.W, padx=(0, 8), pady=(8, 0)
        )
        self.cookies_entry = ttk.Entry(destination, textvariable=self.cookies_var)
        self.cookies_entry.grid(
            row=2, column=1, sticky=tk.EW, pady=(8, 0)
        )
        self.cookies_button = ttk.Button(
            destination,
            text="选择...",
            command=self._choose_cookies,
        )
        self.cookies_button.grid(
            row=2, column=2, padx=(8, 0), pady=(8, 0)
        )
        ttk.Label(
            destination,
            text="ExHentai、私有收藏夹或账号画质设置需要 Netscape 格式 Cookie。",
            style="Hint.TLabel",
        ).grid(row=3, column=1, columnspan=3, sticky=tk.W, pady=(3, 0))

        options = ttk.LabelFrame(container, text="选项", padding=8)
        options.grid(row=5, column=0, sticky=tk.EW, pady=(10, 0))
        ttk.Label(options, text="并发数").grid(row=0, column=0, sticky=tk.W)
        self.workers_input = ttk.Spinbox(
            options,
            from_=1,
            to=4,
            width=4,
            textvariable=self.workers_var,
        )
        self.workers_input.grid(row=0, column=1, sticky=tk.W, padx=(6, 18))
        ttk.Label(options, text="集合最多扫描页数").grid(
            row=0, column=2, sticky=tk.W
        )
        self.collection_limit_input = ttk.Entry(
            options,
            width=7,
            textvariable=self.collection_limit_var,
        )
        self.collection_limit_input.grid(
            row=0, column=3, sticky=tk.W, padx=(6, 4)
        )
        ttk.Label(options, text="0 = 全部", style="Hint.TLabel").grid(
            row=0, column=4, sticky=tk.W, padx=(0, 18)
        )
        self.cbz_input = ttk.Checkbutton(
            options,
            text="同时生成 CBZ",
            variable=self.cbz_var,
        )
        self.cbz_input.grid(row=0, column=5, sticky=tk.W, padx=(0, 18))
        self.fallback_input = ttk.Checkbutton(
            options,
            text="原图不可用时使用当前最高可用图",
            variable=self.fallback_var,
        )
        self.fallback_input.grid(row=0, column=6, sticky=tk.W)
        self.convert_jpeg_input = ttk.Checkbutton(
            options,
            text="将 WebP 转为高质量 JPG（兼容漫画阅读器）",
            variable=self.convert_jpeg_var,
        )
        self.convert_jpeg_input.grid(
            row=1,
            column=5,
            columnspan=2,
            sticky=tk.W,
            pady=(8, 0),
        )
        self.video_mp4_input = ttk.Checkbutton(
            options,
            text="黄果视频合并后转封装为 MP4（需要 ffmpeg，否则保留 .ts）",
            variable=self.video_mp4_var,
        )
        self.video_mp4_input.grid(
            row=2,
            column=5,
            columnspan=2,
            sticky=tk.W,
            pady=(8, 0),
        )

        controls = ttk.Frame(container)
        controls.grid(row=6, column=0, sticky=tk.EW, pady=(10, 0))
        controls.columnconfigure(2, weight=1)
        self.start_button = ttk.Button(
            controls,
            text="开始队列",
            style="Accent.TButton",
            command=self._start_queue,
        )
        self.start_button.grid(row=0, column=0)
        self.stop_button = ttk.Button(
            controls,
            text="停止队列",
            command=self._stop_queue,
            state=tk.DISABLED,
        )
        self.stop_button.grid(row=0, column=1, padx=(8, 0))
        ttk.Label(
            controls,
            text="E-Hentai 原图可能消耗图片额度或 GP，请遵守站点规则并控制并发。",
            style="Warning.TLabel",
        ).grid(row=0, column=2, sticky=tk.E, padx=(12, 0))

        progress_frame = ttk.LabelFrame(container, text="进度", padding=8)
        progress_frame.grid(row=7, column=0, sticky=tk.NSEW, pady=(10, 0))
        progress_frame.columnconfigure(0, weight=1)
        progress_frame.rowconfigure(4, weight=1)
        ttk.Label(progress_frame, textvariable=self.gallery_var).grid(
            row=0, column=0, sticky=tk.W
        )
        self.progress = ttk.Progressbar(progress_frame, mode="determinate")
        self.progress.grid(row=1, column=0, sticky=tk.EW, pady=(6, 2))
        ttk.Label(progress_frame, textvariable=self.status_var).grid(
            row=2, column=0, sticky=tk.W
        )
        ttk.Separator(progress_frame).grid(
            row=3, column=0, sticky=tk.EW, pady=(8, 6)
        )
        self.log = scrolledtext.ScrolledText(
            progress_frame,
            height=12,
            wrap=tk.WORD,
            font=("Consolas", 9),
            state=tk.DISABLED,
        )
        self.log.grid(row=4, column=0, sticky=tk.NSEW)
        self.log.tag_configure("warning", foreground="#9a5b00")
        self.log.tag_configure("error", foreground="#b00020")
        self.log.tag_configure("success", foreground="#18733c")
        self.run_locked_widgets = (
            self.output_entry,
            self.output_button,
            self.cookies_entry,
            self.cookies_button,
            self.workers_input,
            self.collection_limit_input,
            self.cbz_input,
            self.fallback_input,
            self.convert_jpeg_input,
            self.video_mp4_input,
        )

    def _add_to_queue(self, event: tk.Event | None = None) -> str | None:
        try:
            urls = parse_input_urls(self.url_text.get("1.0", tk.END))
            collection_limit = int(self.collection_limit_var.get().strip() or "0")
            if collection_limit < 0:
                raise ValueError("集合页数不能为负数。")
        except (InvalidUrlError, ValueError) as exc:
            messagebox.showerror("输入有误", str(exc), parent=self.root)
            return "break" if event else None

        if collection_limit == 0 and any(
            not is_direct_download_url(url) for url in urls
        ):
            confirmed = messagebox.askyesno(
                "确认加入集合链接",
                "输入中包含列表、搜索、收藏夹或图片页链接。\n\n"
                "处理列表链接时会持续扫描“下一页”，直到全部画廊都被发现。"
                "确定加入队列吗？",
                parent=self.root,
            )
            if not confirmed:
                return "break" if event else None

        added = self.download_queue.add(urls)
        if not added:
            self.status_var.set("这些链接已在等待或下载中。")
            return "break" if event else None

        self.url_text.delete("1.0", tk.END)
        self._persist_and_refresh_queue()
        self.status_var.set(f"已加入 {len(added)} 个任务。")
        if self.queue_running:
            self._append_log(f"下载中追加 {len(added)} 个队列任务。\n")
        return "break" if event else None

    def _read_options(self) -> DownloadOptions:
        output_text = self.output_var.get().strip()
        if not output_text:
            raise ValueError("请选择输出目录。")
        output_dir = Path(output_text).expanduser()
        cookies_text = self.cookies_var.get().strip()
        cookies_file = Path(cookies_text).expanduser() if cookies_text else None
        if cookies_file and not cookies_file.is_file():
            raise ValueError("cookies.txt 文件不存在。")
        workers = int(self.workers_var.get())
        collection_limit = int(self.collection_limit_var.get().strip() or "0")
        if not 1 <= workers <= 4:
            raise ValueError("并发数必须在 1 到 4 之间。")
        if collection_limit < 0:
            raise ValueError("集合页数不能为负数。")
        try:
            output_dir.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            raise ValueError(f"无法创建输出目录：{exc}") from exc
        return DownloadOptions(
            output_dir=output_dir,
            cookies_file=cookies_file,
            workers=workers,
            create_cbz=self.cbz_var.get(),
            fallback_to_resized=self.fallback_var.get(),
            convert_webp_to_jpeg=self.convert_jpeg_var.get(),
            collection_page_limit=collection_limit,
            video_remux_to_mp4=self.video_mp4_var.get(),
        )

    def _start_queue(self) -> None:
        if self.queue_running:
            return
        if not self.download_queue.has_pending():
            self.status_var.set("队列中没有等待任务。")
            return
        try:
            options = self._read_options()
        except ValueError as exc:
            messagebox.showerror("设置有误", str(exc), parent=self.root)
            return

        settings_error = self._save_settings()
        if settings_error:
            self._append_log(
                f"警告：无法保存 GUI 设置：{settings_error}\n",
                "warning",
            )
        self.queue_stop_event = threading.Event()
        self.queue_running = True
        self._set_running_state(True)
        self.progress.configure(value=0, maximum=1)
        self.gallery_var.set("正在读取下一个队列任务...")
        self.status_var.set("队列已启动")
        self._append_log("\n队列开始运行。\n", "success")

        self.queue_worker = threading.Thread(
            target=self._run_queue,
            args=(options, self.queue_stop_event),
            name="ehd-queue",
            daemon=True,
        )
        self.queue_worker.start()

    def _run_queue(
        self,
        options: DownloadOptions,
        stop_event: threading.Event,
    ) -> None:
        finish_reason = "empty"
        try:
            while not stop_event.is_set():
                item = self.download_queue.next_pending()
                if item is None:
                    break
                self.events.put(
                    ProgressEvent(
                        "queue_job_started",
                        item.url,
                        job_id=item.id,
                    )
                )

                def forward(event: ProgressEvent) -> None:
                    self.events.put(replace(event, job_id=item.id))

                try:
                    downloader_class = _downloader_class_for_url(item.url)
                    self.downloader = downloader_class(
                        options=options,
                        callback=forward,
                        cancel_event=stop_event,
                    )
                    summary = self.downloader.run([item.url])
                except CancelledError:
                    self.download_queue.set_status(
                        item.id,
                        PENDING,
                        "已停止，等待继续",
                    )
                    self.events.put(
                        ProgressEvent(
                            "queue_job_changed",
                            "任务已停止，保留在队列中。",
                            detail=PENDING,
                            job_id=item.id,
                        )
                    )
                    finish_reason = "stopped"
                    break
                except Exception as exc:
                    if stop_event.is_set():
                        self.download_queue.set_status(
                            item.id,
                            PENDING,
                            "已停止，等待继续",
                        )
                        self.events.put(
                            ProgressEvent(
                                "queue_job_changed",
                                "任务已停止，保留在队列中。",
                                detail=PENDING,
                                job_id=item.id,
                            )
                        )
                        finish_reason = "stopped"
                        break
                    self.download_queue.set_status(item.id, FAILED, str(exc))
                    self.events.put(
                        ProgressEvent(
                            "queue_job_changed",
                            str(exc),
                            detail=FAILED,
                            job_id=item.id,
                        )
                    )
                else:
                    summary_text = self._summary_text(summary)
                    if (
                        summary.galleries_total > 0
                        and summary.galleries_completed == summary.galleries_total
                        and summary.files_failed == 0
                    ):
                        status = COMPLETED
                    else:
                        status = FAILED
                    self.download_queue.set_status(item.id, status, summary_text)
                    self.events.put(
                        ProgressEvent(
                            "queue_job_changed",
                            summary_text,
                            detail=status,
                            job_id=item.id,
                        )
                    )
                finally:
                    self.downloader = None

            if stop_event.is_set():
                finish_reason = "stopped"
        except Exception as exc:
            finish_reason = "error"
            self.events.put(ProgressEvent("fatal", str(exc)))
        finally:
            self.events.put(
                ProgressEvent("queue_worker_finished", detail=finish_reason)
            )

    @staticmethod
    def _summary_text(summary: DownloadSummary) -> str:
        return (
            f"项目 {summary.galleries_completed}/{summary.galleries_total}；"
            f"新下载 {summary.files_downloaded}，跳过 {summary.files_skipped}，"
            f"失败 {summary.files_failed}"
        )

    def _stop_queue(self) -> None:
        if not self.queue_running:
            return
        self.queue_stop_event.set()
        if self.downloader:
            self.downloader.cancel()
        self.stop_button.configure(state=tk.DISABLED)
        self.status_var.set("正在停止当前任务...")
        self._append_log("正在停止；当前任务会回到等待队列。\n", "warning")

    def _selected_queue_ids(self) -> tuple[str, ...]:
        return tuple(self.queue_tree.selection())

    def _remove_selected(self) -> None:
        selected = self._selected_queue_ids()
        if not selected:
            self.status_var.set("请先选择队列任务。")
            return
        removed = self.download_queue.remove(selected)
        self._persist_and_refresh_queue()
        if removed < len(selected):
            self.status_var.set("已删除可移除任务；当前下载任务不能删除。")
        else:
            self.status_var.set(f"已删除 {removed} 个任务。")

    def _retry_selected(self) -> None:
        selected = self._selected_queue_ids()
        if not selected:
            self.status_var.set("请先选择失败任务。")
            return
        retried = self.download_queue.retry(selected)
        self._persist_and_refresh_queue()
        self.status_var.set(f"已将 {retried} 个失败任务放回等待队列。")

    def _clear_finished(self) -> None:
        removed = self.download_queue.clear_finished()
        self._persist_and_refresh_queue()
        self.status_var.set(f"已清除 {removed} 个已结束任务。")

    def _clear_pending(self) -> None:
        counts = self.download_queue.counts()
        if not counts[PENDING]:
            self.status_var.set("没有等待任务。")
            return
        confirmed = messagebox.askyesno(
            "清空等待任务",
            f"确定删除 {counts[PENDING]} 个等待任务吗？",
            parent=self.root,
        )
        if not confirmed:
            return
        removed = self.download_queue.clear_pending()
        self._persist_and_refresh_queue()
        self.status_var.set(f"已清空 {removed} 个等待任务。")

    def _handle_event(self, event: ProgressEvent) -> None:
        if event.kind == "queue_job_started":
            self._persist_and_refresh_queue()
            self.gallery_var.set(f"队列任务：{event.message}")
            self.status_var.set("正在解析链接...")
            self._append_log(f"\n开始任务：{event.message}\n")
        elif event.kind == "queue_job_changed":
            self._persist_and_refresh_queue()
            if event.detail == COMPLETED:
                self._append_log(f"任务完成：{event.message}\n", "success")
            elif event.detail == FAILED:
                self._append_log(f"任务失败：{event.message}\n", "error")
            else:
                self._append_log(event.message + "\n", "warning")
        elif event.kind == "queue_worker_finished":
            self.queue_running = False
            self.downloader = None
            self._persist_and_refresh_queue()
            self._set_running_state(False)
            if event.detail == "stopped" or self.queue_stop_event.is_set():
                self.gallery_var.set("队列已停止")
                self.status_var.set("等待任务已保留，可再次开始。")
            elif event.detail == "error":
                self.gallery_var.set("队列异常停止")
            elif self.download_queue.has_pending():
                self._append_log("检测到刚加入的任务，继续运行队列。\n")
                self._start_queue()
            else:
                self.gallery_var.set("队列处理完毕")
                self.status_var.set("队列中没有等待任务。")
                self._append_log("队列处理完毕。\n", "success")
        elif event.kind == "discovery":
            self.status_var.set(event.message)
            self._append_log(event.message + "\n")
        elif event.kind == "plan":
            self.status_var.set(event.message)
            self._append_log(event.message + "\n", "success")
        elif event.kind == "gallery_start":
            pages = max(1, int(event.detail or "1"))
            unit = event.unit or "页"
            self.gallery_var.set(
                f"项目 {event.current}/{event.total}：{event.message}"
            )
            self.progress.configure(maximum=pages, value=0)
            self.status_var.set(f"0/{pages} {unit}")
            self._append_log(
                f"\n[{event.current}/{event.total}] {event.message}"
                f"（{pages} {unit}）\n"
            )
        elif event.kind == "gallery_progress":
            self.progress.configure(maximum=max(1, event.total), value=event.current)
            self.status_var.set(
                f"{event.current}/{event.total} {event.unit or '页'}"
            )
        elif event.kind == "gallery_done":
            self._append_log(f"完成：{event.message}\n", "success")
        elif event.kind == "warning":
            self._append_log("警告：" + event.message + "\n", "warning")
        elif event.kind == "error":
            self._append_log("错误：" + event.message + "\n", "error")
        elif event.kind == "log":
            self._append_log(event.message + "\n")
        elif event.kind == "done":
            self.status_var.set(event.message)
            self._append_log(event.message + "\n", "success")
        elif event.kind == "cancelled":
            self.status_var.set(event.message)
        elif event.kind == "fatal":
            self.gallery_var.set("任务失败")
            self.status_var.set(event.message)
            self._append_log("致命错误：" + event.message + "\n", "error")
            messagebox.showerror("下载失败", event.message, parent=self.root)

    def _poll_events(self) -> None:
        try:
            while True:
                self._handle_event(self.events.get_nowait())
        except queue.Empty:
            pass
        self.root.after(100, self._poll_events)

    def _set_running_state(self, running: bool) -> None:
        start_state = (
            tk.DISABLED
            if running or not self.download_queue.has_pending()
            else tk.NORMAL
        )
        self.start_button.configure(state=start_state)
        self.stop_button.configure(state=tk.NORMAL if running else tk.DISABLED)
        for widget in self.run_locked_widgets:
            widget.configure(state=tk.DISABLED if running else tk.NORMAL)

    def _refresh_queue(self) -> None:
        selected = set(self.queue_tree.selection())
        for item_id in self.queue_tree.get_children():
            self.queue_tree.delete(item_id)

        labels = {
            PENDING: "等待中",
            DOWNLOADING: "下载中",
            COMPLETED: "已完成",
            FAILED: "失败",
        }
        for item in self.download_queue.snapshot():
            self.queue_tree.insert(
                "",
                tk.END,
                iid=item.id,
                values=(labels[item.status], item.url, item.message),
                tags=(item.status,),
            )
            if item.id in selected:
                self.queue_tree.selection_add(item.id)

        counts = self.download_queue.counts()
        self.queue_count_var.set(
            f"等待 {counts[PENDING]} · 下载 {counts[DOWNLOADING]} · "
            f"完成 {counts[COMPLETED]} · 失败 {counts[FAILED]}"
        )
        if hasattr(self, "start_button"):
            self._set_running_state(self.queue_running)

    def _persist_queue(self) -> str:
        try:
            self.queue_store.save(self.download_queue)
        except QueueStoreError as exc:
            return str(exc)
        return ""

    def _persist_and_refresh_queue(self) -> None:
        error = self._persist_queue()
        self._refresh_queue()
        if error:
            self._append_log(error + "\n", "error")

    def _choose_output(self) -> None:
        selected = filedialog.askdirectory(
            title="选择输出目录",
            initialdir=self.output_var.get() or str(Path.home()),
            parent=self.root,
        )
        if selected:
            self.output_var.set(selected)

    def _choose_cookies(self) -> None:
        selected = filedialog.askopenfilename(
            title="选择 Netscape cookies.txt",
            filetypes=(("Cookie 文件", "*.txt"), ("所有文件", "*.*")),
            parent=self.root,
        )
        if selected:
            self.cookies_var.set(selected)

    def _open_output(self) -> None:
        path = Path(self.output_var.get()).expanduser()
        try:
            path.mkdir(parents=True, exist_ok=True)
            os.startfile(path)
        except OSError as exc:
            messagebox.showerror("无法打开目录", str(exc), parent=self.root)

    def _append_log(self, text: str, tag: str | None = None) -> None:
        self.log.configure(state=tk.NORMAL)
        self.log.insert(tk.END, text, tag)
        self.log.see(tk.END)
        self.log.configure(state=tk.DISABLED)

    def _clear_log(self) -> None:
        self.log.configure(state=tk.NORMAL)
        self.log.delete("1.0", tk.END)
        self.log.configure(state=tk.DISABLED)

    def _load_settings(self) -> dict[str, object]:
        path = _settings_path()
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError, TypeError):
            return {}

    def _save_settings(self) -> str:
        path = _settings_path()
        data = {
            "output_dir": self.output_var.get(),
            "cookies_file": self.cookies_var.get(),
            "workers": self.workers_var.get(),
            "create_cbz": self.cbz_var.get(),
            "fallback_to_resized": self.fallback_var.get(),
            "convert_webp_to_jpeg": self.convert_jpeg_var.get(),
            "collection_page_limit": self.collection_limit_var.get(),
            "video_remux_to_mp4": self.video_mp4_var.get(),
        }
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except OSError as exc:
            return str(exc)
        return ""

    def _on_close(self) -> None:
        if self.closing:
            return
        if self.queue_running:
            confirmed = messagebox.askyesno(
                "退出",
                "队列仍在下载。确定停止并退出吗？等待任务会保留。",
                parent=self.root,
            )
            if not confirmed:
                return
        queue_error = self._persist_queue()
        if queue_error:
            messagebox.showerror("无法保存队列", queue_error, parent=self.root)
            return
        if self.queue_running:
            self.closing = True
            self._stop_queue()
            self.status_var.set("正在停止下载并安全退出...")
            self.root.after(100, self._finish_close)
            return
        self.instance_lock.close()
        self.root.destroy()

    def _finish_close(self) -> None:
        if self.queue_running:
            self.root.after(100, self._finish_close)
            return
        queue_error = self._persist_queue()
        if queue_error:
            self.closing = False
            messagebox.showerror("无法保存队列", queue_error, parent=self.root)
            return
        self.instance_lock.close()
        self.root.destroy()


def run(auto_start_queue: bool = False) -> None:
    root = tk.Tk()
    try:
        DownloaderApp(root, auto_start_queue=auto_start_queue)
    except (InstanceLockError, QueueStoreError) as exc:
        root.withdraw()
        messagebox.showerror(APP_NAME, str(exc), parent=root)
        root.destroy()
        return
    root.mainloop()
