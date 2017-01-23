#include "math.h"
#include "masterout.h"

Module* MasterOut_new() {

    return Module_new(MasterOut_constructor, MasterOut_deserializer, "Master Out");
}

float db2gain(float value) {

    float max_db = 10;
    float min_db = -80;
    float db_value = ((max_db - min_db) * value) + min_db;
    float gain_value = (powf(10,(db_value/20)) - powf(10,(min_db/20))) / (1 - powf(10, (min_db/20)));

    return gain_value;
}

int MasterOut_pull_sample_handler(IO* io, float* sample_l, float* sample_r, float* sample_g) {
 
    float l_gain, r_gain;
    MasterOut* master_out = (MasterOut*)io->param_object;

    int retval = IO_pull_sample(master_out->input, sample_l, sample_r, sample_g);
        
    //Gain
    *sample_l *= db2gain(Slider_get_value(master_out->gain_slider));
    *sample_r *= db2gain(Slider_get_value(master_out->gain_slider));

    //Pan
    r_gain = (1.0 - Slider_get_value(master_out->pan_slider))/2.0;
    l_gain = (1.0 + Slider_get_value(master_out->pan_slider))/2.0;
    (*sample_l) = (*sample_l) * l_gain;
    (*sample_r) = (*sample_r) * r_gain;

    //printf("%f/%f\n", l_gain, r_gain);

    *sample_g = 1;

    return retval;
}

void MasterOut_delete_function(Object* master_out_object) {

    MasterOut* master_out = (MasterOut*)master_out_object;

    //Need to do this since, because the output IO never gets installed 
    //as a child of the window, it won't be deleted by the window deleter
    Object_delete((Object*)(Object*)master_out->output);
    Unit_delete(master_out_object);
}

void MasterOut_paint_handler(Window* master_out_window) {

    Frame_paint_handler(master_out_window);
    Context_draw_text(master_out_window->context, "Master Out",
                       (master_out_window->width / 2) - 40,
                       (master_out_window->height / 2) - 6,
                       WIN_BORDERCOLOR);     
}

int MasterOut_serializer(Unit* master_out_unit, SerialifyBuf* sbuf) {

    MasterOut* master_out = (MasterOut*)master_out_unit;

    Serialify_from_int32(sbuf, master_out->input->ioid);
    Serialify_from_int32(sbuf, master_out->input->connected_id);
    Serialify_from_int32(sbuf, master_out->output->ioid);
    Serialify_from_int32(sbuf, master_out->output->connected_id);
    Serialify_from_float(sbuf, Slider_get_value(master_out->gain_slider));
    Serialify_from_float(sbuf, Slider_get_value(master_out->pan_slider));

    return 1;
}

Unit* MasterOut_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core, Unit* master_out_unit) {

    MasterOut* master_out = (MasterOut*)master_out_unit;

    master_out->input->ioid = Serialify_to_int32(sbuf);
    master_out->input->connected_id = Serialify_to_int32(sbuf);
    master_out->output->ioid = Serialify_to_int32(sbuf);
    master_out->output->connected_id = Serialify_to_int32(sbuf);
    Slider_set_value(master_out->gain_slider, Serialify_to_float(sbuf));
    Slider_set_value(master_out->pan_slider, Serialify_to_float(sbuf));

    return master_out_unit;
}

Unit* MasterOut_constructor(PatchCore* patch_core, Module* module) {

    MasterOut* master_out = (MasterOut*)malloc(sizeof(MasterOut));

    if(!master_out)
        return (Unit*)master_out;

    if(!Unit_init((Unit*)master_out, patch_core, module, MasterOut_serializer)) {

        Object_delete((Object*)master_out);
        return (Unit*)0;
    }

    Object_init((Object*)master_out, MasterOut_delete_function);
    master_out->gain_slider = Slider_new(10, 10, 30, 130, 0, 1);
    master_out->pan_slider = Slider_new(50, 110, 140, 30, -1, 1);
    master_out->input = Unit_create_input((Unit*)master_out, 5, 75);
    master_out->output = IO_new(patch_core, (Object*)master_out, 0, 0, 1);

    if(!(master_out->gain_slider && master_out->input
       && master_out->output && master_out->pan_slider)) {

        Object_delete((Object*)master_out);
        return (Unit*)0;
    }    

    Window_insert_child((Window*)master_out, (Window*)master_out->pan_slider);
    Window_insert_child((Window*)master_out, (Window*)master_out->gain_slider);
    Window_resize((Window*)master_out, 200, 150);

    master_out->output->pull_sample_function = MasterOut_pull_sample_handler;
    master_out->unit.frame.window.paint_function = MasterOut_paint_handler;
    PatchCore_add_source(patch_core, master_out->output);

    return (Unit*)master_out;
}
