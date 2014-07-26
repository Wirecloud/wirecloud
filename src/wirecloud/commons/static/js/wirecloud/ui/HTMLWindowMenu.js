(function () {

    "use strict";

    var HTMLWindowMenu = function HTMLWindowMenu(url, title, extra_class, options) {

        // Allow hierarchy
        if (arguments.length === 0) {
            return;
        }

        this.url = url;
        Wirecloud.ui.WindowMenu.call(this, title, extra_class);
    };
    HTMLWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    HTMLWindowMenu.prototype.show = function show() {
        this.windowContent.innerHTML = '';
        Wirecloud.ui.WindowMenu.prototype.show.apply(this, arguments);
        Wirecloud.io.makeRequest(this.url, {
            method: 'GET',
            onSuccess: function (response) {
                this.windowContent.innerHTML = response.responseText;
                this.calculatePosition();
            }.bind(this)
        });
    };

    Wirecloud.ui.HTMLWindowMenu = HTMLWindowMenu;

})();
