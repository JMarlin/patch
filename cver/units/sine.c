#include <math.h>
#include "sine.h"
#include "../platform/platformwrapper.h"

Module* Sine_new() {

    return Module_new(Sine_constructor, "Sine");
}

int Sine_pull_sample_handler(IO* io, double* sample_l, double* sample_r) {
    
    double in_sample_l, in_sample_r;
    Sine* sine = (Sine*)io->param_object;

    *sample_l = *sample_r = sin(sine->phase);
    
    if(!IO_pull_sample(sine->freq_in, &in_sample_l, &in_sample_r))
        return 0;

    sine->phase = (sine->phase + (((2*M_PI) * in_sample_l)/SAMPLE_RATE));

    if(sine->phase > (2*M_PI))
        sine->phase -= (2*M_PI);

    return 1;
}

Unit* Sine_constructor(PatchCore* patch_core) {

    Sine* sine = (Sine*)malloc(sizeof(Sine));

    if(!sine)
        return (Unit*)sine;

    if(!Unit_init((Unit*)sine, patch_core)) {

        Object_delete((Object*)sine);
        return (Unit*)0;
    }

    sine->output = Unit_create_output((Unit*)sine, 195, 75);
    sine->freq_in = Unit_create_input((Unit*)sine, 5, 75);
    Window_resize((Window*)sine, 200, 150);

    if(!(sine->output && sine->freq_in)) {

        Object_delete((Object*)sine);
        return (Unit*)0;
    }    
   
    sine->phase = 0;
    sine->output->pull_sample_function = Sine_pull_sample_handler;

    return (Unit*)sine;
}