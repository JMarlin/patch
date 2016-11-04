#ifndef PATCHCORE_H

#include "../platform/platformwrapper.h"
#include "../platform/audiohandler.h"
#include "../uilib/uimanager.h"
#include "../util/associativearray.h"
#include "../util/list.h"
#include "../widgets/desktop.h"
#include "module.h"
#include "source.h"

typedef struct PatchCore_struct {
    UIManager* manager;
    AssociativeArray* modules;
    List* sources;
    List* inputs;
    Desktop* desktop;
    PlatformWrapper* platform_wrapper;
} PatchCore;

PatchCore* PatchCore_new(PlatformWrapper* platform_wrapper);
void PatchCore_delete(PatchCore* patch);
int PatchCore_install_module(PatchCore* patch, Module* module);
int PatchCore_next_spawn_x(PatchCore* patch);
int PatchCore_next_spawn_y(PatchCore* patch);
void PatchCore_start(PatchCore* patch);
int PatchCore_add_source(PatchCore* patch, Source* source);
List* PatchCore_list_modules(PatchCore* patch);
void PatchCore_connect_action(PatchCore* patch, IO* io);
void PatchCore_destroy_menu(PatchCore* patch);
void PatchCore_instantiate_module(PatchCore* patch, char* module_name);
AudioHandler* PatchCore_create_audio_handler(PatchCore* patch);
void PatchCore_pull_sample(void* patch_void, double* sample_l, double* sample_r);

#endif //PATCHCORE_H