function Unit(patch) {

    var that = new Frame(0, 0, 100, 100);
    
    that.patch = patch;

    //Move to frame class
    that.resize = function(w, h) {

        that.width = w;
        that.height = h;
        if(that.invalidate) that.invalidate();
    };

    that.create_output = function(x, y) {

        var output = new Output(patch, x, y);

        that.add_child(output);

        return output;
    };

    that.create_input = function(x, y) {

        var input = new Input(patch, x, y);
     
        that.add_child(input);
        patch.inputs.push(input);

        return input;
    };

    return that;
}
