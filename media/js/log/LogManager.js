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
	var dateElement, icon, wrapper, clearer;

	wrapper = document.createElement("div");
	wrapper.className = "entry";

	icon = document.createElement("img");
	Element.extend(icon);
	icon.addClassName("icon");

	switch (entry.level) {
	case Constants.Logging.ERROR_MSG:
		if (_currentTheme.iconExists('error'))
			icon.setAttribute("src", _currentTheme.getIconURL('error'));
		icon.setAttribute("alt", "[Error] ");
		break;
	case Constants.Logging.WARN_MSG:
		if (_currentTheme.iconExists('warning'))
			icon.setAttribute("src", _currentTheme.getIconURL('warning'));
		icon.setAttribute("alt", "[Warning] ");
		break;
	case Constants.Logging.INFO_MSG:
		if (_currentTheme.iconExists('info'))
			icon.setAttribute("src", _currentTheme.getIconURL('info'));
		icon.setAttribute("alt", "[Info] ");
		break;
	}
	wrapper.appendChild(icon);

	if (entry.logManager !== this) {
		wrapper.appendChild(entry.logManager.buildExtraInfo());
	}

	dateElement = document.createElement('b');
	dateElement.setTextContent(entry.date.strftime('%x %X'));//_('short_date')));
	wrapper.appendChild(dateElement);

	logentry = document.createElement("p");
	logentry.innerHTML = entry.msg;
	wrapper.appendChild(logentry);

	clearer = document.createElement('div');
	Element.extend(clearer);
	clearer.addClassName('floatclearer');
	wrapper.appendChild(clearer);

	this.wrapperElement.appendChild(wrapper);
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
	var msg;

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
			msg = interpolate(msg, {errorCode: transport.status, errorDesc: transport.statusText}, true);
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
function IGadgetLogManager (iGadget) {
	var globalManager = LogManagerFactory.getInstance();
	LogManager.call(this, globalManager);

	globalManager.childManagers.push(this);
	this.iGadget = iGadget;
}
IGadgetLogManager.prototype = new LogManager();

IGadgetLogManager.prototype.buildExtraInfo = function() {
	var extraInfo = document.createElement('span');
	extraInfo.className = "igadget_info";
	extraInfo.setTextContent(this.iGadget.id);
	extraInfo.setAttribute('title', this.iGadget.name + "\n " + this.iGadget.gadget.getInfoString());

	extraInfo.style.cursor = "pointer";
	extraInfo.observe('click', function() {
		OpManagerFactory.getInstance().showLogs(this);
	}.bind(this));

	return extraInfo;
}

IGadgetLogManager.prototype.buildTitle = function() {
	var title;

	if (this.iGadget) {
	    title = gettext('iGadget #%(iGadgetId)s Logs');
	    title = interpolate(title, {iGadgetId: this.iGadget.id}, true);
	    return title;
	} else {
	    return this.title;
	}
}

IGadgetLogManager.prototype.buildSubTitle = function() {
	var subtitle;

	if (this.iGadget) {
	    return this.iGadget.name;
	} else {
	    return this.subtitle;
	}
}

IGadgetLogManager.prototype.close = function() {
	this.title = this.buildTitle();
	this.subtitle = this.buildSubTitle();
	this.iGadget = null;
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

		$('logs_all_toolbar').observe('click', function() {
			this.show();
		}.bind(this));
		$('logs_dragboard_link').observe('click', function() {
			OpManagerFactory.getInstance().showActiveWorkSpace(false);
		});
		$('logs_clear_button').observe('click', function() {
			var i;
                        this.reset();
                        this.show();
		}.bind(this));

		this.title = $$('#logs_header .title')[0];
		this.sectionIdentifier = $$('#logs_header .section_identifier')[0];
	}
	GlobalLogManager.prototype = new LogManager();

	GlobalLogManager.prototype.show = function(logManager) {
		var content, title, subtitle;

		logManager = logManager != null ? logManager : this;

		if (logManager === this) {
			$('logs_igadget_toolbar').removeClassName('selected_section');
			$('logs_all_toolbar').addClassName('selected_section');
		} else {
			$('logs_all_toolbar').removeClassName('selected_section');
			$('logs_igadget_toolbar').addClassName('selected_section');
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
		return gettext('EzWeb Platform Logs');
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
