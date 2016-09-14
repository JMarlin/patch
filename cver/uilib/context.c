#include "context.h"
#include <stdlib.h>

Context* Context_new(PlatformWrapper* platform_wrapper) {

    Context* context; 
    if(!(context = (Context*)malloc(sizeof(Context))))
        return context; 

    if(!(context->clipping_rects = (List*)malloc(sizeof(List)))) {

        free(context);
        return (Context*)0;
    }

    context->platform_wrapper = platform_wrapper
    context->translate_x = 0;
    context->translate_y = 0;
    context->apply_clipping = (ContextApplyClippingHandler)0;
    context->clear_clipping = (ContextClearClippingHandler)0;
    context->fill_rect = (ContextFillRectHandler)0;
    context->draw_rect = (ContextDrawRectHandler)0;
    context->draw_line = (ContextDrawLineHandler)0;

    return context;
}

void Context_delete(void* context_void) {

    Context* context = (Context*)context_void;

    List_delete((void*)context->clipping_rects, Rect_delete);
    free(context);
}

int Context_add_clipping_rect(Context* context, Rect* rect) {

    Context_subtract_clipping_rect(context, rect);
    return List_add(context->clip_rects, rect);
}

int Context_intersect_clipping_rect(Context* context, Rect* rect) {

    int i;
    List* output_rects;
    Rect* current_rect;
    Rect* intersect_rect;
 
    if(!(output_rects = (List*)malloc(sizeof(List))))
        return 0;

    for(i = 0; i < context->clipping_rects->count; i++) {

        current_rect = (Rect*)List_get_at(context->clipping_rects, i);
        intersect_rect = Rect_intersect(current_rect, rect);

        if(intersect_rect)
            List_add(output_rects, rect);
    }

    List_delete((void*)context->clipping_rects, Rect_delete);
    context->clipping_rects = output_rects;
}

int Context_subtract_clipping_rect(Context* context, Rect* rect) {

    int i, j;
    Rect* cur_rect;
    List* split_rects;

    for(i = 0; i < context->clipping_rects->count; ) {

        cur_rect = List_get_at(context->clipping_rects, i);

        if(!(cur_rect->left <= subtracted_rect->right &&
		   cur_rect->right >= subtracted_rect->left &&
		   cur_rect->top <= subtracted_rect->bottom &&
		   cur_rect->bottom >= subtracted_rect->top)) {

            i++;
            continue;
        }

        List_remove_at(context->clipping_rects, i); 
        split_rects = Rect_split(cur_rect, subtracted_rect); 
        free(cur_rect); 

        while(split_rects->count) {

            cur_rect = (Rect*)List_remove_at(split_rects, 0);
            List_add(context->clipping_rects, cur_rect);
        }

        List_delete(split_rects, 0);
        i = 0;    
    }
}

void Context_set_window_clipping(Context* context, Window* window, int ignore_children) {

    int i;
    Window* temp_window;
    List* overlap_widgets;
    Rect* temp_rect;
    Rect* window_rect;

    if(!window->parent)
        return;

    if(!(window_rect = Rect_new(window->y, window->x,
                                window->y + window->height - 1,
                                window->x + window->width - 1)))
        return;

    if(window->parent->context) {

        Context_set_window_clipping(context, window->parent, 1);
        Context_intersect_clipping_rect(context, window_rect);
        Rect_delete((void*)window_rect);
    } else {

        Context_add_clipping_rect(context, window_rect);
    }

    if(target_widget->children && (!ignore_children)) {

        for(i = 0; i < window->children->count; i++) {

            temp_window = (Window*)List_get_at(window->children, i);

            if(!(temp_window->flags & WIN_VISIBLE))
            continue;

            //Need to let this fail if malloc fails
            temp_rect = Rect_new(temp_window->y, temp_window->x,
                                 temp_window->y + temp_window->height - 1,
                                 temp_window->x + temp_window->width - 1)
            Context_subtract_clipping_rect(context, temp_rect);
            Rect_delete((void*)temp_rect);
        }
    }

    //Need to check for fail here as well
    overlap_widgets = Window_children_above(window->parent, window);

    for(i = 0; i < overlap_widgets->count; i++) {
 
        temp_window = (Window*)List_get_at(overlap_widgets, i); 
   
        if(!(temp_window->flags & WIN_VISIBLE))
            continue;

        //Need to let this fail if malloc fails
        temp_rect = Rect_new(temp_window->y, temp_window->x,
                                temp_window->y + temp_window->height - 1,
                                temp_window->x + temp_window->width - 1)
        Context_subtract_clipping_rect(context, temp_rect);
        Rect_delete((void*)temp_rect);
    }

    List_delete(overlap_widgets, 0);
}

void Context_apply_clipping(Context* context) {

    context->apply_clipping(context);
}

void Context_clear_clipping(Context* context) {

    Rect* cur_rect;

    context->clear_clipping(context);

    while(context->clipping_rects->count) {

        cur_rect = (Rect*)List_remove_at(context->clipping_rects, 0);
        free(cur_rect);
    }
}

void Context_fill_rect(Context* context, int x, int y,
                       int width, int height, uint32_t color) {

    PlatformWrapper_fill_rect(context->platform, x, y, width, height, color);
}

void Context_draw_rect(Context* context, int x, int y, 
                       int width, int height, uint32_t color) {

    PlatformWrapper_draw_rect(context->platform, x, y, width, height, color);
}

void Context_draw_line(Context* context, int x1, int y1, 
                       int x2, int y2, uint32_t color) {

    PlatformWrapper_draw_line(context->platform, x1, y1, x2, y2, color);
}

void Context_draw_string(char* text, int x, int y, uint32_t color) {

    PlatformWrapper_draw_string(context->platform, text, x, y, color);
}
