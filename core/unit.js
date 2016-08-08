function Unit(patch) {

    var that = new Frame(0, 0, 100, 100);
    
    that.patch = patch;
    that.inputs = [];

    that.old_paint = that.paint;

    that.paint = function(ctx) {

        that.old_paint(ctx);

        ctx.strokeWidth = '2px';
        ctx.strokeStyle = 'black';

        that.inputs.forEach(function(input) {
 
            ctx.strokeRect(input.x - 2, input.y - 2, 4, 4);
        });
    };

    //Move to frame class
    that.resize = function(w, h) {

        that.width = w;
        that.height = h;
        if(that.invalidate) that.invalidate();
    };

    that.old_onmousedown = that.onmousedown;

    that.onmousedown = function(x, y) {

        var clicked = false;

        //This should be replaced when we have actual sub-windowing
        that.inputs.forEach(function(input) {
        
            if(clicked)
                return;

            if(x >= input.x - 2 &&
               x < input.x + 3 &&
               y >= input.y - 2 &&
               y < input.y + 3) {
 
                clicked = true;
                alert("input clicked");
            }
        });

        if(clicked)
            return;

        that.old_onmousedown(x, y);
    }

    that.create_input = function(x, y) {

        var input = new Input(that, x, y);

        //Need to actually add a sub-widget to the frame
        that.inputs.push(input);        

        return input;
    };

    return that;
}
