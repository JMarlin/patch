#include "unit.h"
#include "../util/list.h"

Unit* Unit_new(PatchCore* patch_core) {

    Unit* unit;
    if(!(unit = (Unit*)malloc(sizeof(Unit))))
        return unit;

    if(!Unit_init(unit, patch_core)) {

        Unit_delete(unit);
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

//Move to window class
void Unit_resize(Unit* unit, int w, int h) {

    unit->frame.window.width = w;
    unit->frame.window.height = h;
    Window_invalidate((Window*)unit);
}

Output* Unit_create_output(Unit* unit, int x, int y) {

    Output* output;
    if(!(output = Output_new(unit->patch_core, x, y)))
        return output;

    Window_add_child((Window*)unit, (Window*)output);

    return output;
}

Input* Unit_create_input(Unit* unit, int x, int y) {

    Input* input;
    if(!(input = Input_new(unit->patch_core, x, y)))
        return input;

    Window_add_child((Window*)unit, (Window*)input);
    List_add(unit->patch_core->inputs, input);

    return input;
}

void Unit_delete(void* unit_void) {

    Frame_delete((Frame*)unit_void);
}
