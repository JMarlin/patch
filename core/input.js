function Input(patch, x, y) {
 
    var that = new WinObj(x - 3, y - 3, 6, 6);

    that.paint = function(ctx) {

        ctx.strokeRect(1, 1, 4, 4);
    };

    that.onmousedown = function(x, y) {

        patch.begin_connection(that);
    };

    return that;
}