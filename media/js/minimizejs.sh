#!/bin/bash

rm tmp.js 2> /dev/null
rm ezweb.js 2> /dev/null
for f in `find . -name *.js`
do
	cat $f >> tmp.js
	echo "" >> tmp.js
done
java -jar compressor.jar tmp.js > ezweb.js
rm tmp.js 2> /dev/null
