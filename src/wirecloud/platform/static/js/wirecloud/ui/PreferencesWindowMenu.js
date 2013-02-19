/*global gettext, StyledElements, ValidationErrorManager, Wirecloud*/

(function () {

    "use strict";

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
        Wirecloud.ui.WindowMenu.call(this, '');

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
        var table = this.manager.getPreferencesDef().getInterface();
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
