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

void Menu_mouseclick_handler(Window* menu_window, int x, int y) {

    //Fire menu entry handler
}

int Menu_init(Menu* menu, int x, int y, int width) {

    if(!Frame_init((Frame*)menu, x, y, width, 4))
        return 0;

    Object_init((Object*)menu, Menu_delete_function);

    if(!(menu->entries = List_new()))
        return 0;

    menu->old_paint = menu->frame.window.paint_function;
    menu->frame.window.paint_function = Menu_paint_handler;
    menu->frame.window.mouseclick_function = Menu_mouseclick_handler;
    menu->frame.window.object.delete_function = Menu_delete_function;

    return 1;
}

//Need to make entries into actual sub-windows
void Menu_paint_handler(Window* menu_window) {

    int i;
    MenuEntry* current_entry;
    Menu* menu = (Menu*)menu_window;

    if(menu->old_paint)
        menu->old_paint(menu_window);

    for(i = 0; i < menu->entries->count; i++) {

        //This will be replaced when we make menu entries simple subchildren
        current_entry = (MenuEntry*)List_get_at(menu->entries, i);
        MenuEntry_paint_handler(current_entry, menu->frame.window.context);
    }
}

void Menu_add_entry(Menu* menu, MenuEntry* menu_entry) {

    List_add(menu->entries, (Object*)menu_entry);
    //menu_entry->parent = menu; //re-enable when menu entries derive from Window
    menu_entry->x = 2;
    menu_entry->y = (menu->entries->count * 14) + 1;
    menu->frame.window.height += 14;
}

void Menu_delete_function(Object* menu_object) {

    Menu* menu = (Menu*)menu_object; 

    Object_delete((Object*)menu->entries);
    Window_delete_function(menu_object);
}
