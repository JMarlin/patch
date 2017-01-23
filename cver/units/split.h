#ifndef SPLIT_H
#define SPLIT_H

#ifdef __cplusplus
extern "C" {
#endif

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
    float last_sample_l;
    float last_sample_r;
    float last_sample_g;
    int pulls;
} Split;

Module* Split_new();
Unit* Split_constructor(PatchCore* patch_core, Module* module);
Unit* Split_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core, Unit* split_unit);

#ifdef __cplusplus
}
#endif

#endif //SPLIT_H
