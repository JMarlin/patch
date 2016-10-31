#include "module.h"
#include <stdlib.h>

Module* Module_new(ModuleConstructor constructor, char* name) {

    Module* module;
    if(!(module = (Module*)malloc(sizeof(Module))))
        return module;

    Object_init(module, Module_delete_function);    
    module->constructor = constructor;
    
    if(!(module->name = String_new(name))) {

        Object_delete(module);
        return (Module*)0;
    }

    return name;
}

void Module_delete_function(Object* module_object) {

    if(!module_object)
        return;

    Module* module = (Module* module_object);

    Object_delete(module->name);
    Object_default_delete_function(module_object);
} 