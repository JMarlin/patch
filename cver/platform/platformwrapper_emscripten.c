#include "platformwrapper.h"
#include <emscripten.h>
#include <stdlib.h>

MouseCallback mouse_handler;
ResizeCallback resize_handler;
Context* internal_context;

void PlatformWrapper_init() {

    internal_context = (Context*)0;
    mouse_handler.param_object = (Object*)0;
    mouse_handler.callback = (MouseCallback_handler)0;
    resize_handler.param_object = (Object*)0;
    resize_handler.callback = (ResizeCallback_handler)0;
}

void PlatformWrapper_hold_for_exit() {

    return; //Emscripten doesn't like hang loops
}

void PlatformWrapper_install_audio_handler(AudioHandler* audio_handler) {

    //Todo
}

int PlatformWrapper_is_mouse_shown() {

    //Emscripten just uses the OS mouse
    return 0;
}

Context* PlatformWrapper_get_context() {

    //Init the display
    //Declare our return variable
    uint32_t *return_buffer = (uint32_t*)0;

    //Clear the dimensions until we've gotten past any potential errors
    uint16_t width = EM_ASM_INT({return window.innerWidth},0);
    uint16_t height = EM_ASM_INT({return window.innerHeight},0);

    //Attempt to create the framebuffer array 
    if(!(return_buffer = (uint32_t*)malloc(sizeof(uint32_t) * width * height)))
        return (Context*)0; //Exit early indicating error with an empty pointer 

    //Clear the framebuffer to black
    int i;
    for(i = 0; i < width * height; i++)
        return_buffer[i] = 0xFF000000; //The canvas *does* care about the opacity being set, which is annoying
    
    //Now we'll create the output canvas and insert it into the document
    //(EM_ASM allows us to embed JS into our C)
    //We will also se up the refresh timer here
    EM_ASM_({
        
        //Create and store canvas and information
        window.fo_canvas = document.createElement('canvas');
        document.body.style.margin = '0px';
        window.fo_canvas.style.cursor = 'none';
        window.fo_canvas.width = $0;
        window.fo_canvas.height = $1;
        window.fo_buf_address = $2;
        window.fo_buf_size = 4 * $0 * $1;
        document.body.appendChild(window.fo_canvas);
        window.fo_context = window.fo_canvas.getContext('2d');
        window.fo_canvas_data = window.fo_context.getImageData(0, 0, $0, $1);

        //Start refresh handler
        setInterval(function() {

            //Create an unsigned byte subarray  
            window.fo_canvas_data.data.set(
                Module.HEAPU8.subarray(
                    window.fo_buf_address, window.fo_buf_address + window.fo_buf_size
                )
            ); 
            window.fo_context.putImageData(window.fo_canvas_data, 0, 0);
        }, 17);
    }, width, height, return_buffer);

    internal_context = Context_new(width, height, return_buffer);

    return internal_context;
}

void EMSCRIPTEN_KEEPALIVE doMouseCallback(void) {

    uint16_t mouse_x, mouse_y;
    uint8_t buttons;

    if(!mouse_handler.callback)
        return;

    //A mouse event has happened, so get the updated info 
    mouse_x = EM_ASM_INT({
        return window.fo_mouse_x;
    }, 0);

    mouse_y = EM_ASM_INT({
        return window.fo_mouse_y;
    }, 0);

    buttons = EM_ASM_INT({
        return window.fo_button_status;
    }, 0);

    //Fire callback
    mouse_handler.callback(mouse_handler.param_object, mouse_x, mouse_y, buttons);
}

void PlatformWrapper_install_mouse_callback(Object* param_object, MouseCallback_handler callback) {

    //This is literally just here so that the function 
    //doesn't get optimized out
    doMouseCallback();

    EM_ASM(

        //Attach status update function to the screen canvas
        window.fo_button_status = 0;
        window.fo_mouse_x = 0;
        window.fo_mouse_y = 0;
        window.fo_canvas.onmousemove = function(e) {
            
            window.fo_mouse_x = e.clientX;
            window.fo_mouse_y = e.clientY;
            Module.ccall('doMouseCallback');
        };
        window.fo_canvas.onmousedown = function(e) {

            window.fo_button_status = 1;
            Module.ccall('doMouseCallback');
        };
        window.fo_canvas.onmouseup = function(e) {

            window.fo_button_status = 0;
            Module.ccall('doMouseCallback');
        };
    );

    mouse_handler.param_object = param_object;
    mouse_handler.callback = callback;
}
void PlatformWrapper_install_resize_callback(Object* param_object, ResizeCallback_handler callback) {

    //Todo
}