function Output() {

    this.name = 'Output';
    
    this.constructor = function(application) {

        var that = application.create_unit();

        that.resize(200, 150);

        var in = that.create_input(5, 75);

        application.add_source(in);
 
        return that;
    }
}
