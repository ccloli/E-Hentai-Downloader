
// This script using JSZip & FileSaver.js

'use strict';

console.log('[EHD] E-Hentai Downloader is running.');
console.log('[EHD] Bugs Report >', 'https://github.com/ccloli/E-Hentai-Downloader/issues | https://greasyfork.org/scripts/10379-e-hentai-downloader/feedback');
console.log('[EHD] To report a bug, showing all the "[EHD]" logs is wonderful. =w=');

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

// Tampermonkey for Safari has a bug with Promise (Tampermonkey/tampermonkey#375), so JSZip won't work when packaging.
// As Tampermonkey not solve the bug right now, a fast fix is use unsafeWindow.Promise
if (!Promise || !Promise.resolve) {
	var Promise = unsafeWindow.Promise;
}

// GreasyFork doesn't allow obfuscated or minified script, so if you want to see the main function, please see src/main.js at GitHub
