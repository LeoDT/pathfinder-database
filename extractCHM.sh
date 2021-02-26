#!/bin/sh

rm -fr extracted converted

extract_chmLib pathfinder.chm extracted

mkdir converted

cd extracted
find . -type f -name "*.hhc" -exec bash -c 'iconv -f GBK -t UTF-8 "{}" | sed "s/gb2312/utf-8/g" > ../converted/"{}"' \;
find . -type f -name "*.html" -exec bash -c 'iconv -f GBK -t UTF-8 "{}" | sed "s/gb2312/utf-8/g" > ../converted/"{}"' \;
