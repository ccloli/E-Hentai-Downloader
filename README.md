# E-Hentai-Downloader

Download E-Hentai archive as zip file :package:


## Required Environment

| Browser | [GreaseMonkey](https://www.greasespot.net/) | [Tampermonkey](http://tampermonkey.net/) | [Violentmonkey](https://violentmonkey.github.io/) |
| ------- | ------------ | ------------ | ------------- |
| Firefox (56-) | [3.2 beta2+](https://addons.mozilla.org/firefox/addon/greasemonkey/)  |  | |
| Firefox (57+) | [4.1 beta5+](https://addons.mozilla.org/firefox/addon/greasemonkey/)  | [4.0.5054+](https://addons.mozilla.org/firefox/addon/tampermonkey/) | [2.8.18+](https://addons.mozilla.org/firefox/addon/violentmonkey/) |
| Chrome |  | [3.5.3630+](https://chrome.google.com/webstore/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo)  | [2.2.6+](https://chrome.google.com/webstore/detail/jinjaccalgkegednnccohejagnlnfdag) |
| Opera (15+) | |  [3.5.3630+](https://addons.opera.com/extensions/details/tampermonkey-beta/)  | [2.1.10+](https://addons.opera.com/extensions/details/violent-monkey/) |
| Safari (10.1+) <sup>(1)</sup> | | [4.3.5421+](https://tampermonkey.net/?browser=safari) |
| Edge (18-) <sup>(2)</sup> | | [4.2.5284+](https://www.microsoft.com/store/p/tampermonkey/9nblggh5162s) |
| Edge (79+) | | [4.10.6111+](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) | [2.12.8+](https://microsoftedge.microsoft.com/addons/detail/eeagobfjdenkkddmbclomhiblgggliao) |
| Maxthon | | | [2.1.10+](http://extension.maxthon.cn/detail/index.php?view_id=1680) |
| Yandex Browser for Android <sup>(3)</sup> | | [4.2.5291+](https://chrome.google.com/webstore/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo/) | [2.2.6+](https://chrome.google.com/webstore/detail/jinjaccalgkegednnccohejagnlnfdag) |
| Kiwi Browser <sup>(3)</sup> | | [4.11+](https://chrome.google.com/webstore/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo/) | [2.12.8+](https://chrome.google.com/webstore/detail/jinjaccalgkegednnccohejagnlnfdag) |
| Firefox for Android (68-)<sup>(3)</sup> | Incompatible | Incompatible | [2.12.8+](https://addons.mozilla.org/firefox/addon/violentmonkey/) |
| Firefox Nightly for Android (85+) <sup>(3)(4)</sup> | Incompatible | [4.11.6120+](https://addons.mozilla.org/firefox/addon/tampermonkey/) | [2.12.8+](https://addons.mozilla.org/firefox/addon/violentmonkey/) |

> (1) You must upgrade your Windows 10 to 14393 which supports Edge extension.  
> (2) You must upgrade your macOS to 10.12.4 which supports `download` attribute of `<a>` tag.  
> (3) It's not a good idea to use it on mobile with limited RAM, but it can work, so it's up to you.  
> (4) Firefox Nightly user requires to follow [this steps](https://blog.mozilla.org/addons/2020/09/29/expanded-extension-support-in-firefox-for-android-nightly/) to install extensions not in default list.  


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

- ~~If you are using the latest Tampermonkey, or receive a warning of _"A userscript wants to access a cross-origin resource"_ from Tampermonkey, please **Allow All** or turn off "@connect mode" at setting page. For more info, [see details here](https://github.com/ccloli/E-Hentai-Downloader/wiki/Cross-origin-request-warning-from-Tampermonkey)~~  
  E-Hentai now uses `hath.network` domain to access images, and it's now listed in `@connect`, so you're not needed to set this with latest Tampermonkey
- If you see a message about out of memory on Firefox, or file not found on Chrome, [see solution here](https://github.com/ccloli/E-Hentai-Downloader/wiki/Can't-make-Zip-file-successfully).  
  In short, use Pages Range to limit each zip file under 500 MB is recommended, and enable File System if you're using Chrome, or use other tools, or upgrade your PC with more RAM
- ~~ViolentMonkey doesn't support timeout, final URL and download progress~~  
  The latest ViolentMonkey supports these features now
- ~~Single-thread download mode is removed in 1.18, if you need it, roll back to [old version](https://github.com/ccloli/E-Hentai-Downloader/releases/tag/v1.17.4)~~  
  Don't use an old version, it doesn't support current site
- You can also have a look at [E-Hentai Image Viewing Limits](https://github.com/ccloli/E-Hentai-Downloader/wiki/E%E2%88%92Hentai-Image-Viewing-Limits)
- Most of galleries may have torrents to download. You can download archive with torrent to get stable download experience, get bonus content (most in cosplay gallery), earn GP and credit, and reduce the pressure of E-Hentai original servers (though it's a P2P site)

Here are some other compatible information, which is not important.

- ~~Tampermonkey uses a dirty way to give `GM_xhr.response` content (transfers `String` to `ArrayBuffer` everytime), so it'll stuck for 1~3 seconds or more after downloaded image (depend on your device). If you are using Microsoft Edge, you may often see the working tab is stuck, saying it's not responding. Just let it go and do nothing. And if you are using Firefox, it's better to use GreaseMonkey from this side~~  
  The freeze problem should be fixed in Tampermonkey [4.12.6125](https://github.com/Tampermonkey/tampermonkey/issues/279)
- Dolphin Browser (Android) doesn't support blob URL, so this script cannot be run in Tampermonkey for Dolphin probably
- UC Browser (Android) doesn't support blob constructor, so this script cannot be run in Tampermonkey for UC probably
- Opera 12- doesn't support blob URL, and if generated as data URL, it may crash, so it's not supported
- TrixIE (for IE) is too old and its `GM_xhr` cannot handle large content, so it's not supported


## Warning And Limitation

### Memory Usage

The script will store **ALL** the data in RAM, not in HDD. This will increase the memory usage of current tab process. So if you don't have enough RAM, or the archive is too large (see [file size limit section](#file-size-limit)), please pay attention to your memory usage, or try other download tools.

"Out of memory" problem is **the most limitaion** of the script (in fact, all the sections of "Warning And Limitation" are about RAM problem, and here is also a specific [out of memory](https://github.com/ccloli/E-Hentai-Downloader/issues?utf8=%E2%9C%93&q=label%3A%22out+of+memory%22+) tag to label all related issues). If you get an error like out of memory, [see solution here](https://github.com/ccloli/E-Hentai-Downloader/wiki/Can't-make-Zip-file-successfully). And if you usually have the problem, try other tools.

### Browser Developer Tools

To help us debug, the script will output some logs into console (F12 -> Console). If you find a bug, you can keep opening devtools to see and copy the logs. But note that it may increase memory usage and reduce running efficiency. So don't open console only if you want to see the output logs.

### File Size Limit

_(This part is a bit long, you can just read the table)_

Different browsers have different maximum file size limits. Here is a table to show the maximum size the supported browser can handle.

| Browser                      | Maximum Size                  |
| ---------------------------- | ----------------------------- |
| Chrome 56-                   | 500 MB                        |
| Chrome 57+                   | 2 GB or (total RAM / 5)       |
| Chrome (with File System)    | 1 GB / > 2GB (with 1.33+)     |
| Firefox                      | > 800MB (depends on your RAM) |
| Opera 15+                    | Same as Chrome                |
| Edge 18-                     | ?                             |
| Edge 79+                     | Same as Chrome                |
| Safari 10.1+                 | ?                             |
| Maxthon                      | ?                             |

For **Google Chrome 56-**, it has a hard limit at **500 MB** on **Blob Storage** for years. That means all the files that in storage cannot be larger than 500MB in total, and if the storage doesn't have enough free space to save the next file, it'll return a **fake** Blob instance silently **without any errors**. Also for Chrome 45-, `Blob.close()` didn't implement (and it's depreated so no browser supports it now), so we cannot free those used Blob immediately at that time, only to pary the browser will GC them ASAP (and for most of time it didn't work). That's why here is [a wiki page](https://github.com/ccloli/E-Hentai-Downloader/wiki/Can't-make-Zip-file-successfully) to help you work around this.

So to help you save larger files, the script can save the Zip file into **File System**, a deprecated HTML5 API but still works on Chrome (as it's Chrome introduce the standard first). With the API, you can handle larger file because the file data will be writing to your disk instead of storing in Blob Storage, its limit is also big enough (10% of your disk free storage, 15 GB in maximum). But when processing the file, the files are still keeping in RAM, and if datas are too large, Chrome may also cannot handle them. From my test the maximum limit maybe **1 GB** if you only have 8 GB RAM, but it may also depends on your device. If you have enough RAM, you can download a gallery larger than **2 GB** with 1.33+.

**Chrome 57+** [fixes the 500 MB limit of Blob Storage](https://bugs.chromium.org/p/chromium/issues/detail?id=375297#c107), so that it can handler larger files in RAM just like File System. Its quota is still exist but it's larger, which bases on the limits below, and [here are some examples](https://stackoverflow.com/a/43816041) to make it more clear:

> In-memory quota:
> * `2GB` if system is x64 and NOT ChromeOS or Android
> * `Total RAM amount / 5`;
> 
> Disk quota:
> * `Disk size / 2` if ChromeOS (user partition disk size)
> * `Disk size / 20` if Android
> * `Disk size / 10` otherwise.
> 
> Also, if disk is almost full, we try to keep at least `(in-memory quota)*2` disk space available, and we limit the disk quota accordingly.

For **Firefox**, from our previous data from [FileSaver.js](https://github.com/eligrey/FileSaver.js), the limit is 800 MB. But from our tests, you can save the file that larger than 800 MB. So we think the limit of Firefox is depending on your device, as it stores the Blob in RAM. If you have a larger RAM, you can save a larger file. However, you should care about your RAM usage, as if Firefox cannot get more RAM to generate Zip, it'll throw an "out of memory" error. To give you some advice, no more than 200 MB if you're using 4 GB RAM, and be care for more than 800 MB if you're using 8 GB RAM.

**Opera 15+** is a Chromium-based browser, so you can check its Chromium version and compare it to Chrome version to get your limit. All the other Chromium-based browsers can also use this rule.

**Safari 10.1+** finally supports `download` attribute on `<a>` tag, so you can now make it works on Safari. We don't have too much data about Safari Blob limit, so if you're dealing with Safari, be care about your RAM usage.


## Todo List

[See plans and progress here](https://github.com/ccloli/E-Hentai-Downloader/wiki/Todo-List), notice that some of them may changed or removed in some time.


## Report A Bug

You can report a bug or give suggestions at [GitHub Issue](https://github.com/ccloli/E-Hentai-Downloader/issues) or [GreasyFork Feedback](https://sleazyfork.org/scripts/10379-e-hentai-downloader/feedback). English and Chinese are acceptable :stuck_out_tongue_closed_eyes:

English is not my mother tounge, so if you found any mistakes, don't hesitate to [let me know](https://github.com/ccloli/E-Hentai-Downloader/issues/24) =ω=

Sorry my code is a bit untidy, so it may hard for your development. I'll try optimizing it in a further time :sweat_smile: