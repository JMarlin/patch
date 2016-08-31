function Frame(x, y, width, height) {

    var that = new WinObj(x, y, width, height);

    that.suppress_drag = false;

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

    return that;
}
