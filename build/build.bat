

::------------------------------------------------------
:: step 1 - Deploy code
::------------------------------------------------------

set srcFE=%1\public\target
set srcApp=%1\app.js
set srcPackage=%1\build\package.json

set prod=%2
set prodFE=%2\public
set prodApp=%2\app.js
set prodPackage=%2\package.json


::-- copy relevant code to Prod env -----------


IF Exist %prod% (
  rd  %prod% /S /Q
)

md %prodFE%

xcopy %srcFE% %prodFE%  /S  /Q

copy %srcApp% %prodApp%
copy %srcPackage% %prodPackage%


::-- remove target from dev env --------


rd  %srcFE% /S /Q
echo web: node app.js > %2\Procfile


::------------------------------------------------------
:: step 2 - Install npm
::------------------------------------------------------

cd %2
npm install

cd %2
taskkill /IM node.exe /F
node app.js

