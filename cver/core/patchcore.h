#ifndef PATCHCORE_H
#define PATCHCORE_H

struct PatchCore_struct;

#include "../platform/platformwrapper.h"
#include "../platform/audiohandler.h"
#include "../wslib/associativearray.h"
#include "../wslib/list.h"
#include "../widgets/patchdesktop.h"
#include "module.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct PatchCore_struct {
    Object object;
    struct PatchDesktop_struct* desktop;
    AssociativeArray* modules;
    List* sources;
    List* inputs;
    List* outputs;
} PatchCore;

PatchCore* PatchCore_new();
void PatchCore_save_buffers_as_wav(PatchCore* patch, float* l_buf, float* r_buf, int buf_size);
int PatchCore_clear_session(PatchCore* patch);
int PatchCore_save_session(PatchCore* patch);
int PatchCore_load_session(PatchCore* patch);
int PatchCore_install_module(PatchCore* patch, struct Module_struct* module);
int PatchCore_next_spawn_x(PatchCore* patch);
int PatchCore_next_spawn_y(PatchCore* patch);
void PatchCore_start(PatchCore* patch);
int PatchCore_add_source(PatchCore* patch, struct IO_struct* source);
List* PatchCore_get_module_list(PatchCore* patch);
void PatchCore_connect_action(PatchCore* patch, struct IO_struct* io);
void PatchCore_destroy_menu(PatchCore* patch);
void PatchCore_instantiate_module(PatchCore* patch, String* module_name);
void PatchCore_pull_sample(Object* patch_object, float* sample_l, float* sample_r);
void PatchCore_delete_function(Object* patch_object);

#ifdef __cplusplus
}
#endif

#endif //PATCHCORE_H
