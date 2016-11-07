#include "patchcore.h"
#include "../units/masterout.h"
#include "../units/noise.h"
#include "../units/pitchknob.h"
#include "../units/sequence.h"
#include "../units/sine.h"
#include "../units/square.h"
#include <stdlib.h>

PatchCore* PatchCore_new() {

    PatchCore* patch;
    if(!(patch = (PatchCore*)malloc(sizeof(PatchCore))))
        return patch;

    Object_init((Object*)patch, PatchCore_delete_function);
    patch->modules = AssociativeArray_new();
    patch->sources = List_new();
    patch->desktop = (PatchDesktop*)0;
    patch->inputs = List_new();

    if(!(patch->modules && patch->sources && patch->inputs)) {

        Object_delete((Object*)patch);
        return (PatchCore*)0;
    }

    return patch;
}

int PatchCore_install_module(PatchCore* patch, Module* module) {

    return AssociativeArray_add(patch->modules, module->name, (Object*)module);
}

int PatchCore_next_spawn_x(PatchCore* patch) {

    return 0;
}

int PatchCore_next_spawn_y(PatchCore* patch) {

    return 0;
}

void Patch_mouse_callback(Object* desktop_object, uint16_t mouse_x,
                           uint16_t mouse_y, uint8_t mouse_buttons) {

    Desktop_process_mouse((Desktop*)desktop_object, mouse_x, mouse_y, mouse_buttons);
}

void Patch_resize_callback(Object* desktop_object, int w, int h) {

    //Make sure that any changes to the root context get carried to all windows
    Window_update_context((Window*)desktop_object, ((Window*)desktop_object)->context);
    Window_resize((Window*)desktop_object, w, h);
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
    PlatformWrapper_install_resize_callback((Object*)patch->desktop, Patch_resize_callback);
    PlatformWrapper_install_mouse_callback((Object*)patch->desktop, Patch_mouse_callback);

    Window_paint((Window*)patch->desktop, (List*)0, 1);

    PlatformWrapper_install_audio_handler(AudioHandler_new(PatchCore_pull_sample, (Object*)patch));
}


int PatchCore_add_source(PatchCore* patch, IO* source) {

    if(!source->is_output)
        return 0;

    return List_add(patch->sources, (Object*)source);
}

void PatchCore_remove_source(PatchCore* patch, IO* source) {

    int i;

    for(i = 0; i < patch->sources->count; i++)
        if(List_get_at(patch->sources, i) == (Object*)source)
            break;

    if(i == patch->sources->count)
        return;

    List_remove_at(patch->sources, i);
}

List* PatchCore_get_module_list(PatchCore* patch) {

    return patch->modules->keys;
}

void PatchCore_connect_action(PatchCore* patch, IO* io) {

    PatchDesktop_connect_action(patch->desktop, io);
}

void PatchCore_destroy_menu(PatchCore* patch) {
    
    Object_delete((Object*)patch->desktop->menu);
    patch->desktop->menu = (SessionMenu*)0;
}

void PatchCore_instantiate_module(PatchCore* patch, String* module_name) {

    Module* module;
    Window* window;

    module = (Module*)AssociativeArray_get(patch->modules, module_name);
    if(!module)
        return;

    window = (Window*)module->constructor(patch);
    if(!window)
        return;

    Window_insert_child((Window*)patch->desktop, window);
    Window_move(window, PatchCore_next_spawn_x(patch), PatchCore_next_spawn_y(patch));
}

void PatchCore_pull_sample(Object* patch_object, double* sample_l, double* sample_r) {

    int i;
    IO* source;
    double temp_l, temp_r;
    PatchCore* patch = (PatchCore*)patch_object;

    *sample_r = 0;
    *sample_l = 0;

    for(i = 0; i < patch->sources->count; i++) {

        source = (IO*)List_get_at(patch->sources, i);
        
        IO_pull_sample(source, &temp_l, &temp_r);
        *sample_r += temp_r;
        *sample_l += temp_l;
    }
}

void PatchCore_delete_function(Object* patch_object) {
    
    Module* module;
    PatchCore* patch = (PatchCore*)patch_object;

    Object_delete((Object*)patch->modules);
    Object_delete((Object*)patch->sources);
    Object_delete((Object*)patch->desktop);
    Object_delete((Object*)patch->inputs);
    Object_default_delete_function(patch_object);
}
