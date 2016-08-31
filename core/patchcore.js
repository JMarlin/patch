function PatchCore() {

    var that    = this,
        manager = null,
        modules = {},
        sources = [],
        desktop = null;

    that.inputs   = [];

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
        that.install_module(new Sine());
        that.install_module(new PitchKnob());
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

    that.connect_action = function(io) {

        desktop.connect_action(io);
    }

    that.destroy_menu = function() {
    
        desktop.menu.destroy();
        desktop.menu = null;
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
