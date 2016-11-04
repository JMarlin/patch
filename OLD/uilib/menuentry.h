#ifndef MENUENTRY_H
#define MENUENTRY_H

#include "menu.h"

typedef void (*MenuEntryClickCallback)(void);

typedef struct MenuEntry_struct {
    char* text;
    int x; 
    int y; 
    MenuEntryClickCallback click_action;
} MenuEntry;

MenuEntry* MenuEntry_new(char* text, MenuEntryClickCallback click_action);
void MenuEntry_paint(MenuEntry* menu_entry, Context* context);
void MenuEntry_onmousedown(MenuEntry* menu_entry);
void MenuEntry_delete(void* menu_entry_void);

#endif //MENUENTRY_H