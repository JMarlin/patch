#include <math.h>
#include "square.h"
#include "../platform/platformwrapper.h"

Module* Square_new() {

    return Module_new(Square_constructor, "Square");
}

int Square_pull_sample_handler(IO* io, double* sample_l, double* sample_r) {
    
    double in_sample_l, in_sample_r;
    Square* square = (Square*)io->param_object;

    *sample_l = *sample_r = square->phase > Math.PI ? 1.0 : -1.0;
    
    if(!IO_pull_sample(square->freq_in, &in_sample_l, &in_sample_r))
        return 0;

    square->phase = (square->phase + (((2*M_PI) * in_sample_l)/SAMPLE_RATE) % (2*M_PI);

    return 1;
}

Unit* Square_constructor(PatchCore* patch_core) {

    Square* square = (Square*)malloc(sizeof(Square));

    if(!square)
        return square;

    if(!Unit_init(square, patch_core)) {

        Object_delete(square);
        return (Unit*)0;
    }

    square->output = Unit_create_output(square, 195, 75);
    square->freq_in = Unit_create_input(square, 5, 75);
    Window_resize(square, 200, 150);

    if(!(square->output && square->freq_in)) {

        Object_delete(square);
        return (Unit*)0;
    }    
   
    square->phase = 0;
    square->output->pull_sample_function = Square_pull_sample_handler;

    return (Unit*)square;
}