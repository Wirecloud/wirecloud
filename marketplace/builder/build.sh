#!/bin/bash


buildWidget () {
	if [ -e package.json ]
	then
		npm install --silent ;
		(npm install grunt@0.4.5  --save-dev --silent  && grunt build) || (npm install grunt --save-dev --silent && node_modules/grunt/bin/grunt build);
		if [ -d dist ]; then
			cp -r dist/* /opt/widget-builder/output;
		elif [ -d build ]; then
			cp -r build/* /opt/widget-builder/output;
		else
	   		echo "Unknown build dir"
		fi
	if
}


if [ "${DOWNLOAD}" = "latest" ] ;
then
	RELEASE="${SOURCE_BRANCH}";
	echo "INFO: Building Latest Development from ${SOURCE_BRANCH} branch.";
elif [ "${DOWNLOAD}" = "stable" ];
then
	RELEASE=$(curl -s https://api.github.com/repos/"${GITHUB_ACCOUNT}"/"${GITHUB_REPOSITORY}"/releases/latest | grep 'tag_name' | cut -d\" -f4);
	echo "INFO: Building Latest Stable Release: ${RELEASE}";
else
 	RELEASE="${DOWNLOAD}";
 	echo "INFO: Building Release: ${RELEASE}";
fi;
RELEASE_CONCAT=$(echo "${RELEASE}" | tr / -);


wget --no-check-certificate -O source.zip https://github.com/"${GITHUB_ACCOUNT}"/"${GITHUB_REPOSITORY}"/archive/"${RELEASE}".zip;
unzip -qq source.zip;
rm source.zip;
cd "${GITHUB_REPOSITORY}-${RELEASE_CONCAT}";

if [ -e package.json ]
then
	buildWidget
else
	for D in *; do
		if [ -d "${D}" ]; then
			echo
			echo "${D}"
			echo
			cd "${D}"
			buildWidget
			cd ..
		fi
	done
fi

 