function PitchKnob() {

    this.name = 'Pitch Knob';

    this.constructor = function(patch) {

        var that = new Unit(patch);
        var slider = new Slider(10, 10, 30, 130, 0, 1);

        that.add_child(slider);
        that.resize(50, 150);

        var output = that.create_output(45, 75);

        output.pull_right_sample = function() {

            return pull_function();        
        }

        output.pull_left_sample = function() {

            return pull_function();
        }

        function pull_function() {

            return 55*(Math.pow(2, ((1 - slider.value)*4)));
        }

        return that;
    }
}
