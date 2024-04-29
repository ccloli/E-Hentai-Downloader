@echo off

:: Paths
set SCRIPT_DIR=%~dp0
set X_DIR=.x
set X_DIR_FULL=%SCRIPT_DIR%%X_DIR%


:: Clone repository
if not exist "%X_DIR_FULL%" git clone https://github.com/dnsev-h/x.git "%X_DIR_FULL%" --depth 1


:: Setup node dependencies
pushd "%X_DIR_FULL%"

call npm install "browserify@16.2.3" babelify @babel/core @babel/preset-env --no-save

set NODE_BIN_DIR=%X_DIR_FULL%\node_modules\.bin
for /F "usebackq delims=" %%a in (`call npm bin`) do SET NODE_BIN_DIR=%%a


:: Setup file names
set MAIN_FILE_TEMP=%SCRIPT_DIR%main-temp.js
set XSCRIPTS_FILE=%SCRIPT_DIR%xScripts.js

:: Clean files before running
del "%MAIN_FILE_TEMP%" > NUL 2> NUL
del "%XSCRIPTS_FILE%" > NUL 2> NUL

:: Create main entry point
echo module.exports.getFromHtml=require('./%X_DIR%/src/api/gallery-info/get-from-html');>"%MAIN_FILE_TEMP%"
echo module.exports.toCommonJson=require('./%X_DIR%/src/api/gallery-info/common-json').toCommonJson;>>"%MAIN_FILE_TEMP%"

:: Add license
echo /*>"%XSCRIPTS_FILE%"
type "%X_DIR_FULL%\LICENSE">>"%XSCRIPTS_FILE%"
echo.>>"%XSCRIPTS_FILE%"
echo */>>"%XSCRIPTS_FILE%"

:: Browserify
call "%NODE_BIN_DIR%\browserify" "%MAIN_FILE_TEMP%" --standalone xScripts -t [ babelify --presets [ @babel/preset-env ] ] >> "%XSCRIPTS_FILE%"

:: Clean temp file
del "%MAIN_FILE_TEMP%" > NUL 2> NUL

popd
