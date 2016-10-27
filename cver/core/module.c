#include "module.h"
#include <stdlib.h>

Module* Module_new(ModuleConstructor constructor, char* name) {

    Module* module;
    if(!(module = (Module*)malloc(sizeof(Module))))
        return module;

    Object_init(module, 0);    
    module->constructor = constructor;
    module->name = name;

    return name;
}
