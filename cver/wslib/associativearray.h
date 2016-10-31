#ifndef ASSOCIATIVEARRAY_H
#define ASSOCIATIVEARRAY_H

#include "list.h"

typedef struct AssociativeArray_struct {
    Object object;
    List* keys;
    List* values;
} AssociativeArray;

AssociativeArray* AssociativeArray_new();
void AssociativeArray_delete_function(Object* associative_array_object);
Object* AssociativeArray_get(AssociativeArray* associative_array, String* key);
int AssociativeArray_add(AssociativeArray* associative_array, String* key, Object* value)

#endif //ASSOCIATIVEARRAY_H