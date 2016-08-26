function Output() {

    this.name = 'Output';

    this.constructor = function(patch) {

        var that = new Unit(patch);
        var slider = new Slider(10, 10, 30, 130, 0, 1);

        that.old_mouseup = that.onmouseup;
        that.onmouseup = function() {
        
            slider.value = 0.5;
            that.old_mouseup();
        };

        that.add_child(slider);
        that.resize(200, 150);

        var input = that.create_input(5, 75);

        patch.add_source(input);

        return that;
    }
}
