#include "menuentry.h"

MenuEntry* MenuEntry_new(char* text, MenuEntryClickCallback click_action) {

    MenuEntry* menu_entry;

    if(!(menu_entry = (MenuEntry*)malloc(sizeof(MenuEntry))))
        return menu_entry;

    menu_entry->text = text; 
    menu_entry->x = 0;
    menu_entry->y = 0;
    menu_entry->click_action = click_action;
}

void MenuEntry_paint(MenuEntry* menu_entry, Context* context) {

    //Current code assumes that the font is 12px high
    Context_draw_string(menu_entry->text, menu_entry->x,
                        menu_entry->y, RGB(0, 0, 0));
}

void MenuEntry_onmousedown(MenuEntry* menu_entry) {

    if(menu_entry->click_action)
    menu_entry->click_action();
}

void MenuEntry_delete(void* menu_entry_void) {

    free(menu_entry_void);
}
