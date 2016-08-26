function Slider(x, y, width, height, min, max) {

    var that = new WinObj(x, y, width, height),
        knob = new Frame(0, 0, width, 10);


    Object.defineProperty(that, 'value', {
        get: function() {
            return that.calculate_value();
        },
        set: function(new_value) {
            that.set_value(new_value);
        }
    });

    that.calculate_value = function() {

        var ratio = 1.0 - (knob.y / (height - 10));
        
        return (ratio * (max - min)) + min;
    };

    that.set_value = function(new_value) {

        if(new_value > max)
            new_value = max;

        if(new_value < min)
            new_value = min;

        var ratio = (new_value - min) / (max - min),
            new_y = Math.ceil((1 - ratio) / (height - 10));

        console.log("value: " + new_value + ", r: " + ratio + ", y: " + new_y);

        knob.move(0, new_y);
    };

    knob.onmousemove = function(x, y) {

        if(knob.dragged === true) {

            var new_y = (knob.y + y) - knob.drag_y;

            if(new_y < 0)
                new_y = 0;
            
            if(knob.y > (height - 10))
                new_y = height - 10;

            knob.move(
                0,
                new_y
            );
        }
    };

    that.add_child(knob);

    that.paint = function(context) {

        var gradient = context.createLinearGradient(0, 2, 0, that.height - 4);
        gradient.addColorStop(0, 'rgb(155, 165, 185)');
        gradient.addColorStop(1, 'rgb(225, 235, 255)');

        context.imageSmoothingEnabled = false;
        context.fillStyle = gradient;
        context.fillRect(0, 0, that.width, that.height);

        context.fillStyle = 'rgb(100, 100, 100)'
        context.fillRect((width / 2) - 3, 3, 5, height-6);
        context.lineWidth = 2;
        context.strokeStyle = 'rgb(0, 0, 0)';
        context.strokeRect((width / 2) - 3, 4, 5, height - 8);
    };

    

    return that;
}