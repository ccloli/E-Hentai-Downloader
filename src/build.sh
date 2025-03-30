#!/usr/bin/env bash
cd `dirname $(pwd)/$0`
output_path="../e-hentai-downloader.user.js"
meta_js_path="../e-hentai-downloader.meta.js"
parts_js_dir="./"

cat $meta_js_path>$output_path
cat $parts_js_dir"first.js">>$output_path
cat $parts_js_dir"JSZip.js">>$output_path
cat $parts_js_dir"FileSaver.js">>$output_path
cat $parts_js_dir"gh_2215_make_GM_xhr_more_parallel_again.js">>$output_path
cat $parts_js_dir"main.js">>$output_path
