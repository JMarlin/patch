#ifndef DESKTOP_H
#define DESKTOP_H

#ifdef __cplusplus
extern "C" {
#endif

#include "list.h"
#include "context.h"
#include "window.h"


//================| Desktop Class Declaration |================//

//Information for drawing a pretty mouse
#define MOUSE_WIDTH 11
#define MOUSE_HEIGHT 18
#define MOUSE_BUFSZ (MOUSE_WIDTH * MOUSE_HEIGHT)

typedef struct Desktop_struct {
    Window window; //Inherits window class
    uint16_t mouse_x;
    uint16_t mouse_y;
    uint8_t mouse_shown;
	List* pending_deletions;
} Desktop;

//Methods
Desktop* Desktop_new(Context* context);
int Desktop_init(Desktop* desktop, Context* context);
void Desktop_paint_handler(Window* desktop_window);
void Desktop_process_mouse(Desktop* desktop, uint16_t mouse_x,
                           uint16_t mouse_y, uint8_t mouse_buttons);

#ifdef __cplusplus
}
#endif

#endif //DESKTOP_H
