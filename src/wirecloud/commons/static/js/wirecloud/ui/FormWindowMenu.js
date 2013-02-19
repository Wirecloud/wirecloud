/*global EzWebExt, Form, Wirecloud */

(function () {

    "use strict";

    /**
     * Form dialog.
     */
    var FormWindowMenu = function FormWindowMenu(fields, title, extra_class, options) {

        // Allow hierarchy
        if (arguments.length === 0) {
            return;
        }

        if (typeof options !== 'object') {
            options = {};
        }

        Wirecloud.ui.WindowMenu.call(this, title, extra_class);
        // TODO
        this.iconElement = null;
        this.msgElement = null;

        this.form = new Form(fields, EzWebExt.merge(options, {
            factory: Wirecloud.form.WirecloudInterfaceFactory,
            buttonArea: this.windowBottom
        }));
        this.form.insertInto(this.windowContent);
        this.form.addEventListener('submit', function (form, data) {
            try {
                this.executeOperation(data);
            } catch (e) {}
            this.hide();
        }.bind(this));
        this.form.addEventListener('cancel', this._closeListener);
    };
    FormWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    FormWindowMenu.prototype.setValue = function setValue(newValue) {
        this.form.setData(newValue);
    };

    FormWindowMenu.prototype.show = function show(parentWindow) {
        this.form.reset();
        Wirecloud.ui.WindowMenu.prototype.show.call(this, parentWindow);
        this.form.repaint();
    };

    Wirecloud.ui.FormWindowMenu = FormWindowMenu;
})();
