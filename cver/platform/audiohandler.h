#ifndef AUDIOHANDLER_H

typedef void (*AudioHandlerFunction)(Object*, double*, double*);

typedef struct AudioHandler_struct {
    Object object;
    AudioHandlerFunction function;
    Object* parent_object;
} AudioHandler;

AudioHandler* AudioHandler_new(AudioHandlerFunction function, Object* parent_object);

#endif