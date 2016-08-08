function SessionMenu(patch, x, y) {

    var module_names = patch.list_modules();

    var that = new Menu(x, y, 200);

    module_names.forEach(function(name, i) {
    
        var entry = new MenuEntry(name, function(){});
        entry.x = 2;
        entry.y = (i * 13) + 1;
        that.add_entry(new MenuEntry())
    });

    that.onmousedown = function(x, y) {

        //Another fake until we have sub-widgets which would each handle their own clicking
        patch.instantiate_module(module_names[0]);
        that.destroy();
    };

    return that;
}
