#include "patchcore.h"
#include "../units/masterout.h"
#include "../units/masteroutthru.h"
#include "../units/noise.h"
#include "../units/pitchknob.h"
#include "../units/sequence.h"
#include "../units/sine.h"
#include "../units/square.h"
#include "../units/vca.h"
#include "../units/adsr.h"
#include "../units/split.h"
#include "../units/scope.h"
#include "../units/capture.h"
#include <stdlib.h>
#include <stdio.h>

PatchCore* PatchCore_new() {

    PatchCore* patch;
    if(!(patch = (PatchCore*)malloc(sizeof(PatchCore))))
        return patch;

    Object_init((Object*)patch, PatchCore_delete_function);
    patch->modules = AssociativeArray_new();
    patch->sources = List_new();
    patch->desktop = (PatchDesktop*)0;
    patch->inputs = List_new();
    patch->outputs = List_new();

    if(!(patch->modules && patch->sources && patch->inputs)) {

        Object_delete((Object*)patch);
        return (PatchCore*)0;
    }

    return patch;
}

int insert_i32_little_endian(char* buf, int32_t value) {

    *(buf++) = (char)(value & 0xFF);
    *(buf++) = (char)((value >> 8) & 0xFF);
    *(buf++) = (char)((value >> 16) & 0xFF);
    *(buf++) = (char)((value >> 24) & 0xFF);

    return 4;
}

int insert_i16_little_endian(char* buf, int16_t value) {

    *(buf++) = (char)(value & 0xFF);
    *(buf++) = (char)((value >> 8) & 0xFF);

    return 2;
}

int insert_string_to_buf(char* buf, char* string) {

    int count = 0;

    while(*string) {

        *(buf++) = *(string++);
        count++;
    }

    return count;
}

void PatchCore_save_buffers_as_wav(PatchCore* patch, float* l_buf, float* r_buf, int buf_size) {

//TODO, will convert buffers to 16/44.1 WAV format (that bit is platform-
//      independent) and then thunk down to a generic PlatformWrapper
//      save file method (should support the provision of MIMEType for web
//      use)

    //Attempt to create a conversion buffer that will contain the final WAV data
    int32_t riff_size = (4 * buf_size) + 36;
    int j;
    int i = 0;
    char* wav_buf = (char*)malloc((4 * buf_size) + 44);

    if(!wav_buf)
        return;

    //Write the RIFF header into the buffer
    //RIFF Magic
    i += insert_string_to_buf(&wav_buf[i], "RIFF");

    //RIFF size
    i += insert_i32_little_endian(&wav_buf[i], riff_size);
    
    //WAV magic
    i += insert_string_to_buf(&wav_buf[i], "WAVE");
    
    //Sub-chunk 1, PCM info
    i += insert_string_to_buf(&wav_buf[i], "fmt ");
    i += insert_i32_little_endian(&wav_buf[i], 16);
    i += insert_i16_little_endian(&wav_buf[i], 1);
    i += insert_i16_little_endian(&wav_buf[i], 2);
    i += insert_i32_little_endian(&wav_buf[i], 44100);
    i += insert_i32_little_endian(&wav_buf[i], 176400);
    i += insert_i16_little_endian(&wav_buf[i], 4);
    i += insert_i16_little_endian(&wav_buf[i], 16);

    //Sub-chunk 2, PCM data
    i += insert_string_to_buf(&wav_buf[i], "data");
    i += insert_i32_little_endian(&wav_buf[i], 4 * buf_size);
    
    for(j = 0; j < buf_size; j++) {

        i += insert_i16_little_endian(&wav_buf[i], (int16_t)(l_buf[j] * 32767));
        i += insert_i16_little_endian(&wav_buf[i], (int16_t)(r_buf[j] * 32767));
    }

    //Pass the buffer to the environment for a save
    PlatformWrapper_save_file(wav_buf, (4 * buf_size) + 44, "test.wav", "audio/x-wav");
    
    //And finally dump the conversion buffer
    free(wav_buf);
}

int PatchCore_install_module(PatchCore* patch, Module* module) {

    return AssociativeArray_add(patch->modules, module->name, (Object*)module);
}

int PatchCore_next_spawn_x(PatchCore* patch) {

    return 0;
}

int PatchCore_next_spawn_y(PatchCore* patch) {

    return 0;
}

void Patch_mouse_callback(Object* desktop_object, uint16_t mouse_x,
                           uint16_t mouse_y, uint8_t mouse_buttons) {

    Desktop_process_mouse((Desktop*)desktop_object, mouse_x, mouse_y, mouse_buttons);
}

void Patch_resize_callback(Object* desktop_object, int w, int h) {

    //Make sure that any changes to the root context get carried to all windows
    Window_update_context((Window*)desktop_object, ((PatchDesktop*)desktop_object)->base_context);
    Window_resize((Window*)desktop_object, w, h);
}

void PatchCore_start(PatchCore* patch) {

    //TODO: This will be replaced by the loading of default modules from a list
    printf("Installing MasterOut...");
    PatchCore_install_module(patch, MasterOut_new());
    printf("Installing MasterOutThru...");
    PatchCore_install_module(patch, MasterOutThru_new());
    printf("Done\nInstalling Noise...");
    PatchCore_install_module(patch, Noise_new());
    printf("Done\nInstalling Sine...");
    PatchCore_install_module(patch, Sine_new());
    printf("Done\nInstalling PitchKnob...");
    PatchCore_install_module(patch, PitchKnob_new());
    printf("Done\nInstalling Sequence...");
    PatchCore_install_module(patch, Sequence_new());
    printf("Done\nInstalling Square...");
    PatchCore_install_module(patch, Square_new());
    printf("Done\nInstalling VCA...");
    PatchCore_install_module(patch, VCA_new());
    printf("Done\nInstalling ADSR...");
    PatchCore_install_module(patch, ADSR_new());
    printf("Done\nInstalling Split...");
    PatchCore_install_module(patch, Split_new());
    printf("Done\nInstalling Scope...");
    PatchCore_install_module(patch, Scope_new());
    printf("Done\nInstalling Capture...");
    PatchCore_install_module(patch, Capture_new());
    printf("Done\n");

    printf("Creating PatchDesktop...");
    patch->desktop = PatchDesktop_new(patch);
    PlatformWrapper_install_resize_callback((Object*)patch->desktop, Patch_resize_callback);
    PlatformWrapper_install_mouse_callback((Object*)patch->desktop, Patch_mouse_callback);
    
    printf("Done\nPerforming initial paint...");
    Window_paint((Window*)patch->desktop, (List*)0, 1);

    printf("Done\nInstalling audio handler...");
    PlatformWrapper_install_audio_handler(AudioHandler_new(PatchCore_pull_sample, (Object*)patch));
    printf("Done\n");
}

int PatchCore_clear_session(PatchCore* patch) {

    Window* unit_window;

    //Detatch all sources
    while(patch->sources->count)
        List_remove_at(patch->sources, 0);

    //Empty i/o lists
    while(patch->outputs->count)
        List_remove_at(patch->outputs, 0);
    
    while(patch->inputs->count)
        List_remove_at(patch->inputs, 0);

    //Destroy all instantiated units
    //Start by making sure the menu is closed
    Object_delete((Object*)patch->desktop->menu);

    //Then delete all children (units -- should probably make a unit list)
    while(patch->desktop->children->count) 
        Object_delete(List_get_at(patch->desktop->children, 0));
}

int PatchCore_save_session(PatchCore* patch) {

    int i;
    SerialifyBuf* sbuf;
    Unit* temp_unit;

    //Make sure the menu is closed
    Object_delete((Object*)patch->desktop->menu);

    //Create a new serialization object
    sbuf = SerialifyBuf_new();

    if(!sbuf)
        return 0;

    //Serialize every instantiated unit
    for(i = 0; i < patch->desktop->children->count; i++) {

        if(!Unit_serialify((Unit*)List_get_at(patch->desktop->children, i), sbuf)) {
        
            Object_delete((Object*)sbuf);

            return 0;
        }
    }

    PlatformWrapper_save_file(sbuf->buffer_base, sbuf->used_size, "test.pat", "application/octet-stream");
    Object_delete((Object*)sbuf);

    return 1;
}

int PatchCore_load_session(PatchCore* patch) {

    //Later: Make sure user wants to close current
    //Clear current session
    //Use a platformwrapper openfile abstraction to get the buffer
    //Use a serialify function yet to be defined to get a new sbuf from buffer
    //Loop:
    //    Get a cstring from the sbuf
    //    Look to see if it matches a module
    //    Pass the buf to the deserializer of that module (or fail)
    //    ^This should probably be done by a twin of instantiate_module
    //Discard sbuf/buffer
    //Loop through all registered inputs and outputs and make their 
    // 'connected_io' pointer matches their 'connected_id'
}

int PatchCore_add_source(PatchCore* patch, IO* source) {

    if(!source->is_output)
        return 0;

    return List_add(patch->sources, (Object*)source);
}

void PatchCore_remove_source(PatchCore* patch, IO* source) {

    int i;

    for(i = 0; i < patch->sources->count; i++)
        if(List_get_at(patch->sources, i) == (Object*)source)
            break;

    if(i == patch->sources->count)
        return;

    List_remove_at(patch->sources, i);
}

List* PatchCore_get_module_list(PatchCore* patch) {

    return patch->modules->keys;
}

void PatchCore_connect_action(PatchCore* patch, IO* io) {

    PatchDesktop_connect_action(patch->desktop, io);
}

void PatchCore_destroy_menu(PatchCore* patch) {
    
    Object_delete((Object*)patch->desktop->menu);
    patch->desktop->menu = (SessionMenu*)0;
}

void PatchCore_instantiate_module(PatchCore* patch, String* module_name) {

    Module* module;
    Window* window;

    module = (Module*)AssociativeArray_get(patch->modules, module_name);
    if(!module)
        return;

    window = (Window*)module->constructor(patch, module);
    if(!window)
        return;

    Window_insert_child((Window*)patch->desktop, window);
    Window_move(window, PatchCore_next_spawn_x(patch), PatchCore_next_spawn_y(patch));
}

void PatchCore_pull_sample(Object* patch_object, float* sample_l, float* sample_r) {

    int i;
    IO* source;
    float temp_l, temp_r, temp_g;
    PatchCore* patch = (PatchCore*)patch_object;

    *sample_r = 0;
    *sample_l = 0;

    //Render all outputs
    for(i = 0; i < patch->outputs->count; i++)
        IO_render_sample((IO*)List_get_at(patch->outputs, i));

    //Latch all of the new output values into all inputs
    for(i = 0; i < patch->inputs->count; i++)
        IO_update_latches((IO*)List_get_at(patch->inputs, i));

    //Sum the value of all outputs registered as 'sources'
    for(i = 0; i < patch->sources->count; i++) {

        source = (IO*)List_get_at(patch->sources, i);
        
        IO_pull_sample(source, &temp_l, &temp_r, &temp_g);
        *sample_r += temp_r;
        *sample_l += temp_l;
    }
}

void PatchCore_delete_function(Object* patch_object) {
    
    PatchCore* patch = (PatchCore*)patch_object;

    Object_delete((Object*)patch->modules);

    //Empty sources list before deleting
    //(These are a subset of window-owned outputs,
    //they will automatically be deleted when the
    //desktop is deleted)
    while(patch->sources->count)
        List_remove_at(patch->sources, 0);

    Object_delete((Object*)patch->sources);

    //Do the same for the outputs collection
    while(patch->outputs->count)
        List_remove_at(patch->outputs, 0);
    
    Object_delete((Object*)patch->outputs);
    
    //And for the input collection
    while(patch->inputs->count)
        List_remove_at(patch->inputs, 0);
    
    Object_delete((Object*)patch->inputs);

    Object_delete((Object*)patch->desktop);
    Object_default_delete_function(patch_object);
}
