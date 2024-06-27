#!/bin/bash
#
#  Command Line Interface to start all services associated with the Wirecloud Tutorial
#
#  For this tutorial the commands are merely a convenience script to run docker
#

set -e

mkdir -p texts
mkdir -p temp

for D in widgets/*.wgt; do
	if [ -f "${D}" ]; then

		#echo "${D}"

		unzip -qq -o -j "${D}" "config.xml" -d "temp" 


		sed 's/xmlns=/xxxx=/g' temp/config.xml > temp/config2.xml
		xsltproc --stringparam WIDGET "${D}" builder/marketplace.xsl temp/config2.xml

	fi
done

# rm -rf temp
