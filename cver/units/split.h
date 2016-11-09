#ifndef SPLIT_H
#define SPLIT_H

struct Split_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"

typedef struct Split_struct {
    Unit unit;
    IO* output_one;
    IO* output_two;
    IO* input;
    double last_sample_l;
    double last_sample_r;
    double last_sample_g;
    int pulls;
} Split;

Module* Split_new();
Unit* Split_constructor(PatchCore* patch_core);

#endif //SPLIT_H