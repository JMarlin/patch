#include "capture.h"
#include <stdio.h>

void Capture_paint_handler(Window* capture_window) {

    Capture* capture = (Capture*)capture_window;
    
    Frame_paint_handler(capture_window);
}

Module* Capture_new() {

    return Module_new(Capture_constructor, Capture_deserializer, "Capture");
}

void Capture_start_click_handler(Window* button_window, int x, int y) {

    Capture* capture = (Capture*)button_window->parent;

    capture->capture_pointer = 0;
}

int Capture_render_sample_handler(IO* io, float* l_sample, float* r_sample, float* g_sample) {

    Capture* capture = (Capture*)io->param_object;

    if(!capture->input->connected_io || capture->capture_pointer < 0 || capture->capture_pointer > (capture->buf_size - 1))
        return 1;

    IO_pull_sample(capture->input->connected_io, l_sample, r_sample, g_sample);
    capture->sample_buf_l[capture->capture_pointer] = *l_sample;
    capture->sample_buf_r[capture->capture_pointer] = *r_sample;
    capture->capture_pointer++;

    if(capture->capture_pointer == capture->buf_size) {

        capture->capture_pointer = -1;
        PatchCore_save_buffers_as_wav(capture->unit.patch_core, capture->sample_buf_l, capture->sample_buf_r, capture->buf_size);
    }

    return 1;
}

Unit* Capture_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core) {

    return (Unit*)0;
}

Unit* Capture_constructor(PatchCore* patch_core, Module* module) {

    Capture* capture;

    capture = (Capture*)malloc(sizeof(Capture));

    if(!capture)
        return (Unit*)0;

    Unit_init((Unit*)capture, patch_core, module);
    Window_resize((Window*)capture, 124, 54);

    //Allocate the sample buffers
    //NEED TO ERROR HANDLE
    //This will be controlled by a 'capture length' control
    capture->buf_size = 44100; //To later by dynamically controlled by capture length control
    capture->sample_buf_l = (float*)malloc(sizeof(float) * capture->buf_size);
    capture->sample_buf_r = (float*)malloc(sizeof(float) * capture->buf_size);
    capture->capture_pointer = -1;

    //Create a basic button to trigger sample capture
    capture->start_button = Button_new(11, 11, 100, 30);
    Window_set_title((Window*)capture->start_button, "Capture");
    Window_insert_child((Window*)capture, (Window*)capture->start_button);
    capture->start_button->window.mouseclick_function = Capture_start_click_handler;

    //Create an input for the signal to be tested
    capture->input = Unit_create_input((Unit*)capture, 7, 26);

    //Create a virtual/hidden output to hook sample render events
    capture->output = IO_new(patch_core, (Object*)capture, 121, 26, 1);
    capture->output->pull_sample_function = Capture_render_sample_handler;

    capture->unit.frame.window.paint_function = Capture_paint_handler;

    return (Unit*)capture;
}
