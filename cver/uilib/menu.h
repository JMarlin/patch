#ifndef MENU_H
#define MENU_H

#include "frame.h"
#include "menuentry.h"

typedef struct Menu_struct {
    Frame frame; //Inherits from frame
    List* entries; 
    WindowPaintHandler old_paint_function;
} Menu;

Menu* Menu_new(int x, int y, int width);
int Menu_init(Menu* menu, int x, int y, int width);
void Menu_paint_handler(Window* menu_window);
void Menu_add_entry(Menu* menu, MenuEntry* menu_entry);
void Menu_delete_function(Object* menu_object);

#endif //MENU_H
