#include "sequence.h"

Module* Sequence_new() {

    return Module_new(Sequence_constructor, "Sequence");
}

int Sequence_pull_sample_handler(IO* io, double* sample_l, double* sample_r) {

    (Sequence*)sequence = (Sequence*)io->param_object;

    int i;
    double current_clock_sample_l,
           current_clock_sample_r,
           step_sample_l[8],
           step_sample_r[8];

    if(!IO_pull_sample(sequence->clock_in, &current_clock_sample_l, &current_clock_sample_r))
        return 0;

    if(current_clock_sample_l > 0 && sequence->last_clock_sample <= 0)
        sequence->current_step++;

    sequence->last_clock_sample = current_clock_sample_l;

    if(sequence->current_step == 8)
        sequence->current_step = 0;

    for(i = 0; i < 8; i++) {

        if(!IO_pull_sample((IO*)List_get_at(sequence->step_list, i), 
                           &step_sample_l[i], &step_sample_r[i]));
            return 0;
    }

    *sample_l = step_sample_l[sequence->current_step];
    *sample_r = step_sample_r[sequence->current_step];

    return 1;
}

void Sequence_delete_function(Object* sequence_object) {

    (Sequence*)sequence = (Sequence*)sequence_object;

    //Clear the list so that the elements don't get freed on list
    //deletion and then double-freed on window deletion
    while(sequence->step_list && sequence->step_list->count)
        List_remove_at(sequence->step_list, 0);

    //Delete the emptied step list
    Object_delete(sequence->step_list);
    Unit_delete(sequence_object);
}

Unit* Sequence_constructor(PatchCore* patch_core) {

    int i;
    IO* temp_input;
    Sequence* sequence = (Sequence*)malloc(sizeof(Sequence));

    if(!sequence)
        return sequence;

    if(!Unit_init(sequence, patch_core)) {

        Object_delete(sequence);
        return (Unit*)0;
    }

    Object_init(sequence, Sequence_delete_function);

    sequence->step_list = List_new();

    if(!sequence->step_list) {

        Object_delete(sequence);
        return (Unit*)0;
    }    

    
    for(i = 0; i < 8; i++) {

        temp_input = Unit_create_input(sequence, 20*(i+1), 5);

        if(!temp_input) {

            Object_delete(sequence);
            return (Unit*)0;
        }    

        List_add(sequence->step_list, temp_input);
    }

    sequence->output = Unit_create_output(sequence, 195, 75);
    sequence->clock_in = Unit_create_input(sequence, 5, 75);

    if(!(sequence->clock_in && sequence->output)) {

        Object_delete(sequence);
        return (Unit*)0;
    }    

    Window_resize(sequence, 200, 150);
    sequence->output->pull_sample_function = Sequence_pull_sample_handler;
    sequence->current_step = 0;
    sequence->last_clock_sample = 0;

    return (Unit*)sequence;
}