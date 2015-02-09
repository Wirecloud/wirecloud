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
            'extraClass': ""
        };

        options = Wirecloud.Utils.merge(defaults, options);
        StyledElements.StyledElement.call(this, ['show', 'hide']);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "alert";

        if (options.contextualClass in ['default', 'success', 'info', 'warning', 'danger']) {
            this.contextualType = options.contextualClass;
            this.wrapperElement.classList.add("alert-" + this.contextualClass)
        }

        options.extraClass = options.extraClass.split(' ');

        for (i = 0; i < options.extraClass.length; i++) {
            if (options.extraClass[i].length) {
                this.wrapperElement.classList.add(options.extraClass[i]);
            }
        }

        this.children = [];
        this.noteList = [];

        this.heading = document.createElement('div');
        this.heading.className = "se-alert-heading";
        this.children.push(this.wrapperElement.appendChild(this.heading));

        this.body = new StyledElements.Container({"class": "se-alert-body"});
        this.body.insertInto(this.wrapperElement);
        this.children.push(this.body);

        Object.defineProperty(this, 'visible', {
            'get': function get() {
                return !this.wrapperElement.classList.contains('hidden');
            }
        });
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
        if (this.wrapperElement.classList.contains('hidden')) {
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
        if (!this.wrapperElement.classList.contains('hidden')) {
            this.events.hide.dispatch();
            this.wrapperElement.classList.add('hidden');
        }

        return this;
    };

    return Alert;

})();
