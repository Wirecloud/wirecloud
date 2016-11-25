/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * Create a new instance of class BehaviourEngine.
     * @extends {Panel}
     *
     * @constructor
     */
    ns.BehaviourEngine = function BehaviourEngine() {
        var note;

        se.StyledElement.call(this, events);

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
        note.firstElementChild.addEventListener('click', function () {
            Wirecloud.TutorialCatalogue.get('mashup-wiring-design').start();
        });

        this.viewpoint = ns.BehaviourEngine.GLOBAL;

        this.behaviours = [];
        this.components = {operator: {}, widget: {}};
    };

    ns.BehaviourEngine.GLOBAL = 0;
    ns.BehaviourEngine.INDEPENDENT = 1;

    utils.inherit(ns.BehaviourEngine, se.StyledElement, {

        /**
         * @override
         */
        _onenabled: function _onenabled(enabled) {

            if (enabled) {
                this.btnEnable
                    .setTitle(utils.gettext("Disable"))
                    .replaceIconClassName('fa-lock', 'fa-unlock');
                this.btnCreate.show();
                this.body.removeChild(this.disabledAlert);
                this.btnCreate.get().parentElement.classList.remove('hidden');
            } else {
                this.btnEnable
                    .setTitle(utils.gettext("Enable"))
                    .replaceIconClassName('fa-unlock', 'fa-lock');
                this.btnCreate.hide();
                this.body.appendChild(this.disabledAlert);
                this.btnCreate.get().parentElement.classList.add('hidden');
                this.stopOrdering();
            }

            onchange_ordering.call(this);

            return this;
        },

        /**
         * [TODO: activate description]
         *
         * @param {Behaviour} behaviour
         *      [TODO: description]
         * @param {Boolean} [toggleViewpoint]
         *      [TODO: description]
         * @returns {BehaviourEngine}
         *      The instance on which the member is called.
         */
        activate: function activate(behaviour, toggleViewpoint) {

            if (!this.enabled) {
                return this;
            }

            desactivateAllExcept.call(this, behaviour);

            if (toggleViewpoint) {
                this.viewpoint = this.viewpoint === ns.BehaviourEngine.GLOBAL ? ns.BehaviourEngine.INDEPENDENT : ns.BehaviourEngine.GLOBAL;
            }

            return this.dispatchEvent('activate', this.behaviour, this.viewpoint);
        },

        /**
         * [TODO: createBehaviour description]
         *
         * @param {PlainObject} behaviourInfo
         *      [TODO: description]
         * @returns {Behaviour}
         *      [TODO: description]
         */
        createBehaviour: function createBehaviour(behaviourInfo) {
            var behaviour;

            behaviour = (new ns.Behaviour(this.behaviours.length, behaviourInfo))
                .addEventListener('change', function () {
                    if (this.behaviour.equals(behaviour)) {
                        this.dispatchEvent('change', behaviour.getCurrentStatus(), this.enabled);
                    }
                }.bind(this))
                .addEventListener('click', function () {
                    if (!this.orderingEnabled) {
                        this.activate(behaviour);
                    }
                }.bind(this))
                .addEventListener('optremove', function () {
                    this.removeBehaviour(behaviour);
                }.bind(this));

            return insertBehaviour.call(this, behaviour);
        },

        /**
         * @override
         */
        clear: function clear() {
            var i;

            if (this.enabled) {

                for (i = this.behaviours.length - 1; i >= 0; i--) {
                    this.removeBehaviour(this.behaviours[i]);
                }

                this.behaviours.length = 0;
                this.viewpoint = ns.BehaviourEngine.GLOBAL;
                delete this.behaviour;

                this.stopOrdering();
            } else {
                this.forEachComponent(function (component) {
                    this.removeComponent(component);
                }.bind(this));
            }

            onchange_ordering.call(this);

            this.description = Wirecloud.Wiring.normalize().visualdescription;

            return this;
        },

        /**
         * [emptyBehaviour description]
         *
         * @param {Behaviour} [behaviour]
         *      [description]
         * @returns {BehaviourEngine}
         *      The instance on which the member is called.
         */
        emptyBehaviour: function emptyBehaviour(behaviour) {
            var _behaviour;

            if (!this.enabled) {
                return this;
            }

            if (behaviour == null) {
                behaviour = this.behaviour;
            }

            if (!this.behaviour.equals(behaviour)) {
                _behaviour = this.behaviour;
                this.activate(behaviour);
            }

            this.forEachComponent(function (component) {

                if (behaviour.hasComponent(component)) {
                    _removeComponent.call(this, component);
                }
            }.bind(this));
            behaviour.clear();

            if (_behaviour != null) {
                this.activate(_behaviour);
            }

            return this;
        },

        /**
         * [TODO: filterByComponent description]
         *
         * @param {Component} component
         *      [TODO: description]
         * @returns {Behaviour[]}
         *      [TODO: description]
         */
        filterByComponent: function filterByComponent(component) {
            return this.behaviours.filter(function (behaviour) {
                return behaviour.hasComponent(component);
            });
        },

        filterByConnection: function filterByConnection(connection) {
            return this.behaviours.filter(function (behaviour) {
                return behaviour.hasConnection(connection);
            });
        },

        /**
         * [TODO: forEachComponent description]
         *
         * @param {Function} callback
         *      [TODO: description]
         * @returns {BehaviourEngine}
         *      The instance on which the member is called.
         */
        forEachComponent: function forEachComponent(callback) {
            var id, type;

            for (type in this.components) {
                for (id in this.components[type]) {
                    callback(this.components[type][id]);
                }
            }

            return this;
        },

        getConnectionIndex: function getConnectionIndex(connection) {
            var _connection, found, i, index = -1;

            for (found = false, i = 0; !found && i < this.description.connections.length; i++) {
                _connection = this.description.connections[i];

                if (_connection.sourcename == connection.sourceId && _connection.targetname == connection.targetId) {
                    found = true;
                    index = i;
                }
            }

            return index;
        },

        getCurrentStatus: function getCurrentStatus() {
            return {
                title: "",
                connections: this.description.connections.length,
                components: {
                    operator: Object.keys(this.description.components.operator).length,
                    widget: Object.keys(this.description.components.widget).length
                }
            };
        },

        /**
         * [TODO: hasComponent description]
         *
         * @param {Component} component
         *      [TODO: description]
         * @returns {Boolean}
         *      [TODO: description]
         */
        hasComponent: function hasComponent(component) {
            var found;

            if (this.enabled) {
                found = this.behaviours.some(function (behaviour) {
                    return behaviour.hasComponent(component);
                });
            } else {
                found = component.id in this.description.components[component.type];
            }

            return found;
        },

        /**
         * [TODO: hasComponents description]
         *
         * @returns {Boolean}
         *      [TODO: description]
         */
        hasComponents: function hasComponents() {
            return (Object.keys(this.components.operator).length + Object.keys(this.components.widget).length) > 0;
        },

        /**
         * [TODO: hasConnection description]
         *
         * @param {Connection} connection
         *      [TODO: description]
         * @returns {Boolean}
         *      [TODO: description]
         */
        hasConnection: function hasConnection(connection) {
            var found;

            if (this.enabled) {
                found = this.behaviours.some(function (behaviour) {
                    return behaviour.hasConnection(connection);
                });
            } else {
                found = this.getConnectionIndex(connection) !== -1;
            }

            return found;
        },

        /**
         * [TODO: loadBehaviours description]
         *
         * @param  {PlainObject[]} behaviours
         *      [TODO: description]
         * @returns {BehaviourEngine}
         *      The instance on which the member is called.
         */
        loadBehaviours: function loadBehaviours(behaviours) {

            behaviours.forEach(function (info) {
                var behaviour = this.createBehaviour(info);

                behaviour.logManager.log(utils.interpolate(utils.gettext("The behaviour (%(title)s) was loaded."), behaviour), Wirecloud.constants.LOGGING.INFO_MSG);
            }, this);

            if (behaviours.length) {
                this.enabled = true;
                this.activate();
            } else {
                this.dispatchEvent('change', this.getCurrentStatus(), this.enabled);
            }

            return this;
        },

        /**
         * [TODO: removeBehaviour description]
         *
         * @param {Behaviour} behaviour
         *      [TODO: description]
         * @returns {BehaviourEngine}
         *      The instance on which the member is called.
         */
        removeBehaviour: function removeBehaviour(behaviour) {
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
        },

        /**
         * [TODO: removeComponent description]
         *
         * @param {Component} component
         *      [TODO: description]
         * @param {Boolean} [cascade=false]
         *      [TODO: description]
         * @returns {BehaviourEngine}
         *      The instance on which the member is called.
         */
        removeComponent: function removeComponent(component, cascade) {

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
        },

        removeComponentList: function removeComponentList(componentList) {
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
        },

        /**
         * [TODO: removeConnection description]
         *
         * @param {Connection} connection
         *      [TODO: description]
         * @param {Boolean} [cascade=false]
         *      [TODO: description]
         * @returns {BehaviourEngine}
         *      The instance on which the member is called.
         */
        removeConnection: function removeConnection(connection, cascade) {
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
        },

        stopOrdering: function stopOrdering() {

            if (this.orderingEnabled) {
                this.btnOrder.click();
            }

            return this;
        },

        /**
         * [TODO: toggleViewpoint description]
         *
         * @returns {BehaviourEngine}
         *      The instance on which the member is called.
         */
        toggleViewpoint: function toggleViewpoint() {
            return this.activate(this.behaviour, true);
        },

        /**
         * [TODO: toJSON description]
         *
         * @returns {PlainObject}
         *      The instance on which the member is called.
         */
        toJSON: function toJSON() {
            return JSON.parse(JSON.stringify({
                behaviours: this.behaviours,
                components: this.description.components,
                connections: this.description.connections
            }));
        },

        /**
         * [TODO: updateComponent description]
         *
         * @param {Component} component
         * @param {PlainObject} view
         *      [TODO: description]
         * @param {Boolean} [beShared=false]
         *      [TODO: description]
         * @returns {BehaviourEngine}
         *      The instance on which the member is called.
         */
        updateComponent: function updateComponent(component, view, beShared) {
            var name;

            if (this.enabled) {
                switch (this.viewpoint) {
                case ns.BehaviourEngine.GLOBAL:
                    if (!component.background || beShared) {
                        this.behaviour.updateComponent(component);
                        component.removeAllowed = (this.filterByComponent(component).length == 1);
                        component.background = false;
                    }
                    break;
                case ns.BehaviourEngine.INDEPENDENT:
                    // TODO: do nothing
                    return this;
                }
            }

            if (!(component.id in this.description.components[component.type])) {
                this.description.components[component.type][component.id] = {};
            }

            view = view || {};

            for (name in view) {
                this.description.components[component.type][component.id][name] = view[name];
            }

            this.components[component.type][component.id] = component;

            if (!this.enabled) {
                this.dispatchEvent('change', this.getCurrentStatus(), this.enabled);
            }

            return this;
        },

        /**
         * [TODO: updateConnection description]
         *
         * @param {Connection} connection
         *      [TODO: description]
         * @param {PlainObject} view
         *      [TODO: description]
         * @param {Boolean} [beShared=false]
         *      [TODO: description]
         * @returns {BehaviourEngine}
         *      The instance on which the member is called.
         */
        updateConnection: function updateConnection(connection, view, beShared) {
            var index = this.getConnectionIndex(connection);

            if (this.enabled) {
                switch (this.viewpoint) {
                case ns.BehaviourEngine.GLOBAL:
                    if (!connection.background || beShared) {
                        this.behaviour.updateConnection(connection);
                        this.updateComponent(connection.sourceComponent, {}, true);
                        this.updateComponent(connection.targetComponent, {}, true);
                        connection.removeAllowed = (this.filterByConnection(connection).length == 1);
                        connection.background = false;
                    }
                    break;
                case ns.BehaviourEngine.INDEPENDENT:
                    // TODO: do nothing
                    return this;
                }
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

    });

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

        removeConnections.call(this, component, true);
        component.remove();

        this.dispatchEvent('change', this.getCurrentStatus(), this.enabled);

        return this;
    };

    var desactivateAllExcept = function desactivateAllExcept(behaviour) {
        var i, found;

        for (found = false, i = 0; i < this.behaviours.length; i++) {
            this.behaviours[i].active = false;

            if (!found && this.behaviours[i].equals(behaviour)) {
                this.behaviour = this.behaviours[i];
                found = true;
            }
        }

        this.behaviour.active = true;

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
        var dialog = new Wirecloud.ui.FormWindowMenu([
                {name: 'title', label: utils.gettext("Title"), type: 'text'},
                {name: 'description', label: utils.gettext("Description"), type: 'longtext'}
            ],
            utils.gettext("New behaviour"),
            'we-new-behaviour-modal'
        );

        dialog.executeOperation = this.createBehaviour.bind(this);
        dialog.show();
    };

    var btnenable_onclick = function btnenable_onclick() {
        var dialog, message;

        if (this.enabled) {
            message = utils.gettext("The behaviours will be removed but the components and connections will still exist, would you like to continue?");

            dialog = new Wirecloud.ui.AlertWindowMenu({
                acceptLabel: utils.gettext("Continue"),
                cancelLabel: utils.gettext("Cancel")
            });
            dialog.setMsg(message);
            dialog.acceptHandler = function () {
                for (var i = this.behaviours.length - 1; i >= 0; i--) {
                    this.body.removeChild(this.behaviours[i]);
                }

                this.behaviours.length = 0;
                delete this.behaviour;
                this.enabled = false;
                this.dispatchEvent('enable', this.enabled);
            }.bind(this);
            dialog.show();
        } else {
            this.enabled = true;
            this.createBehaviour();
            this.dispatchEvent('enable', this.enabled);
        }
    };

    var insertBehaviour = function insertBehaviour(behaviour) {
        this.body.appendChild(behaviour);
        this.behaviours.push(behaviour);

        if (behaviour.active || !this.behaviour) {
            desactivateAllExcept.call(this, behaviour);
        }

        enableToRemoveBehaviour.call(this);
        onchange_ordering.call(this);

        return behaviour;
    };

    var onchange_ordering = function onchange_ordering() {
        this.btnOrder.setDisabled(!this.enabled || this.behaviours.length < 2);

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

        message = builder.parse(builder.DEFAULT_OPENING + utils.gettext("The <strong><t:title/></strong> <t:type/> will be removed, would you like to continue?") + builder.DEFAULT_CLOSING, {
                type: component.type,
                title: component.title
            });

        modal = new Wirecloud.ui.AlertWindowMenu();
        modal.setMsg(message);
        modal.acceptHandler = _removeComponent.bind(this, component, false);
        modal.show();

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

        modal = new Wirecloud.ui.AlertWindowMenu();
        modal.setMsg(message);
        modal.acceptHandler = function () {
            var i;

            for (i = 0; i < componentList.length; i++) {
                _removeComponent.call(this, componentList[i], false);
            }
        }.bind(this);
        modal.show();

        return this;
    };

    var showComponentDeleteCascadeModal = function showComponentDeleteCascadeModal(component) {
        var modal, message;

        message = builder.parse(builder.DEFAULT_OPENING + utils.gettext("The <strong><t:title/></strong> <t:type/> will be <strong>definitely</strong> removed, would you like to continue?") + builder.DEFAULT_CLOSING, {
                type: component.type,
                title: component.title
            });

        modal = new Wirecloud.ui.AlertWindowMenu();
        modal.setMsg(message);
        modal.acceptHandler = _removeComponent.bind(this, component, true);
        modal.show();

        return this;
    };

    var removeConnections = function removeConnections(component, cascade) {

        component.forEachConnection(function (connection) {
            this.removeConnection(connection, cascade);
        }.bind(this));

        return this;
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
                context.tmpBehaviour = behaviour.get().cloneNode(true);
                context.tmpBehaviour.classList.add("dragging");
                context.layout.appendChild(context.tmpBehaviour);

                behaviour.addClassName("temporal");

                behaviourBCR = behaviour.get().getBoundingClientRect();
                layoutBCR = context.layout.getBoundingClientRect();

                context.x = behaviourBCR.left - layoutBCR.left - ((behaviour.get().offsetWidth - behaviour.get().clientWidth) / 2);
                context.y = (event.clientY + layout.scrollTop) - (layoutBCR.top + (behaviour.get().offsetHeight / 2));

                context.tmpBehaviour.style.left = context.x + 'px';
                context.tmpBehaviour.style.width = behaviour.get().offsetWidth + 'px';
                context.tmpBehaviour.style.top = context.y + 'px';

                var firstBehaviour = this.behaviours[0].get(), lastBehaviour = this.behaviours[this.behaviours.length - 1].get();

                context.upperLimit = firstBehaviour.offsetTop;
                context.lowerLimit = lastBehaviour.offsetTop;

                context.offsetHeight = event.clientY - (behaviourBCR.top + (behaviour.get().offsetHeight / 2));

                context.marginVertical = 5;

                context.refHeigth = behaviourBCR.height + context.marginVertical;
                context.refHeigthUp = (behaviourBCR.height / 2) + context.marginVertical;
                context.refHeigthDown = context.refHeigthUp;

                context.canMoveUp = this.behaviours.indexOf(behaviour);
                context.canMoveDown = this.behaviours.length - (context.canMoveUp + 1);
            }.bind(this),
            function drag(e, draggable, context, xDelta, yDelta) {
                var offsetTop = Math.round(context.y + yDelta);

                context.tmpBehaviour.style.width = behaviour.get().offsetWidth + 'px';

                if (offsetTop >= context.upperLimit && offsetTop <= context.lowerLimit) {
                    context.tmpBehaviour.style.top = offsetTop + 'px';
                }

                if ((context.canMoveUp > 0) && (-(yDelta + context.offsetHeight) > context.refHeigthUp)) {
                    context.canMoveUp -= 1;
                    context.refHeigthUp += context.refHeigth;

                    context.canMoveDown += 1;
                    context.refHeigthDown -= context.refHeigth;

                    moveUpBehaviour.call(this, behaviour);
                } else if ((context.canMoveDown > 0) && ((yDelta + context.offsetHeight) > context.refHeigthDown)) {
                    context.canMoveUp += 1;
                    context.refHeigthUp -= context.refHeigth;

                    context.canMoveDown -= 1;
                    context.refHeigthDown += context.refHeigth;

                    moveDownBehaviour.call(this, behaviour);
                }
            }.bind(this),
            function dragend(draggable, context) {
                behaviour.removeClassName("temporal");
                context.layout.removeChild(context.tmpBehaviour);
            },
            function canDrag() {
                return true;
            }
        );

        return this;
    };

    var moveDownBehaviour = function moveDownBehaviour(behaviour) {
        var nextBehaviour, index = this.behaviours.indexOf(behaviour);

        if (index == (this.behaviours.length - 1)) {
            return this;
        }

        nextBehaviour = this.behaviours[index + 1];
        behaviour.parent().insertBefore(behaviour.get(), nextBehaviour.get().nextSibling);

        behaviour.index = index + 1;
        nextBehaviour.index = index;

        this.behaviours[index + 1] = behaviour;
        this.behaviours[index] = nextBehaviour;
    };

    var moveUpBehaviour = function moveUpBehaviour(behaviour) {
        var previousBehaviour, index = this.behaviours.indexOf(behaviour);

        if (index === 0) {
            return this;
        }

        previousBehaviour = this.behaviours[index - 1];
        behaviour.parent().insertBefore(behaviour.get(), previousBehaviour.get());

        behaviour.index = index - 1;
        previousBehaviour.index = index;

        this.behaviours[index - 1] = behaviour;
        this.behaviours[index] = previousBehaviour;
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
