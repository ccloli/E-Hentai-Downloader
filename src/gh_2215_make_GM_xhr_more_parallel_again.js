// see https://github.com/Tampermonkey/utils/blob/main/requires/gh_2215_make_GM_xhr_more_parallel_again.js
var patchTMSerializedGMXhr = (function() {

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

const HAS_GM = typeof GM !== 'undefined';
const NEW_GM = ((scope, GM) => {
    // Check if running in Tampermonkey and if version supports redirect control
    if (GM_info.scriptHandler !== "Tampermonkey" || compareVersions(GM_info.version, "5.3.2") < 0) return;

    // Backup original functions
    const GM_xmlhttpRequestOrig = GM_xmlhttpRequest;
    const GM_xmlHttpRequestOrig = GM.xmlHttpRequest;

    function compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        const length = Math.max(parts1.length, parts2.length);

        for (let i = 0; i < length; i++) {
            const num1 = parts1[i] || 0;
            const num2 = parts2[i] || 0;

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

        const {
            onload,
            onloadend,
            onerror,
            onabort,
            ontimeout,
            ...details
        } = odetails;

        // Set redirect to manual and handle redirects
        const handleRedirects = (initialDetails) => {
            const request = GM_xmlhttpRequestOrig({
                ...initialDetails,
                redirect: 'manual',
                onload: function(response) {
                    if (response.status >= 300 && response.status < 400) {
                        const m = response.responseHeaders.match(/Location:\s*(\S+)/i);
                        // Follow redirect manually
                        const redirectUrl = m && m[1];
                        if (redirectUrl) {
                            const absoluteUrl = new URL(redirectUrl, initialDetails.url).href;
                            handleRedirects({ ...initialDetails, url: absoluteUrl });
                            return;
                        }
                    }

                    if (onload) onload.call(this, response);
                    if (onloadend) onloadend.call(this, response);
                },
                onerror: function(response) {
                    if (onerror) onerror.call(this, response);
                    if (onloadend) onloadend.call(this, response);
                },
                onabort: function(response) {
                    if (onabort) onabort.call(this, response);
                    if (onloadend) onloadend.call(this, response);
                },
                ontimeout: function(response) {
                    if (ontimeout) ontimeout.call(this, response);
                    if (onloadend) onloadend.call(this, response);
                }
            });
            return request;
        };

        return handleRedirects(details);
    }

    // Wrapper for GM.xmlHttpRequest
    function GM_xmlHttpRequestWrapper(odetails) {
        let abort;

        const p = new Promise((resolve, reject) => {
            const { onload, ontimeout, onerror, ...send } = odetails;

            send.onerror = function(r) {
                if (onerror) {
                    resolve(r);
                    onerror.call(this, r);
                } else {
                    reject(r);
                }
            };
            send.ontimeout = function(r) {
                if (ontimeout) {
                    // See comment above
                    resolve(r);
                    ontimeout.call(this, r);
                } else {
                    reject(r);
                }
            };
            send.onload = function(r) {
                resolve(r);
                if (onload) onload.call(this, r);
            };

            const a = GM_xmlhttpRequestWrapper(send).abort;
            if (abort === true) {
                a();
            } else {
                abort = a;
            }
        });

        p.abort =  () => {
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

    const gopd = Object.getOwnPropertyDescriptor(GM, 'xmlHttpRequest');
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
})(this, HAS_GM ? GM : {});

if (HAS_GM && NEW_GM) GM = NEW_GM;
// end of gh_2215_make_GM_xhr_more_parallel_again.js

}).bind(this);
