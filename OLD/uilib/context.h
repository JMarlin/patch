#ifndef CONTEXT_H
#define CONTEXT_H

#include "../util/rect.h"
#include "../util/list.h"
#include "../platform/platformwrapper.h"
#include <inttypes.h>

#define RGB(r, g, b) ((((uint32_t)(r)) << 24) | (((uint32_t)(g)) << 16) | (((uint32_t)(b)) << 8))  
#define RED(c) ((uint8_t)(((c) >> 24) & 0xFF))
#define GREEN(c) ((uint8_t)(((c) >> 16) & 0xFF))
#define BLUE(c) ((uint8_t)(((c) >> 8) & 0xFF))

typedef struct Context_struct {
    List* clipping_rects;
    int translate_x;
    int translate_y;
    PlatformWrapper* platform_wrapper;
} Context;

Context* Context_new(PlatformWrapper* platform_wrapper);
void Context_delete(void* context_void);
int Context_add_clipping_rect(Context* context, Rect* rect);
int Context_intersect_clipping_rect(Context* context, Rect* rect);
int Context_subtract_clipping_rect(Context* context, Rect* rect);
void Context_set_window_clipping(Context* context, Window* window);
void Context_apply_clipping(Context* context);
void Context_clear_clipping(Context* context);
void Context_fill_rect(Context* context, int x, int y,
                       int width, int height, uint32_t color);
void Context_draw_rect(Context* context, int x, int y, 
                       int width, int height, uint32_t color);
void Context_draw_line(Context* context, int x1, int y1, 
                       int x2, int y2, uint32_t color);
void Context_draw_string(char* text, int x, int y, uint32_t color);

#endif //CONTEXT_H