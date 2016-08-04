function Frame(x, y, width, height) {

    var that = this;

    that.x = x;
    that.y = y;
    that.width = width;
    that.height = height;
    that.parent = null;

    that.onmousedown = function(x, y) {
 
        this.dragged = true;
        this.drag_x = x;
        this.drag_y = y;
    };

    that.onmouseup = function(x, y) {
    
        this.dragged = false;
    };

    that.onmousemove = function(x, y) {

        if(this.dragged === true) {

            this.move(
                (this.x + x) - this.drag_x,
                (this.y + y) - this.drag_y
            ); 
        }
    };

    that.paint = function(ctx) {

        var gradient = ctx.createLinearGradient(0, 2, 0, that.height - 4);
        gradient.addColorStop(0, 'rgb(225, 235, 255)');
        gradient.addColorStop(1, 'rgb(155, 165, 185)');

        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = gradient;
        ctx.fillRect(2, 2, that.width - 4, that.height - 4);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.strokeRect(1, 1, that.width - 2, that.height - 2);
    };
}
