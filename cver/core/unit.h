#ifndef UNIT_H
#define UNIT_H

#ifdef __cplusplus
extern "C" {
#endif

struct Unit_struct;

#include "io.h"
#include "patchcore.h"
#include "../uilib/frame.h"
#include <inttypes.h>

typedef struct Unit_struct {
    Frame frame;
    struct PatchCore_struct* patch_core;
    WindowMoveHandler old_move;
} Unit;

Unit* Unit_new(struct PatchCore_struct* patch_core);
int Unit_init(Unit* unit, struct PatchCore_struct* patch_core);
struct IO_struct* Unit_create_output(Unit* unit, int x, int y);
struct IO_struct* Unit_create_input(Unit* unit, int x, int y);
void Unit_delete(Object* unit_object);

#ifdef __cplusplus
}
#endif

#endif //UNIT_H