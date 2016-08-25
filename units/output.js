function Output() {

    this.name = 'Output';
    
    this.constructor = function(patch) {

        var that = new Unit(patch);
        var child = new Frame(100, 75, 200, 150);

        that.add_child(child);
        that.resize(200, 150);

        var input = that.create_input(5, 75);

        patch.add_source(input);
 
        return that;
    }
}
