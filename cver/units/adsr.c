#include "adsr.h"
#include <math.h>

Module* ADSR_new() {

    return Module_new(ADSR_constructor, ADSR_deserializer, "ADSR");
}

int ADSR_pull_sample_handler(IO* io, float* sample_l, float* sample_r, float* sample_g) {
    
    float current_gain;
    float in_sample_l, in_sample_r, gate_sample, a_sample, d_sample, s_sample, r_sample;
    
    ADSR* adsr = (ADSR*)io->param_object;

    if(!IO_pull_sample(adsr->input,  &in_sample_l, &in_sample_r, &gate_sample))
        return 0;

    a_sample = Slider_get_value(adsr->a_slider);
    d_sample = Slider_get_value(adsr->d_slider);
    s_sample = Slider_get_value(adsr->s_slider);
    r_sample = Slider_get_value(adsr->r_slider);

    if(gate_sample > -1.0) {

        //Check to see if we just turned on
        if(!(adsr->last_gate > -1.0)) {

            adsr->time = 0;
        }

        if(adsr->time <= a_sample) {

            current_gain = (powf(adsr->time/a_sample, 2) * 2) - 1;
            adsr->time += 1000.0/SAMPLE_RATE;
        } else if(adsr->time <= (a_sample + d_sample))  {

            current_gain = (((powf((((2*(a_sample+(d_sample/2))) - adsr->time) - a_sample)/d_sample, 2) * ((1 - s_sample) / 2)) + (1 - ((1 - s_sample) / 2))) * 2) - 1;
            adsr->time += 1000.0/SAMPLE_RATE;
        } else {

            current_gain = s_sample;

            //Don't increase time because it doesn't matter anymore
        }
             
    } else {
  
        //Check to see if we just turned off
        if(adsr->last_gate > -1.0) {

            adsr->time = 0;
        }

        if(adsr->time <= r_sample) {
        
            current_gain = (((powf(((2 * (r_sample / 2)) - adsr->time) / r_sample, 2) * (1 - ((1 - s_sample) / 2))) * 2) - 1);
            adsr->time += 1000.0/SAMPLE_RATE;
        } else {
        
            current_gain = -1.0;
            //Don't increase time because it doesn't matter anymore
        }
    }

    adsr->last_gate = gate_sample;
    *sample_g = 1;
    *sample_l = *sample_r = current_gain;
 
    return 1;
}

void ADSR_paint_handler(Window* sine_window) {

    Frame_paint_handler(sine_window);
    /*
    Context_draw_text(sine_window->context, "ADSR",
                       (sine_window->width / 2) - 16,
                       (sine_window->height / 2) - 6,
                       WIN_BORDERCOLOR);     
                       */
}

Unit* ADSR_deserializer(SerialifyBuf* sbuf, PatchCore* patch_core) {

    return (Unit*)0;
}

Unit* ADSR_constructor(PatchCore* patch_core) {

    ADSR* adsr = (ADSR*)malloc(sizeof(ADSR));

    if(!adsr)
        return (Unit*)adsr;

    if(!Unit_init((Unit*)adsr, patch_core)) {

        Object_delete((Object*)adsr);
        return (Unit*)0;
    }

    adsr->a_slider = Slider_new(10, 10, 30, 130, 0.01, 1000);
    adsr->d_slider = Slider_new(50, 10, 30, 130, 0.01, 1000);
    adsr->s_slider = Slider_new(90, 10, 30, 130, -1, 1);
    adsr->r_slider = Slider_new(130, 10, 30, 130, 0.01, 1000);
    adsr->output = Unit_create_output((Unit*)adsr, 195, 75);
    adsr->input = Unit_create_input((Unit*)adsr, 5, 75);
    Window_resize((Window*)adsr, 200, 150);

    if(!(adsr->output && adsr->input && adsr->a_slider && adsr->d_slider &&
       adsr->s_slider && adsr->r_slider)) {

        Object_delete((Object*)adsr);
        return (Unit*)0;
    }    
   
    Window_insert_child((Window*)adsr, (Window*)adsr->a_slider);
    Window_insert_child((Window*)adsr, (Window*)adsr->d_slider);
    Window_insert_child((Window*)adsr, (Window*)adsr->s_slider);
    Window_insert_child((Window*)adsr, (Window*)adsr->r_slider);
    adsr->time = 0;
    adsr->last_gate = -1.0;
    adsr->output->pull_sample_function = ADSR_pull_sample_handler;
    adsr->unit.frame.window.paint_function = ADSR_paint_handler;

    return (Unit*)adsr;
}
