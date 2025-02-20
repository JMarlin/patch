#include "uimanager.h"

UIManager* UIManager_new(PlatformWrapper* platform_wrapper) {

    UIManager* uimanager;
    if(!(uimanager = (UIManager*)malloc(sizeof(UIManager)))
        return uimanager;

    if(!Window_init((Window*)UIManager, 0, 0,
                PlatformWrapper_get_screen_width(platform_wrapper),
                PlatformWrapper_get_screen_height(platform_wrapper))) {

        free(uimanager);
        return (UIManager*)0;
    }

    uimanager->window.context = PlatformWrapper_get_drawing_context(platform_wrapper);
    uimanager->old_ongfxresize = uimanager->window.ongfxresize;
    uimanager->window.ongfxresize = UIManager_ongfxresize;
    PlatformWrapper_install_input_handler(platform_wrapper, UIManager_generic_input_handler, (void*)uimanager);
    PlatformWrapper_install_resize_handler(platform_wrapper, UIManager_generic_ongfxresize, (void*)uimanager);

    UIManager_ongfxresize((Window*)uimanager, 0, 0);

    return uimanager;
}

void UIManager_ongfxresize(Window* uimanager_window, int w, int h) {

    UIManager* uimanager = (UIManager*)uimanager_window;

    w = uimanager->window.width =
        PlatformWrapper_get_screen_width(uimanager->platform_wrapper);

    h = uimanager->window.height =
        PlatformWrapper_get_screen_height(uimanager->platform_wrapper);

    uimanager->old_ongfxresize((Window*)uimanager, w, h);
}

void UIManager_generic_ongfxresize(void* uimanager_void, int w, int h) {

    Window* uimanager_window = (Window*)uimanager_void;

    UIManager_ongfxresize(uimanager_window, w, h);
}

void UIManager_generic_input_handler(void* uimanager_void, InputEvent* input_event) {

    Window* uimanager_window = (Window*)uimanager_void;

    Window_event_handler(uimanager_window, input_event);
}

void UIManager_delete(void* uimanager_void) {

    Window_delete(uimanager_void);
}
