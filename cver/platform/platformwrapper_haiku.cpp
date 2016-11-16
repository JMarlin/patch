#include <Window.h>
#include <View.h>
#include <Application.h>
#include <Bitmap.h>
#include <Locker.h>
#include <Point.h>
#include <stdlib.h>
#include <memory.h>
#include <iostream.h>
#include <time.h>
#include "wslib/context.h"
#include "platform/platformwrapper.h"

int32 DrawingThread(void* data);
int32 haiku_thread(void* data);

class WrapWindow : public BWindow {

    public:
    
        BView* draw_view;
        thread_id draw_thread_id;
        BApplication* app;
        BBitmap* screen_buffer;
        Context* context;
        MouseCallback_handler mouse_handler;
        ResizeCallback_handler resize_handler;
        Object* mouse_obj;
        Object* resize_obj;      
        BPoint mouse_point;  
        uint32 mouse_buttons;
    
        WrapWindow(BRect frame, BApplication* in_app);
        void FrameResized(float width, float height);
        ~WrapWindow();
        bool QuitRequested();
};

WrapWindow* global_win = NULL;
bool global_halt = false;

class WrapView : public BView {

public:

    WrapWindow* win;

    WrapView(WrapWindow* in_win, BRect bounds) : BView(bounds, "draw_view", B_FOLLOW_ALL_SIDES, B_WILL_DRAW) {
    	
    	win = in_win;    	
    }
    
    ~WrapView() {}
    
    void MouseDown(BPoint point) {
    
        win->mouse_point = point;
        win->mouse_buttons = B_PRIMARY_MOUSE_BUTTON;
        
        win->mouse_handler(win->mouse_obj, (uint16_t)win->mouse_point.x, (uint16_t)win->mouse_point.y, 1);
    }    
    
    void MouseUp(BPoint point) {
    
        win->mouse_point = point;
        win->mouse_buttons = 0;
        
        win->mouse_handler(win->mouse_obj, (uint16_t)win->mouse_point.x, (uint16_t)win->mouse_point.y, 0);
    }  
    
    void MouseMoved(BPoint point, uint32 transit, const BMessage* message) {
    
        win->mouse_point = point;
        
        win->mouse_handler(win->mouse_obj, (uint16_t)win->mouse_point.x,
                            (uint16_t)win->mouse_point.y, (!!win->mouse_buttons) ? 1 : 0);
    }  
};

void PlatformWrapper_init() {

    thread_id haiku_thread_id = spawn_thread(haiku_thread, "haiku_thread", B_NORMAL_PRIORITY, NULL);
    resume_thread(haiku_thread_id);
}

void PlatformWrapper_hold_for_exit() {
	
	while(!global_halt);
}

void PlatformWrapper_install_audio_handler(AudioHandler* audio_handler) {

    return;
}

int PlatformWrapper_is_mouse_shown() {

    return 0;
}

Context* PlatformWrapper_get_context() {

    while(!global_win)
        snooze(10);
        
    return global_win->context;
}

void PlatformWrapper_install_mouse_callback(Object* param_object, MouseCallback_handler callback) {

    while(!global_win)
        snooze(10);
        
    global_win->mouse_handler = callback;
    global_win->mouse_obj = param_object;
}
    
void PlatformWrapper_install_resize_callback(Object* param_object, ResizeCallback_handler callback) {

    while(!global_win)
        snooze(10);
        
    global_win->resize_handler = callback;
    global_win->resize_obj = param_object;
}
 
float PlatformWrapper_random() {

    srand(time(NULL));
    return (float)rand()/(float)RAND_MAX;
}
    
WrapWindow::WrapWindow(BRect frame, BApplication* in_app) : BWindow(frame, "Patch", B_TITLED_WINDOW, 0) {
        
    mouse_handler = (MouseCallback_handler)0;
    resize_handler = (ResizeCallback_handler)0;
    mouse_obj = (Object*)0;
    resize_obj = (Object*)0;    
                
    draw_view = new WrapView(this, Bounds());
    AddChild(draw_view);
    
    BRect bounds = Bounds();
         	
            
    screen_buffer = new BBitmap(bounds, B_RGB32);
    context = Context_new((uint16_t)(bounds.right - bounds.left + 1), 
                          (uint16_t)(bounds.bottom - bounds.top + 1),
                          (uint32_t*)screen_buffer->Bits());                                              
    Show();

    Lock();
    draw_view->GetMouse(&mouse_point, &mouse_buttons);
    Unlock();
            
    app = in_app;
            
    draw_thread_id = spawn_thread(DrawingThread, "drawing_thread", B_NORMAL_PRIORITY, (void*)this);
    resume_thread(draw_thread_id);
    
    global_win = this;
}
        
void WrapWindow::FrameResized(float width, float height) {
        
    BRect bounds;
        
    bounds = Bounds();
        
    delete screen_buffer;
    screen_buffer = new BBitmap(bounds, (color_space)B_RGB32, false);            
            
    context->buffer = (uint32_t*)screen_buffer->Bits(); 
    context->width = (uint16_t)(bounds.right - bounds.left + 1);
    context->height = (uint16_t)(bounds.bottom - bounds.top + 1);  
            
    resize_handler(resize_obj, context->width, context->height);
}
        
WrapWindow::~WrapWindow() {
            
    kill_thread(draw_thread_id);
}
        
bool WrapWindow::QuitRequested() {
        
    app->Lock();
    app->Quit();
    app->Unlock();
    return true;
}

int32 DrawingThread(void* data) {

    WrapWindow* win = (WrapWindow*)data;

    while(true) {
    
        win->Lock();
        win->draw_view->DrawBitmap(win->screen_buffer, BPoint(0, 0));
        win->Unlock();
        
        snooze(16);
    }

    return B_OK;
}

int32 haiku_thread(void* data) {

    BRect b_rect;
    BApplication* app;
    WrapWindow* win;
    
    b_rect.left = 50;
    b_rect.top = 50;
    b_rect.right = 800;
    b_rect.bottom = 600;
    
    app = new BApplication("application/japp");
    win = new WrapWindow(b_rect, app);
    
    app->Run();
    
    delete app;
    global_halt = true;
    
    return B_OK;
}
