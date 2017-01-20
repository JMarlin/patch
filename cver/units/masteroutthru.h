#ifndef MASTEROUTTHRU_H
#define MASTEROUTTHRU_H

#ifdef __cplusplus
extern "C" {
#endif

struct MasterOutThru_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"
#include "../uilib/slider.h"

typedef struct MasterOutThru_struct {
    Unit unit;
    Slider* gain_slider;
    Slider* pan_slider;
    IO* input;
    IO* output;
} MasterOutThru;

Module* MasterOutThru_new();
Unit* MasterOutThru_constructor(PatchCore* patch_core, Module* module);
Unit* MasterOutThru_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core, Unit* master_out_thru_unit);

#ifdef __cplusplus
}
#endif

#endif //MASTEROUTTHRU_H
