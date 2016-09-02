#ifndef WINDOW_H

#include <inttypes.h>
#include "inputevent.h"
#include "../util/list.h"
#include "context.h"

#define WIN_VISIBLE 0x01
#define WIN_NODRAG  0x02
#define WIN_NORAISE 0x04

typedef void (*WindowEventHandler)(Window*, InputEvent*);
typedef void (*WindowGFXResizeHandler)(Window*, int, int);
typedef void (*WindowMoveHandler)(Window*, int, int);
typedef void (*WindowMouseMoveHandler)(Window*, int, int);
typedef void (*WindowMouseDownHandler)(Window*, int, int);
typedef void (*WindowMouseUpHandler)(Window*, int, int);
typedef void (*WindowMouseOutHandler)();
typedef void (*WindowMouseOverHandler)();

typedef struct Window_struct {
    Context* context;
    int x;
    int y;
    int width;
    int height;
    uint8_t flags;
    Window_struct* parent;
    Window_struct* drag_child;
    Window_struct* mouse_in_child;
    int drag_off_x;
    int drag_off_y;
    List* children;
    WindowEventHandler event_handler;
    WindowGFXResizeHandler ongfxresize;
    WindowMoveHandler move;
    WindowMouseMoveHandler onmousemove;
    WindowMouseDownHandler onmousedown;
    WindowMouseUpHandler onmouseup;
    WindowMouseOutHandler onmouseout;
    WindowMouseOverHandler onmouseover;
} Window;

Window* Window_new();
void Window_init(Window* window);
void Window_event_handler(Window* window, InputEvent* input_event);
void Window_ongfxresize(Window* window, int w, int h);
void Window_has_dragged_children(Window* window);
int Window_screen_x(Window* window);
int Window_screen_y(Window* window);
List* Window_children_below(Window* window, Window* child);
List* Window_children_below(Window* window, Window* child);
void Window_invalidate_children(Window* window);
void Window_move_child(Window* window, Window* child, int x, int y);
void Window_paint_child(Window* window, Window* child);
void Window_invalidate_child(Window* window, Window* child);
void Window_hide_child(Window* window, Window* child);
void Window_destroy_child(Window* window, Window* child);
void Window_set_context(Window* window, Context* context); //JS that.init(context)
void Window_add_child(Window* window, Window* child);
void Window_invalidate(Window* window);
void Window_destroy(Window* window);
void Window_hide(Window* window);
void Window_move(Window* window, int x, int y);
void Window_delete(void* window_void);

#endif //WINDOW_H