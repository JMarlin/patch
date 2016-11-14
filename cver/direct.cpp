#include <Window.h>
#include <View.h>
#include <DirectWindow.h>
#include <Application.h>
#include <Locker.h>
#include <stdlib.h>
#include <memory.h>
#include <iostream>

int32 DrawingThread(void* data);

class WrapWindow : public BDirectWindow {
	
	public:
	    
	    uint8* bits;
	    int32 row_bytes;
	    color_space pixel_format;
	    clipping_rect win_bounds;
	    uint32 clip_count;
	    clipping_rect* clip_list;
	    bool is_dirty;
	    bool is_connected;
	    bool connection_is_disabled;
	    BLocker* locker;
	    BApplication* app;
	    thread_id draw_thread_id;
	    uint8* user_buf;
	    
	    WrapWindow(BRect frame, BApplication* in_app) : BDirectWindow(frame, "Patch", B_TITLED_WINDOW, 0) {
	    
	        BView* view;	    
	        is_connected = false;
	        connection_is_disabled = false;
	        locker = new BLocker();
	        clip_list = NULL;
	        clip_count = 0;
	        user_buf = NULL;
	        app = in_app;
	        	        
	        view = new BView(Bounds(), "clear_view", B_FOLLOW_ALL_SIDES, 0); //B_WILL_DRAW);
	        view->SetViewColor(B_TRANSPARENT_32_BIT);
	        AddChild(view);
	        
	        if(!SupportsWindowMode())
	            SetFullScreen(true);
	            
	        is_dirty = true;
	        draw_thread_id = spawn_thread(DrawingThread, "drawing_thread", B_NORMAL_PRIORITY, (void*)this);
	        resume_thread(draw_thread_id);
	        Show();
	    }
	    
	    ~WrapWindow() {
	    	
	    	int32 result;
	    	
	    	connection_is_disabled = true;
	    	Hide();
	    	Sync();
	    	wait_for_thread(draw_thread_id, &result);
	    	free(clip_list);
	    	free(user_buf);
	    	delete locker;
	    }
	    
	    bool QuitRequested() {

	        is_connected = false;
	        locker->Lock();	        
	        kill_thread(draw_thread_id);
	        locker->Unlock();
	        app->Lock();
	        app->Quit();
	        app->Unlock();
	        return true;
	    }
	    
	    void Draw() {
	    
	        is_dirty = true;
	    }
	    
	    void DirectConnected(direct_buffer_info* info) {
	    	
	    	if(!is_connected && connection_is_disabled)
	    	    return;
	    	    
	    	locker->Lock();
	    	
	    	switch(info->buffer_state & B_DIRECT_MODE_MASK) {
	    		
	    		case B_DIRECT_START:
	    		    is_connected = true;
	    		    
	    		case B_DIRECT_MODIFY:	    		
	    		    if(clip_list) {
	    		    	
	    		        free(clip_list);
	    		        clip_list = NULL;
	    		    }
	    		    
	    		    if(user_buf) {
	    		    	
	    		    	free(user_buf);
	    		    	user_buf = NULL;
	    		    }
	    		    
	    		    clip_count = info->clip_list_count;
	    		    clip_list = (clipping_rect*)malloc(clip_count * sizeof(clipping_rect));
	    		    user_buf = (uint8*)malloc((info->window_bounds.bottom - info->window_bounds.top + 1) *
	    		                              (info->window_bounds.right - info->window_bounds.left + 1) * 4);
	    		    
	    		    if(clip_list && user_buf) {
	    		    	
	    		    	memcpy(clip_list, info->clip_list, clip_count * sizeof(clipping_rect));
	    		    	bits = (uint8*)info->bits;
	    		    	row_bytes = info->bytes_per_row;
	    		    	pixel_format = info->pixel_format;
	    		    	win_bounds = info->window_bounds;
	    		    	is_dirty = true;
	    		    }
	    		    break;
	    		    
	    		case B_DIRECT_STOP:
	    		    is_connected = false;
	    		    break;
	    		    
	    		default:
	    		    break;
	    	}
	    	
	    	locker->Unlock();
	    }	    
};

int32 DrawingThread(void* data) {
	
	WrapWindow* win;
	
	win = (WrapWindow*)data;
	
	while(!win->connection_is_disabled) {
	
	    //cout << "Draw loop begin (" << (win->pixel_format == B_CMAP8 ? true : false) << ")\n";
	
	    win->locker->Lock();
	    
	    if(win->is_connected) {
  	        if((win->pixel_format == B_CMAP8 | true) && win->is_dirty) {
	    	    
	            int32 y;
	  	        int32 width;
		        int32 height;
	    	    int32 adder;
	            uint8* p;
	        	clipping_rect* clip;
		        int32 i;
	        
		        adder = win->row_bytes;
	        
		        for(i = 0; i < win->clip_count; i++) {
	        	
		        	clip = &(win->clip_list[i]);
	    	    	width = (clip->right - clip->left) + 1;
	        		height = (clip->bottom - clip->top) + 1;
	        		p = win->bits + (clip->top * win->row_bytes) + (clip->left * 4);
		        	y = 0;
	        	
		        	while(y < height) {
	        		
	        		    //HERE: Switch memset to blank to memcpy from user buf
	        		    //memcpy(clip_list, info->clip_list, clip_count * sizeof(clipping_rect));
	    	    		memset(p, 0x00, width * 4);
	        			y++;
	        			p += adder;
	        		}
	        	}
	    	}
	    
	    	win->is_dirty = false;
		}
	
		win->locker->Unlock();
		snooze(16000);
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
