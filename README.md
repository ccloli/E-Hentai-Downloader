# E-Hentai-Downloader

Download E-Hentai archive as zip file :package:


## Required Environment

- Firefox > [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) 3.2 beta2+ | [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) 4.0.5054+
- Chrome > [Tampermonkey](http://tampermonkey.net/) 3.5.3630+ | [Violentmonkey](https://chrome.google.com/webstore/detail/jinjaccalgkegednnccohejagnlnfdag)
- Opera 15+ > [Tampermonkey](https://addons.opera.com/extensions/details/tampermonkey-beta/) 3.5.3630+ | [Violentmonkey](https://addons.opera.com/extensions/details/violent-monkey/)
- Maxthon > [Violentmonkey](http://extension.maxthon.cn/detail/index.php?view_id=1680)
- Microsoft Edge > [Tampermonkey](https://www.microsoft.com/store/p/tampermonkey/9nblggh5162s) 4.2.5284.0+  
  > You must upgrade your Windows 10 to 14393 which supports Edge extension.
- Yandex Browser for Android > [Tampermonkey](https://addons.opera.com/zh-cn/extensions/details/tampermonkey-beta/) 4.2.5291+  
  > Anyway it's not a good idea to use it on mobile with limited RAM resources, but it can work, so it's up to you ;-)


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

- If you are using the latest Tampermonkey, or received a warning of _"A userscript wants to access a cross-origin resource"_ from Tampermonkey, please **Allow All** or turn off "@connect-src mode" at setting page. For more info, [see details here](https://github.com/ccloli/E-Hentai-Downloader/wiki/Cross-origin-request-warning-from-Tampermonkey)
- If you received a message about out of memory on Firefox, or file not found on Chrome, [see solution here](https://github.com/ccloli/E-Hentai-Downloader/wiki/Can't-make-Zip-file-successfully)
- ViolentMonkey doesn't support timeout, final URL and download progress
- Single-thread download mode is removed in 1.18, if you need it, roll back to [old version](https://github.com/ccloli/E-Hentai-Downloader/releases/tag/v1.17.4)
- You can also have a look at [E-Hentai Image Viewing Limits](https://github.com/ccloli/E-Hentai-Downloader/wiki/E%E2%88%92Hentai-Image-Viewing-Limits)
- Most of archive may have a torrent download. You can download archive with torrent to get stable download experience, get bonus content (most in cosplay gallery), earn GP and credit, and reduce the pressure of E-Hentai original servers (though it's a P2P site)

Here are some compatible information, which is not important.

- Tampermonkey uses a dirty way to give `GM_xhr.response` content (transfers String to ArrayBuffer everytime), so it'll stuck for 1~3 seconds or more after downloaded image (depends on your device). If you are using Microsoft Edge, you may often see the working tab is stuck, saying it's not responding. Just let it go and do nothing. And if you are using Firefox, it's better to use GreaseMonkey from this side
- Some versions of Safari don't support blob URL, so we removed it from supports list
- Dolphin Browser (Android) doesn't support blob URL, so this script cannot be run in Tampermonkey for Dolphin
- UC Browser (Android) doesn't support blob constructor, so this script cannot be run in Tampermonkey for UC
- Opera 12- doesn't support blob URL, and if generated as data URL, it may crash, so we won't support it
- TrixIE (for IE) is too old and its `GM_xhr` cannot handle large content, so we won't support it


## Warning And Limitation

### Memory Usage

The script will store all the contents in RAM, not in HDD. This will increase the memory usage of current tab process. So if you don't have enough RAM, or the archive is too large (see file size limit section), please pay attention to your memory usage, or try other download tools.

Out of memory problem is **the most limitaion** of this script (in fact, all the sections of W&L are RAM problem, and the issues about them even have a specific [out of memory](https://github.com/ccloli/E-Hentai-Downloader/issues?utf8=%E2%9C%93&q=label%3A%22out+of+memory%22+) tag), and sometimes it relates to Blob size limit. If you receive a warning like out of memory, [see solution here](https://github.com/ccloli/E-Hentai-Downloader/wiki/Can't-make-Zip-file-successfully). And if you always meet the problem, try other tools.

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

One thing should be noticed is that _the maximum size in table is **the maximum size of Blob Storage**, not a single Zip file (probably except Firefox)_. Zip file will be generated as a Blob object and temporarily saved in Blob Storage by default, so Blob Storage of browser should have enough free space to create them.

Unfortunately, we don't know how much space we can use, and when the old Blob content is erased. If browser can't split enough free space, instead of throwing an error, it will return a **fake-like** Blob object as usual and we don't know whether it is a REAL Blob object or not. Besides, old Blob content won't be removed immediately even though we don't need it anymore. When we revoke the old Blob object, it just announced to GC that the object can be recycled, but when GC recycled it, we don't know. If you have interested in it, I noted my testing process [here](http://ccloli.com/201509/bullshit-about-blob-and-object-url/) (Simplified Chinese only).

So how to solve it? I have no good idea. Though new File API added `close()` method to close a Blob object, it is still up for review, and all the browsers are not supported right now. _One way for all browser is that **not download too many archives** at the same time, and when downloading large archive, **use Pages Range** to download them into some parts_ (auto-scale is still in plan but it won't be worked out recently).

\* Tamporary File System storage size is 10% of disk free space where Google Chrome / Opera installed. However, Chrome may have a maximum ArrayBuffer size limit for each process (about 2 GB I tested, on Windows 8.1 64-bit & 8 GB RAM), when reach the limit, Chrome will throw "Uncaught RangeError: Invalid array buffer length". Besides, when generating Zip file, we also have to storage images in memory in order to package. _So the maximum supported size is about 1 GB_.

\+ Though Firefox can handle 800 MB file in maximum, when generating large archive (~~350+ MB~~ depends on your device) it will throw "out of memory" error and **abort running script** with a high chance. And it seems that 800 MB is the size limit of a single file, we can still create more small Blobs after that. If you are interested in it, see our discussion in [issue #18](https://github.com/ccloli/E-Hentai-Downloader/issues/18). Anyway, it all depends on your RAM size, e.g. if you only have 4GB RAM, you should be careful when downloading 150+ MB archive in Firefox.


## Todo List

[See plans and progress here](https://github.com/ccloli/E-Hentai-Downloader/wiki/Todo-List), notice that some of them may changed or removed in some time.


## Report A Bug

You can report a bug or give suggestions at [GitHub Issue](https://github.com/ccloli/E-Hentai-Downloader/issues) or [GreasyFork Feedback](https://sleazyfork.org/scripts/10379-e-hentai-downloader/feedback). English and Chinese are acceptable :stuck_out_tongue_closed_eyes:

English is not my mother tounge, so if you found any mistakes, don't hesitate to [let me know](https://github.com/ccloli/E-Hentai-Downloader/issues/24) =ω=

Sorry my code is a bit untidy, so it may hard for your development. I'll try optimizing it in a further time :sweat_smile: