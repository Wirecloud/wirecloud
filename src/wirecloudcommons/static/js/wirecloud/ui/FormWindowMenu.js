/**
 * Form dialog.
 */
var FormWindowMenu = function FormWindowMenu (fields, title, extra_class) {

    // Allow hierarchy
    if (arguments.length === 0) {
        return;
    }

    WindowMenu.call(this, title, extra_class);
    // TODO
    this.iconElement = null;
    this.msgElement = null;

    this.form = new Form(fields, {
        factory: Wirecloud.form.WirecloudInterfaceFactory,
        buttonArea: this.windowBottom
    });
    this.form.insertInto(this.windowContent);
    this.form.addEventListener('submit', function (form, data) {
        try {
            this.executeOperation(data);
        } catch (e) {};
        this.hide();
    }.bind(this));
    this.form.addEventListener('cancel', this._closeListener);
};
FormWindowMenu.prototype = new WindowMenu();

FormWindowMenu.prototype.setValue = function setValue (newValue) {
    this.form.setData(newValue);
};

FormWindowMenu.prototype.show = function (parentWindow) {
    this.form.reset();
    WindowMenu.prototype.show.call(this, parentWindow);
};
