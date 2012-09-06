/*
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */


function ContextManager (workspace_, workspaceInfo_) {


    // ***********************
    // PRIVATED FUNCTIONS
    // ***********************

    /**
     * Adds all variables from workspace data model
     */
    this._addContextVarsFromTemplate = function (iWidget, cVars, type) {
        var varManager = this._workspace.getVarManager();
        for (var i = 0; i < cVars.size(); i++) {
            var cVar = cVars[i];
            cVar.setVarManager(varManager);
            var conceptName = cVar.getConceptName();
            var relatedConcept = this._name2Concept[conceptName];
            if (relatedConcept != null && relatedConcept._type != type)
                relatedConcept = null;

            if (relatedConcept == null) {
                var msg = gettext("There is not any concept of type \"%(type)s\" called \"%(concept)s\", the value of the iWidget variable \"%(varName)s\" will be empty.");
                msg = interpolate(msg, {concept: conceptName, type: type, varName: cVar.getName()}, true);
                OpManagerFactory.getInstance().logIWidgetError(iWidget.getId(), msg, Constants.Logging.ERROR_MSG);
                continue;
            }
            relatedConcept.addIWidgetVar(cVar);
        }
    }

    // Loads all concept from workspace data model.
    this._loadConceptsFromWorkspace = function (workspaceInfo_) {
        this._concepts = {};
        this._name2Concept = {};

        var conceptsJson = workspaceInfo_['workspace']['concepts'];

        // Parses concepts json
        for (var i = 0; i < conceptsJson.length; i++) {
            var curConcept = conceptsJson[i];
            // Creates the concept
            var concept = new Concept(curConcept);
            this._concepts[curConcept.concept] = concept;

            // Sets the concept value
            if (curConcept.value != undefined) {
                concept._setInitialValue(curConcept.value)
            }

            // Relates the concept name to all its concept
            for (var j = 0; j < curConcept.names.length; j++) {
                var cname = curConcept.names[j];
                var oldConcept = this._name2Concept[cname]
                if (oldConcept != null) {
                    var msg = gettext("WARNING: concept name '%(cname)s' is already related to '%(concept)s'. New related concept is '%(newConcept)s'.");
                    msg = interpolate(msg, {cname: cname, concept: oldConcept, newConcept: curConcept.concept}, true);
                    LogManagerFactory.getInstance().log(msg);
                }
                this._name2Concept[cname] = concept;
            }
        }
    }

    // Load iwidget's context variables from workspace data model
    this._loadIWidgetContextVarsFromWorkspace = function (workspaceInfo) {
        var i, j, tabs, currentTab, currentIWidget, currentVar, contextVar,
            dragboard, varname, relatedConcept, msg;

        tabs = workspaceInfo['workspace']['tabList'];

        // Tabs in workspace
        for (i = 0; i < tabs.length; i++) {
            currentTab = tabs[i];
            dragboard = this._workspace.getTab(currentTab.id).getDragboard();

            // iwidgets in tab
            for (j = 0; j < currentTab.iwidgetList.length; j++) {
                currentIWidget = dragboard.getIWidget(currentTab.iwidgetList[j].id);

                variables = currentIWidget.getWidget().getTemplate().getVariables();

                // Variables of iwidgets
                for (varname in variables) {
                    currentVar = variables[varname];
                    switch (currentVar.aspect) {
                    case Variable.prototype.EXTERNAL_CONTEXT:
                    case Variable.prototype.GADGET_CONTEXT:
                        contextVar = new ContextVar(currentIWidget.id, currentVar.name, currentVar.concept)
                        contextVar.setVarManager(this._workspace.getVarManager());
                        relatedConcept = this._name2Concept[currentVar.concept];
                        if (relatedConcept) {
                            if (currentVar.aspect !== relatedConcept._type) {
                                msg = gettext("There is not any concept of type \"%(type)s\" called \"%(concept)s\", the value of the iWidget variable \"%(varName)s\" will be empty.");
                                msg = interpolate(msg,
                                    {concept: currentVar.concept,
                                     type: relatedConcept._type,
                                     varName: currentVar.name},
                                    true);
                                OpManagerFactory.getInstance().logIWidgetError(currentIWidget.id, msg, Constants.Logging.ERROR_MSG);
                            } else {
                                relatedConcept.addIWidgetVar(contextVar);
                            }
                        }
                        break;
                    default:
                        break;
                    }
                }
            }
        }

        // Continues loading next module
        this._loaded = true;
    }

    // ****************
    // PUBLIC METHODS
    // ****************

    ContextManager.prototype.getConcept = function (name) {
        return this._name2Concept[name];
    };

    ContextManager.prototype.addInstance = function (iWidget, template) {
        if (!this._loaded)
            return;

        if (template == null)
            return;

        this._addContextVarsFromTemplate(iWidget, template.getExternalContextVars(iWidget.getId()), Concept.prototype.EXTERNAL);
        this._addContextVarsFromTemplate(iWidget, template.getWidgetContextVars(iWidget.getId()), Concept.prototype.IGADGET);
    }

    ContextManager.prototype.iWidgetLoaded = function (iWidget) {
        if (!this._loaded)
            return;

        var iWidgetId = iWidget.getId();
        var concept_key;
        for (concept_key in this._concepts) {
            var concept = this._concepts[concept_key];
            concept.propagateIWidgetVarValues(iWidget);
        }
    }

    ContextManager.prototype.iWidgetUnloaded = function (iWidget) {
        if (!this._loaded)
            return;

        var concept_key;
        for (concept_key in this._concepts) {
            var concept = this._concepts[concept_key];
            if (concept._type !== Concept.prototype.IGADGET) {
                continue;
            }

            var ivar = concept.getIWidgetVar(iWidget.getId());
            if (ivar != null) {
                ivar._clearHandler();
            }
        }
    };

    ContextManager.prototype.removeInstance = function (iWidgetId_) {
        if (!this._loaded)
            return;

        var concept_key;
        for (concept_key in this._concepts) {
            this._concepts[concept_key].deleteIWidgetVars(iWidgetId_);
        }
    };

    /**
     * Notifies a value change on an platform context concept.
     *
     * @param {String} concept
     * @param {} value
     */
    ContextManager.prototype.notifyModifiedConcept = function (concept, value) {
        if (!this._loaded || typeof this._concepts[concept] === 'undefined') {
            return;
        }

        this._concepts[concept].setValue(value);
    }

    /**
     * Notifies a value change on an iwidget context concept.
     *
     * @param {iWidget} iWidget
     * @param {String} concept
     * @param {} value
     */
    ContextManager.prototype.notifyModifiedWidgetConcept = function (iWidget, concept, value) {
        if (!this._loaded || typeof this._concepts[concept] === 'undefined') {
            return;
        }

        var ivar = this._concepts[concept].getIWidgetVar(iWidget.getId());
        if (ivar == null) {
            // Do nothing, iwidget has not variables related to this concept
            return;
        }

        ivar.setValue(value);
    }

    ContextManager.prototype.getWorkspace = function () {
        return this._workspace;
    }


    ContextManager.prototype.unload = function () {
        var i, name_key, concept_key;

        // Delete all concept names
        for (name_key in this._name2Concept) {
            delete this._name2Concept[name_key];
        }
        delete this._name2Concept;

        // Delete all the concepts
        for (concept_key in this._concepts) {
            this._concepts[concept_key].unload();
            delete this._concepts[concept_key];
        }
        delete this._concepts;

        // Delete all the ContextManager attributes
        delete this._loaded;
        delete this._workspace;
    };


    // *********************************************
    // PRIVATE VARIABLES AND CONSTRUCTOR OPERATIONS
    // *********************************************

    this._loaded = false;
    this._concepts = {};     // a concept is its adaptor an its value
    this._name2Concept = {}; // relates the name to its concept
    this._workspace = workspace_;

    // Load all iwidget context variables and concepts (in this order!)
    this._loadConceptsFromWorkspace (workspaceInfo_);
    this._loadIWidgetContextVarsFromWorkspace (workspaceInfo_);
}
