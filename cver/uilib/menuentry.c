#include "menuentry.h"

MenuEntry* MenuEntry_new(String* text, WindowMouseclickHandler click_action) {

    MenuEntry* menu_entry;

    if(!(menu_entry = (MenuEntry*)malloc(sizeof(MenuEntry))))
        return menu_entry;

    if(!(Window_init((Window*)menu_entry, 0, 0, 100, 14, WIN_NORAISE | WIN_NODECORATION, (Context*)0))) {

        Object_delete((Object*)menu_entry);
        return (MenuEntry*)0;
    }

    Object_init((Object*)menu_entry, MenuEntry_delete_function);

    if(!(menu_entry->text = String_new(text->buf))) {

        Object_delete((Object*)menu_entry);
        return (MenuEntry*)0;
    }

    menu_entry->mouse_over = 0;
    menu_entry->window.paint_function = MenuEntry_paint_handler;
    menu_entry->window.mouseclick_function = click_action;
    menu_entry->window.mouseover_function = MenuEntry_mouseover_handler;
    menu_entry->window.mouseout_function = MenuEntry_mouseout_handler;

    return menu_entry;
}

void MenuEntry_toggle_over(Window* menu_entry_window, int over) {

    MenuEntry* menu_entry = (MenuEntry*)menu_entry_window;

    menu_entry->mouse_over = over;
    Window_invalidate(menu_entry_window, 0, 0, menu_entry_window->height - 1,
                      menu_entry_window->width - 1);
}

void MenuEntry_mouseover_handler(Window* menu_entry_window) {

    MenuEntry_toggle_over(menu_entry_window, 1);
}

void MenuEntry_mouseout_handler(Window* menu_entry_window) {

    MenuEntry_toggle_over(menu_entry_window, 0);
}

void MenuEntry_paint_handler(Window* menu_entry_window) {

    MenuEntry* menu_entry = (MenuEntry*)menu_entry_window;

    //Current code assumes that the font is 12px high
    Context_fill_rect(menu_entry_window->context, 0, 0, menu_entry_window->width,
                      menu_entry_window->height,
                      menu_entry->mouse_over ? RGB(0, 0, 0) : RGB(255, 255, 255));
    Context_draw_text(menu_entry_window->context, menu_entry->text->buf,
                      1, 1, menu_entry->mouse_over ? RGB(255, 255, 255) : RGB(0, 0, 0));
}

void MenuEntry_delete_function(Object* menu_entry_object) {

    if(!menu_entry_object)
        return;

    MenuEntry* menu_entry = (MenuEntry*)menu_entry_object;

    Object_delete((Object*)menu_entry->text);
    Window_delete_function(menu_entry_object);
}
