/*
 *  This file is part of Wirecloud.
 *  Copyright (C) 2015  CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *  Wirecloud is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  License, or (at your option) any later version.
 *
 *  Wirecloud is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.
 */

/*global StyledElements*/


StyledElements.Alert = (function () {

    "use strict";

    // ==================================================================================
    // CLASS CONSTRUCTOR
    // ==================================================================================

    /**
     * Create a new instance of class Alert.
     * @class
     *
     * @param {Object.<String, *>} [options]
     */
    var Alert = function Alert(options) {
        var i, defaults = {
            'contextualClass': "default",
            'extraClass': "",
            'placement': "",
            'minWidth': 300
        };

        options = Wirecloud.Utils.merge(defaults, options);
        StyledElements.StyledElement.call(this, ['show', 'hide']);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "alert";

        if (~Alert.defaults.contextualList.indexOf(options.contextualClass)) {
            this.contextualType = options.contextualClass;
            this.wrapperElement.classList.add("alert-" + this.contextualType);
        }

        if (~Alert.defaults.placementList.indexOf(options.placement)) {
            this.wrapperElement.classList.add('se-alert-' + options.placement);
            this.placementType = options.placement;
        }

        options.extraClass = options.extraClass.split(' ');

        for (i = 0; i < options.extraClass.length; i++) {
            if (options.extraClass[i].length) {
                this.wrapperElement.classList.add(options.extraClass[i]);
            }
        }

        this.minWidth = options.minWidth;
        this.noteList = [];

        this.heading = document.createElement('div');
        this.heading.className = "se-alert-heading";
        this.wrapperElement.appendChild(this.heading);

        this.body = new StyledElements.Container({"class": "se-alert-body"});
        this.body.insertInto(this.wrapperElement);

        Object.defineProperty(this, 'visible', {
            'get': function get() {
                return !this.wrapperElement.classList.contains('hidden');
            }
        });
    };

    Alert.defaults = {

        contextualList: ['default', 'success', 'info', 'warning', 'danger'],

        placementList: ['static-top']

    };

    Alert.prototype = new StyledElements.StyledElement();

    // ==================================================================================
    // PUBLIC METHODS
    // ==================================================================================

    /**
     * @override
     *
     * @returns {Alert} The instance on which this function was called.
     */
    Alert.prototype.repaint = function repaint(temporal) {
        resizeElement.call(this);
        this.body.repaint(temporal);

        return this;
    };

    /**
     * Set a new content for alert message.
     * @function
     * @public
     *
     * @param {(String|StyledElement|HTMLElement)} content
     * @returns {Alert} The instance on which this function was called.
     */
    Alert.prototype.setContent = function setContent(content) {
        var pElement;

        if (typeof content === 'string') {
            pElement = document.createElement('p');
            pElement.appendChild(document.createTextNode(content));
            content = pElement;
        }

        this.body.clear().appendChild(content);
        this.noteList = [];

        return this;
    };

    /**
     * Set a new headline for alert message.
     * @function
     * @public
     *
     * @param {String} headlineText
     * @returns {Alert} The instance on which this function was called.
     */
    Alert.prototype.setHeadline = function setHeadline(headlineText) {
        this.heading.innerHTML = "";
        this.heading.appendChild(document.createTextNode(headlineText));

        return this;
    };

    /**
     * Add a new blockquote text for alert message.
     * @function
     * @public
     *
     * @param {(String)} contentString
     * @returns {Alert} The instance on which this function was called.
     */
    Alert.prototype.addBlockquote = function addBlockquote(contentString) {
        var blockquote;

        blockquote = document.createElement('blockquote');
        blockquote.innerHTML = contentString;

        this.noteList.push(this.body.appendChild(blockquote));

        return this;
    };

    /**
     * Display the alert message.
     * @function
     * @public
     *
     * @returns {Alert} The instance on which this function was called.
     */
    Alert.prototype.show = function show() {
        if (!this.visible) {
            resizeElement.call(this);
            this.events.show.dispatch();
            this.wrapperElement.classList.remove('hidden');
        }

        return this;
    };

    /**
     * Hide the alert message.
     * @function
     * @public
     *
     * @returns {Alert} The instance on which this function was called.
     */
    Alert.prototype.hide = function hide() {
        if (this.visible) {
            this.events.hide.dispatch();
            this.wrapperElement.classList.add('hidden');
        }

        return this;
    };

    // ==================================================================================
    // PRIVATE METHODS
    // ==================================================================================

    /**
     * Set new size to wrapperElement.
     * @function
     * @private
     *
     * @returns {Alert} The instance on which this function was called.
     */
    var resizeElement = function resizeElement() {
        var parentWidth;

        if (this.placementType == 'static-top') {
            parentWidth = this.wrapperElement.parentNode.clientWidth;

            if (parentWidth < this.minWidth) {
                this.wrapperElement.style.width = '100%';
            } else {
                this.wrapperElement.style.width = (parentWidth / 3) + 'px';
            }
        }

        return this;
    };

    return Alert;

})();
