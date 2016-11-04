#include "platform/platformwrapper.h"
#include "core/patchcore.h"

int main(int argc, char* argv[]) {

    PlatformWrapper_init();
    PatchCore_start(PatchCore_new());

    PlatformWrapper_hold_for_exit();

    return 0;
}