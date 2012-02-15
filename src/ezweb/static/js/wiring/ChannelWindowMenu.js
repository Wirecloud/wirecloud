/*jslint browser: true, sloppy: true, nomen: true, maxerr: 50, indent: 4 */
/*global gettext, Element, WindowMenu, BrowserUtilsFactory, Event, LayoutManagerFactory, StyledElements, interpolate */

/*
    var checkResult = function(e) {
        var msg;
        var target = BrowserUtilsFactory.getInstance().getTarget(e);

        // Sets the param value
        this.channel.setFilterParam(this.param._index, target.value);


        // Sets the channel value
        this.valueElement.update(channel.getValue());

        // Shows a message (only with error)
        if (this.channel.getFilter().getlastExecError() != null) {
            LayoutManagerFactory.getInstance().showMessageMenu(this.channel.getFilter().getlastExecError(), Constants.Logging.WARN_MSG);
            this.valueElement.nodeValue = gettext('undefined');
        }
    };

*/


function addRow(tbody, label, value_element, _label_class) {
    var contentRow, labelCol, labelContent, valueCol;

    // row
    contentRow = tbody.insertRow(-1);
    Element.extend(contentRow);

    // label
    labelCol = contentRow.insertCell(-1);
    labelContent = document.createElement("label");
    labelContent.setTextContent(label);

    if (typeof (_label_class) === 'string') {
        labelContent.className = _label_class;
    }
    labelCol.appendChild(labelContent);

    // value
    valueCol = contentRow.insertCell(-1);
    valueCol.appendChild(value_element);

    return contentRow;
}

/**
 * @class
 *
 * Specific class for dialogs about creating things.
 * @param {WiringGUI} wiringGUI
 */
function ChannelWindowMenu(wiringGUI) {
    var table, filterMenuButton, cancelButton, aceptButton;

    WindowMenu.call(this, gettext('Editing channel properties'), "channel_window");

    this.wiringGUI = wiringGUI;
    this.param_rows = [];
    this.param_list = [];
    this.param_warningIcon_list = [];
    this.param_warningMsg_list = [];
    this.nameErrorMsg = '';
    
    // Table for form fields
    table = document.createElement("table");
    Element.extend(table);

    // IE6 and IE7 needs a tbody to display dynamic tables
    this.contentTable = document.createElement('tbody');
    table.appendChild(this.contentTable);
    Element.extend(this.contentTable);
    this.windowContent.appendChild(table);


    // Channel name
    this.nameDiv = document.createElement("div");
    Element.extend(this.nameDiv);
    this.nameElement = document.createElement("input");
	this.nameElement.setAttribute('type', 'text');
    this.nameElement.observe('blur', this._onNameBlur.bind(this));
    Element.extend(this.nameElement);
    this.nameErrorDiv = document.createElement("div");
    Element.extend(this.nameErrorDiv);
    this.nameErrorIcon = document.createElement("span");
    this.nameErrorIcon.addClassName('error icon icon-size icon-warning-channel');
    this.nameErrorIcon.observe('mouseover', this._displayHelpNameWarning.bind(this));
    this.nameErrorIcon.observe('mouseout', this._hideHelpWarning.bind(this));
    Element.extend(this.nameErrorIcon);
    this.nameDiv.appendChild(this.nameElement);
    this.nameErrorDiv.appendChild(this.nameErrorIcon);
    this.nameDiv.appendChild(this.nameErrorDiv);
    addRow(this.contentTable, gettext("Name") + ":", this.nameDiv);

    // Filter
    this.filterLabelDiv = document.createElement("div");
    Element.extend(this.filterLabelDiv);
    this.filterLabelDiv.addClassName("filterValue");
    this.filterName = document.createElement("span");
    this.filterLabelDiv.appendChild(this.filterName);
    filterMenuButton = new StyledElements.StyledButton({
        'class': 'filter_menu_button',
        'plain': true
    });
    filterMenuButton.insertInto(this.filterLabelDiv);
    filterMenuButton.addEventListener('click', function (button) {
        var dim = button.getBoundingClientRect();
        LayoutManagerFactory.getInstance().showDropDownMenu(
            'filterMenu',
            this.wiringGUI.filterMenu,
            dim.left,
            dim.top
        );
    }.bind(this));
    addRow(this.contentTable, gettext("Filter") + ":", this.filterLabelDiv);

    // Accept button
    aceptButton = document.createElement('button');
    Element.extend(aceptButton);
    aceptButton.appendChild(document.createTextNode(gettext('Save')));
    aceptButton.observe("click", this._saveListener.bind(this));
    this.windowBottom.appendChild(aceptButton);

    // Cancel button
    cancelButton = document.createElement('button');
    Element.extend(cancelButton);
    cancelButton.appendChild(document.createTextNode(gettext('Cancel')));
    cancelButton.observe("click", this._closeListener.bind(this));
    this.windowBottom.appendChild(cancelButton);
}
ChannelWindowMenu.prototype = new WindowMenu();

ChannelWindowMenu.prototype.show = function (parentWindow, channel_interface) {
    this.channel_interface = channel_interface;
    this._updateFilterInterface();
    //Save current filter
    this.initialFilter = this.channel_interface.getFilter();
    //show the current channel name in the imput
    this.nameElement.value = channel_interface.getName();
    //show the value of the filter
    //this.valueElement.value = this.channel_interface.getValueWithFilter();
    WindowMenu.prototype.show.call(this, parentWindow);
};

/**
 * Updates the interface according to the new filter.
 *
 * @private
 */
ChannelWindowMenu.prototype._updateFilterInterface = function () {

    // Sets the filter name
    if (this.channel_interface.filter == null) {
        this.filterName.setTextContent(gettext("None"));
    } else {
        this.filterName.setTextContent(this.channel_interface.filter.getLabel());
    }
    // Sets the channel value and the channel filter params
    //this.valueElement.value = this.channel_interface.getValueWithFilter();
    this._updateFilterParams();
};

/**
 * @private
 *
 *
 * @return 
 */
ChannelWindowMenu.prototype._createParamInterface = function (param) {
    var paramValueLayer, paramValue, paramInput, paramWarningIcon;

    paramValueLayer = document.createElement("div");
    Element.extend(paramValueLayer);
    paramInput = document.createElement("input");
    //Each param for the current filter
    this.param_list[param.getIndex()] = paramInput;
    paramInput.observe('blur', this._onFilterBlur.bind(this, param));
    Element.extend(paramInput);
    paramInput.addClassName("paramValueInput");
    paramValue = this.channel_interface.getFilterParams()[param.getIndex()];
    if (paramValue == null) {
        paramValue = '';
    }
    paramInput.setAttribute("value", paramValue);
    paramValueLayer.appendChild(paramInput);
    paramWarningIcon = document.createElement("span");
    this.param_warningIcon_list[param.getIndex()] = paramWarningIcon;
    paramWarningIcon.addClassName('error icon icon-size icon-warning-channel');
    paramWarningIcon.observe('click', this._displayHelpParamWarning.bind(this, param.getIndex()));
    //paramWarningIcon.observe('mouseout', this._hideHelpWarning.bind(this));
    Element.extend(this.paramWarningIcon);
    paramValueLayer.appendChild(paramWarningIcon);
    return paramValueLayer;
};


/**
 * @private
 *
 * Builds/Rebuilds the filter params interface.
 */
ChannelWindowMenu.prototype._updateFilterParams = function () {
    var i, params, p, param, valueInterface;

    // Removes previous parameters
    for (i = 0; i < this.param_rows.length; i += 1) {
        this.contentTable.removeChild(this.param_rows[i]);
    }
    this.param_rows = [];
    this.param_list = [];

    // No filter, no params
    if (this.channel_interface.filter == null) {
        return;
    }

    // Adds a new row for each param of the current filter
    params = this.channel_interface.filter.getParams();
    for (p = 0; p < params.length; p += 1) {
        param = params[p];
        valueInterface = this._createParamInterface(param);
        this.param_rows.push(addRow(this.contentTable, param.getLabel(), valueInterface, 'icon icon-wiring-filter-param'));
    }
};


ChannelWindowMenu.prototype._getParamValues = function () {
    // No filter, no params
    var params, fParams, i, param;
    if (this.channel_interface.filter == null) {
        return;
    }
    fParams = {};
    params = this.channel_interface.filter.getParams();
    for (i = 0; i < params.length; i += 1) {
        param = params[i];
        fParams[param.getIndex()] = this.param_lists[param.getIndex()].value;
    }

    return fParams;
};


ChannelWindowMenu.prototype.changeFilter = function (filter) {
    if (this.channel_interface.filter == filter) {
        return false; // There is not a real change => nothing to do
    }
    this.channel_interface.setFilter(filter);
    this.channel_interface.setFilterParams(filter.getInitialValues());
    this._updateFilterInterface();

    this.calculatePosition();

    return true;
};


ChannelWindowMenu.prototype.hide = function () {
    var param, i;
    if (this.channel_interface == null) {
        return;
    }
    if (this.nameElement.hasClassName('error')) {
        //Carlos:error in param i at least. we must ask for discard changes
        return;
    } else {
        if (this.channel_interface.getFilter() != null &&
                this.param_list != null) {
            for (i = 0; i < this.param_list.length; i += 1) {
                param = this.param_list[i];
                if (param.hasClassName('error')) {
                    //Carlos:error in param i at least. we must ask for discard changes
                    return;
                }
            }
        }
    }
    WindowMenu.prototype.hide.call(this);
};


ChannelWindowMenu.prototype._checkName = function () {
    var newNameValue;
    newNameValue = this.nameElement.value.strip();
    if (newNameValue == '') {
        throw new Error(gettext("Channel name cannot be empty."));
    } else if ((newNameValue != this.wiringGUI.currentChannel.getName()) &&
             this.wiringGUI.channelExists(newNameValue)) {
        throw new Error(gettext("A channel named \"%(channelName)s\" already exists."));
    }
};


ChannelWindowMenu.prototype._checkParam = function (param) {
    param.validate(this.param_list[param.getIndex()].value);
};


ChannelWindowMenu.prototype._onNameBlur = function () {
    var newNameValue, msg;
    newNameValue = this.nameElement.value.strip();
    if (this.channel_interface == null) {
        return;
    }
    try {
        this._checkName();
    } catch (e) {
        msg = interpolate(e.message, {channelName: newNameValue}, true);
        this.nameErrorMsg = msg;
        this.nameErrorIcon.addClassName('on');
        this.nameElement.addClassName('error');
        return;
    }
    this.nameElement.removeClassName('error');
    this.nameErrorIcon.removeClassName('on');
};


ChannelWindowMenu.prototype._onFilterBlur = function (param) {
    var paramVal, msg;
    if (this.channel_interface == null) {
        return;
    }
    paramVal = this.param_list[param.getIndex()].value;
    try {
        this._checkParam(param);
    } catch (e) {
        msg = interpolate(e.message, {paramName: param.getLabel()}, true);
        this.param_warningMsg_list[param.getIndex()] = msg;
        this.param_warningIcon_list[param.getIndex()].addClassName('on');
        this.param_list[param.getIndex()].addClassName('error');
        return;
    }
    this.param_list[param.getIndex()].removeClassName('error');
    this.param_warningIcon_list[param.getIndex()].removeClassName('on');
};

ChannelWindowMenu.prototype._saveListener = function () {
    var param, i, p;
    if (this.channel_interface.filter != null) {
        params = this.channel_interface.filter.getParams();
        for (p = 0; p < params.length; p += 1) {
            param = params[p];
            this._onFilterBlur(param);
        }
    }
    this._onNameBlur();
    if (this.channel_interface == null) {
        return;
    }
    if (this.nameElement.hasClassName('error')) {
        //Carlos:errores, no se salvará nada falta mensaje de error(preguntar)
        return;
    } else {
        if (this.channel_interface.getFilter() != null &&
                this.param_list != null) {
            for (i = 0; i < this.param_list.length; i += 1) {
                param = this.param_list[i];
                if (param.hasClassName('error')) {
                    //Carlos:errores, no se salvará nada falta mensaje de error(preguntar)
                    return;
                }
            }
        }
    }
    //Save new Name
    this.channel_interface.setName(this.nameElement.value.strip());
    //Save filterParams
    for (i = 0; i < this.param_list.length; i += 1) {
        param = this.param_list[i];
        this.channel_interface.setFilterParam(i, this.param_list[i].value);
    }
    WindowMenu.prototype.hide.call(this);
}

ChannelWindowMenu.prototype._closeListener = function () {
    var i;
    //Carlos:Falta un mensaje de confirmacion de si quiere cancelar, y olvidar los cambios realizados
    //restore the initial values
    this.nameElement.removeClassName('error');
    for (i = 0; i < this.param_list.length; i += 1) {
        this.param_list[i].removeClassName('error');
    }
    if (this.channel_interface.filter != this.initialFilter) {
        this.channel_interface.setFilter(this.initialFilter);
    }
    this.hide();
}

/**
 * function to display help in a Filter Param
 */
ChannelWindowMenu.prototype._displayHelpParamWarning = function (param_i, event) {
    var helpOpElement, target;
    Event.stop(event);
    this.divout = document.createElement('div');
    Element.extend(this.divout);
    this.divout.setAttribute('id', 'help_background');
    this.divout.style.cssText = "top:0;bottom:0;right:0;left:0;position:absolute;z-index:3001;";
    this.divout.observe('click', function (e) {
        Event.stop(e);
        target = BrowserUtilsFactory.getInstance().getTarget(e);
        target.parentNode.removeChild(target);
    });
    // Sets the help style
    helpOpElement = document.createElement('div');
    Element.extend(helpOpElement);
    helpOpElement.addClassName('helpwiringheader');
    helpOpElement.style.padding = '5px';
    helpOpElement.style.position = 'absolute';
    helpOpElement.style.top = Event.pointerY(event) + 'px';
    this.divout.appendChild(helpOpElement);
    document.body.appendChild(this.divout);

    helpOpElement.style.left = Event.pointerX(event) + 'px';
    helpOpElement.innerHTML = gettext(this.param_warningMsg_list[param_i]);
};
/**
 * function to display help in the Channel Name
 */
ChannelWindowMenu.prototype._displayHelpNameWarning = function (event) {
    var helpOpElement;
    Event.stop(event);
    this.divout = document.createElement('div');
    Element.extend(this.divout);
    this.divout.setAttribute('id', 'help_background');
    this.divout.style.cssText = "top:0;bottom:0;right:0;left:0;position:absolute;z-index:3001;";
    this.divout.observe('click', function (e) {
        Event.stop(e);
        target = BrowserUtilsFactory.getInstance().getTarget(e);
        target.parentNode.removeChild(target);
    });
    // Sets the help style
    helpOpElement = document.createElement('div');
    Element.extend(helpOpElement);
    helpOpElement.addClassName('helpwiringheader');
    helpOpElement.style.padding = '5px';
    helpOpElement.style.position = 'absolute';
    helpOpElement.style.top = Event.pointerY(event) + 'px';
    this.divout.appendChild(helpOpElement);
    document.body.appendChild(this.divout);

    helpOpElement.style.left = Event.pointerX(event) + 'px';
    helpOpElement.innerHTML = gettext(this.nameErrorMsg);
};

ChannelWindowMenu.prototype._hideHelpWarning = function () {
    document.body.removeChild(this.divout);
};


