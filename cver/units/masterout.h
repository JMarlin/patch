#ifndef MASTEROUT_H
#define MASTEROUT_H

#ifdef __cplusplus
extern "C" {
#endif

struct MasterOut_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"
#include "../uilib/slider.h"

typedef struct MasterOut_struct {
    Unit unit;
    Slider* gain_slider;
    Slider* pan_slider;
    IO* input;
    IO* output;
} MasterOut;

Module* MasterOut_new();
Unit* MasterOut_constructor(PatchCore* patch_core);

#ifdef __cplusplus
}
#endif

#endif //MASTEROUT_H
