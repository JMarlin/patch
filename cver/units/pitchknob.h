#ifndef PITCHKNOB_H
#define PITCHKNOB_H

#ifdef __cplusplus
extern "C" {
#endif

struct PitchKnob_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"
#include "../uilib/slider.h"

typedef struct PitchKnob_struct {
    Unit unit;
    IO* output;
    Slider* slider;
} PitchKnob;

Module* PitchKnob_new();
Unit* PitchKnob_constructor(PatchCore* patch_core, Module* module);
Unit* PitchKnob_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core);

#ifdef __cplusplus
}
#endif

#endif //PITCHKNOB_H
