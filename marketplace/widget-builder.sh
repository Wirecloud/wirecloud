#!/bin/bash
#
#  Command Line Interface to start all services associated with the Wirecloud Tutorial
#
#  For this tutorial the commands are merely a convenience script to run docker
#

set -e


buildWidget () {
	echo ""
	echo "Building" $2 "-" $3
	echo ""
	docker run --rm -v "$(pwd)"/widgets:/opt/widget-builder/output -e GITHUB_ACCOUNT=$1 -e GITHUB_REPOSITORY=$2 widget-builder
}

agileDashboardWidgets(){
	# Wirecloud Widgets
	buildWidget Wirecloud agile-dashboards \
	"Agile Dashboard Components for WireCloud"
}

wirecloudWidgets(){
	
	
	buildWidget Wirecloud bae-details-widget \
	"Business API Ecosystem details widget for WireCloud" 
	buildWidget Wirecloud echarts-widget \
	"WireCloud widget for ECharts graphs"
	buildWidget Wirecloud googlecharts-widget \
	"Generic Graph widget for WireCloud using Google Charts"
	buildWidget Wirecloud highcharts-widget \
	"Generic Graph widget for WireCloud using HighCharts"

	buildWidget Wirecloud json-editor-widget \
	"JSON editor widget for WireCloud"
	buildWidget Wirecloud map-viewer-widget \
	"Basic map viewer widget for WireCloud using the Google Maps API"
	buildWidget Wirecloud markdown-editor-widget \
	"Markdown editor widget for WireCloud"
	buildWidget Wirecloud markdown-viewer-widget \
	"Markdown viewer widget for WireCloud"
	buildWidget Wirecloud ol3-map-widget \
	"Map Viewer for WireCloud made using OpenLayers 3"
	buildWidget Wirecloud panel-widget \
	"WireCloud widget for displaying simple text messages, like sensor measures"
	buildWidget Wirecloud spy-wiring-widget \
	"WireCloud widget for capturing, editing and replaying wiring events"
	buildWidget Wirecloud value-list-filter-operator \
	"WireCloud operator to transform lists of objects into lists of values"
	buildWidget Wirecloud value-filter-operator \
	"Operator that filters a JSON input and outputs part of its data, as addressed in an object-oriented syntax property"
	buildWidget Wirecloud workspace-browser-widget \
	""
	buildWidget wirecloud-fiware ckan2poi-operator \
	"A WireCloud operator to process data from CKAN source and convert it to Point of Interest"
	buildWidget wirecloud-fiware ckan-source-operator \
	"A WireCloud operator to retrieve data from CKAN datasets"
	buildWidget wirecloud-fiware context-broker-admin-mashup \
	"FIWARE Context Broker Administration panel for WireCloud"
}

fiwareWidgets(){
	# Wirecloud FIWARE Widgets
	buildWidget wirecloud-fiware ngsi-source-operator \
	"WireCloud operator for using Orion Context Broker as data source"
	buildWidget wirecloud-fiware ngsi-browser-widget \
	"WireCloud widget for browsing the entities of a orion context broker"
	buildWidget wirecloud-fiware ngsi-datamodel2poi-operator \
	"WireCloud operator for displaying data in a map using the FIWARE data models"
	buildWidget wirecloud-fiware ngsi-entity2poi-operator \
	"Generic WireCloud operator for converting entities to Points of Interest"
	buildWidget wirecloud-fiware ngsi-target-operator \
	"WireCloud operator for using Orion Context Broker as data target"
	buildWidget wirecloud-fiware ngsi-type-browser-widget \
	"WireCloud widget for browsing currently in use entities types inside an orion context broker"
	buildWidget wirecloud-fiware ngsi-subscription-browser-widget \
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



