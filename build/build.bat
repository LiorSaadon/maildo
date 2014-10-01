
::------------------------------------------------------
:: step 2 - Deploy code
::------------------------------------------------------

set srcBE=%1\backEnd
set srcFE=%1\public\target
set srcApp=%1\app.js
set srcPackage=%1\build\package.json

set prod=%3
set prodBE=%3\backEnd
set prodFE=%3\public
set prodApp=%3\app.js
set prodPackage=%3\package.json


::-- copy relevant code to Prod env -----------


IF Exist %prod% (
  rd  %prod% /S /Q
)

md %prodFE%

xcopy %srcFE% %prodFE%  /S  /Q

copy %srcApp% %prodApp%
copy %srcConfig% %prodConfig%
copy %srcPackage% %prodPackage%


::-- remove target from dev env --------


rd  %srcFE% /S /Q
echo web: node app.js > %3\Procfile
