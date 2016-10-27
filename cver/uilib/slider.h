#ifndef SLIDER_H
#define SLIDER_H

#include "frame.h"

typedef struct Slider_struct {
    Window window; //Inherits window
    Frame* knob;
    double value;
    WindowMoveHandler knob_old_move;
} Slider;

Slider* Slider_new(int x, int y, int width, int height, double min, double max);
double Slider_get_value(Slider* slider);
void Slider_set_value(Slider* slider, double new_value);
Slider* Slider_delete_function(void* slider_void);

#endif //SLIDER_H