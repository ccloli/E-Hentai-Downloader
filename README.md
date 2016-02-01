# E-Hentai-Downloader

Download E-Hentai archive as zip file :package:


## Required Environment

- Firefox > [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) 3.2 beta2+
- Chrome > [Tampermonkey](http://tampermonkey.net/) 3.5.3630+
- Opera 15+ > [Tampermonkey BETA](https://addons.opera.com/extensions/details/tampermonkey-beta/) 3.5.3630+ | [Violentmonkey](https://addons.opera.com/extensions/details/violent-monkey/) (not sure which version)
- Maxthon > [Violentmonkey](http://extension.maxthon.cn/detail/index.php?view_id=1680) (not sure which version)
- Safari > [Tampermonkey](http://tampermonkey.net/?browser=safari) 3.5.3630+


## Install This Script

- [Download from GitHub](https://github.com/ccloli/E-Hentai-Downloader/raw/master/e-hentai-downloader.user.js)
- [Download from GreasyFork](https://sleazyfork.org/scripts/10379-e-hentai-downloader)


## How To Use

1. Open E-Hentai Gallery
2. Find your interested gallery
3. Click "Download Archive" in E-Hentai Downloader box
4. Have a cup of coffee :coffee:
5. Save the Zip file

![E-Hentai Downloader box](https://cloud.githubusercontent.com/assets/8115912/10636596/56c9073c-7833-11e5-9161-c2c9f1a288a7.png)

Tips:
* Check "Number Images" to number download images
* Set "Pages Range" to choose pages you want to download
* More personalized options can be found on "Settings"


## How It Works

This script won't download archive from E-Hentai archive download page, so it won't spend your GPs or credits. It will fetch all the pages of the gallery and get their images' URL. Then script will use `GM_xmlhttpRequest` API (in order to cross origin) to download them. After that, it will package them to a Zip file with [JSZip](https://github.com/Stuk/jszip) and give it to you with [FileSaver.js](https://github.com/eligrey/FileSaver.js).


## Should Be Noticed

- If you are using the latest Tampermonkey Beta, or received a warning of "A userscript wants to access a cross-origin resource" from Tampermonkey, please allow and turn off "@connect-src mode" at setting page. For more info, [see details here](https://github.com/ccloli/E-Hentai-Downloader/wiki/Cross-origin-request-warning-from-Tampermonkey)
- Dolphin Browser doesn't support blob URL, so this script cannot be run in Tampermonkey for Dolphin
- ViolentMonkey doesn't support timeout, final URL and download progress
- Opera 12- doesn't support blob URL, and if generated as data URL, it may crash, so we won't support it
- TrixIE (for IE) is too old and its `GM_xhr` cannot handle large content, so we won't support it
- Single-thread download mode is removed in 1.18, if you need it, roll back to [old version](https://github.com/ccloli/E-Hentai-Downloader/releases/tag/v1.17.4)
- You can also have a look at [E-Hentai Image Viewing Limits](https://github.com/ccloli/E-Hentai-Downloader/wiki/E%E2%88%92Hentai-Image-Viewing-Limits)
- Most of archive may have a torrent download. You can download archive with torrent to get stable download experience, get bonus content (most in cosplay gallery), earn GP and credit, and reduce the pressure of E-Hentai original servers (though it's a P2P site)


## Warning And Limitation

### Memory Usage

The script will store all the contents in RAM, not in HDD. This will increase the memory usage of current tab process. So if you don't have enough RAM, or the archive is too large (see file size limit section), please pay attention to your memory usage, or try other download tools.

### Browser Developer Tools

To record running progress, script will output some logs into console (Press F12 --> Console). If you find a bug, you can copy them and paste them here. But noticed, keep opening developer tools may increase memory usage and reduce running efficiency. So don't open console only if you want to see the output logs.

### File Size Limit

_(This part is a bit long, you can just read the table and italic text)_

Different browsers have different maximum file size limits. Here is a table to show the maximum size the supported browser can handle.

| Browser                      | Maximum Size |
| ---------------------------- | ------------ |
| Chrome                       | 500 MB       |
| Chrome (with File System)    | 1 GB *       |
| Firefox                      | 800 MB +     |
| Opera 15+                    | 500 MB       |
| Opera 15+ (with File System) | 1 GB *       |
| Safari 6.1+                  | ?            |
| Maxthon                      | ?            |

(Most of the data is from [FileSaver.js](https://github.com/eligrey/FileSaver.js))

One thing should be noticed is that _the maximum size in table is **the maximum size of Blob Storage**, not a single Zip file_. Zip file will be generated as a Blob object and temporarily saved in Blob Storage by default, so Blob Storage of browser should heve enough free space to create them.

Unfortunately, we don't know how many space we can use, and when the old Blob content are erased. If browser can't split enough free space, instead of throwing an error, it will return a **fake-like** Blob object as usual and we don't know whether it is a REAL Blob object or not. Besides, old Blob content won't be removed immediately even though we don't need it anymore. When we revoke the old Blob object, it just announced to GC that the object can be recycled, but when GC recycled it, we don't know. If you have interested in it, I noted my testing process [here](http://ccloli.com/201509/bullshit-about-blob-and-object-url/) (Simplified Chinese only).

So how to solve it? I have no good idea. Though new File API added `close()` method to close a Blob object, but it is still up for review, and all the browser are not supported right now. _One way for all browser is that **not download too many archives** at the same time, and when downloading large archive, **use Pages Range** to download them into some parts_ (auto-scale is still in plan but it won't be worked out recently).

\* Tamporary File System storage size is 10% of disk free space where Google Chrome / Opera installed. However, Chrome may have a maximum ArrayBuffer size limit for each process (about 2 GB I tested, on Windows 8.1 64-bit & 8 GB RAM), when reach the limit, Chrome will throw "Uncaught RangeError: Invalid array buffer length". Besides, when generating Zip file, we also have to storage images in memory in order to package. _So the maximum supported size is about 1 GB_.

\+ Though Firefox can handle 800 MB file in maximum, when generating large archive (350+ MB) it will throw "out of memory" error and **abort running script** with a high chance.


## Report A Bug

You can report a bug or give suggestions at [GitHub Issue](https://github.com/ccloli/E-Hentai-Downloader/issues) or [GreasyFork Feedback](https://sleazyfork.org/scripts/10379-e-hentai-downloader/feedback). English and Chinese are acceptable :stuck_out_tongue_closed_eyes:

Sorry my code is a bit untidy, so it may hard for your development. I'll try optimizing it in a further time :sweat_smile:
