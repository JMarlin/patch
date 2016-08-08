function Menu(x, y, width) {

    var that    = new Frame(x, y, width, 4),
        entries = [];

    //Replace when we have real sub windows
    that.old_paint = that.paint;

    that.paint = function(ctx) {

        that.old_paint();

        entries.forEach(function(entry) {

            entry.paint(ctx);
        });
    };

    that.add_entry = function(entry) {
 
        //This is dumb, because this would already be taken
        //care of if we just made windows sub-instances of the
        //ui manager class already
        entry.parent = that;
        entries.push[entry];

        that.height += 14;
    };

    return that;
}