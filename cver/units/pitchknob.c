#include <math.h>
#include "pitchknob.h"

Module* PitchKnob_new() {

    return Module_new(PitchKnob_constructor, PitchKnob_deserializer, "Pitch Knob");
}

int PitchKnob_pull_sample_handler(IO* io, float* sample_l, float* sample_r, float* sample_g) {

    PitchKnob* pitch_knob = (PitchKnob*)io->param_object;

    *sample_l = *sample_r = Slider_get_value(pitch_knob->slider); 
    *sample_g = 1;

    return 1;
}

Unit* PitchKnob_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core) {

    return (Unit*)0;
}

Unit* PitchKnob_constructor(PatchCore* patch_core) {

    PitchKnob* pitch_knob = (PitchKnob*)malloc(sizeof(PitchKnob));

    if(!pitch_knob)
        return (Unit*)pitch_knob;

    if(!Unit_init((Unit*)pitch_knob, patch_core)) {

        Object_delete((Object*)pitch_knob);
        return (Unit*)0;
    }

    pitch_knob->slider = Slider_new(10, 10, 30, 130, 0, 1);

    if(pitch_knob->slider)
        Window_insert_child((Window*)pitch_knob, (Window*)pitch_knob->slider);

    pitch_knob->output = Unit_create_output((Unit*)pitch_knob, 45, 75);

    if(!(pitch_knob->slider && pitch_knob->output)) {

        Object_delete((Object*)pitch_knob);
        return (Unit*)0;
    }    

    Window_resize((Window*)pitch_knob, 50, 150);
    pitch_knob->output->pull_sample_function = PitchKnob_pull_sample_handler;

    return (Unit*)pitch_knob;
}
