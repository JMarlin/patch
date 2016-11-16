#ifndef MENUENTRY_H
#define MENUENTRY_H

#ifdef __cplusplus
extern "C" {
#endif

struct MenuEntry_struct;

#include "menu.h"

typedef void (*MenuEntryClickCallback)(void);

typedef struct MenuEntry_struct {
    Window window;
    String* text;
    int mouse_over;
} MenuEntry;

MenuEntry* MenuEntry_new(String* text, WindowMouseclickHandler click_action);
void MenuEntry_delete_function(Object* menu_entry_object);
void MenuEntry_paint_handler(Window* menu_entry_window) ;
void MenuEntry_mouseover_handler(Window* menu_entry_window);
void MenuEntry_mouseout_handler(Window* menu_entry_window);
void MenuEntry_mouseclick_handler(MenuEntry* menu_entry, int x, int y);

#ifdef __cplusplus
}
#endif

#endif //MENUENTRY_H