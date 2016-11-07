#ifndef MENUENTRY_H
#define MENUENTRY_H

struct MenuEntry_struct;

#include "menu.h"

typedef void (*MenuEntryClickCallback)(void);

typedef struct MenuEntry_struct {
    Object object;
    String* text;
    int x; 
    int y; 
    MenuEntryClickCallback click_action;
} MenuEntry;

MenuEntry* MenuEntry_new(String* text, MenuEntryClickCallback click_action);
void MenuEntry_delete_function(Object* menu_entry_object);
void MenuEntry_paint_handler(MenuEntry* menu_entry, Context* context);
void MenuEntry_mouseclick_handler(MenuEntry* menu_entry, int x, int y);

#endif //MENUENTRY_H