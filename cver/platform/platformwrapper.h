#ifndef PLATFORMWRAPPER_H
#define PLATFORMWRAPPER_H

#ifdef __cplusplus
extern "C" {
#endif

#define SAMPLE_RATE 44100.0

struct MouseCallback_struct;
struct ResizeCallback_struct;

#include <inttypes.h>
#include "audiohandler.h"
#include "../wslib/object.h"
#include "../wslib/context.h"
#include <time.h>

#ifndef PLATFORM_HAIKU
#define RGB(r, g, b) ((0xFF000000) | (r & 0xFF) | ((g & 0xFF) << 8) | ((b & 0xFF) << 16))
#define RVAL(x) (x & 0xFF)
#define GVAL(x) ((x & 0xFF00) >> 8)
#define BVAL(x) ((x & 0xFF0000) >> 16)
#else
#define RGB(r, g, b) ((0xFF << 24) | ((b & 0xFF) << 16) | ((g & 0xFF) << 8) | (r & 0xFF))
#define BVAL(x) ((x & 0xFF0000) >> 16)
#define GVAL(x) ((x & 0xFF00) >> 8)
#define RVAL(x) (x & 0xFF)
#endif

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
struct Context_struct* PlatformWrapper_get_context();
void PlatformWrapper_install_mouse_callback(Object* param_object, MouseCallback_handler callback);
void PlatformWrapper_install_resize_callback(Object* param_object, ResizeCallback_handler callback);
float PlatformWrapper_random();
void PlatformWrapper_save_file(uint8_t* file_buffer, int file_size, char* file_name, char* mime);

#ifdef __cplusplus
}
#endif

#endif //PLATFORMWRAPPER_H
