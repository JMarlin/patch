#!/bin/sh
cd build

# build wslib
echo . & gcc -c -o object.o ../wslib/object.c -g
echo . & gcc -c -o listnode.o ../wslib/listnode.c -g
echo . & gcc -c -o list.o ../wslib/list.c -g
echo . & gcc -c -o associativearray.o ../wslib/associativearray.c -g
echo . & gcc -c -o context.o ../wslib/context.c -g
echo . & gcc -c -o styleutils.o ../wslib/styleutils.c -g
echo . & gcc -c -o window.o ../wslib/window.c -g 
echo . & gcc -c -o desktop.o ../wslib/desktop.c -g 
echo . & gcc -c -o rect.o ../wslib/rect.c -g
echo . & gcc -c -o textbox.o ../wslib/textbox.c -g
echo . & gcc -c -o button.o ../wslib/button.c -g

# build core
echo . & gcc -c -o io.o ../core/io.c -g 
echo . & gcc -c -o module.o ../core/module.c -g
echo . & gcc -c -o patchcore.o ../core/patchcore.c -g
echo . & gcc -c -o unit.o ../core/unit.c -g 

# build platform (will need to be smart about which platform to build and link in the future)
echo . & gcc -c -o audiohandler.o ../platform/audiohandler.c -g 
echo . & g++ -c -o platformwrapper_haiku.o ../platform/platformwrapper_haiku.cpp -g

# build uilib
echo . & gcc -c -o frame.o ../uilib/frame.c -g
echo . & gcc -c -o menu.o ../uilib/menu.c -g
echo . & gcc -c -o menuentry.o ../uilib/menuentry.c -g
echo . & gcc -c -o slider.o ../uilib/slider.c -g

# build units
echo . & gcc -c -o masterout.o ../units/masterout.c -g
echo . & gcc -c -o noise.o ../units/noise.c -g
echo . & gcc -c -o pitchknob.o ../units/pitchknob.c -g
echo . & gcc -c -o sequence.o ../units/sequence.c -g
echo . & gcc -c -o sine.o ../units/sine.c -g
echo . & gcc -c -o square.o ../units/square.c -g
echo . & gcc -c -o vca.o ../units/vca.c -g
echo . & gcc -c -o adsr.o ../units/adsr.c -g
echo . & gcc -c -o split.o ../units/split.c -g

# build widgets
echo . & gcc -c -o patchdesktop.o ../widgets/patchdesktop.c -g
echo . & gcc -c -o sessionmenu.o ../widgets/sessionmenu.c -g

# build main and link all
echo . & gcc -c -o main.o ../main.c -g 
echo . & g++ -o ../patch_haiku ./*.o -g -lm -lbe
cd ..
