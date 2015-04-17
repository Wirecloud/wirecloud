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

/*global Wirecloud */


Wirecloud.ui.WiringEditor.BehaviourManagerMixin = (function () {

    "use strict";

    /**
     * Create a new instance of class BehaviourManagerMixin.
     * @mixin
     * @class
     */
    var BehaviourManagerMixin = function BehaviourManagerMixin() {
        var iconElement, headingElement, minLength;

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "panel behaviour-panel";

        headingElement = document.createElement('div');
        headingElement.className = "panel-heading";
        this.wrapperElement.appendChild(headingElement);

        this.btnEnable = new StyledElements.StyledButton({
            'plain': true,
            'title': gettext("Disabled"),
            'iconClass': 'icon-lock',
            'class': "btn-enable-behaviour-engine"
        });
        this.btnEnable.addClassName('active');
        this.btnEnable.insertInto(headingElement);

        this.btnViewpoint = new StyledElements.StyledButton({
            'plain': true,
            'text': gettext("Global"),
            'title': gettext("Viewpoint"),
            'class': "btn-switch-viewpoint"
        });
        this.btnViewpoint.addClassName('active');
        this.btnViewpoint.insertInto(headingElement);

        this.bodyElement = document.createElement('div');
        this.bodyElement.className = "panel-body";
        this.wrapperElement.appendChild(this.bodyElement);

        minLength = 1;
        Object.defineProperty(this, 'erasureEnabled', {
            'get': function get() {
                return this.behaviourList.length > minLength;
            }
        });

        this.btnCreate = document.createElement('div');
        this.btnCreate.className = "btn btn-default btn-create-behaviour";
        this.bodyElement.appendChild(this.btnCreate);

        iconElement = document.createElement('span');
        iconElement.className = "icon-plus";
        this.btnCreate.appendChild(iconElement);

        this.behaviourList = [];

        var messageDisabled = document.createElement('div');
            messageDisabled.className = "alert alert-info";
            messageDisabled.innerHTML =
            [
                "<h4 class=\"title\">New behaviour-oriented wiring</h4>",
                "<p class=\"content\">",
                "Enable this section to enjoy with the new way to manage the wiring's connections through behaviours.",
                "</p>"
            ].join('');

        var behavioursEnabled = false;

        Object.defineProperty(this, 'behavioursEnabled', {
            'get': function get() {
                return behavioursEnabled;
            },
            'set': function set(state) {
                if (typeof state === 'boolean') {
                    if ((behavioursEnabled=state)) {
                        this.btnEnable.toggleIconClass('icon-unlock', 'icon-lock');
                        this.btnEnable.setTitle('Enabled');
                        if (!this.btnViewpoint.wrapperElement.parentNode) {
                            headingElement.appendChild(this.btnViewpoint.wrapperElement);
                        }
                        if (!this.btnCreate.parentNode) {
                            this.bodyElement.appendChild(this.btnCreate);
                        }
                        if (messageDisabled.parentNode) {
                            this.bodyElement.removeChild(messageDisabled);
                        }
                    } else {
                        this.btnEnable.toggleIconClass('icon-lock', 'icon-unlock');
                        this.btnEnable.setTitle('Disabled');
                        if (this.btnViewpoint.wrapperElement.parentNode) {
                            headingElement.removeChild(this.btnViewpoint.wrapperElement);
                        }
                        if (this.btnCreate.parentNode) {
                            this.bodyElement.removeChild(this.btnCreate);
                        }
                        if (!messageDisabled.parentNode) {
                            this.bodyElement.appendChild(messageDisabled);
                        }
                    }
                }
            }
        });
    };

    /**
     * @public
     * @function
     *
     * @param {StyledElement} behaviour
     * @returns {BehaviourManagerMixin} The instance on which this function was called.
     */
    BehaviourManagerMixin.prototype._appendBehaviour = function _appendBehaviour(behaviour) {
        this.bodyElement.insertBefore(behaviour.wrapperElement, this.btnCreate);
        this.behaviourList.push(behaviour);

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {StyledElement} behaviour
     * @returns {BehaviourManagerMixin} The instance on which this function was called.
     */
    BehaviourManagerMixin.prototype._removeBehaviour = function _removeBehaviour(behaviour) {
        var index;

        if (this.erasureEnabled && (index=this.behaviourList.indexOf(behaviour)) != -1) {
            this.bodyElement.removeChild(behaviour.wrapperElement);
            this.behaviourList.splice(index, 1);
        }

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {Behaviour} behaviour
     * @returns {Boolean} If the behaviour given is saved.
     */
    BehaviourManagerMixin.prototype.containsBehaviour = function containsBehaviour(behaviour) {
        var found, i;

        for (found = false, i = 0; !found && i < this.behaviourList.length; i++) {
            if (this.behaviourList[i].equals(behaviour)) {
                found = true;
            }
        }

        return found;
    };

    /**
     * @public
     * @function
     *
     * @param {Object.<String, *>} data
     * @returns {BehaviourManagerMixin} The instance on which this function was called.
     */
    BehaviourManagerMixin.prototype.createBehaviour = function createBehaviour(data) {
        return new Wirecloud.ui.WiringEditor.Behaviour(data, this.behaviourList.length);
    };

    /**
     * @public
     * @function
     *
     * @returns {BehaviourManagerMixin} The instance on which this function was called.
     */
    BehaviourManagerMixin.prototype.emptyBehaviourList = function emptyBehaviourList() {
        var i;

        for (i = 0; i < this.behaviourList.length; i++) {
            this.bodyElement.removeChild(this.behaviourList[i].wrapperElement);
        }

        this.behaviourList.length = 0;

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {String} behaviourTitle
     * @returns {StyledElement} Behaviour found.
     */
    BehaviourManagerMixin.prototype.getBehaviourByTitle = function getBehaviourByTitle(behaviourTitle) {
        var i;

        for (i = 0; i < this.behaviourList.length; i++) {
            if (this.behaviourList[i].title === behaviourTitle) {
                return this.behaviourList[i];
            }
        }

        return;
    };

    /**
     * @public
     * @function
     *
     * @param {Behaviour} behaviour
     * @returns {Number} The index of behaviour found.
     */
    BehaviourManagerMixin.prototype.getBehaviourIndex = function getBehaviourIndex(behaviour) {
        var i, index;

        for (index = -1, i = 0; index < 0 && i < this.behaviourList.length; i++) {
            if (this.behaviourList[i].equals(behaviour)) {
                index = i;
            }
        }

        return index;
    };

    /**
     * @public
     * @function
     *
     * @returns {Boolean} If the list of behaviours is not empty.
     */
    BehaviourManagerMixin.prototype.hasBehaviours = function hasBehaviours() {
        return this.behaviourList.length != 0;
    };

    BehaviourManagerMixin.prototype.hide = function hide() {
        this.wrapperElement.classList.add('hidden');

        return this;
    };

    BehaviourManagerMixin.prototype.show = function show() {
        this.wrapperElement.classList.remove('hidden');

        return this;
    };

    return BehaviourManagerMixin;

})();
