#ifndef IO_H
#define IO_H

#include "../wslib/window.h"
#include "patchcore.h"

struct IO_struct;

typedef int (*IOSamplePullHandler)(IO_struct*, double*, double*);

typedef struct IO_struct {
    Window window;
    PatchCore* patch_core; 
    IO* connected_io;
    Object* param_object;
    int is_output;
    IOSamplePullHandler pull_sample_function;
} IO;

IO* IO_new(PatchCore* patch_core, Object* param_object, int x, int y, int is_output);
int IO_init(IO* io, PatchCore* patch_core, Object* param_object, int x, int y, int is_output);
void IO_paint_handler(Window* io_window);
void IO_mouseclick_handler(Window* io_window, int x, int y);
void IO_connect(IO* io, Input* input);
int IO_pull_sample(IO* io, double *l_sample, double *r_sample);

#endif //IO_H