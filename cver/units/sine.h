#ifndef SINE_H
#define SINE_H

#ifdef __cplusplus
extern "C" {
#endif

struct Sine_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"

typedef struct Sine_struct {
    Unit unit;
    IO* output;
    IO* freq_in;
    float phase;
} Sine;

Module* Sine_new();
Unit* Sine_constructor(PatchCore* patch_core);

#ifdef __cplusplus
}
#endif

#endif //SINE_H
