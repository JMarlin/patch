#ifndef PATCHDESKTOP_H
#define PATCHDESKTOP_H

struct PatchDesktop_struct;

#include "../wslib/desktop.h"
#include "../core/io.h"
#include "sessionmenu.h"
#include "../core/patchcore.h"

typedef struct PatchDesktop_struct {
    Desktop desktop;
    struct PatchCore_struct* patch_core;
    Context* base_context;
    struct IO_struct* start_io;
    int wire_x;
    int wire_y;
    struct SessionMenu_struct* menu;
} PatchDesktop;

PatchDesktop* PatchDesktop_new(struct PatchCore_struct* patch_core);
void PatchDesktop_mouseclick_handler(Window* patch_desktop_window, int x, int y);
void PatchDesktop_paint_handler(Window* patch_desktop_window);
void PatchDesktop_connect_action(PatchDesktop* patch_desktop, struct IO_struct* io);
void PatchDesktop_begin_connection(PatchDesktop* patch_desktop, struct IO_struct* io);
void PatchDesktop_finish_connection(PatchDesktop* patch_desktop, struct IO_struct* io);
void PatchDesktop_end_connection(PatchDesktop* patch_desktop);
void PatchDesktop_mousemove_handler(Window* patch_desktop_window, int x, int y);
void PatchDesktop_delete_function(Object* patch_desktop_object);

#endif //PATCHDESKTOP_H