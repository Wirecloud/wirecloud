(function () {

    "use strict";

    var HTMLWindowMenu = function HTMLWindowMenu(url, title, extra_class, options) {

        // Allow hierarchy
        if (arguments.length === 0) {
            return;
        }

        this.url = url;

        if (extra_class != null) {
            extra_class = 'wc-html-window-menu ' + extra_class;
        } else {
            extra_class = 'wc-html-window-menu';
        }

        Wirecloud.ui.WindowMenu.call(this, title, extra_class);

        // Close button
        this.button = new StyledElements.StyledButton({
            text: gettext('Close'),
            'class': 'btn-primary'
        });
        this.button.insertInto(this.windowBottom);
        this.button.addEventListener("click", this._closeListener);
    };
    HTMLWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    HTMLWindowMenu.prototype.show = function show() {
        this.windowContent.innerHTML = '';
        this.windowContent.classList.add('disabled');
        Wirecloud.ui.WindowMenu.prototype.show.apply(this, arguments);
        Wirecloud.io.makeRequest(this.url, {
            method: 'GET',
            onSuccess: function (response) {
                this.windowContent.innerHTML = response.responseText;
                this.calculatePosition();
            }.bind(this),
            onFailure: function (response) {
                this.windowContent.innerHTML = '<div class="alert alert-danger">Error processing resource documentation</div>';
            },
            onComplete: function () {
                this.windowContent.classList.remove('disabled');
            }.bind(this)
        });
    };

    Wirecloud.ui.HTMLWindowMenu = HTMLWindowMenu;

})();
