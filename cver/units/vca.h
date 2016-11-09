#ifndef VCA_H
#define VCA_H

struct VCA_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"
#include "../uilib/slider.h"

typedef struct VCA_struct {
    Unit unit;
    IO* output;
    IO* level_in;
    IO* signal_in;
} VCA;

Module* VCA_new();
Unit* VCA_constructor(PatchCore* patch_core);

#endif //VCA_H