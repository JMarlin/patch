function Unit(patch) {

    var that = new Frame(0, 0, 100, 100);
    
    that.patch = patch;
    that.inputs = [];

    //Move to frame class
    that.resize = function(w, h) {

        that.width = w;
        that.height = h;
        if(that.invalidate) that.invalidate();
    };

    that.create_input = function(x, y) {

        var input = new Input(patch, x, y);

        that.inputs.push(input);        
        that.add_child(input);

        return input;
    };

    return that;
}
