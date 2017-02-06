#include "platformwrapper.h"
#include <stdlib.h>
#include <time.h>
#include "../wslib/list.h"

MouseCallback mouse_handler;
ResizeCallback resize_handler;
PlatformWrapperOpenFileCallback open_handler;
Context* internal_context;
float left_sum, right_sum;
List* ah_list;
unsigned char* fb_buffer = 0;

void doPullSample() {

	int i;
	float l, r;
	AudioHandler* ah;

	for (i = 0; i < ah_list->count; i++) {

		ah = (AudioHandler*)List_get_at(ah_list, i);
		ah->function(ah->parent_object, &l, &r);
	}
}

void PlatformWrapper_save_file(uint8_t* file_buffer, int file_size, char* file_name, char* mime) {

	//TODO
}

void PlatformWrapper_open_file(PlatformWrapperOpenFileCallback open_complete, void* param_object) {

    //TODO
	open_complete(0, 0, param_object);
}

void PlatformWrapper_close_file(uint8_t* file_buffer) {

    //TODO
}

void PlatformWrapper_install_audio_handler(AudioHandler* audio_handler) {

	if (!ah_list)
		ah_list = List_new();

	if (!ah_list)
		return; //ERR

	List_add(ah_list, (Object*)audio_handler);
}

int PlatformWrapper_is_mouse_shown() {

	//Uses the OS mouse
	return 0;
}

Context* PlatformWrapper_get_context() {
	
	//TODO

	
	//Init the display
	//Declare our return variable
	uint32_t *return_buffer = (uint32_t*)fb_buffer;
	
	//Clear the dimensions until we've gotten past any potential errors
	uint16_t width = 640;
	uint16_t height = 480;
	
	//Attempt to create the framebuffer array 
	//if (!(return_buffer = (uint32_t*)malloc(sizeof(uint32_t) * width * height)))
		//return (Context*)0; //Exit early indicating error with an empty pointer 

	/*
							//Clear the framebuffer to black
	int i;
	for (i = 0; i < width * height; i++)
		return_buffer[i] = 0xFF000000; //The canvas *does* care about the opacity being set, which is annoying

	//Start refresh handler (timer handler?)
	//Assumably this will blit our return buffer into the body of the window
	*/

	internal_context = Context_new(width, height, return_buffer);

	return internal_context;
}

void PlatformWrapper_do_mouse_callback(uint16_t mouse_x, uint16_t mouse_y, uint8_t buttons) {

	if (mouse_handler.callback)
		mouse_handler.callback(mouse_handler.param_object, mouse_x, mouse_y, buttons);
}

void PlatformWrapper_install_mouse_callback(Object* param_object, MouseCallback_handler callback) {

	mouse_handler.param_object = param_object;
	mouse_handler.callback = callback;
}

void PlatformWrapper_install_resize_callback(Object* param_object, ResizeCallback_handler callback) {

	//TODO
}

float PlatformWrapper_random() {

	srand(time(NULL));
	return (float)rand() / (float)RAND_MAX;
}
