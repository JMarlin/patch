#include "module.h"
#include <stdlib.h>

Module* Module_new(ModuleConstructor constructor, char* name) {

    Module* module;
    if(!(module = (Module*)malloc(sizeof(Module))))
        return module;

    Object_init((Object*)module, Module_delete_function);    
    module->constructor = constructor;
    
    if(!(module->name = String_new(name))) {

        Object_delete((Object*)module);
        return (Module*)0;
    }

    return module;
}

void Module_delete_function(Object* module_object) {

    Module* module;

    if(!module_object)
        return;

    module = (Module*)module_object;

    Object_delete((Object*)module->name);
    Object_default_delete_function(module_object);
} 
