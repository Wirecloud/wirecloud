#!/bin/bash
#
#  Command Line Interface to start all services associated with the Wirecloud Tutorial
#
#  For this tutorial the commands are merely a convenience script to run docker
#

#set -e


buildWidget () {
	echo ""
	echo "Building" $2 "-" $3
	echo ""
	# docker run --rm -v "$(pwd)"/widgets:/opt/widget-builder/output -e GITHUB_ACCOUNT=$1 -e GITHUB_REPOSITORY=$2 widget-builder
}

pullWidget () {
	echo ""
	echo "Pulling" $2 "-" $3
	echo ""
	# OUTPUT=`curl --silent "https://api.github.com/repos/${1}/${2}/releases/latest?client_id=xxxx&client_secret=yyyy" | grep browser_download_url`

	OUTPUT=`curl --silent "https://api.github.com/repos/${1}/${2}/releases/latest" | grep browser_download_url`

	X="${OUTPUT:31: $((${#OUTPUT} - 31 - 1))}"

	echo $X

	curl -LO $X
	mv *.wgt widgets
}

agileDashboardWidgets(){
	# Wirecloud Widgets
	buildWidget Wirecloud agile-dashboards \
	"Agile Dashboard Components for WireCloud"
}

wirecloudWidgets(){
	
	
	pullWidget Wirecloud bae-details-widget \
	"Business API Ecosystem details widget for WireCloud" 
	pullWidget Wirecloud echarts-widget \
	"WireCloud widget for ECharts graphs"
	pullWidget Wirecloud googlecharts-widget \
	"Generic Graph widget for WireCloud using Google Charts"
	pullWidget Wirecloud highcharts-widget \
	"Generic Graph widget for WireCloud using HighCharts"

	pullWidget Wirecloud json-editor-widget \
	"JSON editor widget for WireCloud"
	pullWidget Wirecloud map-viewer-widget \
	"Basic map viewer widget for WireCloud using the Google Maps API"
	pullWidget Wirecloud markdown-editor-widget \
	"Markdown editor widget for WireCloud"
	pullWidget Wirecloud markdown-viewer-widget \
	"Markdown viewer widget for WireCloud"
	pullWidget Wirecloud ol3-map-widget \
	"Map Viewer for WireCloud made using OpenLayers 3"
	pullWidget Wirecloud panel-widget \
	"WireCloud widget for displaying simple text messages, like sensor measures"
	pullWidget Wirecloud spy-wiring-widget \
	"WireCloud widget for capturing, editing and replaying wiring events"
	pullWidget Wirecloud value-list-filter-operator \
	"WireCloud operator to transform lists of objects into lists of values"
	pullWidget Wirecloud value-filter-operator \
	"Operator that filters a JSON input and outputs part of its data, as addressed in an object-oriented syntax property"
	pullWidget Wirecloud workspace-browser-widget \
	""
	pullWidget wirecloud-fiware ckan2poi-operator \
	"A WireCloud operator to process data from CKAN source and convert it to Point of Interest"
	pullWidget wirecloud-fiware ckan-source-operator \
	"A WireCloud operator to retrieve data from CKAN datasets"
	pullWidget wirecloud-fiware context-broker-admin-mashup \
	"FIWARE Context Broker Administration panel for WireCloud"
}

fiwareWidgets(){
	# Wirecloud FIWARE Widgets
	pullWidget wirecloud-fiware ngsi-source-operator \
	"WireCloud operator for using Orion Context Broker as data source"
	pullWidget wirecloud-fiware ngsi-browser-widget \
	"WireCloud widget for browsing the entities of a orion context broker"
	pullWidget wirecloud-fiware ngsi-datamodel2poi-operator \
	"WireCloud operator for displaying data in a map using the FIWARE data models"
	pullWidget wirecloud-fiware ngsi-entity2poi-operator \
	"Generic WireCloud operator for converting entities to Points of Interest"
	pullWidget wirecloud-fiware ngsi-target-operator \
	"WireCloud operator for using Orion Context Broker as data target"
	pullWidget wirecloud-fiware ngsi-type-browser-widget \
	"WireCloud widget for browsing currently in use entities types inside an orion context broker"
	pullWidget wirecloud-fiware ngsi-subscription-browser-widget \
	"WireCloud widget for browsing the available subscriptions inside an orion context broker"
}



if (( $# != 1 )); then
    echo "Illegal number of parameters";
    echo "usage: services [docker|build]";
    exit 1;
fi

command="$1"
case "${command}" in
	"docker")
        docker build -t widget-builder ./builder
        ;;
    "agileDashboard")
		# Wirecloud Widgets
		agileDashboardWidgets;
		;;
	"wirecloud")
		# Wirecloud Widgets
		wirecloudWidgets;
		;;
	"fiware")
		# Wirecloud-FIWARE Widgets
		fiwareWidgets;
		;;
	"build")
		echo ""
		echo "Building" $3 "-" $4
		echo ""
		docker run --rm -v "$(pwd)"/widgets:/opt/widget-builder/output -e GITHUB_ACCOUNT=$2 -e GITHUB_REPOSITORY=$3 widget-builder
		;;
	*)
		echo "Command not Found."
		echo "usage: services [docker|build]"
		exit 127;
		;;
esac



