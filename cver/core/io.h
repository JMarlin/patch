#ifndef IO_H
#define IO_H

#ifdef __cplusplus
extern "C" {
#endif

struct IO_struct;

#include "../wslib/window.h"
#include "patchcore.h"

typedef int (*IOSamplePullHandler)(struct IO_struct*, float*, float*, float*);

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
int IO_pull_sample(IO* io, float *l_sample, float *r_sample, float *g_sample);


#ifdef __cplusplus
}
#endif

#endif //IO_H