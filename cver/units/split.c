#include "split.h"

Module* Split_new() {

    return Module_new(Split_constructor, Split_deserializer, "Split");
}

int Split_pull_sample_handler(IO* io, float* sample_l, float* sample_r, float* sample_g) {
    
    Split* split = (Split*)io->param_object;
    
    if(split->pulls == 0) {

        if(!IO_pull_sample(split->input, sample_l, sample_r, sample_g))
            return 0;
    
        split->last_sample_l = *sample_l;
        split->last_sample_r = *sample_r;
        split->last_sample_g = *sample_g;

        //TODO: The below will still fail if there are disconnected outputs
        //more than one unit downstream
        if(split->output_one->connected_io && split->output_two->connected_io)
            split->pulls++;
    } else {

        *sample_l = split->last_sample_l;
        *sample_r = split->last_sample_r;
        *sample_g = split->last_sample_g;
        split->pulls = 0;
    }

    return 1;
}

void Split_paint_handler(Window* sine_window) {

    Frame_paint_handler(sine_window);
    Context_draw_text(sine_window->context, "Split",
                       (sine_window->width / 2) - 12,
                       (sine_window->height / 2) - 6,
                       WIN_BORDERCOLOR);     
}

Unit* Split_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core, Unit* split_unit) {

    return split_unit;
}

int Split_serializer(Unit* split_unit, SerialifyBuf* sbuf) {

    return 1;
}

Unit* Split_constructor(PatchCore* patch_core, Module* module) {

    Split* split = (Split*)malloc(sizeof(Split));

    if(!split)
        return (Unit*)split;

    if(!Unit_init((Unit*)split, patch_core, module, Split_serializer)) {

        Object_delete((Object*)split);
        return (Unit*)0;
    }

    split->output_one = Unit_create_output((Unit*)split, 195, 50);
    split->output_two = Unit_create_output((Unit*)split, 195, 100);
    split->input = Unit_create_input((Unit*)split, 5, 75);
    Window_resize((Window*)split, 200, 150);

    if(!(split->output_one && split->output_two && split->input)) {

        Object_delete((Object*)split);
        return (Unit*)0;
    }    
   
    split->pulls = 0;
    split->output_one->pull_sample_function = Split_pull_sample_handler;
    split->output_two->pull_sample_function = Split_pull_sample_handler;
    split->unit.frame.window.paint_function = Split_paint_handler;

    return (Unit*)split;
}
