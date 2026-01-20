# FIWARE Application Mashup - Widget API Specification

Date: 26th August 2016

This version:

https://github.com/Wirecloud/wirecloud/tree/1.0.x/docs/widgetapi/

Previous version:

https://github.com/Wirecloud/wirecloud/tree/0.9.x/docs/widgetapi/

Latest version:

https://github.com/Wirecloud/wirecloud/tree/develop/docs/widgetapi/

## Editors

-   Álvaro Arranz, Universidad Politécnica de Madrid

## Copyright

Copyright © 2012-2016 by Universidad Politécnica de Madrid

## License

This specification is licensed under the
[FIWARE Open Specification License (implicit patents license)](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/FI-WARE_Open_Specification_Legal_Notice_%28implicit_patents_license%29).

---

## Abstract

The Application Mashup GE offers two separate APIs that cannot be combined because of their different nature: The Widget
API (the subject of this document) is a JavaScript API, while the Application Mashup API is a RESTful one. You can find
the Application Mashup RESTful API in the following link:

http://wirecloud.github.io/wirecloud/restapi/latest/

The Widget API is a JavaScript API that allows widgets/operators to gain access to the functionalities provided by the
Application Mashup GE (wiring, preferences, context information, logs, etc.). Amongst other functionalities, this API
allows the widgets/operators to gain access to remote resources (e.g. in order to gain access to a remote REST API
through the cross-domain proxy).

This document also show some examples that can be tested using WireCloud, the reference implementation of the FIWARE
Application Mashup GE.

## Status of this document

This is a work in progress and is changing on a daily basis. You can check the latest available version on:
https://github.com/Wirecloud/wirecloud/tree/develop. Please send your comments to wirecloud@conwet.com

This specification is licensed under the
[FIWARE Open Specification License (implicit patents license)](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/FI-WARE_Open_Specification_Legal_Notice_%28implicit_patents_license%29).

---

## Widget API

### MashupPlatform.location

Allows to retrieve the current loaded location of the widget/operator.

### MashupPlatform.http

This module provides some methods for handling HTTP requests including support for using the cross domain proxy.

Currently this module is composed of two methods:

-   [`buildProxyURL`](#mashupplatformhttpbuildproxyurl-method)
-   [`makeRequest`](#mashupplatformhttpmakerequest-method)

#### `MashupPlatform.http.buildProxyURL` method

This method builds a URL suitable for working around the cross-domain problem. It is usually handled using the
Application Mashup proxy but it also can be handled using the access control request headers if the browser has support
for them. If all the needed requirements are meet, this function will return a URL without using the proxy.

```javascript
MashupPlatform.http.buildProxyURL(url, options);
```

-   `url` (_required, string_): target URL
-   `options` (_optional, object_): an object with request options (shown later)

**Example usage:**

```javascript
var internal_url = "http://server.intranet.com/image/a.png";
var url = MashupPlatform.http.buildProxyURL(internal_url, { forceProxy: true });
var img = document.createElement("img");
img.src = url;
```

#### `MashupPlatform.http.makeRequest` method

Sends an HTTP request. This method internally calls the `buildProxyURL` method for working around any possible problem
related with the same-origin policy followed by browser (allowing CORS requests).

```javascript
MashupPlatform.http.makeRequest(url, options);
```

-   `url` (_required, string_): the URL to which to send the request
-   `options` (_optional, object_): an object with a list of request options (shown later)

This method returns a `Request` object.

**Example usage:**

```javascript
$("loading").show();
let request = MashupPlatform.http.makeRequest("http://api.example.com", {
    method: "POST",
    postBody: JSON.stringify({ key: value }),
    contentType: "application/json",
    onSuccess: function(response) {
        // A response in the 2xx range was received
    },
    onFailure: function(response) {
        // Something went wrong connecting to the server or a response outside
        // 2xx range was received
    },
    onComplete: function() {
        $("loading").hide();
    }
});
```

`Request` objects are also `Promise` compatible supporting the following scenario:

```javascript
$("loading").show();
let request = MashupPlatform.http.makeRequest("http://api.example.com", {
    method: "POST",
    postBody: JSON.stringify({key: value}),
    contentType: "application/json"
});
request.then(
    (response) => {
        // We have a response from the server
    },
    (error) => {
        // Impossible to read a response from server
    }
).finally(
    () => {
        $("loading").hide();
    }
);
```

This also means that `Request` objects can be used with other `Promise` methods, like `Promise.all()`,
`Promise.allSettled()`, `Promise.any()` or `Promise.race()`.


#### Request options: General options

-   `contentType` (_string_): The Content-Type header for your request. If it is not provided, the content-type header
    will be extrapolated from the value of the `postBody` option (defaulting to `application/x-www-form-urlencoded` if
    the `postBody` value is a String). Specify this option if you want to force the value of the `Content-Type` header.
-   `encoding` (_string; default `UTF-8`_): The encoding for the contents of your request. It is best left as-is, but
    should weird encoding issues arise, you may have to tweak this.
-   `method` (_string; default `POST`_): The HTTP method to use for the request.
-   `responseType` (_string; default: ""_): Can be set to change the response type. The valid values for this options
    are: "", "arraybuffer", "blob", "document", "json" and "text".
-   `parameters` (_object_): The parameters for the request, which will be encoded into the URL for a `GET` method, or
    into the request body when using the `PUT` and `POST` methods.
-   `postBody` (_`ArrayBufferView`, `Blob`, `Document`, `String`, `FormData`_): The contents to use as request body
    (usually used in post and put requests, but can be used by any request). If it is not provided, the contents of the
    parameters option will be used instead. Finally, if there are not parameters, request will not have a body.
-   `requestHeaders` (_object_): A set of key-value pairs, with properties representing header names.
-   `supportsAccessControl` (_boolean; default `false`_): Indicates whether the target server supports the
    [Access Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) headers, and thus, you want
    to make a request without using the cross-domain proxy if possible.
-   `withCredentials` (_boolean; default `false`_): Indicates whether or not cross-site `Access-Control` requests should
    be made using credentials such as cookies or authorization headers. In addition, this flag is also used to indicate
    when cookies are to be ignored in the response.
-   `forceProxy` (_boolean; default `false`_): Sends the request through the proxy regardless of the other options
    passed.
-   `context` (_object; default `null`_): The value to be passed as the this parameter to the callbacks.
    If context is `null` the `this` parameter of the callbacks is left intact.


#### Request options: Callback options

-   `onAbort` (new in WireCloud 0.8.2): Invoked when the `abort()` method of the Request object returned by
    `MashupPlatform.http.makeRequest()` is called
-   `onSuccess`: Invoked when a request completes and its status code belongs in the 2xy family. This is skipped if a
    code-specific callback is defined, and happens before `onComplete`. Receives the response object as the first
    argument
-   `onFailure`: Invoked when a request completes and its status code exists but is not in the 2xy family. This is
    skipped if a code-specific callback is defined, and happens before `onComplete`. Receives the response object as the
    first argument
-   `onXYZ` (with XYZ representing any HTTP status code): Invoked just after the response is complete if the status code
    is the exact code used in the callback name. Prevents execution of `onSuccess` and `onFailure`. Happens
    before `onComplete`. Receives the response object as the first argument
-   `onComplete`: Triggered at the very end of a request's life-cycle, after the request completes, status-specific
    callbacks are called, and possible automatic behaviours are processed. Guaranteed to run regardless of what happened
    during the request. Receives the response object as the first argument
-   `onException`: Triggered whenever an exception arises running any of the `onXYZ`, `onSuccess`, `onFailure` and
    `onComplete` callbacks. Receives the request as the first argument, and the exception object as the second one
-   `onProgress`: Periodically triggered to indicate the amount of progress made so far on request
-   `onUploadProgress`: Periodically triggered to indicate the amount of progress made so far on upload


#### Request object

The request object returned by the `MashupPlatform.http.makeRequest` method provides the following attributes:

-   `method` (_string_): The HTTP method use by the request, such as "GET", "POST", "PUT", "DELETE", etc.
-   `url` (_string_): The final URL where the request has been sent to

And the following method:

-   `abort()`: Aborts the request if it has already been sent
-   `catch(onRejected[, onAborted])`: Equivalent to `Promise.catch` supporting the `onAborted` parameter of `Request.then()`.
-   `finally(onFinally)`: Equivalent to `Promise.finally()`, catching also abort events.
-   `then(onFulfilled[, onRejected, onAborted])`: Equivalent method to `Promise.then` making `Request` objects `Promise`
    compatible. `onFulfilled` is called just after successfully receiving a full response from server. `onRejected` is
    called if there is any problem connecting to the server or the browser imposes some restriction for reading the
    response. Finally, this method supports an extra `onAborted` parameter for configuring a handler that will be called
    when the request is aborted.


#### Response object

The response object passed to the callbacks used with the `MashupPlatform.http.makeRequest` method provides the
following attributes:

-   `request` (_Request_): The request for the current response
-   `status` (_number_): The status of the response to the request. This is the HTTP result code
-   `statusText` (_string_): The response string returned by the HTTP server. Unlike status, this includes the entire
    text of the response message
-   `response` (*`ArrayBuffer`, `Blob`, `Document`, *object*, `String`*): The response entity body according to
    `responseType`, as an `ArrayBuffer`, `Blob` or a `String`. This is `null` if the request is not complete, was not
    successful or the `responseType` option of the requests was ""
-   `responseText` (_string_): The response to the request as text, or `null` if the request was unsuccessful or the
    `responseType` option of the requests was different to ""
-   `responseXML` (_Document_): The response to the request as a _Document_, or `null` if the request was unsuccessful
    or cannot be parsed as XML or HTML. The response is parsed as if it were a `text/xml` stream. This attribute is not
    available if `responseType` is different to "".

### MashupPlatform.log

This module contains the following constants:

-   **ERROR:** Used for indicating an Error level
-   **WARN:** Used for indicating a Warning level
-   **INFO:** Used for indicating an Info level

Those constants can be used when calling to the `MashupPlatform.widget.log` and `MashupPlatform.operator.log` methods.

### MashupPlatform.prefs

This module provides methods for managing the preferences defined on the mashable application component description file
(`config.xml` file).

Currently, this module provides three methods:

-   [`get`](#mashupplatformprefsget-method)
-   [`registerCallback`](#mashupplatformprefsregistercallback-method)
-   [`set`](#mashupplatformprefsset-method)

and one exception:

-   [`PreferenceDoesNotExistError`](#mashupplatformprefspreferencedoesnotexisterror-exception)

#### `MashupPlatform.prefs.get` method

This method retrieves the value of a preference. The type of the value returned by this method depends on the type of
the preference.

```javascript
MashupPlatform.prefs.get(key);
```

-   `key` (required, string): the name of the preference as defined on the `config.xml` file.

This method can raise the following exceptions:

-   `MashupPlatform.prefs.PreferenceDoesNotExistError`

**Example usage:**

```javascript
MashupPlatform.prefs.get("boolean-pref"); // true or false
MashupPlatform.prefs.get("number-prefs"); // a number value
MashupPlatform.prefs.get("text-prefs"); // a string value
```

#### `MashupPlatform.prefs.registerCallback` method

This method registers a callback for listening for preference changes.

```javascript
MashupPlatform.prefs.registerCallback(callback);
```

-   `callback` function to be called when a change in one or more preferences is detected. This callback will receive a
    key-value object with the changed preferences and their new values.

**Example usage:**

```javascript
MashupPlatform.prefs.registerCallback(function(new_values) {
    if ("some-pref" in new_values) {
        // some-pref has been changed
        // new_values['some-pref'] contains the new value
    }
});
```

#### `MashupPlatform.prefs.set` method

This method sets the value of a preference.

```javascript
MashupPlatform.prefs.set(key, value);
```

-   `key` (_required, string_): the name of the preference as defined on the `config.xml` file.
-   `value` (_required, any_): new value for the preference. The acceptable values for this parameter depends on the
    type of the preference.

This method can raise the following exceptions:

-   `MashupPlatform.prefs.PreferenceDoesNotExistError`

**Example usage:**

```javascript
MashupPlatform.prefs.set("boolean-pref", true);
```

### `MashupPlatform.prefs.PreferenceDoesNotExistError` exception

This exception is raised when a preference is not found.

```javascript
MashupPlatform.prefs.PreferenceDoesNotExistError;
```

### MashupPlatform.mashup

The mashup module contains one attribute:

-   [`context`](#mashupplatformmashupcontext-attribute)

and the following methods:

-   [`addWidget`](#mashupplatformmashupaddwidget-method)
-   [`addOperator`](#mashupplatformmashupaddoperator-method)
-   [`createWorkspace`](#mashupplatformmashupcreateworkspace-method)
-   [`openWorkspace`](#mashupplatformmashupopenworkspace-method)
-   [`removeWorkspace`](#mashupplatformmashupremoveworkspace-method)

#### `MashupPlatform.mashup.context` attribute

This attribute contains the context manager of the mashup. See the
[documentation about context managers](#context-managers) for more information.

```javascript
MashupPlatform.mashup.context;
```

**Example usage:**

```javascript
MashupPlatform.mashup.context.get("title");
```

#### `MashupPlatform.mashup.addWidget` method

> new in WireCloud 0.8.0 / Widget API v2

This method allows widgets and operators to add new temporal widgets into the current workspace.

This method is only available when making use of the `DashboardManagement` feature.

```javascript
MashupPlatform.mashup.addWidget(widget_ref, options);
```

-   `widget_ref` (_required, string_): id (vendor/name/version) of the widget to use.
-   `options` (_optional, object_): object with extra options.

Supported options:

-   `title` (_string_): Title for the widget. If not provided, the default title provided in the widget description will
    be used.
-   `permissions` (_object_): Object with the permissions to apply to the widget. Currently, the following permissions
    are available: `close`, `configure`, `minimize`, `move`, `resize` and `upgrade`.
-   `preferences` (_object_): Object with the initial configuration for the preferences. If not provided, the default
    configuration of the widget is used.
-   `properties` (_object_): Object with the initial configuration for the properties. If not provided, the default
    configuration of the widget is used.
-   `refposition` (_`ClientRect`_): Element position to use as reference for placing the new widget. You can obtain such
    a object using the [`getBoundingClientRect`][getboundingclientrect] method. This option cannot be used when using
    the `addWidget` method from an operator.
-   `top` (_string, default: `0px`_): This option specifies the distance between the top margin edge of the element and
    the top edge of the dashboard. This value will be ignored if you provide a value for the `refposition` option.
-   `left` (_string, default: `0px`_): This option specifies the distance between the left margin edge of the element
    and the top edge of the dashboard. This value will be ignored if you provide a value for the `refposition` option.
-   `width` (_string, default: `null`_): This options specifies the width of the widget. If not provided, the default
    width will be used.
-   `height` (_string, default: `null`_): This options specifies the height of the widget. If not provided, the default
    height will be used.

**Example usage:**

```javascript
var widget = MashupPlatform.mashup.addWidget("CoNWeT/kurento-one2one/1.0", {
    permissions: {
        close: false,
        configure: false
    },
    preferences: {
        "stand-alone": {
            value: false
        }
    },
    top: "0px",
    left: "66%"
});
```

[getboundingclientrect]: https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect

#### `MashupPlatform.mashup.addOperator` method

> new in WireCloud 0.8.0 / Widget API v2

This method allows widgets and operators to add new temporal operators into the current workspace.

This method is only available when making use of the `DashboardManagement` feature.

```javascript
MashupPlatform.mashup.addOperator(operator_ref, options);
```

-   `operator_ref` (_required, string_): id (vendor/name/version) of the operator to use.
-   `options` (_optional, object_): object with extra options.

Supported options:

-   `permissions` (_object_): Object with the permissions to apply to the operator. Currently, the following permissions
    are available: `close`, `configure` and `upgrade`.
-   `preferences` (_object_): Object with the initial configuration for the preferences. If not provided, the default
    configuration of the operator is used.

**Example usage:**

```javascript
var operator = MashupPlatform.mashup.addOperator("CoNWeT/ngsientity2poi/3.0.3", {
    preferences: {
        coordinates_attr: {
            value: "current_position"
        }
    }
});
```

#### `MashupPlatform.mashup.createWorkspace` method

> new in WireCloud 0.8.0 / Widget API v2

This method allows widgets and operators to create new workspaces for the current user. This method is asynchronous.

This method is only available when making use of the `DashboardManagement` feature.

```javascript
MashupPlatform.mashup.createWorkspace(options);
```

-   `options` (_required, object_): object with the options to use for creating the workspace. At least one of the
    following options has to be provided: `name`, `mashup`, `workspace`.

Supported options:

-   `name` (_string_): Name for the new workspace. This option is required if neither `mashup` nor `workspace` option is
    used. If not provided, the name of the mashup will be taken from the mashup or from the workspace to use as
    template.
-   `mashup` (_string_): id (vendor/name/version) of the mashup to use as template for creating the new workspace. Both
    the `mashup` and `workspace` attributes are optional, but should not be specified together.
-   `workspace` (_string_): id (owner/name) of the workspace to use as template for creating the new workspace. Both the
    `mashup` and `workspace` attributes are optional, but should not be specified together.
-   `allowrenaming` (_boolean, default `false`_): if this option is `true`, the Application Mashup server will rename
    the workspace if a workspace with the same name already exists.
-   `preferences` (_object_): Object with the initial values for the workspace preferences. If not provided, the default
    values will be used.
-   `onSuccess` (_function_): callback to invoke if the workspace is created successfully.
-   `onFailure` (_function_): callback to invoke if some error is raised while creating the workspace.

**Example usage:**

```javascript
MashupPlatform.mashup.createWorkspace({
    name: "New workspace",
    mashup: "CoNWeT/ckan-graph-mashup/1.0",
    onSuccess: function(workspace) {
        alert(workspace.owner + "/" + workspace.name + " created successfully");
    }
});
```

#### `MashupPlatform.mashup.openWorkspace` method

> new in WireCloud 1.0.0 / Widget API v3

This method allows widgets and operators to switch current workspace. This method is asynchronous.

This method is only available when making use of the `DashboardManagement` feature.

```javascript
MashupPlatform.mashup.openWorkspace(workspace, options);
```

-   `workspace` (_required, object_): Object composed of the following attributes:
    -   `owner` (_required, string_): Username of the workspace's owner.
    -   `name` (_required, string_): Name of the workspace.
-   `options` (_object_): object with the options to use for opening the workspace.

Supported options:

-   `onFailure` (_function_): callback to invoke if some error is raised while opening the workspace.

**Example usage:**

```javascript
MashupPlatform.mashup.openWorkspace({
    owner: "wirecloud",
    name: "home"
});
```

#### `MashupPlatform.mashup.removeWorkspace` method

> new in WireCloud 1.0.0 / Widget API v3

This method allows widgets and operators to delete a workspace. This method is asynchronous.

This method is only available when making use of the `DashboardManagement` feature.

```javascript
MashupPlatform.mashup.removeWorkspace(workspace, options);
```

-   `workspace` (_required, object_): Object composed of the following attributes:
    -   `owner` (_required, string_): Username of the workspace's owner.
    -   `name` (_required, string_): Name of the workspace.
-   `options` (_object_): object with the options to use for removing the workspace.

Supported options:

-   `onSuccess` (_function_): callback to invoke if the workspace is removed successfully.
-   `onFailure` (_function_): callback to invoke if some error is raised while removing the workspace.

**Example usage:**

```javascript
MashupPlatform.mashup.removeWorkspace({
    owner: "user",
    name: "workspace"
});
```

### MashupPlatform.operator

This module is only available when running inside an operator. Currently, the Widget API provides the following
attributes:

-   [`id`](#mashupplatformoperatorid-attribute)
-   [`context`](#mashupplatformoperatorcontext-attribute)
-   [`inputs`](#mashupplatformoperatorinputs-attribute)
-   [`outputs`](#mashupplatformoperatoroutputs-attribute)

and three methods:

-   [`createInputEndpoint`](#mashupplatformoperatorcreateinputendpoint-method)
-   [`createOutputEndpoint`](#mashupplatformoperatorcreateoutputendpoint-method)
-   [`log`](#mashupplatformoperatorlog-method)

#### `MashupPlatform.operator.id` attribute

This attribute contains the operator's id.

```javascript
MashupPlatform.operator.id;
```

#### `MashupPlatform.operator.context` attribute

This attribute contains the context manager of the operator. See the
[documentation about context managers](#context-managers) for more information.

```javascript
MashupPlatform.operator.context;
```

**Example usage:**

```javascript
MashupPlatform.operator.context.get("version");
```

#### `MashupPlatform.operator.inputs` attribute

> new in WireCloud 0.8.0 / Widget API v2

A dict with the input endpoints of the operator using as key the name of the input endpoints.

```javascript
MashupPlatform.operator.inputs;
```

#### `MashupPlatform.operator.outputs` attribute

> new in WireCloud 0.8.0 / Widget API v2

A dict with the input endpoints of the operator using as key the name of the output endpoints.

```javascript
MashupPlatform.operator.outputs;
```

#### `MashupPlatform.operator.createInputEndpoint` method

> new in WireCloud 0.8.0 / Widget API v2

This method creates a dynamic input endpoint.

This method is only available when making use of the `DashboardManagement` feature.

```javascript
MashupPlatform.operator.createInputEndpoint(callback);
```

-   `callback` (_required, function_): function that will be called when an event arrives the input endpoint.

**Example usage:**

```javascript
MashupPlatform.operator.createInputEndpoint(function (data_string) {
    var data = JSON.parse(data_string);
    ...
});
```

#### `MashupPlatform.operator.createOutputEndpoint` method

> new in WireCloud 0.8.0 / Widget API v2

This method creates a dynamic output endpoint.

This method is only available when making use of the `DashboardManagement` feature.

```javascript
MashupPlatform.operator.createOutputEndpoint();
```

**Example usage:**

```javascript
var endpoint = MashupPlatform.operator.createOutputEndpoint();
...
endpoint.pushEvent('event data');
```

#### `MashupPlatform.operator.log` method

This method writes a message into the Application Mashup's log console.

```javascript
MashupPlatform.operator.log(msg, level);
```

-   `msg` (_required, string_): is the text of the message to log.
-   `level` (_optional, default: `MashupPlatform.log.ERROR`_): This optional parameter specifies the level to use for
    logging the message. See [MashupPlatform.log](#mashupplatformlog) for available log levels.

**Example usage:**

```javascript
MashupPlatform.operator.log("error message description");
MashupPlatform.operator.log("info message description", MashupPlatform.log.INFO);
```

### MashupPlatform.widget

This module is only available when running inside a widget. Currently, the Widget API provides the following attributes:

-   [`id`](#mashupplatformwidgetid-attribute)
-   [`context`](#mashupplatformwidgetcontext-attribute)
-   [`inputs`](#mashupplatformwidgetinputs-attribute)
-   [`outputs`](#mashupplatformwidgetoutputs-attribute)

and the following methods:

-   [`createInputEndpoint`](#mashupplatformwidgetcreateinputendpoint-method)
-   [`createOutputEndpoint`](#mashupplatformwidgetcreateoutputendpoint-method)
-   [`getVariable`](#mashupplatformwidgetgetvariable-method)
-   [`drawAttention`](#mashupplatformwidgetdrawattention-method)
-   [`log`](#mashupplatformwidgetlog-method)

#### `MashupPlatform.widget.id` attribute

This attribute contains the widget's id.

```javascript
MashupPlatform.widget.id;
```

#### `MashupPlatform.widget.context` attribute

This attribute contains the context manager of the widget. See the
[documentation about context managers](#context-managers) for more information.

```javascript
MashupPlatform.widget.context;
```

**Example usage:**

```javascript
MashupPlatform.widget.context.get("version");
```

#### `MashupPlatform.widget.inputs` attribute

> new in WireCloud 0.8.0 / Widget API v2

A dict with the input endpoints of the widget using as key the name of the input endpoints.

```javascript
MashupPlatform.widget.inputs;
```

#### `MashupPlatform.widget.outputs` attribute

> new in WireCloud 0.8.0 / Widget API v2

A dict with the input endpoints of the widget using as key the name of the output endpoints.

```javascript
MashupPlatform.widget.outputs;
```

#### `MashupPlatform.widget.createInputEndpoint` method

> new in WireCloud 0.8.0 / Widget API v2

This method creates a dynamic input endpoint.

This method is only available when making use of the `DashboardManagement` feature.

```javascript
MashupPlatform.widget.createInputEndpoint(callback);
```

-   `callback` (_required, function_): the function that will be called when an event arrives the input endpoint.

**Example usage:**

```javascript
MashupPlatform.widget.createInputEndpoint(function (data_string) {
    var data = JSON.parse(data_string);
    ...
});
```

#### `MashupPlatform.widget.createOutputEndpoint` method

> new in WireCloud 0.8.0 / Widget API v2

This method creates a dynamic output endpoint.

This method is only available when making use of the `DashboardManagement` feature.

```javascript
MashupPlatform.widget.createOutputEndpoint();
```

**Example usage:**

```javascript
var endpoint = MashupPlatform.widget.createOutputEndpoint();
...
endpoint.pushEvent('event data');
```

#### `MashupPlatform.widget.getVariable` method

Returns a widget variable by its name.

```javascript
MashupPlatform.widget.getVariable(name);
```

-   `name` (_required, string_): the name of the persistent variable as defined on the `config.xml` file.

**Example usage:**

```javascript
var variable = MashupPlatform.widget.getVariable("persistent-var");
variable.set(JSON.stringify(data));
```

#### `MashupPlatform.widget.drawAttention` method

Makes the Application Mashup Engine notify that the widget needs user's attention.

```javascript
MashupPlatform.widget.drawAttention();
```

#### `MashupPlatform.widget.log` method

Writes a message into the Application Mashup's log console.

```javascript
MashupPlatform.widget.log(msg, level);
```

-   `msg` (_required, string_): is the text of the message to log.
-   `level` (_optional, default: `MashupPlatform.log.ERROR`_): This optional parameter specifies the level to use for
    logging the message. See [MashupPlatform.log](#mashupplatformlog) for available log levels.

**Example usage:**

```javascript
MashupPlatform.widget.log("error message description");
MashupPlatform.widget.log("warning message description", MashupPlatform.log.WARN);
```

### MashupPlatform.wiring

This module provides some methods for handling the communication between widgets an operators through the wiring.

Currently this module is composed of five methods:

-   [`hasInputConnections`](#mashupplatformwiringhasinputconnections-method)
-   [`hasOutputConnections`](#mashupplatformwiringhasoutputconnections-method)
-   [`pushEvent`](#mashupplatformwiringpushevent-method)
-   [`registerCallback`](#mashupplatformwiringregistercallback-method)
-   [`registerStatusCallback`](#mashupplatformwiringregisterstatuscallback-method)

and three exceptions:

-   [`EndpointDoesNotExistError`](#mashupplatformwiringendpointdoesnotexisterror-exception)
-   [`EndpointTypeError`](#mashupplatformwiringendpointtypeerror-exception)
-   [`EndpointValueError`](#mashupplatformwiringendpointvalueerror-exception)

#### `MashupPlatform.wiring.hasInputConnections` method

> new in WireCloud 0.8.0 / Widget API v2

Sends an event through the wiring.

```javascript
MashupPlatform.wiring.hasInputConnections(inputName);
```

-   `inputName` (_required, string_): name of the input endpoint to query if has connections

This method can raise the following exceptions:

-   `MashupPlatform.wiring.EndpointDoesNotExistError`

**Example usage:**

```javascript
MashupPlatform.wiring.hasInputConnections("inputendpoint");
```

#### `MashupPlatform.wiring.hasOutputConnections` method

> new in WireCloud 0.8.0 / Widget API v2

Sends an event through the wiring.

```javascript
MashupPlatform.wiring.hasOutputConnections(outputName);
```

-   `outputName` (_required, string_): name of the output endpoint to query if has connections

This method can raise the following exceptions:

-   `MashupPlatform.wiring.EndpointDoesNotExistError`

**Example usage:**

```javascript
MashupPlatform.wiring.hasOutputConnections("outputendpoint");
```

#### `MashupPlatform.wiring.pushEvent` method

Sends an event through the wiring.

```javascript
MashupPlatform.wiring.pushEvent(outputName, data);
```

-   `outputName` (_required, string_): name of the output endpoint to use for sending the event.
-   `data` (_required, any_): data to send

This method can raise the following exceptions:

-   `MashupPlatform.wiring.EndpointDoesNotExistError`

**Example usage:**

```javascript
MashupPlatform.wiring.pushEvent("outputendpoint", "event data");
```

#### `MashupPlatform.wiring.registerCallback` method

Registers a callback for a given input endpoint. If the given endpoint already has registered a callback, it will be
replaced by the new one.

```javascript
MashupPlatform.wiring.registerCallback(inputName, callback);
```

-   `inputName` (_required, string_): name of the input endpoint where the callback function will be registered
-   `callback` (_required, function_): function that will be called when an event arrives the input endpoint

This method can raise the following exceptions:

-   `MashupPlatform.wiring.EndpointDoesNotExistError`

**Example usage:**

```javascript
MashupPlatform.wiring.registerCallback('inputendpoint', function (data_string) {
    var data = JSON.parse(data_string);
    ...
});
```

#### `MashupPlatform.wiring.registerStatusCallback` method

> new in WireCloud 0.8.0 / Widget API v2

Registers a callback that will be called everytime the wiring status of the mashup change, except by the changes made
using this Widget API.

```javascript
MashupPlatform.wiring.registerStatusCallback(callback);
```

-   `callback` (_required, function_): function that will be called everytime the wiring configuration is changed

**Example usage:**

```javascript
MashupPlatform.wiring.registerStatusCallback(function () {
    ...
});
```

#### `MashupPlatform.wiring.EndpointDoesNotExistError` exception

This exception is raised when an input/output endpoint is not found.

```javascript
MashupPlatform.wiring.EndpointDoesNotExistError;
```

#### `MashupPlatform.wiring.EndpointTypeError` exception

> new in WireCloud 0.8.0 / Widget API v2

Widgets/operators can throw this exception if they detect that the data arriving an input endpoint is not of the
expected type.

```javascript
MashupPlatform.wiring.EndpointTypeError(message);
```

-   `message` (_required, string_): message text describing the exception

**Example usage:**

```javascript
MashupPlatform.wiring.registerCallback('inputendpoint', function (data) {
    try {
        data = JSON.parse(data);
    } catch (error) {
        throw new MashupPlatform.wiring.EndpointTypeError('data should be encoded as JSON');
    }

    ...
});
```

#### `MashupPlatform.wiring.EndpointValueError` exception

> new in WireCloud 0.8.0 / Widget API v2

Widgets/operators can throw this exception if they detect that the data arriving an input endpoint, although has the
right type, contains inappropriate values.

```javascript
MashupPlatform.wiring.EndpointValueError(message);
```

-   `message` (_required, string_): message text describing the exception

**Example usage:**

```javascript
MashupPlatform.wiring.registerCallback('inputendpoint', function (data) {
    ...

    if (data.level > 4 || data.level < 0) {
        throw new MashupPlatform.wiring.EndpointValueError('level out of range');
    }

    ...
});
```

### Endpoint instances

> new in WireCloud 0.8.0 / Widget API v2

Endpoint instances provide one attribute:

-   [`connected`](#endpointconnected-attribute)

and the following methods (depending on the type of endpoint):

-   [`connect`](#endpointconnect-method)
-   [`disconnect`](#endpointdisconnect-method)
-   [`pushEvent`](#endpointpushevent-method)

#### `Endpoint.connected` attribute

This attribute indicates if the associated endpoint has at least one connection.

```javascript
Endpoint.connected;
```

**Example usage**

```javascript
if (MashupPlatform.widget.inputs.source.connected) {
    $("#alert").hide();
} else {
    $("#alert").show();
}
```

#### `Endpoint.connect` method

This method stablishes a connection between the endpoint associated to the instance and the endpoint passed as
parameter.

```javascript
Endpoint.connect(endpoint);
```

-   `endpoint` (_required, `Endpoint`_): the input/output endpoint to connect on the other end of the connection.

**Example usage**

```javascript
var operator = MashupPlatform.mashup.addOperator('CoNWeT/ngsientity2poi/3.0.3', ...);
var widget = MashupPlatform.mashup.addWidget('CoNWeT/map-viewer/2.5.7', ...);

MashupPlatform.widget.outputs.entity.connect(operator.inputs.entityInput);
operator.outputs.poiOutput.connect(widget.inputs.poiInput);
```

#### `Endpoint.disconnect` method

> new in WireCloud 1.0 / Widget API v2

Removes dynamic connections starting or ending in this endpoint. This method cannot be used for disconnecting
connections created by the user using the Wiring Editor.

```javascript
Endpoint.disconnect(endpoint);
```

-   `endpoint` (_optional, `Endpoint`_): the endpoint on the other end of the connection to remove. If `endpoint` is
    `null`, all the dynamic connections related to this endpoint will be disconnected.

**Example usage**

```javascript
var operator = MashupPlatform.mashup.addOperator('CoNWeT/ngsientity2poi/3.0.3', ...);
var widget = MashupPlatform.mashup.addWidget('CoNWeT/map-viewer/2.5.7', ...);

MashupPlatform.widget.outputs.entity.connect(operator.inputs.entityInput);
operator.outputs.poiOutput.connect(widget.inputs.poiInput);

...

MashupPlatform.widget.outputs.entity.disconnect(operator.inputs.entityInput);
operator.outputs.poiOutput.disconnect(widget.inputs.poiInput);
```

#### `Endpoint.pushEvent` method

Sends an event through the wiring.

Only available on output endpoints.

```javascript
Endpoint.pushEvent(data);
```

-   `data` (_required, any_): data to send

**Example usage:**

```javascript
MashupPlatform.widget.outputs.entity.pushEvent("event data");
```

### Widget instances

> new in WireCloud 0.8.0 / Widget API v2

Widget instances (obtained using the `MashupPlatform.mashup.addWidget` method) provides the following attributes:

-   [`inputs`](#widgetinputs-attribute)
-   [`outputs`](#widgetoutputs-attribute)

And the following methods:

-   [`addEventListener`](#widgetaddeventlistener-method)
-   [`remove`](#widgetremove-method)

#### `Widget.inputs` attribute

A dict with the input endpoints of the widget using as key the name of the input endpoints.

```javascript
Widget.inputs;
```

#### `Widget.outputs` attribute

A dict with the input endpoints of the widget using as key the name of the output endpoints.

```javascript
Widget.outputs;
```

#### `Widget.addEventListener` method

This method registers the specified listener on the `Widget` it's called on.

```javascript
Widget.addEventListener(name, handler);
```

-   `name` (_required, string_): name of the event to listen for.
-   `listener` (_required, function_): function that will be called when an event, of the indicated type, is raised by
    the widget.

**Example usage:**

```javascript
var widget = MashupPlatform.mashup.addWidget(...);
....
widget.addEventListener("close", onWidgetClose);
```

#### `Widget.remove` method

This method removes the widget from the workspace. Any wiring connection involving this widget is disconnected before
removing the widget.

```javascript
Widget.remove();
```

**Example usage:**

```javascript
var widget = MashupPlatform.mashup.addWidget(...);
....
widget.remove();
```

### Workspace instances

> new in WireCloud 1.0.0 / Widget API v3

Workspace instances (obtained using the `MashupPlatform.mashup.createWorkspace` method) provides the following
attributes:

-   [`name`](#workspacename-attribute)
-   [`owner`](#workspaceowner-attribute)

and the following methods:

-   [`open`](#workspaceopen-method)
-   [`remove`](#workspaceremove-method)

#### `Workspace.name` attribute

A string with the name of the workspace.

```javascript
Workspace.name;
```

#### `Workspace.owner` attribute

A string with the username of the workspace's owner.

```javascript
Workspace.owner;
```

#### `Workspace.open` method

> new in WireCloud 1.0.0 / Widget API v3

This method opens the workspace, closing the current one.

```javascript
Workspace.open(options);
```

-   `options` (_object_): object with the options to use for opening the workspace.

Supported options:

-   `onFailure` (_function_): callback to invoke if some error is raised while opening the workspace.

**Example usage:**

```javascript
MashupPlatform.mashup.createWorkspace({
    ...,
    onSuccess: function (workspace) {
        workspace.open();
    }
);
```

#### `Workspace.remove` method

> new in WireCloud 1.0.0 / Widget API v3

This method removes the workspace.

```javascript
Workspace.remove(options);
```

-   `options` (_object_): object with the options to use for removing the workspace.

Supported options:

-   `onSuccess` (_function_): callback to invoke if the workspace is removed successfully.
-   `onFailure` (_function_): callback to invoke if some error is raised while removing the workspace.

**Example usage:**

```javascript
var myWorkspace;

MashupPlatform.mashup.createWorkspace({
    ...,
    onSuccess: function (workspace) {
        myWorkspace = workspace;
    }
);

...

myWorkspace.remove();
```

### Operator instances

> new in WireCloud 0.8.0 / Widget API v2

Operators instances (obtained using the `MashupPlatform.mashup.addOperator` method) provides the following attributes:

-   [`inputs`](#operatorinputs-attribute)
-   [`outputs`](#operatoroutputs-attribute)

And the following methods:

-   [`addEventListener`](#operatoraddeventlistener-method)
-   [`remove`](#operatorremove-method)

#### `Operator.inputs` attribute

A dict with the input endpoints of the operator using as key the name of the input endpoints.

```javascript
Operator.inputs;
```

#### `Operator.outputs` attribute

A dict with the input endpoints of the operator using as key the name of the output endpoints.

```javascript
Operator.outputs;
```

#### `Operator.addEventListener` method

This method registers the specified listener on the `Operator` it's called on.

```javascript
Operator.addEventListener(name, handler);
```

-   `name` (_required, string_): name of the event to listen for.
-   `listener` (_required, function_): function that will be called when an event, of the indicated type, is raised by
    the operator.

**Example usage:**

```javascript
var operator = MashupPlatform.mashup.addOperator(...);
....
operator.addEventListener("close", onOperatorClose);
```

#### `Operator.remove` method

This method removes the operator from the workspace. Any wiring connection involving this operator is disconnected
before removing the operator.

```javascript
Operator.remove();
```

**Example usage:**

```javascript
var operator = MashupPlatform.mashup.addOperator(...);
....
operator.remove();
```

### Context Managers

Each context managers supports three methods:

-   [`getAvailableContext`](#contextmanagergetavailablecontext-method)
-   [`get`](#contextmanagerget-method)
-   [`registerCallback`](#contextmanagerregistercallback-method)

#### `ContextManager.getAvailableContext` method

This method provides information about what concepts are available for the given level

```javascript
ContextManager.getAvailableContext();
```

**Example usage:**

```javascript
MashupPlatform.context.getAvailableContext();
```

#### `ContextManager.get` method

Retrieves the current value for a concept

```javascript
ContextManager.get(key);
```

-   `key` (_required, string_): name of the concept to query.

**Example usage:**

```javascript
MashupPlatform.widget.context.get("heightInPixels");
MashupPlatform.mashup.context.get("name");
MashupPlatform.context.get("username");
```

#### `ContextManager.registerCallback` method

Allows to register a callback that will be called when any of the concepts are modified

```javascript
ContextManager.registerCallback(callback);
```

-   `callback` (_required, function_): function that will be called everytime the context information managed by the
    context manager change.

**Example usage:**

```javascript
MashupPlatform.widget.context.registerCallback(function(new_values) {
    if ("some-context-concept" in new_values) {
        // some-context-concept has been changed
        // new_values['some-context-concept'] contains the new value
    }
});
```

## Acknowledgements

The editors would like to express their gratitude to the following people who actively contributed to this
specification: Aitor Magan and Francisco de la Vega

## References

-   [Github source](https://github.com/Wirecloud/wirecloud)
-   [Application Mashup API](http://wirecloud.github.io/wirecloud/restapi/latest/)
-   [FIWARE Open Specification License (implicit patents license)](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/FI-WARE_Open_Specification_Legal_Notice_%28implicit_patents_license%29)
-   [CSSOM Views: The getClientRects() and getBoundingClientRect() methods](http://www.w3.org/TR/cssom-view/#the-getclientrects%28%29-and-getboundingclientrect%28%29-methods)
-   [Cross-Origin Resource Sharing](http://www.w3.org/TR/cors/)
