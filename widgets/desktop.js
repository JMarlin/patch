function Desktop(core) {

    var that = new Frame(0, 0, window.innerWidth, window.innerHeight),
        start_io = null;

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
    };

    that.paint = function(ctx) {

        ctx.fillStyle = that.bgcolor;
        ctx.fillRect(0, 0, that.width, that.height); 
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif'; 
        ctx.fillText('PATCH Build Number ' + BUILDNO, 5, that.height - 6);

        //Set up wire stroke properties
        ctx.strokeWidth = '2px';
        ctx.strokeStyle = 'black';

        if(start_io) {

            ctx.beginPath();
            ctx.moveTo(start_io.x + start_io.parent_unit.x, start_io.y + start_io.parent_unit.y);
            ctx.lineTo(wire_x, wire_y);
            ctx.stroke();
        }

        var wires = core.get_wires();

        wires.forEach(function(wire) {

            ctx.beginPath();
            ctx.moveTo(wire.x1, wire.y1);
            ctx.lineTo(wire.x2, wire.y2);
            ctx.stroke();
        });
    };

    that.begin_connection = function(io) {
    
        start_io = io;
    };

    that.end_connection = function() {
    
        start_io = null;
    };

    that.onmousemove = function(x, y) {
    
        if(!start_io)
            return;

        wire_x = x;
        wire_y = y;
        that.invalidate();
    };

    return that;
}
