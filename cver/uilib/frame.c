#include "frame.h"

Frame* Frame_new(int x, int y, int width, int height) {

    Frame* frame;
    if(!(frame = (Frame*)malloc(sizeof(Frame)))
        return frame;

    if(!Frame_init(frame, x, y, width, height)) {

        free(window);
        return (Frame*)0;
    }

    return frame;
}

int Frame_init(Frame* frame, int x, int y, int width, int height) {

    if(!Window_init((Window*)frame, x, y, width, height)) 
        return 0;

    frame->window.flags &= ~WIN_NODRAG;
    frame->window.paint = Frame_paint;
}

void Frame_paint(Window* frame_window) {

    Context_fill_rect(window->context, 2, 2, window->width - 4,
                      window->height - 4, RGB(155, 165, 185));
    Context_draw_rect(window->context, 0, 0, window->width - 1,
                      window->height - 1, RGB(0, 0, 0));
    Context_draw_rect(window->context, 1, 1, window->width - 2,
                      window->height - 2, RGB(0, 0, 0));
}

void Frame_delete(void* frame_void) {
    
    Window_delete(frame_void);
}
