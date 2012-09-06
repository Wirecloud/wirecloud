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


function LogManager (parentLogger) {
    this.wrapperElement = document.createElement('div');
    this.parentLogger = parentLogger;
    this.errorCount = 0;
    this.totalCount = 0;
    this.entries = [];
    this.childManagers = [];
    this.closed = false;
}

LogManager.prototype._printEntry = function(entry) {
    var dateElement, icon, wrapper, clearer, icon;

    wrapper = document.createElement("div");
    wrapper.className = "entry";
    icon = document.createElement("div");
    wrapper.appendChild(icon);

    switch (entry.level) {
    case Constants.Logging.ERROR_MSG:
        icon.className += " icon icon-error";
        break;
    case Constants.Logging.WARN_MSG:
        icon.className += " icon icon-warning";
        break;
    case Constants.Logging.INFO_MSG:
        icon.className += " icon icon-info";
        break;
    }

    if (entry.logManager !== this) {
        wrapper.appendChild(entry.logManager.buildExtraInfo());
    }

    dateElement = document.createElement('b');
    Element.extend(dateElement);
    dateElement.setTextContent(entry.date.strftime('%x %X'));//_('short_date')));
    wrapper.appendChild(dateElement);

    logentry = document.createElement("p");
    logentry.innerHTML = entry.msg;
    wrapper.appendChild(logentry);

    clearer = document.createElement('div');
    Element.extend(clearer);
    clearer.addClassName('floatclearer');
    wrapper.appendChild(clearer);

    this.wrapperElement.insertBefore(wrapper, this.wrapperElement.firstChild);
}

LogManager.prototype._addEntry = function (entry) {

    this.entries.push(entry);
    this._printEntry(entry);
    if (entry.level === Constants.Logging.ERROR_MSG) {
        this.errorCount += 1;
    }
    this.totalCount += 1;

    if (this.parentLogger) {
        this.parentLogger._addEntry(entry);
    }
};

LogManager.prototype.newCycle = function () {
    this.wrapperElement.insertBefore(document.createElement('hr'), this.wrapperElement.firstChild);
    this.resetCounters();
}

LogManager.prototype.log = function (msg, level) {
    var date, labelContent, index;

    date = new Date();
    switch (level) {
    default:
        level = Constants.Logging.ERROR_MSG;
    case Constants.Logging.ERROR_MSG:
        try {
            if (console) console.error(msg);
        } catch (e) {}
        break;
    case Constants.Logging.WARN_MSG:
        try {
            if (console) console.warn(msg);
        } catch (e) {}
        break;
    case Constants.Logging.INFO_MSG:
        try {
            if (console) console.info(msg);
        } catch (e) {}
        break;
    }

    logentry = document.createElement("p");
    while ((index = msg.indexOf("\n")) != -1) {
        logentry.appendChild(document.createTextNode(msg.substring(0, index)));
        logentry.appendChild(document.createElement("br"));
        msg = msg.substring(index + 1);
    }
    logentry.appendChild(document.createTextNode(msg));

    entry = {
        "level": level,
        "msg": logentry.innerHTML,
        "date": date,
        "logManager": this
    }
    this._addEntry(entry);
}

LogManager.prototype.formatError = function(format, transport, e) {
    var msg, errorDesc;

    if (e) {
        var context;
        if (e.lineNumber !== undefined) {
            // Firefox
            context = {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e.message};
        } else if (e.line !== undefined) {
            // Webkit
            context = {errorFile: e.sourceURL, errorLine: e.line, errorDesc: e.message};
        } else {
            // Other browsers
            var text = gettext("unknown");
            context = {errorFile: text, errorLine: text, errorDesc: e.message};
        }

        msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
                  context,
                  true);
    } else if (transport.responseXML && transport.documentElement != null) {
        msg = transport.responseXML.documentElement.textContent;
    } else {
        try {
            var errorInfo = JSON.parse(transport.responseText);
            msg = errorInfo.message;
        } catch (e) {
            msg = gettext("HTTP Error %(errorCode)s - %(errorDesc)s");
            if (transport.status != 0 && transport.statusText !== '') {
                errorDesc = gettext(transport.statusText);
            } else {
                errorDesc = Constants.HttpStatusDescription[transport.status];
                if (transport.status === 0) {
                    msg = errorDesc;
                } else if (!errorDesc) {
                    errorDesc = Constants.UnknownStatusCodeDescription;
                }
            }
            msg = interpolate(msg, {errorCode: transport.status, errorDesc: errorDesc}, true);
        }
    }
    msg = interpolate(format, {errorMsg: msg}, true);

    return msg;
}

LogManager.prototype.reset = function() {
    var i;

    this.wrapperElement.innerHTML = '';
    this.resetCounters();
    this.entries = [];
    for (i = this.childManagers.length - 1; i >= 0; i -= 1) {
        if (this.childManagers[i].isClosed()) {
            this.childManagers.splice(i, 1);
        } else {
            this.childManagers[i].reset();
        }
    }
}

LogManager.prototype.repaint = function () {
    var i;

    this.wrapperElement.innerHTML = "";

    for (i = 0; i < this.entries.length; i += 1) {
        this._printEntry(this.entries[i]);
    }
};

LogManager.prototype.resetCounters = function() {
    this.errorCount = 0;
    this.totalCount = 0;
}

LogManager.prototype.getErrorCount = function() {
    return this.errorCount;
}

LogManager.prototype.close = function() {
    this.closed = true;
}

LogManager.prototype.isClosed = function() {
    return this.closed;
}

/**
 *
 */
function IWidgetLogManager (iWidget) {
    var globalManager = LogManagerFactory.getInstance();
    LogManager.call(this, globalManager);

    globalManager.childManagers.push(this);
    this.iWidget = iWidget;
}

IWidgetLogManager.prototype = new LogManager();

IWidgetLogManager.prototype.buildExtraInfo = function () {
    var extraInfo = document.createElement('div'),
        extraInfoIcon = document.createElement('div'),
        extraInfoText = document.createElement('span');
    Element.extend(extraInfo);
    extraInfo.className += " iwidget_info_container";
    extraInfo.appendChild(extraInfoIcon);
    extraInfo.appendChild(extraInfoText);
    extraInfoIcon.className = "iwidget_info";
    extraInfoText.innerHTML = this.iWidget.id;
    extraInfoText.setAttribute('title', this.iWidget.name + "\n " + this.iWidget.widget.getInfoString());
    extraInfo.style.cursor = "pointer";
    extraInfo.observe('click', function() {
        OpManagerFactory.getInstance().showLogs(this);
    }.bind(this));

    return extraInfo;
}

IWidgetLogManager.prototype.buildTitle = function() {
    var title;

    if (this.iWidget) {
        title = gettext('iWidget #%(iWidgetId)s Logs');
        title = interpolate(title, {iWidgetId: this.iWidget.id}, true);
        return title;
    } else {
        return this.title;
    }
}

IWidgetLogManager.prototype.buildSubTitle = function() {
    var subtitle;

    if (this.iWidget) {
        return this.iWidget.name;
    } else {
        return this.subtitle;
    }
}

IWidgetLogManager.prototype.close = function() {
    this.title = this.buildTitle();
    this.subtitle = this.buildSubTitle();
    this.iWidget = null;
}

/**
 *
 */
var LogManagerFactory = function () {

    /**
     * @constructor
     */
    function GlobalLogManager() {
        LogManager.call(this);

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

    GlobalLogManager.prototype = new LogManager();

    GlobalLogManager.prototype.show = function(logManager) {
        var content, title, subtitle;

        logManager = logManager != null ? logManager : this;

        if (BrowserUtilsFactory.getInstance().isIE()) {
            // Hack for IE, it needs to repaint the entries
            logManager.repaint();
        }

        if (logManager === this) {
            $('logs_iwidget_toolbar').removeClassName('selected_section');
            $('logs_all_toolbar').addClassName('selected_section');
        } else {
            $('logs_all_toolbar').removeClassName('selected_section');
            $('logs_iwidget_toolbar').addClassName('selected_section');
        }
        this.logConsole.innerHTML = '';

        this.title.setTextContent(logManager.buildTitle());
        this.sectionIdentifier.setTextContent(logManager.buildSubTitle());

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
        LogManager.prototype._addEntry.call(this, entry);
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
