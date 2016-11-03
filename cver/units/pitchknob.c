#include <math.h>
#include "pitchknob.h"

Module* PitchKnob_new() {

    return Module_new(PitchKnob_constructor, "Pitch Knob");
}

int PitchKnob_pull_sample_handler(IO* io, double* sample_l, double* sample_r) {

    PitchKnob* pitch_knob = (PitchKnob*)io->param_object;

    *sample_l = *sample_r =
        2*(pow(2, ((1 - Slider_get_value(pitch_knob->slider)) * 6))); 

    return 1;
}

Unit* PitchKnob_constructor(PatchCore* patch_core) {

    PitchKnob* pitch_knob = (PitchKnob*)malloc(sizeof(PitchKnob));

    if(!pitch_knob)
        return pitch_knob;

    if(!Unit_init(pitch_knob, patch_core)) {

        Object_delete(pitch_knob);
        return (Unit*)0;
    }

    pitch_knob->slider = Slider_new(10, 10, 30, 130, 0, 1);

    if(pitch_knob->slider)
        Window_insert_child(pitch_knob, pitch_knob->slider);

    pitch_knob->output = Unit_create_output(pitch_knob, 45, 75);

    if(!(pitch_knob->slider && pitch_knob->output)) {

        Object_delete(pitch_knob);
        return (Unit*)0;
    }    

    Window_resize(pitch_knob, 50, 150);
    pitch_knob->output->pull_sample_function = PitchKnob_pull_sample_handler;

    return (Unit*)pitch_knob;
}