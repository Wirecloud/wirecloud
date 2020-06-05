/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals NodeList, Wirecloud */


(function () {

    "use strict";

    var build_disable_elements_list = function build_disable_elements_list(list) {
        var i, elements, result = [];

        for (i = 0; i < list.length; i++) {
            if (typeof list[i] === 'object') {
                result.push(list[i]);
            } else if (typeof list[i] === 'function') {
                elements = list[i]();
                if (elements instanceof NodeList) {
                    result = result.concat([].slice.call(elements));
                } else if (Array.isArray(elements)) {
                    result = result.concat(elements);
                } else {
                    result.push(elements);
                }
            }
        }

        return result;
    };

    var get_simple_element = function get_simple_element(element, fallback) {
        if (element == null) {
            element = fallback;
        }

        if (typeof element === 'function') {
            return element();
        } else {
            return element;
        }
    };

    var configure_next_step_phase = function configure_next_step_phase() {
        var msg, targetElement;

        if (this.popup) {
            this.popup.destroy();
        }

        this.next_element = get_simple_element(this.options.elemToApplyNextStepEvent, this.element);
        this.next_element.addEventListener(this.event, this.nextHandler, this.options.eventCapture);

        if (this.start_element != null) {
            this.tutorial.deactivateLayer();
        } else {
            this.tutorial.setControlLayer(this.next_element);
        }

        if (this.start_element != null && this.options.nextStepMsg) {
            msg = this.options.nextStepMsg;
        } else if (this.start_element == null && this.options.msg) {
            msg = this.options.msg;
        }

        if (msg) {
            if (this.options.targetElement != null) {
                targetElement = get_simple_element(this.options.targetElement);
            } else {
                targetElement = this.next_element;
            }
            this.popup = new Wirecloud.ui.Tutorial.PopUp(targetElement, {
                highlight: true,
                user: true,
                msg: msg,
                position: this.nextPosition,
                closable: true
            });
            this.layer.appendChild(this.popup.wrapperElement);
            this.popup.repaint();
            this.popup.addEventListener('close', this.tutorial.destroy.bind(this.tutorial));
        }
    };

    var configure_start_phase = function configure_start_phase() {
        if (this.popup) {
            this.popup.destroy();
        }

        this.start_element = get_simple_element(this.options.elemToApplyDeactivateLayerEvent, this.element);
        this.start_element.addEventListener(this.eventToDeactivateLayer, this.deactivateLayer, true);
        this.isWaitingForDeactivateLayerEvent = true;

        this.tutorial.setControlLayer(this.start_element);
        this.popup = new Wirecloud.ui.Tutorial.PopUp(this.start_element, {
            highlight: true,
            user: true,
            msg: this.options.msg,
            position: this.position,
            closable: true
        });
        this.layer.appendChild(this.popup.wrapperElement);
        this.popup.repaint();
        this.popup.addEventListener('close', this.tutorial.destroy.bind(this.tutorial));
    };

    var clear_restart_handlers = function clear_restart_handlers() {
        var i, restart_handler;

        for (i = 0; i < this.restart_handlers.length; i++) {
            restart_handler = this.restart_handlers[i];
            restart_handler.element.removeEventListener(restart_handler.event, restart_handler.func, true);
        }
        this.restart_handlers = [];
    };

    var restartStep = function restartStep() {
        var i;

        this.next_element.removeEventListener(this.event, this.nextHandler, this.options.eventCapture);
        this.next_element = null;

        for (i = 0; i < this.disableLayer.length; i++) {
            this.layer.removeChild(this.disableLayer[i]);
        }
        this.disableLayer = [];

        clear_restart_handlers.call(this);
        configure_start_phase.call(this);
    };

    var UserAction = function UserAction(tutorial, options) {
        this.options = options;
        // Normalize asynchronous option
        this.options.asynchronous = !!this.options.asynchronous;
        this.layer = tutorial.msgLayer;
        this.last = false;
        this.tutorial = tutorial;
        this.element = options.elem;
        this.position = options.pos;
        this.nextPosition = options.secondPos ? options.secondPos : this.position;
        if (options.event) {
            this.event = options.event;
        } else {
            this.event = 'click';
        }
        this.activeLayer = true;
        this.deactivateLayer = this.deactivateLayer.bind(this);
        this.restartStep = restartStep.bind(this);
        this.disableElems = options.disableElems;
        if (this.disableElems == null) {
            this.disableElems = [];
        }
        this.restart_handlers = [];
        this.disableLayer = [];
        if (options.eventCapture != null) {
            options.eventCapture = !!options.eventCapture;
        } else {
            options.eventCapture = true;
        }
        if (!Array.isArray(options.restartHandlers)) {
            options.restartHandlers = [];
        }
        this.eventToDeactivateLayer = options.eventToDeactivateLayer;
        this.isWaitingForDeactivateLayerEvent = false;

        if (typeof this.options.eventFilterFunction !== 'function') {
            this.options.eventFilterFunction = function () { return true; };
        }

        this.nextHandler = function () {
            if (this.options.eventFilterFunction.apply(null, arguments)) {
                this.tutorial.destroy();
            }
        }.bind(this);
    };

    /**
     * set this SimpleDescription as the last one, don't need next button.
     */
    UserAction.prototype.setLast = function setLast() {
        this.last = true;
    };

    /**
     * set next handler
     */
    UserAction.prototype.setNext = function setNext() {
        this.nextHandler = function () {
            if (this.options.eventFilterFunction.apply(null, arguments)) {
                nextHandler.call(this);
            }
        }.bind(this);
    };

    /**
     * set next handler
     */
    UserAction.prototype.deactivateLayer = function deactivateLayer() {
        var i, restart_handler, element;

        this.isWaitingForDeactivateLayerEvent = false;
        this.start_element.removeEventListener(this.eventToDeactivateLayer, this.deactivateLayer, true);

        for (i = 0; i < this.options.restartHandlers.length; i++) {
            restart_handler = this.options.restartHandlers[i];

            element = get_simple_element(restart_handler.element);
            element.addEventListener(restart_handler.event, this.restartStep, true);
            this.restart_handlers.push({'element': element, 'event': restart_handler.event, 'func': this.restartStep});
        }

        var disableElems = build_disable_elements_list(this.disableElems);
        for (i = 0; i < disableElems.length; i++) {
            this.disableLayer[i] = this.disable(disableElems[i]);
        }

        configure_next_step_phase.call(this);
    };

    /**
     * disable html element
     */
    UserAction.prototype.disable = function disable(elem) {
        var pos, disableLayer;

        pos = elem.getBoundingClientRect();
        disableLayer = document.createElement("div");
        disableLayer.className = 'disableLayer';
        disableLayer.style.top = pos.top + 'px';
        disableLayer.style.left = pos.left + 'px';
        disableLayer.style.width = pos.width + 'px';
        disableLayer.style.height = pos.height + 'px';
        this.layer.appendChild(disableLayer);
        return disableLayer;
    };

    /**
     * set next handler
     */
    var nextHandler = function nextHandler() {
        if (this.isWaitingForDeactivateLayerEvent) {
            return;
        }

        this.next_element.removeEventListener(this.event, this.nextHandler, this.options.eventCapture);
        this.next_element = null;
        this.tutorial.nextStep();
    };

    var _activate = function _activate(element) {
        if (element != null) {
            this.start_element = element;
        }

        if (this.options.eventToDeactivateLayer != null) {
            configure_start_phase.call(this);
        } else {
            configure_next_step_phase.call(this);
        }
    };

    /**
     * activate this step
     */
    UserAction.prototype.activate = function activate() {
        if (this.options.asynchronous) {
            this.element(_activate.bind(this));
        } else {
            _activate.call(this, null);
        }
    };

    /**
     * Destroy
     */
    UserAction.prototype.destroy = function destroy() {
        var i;

        if (this.start_element) {
            this.start_element.removeEventListener(this.eventToDeactivateLayer, this.deactivateLayer, true);
            this.start_element = null;
        }

        if (this.next_element) {
            this.next_element.removeEventListener(this.event, this.nextHandler, this.options.eventCapture);
            this.next_element = null;
        }

        for (i = 0; i < this.disableLayer.length; i++) {
            this.layer.removeChild(this.disableLayer[i]);
        }
        this.disableLayer = null;

        clear_restart_handlers.call(this);

        if (this.popup != null) {
            this.popup.destroy();
        }
        this.textElement = null;
        this.arrow = null;
    };

    Wirecloud.ui.Tutorial.UserAction = UserAction;

})();
