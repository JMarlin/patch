#ifndef MODULE_H
#define MODULE_H

#include "../wslib/window.h"
#include "../wslib/object.h"
#include "../core/patchcore.h"

typedef Window* (*ModuleConstructor)(PatchCore* patch_core);

typedef struct Module_struct {
    Object object;
    ModuleConstructor constructor;
    String* name;
} Module;

Module* Module_new(ModuleConstructor constructor, char* name);
void Module_delete_function(Object* module_object);

#endif //MODULE_H