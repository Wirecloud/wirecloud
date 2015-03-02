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
        var headingElement, minLength;

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "panel panel-behaviours";

        headingElement = document.createElement('div');
        headingElement.className = "panel-heading";
        this.wrapperElement.appendChild(headingElement);

        this.bodyElement = document.createElement('div');
        this.bodyElement.className = "panel-body";
        this.wrapperElement.appendChild(this.bodyElement);

        minLength = 1;
        Object.defineProperty(this, 'erasureEnabled', {
            'get': function get() {
                return this.behaviourList.length > minLength;
            }
        });

        this.behaviourList = [];
    };

    /**
     * @public
     * @function
     *
     * @param {StyledElement} behaviour
     * @returns {BehaviourManagerMixin} The instance on which this function was called.
     */
    BehaviourManagerMixin.prototype._appendBehaviour = function _appendBehaviour(behaviour) {
        this.bodyElement.appendChild(behaviour.wrapperElement);
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
    BehaviourManagerMixin.prototype.getBehaviourIndexOf = function getBehaviourIndexOf(behaviour) {
        var i, index;

        for (index = -1, i = 0; index < 0 && i < this.behaviourList.length; i++) {
            if (this.behaviourList[i].equals(behaviour)) {
                index = i;
            }
        }

        return index;
    };

    return BehaviourManagerMixin;

})();
