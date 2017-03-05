PATH=$PATH:/usr/local/bin
rm -Rf tmp/*
mkdir tmp

phantomjs --cookies-file=tmp/intranet-ergue.cookies js/parto.js
