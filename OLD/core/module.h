#ifndef MODULE_H
#define MODULE_H

#include "../uilib/window.h"

typedef Window* (*ModuleConstructor)();

typedef struct Module_struct {
    ModuleConstructor constructor;
    char* name;
} Module;

Module* Module_new(ModuleConstructor constructor, char* name);
void Module_delete(void* module_void);

#endif //MODULE_H