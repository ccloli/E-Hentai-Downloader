# E-Hentai Downloader Desktop

A standalone Chinese Windows desktop GUI for downloading comics and videos.
The browser userscript, bundled JavaScript libraries, and userscript build files
have been removed. No browser extension is required.

## Run

1. Install [Python 3.10+](https://www.python.org/downloads/) with Tcl/Tk enabled.
2. Double-click `run-gui.bat`. It creates `.venv` and installs missing dependencies
   or updates an outdated yt-dlp using `requirements.txt`.
3. Paste links (one per line), click **加入队列**, choose an output directory, and
   click **开始队列**.
4. When login is required, export your authorized browser session as a
   Netscape-format `cookies.txt` and select it in the GUI. Never share this file.

More links can be added while downloading. Pending jobs survive restarts, failed
jobs can be retried, and stopping returns the current task to the waiting queue.
Existing complete files are skipped when the task is run again.

## Supported links

| Source | Supported input |
| --- | --- |
| E-Hentai / ExHentai | Gallery, search, tag, favorites, and image-page links |
| H-Manhua | Chapter links, e.g. `https://a.h-manhua.org/manga/comic/qingluan/1/` |
| GameBus | Whole comic: `https://gamebus001.com/comic/1186`; chapter: `https://gamebus001.com/chapter/2552` |
| Huangguo | Whole series from `https://huangguoai.com/video/117/` or any episode link such as `https://huangguoai.com/video/117/ep-5/` |
| X / Twitter | A status link downloads its embedded videos; a `/video/N` link downloads only the specified video |

### X / Twitter videos

Paste a link such as
`https://x.com/0xCodila/status/2098182800482390216/video/1` into the existing queue.
`twitter.com`, mobile links, and `i/web/status` links are also supported.
Tracking query parameters are removed and equivalent host/username variants are
deduplicated. A status link and a numbered video link remain distinct queue jobs
because their download scopes differ.

Video extraction uses [yt-dlp](https://github.com/yt-dlp/yt-dlp), preferring the
highest-quality available direct MP4 stream, with other combined video formats as
a fallback. Downloads stream to disk and retain `.part` files for resuming.
Unavailable HLS fragments cause failure rather than silently producing an
incomplete video. The Huangguo MP4 option does not affect X downloads.

Only embedded, non-live videos are supported: profiles, search, Spaces, external
video cards, and link-only posts are not accepted as video downloads. Private,
deleted, login-gated, or rate-limited posts may fail with an error in the GUI;
valid cookies can help only if your account already has access. Exported cookies
are read without rewriting the source file. This does not bypass access controls.

If X changes its API, update the extractor from the repository directory:

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade yt-dlp
```

### Comics and Huangguo series

The downloader prefers each E-Hentai page's **Download original** link. If it is
unavailable, the optional fallback uses the highest-resolution image exposed by
the page. List links follow **Next** until the list ends; set a collection page
limit when you do not want the entire result set.

H-Manhua uses the full-resolution images listed on chapter pages. GameBus uses
the site's original `image_path` files. Concrete comic/chapter links are required
so list pages cannot accidentally queue an entire site. Optional high-quality
WebP-to-JPEG conversion also converts existing WebP pages on resumed jobs before
CBZ packaging.

Huangguo downloads all episodes listed on the play page. It reads AES-128 HLS
playlists, downloads and decrypts segments in parallel, and merges each episode.
Partial segments remain in `.parts` for resuming; expired segment URLs are
refreshed automatically. With `ffmpeg` on `PATH`, the optional MP4 setting remuxes
merged episodes; otherwise playable `.ts` files are retained.

## Output

Images, archives, and videos use separate parent trees named after work titles:

```text
<output>\JPG\<title>\<gallery-or-chapter>\...
<output>\CBZ\<title>\<gallery-or-chapter>.cbz
<output>\VIDEO\<title>\<series>\<episode>.mp4
<output>\VIDEO\<title>\x-<status-id>\x-<media-id>.mp4
```

A GameBus comic keeps its chapters under one comic title; Huangguo episodes share
their series title. Inner names include source IDs to avoid overwriting works
with the same title. If a title is unavailable, a URL-derived name is used.

On upgrade, recognized legacy flat folders and archives are moved into this
layout, and URL-named source folders are renamed to titles. Migrations preserve
conflicts: identical duplicates are dropped and differing files are retained
under a `.legacy-N` suffix.

## Development

```powershell
.\.venv\Scripts\python.exe -m desktop_gui --check
.\.venv\Scripts\python.exe -m unittest discover -s tests
```

The GUI source is in `desktop_gui`; `run-gui.bat` is the desktop launcher, not a
browser userscript.

## Notice

Download only content you are authorized to save and follow each site's rules.
Original-image requests can consume image quota or GP; automated requests may
trigger throttling or account restrictions. Keep concurrency low. This is an
unofficial tool and is provided at your own risk.
