function Noise() {

    this.name = 'Noise';

    this.constructor = function(patch) {

        var that = new Unit(patch);
        var output = that.create_output(195, 75);

        that.resize(200, 150);

        output.pull_right_sample = function() {

            return ((Math.random() * 2) - 1);
        }

        output.pull_left_sample = function() {

            return ((Math.random() * 2) - 1);
        }

        return that;
    }
}