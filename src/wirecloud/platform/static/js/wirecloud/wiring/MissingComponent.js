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

/* global StyledElements, Wirecloud */


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

        constructor: function MissingComponent(id, type, wiringEngine) {

            this.loaded = false;
            this.pending_events = [];

            this.inputs = {};
            this.outputs = {};

            Object.defineProperties(this, {
                id: {value: id},
                type: {value: type},
                logManager: {value: new ns.MissingComponentLogManager(this, wiringEngine)},
                meta: {
                    value: {
                        inputList: [],
                        inputs: {},
                        outputList: [],
                        outputs: {},
                        type: type
                    }
                },
                missing: {value: true}
            });
        },

        statics: {

            BUSINESS_TEMPLATE: {
                id: 0,
                name: "",
                permissions: {},
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

            is: function is(component) {
                return this.meta.type == component.meta.type && this.id == component.id;
            },

            isAllowed: function isAllowed(action) {
                if (action === 'configure') {
                    return false;
                } else if (action in this.permissions) {
                    return this.permissions[action];
                } else {
                    return false;
                }
            },

            load: function load() {
                return this;
            },

            loadBusinessInfo: function loadBusinessInfo(businessInfo) {

                businessInfo = utils.updateObject(ns.MissingComponent.BUSINESS_TEMPLATE, businessInfo);

                Object.defineProperty(this, 'permissions',
                    {value: utils.updateObject(this.constructor.DEFAULT_PERMISSIONS, businessInfo.permissions)});
                Object.freeze(this.permissions);

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

                /* TODO this should be initialized in loadBusinessInfo but, for now, MissingWidgets does not call this method */
                if (!('permissions' in this)) {
                    Object.defineProperty(this, 'permissions', {value: utils.clone(this.constructor.DEFAULT_PERMISSIONS)});
                    Object.freeze(this.permissions);
                }

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
    // PRIVATE MEMBERS
    // ==================================================================================

    var fillComponentMeta = function fillComponentMeta(uri) {
        var splitURI = uri.split('/');

        this.meta.uri = uri;

        this.meta.title = splitURI[1];

        this.meta.vendor = splitURI[0];
        this.meta.name = splitURI[1];
        this.meta.version = {text: splitURI[2]};

        return this;
    };

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
