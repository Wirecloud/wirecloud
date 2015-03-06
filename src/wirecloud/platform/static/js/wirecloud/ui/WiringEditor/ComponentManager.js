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

/*globals gettext, StyledElements, Wirecloud*/


Wirecloud.ui.WiringEditor.ComponentManager = (function () {

    "use strict";

    // ==================================================================================
    // CLASS CONSTRUCTOR
    // ==================================================================================

    /**
     * Create a new instance of class ComponentManager.
     * @class
     *
     * @param {Object.<String, *>} [options]
     */
    var ComponentManager = function ComponentManager(options) {
        // Merge options's user with default options
        options = Wirecloud.Utils.merge({}, options);

        // Build structure of the default panel
        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "panel panel-components";

        var headingElement = document.createElement('div');
        headingElement.className = "panel-heading";
        this.wrapperElement.appendChild(headingElement);

        var containerElement = document.createElement('div');
        containerElement.className = "panel-body";
        this.wrapperElement.appendChild(containerElement);

        // Add section of web operators
        this.btnOperators = new StyledElements.StyledButton({
            'plain': true,
            'text': gettext("Operators")
        });
        this.btnOperators.insertInto(headingElement);
        this.btnOperators.addEventListener('click', function (event) {
            this.activeSectionOperators();
        }.bind(this));

        this.operatorGroup = {};
        this.sectionOperators = new StyledElements.Container({
            'class': "section operator-group"
        });
        this.sectionOperators.insertInto(containerElement);

        this.messageOperators = document.createElement('div');
        this.messageOperators.className = "alert alert-info";
        this.messageOperators.innerHTML =
            [
                "<h4 class=\"title\">No operators found</h4>",
                "<p class=\"content\">",
                "At this time, there is no operator uploaded to your current user account.",
                "<br/>",
                "Go to the inventory view for uploading at least a web operator.</p>"
            ].join('');
        this.sectionOperators.appendChild(this.messageOperators);

        // Add section of web widgets
        this.btnWidgets = new StyledElements.StyledButton({
            'plain': true,
            'text': gettext("Widgets")
        });
        this.btnWidgets.insertInto(headingElement);
        this.btnWidgets.addEventListener('click', function (event) {
            this.activeSectionWidgets();
        }.bind(this));

        this.widgetGroup = {};
        this.sectionWidgets = new StyledElements.Container({
            'class': "section widget-group"
        });
        this.sectionWidgets.insertInto(containerElement);

        this.messageWidgets = document.createElement('div');
        this.messageWidgets.className = "alert alert-info";
        this.messageWidgets.innerHTML =
            [
                "<h4 class=\"title\">No widgets found</h4>",
                "<p class=\"content\">",
                "At this time, there is no widget added to your current mashup.",
                "<br/>",
                "Back to the home view for adding at least a web widget.</p>"
            ].join('');
        this.sectionWidgets.appendChild(this.messageWidgets);

        // Active the default section
        this.activeDefaultSection();
    };

    StyledElements.Utils.inherit(ComponentManager, StyledElements.StyledElement);

    /**
     * Display the section chosen by default.
     * @function
     * @public
     *
     * @returns {ComponentManager} The instance on which this function was called.
     */
    ComponentManager.prototype.activeDefaultSection = function activeDefaultSection() {
        this.activeSectionOperators();

        return this;
    };

    /**
     * Display the section of web operators installed.
     * @function
     * @public
     *
     * @returns {ComponentManager} The instance on which this function was called.
     */
    ComponentManager.prototype.activeSectionOperators = function activeSectionOperators() {
        this.btnOperators.addClassName('active');
        this.sectionOperators.removeClassName('hidden');

        this.btnWidgets.removeClassName('active');
        this.sectionWidgets.addClassName('hidden');

        return this;
    };

    /**
     * Display the section of web widgets used.
     * @function
     * @public
     *
     * @returns {ComponentManager} The instance on which this function was called.
     */
    ComponentManager.prototype.activeSectionWidgets = function activeSectionWidgets() {
        this.btnOperators.removeClassName('active');
        this.sectionOperators.addClassName('hidden');

        this.btnWidgets.addClassName('active');
        this.sectionWidgets.removeClassName('hidden');

        return this;
    };

    /**
     * Add the ioperator given to the end of list.
     * @function
     * @public
     *
     * @param {Object} operatorInterface
     * @returns {ComponentManager} The instance on which this function was called.
     */
    ComponentManager.prototype.appendOperator = function appendOperator(operatorInterface) {
        this.operatorGroup[operatorInterface.getId()] = operatorInterface;
        this.sectionOperators.appendChild(operatorInterface);

        if (!this.messageOperators.classList.contains('hidden')) {
            this.messageOperators.classList.add('hidden');
        }

        return this;
    };

    /**
     * Add the iwidget given.
     * @function
     * @public
     *
     * @param {IWidget} iwidget
     * @returns {ComponentManager} The instance on which this function was called.
     */
    ComponentManager.prototype.appendWidget = function appendWidget(widgetInterface) {
        this.widgetGroup[widgetInterface.getId()] = widgetInterface;
        this.sectionWidgets.appendChild(widgetInterface);

        if (!this.messageWidgets.classList.contains('hidden')) {
            this.messageWidgets.classList.add('hidden');
        }

        return this;
    };

    /**
     * Clear the whole content.
     * @function
     * @public
     *
     * @returns {ComponentManager} The instance on which this function was called.
     */
    ComponentManager.prototype.clear = function clear() {
        this.sectionOperators.clear();
        this.sectionWidgets.clear();

        this.operatorGroup = {};
        this.widgetGroup = {};

        this.sectionOperators.appendChild(this.messageOperators);
        this.sectionWidgets.appendChild(this.messageWidgets);
        this.activeDefaultSection();

        return this;
    };

    /**
     * Return the ioperator found from the title given.
     * @function
     * @public
     *
     * @param {String} operatorTitle
     * @returns {Object} The ioperator found.
     */
    ComponentManager.prototype.getOperatorByTitle = function getOperatorByTitle(operatorTitle) {
        var i;

        for (i = 0; i < this.operatorGroup.length; i++) {
            if (this.operatorGroup[i].wrapperElement.textContent == operatorTitle) {
                return this.operatorGroup[i];
            }
        }

        return;
    };

    ComponentManager.prototype.getWidgetById = function getWidgetById(widgetId) {
        return this.widgetGroup[widgetId];
    };

    /**
     * Return the iwidget found from the title given.
     * @function
     * @public
     *
     * @param {Object} widgetTitle
     * @returns {Object} The iwidget found.
     */
    ComponentManager.prototype.getWidgetByTitle = function getWidgetByTitle(widgetTitle) {
        var i;

        for (i = 0; i < this.widgetGroup.length; i++) {
            if (this.widgetGroup[i].wrapperElement.textContent == widgetTitle) {
                return this.widgetGroup[i];
            }
        }

        return;
    };

    ComponentManager.prototype.hide = function hide() {
        this.wrapperElement.classList.add('hidden');

        return this;
    };

    /**
     * Remove the ioperator given.
     * @function
     * @public
     *
     * @param {Object} operatorInterface
     * @returns {ComponentManager} The instance on which this function was called.
     */
    ComponentManager.prototype.removeOperator = function removeOperator(operatorInterface) {
        var index = this.operatorGroup.indexOf(operatorInterface);

        if (index != -1) {
            this.operatorGroup.splice(index, 0);
            this.sectionOperators.removeChild(operatorInterface);
        }

        return this;
    };

    /**
     * Remove the iwidget given.
     * @function
     * @public
     *
     * @param {Object} widgetInterface
     * @returns {ComponentManager} The instance on which this function was called.
     */
    ComponentManager.prototype.removeWidget = function removeWidget(widgetInterface) {
        var index = this.widgetGroup.indexOf(widgetInterface);

        if (index != -1) {
            this.widgetGroup.splice(index, 0);
            this.sectionWidgets.removeChild(widgetInterface);
        }

        return this;
    };

    ComponentManager.prototype.show = function show() {
        this.wrapperElement.classList.remove('hidden');

        return this;
    };

    return ComponentManager;

})();
