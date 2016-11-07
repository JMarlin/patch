#ifndef UNIT_H
#define UNIT_H

struct Unit_struct;

#include "io.h"
#include "patchcore.h"
#include "../uilib/frame.h"
#include <inttypes.h>

typedef struct Unit_struct {
    Frame frame;
    struct PatchCore_struct* patch_core;
} Unit;

Unit* Unit_new(struct PatchCore_struct* patch_core);
int Unit_init(Unit* unit, struct PatchCore_struct* patch_core);
struct IO_struct* Unit_create_output(Unit* unit, int x, int y);
struct IO_struct* Unit_create_input(Unit* unit, int x, int y);
void Unit_delete(Object* unit_object);

#endif //UNIT_H