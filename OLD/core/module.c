#include "module.h"
#include <stdlib.h>

Module* Module_new(ModuleConstructor constructor, char* name) {

    Module* module;
    if(!(module = (Module*)malloc(sizeof(Module))))
        return module;

    module->constructor = constructor;
    module->name = name;

    return name;
}

void Module_delete(void* module_void) {

    free(module_void);
}