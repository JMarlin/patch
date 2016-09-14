#include "menu.h"

Menu* Menu_new(int x, int y, int width) {

    Menu* menu;
    if(!(menu = (Menu*)malloc(sizeof(Menu))))
        return menu;

    if(!Menu_init(menu, x, y, width)) {

        free(menu);
        return (Menu*)0;
    }

    return menu;
}

int Menu_init(Menu* menu, int x, int y, int width) {

    if(!Frame_init((Frame*)menu, x, y, width, 4))
        return 0;
    
    if(!(menu->entries = List_new()))
        return 0;

    menu->old_paint = menu->frame.window.paint;
    menu->frame.window.paint = Menu_paint;

    return 1;
}

//Need to make entries into actual sub-windows
void Menu_paint(Window* menu_window) {

    int i;
    MenuEntry* current_entry;
    Menu* menu = (Menu*)menu_window;

    if(menu->old_paint)
        menu->old_paint(menu_window);

    for(i = 0; i < menu->entries; i++) {

        current_entry = (MenuEntry*)List_get_at(menu->entries, i);
        MenuEntry_paint(current_entry, menu->frame.window.context);
    }
}

void Menu_add_entry(Menu* menu, MenuEntry* menu_entry) {

    List_add(menu->entries, (void*)menu_entry);
    menu_entry->parent = menu;
    menu_entry->x = 2;
    menu_entry->y = (menu->entries->count * 13) + 1;
    menu->frame.window.height += 14;
}

void Menu_delete(void* menu_void) {

    Menu* menu = (Menu*)menu_void; 

    List_delete(menu->children, MenuEntry_delete);

    Frame_delete(menu_void);
}
