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

    return Frame_init((Frame*)menu, x, y, width, 4);
}

void Menu_add_entry(Menu* menu, MenuEntry* menu_entry) {

    Window_insert_child((Window*)menu, (Window*)menu_entry);
    menu_entry->window.width = menu->frame.window.width - 4;
    menu_entry->window.x = 2;
    menu_entry->window.y = ((menu->frame.window.children->count - 1) * 14) + 2;
    menu->frame.window.height += 14;
}
