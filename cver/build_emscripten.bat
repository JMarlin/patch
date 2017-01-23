echo off

cd build

rem build wslib
echo . & call  emcc -c -o object.bc ../wslib/object.c -g4 
echo . & call  emcc -c -o listnode.bc ../wslib/listnode.c -g4
echo . & call  emcc -c -o list.bc ../wslib/list.c -g4
echo . & call  emcc -c -o associativearray.bc ../wslib/associativearray.c -g4
echo . & call  emcc -c -o context.bc ../wslib/context.c -g4
echo . & call  emcc -c -o styleutils.bc ../wslib/styleutils.c -g4
echo . & call  emcc -c -o window.bc ../wslib/window.c -g4 
echo . & call  emcc -c -o desktop.bc ../wslib/desktop.c -g4 
echo . & call  emcc -c -o rect.bc ../wslib/rect.c -g4
echo . & call  emcc -c -o textbox.bc ../wslib/textbox.c -g4
echo . & call  emcc -c -o button.bc ../wslib/button.c -g4

rem build core
echo . & call  emcc -c -o io.bc ../core/io.c -g4 
echo . & call  emcc -c -o module.bc ../core/module.c -g4
echo . & call  emcc -c -o patchcore.bc ../core/patchcore.c -g4
echo . & call  emcc -c -o unit.bc ../core/unit.c -g4 

rem build platform (will need to be smart about which platform to build and link in the future)
echo . & call  emcc -c -o audiohandler.bc ../platform/audiohandler.c -g4 
echo . & call  emcc -c -o platformwrapper_emscripten.bc ../platform/platformwrapper_emscripten.c -g4

rem build uilib
echo . & call  emcc -c -o frame.bc ../uilib/frame.c -g4
echo . & call  emcc -c -o menu.bc ../uilib/menu.c -g4
echo . & call  emcc -c -o menuentry.bc ../uilib/menuentry.c -g4
echo . & call  emcc -c -o slider.bc ../uilib/slider.c -g4

rem build units
echo . & call  emcc -c -o masterout.bc ../units/masterout.c -g4
echo . & call  emcc -c -o masteroutthru.bc ../units/masteroutthru.c -g4
echo . & call  emcc -c -o noise.bc ../units/noise.c -g4
echo . & call  emcc -c -o pitchknob.bc ../units/pitchknob.c -g4
echo . & call  emcc -c -o sequence.bc ../units/sequence.c -g4
echo . & call  emcc -c -o sine.bc ../units/sine.c -g4
echo . & call  emcc -c -o square.bc ../units/square.c -g4
echo . & call  emcc -c -o vca.bc ../units/vca.c -g4
echo . & call  emcc -c -o adsr.bc ../units/adsr.c -g4
echo . & call  emcc -c -o split.bc ../units/split.c -g4
echo . & call  emcc -c -o scope.bc ../units/scope.c -g4
echo . & call  emcc -c -o capture.bc ../units/capture.c -g4

rem build widgets
echo . & call  emcc -c -o patchdesktop.bc ../widgets/patchdesktop.c -g4
echo . & call  emcc -c -o sessionmenu.bc ../widgets/sessionmenu.c -g4

rem build serialify
echo . & call  emcc -c -o serialify.bc ../serialify/serialify.c -g4

rem build main and link all
echo . & call  emcc -c -o main.bc ../main.c -g4 
set expanded_list=
for /f "tokens=*" %%F in ('dir /b /a:-d "*.bc"') do call set expanded_list=%%expanded_list%% "%%F"
echo . & call  emcc -o ../current_build.js %expanded_list% -g4 -s NO_EXIT_RUNTIME=1 -s ALLOW_MEMORY_GROWTH=1
cd ..

:end
