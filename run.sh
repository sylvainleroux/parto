#!/bin/bash

echo $(date)

cd /Users/sleroux/ideo/parto

PATH=$PATH:/usr/local/bin
rm -Rf tmp/*
mkdir -p tmp

EXPORT_PATH="/Users/sleroux/Dropbox/Partitions Bagad/"

phantomjs --cookies-file=tmp/cookies js/parto.js

while read -r line || [[ -n "$line" ]]; do
    mkdir -p "${EXPORT_PATH}$line"
done < tmp/paths;

cookie=$(cat 'tmp/cookie')
while read -r line || [[ -n "$line" ]]; do
  filename=$( echo $line | cut -f 1 -d '|' )
  url=$( echo $line | cut -f 2 -d '|' )

  if [ ! -f "${EXPORT_PATH}${filename}" ]; then
    curl -s -H"Cookie: $cookie" "$url" > "${EXPORT_PATH}${filename}"
  fi
done < tmp/files;
