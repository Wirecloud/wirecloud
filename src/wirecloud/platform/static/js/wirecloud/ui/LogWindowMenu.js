/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals moment, StyledElements, Wirecloud */


(function (se, utils) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    var LogWindowMenu = function LogWindowMenu(logManager, options) {
        var self = {
            on_fade: on_fade.bind(this),
            on_newentry: on_newentry.bind(this)
        };

        options = utils.update({
            title: utils.gettext("Logs")
        }, options);

        ns.WindowMenu.call(this, options.title, 'logwindowmenu');

        _private.set(this, self);

        Object.defineProperties(this, {
            logManager: {
                value: logManager
            }
        });

        // Accept button
        this.button = new se.Button({
            text: utils.gettext("Close"),
            class: "btn-primary btn-accept"
        });
        this.button.insertInto(this.windowBottom);
        this.button.addEventListener("click", this._closeListener);
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(LogWindowMenu, Wirecloud.ui.WindowMenu, {

        hide: function hide(parentWindow) {
            var self = _private.get(this);

            this.windowContent.innerHTML = "";
            this.logManager.removeEventListener("newentry", self.on_newentry);

            ns.WindowMenu.prototype.hide.call(this, parentWindow);
            return this;
        },

        show: function show(parentWindow) {
            var self = _private.get(this);

            this.logManager.entries.forEach(appendEntry, this);
            this.logManager.addEventListener("newentry", self.on_newentry);

            ns.WindowMenu.prototype.show.call(this, parentWindow);
            return this;
        },

        setFocus: function setFocus() {
            this.button.focus();
            return this;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var _private = new WeakMap();

    var LEVEL_CLASS = ['alert-error', 'alert-warning', 'alert-info'];

    var appendEntry = function appendEntry(entry) {
        /*jshint validthis:true */
        var self = _private.get(this);
        var entry_element, dateElement, expander, titleElement;

        if (entry.level === Wirecloud.constants.LOGGING.DEBUG_MSG) {
            return;  // Ignore DEBUG messages
        }
        entry_element = document.createElement('div');
        entry_element.className = 'fade alert ' + LEVEL_CLASS[entry.level - 1];

        dateElement = document.createElement('strong');
        dateElement.className = "wc-log-date";
        dateElement.textContent = moment(entry.date).fromNow();
        entry_element.appendChild(dateElement);

        titleElement = document.createElement('span');
        titleElement.className = "wc-log-title";
        titleElement.appendChild(document.createTextNode(entry.msg));

        entry_element.appendChild(titleElement);

        if (entry.details != null) {
            expander = new se.Expander({title: utils.gettext('Details')});
            expander.insertInto(entry_element);
            if (typeof entry.details === 'string') {
                expander.appendChild(new se.Fragment(entry.details));
            } else {
                expander.appendChild(entry.details);
            }
        }

        this.windowContent.appendChild(entry_element);

        if (this.fadeTimeout != null) {
            clearTimeout(this.fadeTimeout);
        }
        this.fadeTimeout = setTimeout(self.on_fade, 200);
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var onfade = function onfade() {
        /*jshint validthis:true */
        this.fadeTimeout = null;

        for (var i = 0; i < this.windowContent.childNodes.length; i++) {
            var classList = this.windowContent.childNodes[i].classList;
            if (classList.contains('in')) {
                break;
            }
            classList.add('in');
        }
    };

    var on_newentry = function on_newentry(logManager, entry) {
        /*jshint validthis:true */
        appendEntry.call(this, entry);
    };

    ns.LogWindowMenu = LogWindowMenu;

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
