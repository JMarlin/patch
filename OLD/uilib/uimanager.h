#ifndef UIMANAGER_H
#define UIMANAGER_H

#include "../platform/platformwrapper.h"
#include "inputevent.h"

typedef struct UIManager_struct {
    Window window; //This class extends `Window`
    PlatformWrapper* platform_wrapper;
    WindowGFXResizeHandler old_ongfxresize;
} UIManager;

UIManager* UIManager_new();
void UIManager_ongfxresize(Window* uimanager_window, int w, int h);
void UIManager_generic_ongfxresize(void* uimanager_void, int w, int h);
void UIManager_generic_event_handler(void* uimanager_void, InputEvent* input_event);
void UIManager_delete(void* uimanager_void);

#endif //UIMANAGER_H