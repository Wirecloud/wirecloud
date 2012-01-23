function addRow(tbody, label, value_element) {
    var contentRow, labelCol, labelContent, valueCol;

    // row
    contentRow = tbody.insertRow(-1);
    Element.extend(contentRow);

    // label
    labelCol = contentRow.insertCell(-1);
    labelContent = document.createElement("label");
    labelContent.setTextContent(label);
    labelCol.appendChild(labelContent);

    // value
    valueCol = contentRow.insertCell(-1);
    valueCol.appendChild(value_element);

    return contentRow;
}

/**
 * Specific class for dialogs about creating things.
 */
function ChannelWindowMenu (wiringGUI) {
    var table, labelCol, labelContent, contentRow;

    WindowMenu.call(this, '');

    this.wiringGUI = wiringGUI;
    this.param_rows = [];

    // Table for form fields
    table = document.createElement("table");
    Element.extend(table);

    // IE6 and IE7 needs a tbody to display dynamic tables
    this.contentTable = document.createElement('tbody'); 
    table.appendChild(this.contentTable)
    Element.extend(this.contentTable);
    this.windowContent.appendChild(table);



    // Channel name
    this.nameElement = document.createElement("div");
    Element.extend(this.nameElement);

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
        var filterMenuButton = document.createElement('<input type="button" />');
        Element.extend(filterMenuButton);
    } else {
        var filterMenuButton = document.createElement('input');
        filterMenuButton.type = "button";
    }
    this.filterLabelDiv.appendChild(filterMenuButton);
    filterMenuButton.addClassName("filterMenuLauncher");
    filterMenuButton.observe('click',
        function(e) {
            var target = BrowserUtilsFactory.getInstance().getTarget(e);
            target.blur();
            Event.stop(e);
            LayoutManagerFactory.getInstance().showDropDownMenu(
                'filterMenu',
                this.wiringGUI.filterMenu,
                Event.pointerX(e),
                Event.pointerY(e));
        }.bind(this)
    );
    addRow(this.contentTable, gettext("Filter") + ":", this.filterLabelDiv);
}
ChannelWindowMenu.prototype = new WindowMenu();

ChannelWindowMenu.prototype.show = function(parentWindow, channel) {
    this.channel = channel;
    this._updateFilterInterface();
    WindowMenu.prototype.show.call(this, parentWindow);
};

/**
 * Updates the interface according to the new filter.
 *
 * @private
 */
ChannelWindowMenu.prototype._updateFilterInterface = function() {

    // Sets the filter name
    var filterName;
    if (this.channel.filter == null) {
        filterName = gettext("None");
    } else {
        filterName = this.channel.filter.getLabel();
    }

    // Workaround "this.filterInput.setTextContent(filterName);" not working on IE
    this.filterLabelDiv.removeChild(this.filterInput);
    this.filterInput = document.createTextNode(filterName);
    this.filterLabelDiv.insertBefore(this.filterInput, this.filterLabelDiv.childNodes[0]);

    // Sets the channel value and the channel filter params
    //this.valueElement.setTextContent(this.channel.getValueWithFilter());
    this._updateFilterParams();
}

/**
 * @private
 *
 * Builds/Rebuilds the filter params interface.
 * @param {ChannelInterface} channel
 * @param {Filter} filter
 * @param {}
 */
ChannelWindowMenu.prototype._updateFilterParams = function () {
    var i, params, p, param, initial_values;

    // Removes previous parameters
    for (i = 0; i < this.param_rows.length; i++) {
        this.contentTable.removeChild(this.param_rows[i]);
    }

    // No filter, no params
    if (this.channel.filter == null) {
        return;
    }

    // Adds a new row for each param of the current filter
    params = this.channel.filter.getParams();
    initial_values = this.channel.filter.getInitialValues();
    for (p = 0; p < params.length; p++) {
        param = params[p];
        this.param_rows.push(addRow(this.contentTable, param, param.createHtmlValue(this.wiringGUI, this.channel, this.valueElement)));
    }
}
