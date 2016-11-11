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

/* globals console, StyledElements, Wirecloud */


(function (se, utils) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    var LogManager = function LogManager(parent) {
        var entries = [];
        var self = {
            children: [],
            closed: false,
            entries: entries,
            history: [entries],
            parent: null
        };

        se.ObjectWithEvents.call(this, ["newentry"]);

        _private.set(this, self);

        Object.defineProperties(this, {
            children: {
                get: function () {
                    return self.children.slice(0);
                }
            },
            closed: {
                get: function () {
                    return self.closed;
                }
            },
            entries: {
                get: function () {
                    return self.entries.slice(0);
                }
            },
            errorCount: {
                get: function () {
                    return self.entries.filter(isError).length;
                }
            },
            history: {
                get: function () {
                    return self.history.map(function (entries) {
                        return entries.slice(0);
                    });
                }
            },
            parent: {
                get: function () {
                    return self.parent;
                }
            },
            totalCount: {
                get: function () {
                    return self.entries.length;
                }
            }
        });

        setParent.call(this, parent);
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(LogManager, se.ObjectWithEvents, {

        close: function close() {
            var i, self = _private.get(this);

            if (!self.closed) {
                if (self.parent) {
                    removeChild.call(self.parent, this);
                }

                for (i = self.children.length - 1; i >= 0; i--) {
                    removeChild.call(this, self.children[i]);
                }
                self.closed = true;
            }

            return this;
        },

        formatAndLog: function formatAndLog(format, transport, e, level) {
            var msg = this.formatError(format, transport, e);
            this.log(msg, level);

            return msg;
        },

        formatError: function formatError(format, transport, e) {
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
                    var text = utils.gettext("unknown");
                    context = {errorFile: text, errorLine: text, errorDesc: e.message};
                }

                msg = utils.interpolate(utils.gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
                          context,
                          true);
            } else {
                msg = this.parseErrorResponse(transport);
            }
            msg = utils.interpolate(format, {errorMsg: msg}, true);

            return msg;
        },

        formatException: function formatException(exception) {
            var builder = new StyledElements.GUIBuilder();

            return builder.parse(Wirecloud.currentTheme.templates['wirecloud/logs/details'], {
                message: exception.toString(),
                stacktrace: exception.stack
            });
        },

        log: function log(message, options) {
            var entry;

            if (!this.closed) {
                if (typeof options === "number") {
                    options = {
                        level: options
                    };
                }

                options = utils.merge({
                    console: true,
                    level: Wirecloud.constants.LOGGING.ERROR_MSG
                }, options);

                entry = Object.freeze({
                    date: new Date(),
                    details: options.details,
                    level: options.level,
                    logManager: this,
                    msg: message
                });
                appendEntry.call(this, entry);

                if (window.console && options.console) {
                    printEntry.call(this, entry);
                }
            }

            return this;
        },

        newCycle: function newCycle() {
            var self = _private.get(this);

            if (!self.closed) {
                self.entries = [];
                self.history.unshift(self.entries);
            }

            return this;
        },

        parseErrorResponse: function parseErrorResponse(response) {
            var errorDesc, msg;

            try {
                var errorInfo = JSON.parse(response.responseText);
                msg = errorInfo.description;
            } catch (error) {
                msg = utils.gettext("HTTP Error %(errorCode)s - %(errorDesc)s");
                if (response.status !== 0 && response.statusText !== '') {
                    errorDesc = response.statusText;
                } else {
                    errorDesc = Wirecloud.constants.HTTP_STATUS_DESCRIPTIONS[response.status];
                    if (errorDesc == null) {
                        errorDesc = Wirecloud.constants.UNKNOWN_STATUS_CODE_DESCRIPTION;
                    }
                }
                msg = utils.interpolate(msg, {errorCode: response.status, errorDesc: errorDesc}, true);
            }

            return msg;
        },

        reset: function reset() {
            var self = _private.get(this);

            if (!self.closed) {
                self.entries.length = 0;
                self.children.forEach(function (child) {
                    child.reset();
                });
            }

            return this;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var _private = new WeakMap();

    var appendChild = function appendChild(child) {
        /*jshint validthis:true */
        var self = _private.get(this);

        self.children.push(child);
    };

    var appendEntry = function appendEntry(entry) {
        /*jshint validthis:true */
        var self = _private.get(this);

        self.entries.unshift(entry);
        this.dispatchEvent('newentry', entry);

        if (self.parent) {
            appendEntry.call(self.parent, entry);
        }
    };

    var isError = function isError(entry) {
        return entry.level === Wirecloud.constants.LOGGING.ERROR_MSG;
    };

    var printEntry = function printEntry(entry) {

        switch (entry.level) {
        default:
        case Wirecloud.constants.LOGGING.ERROR_MSG:
            if (typeof console.error === 'function') {
                console.error(entry.msg);
            }
            break;
        case Wirecloud.constants.LOGGING.WARN_MSG:
            if (typeof console.warn === 'function') {
                console.warn(entry.msg);
            }
            break;
        case Wirecloud.constants.LOGGING.DEBUG_MSG:
        case Wirecloud.constants.LOGGING.INFO_MSG:
            if (typeof console.info === 'function') {
                console.info(entry.msg);
            }
            break;
        }
    };

    var removeChild = function removeChild(child) {
        /*jshint validthis:true */
        var self = _private.get(this);

        removeParent.call(child);
        self.children.splice(self.children.indexOf(child), 1);
    };

    var removeParent = function removeParent() {
        /*jshint validthis:true */
        var self = _private.get(this);

        self.parent = null;
    };

    var setParent = function setParent(parent) {
        /*jshint validthis:true */
        var self = _private.get(this);

        if (parent instanceof LogManager) {
            if (parent.closed) {
                throw new Error();
            }
            self.parent = parent;
            appendChild.call(self.parent, this);
        }
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    Wirecloud.LogManager = LogManager;
    Wirecloud.GlobalLogManager = new LogManager();

})(StyledElements, StyledElements.Utils);
