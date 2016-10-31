#include "math.h"
#include "masterout.h"

Module* MasterOut_new() {

    return Module_new(MasterOut_constructor, "Master Out");
}

double db2gain(double value) {

    double max_db = 10;
    double min_db = -80;
    double db_value = ((max_db - min_db) * value) + min_db;
    double gain_value = (pow(10,(db_value/20)) - pow(10,(min_db/20))) / (1 - pow(10, (min_db/20)));

    return gain_value;
}

int MasterOut_pull_sample_handler(IO* io, double* sample_l, double* sample_r) {

    MasterOut* master_out = (MasterOut*)io->param_object;

    int retval = IO_pull_sample(master_out->input, sample_l, sample_r);
    
    *sample_l *= db2gain(Slider_get_value(master_out->slider));
    *sample_r *= db2gain(Slider_get_value(master_out->slider));

    return retval;
}

Unit* MasterOut_constructor(PatchCore* patch_core) {

    IO* output;
    MasterOut* master_out = (MasterOut*)malloc(sizeof(MasterOut));

    if(!master_out)
        return master_out;

    if(!Unit_init(master_out, patch_core)) {

        Object_delete(master_out);
        return (Unit*)0;
    }

    master_out->slider = Slider_new(10, 10, 30, 130, 0, 1);
    master_out->input = Unit_create_input(master_out, 5, 75);
    master_out->output = IO_new(patch_core, master_out, 0, 0, 1);

    if(!(master_out->slider && master_out->input && master_out->output)) {

        Object_delete(master_out);
        return (Unit*)0;
    }    
   
    master_out->output->pull_sample_function = MasterOut_pull_sample_handler;
    PatchCore_add_source(patch_core, output);

    return (Unit*)master_out;
}
