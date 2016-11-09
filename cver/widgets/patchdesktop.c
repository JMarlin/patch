#include "patchdesktop.h"

PatchDesktop* PatchDesktop_new(PatchCore* patch_core) {

    PatchDesktop* patch_desktop = (PatchDesktop*)malloc(sizeof(PatchDesktop));
    
    if(!patch_desktop)
        return patch_desktop;

    if(!(patch_desktop->base_context = PlatformWrapper_get_context())) {

        Object_delete((Object*)patch_desktop);
        return (PatchDesktop*)0;
    }

    if(!Desktop_init((Desktop*)patch_desktop, patch_desktop->base_context)) {
    
        Object_delete((Object*)patch_desktop->base_context);
        Object_delete((Object*)patch_desktop);
        return (PatchDesktop*)0;
    }

    Object_init((Object*)patch_desktop, PatchDesktop_delete_function);

    patch_desktop->patch_core = patch_core;
    patch_desktop->desktop.window.mouseclick_function = PatchDesktop_mouseclick_handler;
    patch_desktop->desktop.window.mousemove_function = PatchDesktop_mousemove_handler;
    patch_desktop->desktop.window.paint_function = PatchDesktop_paint_handler;
    patch_desktop->desktop.mouse_shown = PlatformWrapper_is_mouse_shown();
    patch_desktop->start_io = (IO*)0;
    patch_desktop->menu = (SessionMenu*)0;

    return patch_desktop;
}

void PatchDesktop_mouseclick_handler(Window* patch_desktop_window, int x, int y) {

    PatchDesktop* patch_desktop = (PatchDesktop*)patch_desktop_window;

    patch_desktop->start_io = (IO*)0;

    if(patch_desktop->menu) {

        Object_delete((Object*)patch_desktop->menu);
        patch_desktop->menu = (SessionMenu*)0;
    } else {

        patch_desktop->menu = SessionMenu_new(patch_desktop->patch_core, x, y);
        Window_insert_child((Window*)patch_desktop, (Window*)patch_desktop->menu);
    }
}

void draw_elbow(Context* context, int x1, int y1, int x2, int y2, uint32_t color) {

    int hlen = x2 - x1;
    int temp, vlen;

    if(hlen < 0) {

        temp = x1;
        x1 = x2;
        x2 = temp;
        temp = y1;
        y1 = y2;
        y2 = temp;
        hlen = -hlen;
    }

    Context_horizontal_line(context, x1, y1, hlen/2, RGB(0, 0, 0));
    Context_horizontal_line(context, x1 + (hlen/2), y2, hlen/2, RGB(0, 0, 0));

    vlen = y2 - y1;

    if(vlen < 0) {

        y1 = y2;
        vlen = -vlen;
    }

    Context_vertical_line(context, x1 + (hlen/2), y1, vlen, RGB(0, 0, 0));
}

void PatchDesktop_paint_handler(Window* patch_desktop_window) {

    int i;
    IO* input;
    PatchDesktop* patch_desktop = (PatchDesktop*)patch_desktop_window;

    Context_fill_rect(patch_desktop_window->context, 0, 0, patch_desktop_window->width,
                      patch_desktop_window->height, RGB(90, 95, 210));

    //Need an int to string function here (steal from calc)
    Context_draw_text(patch_desktop_window->context, "PATCH Build Number ?",
                      5, patch_desktop_window->height - 18, RGB(255, 255, 255));

    if(patch_desktop->start_io) {

        //TODO: really should implement clipped bresenham
        draw_elbow(patch_desktop_window->context, Window_screen_x((Window*)patch_desktop->start_io) + 3,
                   Window_screen_y((Window*)patch_desktop->start_io) + 3, patch_desktop->wire_x, 
                   patch_desktop->wire_y, RGB(200, 0, 0));
    }

    for(i = 0; i < patch_desktop->patch_core->inputs->count; i++) {

        input = (IO*)List_get_at(patch_desktop->patch_core->inputs, i);

        if(input->connected_io) {

            draw_elbow(patch_desktop_window->context, Window_screen_x((Window*)input) + 3,
                   Window_screen_y((Window*)input) + 3, Window_screen_x((Window*)input->connected_io), 
                   Window_screen_y((Window*)input->connected_io), RGB(0, 200, 0));
        }
    }
}

void PatchDesktop_connect_action(PatchDesktop* patch_desktop, IO* io) {

    if(patch_desktop->start_io)
        PatchDesktop_finish_connection(patch_desktop, io);
    else
        PatchDesktop_begin_connection(patch_desktop, io);
}

void PatchDesktop_begin_connection(PatchDesktop* patch_desktop, IO* io) {

    patch_desktop->start_io = io;
}

void PatchDesktop_finish_connection(PatchDesktop* patch_desktop, IO* io) {

    if(patch_desktop->start_io) {

        //Guard against input-to-input and output-to-output
        if((!!patch_desktop->start_io->is_output) == (!!io->is_output))
            return;

        IO_connect(patch_desktop->start_io, io);
        IO_connect(io, patch_desktop->start_io);
        patch_desktop->start_io = (IO*)0;
        Window_invalidate((Window*)patch_desktop, 0, 0, patch_desktop->desktop.window.width - 1,
                          patch_desktop->desktop.window.height - 1);
    }
}

void PatchDesktop_end_connection(PatchDesktop* patch_desktop) {

    patch_desktop->start_io = (IO*)0;
}

void PatchDesktop_mousemove_handler(Window* patch_desktop_window, int x, int y) {

    PatchDesktop* patch_desktop = (PatchDesktop*)patch_desktop_window;

    if(!patch_desktop->start_io)
        return;

    patch_desktop->wire_x = x;
    patch_desktop->wire_y = y;
    Window_invalidate((Window*)patch_desktop, 0, 0, patch_desktop->desktop.window.width - 1,
                      patch_desktop->desktop.window.height - 1);
}

void PatchDesktop_delete_function(Object* patch_desktop_object) {

    PatchDesktop* patch_desktop = (PatchDesktop*)patch_desktop_object;

    if(!patch_desktop_object)
        return;

    Object_delete((Object*)patch_desktop->menu);
    Window_delete_function(patch_desktop_object);
}