/*
 *     Copyright (c) 2013-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

    /**
     * Creates a new instance of class LogManager.
     *
     * @constructor
     * @extends StyledElements.ObjectWithEvents
     * @name Wirecloud.LogManager
     * @since 0.5
     * @param {Wirecloud.LogManager} [parent] parent log manager
     */
    var LogManager = function LogManager(parent) {
        var entries = [];
        var priv = {
            closed: false,
            entries: entries,
            errorcount: 0,
            previouscycles: [],
            parent: null
        };

        se.ObjectWithEvents.call(this, ["newentry"]);

        privates.set(this, priv);

        Object.defineProperties(this, {
            closed: {
                get: function () {
                    return priv.closed;
                }
            },
            entries: {
                get: function () {
                    return priv.entries.slice(0);
                }
            },
            errorCount: {
                get: function () {
                    return priv.errorcount;
                }
            },
            previouscycles: {
                get: function () {
                    return priv.previouscycles;
                }
            },
            parent: {
                get: function () {
                    return priv.parent;
                }
            },
            totalCount: {
                get: function () {
                    return priv.entries.length;
                }
            }
        });

        setParent.call(this, parent);
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(LogManager, se.ObjectWithEvents, /** @lends Wirecloud.LogManager.prototype */  {

        /**
         * Marks this log manager as closed. Closed log managers are read only
         * log managers that are used by log entries created before the
         * associated resource were closed.
         *
         * @returns {Wirecloud.LogManager}
         */
        close: function close() {
            privates.get(this).closed = true;
            return this;
        },

        /**
         * Formats an exceptions to be used as the details of a log entry.
         *
         * @param {Error} exception exception to format
         * @returns {StyledElements.Fragment}
         */
        formatException: function formatException(exception) {
            var builder = new StyledElements.GUIBuilder();

            return builder.parse(Wirecloud.currentTheme.templates['wirecloud/logs/details'], {
                message: exception.toString(),
                stacktrace: exception.stack
            });
        },

        /**
         * Adds a log entry into this log manager.
         *
         * @param {String} message
         * @param {Object} [options]
         * @returns {Wirecloud.LogManager}
         */
        log: function log(message, options) {
            var entry;

            if (this.closed) {
                throw new Error("Trying to log a message in a closed LogManager");
            }

            // Backwards compatibility
            if (typeof options === "number") {
                options = {
                    level: options
                };
            }

            options = utils.merge({
                console: true,
                level: Wirecloud.constants.LOGGING.ERROR_MSG
            }, options);

            if (typeof options.level !== "number" || options.level < 0 || options.level > 4) {
                throw new TypeError("Invalid level value");
            }

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

            return this;
        },

        /**
         * Creates a new cycle moving the current entries into the
         * previouscycles list.
         *
         * @returns {Wirecloud.LogManager}
         */
        newCycle: function newCycle() {
            var priv = privates.get(this);

            if (priv.closed) {
                throw new Error("Trying to create a new cycle in a closed LogManager");
            }

            // Freeze current entry list
            Object.freeze(priv.entries);
            priv.previouscycles.unshift(priv.entries);

            // Create a new list of entries
            priv.entries = [];
            priv.errorcount = 0;

            return this;
        },

        /**
         * Parses the error descriptions included in error responses provided by
         * the WireCloud server. If the response doesn't provide a error
         * description because it comes from another service (e.g. a load
         * balancer server), this method will provide an error description using
         * the error code as reference.
         *
         * @param {Response} response server response to parse
         * @returns {String} error description
         */
        parseErrorResponse: function parseErrorResponse(response) {
            var errorDesc, msg;

            try {
                var errorInfo = JSON.parse(response.responseText);
                if (!("description" in errorInfo)) {
                    throw new Error();
                }
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

        /**
         * Removes all the log entries stored by this log manager, including all
         * those entries associated with previous cycles.
         *
         * @returns {Wirecloud.LogManager}
         */
        reset: function reset() {
            var priv = privates.get(this);

            if (priv.closed) {
                throw new Error("Closed LogManagers cannot be reset");
            }

            priv.entries.length = 0;
            priv.errorcount = 0;
            priv.previouscycles = [];

            return this;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var appendEntry = function appendEntry(entry) {
        var priv = privates.get(this);

        if (entry.level === Wirecloud.constants.LOGGING.ERROR_MSG) {
            priv.errorcount += 1;
        }
        priv.entries.unshift(entry);
        this.dispatchEvent('newentry', entry);

        if (priv.parent) {
            appendEntry.call(priv.parent, entry);
        }
    };

    var printEntry = function printEntry(entry) {

        switch (entry.level) {
        case Wirecloud.constants.LOGGING.ERROR_MSG:
            // eslint-disable-next-line no-console
            console.error(entry.msg);
            break;
        case Wirecloud.constants.LOGGING.WARN_MSG:
            // eslint-disable-next-line no-console
            console.warn(entry.msg);
            break;
        case Wirecloud.constants.LOGGING.DEBUG_MSG:
        case Wirecloud.constants.LOGGING.INFO_MSG:
            // eslint-disable-next-line no-console
            console.info(entry.msg);
            break;
        }
    };

    var setParent = function setParent(parent) {
        var priv = privates.get(this);

        if (parent instanceof LogManager) {
            if (parent.closed) {
                throw new Error();
            }
            priv.parent = parent;
        }
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    Wirecloud.LogManager = LogManager;
    Wirecloud.GlobalLogManager = new LogManager();

})(StyledElements, StyledElements.Utils);
