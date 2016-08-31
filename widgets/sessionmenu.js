function SessionMenu(patch, x, y) {

    var module_names = patch.list_modules();

    var that = new Menu(x, y, 200);

    module_names.forEach(function(name, i) {
    
        that.add_entry(new MenuEntry(name, function(){}));
    });

    that.onmousedown = function(x, y) {

        //Another fake until we have sub-widgets which would each handle their own clicking
        patch.instantiate_module(module_names[Math.floor(y/14)]);
        patch.destroy_menu();
    };

    return that;
}
