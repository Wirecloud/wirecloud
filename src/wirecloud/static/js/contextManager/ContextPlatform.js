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

function ContextVar(iwidgetId_, varName_, conceptName_) {
    this._iwidgetId = iwidgetId_;
    this._varName = varName_;
    this._conceptName = conceptName_;
    this._varManager = null;
    this._value = null;
}

ContextVar.prototype.getName = function () {
    return this._varName;
}

ContextVar.prototype.getIWidgetId = function () {
    return this._iwidgetId;
}

ContextVar.prototype.getConceptName = function () {
    return this._conceptName;
}

ContextVar.prototype.getValue = function () {
    return this._value;
}

ContextVar.prototype.propagateValue = function () {
    this.setValue(this._value);
}

ContextVar.prototype.setValue = function (newValue_) {
    this._value = newValue_;
    if (this._varManager != null) {
        var variable = this._varManager.getVariableByName(this._iwidgetId, this._varName)

        variable.annotate(newValue_);
        variable.set(newValue_);
    }
}

ContextVar.prototype._clearHandler = function () {
    if (this._varManager != null) {
        var variable = this._varManager.getVariableByName(this._iwidgetId, this._varName)

        variable.setHandler(null);
    }
}

ContextVar.prototype.setVarManager = function (varManager_) {
    this._varManager = varManager_;
}

ContextVar.prototype.unload = function () {
    delete this._iwidgetId;
    delete this._varName;
    delete this._conceptName;
    delete this._varManager;
    delete this._value;
}

//////////////////////////////////////////////////////////
// Concept
//////////////////////////////////////////////////////////
function Concept(data) {
    this._semanticConcept = data.concept;
    this._type = data.type;
    this._adaptor = data.adaptor;
    this._label = data.label;
    this._description = data.description;
    this._value = null;
    this._initialValue = null;

    this._iwidgetVars = new Object();
}

// Known concept types
Concept.prototype.EXTERNAL = 'ECTX';
Concept.prototype.IGADGET = 'GCTX';

// Known concepts
Concept.prototype.USERNAME = "username";
Concept.prototype.LANGUAGE = "language";
Concept.prototype.WIDTH = "width";
Concept.prototype.WIDTHINPIXELS = "widthInPixels";
Concept.prototype.HEIGHT = "height";
Concept.prototype.HEIGHTINPIXELS = "heightInPixels";
Concept.prototype.XPOSITION = "xPosition";
Concept.prototype.YPOSITION = "yPosition";
Concept.prototype.LOCKSTATUS = "lockStatus";
Concept.prototype.ORIENTATION = "orientation";
Concept.prototype.TWITTERAUTH = "twitterauth";
Concept.prototype.THEME = "theme";

/**
 * @private
 */
Concept.prototype._initAdaptor = function (ivar_) {
    if (ivar_ == null) {
        // Adaptor of External Context variable doesn't receives any parameter
        eval ('new ' + this._adaptor + "()");
    } else {
        // Adaptor of Widget Context variable receives the IWidget as parameter
        eval ('new ' + this._adaptor + "("+ ivar_.getIWidgetId() +")");
    }
}

Concept.prototype.getSemanticConcept = function () {
    return this._semanticConcept;
}

Concept.prototype.getAdaptor = function () {
    return this._adaptor;
}

Concept.prototype.getValue = function () {
    if (this._type == Concept.prototype.EXTERNAL) {
        return this._value;
    }
    throw gettext("Concept does not have value, this is a Widget Concept.");
}

Concept.prototype.setValue = function (value_) {
    switch (this._type) {
        case Concept.prototype.IGADGET:
            throw gettext("Concept does not have value, this is a Widget Concept.");
            break;
        default:
            this._value = value_;
            for (var i = 0; i < this._iwidgetVars.length; i++){
                var ivar = this._iwidgetVars[i];
                ivar.setValue(value_);
            }
            break;
    }
}

/**
 * This function only can be used with platform concepts
 *
 * @private
 */
Concept.prototype._setInitialValue = function (initialValue) {
    this._value = initialValue;
}

Concept.prototype.propagateIWidgetVarValues = function (iWidget) {
    var ivar = this._iwidgetVars[iWidget.getId()];
    if (ivar != null)
        ivar.propagateValue();
}

Concept.prototype.addIWidgetVar = function (ivar) {
    switch (this._type) {
        case Concept.prototype.EXTERNAL:
            var iWidgetId = ivar.getIWidgetId();
            /* FIXME error control
            if (this._iwidgetVars[iWidgetId] !== null)

            */
            this._iwidgetVars[iWidgetId] = ivar;

            if (this._value != null) {
                ivar.setValue(this._value);
            } else {
                if (this._adaptor)
                    this._initAdaptor(null);
            }
            break;
        case Concept.prototype.IGADGET:
            var iWidgetId = ivar.getIWidgetId();
            /* FIXME error control
            if (this._iwidgetVars[iWidgetId] !== null)

            */
            this._iwidgetVars[iWidgetId] = ivar;
            if (this._adaptor)
                this._initAdaptor(ivar);
            break;
        default:
            throw gettext("Unexpected iwidget variables. Concept does not have type yet.");
            break;
    }
}

Concept.prototype.deleteIWidgetVars = function (iWidgetId) {
    delete this._iwidgetVars[iWidgetId];
}

/**
 * Returns the iWidget variable assigned to this concept. This method will
 * return <code>null</code> if the given iWidget does not have any variable
 * assigend to this concept.
 *
 * @param {Number} iWidgetId id of the iwidget
 * @return {ContextVar}
 */
Concept.prototype.getIWidgetVar = function (iWidgetId) {
    switch (this._type) {
        case Concept.prototype.EXTERNAL:
        case Concept.prototype.IGADGET:
            var ivar = this._iwidgetVars[iWidgetId];
            return ivar;
        default:
            throw gettext("Concept does not have type yet.");
    }
}

Concept.prototype.unload = function () {
    // Delete all the iwidget variables related to this concept
    for (var iWidgetId in this._iwidgetVars)
        this._iwidgetVars[keys[i]].unload();
}
