var audioCtx  = new (window.AudioContext || window.webkitAudioContext)(),
    pcm_node  = audioCtx.createScriptProcessor(512, 0, 2),
    source    = audioCtx.createBufferSource();

pcm_node.onaudioprocess = function(e) {

    var outbuf_l = e.outputBuffer.getChannelData(0),
        outbuf_r = e.outputBuffer.getChannelData(1);
    
    for(var i = 0; i < 512; i++) {

        outbuf_l[i] = Math.random() * 2 - 1;
        outbuf_r[i] = Math.random() * 2 - 1;
    }
}

source.connect(pcm_node);
pcm_node.connect(audioCtx.destination);
source.start();


