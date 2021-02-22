/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    ns.Behaviour = class Behaviour extends se.Panel {

        /**
         * Creates a new instance of class Behaviour.
         * @extends {StyledElements.Panel}
         *
         * @constructor
         * @param {PlainObject} [options]
         *      [TODO: description]
         */
        constructor(index, options) {
            options = utils.updateObject(ns.Behaviour.JSON_TEMPLATE, options);

            if (options.title.trim() === "") {
                throw new TypeError("invalid title option");
            }

            const btnPrefs = new se.PopupButton({
                title: utils.gettext("Preferences"),
                class: "we-prefs-btn",
                iconClass: "fa fa-reorder"
            });
            const btnRemove = new se.Button({
                title: utils.gettext("Remove"),
                class: "btn-remove",
                iconClass: "fa fa-times-circle"
            });

            super({
                events: events,
                class: "behaviour",
                title: options.title,
                selectable: true,
                buttons: [btnPrefs, btnRemove]
            });

            this.btnPrefs = btnPrefs;
            this.btnPrefs.popup_menu.append(new ns.BehaviourPrefs(this));
            this.btnRemove = btnRemove;
            this.btnRemove.addEventListener('click', btnremove_onclick.bind(this));

            this.heading.title.addClassName("se-link behaviour-title text-truncate");

            this.descriptionElement = document.createElement("p");
            this.descriptionElement.className = "behaviour-description";
            this.descriptionElement.textContent = options.description;
            this.body.appendChild(this.descriptionElement);

            Object.defineProperties(this, {
                logManager: {value: new Wirecloud.LogManager(Wirecloud.GlobalLogManager)}
            });

            this.active = options.active;
            this.index = index;

            this.components = options.components;
            this.connections = options.connections;
        }

        get description() {
            return this.descriptionElement.textContent;
        }

        set description(value) {
            this.descriptionElement.textContent = value;
        }

        get index() {
            return Number(this.get().getAttribute("data-index"));
        }

        set index(value) {
            value = Number(value);
            if (isNaN(value)) {
                throw new TypeError("Invalid index value");
            }
            this.get().setAttribute("data-index", value);
        }

        get titletooltip() {
            const tooltip = new se.Tooltip({placement: ["top", "bottom", "right", "left"]});
            Object.defineProperty(this, "titletooltip", {value: tooltip});
            return tooltip;
        }

        /**
         * @override
         */
        _onclick(event) {

            if (!this.active) {
                super._onclick(event);
            }

            return this;
        }

        /**
         * @override
         */
        clear() {

            this.components = {operator: {}, widget: {}};
            this.connections = [];

            return this.dispatchEvent('change');
        }

        /**
         * @override
         */
        setTitle(title) {
            const span = document.createElement('span');
            span.textContent = title;
            this.titletooltip.options.content = title;
            this.titletooltip.bind(span);

            return super.setTitle(span);
        }

        /**
         * [TODO: equals description]
         *
         * @param {Wirecloud.ui.WiringEditor.Behaviour} behaviour
         *      [TODO: description]
         * @returns {Boolean}
         *      [TODO: description]
         */
        equals(behaviour) {
            return this === behaviour;
        }

        getConnectionIndex(connection) {
            for (let i = 0; i < this.connections.length; i++) {
                const _connection = this.connections[i];

                if (_connection.sourcename === connection.sourceId && _connection.targetname === connection.targetId) {
                    return i;
                }
            }

            return -1;
        }

        getCurrentStatus() {
            return {
                title: this.title,
                connections: this.connections.length,
                components: {
                    operator: Object.keys(this.components.operator).length,
                    widget: Object.keys(this.components.widget).length
                }
            };
        }

        /**
         * Checks if the given component is present in the behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.ComponentDraggable} component
         *      component to check
         * @returns {Boolean}
         *      true if the component is present on this behaviour
         */
        hasComponent(component) {
            return component.id in this.components[component.type];
        }

        /**
         * Checks if the given connection is present in the behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.Connection} connection
         *      Connection to check
         * @returns {Boolean}
         *      true if the connection is present on this behaviour
         */
        hasConnection(connection) {
            return this.connections.some(function (vInfo) {
                return vInfo.sourcename === connection.sourceId && vInfo.targetname === connection.targetId;
            });
        }

        /**
         * Removes a component from the behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.ComponentDraggable} component
         *      Component to remove from the behaviour
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        removeComponent(component) {
            if (this.hasComponent(component)) {
                delete this.components[component.type][component.id];
                this.dispatchEvent('change');
            }
            return this;
        }

        /**
         * Removes a connection from the behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.Connection} connection
         *      Connection to remove
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        removeConnection(connection) {
            const index = this.getConnectionIndex(connection);

            if (index !== -1) {
                this.connections.splice(index, 1);
                this.dispatchEvent('change');
            }

            return this;
        }

        /**
         * [TODO: showLogs description]
         *
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        showLogs() {
            const dialog = new Wirecloud.ui.LogWindowMenu(this.logManager, {
                title: utils.interpolate(utils.gettext("%(behaviour_title)s's logs"), {
                    behaviour_title: this.title
                })
            });
            dialog.show();

            return this;
        }

        /**
         * Displays a FormWindowMenu to update behaviour details
         *
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        showSettings() {
            const dialog = new Wirecloud.ui.FormWindowMenu(
                [
                    {name: "title", label: utils.gettext("Title"), required: true, type: "text"},
                    {name: "description", label: utils.gettext("Description"), type: "longtext"}
                ],
                utils.gettext("Behaviour settings"),
                "behaviour-update-form"
            );

            dialog.executeOperation = updateInfo.bind(this);
            dialog.show().setValue(this);

            return this;
        }

        /**
         * [TODO: toJSON description]
         *
         * @returns {PlainObject}
         *      [TODO: description]
         */
        toJSON() {
            return {
                title: this.title,
                description: this.description,
                active: this.active,
                components: this.components,
                connections: this.connections
            };
        }

        /**
         * Adds or updates a component
         *
         * @param {Wirecloud.ui.WiringEditor.ComponentDraggable} component
         *      Component to add/update
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        updateComponent(component) {
            if (!this.hasComponent(component)) {
                this.components[component.type][component.id] = {};
                this.dispatchEvent('change');
            }

            return this;
        }

        /**
         * Adds or updates a connection in the behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.Connection} connection
         *      Connection to add/update
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        updateConnection(connection, view) {

            let index = this.getConnectionIndex(connection);

            if (index === -1) {
                index = this.connections.push({
                    sourcename: connection.sourceId,
                    targetname: connection.targetId
                });

                this.dispatchEvent('change');
            }

            return this;
        }

    }

    ns.Behaviour.JSON_TEMPLATE = {
        title: "",
        description: "",
        active: false,
        components: {operator: {}, widget: {}},
        connections: []
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    const events = ['change', 'optremove'];

    const btnremove_onclick = function btnremove_onclick(event) {
        if (this.connections.length > 0) {
            const message = utils.gettext("The following operation is irreversible and removes the behaviour completely. Would you like to continue?");

            const dialog = new Wirecloud.ui.AlertWindowMenu({
                message: message,
                acceptLabel: utils.gettext("Continue"),
                cancelLabel: utils.gettext("No, thank you")
            });
            dialog.setHandler(() => {
                this.dispatchEvent("optremove");
            }).show();
        } else {
            this.dispatchEvent("optremove");
        }
    };

    const updateInfo = function updateInfo(data) {
        this.setTitle(data.title.trim());
        this.description = data.description;
        this.dispatchEvent('change');
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
