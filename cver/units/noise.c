#include <stdio.h>
#include <time.h>
#include <stdlib.h>
#include "noise.h"

Module* Noise_new() {

    return Module_new(Noise_constructor, Noise_deserializer, "Noise");
}

float float_rand() {

    time_t t;
    float r;

    r = (PlatformWrapper_random() - 0.5) * 2;

    return r;
}

int Noise_pull_sample_handler(IO* io, float* sample_l, float* sample_r, float* sample_g) {

    //Not really used here, but whatever
    Noise* noise = (Noise*)io->param_object;

    //Stereo noise
    *sample_l = float_rand();
    *sample_r = float_rand();
    *sample_g = 1;

    return 1;
}

void Noise_paint_handler(Window* noise_window) {

    Frame_paint_handler(noise_window);
    Context_draw_text(noise_window->context, "Noise",
                       (noise_window->width / 2) - 20,
                       (noise_window->height / 2) - 6,
                       WIN_BORDERCOLOR);     
}

Unit* Noise_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core) {

    return (Unit*)0;
}

Unit* Noise_constructor(PatchCore* patch_core, Module* module) {

    Noise* noise = (Noise*)malloc(sizeof(Noise));

    if(!noise)
        return (Unit*)noise;

    if(!Unit_init((Unit*)noise, patch_core, module)) {

        Object_delete((Object*)noise);
        return (Unit*)0;
    }

    noise->output = Unit_create_output((Unit*)noise, 195, 75);
    Window_resize((Window*)noise, 200, 150);

    if(!(noise->output)) {

        Object_delete((Object*)noise);
        return (Unit*)0;
    }    
   
    noise->output->pull_sample_function = Noise_pull_sample_handler;
    noise->unit.frame.window.paint_function = Noise_paint_handler;

    return (Unit*)noise;
}
