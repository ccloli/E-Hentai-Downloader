// ==UserScript==
// @name         E-Hentai Downloader
// @version      1.19.3
// @description  Download E-Hentai archive as zip file
// @author       864907600cc
// @icon         https://secure.gravatar.com/avatar/147834caf9ccb0a66b2505c753747867
// @match        http://exhentai.org/g/*
// @match        http://g.e-hentai.org/g/*
// @match        http://r.e-hentai.org/g/*
// @include      http://exhentai.org/g/*
// @include      http://g.e-hentai.org/g/*
// @include      http://r.e-hentai.org/g/*
// @namespace    http://ext.ccloli.com
// @updateURL    https://github.com/ccloli/E-Hentai-Downloader/raw/master/e-hentai-downloader.meta.js
// @downloadURL  https://github.com/ccloli/E-Hentai-Downloader/raw/master/e-hentai-downloader.user.js
// @supportURL   https://github.com/ccloli/E-Hentai-Downloader/issues
// @connect      *
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// ==/UserScript==

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

// GreasyFork doesn't allow obfuscated or minified script, so if you want to see the main function, please see src/main.js at GitHub

// ==========---------- JSZip Begin ----------========== //

/*!
JSZip - A Javascript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2014 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/master/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/master/LICENSE
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.JSZip=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';
// private property
var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";


// public method for encoding
exports.encode = function(input, utf8) {
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;

	while (i < input.length) {

		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		}
		else if (isNaN(chr3)) {
			enc4 = 64;
		}

		output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);

	}

	return output;
};

// public method for decoding
exports.decode = function(input, utf8) {
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;

	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

	while (i < input.length) {

		enc1 = _keyStr.indexOf(input.charAt(i++));
		enc2 = _keyStr.indexOf(input.charAt(i++));
		enc3 = _keyStr.indexOf(input.charAt(i++));
		enc4 = _keyStr.indexOf(input.charAt(i++));

		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;

		output = output + String.fromCharCode(chr1);

		if (enc3 != 64) {
			output = output + String.fromCharCode(chr2);
		}
		if (enc4 != 64) {
			output = output + String.fromCharCode(chr3);
		}

	}

	return output;

};

},{}],2:[function(_dereq_,module,exports){
'use strict';
function CompressedObject() {
	this.compressedSize = 0;
	this.uncompressedSize = 0;
	this.crc32 = 0;
	this.compressionMethod = null;
	this.compressedContent = null;
}

CompressedObject.prototype = {
	/**
	 * Return the decompressed content in an unspecified format.
	 * The format will depend on the decompressor.
	 * @return {Object} the decompressed content.
	 */
	getContent: function() {
		return null; // see implementation
	},
	/**
	 * Return the compressed content in an unspecified format.
	 * The format will depend on the compressed conten source.
	 * @return {Object} the compressed content.
	 */
	getCompressedContent: function() {
		return null; // see implementation
	}
};
module.exports = CompressedObject;

},{}],3:[function(_dereq_,module,exports){
'use strict';
exports.STORE = {
	magic: "\x00\x00",
	compress: function(content, compressionOptions) {
		return content; // no compression
	},
	uncompress: function(content) {
		return content; // no compression
	},
	compressInputType: null,
	uncompressInputType: null
};
exports.DEFLATE = _dereq_('./flate');

},{"./flate":8}],4:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('./utils');

var table = [
	0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA,
	0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
	0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988,
	0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91,
	0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE,
	0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
	0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC,
	0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5,
	0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172,
	0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
	0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940,
	0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59,
	0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116,
	0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
	0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924,
	0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
	0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A,
	0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
	0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818,
	0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
	0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E,
	0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457,
	0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C,
	0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65,
	0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2,
	0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB,
	0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0,
	0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9,
	0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086,
	0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
	0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4,
	0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD,
	0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A,
	0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683,
	0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8,
	0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1,
	0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE,
	0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7,
	0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC,
	0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
	0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252,
	0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B,
	0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60,
	0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79,
	0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236,
	0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F,
	0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04,
	0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D,
	0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A,
	0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
	0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38,
	0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21,
	0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E,
	0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777,
	0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C,
	0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45,
	0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2,
	0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB,
	0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0,
	0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
	0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6,
	0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF,
	0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94,
	0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D
];

/**
 *
 *  Javascript crc32
 *  http://www.webtoolkit.info/
 *
 */
module.exports = function crc32(input, crc) {
	if (typeof input === "undefined" || !input.length) {
		return 0;
	}

	var isArray = utils.getTypeOf(input) !== "string";

	if (typeof(crc) == "undefined") {
		crc = 0;
	}
	var x = 0;
	var y = 0;
	var b = 0;

	crc = crc ^ (-1);
	for (var i = 0, iTop = input.length; i < iTop; i++) {
		b = isArray ? input[i] : input.charCodeAt(i);
		y = (crc ^ b) & 0xFF;
		x = table[y];
		crc = (crc >>> 8) ^ x;
	}

	return crc ^ (-1);
};
// vim: set shiftwidth=4 softtabstop=4:

},{"./utils":21}],5:[function(_dereq_,module,exports){
'use strict';
var utils = _dereq_('./utils');

function DataReader(data) {
	this.data = null; // type : see implementation
	this.length = 0;
	this.index = 0;
}
DataReader.prototype = {
	/**
	 * Check that the offset will not go too far.
	 * @param {string} offset the additional offset to check.
	 * @throws {Error} an Error if the offset is out of bounds.
	 */
	checkOffset: function(offset) {
		this.checkIndex(this.index + offset);
	},
	/**
	 * Check that the specifed index will not be too far.
	 * @param {string} newIndex the index to check.
	 * @throws {Error} an Error if the index is out of bounds.
	 */
	checkIndex: function(newIndex) {
		if (this.length < newIndex || newIndex < 0) {
			throw new Error("End of data reached (data length = " + this.length + ", asked index = " + (newIndex) + "). Corrupted zip ?");
		}
	},
	/**
	 * Change the index.
	 * @param {number} newIndex The new index.
	 * @throws {Error} if the new index is out of the data.
	 */
	setIndex: function(newIndex) {
		this.checkIndex(newIndex);
		this.index = newIndex;
	},
	/**
	 * Skip the next n bytes.
	 * @param {number} n the number of bytes to skip.
	 * @throws {Error} if the new index is out of the data.
	 */
	skip: function(n) {
		this.setIndex(this.index + n);
	},
	/**
	 * Get the byte at the specified index.
	 * @param {number} i the index to use.
	 * @return {number} a byte.
	 */
	byteAt: function(i) {
		// see implementations
	},
	/**
	 * Get the next number with a given byte size.
	 * @param {number} size the number of bytes to read.
	 * @return {number} the corresponding number.
	 */
	readInt: function(size) {
		var result = 0,
			i;
		this.checkOffset(size);
		for (i = this.index + size - 1; i >= this.index; i--) {
			result = (result << 8) + this.byteAt(i);
		}
		this.index += size;
		return result;
	},
	/**
	 * Get the next string with a given byte size.
	 * @param {number} size the number of bytes to read.
	 * @return {string} the corresponding string.
	 */
	readString: function(size) {
		return utils.transformTo("string", this.readData(size));
	},
	/**
	 * Get raw data without conversion, <size> bytes.
	 * @param {number} size the number of bytes to read.
	 * @return {Object} the raw data, implementation specific.
	 */
	readData: function(size) {
		// see implementations
	},
	/**
	 * Find the last occurence of a zip signature (4 bytes).
	 * @param {string} sig the signature to find.
	 * @return {number} the index of the last occurence, -1 if not found.
	 */
	lastIndexOfSignature: function(sig) {
		// see implementations
	},
	/**
	 * Get the next date.
	 * @return {Date} the date.
	 */
	readDate: function() {
		var dostime = this.readInt(4);
		return new Date(
		((dostime >> 25) & 0x7f) + 1980, // year
		((dostime >> 21) & 0x0f) - 1, // month
		(dostime >> 16) & 0x1f, // day
		(dostime >> 11) & 0x1f, // hour
		(dostime >> 5) & 0x3f, // minute
		(dostime & 0x1f) << 1); // second
	}
};
module.exports = DataReader;

},{"./utils":21}],6:[function(_dereq_,module,exports){
'use strict';
exports.base64 = false;
exports.binary = false;
exports.dir = false;
exports.createFolders = false;
exports.date = null;
exports.compression = null;
exports.compressionOptions = null;
exports.comment = null;
exports.unixPermissions = null;
exports.dosPermissions = null;

},{}],7:[function(_dereq_,module,exports){
'use strict';
var utils = _dereq_('./utils');

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.string2binary = function(str) {
	return utils.string2binary(str);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.string2Uint8Array = function(str) {
	return utils.transformTo("uint8array", str);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.uint8Array2String = function(array) {
	return utils.transformTo("string", array);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.string2Blob = function(str) {
	var buffer = utils.transformTo("arraybuffer", str);
	return utils.arrayBuffer2Blob(buffer);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.arrayBuffer2Blob = function(buffer) {
	return utils.arrayBuffer2Blob(buffer);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.transformTo = function(outputType, input) {
	return utils.transformTo(outputType, input);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.getTypeOf = function(input) {
	return utils.getTypeOf(input);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.checkSupport = function(type) {
	return utils.checkSupport(type);
};

/**
 * @deprecated
 * This value will be removed in a future version without replacement.
 */
exports.MAX_VALUE_16BITS = utils.MAX_VALUE_16BITS;

/**
 * @deprecated
 * This value will be removed in a future version without replacement.
 */
exports.MAX_VALUE_32BITS = utils.MAX_VALUE_32BITS;


/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.pretty = function(str) {
	return utils.pretty(str);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.findCompression = function(compressionMethod) {
	return utils.findCompression(compressionMethod);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.isRegExp = function (object) {
	return utils.isRegExp(object);
};


},{"./utils":21}],8:[function(_dereq_,module,exports){
'use strict';
var USE_TYPEDARRAY = (typeof Uint8Array !== 'undefined') && (typeof Uint16Array !== 'undefined') && (typeof Uint32Array !== 'undefined');

var pako = _dereq_("pako");
exports.uncompressInputType = USE_TYPEDARRAY ? "uint8array" : "array";
exports.compressInputType = USE_TYPEDARRAY ? "uint8array" : "array";

exports.magic = "\x08\x00";
exports.compress = function(input, compressionOptions) {
	return pako.deflateRaw(input, {
		level : compressionOptions.level || -1 // default compression
	});
};
exports.uncompress =  function(input) {
	return pako.inflateRaw(input);
};

},{"pako":24}],9:[function(_dereq_,module,exports){
'use strict';

var base64 = _dereq_('./base64');

/**
Usage:
   zip = new JSZip();
   zip.file("hello.txt", "Hello, World!").file("tempfile", "nothing");
   zip.folder("images").file("smile.gif", base64Data, {base64: true});
   zip.file("Xmas.txt", "Ho ho ho !", {date : new Date("December 25, 2007 00:00:01")});
   zip.remove("tempfile");

   base64zip = zip.generate();

**/

/**
 * Representation a of zip file in js
 * @constructor
 * @param {String=|ArrayBuffer=|Uint8Array=} data the data to load, if any (optional).
 * @param {Object=} options the options for creating this objects (optional).
 */
function JSZip(data, options) {
	// if this constructor is used without `new`, it adds `new` before itself:
	if(!(this instanceof JSZip)) return new JSZip(data, options);

	// object containing the files :
	// {
	//   "folder/" : {...},
	//   "folder/data.txt" : {...}
	// }
	this.files = {};

	this.comment = null;

	// Where we are in the hierarchy
	this.root = "";
	if (data) {
		this.load(data, options);
	}
	this.clone = function() {
		var newObj = new JSZip();
		for (var i in this) {
			if (typeof this[i] !== "function") {
				newObj[i] = this[i];
			}
		}
		return newObj;
	};
}
JSZip.prototype = _dereq_('./object');
JSZip.prototype.load = _dereq_('./load');
JSZip.support = _dereq_('./support');
JSZip.defaults = _dereq_('./defaults');

/**
 * @deprecated
 * This namespace will be removed in a future version without replacement.
 */
JSZip.utils = _dereq_('./deprecatedPublicUtils');

JSZip.base64 = {
	/**
	 * @deprecated
	 * This method will be removed in a future version without replacement.
	 */
	encode : function(input) {
		return base64.encode(input);
	},
	/**
	 * @deprecated
	 * This method will be removed in a future version without replacement.
	 */
	decode : function(input) {
		return base64.decode(input);
	}
};
JSZip.compressions = _dereq_('./compressions');
module.exports = JSZip;

},{"./base64":1,"./compressions":3,"./defaults":6,"./deprecatedPublicUtils":7,"./load":10,"./object":13,"./support":17}],10:[function(_dereq_,module,exports){
'use strict';
var base64 = _dereq_('./base64');
var ZipEntries = _dereq_('./zipEntries');
module.exports = function(data, options) {
	var files, zipEntries, i, input;
	options = options || {};
	if (options.base64) {
		data = base64.decode(data);
	}

	zipEntries = new ZipEntries(data, options);
	files = zipEntries.files;
	for (i = 0; i < files.length; i++) {
		input = files[i];
		this.file(input.fileName, input.decompressed, {
			binary: true,
			optimizedBinaryString: true,
			date: input.date,
			dir: input.dir,
			comment : input.fileComment.length ? input.fileComment : null,
			unixPermissions : input.unixPermissions,
			dosPermissions : input.dosPermissions,
			createFolders: options.createFolders
		});
	}
	if (zipEntries.zipComment.length) {
		this.comment = zipEntries.zipComment;
	}

	return this;
};

},{"./base64":1,"./zipEntries":22}],11:[function(_dereq_,module,exports){
(function (Buffer){
'use strict';
module.exports = function(data, encoding){
	return new Buffer(data, encoding);
};
module.exports.test = function(b){
	return Buffer.isBuffer(b);
};

}).call(this,(typeof Buffer !== "undefined" ? Buffer : undefined))
},{}],12:[function(_dereq_,module,exports){
'use strict';
var Uint8ArrayReader = _dereq_('./uint8ArrayReader');

function NodeBufferReader(data) {
	this.data = data;
	this.length = this.data.length;
	this.index = 0;
}
NodeBufferReader.prototype = new Uint8ArrayReader();

/**
 * @see DataReader.readData
 */
NodeBufferReader.prototype.readData = function(size) {
	this.checkOffset(size);
	var result = this.data.slice(this.index, this.index + size);
	this.index += size;
	return result;
};
module.exports = NodeBufferReader;

},{"./uint8ArrayReader":18}],13:[function(_dereq_,module,exports){
'use strict';
var support = _dereq_('./support');
var utils = _dereq_('./utils');
var crc32 = _dereq_('./crc32');
var signature = _dereq_('./signature');
var defaults = _dereq_('./defaults');
var base64 = _dereq_('./base64');
var compressions = _dereq_('./compressions');
var CompressedObject = _dereq_('./compressedObject');
var nodeBuffer = _dereq_('./nodeBuffer');
var utf8 = _dereq_('./utf8');
var StringWriter = _dereq_('./stringWriter');
var Uint8ArrayWriter = _dereq_('./uint8ArrayWriter');

/**
 * Returns the raw data of a ZipObject, decompress the content if necessary.
 * @param {ZipObject} file the file to use.
 * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
 */
var getRawData = function(file) {
	if (file._data instanceof CompressedObject) {
		file._data = file._data.getContent();
		file.options.binary = true;
		file.options.base64 = false;

		if (utils.getTypeOf(file._data) === "uint8array") {
			var copy = file._data;
			// when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
			// if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
			file._data = new Uint8Array(copy.length);
			// with an empty Uint8Array, Opera fails with a "Offset larger than array size"
			if (copy.length !== 0) {
				file._data.set(copy, 0);
			}
		}
	}
	return file._data;
};

/**
 * Returns the data of a ZipObject in a binary form. If the content is an unicode string, encode it.
 * @param {ZipObject} file the file to use.
 * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
 */
var getBinaryData = function(file) {
	var result = getRawData(file),
		type = utils.getTypeOf(result);
	if (type === "string") {
		if (!file.options.binary) {
			// unicode text !
			// unicode string => binary string is a painful process, check if we can avoid it.
			if (support.nodebuffer) {
				return nodeBuffer(result, "utf-8");
			}
		}
		return file.asBinary();
	}
	return result;
};

/**
 * Transform this._data into a string.
 * @param {function} filter a function String -> String, applied if not null on the result.
 * @return {String} the string representing this._data.
 */
var dataToString = function(asUTF8) {
	var result = getRawData(this);
	if (result === null || typeof result === "undefined") {
		return "";
	}
	// if the data is a base64 string, we decode it before checking the encoding !
	if (this.options.base64) {
		result = base64.decode(result);
	}
	if (asUTF8 && this.options.binary) {
		// JSZip.prototype.utf8decode supports arrays as input
		// skip to array => string step, utf8decode will do it.
		result = out.utf8decode(result);
	}
	else {
		// no utf8 transformation, do the array => string step.
		result = utils.transformTo("string", result);
	}

	if (!asUTF8 && !this.options.binary) {
		result = utils.transformTo("string", out.utf8encode(result));
	}
	return result;
};
/**
 * A simple object representing a file in the zip file.
 * @constructor
 * @param {string} name the name of the file
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
 * @param {Object} options the options of the file
 */
var ZipObject = function(name, data, options) {
	this.name = name;
	this.dir = options.dir;
	this.date = options.date;
	this.comment = options.comment;
	this.unixPermissions = options.unixPermissions;
	this.dosPermissions = options.dosPermissions;

	this._data = data;
	this.options = options;

	/*
	 * This object contains initial values for dir and date.
	 * With them, we can check if the user changed the deprecated metadata in
	 * `ZipObject#options` or not.
	 */
	this._initialMetadata = {
	  dir : options.dir,
	  date : options.date
	};
};

ZipObject.prototype = {
	/**
	 * Return the content as UTF8 string.
	 * @return {string} the UTF8 string.
	 */
	asText: function() {
		return dataToString.call(this, true);
	},
	/**
	 * Returns the binary content.
	 * @return {string} the content as binary.
	 */
	asBinary: function() {
		return dataToString.call(this, false);
	},
	/**
	 * Returns the content as a nodejs Buffer.
	 * @return {Buffer} the content as a Buffer.
	 */
	asNodeBuffer: function() {
		var result = getBinaryData(this);
		return utils.transformTo("nodebuffer", result);
	},
	/**
	 * Returns the content as an Uint8Array.
	 * @return {Uint8Array} the content as an Uint8Array.
	 */
	asUint8Array: function() {
		var result = getBinaryData(this);
		return utils.transformTo("uint8array", result);
	},
	/**
	 * Returns the content as an ArrayBuffer.
	 * @return {ArrayBuffer} the content as an ArrayBufer.
	 */
	asArrayBuffer: function() {
		return this.asUint8Array().buffer;
	}
};

/**
 * Transform an integer into a string in hexadecimal.
 * @private
 * @param {number} dec the number to convert.
 * @param {number} bytes the number of bytes to generate.
 * @returns {string} the result.
 */
var decToHex = function(dec, bytes) {
	var hex = "",
		i;
	for (i = 0; i < bytes; i++) {
		hex += String.fromCharCode(dec & 0xff);
		dec = dec >>> 8;
	}
	return hex;
};

/**
 * Merge the objects passed as parameters into a new one.
 * @private
 * @param {...Object} var_args All objects to merge.
 * @return {Object} a new object with the data of the others.
 */
var extend = function() {
	var result = {}, i, attr;
	for (i = 0; i < arguments.length; i++) { // arguments is not enumerable in some browsers
		for (attr in arguments[i]) {
			if (arguments[i].hasOwnProperty(attr) && typeof result[attr] === "undefined") {
				result[attr] = arguments[i][attr];
			}
		}
	}
	return result;
};

/**
 * Transforms the (incomplete) options from the user into the complete
 * set of options to create a file.
 * @private
 * @param {Object} o the options from the user.
 * @return {Object} the complete set of options.
 */
var prepareFileAttrs = function(o) {
	o = o || {};
	if (o.base64 === true && (o.binary === null || o.binary === undefined)) {
		o.binary = true;
	}
	o = extend(o, defaults);
	o.date = o.date || new Date();
	if (o.compression !== null) o.compression = o.compression.toUpperCase();

	return o;
};

/**
 * Add a file in the current folder.
 * @private
 * @param {string} name the name of the file
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data of the file
 * @param {Object} o the options of the file
 * @return {Object} the new file.
 */
var fileAdd = function(name, data, o) {
	// be sure sub folders exist
	var dataType = utils.getTypeOf(data),
		parent;

	o = prepareFileAttrs(o);

	if (typeof o.unixPermissions === "string") {
		o.unixPermissions = parseInt(o.unixPermissions, 8);
	}

	// UNX_IFDIR  0040000 see zipinfo.c
	if (o.unixPermissions && (o.unixPermissions & 0x4000)) {
		o.dir = true;
	}
	// Bit 4    Directory
	if (o.dosPermissions && (o.dosPermissions & 0x0010)) {
		o.dir = true;
	}

	if (o.dir) {
		name = forceTrailingSlash(name);
	}

	if (o.createFolders && (parent = parentFolder(name))) {
		folderAdd.call(this, parent, true);
	}

	if (o.dir || data === null || typeof data === "undefined") {
		o.base64 = false;
		o.binary = false;
		data = null;
		dataType = null;
	}
	else if (dataType === "string") {
		if (o.binary && !o.base64) {
			// optimizedBinaryString == true means that the file has already been filtered with a 0xFF mask
			if (o.optimizedBinaryString !== true) {
				// this is a string, not in a base64 format.
				// Be sure that this is a correct "binary string"
				data = utils.string2binary(data);
			}
		}
	}
	else { // arraybuffer, uint8array, ...
		o.base64 = false;
		o.binary = true;

		if (!dataType && !(data instanceof CompressedObject)) {
			throw new Error("The data of '" + name + "' is in an unsupported format !");
		}

		// special case : it's way easier to work with Uint8Array than with ArrayBuffer
		if (dataType === "arraybuffer") {
			data = utils.transformTo("uint8array", data);
		}
	}

	var object = new ZipObject(name, data, o);
	this.files[name] = object;
	return object;
};

/**
 * Find the parent folder of the path.
 * @private
 * @param {string} path the path to use
 * @return {string} the parent folder, or ""
 */
var parentFolder = function (path) {
	if (path.slice(-1) == '/') {
		path = path.substring(0, path.length - 1);
	}
	var lastSlash = path.lastIndexOf('/');
	return (lastSlash > 0) ? path.substring(0, lastSlash) : "";
};


/**
 * Returns the path with a slash at the end.
 * @private
 * @param {String} path the path to check.
 * @return {String} the path with a trailing slash.
 */
var forceTrailingSlash = function(path) {
	// Check the name ends with a /
	if (path.slice(-1) != "/") {
		path += "/"; // IE doesn't like substr(-1)
	}
	return path;
};
/**
 * Add a (sub) folder in the current folder.
 * @private
 * @param {string} name the folder's name
 * @param {boolean=} [createFolders] If true, automatically create sub
 *  folders. Defaults to false.
 * @return {Object} the new folder.
 */
var folderAdd = function(name, createFolders) {
	createFolders = (typeof createFolders !== 'undefined') ? createFolders : false;

	name = forceTrailingSlash(name);

	// Does this folder already exist?
	if (!this.files[name]) {
		fileAdd.call(this, name, null, {
			dir: true,
			createFolders: createFolders
		});
	}
	return this.files[name];
};

/**
 * Generate a JSZip.CompressedObject for a given zipOject.
 * @param {ZipObject} file the object to read.
 * @param {JSZip.compression} compression the compression to use.
 * @param {Object} compressionOptions the options to use when compressing.
 * @return {JSZip.CompressedObject} the compressed result.
 */
var generateCompressedObjectFrom = function(file, compression, compressionOptions) {
	var result = new CompressedObject(),
		content;

	// the data has not been decompressed, we might reuse things !
	if (file._data instanceof CompressedObject) {
		result.uncompressedSize = file._data.uncompressedSize;
		result.crc32 = file._data.crc32;

		if (result.uncompressedSize === 0 || file.dir) {
			compression = compressions['STORE'];
			result.compressedContent = "";
			result.crc32 = 0;
		}
		else if (file._data.compressionMethod === compression.magic) {
			result.compressedContent = file._data.getCompressedContent();
		}
		else {
			content = file._data.getContent();
			// need to decompress / recompress
			result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content), compressionOptions);
		}
	}
	else {
		// have uncompressed data
		content = getBinaryData(file);
		if (!content || content.length === 0 || file.dir) {
			compression = compressions['STORE'];
			content = "";
		}
		result.uncompressedSize = content.length;
		result.crc32 = crc32(content);
		result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content), compressionOptions);
	}

	result.compressedSize = result.compressedContent.length;
	result.compressionMethod = compression.magic;

	return result;
};




/**
 * Generate the UNIX part of the external file attributes.
 * @param {Object} unixPermissions the unix permissions or null.
 * @param {Boolean} isDir true if the entry is a directory, false otherwise.
 * @return {Number} a 32 bit integer.
 *
 * adapted from http://unix.stackexchange.com/questions/14705/the-zip-formats-external-file-attribute :
 *
 * TTTTsstrwxrwxrwx0000000000ADVSHR
 * ^^^^____________________________ file type, see zipinfo.c (UNX_*)
 *     ^^^_________________________ setuid, setgid, sticky
 *        ^^^^^^^^^________________ permissions
 *                 ^^^^^^^^^^______ not used ?
 *                           ^^^^^^ DOS attribute bits : Archive, Directory, Volume label, System file, Hidden, Read only
 */
var generateUnixExternalFileAttr = function (unixPermissions, isDir) {

	var result = unixPermissions;
	if (!unixPermissions) {
		// I can't use octal values in strict mode, hence the hexa.
		//  040775 => 0x41fd
		// 0100664 => 0x81b4
		result = isDir ? 0x41fd : 0x81b4;
	}

	return (result & 0xFFFF) << 16;
};

/**
 * Generate the DOS part of the external file attributes.
 * @param {Object} dosPermissions the dos permissions or null.
 * @param {Boolean} isDir true if the entry is a directory, false otherwise.
 * @return {Number} a 32 bit integer.
 *
 * Bit 0     Read-Only
 * Bit 1     Hidden
 * Bit 2     System
 * Bit 3     Volume Label
 * Bit 4     Directory
 * Bit 5     Archive
 */
var generateDosExternalFileAttr = function (dosPermissions, isDir) {

	// the dir flag is already set for compatibility

	return (dosPermissions || 0)  & 0x3F;
};

/**
 * Generate the various parts used in the construction of the final zip file.
 * @param {string} name the file name.
 * @param {ZipObject} file the file content.
 * @param {JSZip.CompressedObject} compressedObject the compressed object.
 * @param {number} offset the current offset from the start of the zip file.
 * @param {String} platform let's pretend we are this platform (change platform dependents fields)
 * @return {object} the zip parts.
 */
var generateZipParts = function(name, file, compressedObject, offset, platform) {
	var data = compressedObject.compressedContent,
		utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)),
		comment = file.comment || "",
		utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)),
		useUTF8ForFileName = utfEncodedFileName.length !== file.name.length,
		useUTF8ForComment = utfEncodedComment.length !== comment.length,
		o = file.options,
		dosTime,
		dosDate,
		extraFields = "",
		unicodePathExtraField = "",
		unicodeCommentExtraField = "",
		dir, date;


	// handle the deprecated options.dir
	if (file._initialMetadata.dir !== file.dir) {
		dir = file.dir;
	} else {
		dir = o.dir;
	}

	// handle the deprecated options.date
	if(file._initialMetadata.date !== file.date) {
		date = file.date;
	} else {
		date = o.date;
	}

	var extFileAttr = 0;
	var versionMadeBy = 0;
	if (dir) {
		// dos or unix, we set the dos dir flag
		extFileAttr |= 0x00010;
	}
	if(platform === "UNIX") {
		versionMadeBy = 0x031E; // UNIX, version 3.0
		extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
	} else { // DOS or other, fallback to DOS
		versionMadeBy = 0x0014; // DOS, version 2.0
		extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
	}

	// date
	// @see http://www.delorie.com/djgpp/doc/rbinter/it/52/13.html
	// @see http://www.delorie.com/djgpp/doc/rbinter/it/65/16.html
	// @see http://www.delorie.com/djgpp/doc/rbinter/it/66/16.html

	dosTime = date.getHours();
	dosTime = dosTime << 6;
	dosTime = dosTime | date.getMinutes();
	dosTime = dosTime << 5;
	dosTime = dosTime | date.getSeconds() / 2;

	dosDate = date.getFullYear() - 1980;
	dosDate = dosDate << 4;
	dosDate = dosDate | (date.getMonth() + 1);
	dosDate = dosDate << 5;
	dosDate = dosDate | date.getDate();

	if (useUTF8ForFileName) {
		// set the unicode path extra field. unzip needs at least one extra
		// field to correctly handle unicode path, so using the path is as good
		// as any other information. This could improve the situation with
		// other archive managers too.
		// This field is usually used without the utf8 flag, with a non
		// unicode path in the header (winrar, winzip). This helps (a bit)
		// with the messy Windows' default compressed folders feature but
		// breaks on p7zip which doesn't seek the unicode path extra field.
		// So for now, UTF-8 everywhere !
		unicodePathExtraField =
			// Version
			decToHex(1, 1) +
			// NameCRC32
			decToHex(crc32(utfEncodedFileName), 4) +
			// UnicodeName
			utfEncodedFileName;

		extraFields +=
			// Info-ZIP Unicode Path Extra Field
			"\x75\x70" +
			// size
			decToHex(unicodePathExtraField.length, 2) +
			// content
			unicodePathExtraField;
	}

	if(useUTF8ForComment) {

		unicodeCommentExtraField =
			// Version
			decToHex(1, 1) +
			// CommentCRC32
			decToHex(this.crc32(utfEncodedComment), 4) +
			// UnicodeName
			utfEncodedComment;

		extraFields +=
			// Info-ZIP Unicode Path Extra Field
			"\x75\x63" +
			// size
			decToHex(unicodeCommentExtraField.length, 2) +
			// content
			unicodeCommentExtraField;
	}

	var header = "";

	// version needed to extract
	header += "\x0A\x00";
	// general purpose bit flag
	// set bit 11 if utf8
	header += (useUTF8ForFileName || useUTF8ForComment) ? "\x00\x08" : "\x00\x00";
	// compression method
	header += compressedObject.compressionMethod;
	// last mod file time
	header += decToHex(dosTime, 2);
	// last mod file date
	header += decToHex(dosDate, 2);
	// crc-32
	header += decToHex(compressedObject.crc32, 4);
	// compressed size
	header += decToHex(compressedObject.compressedSize, 4);
	// uncompressed size
	header += decToHex(compressedObject.uncompressedSize, 4);
	// file name length
	header += decToHex(utfEncodedFileName.length, 2);
	// extra field length
	header += decToHex(extraFields.length, 2);


	var fileRecord = signature.LOCAL_FILE_HEADER + header + utfEncodedFileName + extraFields;

	var dirRecord = signature.CENTRAL_FILE_HEADER +
	// version made by (00: DOS)
	decToHex(versionMadeBy, 2) +
	// file header (common to file and central directory)
	header +
	// file comment length
	decToHex(utfEncodedComment.length, 2) +
	// disk number start
	"\x00\x00" +
	// internal file attributes TODO
	"\x00\x00" +
	// external file attributes
	decToHex(extFileAttr, 4) +
	// relative offset of local header
	decToHex(offset, 4) +
	// file name
	utfEncodedFileName +
	// extra field
	extraFields +
	// file comment
	utfEncodedComment;

	return {
		fileRecord: fileRecord,
		dirRecord: dirRecord,
		compressedObject: compressedObject
	};
};


// return the actual prototype of JSZip
var out = {
	/**
	 * Read an existing zip and merge the data in the current JSZip object.
	 * The implementation is in jszip-load.js, don't forget to include it.
	 * @param {String|ArrayBuffer|Uint8Array|Buffer} stream  The stream to load
	 * @param {Object} options Options for loading the stream.
	 *  options.base64 : is the stream in base64 ? default : false
	 * @return {JSZip} the current JSZip object
	 */
	load: function(stream, options) {
		throw new Error("Load method is not defined. Is the file jszip-load.js included ?");
	},

	/**
	 * Filter nested files/folders with the specified function.
	 * @param {Function} search the predicate to use :
	 * function (relativePath, file) {...}
	 * It takes 2 arguments : the relative path and the file.
	 * @return {Array} An array of matching elements.
	 */
	filter: function(search) {
		var result = [],
			filename, relativePath, file, fileClone;
		for (filename in this.files) {
			if (!this.files.hasOwnProperty(filename)) {
				continue;
			}
			file = this.files[filename];
			// return a new object, don't let the user mess with our internal objects :)
			fileClone = new ZipObject(file.name, file._data, extend(file.options));
			relativePath = filename.slice(this.root.length, filename.length);
			if (filename.slice(0, this.root.length) === this.root && // the file is in the current root
			search(relativePath, fileClone)) { // and the file matches the function
				result.push(fileClone);
			}
		}
		return result;
	},

	/**
	 * Add a file to the zip file, or search a file.
	 * @param   {string|RegExp} name The name of the file to add (if data is defined),
	 * the name of the file to find (if no data) or a regex to match files.
	 * @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
	 * @param   {Object} o     File options
	 * @return  {JSZip|Object|Array} this JSZip object (when adding a file),
	 * a file (when searching by string) or an array of files (when searching by regex).
	 */
	file: function(name, data, o) {
		if (arguments.length === 1) {
			if (utils.isRegExp(name)) {
				var regexp = name;
				return this.filter(function(relativePath, file) {
					return !file.dir && regexp.test(relativePath);
				});
			}
			else { // text
				return this.filter(function(relativePath, file) {
					return !file.dir && relativePath === name;
				})[0] || null;
			}
		}
		else { // more than one argument : we have data !
			name = this.root + name;
			fileAdd.call(this, name, data, o);
		}
		return this;
	},

	/**
	 * Add a directory to the zip file, or search.
	 * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
	 * @return  {JSZip} an object with the new directory as the root, or an array containing matching folders.
	 */
	folder: function(arg) {
		if (!arg) {
			return this;
		}

		if (utils.isRegExp(arg)) {
			return this.filter(function(relativePath, file) {
				return file.dir && arg.test(relativePath);
			});
		}

		// else, name is a new folder
		var name = this.root + arg;
		var newFolder = folderAdd.call(this, name);

		// Allow chaining by returning a new object with this folder as the root
		var ret = this.clone();
		ret.root = newFolder.name;
		return ret;
	},

	/**
	 * Delete a file, or a directory and all sub-files, from the zip
	 * @param {string} name the name of the file to delete
	 * @return {JSZip} this JSZip object
	 */
	remove: function(name) {
		name = this.root + name;
		var file = this.files[name];
		if (!file) {
			// Look for any folders
			if (name.slice(-1) != "/") {
				name += "/";
			}
			file = this.files[name];
		}

		if (file && !file.dir) {
			// file
			delete this.files[name];
		} else {
			// maybe a folder, delete recursively
			var kids = this.filter(function(relativePath, file) {
				return file.name.slice(0, name.length) === name;
			});
			for (var i = 0; i < kids.length; i++) {
				delete this.files[kids[i].name];
			}
		}

		return this;
	},

	/**
	 * Generate the complete zip file
	 * @param {Object} options the options to generate the zip file :
	 * - base64, (deprecated, use type instead) true to generate base64.
	 * - compression, "STORE" by default.
	 * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
	 * @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the zip file
	 */
	generate: function(options) {
		options = extend(options || {}, {
			base64: true,
			compression: "STORE",
			compressionOptions : null,
			type: "base64",
			platform: "DOS",
			comment: null,
			mimeType: 'application/zip'
		});

		utils.checkSupport(options.type);

		// accept nodejs `process.platform`
		if(
		  options.platform === 'darwin' ||
		  options.platform === 'freebsd' ||
		  options.platform === 'linux' ||
		  options.platform === 'sunos'
		) {
		  options.platform = "UNIX";
		}
		if (options.platform === 'win32') {
		  options.platform = "DOS";
		}

		var zipData = [],
			localDirLength = 0,
			centralDirLength = 0,
			writer, i,
			utfEncodedComment = utils.transformTo("string", this.utf8encode(options.comment || this.comment || ""));

		// first, generate all the zip parts.
		for (var name in this.files) {
			if (!this.files.hasOwnProperty(name)) {
				continue;
			}
			var file = this.files[name];

			var compressionName = file.options.compression || options.compression.toUpperCase();
			var compression = compressions[compressionName];
			if (!compression) {
				throw new Error(compressionName + " is not a valid compression method !");
			}
			var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};

			var compressedObject = generateCompressedObjectFrom.call(this, file, compression, compressionOptions);

			var zipPart = generateZipParts.call(this, name, file, compressedObject, localDirLength, options.platform);
			localDirLength += zipPart.fileRecord.length + compressedObject.compressedSize;
			centralDirLength += zipPart.dirRecord.length;
			zipData.push(zipPart);
		}

		var dirEnd = "";

		// end of central dir signature
		dirEnd = signature.CENTRAL_DIRECTORY_END +
		// number of this disk
		"\x00\x00" +
		// number of the disk with the start of the central directory
		"\x00\x00" +
		// total number of entries in the central directory on this disk
		decToHex(zipData.length, 2) +
		// total number of entries in the central directory
		decToHex(zipData.length, 2) +
		// size of the central directory   4 bytes
		decToHex(centralDirLength, 4) +
		// offset of start of central directory with respect to the starting disk number
		decToHex(localDirLength, 4) +
		// .ZIP file comment length
		decToHex(utfEncodedComment.length, 2) +
		// .ZIP file comment
		utfEncodedComment;


		// we have all the parts (and the total length)
		// time to create a writer !
		var typeName = options.type.toLowerCase();
		if(typeName==="uint8array"||typeName==="arraybuffer"||typeName==="blob"||typeName==="nodebuffer") {
			writer = new Uint8ArrayWriter(localDirLength + centralDirLength + dirEnd.length);
		}else{
			writer = new StringWriter(localDirLength + centralDirLength + dirEnd.length);
		}

		for (i = 0; i < zipData.length; i++) {
			writer.append(zipData[i].fileRecord);
			writer.append(zipData[i].compressedObject.compressedContent);
		}
		for (i = 0; i < zipData.length; i++) {
			writer.append(zipData[i].dirRecord);
		}

		writer.append(dirEnd);

		var zip = writer.finalize();



		switch(options.type.toLowerCase()) {
			// case "zip is an Uint8Array"
			case "uint8array" :
			case "arraybuffer" :
			case "nodebuffer" :
			   return utils.transformTo(options.type.toLowerCase(), zip);
			case "blob" :
			   return utils.arrayBuffer2Blob(utils.transformTo("arraybuffer", zip), options.mimeType);
			// case "zip is a string"
			case "base64" :
			   return (options.base64) ? base64.encode(zip) : zip;
			default : // case "string" :
			   return zip;
		 }

	},

	/**
	 * @deprecated
	 * This method will be removed in a future version without replacement.
	 */
	crc32: function (input, crc) {
		return crc32(input, crc);
	},

	/**
	 * @deprecated
	 * This method will be removed in a future version without replacement.
	 */
	utf8encode: function (string) {
		return utils.transformTo("string", utf8.utf8encode(string));
	},

	/**
	 * @deprecated
	 * This method will be removed in a future version without replacement.
	 */
	utf8decode: function (input) {
		return utf8.utf8decode(input);
	}
};
module.exports = out;

},{"./base64":1,"./compressedObject":2,"./compressions":3,"./crc32":4,"./defaults":6,"./nodeBuffer":11,"./signature":14,"./stringWriter":16,"./support":17,"./uint8ArrayWriter":19,"./utf8":20,"./utils":21}],14:[function(_dereq_,module,exports){
'use strict';
exports.LOCAL_FILE_HEADER = "PK\x03\x04";
exports.CENTRAL_FILE_HEADER = "PK\x01\x02";
exports.CENTRAL_DIRECTORY_END = "PK\x05\x06";
exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x06\x07";
exports.ZIP64_CENTRAL_DIRECTORY_END = "PK\x06\x06";
exports.DATA_DESCRIPTOR = "PK\x07\x08";

},{}],15:[function(_dereq_,module,exports){
'use strict';
var DataReader = _dereq_('./dataReader');
var utils = _dereq_('./utils');

function StringReader(data, optimizedBinaryString) {
	this.data = data;
	if (!optimizedBinaryString) {
		this.data = utils.string2binary(this.data);
	}
	this.length = this.data.length;
	this.index = 0;
}
StringReader.prototype = new DataReader();
/**
 * @see DataReader.byteAt
 */
StringReader.prototype.byteAt = function(i) {
	return this.data.charCodeAt(i);
};
/**
 * @see DataReader.lastIndexOfSignature
 */
StringReader.prototype.lastIndexOfSignature = function(sig) {
	return this.data.lastIndexOf(sig);
};
/**
 * @see DataReader.readData
 */
StringReader.prototype.readData = function(size) {
	this.checkOffset(size);
	// this will work because the constructor applied the "& 0xff" mask.
	var result = this.data.slice(this.index, this.index + size);
	this.index += size;
	return result;
};
module.exports = StringReader;

},{"./dataReader":5,"./utils":21}],16:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('./utils');

/**
 * An object to write any content to a string.
 * @constructor
 */
var StringWriter = function() {
	this.data = [];
};
StringWriter.prototype = {
	/**
	 * Append any content to the current string.
	 * @param {Object} input the content to add.
	 */
	append: function(input) {
		input = utils.transformTo("string", input);
		this.data.push(input);
	},
	/**
	 * Finalize the construction an return the result.
	 * @return {string} the generated string.
	 */
	finalize: function() {
		return this.data.join("");
	}
};

module.exports = StringWriter;

},{"./utils":21}],17:[function(_dereq_,module,exports){
(function (Buffer){
'use strict';
exports.base64 = true;
exports.array = true;
exports.string = true;
exports.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
// contains true if JSZip can read/generate nodejs Buffer, false otherwise.
// Browserify will provide a Buffer implementation for browsers, which is
// an augmented Uint8Array (i.e., can be used as either Buffer or U8).
exports.nodebuffer = typeof Buffer !== "undefined";
// contains true if JSZip can read/generate Uint8Array, false otherwise.
exports.uint8array = typeof Uint8Array !== "undefined";

if (typeof ArrayBuffer === "undefined") {
	exports.blob = false;
}
else {
	var buffer = new ArrayBuffer(0);
	try {
		exports.blob = new Blob([buffer], {
			type: "application/zip"
		}).size === 0;
	}
	catch (e) {
		try {
			var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
			var builder = new Builder();
			builder.append(buffer);
			exports.blob = builder.getBlob('application/zip').size === 0;
		}
		catch (e) {
			exports.blob = false;
		}
	}
}

}).call(this,(typeof Buffer !== "undefined" ? Buffer : undefined))
},{}],18:[function(_dereq_,module,exports){
'use strict';
var DataReader = _dereq_('./dataReader');

function Uint8ArrayReader(data) {
	if (data) {
		this.data = data;
		this.length = this.data.length;
		this.index = 0;
	}
}
Uint8ArrayReader.prototype = new DataReader();
/**
 * @see DataReader.byteAt
 */
Uint8ArrayReader.prototype.byteAt = function(i) {
	return this.data[i];
};
/**
 * @see DataReader.lastIndexOfSignature
 */
Uint8ArrayReader.prototype.lastIndexOfSignature = function(sig) {
	var sig0 = sig.charCodeAt(0),
		sig1 = sig.charCodeAt(1),
		sig2 = sig.charCodeAt(2),
		sig3 = sig.charCodeAt(3);
	for (var i = this.length - 4; i >= 0; --i) {
		if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
			return i;
		}
	}

	return -1;
};
/**
 * @see DataReader.readData
 */
Uint8ArrayReader.prototype.readData = function(size) {
	this.checkOffset(size);
	if(size === 0) {
		// in IE10, when using subarray(idx, idx), we get the array [0x00] instead of [].
		return new Uint8Array(0);
	}
	var result = this.data.subarray(this.index, this.index + size);
	this.index += size;
	return result;
};
module.exports = Uint8ArrayReader;

},{"./dataReader":5}],19:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('./utils');

/**
 * An object to write any content to an Uint8Array.
 * @constructor
 * @param {number} length The length of the array.
 */
var Uint8ArrayWriter = function(length) {
	this.data = new Uint8Array(length);
	this.index = 0;
};
Uint8ArrayWriter.prototype = {
	/**
	 * Append any content to the current array.
	 * @param {Object} input the content to add.
	 */
	append: function(input) {
		if (input.length !== 0) {
			// with an empty Uint8Array, Opera fails with a "Offset larger than array size"
			input = utils.transformTo("uint8array", input);
			this.data.set(input, this.index);
			this.index += input.length;
		}
	},
	/**
	 * Finalize the construction an return the result.
	 * @return {Uint8Array} the generated array.
	 */
	finalize: function() {
		return this.data;
	}
};

module.exports = Uint8ArrayWriter;

},{"./utils":21}],20:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('./utils');
var support = _dereq_('./support');
var nodeBuffer = _dereq_('./nodeBuffer');

/**
 * The following functions come from pako, from pako/lib/utils/strings
 * released under the MIT license, see pako https://github.com/nodeca/pako/
 */

// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
var _utf8len = new Array(256);
for (var i=0; i<256; i++) {
  _utf8len[i] = (i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1);
}
_utf8len[254]=_utf8len[254]=1; // Invalid sequence start

// convert string to array (typed, when possible)
var string2buf = function (str) {
	var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

	// count binary size
	for (m_pos = 0; m_pos < str_len; m_pos++) {
		c = str.charCodeAt(m_pos);
		if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
			c2 = str.charCodeAt(m_pos+1);
			if ((c2 & 0xfc00) === 0xdc00) {
				c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
				m_pos++;
			}
		}
		buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
	}

	// allocate buffer
	if (support.uint8array) {
		buf = new Uint8Array(buf_len);
	} else {
		buf = new Array(buf_len);
	}

	// convert
	for (i=0, m_pos = 0; i < buf_len; m_pos++) {
		c = str.charCodeAt(m_pos);
		if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
			c2 = str.charCodeAt(m_pos+1);
			if ((c2 & 0xfc00) === 0xdc00) {
				c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
				m_pos++;
			}
		}
		if (c < 0x80) {
			/* one byte */
			buf[i++] = c;
		} else if (c < 0x800) {
			/* two bytes */
			buf[i++] = 0xC0 | (c >>> 6);
			buf[i++] = 0x80 | (c & 0x3f);
		} else if (c < 0x10000) {
			/* three bytes */
			buf[i++] = 0xE0 | (c >>> 12);
			buf[i++] = 0x80 | (c >>> 6 & 0x3f);
			buf[i++] = 0x80 | (c & 0x3f);
		} else {
			/* four bytes */
			buf[i++] = 0xf0 | (c >>> 18);
			buf[i++] = 0x80 | (c >>> 12 & 0x3f);
			buf[i++] = 0x80 | (c >>> 6 & 0x3f);
			buf[i++] = 0x80 | (c & 0x3f);
		}
	}

	return buf;
};

// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
var utf8border = function(buf, max) {
	var pos;

	max = max || buf.length;
	if (max > buf.length) { max = buf.length; }

	// go back from last position, until start of sequence found
	pos = max-1;
	while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

	// Fuckup - very small and broken sequence,
	// return max, because we should return something anyway.
	if (pos < 0) { return max; }

	// If we came to start of buffer - that means vuffer is too small,
	// return max too.
	if (pos === 0) { return max; }

	return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

// convert array to string
var buf2string = function (buf) {
	var str, i, out, c, c_len;
	var len = buf.length;

	// Reserve max possible length (2 words per char)
	// NB: by unknown reasons, Array is significantly faster for
	//     String.fromCharCode.apply than Uint16Array.
	var utf16buf = new Array(len*2);

	for (out=0, i=0; i<len;) {
		c = buf[i++];
		// quick process ascii
		if (c < 0x80) { utf16buf[out++] = c; continue; }

		c_len = _utf8len[c];
		// skip 5 & 6 byte codes
		if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len-1; continue; }

		// apply mask on first byte
		c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
		// join the rest
		while (c_len > 1 && i < len) {
			c = (c << 6) | (buf[i++] & 0x3f);
			c_len--;
		}

		// terminated by end of string?
		if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

		if (c < 0x10000) {
			utf16buf[out++] = c;
		} else {
			c -= 0x10000;
			utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
			utf16buf[out++] = 0xdc00 | (c & 0x3ff);
		}
	}

	// shrinkBuf(utf16buf, out)
	if (utf16buf.length !== out) {
		if(utf16buf.subarray) {
			utf16buf = utf16buf.subarray(0, out);
		} else {
			utf16buf.length = out;
		}
	}

	// return String.fromCharCode.apply(null, utf16buf);
	return utils.applyFromCharCode(utf16buf);
};


// That's all for the pako functions.


/**
 * Transform a javascript string into an array (typed if possible) of bytes,
 * UTF-8 encoded.
 * @param {String} str the string to encode
 * @return {Array|Uint8Array|Buffer} the UTF-8 encoded string.
 */
exports.utf8encode = function utf8encode(str) {
	if (support.nodebuffer) {
		return nodeBuffer(str, "utf-8");
	}

	return string2buf(str);
};


/**
 * Transform a bytes array (or a representation) representing an UTF-8 encoded
 * string into a javascript string.
 * @param {Array|Uint8Array|Buffer} buf the data de decode
 * @return {String} the decoded string.
 */
exports.utf8decode = function utf8decode(buf) {
	if (support.nodebuffer) {
		return utils.transformTo("nodebuffer", buf).toString("utf-8");
	}

	buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);

	// return buf2string(buf);
	// Chrome prefers to work with "small" chunks of data
	// for the method buf2string.
	// Firefox and Chrome has their own shortcut, IE doesn't seem to really care.
	var result = [], k = 0, len = buf.length, chunk = 65536;
	while (k < len) {
		var nextBoundary = utf8border(buf, Math.min(k + chunk, len));
		if (support.uint8array) {
			result.push(buf2string(buf.subarray(k, nextBoundary)));
		} else {
			result.push(buf2string(buf.slice(k, nextBoundary)));
		}
		k = nextBoundary;
	}
	return result.join("");

};
// vim: set shiftwidth=4 softtabstop=4:

},{"./nodeBuffer":11,"./support":17,"./utils":21}],21:[function(_dereq_,module,exports){
'use strict';
var support = _dereq_('./support');
var compressions = _dereq_('./compressions');
var nodeBuffer = _dereq_('./nodeBuffer');
/**
 * Convert a string to a "binary string" : a string containing only char codes between 0 and 255.
 * @param {string} str the string to transform.
 * @return {String} the binary string.
 */
exports.string2binary = function(str) {
	var result = "";
	for (var i = 0; i < str.length; i++) {
		result += String.fromCharCode(str.charCodeAt(i) & 0xff);
	}
	return result;
};
exports.arrayBuffer2Blob = function(buffer, mimeType) {
	exports.checkSupport("blob");
	mimeType = mimeType || 'application/zip';

	try {
		// Blob constructor
		return new Blob([buffer], {
			type: mimeType
		});
	}
	catch (e) {

		try {
			// deprecated, browser only, old way
			var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
			var builder = new Builder();
			builder.append(buffer);
			return builder.getBlob(mimeType);
		}
		catch (e) {

			// well, fuck ?!
			throw new Error("Bug : can't construct the Blob.");
		}
	}


};
/**
 * The identity function.
 * @param {Object} input the input.
 * @return {Object} the same input.
 */
function identity(input) {
	return input;
}

/**
 * Fill in an array with a string.
 * @param {String} str the string to use.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to fill in (will be mutated).
 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated array.
 */
function stringToArrayLike(str, array) {
	for (var i = 0; i < str.length; ++i) {
		array[i] = str.charCodeAt(i) & 0xFF;
	}
	return array;
}

/**
 * Transform an array-like object to a string.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
 * @return {String} the result.
 */
function arrayLikeToString(array) {
	// Performances notes :
	// --------------------
	// String.fromCharCode.apply(null, array) is the fastest, see
	// see http://jsperf.com/converting-a-uint8array-to-a-string/2
	// but the stack is limited (and we can get huge arrays !).
	//
	// result += String.fromCharCode(array[i]); generate too many strings !
	//
	// This code is inspired by http://jsperf.com/arraybuffer-to-string-apply-performance/2
	var chunk = 65536;
	var result = [],
		len = array.length,
		type = exports.getTypeOf(array),
		k = 0,
		canUseApply = true;
	  try {
		 switch(type) {
			case "uint8array":
			   String.fromCharCode.apply(null, new Uint8Array(0));
			   break;
			case "nodebuffer":
			   String.fromCharCode.apply(null, nodeBuffer(0));
			   break;
		 }
	  } catch(e) {
		 canUseApply = false;
	  }

	  // no apply : slow and painful algorithm
	  // default browser on android 4.*
	  if (!canUseApply) {
		 var resultStr = "";
		 for(var i = 0; i < array.length;i++) {
			resultStr += String.fromCharCode(array[i]);
		 }
	return resultStr;
	}
	while (k < len && chunk > 1) {
		try {
			if (type === "array" || type === "nodebuffer") {
				result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
			}
			else {
				result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
			}
			k += chunk;
		}
		catch (e) {
			chunk = Math.floor(chunk / 2);
		}
	}
	return result.join("");
}

exports.applyFromCharCode = arrayLikeToString;


/**
 * Copy the data from an array-like to an other array-like.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayFrom the origin array.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayTo the destination array which will be mutated.
 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated destination array.
 */
function arrayLikeToArrayLike(arrayFrom, arrayTo) {
	for (var i = 0; i < arrayFrom.length; i++) {
		arrayTo[i] = arrayFrom[i];
	}
	return arrayTo;
}

// a matrix containing functions to transform everything into everything.
var transform = {};

// string to ?
transform["string"] = {
	"string": identity,
	"array": function(input) {
		return stringToArrayLike(input, new Array(input.length));
	},
	"arraybuffer": function(input) {
		return transform["string"]["uint8array"](input).buffer;
	},
	"uint8array": function(input) {
		return stringToArrayLike(input, new Uint8Array(input.length));
	},
	"nodebuffer": function(input) {
		return stringToArrayLike(input, nodeBuffer(input.length));
	}
};

// array to ?
transform["array"] = {
	"string": arrayLikeToString,
	"array": identity,
	"arraybuffer": function(input) {
		return (new Uint8Array(input)).buffer;
	},
	"uint8array": function(input) {
		return new Uint8Array(input);
	},
	"nodebuffer": function(input) {
		return nodeBuffer(input);
	}
};

// arraybuffer to ?
transform["arraybuffer"] = {
	"string": function(input) {
		return arrayLikeToString(new Uint8Array(input));
	},
	"array": function(input) {
		return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
	},
	"arraybuffer": identity,
	"uint8array": function(input) {
		return new Uint8Array(input);
	},
	"nodebuffer": function(input) {
		return nodeBuffer(new Uint8Array(input));
	}
};

// uint8array to ?
transform["uint8array"] = {
	"string": arrayLikeToString,
	"array": function(input) {
		return arrayLikeToArrayLike(input, new Array(input.length));
	},
	"arraybuffer": function(input) {
		return input.buffer;
	},
	"uint8array": identity,
	"nodebuffer": function(input) {
		return nodeBuffer(input);
	}
};

// nodebuffer to ?
transform["nodebuffer"] = {
	"string": arrayLikeToString,
	"array": function(input) {
		return arrayLikeToArrayLike(input, new Array(input.length));
	},
	"arraybuffer": function(input) {
		return transform["nodebuffer"]["uint8array"](input).buffer;
	},
	"uint8array": function(input) {
		return arrayLikeToArrayLike(input, new Uint8Array(input.length));
	},
	"nodebuffer": identity
};

/**
 * Transform an input into any type.
 * The supported output type are : string, array, uint8array, arraybuffer, nodebuffer.
 * If no output type is specified, the unmodified input will be returned.
 * @param {String} outputType the output type.
 * @param {String|Array|ArrayBuffer|Uint8Array|Buffer} input the input to convert.
 * @throws {Error} an Error if the browser doesn't support the requested output type.
 */
exports.transformTo = function(outputType, input) {
	if (!input) {
		// undefined, null, etc
		// an empty string won't harm.
		input = "";
	}
	if (!outputType) {
		return input;
	}
	exports.checkSupport(outputType);
	var inputType = exports.getTypeOf(input);
	var result = transform[inputType][outputType](input);
	return result;
};

/**
 * Return the type of the input.
 * The type will be in a format valid for JSZip.utils.transformTo : string, array, uint8array, arraybuffer.
 * @param {Object} input the input to identify.
 * @return {String} the (lowercase) type of the input.
 */
exports.getTypeOf = function(input) {
	if (typeof input === "string") {
		return "string";
	}
	if (Object.prototype.toString.call(input) === "[object Array]") {
		return "array";
	}
	if (support.nodebuffer && nodeBuffer.test(input)) {
		return "nodebuffer";
	}
	if (support.uint8array && input instanceof Uint8Array) {
		return "uint8array";
	}
	if (support.arraybuffer && input instanceof ArrayBuffer) {
		return "arraybuffer";
	}
};

/**
 * Throw an exception if the type is not supported.
 * @param {String} type the type to check.
 * @throws {Error} an Error if the browser doesn't support the requested type.
 */
exports.checkSupport = function(type) {
	var supported = support[type.toLowerCase()];
	if (!supported) {
		throw new Error(type + " is not supported by this browser");
	}
};
exports.MAX_VALUE_16BITS = 65535;
exports.MAX_VALUE_32BITS = -1; // well, "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF" is parsed as -1

/**
 * Prettify a string read as binary.
 * @param {string} str the string to prettify.
 * @return {string} a pretty string.
 */
exports.pretty = function(str) {
	var res = '',
		code, i;
	for (i = 0; i < (str || "").length; i++) {
		code = str.charCodeAt(i);
		res += '\\x' + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
	}
	return res;
};

/**
 * Find a compression registered in JSZip.
 * @param {string} compressionMethod the method magic to find.
 * @return {Object|null} the JSZip compression object, null if none found.
 */
exports.findCompression = function(compressionMethod) {
	for (var method in compressions) {
		if (!compressions.hasOwnProperty(method)) {
			continue;
		}
		if (compressions[method].magic === compressionMethod) {
			return compressions[method];
		}
	}
	return null;
};
/**
* Cross-window, cross-Node-context regular expression detection
* @param  {Object}  object Anything
* @return {Boolean}        true if the object is a regular expression,
* false otherwise
*/
exports.isRegExp = function (object) {
	return Object.prototype.toString.call(object) === "[object RegExp]";
};


},{"./compressions":3,"./nodeBuffer":11,"./support":17}],22:[function(_dereq_,module,exports){
'use strict';
var StringReader = _dereq_('./stringReader');
var NodeBufferReader = _dereq_('./nodeBufferReader');
var Uint8ArrayReader = _dereq_('./uint8ArrayReader');
var utils = _dereq_('./utils');
var sig = _dereq_('./signature');
var ZipEntry = _dereq_('./zipEntry');
var support = _dereq_('./support');
var jszipProto = _dereq_('./object');
//  class ZipEntries {{{
/**
 * All the entries in the zip file.
 * @constructor
 * @param {String|ArrayBuffer|Uint8Array} data the binary stream to load.
 * @param {Object} loadOptions Options for loading the stream.
 */
function ZipEntries(data, loadOptions) {
	this.files = [];
	this.loadOptions = loadOptions;
	if (data) {
		this.load(data);
	}
}
ZipEntries.prototype = {
	/**
	 * Check that the reader is on the speficied signature.
	 * @param {string} expectedSignature the expected signature.
	 * @throws {Error} if it is an other signature.
	 */
	checkSignature: function(expectedSignature) {
		var signature = this.reader.readString(4);
		if (signature !== expectedSignature) {
			throw new Error("Corrupted zip or bug : unexpected signature " + "(" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
		}
	},
	/**
	 * Read the end of the central directory.
	 */
	readBlockEndOfCentral: function() {
		this.diskNumber = this.reader.readInt(2);
		this.diskWithCentralDirStart = this.reader.readInt(2);
		this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
		this.centralDirRecords = this.reader.readInt(2);
		this.centralDirSize = this.reader.readInt(4);
		this.centralDirOffset = this.reader.readInt(4);

		this.zipCommentLength = this.reader.readInt(2);
		// warning : the encoding depends of the system locale
		// On a linux machine with LANG=en_US.utf8, this field is utf8 encoded.
		// On a windows machine, this field is encoded with the localized windows code page.
		this.zipComment = this.reader.readString(this.zipCommentLength);
		// To get consistent behavior with the generation part, we will assume that
		// this is utf8 encoded.
		this.zipComment = jszipProto.utf8decode(this.zipComment);
	},
	/**
	 * Read the end of the Zip 64 central directory.
	 * Not merged with the method readEndOfCentral :
	 * The end of central can coexist with its Zip64 brother,
	 * I don't want to read the wrong number of bytes !
	 */
	readBlockZip64EndOfCentral: function() {
		this.zip64EndOfCentralSize = this.reader.readInt(8);
		this.versionMadeBy = this.reader.readString(2);
		this.versionNeeded = this.reader.readInt(2);
		this.diskNumber = this.reader.readInt(4);
		this.diskWithCentralDirStart = this.reader.readInt(4);
		this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
		this.centralDirRecords = this.reader.readInt(8);
		this.centralDirSize = this.reader.readInt(8);
		this.centralDirOffset = this.reader.readInt(8);

		this.zip64ExtensibleData = {};
		var extraDataSize = this.zip64EndOfCentralSize - 44,
			index = 0,
			extraFieldId,
			extraFieldLength,
			extraFieldValue;
		while (index < extraDataSize) {
			extraFieldId = this.reader.readInt(2);
			extraFieldLength = this.reader.readInt(4);
			extraFieldValue = this.reader.readString(extraFieldLength);
			this.zip64ExtensibleData[extraFieldId] = {
				id: extraFieldId,
				length: extraFieldLength,
				value: extraFieldValue
			};
		}
	},
	/**
	 * Read the end of the Zip 64 central directory locator.
	 */
	readBlockZip64EndOfCentralLocator: function() {
		this.diskWithZip64CentralDirStart = this.reader.readInt(4);
		this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
		this.disksCount = this.reader.readInt(4);
		if (this.disksCount > 1) {
			throw new Error("Multi-volumes zip are not supported");
		}
	},
	/**
	 * Read the local files, based on the offset read in the central part.
	 */
	readLocalFiles: function() {
		var i, file;
		for (i = 0; i < this.files.length; i++) {
			file = this.files[i];
			this.reader.setIndex(file.localHeaderOffset);
			this.checkSignature(sig.LOCAL_FILE_HEADER);
			file.readLocalPart(this.reader);
			file.handleUTF8();
			file.processAttributes();
		}
	},
	/**
	 * Read the central directory.
	 */
	readCentralDir: function() {
		var file;

		this.reader.setIndex(this.centralDirOffset);
		while (this.reader.readString(4) === sig.CENTRAL_FILE_HEADER) {
			file = new ZipEntry({
				zip64: this.zip64
			}, this.loadOptions);
			file.readCentralPart(this.reader);
			this.files.push(file);
		}
	},
	/**
	 * Read the end of central directory.
	 */
	readEndOfCentral: function() {
		var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
		if (offset === -1) {
			// Check if the content is a truncated zip or complete garbage.
			// A "LOCAL_FILE_HEADER" is not required at the beginning (auto
			// extractible zip for example) but it can give a good hint.
			// If an ajax request was used without responseType, we will also
			// get unreadable data.
			var isGarbage = true;
			try {
				this.reader.setIndex(0);
				this.checkSignature(sig.LOCAL_FILE_HEADER);
				isGarbage = false;
			} catch (e) {}

			if (isGarbage) {
				throw new Error("Can't find end of central directory : is this a zip file ? " +
								"If it is, see http://stuk.github.io/jszip/documentation/howto/read_zip.html");
			} else {
				throw new Error("Corrupted zip : can't find end of central directory");
			}
		}
		this.reader.setIndex(offset);
		this.checkSignature(sig.CENTRAL_DIRECTORY_END);
		this.readBlockEndOfCentral();


		/* extract from the zip spec :
			4)  If one of the fields in the end of central directory
				record is too small to hold required data, the field
				should be set to -1 (0xFFFF or 0xFFFFFFFF) and the
				ZIP64 format record should be created.
			5)  The end of central directory record and the
				Zip64 end of central directory locator record must
				reside on the same disk when splitting or spanning
				an archive.
		 */
		if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
			this.zip64 = true;

			/*
			Warning : the zip64 extension is supported, but ONLY if the 64bits integer read from
			the zip file can fit into a 32bits integer. This cannot be solved : Javascript represents
			all numbers as 64-bit double precision IEEE 754 floating point numbers.
			So, we have 53bits for integers and bitwise operations treat everything as 32bits.
			see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators
			and http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf section 8.5
			*/

			// should look for a zip64 EOCD locator
			offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
			if (offset === -1) {
				throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");
			}
			this.reader.setIndex(offset);
			this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
			this.readBlockZip64EndOfCentralLocator();

			// now the zip64 EOCD record
			this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
			this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
			this.readBlockZip64EndOfCentral();
		}
	},
	prepareReader: function(data) {
		var type = utils.getTypeOf(data);
		if (type === "string" && !support.uint8array) {
			this.reader = new StringReader(data, this.loadOptions.optimizedBinaryString);
		}
		else if (type === "nodebuffer") {
			this.reader = new NodeBufferReader(data);
		}
		else {
			this.reader = new Uint8ArrayReader(utils.transformTo("uint8array", data));
		}
	},
	/**
	 * Read a zip file and create ZipEntries.
	 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
	 */
	load: function(data) {
		this.prepareReader(data);
		this.readEndOfCentral();
		this.readCentralDir();
		this.readLocalFiles();
	}
};
// }}} end of ZipEntries
module.exports = ZipEntries;

},{"./nodeBufferReader":12,"./object":13,"./signature":14,"./stringReader":15,"./support":17,"./uint8ArrayReader":18,"./utils":21,"./zipEntry":23}],23:[function(_dereq_,module,exports){
'use strict';
var StringReader = _dereq_('./stringReader');
var utils = _dereq_('./utils');
var CompressedObject = _dereq_('./compressedObject');
var jszipProto = _dereq_('./object');

var MADE_BY_DOS = 0x00;
var MADE_BY_UNIX = 0x03;

// class ZipEntry {{{
/**
 * An entry in the zip file.
 * @constructor
 * @param {Object} options Options of the current file.
 * @param {Object} loadOptions Options for loading the stream.
 */
function ZipEntry(options, loadOptions) {
	this.options = options;
	this.loadOptions = loadOptions;
}
ZipEntry.prototype = {
	/**
	 * say if the file is encrypted.
	 * @return {boolean} true if the file is encrypted, false otherwise.
	 */
	isEncrypted: function() {
		// bit 1 is set
		return (this.bitFlag & 0x0001) === 0x0001;
	},
	/**
	 * say if the file has utf-8 filename/comment.
	 * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
	 */
	useUTF8: function() {
		// bit 11 is set
		return (this.bitFlag & 0x0800) === 0x0800;
	},
	/**
	 * Prepare the function used to generate the compressed content from this ZipFile.
	 * @param {DataReader} reader the reader to use.
	 * @param {number} from the offset from where we should read the data.
	 * @param {number} length the length of the data to read.
	 * @return {Function} the callback to get the compressed content (the type depends of the DataReader class).
	 */
	prepareCompressedContent: function(reader, from, length) {
		return function() {
			var previousIndex = reader.index;
			reader.setIndex(from);
			var compressedFileData = reader.readData(length);
			reader.setIndex(previousIndex);

			return compressedFileData;
		};
	},
	/**
	 * Prepare the function used to generate the uncompressed content from this ZipFile.
	 * @param {DataReader} reader the reader to use.
	 * @param {number} from the offset from where we should read the data.
	 * @param {number} length the length of the data to read.
	 * @param {JSZip.compression} compression the compression used on this file.
	 * @param {number} uncompressedSize the uncompressed size to expect.
	 * @return {Function} the callback to get the uncompressed content (the type depends of the DataReader class).
	 */
	prepareContent: function(reader, from, length, compression, uncompressedSize) {
		return function() {

			var compressedFileData = utils.transformTo(compression.uncompressInputType, this.getCompressedContent());
			var uncompressedFileData = compression.uncompress(compressedFileData);

			if (uncompressedFileData.length !== uncompressedSize) {
				throw new Error("Bug : uncompressed data size mismatch");
			}

			return uncompressedFileData;
		};
	},
	/**
	 * Read the local part of a zip file and add the info in this object.
	 * @param {DataReader} reader the reader to use.
	 */
	readLocalPart: function(reader) {
		var compression, localExtraFieldsLength;

		// we already know everything from the central dir !
		// If the central dir data are false, we are doomed.
		// On the bright side, the local part is scary  : zip64, data descriptors, both, etc.
		// The less data we get here, the more reliable this should be.
		// Let's skip the whole header and dash to the data !
		reader.skip(22);
		// in some zip created on windows, the filename stored in the central dir contains \ instead of /.
		// Strangely, the filename here is OK.
		// I would love to treat these zip files as corrupted (see http://www.info-zip.org/FAQ.html#backslashes
		// or APPNOTE#4.4.17.1, "All slashes MUST be forward slashes '/'") but there are a lot of bad zip generators...
		// Search "unzip mismatching "local" filename continuing with "central" filename version" on
		// the internet.
		//
		// I think I see the logic here : the central directory is used to display
		// content and the local directory is used to extract the files. Mixing / and \
		// may be used to display \ to windows users and use / when extracting the files.
		// Unfortunately, this lead also to some issues : http://seclists.org/fulldisclosure/2009/Sep/394
		this.fileNameLength = reader.readInt(2);
		localExtraFieldsLength = reader.readInt(2); // can't be sure this will be the same as the central dir
		this.fileName = reader.readString(this.fileNameLength);
		reader.skip(localExtraFieldsLength);

		if (this.compressedSize == -1 || this.uncompressedSize == -1) {
			throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory " + "(compressedSize == -1 || uncompressedSize == -1)");
		}

		compression = utils.findCompression(this.compressionMethod);
		if (compression === null) { // no compression found
			throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + this.fileName + ")");
		}
		this.decompressed = new CompressedObject();
		this.decompressed.compressedSize = this.compressedSize;
		this.decompressed.uncompressedSize = this.uncompressedSize;
		this.decompressed.crc32 = this.crc32;
		this.decompressed.compressionMethod = this.compressionMethod;
		this.decompressed.getCompressedContent = this.prepareCompressedContent(reader, reader.index, this.compressedSize, compression);
		this.decompressed.getContent = this.prepareContent(reader, reader.index, this.compressedSize, compression, this.uncompressedSize);

		// we need to compute the crc32...
		if (this.loadOptions.checkCRC32) {
			this.decompressed = utils.transformTo("string", this.decompressed.getContent());
			if (jszipProto.crc32(this.decompressed) !== this.crc32) {
				throw new Error("Corrupted zip : CRC32 mismatch");
			}
		}
	},

	/**
	 * Read the central part of a zip file and add the info in this object.
	 * @param {DataReader} reader the reader to use.
	 */
	readCentralPart: function(reader) {
		this.versionMadeBy = reader.readInt(2);
		this.versionNeeded = reader.readInt(2);
		this.bitFlag = reader.readInt(2);
		this.compressionMethod = reader.readString(2);
		this.date = reader.readDate();
		this.crc32 = reader.readInt(4);
		this.compressedSize = reader.readInt(4);
		this.uncompressedSize = reader.readInt(4);
		this.fileNameLength = reader.readInt(2);
		this.extraFieldsLength = reader.readInt(2);
		this.fileCommentLength = reader.readInt(2);
		this.diskNumberStart = reader.readInt(2);
		this.internalFileAttributes = reader.readInt(2);
		this.externalFileAttributes = reader.readInt(4);
		this.localHeaderOffset = reader.readInt(4);

		if (this.isEncrypted()) {
			throw new Error("Encrypted zip are not supported");
		}

		this.fileName = reader.readString(this.fileNameLength);
		this.readExtraFields(reader);
		this.parseZIP64ExtraField(reader);
		this.fileComment = reader.readString(this.fileCommentLength);
	},

	/**
	 * Parse the external file attributes and get the unix/dos permissions.
	 */
	processAttributes: function () {
		this.unixPermissions = null;
		this.dosPermissions = null;
		var madeBy = this.versionMadeBy >> 8;

		// Check if we have the DOS directory flag set.
		// We look for it in the DOS and UNIX permissions
		// but some unknown platform could set it as a compatibility flag.
		this.dir = this.externalFileAttributes & 0x0010 ? true : false;

		if(madeBy === MADE_BY_DOS) {
			// first 6 bits (0 to 5)
			this.dosPermissions = this.externalFileAttributes & 0x3F;
		}

		if(madeBy === MADE_BY_UNIX) {
			this.unixPermissions = (this.externalFileAttributes >> 16) & 0xFFFF;
			// the octal permissions are in (this.unixPermissions & 0x01FF).toString(8);
		}

		// fail safe : if the name ends with a / it probably means a folder
		if (!this.dir && this.fileName.slice(-1) === '/') {
			this.dir = true;
		}
	},

	/**
	 * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
	 * @param {DataReader} reader the reader to use.
	 */
	parseZIP64ExtraField: function(reader) {

		if (!this.extraFields[0x0001]) {
			return;
		}

		// should be something, preparing the extra reader
		var extraReader = new StringReader(this.extraFields[0x0001].value);

		// I really hope that these 64bits integer can fit in 32 bits integer, because js
		// won't let us have more.
		if (this.uncompressedSize === utils.MAX_VALUE_32BITS) {
			this.uncompressedSize = extraReader.readInt(8);
		}
		if (this.compressedSize === utils.MAX_VALUE_32BITS) {
			this.compressedSize = extraReader.readInt(8);
		}
		if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) {
			this.localHeaderOffset = extraReader.readInt(8);
		}
		if (this.diskNumberStart === utils.MAX_VALUE_32BITS) {
			this.diskNumberStart = extraReader.readInt(4);
		}
	},
	/**
	 * Read the central part of a zip file and add the info in this object.
	 * @param {DataReader} reader the reader to use.
	 */
	readExtraFields: function(reader) {
		var start = reader.index,
			extraFieldId,
			extraFieldLength,
			extraFieldValue;

		this.extraFields = this.extraFields || {};

		while (reader.index < start + this.extraFieldsLength) {
			extraFieldId = reader.readInt(2);
			extraFieldLength = reader.readInt(2);
			extraFieldValue = reader.readString(extraFieldLength);

			this.extraFields[extraFieldId] = {
				id: extraFieldId,
				length: extraFieldLength,
				value: extraFieldValue
			};
		}
	},
	/**
	 * Apply an UTF8 transformation if needed.
	 */
	handleUTF8: function() {
		if (this.useUTF8()) {
			this.fileName = jszipProto.utf8decode(this.fileName);
			this.fileComment = jszipProto.utf8decode(this.fileComment);
		} else {
			var upath = this.findExtraFieldUnicodePath();
			if (upath !== null) {
				this.fileName = upath;
			}
			var ucomment = this.findExtraFieldUnicodeComment();
			if (ucomment !== null) {
				this.fileComment = ucomment;
			}
		}
	},

	/**
	 * Find the unicode path declared in the extra field, if any.
	 * @return {String} the unicode path, null otherwise.
	 */
	findExtraFieldUnicodePath: function() {
		var upathField = this.extraFields[0x7075];
		if (upathField) {
			var extraReader = new StringReader(upathField.value);

			// wrong version
			if (extraReader.readInt(1) !== 1) {
				return null;
			}

			// the crc of the filename changed, this field is out of date.
			if (jszipProto.crc32(this.fileName) !== extraReader.readInt(4)) {
				return null;
			}

			return jszipProto.utf8decode(extraReader.readString(upathField.length - 5));
		}
		return null;
	},

	/**
	 * Find the unicode comment declared in the extra field, if any.
	 * @return {String} the unicode comment, null otherwise.
	 */
	findExtraFieldUnicodeComment: function() {
		var ucommentField = this.extraFields[0x6375];
		if (ucommentField) {
			var extraReader = new StringReader(ucommentField.value);

			// wrong version
			if (extraReader.readInt(1) !== 1) {
				return null;
			}

			// the crc of the comment changed, this field is out of date.
			if (jszipProto.crc32(this.fileComment) !== extraReader.readInt(4)) {
				return null;
			}

			return jszipProto.utf8decode(extraReader.readString(ucommentField.length - 5));
		}
		return null;
	}
};
module.exports = ZipEntry;

},{"./compressedObject":2,"./object":13,"./stringReader":15,"./utils":21}],24:[function(_dereq_,module,exports){
// Top level file is just a mixin of submodules & constants
'use strict';

var assign    = _dereq_('./lib/utils/common').assign;

var deflate   = _dereq_('./lib/deflate');
var inflate   = _dereq_('./lib/inflate');
var constants = _dereq_('./lib/zlib/constants');

var pako = {};

assign(pako, deflate, inflate, constants);

module.exports = pako;
},{"./lib/deflate":25,"./lib/inflate":26,"./lib/utils/common":27,"./lib/zlib/constants":30}],25:[function(_dereq_,module,exports){
'use strict';


var zlib_deflate = _dereq_('./zlib/deflate.js');
var utils = _dereq_('./utils/common');
var strings = _dereq_('./utils/strings');
var msg = _dereq_('./zlib/messages');
var zstream = _dereq_('./zlib/zstream');


/* Public constants ==========================================================*/
/* ===========================================================================*/

var Z_NO_FLUSH      = 0;
var Z_FINISH        = 4;

var Z_OK            = 0;
var Z_STREAM_END    = 1;

var Z_DEFAULT_COMPRESSION = -1;

var Z_DEFAULT_STRATEGY    = 0;

var Z_DEFLATED  = 8;

/* ===========================================================================*/


/**
 * class Deflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[deflate]],
 * [[deflateRaw]] and [[gzip]].
 **/

/* internal
 * Deflate.chunks -> Array
 *
 * Chunks of output data, if [[Deflate#onData]] not overriden.
 **/

/**
 * Deflate.result -> Uint8Array|Array
 *
 * Compressed result, generated by default [[Deflate#onData]]
 * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Deflate#push]] with `Z_FINISH` / `true` param).
 **/

/**
 * Deflate.err -> Number
 *
 * Error code after deflate finished. 0 (Z_OK) on success.
 * You will not need it in real life, because deflate errors
 * are possible only on wrong options or bad `onData` / `onEnd`
 * custom handlers.
 **/

/**
 * Deflate.msg -> String
 *
 * Error message, if [[Deflate.err]] != 0
 **/


/**
 * new Deflate(options)
 * - options (Object): zlib deflate options.
 *
 * Creates new deflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `level`
 * - `windowBits`
 * - `memLevel`
 * - `strategy`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw deflate
 * - `gzip` (Boolean) - create gzip wrapper
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 * - `header` (Object) - custom header for gzip
 *   - `text` (Boolean) - true if compressed data believed to be text
 *   - `time` (Number) - modification time, unix timestamp
 *   - `os` (Number) - operation system code
 *   - `extra` (Array) - array of bytes with extra data (max 65536)
 *   - `name` (String) - file name (binary string)
 *   - `comment` (String) - comment (binary string)
 *   - `hcrc` (Boolean) - true if header crc should be added
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var deflate = new pako.Deflate({ level: 3});
 *
 * deflate.push(chunk1, false);
 * deflate.push(chunk2, true);  // true -> last chunk
 *
 * if (deflate.err) { throw new Error(deflate.err); }
 *
 * console.log(deflate.result);
 * ```
 **/
var Deflate = function(options) {

  this.options = utils.assign({
	level: Z_DEFAULT_COMPRESSION,
	method: Z_DEFLATED,
	chunkSize: 16384,
	windowBits: 15,
	memLevel: 8,
	strategy: Z_DEFAULT_STRATEGY,
	to: ''
  }, options || {});

  var opt = this.options;

  if (opt.raw && (opt.windowBits > 0)) {
	opt.windowBits = -opt.windowBits;
  }

  else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
	opt.windowBits += 16;
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm = new zstream();
  this.strm.avail_out = 0;

  var status = zlib_deflate.deflateInit2(
	this.strm,
	opt.level,
	opt.method,
	opt.windowBits,
	opt.memLevel,
	opt.strategy
  );

  if (status !== Z_OK) {
	throw new Error(msg[status]);
  }

  if (opt.header) {
	zlib_deflate.deflateSetHeader(this.strm, opt.header);
  }
};

/**
 * Deflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|String): input data. Strings will be converted to
 *   utf8 byte sequence.
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
 * new compressed chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That flush internal pending buffers and call
 * [[Deflate#onEnd]].
 *
 * On fail call [[Deflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * array format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Deflate.prototype.push = function(data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;

  if (this.ended) { return false; }

  _mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH : Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
	// If we need to compress text, change encoding to utf8.
	strm.input = strings.string2buf(data);
  } else {
	strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
	if (strm.avail_out === 0) {
	  strm.output = new utils.Buf8(chunkSize);
	  strm.next_out = 0;
	  strm.avail_out = chunkSize;
	}
	status = zlib_deflate.deflate(strm, _mode);    /* no bad return value */

	if (status !== Z_STREAM_END && status !== Z_OK) {
	  this.onEnd(status);
	  this.ended = true;
	  return false;
	}
	if (strm.avail_out === 0 || (strm.avail_in === 0 && _mode === Z_FINISH)) {
	  if (this.options.to === 'string') {
		this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
	  } else {
		this.onData(utils.shrinkBuf(strm.output, strm.next_out));
	  }
	}
  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);

  // Finalize on the last chunk.
  if (_mode === Z_FINISH) {
	status = zlib_deflate.deflateEnd(this.strm);
	this.onEnd(status);
	this.ended = true;
	return status === Z_OK;
  }

  return true;
};


/**
 * Deflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Deflate.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};


/**
 * Deflate#onEnd(status) -> Void
 * - status (Number): deflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell deflate that input stream complete
 * or error happenned. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Deflate.prototype.onEnd = function(status) {
  // On success - join
  if (status === Z_OK) {
	if (this.options.to === 'string') {
	  this.result = this.chunks.join('');
	} else {
	  this.result = utils.flattenChunks(this.chunks);
	}
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * deflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * Compress `data` with deflate alrorythm and `options`.
 *
 * Supported options are:
 *
 * - level
 * - windowBits
 * - memLevel
 * - strategy
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
 *
 * console.log(pako.deflate(data));
 * ```
 **/
function deflate(input, options) {
  var deflator = new Deflate(options);

  deflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (deflator.err) { throw deflator.msg; }

  return deflator.result;
}


/**
 * deflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function deflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return deflate(input, options);
}


/**
 * gzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but create gzip wrapper instead of
 * deflate one.
 **/
function gzip(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate(input, options);
}


exports.Deflate = Deflate;
exports.deflate = deflate;
exports.deflateRaw = deflateRaw;
exports.gzip = gzip;
},{"./utils/common":27,"./utils/strings":28,"./zlib/deflate.js":32,"./zlib/messages":37,"./zlib/zstream":39}],26:[function(_dereq_,module,exports){
'use strict';


var zlib_inflate = _dereq_('./zlib/inflate.js');
var utils = _dereq_('./utils/common');
var strings = _dereq_('./utils/strings');
var c = _dereq_('./zlib/constants');
var msg = _dereq_('./zlib/messages');
var zstream = _dereq_('./zlib/zstream');
var gzheader = _dereq_('./zlib/gzheader');


/**
 * class Inflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[inflate]]
 * and [[inflateRaw]].
 **/

/* internal
 * inflate.chunks -> Array
 *
 * Chunks of output data, if [[Inflate#onData]] not overriden.
 **/

/**
 * Inflate.result -> Uint8Array|Array|String
 *
 * Uncompressed result, generated by default [[Inflate#onData]]
 * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Inflate#push]] with `Z_FINISH` / `true` param).
 **/

/**
 * Inflate.err -> Number
 *
 * Error code after inflate finished. 0 (Z_OK) on success.
 * Should be checked if broken data possible.
 **/

/**
 * Inflate.msg -> String
 *
 * Error message, if [[Inflate.err]] != 0
 **/


/**
 * new Inflate(options)
 * - options (Object): zlib inflate options.
 *
 * Creates new inflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `windowBits`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw inflate
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 * By default, when no options set, autodetect deflate/gzip data format via
 * wrapper header.
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var inflate = new pako.Inflate({ level: 3});
 *
 * inflate.push(chunk1, false);
 * inflate.push(chunk2, true);  // true -> last chunk
 *
 * if (inflate.err) { throw new Error(inflate.err); }
 *
 * console.log(inflate.result);
 * ```
 **/
var Inflate = function(options) {

  this.options = utils.assign({
	chunkSize: 16384,
	windowBits: 0,
	to: ''
  }, options || {});

  var opt = this.options;

  // Force window size for `raw` data, if not set directly,
  // because we have no header for autodetect.
  if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
	opt.windowBits = -opt.windowBits;
	if (opt.windowBits === 0) { opt.windowBits = -15; }
  }

  // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
  if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
	  !(options && options.windowBits)) {
	opt.windowBits += 32;
  }

  // Gzip header has no info about windows size, we can do autodetect only
  // for deflate. So, if window size not set, force it to max when gzip possible
  if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
	// bit 3 (16) -> gzipped data
	// bit 4 (32) -> autodetect gzip/deflate
	if ((opt.windowBits & 15) === 0) {
	  opt.windowBits |= 15;
	}
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm   = new zstream();
  this.strm.avail_out = 0;

  var status  = zlib_inflate.inflateInit2(
	this.strm,
	opt.windowBits
  );

  if (status !== c.Z_OK) {
	throw new Error(msg[status]);
  }

  this.header = new gzheader();

  zlib_inflate.inflateGetHeader(this.strm, this.header);
};

/**
 * Inflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|String): input data
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
 * new output chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That flush internal pending buffers and call
 * [[Inflate#onEnd]].
 *
 * On fail call [[Inflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Inflate.prototype.push = function(data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;
  var next_out_utf8, tail, utf8str;

  if (this.ended) { return false; }
  _mode = (mode === ~~mode) ? mode : ((mode === true) ? c.Z_FINISH : c.Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
	// Only binary strings can be decompressed on practice
	strm.input = strings.binstring2buf(data);
  } else {
	strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
	if (strm.avail_out === 0) {
	  strm.output = new utils.Buf8(chunkSize);
	  strm.next_out = 0;
	  strm.avail_out = chunkSize;
	}

	status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);    /* no bad return value */

	if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
	  this.onEnd(status);
	  this.ended = true;
	  return false;
	}

	if (strm.next_out) {
	  if (strm.avail_out === 0 || status === c.Z_STREAM_END || (strm.avail_in === 0 && _mode === c.Z_FINISH)) {

		if (this.options.to === 'string') {

		  next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

		  tail = strm.next_out - next_out_utf8;
		  utf8str = strings.buf2string(strm.output, next_out_utf8);

		  // move tail
		  strm.next_out = tail;
		  strm.avail_out = chunkSize - tail;
		  if (tail) { utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }

		  this.onData(utf8str);

		} else {
		  this.onData(utils.shrinkBuf(strm.output, strm.next_out));
		}
	  }
	}
  } while ((strm.avail_in > 0) && status !== c.Z_STREAM_END);

  if (status === c.Z_STREAM_END) {
	_mode = c.Z_FINISH;
  }
  // Finalize on the last chunk.
  if (_mode === c.Z_FINISH) {
	status = zlib_inflate.inflateEnd(this.strm);
	this.onEnd(status);
	this.ended = true;
	return status === c.Z_OK;
  }

  return true;
};


/**
 * Inflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Inflate.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};


/**
 * Inflate#onEnd(status) -> Void
 * - status (Number): inflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell inflate that input stream complete
 * or error happenned. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Inflate.prototype.onEnd = function(status) {
  // On success - join
  if (status === c.Z_OK) {
	if (this.options.to === 'string') {
	  // Glue & convert here, until we teach pako to send
	  // utf8 alligned strings to onData
	  this.result = this.chunks.join('');
	} else {
	  this.result = utils.flattenChunks(this.chunks);
	}
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * inflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Decompress `data` with inflate/ungzip and `options`. Autodetect
 * format via wrapper header by default. That's why we don't provide
 * separate `ungzip` method.
 *
 * Supported options are:
 *
 * - windowBits
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
 *   , output;
 *
 * try {
 *   output = pako.inflate(input);
 * } catch (err)
 *   console.log(err);
 * }
 * ```
 **/
function inflate(input, options) {
  var inflator = new Inflate(options);

  inflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (inflator.err) { throw inflator.msg; }

  return inflator.result;
}


/**
 * inflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * The same as [[inflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function inflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return inflate(input, options);
}


/**
 * ungzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Just shortcut to [[inflate]], because it autodetects format
 * by header.content. Done for convenience.
 **/


exports.Inflate = Inflate;
exports.inflate = inflate;
exports.inflateRaw = inflateRaw;
exports.ungzip  = inflate;

},{"./utils/common":27,"./utils/strings":28,"./zlib/constants":30,"./zlib/gzheader":33,"./zlib/inflate.js":35,"./zlib/messages":37,"./zlib/zstream":39}],27:[function(_dereq_,module,exports){
'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
				(typeof Uint16Array !== 'undefined') &&
				(typeof Int32Array !== 'undefined');


exports.assign = function (obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
	var source = sources.shift();
	if (!source) { continue; }

	if (typeof(source) !== 'object') {
	  throw new TypeError(source + 'must be non-object');
	}

	for (var p in source) {
	  if (source.hasOwnProperty(p)) {
		obj[p] = source[p];
	  }
	}
  }

  return obj;
};


// reduce buffer size, avoiding mem copy
exports.shrinkBuf = function (buf, size) {
  if (buf.length === size) { return buf; }
  if (buf.subarray) { return buf.subarray(0, size); }
  buf.length = size;
  return buf;
};


var fnTyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
	if (src.subarray && dest.subarray) {
	  dest.set(src.subarray(src_offs, src_offs+len), dest_offs);
	  return;
	}
	// Fallback to ordinary array
	for(var i=0; i<len; i++) {
	  dest[dest_offs + i] = src[src_offs + i];
	}
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
	var i, l, len, pos, chunk, result;

	// calculate data length
	len = 0;
	for (i=0, l=chunks.length; i<l; i++) {
	  len += chunks[i].length;
	}

	// join chunks
	result = new Uint8Array(len);
	pos = 0;
	for (i=0, l=chunks.length; i<l; i++) {
	  chunk = chunks[i];
	  result.set(chunk, pos);
	  pos += chunk.length;
	}

	return result;
  }
};

var fnUntyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
	for(var i=0; i<len; i++) {
	  dest[dest_offs + i] = src[src_offs + i];
	}
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
	return [].concat.apply([], chunks);
  }
};


// Enable/Disable typed arrays use, for testing
//
exports.setTyped = function (on) {
  if (on) {
	exports.Buf8  = Uint8Array;
	exports.Buf16 = Uint16Array;
	exports.Buf32 = Int32Array;
	exports.assign(exports, fnTyped);
  } else {
	exports.Buf8  = Array;
	exports.Buf16 = Array;
	exports.Buf32 = Array;
	exports.assign(exports, fnUntyped);
  }
};

exports.setTyped(TYPED_OK);
},{}],28:[function(_dereq_,module,exports){
// String encode/decode helpers
'use strict';


var utils = _dereq_('./common');


// Quick check if we can use fast array to bin string conversion
//
// - apply(Array) can fail on Android 2.2
// - apply(Uint8Array) can fail on iOS 5.1 Safary
//
var STR_APPLY_OK = true;
var STR_APPLY_UIA_OK = true;

try { String.fromCharCode.apply(null, [0]); } catch(__) { STR_APPLY_OK = false; }
try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch(__) { STR_APPLY_UIA_OK = false; }


// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
var _utf8len = new utils.Buf8(256);
for (var i=0; i<256; i++) {
  _utf8len[i] = (i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1);
}
_utf8len[254]=_utf8len[254]=1; // Invalid sequence start


// convert string to array (typed, when possible)
exports.string2buf = function (str) {
  var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

  // count binary size
  for (m_pos = 0; m_pos < str_len; m_pos++) {
	c = str.charCodeAt(m_pos);
	if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
	  c2 = str.charCodeAt(m_pos+1);
	  if ((c2 & 0xfc00) === 0xdc00) {
		c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
		m_pos++;
	  }
	}
	buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  // allocate buffer
  buf = new utils.Buf8(buf_len);

  // convert
  for (i=0, m_pos = 0; i < buf_len; m_pos++) {
	c = str.charCodeAt(m_pos);
	if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
	  c2 = str.charCodeAt(m_pos+1);
	  if ((c2 & 0xfc00) === 0xdc00) {
		c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
		m_pos++;
	  }
	}
	if (c < 0x80) {
	  /* one byte */
	  buf[i++] = c;
	} else if (c < 0x800) {
	  /* two bytes */
	  buf[i++] = 0xC0 | (c >>> 6);
	  buf[i++] = 0x80 | (c & 0x3f);
	} else if (c < 0x10000) {
	  /* three bytes */
	  buf[i++] = 0xE0 | (c >>> 12);
	  buf[i++] = 0x80 | (c >>> 6 & 0x3f);
	  buf[i++] = 0x80 | (c & 0x3f);
	} else {
	  /* four bytes */
	  buf[i++] = 0xf0 | (c >>> 18);
	  buf[i++] = 0x80 | (c >>> 12 & 0x3f);
	  buf[i++] = 0x80 | (c >>> 6 & 0x3f);
	  buf[i++] = 0x80 | (c & 0x3f);
	}
  }

  return buf;
};

// Helper (used in 2 places)
function buf2binstring(buf, len) {
  // use fallback for big arrays to avoid stack overflow
  if (len < 65537) {
	if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
	  return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
	}
  }

  var result = '';
  for(var i=0; i < len; i++) {
	result += String.fromCharCode(buf[i]);
  }
  return result;
}


// Convert byte array to binary string
exports.buf2binstring = function(buf) {
  return buf2binstring(buf, buf.length);
};


// Convert binary string (typed, when possible)
exports.binstring2buf = function(str) {
  var buf = new utils.Buf8(str.length);
  for(var i=0, len=buf.length; i < len; i++) {
	buf[i] = str.charCodeAt(i);
  }
  return buf;
};


// convert array to string
exports.buf2string = function (buf, max) {
  var i, out, c, c_len;
  var len = max || buf.length;

  // Reserve max possible length (2 words per char)
  // NB: by unknown reasons, Array is significantly faster for
  //     String.fromCharCode.apply than Uint16Array.
  var utf16buf = new Array(len*2);

  for (out=0, i=0; i<len;) {
	c = buf[i++];
	// quick process ascii
	if (c < 0x80) { utf16buf[out++] = c; continue; }

	c_len = _utf8len[c];
	// skip 5 & 6 byte codes
	if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len-1; continue; }

	// apply mask on first byte
	c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
	// join the rest
	while (c_len > 1 && i < len) {
	  c = (c << 6) | (buf[i++] & 0x3f);
	  c_len--;
	}

	// terminated by end of string?
	if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

	if (c < 0x10000) {
	  utf16buf[out++] = c;
	} else {
	  c -= 0x10000;
	  utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
	  utf16buf[out++] = 0xdc00 | (c & 0x3ff);
	}
  }

  return buf2binstring(utf16buf, out);
};


// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
exports.utf8border = function(buf, max) {
  var pos;

  max = max || buf.length;
  if (max > buf.length) { max = buf.length; }

  // go back from last position, until start of sequence found
  pos = max-1;
  while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

  // Fuckup - very small and broken sequence,
  // return max, because we should return something anyway.
  if (pos < 0) { return max; }

  // If we came to start of buffer - that means vuffer is too small,
  // return max too.
  if (pos === 0) { return max; }

  return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

},{"./common":27}],29:[function(_dereq_,module,exports){
'use strict';

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

function adler32(adler, buf, len, pos) {
  var s1 = (adler & 0xffff) |0
	, s2 = ((adler >>> 16) & 0xffff) |0
	, n = 0;

  while (len !== 0) {
	// Set limit ~ twice less than 5552, to keep
	// s2 in 31-bits, because we force signed ints.
	// in other case %= will fail.
	n = len > 2000 ? 2000 : len;
	len -= n;

	do {
	  s1 = (s1 + buf[pos++]) |0;
	  s2 = (s2 + s1) |0;
	} while (--n);

	s1 %= 65521;
	s2 %= 65521;
  }

  return (s1 | (s2 << 16)) |0;
}


module.exports = adler32;
},{}],30:[function(_dereq_,module,exports){
module.exports = {

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH:         0,
  Z_PARTIAL_FLUSH:    1,
  Z_SYNC_FLUSH:       2,
  Z_FULL_FLUSH:       3,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  Z_TREES:            6,

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_NEED_DICT:        2,
  Z_ERRNO:           -1,
  Z_STREAM_ERROR:    -2,
  Z_DATA_ERROR:      -3,
  //Z_MEM_ERROR:     -4,
  Z_BUF_ERROR:       -5,
  //Z_VERSION_ERROR: -6,

  /* compression levels */
  Z_NO_COMPRESSION:         0,
  Z_BEST_SPEED:             1,
  Z_BEST_COMPRESSION:       9,
  Z_DEFAULT_COMPRESSION:   -1,


  Z_FILTERED:               1,
  Z_HUFFMAN_ONLY:           2,
  Z_RLE:                    3,
  Z_FIXED:                  4,
  Z_DEFAULT_STRATEGY:       0,

  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY:                 0,
  Z_TEXT:                   1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN:                2,

  /* The deflate compression method */
  Z_DEFLATED:               8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};
},{}],31:[function(_dereq_,module,exports){
'use strict';

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.


// Use ordinary array, since untyped makes no boost here
function makeTable() {
  var c, table = [];

  for(var n =0; n < 256; n++){
	c = n;
	for(var k =0; k < 8; k++){
	  c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
	}
	table[n] = c;
  }

  return table;
}

// Create table on load. Just 255 signed longs. Not a problem.
var crcTable = makeTable();


function crc32(crc, buf, len, pos) {
  var t = crcTable
	, end = pos + len;

  crc = crc ^ (-1);

  for (var i = pos; i < end; i++ ) {
	crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
}


module.exports = crc32;
},{}],32:[function(_dereq_,module,exports){
'use strict';

var utils   = _dereq_('../utils/common');
var trees   = _dereq_('./trees');
var adler32 = _dereq_('./adler32');
var crc32   = _dereq_('./crc32');
var msg   = _dereq_('./messages');

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
var Z_NO_FLUSH      = 0;
var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
//var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
//var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
//var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;


/* compression levels */
//var Z_NO_COMPRESSION      = 0;
//var Z_BEST_SPEED          = 1;
//var Z_BEST_COMPRESSION    = 9;
var Z_DEFAULT_COMPRESSION = -1;


var Z_FILTERED            = 1;
var Z_HUFFMAN_ONLY        = 2;
var Z_RLE                 = 3;
var Z_FIXED               = 4;
var Z_DEFAULT_STRATEGY    = 0;

/* Possible values of the data_type field (though see inflate()) */
//var Z_BINARY              = 0;
//var Z_TEXT                = 1;
//var Z_ASCII               = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;


/* The deflate compression method */
var Z_DEFLATED  = 8;

/*============================================================================*/


var MAX_MEM_LEVEL = 9;
/* Maximum value for memLevel in deflateInit2 */
var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_MEM_LEVEL = 8;


var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */
var LITERALS      = 256;
/* number of literal bytes 0..255 */
var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */
var D_CODES       = 30;
/* number of distance codes */
var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */
var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */
var MAX_BITS  = 15;
/* All codes must not exceed MAX_BITS bits */

var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

var PRESET_DICT = 0x20;

var INIT_STATE = 42;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;

var BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
var BS_BLOCK_DONE     = 2; /* block flush performed */
var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
var BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

function err(strm, errorCode) {
  strm.msg = msg[errorCode];
  return errorCode;
}

function rank(f) {
  return ((f) << 1) - ((f) > 4 ? 9 : 0);
}

function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


/* =========================================================================
 * Flush as much pending output as possible. All deflate() output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm->output buffer and copying into it.
 * (See also read_buf()).
 */
function flush_pending(strm) {
  var s = strm.state;

  //_tr_flush_bits(s);
  var len = s.pending;
  if (len > strm.avail_out) {
	len = strm.avail_out;
  }
  if (len === 0) { return; }

  utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
	s.pending_out = 0;
  }
}


function flush_block_only (s, last) {
  trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
}


function put_byte(s, b) {
  s.pending_buf[s.pending++] = b;
}


/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */
function putShortMSB(s, b) {
//  put_byte(s, (Byte)(b >> 8));
//  put_byte(s, (Byte)(b & 0xff));
  s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
  s.pending_buf[s.pending++] = b & 0xff;
}


/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->input buffer and copying from it.
 * (See also flush_pending()).
 */
function read_buf(strm, buf, start, size) {
  var len = strm.avail_in;

  if (len > size) { len = size; }
  if (len === 0) { return 0; }

  strm.avail_in -= len;

  utils.arraySet(buf, strm.input, strm.next_in, len, start);
  if (strm.state.wrap === 1) {
	strm.adler = adler32(strm.adler, buf, len, start);
  }

  else if (strm.state.wrap === 2) {
	strm.adler = crc32(strm.adler, buf, len, start);
  }

  strm.next_in += len;
  strm.total_in += len;

  return len;
}


/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */
function longest_match(s, cur_match) {
  var chain_length = s.max_chain_length;      /* max hash chain length */
  var scan = s.strstart; /* current string */
  var match;                       /* matched string */
  var len;                           /* length of current match */
  var best_len = s.prev_length;              /* best match length so far */
  var nice_match = s.nice_match;             /* stop if match long enough */
  var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
	  s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

  var _win = s.window; // shortcut

  var wmask = s.w_mask;
  var prev  = s.prev;

  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */

  var strend = s.strstart + MAX_MATCH;
  var scan_end1  = _win[scan + best_len - 1];
  var scan_end   = _win[scan + best_len];

  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
   * It is easy to get rid of this optimization if necessary.
   */
  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

  /* Do not waste too much time if we already have a good match: */
  if (s.prev_length >= s.good_match) {
	chain_length >>= 2;
  }
  /* Do not look for matches beyond the end of the input. This is necessary
   * to make deflate deterministic.
   */
  if (nice_match > s.lookahead) { nice_match = s.lookahead; }

  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

  do {
	// Assert(cur_match < s->strstart, "no future");
	match = cur_match;

	/* Skip to next match if the match length cannot increase
	 * or if the match length is less than 2.  Note that the checks below
	 * for insufficient lookahead only occur occasionally for performance
	 * reasons.  Therefore uninitialized memory will be accessed, and
	 * conditional jumps will be made that depend on those values.
	 * However the length of the match is limited to the lookahead, so
	 * the output of deflate is not affected by the uninitialized values.
	 */

	if (_win[match + best_len]     !== scan_end  ||
		_win[match + best_len - 1] !== scan_end1 ||
		_win[match]                !== _win[scan] ||
		_win[++match]              !== _win[scan + 1]) {
	  continue;
	}

	/* The check at best_len-1 can be removed because it will be made
	 * again later. (This heuristic is not always a win.)
	 * It is not necessary to compare scan[2] and match[2] since they
	 * are always equal when the other bytes match, given that
	 * the hash keys are equal and that HASH_BITS >= 8.
	 */
	scan += 2;
	match++;
	// Assert(*scan == *match, "match[2]?");

	/* We check for insufficient lookahead only every 8th comparison;
	 * the 256th check will be made at strstart+258.
	 */
	do {
	  /*jshint noempty:false*/
	} while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
			 _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
			 _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
			 _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
			 scan < strend);

	// Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

	len = MAX_MATCH - (strend - scan);
	scan = strend - MAX_MATCH;

	if (len > best_len) {
	  s.match_start = cur_match;
	  best_len = len;
	  if (len >= nice_match) {
		break;
	  }
	  scan_end1  = _win[scan + best_len - 1];
	  scan_end   = _win[scan + best_len];
	}
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

  if (best_len <= s.lookahead) {
	return best_len;
  }
  return s.lookahead;
}


/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */
function fill_window(s) {
  var _w_size = s.w_size;
  var p, n, m, more, str;

  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

  do {
	more = s.window_size - s.lookahead - s.strstart;

	// JS ints have 32 bit, block below not needed
	/* Deal with !@#$% 64K limit: */
	//if (sizeof(int) <= 2) {
	//    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
	//        more = wsize;
	//
	//  } else if (more == (unsigned)(-1)) {
	//        /* Very unlikely, but possible on 16 bit machine if
	//         * strstart == 0 && lookahead == 1 (input done a byte at time)
	//         */
	//        more--;
	//    }
	//}


	/* If the window is almost full and there is insufficient lookahead,
	 * move the upper half to the lower one to make room in the upper half.
	 */
	if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

	  utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
	  s.match_start -= _w_size;
	  s.strstart -= _w_size;
	  /* we now have strstart >= MAX_DIST */
	  s.block_start -= _w_size;

	  /* Slide the hash table (could be avoided with 32 bit values
	   at the expense of memory usage). We slide even when level == 0
	   to keep the hash table consistent if we switch back to level > 0
	   later. (Using level 0 permanently is not an optimal usage of
	   zlib, so we don't care about this pathological case.)
	   */

	  n = s.hash_size;
	  p = n;
	  do {
		m = s.head[--p];
		s.head[p] = (m >= _w_size ? m - _w_size : 0);
	  } while (--n);

	  n = _w_size;
	  p = n;
	  do {
		m = s.prev[--p];
		s.prev[p] = (m >= _w_size ? m - _w_size : 0);
		/* If n is not on any hash chain, prev[n] is garbage but
		 * its value will never be used.
		 */
	  } while (--n);

	  more += _w_size;
	}
	if (s.strm.avail_in === 0) {
	  break;
	}

	/* If there was no sliding:
	 *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
	 *    more == window_size - lookahead - strstart
	 * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
	 * => more >= window_size - 2*WSIZE + 2
	 * In the BIG_MEM or MMAP case (not yet supported),
	 *   window_size == input_size + MIN_LOOKAHEAD  &&
	 *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
	 * Otherwise, window_size == 2*WSIZE so more >= 2.
	 * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
	 */
	//Assert(more >= 2, "more < 2");
	n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
	s.lookahead += n;

	/* Initialize the hash value now that we have some input: */
	if (s.lookahead + s.insert >= MIN_MATCH) {
	  str = s.strstart - s.insert;
	  s.ins_h = s.window[str];

	  /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
	  s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
//#if MIN_MATCH != 3
//        Call update_hash() MIN_MATCH-3 more times
//#endif
	  while (s.insert) {
		/* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
		s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH-1]) & s.hash_mask;

		s.prev[str & s.w_mask] = s.head[s.ins_h];
		s.head[s.ins_h] = str;
		str++;
		s.insert--;
		if (s.lookahead + s.insert < MIN_MATCH) {
		  break;
		}
	  }
	}
	/* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
	 * but this is not important since only literal bytes will be emitted.
	 */

  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

  /* If the WIN_INIT bytes after the end of the current data have never been
   * written, then zero those bytes in order to avoid memory check reports of
   * the use of uninitialized (or uninitialised as Julian writes) bytes by
   * the longest match routines.  Update the high water mark for the next
   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
   */
//  if (s.high_water < s.window_size) {
//    var curr = s.strstart + s.lookahead;
//    var init = 0;
//
//    if (s.high_water < curr) {
//      /* Previous high water mark below current data -- zero WIN_INIT
//       * bytes or up to end of window, whichever is less.
//       */
//      init = s.window_size - curr;
//      if (init > WIN_INIT)
//        init = WIN_INIT;
//      zmemzero(s->window + curr, (unsigned)init);
//      s->high_water = curr + init;
//    }
//    else if (s->high_water < (ulg)curr + WIN_INIT) {
//      /* High water mark at or above current data, but below current data
//       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
//       * to end of window, whichever is less.
//       */
//      init = (ulg)curr + WIN_INIT - s->high_water;
//      if (init > s->window_size - s->high_water)
//        init = s->window_size - s->high_water;
//      zmemzero(s->window + s->high_water, (unsigned)init);
//      s->high_water += init;
//    }
//  }
//
//  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
//    "not enough room for search");
}

/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 * This function does not insert new strings in the dictionary since
 * uncompressible data is probably not useful. This function is used
 * only for the level=0 compression option.
 * NOTE: this function should be optimized to avoid extra copying from
 * window to pending_buf.
 */
function deflate_stored(s, flush) {
  /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
   * to pending_buf_size, and each stored block has a 5 byte header:
   */
  var max_block_size = 0xffff;

  if (max_block_size > s.pending_buf_size - 5) {
	max_block_size = s.pending_buf_size - 5;
  }

  /* Copy as much as possible from input to output: */
  for (;;) {
	/* Fill the window as much as possible: */
	if (s.lookahead <= 1) {

	  //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
	  //  s->block_start >= (long)s->w_size, "slide too late");
//      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
//        s.block_start >= s.w_size)) {
//        throw  new Error("slide too late");
//      }

	  fill_window(s);
	  if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
		return BS_NEED_MORE;
	  }

	  if (s.lookahead === 0) {
		break;
	  }
	  /* flush the current block */
	}
	//Assert(s->block_start >= 0L, "block gone");
//    if (s.block_start < 0) throw new Error("block gone");

	s.strstart += s.lookahead;
	s.lookahead = 0;

	/* Emit a stored block if pending_buf will be full: */
	var max_start = s.block_start + max_block_size;

	if (s.strstart === 0 || s.strstart >= max_start) {
	  /* strstart == 0 is possible when wraparound on 16-bit machine */
	  s.lookahead = s.strstart - max_start;
	  s.strstart = max_start;
	  /*** FLUSH_BLOCK(s, 0); ***/
	  flush_block_only(s, false);
	  if (s.strm.avail_out === 0) {
		return BS_NEED_MORE;
	  }
	  /***/


	}
	/* Flush if we may have to slide, otherwise block_start may become
	 * negative and the data will be gone:
	 */
	if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
	  /*** FLUSH_BLOCK(s, 0); ***/
	  flush_block_only(s, false);
	  if (s.strm.avail_out === 0) {
		return BS_NEED_MORE;
	  }
	  /***/
	}
  }

  s.insert = 0;

  if (flush === Z_FINISH) {
	/*** FLUSH_BLOCK(s, 1); ***/
	flush_block_only(s, true);
	if (s.strm.avail_out === 0) {
	  return BS_FINISH_STARTED;
	}
	/***/
	return BS_FINISH_DONE;
  }

  if (s.strstart > s.block_start) {
	/*** FLUSH_BLOCK(s, 0); ***/
	flush_block_only(s, false);
	if (s.strm.avail_out === 0) {
	  return BS_NEED_MORE;
	}
	/***/
  }

  return BS_NEED_MORE;
}

/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
function deflate_fast(s, flush) {
  var hash_head;        /* head of the hash chain */
  var bflush;           /* set if current block must be flushed */

  for (;;) {
	/* Make sure that we always have enough lookahead, except
	 * at the end of the input file. We need MAX_MATCH bytes
	 * for the next match, plus MIN_MATCH bytes to insert the
	 * string following the next match.
	 */
	if (s.lookahead < MIN_LOOKAHEAD) {
	  fill_window(s);
	  if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
		return BS_NEED_MORE;
	  }
	  if (s.lookahead === 0) {
		break; /* flush the current block */
	  }
	}

	/* Insert the string window[strstart .. strstart+2] in the
	 * dictionary, and set hash_head to the head of the hash chain:
	 */
	hash_head = 0/*NIL*/;
	if (s.lookahead >= MIN_MATCH) {
	  /*** INSERT_STRING(s, s.strstart, hash_head); ***/
	  s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
	  hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
	  s.head[s.ins_h] = s.strstart;
	  /***/
	}

	/* Find the longest match, discarding those <= prev_length.
	 * At this point we have always match_length < MIN_MATCH
	 */
	if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
	  /* To simplify the code, we prevent matches with the string
	   * of window index 0 (in particular we have to avoid a match
	   * of the string with itself at the start of the input file).
	   */
	  s.match_length = longest_match(s, hash_head);
	  /* longest_match() sets match_start */
	}
	if (s.match_length >= MIN_MATCH) {
	  // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

	  /*** _tr_tally_dist(s, s.strstart - s.match_start,
					 s.match_length - MIN_MATCH, bflush); ***/
	  bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

	  s.lookahead -= s.match_length;

	  /* Insert new strings in the hash table only if the match length
	   * is not too large. This saves time but degrades compression.
	   */
	  if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
		s.match_length--; /* string at strstart already in table */
		do {
		  s.strstart++;
		  /*** INSERT_STRING(s, s.strstart, hash_head); ***/
		  s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
		  hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
		  s.head[s.ins_h] = s.strstart;
		  /***/
		  /* strstart never exceeds WSIZE-MAX_MATCH, so there are
		   * always MIN_MATCH bytes ahead.
		   */
		} while (--s.match_length !== 0);
		s.strstart++;
	  } else
	  {
		s.strstart += s.match_length;
		s.match_length = 0;
		s.ins_h = s.window[s.strstart];
		/* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
		s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

//#if MIN_MATCH != 3
//                Call UPDATE_HASH() MIN_MATCH-3 more times
//#endif
		/* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
		 * matter since it will be recomputed at next deflate call.
		 */
	  }
	} else {
	  /* No match, output a literal byte */
	  //Tracevv((stderr,"%c", s.window[s.strstart]));
	  /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
	  bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

	  s.lookahead--;
	  s.strstart++;
	}
	if (bflush) {
	  /*** FLUSH_BLOCK(s, 0); ***/
	  flush_block_only(s, false);
	  if (s.strm.avail_out === 0) {
		return BS_NEED_MORE;
	  }
	  /***/
	}
  }
  s.insert = ((s.strstart < (MIN_MATCH-1)) ? s.strstart : MIN_MATCH-1);
  if (flush === Z_FINISH) {
	/*** FLUSH_BLOCK(s, 1); ***/
	flush_block_only(s, true);
	if (s.strm.avail_out === 0) {
	  return BS_FINISH_STARTED;
	}
	/***/
	return BS_FINISH_DONE;
  }
  if (s.last_lit) {
	/*** FLUSH_BLOCK(s, 0); ***/
	flush_block_only(s, false);
	if (s.strm.avail_out === 0) {
	  return BS_NEED_MORE;
	}
	/***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
function deflate_slow(s, flush) {
  var hash_head;          /* head of hash chain */
  var bflush;              /* set if current block must be flushed */

  var max_insert;

  /* Process the input block. */
  for (;;) {
	/* Make sure that we always have enough lookahead, except
	 * at the end of the input file. We need MAX_MATCH bytes
	 * for the next match, plus MIN_MATCH bytes to insert the
	 * string following the next match.
	 */
	if (s.lookahead < MIN_LOOKAHEAD) {
	  fill_window(s);
	  if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
		return BS_NEED_MORE;
	  }
	  if (s.lookahead === 0) { break; } /* flush the current block */
	}

	/* Insert the string window[strstart .. strstart+2] in the
	 * dictionary, and set hash_head to the head of the hash chain:
	 */
	hash_head = 0/*NIL*/;
	if (s.lookahead >= MIN_MATCH) {
	  /*** INSERT_STRING(s, s.strstart, hash_head); ***/
	  s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
	  hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
	  s.head[s.ins_h] = s.strstart;
	  /***/
	}

	/* Find the longest match, discarding those <= prev_length.
	 */
	s.prev_length = s.match_length;
	s.prev_match = s.match_start;
	s.match_length = MIN_MATCH-1;

	if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
		s.strstart - hash_head <= (s.w_size-MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
	  /* To simplify the code, we prevent matches with the string
	   * of window index 0 (in particular we have to avoid a match
	   * of the string with itself at the start of the input file).
	   */
	  s.match_length = longest_match(s, hash_head);
	  /* longest_match() sets match_start */

	  if (s.match_length <= 5 &&
		 (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

		/* If prev_match is also MIN_MATCH, match_start is garbage
		 * but we will ignore the current match anyway.
		 */
		s.match_length = MIN_MATCH-1;
	  }
	}
	/* If there was a match at the previous step and the current
	 * match is not better, output the previous match:
	 */
	if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
	  max_insert = s.strstart + s.lookahead - MIN_MATCH;
	  /* Do not insert strings in hash table beyond this. */

	  //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

	  /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
					 s.prev_length - MIN_MATCH, bflush);***/
	  bflush = trees._tr_tally(s, s.strstart - 1- s.prev_match, s.prev_length - MIN_MATCH);
	  /* Insert in hash table all strings up to the end of the match.
	   * strstart-1 and strstart are already inserted. If there is not
	   * enough lookahead, the last two strings are not inserted in
	   * the hash table.
	   */
	  s.lookahead -= s.prev_length-1;
	  s.prev_length -= 2;
	  do {
		if (++s.strstart <= max_insert) {
		  /*** INSERT_STRING(s, s.strstart, hash_head); ***/
		  s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
		  hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
		  s.head[s.ins_h] = s.strstart;
		  /***/
		}
	  } while (--s.prev_length !== 0);
	  s.match_available = 0;
	  s.match_length = MIN_MATCH-1;
	  s.strstart++;

	  if (bflush) {
		/*** FLUSH_BLOCK(s, 0); ***/
		flush_block_only(s, false);
		if (s.strm.avail_out === 0) {
		  return BS_NEED_MORE;
		}
		/***/
	  }

	} else if (s.match_available) {
	  /* If there was no match at the previous position, output a
	   * single literal. If there was a match but the current match
	   * is longer, truncate the previous match to a single literal.
	   */
	  //Tracevv((stderr,"%c", s->window[s->strstart-1]));
	  /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
	  bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

	  if (bflush) {
		/*** FLUSH_BLOCK_ONLY(s, 0) ***/
		flush_block_only(s, false);
		/***/
	  }
	  s.strstart++;
	  s.lookahead--;
	  if (s.strm.avail_out === 0) {
		return BS_NEED_MORE;
	  }
	} else {
	  /* There is no previous match to compare with, wait for
	   * the next step to decide.
	   */
	  s.match_available = 1;
	  s.strstart++;
	  s.lookahead--;
	}
  }
  //Assert (flush != Z_NO_FLUSH, "no flush?");
  if (s.match_available) {
	//Tracevv((stderr,"%c", s->window[s->strstart-1]));
	/*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
	bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

	s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH-1 ? s.strstart : MIN_MATCH-1;
  if (flush === Z_FINISH) {
	/*** FLUSH_BLOCK(s, 1); ***/
	flush_block_only(s, true);
	if (s.strm.avail_out === 0) {
	  return BS_FINISH_STARTED;
	}
	/***/
	return BS_FINISH_DONE;
  }
  if (s.last_lit) {
	/*** FLUSH_BLOCK(s, 0); ***/
	flush_block_only(s, false);
	if (s.strm.avail_out === 0) {
	  return BS_NEED_MORE;
	}
	/***/
  }

  return BS_BLOCK_DONE;
}


/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */
function deflate_rle(s, flush) {
  var bflush;            /* set if current block must be flushed */
  var prev;              /* byte at distance one to match */
  var scan, strend;      /* scan goes up to strend for length of run */

  var _win = s.window;

  for (;;) {
	/* Make sure that we always have enough lookahead, except
	 * at the end of the input file. We need MAX_MATCH bytes
	 * for the longest run, plus one for the unrolled loop.
	 */
	if (s.lookahead <= MAX_MATCH) {
	  fill_window(s);
	  if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
		return BS_NEED_MORE;
	  }
	  if (s.lookahead === 0) { break; } /* flush the current block */
	}

	/* See how many times the previous byte repeats */
	s.match_length = 0;
	if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
	  scan = s.strstart - 1;
	  prev = _win[scan];
	  if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
		strend = s.strstart + MAX_MATCH;
		do {
		  /*jshint noempty:false*/
		} while (prev === _win[++scan] && prev === _win[++scan] &&
				 prev === _win[++scan] && prev === _win[++scan] &&
				 prev === _win[++scan] && prev === _win[++scan] &&
				 prev === _win[++scan] && prev === _win[++scan] &&
				 scan < strend);
		s.match_length = MAX_MATCH - (strend - scan);
		if (s.match_length > s.lookahead) {
		  s.match_length = s.lookahead;
		}
	  }
	  //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
	}

	/* Emit match if have run of MIN_MATCH or longer, else emit literal */
	if (s.match_length >= MIN_MATCH) {
	  //check_match(s, s.strstart, s.strstart - 1, s.match_length);

	  /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
	  bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

	  s.lookahead -= s.match_length;
	  s.strstart += s.match_length;
	  s.match_length = 0;
	} else {
	  /* No match, output a literal byte */
	  //Tracevv((stderr,"%c", s->window[s->strstart]));
	  /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
	  bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

	  s.lookahead--;
	  s.strstart++;
	}
	if (bflush) {
	  /*** FLUSH_BLOCK(s, 0); ***/
	  flush_block_only(s, false);
	  if (s.strm.avail_out === 0) {
		return BS_NEED_MORE;
	  }
	  /***/
	}
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
	/*** FLUSH_BLOCK(s, 1); ***/
	flush_block_only(s, true);
	if (s.strm.avail_out === 0) {
	  return BS_FINISH_STARTED;
	}
	/***/
	return BS_FINISH_DONE;
  }
  if (s.last_lit) {
	/*** FLUSH_BLOCK(s, 0); ***/
	flush_block_only(s, false);
	if (s.strm.avail_out === 0) {
	  return BS_NEED_MORE;
	}
	/***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */
function deflate_huff(s, flush) {
  var bflush;             /* set if current block must be flushed */

  for (;;) {
	/* Make sure that we have a literal to write. */
	if (s.lookahead === 0) {
	  fill_window(s);
	  if (s.lookahead === 0) {
		if (flush === Z_NO_FLUSH) {
		  return BS_NEED_MORE;
		}
		break;      /* flush the current block */
	  }
	}

	/* Output a literal byte */
	s.match_length = 0;
	//Tracevv((stderr,"%c", s->window[s->strstart]));
	/*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
	bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
	s.lookahead--;
	s.strstart++;
	if (bflush) {
	  /*** FLUSH_BLOCK(s, 0); ***/
	  flush_block_only(s, false);
	  if (s.strm.avail_out === 0) {
		return BS_NEED_MORE;
	  }
	  /***/
	}
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
	/*** FLUSH_BLOCK(s, 1); ***/
	flush_block_only(s, true);
	if (s.strm.avail_out === 0) {
	  return BS_FINISH_STARTED;
	}
	/***/
	return BS_FINISH_DONE;
  }
  if (s.last_lit) {
	/*** FLUSH_BLOCK(s, 0); ***/
	flush_block_only(s, false);
	if (s.strm.avail_out === 0) {
	  return BS_NEED_MORE;
	}
	/***/
  }
  return BS_BLOCK_DONE;
}

/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */
var Config = function (good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
};

var configuration_table;

configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

  new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
];


/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */
function lm_init(s) {
  s.window_size = 2 * s.w_size;

  /*** CLEAR_HASH(s); ***/
  zero(s.head); // Fill with NIL (= 0);

  /* Set the default configuration parameters:
   */
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;

  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
}


function DeflateState() {
  this.strm = null;            /* pointer back to this zlib stream */
  this.status = 0;            /* as the name implies */
  this.pending_buf = null;      /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = 0;       /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.gzhead = null;         /* gzip header information to write */
  this.gzindex = 0;           /* where in extra, name, or comment */
  this.method = Z_DEFLATED; /* can only be DEFLATED */
  this.last_flush = -1;   /* value of flush param for previous deflate call */

  this.w_size = 0;  /* LZ77 window size (32K by default) */
  this.w_bits = 0;  /* log2(w_size)  (8..16) */
  this.w_mask = 0;  /* w_size - 1 */

  this.window = null;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */

  this.window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */

  this.prev = null;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = null;   /* Heads of the hash chains or NIL. */

  this.ins_h = 0;       /* hash index of string to be inserted */
  this.hash_size = 0;   /* number of elements in hash table */
  this.hash_bits = 0;   /* log2(hash_size) */
  this.hash_mask = 0;   /* hash_size-1 */

  this.hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */

  this.block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */

  this.match_length = 0;      /* length of best match */
  this.prev_match = 0;        /* previous match */
  this.match_available = 0;   /* set if previous match exists */
  this.strstart = 0;          /* start of string to insert */
  this.match_start = 0;       /* start of matching string */
  this.lookahead = 0;         /* number of valid bytes ahead in window */

  this.prev_length = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */

  this.max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */

  this.max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  // That's alias to max_lazy_match, don't use directly
  //this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */

  this.level = 0;     /* compression level (1..9) */
  this.strategy = 0;  /* favor or force Huffman coding*/

  this.good_match = 0;
  /* Use a faster search when the previous match is longer than this */

  this.nice_match = 0; /* Stop searching when current match exceeds this */

			  /* used by trees.c: */

  /* Didn't use ct_data typedef below to suppress compiler warning */

  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

  // Use flat array of DOUBLE size, with interleaved fata,
  // because JS does not support effective
  this.dyn_ltree  = new utils.Buf16(HEAP_SIZE * 2);
  this.dyn_dtree  = new utils.Buf16((2*D_CODES+1) * 2);
  this.bl_tree    = new utils.Buf16((2*BL_CODES+1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);

  this.l_desc   = null;         /* desc. for literal tree */
  this.d_desc   = null;         /* desc. for distance tree */
  this.bl_desc  = null;         /* desc. for bit length tree */

  //ush bl_count[MAX_BITS+1];
  this.bl_count = new utils.Buf16(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
  this.heap = new utils.Buf16(2*L_CODES+1);  /* heap used to build the Huffman trees */
  zero(this.heap);

  this.heap_len = 0;               /* number of elements in the heap */
  this.heap_max = 0;               /* element of largest frequency */
  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
   * The same heap array is used to build all trees.
   */

  this.depth = new utils.Buf16(2*L_CODES+1); //uch depth[2*L_CODES+1];
  zero(this.depth);
  /* Depth of each subtree used as tie breaker for trees of equal frequency
   */

  this.l_buf = 0;          /* buffer index for literals or lengths */

  this.lit_bufsize = 0;
  /* Size of match buffer for literals/lengths.  There are 4 reasons for
   * limiting lit_bufsize to 64K:
   *   - frequencies can be kept in 16 bit counters
   *   - if compression is not successful for the first block, all input
   *     data is still in the window so we can still emit a stored block even
   *     when input comes from standard input.  (This can also be done for
   *     all blocks if lit_bufsize is not greater than 32K.)
   *   - if compression is not successful for a file smaller than 64K, we can
   *     even emit a stored file instead of a stored block (saving 5 bytes).
   *     This is applicable only for zip (not gzip or zlib).
   *   - creating new Huffman trees less frequently may not provide fast
   *     adaptation to changes in the input data statistics. (Take for
   *     example a binary file with poorly compressible code followed by
   *     a highly compressible string table.) Smaller buffer sizes give
   *     fast adaptation but have of course the overhead of transmitting
   *     trees more frequently.
   *   - I can't count above 4
   */

  this.last_lit = 0;      /* running index in l_buf */

  this.d_buf = 0;
  /* Buffer index for distances. To simplify the code, d_buf and l_buf have
   * the same number of elements. To use different lengths, an extra flag
   * array would be necessary.
   */

  this.opt_len = 0;       /* bit length of current block with optimal trees */
  this.static_len = 0;    /* bit length of current block with static trees */
  this.matches = 0;       /* number of string matches in current block */
  this.insert = 0;        /* bytes at end of window left to insert */


  this.bi_buf = 0;
  /* Output buffer. bits are inserted starting at the bottom (least
   * significant bits).
   */
  this.bi_valid = 0;
  /* Number of valid bits in bi_buf.  All bits above the last valid bit
   * are always zero.
   */

  // Used for window memory init. We safely ignore it for JS. That makes
  // sense only for pointers and memory check tools.
  //this.high_water = 0;
  /* High water mark offset in window for initialized bytes -- bytes above
   * this are set to zero in order to avoid memory check warnings when
   * longest match routines access bytes past the input.  This is then
   * updated to the new high water mark.
   */
}


function deflateResetKeep(strm) {
  var s;

  if (!strm || !strm.state) {
	return err(strm, Z_STREAM_ERROR);
  }

  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;

  s = strm.state;
  s.pending = 0;
  s.pending_out = 0;

  if (s.wrap < 0) {
	s.wrap = -s.wrap;
	/* was made negative by deflate(..., Z_FINISH); */
  }
  s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
  strm.adler = (s.wrap === 2) ?
	0  // crc32(0, Z_NULL, 0)
  :
	1; // adler32(0, Z_NULL, 0)
  s.last_flush = Z_NO_FLUSH;
  trees._tr_init(s);
  return Z_OK;
}


function deflateReset(strm) {
  var ret = deflateResetKeep(strm);
  if (ret === Z_OK) {
	lm_init(strm.state);
  }
  return ret;
}


function deflateSetHeader(strm, head) {
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
  strm.state.gzhead = head;
  return Z_OK;
}


function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
  if (!strm) { // === Z_NULL
	return Z_STREAM_ERROR;
  }
  var wrap = 1;

  if (level === Z_DEFAULT_COMPRESSION) {
	level = 6;
  }

  if (windowBits < 0) { /* suppress zlib wrapper */
	wrap = 0;
	windowBits = -windowBits;
  }

  else if (windowBits > 15) {
	wrap = 2;           /* write gzip wrapper instead */
	windowBits -= 16;
  }


  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
	windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
	strategy < 0 || strategy > Z_FIXED) {
	return err(strm, Z_STREAM_ERROR);
  }


  if (windowBits === 8) {
	windowBits = 9;
  }
  /* until 256-byte window bug fixed */

  var s = new DeflateState();

  strm.state = s;
  s.strm = strm;

  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;

  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

  s.window = new utils.Buf8(s.w_size * 2);
  s.head = new utils.Buf16(s.hash_size);
  s.prev = new utils.Buf16(s.w_size);

  // Don't need mem init magic for JS.
  //s.high_water = 0;  /* nothing written to s->window yet */

  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new utils.Buf8(s.pending_buf_size);

  s.d_buf = s.lit_bufsize >> 1;
  s.l_buf = (1 + 2) * s.lit_bufsize;

  s.level = level;
  s.strategy = strategy;
  s.method = method;

  return deflateReset(strm);
}

function deflateInit(strm, level) {
  return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
}


function deflate(strm, flush) {
  var old_flush, s;
  var beg, val; // for gzip header write only

  if (!strm || !strm.state ||
	flush > Z_BLOCK || flush < 0) {
	return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
  }

  s = strm.state;

  if (!strm.output ||
	  (!strm.input && strm.avail_in !== 0) ||
	  (s.status === FINISH_STATE && flush !== Z_FINISH)) {
	return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
  }

  s.strm = strm; /* just in case */
  old_flush = s.last_flush;
  s.last_flush = flush;

  /* Write the header */
  if (s.status === INIT_STATE) {

	if (s.wrap === 2) { // GZIP header
	  strm.adler = 0;  //crc32(0L, Z_NULL, 0);
	  put_byte(s, 31);
	  put_byte(s, 139);
	  put_byte(s, 8);
	  if (!s.gzhead) { // s->gzhead == Z_NULL
		put_byte(s, 0);
		put_byte(s, 0);
		put_byte(s, 0);
		put_byte(s, 0);
		put_byte(s, 0);
		put_byte(s, s.level === 9 ? 2 :
					(s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
					 4 : 0));
		put_byte(s, OS_CODE);
		s.status = BUSY_STATE;
	  }
	  else {
		put_byte(s, (s.gzhead.text ? 1 : 0) +
					(s.gzhead.hcrc ? 2 : 0) +
					(!s.gzhead.extra ? 0 : 4) +
					(!s.gzhead.name ? 0 : 8) +
					(!s.gzhead.comment ? 0 : 16)
				);
		put_byte(s, s.gzhead.time & 0xff);
		put_byte(s, (s.gzhead.time >> 8) & 0xff);
		put_byte(s, (s.gzhead.time >> 16) & 0xff);
		put_byte(s, (s.gzhead.time >> 24) & 0xff);
		put_byte(s, s.level === 9 ? 2 :
					(s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
					 4 : 0));
		put_byte(s, s.gzhead.os & 0xff);
		if (s.gzhead.extra && s.gzhead.extra.length) {
		  put_byte(s, s.gzhead.extra.length & 0xff);
		  put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
		}
		if (s.gzhead.hcrc) {
		  strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
		}
		s.gzindex = 0;
		s.status = EXTRA_STATE;
	  }
	}
	else // DEFLATE header
	{
	  var header = (Z_DEFLATED + ((s.w_bits - 8) << 4)) << 8;
	  var level_flags = -1;

	  if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
		level_flags = 0;
	  } else if (s.level < 6) {
		level_flags = 1;
	  } else if (s.level === 6) {
		level_flags = 2;
	  } else {
		level_flags = 3;
	  }
	  header |= (level_flags << 6);
	  if (s.strstart !== 0) { header |= PRESET_DICT; }
	  header += 31 - (header % 31);

	  s.status = BUSY_STATE;
	  putShortMSB(s, header);

	  /* Save the adler32 of the preset dictionary: */
	  if (s.strstart !== 0) {
		putShortMSB(s, strm.adler >>> 16);
		putShortMSB(s, strm.adler & 0xffff);
	  }
	  strm.adler = 1; // adler32(0L, Z_NULL, 0);
	}
  }

//#ifdef GZIP
  if (s.status === EXTRA_STATE) {
	if (s.gzhead.extra/* != Z_NULL*/) {
	  beg = s.pending;  /* start of bytes to update crc */

	  while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
		if (s.pending === s.pending_buf_size) {
		  if (s.gzhead.hcrc && s.pending > beg) {
			strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
		  }
		  flush_pending(strm);
		  beg = s.pending;
		  if (s.pending === s.pending_buf_size) {
			break;
		  }
		}
		put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
		s.gzindex++;
	  }
	  if (s.gzhead.hcrc && s.pending > beg) {
		strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
	  }
	  if (s.gzindex === s.gzhead.extra.length) {
		s.gzindex = 0;
		s.status = NAME_STATE;
	  }
	}
	else {
	  s.status = NAME_STATE;
	}
  }
  if (s.status === NAME_STATE) {
	if (s.gzhead.name/* != Z_NULL*/) {
	  beg = s.pending;  /* start of bytes to update crc */
	  //int val;

	  do {
		if (s.pending === s.pending_buf_size) {
		  if (s.gzhead.hcrc && s.pending > beg) {
			strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
		  }
		  flush_pending(strm);
		  beg = s.pending;
		  if (s.pending === s.pending_buf_size) {
			val = 1;
			break;
		  }
		}
		// JS specific: little magic to add zero terminator to end of string
		if (s.gzindex < s.gzhead.name.length) {
		  val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
		} else {
		  val = 0;
		}
		put_byte(s, val);
	  } while (val !== 0);

	  if (s.gzhead.hcrc && s.pending > beg){
		strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
	  }
	  if (val === 0) {
		s.gzindex = 0;
		s.status = COMMENT_STATE;
	  }
	}
	else {
	  s.status = COMMENT_STATE;
	}
  }
  if (s.status === COMMENT_STATE) {
	if (s.gzhead.comment/* != Z_NULL*/) {
	  beg = s.pending;  /* start of bytes to update crc */
	  //int val;

	  do {
		if (s.pending === s.pending_buf_size) {
		  if (s.gzhead.hcrc && s.pending > beg) {
			strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
		  }
		  flush_pending(strm);
		  beg = s.pending;
		  if (s.pending === s.pending_buf_size) {
			val = 1;
			break;
		  }
		}
		// JS specific: little magic to add zero terminator to end of string
		if (s.gzindex < s.gzhead.comment.length) {
		  val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
		} else {
		  val = 0;
		}
		put_byte(s, val);
	  } while (val !== 0);

	  if (s.gzhead.hcrc && s.pending > beg) {
		strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
	  }
	  if (val === 0) {
		s.status = HCRC_STATE;
	  }
	}
	else {
	  s.status = HCRC_STATE;
	}
  }
  if (s.status === HCRC_STATE) {
	if (s.gzhead.hcrc) {
	  if (s.pending + 2 > s.pending_buf_size) {
		flush_pending(strm);
	  }
	  if (s.pending + 2 <= s.pending_buf_size) {
		put_byte(s, strm.adler & 0xff);
		put_byte(s, (strm.adler >> 8) & 0xff);
		strm.adler = 0; //crc32(0L, Z_NULL, 0);
		s.status = BUSY_STATE;
	  }
	}
	else {
	  s.status = BUSY_STATE;
	}
  }
//#endif

  /* Flush as much pending output as possible */
  if (s.pending !== 0) {
	flush_pending(strm);
	if (strm.avail_out === 0) {
	  /* Since avail_out is 0, deflate will be called again with
	   * more output space, but possibly with both pending and
	   * avail_in equal to zero. There won't be anything to do,
	   * but this is not an error situation so make sure we
	   * return OK instead of BUF_ERROR at next call of deflate:
	   */
	  s.last_flush = -1;
	  return Z_OK;
	}

	/* Make sure there is something to do and avoid duplicate consecutive
	 * flushes. For repeated and useless calls with Z_FINISH, we keep
	 * returning Z_STREAM_END instead of Z_BUF_ERROR.
	 */
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
	flush !== Z_FINISH) {
	return err(strm, Z_BUF_ERROR);
  }

  /* User must not provide more input after the first FINISH: */
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
	return err(strm, Z_BUF_ERROR);
  }

  /* Start a new block or continue the current one.
   */
  if (strm.avail_in !== 0 || s.lookahead !== 0 ||
	(flush !== Z_NO_FLUSH && s.status !== FINISH_STATE)) {
	var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
	  (s.strategy === Z_RLE ? deflate_rle(s, flush) :
		configuration_table[s.level].func(s, flush));

	if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
	  s.status = FINISH_STATE;
	}
	if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
	  if (strm.avail_out === 0) {
		s.last_flush = -1;
		/* avoid BUF_ERROR next call, see above */
	  }
	  return Z_OK;
	  /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
	   * of deflate should use the same flush parameter to make sure
	   * that the flush is complete. So we don't have to output an
	   * empty block here, this will be done at next call. This also
	   * ensures that for a very small output buffer, we emit at most
	   * one empty block.
	   */
	}
	if (bstate === BS_BLOCK_DONE) {
	  if (flush === Z_PARTIAL_FLUSH) {
		trees._tr_align(s);
	  }
	  else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

		trees._tr_stored_block(s, 0, 0, false);
		/* For a full flush, this empty block will be recognized
		 * as a special marker by inflate_sync().
		 */
		if (flush === Z_FULL_FLUSH) {
		  /*** CLEAR_HASH(s); ***/             /* forget history */
		  zero(s.head); // Fill with NIL (= 0);

		  if (s.lookahead === 0) {
			s.strstart = 0;
			s.block_start = 0;
			s.insert = 0;
		  }
		}
	  }
	  flush_pending(strm);
	  if (strm.avail_out === 0) {
		s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
		return Z_OK;
	  }
	}
  }
  //Assert(strm->avail_out > 0, "bug2");
  //if (strm.avail_out <= 0) { throw new Error("bug2");}

  if (flush !== Z_FINISH) { return Z_OK; }
  if (s.wrap <= 0) { return Z_STREAM_END; }

  /* Write the trailer */
  if (s.wrap === 2) {
	put_byte(s, strm.adler & 0xff);
	put_byte(s, (strm.adler >> 8) & 0xff);
	put_byte(s, (strm.adler >> 16) & 0xff);
	put_byte(s, (strm.adler >> 24) & 0xff);
	put_byte(s, strm.total_in & 0xff);
	put_byte(s, (strm.total_in >> 8) & 0xff);
	put_byte(s, (strm.total_in >> 16) & 0xff);
	put_byte(s, (strm.total_in >> 24) & 0xff);
  }
  else
  {
	putShortMSB(s, strm.adler >>> 16);
	putShortMSB(s, strm.adler & 0xffff);
  }

  flush_pending(strm);
  /* If avail_out is zero, the application will call deflate again
   * to flush the rest.
   */
  if (s.wrap > 0) { s.wrap = -s.wrap; }
  /* write the trailer only once! */
  return s.pending !== 0 ? Z_OK : Z_STREAM_END;
}

function deflateEnd(strm) {
  var status;

  if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
	return Z_STREAM_ERROR;
  }

  status = strm.state.status;
  if (status !== INIT_STATE &&
	status !== EXTRA_STATE &&
	status !== NAME_STATE &&
	status !== COMMENT_STATE &&
	status !== HCRC_STATE &&
	status !== BUSY_STATE &&
	status !== FINISH_STATE
  ) {
	return err(strm, Z_STREAM_ERROR);
  }

  strm.state = null;

  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
}

/* =========================================================================
 * Copy the source state to the destination state
 */
//function deflateCopy(dest, source) {
//
//}

exports.deflateInit = deflateInit;
exports.deflateInit2 = deflateInit2;
exports.deflateReset = deflateReset;
exports.deflateResetKeep = deflateResetKeep;
exports.deflateSetHeader = deflateSetHeader;
exports.deflate = deflate;
exports.deflateEnd = deflateEnd;
exports.deflateInfo = 'pako deflate (from Nodeca project)';

/* Not implemented
exports.deflateBound = deflateBound;
exports.deflateCopy = deflateCopy;
exports.deflateSetDictionary = deflateSetDictionary;
exports.deflateParams = deflateParams;
exports.deflatePending = deflatePending;
exports.deflatePrime = deflatePrime;
exports.deflateTune = deflateTune;
*/
},{"../utils/common":27,"./adler32":29,"./crc32":31,"./messages":37,"./trees":38}],33:[function(_dereq_,module,exports){
'use strict';


function GZheader() {
  /* true if compressed data believed to be text */
  this.text       = 0;
  /* modification time */
  this.time       = 0;
  /* extra flags (not used when writing a gzip file) */
  this.xflags     = 0;
  /* operating system */
  this.os         = 0;
  /* pointer to extra field or Z_NULL if none */
  this.extra      = null;
  /* extra field length (valid if extra != Z_NULL) */
  this.extra_len  = 0; // Actually, we don't need it in JS,
					   // but leave for few code modifications

  //
  // Setup limits is not necessary because in js we should not preallocate memory 
  // for inflate use constant limit in 65536 bytes
  //

  /* space at extra (only when reading header) */
  // this.extra_max  = 0;
  /* pointer to zero-terminated file name or Z_NULL */
  this.name       = '';
  /* space at name (only when reading header) */
  // this.name_max   = 0;
  /* pointer to zero-terminated comment or Z_NULL */
  this.comment    = '';
  /* space at comment (only when reading header) */
  // this.comm_max   = 0;
  /* true if there was or will be a header crc */
  this.hcrc       = 0;
  /* true when done reading gzip header (not used when writing a gzip file) */
  this.done       = false;
}

module.exports = GZheader;
},{}],34:[function(_dereq_,module,exports){
'use strict';

// See state defs from inflate.js
var BAD = 30;       /* got a data error -- remain here until reset */
var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

/*
   Decode literal, length, and distance codes and write out the resulting
   literal and match bytes until either not enough input or output is
   available, an end-of-block is encountered, or a data error is encountered.
   When large enough input and output buffers are supplied to inflate(), for
   example, a 16K input buffer and a 64K output buffer, more than 95% of the
   inflate execution time is spent in this routine.

   Entry assumptions:

		state.mode === LEN
		strm.avail_in >= 6
		strm.avail_out >= 258
		start >= strm.avail_out
		state.bits < 8

   On return, state.mode is one of:

		LEN -- ran out of enough output space or enough available input
		TYPE -- reached end of block code, inflate() to interpret next block
		BAD -- error in block data

   Notes:

	- The maximum input bits used by a length/distance pair is 15 bits for the
	  length code, 5 bits for the length extra, 15 bits for the distance code,
	  and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
	  Therefore if strm.avail_in >= 6, then there is enough input to avoid
	  checking for available input while decoding.

	- The maximum bytes that a single length/distance pair can output is 258
	  bytes, which is the maximum length that can be coded.  inflate_fast()
	  requires strm.avail_out >= 258 for each loop to avoid checking for
	  output space.
 */
module.exports = function inflate_fast(strm, start) {
  var state;
  var _in;                    /* local strm.input */
  var last;                   /* have enough input while in < last */
  var _out;                   /* local strm.output */
  var beg;                    /* inflate()'s initial strm.output */
  var end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
  var dmax;                   /* maximum distance from zlib header */
//#endif
  var wsize;                  /* window size or zero if not using window */
  var whave;                  /* valid bytes in the window */
  var wnext;                  /* window write index */
  var window;                 /* allocated sliding window, if wsize != 0 */
  var hold;                   /* local strm.hold */
  var bits;                   /* local strm.bits */
  var lcode;                  /* local strm.lencode */
  var dcode;                  /* local strm.distcode */
  var lmask;                  /* mask for first level of length codes */
  var dmask;                  /* mask for first level of distance codes */
  var here;                   /* retrieved table entry */
  var op;                     /* code bits, operation, extra bits, or */
							  /*  window position, window bytes to copy */
  var len;                    /* match length, unused bytes */
  var dist;                   /* match distance */
  var from;                   /* where to copy match from */
  var from_source;


  var input, output; // JS specific, because we have no pointers

  /* copy state to local variables */
  state = strm.state;
  //here = state.here;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
  dmax = state.dmax;
//#endif
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;


  /* decode literals and length/distances until end-of-block or not enough
	 input data or output space */

  top:
  do {
	if (bits < 15) {
	  hold += input[_in++] << bits;
	  bits += 8;
	  hold += input[_in++] << bits;
	  bits += 8;
	}

	here = lcode[hold & lmask];

	dolen:
	for (;;) { // Goto emulation
	  op = here >>> 24/*here.bits*/;
	  hold >>>= op;
	  bits -= op;
	  op = (here >>> 16) & 0xff/*here.op*/;
	  if (op === 0) {                          /* literal */
		//Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
		//        "inflate:         literal '%c'\n" :
		//        "inflate:         literal 0x%02x\n", here.val));
		output[_out++] = here & 0xffff/*here.val*/;
	  }
	  else if (op & 16) {                     /* length base */
		len = here & 0xffff/*here.val*/;
		op &= 15;                           /* number of extra bits */
		if (op) {
		  if (bits < op) {
			hold += input[_in++] << bits;
			bits += 8;
		  }
		  len += hold & ((1 << op) - 1);
		  hold >>>= op;
		  bits -= op;
		}
		//Tracevv((stderr, "inflate:         length %u\n", len));
		if (bits < 15) {
		  hold += input[_in++] << bits;
		  bits += 8;
		  hold += input[_in++] << bits;
		  bits += 8;
		}
		here = dcode[hold & dmask];

		dodist:
		for (;;) { // goto emulation
		  op = here >>> 24/*here.bits*/;
		  hold >>>= op;
		  bits -= op;
		  op = (here >>> 16) & 0xff/*here.op*/;

		  if (op & 16) {                      /* distance base */
			dist = here & 0xffff/*here.val*/;
			op &= 15;                       /* number of extra bits */
			if (bits < op) {
			  hold += input[_in++] << bits;
			  bits += 8;
			  if (bits < op) {
				hold += input[_in++] << bits;
				bits += 8;
			  }
			}
			dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
			if (dist > dmax) {
			  strm.msg = 'invalid distance too far back';
			  state.mode = BAD;
			  break top;
			}
//#endif
			hold >>>= op;
			bits -= op;
			//Tracevv((stderr, "inflate:         distance %u\n", dist));
			op = _out - beg;                /* max distance in output */
			if (dist > op) {                /* see if copy from window */
			  op = dist - op;               /* distance back in window */
			  if (op > whave) {
				if (state.sane) {
				  strm.msg = 'invalid distance too far back';
				  state.mode = BAD;
				  break top;
				}

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
			  }
			  from = 0; // window index
			  from_source = window;
			  if (wnext === 0) {           /* very common case */
				from += wsize - op;
				if (op < len) {         /* some from window */
				  len -= op;
				  do {
					output[_out++] = window[from++];
				  } while (--op);
				  from = _out - dist;  /* rest from output */
				  from_source = output;
				}
			  }
			  else if (wnext < op) {      /* wrap around window */
				from += wsize + wnext - op;
				op -= wnext;
				if (op < len) {         /* some from end of window */
				  len -= op;
				  do {
					output[_out++] = window[from++];
				  } while (--op);
				  from = 0;
				  if (wnext < len) {  /* some from start of window */
					op = wnext;
					len -= op;
					do {
					  output[_out++] = window[from++];
					} while (--op);
					from = _out - dist;      /* rest from output */
					from_source = output;
				  }
				}
			  }
			  else {                      /* contiguous in window */
				from += wnext - op;
				if (op < len) {         /* some from window */
				  len -= op;
				  do {
					output[_out++] = window[from++];
				  } while (--op);
				  from = _out - dist;  /* rest from output */
				  from_source = output;
				}
			  }
			  while (len > 2) {
				output[_out++] = from_source[from++];
				output[_out++] = from_source[from++];
				output[_out++] = from_source[from++];
				len -= 3;
			  }
			  if (len) {
				output[_out++] = from_source[from++];
				if (len > 1) {
				  output[_out++] = from_source[from++];
				}
			  }
			}
			else {
			  from = _out - dist;          /* copy direct from output */
			  do {                        /* minimum length is three */
				output[_out++] = output[from++];
				output[_out++] = output[from++];
				output[_out++] = output[from++];
				len -= 3;
			  } while (len > 2);
			  if (len) {
				output[_out++] = output[from++];
				if (len > 1) {
				  output[_out++] = output[from++];
				}
			  }
			}
		  }
		  else if ((op & 64) === 0) {          /* 2nd level distance code */
			here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
			continue dodist;
		  }
		  else {
			strm.msg = 'invalid distance code';
			state.mode = BAD;
			break top;
		  }

		  break; // need to emulate goto via "continue"
		}
	  }
	  else if ((op & 64) === 0) {              /* 2nd level length code */
		here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
		continue dolen;
	  }
	  else if (op & 32) {                     /* end-of-block */
		//Tracevv((stderr, "inflate:         end of block\n"));
		state.mode = TYPE;
		break top;
	  }
	  else {
		strm.msg = 'invalid literal/length code';
		state.mode = BAD;
		break top;
	  }

	  break; // need to emulate goto via "continue"
	}
  } while (_in < last && _out < end);

  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;

  /* update state and return */
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
  state.hold = hold;
  state.bits = bits;
  return;
};

},{}],35:[function(_dereq_,module,exports){
'use strict';


var utils = _dereq_('../utils/common');
var adler32 = _dereq_('./adler32');
var crc32   = _dereq_('./crc32');
var inflate_fast = _dereq_('./inffast');
var inflate_table = _dereq_('./inftrees');

var CODES = 0;
var LENS = 1;
var DISTS = 2;

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;

/* The deflate compression method */
var Z_DEFLATED  = 8;


/* STATES ====================================================================*/
/* ===========================================================================*/


var    HEAD = 1;       /* i: waiting for magic header */
var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
var    TIME = 3;       /* i: waiting for modification time (gzip) */
var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
var    NAME = 7;       /* i: waiting for end of file name (gzip) */
var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
var    HCRC = 9;       /* i: waiting for header crc (gzip) */
var    DICTID = 10;    /* i: waiting for dictionary check value */
var    DICT = 11;      /* waiting for inflateSetDictionary() call */
var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
var        STORED = 14;    /* i: waiting for stored size (length and complement) */
var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
var        LENLENS = 18;   /* i: waiting for code length code lengths */
var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
var            LEN = 21;       /* i: waiting for length/lit/eob code */
var            LENEXT = 22;    /* i: waiting for length extra bits */
var            DIST = 23;      /* i: waiting for distance code */
var            DISTEXT = 24;   /* i: waiting for distance extra bits */
var            MATCH = 25;     /* o: waiting for output space to copy string */
var            LIT = 26;       /* o: waiting for output space to write literal */
var    CHECK = 27;     /* i: waiting for 32-bit check value */
var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
var    DONE = 29;      /* finished check, done -- remain here until reset */
var    BAD = 30;       /* got a data error -- remain here until reset */
var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/



var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_WBITS = MAX_WBITS;


function ZSWAP32(q) {
  return  (((q >>> 24) & 0xff) +
		  ((q >>> 8) & 0xff00) +
		  ((q & 0xff00) << 8) +
		  ((q & 0xff) << 24));
}


function InflateState() {
  this.mode = 0;             /* current inflate mode */
  this.last = false;          /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.havedict = false;      /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  // TODO: may be {}
  this.head = null;           /* where to save gzip header information */

  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = null;         /* allocated sliding window, if needed */

  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */

  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */

  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */

  /* fixed and dynamic code tables */
  this.lencode = null;          /* starting table for length/literal codes */
  this.distcode = null;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */

  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = null;              /* next available space in codes[] */

  this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
  this.work = new utils.Buf16(288); /* work area for code table building */

  /*
   because we don't have pointers in js, we use lencode and distcode directly
   as buffers so we don't need codes
  */
  //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
  this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
  this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */
}

function inflateResetKeep(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = ''; /*Z_NULL*/
  if (state.wrap) {       /* to support ill-conceived Java test suite */
	strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.dmax = 32768;
  state.head = null/*Z_NULL*/;
  state.hold = 0;
  state.bits = 0;
  //state.lencode = state.distcode = state.next = state.codes;
  state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
  state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);

  state.sane = 1;
  state.back = -1;
  //Tracev((stderr, "inflate: reset\n"));
  return Z_OK;
}

function inflateReset(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);

}

function inflateReset2(strm, windowBits) {
  var wrap;
  var state;

  /* get the state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;

  /* extract wrap request from windowBits parameter */
  if (windowBits < 0) {
	wrap = 0;
	windowBits = -windowBits;
  }
  else {
	wrap = (windowBits >> 4) + 1;
	if (windowBits < 48) {
	  windowBits &= 15;
	}
  }

  /* set number of window bits, free window if different */
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
	return Z_STREAM_ERROR;
  }
  if (state.window !== null && state.wbits !== windowBits) {
	state.window = null;
  }

  /* update state and reset the rest of it */
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
}

function inflateInit2(strm, windowBits) {
  var ret;
  var state;

  if (!strm) { return Z_STREAM_ERROR; }
  //strm.msg = Z_NULL;                 /* in case we return an error */

  state = new InflateState();

  //if (state === Z_NULL) return Z_MEM_ERROR;
  //Tracev((stderr, "inflate: allocated\n"));
  strm.state = state;
  state.window = null/*Z_NULL*/;
  ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK) {
	strm.state = null/*Z_NULL*/;
  }
  return ret;
}

function inflateInit(strm) {
  return inflateInit2(strm, DEF_WBITS);
}


/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
var virgin = true;

var lenfix, distfix; // We have no pointers in JS, so keep tables separate

function fixedtables(state) {
  /* build fixed huffman tables if first call (may not be thread safe) */
  if (virgin) {
	var sym;

	lenfix = new utils.Buf32(512);
	distfix = new utils.Buf32(32);

	/* literal/length table */
	sym = 0;
	while (sym < 144) { state.lens[sym++] = 8; }
	while (sym < 256) { state.lens[sym++] = 9; }
	while (sym < 280) { state.lens[sym++] = 7; }
	while (sym < 288) { state.lens[sym++] = 8; }

	inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, {bits: 9});

	/* distance table */
	sym = 0;
	while (sym < 32) { state.lens[sym++] = 5; }

	inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, {bits: 5});

	/* do this just once */
	virgin = false;
  }

  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
}


/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
function updatewindow(strm, src, end, copy) {
  var dist;
  var state = strm.state;

  /* if it hasn't been done already, allocate space for the window */
  if (state.window === null) {
	state.wsize = 1 << state.wbits;
	state.wnext = 0;
	state.whave = 0;

	state.window = new utils.Buf8(state.wsize);
  }

  /* copy state->wsize or less output bytes into the circular window */
  if (copy >= state.wsize) {
	utils.arraySet(state.window,src, end - state.wsize, state.wsize, 0);
	state.wnext = 0;
	state.whave = state.wsize;
  }
  else {
	dist = state.wsize - state.wnext;
	if (dist > copy) {
	  dist = copy;
	}
	//zmemcpy(state->window + state->wnext, end - copy, dist);
	utils.arraySet(state.window,src, end - copy, dist, state.wnext);
	copy -= dist;
	if (copy) {
	  //zmemcpy(state->window, end - copy, copy);
	  utils.arraySet(state.window,src, end - copy, copy, 0);
	  state.wnext = copy;
	  state.whave = state.wsize;
	}
	else {
	  state.wnext += dist;
	  if (state.wnext === state.wsize) { state.wnext = 0; }
	  if (state.whave < state.wsize) { state.whave += dist; }
	}
  }
  return 0;
}

function inflate(strm, flush) {
  var state;
  var input, output;          // input/output buffers
  var next;                   /* next input INDEX */
  var put;                    /* next output INDEX */
  var have, left;             /* available input and output */
  var hold;                   /* bit buffer */
  var bits;                   /* bits in bit buffer */
  var _in, _out;              /* save starting available input and output */
  var copy;                   /* number of stored or match bytes to copy */
  var from;                   /* where to copy match bytes from */
  var from_source;
  var here = 0;               /* current decoding table entry */
  var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
  //var last;                   /* parent table entry */
  var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
  var len;                    /* length to copy for repeats, bits to drop */
  var ret;                    /* return code */
  var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
  var opts;

  var n; // temporary var for NEED_BITS

  var order = /* permutation of code lengths */
	[16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];


  if (!strm || !strm.state || !strm.output ||
	  (!strm.input && strm.avail_in !== 0)) {
	return Z_STREAM_ERROR;
  }

  state = strm.state;
  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


  //--- LOAD() ---
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  //---

  _in = have;
  _out = left;
  ret = Z_OK;

  inf_leave: // goto emulation
  for (;;) {
	switch (state.mode) {
	case HEAD:
	  if (state.wrap === 0) {
		state.mode = TYPEDO;
		break;
	  }
	  //=== NEEDBITS(16);
	  while (bits < 16) {
		if (have === 0) { break inf_leave; }
		have--;
		hold += input[next++] << bits;
		bits += 8;
	  }
	  //===//
	  if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
		state.check = 0/*crc32(0L, Z_NULL, 0)*/;
		//=== CRC2(state.check, hold);
		hbuf[0] = hold & 0xff;
		hbuf[1] = (hold >>> 8) & 0xff;
		state.check = crc32(state.check, hbuf, 2, 0);
		//===//

		//=== INITBITS();
		hold = 0;
		bits = 0;
		//===//
		state.mode = FLAGS;
		break;
	  }
	  state.flags = 0;           /* expect zlib header */
	  if (state.head) {
		state.head.done = false;
	  }
	  if (!(state.wrap & 1) ||   /* check if zlib header allowed */
		(((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
		strm.msg = 'incorrect header check';
		state.mode = BAD;
		break;
	  }
	  if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
		strm.msg = 'unknown compression method';
		state.mode = BAD;
		break;
	  }
	  //--- DROPBITS(4) ---//
	  hold >>>= 4;
	  bits -= 4;
	  //---//
	  len = (hold & 0x0f)/*BITS(4)*/ + 8;
	  if (state.wbits === 0) {
		state.wbits = len;
	  }
	  else if (len > state.wbits) {
		strm.msg = 'invalid window size';
		state.mode = BAD;
		break;
	  }
	  state.dmax = 1 << len;
	  //Tracev((stderr, "inflate:   zlib header ok\n"));
	  strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
	  state.mode = hold & 0x200 ? DICTID : TYPE;
	  //=== INITBITS();
	  hold = 0;
	  bits = 0;
	  //===//
	  break;
	case FLAGS:
	  //=== NEEDBITS(16); */
	  while (bits < 16) {
		if (have === 0) { break inf_leave; }
		have--;
		hold += input[next++] << bits;
		bits += 8;
	  }
	  //===//
	  state.flags = hold;
	  if ((state.flags & 0xff) !== Z_DEFLATED) {
		strm.msg = 'unknown compression method';
		state.mode = BAD;
		break;
	  }
	  if (state.flags & 0xe000) {
		strm.msg = 'unknown header flags set';
		state.mode = BAD;
		break;
	  }
	  if (state.head) {
		state.head.text = ((hold >> 8) & 1);
	  }
	  if (state.flags & 0x0200) {
		//=== CRC2(state.check, hold);
		hbuf[0] = hold & 0xff;
		hbuf[1] = (hold >>> 8) & 0xff;
		state.check = crc32(state.check, hbuf, 2, 0);
		//===//
	  }
	  //=== INITBITS();
	  hold = 0;
	  bits = 0;
	  //===//
	  state.mode = TIME;
	  /* falls through */
	case TIME:
	  //=== NEEDBITS(32); */
	  while (bits < 32) {
		if (have === 0) { break inf_leave; }
		have--;
		hold += input[next++] << bits;
		bits += 8;
	  }
	  //===//
	  if (state.head) {
		state.head.time = hold;
	  }
	  if (state.flags & 0x0200) {
		//=== CRC4(state.check, hold)
		hbuf[0] = hold & 0xff;
		hbuf[1] = (hold >>> 8) & 0xff;
		hbuf[2] = (hold >>> 16) & 0xff;
		hbuf[3] = (hold >>> 24) & 0xff;
		state.check = crc32(state.check, hbuf, 4, 0);
		//===
	  }
	  //=== INITBITS();
	  hold = 0;
	  bits = 0;
	  //===//
	  state.mode = OS;
	  /* falls through */
	case OS:
	  //=== NEEDBITS(16); */
	  while (bits < 16) {
		if (have === 0) { break inf_leave; }
		have--;
		hold += input[next++] << bits;
		bits += 8;
	  }
	  //===//
	  if (state.head) {
		state.head.xflags = (hold & 0xff);
		state.head.os = (hold >> 8);
	  }
	  if (state.flags & 0x0200) {
		//=== CRC2(state.check, hold);
		hbuf[0] = hold & 0xff;
		hbuf[1] = (hold >>> 8) & 0xff;
		state.check = crc32(state.check, hbuf, 2, 0);
		//===//
	  }
	  //=== INITBITS();
	  hold = 0;
	  bits = 0;
	  //===//
	  state.mode = EXLEN;
	  /* falls through */
	case EXLEN:
	  if (state.flags & 0x0400) {
		//=== NEEDBITS(16); */
		while (bits < 16) {
		  if (have === 0) { break inf_leave; }
		  have--;
		  hold += input[next++] << bits;
		  bits += 8;
		}
		//===//
		state.length = hold;
		if (state.head) {
		  state.head.extra_len = hold;
		}
		if (state.flags & 0x0200) {
		  //=== CRC2(state.check, hold);
		  hbuf[0] = hold & 0xff;
		  hbuf[1] = (hold >>> 8) & 0xff;
		  state.check = crc32(state.check, hbuf, 2, 0);
		  //===//
		}
		//=== INITBITS();
		hold = 0;
		bits = 0;
		//===//
	  }
	  else if (state.head) {
		state.head.extra = null/*Z_NULL*/;
	  }
	  state.mode = EXTRA;
	  /* falls through */
	case EXTRA:
	  if (state.flags & 0x0400) {
		copy = state.length;
		if (copy > have) { copy = have; }
		if (copy) {
		  if (state.head) {
			len = state.head.extra_len - state.length;
			if (!state.head.extra) {
			  // Use untyped array for more conveniend processing later
			  state.head.extra = new Array(state.head.extra_len);
			}
			utils.arraySet(
			  state.head.extra,
			  input,
			  next,
			  // extra field is limited to 65536 bytes
			  // - no need for additional size check
			  copy,
			  /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
			  len
			);
			//zmemcpy(state.head.extra + len, next,
			//        len + copy > state.head.extra_max ?
			//        state.head.extra_max - len : copy);
		  }
		  if (state.flags & 0x0200) {
			state.check = crc32(state.check, input, copy, next);
		  }
		  have -= copy;
		  next += copy;
		  state.length -= copy;
		}
		if (state.length) { break inf_leave; }
	  }
	  state.length = 0;
	  state.mode = NAME;
	  /* falls through */
	case NAME:
	  if (state.flags & 0x0800) {
		if (have === 0) { break inf_leave; }
		copy = 0;
		do {
		  // TODO: 2 or 1 bytes?
		  len = input[next + copy++];
		  /* use constant limit because in js we should not preallocate memory */
		  if (state.head && len &&
			  (state.length < 65536 /*state.head.name_max*/)) {
			state.head.name += String.fromCharCode(len);
		  }
		} while (len && copy < have);

		if (state.flags & 0x0200) {
		  state.check = crc32(state.check, input, copy, next);
		}
		have -= copy;
		next += copy;
		if (len) { break inf_leave; }
	  }
	  else if (state.head) {
		state.head.name = null;
	  }
	  state.length = 0;
	  state.mode = COMMENT;
	  /* falls through */
	case COMMENT:
	  if (state.flags & 0x1000) {
		if (have === 0) { break inf_leave; }
		copy = 0;
		do {
		  len = input[next + copy++];
		  /* use constant limit because in js we should not preallocate memory */
		  if (state.head && len &&
			  (state.length < 65536 /*state.head.comm_max*/)) {
			state.head.comment += String.fromCharCode(len);
		  }
		} while (len && copy < have);
		if (state.flags & 0x0200) {
		  state.check = crc32(state.check, input, copy, next);
		}
		have -= copy;
		next += copy;
		if (len) { break inf_leave; }
	  }
	  else if (state.head) {
		state.head.comment = null;
	  }
	  state.mode = HCRC;
	  /* falls through */
	case HCRC:
	  if (state.flags & 0x0200) {
		//=== NEEDBITS(16); */
		while (bits < 16) {
		  if (have === 0) { break inf_leave; }
		  have--;
		  hold += input[next++] << bits;
		  bits += 8;
		}
		//===//
		if (hold !== (state.check & 0xffff)) {
		  strm.msg = 'header crc mismatch';
		  state.mode = BAD;
		  break;
		}
		//=== INITBITS();
		hold = 0;
		bits = 0;
		//===//
	  }
	  if (state.head) {
		state.head.hcrc = ((state.flags >> 9) & 1);
		state.head.done = true;
	  }
	  strm.adler = state.check = 0 /*crc32(0L, Z_NULL, 0)*/;
	  state.mode = TYPE;
	  break;
	case DICTID:
	  //=== NEEDBITS(32); */
	  while (bits < 32) {
		if (have === 0) { break inf_leave; }
		have--;
		hold += input[next++] << bits;
		bits += 8;
	  }
	  //===//
	  strm.adler = state.check = ZSWAP32(hold);
	  //=== INITBITS();
	  hold = 0;
	  bits = 0;
	  //===//
	  state.mode = DICT;
	  /* falls through */
	case DICT:
	  if (state.havedict === 0) {
		//--- RESTORE() ---
		strm.next_out = put;
		strm.avail_out = left;
		strm.next_in = next;
		strm.avail_in = have;
		state.hold = hold;
		state.bits = bits;
		//---
		return Z_NEED_DICT;
	  }
	  strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
	  state.mode = TYPE;
	  /* falls through */
	case TYPE:
	  if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
	  /* falls through */
	case TYPEDO:
	  if (state.last) {
		//--- BYTEBITS() ---//
		hold >>>= bits & 7;
		bits -= bits & 7;
		//---//
		state.mode = CHECK;
		break;
	  }
	  //=== NEEDBITS(3); */
	  while (bits < 3) {
		if (have === 0) { break inf_leave; }
		have--;
		hold += input[next++] << bits;
		bits += 8;
	  }
	  //===//
	  state.last = (hold & 0x01)/*BITS(1)*/;
	  //--- DROPBITS(1) ---//
	  hold >>>= 1;
	  bits -= 1;
	  //---//

	  switch ((hold & 0x03)/*BITS(2)*/) {
	  case 0:                             /* stored block */
		//Tracev((stderr, "inflate:     stored block%s\n",
		//        state.last ? " (last)" : ""));
		state.mode = STORED;
		break;
	  case 1:                             /* fixed block */
		fixedtables(state);
		//Tracev((stderr, "inflate:     fixed codes block%s\n",
		//        state.last ? " (last)" : ""));
		state.mode = LEN_;             /* decode codes */
		if (flush === Z_TREES) {
		  //--- DROPBITS(2) ---//
		  hold >>>= 2;
		  bits -= 2;
		  //---//
		  break inf_leave;
		}
		break;
	  case 2:                             /* dynamic block */
		//Tracev((stderr, "inflate:     dynamic codes block%s\n",
		//        state.last ? " (last)" : ""));
		state.mode = TABLE;
		break;
	  case 3:
		strm.msg = 'invalid block type';
		state.mode = BAD;
	  }
	  //--- DROPBITS(2) ---//
	  hold >>>= 2;
	  bits -= 2;
	  //---//
	  break;
	case STORED:
	  //--- BYTEBITS() ---// /* go to byte boundary */
	  hold >>>= bits & 7;
	  bits -= bits & 7;
	  //---//
	  //=== NEEDBITS(32); */
	  while (bits < 32) {
		if (have === 0) { break inf_leave; }
		have--;
		hold += input[next++] << bits;
		bits += 8;
	  }
	  //===//
	  if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
		strm.msg = 'invalid stored block lengths';
		state.mode = BAD;
		break;
	  }
	  state.length = hold & 0xffff;
	  //Tracev((stderr, "inflate:       stored length %u\n",
	  //        state.length));
	  //=== INITBITS();
	  hold = 0;
	  bits = 0;
	  //===//
	  state.mode = COPY_;
	  if (flush === Z_TREES) { break inf_leave; }
	  /* falls through */
	case COPY_:
	  state.mode = COPY;
	  /* falls through */
	case COPY:
	  copy = state.length;
	  if (copy) {
		if (copy > have) { copy = have; }
		if (copy > left) { copy = left; }
		if (copy === 0) { break inf_leave; }
		//--- zmemcpy(put, next, copy); ---
		utils.arraySet(output, input, next, copy, put);
		//---//
		have -= copy;
		next += copy;
		left -= copy;
		put += copy;
		state.length -= copy;
		break;
	  }
	  //Tracev((stderr, "inflate:       stored end\n"));
	  state.mode = TYPE;
	  break;
	case TABLE:
	  //=== NEEDBITS(14); */
	  while (bits < 14) {
		if (have === 0) { break inf_leave; }
		have--;
		hold += input[next++] << bits;
		bits += 8;
	  }
	  //===//
	  state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
	  //--- DROPBITS(5) ---//
	  hold >>>= 5;
	  bits -= 5;
	  //---//
	  state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
	  //--- DROPBITS(5) ---//
	  hold >>>= 5;
	  bits -= 5;
	  //---//
	  state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
	  //--- DROPBITS(4) ---//
	  hold >>>= 4;
	  bits -= 4;
	  //---//
//#ifndef PKZIP_BUG_WORKAROUND
	  if (state.nlen > 286 || state.ndist > 30) {
		strm.msg = 'too many length or distance symbols';
		state.mode = BAD;
		break;
	  }
//#endif
	  //Tracev((stderr, "inflate:       table sizes ok\n"));
	  state.have = 0;
	  state.mode = LENLENS;
	  /* falls through */
	case LENLENS:
	  while (state.have < state.ncode) {
		//=== NEEDBITS(3);
		while (bits < 3) {
		  if (have === 0) { break inf_leave; }
		  have--;
		  hold += input[next++] << bits;
		  bits += 8;
		}
		//===//
		state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
		//--- DROPBITS(3) ---//
		hold >>>= 3;
		bits -= 3;
		//---//
	  }
	  while (state.have < 19) {
		state.lens[order[state.have++]] = 0;
	  }
	  // We have separate tables & no pointers. 2 commented lines below not needed.
	  //state.next = state.codes;
	  //state.lencode = state.next;
	  // Switch to use dynamic table
	  state.lencode = state.lendyn;
	  state.lenbits = 7;

	  opts = {bits: state.lenbits};
	  ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
	  state.lenbits = opts.bits;

	  if (ret) {
		strm.msg = 'invalid code lengths set';
		state.mode = BAD;
		break;
	  }
	  //Tracev((stderr, "inflate:       code lengths ok\n"));
	  state.have = 0;
	  state.mode = CODELENS;
	  /* falls through */
	case CODELENS:
	  while (state.have < state.nlen + state.ndist) {
		for (;;) {
		  here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
		  here_bits = here >>> 24;
		  here_op = (here >>> 16) & 0xff;
		  here_val = here & 0xffff;

		  if ((here_bits) <= bits) { break; }
		  //--- PULLBYTE() ---//
		  if (have === 0) { break inf_leave; }
		  have--;
		  hold += input[next++] << bits;
		  bits += 8;
		  //---//
		}
		if (here_val < 16) {
		  //--- DROPBITS(here.bits) ---//
		  hold >>>= here_bits;
		  bits -= here_bits;
		  //---//
		  state.lens[state.have++] = here_val;
		}
		else {
		  if (here_val === 16) {
			//=== NEEDBITS(here.bits + 2);
			n = here_bits + 2;
			while (bits < n) {
			  if (have === 0) { break inf_leave; }
			  have--;
			  hold += input[next++] << bits;
			  bits += 8;
			}
			//===//
			//--- DROPBITS(here.bits) ---//
			hold >>>= here_bits;
			bits -= here_bits;
			//---//
			if (state.have === 0) {
			  strm.msg = 'invalid bit length repeat';
			  state.mode = BAD;
			  break;
			}
			len = state.lens[state.have - 1];
			copy = 3 + (hold & 0x03);//BITS(2);
			//--- DROPBITS(2) ---//
			hold >>>= 2;
			bits -= 2;
			//---//
		  }
		  else if (here_val === 17) {
			//=== NEEDBITS(here.bits + 3);
			n = here_bits + 3;
			while (bits < n) {
			  if (have === 0) { break inf_leave; }
			  have--;
			  hold += input[next++] << bits;
			  bits += 8;
			}
			//===//
			//--- DROPBITS(here.bits) ---//
			hold >>>= here_bits;
			bits -= here_bits;
			//---//
			len = 0;
			copy = 3 + (hold & 0x07);//BITS(3);
			//--- DROPBITS(3) ---//
			hold >>>= 3;
			bits -= 3;
			//---//
		  }
		  else {
			//=== NEEDBITS(here.bits + 7);
			n = here_bits + 7;
			while (bits < n) {
			  if (have === 0) { break inf_leave; }
			  have--;
			  hold += input[next++] << bits;
			  bits += 8;
			}
			//===//
			//--- DROPBITS(here.bits) ---//
			hold >>>= here_bits;
			bits -= here_bits;
			//---//
			len = 0;
			copy = 11 + (hold & 0x7f);//BITS(7);
			//--- DROPBITS(7) ---//
			hold >>>= 7;
			bits -= 7;
			//---//
		  }
		  if (state.have + copy > state.nlen + state.ndist) {
			strm.msg = 'invalid bit length repeat';
			state.mode = BAD;
			break;
		  }
		  while (copy--) {
			state.lens[state.have++] = len;
		  }
		}
	  }

	  /* handle error breaks in while */
	  if (state.mode === BAD) { break; }

	  /* check for end-of-block code (better have one) */
	  if (state.lens[256] === 0) {
		strm.msg = 'invalid code -- missing end-of-block';
		state.mode = BAD;
		break;
	  }

	  /* build code tables -- note: do not change the lenbits or distbits
		 values here (9 and 6) without reading the comments in inftrees.h
		 concerning the ENOUGH constants, which depend on those values */
	  state.lenbits = 9;

	  opts = {bits: state.lenbits};
	  ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
	  // We have separate tables & no pointers. 2 commented lines below not needed.
	  // state.next_index = opts.table_index;
	  state.lenbits = opts.bits;
	  // state.lencode = state.next;

	  if (ret) {
		strm.msg = 'invalid literal/lengths set';
		state.mode = BAD;
		break;
	  }

	  state.distbits = 6;
	  //state.distcode.copy(state.codes);
	  // Switch to use dynamic table
	  state.distcode = state.distdyn;
	  opts = {bits: state.distbits};
	  ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
	  // We have separate tables & no pointers. 2 commented lines below not needed.
	  // state.next_index = opts.table_index;
	  state.distbits = opts.bits;
	  // state.distcode = state.next;

	  if (ret) {
		strm.msg = 'invalid distances set';
		state.mode = BAD;
		break;
	  }
	  //Tracev((stderr, 'inflate:       codes ok\n'));
	  state.mode = LEN_;
	  if (flush === Z_TREES) { break inf_leave; }
	  /* falls through */
	case LEN_:
	  state.mode = LEN;
	  /* falls through */
	case LEN:
	  if (have >= 6 && left >= 258) {
		//--- RESTORE() ---
		strm.next_out = put;
		strm.avail_out = left;
		strm.next_in = next;
		strm.avail_in = have;
		state.hold = hold;
		state.bits = bits;
		//---
		inflate_fast(strm, _out);
		//--- LOAD() ---
		put = strm.next_out;
		output = strm.output;
		left = strm.avail_out;
		next = strm.next_in;
		input = strm.input;
		have = strm.avail_in;
		hold = state.hold;
		bits = state.bits;
		//---

		if (state.mode === TYPE) {
		  state.back = -1;
		}
		break;
	  }
	  state.back = 0;
	  for (;;) {
		here = state.lencode[hold & ((1 << state.lenbits) -1)];  /*BITS(state.lenbits)*/
		here_bits = here >>> 24;
		here_op = (here >>> 16) & 0xff;
		here_val = here & 0xffff;

		if (here_bits <= bits) { break; }
		//--- PULLBYTE() ---//
		if (have === 0) { break inf_leave; }
		have--;
		hold += input[next++] << bits;
		bits += 8;
		//---//
	  }
	  if (here_op && (here_op & 0xf0) === 0) {
		last_bits = here_bits;
		last_op = here_op;
		last_val = here_val;
		for (;;) {
		  here = state.lencode[last_val +
				  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
		  here_bits = here >>> 24;
		  here_op = (here >>> 16) & 0xff;
		  here_val = here & 0xffff;

		  if ((last_bits + here_bits) <= bits) { break; }
		  //--- PULLBYTE() ---//
		  if (have === 0) { break inf_leave; }
		  have--;
		  hold += input[next++] << bits;
		  bits += 8;
		  //---//
		}
		//--- DROPBITS(last.bits) ---//
		hold >>>= last_bits;
		bits -= last_bits;
		//---//
		state.back += last_bits;
	  }
	  //--- DROPBITS(here.bits) ---//
	  hold >>>= here_bits;
	  bits -= here_bits;
	  //---//
	  state.back += here_bits;
	  state.length = here_val;
	  if (here_op === 0) {
		//Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
		//        "inflate:         literal '%c'\n" :
		//        "inflate:         literal 0x%02x\n", here.val));
		state.mode = LIT;
		break;
	  }
	  if (here_op & 32) {
		//Tracevv((stderr, "inflate:         end of block\n"));
		state.back = -1;
		state.mode = TYPE;
		break;
	  }
	  if (here_op & 64) {
		strm.msg = 'invalid literal/length code';
		state.mode = BAD;
		break;
	  }
	  state.extra = here_op & 15;
	  state.mode = LENEXT;
	  /* falls through */
	case LENEXT:
	  if (state.extra) {
		//=== NEEDBITS(state.extra);
		n = state.extra;
		while (bits < n) {
		  if (have === 0) { break inf_leave; }
		  have--;
		  hold += input[next++] << bits;
		  bits += 8;
		}
		//===//
		state.length += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
		//--- DROPBITS(state.extra) ---//
		hold >>>= state.extra;
		bits -= state.extra;
		//---//
		state.back += state.extra;
	  }
	  //Tracevv((stderr, "inflate:         length %u\n", state.length));
	  state.was = state.length;
	  state.mode = DIST;
	  /* falls through */
	case DIST:
	  for (;;) {
		here = state.distcode[hold & ((1 << state.distbits) -1)];/*BITS(state.distbits)*/
		here_bits = here >>> 24;
		here_op = (here >>> 16) & 0xff;
		here_val = here & 0xffff;

		if ((here_bits) <= bits) { break; }
		//--- PULLBYTE() ---//
		if (have === 0) { break inf_leave; }
		have--;
		hold += input[next++] << bits;
		bits += 8;
		//---//
	  }
	  if ((here_op & 0xf0) === 0) {
		last_bits = here_bits;
		last_op = here_op;
		last_val = here_val;
		for (;;) {
		  here = state.distcode[last_val +
				  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
		  here_bits = here >>> 24;
		  here_op = (here >>> 16) & 0xff;
		  here_val = here & 0xffff;

		  if ((last_bits + here_bits) <= bits) { break; }
		  //--- PULLBYTE() ---//
		  if (have === 0) { break inf_leave; }
		  have--;
		  hold += input[next++] << bits;
		  bits += 8;
		  //---//
		}
		//--- DROPBITS(last.bits) ---//
		hold >>>= last_bits;
		bits -= last_bits;
		//---//
		state.back += last_bits;
	  }
	  //--- DROPBITS(here.bits) ---//
	  hold >>>= here_bits;
	  bits -= here_bits;
	  //---//
	  state.back += here_bits;
	  if (here_op & 64) {
		strm.msg = 'invalid distance code';
		state.mode = BAD;
		break;
	  }
	  state.offset = here_val;
	  state.extra = (here_op) & 15;
	  state.mode = DISTEXT;
	  /* falls through */
	case DISTEXT:
	  if (state.extra) {
		//=== NEEDBITS(state.extra);
		n = state.extra;
		while (bits < n) {
		  if (have === 0) { break inf_leave; }
		  have--;
		  hold += input[next++] << bits;
		  bits += 8;
		}
		//===//
		state.offset += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
		//--- DROPBITS(state.extra) ---//
		hold >>>= state.extra;
		bits -= state.extra;
		//---//
		state.back += state.extra;
	  }
//#ifdef INFLATE_STRICT
	  if (state.offset > state.dmax) {
		strm.msg = 'invalid distance too far back';
		state.mode = BAD;
		break;
	  }
//#endif
	  //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
	  state.mode = MATCH;
	  /* falls through */
	case MATCH:
	  if (left === 0) { break inf_leave; }
	  copy = _out - left;
	  if (state.offset > copy) {         /* copy from window */
		copy = state.offset - copy;
		if (copy > state.whave) {
		  if (state.sane) {
			strm.msg = 'invalid distance too far back';
			state.mode = BAD;
			break;
		  }
// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
		}
		if (copy > state.wnext) {
		  copy -= state.wnext;
		  from = state.wsize - copy;
		}
		else {
		  from = state.wnext - copy;
		}
		if (copy > state.length) { copy = state.length; }
		from_source = state.window;
	  }
	  else {                              /* copy from output */
		from_source = output;
		from = put - state.offset;
		copy = state.length;
	  }
	  if (copy > left) { copy = left; }
	  left -= copy;
	  state.length -= copy;
	  do {
		output[put++] = from_source[from++];
	  } while (--copy);
	  if (state.length === 0) { state.mode = LEN; }
	  break;
	case LIT:
	  if (left === 0) { break inf_leave; }
	  output[put++] = state.length;
	  left--;
	  state.mode = LEN;
	  break;
	case CHECK:
	  if (state.wrap) {
		//=== NEEDBITS(32);
		while (bits < 32) {
		  if (have === 0) { break inf_leave; }
		  have--;
		  // Use '|' insdead of '+' to make sure that result is signed
		  hold |= input[next++] << bits;
		  bits += 8;
		}
		//===//
		_out -= left;
		strm.total_out += _out;
		state.total += _out;
		if (_out) {
		  strm.adler = state.check =
			  /*UPDATE(state.check, put - _out, _out);*/
			  (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

		}
		_out = left;
		// NB: crc32 stored as signed 32-bit int, ZSWAP32 returns signed too
		if ((state.flags ? hold : ZSWAP32(hold)) !== state.check) {
		  strm.msg = 'incorrect data check';
		  state.mode = BAD;
		  break;
		}
		//=== INITBITS();
		hold = 0;
		bits = 0;
		//===//
		//Tracev((stderr, "inflate:   check matches trailer\n"));
	  }
	  state.mode = LENGTH;
	  /* falls through */
	case LENGTH:
	  if (state.wrap && state.flags) {
		//=== NEEDBITS(32);
		while (bits < 32) {
		  if (have === 0) { break inf_leave; }
		  have--;
		  hold += input[next++] << bits;
		  bits += 8;
		}
		//===//
		if (hold !== (state.total & 0xffffffff)) {
		  strm.msg = 'incorrect length check';
		  state.mode = BAD;
		  break;
		}
		//=== INITBITS();
		hold = 0;
		bits = 0;
		//===//
		//Tracev((stderr, "inflate:   length matches trailer\n"));
	  }
	  state.mode = DONE;
	  /* falls through */
	case DONE:
	  ret = Z_STREAM_END;
	  break inf_leave;
	case BAD:
	  ret = Z_DATA_ERROR;
	  break inf_leave;
	case MEM:
	  return Z_MEM_ERROR;
	case SYNC:
	  /* falls through */
	default:
	  return Z_STREAM_ERROR;
	}
  }

  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

  /*
	 Return from inflate(), updating the total counts and the check value.
	 If there was no progress during the inflate() call, return a buffer
	 error.  Call updatewindow() to create and/or update the window state.
	 Note: a memory error from inflate() is non-recoverable.
   */

  //--- RESTORE() ---
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  //---

  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
					  (state.mode < CHECK || flush !== Z_FINISH))) {
	if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
	  state.mode = MEM;
	  return Z_MEM_ERROR;
	}
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap && _out) {
	strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
	  (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) +
					(state.mode === TYPE ? 128 : 0) +
					(state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
	ret = Z_BUF_ERROR;
  }
  return ret;
}

function inflateEnd(strm) {

  if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
	return Z_STREAM_ERROR;
  }

  var state = strm.state;
  if (state.window) {
	state.window = null;
  }
  strm.state = null;
  return Z_OK;
}

function inflateGetHeader(strm, head) {
  var state;

  /* check state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

  /* save header structure */
  state.head = head;
  head.done = false;
  return Z_OK;
}


exports.inflateReset = inflateReset;
exports.inflateReset2 = inflateReset2;
exports.inflateResetKeep = inflateResetKeep;
exports.inflateInit = inflateInit;
exports.inflateInit2 = inflateInit2;
exports.inflate = inflate;
exports.inflateEnd = inflateEnd;
exports.inflateGetHeader = inflateGetHeader;
exports.inflateInfo = 'pako inflate (from Nodeca project)';

/* Not implemented
exports.inflateCopy = inflateCopy;
exports.inflateGetDictionary = inflateGetDictionary;
exports.inflateMark = inflateMark;
exports.inflatePrime = inflatePrime;
exports.inflateSetDictionary = inflateSetDictionary;
exports.inflateSync = inflateSync;
exports.inflateSyncPoint = inflateSyncPoint;
exports.inflateUndermine = inflateUndermine;
*/
},{"../utils/common":27,"./adler32":29,"./crc32":31,"./inffast":34,"./inftrees":36}],36:[function(_dereq_,module,exports){
'use strict';


var utils = _dereq_('../utils/common');

var MAXBITS = 15;
var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

var CODES = 0;
var LENS = 1;
var DISTS = 2;

var lbase = [ /* Length codes 257..285 base */
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
];

var lext = [ /* Length codes 257..285 extra */
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
];

var dbase = [ /* Distance codes 0..29 base */
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577, 0, 0
];

var dext = [ /* Distance codes 0..29 extra */
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
  28, 28, 29, 29, 64, 64
];

module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
{
  var bits = opts.bits;
	  //here = opts.here; /* table entry for duplication */

  var len = 0;               /* a code's length in bits */
  var sym = 0;               /* index of code symbols */
  var min = 0, max = 0;          /* minimum and maximum code lengths */
  var root = 0;              /* number of index bits for root table */
  var curr = 0;              /* number of index bits for current table */
  var drop = 0;              /* code bits to drop for sub-table */
  var left = 0;                   /* number of prefix codes available */
  var used = 0;              /* code entries in table used */
  var huff = 0;              /* Huffman code */
  var incr;              /* for incrementing code, index */
  var fill;              /* index for replicating entries */
  var low;               /* low bits for current root entry */
  var mask;              /* mask for low root bits */
  var next;             /* next available space in table */
  var base = null;     /* base value table to use */
  var base_index = 0;
//  var shoextra;    /* extra bits table to use */
  var end;                    /* use base and extra for symbol > end */
  var count = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];    /* number of codes of each length */
  var offs = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];     /* offsets in table for each length */
  var extra = null;
  var extra_index = 0;

  var here_bits, here_op, here_val;

  /*
   Process a set of code lengths to create a canonical Huffman code.  The
   code lengths are lens[0..codes-1].  Each length corresponds to the
   symbols 0..codes-1.  The Huffman code is generated by first sorting the
   symbols by length from short to long, and retaining the symbol order
   for codes with equal lengths.  Then the code starts with all zero bits
   for the first code of the shortest length, and the codes are integer
   increments for the same length, and zeros are appended as the length
   increases.  For the deflate format, these bits are stored backwards
   from their more natural integer increment ordering, and so when the
   decoding tables are built in the large loop below, the integer codes
   are incremented backwards.

   This routine assumes, but does not check, that all of the entries in
   lens[] are in the range 0..MAXBITS.  The caller must assure this.
   1..MAXBITS is interpreted as that code length.  zero means that that
   symbol does not occur in this code.

   The codes are sorted by computing a count of codes for each length,
   creating from that a table of starting indices for each length in the
   sorted table, and then entering the symbols in order in the sorted
   table.  The sorted table is work[], with that space being provided by
   the caller.

   The length counts are used for other purposes as well, i.e. finding
   the minimum and maximum length codes, determining if there are any
   codes at all, checking for a valid set of lengths, and looking ahead
   at length counts to determine sub-table sizes when building the
   decoding tables.
   */

  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
  for (len = 0; len <= MAXBITS; len++) {
	count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
	count[lens[lens_index + sym]]++;
  }

  /* bound code lengths, force root to be within code lengths */
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
	if (count[max] !== 0) { break; }
  }
  if (root > max) {
	root = max;
  }
  if (max === 0) {                     /* no symbols to code at all */
	//table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
	//table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
	//table.val[opts.table_index++] = 0;   //here.val = (var short)0;
	table[table_index++] = (1 << 24) | (64 << 16) | 0;


	//table.op[opts.table_index] = 64;
	//table.bits[opts.table_index] = 1;
	//table.val[opts.table_index++] = 0;
	table[table_index++] = (1 << 24) | (64 << 16) | 0;

	opts.bits = 1;
	return 0;     /* no symbols, but wait for decoding to report error */
  }
  for (min = 1; min < max; min++) {
	if (count[min] !== 0) { break; }
  }
  if (root < min) {
	root = min;
  }

  /* check for an over-subscribed or incomplete set of lengths */
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
	left <<= 1;
	left -= count[len];
	if (left < 0) {
	  return -1;
	}        /* over-subscribed */
  }
  if (left > 0 && (type === CODES || max !== 1)) {
	return -1;                      /* incomplete set */
  }

  /* generate offsets into symbol table for each length for sorting */
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
	offs[len + 1] = offs[len] + count[len];
  }

  /* sort symbols by length, by symbol order within each length */
  for (sym = 0; sym < codes; sym++) {
	if (lens[lens_index + sym] !== 0) {
	  work[offs[lens[lens_index + sym]]++] = sym;
	}
  }

  /*
   Create and fill in decoding tables.  In this loop, the table being
   filled is at next and has curr index bits.  The code being used is huff
   with length len.  That code is converted to an index by dropping drop
   bits off of the bottom.  For codes where len is less than drop + curr,
   those top drop + curr - len bits are incremented through all values to
   fill the table with replicated entries.

   root is the number of index bits for the root table.  When len exceeds
   root, sub-tables are created pointed to by the root entry with an index
   of the low root bits of huff.  This is saved in low to check for when a
   new sub-table should be started.  drop is zero when the root table is
   being filled, and drop is root when sub-tables are being filled.

   When a new sub-table is needed, it is necessary to look ahead in the
   code lengths to determine what size sub-table is needed.  The length
   counts are used for this, and so count[] is decremented as codes are
   entered in the tables.

   used keeps track of how many table entries have been allocated from the
   provided *table space.  It is checked for LENS and DIST tables against
   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
   the initial root table size constants.  See the comments in inftrees.h
   for more information.

   sym increments through all symbols, and the loop terminates when
   all codes of length max, i.e. all codes, have been processed.  This
   routine permits incomplete codes, so another loop after this one fills
   in the rest of the decoding tables with invalid code markers.
   */

  /* set up for code type */
  // poor man optimization - use if-else instead of switch,
  // to avoid deopts in old v8
  if (type === CODES) {
	  base = extra = work;    /* dummy value--not used */
	  end = 19;
  } else if (type === LENS) {
	  base = lbase;
	  base_index -= 257;
	  extra = lext;
	  extra_index -= 257;
	  end = 256;
  } else {                    /* DISTS */
	  base = dbase;
	  extra = dext;
	  end = -1;
  }

  /* initialize opts for loop */
  huff = 0;                   /* starting code */
  sym = 0;                    /* starting code symbol */
  len = min;                  /* starting code length */
  next = table_index;              /* current table to fill in */
  curr = root;                /* current table index bits */
  drop = 0;                   /* current bits to drop from code for index */
  low = -1;                   /* trigger new sub-table when len > root */
  used = 1 << root;          /* use root table entries */
  mask = used - 1;            /* mask for comparing low */

  /* check available table space */
  if ((type === LENS && used > ENOUGH_LENS) ||
	(type === DISTS && used > ENOUGH_DISTS)) {
	return 1;
  }

  var i=0;
  /* process all codes and make table entries */
  for (;;) {
	i++;
	/* create table entry */
	here_bits = len - drop;
	if (work[sym] < end) {
	  here_op = 0;
	  here_val = work[sym];
	}
	else if (work[sym] > end) {
	  here_op = extra[extra_index + work[sym]];
	  here_val = base[base_index + work[sym]];
	}
	else {
	  here_op = 32 + 64;         /* end of block */
	  here_val = 0;
	}

	/* replicate for those indices with low len bits equal to huff */
	incr = 1 << (len - drop);
	fill = 1 << curr;
	min = fill;                 /* save offset to next table */
	do {
	  fill -= incr;
	  table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
	} while (fill !== 0);

	/* backwards increment the len-bit code huff */
	incr = 1 << (len - 1);
	while (huff & incr) {
	  incr >>= 1;
	}
	if (incr !== 0) {
	  huff &= incr - 1;
	  huff += incr;
	} else {
	  huff = 0;
	}

	/* go to next symbol, update count, len */
	sym++;
	if (--count[len] === 0) {
	  if (len === max) { break; }
	  len = lens[lens_index + work[sym]];
	}

	/* create new sub-table if needed */
	if (len > root && (huff & mask) !== low) {
	  /* if first time, transition to sub-tables */
	  if (drop === 0) {
		drop = root;
	  }

	  /* increment past last table */
	  next += min;            /* here min is 1 << curr */

	  /* determine length of next table */
	  curr = len - drop;
	  left = 1 << curr;
	  while (curr + drop < max) {
		left -= count[curr + drop];
		if (left <= 0) { break; }
		curr++;
		left <<= 1;
	  }

	  /* check for enough space */
	  used += 1 << curr;
	  if ((type === LENS && used > ENOUGH_LENS) ||
		(type === DISTS && used > ENOUGH_DISTS)) {
		return 1;
	  }

	  /* point entry in root table to sub-table */
	  low = huff & mask;
	  /*table.op[low] = curr;
	  table.bits[low] = root;
	  table.val[low] = next - opts.table_index;*/
	  table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
	}
  }

  /* fill in remaining table entry if code is incomplete (guaranteed to have
   at most one remaining entry, since if the code is incomplete, the
   maximum code length that was allowed to get this far is one bit) */
  if (huff !== 0) {
	//table.op[next + huff] = 64;            /* invalid code marker */
	//table.bits[next + huff] = len - drop;
	//table.val[next + huff] = 0;
	table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
  }

  /* set return parameters */
  //opts.table_index += used;
  opts.bits = root;
  return 0;
};

},{"../utils/common":27}],37:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  '2':    'need dictionary',     /* Z_NEED_DICT       2  */
  '1':    'stream end',          /* Z_STREAM_END      1  */
  '0':    '',                    /* Z_OK              0  */
  '-1':   'file error',          /* Z_ERRNO         (-1) */
  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
};
},{}],38:[function(_dereq_,module,exports){
'use strict';


var utils = _dereq_('../utils/common');

/* Public constants ==========================================================*/
/* ===========================================================================*/


//var Z_FILTERED          = 1;
//var Z_HUFFMAN_ONLY      = 2;
//var Z_RLE               = 3;
var Z_FIXED               = 4;
//var Z_DEFAULT_STRATEGY  = 0;

/* Possible values of the data_type field (though see inflate()) */
var Z_BINARY              = 0;
var Z_TEXT                = 1;
//var Z_ASCII             = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;

/*============================================================================*/


function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

// From zutil.h

var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES    = 2;
/* The three kinds of block type */

var MIN_MATCH    = 3;
var MAX_MATCH    = 258;
/* The minimum and maximum match lengths */

// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */

var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */

var LITERALS      = 256;
/* number of literal bytes 0..255 */

var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */

var D_CODES       = 30;
/* number of distance codes */

var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */

var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */

var MAX_BITS      = 15;
/* All codes must not exceed MAX_BITS bits */

var Buf_size      = 16;
/* size of bit buffer in bi_buf */


/* ===========================================================================
 * Constants
 */

var MAX_BL_BITS = 7;
/* Bit length codes must not exceed MAX_BL_BITS bits */

var END_BLOCK   = 256;
/* end of block literal code */

var REP_3_6     = 16;
/* repeat previous bit length 3-6 times (2 bits of repeat count) */

var REPZ_3_10   = 17;
/* repeat a zero length 3-10 times  (3 bits of repeat count) */

var REPZ_11_138 = 18;
/* repeat a zero length 11-138 times  (7 bits of repeat count) */

var extra_lbits =   /* extra bits for each length code */
  [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];

var extra_dbits =   /* extra bits for each distance code */
  [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

var extra_blbits =  /* extra bits for each bit length code */
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];

var bl_order =
  [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */

/* ===========================================================================
 * Local data. These are initialized only once.
 */

// We pre-fill arrays with 0 to avoid uninitialized gaps

var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
var static_ltree  = new Array((L_CODES+2) * 2);
zero(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */

var static_dtree  = new Array(D_CODES * 2);
zero(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */

var _dist_code    = new Array(DIST_CODE_LEN);
zero(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */

var _length_code  = new Array(MAX_MATCH-MIN_MATCH+1);
zero(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */

var base_length   = new Array(LENGTH_CODES);
zero(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */

var base_dist     = new Array(D_CODES);
zero(base_dist);
/* First normalized distance for each code (0 = distance of 1) */


var StaticTreeDesc = function (static_tree, extra_bits, extra_base, elems, max_length) {

  this.static_tree  = static_tree;  /* static tree or NULL */
  this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
  this.extra_base   = extra_base;   /* base index for extra_bits */
  this.elems        = elems;        /* max number of elements in the tree */
  this.max_length   = max_length;   /* max bit length for the codes */

  // show if `static_tree` has data or dummy - needed for monomorphic objects
  this.has_stree    = static_tree && static_tree.length;
};


var static_l_desc;
var static_d_desc;
var static_bl_desc;


var TreeDesc = function(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;     /* the dynamic tree */
  this.max_code = 0;            /* largest code with non zero frequency */
  this.stat_desc = stat_desc;   /* the corresponding static tree */
};



function d_code(dist) {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
}


/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */
function put_short (s, w) {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = (w) & 0xff;
  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
}


/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
function send_bits(s, value, length) {
  if (s.bi_valid > (Buf_size - length)) {
	s.bi_buf |= (value << s.bi_valid) & 0xffff;
	put_short(s, s.bi_buf);
	s.bi_buf = value >> (Buf_size - s.bi_valid);
	s.bi_valid += length - Buf_size;
  } else {
	s.bi_buf |= (value << s.bi_valid) & 0xffff;
	s.bi_valid += length;
  }
}


function send_code(s, c, tree) {
  send_bits(s, tree[c*2]/*.Code*/, tree[c*2 + 1]/*.Len*/);
}


/* ===========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */
function bi_reverse(code, len) {
  var res = 0;
  do {
	res |= code & 1;
	code >>>= 1;
	res <<= 1;
  } while (--len > 0);
  return res >>> 1;
}


/* ===========================================================================
 * Flush the bit buffer, keeping at most 7 bits in it.
 */
function bi_flush(s) {
  if (s.bi_valid === 16) {
	put_short(s, s.bi_buf);
	s.bi_buf = 0;
	s.bi_valid = 0;

  } else if (s.bi_valid >= 8) {
	s.pending_buf[s.pending++] = s.bi_buf & 0xff;
	s.bi_buf >>= 8;
	s.bi_valid -= 8;
  }
}


/* ===========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */
function gen_bitlen(s, desc)
//    deflate_state *s;
//    tree_desc *desc;    /* the tree descriptor */
{
  var tree            = desc.dyn_tree;
  var max_code        = desc.max_code;
  var stree           = desc.stat_desc.static_tree;
  var has_stree       = desc.stat_desc.has_stree;
  var extra           = desc.stat_desc.extra_bits;
  var base            = desc.stat_desc.extra_base;
  var max_length      = desc.stat_desc.max_length;
  var h;              /* heap index */
  var n, m;           /* iterate over the tree elements */
  var bits;           /* bit length */
  var xbits;          /* extra bits */
  var f;              /* frequency */
  var overflow = 0;   /* number of elements with bit length too large */

  for (bits = 0; bits <= MAX_BITS; bits++) {
	s.bl_count[bits] = 0;
  }

  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */
  tree[s.heap[s.heap_max]*2 + 1]/*.Len*/ = 0; /* root of the heap */

  for (h = s.heap_max+1; h < HEAP_SIZE; h++) {
	n = s.heap[h];
	bits = tree[tree[n*2 +1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
	if (bits > max_length) {
	  bits = max_length;
	  overflow++;
	}
	tree[n*2 + 1]/*.Len*/ = bits;
	/* We overwrite tree[n].Dad which is no longer needed */

	if (n > max_code) { continue; } /* not a leaf node */

	s.bl_count[bits]++;
	xbits = 0;
	if (n >= base) {
	  xbits = extra[n-base];
	}
	f = tree[n * 2]/*.Freq*/;
	s.opt_len += f * (bits + xbits);
	if (has_stree) {
	  s.static_len += f * (stree[n*2 + 1]/*.Len*/ + xbits);
	}
  }
  if (overflow === 0) { return; }

  // Trace((stderr,"\nbit length overflow\n"));
  /* This happens for example on obj2 and pic of the Calgary corpus */

  /* Find the first bit length which could increase: */
  do {
	bits = max_length-1;
	while (s.bl_count[bits] === 0) { bits--; }
	s.bl_count[bits]--;      /* move one leaf down the tree */
	s.bl_count[bits+1] += 2; /* move one overflow item as its brother */
	s.bl_count[max_length]--;
	/* The brother of the overflow item also moves one step up,
	 * but this does not affect bl_count[max_length]
	 */
	overflow -= 2;
  } while (overflow > 0);

  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */
  for (bits = max_length; bits !== 0; bits--) {
	n = s.bl_count[bits];
	while (n !== 0) {
	  m = s.heap[--h];
	  if (m > max_code) { continue; }
	  if (tree[m*2 + 1]/*.Len*/ !== bits) {
		// Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
		s.opt_len += (bits - tree[m*2 + 1]/*.Len*/)*tree[m*2]/*.Freq*/;
		tree[m*2 + 1]/*.Len*/ = bits;
	  }
	  n--;
	}
  }
}


/* ===========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */
function gen_codes(tree, max_code, bl_count)
//    ct_data *tree;             /* the tree to decorate */
//    int max_code;              /* largest code with non zero frequency */
//    ushf *bl_count;            /* number of codes at each bit length */
{
  var next_code = new Array(MAX_BITS+1); /* next code value for each bit length */
  var code = 0;              /* running code value */
  var bits;                  /* bit index */
  var n;                     /* code index */

  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */
  for (bits = 1; bits <= MAX_BITS; bits++) {
	next_code[bits] = code = (code + bl_count[bits-1]) << 1;
  }
  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //        "inconsistent bit counts");
  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

  for (n = 0;  n <= max_code; n++) {
	var len = tree[n*2 + 1]/*.Len*/;
	if (len === 0) { continue; }
	/* Now reverse the bits */
	tree[n*2]/*.Code*/ = bi_reverse(next_code[len]++, len);

	//Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
	//     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
  }
}


/* ===========================================================================
 * Initialize the various 'constant' tables.
 */
function tr_static_init() {
  var n;        /* iterates over tree elements */
  var bits;     /* bit counter */
  var length;   /* length value */
  var code;     /* code value */
  var dist;     /* distance index */
  var bl_count = new Array(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  // do check in _tr_init()
  //if (static_init_done) return;

  /* For some embedded targets, global variables are not initialized: */
/*#ifdef NO_INIT_GLOBAL_POINTERS
  static_l_desc.static_tree = static_ltree;
  static_l_desc.extra_bits = extra_lbits;
  static_d_desc.static_tree = static_dtree;
  static_d_desc.extra_bits = extra_dbits;
  static_bl_desc.extra_bits = extra_blbits;
#endif*/

  /* Initialize the mapping length (0..255) -> length code (0..28) */
  length = 0;
  for (code = 0; code < LENGTH_CODES-1; code++) {
	base_length[code] = length;
	for (n = 0; n < (1<<extra_lbits[code]); n++) {
	  _length_code[length++] = code;
	}
  }
  //Assert (length == 256, "tr_static_init: length != 256");
  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */
  _length_code[length-1] = code;

  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
  dist = 0;
  for (code = 0 ; code < 16; code++) {
	base_dist[code] = dist;
	for (n = 0; n < (1<<extra_dbits[code]); n++) {
	  _dist_code[dist++] = code;
	}
  }
  //Assert (dist == 256, "tr_static_init: dist != 256");
  dist >>= 7; /* from now on, all distances are divided by 128 */
  for ( ; code < D_CODES; code++) {
	base_dist[code] = dist << 7;
	for (n = 0; n < (1<<(extra_dbits[code]-7)); n++) {
	  _dist_code[256 + dist++] = code;
	}
  }
  //Assert (dist == 256, "tr_static_init: 256+dist != 512");

  /* Construct the codes of the static literal tree */
  for (bits = 0; bits <= MAX_BITS; bits++) {
	bl_count[bits] = 0;
  }

  n = 0;
  while (n <= 143) {
	static_ltree[n*2 + 1]/*.Len*/ = 8;
	n++;
	bl_count[8]++;
  }
  while (n <= 255) {
	static_ltree[n*2 + 1]/*.Len*/ = 9;
	n++;
	bl_count[9]++;
  }
  while (n <= 279) {
	static_ltree[n*2 + 1]/*.Len*/ = 7;
	n++;
	bl_count[7]++;
  }
  while (n <= 287) {
	static_ltree[n*2 + 1]/*.Len*/ = 8;
	n++;
	bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */
  gen_codes(static_ltree, L_CODES+1, bl_count);

  /* The static distance tree is trivial: */
  for (n = 0; n < D_CODES; n++) {
	static_dtree[n*2 + 1]/*.Len*/ = 5;
	static_dtree[n*2]/*.Code*/ = bi_reverse(n, 5);
  }

  // Now data ready and we can init static trees
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS+1, L_CODES, MAX_BITS);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES, MAX_BITS);
  static_bl_desc =new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES, MAX_BL_BITS);

  //static_init_done = true;
}


/* ===========================================================================
 * Initialize a new block.
 */
function init_block(s) {
  var n; /* iterates over tree elements */

  /* Initialize the trees. */
  for (n = 0; n < L_CODES;  n++) { s.dyn_ltree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < D_CODES;  n++) { s.dyn_dtree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < BL_CODES; n++) { s.bl_tree[n*2]/*.Freq*/ = 0; }

  s.dyn_ltree[END_BLOCK*2]/*.Freq*/ = 1;
  s.opt_len = s.static_len = 0;
  s.last_lit = s.matches = 0;
}


/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */
function bi_windup(s)
{
  if (s.bi_valid > 8) {
	put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
	//put_byte(s, (Byte)s->bi_buf);
	s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}

/* ===========================================================================
 * Copy a stored block, storing first the length and its
 * one's complement if requested.
 */
function copy_block(s, buf, len, header)
//DeflateState *s;
//charf    *buf;    /* the input data */
//unsigned len;     /* its length */
//int      header;  /* true if block header must be written */
{
  bi_windup(s);        /* align on byte boundary */

  if (header) {
	put_short(s, len);
	put_short(s, ~len);
  }
//  while (len--) {
//    put_byte(s, *buf++);
//  }
  utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
  s.pending += len;
}

/* ===========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */
function smaller(tree, n, m, depth) {
  var _n2 = n*2;
  var _m2 = m*2;
  return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
		 (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
}

/* ===========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */
function pqdownheap(s, tree, k)
//    deflate_state *s;
//    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */
{
  var v = s.heap[k];
  var j = k << 1;  /* left son of k */
  while (j <= s.heap_len) {
	/* Set j to the smallest of the two sons: */
	if (j < s.heap_len &&
	  smaller(tree, s.heap[j+1], s.heap[j], s.depth)) {
	  j++;
	}
	/* Exit if v is smaller than both sons */
	if (smaller(tree, v, s.heap[j], s.depth)) { break; }

	/* Exchange v with the smallest son */
	s.heap[k] = s.heap[j];
	k = j;

	/* And continue down the tree, setting j to the left son of k */
	j <<= 1;
  }
  s.heap[k] = v;
}


// inlined manually
// var SMALLEST = 1;

/* ===========================================================================
 * Send the block data compressed using the given Huffman trees
 */
function compress_block(s, ltree, dtree)
//    deflate_state *s;
//    const ct_data *ltree; /* literal tree */
//    const ct_data *dtree; /* distance tree */
{
  var dist;           /* distance of matched string */
  var lc;             /* match length or unmatched char (if dist == 0) */
  var lx = 0;         /* running index in l_buf */
  var code;           /* the code to send */
  var extra;          /* number of extra bits to send */

  if (s.last_lit !== 0) {
	do {
	  dist = (s.pending_buf[s.d_buf + lx*2] << 8) | (s.pending_buf[s.d_buf + lx*2 + 1]);
	  lc = s.pending_buf[s.l_buf + lx];
	  lx++;

	  if (dist === 0) {
		send_code(s, lc, ltree); /* send a literal byte */
		//Tracecv(isgraph(lc), (stderr," '%c' ", lc));
	  } else {
		/* Here, lc is the match length - MIN_MATCH */
		code = _length_code[lc];
		send_code(s, code+LITERALS+1, ltree); /* send the length code */
		extra = extra_lbits[code];
		if (extra !== 0) {
		  lc -= base_length[code];
		  send_bits(s, lc, extra);       /* send the extra length bits */
		}
		dist--; /* dist is now the match distance - 1 */
		code = d_code(dist);
		//Assert (code < D_CODES, "bad d_code");

		send_code(s, code, dtree);       /* send the distance code */
		extra = extra_dbits[code];
		if (extra !== 0) {
		  dist -= base_dist[code];
		  send_bits(s, dist, extra);   /* send the extra distance bits */
		}
	  } /* literal or match pair ? */

	  /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
	  //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
	  //       "pendingBuf overflow");

	} while (lx < s.last_lit);
  }

  send_code(s, END_BLOCK, ltree);
}


/* ===========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */
function build_tree(s, desc)
//    deflate_state *s;
//    tree_desc *desc; /* the tree descriptor */
{
  var tree     = desc.dyn_tree;
  var stree    = desc.stat_desc.static_tree;
  var has_stree = desc.stat_desc.has_stree;
  var elems    = desc.stat_desc.elems;
  var n, m;          /* iterate over heap elements */
  var max_code = -1; /* largest code with non zero frequency */
  var node;          /* new node being created */

  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE;

  for (n = 0; n < elems; n++) {
	if (tree[n * 2]/*.Freq*/ !== 0) {
	  s.heap[++s.heap_len] = max_code = n;
	  s.depth[n] = 0;

	} else {
	  tree[n*2 + 1]/*.Len*/ = 0;
	}
  }

  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */
  while (s.heap_len < 2) {
	node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
	tree[node * 2]/*.Freq*/ = 1;
	s.depth[node] = 0;
	s.opt_len--;

	if (has_stree) {
	  s.static_len -= stree[node*2 + 1]/*.Len*/;
	}
	/* node is 0 or 1 so it does not have extra bits */
  }
  desc.max_code = max_code;

  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */
  for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */
  node = elems;              /* next internal node of the tree */
  do {
	//pqremove(s, tree, n);  /* n = node of least frequency */
	/*** pqremove ***/
	n = s.heap[1/*SMALLEST*/];
	s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
	pqdownheap(s, tree, 1/*SMALLEST*/);
	/***/

	m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

	s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
	s.heap[--s.heap_max] = m;

	/* Create a new node father of n and m */
	tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
	s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
	tree[n*2 + 1]/*.Dad*/ = tree[m*2 + 1]/*.Dad*/ = node;

	/* and insert the new node in the heap */
	s.heap[1/*SMALLEST*/] = node++;
	pqdownheap(s, tree, 1/*SMALLEST*/);

  } while (s.heap_len >= 2);

  s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */
  gen_bitlen(s, desc);

  /* The field len is now set, we can generate the bit codes */
  gen_codes(tree, max_code, s.bl_count);
}


/* ===========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree.
 */
function scan_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree;   /* the tree to be scanned */
//    int max_code;    /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  if (nextlen === 0) {
	max_count = 138;
	min_count = 3;
  }
  tree[(max_code+1)*2 + 1]/*.Len*/ = 0xffff; /* guard */

  for (n = 0; n <= max_code; n++) {
	curlen = nextlen;
	nextlen = tree[(n+1)*2 + 1]/*.Len*/;

	if (++count < max_count && curlen === nextlen) {
	  continue;

	} else if (count < min_count) {
	  s.bl_tree[curlen * 2]/*.Freq*/ += count;

	} else if (curlen !== 0) {

	  if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
	  s.bl_tree[REP_3_6*2]/*.Freq*/++;

	} else if (count <= 10) {
	  s.bl_tree[REPZ_3_10*2]/*.Freq*/++;

	} else {
	  s.bl_tree[REPZ_11_138*2]/*.Freq*/++;
	}

	count = 0;
	prevlen = curlen;

	if (nextlen === 0) {
	  max_count = 138;
	  min_count = 3;

	} else if (curlen === nextlen) {
	  max_count = 6;
	  min_count = 3;

	} else {
	  max_count = 7;
	  min_count = 4;
	}
  }
}


/* ===========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */
function send_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree; /* the tree to be scanned */
//    int max_code;       /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  /* tree[max_code+1].Len = -1; */  /* guard already set */
  if (nextlen === 0) {
	max_count = 138;
	min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
	curlen = nextlen;
	nextlen = tree[(n+1)*2 + 1]/*.Len*/;

	if (++count < max_count && curlen === nextlen) {
	  continue;

	} else if (count < min_count) {
	  do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

	} else if (curlen !== 0) {
	  if (curlen !== prevlen) {
		send_code(s, curlen, s.bl_tree);
		count--;
	  }
	  //Assert(count >= 3 && count <= 6, " 3_6?");
	  send_code(s, REP_3_6, s.bl_tree);
	  send_bits(s, count-3, 2);

	} else if (count <= 10) {
	  send_code(s, REPZ_3_10, s.bl_tree);
	  send_bits(s, count-3, 3);

	} else {
	  send_code(s, REPZ_11_138, s.bl_tree);
	  send_bits(s, count-11, 7);
	}

	count = 0;
	prevlen = curlen;
	if (nextlen === 0) {
	  max_count = 138;
	  min_count = 3;

	} else if (curlen === nextlen) {
	  max_count = 6;
	  min_count = 3;

	} else {
	  max_count = 7;
	  min_count = 4;
	}
  }
}


/* ===========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */
function build_bl_tree(s) {
  var max_blindex;  /* index of last bit length code of non zero freq */

  /* Determine the bit length frequencies for literal and distance trees */
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

  /* Build the bit length tree: */
  build_tree(s, s.bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */

  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */
  for (max_blindex = BL_CODES-1; max_blindex >= 3; max_blindex--) {
	if (s.bl_tree[bl_order[max_blindex]*2 + 1]/*.Len*/ !== 0) {
	  break;
	}
  }
  /* Update opt_len to include the bit length tree and counts */
  s.opt_len += 3*(max_blindex+1) + 5+5+4;
  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //        s->opt_len, s->static_len));

  return max_blindex;
}


/* ===========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */
function send_all_trees(s, lcodes, dcodes, blcodes)
//    deflate_state *s;
//    int lcodes, dcodes, blcodes; /* number of codes for each tree */
{
  var rank;                    /* index in bl_order */

  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //        "too many codes");
  //Tracev((stderr, "\nbl counts: "));
  send_bits(s, lcodes-257, 5); /* not +255 as stated in appnote.txt */
  send_bits(s, dcodes-1,   5);
  send_bits(s, blcodes-4,  4); /* not -3 as stated in appnote.txt */
  for (rank = 0; rank < blcodes; rank++) {
	//Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
	send_bits(s, s.bl_tree[bl_order[rank]*2 + 1]/*.Len*/, 3);
  }
  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_ltree, lcodes-1); /* literal tree */
  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_dtree, dcodes-1); /* distance tree */
  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
}


/* ===========================================================================
 * Check if the data type is TEXT or BINARY, using the following algorithm:
 * - TEXT if the two conditions below are satisfied:
 *    a) There are no non-portable control characters belonging to the
 *       "black list" (0..6, 14..25, 28..31).
 *    b) There is at least one printable character belonging to the
 *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
 * - BINARY otherwise.
 * - The following partially-portable control characters form a
 *   "gray list" that is ignored in this detection algorithm:
 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
 * IN assertion: the fields Freq of dyn_ltree are set.
 */
function detect_data_type(s) {
  /* black_mask is the bit mask of black-listed bytes
   * set bits 0..6, 14..25, and 28..31
   * 0xf3ffc07f = binary 11110011111111111100000001111111
   */
  var black_mask = 0xf3ffc07f;
  var n;

  /* Check for non-textual ("black-listed") bytes. */
  for (n = 0; n <= 31; n++, black_mask >>>= 1) {
	if ((black_mask & 1) && (s.dyn_ltree[n*2]/*.Freq*/ !== 0)) {
	  return Z_BINARY;
	}
  }

  /* Check for textual ("white-listed") bytes. */
  if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
	  s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
	return Z_TEXT;
  }
  for (n = 32; n < LITERALS; n++) {
	if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
	  return Z_TEXT;
	}
  }

  /* There are no "black-listed" or "white-listed" bytes:
   * this stream either is empty or has tolerated ("gray-listed") bytes only.
   */
  return Z_BINARY;
}


var static_init_done = false;

/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */
function _tr_init(s)
{

  if (!static_init_done) {
	tr_static_init();
	static_init_done = true;
  }

  s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

  s.bi_buf = 0;
  s.bi_valid = 0;

  /* Initialize the first block of the first file: */
  init_block(s);
}


/* ===========================================================================
 * Send a stored block
 */
function _tr_stored_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  send_bits(s, (STORED_BLOCK<<1)+(last ? 1 : 0), 3);    /* send block type */
  copy_block(s, buf, stored_len, true); /* with header */
}


/* ===========================================================================
 * Send one empty static block to give enough lookahead for inflate.
 * This takes 10 bits, of which 7 may remain in the bit buffer.
 */
function _tr_align(s) {
  send_bits(s, STATIC_TREES<<1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
}


/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */
function _tr_flush_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
  var max_blindex = 0;        /* index of last bit length code of non zero freq */

  /* Build the Huffman trees unless a stored block is forced */
  if (s.level > 0) {

	/* Check if the file is binary or text */
	if (s.strm.data_type === Z_UNKNOWN) {
	  s.strm.data_type = detect_data_type(s);
	}

	/* Construct the literal and distance trees */
	build_tree(s, s.l_desc);
	// Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
	//        s->static_len));

	build_tree(s, s.d_desc);
	// Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
	//        s->static_len));
	/* At this point, opt_len and static_len are the total bit lengths of
	 * the compressed block data, excluding the tree representations.
	 */

	/* Build the bit length tree for the above two trees, and get the index
	 * in bl_order of the last bit length code to send.
	 */
	max_blindex = build_bl_tree(s);

	/* Determine the best encoding. Compute the block lengths in bytes. */
	opt_lenb = (s.opt_len+3+7) >>> 3;
	static_lenb = (s.static_len+3+7) >>> 3;

	// Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
	//        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
	//        s->last_lit));

	if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

  } else {
	// Assert(buf != (char*)0, "lost buf");
	opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }

  if ((stored_len+4 <= opt_lenb) && (buf !== -1)) {
	/* 4: two words for the lengths */

	/* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
	 * Otherwise we can't have processed more than WSIZE input bytes since
	 * the last block flush, because compression would have been
	 * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
	 * transform a block into a stored block.
	 */
	_tr_stored_block(s, buf, stored_len, last);

  } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {

	send_bits(s, (STATIC_TREES<<1) + (last ? 1 : 0), 3);
	compress_block(s, static_ltree, static_dtree);

  } else {
	send_bits(s, (DYN_TREES<<1) + (last ? 1 : 0), 3);
	send_all_trees(s, s.l_desc.max_code+1, s.d_desc.max_code+1, max_blindex+1);
	compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */
  init_block(s);

  if (last) {
	bi_windup(s);
  }
  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
  //       s->compressed_len-7*last));
}

/* ===========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */
function _tr_tally(s, dist, lc)
//    deflate_state *s;
//    unsigned dist;  /* distance of matched string */
//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
{
  //var out_length, in_length, dcode;

  s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

  s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
  s.last_lit++;

  if (dist === 0) {
	/* lc is the unmatched char */
	s.dyn_ltree[lc*2]/*.Freq*/++;
  } else {
	s.matches++;
	/* Here, lc is the match length - MIN_MATCH */
	dist--;             /* dist = match distance - 1 */
	//Assert((ush)dist < (ush)MAX_DIST(s) &&
	//       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
	//       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

	s.dyn_ltree[(_length_code[lc]+LITERALS+1) * 2]/*.Freq*/++;
	s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
  }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility

//#ifdef TRUNCATE_BLOCK
//  /* Try to guess if it is profitable to stop the current block here */
//  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
//    /* Compute an upper bound for the compressed length */
//    out_length = s.last_lit*8;
//    in_length = s.strstart - s.block_start;
//
//    for (dcode = 0; dcode < D_CODES; dcode++) {
//      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
//    }
//    out_length >>>= 3;
//    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
//    //       s->last_lit, in_length, out_length,
//    //       100L - out_length*100L/in_length));
//    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
//      return true;
//    }
//  }
//#endif

  return (s.last_lit === s.lit_bufsize-1);
  /* We avoid equality with lit_bufsize because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */
}

exports._tr_init  = _tr_init;
exports._tr_stored_block = _tr_stored_block;
exports._tr_flush_block  = _tr_flush_block;
exports._tr_tally = _tr_tally;
exports._tr_align = _tr_align;
},{"../utils/common":27}],39:[function(_dereq_,module,exports){
'use strict';


function ZStream() {
  /* next input byte */
  this.input = null; // JS specific, because we have no pointers
  this.next_in = 0;
  /* number of bytes available at input */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  this.output = null; // JS specific, because we have no pointers
  this.next_out = 0;
  /* remaining free space at output */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  this.msg = ''/*Z_NULL*/;
  /* not visible by applications */
  this.state = null;
  /* best guess about the data type: binary or text */
  this.data_type = 2/*Z_UNKNOWN*/;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

module.exports = ZStream;
},{}]},{},[9])
(9)
});

// ==========---------- JSZip End ----------========== //

// ==========---------- FileSaver.js Begin ----------========== //

/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.1.20151003
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent)
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		// See https://code.google.com/p/chromium/issues/detail?id=375297#c7 and
		// https://github.com/eligrey/FileSaver.js/commit/485930a#commitcomment-8768047
		// for the reasoning behind the timeout and revocation flow
		, arbitrary_revoke_timeout = 500 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			if (view.chrome) {
				revoker();
			} else {
				setTimeout(revoker, arbitrary_revoke_timeout);
			}
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob(["\ufeff", blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if (target_view && is_safari && typeof FileReader !== "undefined") {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var base64Data = reader.result;
							target_view.location.href = "data:attachment/file" + base64Data.slice(base64Data.search(/[,;]/));
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
						var new_tab = view.open(object_url, "_blank");
						if (new_tab == undefined && is_safari) {
							//Apple do not allow window.open, see http://bit.ly/1kZffRI
							view.location.href = object_url
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			// Update: Google errantly closed 91158, I submitted it again:
			// https://code.google.com/p/chromium/issues/detail?id=389642
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
									revoke(file);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name, no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name || "download");
		};
	}

	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
  define([], function() {
    return saveAs;
  });
}

// ==========---------- FileSaver.js End ----------========== //

// ==========---------- Main Function Starts Here ----------========== //

var zip;
var retryCount = 0;
var imageList = [];
var imageData = [];
var infoStr;
var origin = window.location.origin;
var setting = GM_getValue('ehD-setting') ? JSON.parse(GM_getValue('ehD-setting')) : {};
var fetchCount = 0;
var downloadedCount = 0;
var fetchThread = [];
var dirName;
var fileName;
var failedCount = 0;
var progressTable = null;
var isREH = false;
var needNumberImages = setting['number-images'];
var pagesRange = [];
var isDownloading = false;
var pageURLsList = [];
var getAllPagesURLFin = false;
var xhr = new XMLHttpRequest();
var blobObj = null;

// r.e-hentai.org points all links to g.e-hentai.org
if (origin === 'http://r.e-hentai.org') {
	origin = 'http://g.e-hentai.org';
	isREH = true;
}

var ehDownloadRegex = {
	imageURL: [
		RegExp('<a href="(' + origin.replace(/\./gi, '\\.') + '\/fullimg\\.php\\?\\S+?)"'),
		/<img id="img" src="(\S+?)"/,
		/<\/iframe><a[\s\S]+?><img src="(\S+?)"/ // Sometimes preview image may not have id="img"
	],
	nextFetchURL: [
		RegExp('<a id="next"[\\s\\S]+?href="(' + origin.replace(/\./gi, '\\.') + '\\/s\\/\\S+?)"'),
		RegExp('<a href="(' + origin.replace(/\./gi, '\\.') + '\\/s\\/\\S+?)"><img src="http://ehgt.org/g/n.png"')
	],
	preFetchURL: RegExp('<div class="sn"><a[\\s\\S]+?href="(' + origin.replace(/\./gi, '\\.') + '\\/s\\/\\S+?)"'),
	nl: /return nl\('([\d-]+)'\)/,
	fileName: /g\/l.png" \/><\/a><\/div><div>([\s\S]+?) :: /,
	resFileName: /filename=([\s\S]+?)\n/,
	dangerChars: /[:"*?|<>\/\\\n]/g,
	pagesRange: /^(\d+(-\d+)?\s*?,\s*?)*\d+(-\d+)?$/,
	pagesURL: /(?:<a href=").+?(?=")/gi
};

window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
var ehDownloadFS = {
	fs: undefined,
	needFileSystem: false,
	initHandler: function(fs) {
		ehDownloadFS.fs = fs;
		console.log('[EHD] File System is opened! Name >', fs.name);
		ehDownloadFS.removeAllFiles(fs); // It's sure that user have downloaded or ignored temp archive
	},
	reinitHandler: function(fs) {
		ehDownloadFS.fs = fs;
		console.log('[EHD] File System is opened! Name >', fs.name);
		ehDownloadFS.removeFile(unsafeWindow.gid + '.zip');
		generateZip();
	},
	errorHandler: function(e) {
		var errorMsg = 'File System Request Error > ';
		switch (e.code) {
			case FileError.QUOTA_EXCEEDED_ERR:
				errorMsg += 'QUOTA_EXCEEDED_ERR';
				break;
			case FileError.NOT_FOUND_ERR:
				errorMsg += 'NOT_FOUND_ERR';
				break;
			case FileError.SECURITY_ERR:
				errorMsg += 'SECURITY_ERR';
				break;
			case FileError.INVALID_MODIFICATION_ERR:
				errorMsg += 'INVALID_MODIFICATION_ERR';
				break;
			case FileError.INVALID_STATE_ERR:
				errorMsg += 'INVALID_STATE_ERR';
				break;
			default:
				errorMsg += 'Unknown Error';
		}
		console.error('[EHD] ' + errorMsg);
	},
	saveAs: function(fs){
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
			insertCloseButton();
		});
	},
	removeFile: function(fileName, fs, isEntry){
		var fs = fs || ehDownloadFS.fs;
		if (fs === undefined) return;
		var removeFunction = function(fileEntry){
			if (fileEntry.isFile) fileEntry.remove(function(){
				console.log('[EHD] File', fileName, 'is removed.');
			}, ehDownloadFS.errorHandler);
			else fileEntry.removeRecursively(function() {
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
	.ehD-setting { position: fixed; left: 0; right: 0; top: 0; bottom: 0; padding: 5px; border: 1px solid #000000; background: #34353b; color: #dddddd; width: 550px; height: 360px; max-width: 100%; max-height: 100%; overflow-x: hidden; overflow-y: auto; box-sizing: border-box; margin: auto; z-index: 999; text-align: left; font-size: 12px; outline: 5px rgba(0, 0, 0, 0.25) solid; }\
	.ehD-setting-tab { list-style: none; margin: 5px 0; padding: 0 10px; border-bottom: 1px solid #cccccc; overflow: auto; }\
	.ehD-setting-tab li { float: left; padding: 5px 10px; border-bottom: 0; cursor: pointer; }\
	.ehD-setting[data-active-setting="basic"] li[data-target-setting="basic"], .ehD-setting[data-active-setting="advanced"] li[data-target-setting="advanced"] { font-weight: bold; background: #cccccc; color: #000000; }\
	.ehD-setting-wrapper { width: 200%; overflow: hidden; -webkit-transform: translateX(0%); -moz-transform: translateX(0%); -o-transform: translateX(0%); -ms-transform: translateX(0%); transform: translateX(0%); -webkit-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); -moz-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); -o-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); -ms-transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); transition: all 0.5s cubic-bezier(0.86, 0, 0.07, 1); }\
	.ehD-setting[data-active-setting="advanced"] .ehD-setting-wrapper { -webkit-transform: translateX(-50%); -moz-transform: translateX(-50%); -o-transform: translateX(-50%); -ms-transform: translateX(-50%); transform: translateX(-50%); }\
	.ehD-setting-content { width: 50%; float: left; box-sizing: border-box; padding: 5px 10px; }\
	.ehD-setting .g2 { padding-bottom: 10px; }\
	.ehD-setting input, .ehD-box input { vertical-align: middle; }\
	.ehD-setting input[type="text"], .ehD-box input[type="text"], .ehD-setting input[type="number"], .ehD-box input[type="number"] { height: 17px; }\
	.ehD-pt { table-layout: fixed; width: 100%; }\
	.ehD-pt-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }\
	.ehD-pt-progress-outer { width: 160px; position: relative; }\
	.ehD-pt-progress { width: 150px; }\
	.ehD-pt-progress-text { position: absolute; width: 100%; text-align: center; color: #34353b; left: 0; right: 0; }\
	.ehD-pt-status { width: 130px; }\
	.ehD-pt-succeed .ehD-pt-status { color: #00ff00; }\
	.ehD-pt-warning .ehD-pt-status { color: #ffff00; }\
	.ehD-pt-failed .ehD-pt-status { color: #ff0000; }\
	.ehD-dialog { position: fixed; right: 0; bottom: 0; display: none; padding: 5px; border: 1px solid #000000; background: #34353b; color: #dddddd; width: 550px; height: 300px; overflow: auto; z-index: 999; }\
	';

// log information
console.log('[EHD] UserAgent >', navigator.userAgent);
console.log('[EHD] Script Handler >', GM_info.scriptHandler || (navigator.userAgent.indexOf('Firefox') >= 0 ? 'GreaseMonkey' : (navigator.userAgent.indexOf('Opera') >= 0 || navigator.userAgent.indexOf('Maxthon') >= 0) ? 'Violentmonkey' : undefined)); // (Only Tampermonkey supports GM_info.scriptHandler)
console.log('[EHD] GreaseMonkey / Tampermonkey Version >', GM_info.version);
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
		var entitesList = {
			'euro': '€',
			'nbsp': ' ',
			'quot': '"',
			'amp': '&',
			'lt': '<',
			'gt': '>',
			'iexcl': '¡',
			'cent': '¢',
			'pound': '£',
			'curren': '¤',
			'yen': '¥',
			'brvbar': '¦',
			'sect': '§',
			'uml': '¨',
			'copy': '©',
			'ordf': 'ª',
			'not': '¬',
			'shy': '',
			'reg': '®',
			'macr': '¯',
			'deg': '°',
			'plusmn': '±',
			'sup2': '²',
			'sup3': '³',
			'acute': '´',
			'micro': 'µ',
			'para': '¶',
			'middot': '·',
			'cedil': '¸',
			'sup1': '¹',
			'ordm': 'º',
			'raquo': '»',
			'frac14': '¼',
			'frac12': '½',
			'frac34': '¾',
			'iquest': '¿',
			'Agrave': 'À',
			'Aacute': 'Á',
			'Acirc': 'Â',
			'Atilde': 'Ã',
			'Auml': 'Ä',
			'Aring': 'Å',
			'AElig': 'Æ',
			'Ccedil': 'Ç',
			'Egrave': 'È',
			'Eacute': 'É',
			'Ecirc': 'Ê',
			'Euml': 'Ë',
			'Igrave': 'Ì',
			'Iacute': 'Í',
			'Icirc': 'Î',
			'Iuml': 'Ï',
			'ETH': 'Ð',
			'Ntilde': 'Ñ',
			'Ograve': 'Ò',
			'Oacute': 'Ó',
			'Ocirc': 'Ô',
			'Otilde': 'Õ',
			'Ouml': 'Ö',
			'times': '×',
			'Oslash': 'Ø',
			'Ugrave': 'Ù',
			'Uacute': 'Ú',
			'Ucirc': 'Û',
			'Uuml': 'Ü',
			'Yacute': 'Ý',
			'THORN': 'Þ',
			'szlig': 'ß',
			'agrave': 'à',
			'aacute': 'á',
			'acirc': 'â',
			'atilde': 'ã',
			'auml': 'ä',
			'aring': 'å',
			'aelig': 'æ',
			'ccedil': 'ç',
			'egrave': 'è',
			'eacute': 'é',
			'ecirc': 'ê',
			'euml': 'ë',
			'igrave': 'ì',
			'iacute': 'í',
			'icirc': 'î',
			'iuml': 'ï',
			'eth': 'ð',
			'ntilde': 'ñ',
			'ograve': 'ò',
			'oacute': 'ó',
			'ocirc': 'ô',
			'otilde': 'õ',
			'ouml': 'ö',
			'divide': '÷',
			'oslash': 'ø',
			'ugrave': 'ù',
			'uacute': 'ú',
			'ucirc': 'û',
			'uuml': 'ü',
			'yacute': 'ý',
			'thorn': 'þ'
		};
		if (entitesList[entity]) return entitesList[entity];
		else if (entity.match(/#\d+/)) {
			var charCode = entity.match(/#(\d+)/)[1] - 0;
			return String.fromCharCode(charCode);
		}
		else return '&' + entity + ';';
	};
	var result = this.replace(/&(#x?\d+|[a-zA-Z]+);/g, function(match, entity) {
		return matchEntity(entity);
	});
	return result;
};

// Fixed cross origin in r.e-hentai.org
// 发现 prototype 好方便 _(:3
String.prototype.replaceOrigin = function() {
	return isREH ? this.replace('g.e-hentai.org', 'r.e-hentai.org').toString() : this.toString();
};

function createBlob(abdata, config) {
	try { // to detect if blob generates successfully
		return new Blob(abdata, config);
	}
	catch (error) {
		pushDialog('An error occurred when generating Blob object.');
		console.error('[EHD] An error occurred when generating Blob object. Error Name >', error.name, '| Error Message >', error.message);
		if (confirm('An error occurred when generating Blob object.\n\nError Name: ' + error.name + '\nError Message: ' + error.message + '\n\n Try again?')) return createBlob(abdata, config);

		abdata = undefined;
		throw new Error('[EHD] An error occurred when generating Blob object, and user refused to retry.');
	}
}

// show info in dialog box
function pushDialog(str) {
	if (typeof str === 'string') ehDownloadDialog.innerHTML += str.replace(/\n/gi, '<br>');
	else ehDownloadDialog.appendChild(str);
	ehDownloadDialog.scrollTop = ehDownloadDialog.scrollHeight;
}

// replace dir name and zip filename
function getReplacedName(str) {
	return str.replace(/\{gid\}/gi, unsafeWindow.gid)
		.replace(/\{token\}/gi, unsafeWindow.token)
		.replace(/\{title\}/gi, document.getElementById('gn').textContent.replace(/[:"*?|<>\/\\\n]/g, '-'))
		.replace(/\{subtitle\}/gi, document.getElementById('gj').textContent ? document.getElementById('gj').textContent.replace(/[:"*?|<>\/\\\n]/g, '-') : document.getElementById('gn').textContent.replace(/[:"*?|<>\/\\\n]/g, '-'))
		.replace(/\{tag\}/gi, document.querySelector('.ic').getAttribute('alt').toUpperCase())
		.replace(/\{uploader\}/gi, document.querySelector('#gdn a').textContent.replace(/[:"*?|<>\/\\\n]/g, '-'))
		.replaceHTMLEntites();
}

function PageData(pageURL, imageURL, imageName, nextNL, realIndex, imageNumber) {
	this.pageURL = pageURL.split('?')[0];
	this.imageURL = imageURL;
	this.imageName = imageName.trim().replace(/[:"*?|<>\/\\\n]/g, '-');
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
				if (elem !== undefined && elem.imageName.toLowerCase() === imageList[i]['imageName'].toLowerCase()) {
					var nameParts = elem.imageName.split('.');
					nameParts[nameParts.length - 2] += ' (' + (++imageList[i].equalCount) + ')';
					elem.imageName = nameParts.join('.');
					break;
				}
			}
		}
		else elem['imageName'] = elem['imageNumber'] + (setting['number-separator'] ? setting['number-separator'] : '：') + elem['?'];
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

	if (downloadedCount + failedCount < (pagesRange.length || pageURLsList.length)) { // download not finished, some files are not being called to download

		//console.log('[EHD-Debug]', index, 'Request Downloading...', new Date().getTime());
		requestDownload();
		//console.log('[EHD-Debug]', index, 'OK!', new Date().getTime());
	}
	else if (failedCount > 0) { // all files are called to download and some files can't be downloaded
		if (fetchCount === 0) { // all files are finished downloading
			for (var i = 0; i < fetchThread.length; i++) fetchThread[i].abort();
			if (confirm('Some images were failed to download. Would you like to try them again?')) {
				retryAllFailed();
			}
			else {
				pushDialog('\nFetch images failed.');
				if (confirm('Fetch images failed, Please try again later.\n\nWould you like to download downloaded images?')) {
					renameImages();
					for (var j = 0; j < imageData.length; j++) {
						if (imageData[j] != null && imageData[j] !== 'Fetching') {
							zip.folder(dirName).file(imageList[j]['imageName'], imageData[j]);
							imageData[j] = null;
						}
					}
					generateZip();
				}
				zip.remove(dirName);
				isDownloading = false;
			}
		}
	}
	else { // all files are downloaded successfully
		renameImages();
		for (var j = 0; j < (pagesRange.length || pageURLsList.length); j++) {
			zip.folder(dirName).file(imageList[j]['imageName'], imageData.shift());
		}
		generateZip();
		zip.remove(dirName);
		isDownloading = false;
	}
	
	for (var i in res) {
		delete res[i];
	}
}

function generateZip(isFromFS, fs, isRetry){
	if (!isFromFS && !isRetry) {
		imageList.forEach(function(elem, index){
			infoStr += '\n\nPage ' + elem['realIndex'] + ': ' + elem['pageURL'] + '\nImage ' + elem['realIndex'] + ': ' + elem['imageName'] /*+ '\nImage URL: ' + elem['imageURL']*/; // Image URL may useless, see https://github.com/ccloli/E-Hentai-Downloader/issues/6
		});
		pushDialog('\nFinish downloading at ' + new Date() + '\n');
		infoStr += '\n\nFinish downloading at ' + new Date() + '\n\nGenerated by E-Hentai Downloader. https://github.com/ccloli/E-Hentai-Downloader';
		zip.folder(dirName).file('info.txt', infoStr.replace(/\n/gi, '\r\n'));
	}

	try {
		// build arraybuffer object to detect if it generates successfully
		var abData = zip.generate({type: 'arraybuffer', compression: setting['compression-level'] ? 'DEFLATE' : 'STORE', compressionOptions: {level: setting['compression-level'] > 0 ? (setting['compression-level'] < 10 ? setting['compression-level'] : 9) : 1}});
	}
	catch (error) {
		abData = undefined;

		pushDialog('An error occurred when generating Zip file as ArrayBuffer.');
		console.error('[EHD] An error occurred when generating Zip file as ArrayBuffer.');
		console.error(error);
		if (confirm('An error occurred when generating Zip file as ArrayBuffer. Try again?')) return generateZip(isFromFS, fs, 1);

		if ((isFromFS || ehDownloadFS.needFileSystem) && fs !== undefined) {
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
									pushDialog('Succeed!\nPlease close this tab and open a new tab to download.\nIf you still can\'t download it, try using <a href="https://chrome.google.com/webstore/detail/nhnjmpbdkieehidddbaeajffijockaea">HTML5 FileSystem Explorer</a> to save them.');
								});
							});
						}
					}, ehDownloadFS.errorHandler);
				}, ehDownloadFS.errorHandler);
			};
			window.requestFileSystem(window.TEMPORARY, 1024 * 1024 * 1024 * 1024, initFS, ehDownloadFS.errorHandler);
		}

		return;
	}

	if ((isFromFS || ehDownloadFS.needFileSystem) && fs !== undefined) { // using filesystem to save file is needed
		var fs = fs || ehDownloadFS.fs;
		pushDialog('\n\nSlicing and storing Zip file...');
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
						ehDownloadFS.saveAs(isFromFS ? fs : undefined);
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
		fs.root.getFile(unsafeWindow.gid + '.zip', {create: true}, loopWrite, ehDownloadFS.errorHandler);
	}
	else { // or just using blob
		blobObj = createBlob([abData], {type: 'application/zip'});
		saveAs(blobObj, fileName + '.zip');

		var redownloadBtn = document.createElement('button');
		redownloadBtn.textContent = 'Not download? Click here to download';
		redownloadBtn.addEventListener('click', function(){
			// rebuild blob object if "File is not exist" occured
			blobObj = createBlob([abData], {type: 'application/zip'});
			saveAs(blobObj, fileName + '.zip');
		});
		ehDownloadDialog.appendChild(redownloadBtn);
		insertCloseButton();
	}
}

// update progress table info
function updateProgress(nodeList, data) {
	if (data.name !== undefined) nodeList.fileName.textContent = data.name;
	if (data.progress !== undefined) nodeList.progress.value = data.progress;
	if (data.progressText !== undefined) nodeList.progressText.textContent = data.progressText;
	if (data.status !== undefined) nodeList.status.textContent = data.status;
	if (data.class !== undefined) nodeList.current.className = ['ehD-pt-item', data.class].join(' ').trim();
}

// Updated on 1.19: Now the index argument is the page's number - 1 (original is page's number)
function failedFetching(index, nodeList, forced){
	if ('abort' in fetchThread[index]) fetchThread[index].abort();
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
		fetchCount--;

		if (downloadedCount + failedCount < (pagesRange.length || pageURLsList.length)) {
			requestDownload();
		}
		// failedCount must > 0
		else if (fetchCount === 0) {
			for (var i = 0; i < fetchThread.length; i++) fetchThread[i].abort();
			if (confirm('Some images were failed to download. Would you like to try them again?')) {
				retryAllFailed();
			}
			else {
				pushDialog('\nFetch images failed.');
				if (confirm('Fetch images failed, Please try again later.\n\nWould you like to download downloaded images?')) {
					renameImages();
					for (var j = 0; j < imageData.length; j++) {
						if (imageData[j] != null && imageData[j] !== 'Fetching') {
							zip.folder(dirName).file(imageList[j]['imageName'], imageData[j]);
							imageData[j] = null;
						}
					}
					generateZip();
				}
				zip.remove(dirName);
				isDownloading = false;
			}
		}
	}
}

// Updated on 1.19: Now the index argument is the page's number - 1 (original is page's number)
function fetchOriginalImage(index, nodeList) {
	// GM_xhr 于 GreaseMonkey 2.3 / 2.4 中开始支持 responseType 以获取返回类型为 ArrayBuffer 的请求
	// GM_xhr support responseType to fetch ArrayBuffer request on 2.3 / 2.4
	// https://github.com/greasemonkey/greasemonkey/issues/1834
	//console.log(imageList[index]);
	if (retryCount[index] === undefined) retryCount[index] = 0;

	if (nodeList === undefined) {
		var node = document.createElement('tr');
		node.className = 'ehD-pt-item';
		node.innerHTML = '\
			<td class="ehD-pt-name">#' + imageList[index]['realIndex'] + ': ' + imageList[index]['imageName'] + '</td>\
			<td class="ehD-pt-progress-outer">\
				<progress class="ehD-pt-progress"></progress>\
				<span class="ehD-pt-progress-text"></span>\
			</td>\
			<td class="ehD-pt-status">Pending...</td>';
		progressTable.appendChild(node);

		nodeList = {
			current: node,
			fileName: node.getElementsByTagName('td')[0],
			status: node.getElementsByTagName('td')[2],
			progress: node.getElementsByTagName('progress')[0],
			progressText: node.getElementsByTagName('span')[0]
		};
	}
	var speedInfo = {
		lastProgress: 0,
		lastTimestamp: new Date().getTime()
	};

	ehDownloadDialog.scrollTop = ehDownloadDialog.scrollHeight;

	fetchThread[index] = GM_xmlhttpRequest({
		method: 'GET',
		url: imageList[index]['imageFinalURL'] || imageList[index]['imageURL'],
		responseType: 'arraybuffer',
		timeout: setting['timeout'] !== undefined ? Number(setting['timeout']) * 1000 : 300000,
		headers: {
			'Referer': imageList[index]['pageURL'],
			'X-Alt-Referer': imageList[index]['pageURL']
		},
		onprogress: function(res) {
			var t = new Date().getTime();
			var speedText;

			if (t - speedInfo.lastTimestamp >= 1000) {
				speedText = res.lengthComputable ? Number((res.loaded - speedInfo.lastProgress) / (t - speedInfo.lastTimestamp) / 1.024).toFixed(2) + ' KB/s' : '';
				speedInfo.lastProgress = res.loaded;
				speedInfo.lastTimestamp = t;
			}

			updateProgress(nodeList, {
				progress: res.lengthComputable ? res.loaded / res.total : '',
				progressText: speedText,
				class: '',
				status: retryCount[index] === 0 ? 'Downloading...' : 'Retrying (' + retryCount[index] + '/' + (setting['retry-count'] !== undefined ? setting['retry-count'] : 3) +') ...'
			});

			for (var i in res) {
				delete res[i];
			}
		},
		onload: function(res) {
			//console.log('[EHD-Debug]', index, 'Load Finished!', new Date().getTime());

			// cache them to reduce waiting time and CPU usage on Chrome with Tampermonkey
			// (Tampermonkey uses a dirty way to give res.response, transfer string to arraybuffer every time)
			// now store progress just spent ~1s instead of ~8s
			var response = res.response;
			var byteLength = response.byteLength;
			var responseHeaders = res.responseHeaders;

			if (!response) {
				console.log('[EHD] #' + (index + 1) + ': Empty Response (See: https://github.com/ccloli/E-Hentai-Downloader/issues/16 )');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nResposeHeaders >' + res.responseHeaders);

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
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nResposeHeaders >' + res.responseHeaders);

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
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nResposeHeaders >' + res.responseHeaders);
				
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
			else if (byteLength === 141) { // Image Viewing Limits String Byte Size
				for (var i = 0; i < fetchThread.length; i++) fetchThread[i].abort();
				console.log('[EHD] #' + (index + 1) + ': Exceed Image Viewing Limits');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nResposeHeaders >' + res.responseHeaders);

				updateProgress(nodeList, {
					status: 'Failed! (Exceed Limits)',
					progress: '0',
					progressText: '',
					class: 'ehD-pt-failed'
				});

				for (var i in res) {
					delete res[i];
				}

				pushDialog('\nYou have exceeded your image viewing limits.');
				if (confirm('You have exceeded your image viewing limits. You can reset these limits at home page.\n\nYou can try reseting your image viewing limits to continue by paying your GPs. Reset now?') && (unsafeWindow.apiuid !== -1 ? 1 : (alert('Sorry, you are not log in!'), 0))) {
					window.open('http://g.e-hentai.org/home.php');
					pushDialog('Please reset your viewing limits on opened window. If not shown, try this <a href="http://g.e-hentai.org/home.php" target="_blank">link</a>.\nAfter reseting your viewing limits, click the button below to continue.\n');
					var continueButton = document.createElement('button');
					continueButton.innerHTML = 'Continue Downloading';
					continueButton.addEventListener('click', function(){
						fetchCount = 0;
						ehDownloadDialog.removeChild(continueButton);

						requestDownload();
					});
					ehDownloadDialog.appendChild(continueButton);
					return;
				}
				else if (confirm('You have exceeded your image viewing limits. Would you like to save downloaded images?')) {
					renameImages();
					for (var j = 0; j < imageData.length; j++) {
						if (imageData[j] != null && imageData[j] !== 'Fetching') {
							zip.folder(dirName).file(imageList[j]['imageName'], imageData[j]);
							imageData[j] = null;
						}
					}
					generateZip();
				}
				zip.remove(dirName);
				isDownloading = false;
				return;
			}
			else if (byteLength === 28658) { // '509 Bandwidth Exceeded' Image Byte Size
				for (var i = 0; i < fetchThread.length; i++) fetchThread[i].abort();
				console.log('[EHD] #' + (index + 1) + ': 509 Bandwidth Exceeded');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nResposeHeaders >' + res.responseHeaders);

				updateProgress(nodeList, {
					status: 'Failed! (Error 509)',
					progress: '0',
					progressText: '',
					class: 'ehD-pt-failed'
				});

				pushDialog('\nYou have exceeded your bandwidth limits.');

				for (var i in res) {
					delete res[i];
				}
				if (confirm('You have temporarily reached the limit for how many images you can browse. You can\n- Sign up/in E-Hentai account at E-Hentai Forums to get double daily quota if you are not sign in.\n- Run the Hentai@Home to support E-Hentai and get more points to increase your limit.\n- Check back in a few hours, and you will be able to download more.\n\nYou can try reseting your image viewing limits to continue by paying your GPs. Reset now?') && (unsafeWindow.apiuid !== -1 ? 1 : (alert('Sorry, you are not log in!'), 0))) {
					window.open('http://g.e-hentai.org/home.php');
					pushDialog('Please reset your viewing limits on opened window. If not shown, try this <a href="http://g.e-hentai.org/home.php" target="_blank">link</a>.\nAfter reseting your viewing limits, click the button below to continue.\n');
					var continueButton = document.createElement('button');
					continueButton.innerHTML = 'Continue Downloading';
					continueButton.addEventListener('click', function(){
						fetchCount = 0;
						ehDownloadDialog.removeChild(continueButton);

						requestDownload();
					});
					ehDownloadDialog.appendChild(continueButton);
					return;
				}
				else if (confirm('You have exceeded your image viewing limits. Would you like to save downloaded images?')) {
					renameImages();
					for (var j = 0; j < imageData.length; j++) {
						if (imageData[j] != null && imageData[j] !== 'Fetching') {
							zip.folder(dirName).file(imageList[j]['imageName'], imageData[j]);
							imageData[j] = null;
						}
					}
					generateZip();
				}
				zip.remove(dirName);
				isDownloading = false;
				return;
			}
			// res.status should be detected at here, because we should know are we reached image limits at first
			if (res.status !== 200) {
				console.log('[EHD] #' + (index + 1) + ': Wrong Response Status');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nResposeHeaders >' + res.responseHeaders);

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
			else if (res.responseHeaders.indexOf('Content-Type:') < 0 || res.responseHeaders.split('Content-Type:')[1].split('\n')[0].split('/')[0].trim() !== 'image') {
				console.log('[EHD] #' + (index + 1) + ': Wrong Content-Type');
				console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nResposeHeaders >' + res.responseHeaders);

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
			imageList[index]['imageName'] = res.responseHeaders.match(ehDownloadRegex.resFileName) ? res.responseHeaders.match(ehDownloadRegex.resFileName)[1].trim().replace(ehDownloadRegex.dangerChars, '-') : imageList[index]['imageName'];
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
			console.log('[EHD] #' + (index + 1) + ': Network Error');
			console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nResposeHeaders >' + res.responseHeaders);

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
			console.log('[EHD] #' + (index + 1) + ': Timed Out');
			console.log('[EHD] #' + (index + 1) + ': RealIndex >', imageList[index]['realIndex'], ' | ReadyState >', res.readyState, ' | Status >', res.status, ' | StatusText >', res.statusText + '\nResposeHeaders >' + res.responseHeaders);

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

		if (blobObj !== null) {
			if ('close' in blobObj) blobObj.close();
			blobObj = null;
		}
	};
	ehDownloadDialog.appendChild(exitButton);
	ehDownloadDialog.scrollTop = ehDownloadDialog.scrollHeight;
}

// /*if pages range is set, then*/ get all pages URL to select needed pages
function getAllPagesURL() {
	pagesRange = [];
	var pagesRangeText = ehDownloadRange.querySelector('input').value.replace(/，/g, ',').trim();
	var retryCount = 0;

	if (pagesRangeText) { // if pages range is defined
		console.log('[EHD] Pages Range >', pagesRangeText);
		if (!ehDownloadRegex.pagesRange.test(pagesRangeText)) return alert('Pages Range is not correct.');

		var pagesRangeScale = pagesRangeText.match(/\d+-\d+|\d+/g);
		pagesRangeScale.forEach(function(elem){
			if (elem.indexOf('-') < 0) {
				var curElem = Number(elem);
				if (!pagesRange.some(function(e){ return curElem === e; })) pagesRange.push(curElem);
			}
			else {
				var curElem = [Number(elem.split('-')[0]), Number(elem.split('-')[1])].sort(function(a, b){ return a - b; });
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
		var pagesLength = [].reduce.call(document.querySelectorAll('.ptt td'), function(x, y){
			var i = Number(y.textContent);
			if (!isNaN(i)) return x > i ? x : i;
			else return x;
		});
		var curPage = 0;
		retryCount = 0;

		var xhr = new XMLHttpRequest();
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
			}

			var pagesURL = xhr.responseText.split('<div id="gdt">')[1].split('<div class="c">')[0].match(ehDownloadRegex.pagesURL);
			for (var i = 0; i < pagesURL.length; i++) {
				pageURLsList.push(pagesURL[i].split('"')[1].replaceHTMLEntites().replaceOrigin());
			}
			pushDialog('Succeed!');

			curPage++;
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
				pushDialog('\n\n');
				initProgressTable();
				requestDownload();
			}
			else {
				xhr.open('GET', location.pathname + '?p=' + curPage);
				xhr.send();
				pushDialog('\nFetching Archive Pages URL (' + (curPage + 1) + '/' + pagesLength + ') ... ');
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
		pushDialog('\nFetching Archive Pages URL (' + (curPage + 1) + '/' + pagesLength + ') ... ');
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
		pushDialog('\n\n');
		initProgressTable();
		requestDownload();
	}
}

function initEHDownload() {
	xhr.abort();
	for (var i = 0; i < fetchThread.length; i++) fetchThread[i].abort();
	if (blobObj !== null) {
		if ('close' in blobObj) blobObj.close();
		blobObj = null;
	}
	imageList = [];
	imageData = [];
	fetchThread = [];
	retryCount = [];
	downloadedCount = fetchCount = failedCount = 0;
	zip = new JSZip();

	dirName = getReplacedName(!setting['dir-name'] ? '{gid}_{token}' : setting['dir-name']);
	fileName = getReplacedName(!setting['file-name'] ? '{title}' : setting['file-name']);
	if (dirName === '/') dirName = '';
	needNumberImages = ehDownloadNumberInput.querySelector('input').checked;

	infoStr = document.getElementById('gn').textContent.replaceHTMLEntites() + '\n' 
	        + document.getElementById('gj').textContent.replaceHTMLEntites() + '\n' 
	        + window.location.href.replaceHTMLEntites() + '\n\n'
	        + 'Category: ' + document.getElementsByClassName('ic')[0].getAttribute('alt').toUpperCase() + '\n' 
	        + 'Uploader: ' + document.querySelector('#gdn a').textContent.replaceHTMLEntites() + '\n';
	var metaNodes = document.querySelectorAll('#gdd tr');
	for (var i = 0; i < metaNodes.length; i++) {
		var c1 = metaNodes[i].getElementsByClassName('gdt1')[0].textContent.replaceHTMLEntites();
		var c2 = metaNodes[i].getElementsByClassName('gdt2')[0].textContent.replaceHTMLEntites();
		infoStr += c1 + ' ' + c2 + '\n';
		if (c1 === 'File Size:' && (c2.indexOf('GB') > 0 || (c2.indexOf('MB') > 0 && parseFloat(c2) >= 200))) {
			if ((!setting['store-in-fs'] || !window.requestFileSystem) && (c2.indexOf('GB') > 0 || (c2.indexOf('MB') > 0 && parseFloat(c2) >= 450)) && !confirm('This archive is too large (original size), please consider downloading this archive in other way.\n\nMaximum allowed file size: Chrome / Opera 15+ 500MB | IE 10+ 600 MB | Firefox 20+ 800 MB\n(From FileSaver.js introduction)\n\nAre you sure to continue downloading? Please also consider your operating system\'s free memory, it may takes about double size of archive file size when generating ZIP file.\n\n* If you are using Chrome, you can try enabling "Request File System to handle large Zip file" on settings page.\n\n* You can set Pages Range to download this archive into some parts. If you have already enabled it, please ignore this message.')) return;
			else if (setting['store-in-fs'] && window.requestFileSystem) {
				ehDownloadFS.needFileSystem = true;
				var requiredBytes = parseInt(1024 * 1024 * ((c2.indexOf('MB') > 0 ? parseFloat(c2) : parseFloat(c2) * 1024) * 1.05));
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
									alert('You don\'t have enough free space where Chrome stored user data in (Default is system disk, normally it\'s C:), please delete some file.\n\nNeeded more than ' + (requiredBytes - grantedBytes) + ' Bytes.\n\nRoll back and use Blob to handle file.');
									if ((c2.indexOf('GB') > 0 || (c2.indexOf('MB') > 0 && parseFloat(c2) >= 450)) && !confirm('This archive is too large (original size), please consider downloading this archive in other way.\n\nMaximum allowed file size: Chrome / Opera 15+ 500MB | IE 10+ 600 MB | Firefox 20+ 800 MB\n(From FileSaver.js introduction)\n\nAre you sure to continue downloading? Please also consider your operating system\'s free memory, it may takes about double size of archive file size when generating ZIP file.\n\n* You can set Pages Range to download this archive into some parts. If you have already enabled it, please ignore this message.')) return;
								}
								else {
									pushDialog('\n<strong>Please allow storing large content if browser asked a request.</strong>\n');
									window.requestFileSystem(window.PERSISTENT, requiredBytes, ehDownloadFS.initHandler, ehDownloadFS.errorHandler);
								}
							}, ehDownloadFS.errorHandler);
						}
						else window.requestFileSystem(window.TEMPORARY, requiredBytes, ehDownloadFS.initHandler, ehDownloadFS.errorHandler);
					}, ehDownloadFS.errorHandler);
				}
				else window.requestFileSystem(window.TEMPORARY, requiredBytes, ehDownloadFS.initHandler, ehDownloadFS.errorHandler);
			}
		}
	}
	infoStr += 'Rating: ' + unsafeWindow.original_rating + '\n\n';
	if (document.getElementById('comment_0')) {
		infoStr += 'Uploader Comment:\n' + document.getElementById('comment_0').innerHTML.replace(/<br>|<br \/>/gi, '\n') + '\n\n';
	}
	isDownloading = true;
	pushDialog(infoStr);

	pushDialog('Start downloading at ' + new Date() + '\n');

	// get all pages url to fix 403 forbidden (download request was timed out)
	getAllPagesURL();
}

function initProgressTable(){
	progressTable = document.createElement('table');
	progressTable.className = 'ehD-pt';
	ehDownloadDialog.style.display = 'block';
	ehDownloadDialog.appendChild(progressTable);
}

function requestDownload(){
	var i = fetchCount, j = 0;
	for (/*var i = fetchCount*/; i < (setting['thread-count'] !== undefined ? setting['thread-count'] : 5); i++) {
		for (/*var j = 0*/; j < (pagesRange.length || pageURLsList.length); j++) {
			if (imageData[j] == null) {
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
	if (pagesRange.length) var realIndex = pagesRange[index];
	else var realIndex = index + 1;

	var node = document.createElement('tr');
	node.className = 'ehD-pt-item';
	node.innerHTML = '\
		<td class="ehD-pt-name">#' + realIndex + '</td>\
		<td class="ehD-pt-progress-outer">\
			<progress class="ehD-pt-progress"></progress>\
			<span class="ehD-pt-progress-text"></span>\
		</td>\
		<td class="ehD-pt-status">Fetching URL...</td>';
	progressTable.appendChild(node);
	ehDownloadDialog.scrollTop = ehDownloadDialog.scrollHeight;

	var nodeList = {
		current: node,
		fileName: node.getElementsByTagName('td')[0],
		status: node.getElementsByTagName('td')[2],
		progress: node.getElementsByTagName('progress')[0],
		progressText: node.getElementsByTagName('span')[0]
	};

	var retryCount = 0;
	var fetchURL = imageList[index] ? (imageList[index]['pageURL'] + ((!setting['never-send-nl'] && imageList[index]['nextNL']) ? (imageList[index]['pageURL'].indexOf('?') >= 0 ? '&' : '?') + 'nl=' + imageList[index]['nextNL'] : '')).replaceHTMLEntites() : pageURLsList[realIndex - 1];
	var xhr = new XMLHttpRequest();
	xhr.onload = function() {
		if (xhr.status !== 200 || !xhr.responseText) {
			if (retryCount < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
				//pushDialog('Failed! Retrying... ');
				updateProgress(nodeList, {
					status: 'Retrying (' + retryCount + ')...',
					progress: '',
					progressText: '',
					class: 'ehD-pt-warning'
				});
				retryCount++;
				xhr.open('GET', fetchURL);
				xhr.timeout = 30000;
				xhr.send();
			}
			else {
				failedCount++;

				console.error('[EHD] #' + realIndex + ': Failed getting image URL');
				updateProgress(nodeList, {
					status: 'Failed getting URL',
					progress: '0',
					progressText: '',
					class: 'ehD-pt-failed'
				});

				requestDownload();
			}
		}

		var imageURL = (unsafeWindow.apiuid !== -1 && xhr.responseText.indexOf('fullimg.php') >= 0 && !setting['force-resized']) ? xhr.responseText.match(ehDownloadRegex.imageURL[0])[1].replaceHTMLEntites().replaceOrigin() : xhr.responseText.indexOf('id="img"') > -1 ? xhr.responseText.match(ehDownloadRegex.imageURL[1])[1].replaceHTMLEntites() : xhr.responseText.match(ehDownloadRegex.imageURL[2])[1].replaceHTMLEntites();
		var fileName = xhr.responseText.match(ehDownloadRegex.fileName)[1].replaceHTMLEntites();
		var nextNL = ehDownloadRegex.nl.test(xhr.responseText) ? xhr.responseText.match(ehDownloadRegex.nl)[1] : null;
		var imageNumber = '';
		if (needNumberImages) {
			// Number images, thanks to JingJang@GitHub, source: https://github.com/JingJang/E-Hentai-Downloader
			if (!setting['number-real-index'] && pagesRange.length) { // if pages range was set and number original index is not required
				var len = pagesRange.length.toString().length + 1,
					padding = new Array(len < 3 ? len + 1 : len).join('0');
				imageNumber = (padding + (index + 1)).slice(0 - len);
			}
			else { // pages range was not set (download all pages, so index + 1 === realIndex) or number original index is required
				var len = pageURLsList.length.toString().length + 1,
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
		if (retryCount < (setting['retry-count'] !== undefined ? setting['retry-count'] : 3)) {
			//pushDialog('Failed! Retrying... ');
			updateProgress(nodeList, {
				status: 'Retrying (' + retryCount + ')...',
				progress: '',
				progressText: '',
				class: 'ehD-pt-warning'
			});
			retryCount++;
			xhr.open('GET', fetchURL);
			xhr.timeout = 30000;
			xhr.send();
		}
		else {
			failedCount++;

			console.error('[EHD] #' + realIndex + ': Failed getting image URL');
			updateProgress(nodeList, {
				status: 'Failed getting URL',
				progress: '0',
				progressText: '',
				class: 'ehD-pt-failed'
			});

			requestDownload();
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
				<div class="g2"><label>Download <input type="number" data-ehd-setting="thread-count" min="1" placeholder="5" style="width: 51px;"> images at the same time (<=5 is advised)</label></div>\
				<div class="g2"><label>Abort fetching current image after <input type="number" data-ehd-setting="timeout" min="0" placeholder="300" style="width: 51px;"> second(s) (0 is never abort)</label></div>\
				<div class="g2"' + ((GM_info.scriptHandler && GM_info.scriptHandler === 'Violentmonkey') ? ' style="opacity: 0.5;" title="Violentmonkey may not support this feature"' : '') + '><label>Skip current image when retried <input type="number" data-ehd-setting="retry-count" min="1" placeholder="3" style="width: 51px;"> time(s)</label></div>\
				<div class="g2"><label>Set folder name as <input type="text" data-ehd-setting="dir-name" placeholder="{gid}_{token}"> (if you don\'t want to create folder, use "<code>/</code>") *</label></div>\
				<div class="g2"><label>Set Zip file name as <input type="text" data-ehd-setting="file-name" placeholder="{title}"> *</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="number-images"> Number images (001：01.jpg, 002：01_theme.jpg, 003：02.jpg...) (Separator <input type="text" data-ehd-setting="number-separator" style="width: 51px;" placeholder="：">)</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="number-real-index"> Number images with original page number if pages range is set</label></div>\
				<div class="g2">\
					* Available templates: \
					<span title="You can find GID and token at the address bar like this: exhentai.org/g/[GID]/[Token]/">{gid} Archive\'s GID</sapn> | \
					<span title="You can find GID and token at the address bar like this: exhentai.org/g/[GID]/[Token]/">{token} Archive\'s token</sapn> | \
					<span title="This title is the English title or Latin transliteration, you can find it as the first line of the title.">{title} Archive\'s title</span> | \
					<span title="This title is the original language title, you can find it as the second line of the title.">{subtitle} Archive\'s sub-title</span> | \
					<span title="This tag means the sort name of the archive, and its output string is upper.">{tag} Archive\'s tag</span> | \
					<span title="You can find it at the left of the archive page.">{uploader} Archive\'s uploader</span>\
				</div>\
			</div>\
			<div data-setting-page="advanced" class="ehD-setting-content">\
				<div class="g2"><label>Set compression level as <input type="number" data-ehd-setting="compression-level" min="0" max="9" placeholder="0" style="width: 51px;"> (0 ~ 9, 0 is only store, not recommended to enable)</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="force-resized"> Force download resized image (never download original image) **</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="never-new-url"> Never get new image URL when failed downloading image **</label></div>\
				<div class="g2"><label><input type="checkbox" data-ehd-setting="never-send-nl"> Never send "nl" GET parameter when getting new image URL **</label></div>\
				<div class="g2"' + (window.requestFileSystem ? '' : ' style="opacity: 0.5;" title="Only Chrome support this feature"') + '><label><input type="checkbox" data-ehd-setting="store-in-fs"> Request File System to handle large Zip file (experiment, Chrome only) +</label></div>\
				<!--<div class="g2"><label><input type="checkbox" data-ehd-setting="auto-scale"> Auto scale Zip file at <input type="text" min="10" placeholder="250" style="width: 51px;" data-ehd-setting="scale-size"> MB if file is larger than <input type="text" min="10" placeholder="400" style="width: 51px;" data-ehd-setting="scale-reach"> MB (experiment) ***</label></div>-->\
				<div class="g2">\
					** Enable these options may save your image viewing limits <i><a href="https://github.com/ccloli/E-Hentai-Downloader/wiki/E%E2%88%92Hentai-Image-Viewing-Limits" target="_blank" style="color: #ffffff;">(See wiki)</a></i>, but may also cause some download problems.\
				</div>\
				<div class="g2">\
					+ Please pay attention to memory usage. I tested that the maximum accepted size is about (2GB - the memory used of this tab\'s process), and if browser cannot handle it, it will throw "Uncaught RangeError: Invalid array buffer length"\
				</div>\
				<!--<div class="g2">\
					*** <strong>This function is an experimental feature and may cause bug. </strong>Different browsers have different limit, See wiki for details.\
				</div>-->\
			</div>\
		</div>\
		<div class="ehD-setting-footer" style="text-align: center">\
			<button data-action="save">Save</button> <button data-action="cancel">Cancel</button>\
		</div>';
	document.body.appendChild(ehDownloadSettingPanel);
	
	for (var i in setting) {
		var element = ehDownloadSettingPanel.querySelector('input[data-ehd-setting="' + i + '"]');
		if (!element) continue;
		if (element.getAttribute('type') === 'checkbox') ((setting[i]) && (element.setAttribute('checked', 'checked')));
		else element.setAttribute('value', setting[i]);
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
				var inputs = ehDownloadSettingPanel.querySelectorAll('input[data-ehd-setting]');
				setting = {};
				for (var i = 0; i < inputs.length; i++) {
					if (inputs[i].getAttribute('type') !== 'checkbox' && inputs[i].value === '') continue;
					setting[inputs[i].dataset.ehdSetting] = inputs[i].getAttribute('type') === 'checkbox' ? inputs[i].checked : inputs[i].getAttribute('type') === 'number' ? Number(inputs[i].value) : inputs[i].value;
				}
				GM_setValue('ehD-setting', JSON.stringify(setting));
			}
			document.body.removeChild(ehDownloadSettingPanel);
		}
	});
}

// EHD Box, thanks to JingJang@GitHub, source: https://github.com/JingJang/E-Hentai-Downloader
var ehDownloadBox = document.createElement('fieldset');
ehDownloadBox.className = 'ehD-box';
ehDownloadBox.innerHTML = '<legend style="' + (origin === "http://exhentai.org" ? 'color: #ffff00; ' : '') + 'font-weight: 700;">E-Hentai Downloader</legend>\
	<style>' + ehDownloadStyle + '</style>';
// Use a lazy way to set stylesheet.

var ehDownloadArrow = '<img src="data:image/gif;base64,R0lGODlhBQAHALMAAK6vr7OztK+urra2tkJCQsDAwEZGRrKyskdHR0FBQUhISP///wAAAAAAAAAAAAAAACH5BAEAAAsALAAAAAAFAAcAAAQUUI1FlREVpbOUSkTgbZ0CUEhBLREAOw==">';

var ehDownloadAction = document.createElement('div');
ehDownloadAction.className = 'g2';
ehDownloadAction.innerHTML = ehDownloadArrow + ' <a>Download Archive</a>';
ehDownloadAction.addEventListener('click', function(event){
	event.preventDefault();
	if (isDownloading && !confirm('E-Hentai Downloader is working now, are you sure to stop downloading and start a new download?')) return;
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
ehDownloadRange.innerHTML = ehDownloadArrow + ' <a><label>Pages Range <input type="text" placeholder="eg. 1-10,12,14-20,27,30"></label></a>';
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

document.body.insertBefore(ehDownloadBox, document.getElementById('asm') || document.querySelector('.gm').nextElementSibling);

var ehDownloadDialog = document.createElement('div');
ehDownloadDialog.className = 'ehD-dialog';
document.body.appendChild(ehDownloadDialog);

window.onbeforeunload = function(){
	ehDownloadFS.removeFile(unsafeWindow.gid + '.zip');
	if (isDownloading) return 'E-Hentai Downloader is still running, please don\'t close this tab before it finished downloading.';
};

// Forced request File System to check if have temp archive
if (setting['store-in-fs'] && window.requestFileSystem) window.requestFileSystem(window.TEMPORARY, 1024 * 1024 * 1024, ehDownloadFS.initCheckerHandler, ehDownloadFS.errorHandler);