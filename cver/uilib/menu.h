#ifndef MENU_H
#define MENU_H

#ifdef __cplusplus
extern "C" {
#endif

struct Menu_struct;

#include "frame.h"
#include "menuentry.h"

typedef struct Menu_struct {
    Frame frame; //Inherits from frame
} Menu;

Menu* Menu_new(int x, int y, int width);
int Menu_init(Menu* menu, int x, int y, int width);
void Menu_add_entry(Menu* menu, struct MenuEntry_struct* menu_entry);
void Menu_delete_function(Object* menu_object);

#ifdef __cplusplus
}
#endif

#endif //MENU_H
