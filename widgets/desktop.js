function Desktop(core) {

    var that = new Frame(0, 0, window.innerWidth, window.innerHeight),
        start_io = null;

    that.wire_x = 0;
    that.wire_y = 0;
    that.suppress_drag = true;
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
            that.add_child(that.menu); 
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
            ctx.moveTo(start_io.x + start_io.parent.x + 3, start_io.y + start_io.parent.y + 3);
            ctx.lineTo(that.wire_x, that.wire_y);
            ctx.stroke();
        }

        core.inputs.forEach(function(input) {
            
            if(input.connected_output) {

                ctx.beginPath();
                ctx.moveTo(input.screen_x(), input.screen_y());
                ctx.lineTo(input.connected_output.screen_x(), input.connected_output.screen_y());
                ctx.stroke();
            }
        });
    };

    that.connect_action = function(io) {

        if(start_io)
            that.finish_connection(io);
        else
            that.begin_connection(io);
    };

    that.begin_connection = function(io) {
    
        start_io = io;
    };

    that.finish_connection = function(io) {

        if(start_io !== null) {

            //Guard against input-to-input and output-to-output
            if(start_io.is_input === io.is_input)
                return;

            start_io.connect(io);
            io.connect(start_io);
            start_io = null;
            that.invalidate();
        }
    }

    that.end_connection = function() {
    
        start_io = null;
    };

    that.onmousemove = function(x, y) {
    
        if(!start_io)
            return;

        that.wire_x = x;
        that.wire_y = y;
        that.invalidate();
    };

    return that;
}
