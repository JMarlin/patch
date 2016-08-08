function UIManager() {

    var that = new Window(0, 0, window.innerWidth, window.innerHeight);

    document.body.style.margin = "0px";
    that.canvas = document.createElement('canvas');
    that.context = that.canvas.getContext('2d');
    document.body.appendChild(that.canvas);

    window.addEventListener('resize', function(){
    
        that.ongfxresize();
    }, true);

    that.canvas.onmousemove  = that.mouse_handler;
    that.canvas.onmousedown  = that.mouse_handler;
    that.canvas.onmouseup    = that.mouse_handler;
    that.canvas.onmouseclick = that.mouse_handler;

    that.old_ongfxresize = that.ongfxresize;

    that.ongfxresize = function() {

        that.canvas.width = that.width = window.innerWidth;
        that.canvas.height = that.width = window.innerHeight;
        
        that.old_ongfxresize();
    };

    that.ongfxresize();

    return that;
}

    
