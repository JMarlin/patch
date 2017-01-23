#include "sequence.h"

Module* Sequence_new() {

    return Module_new(Sequence_constructor, Sequence_deserializer, "Sequence");
}

int Sequence_pull_sample_handler(IO* io, float* sample_l, float* sample_r, float* sample_g) {

    Sequence* sequence = (Sequence*)io->param_object;
    int stepped = 0;

    int i;
    float current_clock_sample_l,
           current_clock_sample_r,
           in_sample_g,
           step_sample_l[8],
           step_sample_r[8];

    if(!IO_pull_sample(sequence->clock_in, &current_clock_sample_l, &current_clock_sample_r, &in_sample_g))
        return 0;

    if(current_clock_sample_l > 0 && sequence->last_clock_sample <= 0) {

        stepped = 1;
        sequence->current_step++;
    }

    sequence->last_clock_sample = current_clock_sample_l;

    if(sequence->current_step == 8)
        sequence->current_step = 0;

    for(i = 0; i < 8; i++) {

        if(!IO_pull_sample((IO*)List_get_at(sequence->step_list, i), 
                           &step_sample_l[i], &step_sample_r[i], &in_sample_g))
            return 0;
    }

    *sample_l = step_sample_l[sequence->current_step];
    *sample_r = step_sample_r[sequence->current_step];
    *sample_g = stepped ? -1.0 : 1.0;

    if(stepped)
        Window_invalidate((Window*)sequence, 30, 17, 40, 186);

    return 1;
}

void Sequence_delete_function(Object* sequence_object) {

    Sequence* sequence = (Sequence*)sequence_object;

    //Clear the list so that the elements don't get freed on list
    //deletion and then float-freed on window deletion
    while(sequence->step_list && sequence->step_list->count)
        List_remove_at(sequence->step_list, 0);

    //Delete the emptied step list
    Object_delete((Object*)sequence->step_list);
    Unit_delete(sequence_object);
}

void Sequence_paint_handler(Window* sequence_window) {

    int i;
    Sequence* sequence = (Sequence*)sequence_window;

    Frame_paint_handler(sequence_window);

    for(i = 0; i < 8; i++) {

        if(i == sequence->current_step)
            Context_fill_rect(sequence_window->context, 20*(i+1) - 3, 30, 10, 10, RGB(255, 90, 90));
        else
            Context_fill_rect(sequence_window->context, 20*(i+1) - 3, 30, 10, 10, RGB(100, 50, 50));
    }

    Context_draw_text(sequence_window->context, "Sequence",
                       (sequence_window->width / 2) - 32,
                       (sequence_window->height / 2) - 6,
                       WIN_BORDERCOLOR);     
}

Unit* Sequence_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core, Unit* sequence_unit) {

    return sequence_unit;
}

int Sequence_serializer(Unit* sequence_unit, SerialifyBuf* sbuf) {

    return 1;
}

Unit* Sequence_constructor(PatchCore* patch_core, Module* module) {

    int i;
    IO* temp_input;
    Sequence* sequence = (Sequence*)malloc(sizeof(Sequence));

    if(!sequence)
        return (Unit*)sequence;

    if(!Unit_init((Unit*)sequence, patch_core, module, Sequence_serializer)) {

        Object_delete((Object*)sequence);
        return (Unit*)0;
    }

    Object_init((Object*)sequence, Sequence_delete_function);

    sequence->step_list = List_new();

    if(!sequence->step_list) {

        Object_delete((Object*)sequence);
        return (Unit*)0;
    }    

    
    for(i = 0; i < 8; i++) {

        temp_input = Unit_create_input((Unit*)sequence, 20*(i+1), 5);

        if(!temp_input) {

            Object_delete((Object*)sequence);
            return (Unit*)0;
        }    

        List_add(sequence->step_list, (Object*)temp_input);
    }

    sequence->output = Unit_create_output((Unit*)sequence, 195, 75);
    sequence->clock_in = Unit_create_input((Unit*)sequence, 5, 75);

    if(!(sequence->clock_in && sequence->output)) {

        Object_delete((Object*)sequence);
        return (Unit*)0;
    }    

    Window_resize((Window*)sequence, 200, 150);
    sequence->output->pull_sample_function = Sequence_pull_sample_handler;
    sequence->current_step = 0;
    sequence->last_clock_sample = 0;
    sequence->unit.frame.window.paint_function = Sequence_paint_handler;

    return (Unit*)sequence;
}
