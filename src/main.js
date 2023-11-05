
var zip;
var imageList = [];
var imageData = [];
var infoStr;
var origin = window.location.origin;
var setting = null;
var fetchCount = 0;
var downloadedCount = 0;
var totalCount = 0;
var retryCount = 0;
var failedCount = 0;
var fetchThread = [];
var dirName;
var fileName;
var progressTable = null;
var needNumberImages = false;
var pagesRange = [];
var isDownloading = false;
var isPausing = false;
var isSaving = false;
var pageURLsList = [];
var getAllPagesURLFin = false;
var pretitle = document.title;
var needTitleStatus = false;
var delayTime = 0;
var visibleState = true;
var isTor = location.hostname === 'exhentai55ld2wyap5juskbm67czulomrouspdacjamjeloj7ugjbsad.onion';
var fetchPagesXHR = new XMLHttpRequest();
var emptyAudio;
var emptyAudioFile = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcxLjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ea2tra2tra3l5eXl5eYaGhoaGhpSUlJSUlKGhoaGhoaGvr6+vr6+8vLy8vLzKysrKysrX19fX19fX5eXl5eXl8vLy8vLy////////AAAAAExhdmM1Ny44OQAAAAAAAAAAAAAAACQCgAAAAAAAAAVY82AhbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAALACwAAP/AADwQKVE9YWDGPkQWpT66yk4+zIiYPoTUaT3tnU487uNhOvEmQDaCm1Yz1c6DPjbs6zdZVBk0pdGpMzxF/+MYxA8L0DU0AP+0ANkwmYaAMkOKDDjmYoMtwNMyDxMzDHE/MEsLow9AtDnBlQgDhTx+Eye0GgMHoCyDC8gUswJcMVMABBGj/+MYxBoK4DVpQP8iAtVmDk7LPgi8wvDzI4/MWAwK1T7rxOQwtsItMMQBazAowc4wZMC5MF4AeQAGDpruNuMEzyfjLBJhACU+/+MYxCkJ4DVcAP8MAO9J9THVg6oxRMGNMIqCCTAEwzwwBkINOPAs/iwjgBnMepYyId0PhWo+80PXMVsBFzD/AiwwfcKGMEJB/+MYxDwKKDVkAP8eAF8wMwIxMlpU/OaDPLpNKkEw4dRoBh6qP2FC8jCJQFcweQIPMHOBtTBoAVcwOoCNMYDI0u0Dd8ANTIsy/+MYxE4KUDVsAP8eAFBVpgVVPjdGeTEWQr0wdcDtMCeBgDBkgRgwFYB7Pv/zqx0yQQMCCgKNgonHKj6RRVkxM0GwML0AhDAN/+MYxF8KCDVwAP8MAIHZMDDA3DArAQo3K+TF5WOBDQw0lgcKQUJxhT5sxRcwQQI+EIPWMA7AVBoTABgTgzfBN+ajn3c0lZMe/+MYxHEJyDV0AP7MAA4eEwsqP/PDmzC/gNcwXUGaMBVBIwMEsmB6gaxhVuGkpoqMZMQjooTBwM0+S8FTMC0BcjBTgPwwOQDm/+MYxIQKKDV4AP8WADAzAKQwI4CGPhWOEwCFAiBAYQnQMT+uwXUeGzjBWQVkwTcENMBzA2zAGgFEJfSPkPSZzPXgqFy2h0xB/+MYxJYJCDV8AP7WAE0+7kK7MQrATDAvQRIwOADKMBuA9TAYQNM3AiOSPjGxowgHMKFGcBNMQU1FMy45OS41VVU/31eYM4sK/+MYxKwJaDV8AP7SAI4y1Yq0MmOIADGwBZwwlgIJMztCM0qU5TQPG/MSkn8yEROzCdAxECVMQU1FMy45OS41VTe7Ohk+Pqcx/+MYxMEJMDWAAP6MADVLDFUx+4J6Mq7NsjN2zXo8V5fjVJCXNOhwM0vTCDAxFpMYYQU+RlVMQU1FMy45OS41VVVVVVVVVVVV/+MYxNcJADWAAP7EAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxOsJwDWEAP7SAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxPMLoDV8AP+eAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxPQL0DVcAP+0AFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

var ehDownloadRegex = {
	imageURL: [
		/<a href="(\S+?\/fullimg(?:\.php\?|\/)\S+?)"/,
		/<img id="img" src="(\S+?)"/,
		/<\/(?:script|iframe)><a[\s\S]+?><img src="(\S+?)"/ // Sometimes preview image may not have id="img"
	],
	nextFetchURL: [
		/<a id="next"[\s\S]+?href="(\S+?\/s\/\S+?)"/,
		/<a href="(\S+?\/s\/\S+?)"><img src="https?:\/\/ehgt.org\/g\/n.png"/
	],
	preFetchURL: /<div class="sn"><a[\s\S]+?href="(\S+?\/s\/\S+?)"/,
	nl: /return nl\('([\d\w-]+)'\)/,
	fileName: /g\/l.png"\s?\/><\/a><\/div><div>([\s\S]+?) :: /,
	resFileName: /filename=['"]?([\s\S]+?)['"]?$/m,
	dangerChars: /[:"*?|<>\/\\\n]/g,
	pagesRange: /^(!?\d*(-\d*(\/\d+)?)?\s*,\s*)*!?\d*(-\d*(\/\d+)?)?$/,
	pagesURL: /(?:<a href=").+?(?=")/gi,
	mpvKey: /var imagelist\s*=\s*(\[.+?\]);/,
	imageLimits: /You are currently at <strong>(\d+)<\/strong> towards a limit of <strong>(\d+)<\/strong>/,
	pagesLength: /<table class="ptt".+>(\d+)<\/a>.+?<\/table>/,
	IPBanExpires: /The ban expires in \d+ hours?( and \d+ minutes?)?/,
	donatorPower: /<td>Donations<\/td><td.*>([+-]?[\d\.]+)<\/td>/,
	postedTime: /<td.*?>Posted:<\/td><td.*?>(.*?)<\/td>/,
	categoryTag: /g\/c\/(\w+)\./,
	slashOnly: /^[\\/]*$/,
	originalImagePattern: /\/fullimg(?:\.php\?|\/)/
};

var dateOffset = new Date().getTimezoneOffset() * 60000;
Object.defineProperty(JSZip.defaults, 'date', {
	get: function() {
		return new Date(Date.now() - dateOffset);
	}
});

var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
var ehDownloadFS = {
	fs: undefined,
	needFileSystem: false,
	initHandler: function(fs) {
		ehDownloadFS.fs = fs;
		console.log('[EHD] File System is opened! Name >', fs.name);
		ehDownloadFS.removeAllFiles(fs); // It's sure that user have downloaded or ignored temp archive
	},
	errorHandler: function(e) {
		var errorMsg = 'File System Request Error > ';
		errorMsg += e.name || 'Unknown Error';
		
		console.error('[EHD] ' + errorMsg, e.message);
		console.error(e);
	},
	saveAs: function(fs, forced){
		var fs = fs || ehDownloadFS.fs;
		if (fs === undefined) return;
		fs.root.getFile(unsafeWindow.gid + '.zip', {}, function (fileEntry) {
			var url = fileEntry.toURL();
			console.log('[EHD] File URL >', url);
			var a = document.createElement('a');
			a.setAttribute('href', url);
			a.setAttribute('download', fileName + (setting['save-as-cbz'] ? '.cbz' : '.zip'));
			a.click();
			pushDialog('\n\nNot download or file is broken? <a href="' + url + '" download="' + fileName + (setting['save-as-cbz'] ? '.cbz' : '.zip') + '" style="color: #ffffff; font-weight: bold;">Click here to download</a>\n\n');
			if (!forced) {
				insertCloseButton();
				if (emptyAudio) {
					emptyAudio.pause();
				}
			}
		});
	},
	removeFile: function(fileName, fs, isEntry){
		var fs = fs || ehDownloadFS.fs;
		if (fs === undefined) return;
		var removeFunction = function(fileEntry){
			if (fileEntry.isFile) fileEntry.remove(function(){
				console.log('[EHD] File', fileName, 'is removed.');
			});
			else if (fileEntry.isDirectory) fileEntry.removeRecursively(function() {
				console.log('[EHD] Directory', fileName, 'is removed.');
			});
		};
		if (isEntry) removeFunction(fileName);
		else fs.root.getFile(fileName, {create: false}, removeFunction);
	},
	removeAllFiles: function(fs){
		var fs = fs || ehDownloadFS.fs;
		if (fs === undefined) return;
		console.log('[EHD] Request removing all files in File System.');
		fs.root.createReader().readEntries(function(entries){
			if (entries.length === 0) return;
			for (var i = 0; i < entries.length; i++) {
				ehDownloadFS.removeFile(entries[i], fs, true);
			}
		}, ehDownloadFS.errorHandler); 
	},
	initCheckerHandler: function(fs) {
		//ehDownloadFS.fs = fs;
		console.log('[EHD] File System is opened! Name >', fs.name);
		ehDownloadFS.removeFile(unsafeWindow.gid + '.zip', fs);
		fs.root.getFile('config.txt', {create: false}, function(fileEntry){
			fileEntry.file(function(file){
				var fileReader = new FileReader();
				fileReader.onloadend = function() {
					var value = this.result;
					if (value === '' || value == null) return;
					var data = JSON.parse(value);
					if (data && confirm('You have an archive that is not downloaded, save it?\n\nFile Name: ' + data.fileName + '\n\n* If you have already downloaded it, click cancel to remove the cached archive file.')) {
						fileName = data.fileName;
						dirName = data.dirName;
						ehDownloadFS.storeTempArchive(data, fs);
					}
					else {
						ehDownloadFS.removeAllFiles(fs);
					}
				};
				fileReader.readAsText(file);
			});
		});
	},
	storeTempArchive: function(data, fs){
		var fs = fs || ehDownloadFS.fs;
		if (fs === undefined) return;
		fs.root.getDirectory('raw', {}, function(fileEntry){
			fileEntry.createReader().readEntries(function(entries){
				if (entries.length === 0) return;
				var index = 0;
				var fileReader = new FileReader();
				zip = new JSZip();
				ehDownloadDialog.style.display = 'block';
				ehDownloadDialog.innerHTML = '';
				pushDialog('Preparing......');
				fileReader.onloadend = function() {
					(data.dirName && !ehDownloadRegex.slashOnly.test(data.dirName) ? zip.folder(data.dirName) : zip).file(entries[index].name, this.result);
					index++;
					if (index < entries.length) addFile();
					else {
						ehDownloadFS.removeAllFiles();
						setTimeout(generateZip, 3000, true, fs); // wait for removing all files
					}
				};
				var addFile = function(){
					console.log('[EHD] TempArchiveFileIndex >', index, '| TempArchiveFileName >', entries[index].name, '| TempArchiveFilePath >', entries[index].fullPath, '| TempArchiveFileLength >', entries.length);
					pushDialog('\n' + (index + 1) + '/' + entries.length);
					fs.root.getFile(entries[index].fullPath, {create: false}, function(fileEntry){
						fileEntry.file(function(file){
							fileReader.readAsArrayBuffer(file);
						});
					});
				};
				addFile();
			}, ehDownloadFS.errorHandler);
		}, ehDownloadFS.errorHandler);
	}
};

var bodyBackground = getComputedStyle(document.body).backgroundColor || '#34353b';
var ehDownloadStyle = '\
	@-webkit-keyframes progress { \
		from { -webkit-transform: translateX(-50%) scaleX(0); transform: translateX(-50%) scaleX(0); } \
		60% { -webkit-transform: translateX(15%) scaleX(0.7); transform: translateX(15%) scaleX(0.7); } \
		to { -webkit-transform: translateX(50%) scaleX(0); transform: translateX(50%) scaleX(0); } \
	} \
	@-moz-keyframes progress { \
		from { -moz-transform: translateX(-50%) scaleX(0); transform: translateX(-50%) scaleX(0); } \
		60% { -moz-transform: translateX(15%) scaleX(0.7); transform: translateX(15%) scaleX(0.7); } \
		to { -moz-transform: translateX(50%) scaleX(0); transform: translateX(50%) scaleX(0); } \
	} \
	@-ms-keyframes progress { \
		from { -ms-transform: translateX(-50%) scaleX(0); transform: translateX(-50%) scaleX(0); } \
		60% { -ms-transform: translateX(15%) scaleX(0.7); transform: translateX(15%) scaleX(0.7); } \
		to { -ms-transform: translateX(50%) scaleX(0); transform: translateX(50%) scaleX(0); } \
	} \
	@keyframes progress { \
		from { -webkit-transform: translateX(-50%) scaleX(0); transform: translateX(-50%) scaleX(0); } \
		60% { -webkit-transform: translateX(15%) scaleX(0.7); transform: translateX(15%) scaleX(0.7); } \
		to { -webkit-transform: translateX(50%) scaleX(0); transform: translateX(50%) scaleX(0); } \
	} \
	.ehD-box { margin: 16px auto 20px; width: 732px; box-sizing: border-box; font-size: 12px; border: 1px groove #000000; }\
	.ehD-box a { cursor: pointer; }\
	.ehD-box .g2 { display: inline-block; margin: 10px; padding: 0; line-height: 14px; }\
	.ehD-box legend { font-weight: 700; padding: 4px 10px 0; } \
	.ehD-box legend a { color: inherit; text-decoration: none; }\
	.ehD-box input[type="text"] { width: 250px; }\
	.ehD-box-extend input[type="text"] { width: 255px; }\
	.ehD-box input::placeholder { color: #999999; -webkit-text-fill-color: #999999; }\
	.ehD-box.ehD-box-sticky { position: sticky; top: 0px; z-index: 5; background: ' + bodyBackground + '; box-shadow: 0 0 0 12px ' + bodyBackground + '; }\
	.ehD-setting { position: fixed; left: 0; right: 0; top: 0; bottom: 0; padding: 5px; border: 1px solid #000000; background: #34353b; color: #dddddd; width: 600px; height: 380px; max-width: 100%; max-height: 100%; overflow-x: hidden; overflow-y: auto; box-sizing: border-box; margin: auto; z-index: 999; text-align: left; font-size: 12px; outline: 5px rgba(0, 0, 0, 0.25) solid; }\
	.ehD-setting-tab { list-style: none; margin: 5px 0; padding: 0 10px; border-bottom: 1px solid #cccccc; overflow: auto; }\
	.ehD-setting-tab li { float: left; padding: 5px 10px; border-bottom: 0; cursor: pointer; }\
	.ehD-setting[data-active-setting="basic"] li[data-target-setting="basic"], .ehD-setting[data-active-setting="advanced"] li[data-target-setting="advanced"] { font-weight: bold; background: #cccccc; color: #000000; }\
	.ehD-setting-main { overflow: hidden }\
	.ehD-setting-wrapper { width: 200%; overflow: hidden; -webkit-transform: translateX(0%); -moz-transform: translateX(0%); -o-transform: translateX(0%); -ms-transform: translateX(0%); transform: translateX(0%); -webkit-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); -moz-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); -o-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); -ms-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); }\
	.ehD-setting[data-active-setting="advanced"] .ehD-setting-wrapper { -webkit-transform: translateX(-50%); -moz-transform: translateX(-50%); -o-transform: translateX(-50%); -ms-transform: translateX(-50%); transform: translateX(-50%); }\
	.ehD-setting-content { width: 50%; float: left; box-sizing: border-box; padding: 5px 10px; height: 295px; max-height: calc(100vh - 85px); overflow: auto; }\
	.ehD-setting .g2 { padding-bottom: 10px; }\
	.ehD-setting input, .ehD-box input, .ehD-setting select, .ehD-box select { vertical-align: middle; top: 0; margin: 0; }\
	.ehD-setting input[type="text"], .ehD-box input[type="text"], .ehD-setting input[type="number"] { height: 18px; padding: 0 0 0 3px; line-height: 18px; border-radius: 3px; }\
	.ehD-setting input[type="text"], .ehD-setting input[type="number"] { border: 1px solid #8d8d8d; } \
	.ehD-setting input[type="checkbox"] { margin: 3px 3px 4px 0 } \
	.ehD-setting select { padding: 0 3px 1px; } \
	.ehD-setting-note { border: 1px dashed #999999; padding: 10px 10px 0 10px; }\
	.ehD-setting-footer { text-align: center; margin-top: 5px; border-top: 1px solid #cccccc; padding-top: 5px; }\
	.ehD-setting sup { vertical-align: top; }\
	.ehD-setting a { color: #ffffff; }\
	.ehD-box input[type="number"] { height: 17px; }\
	.ehD-dialog progress { height: 12px; -webkit-appearance: none; border: 1px solid #4f535b; color: #4f535b; background: #34353b; position: relative; } \
	.ehD-dialog progress::-webkit-progress-bar { background: #34353b; } \
	.ehD-dialog progress::-webkit-progress-value { background: #4f535b; -webkit-transition: all 0.2s ease; transition: all 0.2s ease; } \
	.ehD-dialog progress::-moz-progress-bar { background: #4f535b; -moz-transition: all 0.2s ease; transition: all 0.2s ease; } \
	.ehD-dialog progress::-ms-fill { background: #4f535b; -ms-transition: all 0.2s ease; transition: all 0.2s ease; } \
	.ehD-dialog progress:not([value])::after { content: ""; will-change: transform; width: 100%; height: 100%; left: 0; top: 0; display: block; background: #4f535b; position: absolute; -webkit-animation: progress 1s linear infinite; -moz-animation: progress 1s linear infinite; -ms-animation: progress 1s linear infinite; animation: progress 1s linear infinite; } \
	.ehD-dialog progress:not([value])::-moz-progress-bar { width: 0px !important; } \
	.ehD-pt { table-layout: fixed; width: 100%; }\
	.ehD-pt-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }\
	.ehD-pt-progress-outer { width: 160px; position: relative; }\
	.ehD-pt-progress { width: 150px; }\
	.ehD-pt-progress-text { position: absolute; width: 100%; text-align: center; color: #b8b8b8; left: 0; right: 0; }\
	.ehD-pt-status { width: 130px; }\
	.ehD-pt-succeed .ehD-pt-status { color: #00ff00; }\
	.ehD-pt-warning .ehD-pt-status { color: #ffff00; }\
	.ehD-pt-failed .ehD-pt-status { color: #ff0000; }\
	.ehD-pt-abort { color: #ffff00; display: none; cursor: pointer; }\
	.ehD-pt-status[data-inited-abort]:hover .ehD-pt-abort, .ehD-pt-failed .ehD-pt-status[data-inited-abort]:hover .ehD-pt-status-text, .ehD-pt-succeed .ehD-pt-status[data-inited-abort]:hover .ehD-pt-status-text { display: inline; }\
	.ehD-pt-status[data-inited-abort]:hover .ehD-pt-status-text, .ehD-pt-failed .ehD-pt-status[data-inited-abort]:hover .ehD-pt-abort, .ehD-pt-succeed .ehD-pt-status[data-inited-abort]:hover .ehD-pt-abort { display: none; }\
	.ehD-pt-gen-progress { width: 50%; }\
	.ehD-pt-gen-filename { margin-bottom: 1em; }\
	.ehD-dialog { position: fixed; right: 0; bottom: 0; display: none; padding: 5px; border: 1px solid #000000; background: #34353b; color: #dddddd; width: 550px; height: 300px; overflow: auto; z-index: 999; word-break: break-all; }\
	.ehD-status { position: fixed; right: 0; bottom: 311px; width: 550px; padding: 5px; border: 1px solid #000000; background: #34353b; color: #dddddd; cursor: pointer; -webkit-user-select: none; -moz-user-select: none; -o-user-select: none; -ms-user-select: none; user-select: none; }\
	.ehD-dialog, .ehD-status { -webkit-transition: margin 0.5s ease; -moz-transition: margin 0.5s ease; -o-transition: margin 0.5s ease; -ms-transition: margin 0.5s ease; transition: margin 0.5s ease; }\
	.ehD-dialog.hidden, .ehD-dialog.hidden .ehD-status { margin-bottom: -311px; }\
	.ehD-dialog .ehD-force-download-tips { position: fixed; right: 0; bottom: 288px; border: 1px solid #000000; width: 550px; padding: 5px; background: rgba(0, 0, 0, 0.75); color: #ffffff; cursor: pointer; opacity: 0; pointer-events: none; -webkit-transition: opacity 0.5s ease, bottom 0.5s ease; -moz-transition: opacity 0.5s ease, bottom 0.5s ease; -o-transition: opacity 0.5s ease, bottom 0.5s ease; -ms-transition: opacity 0.5s ease, bottom 0.5s ease; transition: opacity 0.5s ease, bottom 0.5s ease; }\
	.ehD-dialog:hover .ehD-force-download-tips { opacity: 1; }\
	.ehD-dialog.hidden .ehD-force-download-tips { bottom: -24px; }\
	.ehD-close-tips { position: fixed; left: 0; right: 0; bottom: 0; padding: 10px; border: 1px solid #000000; background: #34353b; color: #dddddd; width: 732px; max-width: 100%; max-height: 100%; overflow-x: hidden; overflow-y: auto; box-sizing: border-box; margin: auto; z-index: 1000; text-align: left; font-size: 14px; outline: 5px rgba(0, 0, 0, 0.25) solid; }\
	.ehD-feedback { position: absolute; right: 5px; top: 14px; }\
';

function initSetting() {
	loadSetting().then(function (res) {
		setting = res ? JSON.parse(res) : {};
		needNumberImages = setting['number-images'];
		needTitleStatus = setting['status-in-title'] === 'always' ? true : false;

		// overwrite settings or set default settings
		if (setting['status-in-title'] === true) setting['status-in-title'] = 'blur';
		if (!setting['save-info-list']) {
			setting['save-info-list'] = ['title', 'metas', 'uploader-comment', 'page-links'];
		}
		if (localStorage.getItem('ehd-image-limits-g.e-hentai.org')) {
			localStorage.removeItem('ehd-image-limits-g.e-hentai.org');
		}
		// remove config of get image limits from r.e-hentai.org
		if (setting['image-limits-both']) {
			delete setting['image-limits-both'];
			GM_setValue('ehD-setting', JSON.stringify(setting));
		}
		if (localStorage.getItem('ehd-image-limits-r.e-hentai.org')) {
			localStorage.removeItem('ehd-image-limits-r.e-hentai.org');
		}
		if (typeof setting['auto-download-cancel'] === 'undefined') {
			setting['auto-download-cancel'] = true;
		}
		if (typeof setting['actions-sticky'] === 'undefined') {
			setting['actions-sticky'] = true;
		}

		console.log('[EHD] E-Hentai Downloader Setting >', res, '-->', JSON.stringify(setting));

		// disable single-thread download
		if (setting['enable-multi-threading'] === false) {
			delete setting['enable-multi-threading'];
			alert('Single-thread download is unavailable now, because its code is too old and it\'s hard to add new features on it.\n\nIf you still need it, please roll back to the last-supported version (1.17.4).\n\nYou can get it at:\n- GitHub: https://github.com/ccloli/E-Hentai-Downloader/releases\n- GreasyFork: https://greasyfork.org/scripts/10379-e-hentai-downloader/versions (requires log in and enable Adult content)\n- SleazyFork: https://sleazyfork.org/scripts/10379-e-hentai-downloader/versions');
			GM_setValue('ehD-setting', JSON.stringify(setting));
		}

		if (setting['recheck-file-name']) toggleFilenameConfirmInput();
		ehDownloadNumberInput.querySelector('input').checked = needNumberImages;
		ehDownloadPauseBtn.textContent = setting['force-pause'] ? 'Pause (Downloading images will be aborted)' : 'Pause (Downloading images will keep downloading)';

		if (!setting['hide-image-limits']) {
			getResolutionSetting(true);
			loadImageLimits(true);
			setInterval(loadImageLimits, 60000);
		}

		if (!setting['hide-estimated-cost']) {
			try {
				showPreCalcCost();
			}
			catch (e) { }
		}

		initVisibilityListener();

		// Forced request File System to check if have temp archive
		if (setting['store-in-fs'] && requestFileSystem) {
			requestFileSystem(window.TEMPORARY, 1024 * 1024 * 1024, ehDownloadFS.initCheckerHandler, ehDownloadFS.errorHandler);
		}

		// if (setting['actions-sticky'] !== false) {
		// 	ehDownloadBox.classList.add('ehD-box-sticky');
		// }
	});
}

// log information
console.log('[EHD] UserAgent >', navigator.userAgent);
console.log('[EHD] Script Handler >', GM_info.scriptHandler || (navigator.userAgent.indexOf('Firefox') >= 0 ? 'GreaseMonkey' : (navigator.userAgent.indexOf('Opera') >= 0 || navigator.userAgent.indexOf('Maxthon') >= 0) ? 'Violentmonkey' : undefined)); // (Only Tampermonkey supports GM_info.scriptHandler)
console.log('[EHD] Script Handler Version >', GM_info.version);
console.log('[EHD] E-Hentai Downloader Version >', GM_info.script.version);
console.log('[EHD] Current URL >', window.location.href);
console.log('[EHD] Is Logged In >', unsafeWindow.apiuid !== -1);


var replaceHTMLEntites = function(str) {
	var matchEntity = function(entity) {
		var entitesList = {"euro":"€","nbsp":" ","quot":"\"","amp":"&","lt":"<","gt":">","iexcl":"¡","cent":"¢","pound":"£","curren":"¤","yen":"¥","brvbar":"¦","sect":"§","uml":"¨","copy":"©","ordf":"ª","not":"¬","shy":"","reg":"®","macr":"¯","deg":"°","plusmn":"±","sup2":"²","sup3":"³","acute":"´","micro":"µ","para":"¶","middot":"·","cedil":"¸","sup1":"¹","ordm":"º","raquo":"»","frac14":"¼","frac12":"½","frac34":"¾","iquest":"¿","agrave":"à","aacute":"á","acirc":"â","atilde":"ã","auml":"ä","aring":"å","aelig":"æ","ccedil":"ç","egrave":"è","eacute":"é","ecirc":"ê","euml":"ë","igrave":"ì","iacute":"í","icirc":"î","iuml":"ï","eth":"ð","ntilde":"ñ","ograve":"ò","oacute":"ó","ocirc":"ô","otilde":"õ","ouml":"ö","times":"×","oslash":"ø","ugrave":"ù","uacute":"ú","ucirc":"û","uuml":"ü","yacute":"ý","thorn":"þ","szlig":"ß","divide":"÷"};
		if (entitesList[entity]) return entitesList[entity];
		else if (/#\d+/.test(entity)) {
			var charCode = entity.match(/#(\d+)/)[1] - 0;
			return String.fromCharCode(charCode);
		}
		else if (/#[xX][0-9a-f]+/.test(entity)) {
			var charCode = parseInt(entity.match(/#[xX]([0-9a-f]+)/)[1] - 0, 16);
			return String.fromCharCode(charCode);
		}
		else return '&' + entity + ';';
	};
	var result = (str || '').replace(/&(#[xX]?\d+|[a-zA-Z]+);/g, function(match, entity) {
		return matchEntity(entity.toLowerCase());
	});
	return result;
};

function isInPeakHours() {
	// 2022-08-07
	// - Adjusted the "peak hours" used by original image downloading to better match the actual measured peak periods. It is now between 14:00 and 20:00 UTC Monday-Saturday, and between 05:00 and 20:00 UTC on Sundays.
	var date = new Date();
	var day = date.getUTCDay();
	var hour = date.getUTCHours();
	return (day === 0 ? hour >= 5 : hour >= 14) && hour < 20;
}

function isRecentGallery() {
	// 2022-06-07
	// A couple of minor tweaks to the "Download source image" changes, since it dropped the utilization by a lot more than we needed it to:
	// - It no longer applies to galleries posted in the last ~~7~~ 30 days.
	// - It no longer applies for donators.
	// 2022-11-25
	// - One of two new image servers that replace the current oldest image server is now live. (The second one will probably go live in about a month.)
	// - Increased the cutoff for how old a gallery has to be before it charges GP for original file downloads during peak hours from 30 days to 90 days.
	var galleryTime = (document.documentElement.innerHTML.match(ehDownloadRegex.postedTime) || [])[1];
	var time = Date.parse(galleryTime + '+0000');
	return Date.now() - time < 90 * 24 * 60 * 60 * 1000;
}

function isAncientGallery() {
	// 2023-07-07
	// - Galleries posted more than 1 year ago now always require GP to use the "download original image" links. As before, galleries uploaded 3-12 months ago can still use this function with the image quota outside of peak hours, while galleries uploaded less than 3 months ago can do this even during peak hours.
	// (This still doesn't apply to donators, whose image limits are tied to account rather than IP address and thus cannot be "refreshed" just by switching IP)
	var galleryTime = (document.documentElement.innerHTML.match(ehDownloadRegex.postedTime) || [])[1];
	var time = Date.parse(galleryTime + '+0000');
	return Date.now() - time >= 365 * 24 * 60 * 60 * 1000;
}

function isDonator() {
	return Object.keys(localStorage).filter(function (elem) {
		return elem.indexOf('ehd-image-limits-') === 0;
	}).some(function(elem) {
		try {
			var curData = JSON.parse(localStorage.getItem(elem));
			return curData.donatorPower;
		} catch (err) {
			console.error(err);
			return 0;
		}
	});
}

function isSourceNexusEnabled() {
	var curData = JSON.parse(localStorage.getItem('ehd-resolution') || '{"timestamp":0}');
	return +curData.originalImages && +curData.resolution === 0;
}

function isMPVAvailable() {
	var curData = JSON.parse(localStorage.getItem('ehd-resolution') || '{"timestamp":0}');
	return curData.mpvAvailable;
}

function isGPRequired() {
	return (
		(
			isInPeakHours() && !isRecentGallery() && !isDonator()
		) || (
			isAncientGallery() && isDonator() < 1
		)
	);
}

function createBlob(abdata, config) {
	try { // to detect if blob generates successfully
		return new Blob(abdata, config);
	}
	catch (error) {
		pushDialog('An error occurred when generating Blob object.');
		console.error('[EHD] An error occurred when generating Blob object. Error Name >', error.name, '| Error Message >', error.message);
		if (confirm('An error occurred when generating Blob object.\n\nError Name: ' + error.name + '\nError Message: ' + error.message + '\n\nTry again?')) return createBlob(abdata, config);

		abdata = undefined;
		throw new Error('[EHD] An error occurred when generating Blob object, and user refused to retry.');
	}
}

// show info in dialog box
function pushDialog(str) {
	var needScrollIntoView = ehDownloadDialog.clientHeight + ehDownloadDialog.scrollTop >= ehDownloadDialog.scrollHeight - 5;

	if (typeof str === 'string') {
		var tn = document.createElement('span');
		tn.innerHTML += str.replace(/\n/gi, '<br>');
		ehDownloadDialog.appendChild(tn);
	}
	else ehDownloadDialog.appendChild(str);

	if (getAllPagesURLFin && isDownloading && ehDownloadDialog.contains(ehDownloadPauseBtn)) {
		ehDownloadDialog.appendChild(ehDownloadPauseBtn);
	}

	if (needScrollIntoView) {
		ehDownloadDialog.scrollTop = ehDownloadDialog.scrollHeight;
	}
}

function getSafeName(str, ignoreSlash) {
	var replaceList = {
		':': '：',
		'"': '＂',
		'*': '＊',
		'?': '？',
		'|': '｜',
		'<': '＜',
		'>': '＞',
		'/': '／',
		'\\': '＼',
		'\n': '-'
	};
	var replaceFn = function(match) {
		if (ignoreSlash && (match === '/' || match === '\\')) {
			return match;
		}
		else if (setting['replace-with-full-width']) {
			return replaceList[match];
		}
		else {
			return '-';
		}
	};

	return str.trim().replace(ehDownloadRegex.dangerChars, replaceFn);
}

// replace dir name and zip filename
function getReplacedName(str) {
	return replaceHTMLEntites(str.replace(/\{gid\}/gi, unsafeWindow.gid)
		.replace(/\{token\}/gi, unsafeWindow.token)
		.replace(/\{title\}/gi, getSafeName(document.getElementById('gn').textContent))
		.replace(/\{subtitle\}/gi, document.getElementById('gj').textContent ? getSafeName(document.getElementById('gj').textContent) : getSafeName(document.getElementById('gn').textContent))
		.replace(/\{tag\}|\{category\}/gi, document.querySelector('#gdc .cs').textContent.trim().toUpperCase())
		.replace(/\{uploader\}/gi, getSafeName(document.querySelector('#gdn').textContent)));
}

function PageData(pageURL, imageURL, imageName, nextNL, realIndex, imageNumber) {
	this.pageURL = pageURL.split('?')[0];
	this.imageURL = imageURL;
	this.imageName = getSafeName(imageName);
	this._imageName = this.imageName;
	this.equalCount = 1;
	this.nextNL = nextNL;
	this.realIndex = realIndex;
	this.imageNumber = imageNumber;
}

// rename images that have the same name
function renameImages() {
	imageList.forEach(function(elem, index) {
		// if Number Images are enabled, filename won't be changed, just numbering
		if (!needNumberImages) {
			for (var i = 0; i < index; i++) {
				if (elem !== undefined && imageList[i] !== undefined && elem.imageName.toLowerCase() === imageList[i]['imageName'].toLowerCase()) {
					var nameParts = elem.imageName.split('.');
					nameParts[nameParts.length - 2] += ' (' + (++imageList[i].equalCount) + ')';
					elem.imageName = nameParts.join('.');
					break;
				}
			}
		}
		else elem['imageName'] = elem['imageNumber'] + (setting['number-separator'] ? setting['number-separator'] : '：') + elem['imageName'];
	});
}

// store responsed content from GM_xhr
// Updated on 1.19: Now the index argument is the page's number - 1 (original is page's number)
function storeRes(res, index) {
	imageData[index] = res;
	downloadedCount++;
	console.log('[EHD] Index >', index + 1, ' | RealIndex >', imageList[index]['realIndex'], ' | Name >', imageList[index]['imageName'], ' | RetryCount >', retryCount[index], ' | DownloadedCount >', downloadedCount, ' | FetchCount >', fetchCount, ' | FailedCount >', failedCount);
	fetchCount--;

	updateTotalStatus();
	if (!isPausing) checkFailed();
	
	res = null;
}

function generateZip(isFromFS, fs, isRetry, forced){
	isSaving = true;

	// remove pause button
	if (!forced && ehDownloadDialog.contains(ehDownloadPauseBtn)) {
		ehDownloadDialog.removeChild(ehDownloadPauseBtn);
		while (fetchThread[0]) {
			fetchThread.pop();
		}
	}

	if (!isFromFS && !isRetry) {
		if (setting['save-info-list'].toString().indexOf('page-links') >= 0) {
			imageList.forEach(function(elem, index){
				// Image URL may useless, see https://github.com/ccloli/E-Hentai-Downloader/issues/6
				infoStr += '\n\nPage ' + elem['realIndex'] + ': ' + elem['pageURL'] + '\nImage ' + elem['realIndex'] + ': ' + elem['imageName'] /*+ '\nImage URL: ' + elem['imageURL']*/;
			});
		}
		pushDialog('\nFinish downloading at ' + new Date() + '\n');
		infoStr += '\n\nDownloaded at ' + new Date() + '\n\nGenerated by E-Hentai Downloader. https://github.com/ccloli/E-Hentai-Downloader';

		if (setting['save-info'] === 'file' || !setting['save-info']) {
			(dirName && !ehDownloadRegex.slashOnly.test(dirName) ? zip.folder(dirName) : zip).file('info.txt', infoStr.replace(/\n/gi, '\r\n'));
		}
	}

	pushDialog('\n\nGenerating Zip file...\n');

	var fs = fs || ehDownloadFS.fs;

	var progress = document.createElement('progress');
	var curFile = document.createElement('div');
	progress.className = 'ehD-pt-gen-progress';
	curFile.className = 'ehD-pt-gen-filename';
	curFile.textContent = ' ';
	ehDownloadDialog.appendChild(progress);
	ehDownloadDialog.appendChild(curFile);
	ehDownloadDialog.scrollTop = ehDownloadDialog.scrollHeight;

	var saveToFileSystem = function(abData) {
		curFile.textContent = ' ';

		var fsErrorHandler = function(error) {
			ehDownloadFS.errorHandler(error);
			ehDownloadFS.removeAllFiles();

			if (confirm('An error occured when storing files to FileSystem.\n' +
						'Error Name: ' + (error.name || 'Unknown Error') + '\n' +
						'Error Message: ' + error.message + '\n\n' +
						'Should I try FileSystem again (Yes) or redirect to try using Blob (No)? \n' +
						'* If the error message shows there\'s no more free disk space, try removing some files from the drive where Chrome installed (mostly C: on Windows)')) {
				saveToFileSystem(abData);
			}
			else {
				ehDownloadFS.needFileSystem = false;
				saveToBlob(abData);
			}
		};

		var fs = fs || ehDownloadFS.fs;
		pushDialog('\n\nSlicing and storing Zip file to FileSystem...');
		var data = abData;
		var dataIndex = 0;
		var dataLength = data.byteLength;
		var loopWrite = function(fileEntry){
			fileEntry.createWriter(function(fileWriter){
				//fileWriter.seek(fileWriter.length);
				dataIndex = fileWriter.length;
				if (dataIndex >= dataLength) {
					data = undefined;
					abData = undefined;
					return setTimeout(function(){
						ehDownloadFS.saveAs(isFromFS ? fs : undefined, forced);
						isSaving = false;
					}, 1500);
				}
				fileWriter.seek(dataIndex);
				var dataLastIndex = dataIndex + 1024 * 1024 * 10;
				// I tried setting it as 100MB but some parts were still gone, so I have to make it smaller.
				console.log('[EHD] DataIndex >', dataIndex, '| DataLastIndex >', dataLastIndex, '| FileWriterLength >', fileWriter.length, '| DataLength >', dataLength);
				pushDialog('\n' + dataIndex + '-' + dataLastIndex + '/' + dataLength);
				var blob = createBlob([data.slice(dataIndex, dataLastIndex)], {type: 'application/zip'});
				fileWriter.write(blob);
				if ('close' in blob) blob.close(); // File Blob.close() API, not supported by all the browser now
				blob = null;
				setTimeout(loopWrite, 100, fileEntry);
			}, fsErrorHandler);
		};
		
		fs.root.getFile(unsafeWindow.gid + '.zip', {create: true}, function(fileEntry){
			if (fileEntry.isFile) fileEntry.remove(function(){
				console.log('[EHD] File', fileName, 'is removed.');
			}, fsErrorHandler);
			else if (fileEntry.isDirectory) fileEntry.removeRecursively(function() {
				console.log('[EHD] Directory', fileName, 'is removed.');
			}, fsErrorHandler);
			
			fs.root.getFile(unsafeWindow.gid + '.zip', {create: true}, loopWrite, fsErrorHandler);
		}, fsErrorHandler);
		//fs.root.getFile(unsafeWindow.gid + '.zip', {create: true}, loopWrite, fsErrorHandler);
	};

	var saveToBlob = function(abData){
		curFile.textContent = 'Generating Blob object...';
		var save = function() {
			// rebuild blob object if "File is not exist" occured
			var blob = createBlob([abData], {type: setting['save-as-cbz'] ? 'application/vnd.comicbook+zip' : 'application/zip'});
			saveAs(blob, fileName + (setting['save-as-cbz'] ? '.cbz' : '.zip'));

			setTimeout(function(){
				if ('close' in blob) blob.close();
				blob = null;
			}, 10e3); // 10s to fixed Chrome delay downloads
		}
		save();

		var redownloadBtn = document.createElement('button');
		redownloadBtn.textContent = 'Not download? Click here to download';
		redownloadBtn.addEventListener('click', save);
		ehDownloadDialog.appendChild(redownloadBtn);

		if (!forced) {
			insertCloseButton(function() {
				redownloadBtn.removeEventListener('click', save);
				ehDownloadDialog.removeChild(redownloadBtn);
				abData = null;
				save = null;
			});
		}
		isSaving = false;
	};

	var errorHandler = function (error) {
		abData = undefined;

		pushDialog('An error occurred when generating Zip file as ArrayBuffer.');
		console.error('[EHD] An error occurred when generating Zip file as ArrayBuffer.');
		console.error(error);
		if (confirm('An error occurred when generating Zip file as ArrayBuffer. Try again?')) return generateZip(isFromFS, fs, 1);

		var fsErrorHandler = function(error) {
			ehDownloadFS.errorHandler(error);
			ehDownloadFS.removeAllFiles();

			if (confirm('An error occured when storing files to FileSystem.\n' +
						'Error Name: ' + (error.name || 'Unknown Error') + '\n' +
						'Error Message: ' + error.message + '\n\n' +
						'Should I try again (Yes) or stop it (No, and the downloaded file will be removed)? \n' +
						'* If the error message shows there\'s no more free disk space, try removing some files from the drive where Chrome installed (mostly C: on Windows)')) {
				generateZip(isFromFS, fs, isRetry, forced);
			}
		};

		if (isFromFS || ehDownloadFS.needFileSystem) {
			// if enabled file system, then store all files into file system
			pushDialog('Storing files into File System...');
			var files = zip.file(/.*/);
			var fileIndex = 0;
			var filesLength = files.length;
			var initFS = function(r){
				fs = r;
				fs.root.getDirectory('raw', {create: true}, loopWrite, fsErrorHandler);
			};
			var loopWrite = function(){
				fs.root.getFile('raw/' + files[fileIndex]['name'], {create: true}, function(fileEntry){
					fileEntry.createWriter(function(fileWriter){
						console.log('[EHD] FileIndex >', fileIndex, '| FilesLength >', filesLength);
						var blob = createBlob([files[fileIndex].asArrayBuffer()], {type: 'application/octet-stream'});
						fileWriter.write(blob);
						if ('close' in blob) blob.close(); // File Blob.close() API, not supported by all the browser now
						blob = null;
						fileIndex++; // some files may still gone in this way, I have no good way to solve it
						if (fileIndex < filesLength) setTimeout(loopWrite, 100);
						else {
							fs.root.getFile('config.txt', {create: true}, function(fileEntry){
								fileEntry.createWriter(function(fileWriter){
									var t = JSON.stringify({fileName: fileName, dirName: dirName});
									var blob = createBlob([t], {type: 'text/plain'});
									fileWriter.write(blob);
									if ('close' in blob) blob.close(); // File Blob.close() API, not supported by all the browser now
									blob = null;
									pushDialog('Success!\nPlease close this tab and open a new tab to download.\nIf you still can\'t download it, try using <a href="https://chrome.google.com/webstore/detail/nhnjmpbdkieehidddbaeajffijockaea" target="_blank">HTML5 FileSystem Explorer</a> to save them.');

									files.forEach(function(elem){
										zip.remove(elem.name);
									});
									zip = undefined;
									isSaving = false;
								});
							});
						}
					}, fsErrorHandler);
				}, fsErrorHandler);
			};
			requestFileSystem(window.TEMPORARY, 1024 * 1024 * 1024 * 1024, initFS, fsErrorHandler);
		}
	}

	try {
		var lastMetaTime = 0;
		var generateConfig = {
			type: 'arraybuffer',
			compression: setting['compression-level'] ? 'DEFLATE' : 'STORE',
			compressionOptions: {
				level: Math.min(Math.max(setting['compression-level'], 1), 9)
			},
			streamFiles: setting['file-descriptor'] ? true : false,
			comment: setting['save-info'] === 'comment' ? infoStr.replace(/\n/gi, '\r\n') : undefined
		};
		var onProgress = function (meta) {
			// meta update function will be called nearly every 1ms, for performance, update every 300ms
			// anyway it's still too fast so that you may still cannot see the update
			var thisMetaTime = Date.now();
			if (thisMetaTime - lastMetaTime < 300) {
				return;
			}
			lastMetaTime = thisMetaTime;
			progress.value = meta.percent / 100;
			curFile.textContent = meta.currentFile || 'Calculating extra data...';
		};

		var defaultHandle = function() {
			// build arraybuffer object to detect if it generates successfully
			zip.generateAsync(generateConfig, onProgress).then(function (abData) {
				progress.value = 1;

				if (isFromFS || ehDownloadFS.needFileSystem) { // using filesystem to save file is needed
					saveToFileSystem(abData);
				}
				else { // or just using blob
					saveToBlob(abData);
				}

				if (!forced) {
					if (emptyAudio) {
						emptyAudio.pause();
					}
					zip.file(/.*/).forEach(function (elem) {
						zip.remove(elem.name);
					});
				}
				abData = undefined;
			}).catch(errorHandler);
		};

		var streamHandle = function () {
			var stream = zip.generateInternalStream(generateConfig, onProgress);
			var fs = fs || ehDownloadFS.fs;
			var writer;

			var fsErrorHandler = function (err) {
				console.error('[EHD] An error occurred when generating Zip file as stream, fallback to default generate.');
				console.error(err);
				pushDialog('An error occurred when generating Zip file as stream, fallback to default generate.');
				stream.pause();
				defaultHandle();
			};

			var chunk = [];
			var done = false;
			stream.on('data', function (data, meta) {
				if (!writer) {
					throw new Error('FileWriter is not usable.');
				}

				onProgress(meta);
				chunk.push(data);
			}).on('end', function () {
				progress.value = 1;

				if (!forced) {
					if (emptyAudio) {
						emptyAudio.pause();
					}
					zip.file(/.*/).forEach(function (elem) {
						zip.remove(elem.name);
					});
				}
				done = true;
			}).on('error', fsErrorHandler);

			fs.root.getFile(unsafeWindow.gid + '.zip', { create: true }, function (fileEntry) {
				if (fileEntry.isFile) fileEntry.remove(function () {
					console.log('[EHD] File', fileName, 'is removed.');
				}, fsErrorHandler);
				else if (fileEntry.isDirectory) fileEntry.removeRecursively(function () {
					console.log('[EHD] Directory', fileName, 'is removed.');
				}, fsErrorHandler);

				fs.root.getFile(unsafeWindow.gid + '.zip', { create: true }, function (entry) {
					entry.createWriter(function (fileWriter) {
						writer = fileWriter;
						writer.onwriteend = function (e) {
							if (done && !chunk.length) {
								setTimeout(function () {
									ehDownloadFS.saveAs(isFromFS ? fs : undefined, forced);
									isSaving = false;
								}, 0);
								return;
							}
							var blob = createBlob(chunk, { type: 'application/zip' });
							writer.write(blob);
							if ('close' in blob) blob.close(); // File Blob.close() API, depreated
							blob = null;
							chunk = [];
						};
						writer.onerror = fsErrorHandler;
						if (stream) {
							stream.resume();
							setTimeout(() => {
								writer.write(new Blob(chunk, { type: 'application/zip' }));
							}, 0);
						}
					});
				}, fsErrorHandler);
			}, fsErrorHandler);
		}

		if (isFromFS || ehDownloadFS.needFileSystem) {
			streamHandle();
			return;
		}
		defaultHandle();
	}
	catch (error) {
		errorHandler(error);
	}
}

// update progress table info
function updateProgress(nodeList, data) {
	if (data.name !== undefined) nodeList.fileName.textContent = data.name;
	if (data.progress !== undefined && !Number.isNaN(data.progress)) nodeList.progress.value = data.progress;
	if (data.progressText !== undefined) nodeList.progressText.textContent = data.progressText;
	if (data.status !== undefined) nodeList.statusText.textContent = data.status;
	if (data.class !== undefined) nodeList.current.className = ['ehD-pt-item', data.class].join(' ').trim();
}

// update ehDownloadStatus
function updateTotalStatus(){
	ehDownloadStatus.textContent = 'Total: ' + totalCount + ' | Downloading: ' + fetchCount + ' | Succeed: ' + downloadedCount + ' | Failed: ' + failedCount;
	if (needTitleStatus) document.title = '[' + (isPausing ? '❙❙' : downloadedCount < totalCount ? '↓ ' + downloadedCount + '/' + totalCount : totalCount === 0 ? '↓' : '√' ) + '] ' + pretitle;
}

// Updated on 1.19: Now the index argument is the page's number - 1 (original is page's number)
function failedFetching(index, nodeList, forced){
	if (!isDownloading || imageData[index] instanceof ArrayBuffer) return; // Temporarily fixes #31	
	if (typeof fetchThread[index] !== 'undefined' && 'abort' in fetchThread[index]) fetchThread[index].abort();
	console.error('[EHD] Index >', index + 1, ' | RealIndex >', (imageList[index] || {})['realIndex'], ' | Name >', (imageList[index] || {})['imageName'], ' | RetryCount >', retryCount[index], ' | DownloadedCount >', downloadedCount, ' | FetchCount >', fetchCount, ' | FailedCount >', failedCount);

	if (!forced && retryCount[index] < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
		retryCount[index]++;
		fetchOriginalImage(index, nodeList);
	}
	else {
		updateProgress(nodeList, {
			class: 'ehD-pt-failed'
		});

		if (imageList[index]) {
			imageList[index]['imageFinalURL'] = null;
		}
		failedCount++;
		if (!isPausing || !setting['force-pause']) fetchCount--;

		updateTotalStatus();
		checkFailed();
	}
}

function saveDownloaded(forced){
	renameImages();

	for (var j = 0; j < imageData.length; j++) {
		if (imageData[j] != null && imageData[j] !== 'Fetching') {
			(dirName && !ehDownloadRegex.slashOnly.test(dirName) ? zip.folder(dirName) : zip).file(imageList[j]['imageName'], imageData[j]);
			if (!forced) imageData[j] = null;
		}
	}
	generateZip(false, undefined, false, forced);
	if (forced) {
		// if force download zip file, image data should be recoverd to original content
		imageList.forEach(function(elem, index) {
			elem.equalCount = 1;
			elem.imageName = elem._imageName;
		});
	}
}

function checkFailed() {
	if (downloadedCount + failedCount < totalCount) { // download not finished, some files are not being called to download
		requestDownload();
	}
	else if (failedCount > 0) { // all files are called to download and some files can't be downloaded
		if (fetchCount === 0) { // all files are finished downloading
			for (var i = 0; i < fetchThread.length; i++) {
				if (typeof fetchThread[i] !== 'undefined' && 'abort' in fetchThread[i]) fetchThread[i].abort();
			}
			if (setting['number-auto-retry'] || confirm('Some images failed to download. Would you like to try them again?')) {
				retryAllFailed();
			}
			else {
				var failedPages = [];
				for (var i = 0; i < imageData.length; i++) {
					if (imageData[i] == null || imageData[i] === 'Fetching') {
						failedPages.push(i + 1);
					}
				}
				pushDialog('\nFetch images failed.\nFailed Pages: ' + failedPages.join(',') + '\n');
				if (setting['auto-download-cancel'] || confirm('Fetch images failed, Please try again later.\n\nWould you like to download downloaded images?')) {
					saveDownloaded();
				}
				else {
					insertCloseButton();
				}
				isDownloading = false;

				loadImageLimits(true);
			}
		}
	}
	else { // all files are downloaded successfully
		renameImages();
		for (var j = 0; j < totalCount; j++) {
			(dirName && !ehDownloadRegex.slashOnly.test(dirName) ? zip.folder(dirName) : zip).file(imageList[j]['imageName'], imageData.shift());
		}
		generateZip();
		isDownloading = false;

		loadImageLimits(true);
	}
}

// Updated on 1.19: Now the index argument is the page's number - 1 (original is page's number)
function fetchOriginalImage(index, nodeList) {
	// GM_xhr 于 GreaseMonkey 2.3 / 2.4 中开始支持 responseType 以获取返回类型为 ArrayBuffer 的请求
	// GM_xhr support responseType to fetch ArrayBuffer request on 2.3 / 2.4
	// https://github.com/greasemonkey/greasemonkey/issues/1834
	//console.log(imageList[index]);
	if (retryCount[index] === undefined) retryCount[index] = 0;
	if (isPausing) return;

	var requestURL = imageList[index]['imageFinalURL'] || imageList[index]['imageURL'];
	var needScrollIntoView = ehDownloadDialog.clientHeight + ehDownloadDialog.scrollTop >= ehDownloadDialog.scrollHeight - 5;

	if (setting['original-download-domain']) {
		requestURL = requestURL.replace(location.hostname, setting['original-download-domain']);
	}

	if (nodeList === undefined) {
		var node = progressTable.querySelector('tr[data-index="' + index + '"]');
		if (!node) {
			node = document.createElement('tr');
			node.className = 'ehD-pt-item';
			node.setAttribute('data-index', index);
			node.innerHTML = '\
				<td class="ehD-pt-name">#' + imageList[index]['realIndex'] + ': ' + imageList[index]['imageName'] + '</td>\
				<td class="ehD-pt-progress-outer">\
					<progress class="ehD-pt-progress"></progress>\
					<span class="ehD-pt-progress-text"></span>\
				</td>\
				<td class="ehD-pt-status">\
					<span class="ehD-pt-status-text">Pending...</span>\
					<span class="ehD-pt-abort">Force Abort</span>\
				</td>';
			progressTable.appendChild(node);
		}

		nodeList = {
			current: node,
			fileName: node.getElementsByTagName('td')[0],
			status: node.getElementsByTagName('td')[2],
			statusText: node.getElementsByClassName('ehD-pt-status-text')[0],
			progress: node.getElementsByTagName('progress')[0],
			progressText: node.getElementsByTagName('span')[0],
			abort: node.getElementsByClassName('ehD-pt-abort')[0]
		};
	}
	var speedInfo = {
		lastProgress: 0,
		lastTimestamp: new Date().getTime(),
		zeroDetect: null,
		expiredDetect: null
	};

	if (needScrollIntoView) {
		ehDownloadDialog.scrollTop = ehDownloadDialog.scrollHeight;
	}

	var zeroSpeedHandler = function(res){
		if (imageData[index] instanceof ArrayBuffer) { // Has already downloaded
			updateProgress(nodeList, {
				name: '#' + imageList[index]['realIndex'] + ': ' + imageList[index]['imageName'],
				status: 'Succeed!',
				progress: '1',
				progressText: '100%',
				class: 'ehD-pt-succeed'
			});

			return;
		}
		if (!isDownloading) return; // Temporarily fixes #31
		if (isPausing && setting['force-pause']) return;

		updateProgress(nodeList, { progressText: '0 KB/s' });

		if (setting['speed-detect'] && speedInfo.expiredDetect === null) {
			speedInfo.expiredDetect = setTimeout(expiredSpeedHandler, (setting['speed-expired'] ? setting['speed-expired'] : 30) * 1000, res);
		}
	};

	var expiredSpeedHandler = function(res){
		if (imageData[index] instanceof ArrayBuffer) { // Has already downloaded
			updateProgress(nodeList, {
				name: '#' + imageList[index]['realIndex'] + ': ' + imageList[index]['imageName'],
				status: 'Succeed!',
				progress: '1',
				progressText: '100%',
				class: 'ehD-pt-succeed'
			});

			return;
		}
		if (!isDownloading) return; // Temporarily fixes #31
		if (isPausing && setting['force-pause']) return;

		if (typeof fetchThread[index] !== 'undefined' && 'abort' in fetchThread[index]) fetchThread[index].abort();

		console.log('[EHD] #' + (index + 1) + ': Speed Too Low');
		console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);

		updateProgress(nodeList, {
			status: 'Failed! (Low Speed)',
			progress: '0',
			progressText: '',
			class: 'ehD-pt-warning'
		});

		if (ehDownloadRegex.originalImagePattern.test(imageList[index]['imageURL']) && imageList[index]['imageURL'] !== res.finalUrl) {
			imageList[index]['imageFinalURL'] = res.finalUrl;
		}

		for (var i in res) {
			delete res[i];
		}

		failedFetching(index, nodeList);
	};

	var removeTimerHandler = function(){
		if (speedInfo.expiredDetect !== null) {
			clearTimeout(speedInfo.expiredDetect);
			speedInfo.expiredDetect = null;
		}

		if (speedInfo.zeroDetect !== null) {
			clearTimeout(speedInfo.zeroDetect);
			speedInfo.zeroDetect = null;
		}
	};

	var requestHeaders = {
		Referer: imageList[index]['pageURL'],
		'X-Alt-Referer': imageList[index]['pageURL']
	};

	if (setting['pass-cookies']) {
		requestHeaders.Cookie = document.cookie;
	}

	fetchThread[index] = GM_xmlhttpRequest({
		method: 'GET',
		url: requestURL,
		responseType: 'arraybuffer',
		timeout: (setting['timeout'] !== undefined) ? Number(setting['timeout']) * 1000 : 300000,
		headers: requestHeaders,
		onprogress: function(res) {
			var t = new Date().getTime();
			var speedText;
			var speedKBs = res.lengthComputable ? Number((res.loaded - speedInfo.lastProgress) / (t - speedInfo.lastTimestamp) / 1.024) : -1;

			if (t - speedInfo.lastTimestamp >= 1000 || speedInfo.lastProgress === 0) {
				speedText = res.lengthComputable ? speedKBs.toFixed(2) + ' KB/s' : '';
				speedInfo.lastProgress = res.loaded;
				speedInfo.lastTimestamp = t;
			}

			updateProgress(nodeList, {
				name: '#' + imageList[index]['realIndex'] + ': ' + imageList[index]['imageName'],
				progress: res.lengthComputable ? res.loaded / (res.total || 1) : '',
				progressText: speedText,
				class: '',
				status: retryCount[index] === 0 ? 'Downloading...' : 'Retrying (' + retryCount[index] + '/' + (setting['retry-count'] !== undefined ? setting['retry-count'] : 3) + ') ...'
			});

			// set showing speed to 0
			if (speedInfo.zeroDetect !== null) {
				clearTimeout(speedInfo.zeroDetect);
				speedInfo.zeroDetect = null;
			}
			speedInfo.zeroDetect = setTimeout(zeroSpeedHandler, 3000, res);

			if (setting['speed-detect']) {
				if (speedKBs >= setting['speed-min'] ? setting['speed-min'] : 5) {

					if (speedInfo.expiredDetect !== null) {
						clearTimeout(speedInfo.expiredDetect);
						speedInfo.expiredDetect = null;
					}

					for (var i in res) {
						delete res[i];
					}
				}
				else if (speedInfo.expiredDetect === null) {
					speedInfo.expiredDetect = setTimeout(expiredSpeedHandler, (setting['speed-expired'] ? setting['speed-expired'] : 30) * 1000, res);
					console.log('[EHD] Speed detect handler is inited for', index + 1, '!');
				}
			}

			if (ehDownloadRegex.originalImagePattern.test(imageList[index]['imageURL']) && imageList[index]['imageURL'] !== res.finalUrl) {
				imageList[index]['imageFinalURL'] = res.finalUrl;
			}
		},
		onload: function(res) {
			try {
				removeTimerHandler();
				if (!isDownloading || imageData[index] instanceof ArrayBuffer) return; // Temporarily fixes #31

				// cache them to reduce waiting time and CPU usage on Chrome with Tampermonkey
				// (Tampermonkey uses a dirty way to give res.response, transfer string to arraybuffer every time)
				// now store progress just spent ~1s instead of ~8s
				var response = res.response;
				var responseHeaders = res.responseHeaders;
				
				// use regex to fixed compatibility with http/2, as its headers are lower case (at least fixed with Yandex Turbo)
				var mime = responseHeaders.match(/Content-Type:/i) ? responseHeaders.split(/Content-Type:/i)[1].split('\n')[0].trim().split('/') : ['', ''];

				if (!response) {
					console.log('[EHD] #' + (index + 1) + ': Empty Response (See: https://github.com/ccloli/E-Hentai-Downloader/issues/16 )');
					console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);

					updateProgress(nodeList, {
						status: 'Failed! (Empty Response)',
						progress: '0',
						progressText: '',
						class: 'ehD-pt-warning'
					});

					for (var i in res) {
						delete res[i];
					}
					return failedFetching(index, nodeList);

					// res.response polyfill is useless, so it has been removed
				}

				var byteLength = response.byteLength;
				var responseText;
				if (mime[0] === 'text') {
					responseText = new TextDecoder().decode(new DataView(response));
				}

				if (byteLength === 925) { // '403 Access Denied' Image Byte Size
					// GM_xhr only support abort()
					console.log('[EHD] #' + (index + 1) + ': 403 Access Denied');
					console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);

					updateProgress(nodeList, {
						status: 'Failed! (Error 403)',
						progress: '0',
						progressText: '',
						class: 'ehD-pt-warning'
					});

					for (var i in res) {
						delete res[i];
					}
					return failedFetching(index, nodeList, true);
				}
				if (byteLength === 28) { // 'An error has occurred. (403)' Length
					console.log('[EHD] #' + (index + 1) + ': An error has occurred. (403)');
					console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);
					
					updateProgress(nodeList, {
						status: 'Failed! (Error 403)',
						progress: '0',
						progressText: '',
						class: 'ehD-pt-warning'
					});

					for (var i in res) {
						delete res[i];
					}
					return failedFetching(index, nodeList, true);
				}
				if (
					byteLength === 142 ||   // Image Viewing Limits String Byte Size (exhentai)
					byteLength === 144 ||   // Image Viewing Limits String Byte Size (g.e-hentai)
					byteLength === 28658 || // '509 Bandwidth Exceeded' Image Byte Size
					byteLength === 102 || // You have reached the image limit, and do not have sufficient GP to buy a download quota.
					byteLength === 93 || // Downloading original files during peak hours requires GP, and you do not have enough.
					(mime[0] === 'text' && (
						responseText.indexOf('You have exceeded your image viewing limits') >= 0 ||
						responseText.indexOf('do not have sufficient GP to buy') >= 0 ||
						responseText.indexOf('requires GP, and you do not have enough') >= 0
					)) // directly detect response content in case byteLength will be modified
				) {
					// thought exceed the limits, downloading image is still accessable
					/*for (var i = 0; i < fetchThread.length; i++) {
						if (typeof fetchThread[i] !== 'undefined' && 'abort' in fetchThread[i]) fetchThread[i].abort();
					}*/
					console.log('[EHD] #' + (index + 1) + ': Exceed Image Viewing Limits / 509 Bandwidth Exceeded');
					console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);

					updateProgress(nodeList, {
						status: 'Failed! (Exceed Limits/GPs)',
						progress: '0',
						progressText: '',
						class: 'ehD-pt-failed'
					});

					for (var i in res) {
						delete res[i];
					}

					failedCount++;
					fetchCount--;
					updateTotalStatus();

					if (isPausing) return;

					pushDialog('You have exceeded your image viewing limits, or you need GP to download.\n');
					isPausing = true;
					updateTotalStatus();
					if (emptyAudio) {
						emptyAudio.pause();
					}

					if (ehDownloadDialog.contains(ehDownloadPauseBtn)) {
						ehDownloadDialog.removeChild(ehDownloadPauseBtn);
					}

					if (confirm('You have temporarily reached the limit for how many images you can browse.\n\
If you don\'t have enough limit, or it\'s in site\'s peak hours, or the gallery is uploaded for a long time, you need to use GP to download, but you don\'t have enough GP to add quota.\n\n\
To increase viewing limits, you can:\n\
- If you are not signed in, sign in to get quota.\n\
- Run Hentai@Home to get points which you can pay to increase your limit.\n\
- Check back in a few hours, and it\'ll slowly recovered (3 points per minute by default).\n\
- You can reset it by paying your GPs or credits.\n\n\
To gain GP, you can:\n\
- Upload galleries and earn GP from visits and users using offical archive download.\n\
- Run Hentai@Home to earn GP from hit.\n\
- Upload torrents.\n\
- Write comments and gain from others voting.\n\
- Exchange GP with credits or hath, or donation.\n\
- Wait till your limits recovered or the peak hours passed.\n\n\
If you want to reset your limits by paying your GPs or credits right now, or exchange GPs, choose YES, and do it in the opened window. Or if you want to wait a few minutes until you have enough free limit, then continue, choose NO.')) {
						window.open('https://e-hentai.org/home.php');
					}

					var resetButton = document.createElement('a');
					resetButton.innerHTML = '<button>Reset Limits</button>';
					resetButton.setAttribute('href', 'https://e-hentai.org/home.php');
					resetButton.setAttribute('target', '_blank');
					ehDownloadDialog.appendChild(resetButton);

					var continueButton = document.createElement('button');
					continueButton.innerHTML = 'Continue Download';
					continueButton.addEventListener('click', function(){
						//fetchCount = 0;
						ehDownloadDialog.removeChild(resetButton);
						ehDownloadDialog.removeChild(continueButton);
						ehDownloadDialog.removeChild(cancelButton);
						ehDownloadDialog.appendChild(ehDownloadPauseBtn);

						isPausing = false;
						initProgressTable();
						checkFailed();
					});
					ehDownloadDialog.appendChild(continueButton);

					var cancelButton = document.createElement('button');
					cancelButton.innerHTML = 'Cancel Download';
					cancelButton.addEventListener('click', function(){
						ehDownloadDialog.removeChild(resetButton);
						ehDownloadDialog.removeChild(continueButton);
						ehDownloadDialog.removeChild(cancelButton);

						if (setting['auto-download-cancel'] || confirm('You have exceeded your image viewing limits. Would you like to save downloaded images?')) {
							saveDownloaded();
						}
						else {
							insertCloseButton();
						}
						isPausing = false;
						isDownloading = false;

						loadImageLimits(true);
					});
					ehDownloadDialog.appendChild(cancelButton);

					return;
				}
				// ip banned
				if (mime[0] === 'text') {
					if (responseText.indexOf('Your IP address has been temporarily banned') >= 0) {
						console.log('[EHD] #' + (index + 1) + ': IP address banned');
						console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);

						updateProgress(nodeList, {
							status: 'Failed! (IP banned)',
							progress: '0',
							progressText: '',
							class: 'ehD-pt-failed'
						});

						for (var i in res) {
							delete res[i];
						}

						failedCount++;
						fetchCount--;
						updateTotalStatus();

						if (isPausing) return;

						pushDialog('Your IP address has been temporarily banned.\n');
						isPausing = true;
						updateTotalStatus();
						if (emptyAudio) {
							emptyAudio.pause();
						}

						if (ehDownloadDialog.contains(ehDownloadPauseBtn)) {
							ehDownloadDialog.removeChild(ehDownloadPauseBtn);
						}

						var expiredTime = responseText.match(ehDownloadRegex.IPBanExpires);

						alert('Your IP address has been temporarily banned. \n\n\
							Make sure your download settings are not configured to download too fast. If you are using conservative rules, check if your computer is infected with malware, or if you are using a shared IP with others.\n\
							If you can change your IP (like using a proxy) or wait until you\'re unblocked, you can then continue your download; or cancel your download and get downloaded images.\n\n' + 
							(expiredTime ? '\n' + expiredTime[0] : '')
						);

						var continueButton = document.createElement('button');
						continueButton.innerHTML = 'Continue Download';
						continueButton.addEventListener('click', function () {
							//fetchCount = 0;
							ehDownloadDialog.removeChild(continueButton);
							ehDownloadDialog.removeChild(cancelButton);
							ehDownloadDialog.appendChild(ehDownloadPauseBtn);

							isPausing = false;
							initProgressTable();
							checkFailed();
						});
						ehDownloadDialog.appendChild(continueButton);

						var cancelButton = document.createElement('button');
						cancelButton.innerHTML = 'Cancel Download';
						cancelButton.addEventListener('click', function () {
							ehDownloadDialog.removeChild(continueButton);
							ehDownloadDialog.removeChild(cancelButton);

							if (setting['auto-download-cancel'] || confirm('Would you like to save downloaded images?')) {
								saveDownloaded();
							}
							else {
								insertCloseButton();
							}
							isPausing = false;
							isDownloading = false;

							loadImageLimits(true);
						});
						ehDownloadDialog.appendChild(cancelButton);

						return;
					}
					if (responseText.indexOf('as your account has been suspended') >= 0) {
						console.log('[EHD] #' + (index + 1) + ': Account Suspended');
						console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);

						updateProgress(nodeList, {
							status: 'Failed! (Suspended)',
							progress: '0',
							progressText: '',
							class: 'ehD-pt-failed'
						});

						for (var i in res) {
							delete res[i];
						}
						
						if (setting['force-resized'] || confirm('Your account has been suspended.\n\n\
							Your account is suspended by E-Hentai, and you can check your unblock time on E-Hentai forum. At this time, you cannot access to any user-related page and download original images.\n\
							You can still access to resized images, would you like to switch to download resized images?')) {
							setting['force-resized'] = true;
							getPageData(index);
							return;
						}

						if (setting['auto-download-cancel'] || confirm('Would you like to save downloaded images?')) {
							saveDownloaded();
						}
						else {
							insertCloseButton();
						}
						isDownloading = false;

						loadImageLimits(true);
						return;
					}
				}
				// res.status should be detected at here, because we should know are we reached image limits at first
				if (res.status !== 200) {
					console.log('[EHD] #' + (index + 1) + ': Wrong Response Status (' + res.status + ')');
					console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);

					updateProgress(nodeList, {
						status: 'Failed! (Status ' + res.status + ')',
						progress: '0',
						progressText: '',
						class: 'ehD-pt-warning'
					});

					for (var i in res) {
						delete res[i];
					}
					return failedFetching(index, nodeList, res.status === 404);
				}
				// hot fix for new E-Hentai original image server, as it returns an invalid `Content-Type` header (#153)
				if (['image', 'jpg', 'jpeg', 'gif', 'png', 'bmp', 'tif', 'tiff', 'webp', 'apng'].indexOf(mime[0]) < 0) {
					console.log('[EHD] #' + (index + 1) + ': Wrong Content-Type');
					console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);

					updateProgress(nodeList, {
						status: 'Failed! (Wrong MIME)',
						progress: '0',
						progressText: '',
						class: 'ehD-pt-warning'
					});

					for (var i in res) {
						delete res[i];
					}
					return failedFetching(index, nodeList);
				}

				// logs in #80 shows sometimes it didn't match the regex, but cannot reproduce right now
				try {
					var imageName = imageList[index]['imageName'];
					if (ehDownloadRegex.resFileName.test(res.responseHeaders)) {
						imageName = getSafeName(res.responseHeaders.match(ehDownloadRegex.resFileName)[1].trim())
					} else {
						var fileNameFromUrl = (res.finalUrl || requestURL).split('/').pop().split('?').shift();
						// TODO: enum all image file extensions? at least blocks fullimg.php
						if (fileNameFromUrl.indexOf('.') > 0 && fileNameFromUrl.indexOf('.php') < 0) {
							imageName = getSafeName(fileNameFromUrl);
						} else {
							imageName = imageList[index]['imageName'];
						}
					}
					imageList[index]['_imageName'] = imageList[index]['imageName'] = imageName;
				}
				catch (error) {
					console.log('[EHD] #' + (index + 1) + ': Parse file name failed');
					console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);

					imageList[index]['_imageName'] = imageList[index]['imageName'];
				}

				updateProgress(nodeList, {
					name: '#' + imageList[index]['realIndex'] + ': ' + imageList[index]['imageName'],
					status: 'Succeed!',
					progress: '1',
					progressText: '100%',
					class: 'ehD-pt-succeed'
				});

				storeRes(response, index);

				for (var i in res) {
					delete res[i];
				}
				response = null;
			}
			catch (error) {
				console.log('[EHD] #' + (index + 1) + ': Unknown Error (Please send feedback)');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);
				console.log(error);

				updateProgress(nodeList, {
					status: 'Failed! (Unknown)',
					progress: '0',
					progressText: '',
					class: 'ehD-pt-failed'
				});

				for (var i in res) {
					delete res[i];
				}
				return failedFetching(index, nodeList);
			}
		},
		onerror: function(res){
			removeTimerHandler();
			if (!isDownloading || imageData[index] instanceof ArrayBuffer) return; // Temporarily fixes #31

			console.log('[EHD] #' + (index + 1) + ': Network Error');
			console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);

			updateProgress(nodeList, {
				status: 'Failed! (Network Error)',
				progress: '0',
				progressText: '',
				class: 'ehD-pt-warning'
			});

			if (ehDownloadRegex.originalImagePattern.test(imageList[index]['imageURL']) && imageList[index]['imageURL'] !== res.finalUrl) {
				imageList[index]['imageFinalURL'] = res.finalUrl;
			}

			for (var i in res) {
				delete res[i];
			}

			failedFetching(index, nodeList);
		},
		ontimeout: function(res){
			removeTimerHandler();
			if (!isDownloading || imageData[index] instanceof ArrayBuffer) return; // Temporarily fixes #31

			console.log('[EHD] #' + (index + 1) + ': Timed Out');
			console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nFinal URL >', res.finalUrl, '\nResposeHeaders >' + res.responseHeaders);

			updateProgress(nodeList, {
				status: 'Failed! (Timed Out)',
				progress: '0',
				progressText: '',
				class: 'ehD-pt-warning'
			});

			if (ehDownloadRegex.originalImagePattern.test(imageList[index]['imageURL']) && imageList[index]['imageURL'] !== res.finalUrl) {
				imageList[index]['imageFinalURL'] = res.finalUrl;
			}


			for (var i in res) {
				delete res[i];
			}

			failedFetching(index, nodeList);
		}
	});

	if (nodeList.status.dataset.initedAbort !== '2') {
		nodeList.abort.addEventListener('click', function () {
			removeTimerHandler();
		});

		nodeList.status.setAttribute('data-inited-abort', '2');
	}

	updateTotalStatus();
}

function retryAllFailed(){
	var index, refetch = 0;
	initProgressTable();

	for (index = 0; index < imageData.length; index++) {
		if (imageData[index] === 'Fetching') {
			imageData[index] = null;
			retryCount[index] = 0;
		}
	}

	failedCount = 0;
	fetchCount = 0;
	requestDownload();
}

function insertCloseButton(handle) {
	var exitButton = document.createElement('button');
	exitButton.style.display = 'block';
	exitButton.style.margin = '0 auto';
	exitButton.textContent = 'Close';
	exitButton.onclick = function(){
		ehDownloadDialog.removeChild(exitButton);
		ehDownloadDialog.style.display = 'none';
		zip.file(/.*/).forEach(function (elem) {
			zip.remove(elem.name);
		});
		exitButton.onclick = null;
		if (handle) {
			handle();
		}
		if (ehDownloadFS.needFileSystem) ehDownloadFS.removeFile(unsafeWindow.gid + '.zip');
	};
	ehDownloadDialog.appendChild(exitButton);
	ehDownloadDialog.scrollTop = ehDownloadDialog.scrollHeight;

	if (ehDownloadDialog.contains(forceDownloadTips)) ehDownloadDialog.removeChild(forceDownloadTips);
}

function getPagesURLFromMPV() {
	var mpvURL = location.origin + '/mpv/' + unsafeWindow.gid + '/' + 
	unsafeWindow.token + '/';

	var xhr = new XMLHttpRequest();
	xhr.open('GET', mpvURL);
	xhr.onload = function () {
		var responseText = xhr.responseText;
		if (xhr.status !== 200 || !responseText) {
			if (retryCount < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
				pushDialog('Failed! Retrying... ');
				retryCount++;
				xhr.open('GET', mpvURL);
				xhr.timeout = 30000;
				xhr.send();
			}
			else {
				pushDialog('Failed!\nFetch Pages\' URL failed, Please try again later.');
				isDownloading = false;
				alert('Fetch Pages\' URL failed, Please try again later.');
			}
			return;
		}

		var listMatch = responseText.match(ehDownloadRegex.mpvKey);
		if (!listMatch) {
			console.error('[EHD] Response content is incorrect!');
			if (retryCount < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
				pushDialog('Failed! Retrying... ');
				retryCount++;
				xhr.open('GET', location.origin + location.pathname + '?p=' + curPage);
				xhr.timeout = 30000;
				xhr.send();
			}
			else {
				pushDialog('Failed!\nCan\'t get pages URL from response content.');
				isDownloading = false;
			}
			return;
		}

		var list = new Function('return ' + listMatch[1])();

		list.forEach(function (elem, index) {
			var curURL = location.origin + '/s/' + elem.k + '/' + unsafeWindow.gid + '-' + (index + 1);
			pageURLsList.push(curURL);
		});
		pushDialog('Succeed!');


		// copied from getAllPagesURL(), THAT's UGLY!!!
		// so when will 2.0 comes out /_\
		getAllPagesURLFin = true;
		var wrongPages = pagesRange.filter(function (elem) { return elem > pageURLsList.length; });
		if (wrongPages.length !== 0) {
			pagesRange = pagesRange.filter(function (elem) { return elem <= pageURLsList.length; });
			pushDialog('\nPage ' + wrongPages.join(', ') + (wrongPages.length > 1 ? ' are' : ' is') + ' not exist, and will be ignored.\n');
			if (pagesRange.length === 0) {
				pushDialog('Nothing matches provided pages range, stop downloading.');
				alert('Nothing matches provided pages range, stop downloading.');
				if (emptyAudio) {
					emptyAudio.pause();
				}
				insertCloseButton();
				return;
			}
		}
		totalCount = pagesRange.length || pageURLsList.length;
		pushDialog('\n\n');
		initProgressTable();
		requestDownload();
	};
	xhr.send();
	pushDialog('Fetching Gallery Pages URL From MPV...');
}

// /*if pages range is set, then*/ get all pages URL to select needed pages
function getAllPagesURL() {
	pagesRange = [];
	var pagesRangeText = ehDownloadRange.querySelector('input').value.replace(/，/g, ',').trim();
	var retryCount = 0;

	if (pagesRangeText) { // if pages range is defined
		console.log('[EHD] Pages Range >', pagesRangeText);
		if (!ehDownloadRegex.pagesRange.test(pagesRangeText)) return alert('The format of Pages Range is incorrect.');

		// range started with negative range, select all as default
		if (pagesRangeText[0] === '!') {
			pagesRangeText = '1-,' + pagesRangeText;
		}
		var rangeRegex = /!?(?:(\d*)-(\d*))(?:\/(\d+))?|!?(\d+)/g;
		var matches;
		var lastPage = getFileSizeAndLength().page;

		while (matches = rangeRegex.exec(pagesRangeText)) {
			var selected = [];
			var single = Number(matches[4]);
			if (!isNaN(single)) {
				selected.push(single);
			}
			else {
				var begin = Number(matches[1]) || 1;
				var end = Number(matches[2]) || lastPage;
				if (begin > end) {
					var tmp = begin;
					begin = end;
					end = tmp;
				}
				var mod = Number(matches[3]) || 1;

				for (var i = begin; i <= end; i += mod) {
					selected.push(i);
				}
			}

			if (matches[0][0] === '!') {
				pagesRange = pagesRange.filter(function (e) {
					return selected.indexOf(e) < 0;
				});
			}
			else {
				selected.forEach(function (e) {
					pagesRange.push(e);
				});
			}
		}

		pagesRange.sort(function(a, b){ return a - b; });
		pagesRange = pagesRange.filter(function(e, i, arr) { return i == 0 || e != arr[i - 1] });
	}

	ehDownloadDialog.style.display = 'block';
	if (!getAllPagesURLFin) {
		pageURLsList = [];

		if (isMPVAvailable()) {
			console.log('[EHD] MPV is available, use MPV to fetch all pages');
			pushDialog('MPV is available, use MPV to fetch all pages.\n');
			return getPagesURLFromMPV();
		}

		var pagesLength;
		try { // in case pages has been modified like #56
			pagesLength = [].reduce.call(document.querySelectorAll('.ptt td'), function(x, y){
				var i = Number(y.textContent);
				if (!isNaN(i)) return x > i ? x : i;
				else return x;
			});
		}
		catch (error) {}
		var curPage = 0;
		retryCount = 0;

		var xhr = fetchPagesXHR;
		xhr.onload = function(){
			var responseText = xhr.responseText;
			if (xhr.status !== 200 || !responseText) {
				if (retryCount < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
					pushDialog('Failed! Retrying... ');
					retryCount++;
					xhr.open('GET', location.origin + location.pathname + '?p=' + curPage);
					xhr.timeout = 30000;
					xhr.send();
				}
				else {
					pushDialog('Failed!\nFetch Pages\' URL failed, Please try again later.');
					isDownloading = false;
					alert('Fetch Pages\' URL failed, Please try again later.');
				}
				return;
			}

			var pagesURL = responseText.split('<div id="gdt">')[1].split('<div class="c">')[0].match(ehDownloadRegex.pagesURL);
			if (!pagesURL) {
				console.error('[EHD] Response content is incorrect!');
				if (retryCount < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
					pushDialog('Failed! Retrying... ');
					retryCount++;
					xhr.open('GET', location.origin + location.pathname + '?p=' + curPage);
					xhr.timeout = 30000;
					xhr.send();
				}
				else {
					pushDialog('Failed!\nCan\'t get pages URL from response content.');
					isDownloading = false;
					//alert('We can\'t get request content from response content. It\'s possible that E-Hentai changes source code format so that we can\'t find them, or your ISP modifies (or say hijacks) the page content. If it\'s sure that you can access to any pages of E-Hentai, including current page: ' + location.origin + location.pathname + '?p=' + curPage + ' , please report a bug.');
				}
				return;
			}

			if (pagesURL[0].indexOf('/mpv/') >= 0) {
				console.log('[EHD] Page 1 URL > ' + pagesURL[0] + ' , use MPV fetch');
				pushDialog('Pages URL is MPV link\n');

				getPagesURLFromMPV();
				return;
			}

			for (var i = 0; i < pagesURL.length; i++) {
				pageURLsList.push(replaceHTMLEntites(pagesURL[i].split('"')[1]));
			}
			pushDialog('Succeed!');

			curPage++;
			
			if (!pagesLength) { // can't get pagesLength correctly before
				pagesLength = responseText.match(ehDownloadRegex.pagesLength)[1] - 0;
			}
		
			if (curPage === pagesLength) {
				getAllPagesURLFin = true;
				var wrongPages = pagesRange.filter(function(elem){ return elem > pageURLsList.length; });
				if (wrongPages.length !== 0) {
					pagesRange = pagesRange.filter(function(elem){ return elem <= pageURLsList.length; });
					pushDialog('\nPage ' + wrongPages.join(', ') + (wrongPages.length > 1 ? ' are' : ' is') + ' not exist, and will be ignored.\n');
					if (pagesRange.length === 0) {
						pushDialog('Nothing matches provided pages range, stop downloading.');
						alert('Nothing matches provided pages range, stop downloading.');
						insertCloseButton();
						return;
					}
				}
				totalCount = pagesRange.length || pageURLsList.length;
				pushDialog('\n\n');
				initProgressTable();
				requestDownload();
			}
			else {
				xhr.open('GET', location.origin + location.pathname + '?p=' + curPage);
				xhr.send();
				pushDialog('\nFetching Gallery Pages URL (' + (curPage + 1) + '/' + pagesLength + ') ... ');
			}
		};
		xhr.ontimeout = xhr.onerror = function(){
			if (retryCount < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
				pushDialog('Failed! Retrying... ');
				retryCount++;
				xhr.open('GET', location.origin + location.pathname + '?p=' + curPage);
				xhr.timeout = 30000;
				xhr.send();
			}
			else {
				pushDialog('Failed!\nFetch Pages\' URL failed, Please try again later.');
				isDownloading = false;
				alert('Fetch Pages\' URL failed, Please try again later.');
			}
		};
		xhr.open('GET', location.origin + location.pathname + '?p=' + curPage);
		xhr.timeout = 30000;
		xhr.send();
		pushDialog('\nFetching Gallery Pages URL (' + (curPage + 1) + '/' + (pagesLength || '?') + ') ... ');
	}
	else {
		var wrongPages = pagesRange.filter(function(elem){ return elem > pageURLsList.length; });
		if (wrongPages.length !== 0) {
			pagesRange = pagesRange.filter(function(elem){ return elem <= pageURLsList.length; });
			pushDialog('\nPage ' + wrongPages.join(', ') + (wrongPages.length > 1 ? ' are' : ' is') + ' not exist, and will be ignored.\n');
			if (pagesRange.length === 0) {
				pushDialog('Nothing matches provided pages range, stop downloading.');
				alert('Nothing matches provided pages range, stop downloading.');
				insertCloseButton();
				return;
			}
		}

		totalCount = pagesRange.length || pageURLsList.length;
		pushDialog('\n\n');
		initProgressTable();
		requestDownload();
	}
}

function initEHDownload() {
	for (var i = 0; i < fetchThread.length; i++) {
		if (typeof fetchThread[i] !== 'undefined' && 'abort' in fetchThread[i]) fetchThread[i].abort();
	}
	imageList = [];
	imageData = [];
	fetchThread = [];
	retryCount = [];
	downloadedCount = fetchCount = failedCount = 0;
	isPausing = false;
	zip = new JSZip();
	infoStr = '';
	fetchPagesXHR.abort();

	if (setting['recheck-file-name']) {
		var dirNameNode = document.querySelector('.ehD-box-extend-dirname');
		var fileNameNode = document.querySelector('.ehD-box-extend-filename');

		if (dirNameNode && dirNameNode.value) {
			dirName = getSafeName(dirNameNode.value, true);
		}
		else {
			dirName = getReplacedName(!setting['dir-name'] ? '{gid}_{token}' : setting['dir-name']);
		}

		if (fileNameNode && fileNameNode.value) {
			fileName = getSafeName(fileNameNode.value);
		}
		else {
			fileName = getReplacedName(!setting['file-name'] ? '{title}' : setting['file-name']);
		}
	}
	else {
		dirName = getReplacedName(!setting['dir-name'] ? '{gid}_{token}' : setting['dir-name']);
		fileName = getReplacedName(!setting['file-name'] ? '{title}' : setting['file-name']);
	}

	if (dirName.trim() === '/') dirName = '';
	needNumberImages = ehDownloadNumberInput.querySelector('input').checked;

	var requiredBytes = Math.ceil(getFileSizeAndLength().size + 100 * 1024);
	var requiredMBs = getFileSizeAndLength().sizeMB + 0.1;

	var fsErrorHandler = function (error) {
		ehDownloadFS.errorHandler(error);

		// roll back and use Blob to handle file
		ehDownloadFS.needFileSystem = false;
		alert('An error occured when requesting FileSystem.\n' +
			'Error Name: ' + (e.name || 'Unknown Error') + '\n' +
			'Error Message: ' + e.message + '\n\n' +
			'Roll back and use Blob to handle file.');
	};

	if ((!setting['store-in-fs'] && !setting['never-warn-large-gallery'] && requiredMBs >= 300) && !confirm('This archive is too large (original size), please consider downloading this archive in a different way.\n\nMaximum allowed file size: Chrome 56- 500MB | Chrome 57+ 2 GB | Firefox ~800 MB (depends on your RAM)\n\nPlease also consider your operating system\'s free memory (RAM), it may take about DOUBLE the size of archive file size when generating ZIP file.\n\n* If you continue, you would probably get an error like "Failed - No File" or "Out Of Memory" if you don\'t have enough RAM and can\'t save the file successfully.\n\n* If you are using Chrome, you can try enabling "Request File System to handle large Zip file" on the settings page.\n\n* You can set Pages Range to download this archive in parts. If you have already enabled it, please ignore this message.\n\nAre you sure to continue downloading?')) return;
	else if (setting['store-in-fs'] && requestFileSystem && requiredMBs >= (setting['fs-size'] !== undefined ? setting['fs-size'] : 200)) {
		ehDownloadFS.needFileSystem = true;
		console.log('[EHD] Required File System Space >', requiredBytes);

		// Chrome can use about 10% of free space of disk where Chrome User Data stored in as TEMPORARY File System Storage.
		if (navigator.webkitTemporaryStorage) { // if support navigator.webkitTemporaryStorage to check usable space
			// use `queryUsageAndQuota` instead of `requestQuota` to check storage space, 
			// because `requestQuota` is incorrect when harddisk is full, says have about 5GB storage
			navigator.webkitTemporaryStorage.queryUsageAndQuota(function (usage, quota) {
				console.log('[EHD] Free TEMPORARY File System Space >', quota - usage);
				if (quota - usage < requiredBytes) {
					console.log('[EHD] Free TEMPORARY File System Space is not enough.');

					// free space is not enough, then use persistent space
					// in fact, free space of persisent file storage is always 10GiB, even free disk space is not enough
					navigator.webkitPersistentStorage.queryUsageAndQuota(function (usage, quota) {
						console.log('[EHD] Free PERSISTENT File System Space >', quota - usage);
						if (quota - usage < requiredBytes) {
							// roll back and use Blob to handle file
							ehDownloadFS.needFileSystem = false;
							alert('You don\'t have enough free space on the drive where Chrome stores user data (Default is system drive, normally it\'s C: ), please delete some files.\n\nNeeds more than ' + (requiredBytes - (quota - usage)) + ' Bytes.\n\nRoll back and use Blob to handle file.');
						}
						else {
							pushDialog('\n<strong>Please allow storing large content if the browser asked for it.</strong>\n');
							requestFileSystem(window.PERSISTENT, requiredBytes, ehDownloadFS.initHandler, fsErrorHandler);
						}
					}, fsErrorHandler);
				}
				else requestFileSystem(window.TEMPORARY, requiredBytes, ehDownloadFS.initHandler, fsErrorHandler);
			}, fsErrorHandler);
		}
		else requestFileSystem(window.TEMPORARY, requiredBytes, ehDownloadFS.initHandler, fsErrorHandler);
	}

	// Array.prototype.some() is a bit ugly, so we use toString().indexOf() lol
	var infoNeeds = setting['save-info-list'].toString();
	if (infoNeeds.indexOf('title') >= 0) {
		infoStr += replaceHTMLEntites(
			document.getElementById('gn').textContent + '\n' +
			document.getElementById('gj').textContent + '\n' +
			window.location.href + '\n\n'
		);
	}

	if (infoNeeds.indexOf('metas') >= 0) {
		infoStr += 'Category: ' + document.querySelector('#gdc .cs').textContent.trim() + '\n' +
				   'Uploader: ' + replaceHTMLEntites(document.querySelector('#gdn').textContent) + '\n';
	}
	var metaNodes = document.querySelectorAll('#gdd tr');
	for (var i = 0; i < metaNodes.length; i++) {
		var c1 = replaceHTMLEntites(metaNodes[i].getElementsByClassName('gdt1')[0].textContent);
		var c2 = replaceHTMLEntites(metaNodes[i].getElementsByClassName('gdt2')[0].textContent);
		if (infoNeeds.indexOf('metas') >= 0) infoStr += c1 + ' ' + c2 + '\n';
	}
	if (infoNeeds.indexOf('metas') >= 0) infoStr += 'Rating: ' + unsafeWindow.average_rating + '\n\n';

	if (infoNeeds.indexOf('tags') >= 0) {
		infoStr += 'Tags:\n';

		var tagsList = document.querySelectorAll('#taglist tr');
		Array.prototype.forEach.call(tagsList, function(elem){
			var tds = elem.getElementsByTagName('td');
			infoStr += '> ' + tds[0].textContent + ' ';

			var tags = tds[1].querySelectorAll('a');
			infoStr += Array.prototype.map.call(tags, function(e){
				return e.textContent;
			}).join(', ') + '\n';
		});

		infoStr += '\n';
	}

	if (infoNeeds.indexOf('uploader-comment') >= 0 && document.getElementById('comment_0')) {
		infoStr += 'Uploader Comment:\n' + document.getElementById('comment_0').innerHTML.replace(/<br>|<br \/>/gi, '\n') + '\n\n';
	}
	isDownloading = true;
	pushDialog(infoStr);

	pushDialog('Start downloading at ' + new Date() + '\n');
	ehDownloadDialog.appendChild(ehDownloadStatus);

	// get all pages url to fix 403 forbidden (download request was timed out)
	getAllPagesURL();

	// init playing music
	if (setting['play-silent-music'] && !emptyAudio) {
		emptyAudio = new Audio(emptyAudioFile);
		emptyAudio.loop = true;
	}
}

function initVisibilityListener() {
	var hidden, visibilityChange;
	if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support 
		hidden = 'hidden';
		visibilityChange = 'visibilitychange';
	}
	else if (typeof document.mozHidden !== 'undefined') {
		hidden = 'mozHidden';
		visibilityChange = 'mozvisibilitychange';
	}
	else if (typeof document.webkitHidden !== 'undefined') {
		hidden = 'webkitHidden';
		visibilityChange = 'webkitvisibilitychange';
	}

	var visibilityChangeHandler = function (isHidden) {
		if (typeof isHidden !== 'boolean') {
			isHidden = document[hidden];
		}
		visibleState = !isHidden;
		if (!emptyAudio) {
			return;
		}
		if (isHidden && ((isDownloading && !isPausing) || isSaving)) {
			emptyAudio.play();
		}
		else {
			emptyAudio.pause();
			loadImageLimits();
		}
	};

	if (visibilityChange) {
		window.addEventListener(visibilityChange, visibilityChangeHandler);
	}
	else {
		window.addEventListener('focus', function () {
			visibilityChangeHandler(false);
		});
		window.addEventListener('blur', function () {
			visibilityChangeHandler(true);
		});
	}

	visibilityChangeHandler();
}

function initProgressTable(){
	progressTable = document.createElement('table');
	progressTable.className = 'ehD-pt';
	ehDownloadDialog.style.display = 'block';
	ehDownloadDialog.appendChild(progressTable);
	ehDownloadDialog.appendChild(forceDownloadTips);
	ehDownloadDialog.appendChild(ehDownloadPauseBtn);
	ehDownloadDialog.scrollTop = ehDownloadDialog.scrollHeight;
}

function requestDownload(ignoreFailed){
	if (isPausing) return;
	
	if (setting['delay-request']) {
		var curTime = Date.now();
		if (delayTime < curTime) {
			delayTime = curTime;
		}
	}

	var j = 0;
	for (var i = fetchCount; i < (setting['thread-count'] !== undefined ? setting['thread-count'] : 5); i++) {
		for (/*var j = 0*/; j < totalCount; j++) {
			if (imageData[j] == null && (ignoreFailed || (retryCount[j] || 0) <= (setting['retry-count'] !== undefined ? setting['retry-count'] : 3))) {
				imageData[j] = 'Fetching';
				if (imageList[j] && setting['never-new-url']) fetchOriginalImage(j);
				else if (setting['delay-request']) {
					setTimeout(function(j) {
						if (isPausing || fetchCount >= (setting['thread-count'] !== undefined ? setting['thread-count'] : 5)) {
							imageData[j] = null;
							return;
						}
						getPageData(j);
						fetchCount++;
					}, delayTime - curTime + setting['delay-request'] * 1000, j);
					delayTime += setting['delay-request'] * 1000;
				}
				else {
					getPageData(j);
					fetchCount++;
				}
				break;
			}
		}
	}

}

function getPageData(index) {
	if (isPausing) return;

	if (pagesRange.length) var realIndex = pagesRange[index];
	else var realIndex = index + 1;

	var needScrollIntoView = ehDownloadDialog.clientHeight + ehDownloadDialog.scrollTop >= ehDownloadDialog.scrollHeight - 5;

	var node = progressTable.querySelector('tr[data-index="' + index + '"]');
	if (!node) {
		node = document.createElement('tr');
		node.className = 'ehD-pt-item';
		node.setAttribute('data-index', index);
		node.innerHTML = '\
			<td class="ehD-pt-name">#' + realIndex + '</td>\
			<td class="ehD-pt-progress-outer">\
				<progress class="ehD-pt-progress"></progress>\
				<span class="ehD-pt-progress-text"></span>\
			</td>\
			<td class="ehD-pt-status">\
				<span class="ehD-pt-status-text">Pending...</span>\
				<span class="ehD-pt-abort">Force Abort</span>\
			</td>';
		progressTable.appendChild(node);
	}
	if (needScrollIntoView) {
		ehDownloadDialog.scrollTop = ehDownloadDialog.scrollHeight;
	}

	var nodeList = {
		current: node,
		fileName: node.getElementsByTagName('td')[0],
		status: node.getElementsByTagName('td')[2],
		statusText: node.getElementsByClassName('ehD-pt-status-text')[0],
		progress: node.getElementsByTagName('progress')[0],
		progressText: node.getElementsByTagName('span')[0],
		abort: node.getElementsByClassName('ehD-pt-abort')[0]
	};

	retryCount[index] = 0;
	var fetchURL = replaceHTMLEntites(imageList[index] ? (
		imageList[index]['pageURL'] + (
			(!setting['never-send-nl'] && imageList[index]['nextNL']) ? (
				imageList[index]['pageURL'].indexOf('?') >= 0 ? '&' : '?'
			) + 'nl=' + imageList[index]['nextNL'] : ''
		)
	) : pageURLsList[realIndex - 1])/*.replace(/^https?:/, '')*/;

	// assign to fetchThread, so that we can abort them and all GM_xhr by one command fetchThread[i].abort()
	var xhr = fetchThread[index] = new XMLHttpRequest();
	xhr.onload = function() {
		var responseText = xhr.responseText;
		if (xhr.status !== 200 || !responseText) {
			if (retryCount[index] < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
				retryCount[index]++;

				updateProgress(nodeList, {
					status: 'Retrying (' + retryCount[index] + '/' + (setting['retry-count'] !== undefined ? setting['retry-count'] : 3) + ')...',
					progress: '',
					progressText: '',
					class: 'ehD-pt-warning'
				});

				xhr.open('GET', fetchURL);
				xhr.timeout = 30000;
				xhr.send();
			}
			else {
				failedCount++;
				fetchCount--;

				console.error('[EHD] #' + realIndex + ': Failed getting image URL');
				updateProgress(nodeList, {
					status: 'Failed getting URL',
					progress: '0',
					progressText: '',
					class: 'ehD-pt-failed'
				});
				updateTotalStatus();

				checkFailed();
			}

			return;
		}

		try {
			var imageURL = replaceHTMLEntites(
				(
					(unsafeWindow.apiuid !== -1 || setting['force-as-login'])
					&& ehDownloadRegex.imageURL[0].test(responseText)
					&& !setting['force-resized']
				) ? responseText.match(ehDownloadRegex.imageURL[0])[1] : (
					responseText.indexOf('id="img"') > -1
						? responseText.match(ehDownloadRegex.imageURL[1])[1]
						: responseText.match(ehDownloadRegex.imageURL[2])[1]
				)
			);
			// append nl to original image in case it fails to load from H@H (wtf it's valid?!)
			if (ehDownloadRegex.originalImagePattern.test(imageURL)) {
				imageURL = imageURL + (
					(imageList[index] && !setting['never-send-nl'] && imageList[index]['nextNL']) ? (
						imageURL.indexOf('?') >= 0 ? '&' : '?'
					) + 'nl=' + imageList[index]['nextNL'] : ''
				);
			}
			var fileName = replaceHTMLEntites(responseText.match(ehDownloadRegex.fileName)[1]);
			var nextNL = ehDownloadRegex.nl.test(responseText) ? responseText.match(ehDownloadRegex.nl)[1] : null;
		}
		catch (error) {
			console.error('[EHD] Response content is not correct!', error);
			if (retryCount[index] < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
				retryCount[index]++;

				updateProgress(nodeList, {
					status: 'Retrying (' + retryCount[index] + '/' + (setting['retry-count'] !== undefined ? setting['retry-count'] : 3) + ')...',
					progress: '',
					progressText: '',
					class: 'ehD-pt-warning'
				});

				xhr.open('GET', fetchURL);
				xhr.timeout = 30000;
				xhr.send();
			}
			else {
				failedCount++;
				fetchCount--;

				console.error('[EHD] #' + realIndex + ': Can\'t get request content from response content');
				updateProgress(nodeList, {
					status: 'Response Error',
					progress: '0',
					progressText: '',
					class: 'ehD-pt-failed'
				});
				updateTotalStatus();
				//alert('We can\'t get request content from response content. It\'s possible that E-Hentai changes source code format so that we can\'t find them, or your ISP modifies (or say hijacks) the page content. If it\'s sure that you can access to any pages of E-Hentai, including current page: ' + fetchURL + ' , please report a bug.');

				checkFailed();
			}
			return;
		}

		var imageNumber = '';
		if (needNumberImages) {
			// Number images, thanks to JingJang@GitHub, source: https://github.com/JingJang/E-Hentai-Downloader
			if (!setting['number-real-index'] && pagesRange.length) { // if pages range was set and number original index is not required
				var len = pagesRange.length.toString().length,
					padding = new Array(len < 3 ? len + 1 : len).join('0');
				imageNumber = (padding + (index + 1)).slice(0 - len);
			}
			else { // pages range was not set (download all pages, so index + 1 === realIndex) or number original index is required
				var len = pageURLsList.length.toString().length,
					padding = new Array(len < 3 ? len + 1 : len).join('0');
				imageNumber = (padding + realIndex).slice(0 - len);
			}
		}

		//imageList.push(new PageData(fetchURL, imageURL, fileName, nextNL, realIndex));
		imageList[index] = new PageData(fetchURL, imageURL, fileName, nextNL, realIndex, imageNumber);

		if (isPausing) {
			updateProgress(nodeList, {
				name: '#' + realIndex + ': ' + fileName,
				status: 'Auto Paused',
				progress: '',
				progressText: '', 
				class: 'ehD-pt-failed'
			});
			fetchCount--;
			imageData[index] = null;
			
			updateTotalStatus();
		}
		else {
			fetchOriginalImage(index, nodeList);
		}

	};
	xhr.onerror = xhr.ontimeout = function() {
		if (retryCount[index] < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
			retryCount[index]++;

			updateProgress(nodeList, {
				status: 'Retrying (' + retryCount[index] + '/' + (setting['retry-count'] !== undefined ? setting['retry-count'] : 3) + ')...',
				progress: '',
				progressText: '',
				class: 'ehD-pt-warning'
			});

			xhr.open('GET', fetchURL);
			xhr.timeout = 30000;
			xhr.send();
		}
		else {
			failedCount++;
			fetchCount--;

			console.error('[EHD] #' + realIndex + ': Failed getting image URL');
			updateProgress(nodeList, {
				status: 'Failed getting URL',
				progress: '0',
				progressText: '',
				class: 'ehD-pt-failed'
			});
			updateTotalStatus();

			checkFailed();
		}
	};
	
	xhr.open('GET', fetchURL);
	xhr.timeout = 30000;
	xhr.send();

	nodeList.abort.addEventListener('click', function () {
		if (!isDownloading || imageData[index] instanceof ArrayBuffer) return; // Temporarily fixes #31

		if (typeof fetchThread[index] !== 'undefined' && 'abort' in fetchThread[index]) fetchThread[index].abort();

		console.log('[EHD] #' + (index + 1) + ': Force Aborted By User');
		updateProgress(nodeList, {
			status: 'Failed! (User Aborted)',
			progress: '0',
			progressText: '',
			class: 'ehD-pt-warning'
		});

		failedFetching(index, nodeList);
	});

	nodeList.status.setAttribute('data-inited-abort', '1');
}

function showSettings() {
	var ehDownloadSettingPanel = document.createElement('div');
	ehDownloadSettingPanel.className = 'ehD-setting';
	ehDownloadSettingPanel.setAttribute('data-active-setting', 'basic');
	ehDownloadSettingPanel.innerHTML = '\
		<ul class="ehD-setting-tab">\
			<li data-target-setting="basic">Basic</li>\
			<li data-target-setting="advanced">Advanced</li>\
		</ul>\
		<div class="ehD-feedback">\
			' + ehDownloadArrow + ' <strong>Feedback</strong>\
			<a href="https://github.com/ccloli/E-Hentai-Downloader/issues" target="_blank">GitHub</a>\
			<a href="https://sleazyfork.org/scripts/10379-e-hentai-downloader/feedback" target="_blank">GreasyFork</a>\
		</div>\
		<div class="ehD-setting-main">\
			<div class="ehD-setting-wrapper">\
				<div data-setting-page="basic" class="ehD-setting-content">\
					<div class="g2"><label>Download <input type="number" data-ehd-setting="thread-count" min="1" placeholder="5" style="width: 46px;"> images at the same time (≤ 5 is recommended)</label></div>\
					<div class="g2"><label>Abort downloading current image after <input type="number" data-ehd-setting="timeout" min="0" placeholder="300" style="width: 46px;"> second(s) (0 is never abort)</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="speed-detect"> Abort downloading current image if speed is less than <input type="number" data-ehd-setting="speed-min" min="0" placeholder="5" style="width: 46px;"> KB/s in <input type="number" data-ehd-setting="speed-expired" min="1" placeholder="30" style="width: 46px;"> second(s)</label></div>\
					<div class="g2"><label>Skip current image after retried <input type="number" data-ehd-setting="retry-count" min="1" placeholder="3" style="width: 46px;"> time(s)</label></div>\
					<div class="g2"><label>Delay <input type="number" data-ehd-setting="delay-request" min="0" placeholder="0" step="0.1" style="width: 46px;"> second(s) before requesting next image</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="number-images"> Number images (001：01.jpg, 002：01_theme.jpg, 003：02.jpg...) (Separator <input type="text" data-ehd-setting="number-separator" style="width: 46px;" placeholder="：">)</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="number-real-index"> Number images with original page number if pages range is set</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="number-auto-retry"> Retry automatically when images download failed</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="auto-download-cancel"> Get downloaded images automatically when canceled downloading</label></div>\
					<div class="g2"><label>Set folder name as <input type="text" data-ehd-setting="dir-name" placeholder="{gid}_{token}" style="width: 110px;"> (if you don\'t want to create folder, use "<code>/</code>") *</label></div>\
					<div class="g2"><label>Set Zip file name as <input type="text" data-ehd-setting="file-name" placeholder="{title}" style="width: 110px;"> *</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="recheck-file-name"> Show inputs to recheck file name and folder name before downloading</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="ignore-torrent"> Never show notification if torrents are available</label></div>\
					<div class="g2"><label><select data-ehd-setting="status-in-title"><option value="never">Never</option><option value="blur">When current tab is not focused</option><option value="always">Always</option></select> show download progress in title</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="hide-image-limits"> Disable requesting and showing image limits</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="hide-estimated-cost"> Disable pre-calculating image limits cost</label></div>\
					<!--<div class="g2"><label><input type="checkbox" data-ehd-setting="actions-sticky"> Pin download actions box at the top of the page</label></div>-->\
					<div class="ehD-setting-note">\
						<div class="g2">\
							* Available templates: \
							<span title="You can find GID and token at the address bar like this: exhentai.org/g/[GID]/[Token]/"><code>{gid}</code> Gallery GID</sapn> | \
							<span title="You can find GID and token at the address bar like this: exhentai.org/g/[GID]/[Token]/"><code>{token}</code> Gallery token</sapn> | \
							<span title="This title is the English title or Latin transliteration, you can find it as the first line of the title."><code>{title}</code> Gallery title</span> | \
							<span title="This title is the original language title, you can find it as the second line of the title."><code>{subtitle}</code> Gallery sub-title</span> | \
							<span title="This tag means the sort name of the gallery, and its output string is upper."><code>{tag}</code>, <code>{category}</code> Gallery category</span> | \
							<span title="You can find it at the left of the gallery page."><code>{uploader}</code> Gallery uploader</span>\
						</div>\
					</div>\
				</div>\
				<div data-setting-page="advanced" class="ehD-setting-content">\
					<div class="g2"><label>Set compression level as <input type="number" data-ehd-setting="compression-level" min="0" max="9" placeholder="0" style="width: 46px;"> (0 ~ 9, 0 is only store) </label><sup>(1)</sup></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="file-descriptor"> Stream files and create Zip with file descriptors </label><sup>(2)</sup></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="force-resized"> Force download resized image (never download original image) </label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="never-new-url"> Never get new image URL when failed to download image </label><sup>(3)</sup></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="never-send-nl"> Never send "nl" GET parameter when getting new image URL </label><sup>(3)</sup></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="never-warn-peak-hours"> Never show warning when it\'s in peak hours now </label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="never-warn-limits"> Never show warning if image limits will probably used out on starting download</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="never-warn-large-gallery"> Never show warning when downloading a large gallery (>= 300 MB) </label></div>\
					<div class="g2"' + (requestFileSystem ? '' : ' style="opacity: 0.5;" title="Only Chrome supports this feature"') + '><label><input type="checkbox" data-ehd-setting="store-in-fs"> Use File System to handle large Zip file</label> <label>when gallery is larger than <input type="number" data-ehd-setting="fs-size" min="0" placeholder="200" style="width: 46px;"> MB (0 is always)</label><sup>(4)</sup></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="play-silent-music"> Play silent music during the process to avoid downloading freeze </label><sup>(5)</sup></div>\
					<div class="g2"><label>Record and save gallery info as <select data-ehd-setting="save-info"><option value="file">File info.txt</option><option value="comment">Zip comment</option><option value="none">None</option></select></label></div>\
					<div class="g2">...which includes <label><input type="checkbox" data-ehd-setting="save-info-list[]" value="title">Title & Gallery Link</label> <label><input type="checkbox" data-ehd-setting="save-info-list[]" value="metas">Metadatas</label> <label><input type="checkbox" data-ehd-setting="save-info-list[]" value="tags">Tags</label> <label><input type="checkbox" data-ehd-setting="save-info-list[]" value="uploader-comment">Uploader Comment</label> <label><input type="checkbox" data-ehd-setting="save-info-list[]" value="page-links">Page Links</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="replace-with-full-width"> Replace forbidden characters with full-width characters instead of dash (-)</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="force-pause"> Force drop downloaded images data when pausing download</label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="save-as-cbz"> Save as CBZ (Comic book archive) file<sup>(6)</sup></label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="pass-cookies"> Pass cookies manually when downloading images <sup>(7)</sup></label></div>\
					<div class="g2"><label><input type="checkbox" data-ehd-setting="force-as-login"> Force as logged in (actual login state: ' + (unsafeWindow.apiuid === -1 ? 'no' : 'yes') + ', uid: ' + unsafeWindow.apiuid + ') <sup>(8)</sup></label></div>\
					<div class="g2"><label>Download original images from <select data-ehd-setting="original-download-domain"><option value="">current origin</option><option value="e-hentai.org">e-hentai.org</option><option value="exhentai.org">exhentai.org</option></select> <sup>(9)</sup></label></div>\
					<div class="ehD-setting-note">\
						<div class="g2">\
							(1) Higher compression level can get smaller file without lossing any data, but may takes more time. If you have a decent CPU you can set it higher, and if you\'re using macOS set it to at least 1.\
						</div>\
						<div class="g2">\
							(2) This may reduce memory usage but some decompress softwares may not support the Zip file. See <a href="https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html" target="_blank" style="color: #ffffff;">JSZip Docs</a> for more info.\
						</div>\
						<div class="g2">\
							(3) Enable these option will never let you to load from regular image server (or say force loaded from H@H). This may save your image viewing limits <a href="https://github.com/ccloli/E-Hentai-Downloader/wiki/E%E2%88%92Hentai-Image-Viewing-Limits" target="_blank" style="color: #ffffff;">(See wiki)</a>, but may also cause some download problems, especially if your network cannot connect to specific H@H node.\
						</div>\
						<div class="g2">\
							(4) If enabled you can save larger Zip files (probably ~1GB).\
						</div>\
						<div class="g2">\
							(5) If enabled the script will play slient music to avoid downloading freeze when page is in background <a href="https://github.com/ccloli/E-Hentai-Downloader/issues/65" target="_blank">(See issue)</a>. Only needed if you have the problem, because the audio-playing icon maybe annoying.\
						</div>\
						<div class="g2">\
							(6) <a href="https://en.wikipedia.org/wiki/Comic_book_archive">Comic book archive</a> is a file type to archive comic images, you can open it with some comic viewer like CDisplay/CDisplayEX, or just extract it as a Zip file. To keep the order of images, you can also enable numbering images.\
						</div>\
						<div class="g2">\
							(7) If you cannot original images, but you\'ve already logged in and your account is not blocked or used up your limits, it may caused by your cookies is not sent to the server. This feature may helps you to pass your current cookies to the download request, but please enable it ONLY if you cannot download any original images.\
						</div>\
						<div class="g2">\
							(8) If you have already logged in, but the script detects that you\'re not logged in, you can enable this to skip login check. Please note that if you are not logged in actually, the script will not work as expect.\
						</div>\
						<div class="g2">\
							(9) If you have problem to download on the same site, like account session is misleading, you can force redirect original download link to another domain. Pass cookies manually may be needed.\
						</div>\
					</div>\
				</div>\
			</div>\
		</div>\
		<div class="ehD-setting-footer" style="text-align: center">\
			<button data-action="save">Save</button> <button data-action="cancel">Cancel</button>\
		</div>';
	document.body.appendChild(ehDownloadSettingPanel);
	
	for (var i in setting) {
		if (setting[i] instanceof Array) {
			setting[i].forEach(function(elem){
				var element = ehDownloadSettingPanel.querySelector('input[data-ehd-setting="' + i + '[]"][value="' + elem + '"], select[data-ehd-setting="' + i + '[]"] option[value="' + elem + '"]');
				if (!element) return;

				if (element.getAttribute('type') === 'checkbox') {
					element.setAttribute('checked', 'checked');
				}
				else if (element.tagName.toLowerCase() === 'option') {
					element.setAttribute('selected', 'selected');
				}
				else element.value = elem;
			});
		}
		else {
			var element = ehDownloadSettingPanel.querySelector('input[data-ehd-setting="' + i + '"], select[data-ehd-setting="' + i + '"]');
			if (!element) continue;
			if (element.getAttribute('type') === 'checkbox') {
				if (setting[i]) element.setAttribute('checked', 'checked');
			}
			else if (element.tagName.toLowerCase() === 'select') {
				element = element.querySelector('option[value="' + setting[i] + '"]');
				if (!element) continue;
				element.setAttribute('selected', 'selected');
			}
			else element.setAttribute('value', setting[i]);
		}
	}

	ehDownloadSettingPanel.getElementsByClassName('ehD-setting-tab')[0].addEventListener('click', function(event){
		var target = event.target;
		if (target.tagName.toLowerCase() === 'li') {
			ehDownloadSettingPanel.setAttribute('data-active-setting', target.dataset.targetSetting);
		}
	});

	ehDownloadSettingPanel.getElementsByClassName('ehD-setting-footer')[0].addEventListener('click', function(event){
		var target = event.target;
		if (target.tagName.toLowerCase() === 'button') {
			if (target.dataset.action === 'save') {
				var inputs = ehDownloadSettingPanel.querySelectorAll('input[data-ehd-setting], select[data-ehd-setting]');
				setting = {};
				for (var i = 0; i < inputs.length; i++) {
					if (inputs[i].getAttribute('type') !== 'checkbox' && inputs[i].value === '') continue;

					var curSettingName = inputs[i].dataset.ehdSetting;

					if (inputs[i].getAttribute('type') === 'checkbox') {
						if (inputs[i].checked) {
							if (inputs[i].hasAttribute('value')) {
								if (curSettingName.indexOf('[]') >= 0) {
									curSettingName = curSettingName.split('[]')[0];
									if (!setting[curSettingName]) setting[curSettingName] = [];
									setting[curSettingName].push(inputs[i].getAttribute('value'));
								}
								else {
									setting[curSettingName] = inputs[i].getAttribute('value');
								}
							}
							else {
								setting[curSettingName] = inputs[i].checked;
							}
						}
						else {
							setting[curSettingName] = inputs[i].checked;
						}
					}
					else if (inputs[i].getAttribute('type') === 'number') {
						setting[curSettingName] = Number(inputs[i].value);
						if (isNaN(setting[curSettingName])) {
							setting[curSettingName] = Number(inputs[i].getAttribute('placeholder'));
						}
					}
					else {
						setting[curSettingName] = inputs[i].value;
					}
				}
				GM_setValue('ehD-setting', JSON.stringify(setting));
			}
			document.body.removeChild(ehDownloadSettingPanel);

			if (document.querySelector('.ehD-box-extend')) {
				toggleFilenameConfirmInput('reset');
			}
			else {
				toggleFilenameConfirmInput(!setting['recheck-file-name']);
			}

			// ehDownloadBox.classList[setting['actions-sticky'] ? 'add' : 'remove']('ehD-box-sticky');

			try {
				showPreCalcCost();
			}
			catch (e) { }
		}
	});

	Array.prototype.forEach.call(ehDownloadSettingPanel.getElementsByClassName('ehD-setting-content'), function(elem) {
		elem.addEventListener('focusin', function(event){
			ehDownloadSettingPanel.setAttribute('data-active-setting', this.dataset.settingPage);
			// prevent auto-scroll from browser
			ehDownloadSettingPanel.scrollLeft = 0;
		}, true);
	});
}

function getImageLimits() {
	var host = host || location.hostname;
	if (host === 'exhentai.org') {
		host = 'e-hentai.org';
	}

	var preData = JSON.parse(localStorage.getItem('ehd-image-limits-' + host) || '{"timestamp":0}');
	return preData;
}

function loadImageLimits(forced, host){
	if (!visibleState) {
		return;
	}
	var host = host || location.hostname;
	if (host === 'exhentai.org') {
		host = 'e-hentai.org';
	}
	var url = 'https://' + host + '/home.php';

	var preData = getImageLimits();
	if (!forced && new Date() - preData.timestamp < 30000) {
		return showImageLimits();
	}

	console.log('[EHD] Request Image Limits From ' + host);

	GM_xmlhttpRequest({
		method: 'GET',
		url: url,
		timeout: 300000,
		onload: function(res) {
			var responseText = res.responseText;
			if (!responseText) return;
			preData.timestamp = new Date().getTime();
			if (responseText.indexOf('as your account has been suspended') >= 0) {
				preData.suspended = true;
			}
			else if (responseText.indexOf('Your IP address has been temporarily banned') >= 0) {
				preData.ipBanned = true;
			}
			else {
				var data = responseText.match(ehDownloadRegex.imageLimits);
				if (!data || data.length < 3) return;
				preData.cur = data[1];
				preData.total = data[2];

				var donatorPower = responseText.match(ehDownloadRegex.donatorPower);
				if (!donatorPower || donatorPower.length < 2) return;
				preData.donatorPower = +donatorPower[1];
				delete preData.suspended;
				delete preData.ipBanned;
			}
			console.log('[EHD] Image Limits >', JSON.stringify(preData));
			localStorage.setItem('ehd-image-limits-' + host, JSON.stringify(preData));
			showImageLimits();
		}
	});
}

function showImageLimits(){
	// tor doesn't count to normal account since the ip is dynamic, but not sure if it counts for donator/hath perk account
	// if (isTor) {
	// 	return;
	// }

	var list = Object.keys(localStorage).filter(function(elem){
		return elem.indexOf('ehd-image-limits-') === 0;
	}).sort().map(function(elem){
		var curData = JSON.parse(localStorage.getItem(elem));
		if (curData.suspended) {
			return '<a href="https://forums.e-hentai.org/" target="_blank" style="color: #f00">! Account Suspended !</a>';
		}
		if (curData.ipBanned) {
			return '<span style="color: #f00">! IP Banned !</span>';
		}
		if (+curData.cur >= +curData.total) {
			return '<span style="color: #f00">' + curData.cur + '/' + curData.total + '</span>'
		}
		return curData.cur + '/' + curData.total;
	});

	ehDownloadBox.getElementsByClassName('ehD-box-limit')[0].innerHTML = ' | <a href="https://e-hentai.org/home.php" target="_blank">Image Limits: ' + list.join('; ') + '</a>';
}

function getFileSizeAndLength() {
	// TODO: use api.php if fails
	var context = (document.getElementById('gdd') || {}).textContent || '';
	var sizeText = ((context.split('File Size:')[1] || '').split('Length:')[0] || '').trim();
	var pageText = ((context.split('Length:')[1] || '').split('page')[0] || '').trim() ||
		((document.querySelector('.gpc') || {}).textContent.split('of').pop().split('images').shift() || '').trim();

	var sizeMB, sizeKB;
	var page = pageText - 0;

	if (/Mi?B/.test(sizeText)) {
		sizeMB = parseFloat(sizeText) + 0.01;
		sizeKB = sizeMB * 1024;
	}
	else if (/Gi?B/.test(sizeText)) {
		sizeMB = (parseFloat(sizeText) + 0.01) * 1024;
		sizeKB = sizeMB * 1024;
	}
	else {
		sizeMB = 1;
		sizeKB = parseFloat(sizeText);
	}

	var result = {
		sizeMB: sizeMB,
		sizeKB: sizeKB,
		size: sizeKB * 1024,
		page: page
	};

	getFileSizeAndLength = function(){
		return result;
	};

	return result;
};

function toggleFilenameConfirmInput(hide){
	var extendNodes = document.querySelector('.ehD-box-extend');
	if (extendNodes) {
		if (hide === 'reset') {
			ehDownloadBox.removeChild(extendNodes);
			if (setting['recheck-file-name']) toggleFilenameConfirmInput();
		}
		else if (hide) {
			extendNodes.style.display = 'none';
		}
		else {
			extendNodes.style.display = 'block';
		}
	}
	else if (!hide) {
		extendNodes = document.createElement('div');
		extendNodes.className = 'ehD-box-extend';
		extendNodes.innerHTML = '<div class="g2">' + ehDownloadArrow + ' <a><label>File Name <input type="text" class="ehD-box-extend-filename"></label></a></div>' +
		                        '<div class="g2">' + ehDownloadArrow + ' <a><label>Path Name <input type="text" class="ehD-box-extend-dirname"></label></a></div>';
		ehDownloadBox.appendChild(extendNodes);

		dirName = getReplacedName(!setting['dir-name'] ? '{gid}_{token}' : setting['dir-name']);
		fileName = getReplacedName(!setting['file-name'] ? '{title}' : setting['file-name']);
		extendNodes.getElementsByClassName('ehD-box-extend-filename')[0].value = fileName;
		extendNodes.getElementsByClassName('ehD-box-extend-dirname')[0].value = dirName;
	}
}

function getResolutionSetting(forced){
	var url = '/uconfig.php';

	var preData = JSON.parse(localStorage.getItem('ehd-resolution') || '{"timestamp":0}');
	if (!forced && new Date() - preData.timestamp < 3600e3) {
		return;
	}

	// tor site don't have original image feature
	if (isTor) {
		localStorage.setItem('ehd-resolution', JSON.stringify({
			withoutHentaiAtHome: 0,
			resolution: 0,
			timestamp: Date.now()
		}));
		return;
	}

	console.log('[EHD] Request Resolution Setting');

	var xhr = new XMLHttpRequest();
	xhr.onload = function() {
		var responseText = xhr.responseText;
		if (!responseText) return;
		var preData = {
			withoutHentaiAtHome: +((responseText.match(/id="uh_(\d)" checked/) || [])[1] || 0),
			resolution: +((responseText.match(/id="xr_(\d)" checked/) || [])[1] || 0),
			originalImages: +((responseText.match(/id="oi_(\d)".*? checked/) || [])[1] || 0),
			mpvAvailable: responseText.indexOf('name="qb"') >= 0,
			timestamp: Date.now()
		};
		console.log('[EHD] Resolution Setting >', JSON.stringify(preData));
		localStorage.setItem('ehd-resolution', JSON.stringify(preData));
		try {
			showPreCalcCost();
		}
		catch (e) { }
	};
	xhr.open('GET', url);
	xhr.send();
}

function preCalculateCost(){
	// tor doesn't count to normal account since the ip is dynamic, but not sure if it counts for donator/hath perk account
	// if (isTor) {
	// 	return;
	// }

	var resolutionSetting = JSON.parse(localStorage.getItem('ehd-resolution') || '{"timestamp":0}');
	var resolutionCost = {
		0: 1,
		1: 1,
		2: 1,
		3: 1,
		4: 3,
		5: 5
	};
	var info = getFileSizeAndLength();
	var size = info.size;
	var page = info.page;
	var perCost = resolutionCost[resolutionSetting.resolution || 0];
	if ((resolutionSetting.withoutHentaiAtHome || 0) > 1) {
		perCost += 10;
	}
	var leastCost = page * perCost;
		// 1 point per 0.1 MB since August 2019, less than 0.1 MB will also be counted, so asumme each image size has the extra < 100 KB
	var normalCost = Math.ceil((size / 1e5) + page * (1 + perCost));
	var cost = leastCost;
	var gp = Math.ceil(size / 1e5) * 2 + page;
	var isUsingGP = false;
	var isUsingOriginal = !setting['force-resized'] && !isTor;
	// var isSourceNexus = isSourceNexusEnabled();

	// tor site don't have original image feature
	if (isUsingOriginal) {
		if (isGPRequired()) {
			isUsingGP = true;
		}
		if (!isUsingGP) {
			cost = normalCost;
		} else {
			cost = leastCost + ' + ' + gp + ' GP';
		}
	}

	var result = {
		cost: cost,
		normalCost: normalCost,
		leastCost: leastCost,
		perCost: perCost,
		gp: gp,
		isUsingOriginal: isUsingOriginal,
		isUsingGP: isUsingGP,
	};

	console.log('[EHD] Pre-calculate estimated cost >', JSON.stringify(result));
	return result;
}

function showPreCalcCost(){
	var data = preCalculateCost();
	var isUsingOriginal = data.isUsingOriginal;
	var isUsingGP = data.isUsingGP;
	var leastCost = data.leastCost;
	var gp = data.gp;
	var cost = data.cost;

	ehDownloadBox.getElementsByClassName('ehD-box-cost')[0].innerHTML = ' | \
		<a \
			href="https://github.com/ccloli/E-Hentai-Downloader/wiki/E%E2%88%92Hentai-Image-Viewing-Limits" \
			target="_blank" \
			title="' +
			// (isUsingOriginal && isSourceNexus ? '...or ' + cost + ' if Source Nexus hath perk is not available.\n' : '') +
			(isUsingOriginal && !isUsingGP ? '...or ' + leastCost + ' + ' + gp + ' GP if you don\'t have enough viewing limits.\n' : '') +
			'1 point per 0.1 MB since August 2019, less than 0.1 MB will also be counted.\nDuring peak hours, downloading original images will cost GPs.\nFor gallery uploaded 1 year ago, downloading original images will cost GPs since July 2023.\nThe GP cost is the same as resetting viewing limits.\nEstimated GP cost is a bit more than using offical archive download, in case the sum of each images will be larger than the packed.">'
		+ 'Estimated Costs: ' + (/* isSourceNexus ? leastCost : */ cost || '???') + '</a>';
}

// EHD Box, thanks to JingJang@GitHub, source: https://github.com/JingJang/E-Hentai-Downloader
var ehDownloadBox = document.createElement('fieldset');
ehDownloadBox.className = 'ehD-box';
var ehDownloadBoxTitle = document.createElement('legend');
ehDownloadBoxTitle.innerHTML = 'E-Hentai Downloader <span class="ehD-box-limit"></span> <span class="ehD-box-cost"></span> ';
if (origin.indexOf('exhentai.org') >= 0) ehDownloadBoxTitle.style.color = '#ffff66';
ehDownloadBox.appendChild(ehDownloadBoxTitle);
var ehDownloadStylesheet = document.createElement('style');
ehDownloadStylesheet.textContent = ehDownloadStyle;
ehDownloadBox.appendChild(ehDownloadStylesheet);

var extraHint;
if (isInPeakHours() && !isRecentGallery()) {
	extraHint = document.createElement('a');
	extraHint.setAttribute('title', 'Peak Hours: It\'s in peak hours now, during peak hours, downloading original images of 90 days ago cost GPs');
	extraHint.textContent = '[P]';
	ehDownloadBoxTitle.appendChild(extraHint);
}
if (isAncientGallery()) {
	extraHint = document.createElement('a');
	extraHint.setAttribute('title', 'Ancient Gallery: Downloading original images of 1 year ago cost GPs');
	extraHint.textContent = '[A]';
	ehDownloadBoxTitle.appendChild(extraHint);
}

var ehDownloadArrow = '<img src="data:image/gif;base64,R0lGODlhBQAHALMAAK6vr7OztK+urra2tkJCQsDAwEZGRrKyskdHR0FBQUhISP///wAAAAAAAAAAAAAAACH5BAEAAAsALAAAAAAFAAcAAAQUUI1FlREVpbOUSkTgbZ0CUEhBLREAOw==">';

var ehDownloadAction = document.createElement('div');
ehDownloadAction.className = 'g2';
ehDownloadAction.innerHTML = ehDownloadArrow + ' <a>Download Archive</a>';
ehDownloadAction.addEventListener('click', function(event){
	event.preventDefault();

	var torrentsNode = document.querySelector('#gd5 a[onclick*="gallerytorrents.php"]');
	var torrentsCount = torrentsNode ? torrentsNode.textContent.match(/\d+/)[0] - 0 : 0;
	if (isDownloading && !confirm('E-Hentai Downloader is working now, are you sure to stop downloading and start a new download?')) return;

	if (!setting['ignore-torrent'] && torrentsCount > 0 && !confirm('There are ' + torrentsCount + ' torrent(s) available for this gallery. You can download the torrent(s) to get a stable and controllable download experience without spending your image limits, or even get bonus content.\n\nContinue downloading with E-Hentai Downloader (Yes) or use torrent(s) directly (No)?\n(You can disable this notification in the Settings)')) {
		return torrentsNode.dispatchEvent(new MouseEvent('click'));
	}

	if (unsafeWindow.apiuid === -1 && !setting['force-as-login'] && !confirm('You are not logged in to E-Hentai Forums, so you can\'t download original images.\nIf you\'ve already logged in, please try logout and login again.\nContinue with resized images?')) return;

	console.log('[EHD] Is Peak Hours >', isInPeakHours(), ' | Is Recent Gallery >', isRecentGallery(), ' | Is Ancient Gallery >', isAncientGallery(), ' | Is Donator >', isDonator());

	if (
		!setting['force-resized'] &&
		!isTor &&
		!setting['never-warn-peak-hours'] &&
		isGPRequired() // &&
		// !isSourceNexusEnabled()
	) {
		if (isAncientGallery() && isDonator() < 1) {
			if (!confirm('The gallery has been uploaded for a very long time, downloading original images will cost your GPs instead of viewing limits.\nYou can download resized images or disable this notification in script\'s settings.\n\nContinue downloading with original images?')) {
				return;
			}
		} else {
			if (!confirm('It\'s peak hours now, downloading original images will cost your GPs instead of viewing limits.\nYou can download resized images or disable this notification in script\'s settings.\n\nContinue downloading with original images?')) {
				return;
			}
		}
	}

	if (!setting['never-warn-limits']) {
		var costData = preCalculateCost();
		var limitsData = getImageLimits();
		var totalLimitsCost = +(setting['force-resized'] ? costData.leastCost : costData.normalCost) || 0;
		if (Number.isNaN(totalLimitsCost)) {
			totalLimitsCost = 0;
		}
		var finalLimits = +(limitsData.cur || 0) + totalLimitsCost;
		if (finalLimits > limitsData.total) {
			if (!confirm('You may used up your image limits or will run it out, downloading images exceed your limits will cost GPs instead, or credits if you run out of GPs.\nUsed + Estimated = ' + (limitsData.cur || 0) + ' + ' + totalLimitsCost + ' = ' + finalLimits + ' > ' + limitsData.total + '\n\nContinue downloading?')) {
				return;
			}
		}
	}

	ehDownloadDialog.innerHTML = '';

	initEHDownload();
});
ehDownloadBox.appendChild(ehDownloadAction);

var ehDownloadNumberInput = document.createElement('div');
ehDownloadNumberInput.className = 'g2';
ehDownloadNumberInput.innerHTML = ehDownloadArrow + ' <a><label><input type="checkbox" style="vertical-align: middle; margin: 0;"> Number Images</label></a>';
ehDownloadBox.appendChild(ehDownloadNumberInput);

var ehDownloadRange = document.createElement('div');
ehDownloadRange.className = 'g2';
ehDownloadRange.innerHTML = ehDownloadArrow + ' <a><label title="Download ranges of pages, split each range with comma (,)&#13;Ranges prefixed with ! means negative range, pages in these range will be excluded&#13;Example: &#13;  -10:   Download from page 1 to 10&#13;  !8:   Exclude page 8&#13;  12:   Download page 12&#13;  14-20:   Download from page 14 to 20&#13;  15-17:   Exclude page 15 to 17&#13;  30-40/2:   Download each 2 pages in 30-40 (30, 32, 34, 36, 38, 40)&#13;  50-60/3:   Download each 3 pages in 50-60 (50, 53, 56, 59)&#13;  70-:   Download from page 70 to the last page&#13;Pages range follows your order, a negative range can drop previous selected pages, the latter positive range can add it back&#13;Example: &#13;  !10-20:   Download every page except page 10 to 20&#13;  1-10,!1-8/2,!4,5:   Download page 1 to 10 but remove 1, 3, 5, 7 and 4, then add 5 back (2, 5, 6, 8, 9, 10)">Pages Range <input type="text" placeholder="eg. -10,!8,12,14-20,!15-17,30-40/2,50-60/3,70-"></label></a>';
ehDownloadBox.appendChild(ehDownloadRange);

var ehDownloadSetting = document.createElement('div');
ehDownloadSetting.className = 'g2';
ehDownloadSetting.innerHTML = ehDownloadArrow + ' <a>Settings</a>';
ehDownloadSetting.addEventListener('click', function(event){
	event.preventDefault();
	showSettings();
});
ehDownloadBox.appendChild(ehDownloadSetting);

document.body.insertBefore(ehDownloadBox, document.getElementById('asm') || document.querySelector('.gm').nextElementSibling);

var ehDownloadDialog = document.createElement('div');
ehDownloadDialog.className = 'ehD-dialog';
document.body.appendChild(ehDownloadDialog);

var ehDownloadStatus = document.createElement('div');
ehDownloadStatus.className = 'ehD-status';
ehDownloadStatus.addEventListener('click', function(event){
	event.preventDefault();
	ehDownloadDialog.classList.toggle('hidden');
});

var ehDownloadPauseBtn = document.createElement('button');
ehDownloadPauseBtn.className = 'ehD-pause';
ehDownloadPauseBtn.textContent ='Pause';
ehDownloadPauseBtn.addEventListener('click', function(event){
	if (!isPausing) {
		isPausing = true;
		ehDownloadPauseBtn.textContent = 'Resume';
		
		if (setting['force-pause']) {
			// waiting Tampermonkey for transfering string to ArrayBuffer, it may stuck for a second 
			setTimeout(function(){
				for (var i = 0; i < fetchThread.length; i++) {
					if (typeof fetchThread[i] !== 'undefined' && 'abort' in fetchThread[i]) fetchThread[i].abort();

					if (imageData[i] === 'Fetching' && retryCount[i] < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
						var elem = progressTable.querySelector('tr[data-index="' + i + '"] .ehD-pt-status-text');
						if (elem) elem.textContent = 'Force Paused';

						elem = progressTable.querySelector('tr[data-index="' + i + '"] .ehD-pt-progress-text');
						if (elem) elem.textContent = '';

						imageData[i] = null;
						//fetchCount = 0; // fixed for async
						fetchCount--;

						updateTotalStatus();
					}
				}
			}, 0);
		}

		if (emptyAudio) {
			emptyAudio.pause();
		}
	}
	else {
		isPausing = false;
		ehDownloadPauseBtn.textContent = setting['force-pause'] ? 'Pause (Downloading images will be aborted)' : 'Pause (Downloading images will keep downloading)';

		checkFailed();
	}
});

window.addEventListener('focus', function(){
	if (setting['status-in-title'] === 'blur') {
		if (!needTitleStatus) return;
		document.title = pretitle;
		needTitleStatus = false;
	}
});

window.addEventListener('blur', function(){
	if (isDownloading && setting['status-in-title'] === 'blur') {
		needTitleStatus = true;
		document.title = '[' + (isPausing ? '❙❙' : downloadedCount < totalCount ? '↓ ' + downloadedCount + '/' + totalCount : totalCount === 0 ? '↓' : '√' ) + '] ' + pretitle;
	}
});

var forceDownloadTips = document.createElement('div');
forceDownloadTips.className = 'ehD-force-download-tips';
forceDownloadTips.innerHTML = 'If an error occured and script doesn\'t work, click <a href="javascript: getzip();" style="font-weight: bold; pointer-events: auto;" title="Force download won\'t stop current downloading task.">here</a> to force get your downloaded images.';
forceDownloadTips.getElementsByTagName('a')[0].addEventListener('click', function(event){
	// fixed permission denied on GreaseMonkey
	event.preventDefault();
	saveDownloaded(true);
});

var closeTips = document.createElement('div');
closeTips.className = 'ehD-close-tips';
closeTips.innerHTML = 'E-Hentai Downloader is still running, please don\'t close this tab until it finished downloading.<br><br>If any bug occured and the script doesn\'t work correctly, you can move your mouse pointer onto the progress box, and force to save downloaded images before you leave.';

unsafeWindow.getzip = window.getzip = function(){
	saveDownloaded(true);
};

initSetting();

window.addEventListener('storage', showImageLimits);

window.onbeforeunload = unsafeWindow.onbeforeunload = function(){
	function clearRubbish(){
		for (var i = 0; i < fetchThread.length; i++) {
			if (typeof fetchThread[i] !== 'undefined' && 'abort' in fetchThread[i]) fetchThread[i].abort();
		}
		ehDownloadFS.removeFile(unsafeWindow.gid + '.zip');
	}
	if (isDownloading || isPausing || isSaving) {
		document.body.appendChild(closeTips);

		setTimeout(function(){
			document.body.removeChild(closeTips);
		}, 100);

		return 'E-Hentai Downloader is still running, please don\'t close this tab until it finished downloading.';
	}
	clearRubbish();
};
