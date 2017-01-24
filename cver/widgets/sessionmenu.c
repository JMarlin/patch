
#include "sessionmenu.h"

void SaveSession_mouseclick_function(Window* session_menu_entry_window, int x, int y) {

    SessionMenu* session_menu = (SessionMenu*)session_menu_entry_window->parent;

    PatchCore_save_session(session_menu->patch_core);
}

void LoadSession_mouseclick_function(Window* session_menu_entry_window, int x, int y) {

    SessionMenu* session_menu = (SessionMenu*)session_menu_entry_window->parent;

    PatchCore_load_session(session_menu->patch_core);
}

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
    session_menu->module_names = PatchCore_get_module_list(patch_core);

    //Add save session menu entry
    Menu_add_entry((Menu*)session_menu,
                   MenuEntry_new(String_new("Save Session"), SaveSession_mouseclick_function));

    //Add load session menu entry
    Menu_add_entry((Menu*)session_menu,
                   MenuEntry_new(String_new("Load Session"), LoadSession_mouseclick_function));

    //TODO: Need to add a sanity check in the case that the new menu entry
    //couldn't be properly instantiated
    for(i = 0; session_menu->module_names && (i < session_menu->module_names->count); i++)
        Menu_add_entry((Menu*)session_menu,
                       MenuEntry_new((String*)List_get_at(session_menu->module_names, i), SessionMenu_mouseclick_function));

    return session_menu;
}

void SessionMenu_mouseclick_function(Window* session_menu_entry_window, int x, int y) {

    MenuEntry* menu_entry;
    SessionMenu* session_menu;

    if(!session_menu_entry_window->parent)
        return;

    menu_entry = (MenuEntry*)session_menu_entry_window;
    session_menu = (SessionMenu*)session_menu_entry_window->parent;

    PatchCore_instantiate_module(session_menu->patch_core, menu_entry->text);
    PatchCore_destroy_menu(session_menu->patch_core);
}
