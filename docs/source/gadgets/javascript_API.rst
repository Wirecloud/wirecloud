Widget Javascript API
=====================


MashupPlatform.io
-----------------

buildProxyURL
.............

Builds a URL suitable for working around the cross-domain problem. This usually
is handled using the wirecloud proxy but it also can be handled using the access
control request headers if the browser has support for them. If all the needed
requirements are meet, this function will return a URL without using the proxy.

.. method:: MashupPlatform.io.buildProxyURL(url, options)

* ``url`` is the target URL.
* ``options`` is an object with request options (see the `request options`_
  section for more details).

makeRequest
...........

Sends a HTTP request.

.. method:: MashupPlatform.io.makeRequest(url, options)

* ``url`` is the URL to which to send the request.
* ``options`` is an object with request options (see the `request options`_
  section for more details).

request options
...............

Some of the functions provided by the Javascript API are based on prototype's
Ajax features, thus, some of these functions supports the same options as
prototype. For a full list of these options see the *Ajax option* section on
`prototype documentation`_.

In addition to the options defined by prototype, Wirecloud allows the usage of
the following options:

* **forceProxy** (Boolean; default *false*): Sends the request through the proxy
  regardless of the other options passed.
* **context** (Object; default *null*) is the value to be passed as the *this*
  parameter to the callbacks.

.. _prototype documentation: http://api.prototypejs.org/ajax/

MashupPlatform.Widget
---------------------

getVariable
...........

Returns a gadget variable by its name.

.. method:: MashupPlatform.Widget.getVariable(name)

* ``name`` is the name of the variable to retreive.

drawAttention
.............

Makes wirecloud notify that the widget needs user's attention.

.. method:: MashupPlatform.Widget.drawAttention()

getId
.....

Returns the widget id.

.. method:: MashupPlatform.Widget.getId()

log
...

Writes a message into the wirecloud's log console.

.. method:: MashupPlatform.Widget.log(msg, level)

* ``msg`` is the text of the message to log.
* ``level`` is an optional parameter with the level to uses for logging the
  message. (default: info).

MashupPlatform.Widget.window
----------------------------

adjustHeight
............

adjustWidth
...........

getViewportDimensions
.....................

setTitle
........

