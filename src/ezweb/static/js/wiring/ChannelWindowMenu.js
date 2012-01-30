/*jslint browser: true, sloppy: true, nomen: true, maxerr: 50, indent: 4 */
/*global gettext, Element, WindowMenu, BrowserUtilsFactory, Event, LayoutManagerFactory */

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

    if (typeof(_label_class ) === 'string') {
        labelContent.className = _label_class;
    }
    labelCol.appendChild(labelContent);

    // value
    valueCol = contentRow.insertCell(-1);
    valueCol.appendChild(value_element);

    return contentRow;
}

/**
 * Specific class for dialogs about creating things.
 */
function ChannelWindowMenu(wiringGUI) {
    var table, filterMenuButton;

    WindowMenu.call(this, gettext('Editing channel properties'), "channel_window");

    this.wiringGUI = wiringGUI;
    this.param_rows = [];

    // Table for form fields
    table = document.createElement("table");
    Element.extend(table);

    // IE6 and IE7 needs a tbody to display dynamic tables
    this.contentTable = document.createElement('tbody');
    table.appendChild(this.contentTable);
    Element.extend(this.contentTable);
    this.windowContent.appendChild(table);



    // Channel name
    this.nameElement = document.createElement("input");
	this.nameElement.setAttribute('type', 'text');
    Element.extend(this.nameElement);

    addRow(this.contentTable, gettext("Name") + ":", this.nameElement);

    // Channel value
    this.valueElement = document.createElement("div");
    Element.extend(this.valueElement);

    addRow(this.contentTable, gettext("Value") + ":", this.valueElement);

    // Filter

    this.filterLabelDiv = document.createElement("div");
    Element.extend(this.filterLabelDiv);
    this.filterLabelDiv.addClassName("filterValue");

    this.filterInput = document.createTextNode("");
    this.filterLabelDiv.appendChild(this.filterInput);

    if (BrowserUtilsFactory.getInstance().isIE()) {
        filterMenuButton = document.createElement('<input type="button" />');
        Element.extend(filterMenuButton);
    } else {
        filterMenuButton = document.createElement('input');
        filterMenuButton.type = "button";
    }
    this.filterLabelDiv.appendChild(filterMenuButton);
    filterMenuButton.addClassName("filter_menu_button");
    filterMenuButton.observe('click',
        function (e) {
            var target = BrowserUtilsFactory.getInstance().getTarget(e);
            target.blur();
            Event.stop(e);
            LayoutManagerFactory.getInstance().showDropDownMenu(
                'filterMenu',
                this.wiringGUI.filterMenu,
                Event.pointerX(e),
                Event.pointerY(e)
            );
        }.bind(this)
        );
    addRow(this.contentTable, gettext("Filter") + ":", this.filterLabelDiv);
}
ChannelWindowMenu.prototype = new WindowMenu();

ChannelWindowMenu.prototype.show = function (parentWindow, channel_interface) {
    this.channel_interface = channel_interface;
    this._updateFilterInterface();
    WindowMenu.prototype.show.call(this, parentWindow);
};

/**
 * Updates the interface according to the new filter.
 *
 * @private
 */
ChannelWindowMenu.prototype._updateFilterInterface = function () {

    // Sets the filter name
    var filterName;
    if (this.channel_interface.filter == null) {
        filterName = gettext("None");
    } else {
        filterName = this.channel_interface.filter.getLabel();
    }

    // Workaround "this.filterInput.setTextContent(filterName);" not working on IE
    this.filterLabelDiv.removeChild(this.filterInput);
    this.filterInput = document.createTextNode(filterName);
    this.filterLabelDiv.insertBefore(this.filterInput, this.filterLabelDiv.childNodes[0]);

    // Sets the channel value and the channel filter params
    //this.valueElement.setTextContent(this.channel.getValueWithFilter());
    this._updateFilterParams();
};


ChannelWindowMenu.prototype._createParamInterface = function (param) {
    var paramValueLayer, paramInput;

    paramValueLayer = document.createElement("div");
    Element.extend(paramValueLayer);
    paramInput = document.createElement("input");
    Element.extend(paramInput);
    paramInput.addClassName("paramValueInput");
    paramInput.setAttribute("value", this.channel_interface.getFilterParams()[param.getIndex()]['value']);
    this.inputs[param.getIndex()] = paramInput;

    // Sets the input
    paramValueLayer.appendChild(paramInput);
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
    this.inputs = {};

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
    if (this.filter == null)
        return;

    var fParams = {};
    var params = this.filter.getParams();
    for (var i = 0; i < params.length; i += 1) {
        param = params[i];
        fParams[param.getIndex()] = this.inputs[param.getIndex()].value;
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
