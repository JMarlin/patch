#include "slider.h"

void Slider_knob_move(Window* knob_window, int x, int y) {

    Frame* knob = (Frame*)knob_window;
    Slider* slider = (Slider*)knob->window.parent;

    if(!slider)
        return;

    if(y < 0)
        y = 0;

    if(y > (slider->window.height - 10))
        y = slider->window.height - 10;

    if(slider->knob_old_move)
        slider->knob_old_move(knob_window, 0, y);
}

Slider* Slider_new(int x, int y, int width, int height, double min, double max) {

    Slider* slider;

    if(!(slider = (Slider*)malloc(sizeof(Slider))))
        return slider;

    if(!Window_init((Window*)slider, x, y, width, height, WIN_NODECORATION, (Context*)0)) {

        free(slider);
        return (Slider*)0;
    }

    if(!(slider->knob = Frame_new(0, 0, width, 10))) {

        Object_delete((Object*)slider);
        return (Slider*)0;
    }

    Window_insert_child((Window*)slider, (Window*)slider->knob);

    slider->value = 0;
    slider->min = min; 
    slider->max = max; 
    slider->knob_old_move = slider->knob->window.move_function; 
    slider->knob->window.move_function = Slider_knob_move;
    slider->window.object.delete_function = Slider_delete_function;

    return slider;
}

double Slider_get_value(Slider* slider) {

    double y = (double)slider->knob->window.y;
    double x = (double)slider->knob->window.x;
    double height = (double)slider->window.height;

    return (((y - height + 10) * (slider->max - slider->min)) / (-(height - 10))) - slider->min;
}

void Slider_set_value(Slider* slider, double new_value) {

    double new_y;
    double height = (double)slider->window.height;

    if(new_value > slider->max)
        new_value = slider->max;

    if(new_value < slider->min)
       new_value = slider->min;

    new_y = 
        (((-(height - 10)) / (slider->max - slider->min)) * (new_value - slider->min)) + (height - 10);

    Window_move((Window*)slider->knob, 0, (int)new_y);
}

void Slider_delete_function(Object* slider_object) {

    Slider* slider = (Slider*)slider_object;

    Object_delete((Object*)slider->knob);
    Window_delete_function(slider_object);
}
