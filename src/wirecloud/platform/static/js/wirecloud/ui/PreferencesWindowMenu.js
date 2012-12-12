/**
 * Specific class for platform preferences windows.
 *
 * @param manager
 *
 */
function PreferencesWindowMenu(scope, manager) {
    WindowMenu.call(this, '');

    this.manager = manager;

    // Accept button
    this.acceptButton = new StyledElements.StyledButton({
        text: gettext('Save'),
        'class': 'btn-primary'
    });
    this._executeOperation = this._executeOperation.bind(this);
    this.acceptButton.addEventListener("click", this._executeOperation);
    this.acceptButton.insertInto(this.windowBottom);

    // Cancel button
    this.cancelButton = new StyledElements.StyledButton({
        text: gettext('Cancel')
    });

    Element.extend(this.cancelButton);
    this.cancelButton.addEventListener("click", this._closeListener);
    this.cancelButton.insertInto(this.windowBottom);
}
PreferencesWindowMenu.prototype = new WindowMenu();

PreferencesWindowMenu.prototype.setCancelable = function(cancelable) {
    this.cancelButton.setDisabled(!cancelable);
};

PreferencesWindowMenu.prototype._executeOperation = function() {
    // Validate input fields
    var validationManager = new ValidationErrorManager();
    var preferences = this.manager._preferencesDef._preferences;
    for (var prefId in preferences) {
        validationManager.validate(preferences[prefId].inputInterface);
    }

    // Build Error Message
    var errorMsg = validationManager.toHTML();

    // Show error message if needed
    if (errorMsg != "") {
        this.setMsg(errorMsg);
    } else {
        this.manager.save();
        this.hide();
    }
}

PreferencesWindowMenu.prototype.show = function (parentWindow) {
    this.setTitle(this.manager.buildTitle());

    // TODO
    var table = this.manager.getPreferencesDef().getInterface();
    this.windowContent.insertBefore(table, this.msgElement);

    this.manager.resetInterface();
    WindowMenu.prototype.show.call(this, parentWindow);
}
