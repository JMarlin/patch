#ifndef OUTPUT_H
#define OUTPUT_H

#include "../uilib/window.h"
#include "patchcore.h"

struct Output_struct;

typedef double (*OutputSamplePullHandler)(Output_struct*);

//Really no reason not to make this and Input two sides of
//the same basic class
typedef struct Output_struct {
    Window window;
    PatchCore* patch_core; 
    Input* connected_input;
    int is_input;
    OutputSamplePullHandler pull_right_sample_function;
    OutputSamplePullHandler pull_left_sample_function;
} Output;

Output* Output_new(PatchCore* patch_core, int x, int y);
Output* Output_init(Output* output, PatchCore* patch_core, int x, int y);
void Output_paint_handler(Window* output_window, Context* context);
void Output_mousedown_handler(Window* output_window, int x, int y);
void Output_connect(Output* output, Input* input);
double Output_pull_right_sample(Output* output);
double Output_pull_left_sample(Output* output);
void Output_default_pull_sample_handler(Output* output);
void Output_delete(void* output_void);

#endif //OUTPUT_H