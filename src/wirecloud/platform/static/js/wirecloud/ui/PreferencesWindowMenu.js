/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020-2021 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    const build_pref_label = function build_pref_label(preference) {
        const label = document.createElement("label");
        label.appendChild(document.createTextNode(preference.label));
        if (typeof preference.description === 'string' && preference.description.trim() !== '') {
            const tooltip = new se.Tooltip({content: preference.description, placement: ['right', 'bottom', 'top', 'left']});
            tooltip.bind(label);
        }
        return label;
    };

    const build_inherit_input = function build_inherit_input(preference) {
        return Wirecloud.ui.InputInterfaceFactory.createInterface('inherit-' + preference.name, {'type': 'boolean'});
    };

    const build_pref_input = function build_pref_input(preference) {
        return Wirecloud.ui.InputInterfaceFactory.createInterface(preference.name, preference.options);
    };

    const build_form = function build_form() {
        let columnLabel, columnValue;

        // Build a form for changing this gruop of preferences
        const table = document.createElement('table');
        table.classList.add('styled_form');
        table.setAttribute('cellspacing', '0');
        table.setAttribute('cellpadding', '0');

        const tbody = document.createElement('tbody'); // IE7 needs a tbody to display dynamic tables
        table.appendChild(tbody);

        Object.defineProperty(this, 'interfaces', {value: {}});
        for (let key in this.manager.meta.preferences) {
            const preference = this.manager.meta.preferences[key];

            if (preference.hidden) {
                continue;
            }

            const input_interface = build_pref_input(preference);
            this.interfaces[preference.name] = {
                'base': input_interface
            };
            if (!preference.inheritable) {
                const row = tbody.insertRow(-1);
                columnLabel = row.insertCell(-1);
                columnLabel.className = "label-cell";
                columnValue = row.insertCell(-1);
                columnLabel.appendChild(build_pref_label(preference));
                input_interface.insertInto(columnValue);
            } else {
                const complexRow = tbody.insertRow(-1);
                const complexCell = complexRow.insertCell(-1);
                complexCell.style.padding = "0";
                complexCell.colSpan = "2";

                const complexTable = document.createElement('table');
                complexTable.classList.add('complexTable');
                complexTable.setAttribute('cellspacing', '0');
                complexTable.setAttribute('cellpadding', '0');
                complexCell.appendChild(complexTable);

                const complexTBody = document.createElement('tbody'); // IE7 needs a tbody to display dynamic tables
                complexTable.appendChild(complexTBody);

                const labelRow = complexTBody.insertRow(-1);
                columnLabel = labelRow.insertCell(-1);
                columnLabel.className = "label-cell";
                columnLabel.colSpan = "2";

                const prefRow = complexTBody.insertRow(-1);
                const inheritCell = prefRow.insertCell(-1);
                inheritCell.classList.add('inheritCell');

                const inheritInput = build_inherit_input(preference);
                this.interfaces[preference.name].inherit = inheritInput;
                inheritInput.insertInto(inheritCell);
                inheritCell.appendChild(document.createTextNode(utils.gettext('Inherit')));
                inheritInput.inputElement.addEventListener(
                    'change',
                    function () {
                        this.input_interface.setDisabled(this.inherit_interface.getValue());
                    }.bind({input_interface: input_interface, inherit_interface: inheritInput}));

                columnValue = prefRow.insertCell(-1);
                columnLabel.appendChild(build_pref_label(preference));
                input_interface.insertInto(columnValue);
            }
        }
        this.windowContent.insertBefore(table, this.msgElement);
    };

    const save_preferences = function save_preferences(callback) {
        const modifiedValues = {};
        let newInheritanceSetting;

        for (let pref_name in this.interfaces) {
            const preference = this.manager.preferences[pref_name];
            const inputs = this.interfaces[pref_name];

            // Check if this preference has changed
            let inheritSettingChange = false;
            if ('inherit' in inputs) {
                newInheritanceSetting = inputs.inherit.getValue();
                inheritSettingChange = newInheritanceSetting !== preference.inherit;
            }

            const newValue = inputs.base.getValue();
            const valueChange = preference.value !== newValue;

            if (!inheritSettingChange && !valueChange) {
                continue; // This preference has not changed
            }

            // Process preference changes
            const changes = {};

            if (inheritSettingChange) {
                changes.inherit = newInheritanceSetting;
            }

            // if the value of the combo has changed or we don't want to use the inherited value
            // take the value of the combo.
            if (newInheritanceSetting === false || valueChange) {
                changes.value = newValue;
            }

            modifiedValues[pref_name] = changes;
        }

        this.manager.set(modifiedValues).then(() => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    const _executeOperation = function _executeOperation(callback) {
        // Validate input fields
        const validationManager = new StyledElements.ValidationErrorManager();
        for (let pref_name in this.interfaces) {
            validationManager.validate(this.interfaces[pref_name].base);
        }

        // Build Error Message
        const errorMsg = validationManager.toHTML();

        // Show error message if needed
        if (errorMsg.length !== 0) {
            this.alertMsg.setMessage(errorMsg[0]);
            this.alertMsg.show();
        } else {
            save_preferences.call(this, callback);
            this.hide();
            this.alertMsg.hide();
        }
    };

    /**
     * Specific class for platform preferences windows.
     *
     * @param manager
     *
     */
    ns.PreferencesWindowMenu = class PreferencesWindowMenu extends ns.WindowMenu {

        constructor(scope, manager) {
            super("", "wc-" + scope + "-preferences-modal");

            Object.defineProperty(this, 'manager', {value: manager});

            // Reset button
            this.resetButton = new se.Button({
                class: 'btn-set-defaults',
                text: utils.gettext('Set Defaults'),
            });
            this.resetButton.addEventListener("click", function () {
                let pref_name, preference;

                for (pref_name in this.interfaces) {
                    preference = this.manager.preferences[pref_name].meta;

                    this.interfaces[pref_name].base.setValue(preference.default);
                    if ('inherit' in this.interfaces[pref_name]) {
                        this.interfaces[pref_name].inherit.setValue(preference.inheritByDefault);
                        this.interfaces[pref_name].base.setDisabled(preference.inheritByDefault);
                    }
                }
            }.bind(this));
            this.resetButton.insertInto(this.windowBottom);

            this.alertMsg = new se.Alert({state: 'error', title: utils.gettext('Error')});
            this.alertMsg.insertInto(this.windowContent);
            this.alertMsg.hide();

            // Accept button
            this.acceptButton = new se.Button({
                class: 'btn-accept btn-primary',
                text: utils.gettext('Save')
            });
            this.acceptButton.addEventListener("click", _executeOperation.bind(this));
            this.acceptButton.insertInto(this.windowBottom);

            // Cancel button
            this.cancelButton = new se.Button({
                class: 'btn-cancel',
                text: utils.gettext('Cancel')
            });

            this.cancelButton.addEventListener("click", this._closeListener);
            this.cancelButton.insertInto(this.windowBottom);
        }

        setCancelable(cancelable) {
            this.cancelButton.setDisabled(!cancelable);
        }

        show(parentWindow) {
            let pref_name;

            this.setTitle(this.manager.buildTitle());

            if (!('interfaces' in this)) {
                build_form.call(this);
            }

            for (pref_name in this.manager.preferences) {
                if (this.manager.preferences[pref_name].meta.hidden === true) {
                    continue;
                }
                this.interfaces[pref_name].base.setValue(this.manager.preferences[pref_name].value);
                if ('inherit' in this.interfaces[pref_name]) {
                    this.interfaces[pref_name].inherit.setValue(this.manager.preferences[pref_name].inherit);
                    this.interfaces[pref_name].base.setDisabled(this.manager.preferences[pref_name].inherit);
                }
                this.interfaces[pref_name].base.addEventListener('requestSave', _executeOperation.bind(this));
            }
            Wirecloud.ui.WindowMenu.prototype.show.call(this, parentWindow);

            for (pref_name in this.interfaces) {
                this.interfaces[pref_name].base.repaint();
            }
        }

        destroy() {
            this.acceptButton.destroy();
            this.cancelButton.destroy();

            super.destroy();
        }

    }

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
