#ifndef PATCHCORE_H

#include "../platform/platformwrapper.h"
#include "../platform/audiohandler.h"
#include "../wslib/associativearray.h"
#include "../wslib/list.h"
#include "../widgets/patchdesktop.h"
#include "module.h"
#include "source.h"

typedef struct PatchCore_struct {
    Object object;
    PatchDesktop* desktop;
    AssociativeArray* modules;
    List* sources;
    List* inputs;
} PatchCore;

PatchCore* PatchCore_new();
int PatchCore_install_module(PatchCore* patch, Module* module);
int PatchCore_next_spawn_x(PatchCore* patch);
int PatchCore_next_spawn_y(PatchCore* patch);
void PatchCore_start(PatchCore* patch);
int PatchCore_add_source(PatchCore* patch, Source* source);
List* PatchCore_get_module_list(PatchCore* patch);
void PatchCore_connect_action(PatchCore* patch, IO* io);
void PatchCore_destroy_menu(PatchCore* patch);
void PatchCore_instantiate_module(PatchCore* patch, char* module_name);
void PatchCore_pull_sample(void* patch_void, double* sample_l, double* sample_r);
void PatchCore_delete_function(Object* patch_object);

#endif //PATCHCORE_H