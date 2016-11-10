#include "platformwrapper.h"
#include <stdlib.h>
#include <time.h>
#include "../wslib/list.h"

MouseCallback mouse_handler;
ResizeCallback resize_handler;
Context* internal_context;
double left_sum, right_sum;
List* ah_list;

void doPullSample() {

    int i;
    double l, r;
    AudioHandler* ah;

    //Clear sample accumulators

    for(i = 0; i < ah_list->count; i++) {

        ah = (AudioHandler*)List_get_at(ah_list, i);
        ah->function(ah->parent_object, &l, &r);

        //Add to sample accumulators
    }
}

void PlatformWrapper_init() {

    ah_list = List_new();
    internal_context = (Context*)0;
    mouse_handler.param_object = (Object*)0;
    mouse_handler.callback = (MouseCallback_handler)0;
    resize_handler.param_object = (Object*)0;
    resize_handler.callback = (ResizeCallback_handler)0;

    //Set up the audio processing loop and other junk
}

void PlatformWrapper_hold_for_exit() {

    while(1); //Change this to use a run state variable
}

void PlatformWrapper_install_audio_handler(AudioHandler* audio_handler) {

    List_add(ah_list, (Object*)audio_handler);
}

int PlatformWrapper_is_mouse_shown() {

    //Haiku just uses the OS mouse
    return 0;
}

Context* PlatformWrapper_get_context() {

    //Init the display
    //Declare our return variable
    int i;
    uint32_t *return_buffer = (uint32_t*)0;

    //Clear the dimensions until we've gotten past any potential errors
    uint16_t width = 10;
    uint16_t height = 10;

    //Attempt to create the framebuffer array 
    if(!(return_buffer = (uint32_t*)malloc(sizeof(uint32_t) * width * height)))
        return (Context*)0; //Exit early indicating error with an empty pointer 

    //Clear the framebuffer to black
    for(i = 0; i < width * height; i++)
        return_buffer[i] = 0xFF000000; //The canvas *does* care about the opacity being set, which is annoying
    
    //Install screen refresh thread here

    internal_context = Context_new(width, height, return_buffer);

    return internal_context;
}

void doMouseCallback(void) {

    uint16_t mouse_x, mouse_y;
    uint8_t buttons;

    if(!mouse_handler.callback)
        return;

    //A mouse event has happened, so get the updated info 
    //Load mouse info into above variables

    //Fire callback
    mouse_handler.callback(mouse_handler.param_object, mouse_x, mouse_y, buttons);
}

void PlatformWrapper_install_mouse_callback(Object* param_object, MouseCallback_handler callback) {

    mouse_handler.param_object = param_object;
    mouse_handler.callback = callback;
}

void doResizeCallback() {

    uint16_t width, height;
    
    width = 0;
    height = 0;

    resize_handler.callback(resize_handler.param_object, width, height);
}

void PlatformWrapper_install_resize_callback(Object* param_object, ResizeCallback_handler callback) {
	
    resize_handler.param_object = param_object;
    resize_handler.callback = callback;
}

double PlatformWrapper_random() {

    time_t t;
    time(&t);
    srand((unsigned)t);

    return (double)rand()/(double)RAND_MAX;
}
