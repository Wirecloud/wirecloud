/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

/*global Wirecloud*/

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

    /*************************************************************************
     * Constructor
     *************************************************************************/
    var UserAction = function UserAction(tutorial, options) {
        var pos;

        this.options = options;
        // Normalize asynchronous option
        this.options.asynchronous = !!this.options.asynchronous;
        this.layer = tutorial.msgLayer;
        this.last = false;
        this.tutorial = tutorial;
        this.element = options.elem;
        this.position = options.pos;
        this.event = options.event;
        this.activeLayer = true;
        this.deactivateLayer = this.deactivateLayer.bind(this);
        this.disableElems = options.disableElems;
        if (this.disableElems == null) {
            this.disableElems = [];
        }
        this.disableLayer = [];
        this.elemToApplyNextStepEvent = options.elemToApplyNextStepEvent;
        if (this.elemToApplyNextStepEvent == null) {
            this.elemToApplyNextStepEvent == this.element;
        }

        this.eventToDeactivateLayer = options.eventToDeactivateLayer;
        this.isWaitingForDeactivateLayerEvent = false;
        this.elemToApplyDeactivateLayerEvent = options.elemToApplyDeactivateLayerEvent;
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
        this.nextHandler = nextHandler.bind(this);
    };

    /**
     * set next handler
     */
    UserAction.prototype.deactivateLayer = function deactivateLayer() {
        this.tutorial.deactivateLayer();
        this.isWaitingForDeactivateLayerEvent = false;
        this.elemToApplyDeactivateLayerEvent.removeEventListener(this.eventToDeactivateLayer, this.deactivateLayer, false);

        if (this.options.nextStepMsg) {
            if (this.popup) {
                this.popup.destroy();
            }
            this.popup = new Wirecloud.ui.Tutorial.PopUp(this.elemToApplyNextStepEvent, {
                highlight: true,
                msg: this.options.nextStepMsg,
                position: this.position,
                closable: false
            });
            this.layer.appendChild(this.popup.wrapperElement);
            this.popup.addEventListener('close', this.tutorial.destroy.bind(this.tutorial, true));
        }
    };

    /**
     * disable html element
     */
    UserAction.prototype.disable = function disable(elem) {
        var pos, disableLayer;

        pos = elem.getBoundingClientRect();
        disableLayer = document.createElement("div");
        disableLayer.addClassName('disableLayer');
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
    var nextHandler = function nextHandler(e) {
        if (this.isWaitingForDeactivateLayerEvent) {
            return;
        }

        if (this.event == null) {
            this.elemToApplyNextStepEvent.removeEventListener('click', this.nextHandler, true);
        } else {
            this.elemToApplyNextStepEvent.removeEventListener(this.event, this.nextHandler);
        }

        this.tutorial.nextStep();
    };

    var _activate = function _activate(element, withoutCloseButton) {
        var pos, descSize, i;
        if (element == null){
            return null;
        }
        this.element = element;

        if (this.elemToApplyDeactivateLayerEvent) {
            this.elemToApplyDeactivateLayerEvent = this.elemToApplyDeactivateLayerEvent();
        } else {
            this.elemToApplyDeactivateLayerEvent = this.element;
        }

        if (this.elemToApplyNextStepEvent) {
            this.elemToApplyNextStepEvent = this.elemToApplyNextStepEvent();
        } else {
            this.elemToApplyNextStepEvent = this.element;
        }

        this.tutorial.setControlLayer(this.element);
        this.popup = new Wirecloud.ui.Tutorial.PopUp(element, {
            highlight: true,
            msg: this.options.msg,
            position: this.position,
            closable: !withoutCloseButton
        });
        this.layer.appendChild(this.popup.wrapperElement);
        this.popup.addEventListener('close', this.tutorial.destroy.bind(this.tutorial, true));

        if (this.event == null) {
            this.elemToApplyNextStepEvent.addEventListener('click', this.nextHandler, true);
        } else {
            this.elemToApplyNextStepEvent.addEventListener(this.event, this.nextHandler);
        }

        var disableElems = build_disable_elements_list(this.disableElems);
        for (i = 0; i < disableElems.length; i ++) {
            this.disableLayer[i] = this.disable(disableElems[i]);
        }

        if (this.eventToDeactivateLayer != null) {
            this.elemToApplyDeactivateLayerEvent.addEventListener(this.eventToDeactivateLayer, this.deactivateLayer, false);
            this.isWaitingForDeactivateLayerEvent = true;
        }
    };

    /**
     * activate this step
     */
    UserAction.prototype.activate = function activate(withoutCloseButton) {
        if (this.options.asynchronous) {
            this.element(_activate.bind(this));
        } else {
            _activate.call(this, this.element(), withoutCloseButton);
        }
    };

    /**
     * Destroy
     */
    UserAction.prototype.destroy = function destroy() {
        var i;
        if (typeof this.element === 'function') {
            this.element = null;
        } else {
            this.element.removeEventListener('click', this.nextHandler, true);
        }
        for (i = 0; i < this.disableLayer.length; i ++) {
            this.layer.removeChild(this.disableLayer[i]);
        }
        if (this.popup != null) {
            this.popup.destroy();
        }
        this.textElement = null;
        this.arrow = null;
    };

    /*************************************************************************
     * Make Anchor public
     *************************************************************************/
    Wirecloud.ui.Tutorial.UserAction = UserAction;
})();
