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
