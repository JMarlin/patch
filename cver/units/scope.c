#include "scope.h"
#include <stdio.h>

/*
typedef struct Scope_struct {
    Unit unit;
    Button* start_button;
    Button* stop_button;
    Button* zoom_in_button;
    Button* zoom_out_button;
    Button* scroll_left_button;
    Button* scroll_right_button;
    IO* input;
    int capture_pointer;
    float* sample_buf;
} Scope;
*/

void Scope_paint_handler(Window* scope_window) {

    int i;
    int intval;
    Scope* scope = (Scope*)scope_window;

    Frame_paint_handler(scope_window);
    Context_fill_rect(scope_window->context, 13, 13, 374, 236, RGB(255, 255, 255));
    Context_draw_rect(scope_window->context, 12, 12, 376, 238, RGB(0, 0, 0));                  
    
    if(scope->capture_pointer != 374)
        return;

    for(i = 0; i < 374; i++) {
    
        intval = (int)(scope->sample_buf[i] * 100);

        if(intval > 0)
            Context_draw_rect(scope_window->context, 13 + i, 113 - intval, 
                              1, intval, RGB(0, 0, 0));

        if(intval < 0)
            Context_draw_rect(scope_window->context, 13 + i, 113,
                              1, -intval, RGB(0, 0, 0));
    }
}

Module* Scope_new() {

    return Module_new(Scope_constructor, "Scope");
}

void Scope_start_click_handler(Window* button_window, int x, int y) {

    Scope* scope = (Scope*)button_window->parent;

    scope->capture_pointer = 0;
    Window_invalidate(button_window->parent, 13, 13, 249, 387);
}

int Scope_render_sample_handler(IO* io, float* l_sample, float* r_sample, float* g_sample) {

    Scope* scope = (Scope*)io->param_object;

    if(!scope->input->connected_io || scope->capture_pointer < 0 || scope->capture_pointer > 373)
        return 1;

    IO_pull_sample(scope->input->connected_io, l_sample, r_sample, g_sample);
    scope->sample_buf[scope->capture_pointer++] = *l_sample;

    if(scope->capture_pointer == 374)
        Window_invalidate((Window*)scope, 13, 13, 249, 387);

    return 1;
}

//NOTE: The below needs a lot of proper error handling to be added
Unit* Scope_constructor(PatchCore* patch_core) {

    Scope* scope;

    scope = (Scope*)malloc(sizeof(Scope));

    if(!scope)
        return (Unit*)0;

    Unit_init((Unit*)scope, patch_core);
    Window_resize((Window*)scope, 400, 300);

    //Allocate the sample buffers
    //NEED TO ERROR HANDLE
    scope->sample_buf = (float*)malloc(sizeof(float) * 374);
    scope->capture_pointer = -1;

    //Create a basic button to trigger sample capture
    scope->start_button = Button_new(12, 259, 100, 30);
    Window_set_title((Window*)scope->start_button, "Capture");
    Window_insert_child((Window*)scope, (Window*)scope->start_button);
    scope->start_button->window.mouseclick_function = Scope_start_click_handler;

    //Create an input for the signal to be tested
    scope->input = Unit_create_input((Unit*)scope, 7, 150);

    //Create a virtual/hidden output to hook sample render events
    scope->output = IO_new(patch_core, (Object*)scope, 397, 150, 1);
    scope->output->pull_sample_function = Scope_render_sample_handler;

    scope->unit.frame.window.paint_function = Scope_paint_handler;

    return (Unit*)scope;
}
