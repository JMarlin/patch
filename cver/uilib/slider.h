#ifndef SLIDER_H
#define SLIDER_H

struct Slider_struct;

#include "frame.h"

typedef struct Slider_struct {
    Window window; //Inherits window
    Frame* knob;
    float value;
    float min;
    float max;
    WindowMoveHandler knob_old_move;
    int orientation;
} Slider;

Slider* Slider_new(int x, int y, int width, int height, float min, float max);
float Slider_get_value(Slider* slider);
void Slider_set_value(Slider* slider, float new_value);
void Slider_delete_function(Object* slider_object);

#endif //SLIDER_H