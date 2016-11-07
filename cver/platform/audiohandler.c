#include "audiohandler.h"
#include <stdlib.h>

AudioHandler* AudioHandler_new(AudioHandlerFunction function, Object* parent_object) {

    AudioHandler* audio_handler;
    if(!(audio_handler = (AudioHandler*)malloc(sizeof(AudioHandler))))
        return audio_handler;

    Object_init((Object*)audio_handler, 0);
    audio_handler->function = function;
    audio_handler->parent_object = parent_object;

    return audio_handler;
}
