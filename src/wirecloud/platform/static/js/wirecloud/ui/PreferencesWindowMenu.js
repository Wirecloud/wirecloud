/*global gettext, StyledElements, ValidationErrorManager, Wirecloud*/

(function () {

    "use strict";

    var build_pref_label = function build_pref_label(preference) {
       var label = document.createElement("label");
       label.appendChild(document.createTextNode(preference.label));
       label.setAttribute("title", gettext(preference.description));
       //label.setAttribute("for", preference.name);
       return label;
    };

    var build_inherit_input = function build_inherit_input(preference) {
        return Wirecloud.ui.InputInterfaceFactory.createInterface('inherit-' + preference.name, {'type': 'boolean'});
    };

    var build_pref_input = function build_pref_input(preference) {
        return Wirecloud.ui.InputInterfaceFactory.createInterface(preference.name, preference.options);
    };

    var build_form = function build_form() {
        // Build a form for changing this gruop of preferences
        var table = document.createElement('table');
        table.classList.add('styled_form');
        table.setAttribute('cellspacing', '0');
        table.setAttribute('cellpadding', '0');

        var tbody = document.createElement('tbody'); // IE7 needs a tbody to display dynamic tables
        table.appendChild(tbody);

        Object.defineProperty(this, 'interfaces', {value: {}});
        for (var key in this.manager.meta.preferences) {
            var preference = this.manager.meta.preferences[key];

            if (preference.hidden) {
                continue;
            }

            var input_interface = build_pref_input(preference);
            this.interfaces[preference.name] = {
                'base': input_interface
            };
            if (!preference.inheritable) {
                var row = tbody.insertRow(-1);
                var columnLabel = row.insertCell(-1);
                columnLabel.className = "label-cell";
                var columnValue = row.insertCell(-1);
                columnLabel.appendChild(build_pref_label(preference));
                input_interface.insertInto(columnValue);
            } else {
                var complexRow = tbody.insertRow(-1);
                var complexCell = complexRow.insertCell(-1);
                complexCell.style.padding = "0";
                complexCell.colSpan = "2";

                var complexTable = document.createElement('table');
                complexTable.classList.add('complexTable');
                complexTable.setAttribute('cellspacing', '0');
                complexTable.setAttribute('cellpadding', '0');
                complexCell.appendChild(complexTable);

                var complexTBody = document.createElement('tbody'); // IE7 needs a tbody to display dynamic tables
                complexTable.appendChild(complexTBody);

                var labelRow = complexTBody.insertRow(-1);
                var columnLabel = labelRow.insertCell(-1);
                columnLabel.className = "label-cell";
                columnLabel.colSpan = "2";

                var prefRow = complexTBody.insertRow(-1);
                var inheritCell = prefRow.insertCell(-1);
                inheritCell.classList.add('inheritCell');

                var inheritInput = build_inherit_input(preference);
                this.interfaces[preference.name].inherit = inheritInput;
                inheritInput.insertInto(inheritCell);
                inheritCell.appendChild(document.createTextNode(gettext('Inherit')));
                inheritInput.inputElement.addEventListener(
                    'change',
                    function() {
                        this.input_interface.setDisabled(this.inherit_interface.getValue());
                    }.bind({input_interface: input_interface, inherit_interface: inheritInput}));

                var columnValue = prefRow.insertCell(-1);
                columnLabel.appendChild(build_pref_label(preference));
                input_interface.insertInto(columnValue);
            }
        }
        this.windowContent.insertBefore(table, this.msgElement);
    };

    var save_preferences = function save_preferences() {
        var modifiedValues = {};
        var newInheritanceSetting;

        for (var pref_name in this.manager.preferences) {
            var preference = this.manager.preferences[pref_name];
            var inputs = this.interfaces[pref_name];

            // Check if this preference has changed
            var inheritSettingChange = false;
            if ('inherit' in inputs) {
                newInheritanceSetting = inputs.inherit.getValue();
                inheritSettingChange = newInheritanceSetting != preference.inherit;
            }

            var newValue = inputs.base.getValue();
            var valueChange = preference.value != newValue;

            if (!inheritSettingChange && !valueChange) {
                continue; // This preference has not changed
            }

            // Process preference changes
            var changes = {};

            if (inheritSettingChange) {
                changes.inherit = newInheritanceSetting;
            }

            //if the value of the combo has changed or we don't want to use the inherited value
            //take the value of the combo.
            if (newInheritanceSetting === false || valueChange) {
                changes.value = newValue;
            }

            modifiedValues[pref_name] = changes;
        }

        this.manager.set(modifiedValues);
    };

    var _executeOperation = function _executeOperation() {
        // Validate input fields
        var validationManager = new ValidationErrorManager();
        for (var pref_name in this.manager.preferences) {
            validationManager.validate(this.interfaces[pref_name].base);
        }

        // Build Error Message
        var errorMsg = validationManager.toHTML();

        // Show error message if needed
        if (errorMsg.length !== 0) {
            // FIXME
            this.setMsg(errorMsg[0]);
        } else {
            save_preferences.call(this);
            this.hide();
        }
    };

    /**
     * Specific class for platform preferences windows.
     *
     * @param manager
     *
     */
    var PreferencesWindowMenu = function PreferencesWindowMenu(scope, manager) {
        Wirecloud.ui.WindowMenu.call(this, '', scope + '_preferences');

        Object.defineProperty(this, 'manager', {value: manager});

        // Reset button
        this.resetButton = new StyledElements.StyledButton({
            text: gettext('Set Defaults'),
        });
        this.resetButton.addEventListener("click", function () {
            var pref_name, preference;

            for (pref_name in this.manager.preferences) {
                preference = this.manager.preferences[pref_name].meta;

                this.interfaces[pref_name].base.setValue(preference['default']);
                if ('inherit' in this.interfaces[pref_name]) {
                    this.interfaces[pref_name].inherit.setValue(preference.inheritByDefault);
                    this.interfaces[pref_name].base.setDisabled(preference.inheritByDefault);
                }
            }
        }.bind(this));
        this.resetButton.insertInto(this.windowBottom);

        // Accept button
        this.acceptButton = new StyledElements.StyledButton({
            text: gettext('Save'),
            'class': 'btn-primary'
        });
        this.acceptButton.addEventListener("click", _executeOperation.bind(this));
        this.acceptButton.insertInto(this.windowBottom);

        // Cancel button
        this.cancelButton = new StyledElements.StyledButton({
            text: gettext('Cancel')
        });

        this.cancelButton.addEventListener("click", this._closeListener);
        this.cancelButton.insertInto(this.windowBottom);
    };
    PreferencesWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    PreferencesWindowMenu.prototype.setCancelable = function setCancelable(cancelable) {
        this.cancelButton.setDisabled(!cancelable);
    };

    PreferencesWindowMenu.prototype.show = function show(parentWindow) {
        var pref_name;

        this.setTitle(this.manager.buildTitle());

        if (!('interfaces' in this)) {
            build_form.call(this);
        }

        for (pref_name in this.manager.preferences) {
            this.interfaces[pref_name].base.setValue(this.manager.preferences[pref_name].value);
            if ('inherit' in this.interfaces[pref_name]) {
                this.interfaces[pref_name].inherit.setValue(this.manager.preferences[pref_name].inherit);
                this.interfaces[pref_name].base.setDisabled(this.manager.preferences[pref_name].inherit);
            }
        }
        Wirecloud.ui.WindowMenu.prototype.show.call(this, parentWindow);

        for (pref_name in this.manager.preferences) {
            this.interfaces[pref_name].base.repaint();
        }
    };

    PreferencesWindowMenu.prototype.destroy = function destroy() {
        this.acceptButton.destroy();
        this.cancelButton.destroy();

        Wirecloud.ui.WindowMenu.prototype.destroy.call(this);
    };

    Wirecloud.ui.PreferencesWindowMenu = PreferencesWindowMenu;

})();
