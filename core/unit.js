function Unit() {

    var that = new Frame(0, 0, 100, 100);
    
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

    that.create_input = function(x, y) {

        var input = {x: x, y: y}; //Should make a proper class some time

        //Need to actually add a sub-widget to the frame
        that.inputs.push(input);        

        return input;
    };

    return that;
}
