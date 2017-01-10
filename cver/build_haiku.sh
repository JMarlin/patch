#!/bin/sh
cd build

set C_OPTS = -g -D PLATFORM_HAIKU=1

# build wslib
echo . & gcc -c -o object.o ../wslib/object.c $C_OPTS
echo . & gcc -c -o listnode.o ../wslib/listnode.c $C_OPTS
echo . & gcc -c -o list.o ../wslib/list.c $C_OPTS
echo . & gcc -c -o associativearray.o ../wslib/associativearray.c $C_OPTS
echo . & gcc -c -o context.o ../wslib/context.c $C_OPTS
echo . & gcc -c -o styleutils.o ../wslib/styleutils.c $C_OPTS
echo . & gcc -c -o window.o ../wslib/window.c $C_OPTS 
echo . & gcc -c -o desktop.o ../wslib/desktop.c $C_OPTS 
echo . & gcc -c -o rect.o ../wslib/rect.c $C_OPTS
echo . & gcc -c -o textbox.o ../wslib/textbox.c $C_OPTS
echo . & gcc -c -o button.o ../wslib/button.c $C_OPTS

# build core
echo . & gcc -c -o io.o ../core/io.c $C_OPTS 
echo . & gcc -c -o module.o ../core/module.c $C_OPTS
echo . & gcc -c -o patchcore.o ../core/patchcore.c $C_OPTS
echo . & gcc -c -o unit.o ../core/unit.c $C_OPTS 

# build platform (will need to be smart about which platform to build and link in the future)
echo . & gcc -c -o audiohandler.o ../platform/audiohandler.c $C_OPTS 
echo . & g++ -c -o platformwrapper_haiku.o ../platform/platformwrapper_haiku.cpp $C_OPTS

# build uilib
echo . & gcc -c -o frame.o ../uilib/frame.c $C_OPTS
echo . & gcc -c -o menu.o ../uilib/menu.c $C_OPTS
echo . & gcc -c -o menuentry.o ../uilib/menuentry.c $C_OPTS
echo . & gcc -c -o slider.o ../uilib/slider.c $C_OPTS

# build units
echo . & gcc -c -o masterout.o ../units/masterout.c $C_OPTS
echo . & gcc -c -o noise.o ../units/noise.c $C_OPTS
echo . & gcc -c -o pitchknob.o ../units/pitchknob.c $C_OPTS
echo . & gcc -c -o sequence.o ../units/sequence.c $C_OPTS
echo . & gcc -c -o sine.o ../units/sine.c $C_OPTS
echo . & gcc -c -o square.o ../units/square.c $C_OPTS
echo . & gcc -c -o vca.o ../units/vca.c $C_OPTS
echo . & gcc -c -o adsr.o ../units/adsr.c $C_OPTS
echo . & gcc -c -o split.o ../units/split.c $C_OPTS
echo . & gcc -c -o scope.o ../units/scope.c $C_OPTS

# build widgets
echo . & gcc -c -o patchdesktop.o ../widgets/patchdesktop.c $C_OPTS
echo . & gcc -c -o sessionmenu.o ../widgets/sessionmenu.c $C_OPTS

# build main and link all
echo . & gcc -c -o main.o ../main.c $C_OPTS 
echo . & g++ -o ../patch_haiku ./*.o $C_OPTS -lm -lbe -lmedia -lgame
cd ..
