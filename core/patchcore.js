function PatchCore() {

    var that    = this,
        manager = null,
        modules = {};

    that.install_module = function(module) {

        modules[module.name] = module.constructor;
    };

    that.start = function() {

        that.install_module({
            name: 'Sine VCO',
            constructor: function() {}
        });
        that.install_module({
            name: 'Square VCO',
            constructor: function() {}
        });
        manager = new UIManager();
        manager.add_child(new Desktop(that));
    };

    that.list_modules = function() {

        return Object.keys(modules);
    }

    that.instantiate_module = function(name) {

        //TODO: Make sure that passing a name that's not in
        //      the module list won't blow things up
        return new modules[name]();
    } 
}
