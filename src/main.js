
var zip;
var imageList = [];
var imageData = [];
var infoStr;
var origin = window.location.origin;
var setting = GM_getValue('ehD-setting') ? JSON.parse(GM_getValue('ehD-setting')) : {};
var fetchCount = 0;
var downloadedCount = 0;
var totalCount = 0;
var retryCount = 0;
var failedCount = 0;
var fetchThread = [];
var dirName;
var fileName;
var progressTable = null;
var isREH = false;
var needNumberImages = setting['number-images'];
var pagesRange = [];
var isDownloading = false;
var isPausing = false;
var isSaving = false;
var pageURLsList = [];
var getAllPagesURLFin = false;
var pretitle = document.title;
var needTitleStatus = setting['status-in-title'] === 'always' ? true : false;
var fetchPagesXHR = new XMLHttpRequest();

// r.e-hentai.org points all links to g.e-hentai.org
if (origin.indexOf('r.e-hentai.org') >= 0) {
	origin = origin.replace(/r\.e-hentai\.org/, 'g.e-hentai.org');
	isREH = true;
}

var ehDownloadRegex = {
	imageURL: [
		/<a href="(\S+?\/fullimg\.php\?\S+?)"/,
		/<img id="img" src="(\S+?)"/,
		/<\/(?:script|iframe)><a[\s\S]+?><img src="(\S+?)"/ // Sometimes preview image may not have id="img"
	],
	nextFetchURL: [
		/<a id="next"[\s\S]+?href="(\S+?\/s\/\S+?)"/,
		/<a href="(\S+?\/s\/\S+?)"><img src="http:\/\/ehgt.org\/g\/n.png"/
	],
	preFetchURL: /<div class="sn"><a[\s\S]+?href="(\S+?\/s\/\S+?)"/,
	nl: /return nl\('([\d-]+)'\)/,
	fileName: /g\/l.png"\s?\/><\/a><\/div><div>([\s\S]+?) :: /,
	resFileName: /filename=['"]?([\s\S]+?)['"]?$/m,
	dangerChars: /[:"*?|<>\/\\\n]/g,
	pagesRange: /^(\d*(-\d*)?\s*?,\s*?)*\d*(-\d*)?$/,
	pagesURL: /(?:<a href=").+?(?=")/gi,
	imageLimits: /You are currently at <strong>(\d+)<\/strong> towards a limit of <strong>(\d+)<\/strong>/,
	pagesLength: /<table class="ptt"(?:[\s\S]+?(\d+)<\/a>)*[\s\S+]+<\/table>/
};

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

		ehDownloadFS.removeAllFiles();

		if (confirm('An error occured when storing files to FileSystem.\n' +
					'Error Name: ' + (e.name || 'Unknown Error') + '\n' +
					'Error Message: ' + e.message + '\n\n' +
					'Should I try FileSystem again (Yes) or redirect to try using Blob (No)? \n' +
					'* If the error message shows it\'s due to no more free disk space, try removing some files from the disk where Chrome installed (mostly C: on Windows)')) {
			generateZip(true, ehDownloadFS.fs, true);
		}
		else {
			ehDownloadFS.needFileSystem = false;
			generateZip(false, undefined, true);
		}
	},
	saveAs: function(fs, forced){
		var fs = fs || ehDownloadFS.fs;
		if (fs === undefined) return;
		fs.root.getFile(unsafeWindow.gid + '.zip', {}, function (fileEntry) {
			var url = fileEntry.toURL();
			console.log('[EHD] File URL >', url);
			var a = document.createElement('a');
			a.setAttribute('href', url);
			a.setAttribute('download', fileName + '.zip');
			a.click();
			pushDialog('\n\nNot download or file is broken? <a href="' + url + '" download="' + fileName + '.zip" style="color: #ffffff; font-weight: bold;">Click here to download</a>\n\n');
			if (!forced) insertCloseButton();
		});
	},
	removeFile: function(fileName, fs, isEntry){
		var fs = fs || ehDownloadFS.fs;
		if (fs === undefined) return;
		var removeFunction = function(fileEntry){
			if (fileEntry.isFile) fileEntry.remove(function(){
				console.log('[EHD] File', fileName, 'is removed.');
			}, ehDownloadFS.errorHandler);
			else if (fileEntry.isDirectory) fileEntry.removeRecursively(function() {
				console.log('[EHD] Directory', fileName, 'is removed.');
			}, ehDownloadFS.errorHandler);
		};
		if (isEntry) removeFunction(fileName);
		else fs.root.getFile(fileName, {create: false}, removeFunction, ehDownloadFS.errorHandler);
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
		ehDownloadFS.removeFile(unsafeWindow.gid + '.zip');
		fs.root.getFile('config.txt', {create: false}, function(fileEntry){
			fileEntry.file(function(file){
				var fileReader = new FileReader();
				fileReader.onloadend = function() {
					var value = this.result;
					if (value === '' || value == null) return;
					var data = JSON.parse(value);
					if (data && confirm('You have an undownload archive, download it?\n\nFile Name: ' + data.fileName + '\n\n* If you have already downloaded it, click cancel to remove this cached archive.')) {
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
					zip.folder(data.dirName).file(entries[index].name, this.result);
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

var ehDownloadStyle = '\
	.ehD-box { margin: 20px auto; width: 732px; box-sizing: border-box; font-size: 12px; border: 1px groove #000000; }\
	.ehD-box a { cursor: pointer; }\
	.ehD-box .g2 { display: inline-block; margin: 10px; padding: 0; line-height: 14px; }\
	.ehD-box legend a { color: inherit; text-decoration: none; }\
	.ehD-box-extend input { width: 255px; }\
	.ehD-setting { position: fixed; left: 0; right: 0; top: 0; bottom: 0; padding: 5px; border: 1px solid #000000; background: #34353b; color: #dddddd; width: 600px; height: 550px; max-width: 100%; max-height: 100%; overflow-x: hidden; overflow-y: auto; box-sizing: border-box; margin: auto; z-index: 999; text-align: left; font-size: 12px; outline: 5px rgba(0, 0, 0, 0.25) solid; }\
	.ehD-setting-tab { list-style: none; margin: 5px 0; padding: 0 10px; border-bottom: 1px solid #cccccc; overflow: auto; }\
	.ehD-setting-tab li { float: left; padding: 5px 10px; border-bottom: 0; cursor: pointer; }\
	.ehD-setting[data-active-setting="basic"] li[data-target-setting="basic"], .ehD-setting[data-active-setting="advanced"] li[data-target-setting="advanced"] { font-weight: bold; background: #cccccc; color: #000000; }\
	.ehD-setting-wrapper { width: 200%; overflow: hidden; -webkit-transform: translateX(0%); -moz-transform: translateX(0%); -o-transform: translateX(0%); -ms-transform: translateX(0%); transform: translateX(0%); -webkit-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); -moz-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); -o-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); -ms-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); }\
	.ehD-setting[data-active-setting="advanced"] .ehD-setting-wrapper { -webkit-transform: translateX(-50%); -moz-transform: translateX(-50%); -o-transform: translateX(-50%); -ms-transform: translateX(-50%); transform: translateX(-50%); }\
	.ehD-setting-content { width: 50%; float: left; box-sizing: border-box; padding: 5px 10px; }\
	.ehD-setting .g2 { padding-bottom: 10px; }\
	.ehD-setting input, .ehD-box input { vertical-align: middle; }\
	.ehD-setting input[type="text"], .ehD-box input[type="text"], .ehD-setting input[type="number"] { height: 13px; }\
	.ehD-box input[type="number"] { height: 17px; }\
	.ehD-pt { table-layout: fixed; width: 100%; }\
	.ehD-pt-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }\
	.ehD-pt-progress-outer { width: 160px; position: relative; }\
	.ehD-pt-progress { width: 150px; }\
	.ehD-pt-progress-text { position: absolute; width: 100%; text-align: center; color: #34353b; left: 0; right: 0; }\
	.ehD-pt-status { width: 130px; }\
	.ehD-pt-succeed .ehD-pt-status { color: #00ff00; }\
	.ehD-pt-warning .ehD-pt-status { color: #ffff00; }\
	.ehD-pt-failed .ehD-pt-status { color: #ff0000; }\
	.ehD-pt-abort { color: #ffff00; display: none; cursor: pointer; }\
	.ehD-pt-status[data-inited-abort="1"]:hover .ehD-pt-abort, .ehD-pt-failed .ehD-pt-status[data-inited-abort="1"]:hover .ehD-pt-status-text, .ehD-pt-succeed .ehD-pt-status[data-inited-abort="1"]:hover .ehD-pt-status-text { display: inline; }\
	.ehD-pt-status[data-inited-abort="1"]:hover .ehD-pt-status-text, .ehD-pt-failed .ehD-pt-status[data-inited-abort="1"]:hover .ehD-pt-abort, .ehD-pt-succeed .ehD-pt-status[data-inited-abort="1"]:hover .ehD-pt-abort { display: none; }\
	.ehD-pt-gen-progress { width: 50%; }\
	.ehD-pt-gen-filename { margin-bottom: 1em; }\
	.ehD-dialog { position: fixed; right: 0; bottom: 0; display: none; padding: 5px; border: 1px solid #000000; background: #34353b; color: #dddddd; width: 550px; height: 300px; overflow: auto; z-index: 999; word-break: break-all; }\
	.ehD-status { position: fixed; right: 0; bottom: 311px; width: 550px; padding: 5px; border: 1px solid #000000; background: #34353b; color: #dddddd; cursor: pointer; -webkit-user-select: none; -moz-user-select: none; -o-user-select: none; -ms-user-select: none; user-select: none; }\
	.ehD-dialog, .ehD-status { -webkit-transition: margin 0.5s ease; -moz-transition: margin 0.5s ease; -o-transition: margin 0.5s ease; -ms-transition: margin 0.5s ease; transition: margin 0.5s ease; }\
	.ehD-dialog.hidden, .ehD-dialog.hidden .ehD-status { margin-bottom: -311px; }\
	.ehD-dialog .ehD-force-download-tips { position: fixed; right: 0; bottom: 288px; border: 1px solid #000000; width: 550px; padding: 5px; background: rgba(0, 0, 0, 0.75); color: #ffffff; cursor: pointer; opacity: 0; pointer-events: none; }\
	.ehD-dialog:hover .ehD-force-download-tips { opacity: 1; }\
	.ehD-dialog.hidden .ehD-force-download-tips { display: none; }\
	.ehD-close-tips { position: fixed; left: 0; right: 0; bottom: 0; padding: 10px; border: 1px solid #000000; background: #34353b; color: #dddddd; width: 732px; max-width: 100%; max-height: 100%; overflow-x: hidden; overflow-y: auto; box-sizing: border-box; margin: auto; z-index: 1000; text-align: left; font-size: 14px; outline: 5px rgba(0, 0, 0, 0.25) solid; }\
	';

if (location.hostname === 'exhentai.org') {
	ehDownloadStyle+='	.ehD-pt-progress-text { color: #ffffff; }'
}

// overwrite settings or set default settings
if (setting['status-in-title'] === true) setting['status-in-title'] = 'blur';
if (!setting['save-info-list']) {
	setting['save-info-list'] = ['title', 'metas', 'uploader-comment', 'page-links'];
}
if (localStorage.getItem('ehd-image-limits-g.e-hentai.org')) {
	localStorage.removeItem('ehd-image-limits-g.e-hentai.org');
}

// log information
console.log('[EHD] UserAgent >', navigator.userAgent);
console.log('[EHD] Script Handler >', GM_info.scriptHandler || (navigator.userAgent.indexOf('Firefox') >= 0 ? 'GreaseMonkey' : (navigator.userAgent.indexOf('Opera') >= 0 || navigator.userAgent.indexOf('Maxthon') >= 0) ? 'Violentmonkey' : undefined)); // (Only Tampermonkey supports GM_info.scriptHandler)
console.log('[EHD] Script Handler Version >', GM_info.version);
console.log('[EHD] E-Hentai Downloader Version >', GM_info.script.version);
console.log('[EHD] E-Hentai Downloader Setting >', JSON.stringify(setting));
console.log('[EHD] Current URL >', window.location.href);
console.log('[EHD] Is Logged In >', unsafeWindow.apiuid !== -1);

// disable single-thread download
if (setting['enable-multi-threading'] === false) {
	delete setting['enable-multi-threading'];
	alert('Single-thread download is unavailable now, because its code is too old and it\'s hard to add new features on it.\n\nIf you still need it, please roll back to the last-supported version (1.17.4).\n\nYou can get it at:\n- GitHub: https://github.com/ccloli/E-Hentai-Downloader/releases\n- GreasyFork: https://greasyfork.org/scripts/10379-e-hentai-downloader/versions (requires log in and enable Adult content)\n- SleazyFork: https://sleazyfork.org/scripts/10379-e-hentai-downloader/versions');
	GM_setValue('ehD-setting', JSON.stringify(setting));
}

String.prototype.replaceHTMLEntites = function() {
	var matchEntity = function(entity) {
		var entitesList = {"euro":"€","nbsp":" ","quot":"\"","amp":"&","lt":"<","gt":">","iexcl":"¡","cent":"¢","pound":"£","curren":"¤","yen":"¥","brvbar":"¦","sect":"§","uml":"¨","copy":"©","ordf":"ª","not":"¬","shy":"","reg":"®","macr":"¯","deg":"°","plusmn":"±","sup2":"²","sup3":"³","acute":"´","micro":"µ","para":"¶","middot":"·","cedil":"¸","sup1":"¹","ordm":"º","raquo":"»","frac14":"¼","frac12":"½","frac34":"¾","iquest":"¿","agrave":"à","aacute":"á","acirc":"â","atilde":"ã","auml":"ä","aring":"å","aelig":"æ","ccedil":"ç","egrave":"è","eacute":"é","ecirc":"ê","euml":"ë","igrave":"ì","iacute":"í","icirc":"î","iuml":"ï","eth":"ð","ntilde":"ñ","ograve":"ò","oacute":"ó","ocirc":"ô","otilde":"õ","ouml":"ö","times":"×","oslash":"ø","ugrave":"ù","uacute":"ú","ucirc":"û","uuml":"ü","yacute":"ý","thorn":"þ","szlig":"ß","divide":"÷"};
		if (entitesList[entity]) return entitesList[entity];
		else if (/#\d+/.test(entity)) {
			var charCode = entity.match(/#(\d+)/)[1] - 0;
			return String.fromCharCode(charCode);
		}
		else if (/#x\d+/.test(entity)) {
			var charCode = parseInt(entity.match(/#x(\d+)/)[1] - 0, 16);
			return String.fromCharCode(charCode);
		}
		else return '&' + entity + ';';
	};
	var result = this.replace(/&(#[xX]?\d+|[a-zA-Z]+);/g, function(match, entity) {
		return matchEntity(entity.toLowerCase());
	});
	return result;
};

// Fixed cross origin in r.e-hentai.org
function replaceOrigin(str) {
	if (isREH) return str.replace('g.e-hentai.org', 'r.e-hentai.org');
	return str;
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
	var needScrollIntoView = ehDownloadDialog.clientHeight + ehDownloadDialog.scrollTop >= ehDownloadDialog.scrollHeight;

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
	return str.replace(/\{gid\}/gi, unsafeWindow.gid)
		.replace(/\{token\}/gi, unsafeWindow.token)
		.replace(/\{title\}/gi, getSafeName(document.getElementById('gn').textContent))
		.replace(/\{subtitle\}/gi, document.getElementById('gj').textContent ? getSafeName(document.getElementById('gj').textContent) : getSafeName(document.getElementById('gn').textContent))
		.replace(/\{tag\}/gi, document.querySelector('.ic').getAttribute('alt').toUpperCase())
		.replace(/\{uploader\}/gi, getSafeName(document.querySelector('#gdn a').textContent))
		.replaceHTMLEntites();
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
	//console.log('[EHD-Debug]', index, 'Res data was stored in imageData!', new Date().getTime());

	updateTotalStatus();
	if (!isPausing) checkFailed();
	
	for (var i in res) {
		delete res[i];
	}
}

function generateZip(isFromFS, fs, isRetry, forced){
	isSaving = true;

	// remove pause button
	if (!forced && ehDownloadDialog.contains(ehDownloadPauseBtn)) {
		ehDownloadDialog.removeChild(ehDownloadPauseBtn);
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

		if (setting['save-info'] === 'file' || !setting['save-info']) zip.folder(dirName).file('info.txt', infoStr.replace(/\n/gi, '\r\n'));
	}

	pushDialog('\n\nGenerating Zip file...\n');

	var fs = fs || ehDownloadFS.fs;

	var progress = document.createElement('progress');
	var curFile = document.createElement('div');
	progress.className = 'ehD-pt-gen-progress';
	curFile.className = 'ehD-pt-gen-filename';
	ehDownloadDialog.appendChild(progress);
	ehDownloadDialog.appendChild(curFile);

	try {
		// build arraybuffer object to detect if it generates successfully
		zip.generateAsync({
			type: 'arraybuffer',
			compression: setting['compression-level'] ? 'DEFLATE' : 'STORE',
			compressionOptions: {
				level: setting['compression-level'] > 0 ? (setting['compression-level'] < 10 ? setting['compression-level'] : 9) : 1
			},
			streamFiles: setting['file-descriptor'] ? true : false,
			comment: setting['save-info'] === 'comment' ? infoStr.replace(/\n/gi, '\r\n') : undefined
		}, function(meta){
			progress.value = meta.percent / 100;
			curFile.textContent = meta.currentFile || 'Calculating extra data...';
		}).then(function(abData){
			if (!forced) {
				zip.file(/.*/).forEach(function(elem){
					zip.remove(elem);
				});
			}

			if (isFromFS || ehDownloadFS.needFileSystem) { // using filesystem to save file is needed
				curFile.textContent = ' ';

				var fs = fs || ehDownloadFS.fs;
				pushDialog('\n\nSpliting and storing Zip file to FileSystem...');
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
					}, ehDownloadFS.errorHandler);
				};
				
				fs.root.getFile(unsafeWindow.gid + '.zip', {create: true}, function(fileEntry){
					if (fileEntry.isFile) fileEntry.remove(function(){
						console.log('[EHD] File', fileName, 'is removed.');
					}, ehDownloadFS.errorHandler);
					else if (fileEntry.isDirectory) fileEntry.removeRecursively(function() {
						console.log('[EHD] Directory', fileName, 'is removed.');
					}, ehDownloadFS.errorHandler);
					
					fs.root.getFile(unsafeWindow.gid + '.zip', {create: true}, loopWrite, ehDownloadFS.errorHandler);
				}, ehDownloadFS.errorHandler);
				//fs.root.getFile(unsafeWindow.gid + '.zip', {create: true}, loopWrite, ehDownloadFS.errorHandler);
			}
			else { // or just using blob
				curFile.textContent = 'Generating Blob object...';
				var blob = createBlob([abData], {type: 'application/zip'});
				curFile.textContent = ' ';
				saveAs(blob, fileName + '.zip');

				var redownloadBtn = document.createElement('button');
				redownloadBtn.textContent = 'Not download? Click here to download';
				redownloadBtn.addEventListener('click', function(){
					// rebuild blob object if "File is not exist" occured
					blob = createBlob([abData], {type: 'application/zip'});
					saveAs(blob, fileName + '.zip');

					setTimeout(function(){
						if ('close' in blob) blob.close();
						blob = null;
					}, 10e3); // 10s to fixed Chrome delay downloads
				});
				ehDownloadDialog.appendChild(redownloadBtn);

				if (!forced) insertCloseButton();
				isSaving = false;

				setTimeout(function(){
					if ('close' in blob) blob.close();
					blob = null;
				}, 10e3); // 10s to fixed Chrome delay downloads
			}
		});
	}
	catch (error) {
		abData = undefined;

		pushDialog('An error occurred when generating Zip file as ArrayBuffer.');
		console.error('[EHD] An error occurred when generating Zip file as ArrayBuffer.');
		console.error(error);
		if (confirm('An error occurred when generating Zip file as ArrayBuffer. Try again?')) return generateZip(isFromFS, fs, 1);

		if (isFromFS || ehDownloadFS.needFileSystem) {
			// if enabled file system, then store all files into file system
			pushDialog('Storing files into File System...');
			var files = zip.file(/.*/);
			var fileIndex = 0;
			var filesLength = files.length;
			var initFS = function(r){
				fs = r;
				fs.root.getDirectory('raw', {create: true}, loopWrite, ehDownloadFS.errorHandler);
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
									pushDialog('Succeed!\nPlease close this tab and open a new tab to download.\nIf you still can\'t download it, try using <a href="https://chrome.google.com/webstore/detail/nhnjmpbdkieehidddbaeajffijockaea" target="_blank">HTML5 FileSystem Explorer</a> to save them.');

									files.forEach(function(elem){
										zip.remove(elem);
									});
									zip = undefined;
									isSaving = false;
								});
							});
						}
					}, ehDownloadFS.errorHandler);
				}, ehDownloadFS.errorHandler);
			};
			requestFileSystem(window.TEMPORARY, 1024 * 1024 * 1024 * 1024, initFS, ehDownloadFS.errorHandler);
		}
	}
}

// update progress table info
function updateProgress(nodeList, data) {
	if (data.name !== undefined) nodeList.fileName.textContent = data.name;
	if (data.progress !== undefined) nodeList.progress.value = data.progress;
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
	console.error('[EHD] Index >', index + 1, ' | RealIndex >', imageList[index]['realIndex'], ' | Name >', imageList[index]['imageName'], ' | RetryCount >', retryCount[index], ' | DownloadedCount >', downloadedCount, ' | FetchCount >', fetchCount, ' | FailedCount >', failedCount);

	if (!forced && retryCount[index] < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
		retryCount[index]++;
		fetchOriginalImage(index, nodeList);
	}
	else {
		updateProgress(nodeList, {
			class: 'ehD-pt-failed'
		});

		imageList[index]['imageFinalURL'] = null;
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
			zip.folder(dirName).file(imageList[j]['imageName'], imageData[j]);
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
			if (setting['number-auto-retry'] || confirm('Some images were failed to download. Would you like to try them again?')) {
				retryAllFailed();
			}
			else {
				pushDialog('\nFetch images failed.');
				if (confirm('Fetch images failed, Please try again later.\n\nWould you like to download downloaded images?')) {
					saveDownloaded();
				}
				else {
					insertCloseButton();
				}
				zip.remove(dirName);
				isDownloading = false;
			}
		}
	}
	else { // all files are downloaded successfully
		renameImages();
		for (var j = 0; j < totalCount; j++) {
			zip.folder(dirName).file(imageList[j]['imageName'], imageData.shift());
		}
		generateZip();
		zip.remove(dirName);
		isDownloading = false;
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
	var needScrollIntoView = ehDownloadDialog.clientHeight + ehDownloadDialog.scrollTop >= ehDownloadDialog.scrollHeight;

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
		console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nResposeHeaders >' + res.responseHeaders);

		updateProgress(nodeList, {
			status: 'Failed! (Low Speed)',
			progress: '0',
			progressText: '',
			class: 'ehD-pt-warning'
		});

		if (imageList[index]['imageURL'].indexOf('fullimg.php') >= 0) imageList[index]['imageFinalURL'] = res.finalUrl;

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

	fetchThread[index] = GM_xmlhttpRequest({
		method: 'GET',
		url: requestURL,
		responseType: 'arraybuffer',
		timeout: (setting['timeout'] !== undefined) ? Number(setting['timeout']) * 1000 : 300000,
		headers: {
			'Referer': imageList[index]['pageURL'],
			'X-Alt-Referer': imageList[index]['pageURL']
		},
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
				progress: res.lengthComputable ? res.loaded / res.total : '',
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
		},
		onload: function(res) {
			//console.log('[EHD-Debug]', index, 'Load Finished!', new Date().getTime());
			
			removeTimerHandler();
			if (!isDownloading || imageData[index] instanceof ArrayBuffer) return; // Temporarily fixes #31

			// cache them to reduce waiting time and CPU usage on Chrome with Tampermonkey
			// (Tampermonkey uses a dirty way to give res.response, transfer string to arraybuffer every time)
			// now store progress just spent ~1s instead of ~8s
			var response = res.response;
			var byteLength = response.byteLength;
			var responseHeaders = res.responseHeaders;
			
            // use regex to fixed compatibility with http/2, as its headers are lower case (at least fixed with Yandex Turbo)
			var mime = responseHeaders.match(/Content-Type:/i) ? responseHeaders.split(/Content-Type:/i)[1].split('\n')[0].trim().split('/') : ['', ''];

			if (!response) {
				console.log('[EHD] #' + (index + 1) + ': Empty Response (See: https://github.com/ccloli/E-Hentai-Downloader/issues/16 )');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nResposeHeaders >' + res.responseHeaders);

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
			else if (byteLength === 925) { // '403 Access Denied' Image Byte Size
				// GM_xhr only support abort()
				console.log('[EHD] #' + (index + 1) + ': 403 Access Denied');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL + '\nResposeHeaders >' + res.responseHeaders);

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
			else if (byteLength === 28) { // 'An error has occurred. (403)' Length
				console.log('[EHD] #' + (index + 1) + ': An error has occurred. (403)');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL + '\nResposeHeaders >' + res.responseHeaders);
				
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
			else if (
				byteLength === 142 ||   // Image Viewing Limits String Byte Size (exhentai)
				byteLength === 144 ||   // Image Viewing Limits String Byte Size (g.e-hentai)
				byteLength === 28658 || // '509 Bandwidth Exceeded' Image Byte Size
				(mime[0] === 'text' && (res.responseText || new TextDecoder().decode(new DataView(response))).indexOf('You have exceeded your image viewing limits') >= 0) // directly detect response content in case byteLength will be modified
			) {
				// thought exceed the limits, downloading image is still accessable
				/*for (var i = 0; i < fetchThread.length; i++) {
					if (typeof fetchThread[i] !== 'undefined' && 'abort' in fetchThread[i]) fetchThread[i].abort();
				}*/
				console.log('[EHD] #' + (index + 1) + ': Exceed Image Viewing Limits / 509 Bandwidth Exceeded');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL + '\nResposeHeaders >' + res.responseHeaders);

				updateProgress(nodeList, {
					status: 'Failed! (Exceed Limits)',
					progress: '0',
					progressText: '',
					class: 'ehD-pt-failed'
				});
				updateTotalStatus();

				for (var i in res) {
					delete res[i];
				}

				failedCount++;
				fetchCount--;
				updateTotalStatus();

				if (isPausing) return;

				pushDialog('You have exceeded your image viewing limits.\n');
				isPausing = true;
				updateTotalStatus();

				if (ehDownloadDialog.contains(ehDownloadPauseBtn)) {
					ehDownloadDialog.removeChild(ehDownloadPauseBtn);
				}

				if (confirm('You have temporarily reached the limit for how many images you can browse.\n\n\
					- If you are not sign in, sign up/in E-Hentai account at E-Hentai Forums to get double daily quota.\n\
					- You can run the Hentai@Home to support E-Hentai and get some points which you can pay to increase your limit.\n\
					- Check back in a few hours, and you will be able to download more (reduce 3 points per minute by default).\n\
					- You can reset your image viewing limits to continue by paying your GPs or credits.\n\n\
					If you want to reset your limits by paying your GPs or credits right now, choose YES, and you can reset it on opened window. Or if you want to wait a few minutes until you have enough free limits, then continue, choose NO.')) {
					window.open('http://e-hentai.org/home.php');
				}

				var resetButton = document.createElement('a');
				resetButton.innerHTML = '<button>Reset Limits</button>';
				resetButton.setAttribute('href', 'http://e-hentai.org/home.php');
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
					requestDownload();
				});
				ehDownloadDialog.appendChild(continueButton);

				var cancelButton = document.createElement('button');
				cancelButton.innerHTML = 'Cancel Download';
				cancelButton.addEventListener('click', function(){
					ehDownloadDialog.removeChild(resetButton);
					ehDownloadDialog.removeChild(continueButton);
					ehDownloadDialog.removeChild(cancelButton);

					if (confirm('You have exceeded your image viewing limits. Would you like to save downloaded images?')) {
						saveDownloaded();
					}
					else {
						insertCloseButton();
					}
					isPausing = false;
					isDownloading = false;
					zip.remove(dirName);
				});
				ehDownloadDialog.appendChild(cancelButton);
			}
			// res.status should be detected at here, because we should know are we reached image limits at first
			else if (res.status !== 200) {
				console.log('[EHD] #' + (index + 1) + ': Wrong Response Status');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL + '\nResposeHeaders >' + res.responseHeaders);

				updateProgress(nodeList, {
					status: 'Failed! (Wrong Status)',
					progress: '0',
					progressText: '',
					class: 'ehD-pt-warning'
				});

				for (var i in res) {
					delete res[i];
				}
				return failedFetching(index, nodeList);
			}
			// GM_xhr doesn't support xhr.getResponseHeader() function
			//if (res.getResponseHeader('Content-Type').split('/')[0] != 'image') {
			else if (mime[0] !== 'image') {
				console.log('[EHD] #' + (index + 1) + ': Wrong Content-Type');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL + '\nResposeHeaders >' + res.responseHeaders);

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

			//console.log('[EHD-Debug]', index, 'Available Testing Finished!', new Date().getTime());
			imageList[index]['_imageName'] = imageList[index]['imageName'] = res.responseHeaders.match(ehDownloadRegex.resFileName) ? getSafeName(res.responseHeaders.match(ehDownloadRegex.resFileName)[1].trim()) : imageList[index]['imageName'];
			//console.log('[EHD-Debug]', index, 'File name was modified!', new Date().getTime());

			updateProgress(nodeList, {
				name: '#' + imageList[index]['realIndex'] + ': ' + imageList[index]['imageName'],
				status: 'Succeed!',
				progress: '1',
				progressText: '100%',
				class: 'ehD-pt-succeed'
			});
			//console.log('[EHD-Debug]', index, 'Progress was updated!', new Date().getTime());

			storeRes(response, index);
			//console.log('[EHD-Debug]', index, 'Data was saved!', new Date().getTime());

			for (var i in res) {
				delete res[i];
			}
			response = null;
			//console.log('[EHD-Debug]', index, 'Res was deleted!', new Date().getTime());
		},
		onerror: function(res){
			removeTimerHandler();
			if (!isDownloading || imageData[index] instanceof ArrayBuffer) return; // Temporarily fixes #31

			console.log('[EHD] #' + (index + 1) + ': Network Error');
			console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nResposeHeaders >' + res.responseHeaders);

			updateProgress(nodeList, {
				status: 'Failed! (Network Error)',
				progress: '0',
				progressText: '',
				class: 'ehD-pt-warning'
			});

			if (imageList[index]['imageURL'].indexOf('fullimg.php') >= 0) imageList[index]['imageFinalURL'] = res.finalUrl;

			for (var i in res) {
				delete res[i];
			}

			failedFetching(index, nodeList);
		},
		ontimeout: function(res){
			removeTimerHandler();
			if (!isDownloading || imageData[index] instanceof ArrayBuffer) return; // Temporarily fixes #31

			console.log('[EHD] #' + (index + 1) + ': Timed Out');
			console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nRequest URL >', requestURL, '\nResposeHeaders >' + res.responseHeaders);

			updateProgress(nodeList, {
				status: 'Failed! (Timed Out)',
				progress: '0',
				progressText: '',
				class: 'ehD-pt-warning'
			});

			if (imageList[index]['imageURL'].indexOf('fullimg.php') >= 0) imageList[index]['imageFinalURL'] = res.finalUrl;

			for (var i in res) {
				delete res[i];
			}

			failedFetching(index, nodeList);
		}
	});

	if (!nodeList.status.dataset.initedAbort) {
		nodeList.abort.addEventListener('click', function(){
			if (!isDownloading || imageData[index] instanceof ArrayBuffer) return; // Temporarily fixes #31

			if (typeof fetchThread[index] !== 'undefined' && 'abort' in fetchThread[index]) fetchThread[index].abort();
			removeTimerHandler();
			
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

function insertCloseButton() {
	var exitButton = document.createElement('button');
	exitButton.style.display = 'block';
	exitButton.style.margin = '0 auto';
	exitButton.textContent = 'Close';
	exitButton.onclick = function(){
		ehDownloadDialog.removeChild(exitButton);
		ehDownloadDialog.style.display = 'none';
		if (ehDownloadFS.needFileSystem) ehDownloadFS.removeFile(unsafeWindow.gid + '.zip');
	};
	ehDownloadDialog.appendChild(exitButton);
	ehDownloadDialog.scrollTop = ehDownloadDialog.scrollHeight;

	if (ehDownloadDialog.contains(forceDownloadTips)) ehDownloadDialog.removeChild(forceDownloadTips);
}

// /*if pages range is set, then*/ get all pages URL to select needed pages
function getAllPagesURL() {
	pagesRange = [];
	var pagesRangeText = ehDownloadRange.querySelector('input').value.replace(/，/g, ',').trim();
	var retryCount = 0;

	if (pagesRangeText) { // if pages range is defined
		console.log('[EHD] Pages Range >', pagesRangeText);
		if (!ehDownloadRegex.pagesRange.test(pagesRangeText)) return alert('Pages Range is not correct.');

		var pagesRangeScale = pagesRangeText.match(/\d*-\d*|\d+/g);
		pagesRangeScale.forEach(function(elem){
			if (elem.indexOf('-') < 0) {
				var curElem = Number(elem);
				if (!pagesRange.some(function(e){ return curElem === e; })) pagesRange.push(curElem);
			}
			else {
				var curElem = [Number(elem.split('-')[0] || 1), Number(elem.split('-')[1] || getFileSizeAndLength().page)].sort(function(a, b){ return a - b; });
				for (var i = curElem[0]; i <= curElem[1]; i++) {
					if (!pagesRange.some(function(e){ return i === e; })) pagesRange.push(i);
				}
			}
		});
		pagesRange.sort(function(a, b){ return a - b; });
	}

	ehDownloadDialog.style.display = 'block';
	if (!getAllPagesURLFin) {
		pageURLsList = [];
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
			if (xhr.status !== 200 || !xhr.responseText) {
				if (retryCount < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
					pushDialog('Failed! Retrying... ');
					retryCount++;
					xhr.open('GET', location.pathname + '?p=' + curPage);
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

			var pagesURL = xhr.responseText.split('<div id="gdt">')[1].split('<div class="c">')[0].match(ehDownloadRegex.pagesURL);
			if (!pagesURL) {
				console.error('[EHD] Response content is not correct!');
				if (retryCount < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
					pushDialog('Failed! Retrying... ');
					retryCount++;
					xhr.open('GET', location.pathname + '?p=' + curPage);
					xhr.timeout = 30000;
					xhr.send();
				}
				else {
					pushDialog('Failed!\nCan\'t get pages URL from response content.');
					isDownloading = false;
					//alert('We can\'t get request content from response content. It\'s possible that E-Hentai changes source code format so that we can\'t find them, or your ISP modifies (or say hijacks) the page content. If it\'s sure that you can access to any pages of E-Hentai, including current page: ' + location.pathname + '?p=' + curPage + ' , please report a bug.');
				}
				return;
			}
			for (var i = 0; i < pagesURL.length; i++) {
				pageURLsList.push(replaceOrigin(pagesURL[i].split('"')[1].replaceHTMLEntites()));
			}
			pushDialog('Succeed!');

			curPage++;
			
			if (!pagesLength) { // can't get pagesLength correctly before
				pagesLength = xhr.responseText.match(ehDownloadRegex.pagesLength)[1] - 0;
			}
		
			if (curPage === pagesLength) {
				getAllPagesURLFin = true;
				var wrongPages = pagesRange.filter(function(elem){ return elem > pageURLsList.length; });
				if (wrongPages.length !== 0) {
					pagesRange = pagesRange.filter(function(elem){ return elem <= pageURLsList.length; });
					pushDialog('\nPage ' + wrongPages.join(', ') + (wrongPages.length > 1 ? ' are' : ' is') + ' not exist, and will be ignored.\n');
					if (pagesRange.length === 0) {
						pushDialog('There is no content that matching pages range.');
						alert('There is no content that matching pages range.');
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
				xhr.open('GET', location.pathname + '?p=' + curPage);
				xhr.send();
				pushDialog('\nFetching Gallery Pages URL (' + (curPage + 1) + '/' + pagesLength + ') ... ');
			}
		};
		xhr.ontimeout = xhr.onerror = function(){
			if (retryCount < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
				pushDialog('Failed! Retrying... ');
				retryCount++;
				xhr.open('GET', location.pathname + '?p=' + curPage);
				xhr.timeout = 30000;
				xhr.send();
			}
			else {
				pushDialog('Failed!\nFetch Pages\' URL failed, Please try again later.');
				isDownloading = false;
				alert('Fetch Pages\' URL failed, Please try again later.');
			}
		};
		xhr.open('GET', location.pathname + '?p=' + curPage);
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
				pushDialog('There is no content that matching pages range.');
				alert('There is no content that matching pages range.');
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

	if (dirName === '/') dirName = '';
	needNumberImages = ehDownloadNumberInput.querySelector('input').checked;

	var requiredBytes = Math.ceil(getFileSizeAndLength().size + 100 * 1024);
	var requiredMBs = getFileSizeAndLength().sizeMB + 0.1;

	if ((!setting['store-in-fs'] && requiredMBs >= 300) && !confirm('This archive is too large (original size), please consider downloading this archive in other way.\n\nMaximum allowed file size: Chrome / Opera 15+ 500MB | IE 10+ 600 MB | Firefox 20+ 800 MB\n(From FileSaver.js introduction)\n\nPlease also consider your operating system\'s free memory (RAM), it may takes about DOUBLE size of archive file size when generating ZIP file.\n\n* If continues, you would probably face "Failed - No File" or "Out Of Memory" if you don\'t have enough RAM and can\'t save file successfully.\n\n* If you are using Chrome, you can try enabling "Request File System to handle large Zip file" on settings page.\n\n* You can set Pages Range to download this archive into some parts. If you have already enabled it, please ignore this message.\n\nAre you sure to continue downloading?')) return;
	else if (setting['store-in-fs'] && requestFileSystem && requiredMBs >= (setting['fs-size'] !== undefined ? setting['fs-size'] : 200)) {
		ehDownloadFS.needFileSystem = true;
		console.log('[EHD] Required File System Space >', requiredBytes);

		// Chrome can use about 10% of free space of disk where Chrome User Data stored in as TEMPORARY File System Storage.
		if (navigator.webkitTemporaryStorage) { // if support navigator.webkitTemporaryStorage to check usable space
			navigator.webkitTemporaryStorage.requestQuota(requiredBytes , function (grantedBytes) {
				console.log('[EHD] Free TEMPORARY File System Space >', grantedBytes);
				if (grantedBytes < requiredBytes) {
					console.log('[EHD] Free TEMPORARY File System Space is not enough.');

					// free space is not enough, then use persistent space
					// in fact, free space of persisent file storage is always 10GiB, even free disk space is not enough
					navigator.webkitPersistentStorage.requestQuota(requiredBytes , function (grantedBytes) {
						console.log('[EHD] Free PERSISTENT File System Space >', grantedBytes);
						if (grantedBytes < requiredBytes) {
							// roll back and use Blob to handle file
							ehDownloadFS.needFileSystem = false;
							alert('You don\'t have enough free space where Chrome stored user data in (Default is system disk, normally it\'s C: ), please delete some file.\n\nNeeds more than ' + (requiredBytes - grantedBytes) + ' Bytes.\n\nRoll back and use Blob to handle file.');
						}
						else {
							pushDialog('\n<strong>Please allow storing large content if browser asked a request.</strong>\n');
							requestFileSystem(window.PERSISTENT, requiredBytes, ehDownloadFS.initHandler, ehDownloadFS.errorHandler);
						}
					}, ehDownloadFS.errorHandler);
				}
				else requestFileSystem(window.TEMPORARY, requiredBytes, ehDownloadFS.initHandler, ehDownloadFS.errorHandler);
			}, ehDownloadFS.errorHandler);
		}
		else requestFileSystem(window.TEMPORARY, requiredBytes, ehDownloadFS.initHandler, ehDownloadFS.errorHandler);
	}

	// Array.prototype.some() is a bit ugly, so we use toString().indexOf() lol
	var infoNeeds = setting['save-info-list'].toString();
	if (infoNeeds.indexOf('title') >= 0) {
		infoStr += document.getElementById('gn').textContent.replaceHTMLEntites() + '\n' 
		        + document.getElementById('gj').textContent.replaceHTMLEntites() + '\n' 
		        + window.location.href.replaceHTMLEntites() + '\n\n';
	}

	if (infoNeeds.indexOf('metas') >= 0) {
		infoStr += 'Category: ' + document.getElementsByClassName('ic')[0].getAttribute('alt').toUpperCase() + '\n' 
		        + 'Uploader: ' + document.querySelector('#gdn a').textContent.replaceHTMLEntites() + '\n';
	}
	var metaNodes = document.querySelectorAll('#gdd tr');
	for (var i = 0; i < metaNodes.length; i++) {
		var c1 = metaNodes[i].getElementsByClassName('gdt1')[0].textContent.replaceHTMLEntites();
		var c2 = metaNodes[i].getElementsByClassName('gdt2')[0].textContent.replaceHTMLEntites();
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
	
	var j = 0;
	for (var i = fetchCount; i < (setting['thread-count'] !== undefined ? setting['thread-count'] : 5); i++) {
		for (/*var j = 0*/; j < totalCount; j++) {
			if (imageData[j] == null && (ignoreFailed || (retryCount[j] || 0) <= (setting['retry-count'] !== undefined ? setting['retry-count'] : 3))) {
				imageData[j] = 'Fetching';
				if (imageList[j] && setting['never-new-url']) fetchOriginalImage(j);
				else getPageData(j);
				fetchCount++;
				break;
			}
		}
	}

}

function getPageData(index) {
	if (isPausing) return;

	if (pagesRange.length) var realIndex = pagesRange[index];
	else var realIndex = index + 1;

	var needScrollIntoView = ehDownloadDialog.clientHeight + ehDownloadDialog.scrollTop >= ehDownloadDialog.scrollHeight;

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
	var fetchURL = (imageList[index] ? (imageList[index]['pageURL'] + ((!setting['never-send-nl'] && imageList[index]['nextNL']) ? (imageList[index]['pageURL'].indexOf('?') >= 0 ? '&' : '?') + 'nl=' + imageList[index]['nextNL'] : '')).replaceHTMLEntites() : pageURLsList[realIndex - 1]).replace(/^https?:/, '');

	// assign to fetchThread, so that we can abort them and all GM_xhr by one command fetchThread[i].abort()
	var xhr = fetchThread[index] = new XMLHttpRequest();
	xhr.onload = function() {
		if (xhr.status !== 200 || !xhr.responseText) {
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
		}

		try {
			var imageURL = (unsafeWindow.apiuid !== -1 && xhr.responseText.indexOf('fullimg.php') >= 0 && !setting['force-resized']) ? replaceOrigin(xhr.responseText.match(ehDownloadRegex.imageURL[0])[1].replaceHTMLEntites()) : xhr.responseText.indexOf('id="img"') > -1 ? xhr.responseText.match(ehDownloadRegex.imageURL[1])[1].replaceHTMLEntites() : xhr.responseText.match(ehDownloadRegex.imageURL[2])[1].replaceHTMLEntites();
			var fileName = xhr.responseText.match(ehDownloadRegex.fileName)[1].replaceHTMLEntites();
			var nextNL = ehDownloadRegex.nl.test(xhr.responseText) ? xhr.responseText.match(ehDownloadRegex.nl)[1] : null;
			var imageNumber = '';
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

		updateProgress(nodeList, {
			name: '#' + realIndex + ': ' + fileName,
			status: 'Pending...',
			progress: '',
			progressText: '', 
			class: ''
		});

		fetchOriginalImage(index, nodeList);

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
		<div class="ehD-setting-wrapper">\
			<div data-setting-page="basic" class="ehD-setting-content">\
				<div class="g2"><label>Download <input type="number" data-ehd-setting="thread-count" min="1" placeholder="5" style="width: 46px;"> images at the same time (<=5 is advised)</label></div>\
				<div class="g2"' + ((GM_info.scriptHandler && GM_info.scriptHandler === 'Violentmonkey') ? ' style="opacity: 0.5;" title="Violentmonkey may not support this feature"' : '') + '><label>Abort downloading current image after <input type="number" data-ehd-setting="timeout" min="0" placeholder="300" style="width: 46px;"> second(s) (0 is never abort)</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="speed-detect"> Abort downloading current image if speed is less than <input type="number" data-ehd-setting="speed-min" min="0" placeholder="5" style="width: 46px;"> KB/s in <input type="number" data-ehd-setting="speed-expired" min="1" placeholder="30" style="width: 46px;"> second(s)</label></div>\
				<div class="g2"><label>Skip current image when retried <input type="number" data-ehd-setting="retry-count" min="1" placeholder="3" style="width: 46px;"> time(s)</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="number-images"> Number images (001：01.jpg, 002：01_theme.jpg, 003：02.jpg...) (Separator <input type="text" data-ehd-setting="number-separator" style="width: 46px;" placeholder="：">)</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="number-real-index"> Number images with original page number if pages range is set</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="number-auto-retry"> Retry automatically when images download failed</label></div>\
				<div class="g2"><label>Set folder name as <input type="text" data-ehd-setting="dir-name" placeholder="{gid}_{token}" style="width: 110px;"> (if you don\'t want to create folder, use "<code>/</code>") *</label></div>\
				<div class="g2"><label>Set Zip file name as <input type="text" data-ehd-setting="file-name" placeholder="{title}" style="width: 110px;"> *</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="recheck-file-name"> Show inputs to recheck file name and folder name before downloading</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="ignore-torrent"> Never show notification if torrents are available</label></div>\
				<div class="g2"><label><select data-ehd-setting="status-in-title"><option value="never">Never</option><option value="blur">When current tab is not focused</option><option value="always">Always</option></select> show download progress in title</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="hide-image-limits"> Disable requesting and showing image limits</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="hide-estimated-cost"> Disable pre-calculating image limits cost</label></div>\
				<div class="g2">\
					* Available templates: \
					<span title="You can find GID and token at the address bar like this: exhentai.org/g/[GID]/[Token]/">{gid} Gallery GID</sapn> | \
					<span title="You can find GID and token at the address bar like this: exhentai.org/g/[GID]/[Token]/">{token} Gallery token</sapn> | \
					<span title="This title is the English title or Latin transliteration, you can find it as the first line of the title.">{title} Gallery title</span> | \
					<span title="This title is the original language title, you can find it as the second line of the title.">{subtitle} Gallery sub-title</span> | \
					<span title="This tag means the sort name of the gallery, and its output string is upper.">{tag} Gallery tag</span> | \
					<span title="You can find it at the left of the gallery page.">{uploader} Gallery uploader</span>\
				</div>\
			</div>\
			<div data-setting-page="advanced" class="ehD-setting-content">\
				<div class="g2"><label>Set compression level as <input type="number" data-ehd-setting="compression-level" min="0" max="9" placeholder="0" style="width: 46px;"> (0 ~ 9, 0 is only store, not recommended to enable)</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="file-descriptor"> Stream files and create Zip with file descriptors </label><sup>(1)<sup></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="force-resized"> Force download resized image (never download original image) </label><sup>(2)<sup></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="never-new-url"> Never get new image URL when failed downloading image </label><sup>(2)<sup></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="never-send-nl"> Never send "nl" GET parameter when getting new image URL </label><sup>(2)<sup></div>\
				<div class="g2"' + (requestFileSystem ? '' : ' style="opacity: 0.5;" title="Only Chrome supports this feature"') + '><label><input type="checkbox" data-ehd-setting="store-in-fs"> Request File System to handle large Zip file </label><sup>(3)<sup></div>\
				<div class="g2"' + (requestFileSystem ? '' : ' style="opacity: 0.5;" title="Only Chrome supports this feature"') + '><label>Use File System if archive is larger than <input type="number" data-ehd-setting="fs-size" min="0" placeholder="200" style="width: 46px;"> MB (0 is always) </label><sup>(3)<sup></div>\
				<div class="g2"><label>Record and save gallery info as <select data-ehd-setting="save-info"><option value="file">File info.txt</option><option value="comment">Zip comment</option><option value="none">None</option></select></label></div>\
				<div class="g2">...which includes <label><input type="checkbox" data-ehd-setting="save-info-list[]" value="title">Title & Gallery Link</label> <label><input type="checkbox" data-ehd-setting="save-info-list[]" value="metas">Metadatas</label> <label><input type="checkbox" data-ehd-setting="save-info-list[]" value="tags">Tags</label> <label><input type="checkbox" data-ehd-setting="save-info-list[]" value="uploader-comment">Uploader Comment</label> <label><input type="checkbox" data-ehd-setting="save-info-list[]" value="page-links">Page Links</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="replace-with-full-width"> Replace forbidden letters as full-width letters instead of dash (-)</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="force-pause"> Force drop downloading images data when pausing download</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="image-limits-both"> I\'m in China and/or using proxy to visit e-hentai.org so my image limits on ExHentai is incorrect</label></div>\
				<!--<div class="g2"><label><input type="checkbox" data-ehd-setting="auto-scale"> Auto scale Zip file at <input type="text" min="10" placeholder="250" style="width: 46px;" data-ehd-setting="scale-size"> MB if file is larger than <input type="text" min="10" placeholder="400" style="width: 46px;" data-ehd-setting="scale-reach"> MB (experiment) </label><sup>(4)<sup></div>-->\
				<div class="g2">\
					(1) This may reduce memory usage but some program might not support the Zip file. See <a href="http://stuk.github.io/jszip/documentation/api_jszip/generate_async.html" target="_blank" style="color: #ffffff;">JSZip Docs</a> for more info.\
				</div>\
				<div class="g2">\
					(2) Enable these options may save your image viewing limits <i><a href="https://github.com/ccloli/E-Hentai-Downloader/wiki/E%E2%88%92Hentai-Image-Viewing-Limits" target="_blank" style="color: #ffffff;">(See wiki)</a></i>, but may also cause some download problems.\
				</div>\
				<div class="g2">\
					(3) If enabled you can save larger Zip files (probably ~1GB).\
				</div>\
				<!--<div class="g2">\
					(4) <strong>This function is an experimental feature and may cause bug. </strong>Different browsers have different limit, See wiki for details.\
				</div>-->\
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
			showPreCalcCost();
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

function getImageLimits(host, forced){
	var host = host || location.hostname;
	if (host === 'exhentai.org') {
		host = 'e-hentai.org';
	}
	var url = 'http://' + host + '/home.php';

	var preData = JSON.parse(localStorage.getItem('ehd-image-limits-' + host) || '{"timestamp":0}');
	if (!forced && new Date() - preData.timestamp < 30000) {
		return showImageLimits();
	}

	console.log('[EHD] Request Image Limits From ' + host);

	GM_xmlhttpRequest({
		method: 'GET',
		url: url,
		timeout: 300000,
		onload: function(res) {
			if (!res.responseText) return;
			var data = res.responseText.match(ehDownloadRegex.imageLimits);
			if (data && data.length === 3) {
				preData.cur = data[1];
				preData.total = data[2];
				preData.timestamp = new Date().getTime();
				localStorage.setItem('ehd-image-limits-' + host, JSON.stringify(preData));
				showImageLimits();
			}
		}
	});
}

function showImageLimits(){
	var list = Object.keys(localStorage).filter(function(elem){
		return elem.indexOf('ehd-image-limits-') === 0;
	}).sort().map(function(elem){
		var curData = JSON.parse(localStorage.getItem(elem));
		return curData.cur + '/' + curData.total;
	});

	ehDownloadBox.getElementsByClassName('ehD-box-limit')[0].innerHTML = ' | <a href="http://e-hentai.org/home.php">Image Limits: ' + list.join('; ') + '</a>';
}

function checkImageLimits(forced){
	getImageLimits(location.host, forced);
	if (location.host === 'exhentai.org' && setting['image-limits-both']) {
		getImageLimits('r.e-hentai.org', forced);
	}
}

function getFileSizeAndLength() {
	var context = document.getElementById('gdd').textContent;
	var sizeText = context.split('File Size:')[1].split('Length:')[0].trim();
	var pageText = context.split('Length:')[1].split('page')[0].trim();

	var sizeMB, sizeKB;
	var page = pageText - 0;

	if (sizeText.indexOf('MB') >= 0) {
		sizeMB = parseFloat(sizeText) + 0.01;
		sizeKB = sizeMB * 1024;
	}
	else if (sizeText.indexOf('GB') >= 0) {
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
}

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
		extendNodes.innerHTML = '<div class="g2">' + ehDownloadArrow + ' <a>File Name <input type="text" class="ehD-box-extend-filename"></a></div>'
		                      + '<div class="g2">' + ehDownloadArrow + ' <a>Path Name <input type="text" class="ehD-box-extend-dirname"></a></div>';
		ehDownloadBox.appendChild(extendNodes);

		dirName = getReplacedName(!setting['dir-name'] ? '{gid}_{token}' : setting['dir-name']);
		fileName = getReplacedName(!setting['file-name'] ? '{title}' : setting['file-name']);
		extendNodes.getElementsByClassName('ehD-box-extend-filename')[0].value = fileName;
		extendNodes.getElementsByClassName('ehD-box-extend-dirname')[0].value = dirName;
	}
}

function showPreCalcCost(){
	var size = 0;
	var page = getFileSizeAndLength().page;

	if (!setting['force-resized']) {
		size = getFileSizeAndLength().sizeMB;
	}

	ehDownloadBox.getElementsByClassName('ehD-box-cost')[0].innerHTML = ' | <a href="https://github.com/ccloli/E-Hentai-Downloader/wiki/E%E2%88%92Hentai-Image-Viewing-Limits" target="_blank">Estimated Limits Cost: ' + (parseInt(size * 5) + page) + '</a>';
}

// EHD Box, thanks to JingJang@GitHub, source: https://github.com/JingJang/E-Hentai-Downloader
var ehDownloadBox = document.createElement('fieldset');
ehDownloadBox.className = 'ehD-box';
var ehDownloadBoxTitle = document.createElement('legend');
ehDownloadBoxTitle.innerHTML = 'E-Hentai Downloader <span class="ehD-box-limit"></span> <span class="ehD-box-cost"></span>';
ehDownloadBoxTitle.style.cssText = (origin.indexOf('exhentai.org') >= 0 ? 'color: #ffff66; ' : '') + 'font-weight: 700;';
ehDownloadBox.appendChild(ehDownloadBoxTitle);
var ehDownloadStylesheet = document.createElement('style');
ehDownloadStylesheet.textContent = ehDownloadStyle;
ehDownloadBox.appendChild(ehDownloadStylesheet);

var ehDownloadArrow = '<img src="data:image/gif;base64,R0lGODlhBQAHALMAAK6vr7OztK+urra2tkJCQsDAwEZGRrKyskdHR0FBQUhISP///wAAAAAAAAAAAAAAACH5BAEAAAsALAAAAAAFAAcAAAQUUI1FlREVpbOUSkTgbZ0CUEhBLREAOw==">';

var ehDownloadAction = document.createElement('div');
ehDownloadAction.className = 'g2';
ehDownloadAction.innerHTML = ehDownloadArrow + ' <a>Download Archive</a>';
ehDownloadAction.addEventListener('click', function(event){
	event.preventDefault();

	var torrentsNode = document.querySelector('#gd5 a[onclick*="gallerytorrents.php"]');
	var torrentsCount = torrentsNode ? torrentsNode.textContent.match(/\d+/)[0] - 0 : 0;
	if (isDownloading && !confirm('E-Hentai Downloader is working now, are you sure to stop downloading and start a new download?')) return;
	else if (!setting['ignore-torrent'] && torrentsCount > 0 && !confirm('There are ' + torrentsCount + ' torrent(s) available for this gallery. You can download torrent to get stable and controlable download experience without spending your image limits, or even get bonus content.\n\nContinue downloading with E-Hentai Downloader (Yes) or use torrent directly (No)?\n(You can disable this notification on Settings)')) {
		return torrentsNode.dispatchEvent(new MouseEvent('click'));
	}
	if (unsafeWindow.apiuid === -1 && !confirm('You are not log in to E-Hentai Forums, so you can\'t download original image. Continue?')) return;
	ehDownloadDialog.innerHTML = '';

	initEHDownload();
});
ehDownloadBox.appendChild(ehDownloadAction);

var ehDownloadNumberInput = document.createElement('div');
ehDownloadNumberInput.className = 'g2';
ehDownloadNumberInput.innerHTML = ehDownloadArrow + ' <a><label><input type="checkbox" style="vertical-align: middle; margin: 0;"' + (needNumberImages ? ' checked="checked' : '') + '"> Number Images<label></a>';
ehDownloadBox.appendChild(ehDownloadNumberInput);

var ehDownloadRange = document.createElement('div');
ehDownloadRange.className = 'g2';
ehDownloadRange.innerHTML = ehDownloadArrow + ' <a><label>Pages Range <input type="text" placeholder="eg. -10,12,14-20,27,30-"></label></a>';
ehDownloadBox.appendChild(ehDownloadRange);

var ehDownloadSetting = document.createElement('div');
ehDownloadSetting.className = 'g2';
ehDownloadSetting.innerHTML = ehDownloadArrow + ' <a>Settings</a>';
ehDownloadSetting.addEventListener('click', function(event){
	event.preventDefault();
	showSettings();
});
ehDownloadBox.appendChild(ehDownloadSetting);

var ehDownloadFeedback = document.createElement('div');
ehDownloadFeedback.className = 'g2';
ehDownloadFeedback.innerHTML = ehDownloadArrow + ' <a href="https://github.com/ccloli/E-Hentai-Downloader/issues" target="_blank">Feedback</a>';
ehDownloadBox.appendChild(ehDownloadFeedback);

if (setting['recheck-file-name']) toggleFilenameConfirmInput();
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
ehDownloadPauseBtn.textContent = setting['force-pause'] ? 'Pause (Downloading images will be aborted)' : 'Pause (Downloading images will keep downloading)';
ehDownloadPauseBtn.addEventListener('click', function(event){
	if (!isPausing) {
		isPausing = true;
		ehDownloadPauseBtn.textContent = 'Resume';
		
		if (setting['force-pause']) {
			// waiting Tampermonkey for transfering string to ArrayBuffer, it may stuck for a second 
			setTimeout(function(){
				for (var i = 0; i < fetchThread.length; i++) {
					if (typeof fetchThread[i] !== 'undefined' && 'abort' in fetchThread[i]) fetchThread[i].abort();

					if (imageData[i] === 'Fetching') {
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
	}
	else {
		isPausing = false;
		ehDownloadPauseBtn.textContent = setting['force-pause'] ? 'Pause (Downloading images will be aborted)' : 'Pause (Downloading images will keep downloading)';

		requestDownload();
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
forceDownloadTips.innerHTML = 'If an error occur and script can\'t work, click <a href="javascript: getzip();" style="font-weight: bold; pointer-events: auto;" title="Force download won\'t stop current downloading task.">here</a> to force get your downloaded images.';
forceDownloadTips.getElementsByTagName('a')[0].addEventListener('click', function(event){
	// fixed permission denied on GreaseMonkey
	event.preventDefault();
	saveDownloaded(true);
});

var closeTips = document.createElement('div');
closeTips.className = 'ehD-close-tips';
closeTips.innerHTML = 'E-Hentai Downloader is still running, please don\'t close this tab before it finished downloading.<br><br>If any bug occured and the script can\'t work correctly, you can move your mouse pointer onto the progress box, and force to save downloaded images before you leave.';

unsafeWindow.getzip = window.getzip = function(){
	saveDownloaded(true);
};

if (!setting['hide-image-limits']) {
	checkImageLimits(true);
	setInterval(checkImageLimits, 60000);
}

if (!setting['hide-estimated-cost']) {
	try {
		showPreCalcCost();
	}
	catch (e) {}
}

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

		return 'E-Hentai Downloader is still running, please don\'t close this tab before it finished downloading.';
	}
	clearRubbish();
};

// Forced request File System to check if have temp archive
if (setting['store-in-fs'] && requestFileSystem) {
	requestFileSystem(window.TEMPORARY, 1024 * 1024 * 1024, ehDownloadFS.initCheckerHandler, ehDownloadFS.errorHandler);
}