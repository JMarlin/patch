#ifndef NOISE_H
#define NOISE_H

#ifdef __cplusplus
extern "C" {
#endif

struct Noise_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"

typedef struct Noise_struct {
    Unit unit;
    IO* output;
} Noise;

Module* Noise_new();
Unit* Noise_constructor(PatchCore* patch_core, Module* module);
Unit* Noise_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core, Unit* noise_unit);

#ifdef __cplusplus
}
#endif

#endif //NOISE_H
