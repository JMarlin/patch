#ifndef PATCHDESKTOP_H
#define PATCHDESKTOP_H

#include "../wslib/desktop.h"
#include "../core/io.h"
#include "sessionmenu.h"

typedef struct PatchDesktop_struct {
    Desktop desktop;
    PatchCore* patch_core;
    IO* start_io;
    int wire_x;
    int wire_y;
    SessionMenu* menu;
} PatchDesktop;

PatchDesktop* PatchDesktop_new(PatchCore* patch_core);
void PatchDesktop_mouseclick_handler(Window* patch_desktop_window, int x, int y);
void PatchDesktop_paint_handler(Window* patch_desktop_window);
void PatchDesktop_connect_action(PatchDesktop* patch_desktop, IO* io);
void PatchDesktop_begin_connection(PatchDesktop* patch_desktop, IO* io);
void PatchDesktop_finish_connection(PatchDesktop* patch_desktop, IO* io);
void PatchDesktop_end_connection(PatchDesktop* patch_desktop);
void PatchDesktop_mousemove_handler(Window* patch_desktop_window, int x, int y);
void PatchDesktop_delete_function(Object* patch_desktop_object);

#endif //PATCHDESKTOP_H