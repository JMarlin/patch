#!/bin/sh

outfile=../untitled/pub/patch/lab.js

buildno=$(cat $outfile | grep "var BUILDNO = " | cut -d' ' -f4)
buildno=$(($buildno + 1))

cp lab.html ../untitled/pub/patch/index.html
echo "var BUILDNO = $buildno ;" > $outfile
cat clipper/*.js >> $outfile
cat uilib/*.js >> $outfile
cat widgets/*.js >> $outfile
cat core/*.js >> $outfile
cat units/*.js >> $outfile
cat main.js >> $outfile


