function PatchCore() {

    var that    = this,
        manager = null,
        modules = {},
        sources = [];

    that.install_module = function(module) {

        modules[module.name] = module.constructor;
    };

    that.next_spawn_x = function() {

        return 0;
    };

    that.next_spawn_y = function() {

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

    that.instantiate_module = function(name) {

        //TODO: Make sure that passing a name that's not in
        //      the module list won't blow things up
        var mod = new modules[name](that);
        mod.x = that.next_spawn_x();
        mod.y = that.next_spawn_y();
        manager.add_child(mod);
    };
}
