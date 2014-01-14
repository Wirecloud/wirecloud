/*
 *     Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/* global */
(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/

    var WiringPreview = function WiringPreview() {
        this.workspace = Wirecloud.activeWorkspace;
        this.tab = this.workspace.getVisibleTab();

        // Preview structure
        this.wrapperElement = document.createElement('div');
        this.wrapperElement.classList.add('wiringPreview');
        this.shapeLayer = document.createElement('div');
        this.shapeLayer.classList.add('shapeLayer');
        this.wrapperElement.appendChild(this.shapeLayer);

        // Add preview structure to the tap element
        this.tab.wrapperElement.appendChild(this.wrapperElement);

        // Hide button
        this.closeButton = document.createElement('div');
        this.closeButton.classList.add('closeButton');
        this.closeButton.classList.add('icon-remove');
        this.wrapperElement.appendChild(this.closeButton);

        this.closeButton.addEventListener('click', this.hideWiringPreview.bind(this), false);

        // Scroll handler
        this.tab.wrapperElement.addEventListener("scroll", scrollHandler.bind(this), false);
    };

    /*************************************************************************
     * Private methods
     *************************************************************************/

    /**
     * Calculate visible connections for preview
     */
    var calculateVisibleConnections = function calculateVisibleConnections(widgets, connections) {
        var i, connection;
        var connectionId = 0;

        for (i = 0; i < connections.length; i += 1) {
            connection = connections[i];

            // Direct connections
            if (connection.source.type == 'iwidget' && connection.target.type == 'iwidget') {
                // Only for this tab
                if (this.iwidgets[connection.source.id] && this.iwidgets[connection.target.id]) {
                    this.wiringConnections[connectionId] = connection;
                    connectionId ++;
                }
            // Indirect connections
            } else {
                // TODO buscar los casos que conecten 2 widgets de este tab con un operador entre medias
                    // si target es operador y el operador tiene al menos una salida:
                        // Buscar las conexiones que tenga este operador y que lleguen a un widget de este tab
            }
        }
    };

    /**
     * Get visible connections for preview
     */
    var addWidgetShape = function addWidgetShape(iwidget, id, position) {
        var shape, headerTop;

        // Header top
        headerTop = this.tab.getBoundingClientRect().top;

        // blur in widget
        iwidget.contentWrapper.classList.add('blurred');

        // Widget shape structure
        shape = document.createElement('div');
        shape.classList.add('widgetShape');
        this.shapeLayer.appendChild(shape);
        shape.style.top = (position.top - headerTop) + 'px';
        shape.style.left = position.left + 'px';
        shape.style.height = (position.height - 13) + 'px';
        shape.style.width = (position.width - 14) + 'px';

        this.widgetShapes[id] = {
            'wrapperElement': shape,
            'iwidget': iwidget.widget,
        };
    };

    /**
     * Add anchors for preview
     */
    var addConnection = function addConnection(connectionId, connection) {
        var source, target, sourceEndpoint, targetEndpoint;

        targetEndpoint = connection.target.endpoint;
        // Target Anchor
        if (this.activeAnchors[connection.target.id] && this.activeAnchors[connection.target.id][targetEndpoint]) {
            target = this.activeAnchors[connection.target.id][targetEndpoint];
        } else {
            if (!this.activeAnchors[connection.target.id]) {
                this.activeAnchors[connection.target.id] = {};
            }
            if (!this.activeAnchors[connection.target.id][targetEndpoint]) {
                target = addEndpoint.call(this, connectionId, connection.target.id, targetEndpoint, 'target');
                this.activeAnchors[connection.target.id][targetEndpoint] = target;
            }
        }

        sourceEndpoint = connection.source.endpoint;
        // Source Anchor
        if (this.activeAnchors[connection.source.id] && this.activeAnchors[connection.source.id][sourceEndpoint]) {
            source = this.activeAnchors[connection.source.id][sourceEndpoint];
        } else {
            if (!this.activeAnchors[connection.source.id]) {
                this.activeAnchors[connection.source.id] = {};
            }
            if (!this.activeAnchors[connection.source.id][sourceEndpoint]) {
                source = addEndpoint.call(this, connectionId, connection.source.id, sourceEndpoint, 'source');
                this.activeAnchors[connection.source.id][sourceEndpoint] = source;
            }
        }

        // Add connectionId in each endpoint information
        source['connectionIds'].push(connectionId);
        target['connectionIds'].push(connectionId);

        // Inicialize subBoxesByConnectionId
        this.subBoxesByConnectionId[connectionId] = [];

        // Inicialize labelsByConnectionId
        this.labelsByConnectionId[connectionId] = [];

        // Add arrow in to the arrowsToDraw list.
        this.arrowsToDraw[connectionId] = {
            'source': source,
            'target': target
        };

        this.connectionsCounter += 1;
    };

    /**
     * Add Endpoint in the shape
     */
    var addEndpoint = function addEndpoint(connectionId, widgetId, endpoint, type) {
        var theElement, label, ball, shape, labelText, newEndpoint;

        // Shape
        shape = this.widgetShapes[widgetId];

        // Anchor Label
        label = document.createElement('span');
        label.classList.add('label');

        // Anchor Ball
        ball = document.createElement('div');

        // Endpoint
        theElement = document.createElement('div');
        theElement.classList.add('endpoint');
        theElement.classList.add(type);

        if (type == 'source') {
            theElement.appendChild(label);
            theElement.appendChild(ball);
            labelText = getEndpointLabel(endpoint, shape.iwidget.outputs);
        } else if (type == 'target') {
            theElement.appendChild(ball);
            theElement.appendChild(label);
            labelText = getEndpointLabel(endpoint, shape.iwidget.inputs);
        }
        label.textContent = labelText;
        shape.wrapperElement.appendChild(theElement);

        newEndpoint = {
            'wrapperElement': theElement,
            'name': endpoint,
            'label': labelText,
            'anchor': ball,
            'type': type,
            'widgetId': widgetId,
            'connectionIds': []
        };

        // Label Handlers
        label.addEventListener('mouseover', function (newEndpoint) {
            var i, typeSearched;

            if (newEndpoint.type == 'source') {
                typeSearched = 'target';
            } else {
                typeSearched = 'source';
            }

            for (i = 0; i < newEndpoint.connectionIds.length; i += 1) {
                // Emphasize each label
                emphasize(this.arrowsToDraw[newEndpoint.connectionIds[i]][typeSearched]);

                // Highlight subSmartBoxes
                subBoxOverHandler.call(this, newEndpoint.connectionIds[i]);
            }
        }.bind(this, newEndpoint), false);

        label.addEventListener('mouseout', function (newEndpoint) {
            var i, typeSearched;

            if (newEndpoint.type == 'source') {
                typeSearched = 'target';
            } else {
                typeSearched = 'source';
            }

            for (i = 0; i < newEndpoint.connectionIds.length; i += 1) {
                // Deemphasize each label
                 deemphasize(this.arrowsToDraw[newEndpoint.connectionIds[i]][typeSearched]);

                // Unhighlight subSmartBoxes
                subBoxOutHandler.call(this, newEndpoint.connectionIds[i]);
            }
        }.bind(this, newEndpoint), false);

        return newEndpoint;
    };

    /**
     * Emphasize Complete Endpoint
     */
    var emphasize = function emphasize(endpoint) {
        endpoint.wrapperElement.classList.add('emphasized');
    };

    /**
     * Deemphasize Complete Endpoint
     */
    var deemphasize = function deemphasize(endpoint) {
        endpoint.wrapperElement.classList.remove('emphasized');
    };

    /**
     * Get Endpoint Label
     */
    var getEndpointLabel = function getEndpointLabel(endpointName, endpoints) {
        var i;

        for (i = 0; i < endpoints.length; i += 1) {
            if (endpoints[i].name == endpointName) {
                return endpoints[i].label;
            }
        }
        // Fail
        return null;
    };

    /**
     * Calculate Anchor colors
     */
    var calculateAnchorColors = function calculateAnchorColors(connectionsCounter) {
        var endpoints, key, endpoint, connectionIds, i;

        // Generate each Anchor Smart Box
        for (key in this.activeAnchors) {
            endpoints = this.activeAnchors[key];
            for (key in endpoints) {
                endpoint = endpoints[key];
                connectionIds = endpoint.connectionIds;
                generateColorSmartBox.call(this, connectionIds, endpoint);
            }
        }
    };

    /**
     * Generate a Box with colors
     */
    var generateColorSmartBox = function generateColorSmartBox(connectionIds, endpoint) {
        var anchorDiv, type, subBoxesListById, subBox, i;

        type = endpoint.type;
        anchorDiv = endpoint.anchor;

        // Generate the box
        subBoxesListById = new Wirecloud.ui.ColorSmartBox(connectionIds, anchorDiv, type);

        for (i = 0; i < connectionIds.length; i += 1) {
            subBox = subBoxesListById[connectionIds[i]];

            // SubBox mouseover handler
            subBox.addEventListener('mouseover', subBoxOverHandler.bind(this, connectionIds[i]), false);

            // SubBox mouseout handler
            subBox.addEventListener('mouseout', subBoxOutHandler.bind(this, connectionIds[i]), false);

            // Fill subBoxesByConnectionId
            this.subBoxesByConnectionId[connectionIds[i]].push(subBox);

            // Fill labelsByConnectionId
            this.labelsByConnectionId[connectionIds[i]].push(endpoint);
        }
    };

    /**
     * SubBox mouseover handler
     */
    var subBoxOverHandler = function subBoxOverHandler(connectionId) {
        var theBoxes, theLabels, i;

        theBoxes = this.subBoxesByConnectionId[connectionId];

        for (i = 0; i < theBoxes.length; i += 1) {
            theBoxes[i].classList.add('highlighted');
        }

        theLabels = this.labelsByConnectionId[connectionId];

        for (i = 0; i < theLabels.length; i += 1) {
            emphasize(theLabels[i])
        }
    };

    /**
     * SubBox mouseout handler
     */
    var subBoxOutHandler = function subBoxOutHandler(connectionId) {
        var theBoxes, theLabels, i;

        theBoxes = this.subBoxesByConnectionId[connectionId];

        for (i = 0; i < theBoxes.length; i += 1) {
            theBoxes[i].classList.remove('highlighted');
        }

        theLabels = this.labelsByConnectionId[connectionId];

        for (i = 0; i < theLabels.length; i += 1) {
            deemphasize(theLabels[i])
        }
    };

    /**
     * Reorder Anchors
     */
    var placeAnchors = function placeAnchors() {
        var key, subkey, anchors, anchor, sourceList, targetList;

        for (key in this.activeAnchors) {
            anchors = this.activeAnchors[key];
            sourceList = [];
            targetList = [];
            for (subkey in this.activeAnchors[key]) {
                anchor = this.activeAnchors[key][subkey];
                if (anchor.type == 'source') {
                    sourceList.push(anchor);
                } else {
                    targetList.push(anchor);
                }
            }
            moveEndpoints.call(this, key, sourceList, targetList);
        }
    };

    /**
     * Move endpoints in the shape for better visualization
     */
    var moveEndpoints = function moveEndpoints(shapeId, sourceList, targetList) {
        var i, theShape, height, heightForEachSourceEndpoint,
            heightForEachTargetEndpoint, halfEndpointHeight;

        theShape = this.widgetShapes[shapeId];
        height = theShape.wrapperElement.getBoundingClientRect().height;
        heightForEachSourceEndpoint = height;
        heightForEachTargetEndpoint = height;
        if (sourceList.length > 0) {
            heightForEachSourceEndpoint = height / sourceList.length;
            halfEndpointHeight = sourceList[0].wrapperElement.getBoundingClientRect().height / 2;
        }
        if (targetList.length > 0) {
            heightForEachTargetEndpoint = height / targetList.length;
            halfEndpointHeight = targetList[0].wrapperElement.getBoundingClientRect().height / 2;
        }

        for (i = 0; i < sourceList.length; i += 1) {
            sourceList[i].wrapperElement.style.top = ((i) * heightForEachSourceEndpoint) +
                                                    (heightForEachSourceEndpoint / 2) -
                                                    halfEndpointHeight + 'px';
        }

        for (i = 0; i < targetList.length; i += 1) {
            targetList[i].wrapperElement.style.top = ((i) * heightForEachTargetEndpoint) +
                                                    (heightForEachTargetEndpoint / 2) -
                                                    halfEndpointHeight + 'px';
        }
    };

    /**
     *  Scroll Handler
     */
    var scrollHandler = function scrollHandler() {
        var oc, scrollY, param;
        oc = this.tab.wrapperElement;

        scrollY = parseInt(oc.scrollTop, 10);
        this.wrapperElement.style.height = this.initialHeight + scrollY + 'px';
    };

    /*************************************************************************
     * Public methods
     *************************************************************************/

     /**
     * Load WiringPreview.
     */
     WiringPreview.prototype.showWiringPreview = function ShowWiringPreview() {
        var key, i, pos;

        // Temporal for develop.
        this.wrapperElement.classList.add('on');

        this.widgetShapes = {};
        this.wiringConnections = {};
        this.activeAnchors = {};
        this.arrowsToDraw = {};
        this.subBoxesByConnectionId = {};
        this.labelsByConnectionId = {};
        this.connectionsCounter = 0;

        // Get iwidgets
        this.iwidgets = this.tab.dragboard.iWidgets.toJSON();

        // Get connections
        calculateVisibleConnections.call(this, this.iwidgets, this.workspace.wiring.status.connections);

        // Get initial height for scroll
        this.initialHeight = this.tab.wrapperElement.getBoundingClientRect().height - 4;

        // Draw widgets shapes
        for (key in this.iwidgets) {
            pos = this.iwidgets[key].contentWrapper.getBoundingClientRect();
            addWidgetShape.call(this, this.iwidgets[key], key, pos);
        }

        // Draw anchors
        for (key in this.wiringConnections) {
            addConnection.call(this, key, this.wiringConnections[key]);
        }
        placeAnchors.call(this);

        // Calculate Anchor Colors
        calculateAnchorColors.call(this, this.connectionsCounter);

        // Show Preview
        //this.wrapperElement.classList.add('on');
    };

    /**
     * Load WiringPreview.
     */
    WiringPreview.prototype.hideWiringPreview = function HideWiringPreview() {
        var key;

        this.wrapperElement.classList.remove('on');
        for (key in this.widgetShapes) {
            this.shapeLayer.removeChild(this.widgetShapes[key].wrapperElement);
            this.iwidgets[key].contentWrapper.classList.remove('blurred');
        }
    };

    /*************************************************************************
     * Make WiringPreview public
     *************************************************************************/
    Wirecloud.ui.WiringPreview = WiringPreview;

})();
