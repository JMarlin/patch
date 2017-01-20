#include "unit.h"
#include "../wslib/list.h"

Unit* Unit_new(PatchCore* patch_core) {

    Unit* unit;
    if(!(unit = (Unit*)malloc(sizeof(Unit))))
        return unit;

    if(!Unit_init(unit, patch_core, 0, 0)) {

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

int Unit_init(Unit* unit, PatchCore* patch_core, Module* module, UnitToSerialFunction serialify) {

    if(!Frame_init((Frame*)unit, 0, 0, 100, 100))
        return 0;

    unit->module = module;
    unit->serialify = serialify;
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

Unit* Unit_deserialify(SerialifyBuf* sbuf, PatchCore* patch) {

    String* name_str;
    Module* module;
    Unit* unit;

    name_str = String_new(Serialify_to_cstring(sbuf));
    module = (Module*)AssociativeArray_get(patch->modules, name_str);
    Object_delete(name_str);

    if(module) {

        unit = module->constructor(patch, module);
        
        if(!unit)
            return unit; //Need better errors in general

        //Need real error handling for all of this serialization stuff
        unit->frame.window.x = Serialify_to_int16(sbuf);
        unit->frame.window.y = Serialify_to_int16(sbuf);

        //Then get the state for the new unit from its module type
        unit =  module->deserializer(sbuf, patch, unit);

        //Install on the desktop
        Window_insert_child((Window*)patch->desktop, (Window*)unit);

        return unit;
    } else {

        //Error: Your copy of Patch does not support module 'module'
        //Idea: write general PatchCore_raise_error() ?
        return (Unit*)0;
    }
}

int Unit_serialify(Unit* unit, SerialifyBuf* sbuf) {

    if(unit->serialify) {

        //Every unit serialization begins with the module name of the unit
        //as well as the unit's x,y location
        Serialify_from_cstring(sbuf, unit->module->name->buf);
        Serialify_from_int16(unit->frame.window.x);
        Serialify_from_int16(unit->frame.window.y);

        //We then defer to the unit instance to write its own state
        return unit->serialify(unit, sbuf);
    } else {

        return 0; //Need more meaningful error codes
    }
}
