/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2013 Center for Open Middleware
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
        this.workspace = opManager.activeWorkspace;
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
            'iwidget': iwidget.widget
        };
    };

    /**
     * Add anchors and connection for preview
     */
    var addConnection = function addConnection(connectionId, connection) {
        var source, target, sourceEndpoint, targetEndpoint;

        targetEndpoint = connection.target.endpoint;
        // Target Anchor
        if (this.activeAnchors[connection.target] && this.activeAnchors[connection.target][targetEndpoint]) {
            target = this.activeAnchors[connection.target][targetEndpoint];
        } else {
            if (!this.activeAnchors[connection.target]) {
                this.activeAnchors[connection.target] = {};
            }
            if (!this.activeAnchors[connection.target][targetEndpoint]) {
                target = addEndpoint.call(this, connectionId, connection.target.id, targetEndpoint, 'target');
                this.activeAnchors[connection.target][targetEndpoint] = target;
            }
        }

        sourceEndpoint = connection.source.endpoint;
        // Source Anchor
        if (this.activeAnchors[connection.source] && this.activeAnchors[connection.source][sourceEndpoint]) {
            source = this.activeAnchors[connection.source][sourceEndpoint];
        } else {
            if (!this.activeAnchors[connection.source]) {
                this.activeAnchors[connection.source] = {};
            }
            if (!this.activeAnchors[connection.source][sourceEndpoint]) {
                source = addEndpoint.call(this, connectionId, connection.source.id, sourceEndpoint, 'source');
                this.activeAnchors[connection.source][sourceEndpoint] = source;
            }
        }

        // Add arrow in to the arrowsToDraw list.
        this.arrowsToDraw[connectionId] = {
            'source': source,
            'target': target
        };
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
        ball = document.createElement('span');
        ball.classList.add('anchor');
        ball.classList.add('icon-circle');

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
            'connectionIds': []
        };

        return newEndpoint;
    };

    /**
     * Add Arrow between source and target
     */
    var addArrow = function addArrow(connectionId, source, target) {

        // Add connectionId in each endpoint information
        source['connectionIds'].push(connectionId);
        target['connectionIds'].push(connectionId);

        // TODO create arrow
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
     * Reorder Anchors
     */
    var reorderAnchors = function reorderAnchors() {
        var key, subkey, anchors, anchor;

        for (key in this.activeAnchors) {
            anchors = this.activeAnchors[key];
            for (subkey in this.activeAnchors[key]) {
                anchor = this.activeAnchors[key][subkey];
            }
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
        reorderAnchors.call(this);

        // Draw connections
        for (key in this.arrowsToDraw) {
            addArrow.call(this, key, this.arrowsToDraw[key].source, this.arrowsToDraw[key].target);
        }

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
        }
    };

    /*************************************************************************
     * Make WiringPreview public
     *************************************************************************/
    Wirecloud.ui.WiringPreview = WiringPreview;

})();
