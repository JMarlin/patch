#ifndef IO_H
#define IO_H

struct IO_struct;

#include "../wslib/window.h"
#include "patchcore.h"

typedef int (*IOSamplePullHandler)(struct IO_struct*, double*, double*, double*);

typedef struct IO_struct {
    Window window;
    struct PatchCore_struct* patch_core; 
    struct IO_struct* connected_io;
    Object* param_object;
    int is_output;
    IOSamplePullHandler pull_sample_function;
} IO;

IO* IO_new(struct PatchCore_struct* patch_core, Object* param_object, int x, int y, int is_output);
int IO_init(IO* io, struct PatchCore_struct* patch_core, Object* param_object, int x, int y, int is_output);
void IO_paint_handler(Window* io_window);
void IO_mouseclick_handler(Window* io_window, int x, int y);
void IO_connect(IO* io, IO* connected_io);
int IO_pull_sample(IO* io, double *l_sample, double *r_sample, double *g_sample);

#endif //IO_H