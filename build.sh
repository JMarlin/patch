#!/bin/sh

outfile=lab.js

buildno=$(cat $outfile | grep "var BUILDNO = " | cut -d' ' -f4)
buildno=$(($buildno + 1))

echo "var BUILDNO = $buildno ;" > $outfile
cat clipper/*.js >> $outfile
cat uilib/*.js >> $outfile
cat widgets/*.js >> $outfile
cat core/*.js >> $outfile
cat units/*.js >> $outfile
cat main.js >> $outfile


