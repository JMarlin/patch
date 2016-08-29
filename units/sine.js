function Sine() {

    this.name = 'Sine';

    this.constructor = function(patch) {

        var that = new Unit(patch);
        var output = that.create_output(195, 75);
        var freq = 220;
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
 
                sample = Math.sin(phase);
                phase += (2*Math.PI) / freq; 
 
                pulls++;
            } else {

                pulls = 0;
            }

            return sample;
        }

        return that;
    }
}