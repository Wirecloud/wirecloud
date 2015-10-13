FIWARE Application Mashup - Widget API Specification
====================================================
Date: 30th September 2015

This version:

https://github.com/Wirecloud/wirecloud/tree/0.7.x/docs/widgetapi/

Previous version:

None

Latest version:

https://github.com/Wirecloud/wirecloud/tree/develop/docs/widgetapi/

The Application Mashup GE offers two separate APIs that cannot be combined
because of their different nature: The Widget API (the subject of this
document) is a JavaScript API, while the Application Mashup API is a
RESTful one. You can find the Application Mashup RESTful API in the
following link:

http://docs.fiwareapplicationmashup.apiary.io/

The Widget API is a JavaScript API that allows widgets/operators to gain access
to the functionalities provided by the Application Mashup GE (wiring,
preferences, context information, logs, etc.). Amongst other functionalities,
this API allows the widgets/operators to gain access to remote resources (e.g.
in order to gain access to a remote REST API through the cross-domain proxy).

This document also show some examples that can be tested using WireCloud, the
reference implementation of the FIWARE Application Mashup GE.

## Editors

  + Álvaro Arranz, Universidad Politécnica de Madrid

## Acknowledgements

The editors would like to express their gratitude to the following people who
actively contributed to this specification: Aitor Magan and Francisco de la Vega

## Status

This is a work in progress and is changing on a daily basis. You can check the latest
available version on: https://github.com/Wirecloud/wirecloud/tree/develop.
Please send your comments to wirecloud@conwet.com

This specification is licensed under the [FIWARE Open Specification License (implicit patents license)](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/FI-WARE_Open_Specification_Legal_Notice_%28implicit_patents_license%29).

## Copyright

Copyright © 2012-2015 by Universidad Politécnica de Madrid

## Widget API

### MashupPlatform.http

This module provides some methods for handling HTTP requests including support
for using the cross domain proxy.

Currently this module is composed of two methods:

- [`buildProxyURL`](#mashupplatformhttpbuildproxyurl-method)
- [`makeRequest`](#mashupplatformhttpmakerequest-method)


#### `MashupPlatform.http.buildProxyURL` method

This method builds a URL suitable for working around the cross-domain problem.
It is usually handled using the Application Mashup proxy but it also can be
handled using the access control request headers if the browser has support for
them. If all the needed requirements are meet, this function will return a URL
without using the proxy.

```javascript
MashupPlatform.http.buildProxyURL(url, options)
```

* `url` (*required, string*): target URL
* `options` (*optional, object*): an object with request options (shown later)

**Example usage:**

```javascript
var internal_url = 'http://server.intranet.com/image/a.png';
var url = MashupPlatform.http.buildProxyURL(internal_url, {forceProxy: true});
var img = document.createElement('img');
img.src = url;
```


#### `MashupPlatform.http.makeRequest` method

Sends an HTTP request. This method internally calls the buildProxyURL method for
working around any possible problem related with the same-origin policy followed
by browser (allowing CORS requests).

```javascript
MashupPlatform.http.makeRequest(url, options)
```

* `url` (*required, string*): the URL to which to send the request
* `options` (*optional, object*): an object with a list of request options (shown later)

**Example usage:**

```javascript
$('loading').show();
MashupPlatform.http.makeRequest('http://api.example.com', {
    method: "POST",
    postBody: JSON.stringify({key: value}),
    contentType: "application/json",
    onSuccess: function (response) {
        // Everything went ok
    },
    onFailure: function (response) {
        // Something went wrong
    },
    onComplete: function () {
        $('loading').hide();
    }
});
```


#### Request options: General options

- `contentType` (*string*): The Content-Type header for your request. If it is
  not provided, the content-type header will be extrapolated from the value of
  the `postBody` option (defaulting to `application/x-www-form-urlencoded` if
  the `postBody` value is a String). Specify this option if you want to force
  the value of the `Content-Type` header.
- `encoding` (*string; default `UTF-8`*): The encoding for the contents of your
  request. It is best left as-is, but should weird encoding issues arise, you
  may have to tweak this.
- `method` (*string; default `POST`*): The HTTP method to use for the request.
- `responseType` (*string; default: ""*): Can be set to change the response type.
  The valid values for this options are: "", "arraybuffer", "blob" and "text".
- `parameters` (*object*): The parameters for the request, which will be encoded
  into the URL for a `GET` method, or into the request body when using the `PUT`
  and `POST` methods.
- `postBody` (*`ArrayBufferView`, `Blob`, `Document`, `String`, `FormData`*):
  The contents to use as request body (usually used in post and put requests,
  but can be used by any request). If it is not provided, the contents of the
  parameters option will be used instead. Finally, if there are not parameters,
  request will not have a body.
- `requestHeaders` (*object*): A set of key-value pairs, with properties
  representing header names.
- `supportsAccessControl` (*boolean; default `false`*): Indicates whether the
  target server supports the [Access
  Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS)
  headers, and thus, you want to make a request without using the cross-domain
  proxy if possible.
- `forceProxy` (*boolean; default `false`*): Sends the request through the proxy
  regardless of the other options passed.
- `context` (*object; default `null`*): The value to be passed as
  the this parameter to the callbacks. If context is `null` the `this` parameter
  of the callbacks is left intact.


#### Request options: Callback options

- `onSuccess`: Invoked when a request completes and its status code belongs in
  the 2xy family. This is skipped if a code-specific callback is defined, and
  happens before `onComplete`. Receives the response object as the first
  argument
- `onFailure`: Invoked when a request completes and its status code exists but
  is not in the 2xy family. This is skipped if a code-specific callback is
  defined, and happens before `onComplete`. Receives the response object as the
  first argument
- `onXYZ` (with XYZ representing any HTTP status code): Invoked just after the
  response is complete if the status code is the exact code used in the callback
  name. Prevents execution of `onSuccess` and `onFailure`. Happens
  before `onComplete`. Receives the response object as the first argument
- `onComplete`: Triggered at the very end of a request's life-cycle, after the
  request completes, status-specific callbacks are called, and possible
  automatic behaviours are processed. Guaranteed to run regardless of what
  happened during the request. Receives the response object as the first
  argument
- `onException`: Triggered whenever an exception arises running any of the
  `onXYZ`, `onSuccess`, `onFailure` and `onComplete` callbacks. Receives the
  request as the first argument, and the exception object as the second one


#### Response object

The response object returned by the `MashupPlatform.http.makeRequest` method
provides the following attributes:

- `request` (*Request*): The request for the current response
- `status` (*number*): The status of the response to the request. This is the
  HTTP result code
- `statusText` (*string*): The response string returned by the HTTP server.
  Unlike status, this includes the entire text of the response message
- `response` (*`ArrayBuffer`, `Blob`, `String`*): The response entity body
  according to `responseType`, as an `ArrayBuffer`, `Blob` or `String`. This is
  `null` if the request is not complete, was not successful or the
  `responseType` option of the requests was ""
- `responseText` (*string*): The response to the request as text, or `null` if
  the request was unsuccessful or the responseType option of the requests was
  different to ""


### MashupPlatform.log

This module contains the following constants:

* **ERROR:** Used for indicating an Error level
* **WARN:** Used for indicating a Warning level
* **INFO:** Used for indicating an Info level

Those constants can be used when calling to the `MashupPlatform.widget.log` and
`MashupPlatform.operator.log` methods.


### MashupPlatform.prefs

This module provides methods for managing the preferences defined on the
mashable application component description file (`config.xml` file).

Currently, this module provides three methods:

- [`get`](#mashupplatformprefsget-method)
- [`registerCallback`](#mashupplatformprefsregistercallback-method)
- [`set`](#mashupplatformprefsset-method)

and one exception:

- [`PreferenceDoesNotExistError`](#mashupplatformprefspreferencedoesnotexisterror-exception)


#### `MashupPlatform.prefs.get` method

This method retrieves the value of a preference. The type of the value returned
by this method depends on the type of the preference.

```javascript
MashupPlatform.prefs.get(key)
```

- `key` (required, string): the name of the preference as defined on the
  `config.xml` file.

This method can raise the following exceptions:

- `MashupPlatform.prefs.PreferenceDoesNotExistError`

**Example usage:**

```javascript
MashupPlatform.prefs.get('boolean-pref'); // true or false
MashupPlatform.prefs.get('number-prefs'); // a number value
MashupPlatform.prefs.get('text-prefs');   // a string value
```


#### `MashupPlatform.prefs.registerCallback` method

This method registers a callback for listening for preference changes.

```javascript
MashupPlatform.prefs.registerCallback(callback)
```

- `callback` function to be called when a change in one or more preferences is
  detected. This callback will receive a key-value object with the changed
  preferences and their new values.

**Example usage:**

```javascript
MashupPlatform.prefs.registerCallback(function (new_values) {
    if ('some-pref' in new_values) {
        // some-pref has been changed
        // new_values['some-pref'] contains the new value
    }
});
```


#### `MashupPlatform.prefs.set` method

This method sets the value of a preference.

```javascript
MashupPlatform.prefs.set(key, value)
```

- `key` (*required, string*): the name of the preference as defined on the
  `config.xml` file.
- `value` (*required, any*): new value for the preference. The acceptable values
  for this parameter depends on the type of the preference.

This method can raise the following exceptions:

- `MashupPlatform.prefs.PreferenceDoesNotExistError`

**Example usage:**

```javascript
MashupPlatform.prefs.set('boolean-pref', true);
```


### `MashupPlatform.prefs.PreferenceDoesNotExistError` exception

This exception is raised when a preference is not found.

```javascript
MashupPlatform.prefs.PreferenceDoesNotExistError
```


### MashupPlatform.mashup

The mashup module contains one attribute:

- [`context`](#mashupplatformmashupcontext-attribute)


#### `MashupPlatform.mashup.context` attribute

This attribute contains the context manager of the mashup. See the
[documentation about context managers](#context-managers) for more information.

```javascript
MashupPlatform.mashup.context
```

**Example usage:**

```javascript
MashupPlatform.mashup.context.get('title');
```


### MashupPlatform.operator

This module is only available when running inside an operator. Currently,
the Widget API provides the following attributes:

- [`id`](#mashupplatformoperatorid-attribute)
- [`context`](#mashupplatformoperatorcontext-attribute)

and one method:

- [`log`](#mashupplatformoperatorlog-method)


#### `MashupPlatform.operator.id` attribute

This attribute contains the operator's id.

```javascript
MashupPlatform.operator.id
```


#### `MashupPlatform.operator.context` attribute

This attribute contains the context manager of the operator. See the
[documentation about context managers](#context-managers) for more information.

```javascript
MashupPlatform.operator.context
```

**Example usage:**

```javascript
MashupPlatform.operator.context.get('version');
```


#### `MashupPlatform.operator.log` method

This method writes a message into the Application Mashup's log console.

```javascript
MashupPlatform.operator.log(msg, level)
```

- `msg` (*required, string*): is the text of the message to log.
- `level` (*optional, default: `MashupPlatform.log.ERROR`*): This optional
  parameter specifies the level to use for logging the message. See
  [MashupPlatform.log](#mashupplatformlog) for available log levels.

**Example usage:**

```javascript
MashupPlatform.operator.log('error message description');
MashupPlatform.operator.log('info message description', MashupPlatform.log.INFO);
```


### MashupPlatform.widget

This module is only available when running inside a widget. Currently,
the Widget API provides the following attributes:

- [`id`](#mashupplatformwidgetid-attribute)
- [`context`](#mashupplatformwidgetcontext-attribute)

and the following methods:

- [`getVariable`](#mashupplatformwidgetgetvariable-method)
- [`drawAttention`](#mashupplatformwidgetdrawattention-method)
- [`log`](#mashupplatformwidgetlog-method)


#### `MashupPlatform.widget.id` attribute

This attribute contains the widget's id.

```javascript
MashupPlatform.widget.id
```


#### `MashupPlatform.widget.context` attribute

This attribute contains the context manager of the widget. See the
[documentation about context managers](#context-managers) for more information.

```javascript
MashupPlatform.widget.context
```

**Example usage:**

```javascript
MashupPlatform.widget.context.get('version');
```


#### `MashupPlatform.widget.getVariable` method

Returns a widget variable by its name.

```javascript
MashupPlatform.widget.getVariable(name)
```

- `name` (*required, string*): the name of the persistent variable as defined on
  the `config.xml` file.

**Example usage:**

```javascript
var variable = MashupPlatform.widget.getVariable('persistent-var');
variable.set(JSON.stringify(data));
```


#### `MashupPlatform.widget.drawAttention` method

Makes the Application Mashup Engine notify that the widget needs user's
attention.

```javascript
MashupPlatform.widget.drawAttention()
```


#### `MashupPlatform.widget.log` method

Writes a message into the Application Mashup's log console.

```javascript
MashupPlatform.widget.log(msg, level)
```

- `msg` (*required, string*): is the text of the message to log.
- `level` (*optional, default: `MashupPlatform.log.ERROR`*): This optional
  parameter specifies the level to use for logging the message. See
  [MashupPlatform.log](#mashupplatform-log) for available log levels.

**Example usage:**

```javascript
MashupPlatform.widget.log('error message description');
MashupPlatform.widget.log('warning message description', MashupPlatform.log.WARN);
```


### MashupPlatform.wiring

This module provides some methods for handling the communication between widgets
an operators through the wiring.

Currently this module is composed of five methods:

- [`pushEvent`](#mashupplatformwiringpushevent-method)
- [`registerCallback`](#mashupplatformwiringregistercallback-method)

and three exceptions:

- [`EndpointDoesNotExistError`](#mashupplatformwiringendpointdoesnotexisterror-exception)


#### `MashupPlatform.wiring.pushEvent` method

Sends an event through the wiring.

```javascript
MashupPlatform.wiring.pushEvent(outputName, data)
```

- `outputName` (*required, string*): name of the output endpoint to use for
  sending the event.
- `data` (*required, any*): data to send

This method can raise the following exceptions:

- `MashupPlatform.wiring.EndpointDoesNotExistError`

**Example usage:**

```javascript
MashupPlatform.wiring.pushEvent('outputendpoint', 'event data');
```


#### `MashupPlatform.wiring.registerCallback` method

Registers a callback for a given input endpoint. If the given endpoint already
has registered a callback, it will be replaced by the new one.

```javascript
MashupPlatform.wiring.registerCallback(inputName, callback)
```

- `inputName` (*required, string*): name of the input endpoint where the
  callback function will be registered
- `callback` (*required, function*): function that will be called when an event
  arrives the input endpoint

This method can raise the following exceptions:

- `MashupPlatform.wiring.EndpointDoesNotExistError`

**Example usage:**

```javascript
MashupPlatform.wiring.registerCallback('inputendpoint', function (data_string) {
    var data = JSON.parse(data_string);
    ...
});
```


#### `MashupPlatform.wiring.EndpointDoesNotExistError` exception

This exception is raised when an input/output endpoint is not found.

```javascript
MashupPlatform.wiring.EndpointDoesNotExistError
```


### Context Managers

Each context managers supports three methods:

* [`getAvailableContext`](#contextmanagergetavailablecontext-method)
* [`get`](#contextmanagerget-method)
* [`registerCallback`](#contextmanagerregistercallback-method)

#### `ContextManager.getAvailableContext` method

This method provides information about what concepts are available for the given level

```javascript
ContextManager.getAvailableContext()
```

**Example usage:**

```javascript
MashupPlatform.context.getAvailableContext();
```

#### `ContextManager.get` method

Retrieves the current value for a concept

```javascript
ContextManager.get(key)
```

- `key` (*required, string*): name of the concept to query.

**Example usage:**

```javascript
MashupPlatform.widget.context.get('heightInPixels');
MashupPlatform.mashup.context.get('name');
MashupPlatform.context.get('username');
```

#### `ContextManager.registerCallback` method

Allows to register a callback that will be called when any of the concepts are modified

```javascript
ContextManager.registerCallback(callback)
```

- `callback` (*required, function*): function that will be called everytime the
  context information managed by the context manager change.

**Example usage:**

```javascript
MashupPlatform.widget.context.registerCallback(function (new_values) {
    if ('some-context-concept' in new_values) {
        // some-context-concept has been changed
        // new_values['some-context-concept'] contains the new value
    }
});
```
