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


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// VARIABLE (Parent Class)  <<PLATFORM>>
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Variable (id, iWidget, name, varManager) {
    // True when a the value of the variable has changed and the callback has not been invoked!
    this.annotated = false;
    this.varManager = null;
    this.id = null;
    this.iWidget = null;
    this.name = null;
    this.value = null;
    this.tab = null;
}

//////////////////////////////////////////////
// PARENT CONTRUCTOR (Super class emulation)
//////////////////////////////////////////////

Variable.prototype.Variable = function (id, iWidget_, vardef_, varManager_,  value_, tab_) {
    this.varManager = varManager_;
    this.id = id;
    this.iWidget = iWidget_;
    this.vardef = vardef_;
    this.value = value_;
    this.tab = tab_;
}

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////

Variable.prototype.get = function () {
    return this.value;
}

Variable.prototype.setHandler = function () { }

Variable.prototype.set = function (value) { }

Variable.prototype.getLabel = function () {
    return this.vardef.label;
};

Variable.prototype.annotate = function (value) {
    this.annotated = true;
    this.value = value;
}

Variable.prototype.assignConnectable = function (connectable) {
    this.connectable = connectable;
}

Variable.prototype.getConnectable = function () {
    return this.connectable;
}

Variable.prototype.getWorkspace = function () {
    return this.varManager.getWorkspace();
}

Variable.prototype.serialize = function serialize() {
    return {
        'type': 'iwidget',
        'id': this.iWidget.id,
        'endpoint': this.vardef.name
    };
};

//////////////////////////////////////////////
// PUBLIC CONSTANTS
//////////////////////////////////////////////

Variable.prototype.PROPERTY = "PROP"

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RVARIABLE (Derivated class) <<PLATFORM>>
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RVariable(id, iWidget_, vardef_, varManager_, value_, tab_) {
    Variable.prototype.Variable.call(this, id, iWidget_, vardef_, varManager_, value_, tab_);

    this.handler = null;
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RVariable.prototype = new Variable;

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////



//////////////////////////////////////////////
// OVERWRITTEN METHODS
//////////////////////////////////////////////

RVariable.prototype.setHandler = function (handler_) {
    if (this.vardef.aspect == this.SLOT && this.vardef.name in this.iWidget.internal_iwidget.inputs) {
        this.iWidget.internal_iwidget.inputs[this.vardef.name].callback = handler_;
    }
    this.handler = handler_;
}

RVariable.prototype.get = function () {
    var concept, value;

    switch (this.vardef.aspect) {
    default:
        return this.value;
    }
};

RVariable.prototype.set = function (newValue, from_widget) {
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RWVARIABLE (Derivated class)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RWVariable(id, iWidget_, vardef_, varManager_, value_, tab_) {
    Variable.prototype.Variable.call(this, id, iWidget_, vardef_, varManager_, value_, tab_);
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RWVariable.prototype = new Variable;

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////


RWVariable.prototype.set = function (value_, options_) {
    var oldvalue;

    this.varManager.incNestingLevel();

    oldvalue = this.value;
    this.value = value_;

    if (this.vardef.aspect === this.PROPERTY && (oldvalue !== value_ || this.vardef.secure === true)) {
        this.varManager.markVariablesAsModified([this]);

        if (this.vardef.secure === true) {
            this.varManager.forceCommit();
        }
    }

    if (this.vardef.secure === true) {
        this.value = '';
    }

    // This will save all modified vars if we are the root event
    this.varManager.decNestingLevel();
}
