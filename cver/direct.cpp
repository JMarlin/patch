#include <Window.h>
#include <View.h>
#include <Application.h>
#include <Bitmap.h>
#include <Locker.h>
#include <Point.h>
#include <stdlib.h>
#include <memory.h>
#include <iostream>
#include "wslib/context.h"

int32 DrawingThread(void* data);

class WrapWindow : public BWindow {

    public:
    
        BView* draw_view;
        thread_id draw_thread_id;
        BApplication* app;
        BBitmap* screen_buffer;
        Context* context;
    
        WrapWindow(BRect frame, BApplication* in_app) : BWindow(frame, "Patch", B_TITLED_WINDOW, 0) {
        
            draw_view = new BView(Bounds(), "draw_view", B_FOLLOW_ALL_SIDES, B_WILL_DRAW);
            AddChild(draw_view);
            BRect bounds = Bounds();
            
            
            screen_buffer = new BBitmap(bounds, (color_space)B_TRANSPARENT_MAGIC_RGBA32);
            context = Context_new((uint16_t)(bounds.right - bounds.left + 1), 
                                  (uint16_t)(bounds.bottom - bounds.top + 1),
                                  (uint32_t*)screen_buffer->Bits());
                                  
            Context_fill_rect(context, 10, 10, 50, 50, RGB(255, 0, 0));
            
            Show();
            
            app = in_app;
            
            draw_thread_id = spawn_thread(DrawingThread, "drawing_thread", B_NORMAL_PRIORITY, (void*)this);
            resume_thread(draw_thread_id);
        }
        
        void FrameResized(float width, float height) {
        
            delete screen_buffer;
            screen_buffer = new BBitmap(Bounds(), (color_space)B_TRANSPARENT_MAGIC_RGBA32, false);            
            
            //Reassign desktop buffer and trigger resize event
        }
        
        ~WrapWindow() {
            
            kill_thread(draw_thread_id);
        }
        
        bool QuitRequested() {
        
            app->Lock();
            app->Quit();
            app->Unlock();
            return true;
        }
};

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

int main(int argc, char* argv[]) {

    BRect b_rect;
    BApplication* app;
    WrapWindow* win;
    
    b_rect.left = 50;
    b_rect.top = 50;
    b_rect.right = 350;
    b_rect.bottom = 350;
    
    app = new BApplication("application/japp");
    win = new WrapWindow(b_rect, app);
    
    app->Run();
    
    delete app;
    
    return 0;
}
