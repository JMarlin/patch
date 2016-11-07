#ifndef LISTNODE_H
#define LISTNODE_H

#include "object.h"

//================| ListNode Class Declaration |================//

//A type to encapsulate an individual item in a linked list
typedef struct ListNode_struct {
    Object object;
    Object* payload;
    struct ListNode_struct* prev;
    struct ListNode_struct* next;
} ListNode;

//Methods
ListNode* ListNode_new(Object* payload); 

#endif //LISTNODE_H
