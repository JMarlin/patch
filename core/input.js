function Input(patch, x, y) {
 
    var that = new WinObj(x - 3, y - 3, 6, 6);

    that.paint = function(ctx) {

        ctx.fillStyle = 'rgb(100, 100, 100)'
        ctx.fillRect(0, 0, 6, 6);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.strokeRect(1, 1, 4, 4);
    };

    that.onmousedown = function(x, y) {

        patch.begin_connection(that);
    };

    return that;
}