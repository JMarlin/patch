#include "patchcore.h"
#include "../units/masterout.h"
#include "../units/noise.h"
#include "../units/pitchknob.h"
#include "../units/sequence.h"
#include "../units/sine.h"
#include "../units/square.h"
#include "patchdesktop.h"
#include <stdlib.h>

PatchCore* PatchCore_new(PlatformWrapper* platform_wrapper) {

    PatchCore* patch;
    if(!(patch = (PatchCore*)malloc(sizeof(PatchCore))))
        return patch;

    patch->platform_wrapper = platform_wrapper;
    patch->modules = AssociativeArray_new();
    patch->sources = List_new();
    patch->desktop = (PatchDesktop*)0;
    patch->inputs = List_new();

    if(!(patch->modules && patch->sources && patch->inputs)) {

        PatchCore_delete(patch);
        return (PatchCore*)0;
    }

    return patch;
}

void PatchCore_delete(void* patch_void) {

    Module* module;
    PatchCore patch = (PatchCore*)patch_void;

    if(patch->modules) AssociativeArray_delete(patch->modules, Module_delete);
    if(patch->sources) List_delete(patch->sources, Source_delete);
    if(patch->desktop) Desktop_delete(patch->desktop);
    if(patch->inputs) List_delete(patch->inputs, IO_delete);

    free(patch);
}

int PatchCore_install_module(PatchCore* patch, Module* module) {

    return AssociativeArray_insert(patch->modules, module->name, module->constructor);
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

    patch->manager = UIManager_new(patch->platform_wrapper);
    patch->desktop = Desktop_new(patch);
    Window_add_child((Window*)patch->manager, (Window*)patch->desktop);

    PlatformWrapper_install_audio_handler(patch->platform_wrapper,
                                          PatchCore_create_AudioHandler(patch));
}


int PatchCore_add_source(PatchCore* patch, Source* source) {

    return List_add(patch->sources, source);
}

List* PatchCore_list_modules(PatchCore* patch) {

    return AssociativeArray_get_keys(patch->modules);
}

void PatchCore_connect_action(PatchCore* patch, IO* io) {

    Desktop_connect_action(patch->desktop, io);
}

void PatchCore_destroy_menu(PatchCore* patch) {

    Window_destroy((Window*)patch->desktop->menu);
    patch->desktop->menu = (SessionMenu*)0;
}

void PatchCore_instantiate_module(PatchCore* patch, char* module_name) {

    ModuleConstructor module_constructor;
    Window* window;

    module_constructor = (ModuleConstructor)AssociativeArray_get(module_name);
    if(!module_constructor)
        return;

    window = module_constructor();
    if(!window)
        return;

    window->x = PatchCore_next_spawn_x(patch);
    window->y = PatchCore_next_spawn_y(patch);
    Window_add_child((Window*)patch->desktop, window);
}

AudioHandler* PatchCore_create_audio_handler(PatchCore* patch) {

    return AudioHandler_new(PatchCore_pull_sample, (void*)patch);
}

void PatchCore_pull_sample(void* patch_void, double* sample_l, double* sample_r) {

    int i;
    Source* source;
    PatchCore* patch = (PatchCore*)patch_void;

    *sample_r = 0;
    *sample_l = 0;

    for(i = 0; i < patch->sources->count; i++) {

        source = (Source*)List_get_at(patch->sources, i);

        *sample_r += Source_pull_right_sample(source);
        *sample_l += Source_pull_left_sample(source);
    }
}

#endif //PATCHCORE_H