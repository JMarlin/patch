
#include "sessionmenu.h"

SessionMenu* SessionMenu_new(PatchCore* patch_core, int x, int y) {

    int i;
    SessionMenu* session_menu = (SessionMenu*)malloc(sizeof(SessionMenu));

    if(!session_menu)
        return session_menu;

    if(!Menu_init((Menu*)session_menu, x, y, 200)) {

        Object_delete((Object*)session_menu);
        return (SessionMenu*)0;
    }

    session_menu->patch_core = patch_core;
    session_menu->menu.frame.window.mouseclick_function =
        SessionMenu_mouseclick_function;

    session_menu->module_names = PatchCore_get_module_list(patch_core);

    //TODO: Need to add a sanity check in the case that the new menu entry
    //couldn't be properly instantiated
    for(i = 0; session_menu->module_names && (i < session_menu->module_names->count); i++)
        Menu_add_entry((Menu*)session_menu,
                       MenuEntry_new((String*)List_get_at(session_menu->module_names, i), 0));

    return session_menu;
}

void SessionMenu_mouseclick_function(Window* session_menu_window, int x, int y) {

    SessionMenu* session_menu = (SessionMenu*)session_menu_window;

    PatchCore_instantiate_module(session_menu->patch_core, 
                                 (String*)List_get_at(session_menu->module_names, y/14));
    PatchCore_destroy_menu(session_menu->patch_core);
}
