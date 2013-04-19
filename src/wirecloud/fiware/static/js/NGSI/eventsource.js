/*
 *     (C) Copyright 2011-2013 CoNWeT Lab - Universidad Politécnica de Madrid
 *
 *     This file is part of ngsijs.
 *
 *     Ngsijs is free software: you can redistribute it and/or modify it under
 *     the terms of the GNU Affero General Public License as published by the
 *     Free Software Foundation, either version 3 of the License, or (at your
 *     option) any later version.
 *
 *     Ngsijs is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with ngsijs. If not, see <http://www.gnu.org/licenses/>.
 *
 *     Linking this library statically or dynamically with other modules is
 *     making a combined work based on this library.  Thus, the terms and
 *     conditions of the GNU Affero General Public License cover the whole
 *     combination.
 *
 *     As a special exception, the copyright holders of this library give you
 *     permission to link this library with independent modules to produce an
 *     executable, regardless of the license terms of these independent
 *     modules, and to copy and distribute the resulting executable under
 *     terms of your choice, provided that you also meet, for each linked
 *     independent module, the terms and conditions of the license of that
 *     module.  An independent module is a module which is not derived from
 *     or based on this library.  If you modify this library, you may extend
 *     this exception to your version of the library, but you are not
 *     obligated to do so.  If you do not wish to do so, delete this
 *     exception statement from your version.
 *
 */

(function() {

    var parseUri = function(str) {
        var o   = {
            key: ['source','protocol','authority','userInfo','user','password','host','port','relative','path','directory','file','query','anchor'],
            q:   {
                name:   'queryKey',
                parser: /(?:^|&)([^&=]*)=?([^&]*)/g
            },
            parser: {
                strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/
            }
        },
        m   = o.parser.strict.exec(str),
        uri = {},
        i   = 14;

        while (i--) uri[o.key[i]] = m[i] || '';

        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) uri[o.q.name][$1] = $2;
        });

        return uri;
    };

    var CONNECTING = 0,
    OPEN = 1,
    CLOSED = 2;

    window.EventSource = function EventSource(resource) {

        var that    = (this === window) ? {} : this,
        retry       = 1000, offset  = 0,
        boundary    = "\n", lastEventId = null,
        xhr         = null, resourceLocation  = null,
        rest = '', reconnectTimeout = null,
        data = '', name = 'message',
        eventManager = document.createElement('div');

        that.readyState = CONNECTING;

        that.toString   = function () {
            return '[object EventSource]'
        };

        // EventSource listener
        that.addEventListener = function (type, listener, useCapture) {
            eventManager.addEventListener(type, listener, useCapture);
        };

        that.removeEventListener = function (type, listener, useCapture) {
            eventManager.removeEventListener(type, listener, useCapture);
        };

        // EventSource dispatcher
        that.dispatchEvent      = function (event) {
            eventManager.dispatchEvent(event);
        };

        that.close = function() {
            that.readyState = CLOSED;

            if (reconnectTimeout !== null) {
                clearTimeout(reconnectTimeout);
            }

            if (xhr !== null) {

                xhr.abort();
            }
        }

        resourceLocation  = parseUri(resource);
        that.URL  = resourceLocation.source;

        var openConnectionXHR = function() {

            xhr = new XMLHttpRequest();
            xhr.open('GET', that.URL, true);

            //  FIRE OPEN EVENT
            var openEvent = document.createEvent('HTMLEvents');
            openEvent.initEvent('open', true, true);
            openEvent.origin      = document.domain;
            openEvent.source      = null;
            that.dispatchEvent(openEvent);

            if (lastEventId) {
                xhr.setRequestHeader('Last-Event-ID', lastEventId);
            }
            xhr.onreadystatechange = function() {
                switch (xhr.readyState) {
                    case 4: // disconnect case
                        if (that.readyState !== CLOSED) {
                            that.readyState = CONNECTING;
                            reOpenConnectionXHR();
                        }
                        break;
                    case 3: // new data
                        that.readyState = OPEN;
                        processMessageFromXHR();
                        break;
                }
            }

            xhr.send(null);
        };

        var reOpenConnectionXHR = function() {
            xhr       = null;
            offset    = 0;
            data = '';
            name = 'message';
            reconnectTimeout = setTimeout(openConnectionXHR, retry);
        };

        var processMessageFromXHR = function() {
            var queue = (rest + xhr.responseText.substr(offset)).split(boundary);
            offset = xhr.responseText.length;
            rest = queue.pop();

            pseudoDispatchEvent(queue);
        };

        var pseudoDispatchEvent = function(queue) {
            var i, line, dataIndex, field, value;

            for (i = 0; i < queue.length; i += 1) {
                line = queue[i];

                if (line === "") {
                    if (data.length > 0) {
                        var fireEvent = document.createEvent('HTMLEvents');
                        fireEvent.initEvent(name, true, true);
                        fireEvent.lastEventId = lastEventId;
                        fireEvent.data        = data.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '');
                        fireEvent.origin      = document.domain;
                        fireEvent.source      = null;
                        that.dispatchEvent(fireEvent);
                        data = '';
                        name = 'message';
                    }
                    continue;
                }

                dataIndex = line.indexOf(':');
                field = null;
                value = '';

                if (dataIndex === -1) {
                    field = line;
                    value = '';
                } else if (dataIndex === 0) {
                    //  Ignore Comment lines
                    continue;
                } else {
                    field = line.slice(0, dataIndex);
                    value = line.slice(dataIndex + 1);
                }

                switch(field) {
                    case 'event':
                        name = value.trim();
                        break;
                    case 'id':
                        lastEventId = value;
                        break;
                    case 'retry':
                        value = parseInt(value);
                        if (!isNaN(value)) {
                            retry = value;
                        }
                        break;
                    case 'data':
                        if (data.length > 0) {
                            data += "\n";
                        }

                        data += value;
                }
            }
        };

        //  INIT EVENT SOURCE CONNECTION
        openConnectionXHR();
    };
})();
