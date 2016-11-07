#ifndef PITCHKNOB_H
#define PITCHKNOB_H

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
Unit* PitchKnob_constructor(PatchCore* patch_core);

#endif //PITCHKNOB_H