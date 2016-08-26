function Output() {

    this.name = 'Output';

    this.constructor = function(patch) {

        var that = new Unit(patch);
        var slider = new Slider(10, 10, 30, 130, 0, 1);

        that.add_child(slider);
        that.resize(200, 150);

        var input = that.create_input(5, 75);
 
        //Need to create a 'source' object
        patch.add_source({
            pull_right_sample: function() {

                return ((Math.random() * 2) - 1) * slider.value;
            },
            pull_left_sample: function() {

                return ((Math.random() * 2) - 1) * slider.value;
            }
        });

        return that;
    }
}
