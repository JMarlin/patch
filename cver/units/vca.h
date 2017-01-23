#ifndef VCA_H
#define VCA_H

#ifdef __cplusplus
extern "C" {
#endif

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
Unit* VCA_constructor(PatchCore* patch_core, Module* module);
Unit* VCA_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core, Unit* vca_unit);

#ifdef __cplusplus
}
#endif

#endif //VCA_H
