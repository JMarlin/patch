function MenuEntry(text, click_action) {

    var that = this;

    that.text = text;
    that.x = 0;
    that.y = 0;

    that.paint = function(ctx) {

        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillText(that.text, that.x, that.y);
    }

    that.onmousedown = function(x, y) {

        click_action();
    }
}