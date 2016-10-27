#ifndef IO_H
#define IO_H

#include "../wslib/window.h"
#include "patchcore.h"

struct IO_struct;

typedef double (*IOSamplePullHandler)(IO_struct*);

typedef struct IO_struct {
    Window window;
    PatchCore* patch_core; 
    IO* connected_input;
    int is_output;
    IOSamplePullHandler pull_right_sample_function;
    IOSamplePullHandler pull_left_sample_function;
} IO;

IO* IO_new(PatchCore* patch_core, int x, int y);
IO* IO_init(IO* io, PatchCore* patch_core, int x, int y);
void IO_paint_handler(Window* io_window);
void IO_mouseclick_handler(Window* io_window, int x, int y);
void IO_connect(IO* io, Input* input);
double IO_pull_right_sample(IO* io);
double IO_pull_left_sample(IO* io);
void IO_default_pull_sample_handler(IO* io);

#endif //IO_H