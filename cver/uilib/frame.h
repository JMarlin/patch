#ifndef FRAME_H
#define FRAME_H 

#include "window.h"

typedef struct Frame_struct {
    Window window; //Inherits from window
} Frame;

Frame* Frame_new(int x, int y, int width, int height);
int Frame_init(Frame* frame, int x, int y, int width, int height);
void Frame_paint(Window* frame_window);
void Frame_delete(void* frame_void);

#endif //FRAME_H