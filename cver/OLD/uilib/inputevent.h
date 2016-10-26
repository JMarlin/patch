#ifndef INPUTEVENT_H

#include <inttypes.h>

#define EVENT_MOUSE 0x01
#define EVENT_KEY   0x02

#define KEY_ACT_DOWN 0x01
#define KEY_ACT_UP   0x02

#define MOUSE_ACT_UP   0x01
#define MOUSE_ACT_MOVE 0x02
#define MOUSE_ACT_DOWN 0x03
#define MOUSE_ACT_OVER 0x04
#define MOUSE_ACT_OUT  0x05

typedef struct MouseEventInfo_struct {
    uint8_t action; 
    int16_t x; 
    int16_t y; 
    uint8_t buttons;
} MouseEventInfo;

typedef struct KeyEventInfo_struct {
    uint8_t action;
    uint8_t key_code;
    uint8_t ascii;
} KeyEventInfo;

typedef struct InputEvent_struct {
    uint8_t type;
    union info {
        MouseEventInfo mouse; 
        KeyEventInfo key;
    };
} InputEvent;

#endif //INPUTEVENT_H