#!/bin/bash

rm -f tmp.js ezweb.js

for f in `find . -name *.js`
do
	cat $f >> tmp.js
	echo "" >> tmp.js
done
java -jar compressor.jar tmp.js > ezweb.js

rm -f tmp.js
