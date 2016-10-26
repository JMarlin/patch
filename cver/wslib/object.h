#ifndef OBJECT_H
#define OBJECT_H

typedef void (*DeleteFunction)(void* object); 

typedef struct Object_struct {
    DeleteFunction delete_function;
} Object;

void Object_init(Object* object, DeleteFunction delete_function);
void Object_delete(Object* object);

#endif //OBJECT_H