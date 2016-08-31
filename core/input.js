function Input(patch, x, y) {
 
    var that = new WinObj(x - 3, y - 3, 6, 6);

    that.connected_output = null;

    that.paint = function(ctx) {

        ctx.fillStyle = 'rgb(100, 100, 100)'
        ctx.fillRect(0, 0, 6, 6);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.strokeRect(1, 1, 4, 4);
    };

    that.onmousedown = function(x, y) {

        if(that.connected_output) {
        
            that.connected_output.connected_input = null;
            that.connected_output = null;
        }

        patch.connect_action(that);
    };

    that.connect = function(output) {

        that.connected_output = output;
    }

    that.pull_right_sample = function() {

        if(that.connected_output !== null)
            return that.connected_output.pull_right_sample();
        else
            return 0.0;
    }

    that.pull_left_sample = function() {

        if(that.connected_output !== null)
            return that.connected_output.pull_left_sample();
        else
            return 0.0;
    }

    return that;
}