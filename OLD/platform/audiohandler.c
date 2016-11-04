#include "audiohandler.h"
#include <stdlib.h>

AudioHandler* AudioHandler_new(AudioHandlerFunction function, void* parent_object) {

    AudioHandler* audio_handler;
    if(!(audio_handler = (AudioHandler*)malloc(sizeof(AudioHandler))))
        return audio_handler;

    audio_handler->function = function;
    audio_handler->parent_object = parent_object;

    return audio_handler;
}

void AudioHandler_delete(void* audio_handler_void) {

    free(audio_handler_void);
}