#include "unit.h"
#include "../util/list.h"

Unit* Unit_new(PatchCore* patch_core) {

    Unit* unit;
    if(!(unit = (Unit*)malloc(sizeof(Unit))))
        return unit;

    if(!Unit_init(unit, patch_core)) {

        Object_delete(unit);
        return (Unit*)0;
    }

    return unit;
}

int Unit_init(Unit* unit, PatchCore* patch_core) {

    if(!Frame_init((Frame*)unit, 0, 0, 100, 100))
        return 0;

    unit->patch_core = patch_core;

    return 1;
}

IO* Unit_create_output(Unit* unit, int x, int y, IOSamplePullHandler generator_function) {

    IO* io = Unit_create_io(unit, x, y, 1);

    if(!io)
        return io;

    io->sample_pull_function = generator_function;
}

IO* Unit_create_input(Unit* unit, int x, int y) {

    return Unit_create_io(unit, x, y, 0);
}

IO* Unit_create_io(Unit* uint, int x, int y, uint8_t is_output) {

    IO* io = IO_new(unit->patch_core, (Object*)unit, x, y, is_output);

    if(!io)
        return;

    Window_insert_child(unit, io);

    return io;
}

void Unit_delete(Object* unit_object) {

    Frame_delete((Frame*)unit_object);
}
