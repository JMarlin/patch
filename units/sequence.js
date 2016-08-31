function Sequence() {

    this.name = 'Sequencer';

    this.constructor = function(patch) {

        var that = new Unit(patch);
        var step = [];
        var step_sample = []; 
        
        for(var i = 0; i < 8; i++) {

            step[i] = that.create_input(20*(i+1), 5);
            step_sample[i] = 0;
        }

        var clock_in = that.create_input(5, 75);
        var output = that.create_output(195, 75);
        var current_step = 0;
        var last_clock_sample = 0;
        var current_clock_sample = 0;

        that.resize(200, 150);

        output.pull_right_sample = function() {

            current_clock_sample = clock_in.pull_right_sample();

            if(current_clock_sample === 1.0 && last_clock_sample !== 1.0)
                current_step++;

            last_clock_sample = current_clock_sample;

            if(current_step === 8)
                current_step = 0;

            for(var i = 0; i < 8; i++)
                step_sample[i] = step[i].pull_right_sample();

            return step_sample[current_step];
        }

        output.pull_left_sample = function() {

            current_clock_sample = clock_in.pull_left_sample();

            if(current_clock_sample === 1.0 && last_clock_sample !== 1.0)
                current_step++;

            last_clock_sample = current_clock_sample;

            if(current_step === 8)
                current_step = 0;

            for(var i = 0; i < 8; i++)
                step_sample[i] = step[i].pull_left_sample();

            return step_sample[current_step];
        }

        return that;
    }
}