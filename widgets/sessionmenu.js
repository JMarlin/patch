function SessionMenu(core, x, y) {

    var module_names = core.list_modules();

    var that = new Frame(x, y, 200, (24 * module_names.length) + 6);

    //Doing this just until we have actual sub-windows
    var old_paint = that.paint;

    that.paint = function(ctx) {

        //Draw the basic frame
        old_paint(ctx);
        
        //Draw module names over it
        module_names.forEach(function(name, i) {
        
            ctx.font = '20px sans-serif';
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillText(name, 5, (i*24) + 23);
        });
    };

    return that;
}
