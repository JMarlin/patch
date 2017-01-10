#include "scope.h"

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

Module* Scope_new() {

    return Module_new(Scope_constructor, "Scope");
}

Unit* Scope_constructor(PatchCore* patch_core) {

    return Unit_new(patch_core);
}
