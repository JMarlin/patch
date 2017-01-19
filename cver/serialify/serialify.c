#include "serialify.h"
#include <stdlib.h>
#include <string.h>

void SerialifyBuf_delete_function(Object* sbuf_object) {

    SerialifyBuf* sbuf = (SerialifyBuf*)sbuf_object;

    if(sbuf->buffer_base)
        free(sbuf->buffer_base);

    free(sbuf_object);
}

SerialifyBuf* SerialifyBuf_new() {

    SerialifyBuf* sbuf = (SerialifyBuf*)malloc(sizeof(SerialifyBuf));

    if(!sbuf)
        return sbuf;

    Object_init((Object*)sbuf, SerialfyBuf_delete_function);
    sbuf->allocated_size = 0;
    sbuf->used_size = 0;
    sbuf->buffer_base = 0;
    sbuf->loc = 0;
}

int Serialify_insert_bytes(SerialifyBuf* sbuf, int count, uint8_t* inbuf) {

    int i;
    uint8_t* newbuf;

    //Allocate a buffer if it hasn't been yet
    if(!sbuf->buffer_base) {

        sbuf->buffer_base = (uint8_t*)malloc(count);

        if(!sbuf->buffer_base)
            return -1; //Need more verbose error types

        sbuf->allocated_size = count;
        sbuf->used_size = 0;
        sbuf->loc = 0;
    }

    //Check to see if there's enough room to insert the bytes
    if(sbuf->allocated_size <= (sbuf->used_size + count)) {

        //If not, double the allocated space (speedhack)
        newbuf = (uint8_t*)realloc(sbuf->buffer_base, sbuf->allocated_size << 1);

        if(!newbuf)
            return 0;

        sbuf->buffer_base = newbuf;
        sbuf->allocated_size = sbuf->allocated_size << 1;
    }

    //Copy over the data (slow)
    for(i = 0; i < count; i++) {

        sbuf->buffer_base[sbuf->loc++] = inbuf[i];
        sbuf->used_size++;
    }

    return i;
}

int Serialify_peek_bytes(SerialifyBuf* sbuf, int count, uint8_t* outbuf) {

    int i;

    for(i = 0; (i < count) && ((i + sbuf->loc) < sbuf->used_size); i++)
        outbuf[i] = sbuf->buffer_base[sbuf->loc + i];

    return i;
}

int Serialify_read_bytes(SerialifyBuf* sbuf, int count, uint8_t* outbuf) {

    int i;

    i = Serialify_peek_bytes(sbuf, count, outbuf);
    sbuf->loc += i;

    return i;
}

int Serialify_from_cstring(SerialifyBuf* sbuf, char* string) {

    return Serialify_insert_bytes(sbuf, strlen(string) + 1, string);
}

int Serialify_from_int8(SerialifyBuf* sbuf, int8_t value) {

    return Serialify_insert_bytes(sbuf, 1, (uint8_t*)&value);
}

int Serialify_from_uint8(SerialifyBuf* sbuf, uint8_t value) {

    return Serialify_insert_bytes(sbuf, 1, &value);
}

int Serialify_from_int16(SerialifyBuf* sbuf, int16_t value) {

    uint16_t* uval;
    uint8_t vbuf[2];

    uval = (uint16_t*)&value;
    vbuf[0] = (uint8_t)(((*uval) >> 8) & 0xFF);
    vbuf[1] = (uint8_t)((*uval) & 0xFF);

    return Serialify_insert_bytes(sbuf, 2, vbuf);
}

int Serialify_from_uint16(SerialifyBuf* sbuf, uint16_t value) {

    uint8_t vbuf[2];

    vbuf[0] = (uint8_t)((value >> 8) & 0xFF);
    vbuf[1] = (uint8_t)(value & 0xFF);

    return Serialify_insert_bytes(sbuf, 2, vbuf);
}

int Serialify_from_int32(SerialifyBuf* sbuf, int32_t value);

    uint32_t* uval;
    uint8_t vbuf[4];

    uval = (uint32_t*)&value;
    vbuf[0] = (uint8_t)(((*uval) >> 24) & 0xFF);
    vbuf[1] = (uint8_t)(((*uval) >> 16) & 0xFF);
    vbuf[2] = (uint8_t)(((*uval) >> 8) & 0xFF);
    vbuf[3] = (uint8_t)((*uval) & 0xFF);

    return Serialify_insert_bytes(sbuf, 4, vbuf);
}

int Serialify_from_uint32(SerialifyBuf* sbuf, uint32_t value);

    uint8_t vbuf[4];

    vbuf[0] = (uint8_t)((value >> 24) & 0xFF);
    vbuf[1] = (uint8_t)((value >> 16) & 0xFF);
    vbuf[2] = (uint8_t)((value >> 8) & 0xFF);
    vbuf[3] = (uint8_t)(value & 0xFF);

    return Serialify_insert_bytes(sbuf, 4, vbuf);
}

int Serialify_from_float(SerialifyBuf* sbuf, float value) {

    uint32_t* uval;
    uint8_t vbuf[4];

    uval = (uint32_t*)&value;
    vbuf[0] = (uint8_t)(((*uval) >> 24) & 0xFF);
    vbuf[1] = (uint8_t)(((*uval) >> 16) & 0xFF);
    vbuf[2] = (uint8_t)(((*uval) >> 8) & 0xFF);
    vbuf[3] = (uint8_t)((*uval) & 0xFF);

    return Serialify_insert_bytes(sbuf, 4, vbuf);
}

int Serialify_from_double(SerialifyBuf* sbuf, double value) {

    uint64_t* uval;
    uint8_t vbuf[8];

    uval = (uint64_t*)&value;
    vbuf[0] = (uint8_t)(((*uval) >> 56) & 0xFF);
    vbuf[1] = (uint8_t)(((*uval) >> 48) & 0xFF);
    vbuf[2] = (uint8_t)(((*uval) >> 40) & 0xFF);
    vbuf[3] = (uint8_t)(((*uval) >> 32) & 0xFF);
    vbuf[4] = (uint8_t)(((*uval) >> 24) & 0xFF);
    vbuf[5] = (uint8_t)(((*uval) >> 16) & 0xFF);
    vbuf[6] = (uint8_t)(((*uval) >> 8) & 0xFF);
    vbuf[7] = (uint8_t)((*uval) & 0xFF);

    return Serialify_insert_bytes(sbuf, 8, vbuf);
}

char* Serialify_to_cstring(SerialifyBuf* sbuf) {

    int i;
    int strlen = 0;
    char* outstr;
    uint8_t cbuf = 1;

    while(cbuf) {

        Serialify_peek_bytes(sbuf, 1, &cbuf);
        strlen++;
    }

    outstr = (char*)malloc(strlen);

    if(!outstr)
        return outstr;

    Serialify_read_bytes(sbuf, strlen, (uint8_t)outstr);

    return outstr;
}

int8_t Serialify_to_int8(SerialifyBuf* sbuf) {

    int8_t outval;

    Serialify_read_bytes(sbuf, 1, (uint8_t*)&outval);

    return outval;
}

uint8_t Serialify_to_uint8(SerialifyBuf* sbuf) {

    uint8_t outval;
    
    Serialify_read_bytes(sbuf, 1, &outval);

    return outval;
}

int16_t Serialify_to_int16(SerialifyBuf* sbuf) {

    int16_t outval;
    uint16_t* uval;
    uint8_t vbuf[2];

    Serialify_read_bytes(sbuf, 2, &vbuf);

    uval = (uint16_t*)&outval;
    *uval = 0;
    *uval |= vbuf[0] << 8;
    *uval |= vbuf[1];

    return outval;
}

uint16_t Serialify_to_uint16(SerialifyBuf* sbuf) {

    uint16_t outval;
    uint8_t vbuf[2];

    Serialify_read_bytes(sbuf, 2, &vbuf);

    outval = 0;
    outval |= vbuf[0] << 8;
    outval |= vbuf[1];

    return outval;
}

int32_t Serialify_to_int32(SerialifyBuf* sbuf);

    int32_t outval;
    uint32_t* uval;
    uint8_t vbuf[4];

    Serialify_read_bytes(sbuf, 4, &vbuf);

    uval = (uint32_t*)&outval;
    *uval = 0;
    *uval |= vbuf[0] << 24;
    *uval |= vbuf[1] << 16;
    *uval |= vbuf[2] << 8;
    *uval |= vbuf[3];

    return outval;
}

uint32_t Serialify_to_uint32(SerialifyBuf* sbuf);

    uint32_t outval;
    uint8_t vbuf[4];

    Serialify_read_bytes(sbuf, 4, &vbuf);

    outval = 0;
    outval |= vbuf[0] << 24;
    outval |= vbuf[1] << 16;
    outval |= vbuf[2] << 8;
    outval |= vbuf[3];

    return outval;
}

float Serialify_to_float(SerialifyBuf* sbuf);

    float outval;
    uint32_t* uval;
    uint8_t vbuf[4];

    Serialify_read_bytes(sbuf, 4, &vbuf);

    uval = (uint32_t*)&outval;
    *uval = 0;
    *uval |= vbuf[0] << 24;
    *uval |= vbuf[1] << 16;
    *uval |= vbuf[2] << 8;
    *uval |= vbuf[3];

    return outval;
}

double Serialify_to_double(SerialifyBuf* sbuf);

    double outval;
    uint64_t* uval;
    uint8_t vbuf[8];

    Serialify_read_bytes(sbuf, 8, &vbuf);

    uval = (uint64_t*)&outval;
    *uval = 0;
    *uval |= vbuf[0] << 56;
    *uval |= vbuf[1] << 48;
    *uval |= vbuf[2] << 40;
    *uval |= vbuf[3] << 32;
    *uval |= vbuf[4] << 24;
    *uval |= vbuf[5] << 16;
    *uval |= vbuf[6] << 8;
    *uval |= vbuf[7];

    return outval;
}
