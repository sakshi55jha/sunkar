@echo off
echo Updating Prisma Client and syncing database...
cd /d "c:\__Sneha All Doc\sunkar\sunkar-backend"
call npx prisma generate
call npx prisma db push
echo Done! Please restart your backend server.
pause
