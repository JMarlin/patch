#ifndef CONTEXT_H
#define CONTEXT_H

#include "../util/rect.h"
#include "../util/list.h"
#include <inttypes.h>

struct Context_struct;

typedef void (*ContextApplyClippingHandler)(struct Context_struct*);
typedef void (*ContextClearClippingHandler)(struct Context_struct*);
typedef void (*ContextFillRectHandler)(struct Context_struct*,
                                       int, int, int, int, uint32_t);
typedef void (*ContextDrawRectHandler)(struct Context_struct*,
                                       int, int, int, int, uint32_t);
typedef void (*ContextDrawLineHandler)(struct Context_struct*, 
                                       int, int, int, int, uint32_t);

typedef struct Context_struct {
    List* clipping_rects;
    int translate_x;
    int translate_y;
    ContextApplyClippingHandler apply_clipping;
    ContextClearClippingHander clear_clipping;
    ContextFillRectHandler fill_rect;
    ContextDrawRectHandler draw_rect;
    ContextDrawLineHandler draw_line;
} Context;

Context* Context_new();
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

#endif //CONTEXT_H