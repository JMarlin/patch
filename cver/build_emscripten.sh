#!/bin/sh
cd build

# build wslib
echo . & emcc -c -o object.bc ../wslib/object.c -g4 
echo . & emcc -c -o listnode.bc ../wslib/listnode.c -g4
echo . & emcc -c -o list.bc ../wslib/list.c -g4
echo . & emcc -c -o associativearray.bc ../wslib/associativearray.c -g4
echo . & emcc -c -o context.bc ../wslib/context.c -g4
echo . & emcc -c -o styleutils.bc ../wslib/styleutils.c -g4
echo . & emcc -c -o window.bc ../wslib/window.c -g4 
echo . & emcc -c -o desktop.bc ../wslib/desktop.c -g4 
echo . & emcc -c -o rect.bc ../wslib/rect.c -g4
echo . & emcc -c -o textbox.bc ../wslib/textbox.c -g4
echo . & emcc -c -o button.bc ../wslib/button.c -g4

# build core
echo . & emcc -c -o io.bc ../core/io.c -g4 
echo . & emcc -c -o module.bc ../core/module.c -g4
echo . & emcc -c -o patchcore.bc ../core/patchcore.c -g4
echo . & emcc -c -o unit.bc ../core/unit.c -g4 

# build platform (will need to be smart about which platform to build and link in the future)
echo . & emcc -c -o audiohandler.bc ../platform/audiohandler.c -g4 
echo . & emcc -c -o platformwrapper_emscripten.bc ../platform/platformwrapper_emscripten.c -g4

# build uilib
echo . & emcc -c -o frame.bc ../uilib/frame.c -g4
echo . & emcc -c -o menu.bc ../uilib/menu.c -g4
echo . & emcc -c -o menuentry.bc ../uilib/menuentry.c -g4
echo . & emcc -c -o slider.bc ../uilib/slider.c -g4

# build units
echo . & emcc -c -o masterout.bc ../units/masterout.c -g4
echo . & emcc -c -o masteroutthru.bc ../units/masteroutthru.c -g4
echo . & emcc -c -o noise.bc ../units/noise.c -g4
echo . & emcc -c -o pitchknob.bc ../units/pitchknob.c -g4
echo . & emcc -c -o sequence.bc ../units/sequence.c -g4
echo . & emcc -c -o sine.bc ../units/sine.c -g4
echo . & emcc -c -o square.bc ../units/square.c -g4
echo . & emcc -c -o vca.bc ../units/vca.c -g4
echo . & emcc -c -o adsr.bc ../units/adsr.c -g4
echo . & emcc -c -o split.bc ../units/split.c -g4
echo . & emcc -c -o scope.bc ../units/scope.c -g4

# build widgets
echo . & emcc -c -o patchdesktop.bc ../widgets/patchdesktop.c -g4
echo . & emcc -c -o sessionmenu.bc ../widgets/sessionmenu.c -g4

# build main and link all
echo . & emcc -c -o main.bc ../main.c -g4 
echo . & emcc -o ../current_build.js ./*.bc -g4 -s NO_EXIT_RUNTIME=1 -s ALLOW_MEMORY_GROWTH=1
cd ..
