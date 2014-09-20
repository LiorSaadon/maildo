::@echo off  - do not do off if you want to see the result of cd   !!!


::------------------------------------------------------
:: step 2 - Deploy code
::------------------------------------------------------

set srcBE=%1\backEnd
set srcFE=%1\public\target
set srcApp=%1\app.js
set srcPackage=%1\build\package.json

set qa=%2
set qaBE=%2\backEnd
set qaFE=%2\public
set qaApp=%2\app.js
set qaAppTxt=%2\app.txt
set qaAppTxt1=%2\app1.txt
set qaPackage=%2\package.json

set prod=%3
set prodBE=%3\backEnd
set prodFE=%3\public
set prodApp=%3\app.js
set prodPackage=%3\package.json


::-- copy relevant code to QA env -----------


IF Exist %qa% (
  rd  %qa% /S /Q
)

::md %qaBE%
md %qaFE%

::xcopy %srcBE% %qaBE%  /S  /Q
xcopy %srcFE% %qaFE%  /S  /Q

copy %srcApp% %qaAppTxt%
copy %srcConfig% %qaConfig%
copy %srcPackage% %qaPackage%



::-- copy relevant code to Prod env -----------


IF Exist %prod% (
  rd  %prod% /S /Q
)

::md %prodBE%
md %prodFE%

::xcopy %srcBE% %prodBE%  /S  /Q
xcopy %srcFE% %prodFE%  /S  /Q

copy %srcApp% %prodApp%
copy %srcConfig% %prodConfig%
copy %srcPackage% %prodPackage%

