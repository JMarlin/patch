#ifndef SESSIONMENU_H
#define SESSIONMENU_H

struct SessionMenu_struct;

#include "../uilib/menu.h"
#include "../core/patchcore.h"

typedef struct SessionMenu_struct {
    Menu menu;
    struct PatchCore_struct* patch_core;
    List* module_names;
} SessionMenu;

SessionMenu* SessionMenu_new(struct PatchCore_struct* patch_core, int x, int y);
void SessionMenu_mouseclick_function(Window* session_menu_window, int x, int y);

#endif //SESSIONMENU_H