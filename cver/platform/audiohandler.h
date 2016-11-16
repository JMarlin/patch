#ifndef AUDIOHANDLER_H
#define AUDIOHANDLER_H

#ifdef __cplusplus
extern "C" {
#endif

#include "../wslib/object.h"

typedef void (*AudioHandlerFunction)(Object*, float*, float*);

typedef struct AudioHandler_struct {
    Object object;
    AudioHandlerFunction function;
    Object* parent_object;
} AudioHandler;

AudioHandler* AudioHandler_new(AudioHandlerFunction function, Object* parent_object);

#ifdef __cplusplus
}
#endif

#endif