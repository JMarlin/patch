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

        var gradient = context.createLinearGradient(0, 2, 0, that.height - 4);
        context.addColorStop(0, 'rgb(155, 165, 185)');
        context.addColorStop(1, 'rgb(225, 235, 255)');

        context.imageSmoothingEnabled = false;
        context.fillStyle = gradient;
        context.fillRect(0, 0, that.width, that.height);

        context.fillStyle = 'rgb(100, 100, 100)'
        context.fillRect((width / 2) - 3, 0, 5, height);
        context.lineWidth = 2;
        context.strokeStyle = 'rgb(0, 0, 0)';
        context.fillRect((width / 2) - 3, 1, 5, height - 2);
    };

    

    return that;
}