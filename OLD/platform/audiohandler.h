#ifndef AUDIOHANDLER_H

typedef void (*AudioHandlerFunction)(void*, double*, double*);

typedef struct AudioHandler_struct {
    AudioHandlerFunction function;
    void* parent_object;
} AudioHandler;

AudioHandler* AudioHandler_new(AudioHandlerFunction function, void* parent_object);
void AudioHandler_delete(void* audio_handler_void);

#endif