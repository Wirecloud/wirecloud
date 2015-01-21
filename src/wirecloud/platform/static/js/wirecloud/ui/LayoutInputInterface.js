/*
 *     Copyright (c) 2014-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, InputValidationError, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var LAYOUT_FIELDS_MAPPING = {
        'columnlayout': [
            {
                "name":          "smart",
                "defaultValue":  true,
                "label":         gettext("Smart"),
                "type":          "boolean",
                "description":   gettext("Widgets will tend to be placed on the topmost position available if this option is enabled. (default: enabled)")
            },
            {
                "name":          "columns",
                "min":           1,
                "max":           200,
                "defaultValue":  20,
                "label":         gettext("Columns"),
                "type":          "number",
                "description":   gettext("Grid columns. (default: 20 columns)")
            },
            {
                "name":          "cellheight",
                "min":           7,
                "max":           1024,
                "defaultValue":  13,
                "label":         gettext("Row Height (in pixels)"),
                "type":          "number",
                "description":   gettext("Row/cell height. Must be specified in pixel units. (default: 13px)")
            },
            {
                "name":          "horizontalmargin",
                "min":           0,
                "defaultValue":  4,
                "label":         gettext("Horizontal Margin between widgets (in pixels)"),
                "type":          "number",
                "description":   gettext("Horizontal Margin between widgets. Must be specified in pixel units. (default: 4px)")
            },
            {
                "name":          "verticalmargin",
                "min":           0,
                "defaultValue":  3,
                "label":         gettext("Vertical Margin between widgets (in pixels)"),
                "type":          "number",
                "description":   gettext("Vertical margin between widgets. Must be specified in pixel units. (default: 3px)")
            }
        ],
        'gridlayout': [
            {
                "name":          "columns",
                "min":           1,
                "max":           200,
                "defaultValue":  20,
                "label":         gettext("Columns"),
                "type":          "number",
                "description":   gettext("Grid columns. (default: 12 columns)")
            },
            {
                "name":          "rows",
                "min":           1,
                "max":           200,
                "defaultValue":  6,
                "label":         gettext("Rows"),
                "type":          "number",
                "description":   gettext("Grid rows (default: 6 rows)")
            },
            {
                "name":          "horizontalmargin",
                "min":           0,
                "defaultValue":  4,
                "label":         gettext("Horizontal Margin between widgets (in pixels)"),
                "type":          "number",
                "description":   gettext("Horizontal Margin between widgets. Must be specified in pixel units. (default: 4px)")
            },
            {
                "name":          "verticalmargin",
                "min":           0,
                "defaultValue":  3,
                "label":         gettext("Vertical Margin between widgets (in pixels)"),
                "type":          "number",
                "description":   gettext("Vertical Margin between widgets. Must be specified in pixel units. (default: 3px)")
            }
        ]
    };

    var updateLayoutSummary = function updateLayoutSummary() {
        var summary = '', context = Wirecloud.Utils.clone(this.layout);

        switch (this.layout.type) {
        case 'columnlayout':
            if (context.smart) {
                context.smart = ' smart';
            } else {
                context.smart = '';
            }
            summary = '%(columns)s%(smart)s columns';
            break;
        case 'gridlayout':
            summary = '%(columns)s columns x %(rows)s rows';
            break;
        }
        summary = Wirecloud.Utils.interpolate(summary, context);
        this.summary_addon.setLabel(summary);
    };

    /**
     *
     */
    var LayoutInputInterface = function LayoutInputInterface(fieldId, options) {
        StyledElements.InputInterface.call(this, fieldId, options);

        this.wrapperElement = new StyledElements.HorizontalLayout({'class': 'se-layout-field input input-prepend input-append'});

        // Layout type select
        this.selectElement = new StyledElements.StyledSelect({
            name: options.name + '-type',
            initialEntries: [
                {"value": "columnlayout", "label": gettext("Columns")},
                {"value": "gridlayout", "label": gettext("Grid")}
            ]
        });
        this.selectElement.addEventListener('change', function (select) {
            this.layout = Wirecloud.Utils.clone(this.layout);
            this.layout.type = select.getValue();

            var fields = LAYOUT_FIELDS_MAPPING[this.layout.type];
            for (var i = 0; i < fields.length; i++) {
                if (!(fields[i].name in this.layout)) {
                    this.layout[fields[i].name] = fields[i].defaultValue;
                }
            }
            updateLayoutSummary.call(this);
        }.bind(this));
        this.wrapperElement.getWestContainer().appendChild(this.selectElement);

        // Summary-addon
        this.summary_addon = new StyledElements.Addon();
        this.wrapperElement.getCenterContainer().appendChild(this.summary_addon);

        // Settings button
        this.buttonElement = new StyledElements.StyledButton({iconClass: 'icon-cogs'});
        this.buttonElement.addEventListener('click', function () {
            var fields = LAYOUT_FIELDS_MAPPING[this.layout.type];
            var dialog = new Wirecloud.ui.FormWindowMenu(fields, gettext('Layout configuration'), 'layout_settings');

            // Form data is sent to server
            dialog.executeOperation = function (data) {
                this.layout = Wirecloud.Utils.clone(this.layout);
                Wirecloud.Utils.merge(this.layout, data);
                updateLayoutSummary.call(this);
            }.bind(this);

            dialog.show(Wirecloud.UserInterfaceManager.currentWindowMenu);
            dialog.setValue(this.layout);
        }.bind(this));
        this.wrapperElement.getEastContainer().appendChild(this.buttonElement);
    };
    LayoutInputInterface.prototype = new StyledElements.InputInterface();

    LayoutInputInterface.parse = function parse(value) {
        return JSON.parse(value);
    };

    LayoutInputInterface.stringify = function stringify(value) {
        return JSON.stringify(value);
    };

    LayoutInputInterface.prototype._checkValue = function _checkValue(newValue) {
        return InputValidationError.NO_ERROR;
    };

    LayoutInputInterface.prototype.getValue = function getValue() {
        return this.layout;
    };

    LayoutInputInterface.prototype.setDisabled = function setDisabled(disabled) {
        this.selectElement.setDisabled(disabled);
        this.summary_addon.setDisabled(disabled);
        this.buttonElement.setDisabled(disabled);
    };

    LayoutInputInterface.prototype.repaint = function epaint() {
        this.wrapperElement.repaint();
    };

    LayoutInputInterface.prototype._setValue = function _setValue(newValue) {
        this.layout = newValue;
        this.selectElement.setValue(this.layout.type);
        updateLayoutSummary.call(this);
    };

    LayoutInputInterface.prototype._setError = function _setError(error) {
    };

    LayoutInputInterface.prototype.insertInto = function insertInto(element) {
        this.wrapperElement.insertInto(element);
        this.wrapperElement.repaint();
    };

    Wirecloud.ui.LayoutInputInterface = LayoutInputInterface;

})();
