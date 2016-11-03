#ifndef NOISE_H
#define NOISE_H

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"

typedef struct Noise_struct {
    Unit unit;
    IO* output;
} Noise;

Module* Noise_new();
Unit* Noise_constructor(PatchCore* patch_core);

#endif //NOISE_H
