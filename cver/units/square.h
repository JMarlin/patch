#ifndef SQUARE_H
#define SQUARE_H

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"

typedef struct Square_struct {
    Unit unit;
    IO* output;
    IO* freq_in;
    double phase;
} Square;

Module* Square_new();
Unit* Square_constructor(PatchCore* patch_core);

#endif //SQUARE_H
