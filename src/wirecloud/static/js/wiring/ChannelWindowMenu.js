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

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50, prototypejs: true */
/*global gettext, Element, WindowMenu, BrowserUtilsFactory, Event, LayoutManagerFactory, StyledElements, interpolate */

var ChannelWindowMenu = function () {

    "use strict";

    var addRow, updateFilterInterface, createParamInterface, updateFilterParams, checkName, checkParam, onNameBlur, onFilterBlur, saveListener, closeListener, displayHelpParamWarning, displayHelpNameWarning, hideHelpWarning;

    /**
     * add new row
     *
     * @private
     */
    addRow = function (tbody, label, value_element, label_class) {
        var contentRow, labelCol, labelContent, valueCol;

        // row
        contentRow = tbody.insertRow(-1);
        Element.extend(contentRow);

        // label
        labelCol = contentRow.insertCell(-1);
        labelContent = document.createElement("label");
        labelContent.setTextContent(label);

        if (typeof (label_class) === 'string') {
            labelContent.className = label_class;
        }
        labelCol.appendChild(labelContent);

        // value
        valueCol = contentRow.insertCell(-1);
        valueCol.appendChild(value_element);

        return contentRow;
    };


    /**
     * Updates the interface according to the new filter.
     *
     * @private
     */
    updateFilterInterface = function () {

        // Sets the filter name
        if (this.channel_interface.filter == null) {
            this.filterName.setTextContent(gettext("None"));
        } else {
            this.filterName.setTextContent(this.channel_interface.filter.getLabel());
        }
        // Sets the channel value and the channel filter params
        //this.valueElement.value = this.channel_interface.getValueWithFilter();
        updateFilterParams.call(this);
    };

    /**
     * @private
     *
     *
     * @return
     */
    createParamInterface = function (param) {
        var paramValueLayer, paramValue, paramInput, paramWarningIcon;

        paramValueLayer = document.createElement("div");
        Element.extend(paramValueLayer);
        paramInput = document.createElement("input");
        //Each param for the current filter
        this.param_list[param.getIndex()] = paramInput;
        paramInput.observe('blur', onFilterBlur.bind(this, param));
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
        paramWarningIcon.observe('click', displayHelpParamWarning.bind(this, param.getIndex()));
        Element.extend(this.paramWarningIcon);
        paramValueLayer.appendChild(paramWarningIcon);
        return paramValueLayer;
    };


    /**
     * @private
     *
     * Builds/Rebuilds the filter params interface.
     */
    updateFilterParams = function () {
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
            valueInterface = createParamInterface.call(this, param);
            this.param_rows.push(addRow(this.contentTable, param.getLabel(), valueInterface, 'icon icon-wiring-filter-param'));
        }
    };


    checkName = function () {
        var newNameValue;
        newNameValue = this.nameElement.value.strip();
        if (newNameValue === '') {
            throw new Error(gettext("Channel name cannot be empty."));
        } else if ((newNameValue !== this.wiringGUI.currentChannel.getName()) &&
                 this.wiringGUI.channelExists(newNameValue)) {
            throw new Error(gettext("A channel named \"%(channelName)s\" already exists."));
        }
    };


    checkParam = function (param) {
        param.validate(this.param_list[param.getIndex()].value);
    };


    onNameBlur = function () {
        var newNameValue, msg;
        newNameValue = this.nameElement.value.strip();
        if (this.channel_interface == null) {
            return;
        }
        try {
            checkName.call(this);
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


    onFilterBlur = function (param) {
        var paramVal, msg;
        if (this.channel_interface == null) {
            return;
        }
        paramVal = this.param_list[param.getIndex()].value;
        try {
            checkParam.call(this, param);
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

    saveListener = function () {
        var param, i, p, params;
        if (this.channel_interface.filter != null) {
            params = this.channel_interface.filter.getParams();
            for (p = 0; p < params.length; p += 1) {
                param = params[p];
                onFilterBlur.call(this, param);
            }
        }
        onNameBlur.call(this);
        if (this.channel_interface == null) {
            return;
        }
        if (!this.nameElement.hasClassName('error')) {
            if (this.channel_interface.getFilter() != null &&
                    this.param_list != null) {
                for (i = 0; i < this.param_list.length; i += 1) {
                    param = this.param_list[i];
                    if (param.hasClassName('error')) {
                        return;
                    }
                }
            }
        } else {
            return;
        }
        //Save new Name
        this.channel_interface.setName(this.nameElement.value.strip());
        //Save filterParams
        for (i = 0; i < this.param_list.length; i += 1) {
            param = this.param_list[i];
            this.channel_interface.setFilterParam(i, this.param_list[i].value);
        }
        WindowMenu.prototype.hide.call(this);
    };

    closeListener = function () {
        var i;
        //restore the initial values
        this.nameElement.removeClassName('error');
        for (i = 0; i < this.param_list.length; i += 1) {
            this.param_list[i].removeClassName('error');
        }
        if (this.channel_interface.filter !== this.initialFilter) {
            this.channel_interface.setFilter(this.initialFilter);
        }
        this.hide();
    };

    /**
     * function to display help in a Filter Param
     */
    displayHelpParamWarning = function (param_i, event) {
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
    displayHelpNameWarning = function (event) {
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
        helpOpElement.innerHTML = gettext(this.nameErrorMsg);
    };

    hideHelpWarning = function () {
        document.body.removeChild(this.divout);
    };

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
        this.nameElement.observe('blur', onNameBlur.bind(this));
        Element.extend(this.nameElement);
        this.nameErrorDiv = document.createElement("div");
        Element.extend(this.nameErrorDiv);
        this.nameErrorIcon = document.createElement("span");
        this.nameErrorIcon.addClassName('error icon icon-size icon-warning-channel');
        this.nameErrorIcon.observe('mouseover', displayHelpNameWarning.bind(this));
        this.nameErrorIcon.observe('mouseout', hideHelpWarning.bind(this));
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
            this.wiringGUI.filterMenu.show({x: dim.left, y: dim.top});
        }.bind(this));
        addRow(this.contentTable, gettext("Filter") + ":", this.filterLabelDiv);

        // Accept button
        aceptButton = document.createElement('button');
        Element.extend(aceptButton);
        aceptButton.appendChild(document.createTextNode(gettext('Save')));
        aceptButton.observe("click", saveListener.bind(this));
        this.windowBottom.appendChild(aceptButton);

        // Cancel button
        cancelButton = document.createElement('button');
        Element.extend(cancelButton);
        cancelButton.appendChild(document.createTextNode(gettext('Cancel')));
        cancelButton.observe("click", closeListener.bind(this));
        this.windowBottom.appendChild(cancelButton);
    }

    ChannelWindowMenu.prototype = new WindowMenu();

    ChannelWindowMenu.prototype.show = function (parentWindow, channel_interface) {
        this.channel_interface = channel_interface;
        updateFilterInterface.call(this);
        //Save current filter
        this.initialFilter = this.channel_interface.getFilter();
        //show the current channel name in the imput
        this.nameElement.value = channel_interface.getName();
        //show the value of the filter
        //this.valueElement.value = this.channel_interface.getValueWithFilter();
        WindowMenu.prototype.show.call(this, parentWindow);
    };

    ChannelWindowMenu.prototype.hide = function () {
        var param, i;
        if (this.channel_interface == null) {
            return;
        }
        if (!this.nameElement.hasClassName('error')) {
            if (this.channel_interface.getFilter() != null &&
                    this.param_list != null) {
                for (i = 0; i < this.param_list.length; i += 1) {
                    param = this.param_list[i];
                    if (param.hasClassName('error')) {
                        //error in param i at least. we must ask for discard changes
                        return;
                    }
                }
            }
        } else {
            //error in param i at least. we must ask for discard changes
            return;
        }
        WindowMenu.prototype.hide.call(this);
        //updating channel_interface
        this.channel_interface.update();
    };

    ChannelWindowMenu.prototype.changeFilter = function (filter) {
        if (this.channel_interface.filter === filter) {
            return false; // There is not a real change => nothing to do
        }
        this.channel_interface.setFilter(filter);
        this.channel_interface.setFilterParams(filter.getInitialValues());
        updateFilterInterface.call(this);

        this.calculatePosition();

        return true;
    };

    return ChannelWindowMenu;
}();
