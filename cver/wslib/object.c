#include <stdlib.h>
#include "object.h"

void Object_default_delete_function(Object* object) {

    free(void* object);
}

void Object_init(Object* object, DeleteFunction delete_function) {

    if(delete_function)
        object->delete_function = delete_function;
    else
        object->delete_function = Object_default_delete_function;
}

void Object_delete(Object* object) {

    if(!object)
        return;

    if(object->delete_function)
        object->delete_function(object);
    else
        Object_default_delete_function(object);
}
