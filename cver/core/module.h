#ifndef MODULE_H
#define MODULE_H

struct Module_struct;

#include "../wslib/window.h"
#include "../wslib/object.h"
#include "../core/patchcore.h"
#include "unit.h"

typedef struct Unit_struct* (*ModuleConstructor)(struct PatchCore_struct* patch_core);

typedef struct Module_struct {
    Object object;
    ModuleConstructor constructor;
    String* name;
} Module;

Module* Module_new(ModuleConstructor constructor, char* name);
void Module_delete_function(Object* module_object);

#endif //MODULE_H