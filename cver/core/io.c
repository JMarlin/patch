#include "io.h"

//NOTE: IOs need to automatically disconnect from anything they might be
//      connected to upon deletion so that we don't get invalid pulls

int Output_initial_sample_pull_handler(IO* io, float *l_sample, float *r_sample, float *g_sample) {

    *l_sample = *r_sample = 0.0;
    *g_sample = -1.0;

    return 1;
}

int Input_sample_pull_handler(IO* io, float *l_sample, float *r_sample, float *g_sample) {

    if(io->connected_io)
        return IO_pull_sample(io->connected_io, l_sample, r_sample, g_sample);
    else
        *l_sample = *r_sample = 0.0;
    
    return 1;
}

IO* IO_new(PatchCore* patch_core, Object* param_object, int x, int y, int is_output) {

    IO* io = (IO*)malloc(sizeof(IO));
    
    if(!io)
        return io;

    if(!IO_init(io, patch_core, param_object, x, y, is_output)) {

        Object_delete((Object*)io);
        return (IO*)0;
    }

    if(!is_output)
        List_add(patch_core->inputs, (Object*)io);

    return io;
}

int IO_init(IO* io, PatchCore* patch_core, Object* param_object, int x, int y, int is_output) {

    if(!Window_init((Window*)io, x - 3, y - 3, 6, 6,
                    WIN_NODECORATION | WIN_NORAISE, (Context*)0)) 
        return 0;
    
    //Initial init
    io->window.paint_function = IO_paint_handler;
    io->window.mouseclick_function = IO_mouseclick_handler;
    io->patch_core = patch_core; 
    io->param_object= param_object;
    io->connected_io = (IO*)0;
    io->is_output = is_output;

    if(is_output)
        io->pull_sample_function = Output_initial_sample_pull_handler;
    else
        io->pull_sample_function = Input_sample_pull_handler;

    return 1;
}

void IO_paint_handler(Window* io_window) {

    IO* io = (IO*)io_window;

    Context_fill_rect(io_window->context, 2, 2, 2, 2,
                      io->connected_io ? RGB(0, 200, 0) : RGB(100, 100, 100));
    Context_draw_rect(io_window->context, 0, 0, 6, 6, RGB(0, 0, 0));
    Context_draw_rect(io_window->context, 1, 1, 4, 4, RGB(0, 0, 0));
}

void IO_mouseclick_handler(Window* io_window, int x, int y) {

    IO* io = (IO*)io_window;

    if(io->connected_io) {

        io->connected_io->connected_io = (IO*)0;
        Window_invalidate((Window*)io->connected_io, 0, 0,
                          io->connected_io->window.height - 1,
                          io->connected_io->window.width - 1);
        io->connected_io = (IO*)0;
    }

    PatchCore_connect_action(io->patch_core, io);
}

void IO_connect(IO* io, IO* connected_io) {

    io->connected_io = connected_io;
}

int IO_pull_sample(IO* io, float *l_sample, float *r_sample, float *g_sample) {

    return io->pull_sample_function(io, l_sample, r_sample, g_sample);
}
