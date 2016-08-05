function PatchCore() {

    var that    = this,
        manager = null,
        modules = {},
        sources = [];

    that.install_module = function(module) {

        modules[module.name] = module.constructor;
    };

    that.next_spawn_x() {

        return 0;
    };

    that.next_spawn_y() {

        return 0;
    };

    that.start = function() {

        that.install_module(new Output()); //TODO: This will be replaced by the loading of default modules from a list
        manager = new UIManager();
        manager.add_child(new Desktop(that));
    };

    that.add_source = function(source) {

        sources.push(source);
    };   

    that.list_modules = function() {

        return Object.keys(modules);
    };

    that.create_unit() {

        return new Unit(that);
    };

    that.instantiate_module = function(name) {

        //TODO: Make sure that passing a name that's not in
        //      the module list won't blow things up
        return new modules[name](that);
    };
}
