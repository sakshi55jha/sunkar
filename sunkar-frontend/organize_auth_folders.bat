@echo off
echo Re-structuring Auth Folders...
cd /d "c:\__Sneha All Doc\sunkar\sunkar-frontend\app"

if not exist "(auth)" mkdir "(auth)"

if exist "sign-in" move "sign-in" "(auth)\sign-in"
if exist "sign-up-creator" move "sign-up-creator" "(auth)\sign-up-creator"
if exist "sign-up-listener" move "sign-up-listener" "(auth)\sign-up-listener"
if exist "choose-role" move "choose-role" "(auth)\choose-role"
if exist "auth-redirect" move "auth-redirect" "(auth)\auth-redirect"
if exist "sso-callback" move "sso-callback" "(auth)\sso-callback"

if exist "sign-up" (
    echo Deleting unused generic sign-up folder...
    rmdir /s /q "sign-up"
)

echo Done organizing folders and deleting old unused files!
pause
