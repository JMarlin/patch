function Output(patch, x, y) {
 
    var that = new WinObj(x - 3, y - 3, 6, 6);

    that.connected_input = null;
    that.is_input = false;

    that.paint = function(ctx) {

        ctx.fillStyle = 'rgb(100, 100, 100)'
        ctx.fillRect(0, 0, 6, 6);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.strokeRect(1, 1, 4, 4);
    };

    that.onmousedown = function(x, y) {

        if(that.connected_input) {
        
            that.connected_input.connected_output = null;
            that.connected_input = null;
        }

        patch.connect_action(that);
    };

    that.connect = function(input) {

        that.connected_input = input;
    }

    //To be overridden by the owning unit
    that.pull_right_sample = function() {

        return 0.0;
    }

    that.pull_left_sample = function() {

        return 0.0;
    }

    return that;
}