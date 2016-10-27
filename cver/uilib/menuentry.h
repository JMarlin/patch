#ifndef MENUENTRY_H
#define MENUENTRY_H

#include "menu.h"

typedef void (*MenuEntryClickCallback)(void);

typedef struct MenuEntry_struct {
    Object object;
    char* text;
    int x; 
    int y; 
    MenuEntryClickCallback click_action;
} MenuEntry;

MenuEntry* MenuEntry_new(char* text, MenuEntryClickCallback click_action);
void MenuEntry_paint_handler(MenuEntry* menu_entry, Context* context);
void MenuEntry_mouseclick_handler(MenuEntry* menu_entry, int x, int y);

#endif //MENUENTRY_H