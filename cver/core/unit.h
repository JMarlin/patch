#ifndef UNIT_H
#define UNIT_H

#include "io.h"
#include "patchcore.h"
#include <inttypes.h>

typedef struct Unit_struct {
    Frame frame;
    PatchCore* patch_core;
} Unit;

Unit* Unit_new(PatchCore* patch_core);
int Unit_init(Unit* unit, PatchCore* patch_core);
Output* Unit_create_output(Unit* unit, int x, int y);
Input* Unit_create_input(Unit* unit, int x, int y);
void Unit_delete(void* unit_void);

#endif //UNIT_H