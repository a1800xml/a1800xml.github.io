for /r %%i in (*.xml) do "C:\Program Files\7-Zip\7z.exe" -mx9 a -tgzip %%i.gz %%i
PAUSE