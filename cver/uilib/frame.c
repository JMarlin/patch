#include "frame.h"

Frame* Frame_new(int x, int y, int width, int height) {

    Frame* frame;
    if(!(frame = (Frame*)malloc(sizeof(Frame))))
        return frame;

    if(!Frame_init(frame, x, y, width, height)) {

        free(frame);
        return (Frame*)0;
    }

    return frame;
}

int Frame_init(Frame* frame, int x, int y, int width, int height) {

    if(!Window_init((Window*)frame, x, y, width, height,
                    WIN_BODYDRAG | WIN_NODECORATION, (Context*)0)) 
        return 0;

    frame->window.paint_function = Frame_paint_handler;

    return 1;
}

void Frame_paint_handler(Window* frame_window) {

    Context_fill_rect(frame_window->context, 2, 2, frame_window->width - 4,
                      frame_window->height - 4, RGB(155, 165, 185));
    Context_draw_rect(frame_window->context, 0, 0, frame_window->width,
                      frame_window->height, RGB(0, 0, 0));
    Context_draw_rect(frame_window->context, 1, 1, frame_window->width - 2,
                      frame_window->height - 2, RGB(0, 0, 0));
}

