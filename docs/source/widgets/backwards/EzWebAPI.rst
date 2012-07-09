.. _ezwebapi:

EzWebAPI
========

Wirecloud supports this API

request options
---------------

Some of the functions provided by EzWebAPI are based on Ajax features supported
by prototype, thus, some of these functions supports the same options as
prototype. For a full list of these options see the *Ajax option* section on
`prototype documentation`_.

.. _prototype documentation: http://api.prototypejs.org/ajax/

log levels
----------

The available log levels are:

* ``EzWebAPI.NO_LOG_MSG``
* ``EzWebAPI.ERROR_MSG``
* ``EzWebAPI.WARN_MSG``
* ``EzWebAPI.INFO_MSG``

main functions
--------------

buildProxyURL
.............

Builds a URL suitable for working around the cross-domain problem. This usually
is handled using the wirecloud proxy but it also can be handled using the access
control request headers if the browser has support for they.

.. method:: EzWebAPI.buildProxyURL(url, options)

* ``url`` is the target URL.
* ``options`` is a optional hash.

createRGadgetVariable
.....................

Creates a new read-only variable.

.. method:: EzWebAPI.createRGadgetVariable(name, handler)

* ``name`` is the name of a read-only variable declared in template file.
* ``handler`` is the callback function that will be called when a new event is
  raised for the given variable.

createRWGadgetVariable
......................

Creates a new read-write variable.

.. method:: EzWebAPI.createRWGadgetVariable(name)

* ``name`` is the name of a read-only variable declared in template file.

drawAttention
.............

Makes wirecloud notify that the widget needs user's attention.

.. method:: EzWebAPI.drawAttention()

getId
.....

Returns current gadget id.

.. method:: EzWebAPI.getId()

log
...

Writes a message into the wirecloud's log console.

.. method:: EzWebAPI.log(msg, level)

* ``msg`` is the message to log.
* ``level`` is an optional parameter with the level to use for logging the
  message (see `log levels`_ section for more details). (default: INFO_MSG).

send
....

Sends a HTTP request.

.. method:: EzWebAPI.send(url, context, options)

* ``url`` is the target URL.
* ``context`` is the value (must be an object or null) that will be bind to the
  *this* variable when one of the callbacks are called.
* ``options`` is an object with request options.

deprecated functions
--------------------

These functions are maintained for backward compatibility and should not be used
for new code.

send_delete
...........

Sends a DELETE request throught the Wirecloud proxy.

.. method:: EzWebAPI.send_get(url, context, successHandler, errorHandler)

* ``url`` is the target URL.
* ``context`` is the value (must be an object or null) that will be bind to the
  *this* variable when one of the callbacks are called.
* ``successHandler`` is a callback function that will be called when the request
  is successfully completed.
* ``errorHandler`` is a callback function that will be called if some error or
  exception (including while running the successHandler) is raised.

send_get
........

Sends a GET request throught the Wirecloud proxy.

.. method:: EzWebAPI.send_get(url, context, successHandler, errorHandler)

* ``url`` is the target URL.
* ``context`` is the value (must be an object or null) that will be bind to the
  *this* variable when one of the callbacks are called.
* ``successHandler`` is a callback function that will be called when the request
  is successfully completed.
* ``errorHandler`` is a callback function that will be called if some error or
  exception (including while running the successHandler) is raised.

send_post
.........

.. method:: EzWebAPI.send_post(url, context, successHandler, errorHandler)

* ``url`` is the target URL.
* ``context`` is the value (must be an object or null) that will be bind to the
  *this* variable when one of the callbacks are called.
* ``successHandler`` is a callback function that will be called when the request
  is successfully completed.
* ``errorHandler`` is a callback function that will be called if some error or
  exception (including while running the successHandler) is raised.

send_put
........

.. method:: EzWebAPI.send_post(url, context, successHandler, errorHandler)

* ``url`` is the target URL.
* ``context`` is the value (must be an object or null) that will be bind to the
  *this* variable when one of the callbacks are called.
* ``successHandler`` is a callback function that will be called when the request
  is successfully completed.
* ``errorHandler`` is a callback function that will be called if some error or
  exception (including while running the successHandler) is raised.
