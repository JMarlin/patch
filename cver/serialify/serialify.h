#ifndef SERIALIFY_H
#define SERIALIFY_H

#ifdef __cplusplus
extern "C" {
#endif

#include "../wslib/object.h"
#include <inttypes.h>

typedef struct SerialifyBuf_struct {
    Object object;
    int allocated_size;
    int used_size;
    void* buffer_base;
    void* current_buffer;
} SerialifyBuf;

typedef int (*Serialify_to_serial_function)(SerialifyBuf*, Object* target);

SerialifyBuf* SerialifyBuf_new();
int Serialify_from_cstring(SerialifyBuf* sbuf, char* string);
int Serialify_from_int8(SerialifyBuf* sbuf, int8_t value);
int Serialify_from_uint8(SerialifyBuf* sbuf, uint8_t value);
int Serialify_from_int16(SerialifyBuf* sbuf, int16_t value);
int Serialify_from_uint16(SerialifyBuf* sbuf, uint16_t value);
int Serialify_from_int32(SerialifyBuf* sbuf, int32_t value);
int Serialify_from_uint32(SerialifyBuf* sbuf, uint32_t value);
int Serialify_from_float(SerialifyBuf* sbuf, float value);
int Serialify_from_double(SerialifyBuf* sbuf, double value);
char* Serialify_to_cstring(SerialifyBuf* sbuf);
int8_t Serialify_to_int8(SerialifyBuf* sbuf);
uint8_t Serialify_to_uint8(SerialifyBuf* sbuf);
int16_t Serialify_to_int16(SerialifyBuf* sbuf);
uint16_t Serialify_to_uint16(SerialifyBuf* sbuf);
int32_t Serialify_to_int32(SerialifyBuf* sbuf);
uint32_t Serialify_to_uint32(SerialifyBuf* sbuf);
float Serialify_to_float(SerialifyBuf* sbuf);
double Serialify_to_double(SerialifyBuf* sbuf);

#ifdef __cplusplus
}
#endif

#endif //SERIALIFY_H
