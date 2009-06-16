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

var LogManagerFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function LogManager () {
		
		/**** PRIVATE VARIABLES ****/
		this.logConsole = $('logs_console');
		this.logContainer = $('logs_container');
		this.messageContainer = $('message_section');
		this.messageBox = $('message_box');
		this.errorCount = 0;


		/**** PUBLIC METHODS****/
		LogManager.prototype.log = function(msg, level) {
//			if (this.errorCount++ == 0) {
//				$("logs_tab").className="tab";
//			}

			labelContent = ngettext("%(errorCount)s error", "%(errorCount)s errors", ++this.errorCount);
			labelContent = interpolate(labelContent, {errorCount: this.errorCount}, true);
			LayoutManagerFactory.getInstance().notifyError(labelContent);

			var logentry = document.createElement("p");

			switch (level) {
			default:
			case Constants.Logging.ERROR_MSG:
				icon = document.createElement("img");
				if (_currentTheme.iconExists('error'))
					icon.setAttribute("src", _currentTheme.getIconURL('error'));
				icon.setAttribute("class", "icon");
				icon.setAttribute("alt", "[Error] ");
				this.logConsole.appendChild(icon);
				try {
					console.error(msg);
				} catch (e) {}
				break;
			case Constants.Logging.WARN_MSG:
				icon = document.createElement("img");
				if (_currentTheme.iconExists('warning'))
					icon.setAttribute("src", _currentTheme.getIconURL('warning'));
				icon.setAttribute("class", "icon"); 
				icon.setAttribute("alt", "[Warning] ");
				this.logConsole.appendChild(icon);
				try {
					if (console) console.warn(msg);
				} catch (e) {}
				break;
			case Constants.Logging.INFO_MSG:
				icon = document.createElement("img");
				if (_currentTheme.iconExists('info'))
					icon.setAttribute("src", _currentTheme.getIconURL('info'));
				icon.setAttribute("class", "icon");
				icon.setAttribute("alt", "[Info] ");
				this.logConsole.appendChild(icon);
				try {
					if (console) console.info(msg);
				} catch (e) {}
				break;
			}

			var index;
			while ((index = msg.indexOf("\n")) != -1) {
				logentry.appendChild(document.createTextNode(msg.substring(0, index)));
				logentry.appendChild(document.createElement("br"));
				msg = msg.substring(index + 1);
			}
			logentry.appendChild(document.createTextNode(msg));
			this.logConsole.appendChild(logentry);

			var clearer = document.createElement('div');
			clearer.setAttribute('class', 'floatclearer');
			this.logConsole.appendChild(clearer);

		}

		LogManager.prototype.show = function() {
			LayoutManagerFactory.getInstance().showLogs();
		}

		LogManager.prototype.hide = function() {
			LayoutManagerFactory.getInstance().hideView(this.logContainer);
		}

		LogManager.prototype.reset = function() {
			this.logConsole.innerHTML = '';
			this.errorCount = 0;
		}

		LogManager.prototype.showMessage = function(msg) {
			this.messageBox.update(msg);
			this.messageContainer.setStyle({"display": "block"});
			setTimeout(function(){LogManagerFactory.getInstance().removeMessage()}, 3000);
		}
		
		LogManager.prototype.removeMessage = function(){
			this.messageContainer.setStyle({"display": "none"});
			this.messageBox.update("");
		}
	}
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new LogManager();
         	}
         	return instance;
       	}
	}
}();
