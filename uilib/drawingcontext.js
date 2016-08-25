function DrawingContext(target_widget) {

    var that = this;

    that.clip_paths = [];

    //This function uses clipper to determine a clipping
    //region based on the target widget's base rectangle
    //and the list of widgets overlapping it.
    that.init_clip = function(ignore_children) {

        if(!target_widget.parent)
            return;

        var clipper       = new ClipperLib.Clipper(),
            clipping_paths = [],
            clipped_paths = [];
        
        //Set the client rect as the subject polygon
        clipper.AddPath(
            [
                {X: target_widget.screen_x(), Y: target_widget.screen_y()},
                {X: target_widget.screen_x() + target_widget.width, Y: target_widget.screen_y()},
                {X: target_widget.screen_x() + target_widget.width, Y: target_widget.screen_y() + target_widget.height},
                {X: target_widget.screen_x(), Y: target_widget.screen_y() + target_widget.height}
            ],
            ClipperLib.PolyType.ptSubject,
            true
        ); 

        //If we have a parent clipper, clip the child rect to the parent's drawable region 
        if(target_widget.parent.clip) {
            
            target_widget.parent.clip.init_clip(true);

            clipper.AddPaths(target_widget.parent.clip.clip_paths, ClipperLib.PolyType.ptClip, true);
            clipper.Execute(ClipperLib.ClipType.ctIntersection, clipped_paths, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
            clipper = new ClipperLib.Clipper();
            clipper.AddPaths(clipped_paths, ClipperLib.PolyType.ptSubject, true);
        }

        //If we have children, punch out a hole for each visible child
        if(target_widget.children && (ignore_children !== true)) {

            target_widget.children.forEach(function(child) {

                clipper.AddPath(
                    [
                        {X: child.screen_x(), Y: child.screen_y()},
                        {X: child.screen_x() + child.width, Y: child.screen_y()},
                        {X: child.screen_x() + child.width, Y: child.screen_y() + child.height},
                        {X: child.screen_x(), Y: child.screen_y() + child.height}
                    ],
                    ClipperLib.PolyType.ptClip,
                    true
                );
                clipper.Execute(ClipperLib.ClipType.ctDifference, clipped_paths, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
                clipper = new ClipperLib.Clipper();
                clipper.AddPaths(clipped_paths, ClipperLib.PolyType.ptSubject, true);
            });
        }                

        //Get the list of overlapping widgets from the 
        //owning uimanager
        var overlap_widgets = target_widget.parent.children_above(target_widget);

        //Add the bounds of each overlapping widget to
        //the clipper as part of the clipping path
        overlap_widgets.forEach(function(widget) {
     
            if(widget.visible !== true)
                return;
            
            var temp_clipper = new ClipperLib.Clipper();      

            temp_clipper.AddPath(
                [
                    {X: widget.screen_x(), Y: widget.screen_y()},
                    {X: widget.screen_x() + widget.width, Y: widget.screen_y()},
                    {X: widget.screen_x() + widget.width, Y: widget.screen_y() + widget.height},
                    {X: widget.screen_x(), Y: widget.screen_y() + widget.height}
                ],
                ClipperLib.PolyType.ptSubject,
                true
            );

            temp_clipper.AddPaths(
                clipping_paths,
                ClipperLib.PolyType.ptClip,
                true
            );

            temp_clipper.Execute(
                ClipperLib.ClipType.ctUnion,
                clipping_paths,
                ClipperLib.PolyFillType.pftEvenOdd,
                ClipperLib.PolyFillType.pftEvenOdd
            );                
        });
        
        //With our paths entered, set the clipping mode and do the clip
        that.clip_paths = [];

        clipper.AddPaths(
            clipping_paths,
            ClipperLib.PolyType.ptClip,
            true
        );

        clipper.Execute(
            ClipperLib.ClipType.ctDifference,
            that.clip_paths,
            ClipperLib.PolyFillType.pftEvenOdd,
            ClipperLib.PolyFillType.pftEvenOdd
        );                             
    }

    //Applies the clipping path to the parent canvas and
    //sets the canvas transform so that 0, 0 is at the
    //upper lefthand corner of the widget
    that.apply_clip = function() {
 
        if(!target_widget.parent)
            return;
        
        //that.show_clip();  
   
        var ctx = target_widget.parent.context;

        ctx.beginPath();

        that.clip_paths.forEach(function(path) {
            
            for(var i = 0; i < path.length + 1; i += 1) {

                if(i === 0)
                    ctx.moveTo(path[i].X, path[i].Y);
                else
                    ctx.lineTo(path[i%path.length].X, path[i%path.length].Y);
            }
        });

        ctx.clip();
        ctx.translate(target_widget.x, target_widget.y);        
    }

    //Debug function to draw lines along the clip path
    that.show_clip = function() {

        var ctx = target_widget.parent.context;

        ctx.beginPath();

        that.clip_paths.forEach(function(path) {
            
            for(var i = 0; i < path.length + 1; i += 1) {

                if(i === 0)
                    ctx.moveTo(path[i].X, path[i].Y);
                else
                    ctx.lineTo(path[i%path.length].X, path[i%path.length].Y);
            }
        });

        ctx.strokeStyle = "#00FF00";
        ctx.stroke();
    }
}
