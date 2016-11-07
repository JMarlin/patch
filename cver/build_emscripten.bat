echo off

rem build wslib
echo . & call  emcc -c -o build/object.bc wslib/object.c
echo . & call  emcc -c -o build/listnode.bc wslib/listnode.c
echo . & call  emcc -c -o build/list.bc wslib/list.c
echo . & call  emcc -c -o build/associativearray.bc wslib/associativearray.c
echo . & call  emcc -c -o build/context.bc wslib/context.c
echo . & call  emcc -c -o build/styleutils.bc wslib/styleutils.c
echo . & call  emcc -c -o build/window.bc wslib/window.c 
echo . & call  emcc -c -o build/desktop.bc wslib/desktop.c 
echo . & call  emcc -c -o build/rect.bc wslib/rect.c
echo . & call  emcc -c -o build/textbox.bc wslib/textbox.c
echo . & call  emcc -c -o build/button.bc wslib/button.c

rem build core
echo . & call  emcc -c -o build/io.bc core/io.c 
echo . & call  emcc -c -o build/module.bc core/module.c
echo . & call  emcc -c -o build/patchcore.bc core/patchcore.c
echo . & call  emcc -c -o build/unit.bc core/unit.c 

rem build platform (will need to be smart about which platform to build and link in the future)
echo . & call  emcc -c -o build/audiohandler.bc platform/audiohandler.c 
echo . & call  emcc -c -o build/platformwrapper_emscripten.bc platform/platformwrapper_emscripten.c

rem build uilib
echo . & call  emcc -c -o build/frame.bc uilib/frame.c
echo . & call  emcc -c -o build/menu.bc uilib/menu.c
echo . & call  emcc -c -o build/menuentry.bc uilib/menuentry.c
echo . & call  emcc -c -o build/slider.bc uilib/slider.c

rem build units
echo . & call  emcc -c -o build/masterout.bc units/masterout.c
echo . & call  emcc -c -o build/noise.bc units/noise.c
echo . & call  emcc -c -o build/pitchknob.bc units/pitchknob.c
echo . & call  emcc -c -o build/sequence.bc units/sequence.c
echo . & call  emcc -c -o build/sine.bc units/sine.c
echo . & call  emcc -c -o build/square.bc units/square.c

rem build widgets
echo . & call  emcc -c -o build/patchdesktop.bc widgets/patchdesktop.c
echo . & call  emcc -c -o build/sessionmenu.bc widgets/sessionmenu.c

rem build main and link all
echo . & call  emcc -c -o build/main.bc main.c 
cd build
set expanded_list=
for /f "tokens=*" %%F in ('dir /b /a:-d "*.bc"') do call set expanded_list=%%expanded_list%% "%%F"
echo . & call  emcc -o ../current_build.js %expanded_list% -g -s NO_EXIT_RUNTIME=1
cd ..

:end