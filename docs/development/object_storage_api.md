Object Storage offers persistent storage for digital objects that can be files,
databases or other datasets which need to be archived. Objects are stored in
named locations known as containers. Containers can be nested thus objects can
be stored hierarchically.

This section provides the reference documentation of the ObjectStorage API
provided by WireCloud that can be uses in your widgets or operators. For being
able to use this API you have to add a requirement on this API thought the
description file of the widget/operator. See the [Using Object
Storage](3.2.2_Using Object Storage) tutorial for more detailed documentation
(and examples) on how to use this API.


## KeystoneAPI

A new **KeystoneAPI** can be instantiated using the following constructor:

```javascript
KeystoneAPI(url[, options])
```

- `url` is the url of the Keystone server
- `options`:
    - `token` (String): is the token to used for authenticating request to the
      Keystone server. *(Optional)*
    - `use_user_fiware_token` (Boolean): make **KeystoneAPI** to use the token
      obtained by WireCloud for the current user from the FIWARE's IdM server.
      Takes precedence over the `token` option. *(Optional)*

The `token` and `use_user_fiware_token` options are optional. When passed to the
`KeystoneAPI` constructor, these values are stored internally and used as the
default value in the invocation of its methods. In any case, these options can
also be passed to the `KeystoneAPI` methods for not using the default values.


### getTenants

List all of the tenants in the Keystone server available for the authenticated user.

```javascript
getTenants([options])
```

The `onSuccess` callback will receive the list of tenants as the first argument.


### getAuthToken

Gets an authentication token that permits access to the Object Storage API.

```javascript
getAuthToken([options])
```

Extra options:

- `tenantName` (String): The name of the tenant to be associated to the
  generated token. Both the tenantId and tenantName attributes are optional, but
  should not be specified together
- `tenantId` (String): The id of the tenant to be associated to the generated
  token. Both the `tenantId` and `tenantName` attributes are optional, but
  should not be specified together

The `onSuccess` callback will receive auth token info as the first argument.


## ObjectStorageAPI

A new `ObjectStorageAPI` can be instantiated using the following constructor:

```javascript
ObjectStorageAPI(url[, options])
```

- `url` is the url of the Object Storage server
- `options`:
    - `token` (String): is the token to use by default for authenticating
      requests to the Object Storage server

All the method of `ObjectStorageAPI` support at least the following option:

- `token` (String): is the token to used for authenticating the request

and the following callbacks:

- `onSuccess` is called when the request finishes successfully. The parameters
  passed to this callback depends on the invoked method.
- `onFailure` is called when the request finish with errors
- `onComplete` is called when the request finish regardless of whether the
  request is successful or not


### createContainer

Creates a container in which other containers and objects can be stored.

```javascript
createContainer(container[, options])
```

- `container` is the name of the container to create


### listContainer

Returns a list of the contents of a container.

```javascript
listContainer(container[, options])
```

- `container` is the name of the container to list


### deleteContainer

Deletes a specified container from the storage system.

```javascript
deleteContainer(container[, options])
```

- `container` is the name of the container to delete


### getFile

Retrieves a specified object from the storage system.

```javascript
getFile(container, file_name[, options])
```

* `container` is the name of the container where the file is
* `file_name` is the name of the file to download

Extra options:

- `response_type` (String, default: "blob"): Valid values are all the supported
  by the `responseType` option (see the [request option section][request_options]
  for more details), except ""

[request_options]: ../widgetapi/widgetapi.md#request-options-general-options


### uploadFile

Stores a binary object in the specified location.

```javascript
uploadFile(container, file[, options])
```

- `container` is the name of the container where the file is going to be uploaded
- `file` is the content to be uploaded. Must be an instance of
  [`Blob`][JavaScript_Blob] or [`File`][JavaScript_File].

Extra options:

- `file_name`: name to use for uploading the file. This option is required when
  passing a `Blob` as the `file` argument. This option is not required when
  passing a `File` instance as the name is obtained from its `name` attribute.
  Anyway, the name passed with this options has precedence over the `name`
  attribute of the `File` instances.

[JavaScript_Blob]: https://developer.mozilla.org/en/docs/Web/API/Blob
[JavaScript_File]: https://developer.mozilla.org/en/docs/Web/API/File


### deleteFile

Deletes a specified object from the storage system.

```javascript
deleteFile(container, file_name[, options])
```

* `container` is the name of the container where the file is going to be deleted
* `file_name` is the name of the file to delete
