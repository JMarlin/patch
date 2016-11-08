#include "unit.h"
#include "../wslib/list.h"

Unit* Unit_new(PatchCore* patch_core) {

    Unit* unit;
    if(!(unit = (Unit*)malloc(sizeof(Unit))))
        return unit;

    if(!Unit_init(unit, patch_core)) {

        Object_delete((Object*)unit);
        return (Unit*)0;
    }

    return unit;
}

void Unit_move_function(Window* unit_window, int x, int y) {

    Unit* unit = (Unit*)unit_window;

    unit->old_move(unit_window, x, y);

    //Cheap method to force elbow redraws
    if(unit_window->parent) {

        Window_invalidate(unit_window->parent, 0, 0,
                          unit_window->parent->height - 1,
                          unit_window->parent->width - 1);
    }
}

int Unit_init(Unit* unit, PatchCore* patch_core) {

    if(!Frame_init((Frame*)unit, 0, 0, 100, 100))
        return 0;

    unit->patch_core = patch_core;
    unit->old_move = unit->frame.window.move_function;
    unit->frame.window.move_function = Unit_move_function;

    return 1;
}

IO* Unit_create_io(Unit* unit, int x, int y, uint8_t is_output) {

    IO* io = IO_new(unit->patch_core, (Object*)unit, x, y, is_output);

    if(!io)
        return io;

    Window_insert_child((Window*)unit, (Window*)io);

    return io;
}

IO* Unit_create_output(Unit* unit, int x, int y) {

    IO* io = Unit_create_io(unit, x, y, 1);

    return io;
}

IO* Unit_create_input(Unit* unit, int x, int y) {

    return Unit_create_io(unit, x, y, 0);
}

void Unit_delete(Object* unit_object) {

    Window_delete_function(unit_object);
}
