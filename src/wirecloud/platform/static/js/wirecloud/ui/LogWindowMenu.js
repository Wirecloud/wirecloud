/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var LEVEL_CLASS = ['alert-error', 'alert-warning', 'alert-info'];

    var onfade = function onfade() {
        this.fadeTimeout = null;

        for (var i = 0; i < this.windowContent.childNodes.length; i++) {
            var classList = this.windowContent.childNodes[i].classList;
            if (classList.contains('in')) {
                break;
            }
            classList.add('in');
        }
    };

    var print_entry = function print_entry(entry) {
        var entry_element, dateElement, expander;

        entry_element = document.createElement('div');
        entry_element.className = 'fade alert ' + LEVEL_CLASS[entry.level - 1];

        dateElement = document.createElement('strong');
        dateElement.textContent = entry.date.strftime('%x %X');//_('short_date')));
        entry_element.appendChild(dateElement);

        entry_element.appendChild(document.createTextNode(entry.msg));

        if (entry.details != null) {
            expander = new StyledElements.Expander({title: gettext('Details')});
            expander.insertInto(entry_element);
            if (typeof entry.details === 'string') {
                expander.appendChild(new StyledElements.Fragment(entry.details));
            } else {
                expander.appendChild(entry.details);
            }
        }

        this.windowContent.insertBefore(entry_element, this.windowContent.firstChild);

        if (this.fadeTimeout != null) {
            clearTimeout(this.fadeTimeout);
        }
        this.fadeTimeout = setTimeout(this._onfade, 200);
    };

    var onnewentry = function _onnewentry(logManager, entry) {
        print_entry.call(this, entry);
    };

    /**
     * Specific class representing alert dialogs.
     */
    var LogWindowMenu = function LogWindowMenu(logManager) {

        Wirecloud.ui.WindowMenu.call(this, logManager.buildTitle(), 'logwindowmenu');

        Object.defineProperty(this, 'logManager', {value: logManager});
        this._onfade = onfade.bind(this);
        this._onnewentry = onnewentry.bind(this);

        // Accept button
        this.button = new StyledElements.StyledButton({
            text: gettext('Close'),
            'class': 'btn-primary'
        });
        this.button.insertInto(this.windowBottom);
        this.button.addEventListener("click", this._closeListener);
    };
    LogWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    LogWindowMenu.prototype.show = function show(parentWindow) {
        var i;

        for (i = 0; i < this.logManager.entries.length; i++) {
            print_entry.call(this, this.logManager.entries[i]);
        }
        this.logManager.addEventListener('newentry', this._onnewentry);

        Wirecloud.ui.WindowMenu.prototype.show.call(this, parentWindow);
    };

    LogWindowMenu.prototype.hide = function hide(parentWindow) {
        this.windowContent.innerHTML = '';

        this.logManager.removeEventListener('newentry', this._onnewentry);
        Wirecloud.ui.WindowMenu.prototype.hide.call(this, parentWindow);
    };

    LogWindowMenu.prototype.setFocus = function setFocus() {
        this.button.focus();
    };

    Wirecloud.ui.LogWindowMenu = LogWindowMenu;

})();
