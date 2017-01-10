#include "scope.h"

/*
typedef struct Scope_struct {
    Unit unit;
    Button* start_button;
    Button* stop_button;
    Button* zoom_in_button;
    Button* zoom_out_button;
    Button* scroll_left_button;
    Button* scroll_right_button;
    IO* input;
    int capture_pointer;
    float* sample_buf;
} Scope;
*/

void Scope_paint_handler(Window* scope_window) {

    Frame_paint_handler(scope_window);
    Context_fill_rect(scope_window->context, 13, 13, 346, 246, RGB(255, 255, 255));
    Context_draw_rect(scope_window->context, 12, 12, 348, 248, RGB(0, 0, 0));                  
}

Module* Scope_new() {

    return Module_new(Scope_constructor, "Scope");
}

Unit* Scope_constructor(PatchCore* patch_core) {

    Scope* scope;

    scope = (Scope*)malloc(sizeof(Scope));

    if(!scope)
        return (Unit*)0;

    Unit_init((Unit*)scope, patch_core);
    Window_resize((Window*)scope, 400, 300);

    scope->unit.frame.window.paint_function = Scope_paint_handler;

    return (Unit*)scope;
}
