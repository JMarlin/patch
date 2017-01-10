#include "platformwrapper.h"
#include <emscripten.h>
#include <stdlib.h>
#include <time.h>
#include "../wslib/list.h"

MouseCallback mouse_handler;
ResizeCallback resize_handler;
Context* internal_context;
float left_sum, right_sum;
List* ah_list;

void EMSCRIPTEN_KEEPALIVE doPullSample() {

    int i;
    float l, r;
    AudioHandler* ah;

    EM_ASM(
        window.fo_sample[0] = window.fo_sample[1] = 0;
    );

    for(i = 0; i < ah_list->count; i++) {

        ah = (AudioHandler*)List_get_at(ah_list, i);
        ah->function(ah->parent_object, &l, &r);

        EM_ASM_({
            window.fo_sample[0] += $0;
            window.fo_sample[1] += $1;
        }, l, r);
    }
}

void PlatformWrapper_init() {

    ah_list = List_new();
    internal_context = (Context*)0;
    mouse_handler.param_object = (Object*)0;
    mouse_handler.callback = (MouseCallback_handler)0;
    resize_handler.param_object = (Object*)0;
    resize_handler.callback = (ResizeCallback_handler)0;

    //Set up the audio processing loop
    EM_ASM(

        window.fo_sample = [0, 0];

        var audioCtx  = new (window.AudioContext || window.webkitAudioContext)(),
            pcm_node  = audioCtx.createScriptProcessor(4096, 0, 2),
            source    = audioCtx.createBufferSource();

        pcm_node.onaudioprocess = function(e) {

            var outbuf_l = e.outputBuffer.getChannelData(0),
                outbuf_r = e.outputBuffer.getChannelData(1);
    
            for(var i = 0; i < 4096; i++) {
                
                Module.ccall('doPullSample');
                outbuf_r[i] = window.fo_sample[1];
                outbuf_l[i] = window.fo_sample[0];
            }

            if(window.dbg_on)
                    debugger;
        };

        source.connect(pcm_node);
        pcm_node.connect(audioCtx.destination);
        source.start();
    );
}

void PlatformWrapper_hold_for_exit() {

    return; //Emscripten doesn't like hang loops
}

void PlatformWrapper_install_audio_handler(AudioHandler* audio_handler) {

    List_add(ah_list, (Object*)audio_handler);
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
        window.fo_canvas.width = $0;
        window.fo_canvas.height = $1;
        window.fo_buf_address = $2;
        window.fo_buf_size = 4 * $0 * $1;
        document.body.appendChild(window.fo_canvas);
        window.fo_context = window.fo_canvas.getContext('2d');
        window.fo_canvas_data = window.fo_context.getImageData(0, 0, $0, $1);
        window.fo_draw = true;

        //Start refresh handler
        setInterval(function() {

            if(!window.fo_draw)
                return;

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

void EMSCRIPTEN_KEEPALIVE doResizeCallback() {

    uint16_t width = EM_ASM_INT({return window.innerWidth},0);
    uint16_t height = EM_ASM_INT({return window.innerHeight},0);

    free(internal_context->buffer);
    internal_context->buffer = (uint32_t*)malloc(sizeof(uint32_t) * width * height);
    internal_context->width = width;
    internal_context->height = height;

    EM_ASM_({
        window.fo_buf_address = $0;
        window.fo_buf_size = 4 * window.fo_canvas.width * window.fo_canvas.height;
        window.fo_canvas_data = window.fo_context.getImageData(0, 0, window.fo_canvas.width, window.fo_canvas.height);
        window.fo_draw = true;
    }, internal_context->buffer);

    resize_handler.callback(resize_handler.param_object, width, height);
}

void PlatformWrapper_install_resize_callback(Object* param_object, ResizeCallback_handler callback) {

    EM_ASM(
    
        window.onresize = function() {

            window.fo_draw = false;
            window.fo_canvas.width = window.innerWidth;
            window.fo_canvas.height = window.innerHeight;
            Module.ccall('doResizeCallback');
        };
    );

    resize_handler.param_object = param_object;
    resize_handler.callback = callback;
}

float PlatformWrapper_random() {

    return EM_ASM_DOUBLE({ return Math.random(); }, 0);
}
