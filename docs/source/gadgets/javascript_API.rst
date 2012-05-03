Widget Javascript API
=====================


MashupPlatform.http
-------------------

buildProxyURL
.............

Builds a URL suitable for working around the cross-domain problem. This usually
is handled using the wirecloud proxy but it also can be handled using the access
control request headers if the browser has support for them. If all the needed
requirements are meet, this function will return a URL without using the proxy.

.. method:: MashupPlatform.http.buildProxyURL(url, options)

* ``url`` is the target URL.
* ``options`` is an object with request options (see the `request options`_
  section for more details).

makeRequest
...........

Sends a HTTP request.

.. method:: MashupPlatform.http.makeRequest(url, options)

* ``url`` is the URL to which to send the request.
* ``options`` is an object with request options (see the `request options`_
  section for more details).

request options
...............

General options:
* **asynchronous** (Boolean; default *true*): Determines whether XMLHttpRequest
  is used asynchronously or not. Synchronous usage is strongly discouraged — it
  halts all script execution for the duration of the request and blocks the
  browser UI.
* **contentType** (String; default *application/x-www-form-urlencoded*): The
  Content-type header for your request. Change this header if you want to send
  data in another format (like XML).
* **encoding** (String; default *UTF-8*): The encoding for the contents of your
  request. It is best left as-is, but should weird encoding issues arise, you
  may have to tweak this.
* **method** (String; default *POST*): The HTTP method to use for the request.
  The other common possibility is get. Abiding by Rails conventions, Prototype
  also reacts to other HTTP verbs (such as put and delete) by submitting via
  post and adding a extra _method parameter with the originally-requested
  method.
* **parameters** (Object): The parameters for the request, which will be encoded
  into the URL for a get method, or into the request body for the other methods.
* **postBody** (String): Specific contents for the request body on a post
  method. If it is not provided, the contents of the parameters option will be
  used instead.
* **requestHeaders** (Object): A set of key-value pairs, with properties
  representing header names.
* **forceProxy** (Boolean; default *false*): Sends the request through the proxy
  regardless of the other options passed.
* **context** (Object; default *null*) is the value to be passed as the *this*
  parameter to the callbacks.

Callback options:
* **onSuccess**: Invoked when a request completes and its status code belongs
  in the 2xy family. This is skipped if a code-specific callback is defined
  (e.g., on200), and happens before **onComplete**.
* **onFailure**: Invoked when a request completes and its status code exists but
  is not in the 2xy family. This is skipped if a code-specific callback is defined
  (e.g. on403), and happens before **onComplete**.
* **onXYZ** (with XYZ representing any HTTP status code): Invoked just after the
  response is complete if the status code is the exact code used in the callback
  name. Prevents execution of **onSuccess** and **onFailure**. Happens before
  **onComplete**.
* **onException**: Triggered whenever an XHR error arises. Has a custom
  signature: the first argument is the requester (i.e. an Ajax.Request
  instance), and the second is the exception object.
* **onComplete**: Triggered at the very end of a request's life-cycle, after the
  request completes, status-specific callbacks are called, and possible
  automatic behaviors are processed. Guaranteed to run regardless of what
  happened during the request.

MashupPlatform.wiring
---------------------

pushEvent
.........

Sends an event through the wiring.

.. method:: MashupPlatform.wiring.pushEvent(outputName, data)

* ``outputName`` is the name of the output endpoint as defined in the GDL.
* ``data`` is the content of the event.

registerCallback
................

Registers a callback for a given input endpoint. If the given endpoint already
has registered a callback, it will be replaced by the new one.

.. method:: MashupPlatform.wiring.registerCallback(inputName, callback)

* ``inputName`` is name of the input endpoint as defined in the GDL.
* ``callback`` is the callback function to use when an event reaches the given
  input endpoint.


MashupPlatform.prefs
--------------------

get
...

Retrives the value of a preference.

.. method:: MashupPlatform.prefs.get(key)

* ``key`` is the preference to fetch.

registerCallback
................

Registers a callback for listening preference changes.

.. method:: MashupPlatform.prefs.registerCallback(callback)

* ``callback`` is the callback function that will be called when the preferences
  of the gadget changes.

set
...

Sets the value of a preference.

.. method:: MashupPlatform.prefs.set(key, value)

* ``

MashupPlatform.widget
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

MashupPlatform.widget.window
----------------------------

adjustHeight
............

adjustWidth
...........

getViewportDimensions
.....................

setTitle
........

