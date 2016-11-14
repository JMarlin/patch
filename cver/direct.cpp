#include <iostream>
#include <Application.h>
#include <Screen.h>
#include <DirectWindow.h>

class JApplication : public BApplication {
    
    public:
    
        JApplication() : BApplication("application/japp") {
        
            cout << "JApplication started\n";
        }
        
        ~JApplication() {
        
            cout << "JApplication shutdown\n";
        }
        
        void MessageReceived(BMessage* message) {
        
            switch( message->what ) {
            
                default:
                   cout << message->what << "\n";
                   BApplication::MessageReceived(message);
                   break;
            }
        }
};

class JWindow : public BDirectWindow {

    public:
    
        JWindow(BRect frame, const char* title, window_look look,
                window_feel feel, uint32 flags,
                uint32 workspaces = B_CURRENT_WORKSPACE) :
                    BDirectWindow(frame, title, look, feel, flags, workspaces) {}
    
        void DirectConnected(direct_buffer_info* info) {
        
            cout << "Connection made\n";
        }
    
        void MessageReceived(BMessage* message) {
        
            switch( message->what ) {
            
                default:
                   cout << message->what << "\n";
                   BWindow::MessageReceived(message);
                   break;
            }
        }
};

int main(int argc, char* argv[]) {

    JApplication* j_app;
    BRect b_rect;
    JWindow* j_win;
    
    b_rect.left = 50;
    b_rect.top = 50;
    b_rect.right = 350;
    b_rect.bottom = 350;
    
    j_app = new JApplication();
    j_win = new JWindow(b_rect, "JApplication", 
                        B_TITLED_WINDOW_LOOK, B_NORMAL_WINDOW_FEEL, 0, B_CURRENT_WORKSPACE);
                        
    j_win->Show();                    
    
    j_app->Run();
    
    delete j_app;
    delete j_win;

    return 0;
}
