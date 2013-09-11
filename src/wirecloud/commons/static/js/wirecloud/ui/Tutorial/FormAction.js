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

    /*************************************************************************
     * Constructor TODO
     *************************************************************************/
/*     {'type': 'formAction', 'mainMsg': "Complete the form ", 'form': windowForm, 'actionElements': [newName, newUrl], 'actionMsgs': ["chose a new name for the Catalogue.", "Complete the url. for example: 'https://wirecloud.conwet.fi.upm.es'"], 'endElement': acceptButton, 'asynchronous': true},*/
    var FormAction = function FormAction(tutorial, options) {

        this.options = options;
        // Normalize asynchronous option
        this.options.asynchronous = !!this.options.asynchronous;
        this.layer = tutorial.msgLayer;
        this.last = false;
        this.tutorial = tutorial;
        this.mainMsg = options.mainMsg;
        this.mainPos = options.mainPos;
        this.actionElements = options.actionElements;
        this.actionElementsPos = options.actionElementsPos;
        this.actionMsgs = options.actionMsgs;
        this.disableElems = options.disableElems;
        this.endElement = options.endElement;
        this.endElementMsg = options.endElementMsg;
        this.endElementPos = options.endElementPos;
        this.form = options.form;
        this.mainPos = options.mainPos;
        this.subSteps = [];
        this.disableLayer = [];

        this.mainStep = new Wirecloud.ui.Tutorial.SimpleDescription(tutorial,{'type': 'simpleDescription', 'msg': this.mainMsg, 'elem': null});
        this.mainStep.setLast();

        
    };

    /**
     * set this SimpleDescription as the last one, don't need next button. TODO
     */
    FormAction.prototype.setLast = function setLast() {
        this.last = true;
    };

    /**
     * set next handler
     */
    FormAction.prototype.setNext = function setNext() {
        this.nextHandler = nextHandler.bind(this);
    };

    /**
     * set next handler TODO
     */
    var nextHandler = function nextHandler() {
        this.tutorial.nextStep();
    };

    var _activate = function _activate(form) {
        var pos, i, tempElem;
        
        this.element = form;

        //main description
        this.mainStep.wrapperElement.addClassName("activeStep");

        // Positions
        pos = form.getBoundingClientRect();
        switch(this.mainPos) {
            case('up'):
                this.mainStep.wrapperElement.style.top = (pos.top - this.mainStep.wrapperElement.getHeight() - 20) + 'px';
                break;
            case('right'):
                this.mainStep.wrapperElement.style.left = (pos.right + 20) + 'px';
                break;
            case('left'):
                this.mainStep.wrapperElement.style.left = (pos.left - this.mainStep.wrapperElement.getWidth() - 20) + 'px';
                break;
            case('down'):
                this.mainStep.wrapperElement.style.top = (pos.bottom + 20) + 'px';
                break;
            default:
                break;
        }
        //main action for next step
        this.endAction = new Wirecloud.ui.Tutorial.UserAction(this.tutorial, {'type': 'userAction', 'msg': this.endElementMsg, 'elem': this.endElement, 'pos': this.endElementPos});
        this.endAction.setNext();
        var withoutCloseButton = true;
        this.endAction.activate(withoutCloseButton);

        // substeps in this form action
        var activateSubFormAction = function (index, e) {
            this.subSteps[index].wrapperElement.addClassName('activate');
        };
        var deActivateSubFormAction = function (index, e) {
            this.subSteps[index].wrapperElement.removeClassName('activate');
        };

        for (i = 0; i < this.actionElements.length; i ++) {
            this.subSteps[i] = new Wirecloud.ui.Tutorial.UserAction(this.tutorial, {'type': 'userAction', 'msg': this.actionMsgs[i], 'elem': this.actionElements[i], 'pos': this.actionElementsPos[i]});
            this.subSteps[i].activate(withoutCloseButton);
            this.subSteps[i].wrapperElement.addClassName('subFormAction');
            tempElem = this.actionElements[i]();
            tempElem.addEventListener('focus', activateSubFormAction.bind(this, i), true);
            tempElem.addEventListener('blur', deActivateSubFormAction.bind(this, i), true);
        }
        if (this.actionElements != null) {
            this.actionElements[0]().focus();
        }
        for (i = 0; i < this.disableElems.length; i ++) {
            this.disableLayer[i] = this.disable(this.disableElems[i]());
        }
        this.tutorial.setControlLayer(form);
        try {
            LayoutManagerFactory.getInstance().currentMenu.draggable.destroy();
        } catch (e) {
            //error destroying draggable
            throw new Error('Error destroying draggable in Tutorial FormAction');
        }
    };

    /**
     * activate this step
     */
    FormAction.prototype.activate = function activate() {
        if (this.options.asynchronous) {
            this.form(_activate.bind(this));
        } else {
            _activate.call(this, this.form());
        }
    };

    /**
     * disable html element
     */
    FormAction.prototype.disable = function disable(elem) {
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
     * Destroy
     */
    FormAction.prototype.destroy = function destroy() {
        var i;

        for (i = 0; i < this.disableLayer.length; i ++) {
            this.layer.removeChild(this.disableLayer[i]);
        }
        this.mainStep.destroy();
        if (this.endAction != null) {
        	this.endAction.destroy();
        }
    };

    /*************************************************************************
     * Make Anchor public
     *************************************************************************/
    Wirecloud.ui.Tutorial.FormAction = FormAction;
})();
