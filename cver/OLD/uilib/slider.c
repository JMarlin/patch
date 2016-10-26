#include "slider.h"

typedef struct Slider_struct {
    Window window; //Inherits window
    Frame* knob;
    double value;
    double min;
    double max;
    WindowMoveHandler knob_old_move;
} Slider;

void Slider_knob_move(Window* knob_window, int x, int y) {

    Frame* knob = (Frame*)knob_window;
    Slider* slider = (Slider*)knob->parent;

    if(!slider)
        return;

    if(y < 0)
        y = 0;

    if(y > (slider->window.height - 10))
        y = slider->window.height - 10;

    slider->knob_old_move(knob_window, 0, y);
}

Slider* Slider_new(int x, int y, int width, int height, double min, double max) {

    Slider* slider;

    if(!(slider = (Slider*)Malloc(sizeof(Slider))))
        return slider;

    if(!Window_init((Window*)slider, x, y, width, height)) {

        free(slider);
        return (Slider*)0;
    }

    if(!(slider->knob = Frame_new(0, 0, width, 10))) {

        Window_delete(slider);
        return (Slider*)0;
    }

    slider->value = 0;
    slider->min = min; 
    slider->max = max; 
    slider->knob_old_move = slider->knob->window.move; 
    slider->knob->window.move = Slider_knob_move;
}

double Slider_get_value(Slider* slider) {

    double y = (double)slider->knob->window.y;
    double x = (double)slider->knob->window.x;
    double height = (double)slider->window.height;

    return (((y - height + 10) * (slider->max - slider->min)) / (-(height - 10))) - slider->min;
}

void Slider_set_value(Slider* slider, double new_value) {

    double height = (double)slider->window.height;

    if(new_value > slider->max)
        new_value = slider->max;

    if(new_value < slider->min)
       new_value = slider->min;

    double new_y = 
        (((-(height - 10)) / (slider->max - slider->min)) * (new_value - slider->min)) + (height - 10);

    Window_move((Window*)slider->knob, 0, (int)new_y);
}

Slider* Slider_delete(void* slider_void) {

    Slider* slider = (Slider*)slider_void;

    Frame_delete(slider->knob);
    Window_delete(slider_void);
}
