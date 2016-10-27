#include "patchcore.h"
#include "../units/masterout.h"
#include "../units/noise.h"
#include "../units/pitchknob.h"
#include "../units/sequence.h"
#include "../units/sine.h"
#include "../units/square.h"
#include <stdlib.h>

PatchCore* PatchCore_new(PlatformWrapper* platform_wrapper) {

    PatchCore* patch;
    if(!(patch = (PatchCore*)malloc(sizeof(PatchCore))))
        return patch;

    Object_init(patch, Patch_delete_function);
    patch->platform_wrapper = platform_wrapper;
    patch->modules = AssociativeArray_new();
    patch->sources = List_new();
    patch->desktop = (PatchDesktop*)0;
    patch->inputs = List_new();

    if(!(patch->modules && patch->sources && patch->inputs)) {

        Object_delete(patch);
        return (PatchCore*)0;
    }

    return patch;
}

int PatchCore_install_module(PatchCore* patch, Module* module) {

    return AssociativeArray_insert(patch->modules, module->name, module);
}

int PatchCore_next_spawn_x(PatchCore* patch) {

    return 0;
}

int PatchCore_next_spawn_y(PatchCore* patch) {

    return 0;
}

void PatchCore_start(PatchCore* patch) {

    //TODO: This will be replaced by the loading of default modules from a list
    PatchCore_install_module(patch, MasterOut_new());
    PatchCore_install_module(patch, Noise_new());
    PatchCore_install_module(patch, Sine_new());
    PatchCore_install_module(patch, PitchKnob_new());
    PatchCore_install_module(patch, Sequence_new());
    PatchCore_install_module(patch, Square_new());

    patch->desktop = PatchDesktop_new(patch);

    PlatformWrapper_install_audio_handler(patch->platform_wrapper,
                                          AudioHandler_new(PatchCore_pull_sample, (Object*)patch));
}


int PatchCore_add_source(PatchCore* patch, IO* source) {

    if(!source->is_output)
        return 0;

    return List_add(patch->sources, source);
}

List* PatchCore_list_modules(PatchCore* patch) {

    return AssociativeArray_get_keys(patch->modules);
}

void PatchCore_connect_action(PatchCore* patch, IO* io) {

    PatchDesktop_connect_action(patch->desktop, io);
}

void PatchCore_destroy_menu(PatchCore* patch) {
    
    Object_delete(patch->desktop->menu);
    patch->desktop->menu = (SessionMenu*)0;
}

void PatchCore_instantiate_module(PatchCore* patch, char* module_name) {

    Module module;
    Window* window;

    module = (ModuleConstructor)AssociativeArray_get(module_name);
    if(!module)
        return;

    window = module->constructor();
    if(!window)
        return;

    Window_insert_child((Window*)patch->desktop, window);
    Window_move(PatchCore_next_spawn_x(patch), PatchCore_next_spawn_y(patch));
}

void PatchCore_pull_sample(Object* patch_object, double* sample_l, double* sample_r) {

    int i;
    Source* source;
    PatchCore* patch = (PatchCore*)patch_void;

    *sample_r = 0;
    *sample_l = 0;

    for(i = 0; i < patch->sources->count; i++) {

        source = (IO*)List_get_at(patch->sources, i);
        
        *sample_r += IO_pull_right_sample(source);
        *sample_l += IO_pull_left_sample(source);
    }
}

void PatchCore_delete_function(Object* patch_object) {

    
    Module* module;
    PatchCore patch = (PatchCore*)patch_object;

    if(patch->modules) Object_delete(patch->modules);
    if(patch->sources) Object_delete(patch->sources);
    if(patch->desktop) Object_delete(patch->desktop);
    if(patch->inputs)  Object_delete(patch->inputs);
    free(patch);
}
