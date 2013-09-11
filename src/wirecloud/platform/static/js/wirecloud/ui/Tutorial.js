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
if (!Wirecloud.help) {
    // TODO this line should live in another file
    Wirecloud.help = {};
}

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    var Tutorial = function Tutorial(tut_id) {
        var i, key;

        if (!isVal(tut_id)){
            return null;
        }
        this.stepActive = null;
        this.steps = [];

        this.controlLayer = document.createElement("div");
        this.controlLayerUp = document.createElement("div");
        this.controlLayerDown = document.createElement("div");
        this.controlLayerLeft = document.createElement("div");
        this.controlLayerRight = document.createElement("div");
        this.controlLayer.addClassName("controlLayer");
        this.controlLayerUp.addClassName("controlLayerUp");
        this.controlLayerDown.addClassName("controlLayerDown");
        this.controlLayerLeft.addClassName("controlLayerLeft");
        this.controlLayerRight.addClassName("controlLayerRight");
        this.controlLayer.appendChild(this.controlLayerUp);
        this.controlLayer.appendChild(this.controlLayerDown);
        this.controlLayer.appendChild(this.controlLayerLeft);
        this.controlLayer.appendChild(this.controlLayerRight);

        document.body.appendChild(this.controlLayer);
        this.resetControlLayer();

        this.msgLayer = document.createElement("div");
        this.msgLayer.addClassName("msgLayer");
        document.body.appendChild(this.msgLayer);

        this.instructions = getTutorial(tut_id);

        var mapping = {
            'simpleDescription': Wirecloud.ui.Tutorial.SimpleDescription,
            'userAction': Wirecloud.ui.Tutorial.UserAction,
            'formAction': Wirecloud.ui.Tutorial.FormAction,
            'autoAction': Wirecloud.ui.Tutorial.AutoAction,
        };

        // creating simpleDescriptions
        for (i = 0; i < this.instructions.length; i ++) {
            var constructor = mapping[this.instructions[i].type];
            this.steps[i] = new constructor(this, this.instructions[i]);

            if (i == 0) {
                this.steps[i].wrapperElement.addClassName("activeStep");
                this.stepActive = this.steps[i];
            }
            if (i == this.instructions.length-1) {
                this.steps[i].setLast();
            } else {
                this.steps[i].setNext();
            }
        }
    };

    /**
     * Next Step
     */
    Tutorial.prototype.nextStep = function nextStep() {
        var order;

        order = this.steps.indexOf(this.stepActive );
        if (order < this.steps.length) {
            this.stepActive.destroy();
            this.resetControlLayer(false);
            this.stepActive = this.steps[this.steps.indexOf(this.stepActive) + 1];
            this.stepActive.activate();
        } else {
            this.destroy;
        }
    };

    /**
     * reset controlLayers positions
     */
    Tutorial.prototype.resetControlLayer = function resetControlLayer(isTransparent) {
        this.controlLayerUp.style.opacity = 0.4;
        //up
        this.controlLayerUp.style.height = '100%';
        this.controlLayerUp.style.width = '100%';
        this.controlLayerUp.style.top = 0;
        this.controlLayerUp.style.left = 0;
        //down
        this.controlLayerDown.style.height = 0;
        this.controlLayerDown.style.width = 0;
        this.controlLayerDown.style.top = 0;
        this.controlLayerDown.style.left = 0;
        //right
        this.controlLayerRight.style.height = 0;
        this.controlLayerRight.style.width = 0;
        this.controlLayerRight.style.top = 0;
        this.controlLayerRight.style.left = 0;
        //left
        this.controlLayerLeft.style.height = 0;
        this.controlLayerLeft.style.width = 0;
        this.controlLayerLeft.style.top = 0;
        this.controlLayerLeft.style.left = 0;
        if (isTransparent) {
            this.controlLayerUp.style.opacity = 0;
        }
    }

    /**
     * set controlLayers positions
     */
    Tutorial.prototype.setControlLayer = function setControlLayer(element) {
        var pos;
        if (typeof element !== 'object') {
            return;
        }
        this.controlLayerUp.style.opacity = 0.4;
        pos = element.getBoundingClientRect();
        //up
        this.controlLayerUp.style.height = pos.top + 'px';
        this.controlLayerUp.style.width = '100%';
        //down
        this.controlLayerDown.style.top = (pos.top + pos.height) + 'px';
        this.controlLayerDown.style.width = '100%';
        this.controlLayerDown.style.height = '100%';
        //right
        this.controlLayerRight.style.left = (pos.left + pos.width) + 'px';
        this.controlLayerRight.style.top = pos.top + 'px';
        this.controlLayerRight.style.height = pos.height + 'px';
        this.controlLayerRight.style.width = '100%';
        //left
        this.controlLayerLeft.style.width = pos.left + 'px';
        this.controlLayerLeft.style.height = pos.height + 'px';
        this.controlLayerLeft.style.top = pos.top + 'px';
    };

    /**
     * find the element that content the text
     */
    Tutorial.prototype.findElementByTextContent = function findElementByTextContent(nodes, text) {
        var i;
        for (i = 0; i < nodes.length; i ++) {
            if (nodes[i].textContent() == text) {
                return nodes[i];
            }
        }
        return null;
    }

    /**
     * Destroy
     */
    Tutorial.prototype.destroy = function destroy() {
        var stepActivePos, i;

        stepActivePos = this.steps.indexOf(this.stepActive);
        for (i = stepActivePos; i < this.steps.length; i ++) {
            this.steps[i].destroy();
        }
        document.body.removeChild(this.controlLayer);
        document.body.removeChild(this.msgLayer);
        this.controlLayer = null;
        this.msgLayer = null;
        this.steps = null;
    };

//----------------- TRAINING ZONE --------------------//
// TODO
var isVal = function isVal(id){
    var tutoList = ['addCatalog', 'addWidget', 'changeToWiring', 'changeWorkspace', 'addWorkspace', 'connectWidgets', 'conwetCatalogNotFound'];
    if (tutoList.indexOf(id) == -1) {
        return false;
    } else {
        return true;
    }
}


/* start simple variables */
var wiringEditorButton = function() {
    return document.getElementById("wirecloud_header").childNodes[0].childNodes[0].childNodes[1];
};
var workspaceButton = function() {
    return document.getElementsByClassName("icon-menu")[0];
};

var workspace_in_popUp = function() {
    return document.getElementsByClassName("popup_menu")[0].getElementsByClassName('menu_item')[1];
};

var workspaceName = function() {
    return document.getElementsByClassName("second_level")[0];
};

var marketplaceButton = function() {
    return document.getElementById("wirecloud_header").childNodes[0].childNodes[0].childNodes[2];
};

var cataloguePopUp = function() {
    return document.getElementsByClassName("icon-menu")[0];
};

var addMarketButton = function() {
    var popUpElements = document.getElementsByClassName("popup_menu")[0].childNodes;
    return this.tutorial.findElementByTextContent(popUpElements, 'Add new marketplace');
};

var newWorkspace_in_popUp = function() {
    var popUpElements = document.getElementsByClassName("popup_menu")[0].childNodes;
    return this.tutorial.findElementByTextContent(popUpElements, 'New workspace');
};

var localCatalogue = function() {
    var popUpElements = document.getElementsByClassName("popup_menu")[0].childNodes;
    return this.tutorial.findElementByTextContent(popUpElements, 'local');
};

var conwetCatalogue = function() {
    var popUpElements = document.getElementsByClassName("popup_menu")[0].childNodes;
    var conwet = this.tutorial.findElementByTextContent(popUpElements, 'CoNWeT');
    if (conwet != null) {
        return conwet;
    } else {
        //TODO cargarme el tuto y llamar al tuto que recomiende añadir un marketplace.
        this.tutorial.destroy();
        var conwetCatalogNotFound = function () {new Wirecloud.ui.Tutorial('conwetCatalogNotFound');}.bind(this);
        conwetCatalogNotFound();
        return null;
    }
};

//windowMenuElements
var newName = function() {
    var layoutManager;

    layoutManager = LayoutManagerFactory.getInstance();
    return layoutManager.currentMenu.htmlElement.getElementsByTagName('tr')[0];
};

var newUrl = function() {
    var layoutManager;

    layoutManager = LayoutManagerFactory.getInstance();
    return layoutManager.currentMenu.htmlElement.getElementsByTagName('tr')[1];
};

var acceptButton = function() {
    var layoutManager;

    layoutManager = LayoutManagerFactory.getInstance();
    return layoutManager.currentMenu.htmlElement.getElementsByClassName('styled_button')[1];
};

var closeButton = function() {
    var layoutManager;

    layoutManager = LayoutManagerFactory.getInstance();
    return layoutManager.currentMenu.htmlElement.getElementsByClassName('closebutton')[0];
};

var cancelButton = function() {
    var layoutManager;

    layoutManager = LayoutManagerFactory.getInstance();
    return layoutManager.currentMenu.htmlElement.getElementsByClassName('window_bottom')[0].getElementsByClassName('styled_button')[1];
};

var searchForm = function() {
    return LayoutManagerFactory.getInstance().viewsByName.marketplace.alternatives.getCurrentAlternative().viewsByName.search.wrapperElement.getElementsByClassName("container west_container search_bar")[0];
};

var searchInputMarketplace = function() {
    return LayoutManagerFactory.getInstance().viewsByName.marketplace.alternatives.getCurrentAlternative().viewsByName.search.wrapperElement.getElementsByClassName('simple_search_text')[0];
};

var searchButton = function() {
    return LayoutManagerFactory.getInstance().viewsByName.marketplace.alternatives.getCurrentAlternative().viewsByName.search.wrapperElement.getElementsByClassName('simple_search_text')[0].parentElement.getElementsByClassName('styled_button')[0];
};

/* checked */
var windowForm = function(callback) {
    var layoutManager, old_function;

    layoutManager = LayoutManagerFactory.getInstance();

    old_function = layoutManager._showWindowMenu;

    layoutManager._showWindowMenu = function () {
        old_function.apply(this, arguments);
        layoutManager._showWindowMenu = old_function;
        setTimeout(function () {
            var element = layoutManager.currentMenu.htmlElement;
            callback(element);
        }, 0);
    }
};

var addbuttonMinesWeeper = function() {
    var resources, miniweeper;

    resources = LayoutManagerFactory.getInstance().viewsByName.marketplace.alternatives.getCurrentAlternative().viewsByName.search.wrapperElement.getElementsByClassName('resource_name');
    miniweeper = this.tutorial.findElementByTextContent(resources, 'Minesweeper');
    return miniweeper.parentNode.getElementsByClassName("mainbutton")[0];
};

var searchAction = function(autoAction, elem) {
    elem.value = "";
    setTimeout(function() {elem.value = 'M'}, 1000);
    setTimeout(function() {elem.value += 'i'}, 1500);
    setTimeout(function() {elem.value += 'n'}, 2000);
    setTimeout(function() {elem.value += 'e'}, 2500);
    setTimeout(function() {elem.value += 's'}, 3000);
    setTimeout(function() {elem.value += 'w'}, 3500);
    setTimeout(function() {elem.value += 'e'}, 4000);
    setTimeout(function() {elem.value += 'e'}, 4500);
    setTimeout(function() {elem.value += 'p'}, 5000);
    setTimeout(function() {elem.value += 'e'}, 5500);
    setTimeout(function() {elem.value += 'r'}, 6000);
    setTimeout(function() {LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.CoNWeT.viewsByName.search._onSearchInput()}, 7500);
    setTimeout(function() {autoAction.nextHandler();}, 8000);
};

var closebutton_tutorial = function() {
    return document.getElementsByClassName("closebutton tutorial")[0];
};

var tutoMenu = function() {
    return document.getElementsByClassName("tutorialMenu")[0];
};

var firstWidgetInCataloge = function() {
    return LayoutManagerFactory.getInstance().viewsByName.marketplace.alternatives.getCurrentAlternative().viewsByName.search.wrapperElement.getElementsByClassName('resource')[0];
};

var wirirngMenubar = function() {
    return LayoutManagerFactory.getInstance().viewsByName.wiring.wrapperElement.getElementsByClassName('menubar')[0]
}

/* end simple variables */

var getTutorial = function getTutorial(id) {

    switch (id){
    case 'conwetCatalogNotFound':
        return [{'type': 'simpleDescription', 'msg': "CoNWeT catalog not found . Please follow the tutorial 'add new catalog' and try again", 'elem': null}
        ];

    case 'changeToWiring':
        
        return [{'type': 'simpleDescription', 'msg': "1.Bienvenidos al tutorial de Wirecloud.", 'elem': null},
            {'type': 'simpleDescription', 'msg': "2.Muy bien!! el boton Next es lo suficientemente intuitivo para ti!!", 'elem': null},
            {'type': 'simpleDescription', 'msg': "4.TachanTachan!!. Ahora empezará el tutorial de los userAction", 'elem': null},
            {'type': 'userAction', 'msg': "Click this button to go WiringEditor", 'elem': wiringEditorButton, 'pos': 'downRight'},
            {'type': 'simpleDescription', 'msg': "5.Felicidades!!! Has llegado al WiringEditor!!!!", 'elem': null}
        ];

    case 'changeWorkspace':

        return [{'type': 'simpleDescription', 'msg': "Welcome to Wirecloud. We are going to change to another workspace", 'elem': null},
            {'type': 'userAction', 'msg': "Click to open workspace options", 'elem': workspaceButton, 'pos': 'downRight'},
            {'type': 'userAction', 'msg': "Click here to change workspace", 'elem': workspace_in_popUp, 'pos': 'downRight'},
            {'type': 'simpleDescription', 'msg': "5.Felicidades!!! Has cambiado de Workspace!!!!", 'elem': workspaceName}
        ];
    /* Checked */
    case 'addCatalog':

        return [
            {'type': 'simpleDescription', 'msg': "Welcome to Wirecloud. First we are going to add some widgets in our Mashup", 'elem': null},
            {'type': 'userAction', 'msg': "Click to open Marketplace", 'elem': marketplaceButton, 'pos': 'downRight'},
            {'type': 'simpleDescription', 'msg': "Welcome to the Wirecloud Marketplace", 'elem': null},
            {'type': 'userAction', 'msg': "Click here to change catalogue", 'elem': cataloguePopUp, 'pos': 'downRight'},
            {'type': 'userAction', 'msg': "Click here to add new catalogue", 'elem': addMarketButton, 'pos': 'downRight'},
            {'type': 'formAction',
             'mainMsg': "Complete the form",
             'mainPos': 'up',
             'form': windowForm, 'actionElements': [newName, newUrl],
             'actionMsgs': ["write 'CoNWeT' the new catalog name", "Complete the url 'https://wirecloud.conwet.fi.upm.es' to add 'CoNWeT' catalog"],
             'endElement': acceptButton,
             'actionElementsPos': ['downRight', 'downRight'],
             'endElementMsg': "Click here to submit",
             'endElementPos': 'downLeft',
             'asynchronous': true,
             'disableElems': [closeButton, cancelButton]},
            {'type': 'simpleDescription', 'msg': "5.Felicidades!!! Lo has conseguido, ahora podrás seleccionarlo desde el menu!!!!", 'elem': null}
        ];

    case 'addWidget':

        return [{'type': 'simpleDescription', 'msg': "To add a new gadget to our workspace, we have to look from the marketplace.", 'elem': null, 'pos': 'down'},
            {'type': 'userAction', 'msg': "Click to open marketplace", 'elem': marketplaceButton, 'pos': 'downLeft'},
            {'type': 'simpleDescription', 'msg': "Welcome to the Wirecloud Marketplace. First we are going to confirm that we are in CoNWeT catalog", 'elem': null, 'pos': 'right'},
            {'type': 'userAction', 'msg': "Click here to see the available catalogs", 'elem': cataloguePopUp, 'pos': 'downRight'},
            {'type': 'userAction', 'msg': "Click in your local catalog", 'elem': conwetCatalogue, 'pos': 'downRight'},
            {'type': 'simpleDescription', 'msg': "Now, you are in CoNWeT catalog. Here you see a collection of available widgets", 'elem': null, 'pos': 'left'},
            {'type': 'autoAction', 'msg': 'typing "Minesweeper" we can find the widget', 'elem': searchInputMarketplace, 'pos': 'downRight', 'action': searchAction},
            {'type': 'simpleDescription', 'msg': "now, you can see the search results", 'elem': null, 'pos': 'up'},
            {'type': 'userAction', 'msg': "Click here to add this widget in your workspace", 'elem': addbuttonMinesWeeper, 'pos': 'downRight'},
            {'type': 'simpleDescription', 'msg': "Congratulations!!!", 'elem': null},
    ];

    case 'addWorkspace':

        return[{'type': 'simpleDescription', 'msg': "In this tutorial we will learn to create a new Workspace. The Workspaces are independent. You can only connect widgets that are in the same Workspace.", 'elem': null},
            {'type': 'userAction', 'msg': "Please click here to display the Workspaces menu management.", 'elem': workspaceButton, 'pos': 'downRight'},
            {'type': 'userAction', 'msg': "Click here to change workspace", 'elem': newWorkspace_in_popUp, 'pos': 'downRight'},
            {'type': 'formAction',
             'mainMsg': "Complete the form",
             'mainPos': 'up',
             'form': windowForm, 'actionElements': [newName],
             'actionMsgs': ["write a new name for the new Workspace."],
             'endElement': acceptButton,
             'actionElementsPos': ['downRight'],
             'endElementMsg': "Click here to submit",
             'endElementPos': 'downLeft',
             'asynchronous': true,
             'disableElems': [closeButton, cancelButton]},
            {'type': 'simpleDescription', 'msg': "Congratulations you've created a new empty workspace.", 'elem': workspaceName}
        ];

    case 'connectWidgets':
        return [{'type': 'simpleDescription', 'msg': "For connecting widgets have to visit WiringEditor", 'elem': null},
            {'type': 'userAction', 'msg': "Click this button to go Wiring Editor", 'elem': wiringEditorButton, 'pos': 'downRight'},
            {'type': 'simpleDescription', 'msg': "Welcome to the Wiring Editor interface", 'elem': null},
            /*{'type': 'simpleDescription', 'msg': "On the left you can find the menu bar, where you will find widgets added to the workspace and operators installed.", 'elem': wirirngMenubar},
            {'type': 'formAction',
             'mainMsg': "Complete the form",
             'mainPos': 'up',
             'form': windowForm, 'actionElements': [newName, newUrl],
             'actionMsgs': ["write 'CoNWeT' the new catalog name", "Complete the url 'https://wirecloud.conwet.fi.upm.es' to add 'CoNWeT' catalog"],
             'endElement': acceptButton,
             'actionElementsPos': ['downRight', 'downRight'],
             'endElementMsg': "Click here to submit",
             'endElementPos': 'downLeft',
             'asynchronous': true,
             'disableElems': [closeButton, cancelButton]},*/
            {'type': 'simpleDescription', 'msg': "Congratulation, you have connected two widgets", 'elem': null}
        ];

    case 'pruebaPos':
        return [
            {'type': 'simpleDescription', 'msg': "Welcome to Wirecloud.", 'elem': null},
            {'type': 'simpleDescription', 'msg': "First we are going to add some widgets in our Mashup", 'elem': null},
            {'type': 'userAction', 'msg': "Click to open Marketplace", 'elem': marketplaceButton, 'pos': 'downRight'},
            {'type': 'simpleDescription', 'msg': "Welcome to the Wirecloud Marketplace", 'elem': null},
            {'type': 'userAction', 'msg': "Click here to change catalogue", 'elem': cataloguePopUp, 'pos': 'downRight'},
            {'type': 'userAction', 'msg': "Click here to add new catalogue", 'elem': addMarketButton, 'pos': 'downRight'},
            {'type': 'formAction',
             'mainMsg': "Esto es una Prueba",
             'mainPos': 'up',
             'form': windowForm, 'actionElements': [cancelButton, cancelButton, cancelButton],
             'actionMsgs': ["-downRight", "-topRight", "-topLeft"],
             'actionElementsPos': ["downRight", "topRight", "topLeft"],
             'endElement': cancelButton,
             'endElementMsg': "Click here to submit",
             'endElementPos': 'downLeft',
             'asynchronous': true,
             'disableElems': [closeButton]},
            {'type': 'simpleDescription', 'msg': "5.Felicidades!!! Lo has conseguido, ahora podrás seleccionarlo desde el menu!!!!", 'elem': null},
            {'type': 'simpleDescription', 'msg': "--DOWN--.", 'elem': firstWidgetInCataloge, 'pos': 'down'},
            {'type': 'simpleDescription', 'msg': "--RIGHT--.", 'elem': firstWidgetInCataloge, 'pos': 'right'},
            {'type': 'simpleDescription', 'msg': "--LEFT--.", 'elem': firstWidgetInCataloge, 'pos': 'left'},
            {'type': 'simpleDescription', 'msg': "--UP--.", 'elem': firstWidgetInCataloge, 'pos': 'up'}
        ];
    default:
        return null;
    }
};

    /*************************************************************************
     * Make Tutorial public
     *************************************************************************/
    Wirecloud.ui.Tutorial = Tutorial;
})();
