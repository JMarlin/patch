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

    int i, tfloor, tceil;
    int intval;
    float interpolated, tval, slope;
    float scale_value;
    Scope* scope = (Scope*)scope_window;
    
    scale_value = ((float)scope->buf_size) / 374.0;
    Frame_paint_handler(scope_window);
    Context_fill_rect(scope_window->context, 13, 13, 374, 236, RGB(255, 255, 255));
    Context_draw_rect(scope_window->context, 12, 12, 376, 238, RGB(0, 0, 0));                  
    
    if(scope->capture_pointer != scope->buf_size)
        return;

    //Render left
    for(i = 0; i < 374; i++) {
    
        tval = ((float)i) * scale_value;
        tfloor = (int)tval;

        //If the scaled index is an integer, we can just get the sample at that index
        if((tval - (float)tfloor) == 0) {

            intval = (int)(scope->sample_buf_l[tfloor] * 50);
        } else {

            //If we're out of samples, just use the end sample
            if(tfloor > (scope->buf_size - 2)) {
            
                intval = (int)(scope->sample_buf_l[scope->buf_size - 1] * 50);
            } else {
          
                //Otherwise, get the linear value between the samples
                //If the two samples have the same value, just use that value
                if(scope->sample_buf_l[tfloor] == scope->sample_buf_l[tfloor + 1]) {
                
                    intval = (int)(scope->sample_buf_l[tfloor] * 50);
                } else {

                    //Otherwise, calculate the value
                    slope = (scope->sample_buf_l[tfloor + 1] - scope->sample_buf_l[tfloor]); //dX = 1.0 samples
                    tval -= (float)tfloor; //Translate range to zero
                    intval = (int)(((slope * tval) + scope->sample_buf_l[tfloor]) * 50.0); //y = mx+b, b = 0 thanks to our translation, then x 100 for render
                }
            }
        }

        if(intval > 0)
            Context_draw_rect(scope_window->context, 13 + i, 63 - intval, 
                              1, intval, RGB(0, 0, 0));

        if(intval < 0)
            Context_draw_rect(scope_window->context, 13 + i, 63,
                              1, -intval, RGB(0, 0, 0));
    }

    //Render right
    for(i = 0; i < 374; i++) {
    
        tval = ((float)i) * scale_value;
        tfloor = (int)tval;

        //If the scaled index is an integer, we can just get the sample at that index
        if((tval - (float)tfloor) == 0) {

            intval = (int)(scope->sample_buf_r[tfloor] * 50);
        } else {

            //If we're out of samples, just use the end sample
            if(tfloor > (scope->buf_size - 2)) {
            
                intval = (int)(scope->sample_buf_r[scope->buf_size - 1] * 50);
            } else {
          
                //Otherwise, get the linear value between the samples
                //If the two samples have the same value, just use that value
                if(scope->sample_buf_r[tfloor] == scope->sample_buf_r[tfloor + 1]) {
                
                    intval = (int)(scope->sample_buf_r[tfloor] * 50);
                } else {

                    //Otherwise, calculate the value
                    slope = (scope->sample_buf_r[tfloor + 1] - scope->sample_buf_r[tfloor]); //dX = 1.0 samples
                    tval -= (float)tfloor; //Translate range to zero
                    intval = (int)(((slope * tval) + scope->sample_buf_r[tfloor]) * 50.0); //y = mx+b, b = 0 thanks to our translation, then x 100 for render
                }
            }
        }

        if(intval > 0)
            Context_draw_rect(scope_window->context, 13 + i, 163 - intval, 
                              1, intval, RGB(0, 0, 0));

        if(intval < 0)
            Context_draw_rect(scope_window->context, 13 + i, 163,
                              1, -intval, RGB(0, 0, 0));
    }
}

Module* Scope_new() {

    return Module_new(Scope_constructor, Scope_deserializer, "Scope");
}

void Scope_start_click_handler(Window* button_window, int x, int y) {

    Scope* scope = (Scope*)button_window->parent;

    scope->capture_pointer = 0;
    Window_invalidate(button_window->parent, 13, 13, 249, 387);
}

int Scope_render_sample_handler(IO* io, float* l_sample, float* r_sample, float* g_sample) {

    Scope* scope = (Scope*)io->param_object;

    if(!scope->input->connected_io || scope->capture_pointer < 0 || scope->capture_pointer > (scope->buf_size - 1))
        return 1;

    IO_pull_sample(scope->input->connected_io, l_sample, r_sample, g_sample);
    scope->sample_buf_l[scope->capture_pointer] = *l_sample;
    scope->sample_buf_r[scope->capture_pointer] = *r_sample;
    scope->capture_pointer++;

    if(scope->capture_pointer == scope->buf_size)
        Window_invalidate((Window*)scope, 13, 13, 249, 387);

    return 1;
}

Unit* Scope_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core) {

    return (Unit*)0;
}

//NOTE: The below needs a lot of proper error handling to be added
//TO ADD: -Optional trigger input which will fire a capture with the same mechanism as the button,
//         but on the transition of the input signal. Also need controls to select 1-shot or
//         continuous capture from trigger as well as to select the trigger source (l/r/g)
//        -Control to adjust sample capture/buffer length
//        -Zoom and pan controls for view area
//        -Capture and display of all three signals and/or a way to switch which is being viewed
Unit* Scope_constructor(PatchCore* patch_core, Module* module) {

    Scope* scope;

    scope = (Scope*)malloc(sizeof(Scope));

    if(!scope)
        return (Unit*)0;

    Unit_init((Unit*)scope, patch_core, module);
    Window_resize((Window*)scope, 400, 300);

    //Allocate the sample buffers
    //NEED TO ERROR HANDLE
    //This will be controlled by a 'capture length' control
    scope->buf_size = 44100; //To later by dynamically controlled by capture length control
    scope->sample_buf_l = (float*)malloc(sizeof(float) * scope->buf_size);
    scope->sample_buf_r = (float*)malloc(sizeof(float) * scope->buf_size);
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
