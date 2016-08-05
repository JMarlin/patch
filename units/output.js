function Output() {

    this.name = 'Output';
    
    this.constructor = function(application) {

        var that = new Unit();

        that.resize(200, 150);

        var input = that.create_input(5, 75);

        application.add_source(input);
 
        return that;
    }
}
