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

    ns.BehaviourEngine = class BehaviourEngine extends se.StyledElement {

        /**
         * Create a new instance of class BehaviourEngine.
         * @extends {Panel}
         *
         * @constructor
         */
        constructor() {
            var note;

            super(events);

            this.btnEnable = new se.Button({
                title: utils.gettext("Enable"),
                class: "btn-enable",
                iconClass: "fa fa-lock"
            });
            this.btnEnable.addEventListener('click', btnenable_onclick.bind(this));

            this.btnCreate = new se.Button({
                title: utils.gettext("Create behaviour"),
                class: "btn-create",
                iconClass: "fa fa-plus"
            });
            this.btnCreate.addEventListener('click', btncreate_onclick.bind(this));

            this.btnOrder = new se.ToggleButton({
                title: utils.gettext("Order behaviours"),
                class: "btn-order",
                iconClass: "fa fa-sort"
            });
            this.btnOrder.addEventListener('click', btnorder_onclick.bind(this));
            this.btnOrder.disable();

            this.wrapperElement = (new se.GUIBuilder()).parse(Wirecloud.currentTheme.templates['wirecloud/wiring/behaviour_sidebar'], {
                enablebutton: this.btnEnable,
                createbutton: this.btnCreate,
                orderbutton: this.btnOrder,
                behaviourlist: behaviour_list_component.bind(this)
            }).children[1];

            Object.defineProperties(this, {
                orderingEnabled: {
                    get: function () {
                        return this.btnOrder.active;
                    }
                }
            });

            this.disabledAlert = new se.Alert({
                state: 'info',
                title: utils.gettext("New feature"),
                message: utils.gettext("Enable the behaviours to enjoy with a new way to handle connections.")
            });

            note = this.disabledAlert.addNote(utils.gettext("<a>Click here</a> for a quick guide/tutorial on how to use this new feature."));
            note.firstElementChild.addEventListener('click', () => {
                Wirecloud.TutorialCatalogue.get('mashup-wiring-design').start();
            });

            this.viewpoint = ns.BehaviourEngine.GLOBAL;

            this.behaviours = [];
            this.components = {operator: {}, widget: {}};

            this.clear();
        };

        /**
         * @override
         */
        _onenabled(enabled) {

            if (enabled) {
                this.btnEnable
                    .setTitle(utils.gettext("Disable"))
                    .replaceIconClassName('fa-lock', 'fa-unlock');
                this.btnCreate.show();
                this.body.removeChild(this.disabledAlert);
                this.btnCreate.get().parentElement.classList.remove('hidden');
            } else {
                for (var i = this.behaviours.length - 1; i >= 0; i--) {
                    this.body.removeChild(this.behaviours[i]);
                }

                this.behaviours.length = 0;
                this.behaviour = null;

                this.btnEnable
                    .setTitle(utils.gettext("Enable"))
                    .replaceIconClassName('fa-unlock', 'fa-lock');
                this.btnCreate.hide();
                this.body.appendChild(this.disabledAlert);
                this.btnCreate.get().parentElement.classList.add('hidden');
                this.viewpoint = ns.BehaviourEngine.GLOBAL;
                this.stopOrdering();
            }

            onchange_ordering.call(this);

            return this.ready ? this.dispatchEvent('enable', this.enabled) : this;
        }

        /**
         * Switchs the visible behaviour. Do nothing if the engine is disabled.
         *
         * @param {Wirecloud.ui.WiringEditor.Behaviour} [behaviour]
         *      The behaviour to switch to
         * @returns {Wirecloud.ui.WiringEditor.BehaviourEngine}
         *      The instance on which the member is called.
         */
        activate(behaviour) {

            if (!this.enabled) {
                return this;
            }

            if (this.behaviour !== behaviour) {
                deactivateAllExcept.call(this, behaviour);
            }

            return this;
        }

        /**
         * Creates and adds a new behaviour
         *
         * @param {PlainObject} behaviourInfo
         *      Behaviour information to use for creating the behaviour
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The created behaviour instance
         */
        createBehaviour(behaviourInfo) {
            const behaviour = (new ns.Behaviour(this.behaviours.length, behaviourInfo))
                .addEventListener('change', () => {
                    if (this.behaviour.equals(behaviour)) {
                        this.dispatchEvent('change', behaviour.getCurrentStatus(), this.enabled);
                    }
                })
                .addEventListener('click', () => {
                    if (!this.orderingEnabled) {
                        this.activate(behaviour);
                    }
                })
                .addEventListener('optremove', () => {
                    this.removeBehaviour(behaviour);
                });

            return insertBehaviour.call(this, behaviour);
        }

        /**
         * Clear all the resources usded by the engine leaving it ready for
         * another use
         *
         * @returns {Wirecloud.ui.WiringEditor.BehaviourEngine}
         *      The instance on which the member is called.
         */
        clear() {
            var i;

            if (this.enabled) {

                for (i = this.behaviours.length - 1; i >= 0; i--) {
                    this.removeBehaviour(this.behaviours[i]);
                }

                this.behaviours.length = 0;
                this.viewpoint = ns.BehaviourEngine.GLOBAL;
                this.behaviour = null;

                this.stopOrdering();
            } else {
                this.forEachComponent((component) => {
                    this.removeComponent(component);
                });
            }

            onchange_ordering.call(this);

            this.description = Wirecloud.Wiring.normalize().visualdescription;
            this.enabled = false;
            this.ready = false;

            return this;
        }

        /**
         * Removes all the components and connections from a behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.Behaviour} behaviour
         *      behaviour to clear
         * @returns {Wirecloud.ui.WiringEditor.BehaviourEngine}
         *      The instance on which the member is called.
         */
        emptyBehaviour(behaviour) {
            var _behaviour;

            if (!this.enabled) {
                return this;
            }

            if (!this.behaviour.equals(behaviour)) {
                _behaviour = this.behaviour;
                this.activate(behaviour);
            }

            this.forEachComponent((component) => {
                if (behaviour.hasComponent(component)) {
                    _removeComponent.call(this, component);
                }
            });
            behaviour.clear();

            if (_behaviour != null) {
                this.activate(_behaviour);
            }

            return this;
        }

        /**
         * Returns the list of behaviours containing a given component.
         *
         * @param {Wirecloud.ui.WiringEditor.ComponentDraggable} component
         *      The component used for filtering
         * @returns {Wirecloud.ui.WiringEditor.Behaviour[]}
         *      List of behaviours containing the component
         */
        filterByComponent(component) {
            return this.behaviours.filter(function (behaviour) {
                return behaviour.hasComponent(component);
            });
        }

        /**
         * Returns the list of behaviours containing a given connection.
         *
         * @param {Wirecloud.ui.WiringEditor.Connection} connection
         *      The connection used for filtering
         * @returns {Wirecloud.ui.WiringEditor.Behaviour[]}
         *      List of behaviours containing the connection
         */
        filterByConnection(connection) {
            return this.behaviours.filter(function (behaviour) {
                return behaviour.hasConnection(connection);
            });
        }

        /**
         * [TODO: forEachComponent description]
         *
         * @param {Function} callback
         *      [TODO: description]
         * @returns {Wirecloud.ui.WiringEditor.BehaviourEngine}
         *      The instance on which the member is called.
         */
        forEachComponent(callback) {
            var id, type;

            for (type in this.components) {
                for (id in this.components[type]) {
                    callback(this.components[type][id]);
                }
            }

            return this;
        }

        getConnectionIndex(connection) {
            var _connection, found, i, index = -1;

            for (found = false, i = 0; !found && i < this.description.connections.length; i++) {
                _connection = this.description.connections[i];

                if (_connection.sourcename === connection.sourceId && _connection.targetname === connection.targetId) {
                    found = true;
                    index = i;
                }
            }

            return index;
        }

        getCurrentStatus() {
            return {
                title: "",
                connections: this.description.connections.length,
                components: {
                    operator: Object.keys(this.description.components.operator).length,
                    widget: Object.keys(this.description.components.widget).length
                }
            };
        }

        /**
         * Checks if a given component is present in current wiring status, that
         * is, it is present on any of the managed behaviours.
         *
         * @param {Component} component
         *      Component to check for
         * @returns {Boolean}
         *      true if the component is in any of the managed behaviours
         */
        hasComponent(component) {
            var found;

            if (this.enabled) {
                found = this.behaviours.some(function (behaviour) {
                    return behaviour.hasComponent(component);
                });
            } else {
                found = component.id in this.description.components[component.type];
            }

            return found;
        }

        /**
         * [TODO: hasComponents description]
         *
         * @returns {Boolean}
         *      [TODO: description]
         */
        hasComponents() {
            return (Object.keys(this.components.operator).length + Object.keys(this.components.widget).length) > 0;
        }

        /**
         * [TODO: hasConnection description]
         *
         * @param {Connection} connection
         *      [TODO: description]
         * @returns {Boolean}
         *      [TODO: description]
         */
        hasConnection(connection) {
            var found;

            if (this.enabled) {
                found = this.behaviours.some(function (behaviour) {
                    return behaviour.hasConnection(connection);
                });
            } else {
                found = this.getConnectionIndex(connection) !== -1;
            }

            return found;
        }

        /**
         * Process behaviour information from wiring status and load initial
         * status for this component.
         *
         * @param  {PlainObject[]} behaviours
         *      Behaviour information as it comes on the wiring status visual
         *      description
         * @returns {Wirecloud.ui.WiringEditor.BehaviourEngine}
         *      The instance on which the member is called.
         */
        loadBehaviours(behaviours) {

            behaviours.forEach((info) => {
                var behaviour = this.createBehaviour(info);

                behaviour.logManager.log(utils.interpolate(utils.gettext("The behaviour (%(title)s) was loaded."), behaviour), Wirecloud.constants.LOGGING.DEBUG_MSG);
            });

            if (behaviours.length) {
                this.enabled = true;
            } else {
                this.dispatchEvent('change', this.getCurrentStatus(), this.enabled);
            }
            this.ready = true;

            return this;
        }

        /**
         * Removes a behaviour from the Behaviour Engine
         *
         * @param {Wirecloud.ui.WiringEditor.Behaviour} behaviour
         *      Behaviour to remove
         * @returns {Wirecloud.ui.WiringEditor.BehaviourEngine}
         *      The instance on which the member is called.
         */
        removeBehaviour(behaviour) {
            var i, _behaviour;

            if (!this.enabled) {
                return this;
            }

            if (this.orderingEnabled) {
                behaviour.draggable.destroy();
            }

            if (this.behaviour.equals(behaviour)) {
                this.behaviours.some(function (existingBehaviour) {
                    _behaviour = existingBehaviour;
                    return !behaviour.equals(existingBehaviour);
                });
            } else {
                _behaviour = this.behaviour;
            }

            this.emptyBehaviour(behaviour).activate(_behaviour);

            this.body.removeChild(behaviour);
            this.behaviours.splice(this.behaviours.indexOf(behaviour), 1);

            enableToRemoveBehaviour.call(this);
            onchange_ordering.call(this);

            for (i = 0; i < this.behaviours.length; i++) {
                this.behaviours[i].index = i;
            }

            return this;
        }

        /**
         * Removes the given component from the active behaviour, or from all
         * the behaviours if the cascade option is used.
         *
         * @param {Wirecloud.ui.WiringEditor.ComponentDraggable} component
         *      component to remove
         * @param {Boolean} [cascade=false]
         *      `true` for removing the component from all the behaviours,
         *      `false` (default) for removing the component from the active one
         * @returns {Wirecloud.ui.WiringEditor.BehaviourEngine}
         *      The instance on which the member is called.
         */
        removeComponent(component, cascade) {

            if (this.enabled) {
                if (cascade) {
                    showComponentDeleteCascadeModal.call(this, component);
                } else {
                    if (this.filterByComponent(component).length > 1) {
                        _removeComponent.call(this, component, false);
                    } else {
                        showComponentRemoveModal.call(this, component);
                    }
                }
            } else {
                disabled_removeComponent.call(this, component);
            }

            return this;
        }

        /**
         * Removes a list of components from the active behaviour.
         *
         * @param {Wirecloud.ui.WiringEditor.ComponentDraggable[]} components
         *      component to remove
         * @returns {Wirecloud.ui.WiringEditor.BehaviourEngine}
         *      The instance on which the member is called.
         */
        removeComponentList(componentList) {
            var i, componentsForModal = [];

            if (this.enabled) {
                for (i = 0; i < componentList.length; i++) {
                    if (this.filterByComponent(componentList[i]).length > 1) {
                        _removeComponent.call(this, componentList[i], false);
                    } else {
                        componentsForModal.push(componentList[i]);
                    }
                }

                if (componentsForModal.length) {
                    showComponentListRemoveModal.call(this, componentsForModal);
                }
            } else {
                for (i = 0; i < componentList.length; i++) {
                    disabled_removeComponent.call(this, componentList[i]);
                }
            }

            return this;
        }

        /**
         * Removes a connection from this behaviour engine
         *
         * @param {Wirecloud.ui.WiringEditor.Connection} connection
         *      The connection to remove
         * @param {Boolean} [cascade=false]
         *      `true` for removing the connection from all the behaviours,
         *      `false` (default)  for removing it only from the active
         *      behaviour
         * @returns {Wirecloud.ui.WiringEditor.BehaviourEngine}
         *      The instance on which the member is called.
         */
        removeConnection(connection, cascade) {
            var index = this.getConnectionIndex(connection);

            if (this.enabled) {
                if (cascade) {
                    this.behaviours.forEach(function (behaviour) {
                        behaviour.removeConnection(connection);
                    });
                } else {
                    this.behaviour.removeConnection(connection);

                    if (this.hasConnection(connection)) {
                        connection.background = true;
                        return this;
                    }
                }
            }

            _removeConnection.call(this, index, connection);

            if (!this.enabled) {
                this.dispatchEvent('change', this.getCurrentStatus(), this.enabled);
            }

            return this;
        }

        stopOrdering() {

            if (this.orderingEnabled) {
                this.btnOrder.click();
            }

            return this;
        }

        /**
         * [TODO: toJSON description]
         *
         * @returns {PlainObject}
         *      The instance on which the member is called.
         */
        toJSON() {
            return JSON.parse(JSON.stringify({
                behaviours: this.behaviours,
                components: this.description.components,
                connections: this.description.connections
            }));
        }

        /**
         * Adds or updates the given component into the active behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.Component} component
         *      component to add/update
         * @param {Boolean} [beShared=false]
         *      `true` if the component should be added to the current behaviour
         * @returns {Wirecloud.ui.WiringEditor.BehaviourEngine}
         *      The instance on which the member is called.
         */
        updateComponent(component, beShared) {
            var name, view = component.toJSON();

            if (this.enabled && (!component.background || beShared)) {
                this.behaviour.updateComponent(component);
                component.removeAllowed = (this.filterByComponent(component).length === 1);
                component.background = false;
            }

            if (!(component.id in this.description.components[component.type])) {
                this.description.components[component.type][component.id] = {};
            }

            for (name in view) {
                this.description.components[component.type][component.id][name] = view[name];
            }

            this.components[component.type][component.id] = component;

            if (!this.enabled) {
                this.dispatchEvent('change', this.getCurrentStatus(), this.enabled);
            }

            return this;
        }

        /**
         * Adds or updates the given connection into the active behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.Component} connection
         *      connection to add/update
         * @param {Boolean} [beShared=false]
         *      `true` if the connection should be added to the current behaviour
         * @returns {Wirecloud.ui.WiringEditor.BehaviourEngine}
         *      The instance on which the member is called.
         */
        updateConnection(connection, beShared) {
            var index = this.getConnectionIndex(connection);
            var view = connection.toJSON();

            if (this.enabled && (!connection.background || beShared)) {
                this.behaviour.updateConnection(connection);
                this.updateComponent(connection.sourceComponent, true);
                this.updateComponent(connection.targetComponent, true);
                connection.removeAllowed = (this.filterByConnection(connection).length === 1);
                connection.background = false;
            }

            if (index !== -1) {
                this.description.connections[index] = view;
            } else {
                this.description.connections.push(view);
            }

            if (!this.enabled) {
                this.dispatchEvent('change', this.getCurrentStatus(), this.enabled);
            }

            return this;
        }

    }

    // TODO
    ns.BehaviourEngine.GLOBAL = 0;
    ns.BehaviourEngine.INDEPENDENT = 1;


    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var events = ['activate', 'change', 'enable'];

    var builder = new se.GUIBuilder();

    var behaviour_list_component = function behaviour_list_component(options) {
        this.body = new se.Container({class: options.class});
        return this.body;
    };

    var _removeConnection = function _removeConnection(index, connection) {
        this.description.connections.splice(index, 1);
        connection.remove();

        return this;
    };

    var disabled_removeComponent = function disabled_removeComponent(component) {
        delete this.description.components[component.type][component.id];
        delete this.components[component.type][component.id];

        removeConnections.call(this, component, false);
        component.remove();

        this.dispatchEvent('change', this.getCurrentStatus(), this.enabled);

        return this;
    };

    const deactivateAllExcept = function deactivateAllExcept(behaviour) {
        for (let found = false, i = 0; i < this.behaviours.length; i++) {
            this.behaviours[i].active = false;

            if (!found && this.behaviours[i].equals(behaviour)) {
                this.behaviour = this.behaviours[i];
                found = true;
            }
        }

        this.behaviour.active = true;
        this.dispatchEvent('activate', this.behaviour, this.viewpoint);

        return this;
    };

    var enableToRemoveBehaviour = function enableToRemoveBehaviour() {
        var enabled = this.behaviours.length > 1;

        this.behaviours.forEach(function (behaviour) {
            behaviour.btnRemove.enabled = enabled;
        });

        return this;
    };

    var btncreate_onclick = function btncreate_onclick() {
        const dialog = new Wirecloud.ui.FormWindowMenu(
            [
                {name: "title", label: utils.gettext("Title"), required: true, initialValue: utils.gettext("New behaviour"), type: "text"},
                {name: "description", label: utils.gettext("Description"), type: "longtext"}
            ],
            utils.gettext("New behaviour"),
            "we-new-behaviour-modal"
        );

        dialog.executeOperation = this.createBehaviour.bind(this);
        dialog.show();
    };

    var btnenable_onclick = function btnenable_onclick() {
        if (this.enabled) {
            const message = utils.gettext("The behaviours will be removed but the components and connections will still exist, would you like to continue?");

            const dialog = new Wirecloud.ui.AlertWindowMenu({
                acceptLabel: utils.gettext("Continue"),
                cancelLabel: utils.gettext("Cancel"),
                message: message
            });
            dialog.setHandler(() => {
                this.enabled = false;
            }).show();
        } else {
            this.createBehaviour({title: utils.gettext("Initial behaviour")});
            this.enabled = true;
        }
    };

    var insertBehaviour = function insertBehaviour(behaviour) {
        this.body.appendChild(behaviour);
        this.behaviours.push(behaviour);

        if (behaviour.active || !this.behaviour) {
            deactivateAllExcept.call(this, behaviour);
        }

        enableToRemoveBehaviour.call(this);
        onchange_ordering.call(this);

        return behaviour;
    };

    var onchange_ordering = function onchange_ordering() {
        this.btnOrder.enabled = this.enabled && this.behaviours.length >= 2;

        if (!this.btnOrder.enabled) {
            this.btnCreate.enable();
            this.btnOrder.active = false;
        }
    };

    var _removeComponent = function _removeComponent(component, cascade) {
        if (cascade) {
            this.behaviours.forEach(function (behaviour) {
                behaviour.removeComponent(component);
            });
        } else {
            this.behaviour.removeComponent(component);

            if (this.hasComponent(component)) {
                removeConnections.call(this, component, false);
                component.background = true;

                return this;
            }
        }

        delete this.description.components[component.type][component.id];
        delete this.components[component.type][component.id];

        removeConnections.call(this, component, true);
        component.remove();

        return this;
    };

    var showComponentRemoveModal = function showComponentRemoveModal(component) {
        var modal, message;

        message = builder.parse(
            builder.DEFAULT_OPENING + utils.gettext("The <strong><t:title/></strong> <t:type/> will be removed, would you like to continue?") + builder.DEFAULT_CLOSING,
            {
                type: component.type,
                title: component.title
            }
        );

        modal = new Wirecloud.ui.AlertWindowMenu(message);
        modal.setHandler(_removeComponent.bind(this, component, false)).show();

        return this;
    };

    var showComponentListRemoveModal = function showComponentListRemoveModal(componentList) {
        var i, modal, message, components;

        message = new se.Fragment();
        components = new se.Fragment();

        for (i = 0; i < componentList.length; i++) {
            components.appendChild(builder.parse(builder.DEFAULT_OPENING + utils.gettext("<li>The <strong><t:title/></strong> <t:type/>.</li>") + builder.DEFAULT_CLOSING, {
                type: componentList[i].type,
                title: componentList[i].title
            }));
        }

        message.appendChild(builder.parse(builder.DEFAULT_OPENING + utils.gettext("<p>These components only exist within the current behaviour <strong><t:title/></strong>:</p><ul><t:components/></ul><p>Would you like to continue?</p>") + builder.DEFAULT_CLOSING, {
            title: this.behaviour.title,
            components: components
        }));

        modal = new Wirecloud.ui.AlertWindowMenu(message);
        modal.setHandler(() => {
            var i;

            for (i = 0; i < componentList.length; i++) {
                _removeComponent.call(this, componentList[i], false);
            }
        }).show();

        return this;
    };

    var showComponentDeleteCascadeModal = function showComponentDeleteCascadeModal(component) {
        var modal, message;

        message = builder.parse(
            builder.DEFAULT_OPENING + utils.gettext("The <strong><t:title/></strong> <t:type/> will be <strong>definitely</strong> removed, would you like to continue?") + builder.DEFAULT_CLOSING,
            {
                type: component.type,
                title: component.title
            }
        );

        modal = new Wirecloud.ui.AlertWindowMenu(message);
        modal.setHandler(_removeComponent.bind(this, component, true)).show();

        return this;
    };

    var removeConnections = function removeConnections(component, cascade) {
        component.forEachConnection((connection) => {
            this.removeConnection(connection, cascade);
        });
    };

    var btnorder_onclick = function btnorder_onclick(button) {
        var i;

        if (button.active) {
            for (i = 0; i < this.behaviours.length; i++) {
                this.behaviours[i].btnPrefs.disable();
                this.behaviours[i].btnRemove.disable();
                makeBehaviourDraggable.call(this, this.behaviours[i]);
            }
            this.btnCreate.disable();
        } else {
            for (i = 0; i < this.behaviours.length; i++) {
                this.behaviours[i].draggable.destroy();
                this.behaviours[i].btnPrefs.enable();
                this.behaviours[i].btnRemove.enable();
            }

            this.btnCreate.enable();
        }
    };

    var makeBehaviourDraggable = function makeBehaviourDraggable(behaviour) {

        behaviour.draggable = new Wirecloud.ui.Draggable(behaviour.get(), {container: this.body},
            function dragstart(draggable, context, event) {
                var behaviourBCR, layout, layoutBCR;

                layout = context.container.get();

                context.layout = layout;

                behaviourBCR = behaviour.getBoundingClientRect();
                layoutBCR = context.layout.getBoundingClientRect();

                context.y = (event.clientY + layout.scrollTop) - (layoutBCR.top + (behaviourBCR.height / 2));

                context.tmpBehaviour = behaviour.get().cloneNode(true);
                context.tmpBehaviour.classList.add("dragging");

                behaviour.addClassName("temporal");

                var firstBehaviour = this.behaviours[0].get();
                var lastBehaviour = this.behaviours[this.behaviours.length - 1].get();

                context.upperLimit = firstBehaviour.offsetTop;
                context.lowerLimit = lastBehaviour.offsetTop;
                context.ratio = behaviourBCR.height;

                context.layout.appendChild(context.tmpBehaviour);
                context.tmpBehaviour.style.left = behaviour.get().offsetLeft + 'px';
                context.tmpBehaviour.style.width = behaviour.get().offsetWidth + 'px';
                if (context.y < context.upperLimit) {
                    context.tmpBehaviour.style.top = context.upperLimit + 'px';
                } else if (context.y > context.lowerLimit) {
                    context.tmpBehaviour.style.top = context.lowerLimit + 'px';
                } else {
                    context.tmpBehaviour.style.top = context.y + 'px';
                }
            }.bind(this),
            // drag
            (e, draggable, context, xDelta, yDelta) => {
                var yPos = Math.round(context.y + yDelta);

                if (yPos < context.upperLimit) {
                    yPos = context.upperLimit;
                } else if (yPos > context.lowerLimit) {
                    yPos = context.lowerLimit;
                }

                context.tmpBehaviour.style.width = behaviour.get().offsetWidth + 'px';
                context.tmpBehaviour.style.top = yPos + 'px';

                let new_index = Math.round((yPos - context.upperLimit) / context.ratio);

                if (new_index !== behaviour.index) {
                    moveBehaviour.call(this, behaviour, new_index);
                }
            },
            function dragend(draggable, context) {
                behaviour.removeClassName("temporal");
                context.layout.removeChild(context.tmpBehaviour);
            }
        );

        return this;
    };

    var moveBehaviour = function moveBehaviour(behaviour, new_index) {
        this.behaviours.splice(this.behaviours.indexOf(behaviour), 1);
        let refElement = this.behaviours[new_index];
        this.behaviours.splice(new_index, 0, behaviour);

        if (refElement) {
            behaviour.parent().insertBefore(behaviour.get(), refElement.get());
        } else {
            behaviour.parent().insertBefore(behaviour.get(), null);
        }

        this.behaviours.forEach((behaviour, index) => {
            behaviour.index = index;
        });
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
