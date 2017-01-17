#ifndef MODULE_H
#define MODULE_H

#ifdef __cplusplus
extern "C" {
#endif

struct Module_struct;

#include "../wslib/window.h"
#include "../wslib/object.h"
#include "../core/patchcore.h"
#include "unit.h"

typedef struct Unit_struct* (*ModuleConstructor)(struct PatchCore_struct* patch_core);
typedef struct Unit_struct* (*ModuleDeserializer)(SerialifyBuf* sbuf, struct PatchCore_struct* patch_core);

typedef struct Module_struct {
    Object object;
    ModuleConstructor constructor;
    ModuleDeserializer deserializer;
    String* name;
} Module;

Module* Module_new(ModuleConstructor constructor, ModuleDeserializer deserializer, char* name);
void Module_delete_function(Object* module_object);

#ifdef __cplusplus
}
#endif

#endif //MODULE_H
