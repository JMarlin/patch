#ifndef CAPTURE_H
#define CAPTURE_H

#ifdef __cplusplus
extern "C" {
#endif

struct Capture_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"
#include "../uilib/slider.h"
#include "../wslib/button.h"

typedef struct Capture_struct {
    Unit unit;
    Button* start_button;
    IO* input;
    IO* output;
    int buf_size;
    int capture_pointer;
    float* sample_buf_l;
    float* sample_buf_r;
} Capture;

Module* Capture_new();
Unit* Capture_constructor(PatchCore* patch_core, Module* module);
Unit* Capture_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core);

#ifdef __cplusplus
}
#endif

#endif //CAPTURE_H
