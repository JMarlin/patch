#ifndef SINE_H
#define SINE_H

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"

typedef struct Sine_struct {
    Unit unit;
    IO* output;
    IO* freq_in;
    double phase;
} Sine;

Module* Sine_new();
Unit* Sine_constructor(PatchCore* patch_core);

#endif //SINE_H
