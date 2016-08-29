function Output() {

    this.name = 'Output';

    this.constructor = function(patch) {

        var that = new Unit(patch);
        var slider = new Slider(10, 10, 30, 130, 0, 1);

        that.add_child(slider);
        that.resize(200, 150);

        var input = that.create_input(5, 75);
 
        function db2gain(value) {

            var max_db = 10;
            var min_db = -80;

            var db_value = ((max_db - min_db) * value) - min_db;
            var gain_value = (Math.pow(10,(db_value/20)) - Math.pow(10,(min_db/20))) / (1 - Math.pow(10, (min_db/20)));

            console.log("val: " + value + ", db: " + db_value + ", gain: " + gain_value);

            return gain_value;
        }

        //Need to create a 'source' object
        patch.add_source({
            pull_right_sample: function() {

                return ((Math.random() * 2) - 1) * db2gain(slider.value);
            },
            pull_left_sample: function() {

                return ((Math.random() * 2) - 1) * db2gain(slider.value);
            }
        });

        return that;
    }
}
