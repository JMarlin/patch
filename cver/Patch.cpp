// Patch.cpp : Defines the entry point for the application.
//

#include "stdafx.h"
#include "Patch.h"
#include "core/patchcore.h"

#define MAX_LOADSTRING 100

// Global Variables:
HINSTANCE hInst;                                // current instance
WCHAR szTitle[MAX_LOADSTRING];                  // The title bar text
WCHAR szWindowClass[MAX_LOADSTRING];            // the main window class name

// Forward declarations of functions included in this code module:
ATOM                MyRegisterClass(HINSTANCE hInstance);
BOOL                InitInstance(HINSTANCE, int);
LRESULT CALLBACK    WndProc(HWND, UINT, WPARAM, LPARAM);
INT_PTR CALLBACK    About(HWND, UINT, WPARAM, LPARAM);

//Global values for PlatformWrapper
HBITMAP fb_bitmap;

extern "C" {

	extern unsigned char* fb_buffer;
	extern void PlatformWrapper_do_mouse_callback(uint16_t mouse_x, uint16_t mouse_y, uint8_t buttons);
}

HDC fb_dc;

int APIENTRY wWinMain(_In_ HINSTANCE hInstance,
                     _In_opt_ HINSTANCE hPrevInstance,
                     _In_ LPWSTR    lpCmdLine,
                     _In_ int       nCmdShow)
{
    UNREFERENCED_PARAMETER(hPrevInstance);
    UNREFERENCED_PARAMETER(lpCmdLine);

    // Initialize global strings
    LoadStringW(hInstance, IDS_APP_TITLE, szTitle, MAX_LOADSTRING);
    LoadStringW(hInstance, IDC_PATCH, szWindowClass, MAX_LOADSTRING);
    MyRegisterClass(hInstance);

    // Perform application initialization:
    if (!InitInstance (hInstance, nCmdShow))
    {
        return FALSE;
    }

    HACCEL hAccelTable = LoadAccelerators(hInstance, MAKEINTRESOURCE(IDC_PATCH));

    MSG msg;

    // Main message loop:
    while (GetMessage(&msg, nullptr, 0, 0))
    {
        if (!TranslateAccelerator(msg.hwnd, hAccelTable, &msg))
        {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
    }

    return (int) msg.wParam;
}



//
//  FUNCTION: MyRegisterClass()
//
//  PURPOSE: Registers the window class.
//
ATOM MyRegisterClass(HINSTANCE hInstance)
{
    WNDCLASSEXW wcex;

    wcex.cbSize = sizeof(WNDCLASSEX);

    wcex.style          = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc    = WndProc;
    wcex.cbClsExtra     = 0;
    wcex.cbWndExtra     = 0;
    wcex.hInstance      = hInstance;
    wcex.hIcon          = LoadIcon(hInstance, MAKEINTRESOURCE(IDI_PATCH));
    wcex.hCursor        = LoadCursor(nullptr, IDC_ARROW);
    wcex.hbrBackground  = (HBRUSH)(COLOR_WINDOW+1);
	wcex.lpszMenuName   = NULL;
    wcex.lpszClassName  = szWindowClass;
    wcex.hIconSm        = LoadIcon(wcex.hInstance, MAKEINTRESOURCE(IDI_SMALL));

    return RegisterClassExW(&wcex);
}

//
//   FUNCTION: InitInstance(HINSTANCE, int)
//
//   PURPOSE: Saves instance handle and creates main window
//
//   COMMENTS:
//
//        In this function, we save the instance handle in a global variable and
//        create and display the main program window.
//
BOOL InitInstance(HINSTANCE hInstance, int nCmdShow)
{
   hInst = hInstance; // Store instance handle in our global variable

   RECT rcClient, rcWindow;
   POINT ptDiff;
   
   HWND hWnd = CreateWindowW(szWindowClass, szTitle, WS_OVERLAPPEDWINDOW,
      CW_USEDEFAULT, 0, 640, 480, nullptr, nullptr, hInstance, nullptr);

   if (!hWnd)
   {
      return FALSE;
   }

   GetClientRect(hWnd, &rcClient);
   GetWindowRect(hWnd, &rcWindow);
   ptDiff.x = (rcWindow.right - rcWindow.left) - rcClient.right;
   ptDiff.y = (rcWindow.bottom - rcWindow.top) - rcClient.bottom;

   MoveWindow(hWnd, rcWindow.left, rcWindow.top, 640 + ptDiff.x, 480 + ptDiff.y, TRUE);

   ShowWindow(hWnd, nCmdShow);
   UpdateWindow(hWnd);

   //Create an application-writable bitmap
   BITMAPINFO bitmap_info;
   HDC hdc = GetDC(hWnd);
   fb_dc = CreateCompatibleDC(hdc);

   //Set the initial bitmap format
   bitmap_info.bmiHeader.biSize = sizeof(bitmap_info);
   bitmap_info.bmiHeader.biWidth = 640; //These need to default to the initial window size
   bitmap_info.bmiHeader.biHeight = -480;
   bitmap_info.bmiHeader.biPlanes = 1;
   bitmap_info.bmiHeader.biBitCount = 32;
   bitmap_info.bmiHeader.biCompression = BI_RGB;
   bitmap_info.bmiHeader.biSizeImage = ((640 * (bitmap_info.bmiHeader.biBitCount / 8) + 3) & -4) * 480;

   //Generate the bitmap
   fb_bitmap = CreateDIBSection(fb_dc, &bitmap_info, DIB_RGB_COLORS, (VOID**)&fb_buffer, 0, 0);

   if (!fb_bitmap)
	   MessageBox(hWnd, L"ERROR CREATING BITMAP", L"ERROR", MB_OK);

   int i;
   DWORD32* pixel = (DWORD32*)fb_buffer;
   for (i = 0; i < (640 * 480); i++)
	   pixel[i] = 0xFFFF0000;

   // TODO: Place code here.
   PatchCore_start(PatchCore_new());

   HBITMAP bitmap_old = (HBITMAP)SelectObject(fb_dc, fb_bitmap);
   BitBlt(hdc, 0, 0, 640, 480, fb_dc, 0, 0, SRCCOPY);
   SelectObject(hdc, bitmap_old);

   return TRUE;
}

//
//  FUNCTION: WndProc(HWND, UINT, WPARAM, LPARAM)
//
//  PURPOSE:  Processes messages for the main window.
//
//  WM_COMMAND  - process the application menu
//  WM_PAINT    - Paint the main window
//  WM_DESTROY  - post a quit message and return
//
//
LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
{
    switch (message)
    {

		case WM_COMMAND:
			{
				int wmId = LOWORD(wParam);
				// Parse the menu selections:
				switch (wmId)
				{
					case IDM_EXIT:
						DestroyWindow(hWnd);
						break;
					default:
						return DefWindowProc(hWnd, message, wParam, lParam);
				}
			}
			break;
        
		case WM_LBUTTONDOWN:
		case WM_LBUTTONUP:
		case WM_RBUTTONDOWN:
		case WM_RBUTTONUP:
		case WM_MBUTTONDOWN:
		case WM_MBUTTONUP:
		case WM_MOUSEMOVE:
			{
				PlatformWrapper_do_mouse_callback(LOWORD(lParam), HIWORD(lParam), wParam & (MK_LBUTTON | MK_MBUTTON | MK_RBUTTON));
				InvalidateRect(hWnd, NULL, FALSE);
			}
			break;

		case WM_PAINT:
			{
				if (!fb_buffer)
					break;

				PAINTSTRUCT ps;
				HDC hdc = BeginPaint(hWnd, &ps);

				HBITMAP bitmap_old = (HBITMAP)SelectObject(fb_dc, fb_bitmap);
				BitBlt(hdc, 0, 0, 640, 480, fb_dc, 0, 0, SRCCOPY);
				SelectObject(fb_dc, bitmap_old);

				EndPaint(hWnd, &ps);
				ReleaseDC(hWnd, hdc);
			}
			break;

		case WM_DESTROY:
			PostQuitMessage(0);
			break;

		default:
			return DefWindowProc(hWnd, message, wParam, lParam);
    }

    return 0;
}

