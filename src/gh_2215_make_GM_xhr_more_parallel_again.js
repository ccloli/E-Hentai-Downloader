// see https://github.com/Tampermonkey/utils/blob/main/requires/gh_2215_make_GM_xhr_more_parallel_again.js
// the patch also converts all ES2015+ to ES5 by using Babel in case of really old browsers
var patchTMSerializedGMXhr = (function() {

// only very old GreaseMonkey (or newer 4.x?) may not have GM_info,
// since it's GM (and of course it's not MV3), it doesn't need a patch.
if (typeof GM_info === 'undefined') {
	return true;
}

var _excluded = ["onload", "onloadend", "onerror", "onabort", "ontimeout"],
	_excluded2 = ["onload", "ontimeout", "onerror"];
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
// start of gh_2215_make_GM_xhr_more_parallel_again.js
/*
 * https://github.com/Tampermonkey/tampermonkey/issues/2215
 *
 * This script provides a workaround for a Chrome MV3 issue (https://github.com/w3c/webextensions/issues/694)
 * where extensions can't set/delete headers that are preserved over redirects.
 *
 * By setting `redirect: 'manual'` and following redirects manually, this script ensures request redirects work
 * as intended and requests to different URLs are made in parallel (again).
 *
 * Userscript authors should include this as a `@require` when they need to make parallel requests with GM_xmlhttpRequest,
 * especially if requests might take a long time to complete.
 *
 * Including this script will modify the behavior of GM_xmlhttpRequest and GM.xmlHttpRequest in Tampermonkey only.
 *
 * Usage:
 *
 * Add this to the metadata block of your userscript:
 *
 * // @grant     GM_xmlhttpRequest
 * // @require   https://raw.githubusercontent.com/Tampermonkey/utils/refs/heads/main/requires/gh_2215_make_GM_xhr_more_parallel_again.js
 *
**/

/* global GM_info, GM_xmlhttpRequest, GM */

var HAS_GM = typeof GM !== 'undefined';
var NEW_GM = function (scope, GM) {
	// Check if running in Tampermonkey and if version supports redirect control
	if (GM_info.scriptHandler !== "Tampermonkey" || compareVersions(GM_info.version, "5.3.2") < 0) return;

	// Backup original functions
	var GM_xmlhttpRequestOrig = GM_xmlhttpRequest;
	var GM_xmlHttpRequestOrig = GM.xmlHttpRequest;
	function compareVersions(v1, v2) {
		var parts1 = v1.split('.').map(Number);
		var parts2 = v2.split('.').map(Number);
		var length = Math.max(parts1.length, parts2.length);
		for (var i = 0; i < length; i++) {
			var num1 = parts1[i] || 0;
			var num2 = parts2[i] || 0;
			if (num1 > num2) return 1;
			if (num1 < num2) return -1;
		}
		return 0;
	}

	// Wrapper for GM_xmlhttpRequest
	function GM_xmlhttpRequestWrapper(odetails) {
		// If redirect is manually set, simply pass odetails to the original function
		if (odetails.redirect !== undefined) {
			return GM_xmlhttpRequestOrig(odetails);
		}

		// Warn if onprogress is used with settings incompatible with fetch mode used in background
		if (odetails.onprogress || odetails.fetch === false) {
			console.warn("Fetch mode does not support onprogress in the background.");
		}
		var _onload = odetails.onload,
			onloadend = odetails.onloadend,
			_onerror = odetails.onerror,
			_onabort = odetails.onabort,
			_ontimeout = odetails.ontimeout,
			details = _objectWithoutProperties(odetails, _excluded);

		// Set redirect to manual and handle redirects
		var _handleRedirects = function handleRedirects(initialDetails) {
			var request = GM_xmlhttpRequestOrig(_objectSpread(_objectSpread({}, initialDetails), {}, {
				redirect: 'manual',
				onload: function onload(response) {
					if (response.status >= 300 && response.status < 400) {
						var m = response.responseHeaders.match(/Location:\s*(\S+)/i);
						// Follow redirect manually
						var redirectUrl = m && m[1];
						if (redirectUrl) {
							var absoluteUrl = new URL(redirectUrl, initialDetails.url).href;
							_handleRedirects(_objectSpread(_objectSpread({}, initialDetails), {}, {
								url: absoluteUrl
							}));
							return;
						}
					}
					if (_onload) _onload.call(this, response);
					if (onloadend) onloadend.call(this, response);
				},
				onerror: function onerror(response) {
					if (_onerror) _onerror.call(this, response);
					if (onloadend) onloadend.call(this, response);
				},
				onabort: function onabort(response) {
					if (_onabort) _onabort.call(this, response);
					if (onloadend) onloadend.call(this, response);
				},
				ontimeout: function ontimeout(response) {
					if (_ontimeout) _ontimeout.call(this, response);
					if (onloadend) onloadend.call(this, response);
				}
			}));
			return request;
		};
		return _handleRedirects(details);
	}

	// Wrapper for GM.xmlHttpRequest
	function GM_xmlHttpRequestWrapper(odetails) {
		var abort;
		var p = new Promise(function (resolve, reject) {
			var onload = odetails.onload,
				ontimeout = odetails.ontimeout,
				onerror = odetails.onerror,
				send = _objectWithoutProperties(odetails, _excluded2);
			send.onerror = function (r) {
				if (onerror) {
					resolve(r);
					onerror.call(this, r);
				} else {
					reject(r);
				}
			};
			send.ontimeout = function (r) {
				if (ontimeout) {
					// See comment above
					resolve(r);
					ontimeout.call(this, r);
				} else {
					reject(r);
				}
			};
			send.onload = function (r) {
				resolve(r);
				if (onload) onload.call(this, r);
			};
			var a = GM_xmlhttpRequestWrapper(send).abort;
			if (abort === true) {
				a();
			} else {
				abort = a;
			}
		});
		p.abort = function () {
			if (typeof abort === 'function') {
				abort();
			} else {
				abort = true;
			}
		};
		return p;
	}

	// Export wrappers
	GM_xmlhttpRequest = GM_xmlhttpRequestWrapper;
	scope.GM_xmlhttpRequestOrig = GM_xmlhttpRequestOrig;
	var gopd = Object.getOwnPropertyDescriptor(GM, 'xmlHttpRequest');
	if (gopd && gopd.configurable === false) {
		return {
			__proto__: GM,
			xmlHttpRequest: GM_xmlHttpRequestWrapper,
			xmlHttpRequestOrig: GM_xmlHttpRequestOrig
		};
	} else {
		GM.xmlHttpRequest = GM_xmlHttpRequestWrapper;
		GM.xmlHttpRequestOrig = GM_xmlHttpRequestOrig;
	}
}(this, HAS_GM ? GM : {});
if (HAS_GM && NEW_GM) GM = NEW_GM;
// end of gh_2215_make_GM_xhr_more_parallel_again.js

var result = !!this.GM_xmlhttpRequestOrig || !!(GM || {}).xmlHttpRequestOrig;
console.info('[EHD] Patch GM_xhr >', result);
return result;

}).bind(this);

var revertTMSerializedGMXhrPatch = (function() {
	try {
		var GM_xmlhttpRequestOrig = this.GM_xmlhttpRequestOrig;
		var GM_xmlHttpRequestOrig = (GM || {}).xmlHttpRequestOrig;

		if (GM_xmlhttpRequestOrig) {
			GM_xmlhttpRequest = GM_xmlhttpRequestOrig;
		}
		if (GM_xmlHttpRequestOrig) {
			if (typeof GM !== 'undefined') {
				const gopd = Object.getOwnPropertyDescriptor(GM, 'xmlHttpRequest');
				if (gopd && gopd.configurable === false) {
					GM = {
						__proto__: GM,
						xmlHttpRequest: GM_xmlHttpRequestOrig
					};
				} else {
					GM.xmlHttpRequest = GM_xmlHttpRequestOrig;
				}
			}
		}
		console.info('[EHD] Patch GM_xhr >', false);
		return true;
	} catch (err) {
		console.warn('[EHD] Failed to revert GM_xhr patch');
	}

	return false;
}).bind(this);