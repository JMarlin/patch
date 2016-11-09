#include <stdio.h>
#include <time.h>
#include <stdlib.h>
#include "noise.h"

Module* Noise_new() {

    return Module_new(Noise_constructor, "Noise");
}

double double_rand() {

    time_t t;
    double r;

    r = (PlatformWrapper_random() - 0.5) * 2;

    return r;
}

int Noise_pull_sample_handler(IO* io, double* sample_l, double* sample_r) {

    //Not really used here, but whatever
    Noise* noise = (Noise*)io->param_object;

    //Stereo noise
    *sample_l = double_rand();
    *sample_r = double_rand();

    return 1;
}

void Noise_paint_handler(Window* noise_window) {

    Frame_paint_handler(noise_window);
    Context_draw_text(noise_window->context, "Noise",
                       (noise_window->width / 2) - 20,
                       (noise_window->height / 2) - 6,
                       WIN_BORDERCOLOR);     
}

Unit* Noise_constructor(PatchCore* patch_core) {

    Noise* noise = (Noise*)malloc(sizeof(Noise));

    if(!noise)
        return (Unit*)noise;

    if(!Unit_init((Unit*)noise, patch_core)) {

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