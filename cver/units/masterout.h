#ifndef MASTEROUT_H
#define MASTEROUT_H

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"
#include "../uilib/slider.h"

typedef struct MasterOut_struct {
    Unit unit;
    Slider* slider;
    IO* input;
} MasterOut;

Module* MasterOut_new();
Unit* MasterOut_constructor(PatchCore* patch_core);

#endif //MASTEROUT_H
