#ifndef SCOPE_H
#define SCOPE_H

#ifdef __cplusplus
extern "C" {
#endif

struct Scope_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"
#include "../uilib/slider.h"
#include "../wslib/button.h"

typedef struct Scope_struct {
    Unit unit;
    Button* start_button;
    Button* stop_button;
    Button* zoom_in_button;
    Button* zoom_out_button;
    Button* scroll_left_button;
    Button* scroll_right_button;
    IO* input;
    IO* output;
    int buf_size;
    int capture_pointer;
    float* sample_buf_l;
    float* sample_buf_r;
} Scope;

Module* Scope_new();
Unit* Scope_constructor(PatchCore* patch_core, Module* module);
Unit* Scope_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core);

#ifdef __cplusplus
}
#endif

#endif //SCOPE_H
