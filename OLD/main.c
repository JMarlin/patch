#include "platform/platformwrapper.h"
#include "core/patchcore.h"

int main(int argc, char* argv[]) {

    PlatformWrapper platform_wrapper = PlatformWrapper_new();
    PatchCore* core = PatchCore_new(platform_wrapper);

    PatchCore_start(core);

    PlatformWrapper_hold_for_exit(platform_wrapper);

    return 0;
}