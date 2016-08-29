function PatchCore() {

    var that    = this,
        manager = null,
        modules = {},
        sources = [],
        wires   = [],
        desktop = null;

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

        that.install_module(new MasterOut()); //TODO: This will be replaced by the loading of default modules from a list
        that.install_module(new Noise());
        manager = new UIManager();
        desktop = new Desktop(that);
        manager.add_child(desktop);

        var audioCtx  = new (window.AudioContext || window.webkitAudioContext)(),
            pcm_node  = audioCtx.createScriptProcessor(512, 0, 2),
            source    = audioCtx.createBufferSource();

        pcm_node.onaudioprocess = function(e) {

            var outbuf_l = e.outputBuffer.getChannelData(0),
                outbuf_r = e.outputBuffer.getChannelData(1);
    
            for(var i = 0; i < 512; i++) {

                outbuf_l[i] = 0; 
                outbuf_r[i] = 0;

                for(var j = 0; j < sources.length; j++) {
                
                    outbuf_r[i] += sources[j].pull_right_sample();
                    outbuf_l[i] += sources[j].pull_left_sample();
                }
            }
        }

        source.connect(pcm_node);
        pcm_node.connect(audioCtx.destination);
        source.start();
    };

    that.add_source = function(source) {

        sources.push(source);
    };   

    that.list_modules = function() {

        return Object.keys(modules);
    };

    that.finish_connection = function(io) {

        desktop.finish_connection(io);
    }

    that.begin_connection = function(io) {
    
        desktop.begin_connection(io);
    };

    that.add_wire = function(wire) {

        wires.push(wire);
    }

    that.get_wires = function() {

        return wires;
    };

    that.instantiate_module = function(name) {

        //TODO: Make sure that passing a name that's not in
        //      the module list won't blow things up
        var mod = new modules[name](that);
        mod.x = that.next_spawn_x();
        mod.y = that.next_spawn_y();
        desktop.add_child(mod);
    };
}
