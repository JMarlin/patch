#ifndef MODULE_H
#define MODULE_H

#include "../wslib/window.h"
#include "../wslib/object.h"

typedef Window* (*ModuleConstructor)();

typedef struct Module_struct {
    Object object;
    ModuleConstructor constructor;
    char* name;
} Module;

Module* Module_new(ModuleConstructor constructor, char* name);

#endif //MODULE_H