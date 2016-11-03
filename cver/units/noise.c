#include <stdio.h>
#include <stdlib.h>
#include "noise.h"

Module* Noise_new() {

    return Module_new(Noise_constructor, "Noise");
}

double double_rand() {

    time_t t;
    
    srand((unsigned) time(&t));
    return (((double)rand() / (double)RAND_MAX) - 0.5) * 2;
}

int Noise_pull_sample_handler(IO* io, double* sample_l, double* sample_r) {

    //Not really used here, but whatever
    Noise* noise = (Noise*)io->param_object;

    //Stereo noise
    *sample_l = double_rand();
    *sample_r = double_rand();

    return 1;
}

Unit* Noise_constructor(PatchCore* patch_core) {

    Noise* noise = (Noise*)malloc(sizeof(Noise));

    if(!noise)
        return noise;

    if(!Unit_init(noise, patch_core)) {

        Object_delete(noise);
        return (Unit*)0;
    }

    noise->output = Unit_create_output(noise, 195, 75);
    Window_resize(noise, 200, 150);

    if(!(noise->output)) {

        Object_delete(noise);
        return (Unit*)0;
    }    
   
    noise->output->pull_sample_function = Noise_pull_sample_handler;

    return (Unit*)noise;
}