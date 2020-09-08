
// This script using JSZip & FileSaver.js

'use strict';

console.log('[EHD] E-Hentai Downloader is running.');
console.log('[EHD] Bugs Report >', 'https://github.com/ccloli/E-Hentai-Downloader/issues | https://greasyfork.org/scripts/10379-e-hentai-downloader/feedback');
console.log('[EHD] To report a bug, it\'s recommended to provide the logs started with "[EHD]", thanks. =w=');

// GreaseMonkey 4.x compatible
var loadSetting;
if (typeof GM !== 'undefined' && ((GM.info || {}).scriptHandler || '').toLowerCase().indexOf('greasemonkey') >= 0) {
	loadSetting = GM.getValue.bind(this, 'ehD-setting');
	self.GM_setValue = GM.setValue;
	self.GM_xmlhttpRequest = GM.xmlHttpRequest;
	self.GM_info = GM.info;
}
else {
	loadSetting = function (key, init) {
		return new Promise(function (resolve, reject) {
			try {
				resolve(GM_getValue('ehD-setting'));
			}
			catch (e) {
				reject(e);
			}
		});
	};
}

// Opera 12- (Presto) doesn't support generating blob url, and if generate as data url, it may cause crashes.
if (navigator.userAgent.indexOf('Presto') >= 0) {
	alert('Your Opera doesn\'t support E-Hentai Downloader. You need to upgrade it to Opera 15+.');
	console.error('[EHD] Opera 12- (Presto) doesn\'t support E-Hentai Downloader. UserAgent > ' + navigator.userAgent);
}

// Remove IE support
else if (navigator.userAgent.indexOf('Trident') >= 0) {
	alert('Your browser doesn\'t support E-Hentai Downloader. You need to switch to other browsers.');
	console.error('[EHD] IE doesn\'t support E-Hentai Downloader. UserAgent > ' + navigator.userAgent);
}

// GreaseMonkey 3.2 beta 1 and older version can't load content of GM_xhr.response, and this can't be fix.
else if (
	(!GM_info.scriptHandler || GM_info.scriptHandler.indexOf('GreaseMonkey') >= 0) && GM_info.version != null && (
		GM_info.version.split('.')[0] - 0 < 3 || (
			GM_info.version.split('.')[0] - 0 == 3 && (
				GM_info.version.split('.')[1].split('beta')[0] - 0 <= 2 &&
				GM_info.version.indexOf('beta') >= 0 && 
				GM_info.version.split('beta')[1] - 0 < 2
			)
		)
	)
) {
	alert('Your GreaseMonkey doesn\'t support E-Hentai Downloader. The first supported version is GreaseMonkey 3.2 beta 2. Please update your GreaseMonkey to enjoy. =w=');
	console.error('[EHD] GreaseMonkey doesn\'t support E-Hentai Downloader. GreaseMonkey Version > ' + GM_info.version);
}

// GreasyFork doesn't allow obfuscated or minified script, so if you want to see the main function, please see src/main.js at GitHub
