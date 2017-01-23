#ifndef SEQUENCE_H
#define SEQUENCE_H

#ifdef __cplusplus
extern "C" {
#endif

struct Sequence_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"
#include "../uilib/slider.h"

typedef struct Sequence_struct {
    Unit unit;
    IO* output;
    IO* clock_in;
    List* step_list;
    float last_clock_sample;
    int current_step;
} Sequence;

Module* Sequence_new();
Unit* Sequence_constructor(PatchCore* patch_core, Module* module);
Unit* Sequence_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core, Unit* sequence_unit);

#ifdef __cplusplus
}
#endif

#endif //SEQUENCE_H
