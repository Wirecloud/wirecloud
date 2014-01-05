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
        return StyledElements.DefaultInputInterfaceFactory.createInterface('inherit-' + preference.name, {'type': 'boolean'});
    };

    var build_pref_input = function build_pref_input(preference) {
        return StyledElements.DefaultInputInterfaceFactory.createInterface(preference.name, preference.options);
    };

    var _executeOperation = function _executeOperation() {
        // Validate input fields
        var validationManager = new ValidationErrorManager();
        var preferences = this.manager._preferencesDef._preferences;
        for (var prefId in preferences) {
            validationManager.validate(preferences[prefId].inputInterface);
        }

        // Build Error Message
        var errorMsg = validationManager.toHTML();

        // Show error message if needed
        if (errorMsg.length !== 0) {
            // FIXME
            this.setMsg(errorMsg[0]);
        } else {
            this.manager.save();
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

        this.manager = manager;

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
        this.setTitle(this.manager.buildTitle());

        // TODO
        // Build a form skeleton for changing this gruop of preferences
        var table = document.createElement('table');
        table.setAttribute('cellspacing', '0');
        table.setAttribute('cellpadding', '0');

        var tbody = document.createElement('tbody'); // IE7 needs a tbody to display dynamic tables
        table.appendChild(tbody);

        for (var key in this.manager.meta.preferences) {
            var preference = this.manager.meta.preferences[key];

            if (preference.hidden) {
                continue;
            }

            var input_interface = build_pref_input(preference);
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

        this.manager.resetInterface();
        Wirecloud.ui.WindowMenu.prototype.show.call(this, parentWindow);
    };

    PreferencesWindowMenu.prototype.destroy = function destroy() {
        this.acceptButton.destroy();
        this.cancelButton.destroy();

        Wirecloud.ui.WindowMenu.prototype.destroy.call(this);
    };

    Wirecloud.ui.PreferencesWindowMenu = PreferencesWindowMenu;

})();
