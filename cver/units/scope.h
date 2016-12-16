#ifndef SCOPE_H
#define SCOPE_H

#ifdef __cplusplus
extern "C" {
#endif

struct Scope_struct;

#include "../core/module.h"
#include "../core/patchcore.h"
#include "../core/unit.h"
#include "../core/io.h"
#include "../uilib/slider.h"
#include "../wslib/button.h"

/*
    The Scope unit is going to be a handy diagnostic tool which will
act similarly to a MasterOut in that a chain of units can be attached
to its single input and that it has no output, but instead of rendering
to the audio device, the Scope will wait for the user to click the 
start button and then render the incoming sample stream to an internal
ring buffer (capturing a moving window of about a frame or so of data)

    The data that the Scope captures will, when the user clicks the
stop button, be displayed in a graph area in the middle of the unit.
This graph area will allow the user to scroll through the sample
timeline and zoom in and out on the time axis to examine the data.

    I am leaving this note as this is an idea whose implementation
depends on the creation of a couple of other components and will have
to wait for their creation. This includes, for one, the switch of the
rendering model to render all units in parallel on each sample (so
that we can get data from the sample chain without getting a pull
request from a MasterOut or doing something really hacky internally)
as well as implementing clipped bresenham line drawing in the Context
class (so that we can draw nice interpolation lines between sample
points at high zoom levels)
*/

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

Module* Scope_new();
Unit* Scope_constructor(PatchCore* patch_core);

#ifdef __cplusplus
}
#endif

#endif //SCOPE_H
