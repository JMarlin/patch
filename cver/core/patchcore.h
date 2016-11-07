#ifndef PATCHCORE_H
#define PATCHCORE_H

struct PatchCore_struct;

#include "../platform/platformwrapper.h"
#include "../platform/audiohandler.h"
#include "../wslib/associativearray.h"
#include "../wslib/list.h"
#include "../widgets/patchdesktop.h"
#include "module.h"

typedef struct PatchCore_struct {
    Object object;
    struct PatchDesktop_struct* desktop;
    AssociativeArray* modules;
    List* sources;
    List* inputs;
} PatchCore;

PatchCore* PatchCore_new();
int PatchCore_install_module(PatchCore* patch, struct Module_struct* module);
int PatchCore_next_spawn_x(PatchCore* patch);
int PatchCore_next_spawn_y(PatchCore* patch);
void PatchCore_start(PatchCore* patch);
int PatchCore_add_source(PatchCore* patch, struct IO_struct* source);
List* PatchCore_get_module_list(PatchCore* patch);
void PatchCore_connect_action(PatchCore* patch, struct IO_struct* io);
void PatchCore_destroy_menu(PatchCore* patch);
void PatchCore_instantiate_module(PatchCore* patch, String* module_name);
void PatchCore_pull_sample(Object* patch_object, double* sample_l, double* sample_r);
void PatchCore_delete_function(Object* patch_object);

#endif //PATCHCORE_H