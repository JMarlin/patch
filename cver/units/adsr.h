#ifndef ADSR_H
#define ADSR_H

struct ADSR_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"
#include "../uilib/slider.h"

typedef struct ADSR_struct {
    Unit unit;
    IO* output;
    IO* input;
    Slider* a_slider;
    Slider* d_slider;
    Slider* s_slider;
    Slider* r_slider;
    double last_gate;
    double time;
} ADSR;

Module* ADSR_new();
Unit* ADSR_constructor(PatchCore* patch_core);

#endif //ADSR_H