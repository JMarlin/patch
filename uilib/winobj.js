function WinObj(x, y, width, height) {

    var that = this;

    that.x = x;
    that.y = y;
    that.width = width;
    that.height = height;

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
                }
 
                if(e.type === "mousedown") {
           
                    if(that.children[that.children.length - 1] !== child && child.suppress_raise !== true) {

                        //This needs to be genericized into a widget.raise method
                        that.children.splice(i, 1);
                        that.children.push(child);
                        that.paint_child(child);
                    }
                }

                child.mouse_handler({
                    clientX: e.clientX - child.x,
                    clientY: e.clientY - child.y,
                    type:    e.type
                });

                break;
            }
        }

        if(i === -1) {

            if(that['on' + e.type])
                that['on' + e.type](e.clientX, e.clientY);
        }
    };

    that.children = [];

    that.ongfxresize = function(w, h) {

        that.children.forEach(function(child) {
        
            if(child.ongfxresize) 
                child.ongfxresize(w, h);

            child.invalidate();
        });
    };

    that.mouse_in_child = null;

    that.screen_x = function() {

        if(that.parent)
            return that.x + that.parent.screen_x();
        else
            return that.x;
    };

    that.screen_y = function() {
 
        if(that.parent)
            return that.y + that.parent.screen_y();
        else
            return that.y;
    };

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

        child.clip.init_clip();
        child.context.save();
        child.clip.apply_clip();

        if(child.paint)
            child.paint(child.context);

        that.context.restore();        
    }    

    //Fired when a child decalres that its content needs
    //to be redrawn. At the moment just calls the window
    //paint method, but should do some housekeeping things
    //in the future
    that.invalidate_child = function(child) {
    
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

    that.init = function(context) {

        //Inherit the passed context and do initial draw
        that.context = context;
        that.invalidate();
 
        //Do the same for any attached children
        for(var i = 0; i < that.children.length; i++) 
            if(that.children[i].init) that.children[i].init(context);
    };

    that.add_child = function(child) {

        that.children.push(child);
        child.parent = that;  
        child.visible = true;
        child.clip = new DrawingContext(child);
        child.invalidate = function() { that.invalidate_child(child); };
        child.move = function(x, y) { that.move_child(child, x, y); };
        child.destroy = function(x, y) { that.destroy_child(child); };        
        child.hide = function() { that.hide_child(child); };

        if(that.context === undefined)
            return;

        //If we are attached to a context, give it to the new child
        //and any of its children and do their initial draws
        if(child.init) 
            child.init(that.context);
    }
}

    
