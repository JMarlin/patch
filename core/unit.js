function Unit(application) {

    var that      = this,
        frame     = new Frame(application.next_spawn_x(), application.next_spawn_y(), 100, 100);
    
    that.inputs = [];

    frame.old_paint = frame.paint;

    application.uimanager.add_widget(frame);

    frame.paint = function(ctx) {

        frame.old_paint(ctx);

        ctx.strokeWidth = '2px';
        ctx.strokeStyle = 'black';

        that.inputs.forEach(function(input) {
 
            ctx.strokeRect(input.x - 2, input.y - 2, 4, 4);
        });
    };

    that.resize = function(w, h) {

        frame.width = w;
        frame.height = h;
        frame.invalidate();
    };

    that.create_input = function(x, y) {

        var input = {x: x, y: y}; //Should make a proper class some time

        //Need to actually add a sub-widget to the frame
        that.inputs.push(input);        

        return input;
    };
}
