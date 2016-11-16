#ifndef FRAME_H
#define FRAME_H 

#ifdef __cplusplus
extern "C" {
#endif

struct Frame_struct;

#include "../wslib/window.h"

typedef struct Frame_struct {
    Window window; //Inherits from window
} Frame;

Frame* Frame_new(int x, int y, int width, int height);
int Frame_init(Frame* frame, int x, int y, int width, int height);
void Frame_paint_handler(Window* frame_window);

#ifdef __cplusplus
}
#endif

#endif //FRAME_H