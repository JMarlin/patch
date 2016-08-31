function Square() {

    this.name = 'Square';

    this.constructor = function(patch) {

        var that = new Unit(patch);
        var output = that.create_output(195, 75);
        var input = that.create_input(5, 75);
        var pulls = 0;
        var phase = 0;
        var sample = 0;

        that.resize(200, 150);

        output.pull_right_sample = function() {

            return pull_function();        
        }

        output.pull_left_sample = function() {

            return pull_function();
        }

        function pull_function() {

            if(pulls === 0) {
 
                sample = phase > Math.PI ? 1.0 : -1.0;
                var in_sample = input.pull_left_sample();
                phase = (phase + (in_sample ? (((2*Math.PI) * in_sample)/44100) : 0)) % (2*Math.PI);  
 
                pulls++;
            } else {

                input.pull_right_sample();
                pulls = 0;
            }

            return sample;
        }

        return that;
    }
}