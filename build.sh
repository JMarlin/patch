#!/bin/sh

outfile=../untitled/pub/patch/lab.js

buildno=$(cat $outfile | grep "var BUILDNO = " | cut -d' ' -f4)
buildno=$(($buildno + 1))

cp lab.html ../untitled/pub/patch/index.html
echo "var BUILDNO = $buildno ;" > $outfile
cat clipper/clipper.js >> $outfile
cat uilib/drawingcontext.js >> $outfile
cat uilib/uimanager.js >> $outfile
cat uilib/frame.js >> $outfile
cat widgets/desktop.js >> $outfile
cat widgets/sessionmenu.js >> $outfile
cat core/patchcore.js >> $outfile
cat main.js >> $outfile


