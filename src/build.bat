:: cd to /src
cd /d %~dp0

set output_path=..\e-hentai-downloader.user.js
set meta_js_path=..\e-hentai-downloader.meta.js
set parts_js_dir=.\

type %meta_js_path%>%output_path%
type %parts_js_dir%first.js>>%output_path%
type %parts_js_dir%JSZip.js>>%output_path%
type %parts_js_dir%FileSaver.js>>%output_path%
type %parts_js_dir%xScripts.js>>%output_path%
type %parts_js_dir%main.js>>%output_path%
