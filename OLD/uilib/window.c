#include "window.h"
#include <stdlib.h>

Window* Window_new(int x, int y, int width, int height) {

    Window* window;
    if(!(window = (Window*)malloc(sizeof(Window))))
        return window;

    if(!Window_init(window, x, y, width, height)) {

        free(window);
        return (Window*)0;
    }
    
    return window;
}

int Window_init(Window* window, int x, int y, int width, int height) {

    //Init basic props
    window->x = x; 
    window->y = y; 
    window->width = width; 
    window->height = height; 
    window->flags = WIN_NODRAG | WIN_VISIBLE;
    window->parent = (Window*)0;
    window->drag_child = (Window*)0;
    window->mouse_in_child = (Window*)0;
    window->drag_off_x = 0;
    window->drag_off_y = 0;

    //Init default handlers
    window->event_handler = Window_event_handler;
    window->ongfxresize = Window_ongfxresize;
    window->move = Window_move;
    window->delete = Window_delete;
    window->paint = (WindowPaintHandler)0;
    window->onmousemove = (WindowMouseMoveHandler)0;
    window->onmousedown = (WindowMouseDownHandler)0;
    window->onmouseup = (WindowMouseUpHandler)0;
    window->onmouseout = (WindowMouseOutHandler)0;
    window->onmouseover = (WindowMouseOverHandler)0;

    //Attempt to initialize the child list
    if(!(window->children = List_new()))
        return 0;

    return 1;    
}

void Window_event_handler(Window* window, InputEvent* input_event) {

    int i;
    Window* child;
    int old_x;
    int old_y;

    if(input_event->type != EVENT_MOUSE)
        return;

    if(input_event->info.mouse.action == MOUSE_ACT_UP) {

        window->drag_child = (Window*)0;

        for(i = 0; i < window->children->count; i++) {

            child = (Window*)List_get_at(window->children, i);

            old_x = input_event->info.mouse.x; 
            old_y = input_event->info.mouse.y; 
            input_event->info.mouse.x = old_x - child->x;
            input_event->info.mouse.y = old_y - child->y;
            child->event_handler(child, input_event);
            input_event->info.mouse.x = old_x;
            input_event->info.mouse.y = old_y;
        }

        return;
    }

    for(i = window->children->count - 1; i > -1; i--) {

        child = (Window*)List_get_at(window->children, i);
        
        if(input_event->info.mouse.x >= child->x &&
           input_event->info.mouse.x < child->x + child->width &&
           input_event->info.mouse.y >= child->y &&
           input_event->info.mouse.y < child->y + child->height) {

            if(input_event->info.mouse.action == MOUSE_ACT_MOVE) {

                if(window->mouse_in_child != child) {

                    if(window->mouse_in_child && window->mouse_in_child->onmouseout)
                        window->mouse_in_child->onmouseout(window->mouse_in_child);

                    window->mouse_in_child = child; 

                    if(window->mouse_in_child->onmouseover)
                        window->mouse_in_child->onmouseover(window->mouse_in_child);
                }
            }

            if(input_event->info.mouse.action == MOUSE_ACT_DOWN) {

                if((Window*)List_get_at(window->children, window->children->count - 1) != child &&
                   !(child->flags & WIN_NORAISE)) {

                    List_remove_at(window->children, i);
                    List_add(window->children, child);
                    Window_paint_child(window, child);
                }

                if(!(child->flags & WIN_NODRAG)) {

                    window->drag_off_x = input_event->info.mouse.x - child->x;
                    window->drag_off_y = input_event->info.mouse.y - child->y;
                    window->drag_child = child;
                }
            }

            old_x = input_event->info.mouse.x; 
            old_y = input_event->info.mouse.y; 
            input_event->info.mouse.x = old_x - child->x;
            input_event->info.mouse.y = old_y - child->y;
            child->event_handler(child, input_event);
            input_event->info.mouse.x = old_x;
            input_event->info.mouse.y = old_y;

            break;
        }    
    }

    if(input_event->info.mouse.action == MOUSE_ACT_MOVE && window->drag_child != (Window*)0 &&
       !Window_has_dragged_children(window)) 
        window->drag_child->move(window->drag_child,
                                 input_event->info.mouse.x - window->drag_off_x,
                                 input_event->info.mouse.y - window->drag_off_y);

    if(i == -1) {

        if(input_event->info.mouse.action == MOUSE_ACT_MOVE)
            if(window->onmousemove)
                window->onmousemove(window, input_event->info.mouse.x, input_event->info.mouse.y);

        if(input_event->info.mouse.action == MOUSE_ACT_UP)
            if(window->onmouseup)
                window->onmouseup(window, input_event->info.mouse.x, input_event->info.mouse.y);

        if(input_event->info.mouse.action == MOUSE_ACT_DOWN)
            if(window->onmousedown)
                window->onmousedown(window, input_event->info.mouse.x, input_event->info.mouse.y);
    }                                 
}

void Window_ongfxresize(Window* window, int w, int h) {

    int i; 
    Window* child;

    for(i = 0; i < window->children->count; i++) {

        child = (Window*)List_get_at(window->children, i);

        Window_invalidate(child);
    }

    Window_invalidate(window);
}

int Window_has_dragged_children(Window* window) {

    int i; 
    Window* child; 

    for(i = 0; i < window->children->count; i++) {

        child = (Window*)List_get_at(window->children, i);

        if(child->drag_child != (Window*)0 || Window_has_dragged_children(child))
            return 1;
    }

    return 0;
}

int Window_screen_x(Window* window) {

    if(window->parent != (Window*)0)
        return window->x + Window_screen_x(window->parent);
    else
        return window->x;
}

int Window_screen_y(Window* window) {

    if(window->parent != (Window*)0)
        return window->y + Window_screen_y(window->parent);
    else
        return window->y;
}

List* Window_children_below(Window* window, Window* child) {

    List* return_group;
    Window* target_widget;
    int i = 0;

    if(!(return_group = List_new()))
        return return_group;

    for(i = window->children->count - 1; i > -1; i--)
        if((Window*)List_get_at(window->children, i) == child)
            break;
    
    for(; i > -1; i--) {

        target_widget = (Window*)List_get_at(window->children, i);

        if(child->x <= (target_widget->x + target_widget->width) &&
           (child->x + child->width) >= target_widget->x &&
           child->y <= (target_widget->y + target_widget->height) &&
           (child->y + child->height) >= target_widget->y) 
            List_add(return_group, target_widget);
    }

    return return_group;
}

List* Window_children_above(Window* window, Window* child) {

    List* return_group;
    Window* target_widget;
    int i = 0;

    if(!(return_group = List_new()))
        return return_group;

    for(i = window->children->count - 1; i > -1; i--)
        if((Window*)List_get_at(window->children, i) == child)
            break;
    
    for(i++; i < window->children->count; i++) {

        target_widget = (Window*)List_get_at(window->children, i);

        if(child->x <= (target_widget->x + target_widget->width) &&
           (child->x + child->width) >= target_widget->x &&
           child->y <= (target_widget->y + target_widget->height) &&
           (child->y + child->height) >= target_widget->y) 
            List_add(return_group, target_widget);
    }

    return return_group;
}

void Window_invalidate_children(Window* window) {

    int i; 
    Window* child;

    for(i = 0; i < window->children->count; i++) {

        child = (Window*)List_get_at(window->children, i);
        Window_invalidate(child);
        Window_invalidate_children(child);
    } 
}

void Window_move_child(Window* window, Window* child, int x, int y) {
 
    int i;
    Window* target;
    
    List* children_below;
    if(!(children_below = Window_children_below(window, child)))
        return;

    for(i = 0; i < children_below->count; i++) 
        Window_invalidate((Window*)List_get_at(children_below, i));
    
    child->x = x;
    child->y = y;
    Window_invalidate(child);
    Window_invalidate_children(child);
    Window_invalidate(window);

    List_delete(children_below, (DeleteMethod)0);
}

void Window_paint_child(Window* window, Window* child) {

    int old_x, old_y;

    if(child.paint == (WindowPaintHandler)0)
        return;

    if(!(child->flags & WIN_VISIBLE))
        return;

    Context_set_window_clipping(child->context, child, 1);
    old_x = child->context->translate_x;
    old_y = child->context->translate_y;
    child->context->translate_x = Window_screen_x(child);
    child->context->translate_y = Window_screen_y(child);
    
    child->paint(child);

    child->context->translate_x = old_x;
    child->context->translate_y = old_y;
    Context_clear_clip_rects(child->context);
}

void Window_invalidate_child(Window* window, Window* child) {

    Window_paint_child(window, child);
}

void Window_hide_child(Window* window, Window* child) {

    int i;
    Window* target;
    List* children_below;

    if(!(children_below = Window_children_below(window, child)))
        return;
 
    child->flags &= ~WIN_VISIBLE;

    for(i = 0; i < children_below->count; i++) {

        target = (Window*)List_get_at(children_below, i);
        Window_invalidate(target);
    }

    Window_invalidate(window);

    List_delete(children_below, (DeleteMethod)0);
}

void Window_destroy_child(Window* window, Window* child) {

    int i; 

    for(i = 0; i < window->children->count; i++)
        if((Window*)List_get_at(window->children, i) == child)
            break;
    
    if(i == window->children->count)
        return;

    List_remove_at(window->children, i);
    Window_hide(child);
    child->delete(child);
}

void Window_set_context(Window* window, Context* context) {
 
    int i;
    Window* child;

    window->context = context; 
    Window_invalidate(window);
 
    for(i = 0; i < window->children->count; i++)
        Window_set_context((Window*)List_get_at(window->children, i), context);
}

void Window_add_child(Window* window, Window* child) {

    List_add(window->children, child);
    child->parent = window;
    
    if(window->context == (Context*)0)
        return;

    Window_set_context(child, context);
}

void Window_invalidate(Window* window) {

    if(window->parent)
        Window_invalidate_child(window->parent, window);
}

void Window_destroy(Window* window) {

    if(window->parent)
        Window_destroy_child(window->parent, window);
}

void Window_hide(Window* window) {

    if(window->parent)
        Window_hide_child(window->parent, window);
}

void Window_move(Window* window, int x, int y) {

    if(window->parent)
        Window_move_child(window->parent, window, x, y);
}

void Window_delete(void* window_void) {

    int i;
    Window* child;
    Window* window = (Window*)window_void;

    for(i = 0; i < window->children->count; i++) {

        child = (Window*)List_remove_at(window->children, i);
        child->delete(child);
    }

    List_delete(window->children, (DeleteMethod)0);
    free(window);
}
