function Slider(x, y, width, height) {

    var that = new WinObj(x, y, width, height),
        knob = new Frame(0, 0, width, 10);

    knob.onmousemove = function(x, y) {

        if(knob.dragged === true) {

            knob.move(
                (knob.x + x) - knob.drag_x,
                0
            );
        }
    };

    that.add_child(knob);

    that.paint = function(context) {

        ctx.fillStyle = 'rgb(60, 60, 60)'
        context.fillRect((width / 2) - 3, 0, 5, height);
        context.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        context.fillRect((width / 2) - 3, 1, 5, height - 2);
    };

    

    return that;
}