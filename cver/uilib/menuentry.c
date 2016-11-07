#include "menuentry.h"

MenuEntry* MenuEntry_new(String* text, MenuEntryClickCallback click_action) {

    MenuEntry* menu_entry;

    if(!(menu_entry = (MenuEntry*)malloc(sizeof(MenuEntry))))
        return menu_entry;

    Object_init((Object*)menu_entry, MenuEntry_delete_function);
    menu_entry->x = 0;
    menu_entry->y = 0;
    menu_entry->click_action = click_action;

    if(!(menu_entry->text = String_new(text->buf))) {

        Object_delete((Object*)menu_entry);
        return (MenuEntry*)0;
    }

    return menu_entry;
}

void MenuEntry_paint_handler(MenuEntry* menu_entry, Context* context) {

    //Current code assumes that the font is 12px high
    Context_draw_text(context, menu_entry->text->buf, menu_entry->x,
                      menu_entry->y - 14, RGB(0, 0, 0));
}

void MenuEntry_mouseclick_handler(MenuEntry* menu_entry, int x, int y) {

    if(menu_entry->click_action)
        menu_entry->click_action();
}

void MenuEntry_delete_function(Object* menu_entry_object) {

    if(!menu_entry_object)
        return;

    MenuEntry* menu_entry = (MenuEntry*)menu_entry_object;

    Object_delete((Object*)menu_entry->text);
    Object_default_delete_function(menu_entry_object);
}
