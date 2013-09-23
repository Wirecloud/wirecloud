/* 
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */


/**
 *
 */
var LogManagerFactory = function () {

    /**
     * @constructor
     */
    function GlobalLogManager() {
        Wirecloud.LogManager.call(this);

        this.logConsole = $('logs_console');
        this.logContainer = $('logs_container');
        this.messageContainer = $('message_section');
        this.messageBox = $('message_box');
        this.header = $('logs_header');

        /*
        $('logs_all_toolbar').observe('click', function() {
            this.show();
        }.bind(this));
        $('logs_dragboard_link').observe('click', function() {
            OpManagerFactory.getInstance().showActiveWorkspace(false);
        });
        $('logs_clear_button').observe('click', function() {
            var i;
            this.reset();
            this.show();
        }.bind(this));
        */

        this.title = $$('#logs_header .title')[0];
        this.sectionIdentifier = $$('#logs_header .section_identifier')[0];
    }

    GlobalLogManager.prototype = new Wirecloud.LogManager();

    GlobalLogManager.prototype.show = function(logManager) {
        var content, title, subtitle;

        logManager = logManager != null ? logManager : this;

        if (logManager === this) {
            $('logs_iwidget_toolbar').removeClassName('selected_section');
            $('logs_all_toolbar').addClassName('selected_section');
        } else {
            $('logs_all_toolbar').removeClassName('selected_section');
            $('logs_iwidget_toolbar').addClassName('selected_section');
        }
        this.logConsole.innerHTML = '';

        this.title.textContent = logManager.buildTitle();
        this.sectionIdentifier.textContent = logManager.buildSubTitle();

        this.logConsole.appendChild(logManager.wrapperElement);
        LayoutManagerFactory.getInstance().showLogs();
    }

    GlobalLogManager.prototype.hide = function() {
        LayoutManagerFactory.getInstance().hideView(this.logContainer);
    }

    GlobalLogManager.prototype.showMessage = function(msg) {
        this.messageBox.update(msg);
        this.messageContainer.setStyle({"display": "block"});
        setTimeout(function(){LogManagerFactory.getInstance().removeMessage()}, 3000);
    }

    GlobalLogManager.prototype.removeMessage = function() {
        this.messageContainer.setStyle({"display": "none"});
        this.messageBox.update("");
    }

    GlobalLogManager.prototype._addEntry = function(entry) {
        Wirecloud.LogManager.prototype._addEntry.call(this, entry);
        if (entry.level === Constants.Logging.ERROR_MSG) {
            // TODO
            labelContent = ngettext("%(errorCount)s error", "%(errorCount)s errors", this.errorCount);
            labelContent = interpolate(labelContent, {errorCount: this.errorCount}, true);
            LayoutManagerFactory.getInstance().notifyError(labelContent);
        }

    }

    GlobalLogManager.prototype.getHeader = function() {
        return this.header;
    }

    GlobalLogManager.prototype.buildTitle = function() {
        return gettext('Wirecloud Platform Logs');
    }

    GlobalLogManager.prototype.buildSubTitle = function() {
        return '';
    }

    GlobalLogManager = new GlobalLogManager();


    // *********************************
    // SINGLETON GET INSTANCE
    // *********************************
    return new function() {
        this.getInstance = function() {
            return GlobalLogManager;
        }
    }
}();
