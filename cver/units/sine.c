#include <math.h>
#include "sine.h"
#include "../platform/platformwrapper.h"

Module* Sine_new() {

    return Module_new(Sine_constructor, Sine_deserializer, "Sine");
}

int Sine_pull_sample_handler(IO* io, float* sample_l, float* sample_r, float* sample_g) {
    
    float in_sample_l, in_sample_r, in_sample_g, freq_val;
    Sine* sine = (Sine*)io->param_object;

    if(!IO_pull_sample(sine->freq_in, &in_sample_l, &in_sample_r, &in_sample_g))
        return 0;

    freq_val = 2*(powf(2, ((1 - in_sample_l) * 6)));

    if(freq_val == 0) {

        *sample_l = *sample_r = 0;
        return 1;
    }

    *sample_l = sinf(sine->phase);
    *sample_r = sinf(sine->phase);
    sine->phase = (sine->phase + (((2*M_PI) * freq_val)/SAMPLE_RATE));

    if(sine->phase > (2*M_PI))
        sine->phase -= (2*M_PI);

    *sample_g = 1;

    return 1;
}

void Sine_paint_handler(Window* sine_window) {

    Frame_paint_handler(sine_window);
    Context_draw_text(sine_window->context, "Sine",
                       (sine_window->width / 2) - 16,
                       (sine_window->height / 2) - 6,
                       WIN_BORDERCOLOR);     
}

Unit* Sine_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core, Unit* sine_unit) {

    return sine_unit;
}

int Sine_serializer(Unit* sine_unit, SerialifyBuf* sbuf) {

    return 1;
}

Unit* Sine_constructor(PatchCore* patch_core, Module* module) {

    Sine* sine = (Sine*)malloc(sizeof(Sine));

    if(!sine)
        return (Unit*)sine;

    if(!Unit_init((Unit*)sine, patch_core, module, Sine_serializer)) {

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
    sine->unit.frame.window.paint_function = Sine_paint_handler;

    return (Unit*)sine;
}
