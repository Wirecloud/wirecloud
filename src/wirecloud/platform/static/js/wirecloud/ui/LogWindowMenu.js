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


(function (ns, se, utils) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    var LogWindowMenu = function LogWindowMenu(logManager, options) {
        var priv = {
            fadeTimeout: null,
            on_fade: on_fade.bind(this),
            on_newentry: on_newentry.bind(this)
        };

        options = utils.update({
            title: utils.gettext("Logs")
        }, options);

        ns.WindowMenu.call(this, options.title, 'logwindowmenu');

        privates.set(this, priv);

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
            var priv = privates.get(this);

            this.windowContent.innerHTML = "";
            this.logManager.removeEventListener("newentry", priv.on_newentry);

            ns.WindowMenu.prototype.hide.call(this, parentWindow);
            return this;
        },

        show: function show(parentWindow) {
            var priv = privates.get(this);

            this.logManager.entries.forEach(appendEntry, this);
            this.logManager.previouscycles.forEach(function (entries, i) {
                this.windowContent.appendChild(document.createElement("hr"));
                entries.forEach(appendEntry, this);
            }, this);
            this.logManager.addEventListener("newentry", priv.on_newentry);

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

    var privates = new WeakMap();

    var LEVEL_CLASS = ['alert-error', 'alert-warning', 'alert-info'];

    var buildEntry = function buildEntry(entry) {
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

        return entry_element;
    };

    var appendEntry = function appendEntry(entry) {
        var entry_element = buildEntry.call(this, entry);
        if (entry_element == null) {
            // Ignore this entry
            return;
        }

        this.windowContent.appendChild(entry_element);

        var priv = privates.get(this);

        if (priv.fadeTimeout != null) {
            clearTimeout(priv.fadeTimeout);
        }
        priv.fadeTimeout = setTimeout(priv.on_fade, 200);
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_fade = function on_fade() {
        privates.get(this).fadeTimeout = null;

        for (var i = 0; i < this.windowContent.childNodes.length; i++) {
            var classList = this.windowContent.childNodes[i].classList;
            if (classList.contains('in')) {
                break;
            }
            classList.add('in');
        }
    };

    var on_newentry = function on_newentry(logManager, entry) {
        var entry_element = buildEntry.call(this, entry);
        if (entry_element == null) {
            // Ignore this entry
            return;
        }

        // Add new entries at beginning to match the expected order
        this.windowContent.insertBefore(entry_element, this.windowContent.firstChild);

        var priv = privates.get(this);

        if (priv.fadeTimeout != null) {
            clearTimeout(priv.fadeTimeout);
        }
        priv.fadeTimeout = setTimeout(priv.on_fade, 200);
    };

    ns.LogWindowMenu = LogWindowMenu;

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
