#include "vca.h"

Module* VCA_new() {

    return Module_new(VCA_constructor, VCA_deserializer, "VCA");
}

int VCA_pull_sample_handler(IO* io, float* sample_l, float* sample_r, float* sample_g) {
    
    float in_sample_l, in_sample_r, in_sample_g, gain;
    VCA* vca = (VCA*)io->param_object;
    
    if(!IO_pull_sample(vca->level_in, &in_sample_l, &in_sample_r, &in_sample_g))
        return 0;

    //Should probably run this through my standard gain curve
    gain = (in_sample_l + 1) / 2;

    if(!IO_pull_sample(vca->signal_in, &in_sample_l, &in_sample_r, sample_g))
        return 0;

    *sample_l = in_sample_l * gain;
    *sample_r = in_sample_r * gain;
    *sample_g = (in_sample_g > -1.0 && *sample_g > -1.0) ? 1.0 : -1.0;
    
    return 1;
}

void VCA_paint_handler(Window* sine_window) {

    Frame_paint_handler(sine_window);
    Context_draw_text(sine_window->context, "VCA",
                       (sine_window->width / 2) - 12,
                       (sine_window->height / 2) - 6,
                       WIN_BORDERCOLOR);     
}

Unit* VCA_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core, Unit* vca_unit) {

    return vca_unit;
}

int VCA_serializer(Unit* vca_unit, SerialifyBuf* sbuf) {

    return 1;
}

Unit* VCA_constructor(PatchCore* patch_core, Module* module) {

    VCA* vca = (VCA*)malloc(sizeof(VCA));

    if(!vca)
        return (Unit*)vca;

    if(!Unit_init((Unit*)vca, patch_core, module, VCA_serializer)) {

        Object_delete((Object*)vca);
        return (Unit*)0;
    }

    vca->output = Unit_create_output((Unit*)vca, 195, 75);
    vca->level_in = Unit_create_input((Unit*)vca, 5, 50);
    vca->signal_in = Unit_create_input((Unit*)vca, 5, 100);
    Window_resize((Window*)vca, 200, 150);

    if(!(vca->output && vca->level_in && vca->signal_in)) {

        Object_delete((Object*)vca);
        return (Unit*)0;
    }    
   
    vca->output->pull_sample_function = VCA_pull_sample_handler;
    vca->unit.frame.window.paint_function = VCA_paint_handler;

    return (Unit*)vca;
}
