#ifndef SESSIONMENU_H
#define SESSIONMENU_H

#include "../uilib/menu.h"
#include "../core/patchcore.h"

typedef struct SessionMenu_struct {
    Menu menu;
    PatchCore* patch_core;
    List* module_names;
} SessionMenu;

SessionMenu* SessionMenu_new(PatchCore* patch_core, int x, int y);
void SessionMenu_mouseclick_function(Window* session_menu_window, int x, int y);

#endif //SESSIONMENU_H