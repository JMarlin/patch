#ifndef PLATFORMWRAPPER_H
#define PLATFORMWRAPPER_H

#define SAMPLE_RATE 48000.0 //44100.0

struct MouseCallback_struct;
struct ResizeCallback_struct;

#include <inttypes.h>
#include "audiohandler.h"
#include "../wslib/object.h"
#include "../wslib/context.h"
#include <time.h>

typedef void (*MouseCallback_handler)(Object* param_object, uint16_t mouse_x, uint16_t mouse_y, uint8_t buttons);
typedef void (*ResizeCallback_handler)(Object* param_object, int w, int h);

typedef struct MouseCallback_struct {
    Object* param_object;
    MouseCallback_handler callback; 
} MouseCallback;

typedef struct ResizeCallback_struct {
    Object* param_object;
    ResizeCallback_handler callback; 
} ResizeCallback;

void PlatformWrapper_init();
void PlatformWrapper_hold_for_exit();
void PlatformWrapper_install_audio_handler(AudioHandler* audio_handler);
int PlatformWrapper_is_mouse_shown();
Context* PlatformWrapper_get_context();
void PlatformWrapper_install_mouse_callback(Object* param_object, MouseCallback_handler callback);
void PlatformWrapper_install_resize_callback(Object* param_object, ResizeCallback_handler callback);
float PlatformWrapper_random();

#endif //PLATFORMWRAPPER_H