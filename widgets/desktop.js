function Desktop(core) {

    var that = new Frame(0, 0, window.innerWidth, window.innerHeight);

    that.suppress_raise = true;
    that.bgcolor = 'rgb(90, 95, 210)';
    that.menu = null;

    that.ongfxresize = function(width, height) {

        that.width = width;
        that.height = height;
    };

    that.onmousedown = function(x, y) {

        if(that.menu) {

            that.menu.destroy();
            that.menu = null;
        } else {

            that.menu = new SessionMenu(core, x, y);
            that.parent.add_child(that.menu); //Should really add this as a child of Desktop when we've written the capacity for sub-windows (which is how we'll do actual widgets and such)
        }
    }

    that.paint = function(ctx) {

        ctx.fillStyle = that.bgcolor;
        ctx.fillRect(0, 0, that.width, that.height); 
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif'; 
        ctx.fillText('PATCH Build Number ' + BUILDNO, 5, that.height - 6);
    }

    return that;
}
