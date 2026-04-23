@echo off
echo Cleaning Next.js cache and fixing conflicting files...
cd /d "c:\__Sneha All Doc\sunkar\sunkar-frontend"

if exist "app\middleware.ts" (
    echo Deleting invalid app\middleware.ts...
    del "app\middleware.ts"
)

if exist ".next" (
    echo Deleting .next cache folder...
    rmdir /s /q ".next"
)

echo Done! Please restart your frontend server by running `npm run dev` again.
pause
