#ifndef LIST_H
#define LIST_H

#include "listnode.h"

//================| List Class Declaration |================//

//A type to encapsulate a basic dynamic list
typedef struct List_struct {
    Object object;
    unsigned int count; 
    ListNode* root_node;
} List;

//Methods
List* List_new();
int List_add(List* list, Object* payload);
Object* List_get_at(List* list, unsigned int index);
Object* List_remove_at(List* list, unsigned int index);
void List_delete(Object* list_object);

#endif //LIST_H
