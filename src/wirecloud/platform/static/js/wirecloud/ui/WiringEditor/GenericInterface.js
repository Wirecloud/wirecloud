/*
 *     DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER
 *
 *     Copyright (c) 2012-2013 Universidad Politécnica de Madrid
 *     Copyright (c) 2012-2013 the Center for Open Middleware
 *
 *     Licensed under the Apache License, Version 2.0 (the
 *     "License"); you may not use this file except in compliance
 *     with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing,
 *     software distributed under the License is distributed on an
 *     "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *     KIND, either express or implied.  See the License for the
 *     specific language governing permissions and limitations
 *     under the License.
 */

/*global gettext, ngettext, interpolate, StyledElements, Wirecloud*/


Wirecloud.ui.WiringEditor.GenericInterface = (function () {

    "use strict";

    /*************************************************************************
     * Private functions
     *************************************************************************/

    var updateErrorInfo = function updateErrorInfo() {
        var label, errorCount = this.entity.logManager.getErrorCount();

        if (errorCount == 0) {
            this.options.optionNotify.hide().setTitle(gettext('No errors'));
        } else {
            label = ngettext("%(errorCount)s error", "%(errorCount)s errors", errorCount);
            label = interpolate(label, {errorCount: errorCount}, true);

            this.options.optionNotify.show().setTitle(label);
        }

    };

    // ==================================================================================
    // CLASS CONSTRUCTOR
    // ==================================================================================

    /**
     * Create a new instance of class GenericInterface.
     * @class
     *
     * @param {String} id
     * @param {Object.<String, *>} [options]
     */
    var GenericInterface = function GenericInterface(wiringEditor, entity, title, manager, className, isGhost) {
        var del_button, log_button, type, msg, ghostNotification;

        StyledElements.Container.call(this, {'class': 'component component-' + className}, ['dragstart', 'dragstop', 'optremove', 'optshare', 'sortstop', 'collapse', 'expand']);

        Object.defineProperty(this, 'entity', {value: entity});
        this.editingPos = false;
        this.targetAnchorsByName = {};
        this.sourceAnchorsByName = {};
        this.targetAnchors = [];
        this.sourceAnchors = [];
        this.wiringEditor = wiringEditor;
        this.title = title;
        this.className = className;
        this.initPos = {'x': 0, 'y': 0};
        this.draggableSources = [];
        this.draggableTargets = [];
        this.activatedTree = null;
        this.hollowConnections = {};
        this.fullConnections = {};
        this.subdataConnections = {};
        this.isMinimized = false;
        this.minWidth = '';
        this.movement = false;
        this.numberOfSources = 0;
        this.numberOfTargets = 0;
        this.potentialArrow = null;
        // Only for minimize maximize operators.
        this.initialPos = null;
        this.isGhost = isGhost;
        this.readOnlyEndpoints = 0;

        if (manager instanceof Wirecloud.ui.WiringEditor.ArrowCreator) {
            this.isMiniInterface = false;
            this.arrowCreator = manager;
        } else {
            this.isMiniInterface = true;
            this.arrowCreator = null;
        }

        // Interface buttons, not for miniInterface
        if (!this.isMiniInterface) {
            if (className == 'widget') {
                type = 'widget';
                this.version = this.entity.version;
                this.vendor = this.entity.vendor;
                this.name = this.entity.name;
            } else {
                type = 'operator';
                this.version = this.entity.meta.version;
                this.vendor = this.entity.meta.vendor;
                this.name = this.entity.meta.name;
            }

            this.componentType = className;
            this.componentId = this.entity.id;

            this.wrapperElement.setAttribute('data-id', this.componentId);

            /* Component Properties */

            Object.defineProperty(this, 'position', {
                'get': function get() {
                    return {
                        'x': parseInt(this.wrapperElement.style.left, 10),
                        'y': parseInt(this.wrapperElement.style.top, 10)
                    };
                },
                'set': function set(newPosition) {
                    if ('x' in newPosition) {
                        this.wrapperElement.style.left = newPosition.x + 'px';
                    }
                    if ('y' in newPosition) {
                        this.wrapperElement.style.top = newPosition.y + 'px';
                    }
                    this.repaint();
                }
            });

            /* Application Status - List of States */

            var readOnly = false;

            Object.defineProperty(this, 'readOnly', {
                'get': function get() {
                    return readOnly;
                },
                'set': function set(state) {
                    if (typeof state === 'boolean') {
                        if ((readOnly=state)) {
                            this.options.optionRemove.hide();
                        } else {
                            this.options.optionRemove.show();
                        }
                    }
                }
            });

            var collapsed = false;

            Object.defineProperty(this, 'collapsed', {
                'get': function get() {
                    return collapsed;
                },
                'set': function set(state) {
                    if (typeof state === 'boolean' && collapsed != state) {
                        if ((collapsed=state)) {
                            collapseEndpoints.call(this);
                        } else {
                            expandEndpoints.call(this);
                        }
                    }
                }
            });

            var onbackground = false;

            Object.defineProperty(this, 'onbackground', {
                'get': function get() {
                    return onbackground;
                },
                'set': function set(state) {
                    if (typeof state === 'boolean') {
                        this.hidden = false;
                        this.sleek = false;
                        if ((onbackground=state)) {
                            this.options.optionRemove.hide();
                            this.options.optionShare.show();
                            this.wrapperElement.classList.add('on-background');
                        } else {
                            this.options.optionRemove.show();
                            this.options.optionShare.hide();
                            this.wrapperElement.classList.remove('on-background');
                        }
                    }
                }
            });

            var hidden = false;

            Object.defineProperty(this, 'hidden', {
                'get': function get() {
                    return hidden;
                },
                'set': function set(state) {
                    if (typeof state === 'boolean') {
                        if ((hidden=state)) {
                            this.wrapperElement.classList.add('hidden');
                        } else {
                            this.wrapperElement.classList.remove('hidden');
                        }
                    }
                }
            });

            var sleek = false;

            Object.defineProperty(this, 'sleek', {
                'get': function get() {
                    return sleek;
                },
                'set': function set(state) {
                    var name, context;

                    if (typeof state === 'boolean') {
                        if ((sleek=state)) {
                            this.onbackground = false;
                            this.hidden = false;
                            this.options.optionRemove.hide();
                            this.wrapperElement.classList.add('sleek');

                            for (name in this.sourceEndpoints) {
                                context = this.sourceEndpoints[name];
                                context.endpoint.classList.add('hidden');
                            }

                            for (name in this.targetEndpoints) {
                                context = this.targetEndpoints[name];
                                context.endpoint.classList.add('hidden');
                            }
                        } else {
                            this.options.optionRemove.show();
                            this.wrapperElement.classList.remove('sleek');

                            for (name in this.sourceEndpoints) {
                                context = this.sourceEndpoints[name];
                                context.endpoint.classList.remove('hidden');
                            }

                            for (name in this.targetEndpoints) {
                                context = this.targetEndpoints[name];
                                context.endpoint.classList.remove('hidden');
                            }
                        }
                    }
                }
            });

            var is_missing = false;

            Object.defineProperty(this, 'missing', {
                'get': function get() {
                    return is_missing;
                },
                'set': function set(state) {
                    if (typeof state === 'boolean') {
                        if ((is_missing=state)) {
                            this.wrapperElement.classList.add('missing');
                        } else {
                            this.wrapperElement.classList.remove('missing');
                        }
                    }
                }
            });

            // Version Status
            if (type == 'operator' &&
                this.wiringEditor.operatorVersions[this.vendor + '/' + this.name] &&
                this.wiringEditor.operatorVersions[this.vendor + '/' + this.name].lastVersion.compareTo(this.version) > 0) {
                    // Old Entity Version
                    this.versionStatus = document.createElement("span");
                    this.versionStatus.classList.add('status');
                    this.versionStatus.classList.add('icon-exclamation-sign');
                    this.versionStatus.setAttribute('title', 'Outdated Version (' + this.version.text + ')');
                    this.header.appendChild(this.versionStatus);
                    this.wrapperElement.classList.add('old')
            }

            var headingElement = this.wrapperElement.appendChild(document.createElement('div'));
                headingElement.className = 'component-heading';

            /* Application Heading - Title */

            var titleElement = headingElement.appendChild(document.createElement('div'));
                titleElement.className = 'component-title';

            var nameElement = document.createElement('span');
                nameElement.className = 'component-name';
                nameElement.textContent = this.title;

            var infoElement = document.createElement('span');
                infoElement.className = 'component-subtitle';

            this.heading = {

                'element': headingElement,

                'titleElement': titleElement,

                'nameElement': titleElement.appendChild(nameElement),

                'infoElement': titleElement.appendChild(infoElement)

            };

            if (isGhost) {
                this.vendor = this.entity.name.split('/')[0];
                this.name = this.entity.name.split('/')[1];
                this.version = new Wirecloud.Version(this.entity.name.split('/')[2].trim());

                this.missing = true;
                this.heading.nameElement.textContent = this.name;
                this.heading.infoElement.textContent = "The component is missing";
            }

            /* Application Heading - List of Options */

            var optionsElement = headingElement.appendChild(document.createElement('div'));
                optionsElement.className = 'component-options';

            this.options = {

                'element': optionsElement,

                'optionNotify': new StyledElements.StyledButton({
                    'class': 'icon-exclamation-sign option-notify',
                    'plain': true
                }),

                'optionCollapse': new StyledElements.StyledButton({
                    'title': gettext("Collapse"),
                    'class': 'option-collapse',
                    'iconClass': 'icon-collapse',
                    'plain': true
                }),

                'optionPreferences': new StyledElements.PopupButton({
                    'class': 'icon-cog option-preferences',
                    'title': gettext("Preferences"),
                    'plain': true
                }),

                'optionRemove': new StyledElements.StyledButton({
                    'class': 'icon-remove option-remove',
                    'title': gettext("Remove"),
                    'plain': true
                }),

                'optionShare': new StyledElements.StyledButton({
                    'class': "icon-plus option-share",
                    'title': gettext("Share"),
                    'plain': true
                })
            };

            optionsElement.appendChild(this.options.optionNotify.hide().wrapperElement);

            if (!isGhost) {
                this.options.optionNotify.addEventListener('click', function (event) {
                    var dialog = new Wirecloud.ui.LogWindowMenu(this.entity.logManager);

                        dialog.htmlElement.classList.add("component-logger");
                        dialog.show();
                }.bind(this));

                updateErrorInfo.call(this);
                this.entity.logManager.addEventListener('newentry', updateErrorInfo.bind(this));
            }

            optionsElement.appendChild(this.options.optionCollapse.wrapperElement);
            this.options.optionCollapse.addEventListener('click', function (originalEvent) {
                this.collapsed = !this.collapsed;
            }.bind(this));

            optionsElement.appendChild(this.options.optionPreferences.wrapperElement);
            this.options.optionPreferences.popup_menu.append(new Wirecloud.ui.WiringEditor.ComponentPreferences(this));

            optionsElement.appendChild(this.options.optionRemove.wrapperElement);
            this.options.optionRemove.addEventListener('click', function (originalEvent) {
                if (!this.readOnly && !this.onbackground) {
                    this.events.optremove.dispatch({
                        'componentId': this.getId()
                    }, originalEvent);
                }
            }.bind(this));

            optionsElement.appendChild(this.options.optionShare.hide().wrapperElement);
            this.options.optionShare.addEventListener('click', function (originalEvent) {
                if (!this.readOnly && this.onbackground)  {
                    this.events.optshare.dispatch({
                        'componentId': this.getId()
                    }, originalEvent);
                }
            }.bind(this));

            /* Application Endpoints - Targets and Sources */

            var bodyElement = this.wrapperElement.appendChild(document.createElement('div'));
                bodyElement.className = 'component-body';

            var targetsElement = bodyElement.appendChild(document.createElement('div'));
                targetsElement.className = 'endpoints target-endpoints';

            var sourcesElement = bodyElement.appendChild(document.createElement('div'));
                sourcesElement.className = 'endpoints source-endpoints';

            this.endpoints = {
                'element': bodyElement,
                'sourcesElement': sourcesElement,
                'targetsElement': targetsElement
            };

            this.sourceEndpoints = {};
            this.targetEndpoints = {};
        } else { // MiniInterface
            this.header = document.createElement("div");
            this.header.className = "component-heading";
            this.wrapperElement.appendChild(this.header);

            // MiniInterface name
            this.nameElement = document.createElement("span");
            this.nameElement.className = "component-title";
            this.nameElement.textContent = title;
            this.header.appendChild(this.nameElement);

            // MiniInterface status
            this.miniStatus = document.createElement("span");
            this.miniStatus.classList.add('status');
            this.miniStatus.classList.add('icon-exclamation-sign');
            this.miniStatus.setAttribute('title', gettext('Warning! this is an old version of the operator, click to change the version'));
            this._miniwidgetMenu_button_callback = function _miniwidgetMenu_button_callback(e) {
                // Context Menu
                e.stopPropagation();
                if (this.contextmenu.isVisible()) {
                    this.contextmenu.hide();
                } else {
                    this.contextmenu.show(this.wrapperElement.getBoundingClientRect());
                }
                return;
            }.bind(this);
            this.miniStatus.addEventListener('mousedown', Wirecloud.Utils.stopPropagationListener, false);
            this.miniStatus.addEventListener('click', this._miniwidgetMenu_button_callback, false);
            this.miniStatus.addEventListener('contextmenu', this._miniwidgetMenu_button_callback, false);
            this.header.appendChild(this.miniStatus);

            // MiniInterface Context Menu
            if (className == 'operator') {
                this.contextmenu = new StyledElements.PopupMenu({'position': ['bottom-left', 'top-left']});
                this._miniwidgetMenu_callback = function _miniwidgetMenu_callback(e) {
                    // Context Menu
                    e.stopPropagation();
                    if (e.button === 2) {
                        if (this.contextmenu.isVisible()) {
                            this.contextmenu.hide();
                        } else {
                            this.contextmenu.show(this.wrapperElement.getBoundingClientRect());
                        }
                        return;
                    }
                }.bind(this);

                this.wrapperElement.addEventListener('mousedown', this._miniwidgetMenu_callback, false);
                this.contextmenu.append(new Wirecloud.ui.WiringEditor.MiniInterfaceSettingsMenuItems(this));
            }
            this.wrapperElement.addEventListener('contextmenu', Wirecloud.Utils.preventDefaultListener);
        }

        // Draggable
        if (!this.isMiniInterface) {
            this.makeDraggable();
        } else { //miniInterface
            this.draggable = new Wirecloud.ui.Draggable(this.wrapperElement, {iObject: this},
                function onStart(draggable, context) {
                    var miniwidget_clon, pos_miniwidget, headerHeight;

                    headerHeight = context.iObject.wiringEditor.getBoundingClientRect().top;

                    //initial position
                    pos_miniwidget = context.iObject.getBoundingClientRect();
                    context.y = pos_miniwidget.top - (headerHeight);
                    context.x = pos_miniwidget.left;
                    //create a miniwidget clon
                    if (context.iObject instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
                        miniwidget_clon = new Wirecloud.ui.WiringEditor.WidgetInterface(context.iObject.wiringEditor,
                                            context.iObject.iwidget, context.iObject.wiringEditor, true);
                    } else {
                        miniwidget_clon = new Wirecloud.ui.WiringEditor.OperatorInterface(context.iObject.wiringEditor,
                                            context.iObject.ioperator, context.iObject.wiringEditor, true);
                    }
                    miniwidget_clon.addClassName('cloned');
                    wiringEditor.layout.slideUp();
                    //set the clon position over the originar miniWidget
                    miniwidget_clon.setBoundingClientRect(pos_miniwidget,
                     {top: -headerHeight, left: 0, width: -2});
                    // put the miniwidget clon in the layout
                    context.iObject.wiringEditor.layout.wrapperElement.appendChild(miniwidget_clon.wrapperElement);
                    //put the clon in the context.iObject
                    context.iObjectClon = miniwidget_clon;
                },
                function onDrag(e, draggable, context, xDelta, yDelta) {
                    if (!wiringEditor.layout.content.wrapperElement.contains(context.iObjectClon.wrapperElement)) {
                        wiringEditor.layout.wrapperElement.removeChild(context.iObjectClon.wrapperElement);
                        wiringEditor.layout.content.appendChild(context.iObjectClon);
                    }
                    context.iObjectClon.setPosition({'x': context.x + xDelta, 'y': context.y + yDelta});
                    context.iObjectClon.repaint();
                },
                this.onFinish.bind(this),
                function () { return this.enabled && !this.wrapperElement.classList.contains('cloned'); }.bind(this)
            );

        }//else miniInterface
    };

    StyledElements.Utils.inherit(GenericInterface, StyledElements.Container);

    GenericInterface.prototype.setVisualInfo = function setVisualInfo(componentView) {
        this.collapsed = componentView.collapsed;
        this.position = componentView.position;

        return this;
    };

    /*************************************************************************
     * Private methods
     *************************************************************************/
    var getElementPos = function getElementPos(elemList, elem) {
        var i;

        for (i = 0; i < elemList.length; i++) {
            if (elem === elemList[i]) {
                return i;
            }
        }
    };

    /**
     * @Private
     * is empty object?
     */
    var isEmpty = function isEmpty(obj) {
        for(var key in obj) {
            return false;
        }
        return true;
    };

    var createMulticonnector = function createMulticonnector(name, anchor) {
        var multiconnector;

        multiconnector = new Wirecloud.ui.WiringEditor.Multiconnector(this.wiringEditor.nextMulticonnectorId, this.getId(), name,
                                    this.wiringEditor.layout.getCenterContainer().wrapperElement,
                                    this.wiringEditor, anchor, null, null);
        this.wiringEditor.nextMulticonnectorId = parseInt(this.wiringEditor.nextMulticonnectorId, 10) + 1;
        this.wiringEditor.addMulticonnector(multiconnector);
        multiconnector.addMainArrow();
    };

    /**
     * OutputSubendpoint
     */
    var OutputSubendpoint = function OutputSubendpoint(name, description, iwidget, type) {
        var nameList, subdata, i;

        this.iwidget = iwidget;
        this.name = name;
        this.subdata = description.subdata;
        this.variable = description;
        this.type = type;

        this.friendcode = description.friendcode;
        nameList = name.split('/');
        subdata = JSON.parse(description.subdata);
        for (i = 1; i < nameList.length; i++) {
            if (nameList[0] == nameList[1]) {
                break;
            }
            subdata = subdata[nameList[i]];
            this.friendcode = subdata.semanticType;
            subdata = subdata.subdata;
        }
    };

    /**
     * Serialize OutputSubendpoint
     */
    OutputSubendpoint.prototype.serialize = function serialize() {
        return {
            'type': this.type,
            'id': this.iwidget.id,
            'endpoint': this.name
        };
    };

    /**
     * Set ActionLabel listeners in a endpoint
     */
    var setlabelActionListeners =  function setlabelActionListeners(labelActionLayer, checkbox)  {
        // Emphasize listeners
        labelActionLayer.addEventListener('mouseover',function (thecheckbox) {
            this.wiringEditor.recommendations.emphasize(thecheckbox);
        }.bind(this, checkbox), false);
        labelActionLayer.addEventListener('mouseout',function (thecheckbox) {
            this.wiringEditor.recommendations.deemphasize(thecheckbox);
        }.bind(this, checkbox), false);
        checkbox.wrapperElement.addEventListener('mouseover',function (thecheckbox) {
            this.wiringEditor.recommendations.emphasize(thecheckbox);
        }.bind(this, checkbox), false);
        checkbox.wrapperElement.addEventListener('mouseout',function (thecheckbox) {
            this.wiringEditor.recommendations.deemphasize(thecheckbox);
        }.bind(this, checkbox), false);

        // Sticky effect
        labelActionLayer.addEventListener('mouseover', checkbox._mouseover_callback, false);
        labelActionLayer.addEventListener('mouseout', checkbox._mouseout_callback, false);

        // Connect anchor whith mouseup on the label
        labelActionLayer.addEventListener('mouseup', checkbox._mouseup_callback, false);
    };

    /**
     * format Tree
     */
    var formatTree = function(treeDiv, entityWidth) {
        var heightPerLeaf, branchList, i, j, nleafsAux, desp,
            checkbox, label, height, firstFrame, firstTree, width,
            diff, treeWidth, actionLayer, bounding, treeBounding,
            leafs, lastTop, subtrees;

        firstFrame = treeDiv.getElementsByClassName("labelsFrame")[0];
        firstTree = treeDiv.getElementsByClassName("tree")[0];
        diff = (firstTree.getBoundingClientRect().top - firstFrame.getBoundingClientRect().top);
        if (diff == -10) {
            return;
        }
        firstFrame.style.top = diff + 10 + 'px';
        height = firstFrame.getBoundingClientRect().height + 10;
        width = firstFrame.getBoundingClientRect().width;
        firstTree.style.height = height + 10 + 'px';
        treeWidth = treeDiv.getBoundingClientRect().width;
        if (treeWidth < entityWidth - 14) {
            treeDiv.style.width = entityWidth - 14 + 'px';
            treeDiv.style.left = 7 + 'px';
        }
        treeDiv.style.height = height + 'px';
        // Vertical Alignment
        leafs = treeDiv.getElementsByClassName('leaf');
        heightPerLeaf = height/leafs.length;

        branchList = treeDiv.getElementsByClassName("dataTree branch");
        for (i = 0; i < branchList.length; i++) {

            // Set Label position
            nleafsAux = branchList[i].getElementsByClassName('leaf').length;
            desp = -(((nleafsAux / 2) * heightPerLeaf) - (heightPerLeaf / 2));
            label = branchList[i].getElementsByClassName('labelTree')[branchList[i].getElementsByClassName('labelTree').length - 1];

            // Set label and anchor position
            checkbox = branchList[i].getElementsByClassName('subAnchor')[branchList[i].getElementsByClassName('subAnchor').length - 1];
            label.style.top = desp + 'px';
            checkbox.style.top = desp + 'px';

            // Set action layer bounding for the label
            treeBounding = branchList[i].getBoundingClientRect();
            if (i == 0) {
                lastTop = treeBounding.top;
            }

            actionLayer = branchList[i].nextElementSibling;
            bounding = label.getBoundingClientRect();
            actionLayer.style.height = bounding.height + 'px';
            actionLayer.style.width = bounding.width + 'px';
            actionLayer.style.left = (bounding.left - treeBounding.left) + 'px';
            actionLayer.style.top = Math.abs(lastTop - bounding.top) + 'px';
            lastTop = treeBounding.top + 1;

            // Set leaf action layers
            setLeafActionLayers(branchList[i].parentNode.children);

            // Set leaf action layers in only-leafs subtree
            if (branchList[i].getElementsByClassName("dataTree branch").length == 0) {
                subtrees = branchList[i].getElementsByClassName('subTree');
                for (j = 0; j < subtrees.length; j++) {
                    // All leafs subtree found
                    setLeafActionLayers(subtrees[j].getElementsByClassName('labelsFrame')[0].children);
                }
            }
        }
    };

    var setLeafActionLayers = function setLeafActionLayers (brothers) {
        var acumulatedTop, j, treeBounding, bounding, actionLayer;

        acumulatedTop = 5;
        for (j = 0; j < brothers.length; j += 2) {
            treeBounding = brothers[j].getBoundingClientRect();
            if (brothers[j].hasClassName('dataTree leaf')) {
                bounding = brothers[j].getElementsByClassName('labelTree')[0].getBoundingClientRect();
                actionLayer = brothers[j].nextElementSibling;
                actionLayer.style.height = bounding.height + 'px';
                actionLayer.style.width = bounding.width + 'px';
                actionLayer.style.left = (bounding.left - treeBounding.left) + 'px';
                actionLayer.style.top = acumulatedTop + 'px';
            }
            acumulatedTop +=  treeBounding.height;
        }
    };

    /*************************************************************************
     * Public methods
     *************************************************************************/

    GenericInterface.prototype.setHidden = function setHidden() {
        this.addClassName('hidden');
    };

    GenericInterface.prototype.setOnBackground = function setOnBackground() {
        this.addClassName('on-background');
        this.del_button.addClassName('icon-plus');
        this.del_button.removeClassName('icon-remove');
        this.del_button.setTitle('Add');
    };

    GenericInterface.prototype.setOnForeground = function setOnForeground() {
        this.removeClassName('hidden');
        this.removeClassName('on-background');
        this.del_button.addClassName('icon-remove');
        this.del_button.removeClassName('icon-plus');
        this.del_button.setTitle('Remove');
    };

    /**
     * Making Interface Draggable.
     */
    GenericInterface.prototype.makeDraggable = function makeDraggable() {
        this.draggable = new Wirecloud.ui.Draggable(this.wrapperElement, {iObject: this},
            function onStart(draggable, context) {
                context.y = context.iObject.wrapperElement.style.top === "" ? 0 : parseInt(context.iObject.wrapperElement.style.top, 10);
                context.x = context.iObject.wrapperElement.style.left === "" ? 0 : parseInt(context.iObject.wrapperElement.style.left, 10);
                context.preselected = context.iObject.selected;
                context.iObject.select(true);
                context.iObject.wiringEditor.onStarDragSelected();

                context.iObject.events.dragstart.dispatch({
                    'componentId': context.iObject.getId(),
                    'componentPosition': context.iObject.position
                });
            },
            function onDrag(e, draggable, context, xDelta, yDelta) {
                context.iObject.setPosition({'x': context.x + xDelta, 'y': context.y + yDelta});
                context.iObject.repaint();
                context.iObject.wiringEditor.onDragSelectedObjects(xDelta, yDelta);
            },
            function onFinish(draggable, context) {
                context.iObject.wiringEditor.onFinishSelectedObjects();
                var position = context.iObject.getStylePosition();

                var parentElement = context.iObject.wrapperElement.parentNode;

                parentElement.insertBefore(context.iObject.wrapperElement, null);

                //pseudoClick
                if ((Math.abs(context.x - position.x) < 2) && (Math.abs(context.y - position.y) < 2)) {
                    if (context.preselected) {
                        context.iObject.unselect(true);
                    }
                    context.iObject.movement = false;
                } else {
                    if (!context.preselected) {
                        context.iObject.unselect(true);
                    }
                    context.iObject.movement = true;
                }

                context.iObject.events['dragstop'].dispatch({
                    'componentId': context.iObject.getId(),
                    'componentPosition': position
                });
            },
            function () {return true; }
        );
    };

    /**
     * Make draggable all sources and targets for sorting
     */
    GenericInterface.prototype.makeSlotsDraggable = function makeSlotsDraggable() {
        var i;

        if (this.draggableSources.length > 1) {
            this.endpoints.sourcesElement.classList.add('endpoint-sorting');

            for (i = 0; i < this.draggableSources.length; i++) {
                this.makeSlotDraggable(this.draggableSources[i], this.wiringEditor.layout.content, 'source-endpoint');
            }
        }

        if (this.draggableTargets.length > 1) {
            this.endpoints.targetsElement.classList.add('endpoint-sorting');

            for (i = 0; i < this.draggableTargets.length; i++) {
                this.makeSlotDraggable(this.draggableTargets[i], this.wiringEditor.layout.content, 'target-endpoint');
            }
        }
    };

    /**
     * Make draggable a specific sources or targets for sorting
     */
    GenericInterface.prototype.makeSlotDraggable = function makeSlotDraggable(element, place, className) {
        element.draggable = new Wirecloud.ui.Draggable(element.wrapperElement, {iObject: element, genInterface: this, wiringEditor: this.wiringEditor},
            function onStart(draggable, context) {
                    var clon, pos_miniwidget, gridbounds, childsN, childPos;

                    //initial position
                    pos_miniwidget = context.iObject.wrapperElement.getBoundingClientRect();
                    gridbounds = context.wiringEditor.getGridElement().getBoundingClientRect();
                    context.y = pos_miniwidget.top - gridbounds.top;
                    context.x = pos_miniwidget.left - gridbounds.left;
                    //create clon
                    context.iObject.wrapperElement.classList.add('selected');
                    clon = context.iObject.wrapperElement.cloneNode(true);
                    clon.classList.add(className);
                    clon.classList.add('cloned');
                    // put the clon in place
                    place.wrapperElement.appendChild(clon);
                    //set the clon position over the originar miniWidget
                    clon.style.height = (pos_miniwidget.height) + 'px';
                    clon.style.left = (context.x) + 'px';
                    clon.style.top = (context.y) + 'px';
                    clon.style.width = (pos_miniwidget.width) + 'px';
                    //put the clon in the context.iObjectClon
                    context.iObjectClon = clon;
                    //put the reference height for change position
                    context.refHeigth = context.iObject.wrapperElement.getBoundingClientRect().height + 2;
                    context.refHeigthUp = context.refHeigth;
                    context.refHeigthDown = context.refHeigth;
                    childsN = context.iObject.wrapperElement.parentNode.childElementCount;
                    childPos = getElementPos(context.iObject.wrapperElement.parentNode.children, context.iObject.wrapperElement);
                    context.maxUps = childPos;
                    context.maxDowns = childsN - (childPos + 1);
                },
                function onDrag(e, draggable, context, xDelta, yDelta) {
                    var top;

                    context.iObjectClon.style.left = (context.x + xDelta) + 'px';
                    context.iObjectClon.style.top = (context.y + yDelta) + 'px';

                    top = parseInt(context.iObjectClon.style.top, 10);
                    if (((context.y - top) > context.refHeigthUp) && (context.maxUps > 0)) {
                        context.maxDowns += 1;
                        context.maxUps -= 1;
                        context.refHeigthUp += context.refHeigth;
                        context.refHeigthDown -= context.refHeigth;
                        context.genInterface.up(context.iObject);
                    } else if (((top - context.y) > context.refHeigthDown) && (context.maxDowns > 0)) {
                        context.maxUps += 1;
                        context.maxDowns -= 1;
                        context.refHeigthDown += context.refHeigth;
                        context.refHeigthUp -= context.refHeigth;
                        context.genInterface.down(context.iObject);
                    }
                },
                function onFinish(draggable, context) {
                    context.iObject.wrapperElement.classList.remove('selected');
                    if (context.iObjectClon.parentNode) {
                        context.iObjectClon.parentNode.removeChild(context.iObjectClon);
                    }
                    context.iObjectClon = null;

                    var i;

                    for (i = 0; i < context.genInterface.endpoints.sourcesElement.childNodes.length; i++) {
                        context.genInterface.endpoints.sourcesElement.childNodes[i].setAttribute('data-index', i + 1);
                    }
                    for (i = 0; i < context.genInterface.endpoints.targetsElement.childNodes.length; i++) {
                        context.genInterface.endpoints.targetsElement.childNodes[i].setAttribute('data-index', i + 1);
                    }
                },
                function () {return true; }
        );
    };

    /**
     * Get the GenericInterface position.
     */
    GenericInterface.prototype.getPosition = function getPosition() {
        var coordinates = {'x': this.wrapperElement.offsetLeft,
                           'y': this.wrapperElement.offsetTop};
        return coordinates;
    };

    /**
     * Get the GenericInterface style position.
     */
    GenericInterface.prototype.getStylePosition = function getStylePosition() {
        var coordinates;
        coordinates = {'x': parseInt(this.wrapperElement.style.left, 10),
                       'y': parseInt(this.wrapperElement.style.top, 10)};
        return coordinates;
    };

    /**
     * Gets an anchor given a name
     */
    GenericInterface.prototype.getAnchor = function getAnchor(name) {
        if (name in this.sourceAnchorsByName) {
            return this.sourceAnchorsByName[name];
        } else if (name in this.targetAnchorsByName) {
            return this.targetAnchorsByName[name];
        } else {
            return null;
        }
    };

    GenericInterface.prototype.getEndpointByName = function getEndpointByName(type, displayName) {
        var endpoint, endpoints, name;

        if (type == 'source') {
            endpoints = this.sourceEndpoints;
        } else {
            endpoints = this.targetEndpoints;
        }

        for (name in endpoints) {
            if (endpoints[name].displayName == displayName) {
                endpoint = endpoints[name];
                break;
            }
        }

        return endpoint;
    };

    /**
     * Add Ghost Endpoint
     */
    GenericInterface.prototype.addGhostEndpoint = function addGhostEndpoint(theEndpoint, isSource) {
        var context;

        if (isSource) {
            context =  {'data': new Wirecloud.wiring.GhostSourceEndpoint(theEndpoint, this.entity), 'iObject': this};
            this.addSource(theEndpoint.endpoint, '', theEndpoint.endpoint, context, true);
            return this.sourceAnchorsByName[theEndpoint.endpoint];
        } else {
            context =  {'data': new Wirecloud.wiring.GhostTargetEndpoint(theEndpoint, this.entity), 'iObject': this};
            this.addTarget(theEndpoint.endpoint, '', theEndpoint.endpoint, context, true);
            return this.targetAnchorsByName[theEndpoint.endpoint];
        }
    };

    /**
     * Set the GenericInterface position.
     */
    GenericInterface.prototype.setPosition = function setPosition(coordinates) {
        this.wrapperElement.style.left = coordinates.x + 'px';
        this.wrapperElement.style.top = coordinates.y + 'px';
    };

    /**
     * Set the BoundingClientRect parameters
     */
    GenericInterface.prototype.setBoundingClientRect = function setBoundingClientRect(BoundingClientRect, move) {
        this.wrapperElement.style.height = (BoundingClientRect.height + move.height) + 'px';
        this.wrapperElement.style.left = (BoundingClientRect.left + move.left) + 'px';
        this.wrapperElement.style.top = (BoundingClientRect.top + move.top) + 'px';
        this.wrapperElement.style.width = (BoundingClientRect.width + move.width) + 'px';
    };

    /**
     * Set the initial position in the menubar, miniobjects.
     */
    GenericInterface.prototype.setMenubarPosition = function setMenubarPosition(menubarPosition) {
        this.menubarPosition = menubarPosition;
    };

    /**
     * Set the initial position in the menubar, miniobjects.
     */
    GenericInterface.prototype.getMenubarPosition = function getMenubarPosition() {
        return this.menubarPosition;
    };

    /**
     * Increasing the number of read only connections
     */
    GenericInterface.prototype.incReadOnlyConnectionsCount = function incReadOnlyConnectionsCount() {
        this.readOnlyEndpoints += 1;
        this.readOnly = true;
    };

    /**
     * Reduce the number of read only connections
     */
    GenericInterface.prototype.reduceReadOnlyConnectionsCount = function reduceReadOnlyConnectionsCount() {
        this.readOnlyEndpoints -= 1;
        if (this.readOnlyEndpoints == 0) {
            this.readOnly = false;
        }
    };
    /**
     * Generic repaint
     */
    GenericInterface.prototype.repaint = function repaint(temporal) {
        var key;

        StyledElements.Container.prototype.repaint.apply(this, arguments);

        for (key in this.sourceAnchorsByName) {
            this.sourceAnchorsByName[key].repaint(temporal);
        }

        for (key in this.targetAnchorsByName) {
            this.targetAnchorsByName[key].repaint(temporal);
        }
    };

    /**
     * Generate SubTree
     */
    GenericInterface.prototype.generateSubTree = function generateSubTree(anchorContext, subAnchors) {
        var treeFrame, key, lab, checkbox, subdata, subTree, labelsFrame, context, name,
            labelActionLayer, entity, type;

        treeFrame = document.createElement("div");
        treeFrame.classList.add('subTree');
        labelsFrame = document.createElement("div");
        labelsFrame.classList.add('labelsFrame');
        treeFrame.appendChild(labelsFrame);
        if (!isEmpty(subAnchors.subdata)) {
            for (key in subAnchors.subdata) {
                lab = document.createElement("span");
                lab.classList.add("labelTree");
                lab.textContent = subAnchors.subdata[key].label;
                name  = anchorContext.data.name + "/" + key;

                if (anchorContext.data.iwidget != null) {
                    entity = anchorContext.data.iwidget;
                    type = 'iwidget';
                } else {
                    entity = anchorContext.data.operator;
                    type = 'ioperator';
                }
                context = {'data': new OutputSubendpoint(name, anchorContext.data, entity, type), 'iObject': this};
                checkbox = new Wirecloud.ui.WiringEditor.SourceAnchor(context, anchorContext.iObject.arrowCreator, subAnchors.subdata[key]);
                checkbox.wrapperElement.classList.add("subAnchor");
                checkbox.wrapperElement.classList.add("icon-circle");
                this.sourceAnchorsByName[name] = checkbox;
                this.sourceAnchors.push(checkbox);
                subdata = document.createElement("div");
                subdata.classList.add("dataTree");
                labelActionLayer = document.createElement("div");
                labelActionLayer.classList.add("labelActionLayer");

                setlabelActionListeners.call(this, labelActionLayer, checkbox);

                subTree = this.generateSubTree(context, subAnchors.subdata[key], checkbox);
                if (subTree !== null) {
                    subdata.appendChild(subTree);
                    subdata.classList.add("branch");
                } else{
                    subdata.classList.add("leaf");
                }

                subdata.appendChild(lab);
                subdata.appendChild(checkbox.wrapperElement);
                labelsFrame.appendChild(subdata);
                labelsFrame.appendChild(labelActionLayer);
            }
            return treeFrame;
        } else {
            return null;
        }
    };

    /**
     * Generate Tree
     */
    GenericInterface.prototype.generateTree = function generateTree(anchor, name, anchorContext, subtree, label, closeHandler) {
        var subAnchors, treeFrame, lab, checkbox, subdata, key, subTree, subTreeFrame, type,
            labelsFrame, labelMain, close_button, context, name, labelActionLayer, entity, treeDiv;

        // Generate tree
        treeDiv = document.createElement("div");
        treeDiv.classList.add('anchorTree');
        treeDiv.addEventListener('click', function (e) {
            e.stopPropagation();
        }.bind(this), false);
        treeDiv.addEventListener('mousedown', function (e) {
            e.stopPropagation();
        }.bind(this), false);

        treeFrame = document.createElement("div");
        treeFrame.classList.add('tree');
        treeFrame.classList.add('sources');

        // Close button
        close_button = new StyledElements.StyledButton({
            'title': gettext("Hide"),
            'class': 'hideTreeButton icon-off',
            'plain': true
        });
        close_button.insertInto(treeFrame);
        close_button.addEventListener('click', function () {closeHandler();}, false);

        subAnchors = JSON.parse(subtree);
        subTreeFrame = null;
        labelsFrame = document.createElement("div");
        labelsFrame.classList.add('labelsFrame');
        if (subAnchors !== null) {
            subTreeFrame = document.createElement("div");
            subTreeFrame.classList.add('subTree');
            for (key in subAnchors) {
                lab = document.createElement("span");
                lab.classList.add("labelTree");
                lab.textContent = subAnchors[key].label;
                name = anchorContext.data.name + "/" + key;

                if (anchorContext.data.iwidget != null) {
                    entity = anchorContext.data.iwidget;
                    type = 'iwidget';
                } else {
                    entity = anchorContext.data.operator;
                    type = 'ioperator';
                }
                context = {'data': new OutputSubendpoint(name, anchorContext.data, entity, type), 'iObject': this};
                checkbox = new Wirecloud.ui.WiringEditor.SourceAnchor(context, anchorContext.iObject.arrowCreator, subAnchors[key]);
                checkbox.wrapperElement.classList.add("subAnchor");
                checkbox.wrapperElement.classList.add("icon-circle");
                this.sourceAnchorsByName[name] = checkbox;
                this.sourceAnchors.push(checkbox);
                subdata = document.createElement("div");
                subdata.classList.add("dataTree");
                labelActionLayer = document.createElement("div");
                labelActionLayer.classList.add("labelActionLayer");

                setlabelActionListeners.call(this, labelActionLayer, checkbox);

                subTree = this.generateSubTree(context, subAnchors[key], checkbox);
                if (subTree !== null) {
                    subdata.appendChild(subTree);
                    subdata.classList.add("branch");
                } else{
                    subdata.classList.add("leaf");
                }

                subdata.appendChild(lab);
                subdata.appendChild(checkbox.wrapperElement);
                labelsFrame.appendChild(subdata);
                labelsFrame.appendChild(labelActionLayer);
                subTreeFrame.appendChild(labelsFrame);
            }
        }

        lab = document.createElement("span");
        lab.classList.add("labelTree");
        lab.textContent = label;
        name = anchorContext.data.name + "/" + anchorContext.data.name;

        if (anchorContext.data.iwidget != null) {
            entity = anchorContext.data.iwidget;
            type = 'iwidget';
        } else {
            entity = anchorContext.data.operator;
            type = 'ioperator';
        }
        context = {'data': new OutputSubendpoint(name, anchorContext.data, entity, type), 'iObject': this};
        checkbox = new Wirecloud.ui.WiringEditor.SourceAnchor(context, anchorContext.iObject.arrowCreator, subAnchors);
        checkbox.wrapperElement.classList.add("subAnchor");
        checkbox.wrapperElement.classList.add("icon-circle");
        this.sourceAnchorsByName[name] = checkbox;
        this.sourceAnchors.push(checkbox);
        subdata = document.createElement("div");
        subdata.classList.add("dataTree");
        labelActionLayer = document.createElement("div");
        labelActionLayer.classList.add("labelActionLayer");

        setlabelActionListeners.call(this, labelActionLayer, checkbox);

        if (subTreeFrame !== null) {
            subdata.appendChild(subTreeFrame);
            subdata.classList.add("branch");
        } else {
            subdata.classList.add("leaf");
        }

        subdata.appendChild(lab);
        subdata.appendChild(checkbox.wrapperElement);
        labelMain = document.createElement("div");
        labelMain.classList.add('labelsFrame');
        labelMain.appendChild(subdata);
        labelMain.appendChild(labelActionLayer);
        treeFrame.appendChild(labelMain);
        treeDiv.appendChild(treeFrame);
        this.wrapperElement.appendChild(treeDiv);

        // Handler for subdata tree menu
        anchor.menu.append(new StyledElements.MenuItem(gettext("Unfold data structure"), this.subdataHandler.bind(this, treeDiv, name)));
    };

    /**
     *  handler for show/hide anchorTrees
     */
    GenericInterface.prototype.subdataHandler = function subdataHandler(treeDiv, name) {
        var initialHeiht, initialWidth, key, i, externalRep, layer,
            subDataArrow, firstIndex, mainEndpoint, mainSubEndPoint, theArrow, mainEndpointArrows;

        if (treeDiv == null) {
            // Descend canvas
            this.wiringEditor.canvas.canvasElement.classList.remove("elevated");

            // Hide tree
            this.activatedTree.classList.remove('activated');
            this.activatedTree = null;

            // Deactivate subdataMode
            this.wrapperElement.classList.remove('subdataMode');

            // Hide subdata connections, and show hollow and full connections
            if (!isEmpty(this.subdataConnections[name])) {
                for (key in this.subdataConnections[name]) {
                    firstIndex = this.subdataConnections[name][key].length - 1;
                    for (i = firstIndex; i >= 0 ; i -= 1) {
                        externalRep = this.subdataConnections[name][key][i].externalRep;
                        subDataArrow = this.subdataConnections[name][key][i].subDataArrow;
                        externalRep.show();
                        if (externalRep.hasClassName('hollow')) {
                            subDataArrow.hide();
                        } else {
                            // Remove all subconnections that represent full connections
                            subDataArrow.destroy();
                            this.subdataConnections[name][key].splice(i, 1);
                            this.fullConnections[name][key].splice(this.fullConnections[name][key].indexOf(externalRep), 1);
                        }
                    }
                }
            }
        } else {
            // Elevate canvas
            this.wiringEditor.canvas.canvasElement.classList.add("elevated");

            // Show tree
            initialWidth = this.wrapperElement.getBoundingClientRect().width;
            treeDiv.classList.add('activated');
            this.activatedTree = treeDiv;
            formatTree(treeDiv, initialWidth);

            // Activate subdataMode
            this.wrapperElement.classList.add('subdataMode');

            // Add a subconnection for each main connexion in the main endpoint
            layer = this.wiringEditor.arrowCreator.layer;
            mainEndpoint = this.sourceAnchorsByName[name];
            mainSubEndPoint = this.sourceAnchorsByName[name + "/" + name];
            mainEndpointArrows = mainEndpoint.getArrows();
            for (i = 0; i < mainEndpointArrows.length ; i += 1) {
                if (!mainEndpointArrows[i].hasClassName('hollow')) {
                    // New full subConnection
                    theArrow = this.wiringEditor.canvas.drawArrow(mainSubEndPoint.getCoordinates(layer), mainEndpointArrows[i].endAnchor.getCoordinates(layer), "arrow subdataConnection full");
                    theArrow.setEndAnchor(mainEndpointArrows[i].endAnchor);
                    theArrow.setStartAnchor(mainSubEndPoint);
                    mainSubEndPoint.addArrow(theArrow);
                    mainEndpointArrows[i].endAnchor.addArrow(theArrow);

                    // Add this connections to subdataConnections
                    if (this.subdataConnections[name] == null) {
                        this.subdataConnections[name] = {};
                    }
                    if (this.subdataConnections[name][name + "/" + name] == null) {
                        this.subdataConnections[name][name + "/" + name] = [];
                    }
                    this.subdataConnections[name][name + "/" + name].push({'subDataArrow' : theArrow, 'externalRep': mainEndpointArrows[i]});

                    // Add this connections to fullConnections
                    if (this.fullConnections[name] == null) {
                        this.fullConnections[name] = {};
                    }
                    if (this.fullConnections[name][name + "/" + name] == null) {
                        this.fullConnections[name][name + "/" + name] = [];
                    }
                    this.fullConnections[name][name + "/" + name].push(mainEndpointArrows[i]);
                }
            }

            // Show subdata connections, and hide hollow connections
            for (key in this.subdataConnections[name]) {
                for (i = 0; i < this.subdataConnections[name][key].length ; i += 1) {
                    this.subdataConnections[name][key][i].externalRep.hide();
                    this.subdataConnections[name][key][i].subDataArrow.show();
                }
            }
        }
        this.repaint();
        this.wiringEditor.activatedTree = this.activatedTree;
    };

    /**
     * Add subdata connection.
     */
    GenericInterface.prototype.addSubdataConnection = function addSubdataConnection(endpoint, subdatakey, connection, sourceAnchor, targetAnchor, isLoadingWiring) {
        var theArrow, mainEndpoint, layer;

        if (this.subdataConnections[endpoint] == null) {
            this.subdataConnections[endpoint] = {};
        }
        if (this.subdataConnections[endpoint][subdatakey] == null) {
            this.subdataConnections[endpoint][subdatakey] = [];
        }

        layer = this.wiringEditor.arrowCreator.layer;
        mainEndpoint = this.sourceAnchorsByName[endpoint];
        if ((endpoint + "/" + endpoint) == subdatakey) {
            // Add full connection
            if (this.fullConnections[endpoint] == null) {
                this.fullConnections[endpoint] = {};
            }
            if (this.fullConnections[endpoint][subdatakey] == null) {
                this.fullConnections[endpoint][subdatakey] = [];
            }
            connection.addClassName('full');
            theArrow = this.wiringEditor.canvas.drawArrow(mainEndpoint.getCoordinates(layer), targetAnchor.getCoordinates(layer), "connection");
            this.fullConnections[endpoint][subdatakey].push(theArrow);
        } else {
            // Add a hollow connection
            if (this.hollowConnections[endpoint] == null) {
                this.hollowConnections[endpoint] = {};
            }
            if (this.hollowConnections[endpoint][subdatakey] == null) {
                this.hollowConnections[endpoint][subdatakey] = [];
            }
            theArrow = this.wiringEditor.canvas.drawArrow(mainEndpoint.getCoordinates(layer), targetAnchor.getCoordinates(layer), "connection hollow");
            this.hollowConnections[endpoint][subdatakey].push(theArrow);
        }
        theArrow.setEndAnchor(targetAnchor);
        theArrow.setStartAnchor(mainEndpoint);
        mainEndpoint.addArrow(theArrow);
        targetAnchor.addArrow(theArrow);
        if (isLoadingWiring) {
            connection.hide();
        } else {
            theArrow.hide();
        }
        this.subdataConnections[endpoint][subdatakey].push({'subDataArrow' : connection, 'externalRep': theArrow});
    };

    /**
     * Remove subdata connection.
     */
    GenericInterface.prototype.removeSubdataConnection = function removeSubdataConnection(endpoint, subdatakey, connection) {
        var i, externalRep;

        if ((endpoint + "/" + endpoint) == subdatakey) {
            // Remove full connection
            if (this.fullConnections[endpoint] != null && this.fullConnections[endpoint][subdatakey] != null) {
                for (i = 0; i < this.subdataConnections[endpoint][subdatakey].length ; i += 1) {
                    if (this.subdataConnections[endpoint][subdatakey][i].subDataArrow == connection) {
                        externalRep = this.subdataConnections[endpoint][subdatakey][i].externalRep;
                        this.fullConnections[endpoint][subdatakey].splice(this.fullConnections[endpoint][subdatakey].indexOf(externalRep), 1);
                        externalRep.destroy();
                        connection.destroy();
                        this.subdataConnections[endpoint][subdatakey].splice(i, 1);
                        break;
                    }
                }
            } else {
                // Error
            }
        } else {
            // Remove a hollow connection
            if (this.hollowConnections[endpoint] != null && this.hollowConnections[endpoint][subdatakey] != null) {
                for (i = 0; i < this.subdataConnections[endpoint][subdatakey].length ; i += 1) {
                    if (this.subdataConnections[endpoint][subdatakey][i].subDataArrow == connection) {
                        externalRep = this.subdataConnections[endpoint][subdatakey][i].externalRep;
                        this.hollowConnections[endpoint][subdatakey].splice(this.hollowConnections[endpoint][subdatakey].indexOf(externalRep), 1);
                        externalRep.destroy();
                        connection.destroy();
                        this.subdataConnections[endpoint][subdatakey].splice(i, 1);
                        break;
                    }
                }
            } else {
                // Error
            }
        }
    };

    /**
     * Add Source.
     */
    GenericInterface.prototype.addSource = function addSource(label, desc, name, anchorContext, isGhost) {
        var anchor, endpointElement, labelDiv, labelElement, treeDiv, subAnchors;

        // Sources counter
        this.numberOfSources += 1;

        endpointElement = document.createElement('div');
        endpointElement.className = "endpoint";

        if (isGhost) {
            endpointElement.classList.add('misplaced');
            endpointElement.setAttribute('title', gettext('Mismatch Endpoint') + ":" + label);
        } else {
            if (typeof desc !== 'string' || !desc.length) {
                desc = label;
            }

            endpointElement.setAttribute('title', label + ': ' + desc);
        }

        labelElement = document.createElement('div');
        labelElement.className = "endpoint-label";
        labelElement.textContent = label;
        endpointElement.appendChild(labelElement);

        if (!this.isMiniInterface) {
            anchor = new Wirecloud.ui.WiringEditor.SourceAnchor(anchorContext, this.arrowCreator, null, isGhost);
            endpointElement.appendChild(anchor.wrapperElement);

            anchor.menu.append(new StyledElements.MenuItem(gettext('Add multiconnector'), createMulticonnector.bind(this, name, anchor)));

            subAnchors = anchorContext.data.subdata;
            if (subAnchors != null) {
                // Generate the tree
                this.generateTree(anchor, name, anchorContext, subAnchors, label, this.subdataHandler.bind(this, null, name));
            }

            endpointElement.addEventListener('mouseover', function () {
                this.wiringEditor.recommendations.emphasize(anchor);
            }.bind(this));
            endpointElement.addEventListener('mouseout', function () {
                this.wiringEditor.recommendations.deemphasize(anchor);
            }.bind(this));

            // Sticky effect
            endpointElement.addEventListener('mouseover', function (e) {
                anchor._mouseover_callback(e);
            }.bind(this));
            endpointElement.addEventListener('mouseout', function (e) {
                anchor._mouseout_callback(e);
            }.bind(this));

            // Connect anchor whith mouseup on the label
            endpointElement.addEventListener('mouseup', function (e) {
                anchor._mouseup_callback(e);
            }.bind(this));

            this.sourceAnchorsByName[name] = anchor;
            this.sourceAnchors.push(anchor);

            var endpointsLength = Object.keys(this.sourceEndpoints).length;

            endpointElement.setAttribute('data-index', endpointsLength + 1);

            this.sourceEndpoints[name] = {
                'endpoint': endpointElement,
                'displayName': label,
                'endpointLabel': labelElement,
                'endpointAnchor': anchor
            };
        }

        this.endpoints.sourcesElement.appendChild(endpointElement);
        this.draggableSources.push({'wrapperElement': endpointElement, 'context': anchorContext});
    };

    /**
     * Add Target.
     */
    GenericInterface.prototype.addTarget = function addTarget(label, desc, name, anchorContext, isGhost) {
        var anchor, endpointElement, labelDiv, labelElement;

        // Targets counter
        this.numberOfTargets += 1;

        endpointElement = document.createElement('div');
        endpointElement.className = "endpoint";

        if (isGhost) {
            endpointElement.classList.add('misplaced');
            endpointElement.setAttribute('title', gettext('Mismatch Endpoint') + ":" + label);
        } else {
            if (typeof desc !== 'string' || !desc.length) {
                desc = label;
            }

            endpointElement.setAttribute('title', label + ': ' + desc);
        }

        labelElement = document.createElement('div');
        labelElement.className = "endpoint-label";
        labelElement.textContent = label;
        endpointElement.appendChild(labelElement);

        if (!this.isMiniInterface) {
            anchor = new Wirecloud.ui.WiringEditor.TargetAnchor(anchorContext, this.arrowCreator, isGhost);
            endpointElement.appendChild(anchor.wrapperElement);

            anchor.menu.append(new StyledElements.MenuItem(gettext('Add multiconnector'), createMulticonnector.bind(this, name, anchor)));

            endpointElement.addEventListener('mouseover', function () {
                if (!this.wiringEditor.recommendationsActivated) {
                    this.wiringEditor.recommendations.emphasize(anchor);
                }
            }.bind(this));
            endpointElement.addEventListener('mouseout', function () {
                if (!this.wiringEditor.recommendationsActivated) {
                    this.wiringEditor.recommendations.deemphasize(anchor);
                }
            }.bind(this));

            // Sticky effect
            endpointElement.addEventListener('mouseover', function (e) {
                anchor._mouseover_callback(e);
            }.bind(this));
            endpointElement.addEventListener('mouseout', function (e) {
                anchor._mouseout_callback(e);
            }.bind(this));

            // Connect anchor whith mouseup on the label
            endpointElement.addEventListener('mouseup', function (e) {
                anchor._mouseup_callback(e);
            }.bind(this));

            this.targetAnchorsByName[name] = anchor;
            this.targetAnchors.push(anchor);

            var endpointsLength = Object.keys(this.targetEndpoints).length;

            endpointElement.setAttribute('data-index', endpointsLength + 1);

            this.targetEndpoints[name] = {
                'endpoint': endpointElement,
                'displayName': label,
                'endpointLabel': labelElement,
                'endpointAnchor': anchor
            };
        }

        this.endpoints.targetsElement.appendChild(endpointElement);
        this.draggableTargets.push({'wrapperElement': endpointElement, 'context': anchorContext});
    };

    /**
     *  Add new class in to the genericInterface
     */
    GenericInterface.prototype.addClassName = function addClassName(className) {
        var atr;

        if (className == null) {
            return;
        }

        atr = this.wrapperElement.getAttribute('class');
        if (atr == null) {
            atr = '';
        }
        this.wrapperElement.setAttribute('class', Wirecloud.Utils.appendWord(atr, className));
    };

    /**
     * Remove a genericInterface Class name
     */
    GenericInterface.prototype.removeClassName = function removeClassName(className) {
        var atr;

        if (className == null) {
            return;
        }

        atr = this.wrapperElement.getAttribute('class');
        if (atr == null) {
            atr = '';
        }
        this.wrapperElement.setAttribute('class', Wirecloud.Utils.removeWord(atr, className));
    };

    /**
     * Select this genericInterface
     */
    GenericInterface.prototype.select = function select(withCtrl) {
        var i, j, arrows;
        if (this.hasClassName('disabled')) {
            return;
        }
        if (this.hasClassName('highlighted')) {
            return;
        }
        if (!(this.wiringEditor.ctrlPushed) && (this.wiringEditor.selectedCount > 0) && (withCtrl)) {
            this.wiringEditor.resetSelection();
        }
        this.selected = true;
        this.addClassName('highlighted');
        // Arrows
        for (i = 0; i < this.targetAnchors.length; i += 1) {
            arrows = this.targetAnchors[i].arrows;
            for (j = 0; j < arrows.length; j += 1) {
                arrows[j].emphasize();
            }
        }
        for (i = 0; i < this.sourceAnchors.length; i += 1) {
            arrows = this.sourceAnchors[i].arrows;
            for (j = 0; j < arrows.length; j += 1) {
                arrows[j].emphasize();
            }
        }
        this.wiringEditor.addSelectedObject(this);
    };

    /**
     * Unselect this genericInterface
     */
    GenericInterface.prototype.unselect = function unselect(withCtrl) {
        var i, j, arrows;
        this.selected = false;
        this.removeClassName('highlighted');
        //arrows
        for (i = 0; i < this.targetAnchors.length; i += 1) {
            arrows = this.targetAnchors[i].arrows;
            for (j = 0; j < arrows.length; j += 1) {
                arrows[j].deemphasize();
            }
        }
        for (i = 0; i < this.sourceAnchors.length; i += 1) {
            arrows = this.sourceAnchors[i].arrows;
            for (j = 0; j < arrows.length; j += 1) {
                arrows[j].deemphasize();
            }
        }
        this.wiringEditor.removeSelectedObject(this);
        if (!(this.wiringEditor.ctrlPushed) && (this.wiringEditor.selectedCount > 0) && (withCtrl)) {
            this.wiringEditor.resetSelection();
        }
    };

    GenericInterface.prototype.emptyConnections = function emptyConnections() {
        var connections, i, j;

        for (i = 0; i < this.sourceAnchors.length; i++) {
            connections = this.sourceAnchors[i].arrows.slice(0);

            for (j = connections.length - 1; j >= 0; j--) {
                if (!connections[j].onbackground) {
                    connections[j].remove();
                }
            }
        }

        for (i = 0; i < this.targetAnchors.length; i++) {
            connections = this.targetAnchors[i].arrows.slice(0);

            for (j = connections.length - 1; j >= 0; j--) {
                if (!connections[j].onbackground) {
                    connections[j].remove();
                }
            }
        }

        return this;
    };

    /**
     * Destroy
     */
    GenericInterface.prototype.destroy = function destroy() {
        var i, j, arrows;

        this.unselect();
        if (this.editingPos === true) {
            this.disableEdit();
        }
        StyledElements.Container.prototype.destroy.call(this);

        for (i = 0; i < this.sourceAnchors.length; i += 1) {
            arrows = this.sourceAnchors[i].arrows.slice(0);
            for (j = 0; j < arrows.length; j += 1) {
                if (!arrows[j].controlledDestruction()) {
                    arrows[j].remove(true);
                }
            }
            this.sourceAnchors[i].destroy();
        }

        for (i = 0; i < this.targetAnchors.length; i += 1) {
            arrows = this.targetAnchors[i].arrows.slice(0);
            for (j = 0; j < arrows.length; j += 1) {
               if (!arrows[j].controlledDestruction()) {
                    arrows[j].remove(true);
                }
            }
            this.targetAnchors[i].destroy();
        }
        this.draggable.destroy();
        this.draggable = null;
        this.draggableSources = null;
        this.draggableTargets = null;
        this.wrapperElement = null;
        this.hollowConnections = null;
        this.subdataConnections = null;
    };

    /**
     * Edit source and targets positions
     */
    GenericInterface.prototype.editPos = function editPos() {
        var obj;
        obj = null;
        if ((this.targetAnchors.length <= 1) && (this.sourceAnchors.length <= 1)) {
            return;
        }

        if (this.editingPos === true) {
            this.disableEdit();
        } else {
            this.enableEdit();
            obj = this;
        }
        this.repaint();
        return obj;
    };

    /**
     * Enable poditions editor
     */
    GenericInterface.prototype.enableEdit = function enableEdit() {
        this.draggable.destroy();
        this.editingPos = true;
        this.makeSlotsDraggable();
    };

    /**
     * Disable poditions editor
     */
    GenericInterface.prototype.disableEdit = function disableEdit() {
        var i;

        this.makeDraggable();
        this.editingPos = false;

        if (this.draggableSources.length > 1) {
            this.endpoints.sourcesElement.classList.remove('endpoint-sorting');

            for (i = 0; i < this.draggableSources.length; i++) {
                this.draggableSources[i].draggable.destroy();
            }
        }

        if (this.draggableTargets.length > 1) {
            this.endpoints.targetsElement.classList.remove('endpoint-sorting');

            for (i = 0; i < this.draggableTargets.length; i++) {
                this.draggableTargets[i].draggable.destroy();
            }
        }

        this.events.sortstop.dispatch({
            'componentId': this.getId()
        });
    };

    /**
     * Move an endpoint up 1 position.
     */
    GenericInterface.prototype.up = function up(element) {
        element.wrapperElement.parentNode.insertBefore(element.wrapperElement, element.wrapperElement.previousElementSibling);
        this.repaint();
    };

    /**
     * Move an endpoint down 1 position.
     */
    GenericInterface.prototype.down = function down(element) {
        if (element.wrapperElement.nextElementSibling !== null) {
            element.wrapperElement.parentNode.insertBefore(element.wrapperElement, element.wrapperElement.nextElementSibling.nextElementSibling);
            this.repaint();
        }
    };

    /**
     * Get sources and targets titles lists in order to save positions
     */
    GenericInterface.prototype.getInOutPositions = function getInOutPositions() {
        var i, sources, targets;

        sources = [];
        targets = [];
        for (i = 0; i < this.endpoints.sourcesElement.childNodes.length; i++) {
            sources[i] = this.getNameForSort(this.endpoints.sourcesElement.childNodes[i], 'source');
        }
        for (i = 0; i < this.endpoints.targetsElement.childNodes.length; i++) {
            targets[i] = this.getNameForSort(this.endpoints.targetsElement.childNodes[i], 'target');
        }

        return {'source': sources, 'target': targets};
    };

    /**
     * Get the source or target name for the especific node
     */
    GenericInterface.prototype.getNameForSort = function getNameForSort(node, type) {
        var i, collection;

        if (type === 'source') {
            collection = this.draggableSources;
        } else {
            collection = this.draggableTargets;
        }

        for (i = 0; collection.length; i++) {
            if (collection[i].wrapperElement === node) {
                return collection[i].context.data.name;
            }
        }
    };

    /**
     * Change to minimized view for operators
     */
    GenericInterface.prototype.minimize = function minimize(omitEffects) {
        var position, oc, scrollX, scrollY;

        if (!omitEffects) {
            this.resizeTransitStart();
        }

        this.initialPos = this.wrapperElement.getBoundingClientRect();
        this.minWidth = this.wrapperElement.style.minWidth;

        this.wrapperElement.classList.add('reducedInt');
        this.wrapperElement.style.minWidth = '55px';

        // Scroll correction
        oc = this.wiringEditor.layout.content;

        scrollX = parseInt(oc.wrapperElement.scrollLeft, 10);
        scrollY = parseInt(oc.wrapperElement.scrollTop, 10);

        this.wrapperElement.style.top = (this.initialPos.top + scrollY - this.wiringEditor.headerHeight) + ((this.initialPos.height - 8) / 2) - 12 + 'px';
        this.wrapperElement.style.left = (this.initialPos.left + scrollX - this.wiringEditor.menubarWidth) + (this.initialPos.width / 2) - 32 + 'px';

        // correct it pos if is out of grid
        position = this.getStylePosition();
        if (position.posX < 0) {
            position.posX = 8;
        }
        if (position.posY < 0) {
            position.posY = 8;
        }
        this.setPosition(position);

        this.isMinimized = true;
        this.collapsed = true;
        this.repaint();
    };

    /**
     * Change to normal view for operators
     */
    GenericInterface.prototype.restore = function restore(omitEffects) {
        var currentPos, position, oc, scrollX, scrollY;

        if (!omitEffects) {
            this.resizeTransitStart();
        }

        // Scroll correction
        oc = this.wiringEditor.layout.getCenterContainer();

        scrollX = parseInt(oc.wrapperElement.scrollLeft, 10) + 1;
        scrollY = parseInt(oc.wrapperElement.scrollTop, 10);

        currentPos = this.wrapperElement.getBoundingClientRect();
        this.wrapperElement.style.top = (currentPos.top + scrollY - this.wiringEditor.headerHeight) - ((this.initialPos.height + 8) / 2) + 'px';
        this.wrapperElement.style.left = (currentPos.left + scrollX - this.wiringEditor.menubarWidth) - (this.initialPos.width / 2) + 32 + 'px';

        // correct it position if is out of grid
        position = this.getStylePosition();
        if (position.posX < 0) {
            position.posX = 8;
        }
        if (position.posY < 0) {
            position.posY = 8;
        }
        this.setPosition(position);

        this.wrapperElement.style.minWidth = this.minWidth;

        this.wrapperElement.classList.remove('reducedInt');

        this.isMinimized = false;
        this.collapsed = false;
        this.repaint();
    };

    /**
     * Resize Transit Start
     */
    GenericInterface.prototype.resizeTransitStart = function resizeTransitStart() {
        var interval;

        // transition events
        this.wrapperElement.classList.add('flex');
        /*this.wrapperElement.addEventListener('webkitTransitionEnd', this.resizeTransitEnd.bind(this), false);
        this.wrapperElement.addEventListener('transitionend', this.resizeTransitEnd.bind(this), false);
        this.wrapperElement.addEventListener('oTransitionEnd', this.resizeTransitEnd.bind(this), false);*/
        interval = setInterval(this.animateArrows.bind(this), 20);
        setTimeout(function () {
            clearInterval(interval);
        }, 400);

        setTimeout(function () {
            this.resizeTransitEnd();
        }.bind(this), 450);

    };

    /**
     * Resize Transit End
     */
    GenericInterface.prototype.resizeTransitEnd = function resizeTransitEnd() {
        // transition events
        this.wrapperElement.classList.remove('flex');
        /*this.wrapperElement.removeEventListener('webkitTransitionEnd', this.resizeTransitEnd.bind(this), false);
        this.wrapperElement.removeEventListener('transitionend', this.resizeTransitEnd.bind(this), false);
        this.wrapperElement.removeEventListener('oTransitionEnd', this.resizeTransitEnd.bind(this), false);*/
        this.repaint();
    };

    /**
     * Animated arrows for the transitions betwen minimized an normal shape
     */
    GenericInterface.prototype.animateArrows = function animateArrows() {
        var key, layer;

        for (key in this.sourceAnchorsByName) {
            this.sourceAnchorsByName[key].repaint();
        }

        for (key in this.targetAnchorsByName) {
            this.targetAnchorsByName[key].repaint();
        }

        if (this.potentialArrow != null) {
            layer = this.wiringEditor.canvas.getHTMLElement().parentNode;
            if (this.potentialArrow.startAnchor != null) {
                // from source to target
                this.potentialArrow.setStart(this.potentialArrow.startAnchor.getCoordinates(layer));
            } else {
                // from target to source
                this.potentialArrow.setEnd(this.potentialArrow.endAnchor.getCoordinates(layer));
            }
        }
    };

    var collapseEndpoints = function collapseEndpoints() {
        var collapsedWidth, originalWidth;

        originalWidth = this.wrapperElement.offsetWidth;

        this.wrapperElement.classList.add('collapsed');

        collapsedWidth = this.wrapperElement.offsetWidth;

        if (originalWidth - collapsedWidth > 0) {
            this.wrapperElement.style.left = parseInt(parseInt(this.wrapperElement.style.left, 10) + ((originalWidth - collapsedWidth) / 2), 10) + 'px';
        }

        this.endpoints.element.removeChild(this.endpoints.targetsElement);
        this.endpoints.element.removeChild(this.endpoints.sourcesElement);

        this.heading.element.appendChild(this.endpoints.targetsElement);
        this.heading.element.appendChild(this.endpoints.sourcesElement);

        this.options.optionCollapse.toggleIconClass('icon-collapse-top', 'icon-collapse');
        this.options.optionCollapse.setTitle(gettext("Expand"));

        this.repaint();

        this.events.collapse.dispatch({
            'id': this.getId()
        });
    };

    var expandEndpoints = function expandEndpoints() {
        var collapsedWidth, originalWidth;

        collapsedWidth = this.wrapperElement.offsetWidth;

        this.wrapperElement.classList.remove('collapsed');

        this.heading.element.removeChild(this.endpoints.targetsElement);
        this.heading.element.removeChild(this.endpoints.sourcesElement);

        this.endpoints.element.appendChild(this.endpoints.targetsElement);
        this.endpoints.element.appendChild(this.endpoints.sourcesElement);

        originalWidth = this.wrapperElement.offsetWidth;

        if (originalWidth - collapsedWidth > 0) {
            this.wrapperElement.style.left = parseInt(parseInt(this.wrapperElement.style.left, 10) - ((originalWidth - collapsedWidth) / 2), 10) + 'px';
        }

        this.options.optionCollapse.toggleIconClass('icon-collapse', 'icon-collapse-top');
        this.options.optionCollapse.setTitle(gettext("Collapse"));
        this.repaint();

        this.events.expand.dispatch({
            'id': this.getId()
        });
    };

    return GenericInterface;

})();
