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
        
        return (((knob.y - height + 10) * (max - min)) / (-(height - 10))) - min;
    };

    that.set_value = function(new_value) {

        if(new_value > max)
            new_value = max;

        if(new_value < min)
            new_value = min;

        var new_y = (((-(height - 10)) / (max - min)) * (new_value - min)) + (height - 10);

        knob.move(0, new_y);
    };

    knob.old_init = knob.init;
    knob.init = function(context) {

        knob.old_move = knob.move;
        knob.move = function(x, y) {

            if(y < 0)
                y = 0;

            if(y > (height - 10))
                y = height - 10;

            knob.old_move(0, y);
        };

        knob.old_init(context);
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