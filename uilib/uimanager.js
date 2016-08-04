function UIManager() {

    var that = this;

    document.body.style.margin = "0px";
    that.canvas = document.createElement('canvas');
    that.context = that.canvas.getContext('2d');
    document.body.appendChild(that.canvas);

    window.addEventListener('resize', function(){
    
        that.do_resize();
    }, true);

    that.mouse_handler = function(e) {

        for(var i = that.children.length - 1; i > -1; i--) {
        
            var child = that.children[i];

            if(e.clientX >= child.x &&
               e.clientX < child.x + child.width &&
               e.clientY >= child.y &&
               e.clientY < child.y + child.height) {
                
                if(e.type === "mousemove") {
                
                    if(that.mouse_in_child !== child) {
                    
                        if(that.mouse_in_child && that.mouse_in_child.onmouseout)
                            that.mouse_in_child.onmouseout();

                        that.mouse_in_child = child;
                        
                        if(that.mouse_in_child.onmouseover)
                            that.mouse_in_child.onmouseover();
                    }

                    if(child.onmousemove)
                        child.onmousemove(e.clientX - child.x, e.clientY - child.y);
                }
 
                if(e.type === "mousedown") {
           
                    if(that.children[that.children.length - 1] !== child && child.suppress_raise !== true) {

                        //This needs to be genericized into a widget.raise method
                        that.children.splice(i, 1);
                        that.children.push(child);
                        that.paint_child(child);
                    }
                }

                if(child['on' + e.type])
                    child['on' + e.type](e.clientX - child.x, e.clientY - child.y);

                break;
            }
        };
    }

    that.canvas.onmousemove  = that.mouse_handler;
    that.canvas.onmousedown  = that.mouse_handler;
    that.canvas.onmouseup    = that.mouse_handler;
    that.canvas.onmouseclick = that.mouse_handler;

    that.children = [];

    that.do_resize = function() {

        that.canvas.width = window.innerWidth;
        that.canvas.height = window.innerHeight;
        
        that.children.forEach(function(child) {
        
            if(child.ongfxresize) 
                child.ongfxresize(that.canvas.width, that.canvas.height);

            child.invalidate();
        });
    };

    that.do_resize();

    that.mouse_in_child = null;

    that.children_below = function(child) {
    
        var return_group = [];
        var i = 0;

        //fast-forward to the selected child
        for(i = that.children.length - 1; i > -1; i--)
            if(that.children[i] === child)
                break;

        for(i--; i > -1; i--) {

            var target_widget = that.children[i];

            if(child.x <= (target_widget.x + target_widget.width) &&
               (child.x + child.width) >= target_widget.x &&
               child.y <= (target_widget.y + target_widget.height) &&
               (child.y + child.height) >= target_widget.y) 
                return_group.push(target_widget);
        }

        return return_group;
    }

    that.move_child = function(child, x, y) {

        that.children_below(child).forEach(function(target) {
            target.invalidate();
        });

        child.x = x;
        child.y = y;
        child.invalidate();
    }

    that.children_above = function(child) {

        var return_group = [];

        for(var i = that.children.length - 1; i > -1; i--) {

            if(that.children[i] === child)
                break;

            return_group.push(that.children[i]);
        }

        return return_group;
    }

    //Set up child context, do painting, reset context
    that.paint_child = function(child) {

        if(child.visible !== true)
            return;

        child.context.init_clip();
        that.context.save();
        child.context.apply_clip();

        if(child.paint)
            child.paint(that.context);

        that.context.restore();        
    }    

    //Fired when a child decalres that its content needs
    //to be redrawn. At the moment just calls the window
    //paint method, but should do some housekeeping things
    //in the future
    that.invalidate = function(child) {
    
        that.paint_child(child);
    }

    that.hide_child = function(child) {

        child.visible = false;
        
        that.children_below(child).forEach(function(target) {
 
            target.invalidate();
        });
    }

    that.destroy_child = function(child) {

        var i;
        
        for(i = 0; i < that.children.length; i++)
            if(that.children[i] === child)
                break;

        if(i == that.children.length)
            return;

        child.hide();
        that.children.splice(i, 1);
    }

    that.add_child = function(child) {

        child.visible = true;
        child.parent = that;
        that.children.push(child);  
        child.context = new DrawingContext(child);
        child.invalidate = function() { that.invalidate(child); };
        child.move = function(x, y) { that.move_child(child, x, y); };
        child.destroy = function(x, y) { that.destroy_child(child); };        
        child.hide = function() { that.hide_child(child); };

        that.paint_child(child);
    }
}

    
