#include <math.h>
#include "square.h"
#include "../platform/platformwrapper.h"

Module* Square_new() {

    return Module_new(Square_constructor, Square_deserializer, "Square");
}

int Square_pull_sample_handler(IO* io, float* sample_l, float* sample_r, float* sample_g) {
    
    float in_sample_l, in_sample_r, in_sample_g, freq_val;
    Square* square = (Square*)io->param_object;
    
    if(!IO_pull_sample(square->freq_in, &in_sample_l, &in_sample_r, &in_sample_g))
        return 0;

    freq_val = 2*(powf(2, ((1 - in_sample_l) * 6)));

    if(freq_val == 0) {

        *sample_l = *sample_r = 0;
        return 1;
    }

    *sample_l = *sample_r = square->phase > M_PI ? 1.0 : -1.0;
    square->phase = (square->phase + (((2*M_PI) * freq_val)/SAMPLE_RATE));

    if(square->phase > (2*M_PI))
        square->phase -= (2*M_PI);

    *sample_g = 1;

    return 1;
}

void Square_paint_handler(Window* square_window) {

    Frame_paint_handler(square_window);
    Context_draw_text(square_window->context, "Square",
                       (square_window->width / 2) - 24,
                       (square_window->height / 2) - 6,
                       WIN_BORDERCOLOR);     
}

Unit* Square_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core, Unit* square_unit) {

    return square_unit;
}

int Square_serializer(Unit* square_unit, SerialifyBuf* sbuf) {

    return 1;
}

Unit* Square_constructor(PatchCore* patch_core, Module* module) {

    Square* square = (Square*)malloc(sizeof(Square));

    if(!square)
        return (Unit*)square;

    if(!Unit_init((Unit*)square, patch_core, module, Square_serializer)) {

        Object_delete((Object*)square);
        return (Unit*)0;
    }

    square->output = Unit_create_output((Unit*)square, 195, 75);
    square->freq_in = Unit_create_input((Unit*)square, 5, 75);
    Window_resize((Window*)square, 200, 150);

    if(!(square->output && square->freq_in)) {

        Object_delete((Object*)square);
        return (Unit*)0;
    }    
   
    square->phase = 0;
    square->output->pull_sample_function = Square_pull_sample_handler;
    square->unit.frame.window.paint_function = Square_paint_handler;

    return (Unit*)square;
}
