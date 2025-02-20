#ifndef UNIT_H
#define UNIT_H

#ifdef __cplusplus
extern "C" {
#endif

struct Unit_struct;

#include "io.h"
#include "patchcore.h"
#include "../serialify/serialify.h"
#include "../uilib/frame.h"
#include "module.h"
#include <inttypes.h>

typedef int (*UnitToSerialFunction)(struct Unit_struct* unit, SerialifyBuf* sbuf);

typedef struct Unit_struct {
    Frame frame;
    UnitToSerialFunction serialify;
    struct PatchCore_struct* patch_core;
    WindowMoveHandler old_move;
    struct Module_struct* module;
} Unit;

Unit* Unit_new(struct PatchCore_struct* patch_core);
Unit* Unit_deserialify(SerialifyBuf* sbuf, struct PatchCore_struct* patch_core);
int Unit_serialify(Unit* unit, SerialifyBuf* sbuf);
int Unit_init(Unit* unit, struct PatchCore_struct* patch_core, struct Module_struct* module, UnitToSerialFunction serialify);
struct IO_struct* Unit_create_output(Unit* unit, int x, int y);
struct IO_struct* Unit_create_input(Unit* unit, int x, int y);
void Unit_delete(Object* unit_object);

#ifdef __cplusplus
}
#endif

#endif //UNIT_H
