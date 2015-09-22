/*
 *     Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class MissingComponent.
     *
     * @constructor
     * @param {Number} id
     *      [TODO: description]
     * @param {String} type
     *      [TODO: description]
     * @param {Wiring} wiringEngine
     *      [TODO: description]
     * @param {String} reason
     *      [TODO: description]
     */
    ns.MissingComponent = utils.defineClass({

        constructor: function MissingComponent(id, type, wiringEngine, reason) {

            this.loaded = false;
            this.pending_events = [];

            this.inputs = {};
            this.outputs = {};

            Object.defineProperties(this, {
                id: {value: id},
                logManager: {value: new Wirecloud.wiring.MissingComponentLogManager(this, wiringEngine)},
                meta: {
                    value: {
                        inputList: [],
                        inputs: {},
                        outputList: [],
                        outputs: {},
                        type: type
                    }
                },
                missing: {value: true},
                reason: {value: reason}
            });

            this.logManager.log(utils.interpolate(utils.gettext("A missing %(type)s was restored."), {
                type: type
            }), Wirecloud.constants.LOGGING.WARN_MSG);
        },

        statics: {

            BUSINESS_TEMPLATE: {
                id: 0,
                name: "",
                preferences: {}
            },

            VISUAL_TEMPLATE: {
                name: "",
                position: {
                    x: 0,
                    y: 0
                },
                collapsed: false,
                endpoints: {
                    source: [],
                    target: []
                }
            }

        },

        members: {

            addMissingEndpoint: function addMissingEndpoint(endpointGroup, name) {
                var endpoint, info = {name: name};

                switch (endpointGroup) {
                case 'inputs':
                    endpoint = new ns.GhostTargetEndpoint(this, name);
                    this.inputs[name] = endpoint;
                    this.meta.inputs[name] = info;
                    this.meta.inputList.push(info);
                    break;
                case 'outputs':
                    endpoint = new ns.GhostSourceEndpoint(this, name);
                    this.outputs[name] = endpoint;
                    this.meta.outputs[name] = info;
                    this.meta.outputList.push(info);
                    break;
                }

                return this;
            },

            destroy: function destroy() {
                return this.remove();
            },

            fullDisconnect: function fullDisconnect() {
                var name;

                for (name in this.inputs) {
                    this.inputs[name].fullDisconnect();
                }

                for (name in this.outputs) {
                    this.outputs[name].fullDisconnect();
                }

                return this;
            },

            hasSettings: function hasSettings() {
                return false;
            },

            load: function load() {
                return this;
            },

            loadBusinessInfo: function loadBusinessInfo(businessInfo) {

                businessInfo = utils.updateObject(ns.MissingComponent.BUSINESS_TEMPLATE, businessInfo);

                if (businessInfo.name && !this.meta.name) {
                    fillComponentMeta.call(this, businessInfo.name);

                    Object.defineProperties(this, {
                        preferences: {value: businessInfo.preferences, writable: true},
                        title: {value: this.meta.title}
                    });
                }

                return this;
            },

            loadVisualInfo: function loadVisualInfo(visualInfo) {

                visualInfo = utils.updateObject(ns.MissingComponent.VISUAL_TEMPLATE, visualInfo);

                if (visualInfo.name && !this.meta.name) {
                    fillComponentMeta.call(this, visualInfo.name);

                    Object.defineProperties(this, {
                        preferences: {value: {}, writable: true},
                        title: {value: this.meta.title}
                    });
                }

                visualInfo.endpoints.source.forEach(function (name) {
                    this.addMissingEndpoint('outputs', name);
                }, this);

                visualInfo.endpoints.target.forEach(function (name) {
                    this.addMissingEndpoint('inputs', name);
                }, this);

                return this;
            },

            remove: function remove() {
                return this.fullDisconnect();
            },

            showLogs: function showLogs() {
                var modal = new Wirecloud.ui.LogWindowMenu(this.logManager);
                    modal.show();

                return this;
            },

            showSettings: function showSettings() {
                return this;
            }

        }

    });

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class MissingOperator.
     * @extends {MissingComponent}
     *
     * @constructor
     * @param {Number} id
     *      [TODO: description]
     * @param {Wiring} wiringEngine
     *      [TODO: description]
     * @param {PlainObject} businessInfo
     *      [TODO: description]
     * @param {String} reason
     *      [TODO: description]
     */
    ns.MissingOperator = utils.defineClass({

        constructor: function MissingOperator(id, wiringEngine, businessInfo, reason) {
            this.superClass(id, 'operator', wiringEngine, reason);
            this.loadBusinessInfo(businessInfo);
        },

        inherit: ns.MissingComponent,

        members: {

            /**
             * [TODO: toJSON description]
             *
             * @returns {PlainObject}
             *      [TODO: description]
             */
            toJSON: function toJSON() {
                var name, preferences = {};

                for (name in this.preferences) {
                    preferences[name] = {
                        hidden: this.preferences[name].hidden,
                        readonly: this.preferences[name].readonly,
                        value: this.preferences[name].value
                    };
                }

                return {
                    id: this.id,
                    name: this.meta.uri,
                    preferences: preferences
                };
            }

        }

    });

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class MissingWidget.
     * @extends {MissingComponent}
     *
     * @constructor
     * @param {Number} id
     *      [TODO: description]
     * @param {Wiring} wiringEngine
     *      [TODO: description]
     * @param {PlainObject} visualInfo
     *      [TODO: description]
     * @param {String} reason
     *      [TODO: description]
     */
    ns.MissingWidget = utils.defineClass({

        constructor: function MissingWidget(id, wiringEngine, visualInfo, reason) {
            this.superClass(id, 'widget', wiringEngine, reason);
            this.loadVisualInfo(visualInfo);
        },

        inherit: ns.MissingComponent

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    function fillComponentMeta(uri) {
        var splitURI = uri.split('/');

        this.meta.uri = uri;

        this.meta.title = splitURI[1];

        this.meta.vendor = splitURI[0];
        this.meta.name = splitURI[1];
        this.meta.version = {text: splitURI[2]};

        return this;
    }

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
