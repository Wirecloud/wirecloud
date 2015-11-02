This document is the reference documentation of the NGSI API provided by
WireCloud. For being able to use this API you have to add a requirement on this
API thought the description file of the widget/operator. See the [Using Orion
Context Broker](3.2.1_Using Orion Context) tutorial for more detailed
documentation (and examples) on how to use this API.

## Data types used by the library

- The **Entity** type is used to reference entities. This type is defined as an
  object composed of the following fields:
    - `id` is a string with the id of the entity. Some times you will be able to use
      patterns in this field.
    - `isPattern` is a boolean indicating whether the id field contains a
      regular expression pattern. *(Optional field)*
    - `type` is the type of the **Entity**. *(Optional field)*

- The **Attribute** type is used to reference attributes. This type is defined
  as an object composed of the following fields:
    * `name` is the name of the attribute
    * `type` is the type of the **Attribute**. *(Optional field)*

- The **Duration** type is used to describe time intervals and defined as a
  string following the format defined at
  http://books.xmlschemata.org/relaxng/ch19-77073.html.

- The **Condition** type is used to declare the condition that will trigger
  notifications. This type is defined as an object composed of the following
  fields:
    - `type` is an string containing `ONTIMEINTERVAL` or `ONCHANGE`
    - `values`: array of string. Depends on the value of the type field:
        - `ONTIMEINTERVAL`: exactly one value SHALL be present and SHALL
          represent the time interval between notifications
        - `ONCHANGE`: this element SHALL contain the name(s) of the Context
          Attributes to be monitored for changes

- **MetadataValue** type is used to assign metadata to attributes. This type is
  defined as an object composed of the following fields:
    - `name` is the name of the attribute metadata
    - `type` is the type of the attribute metadata
    - `value` is the value to assign to the attribute metadata

- The **AttributeValue** type is used to assign values to attributes. This type
  is defined as an object composed of the following fields:
    - `name` is the name of the attribute
    - `type` is the type of the attribute. *(Optional field)*
    - `contextValue` is the value to assign to the attribute
    - `metadata` is the metadata associated with the attribute. This field is
      defined as a **MetadataValue** array

- The **AttributeUpdate** type is used to describe a context update. This type
  is defined as an object composed of the following fields:
    - `entity` is the entity affected by the update. This field is defined as
      an **Entity** array
	- `attributes` is the new values for the attributes of the entity. This
      field is defined as an **AttributeValue** array

- The **AttributeDeletion** type is used to describe the deletion of attributes
  from an entity. This type is defined as an object composed of the following
  fields:

	- `entity` is the entity affected by the update. This field is defined as
      an **Entity** array
	- `attributes` is the new values for the attributes of the entity. This
      field is defined as an **AttributeValue** array. If you use `null` or an
      empty array for this field, the entity will be entirely removed.


## NGSI.Connection

A new `NGSI.Connection` can be instantiated using the following constructor:

```javascript
NGSI.Connection(url[, options])
```

- `url` (String): is the url of the Orion Pub/Sub Context Broker instance
- `options` (Object; default `null`): This parameter may be `null` if no extra
  option is needed. Current supported options are:
	- `ngsi_proxy_url` (String; default `null`): URL of the NGSI proxy used for
      subscriptions
	- `request_headers` (Object; default `null`): A set of key-value pairs, with
      properties representing header names. These extra headers will be use when
      making request to the context broker
	- `use_user_fiware_token` (Boolean; default: `false`): Use current user
      authentication token retrieved from the IdM system

**Usage example:**

This code creates a connection using the credentials of the user logged in
WireCloud and supporting subcriptions through the FIWARE Lab's NGSI proxy:

```javascript
var connection = new NGSI.Connection("http://orion.lab.fiware.org:1026/", {
    ngsi_proxy_url: "https://ngsiproxy.lab.fiware.org",
    use_user_fiware_token: true
});
```

This code creates a connection using the `FIWARE-Service` header to make use of
the multitenancy support provided by the context broker:

```javascript
var connection = new NGSI.Connection("http://<mi_context_broker_ip>:1026/", {
    request_headers: {
        "FIWARE-Service": "fiwareiot"
    }
});
```


### Callback options

All the method of `NGSI.Connection` support at least the following callbacks:

- `onSuccess` is called when the request finishes successfully
- `onFailure` is called when the request finishes with errors
- `onComplete` is called when the request finishes regardless of whether the
  request is successful or not


### `createRegistration`

Register context information (entities and attributes) in the NGSI server

```javascript
createRegistration(entities, attributes, duration, providingApplication[, options])
```

- `entities` is the list of **Entities** that are going to be registered
- `attributes` is a list of the **Attributes** that are going to be assigned to
  the previous list of entities
- `duration` is the **Duration** for this registration
- `providingApplication` is the URI of the application to which this
  registration belongs to

The `onSuccess` callback will receive an object with the following fields:

- `registrationId` is the final assigned id
- `duration` is the final assigned duration for this registration

**Usage example:**

```javascript
connection.createRegistration([
        {type: 'Technician', id: 'entity1'}
    ], [
        {name: 'attr1', type: 'string'},
        {name: 'attr2'},
        {name: 'attr3', type: 'number'}
    ],
    'PT24H',
    'http://app.example.com/',
    {
        onSuccess: function (data) {
            //data.subscriptionId
        }
    }
)
```


### `updateRegistration`

Updates a particular registration.

```javascript
updateRegistration(entities, attributes, duration, providingApplication, options)
```

- `regId` is the id of the registration to update
- `entities` is the list of **Entities** that its going to replace the previous established one
- `attributes` is a list of the **Attributes** that are going to be assigned to the provided list of entities
- `duration` is the new **Duration** for the registration identified by `regId`
- `providingApplication` is the new value for the providingApplication property of the registration

The `onSuccess` callback will receive an object with the following fields:

- `registrationId` is the id of the registration
- `duration` is the final assigned duration for this registration

**Example usage:**

```javascript
connection.updateRegistration("167",
    [
        {type: 'Technician', id: 'entity1'}
    ],
    [
        {name: 'attr1', type: 'string'},
        {name: 'attr2'}
    ],
    'PT24H',
    'http://app.example.com/'
);
```


### `cancelRegistration`

Cancels or deletes a particular registration.

```javascript
cancelRegistration(regId[, options])
```

- `regId` is the id of the registration to cancel

**Example usage:**

```javascript
connection.cancelRegistration("167", {
    onSuccess: function () {
        // Registration cancelled successfully
    }
});
```


### `discoverAvailability`

Discover context information registrations in the NGSI server.

```javascript
discoverAvailability(entities, attributeNames[, options])
```

- `entities` is the list of **Entities** that are going to be queried
- `attributeNames` is the list of attribute names that are going to be queried.
  This parameter is optional and thus `null` is a valid value

The `onSuccess` callback will receive an array with the registrations meeting
the query requirements as the first parameter.

**Example usage:**

```javascript
connection.discoverAvailability([
        {type: 'Technician', id: 'entity1'},
        {type: 'Van', id: '.*', isPattern: true},
    ],
    null,
    {
        onSuccess: function (registrations) {
            ...
        }
    }
);
```


### `query`

Query for context information. That information is returned using pagination
(see supported options), so its very recommended the use of the `details`
option. This option is currently disabled by default, but expect it to be
enabled by default in next versions of WireCloud.

```javascript
query(entities, attributeNames[, options])
```

- `entities` is the list of **Entities** to query
- `attributeNames` is the list of attribute names to query. Use `null` for
  retrieving all the attributes

The `query` method supports other extra options:

- `flat` (Boolean; default: `false`): This options is used for simplifying the
  data structure used for representing the returned data
- `limit` (Number; default: 20): This option allow you to specify the maximum
  number of entities you want to receive from the server
- `offset` (Number; default: 0): Allows you to skip a given number of elements
  at the beginning
- `details` (Boolean; default: `false`): Makes the server return more detailed
  information about the request (currently those details are related to the
  pagination)

**Example usage:**

```javascript
connection.query([
        {type: 'Technician', id: '.*', isPattern: true}
    ],
    null,
    {
        limit: 100,
        offset: 200,
        details: true
        onSuccess: function (data, details) {
            ...
        }
    }
);
```

This is the value of the data parameter passed to the `onSuccess` callback when using the `flat` is `false`:

```json
[
    {
        "entity": {
            "id": "van1",
            "type": "Van"
        },
        "attributes": [
            {
                "name": "current_position",
                "type": "coordinates",
                "contextValue": "43.47557, -3.8048315",
                "metadata": [
                    {"name": "location", "type": "string", "value": "WGS84"}
                ]
            }
        ]
    },
    {
        "entity": {
            "id": "van2",
            "type": "Van"
        },
        "attributes": [
            {
                "name": "current_position",
                "type": "coordinates",
                "contextValue": "43.47258, -3.8026643",
                "metadata": [
                    {"name": "location", "type": "string", "value": "WGS84"}
                ]
            }
        ]
    },
    {
        "entity": {
            "id": "van3",
            "type": "Van"
        },
        "attributes": [
            {
                "name": "current_position",
                "type": "coordinates",
                "contextValue": "43.47866, -3.7991238",
                "metadata": [
                    {"name": "location", "type": "string", "value": "WGS84"}
                ]
            }
        ]
    },
    {
        "entity": {
            "id": "van4",
            "type": "Van"
        },
        "attributes": [
            {
                "name": "current_position",
                "type": "coordinates",
                "contextValue": "43.471214, -3.7994885",
                "metadata": [
                    {"name": "location", "type": "string", "value": "WGS84"}
                ]
            }
        ]
    }
]
```

This is the value of the data parameter when `flat` is `true`:

```json
{
    "van1": {
        "id": "van1",
        "type": "Van",
        "current_position": "43.47557, -3.8048315"
    },
    "van2": {
        "id": "van2",
        "type": "Van",
        "current_position": "43.47258, -3.8026643"
    },
    "van3": {
        "id": "van3",
        "type": "Van",
        "current_position": "43.47866, -3.7991238"
    },
    "van4": {
        "id": "van4",
        "type": "Van",
        "current_position": "43.471214, -3.7994885"
    }
}
```


### `updateAttributes`

Update context information.

```javascript
updateAttributes(update[, options])
```

* `update` a list of **AttributeUpdates**

The `onSuccess` callback will receive an array with the response and a array
with the not accepted updates as the first and the second parameter
respectively.

**Example usage:**

```javascript
connection.updateAttributes([
        {
            'entity': {type: 'Technician', id: 'entity1'},
            'attributes': [
                {name: 'mobile_phone', type: 'string', contextValue: '0034223456789'},
                {name: 'attr2', contextValue: 'value'},
                {name: 'attr3', contextValue: 5}
            ]
        }
    ], {
        onSuccess: function (data) {
        }
    }
);
```


### `addAttributes`

Add/update entity attributes. This operation will create the attribute on those entities where they doesn't exist. In addition to this, this operation will also create entities if they doesn't exist.

```javascript
addAttributes(toAdd[, options])
```

* `toAdd` a list of **AttributeUpdates**

The `onSuccess` callback will receive an array with the response and a array
with the not accepted updates as the first and the second parameter
respectively.

**Example usage:**

```javascript
connection.addAttributes([
        {
            'entity': {type: 'Technician', id: 'entity1'},
            'attributes': [
                {'name': 'new_attribute', 'type': 'string', 'contextValue': 'value'}
            ]
        }
    ], {
        onSuccess: function (data, partial_errors) {
        }
    }
);
```


### `deleteAttributes`

Delete attributes form entities. This method can be use also for removing
entities from the context broker.

```javascript
deleteAttributes(toDelete[, options])
```

* `toDelete` a list of **AttributeDeletion**

The `onSuccess` callback will receive an array with the response and a array
with the not accepted updates as the first and the second parameter
respectively.

**Example usage (removing the `position` attribute from the `Madrid` entity):**

```javascript
connection.deleteAttributes([
        {
            'entity': {type: 'City', id: 'Madrid'},
            'attributes': {
                'name': 'position',
                'type': 'coords'
            }
        }
    ], {
        onSuccess: function (data, partial_errors) {
        }
    }
);
```

**Example usage (removing `Madrid` from the context broker):**

```javascript
connection.deleteAttributes([
        {
            'entity': {type: 'City', id: 'Madrid'}
        }
    ], {
        onSuccess: function (data, partial_errors) {
        }
    }
);
```


### `createSubscription`

Subscribe to changes in the context information.

```javascript
createSubscription(entities, attributeNames, duration, throttling, conditions, options)
```

- `entities` is the list of **Entities** to query in this subscription
- `attributeNames` is the list of attribute names to query in this subscription.
  Use `null` for retrieving all the attributes
- `duration` is the **Duration** of this subscription
- `throttling` is the proposed minimum interval between notifications. This
  value must be provided using the **Duration** type. You can also pass `null`
  if you don't want to provide a throttling value
- `conditions` is a list of **Conditions** that will trigger queries using the
  provided information and their subsequent notifications to the `onNotify`
  callback

This method, supports a new type of callback: `onNotify`. This callback is
required and can be either an URL or a function. In the later case, the NGSI
Connection must be created using a NGSI proxy and will be called every time a
notification comes from the NGSI server.

The first parameter of a `onNotify` callback function will be an object with the
response data.

In addition to this, the `createSubscription` method supports an extra option:

* `flat` (Boolean; default: `false`): This options is used for simplifying the
  data structure used for representing the returned data

**Example usage:**

```javascript
connection.createSubscription([
        {type: 'Technician', id: 'tech*', isPattern: true},
        {type: 'Van', id: 'van1'},
    ],
    null,
    'PT24H',
    null,
    [{type: 'ONCHANGE', condValues: ['position']}],
    {
        onNotify: function (data) {
            // called when a notification arrives
        },
        onSuccess: function (data) {
            // subscription created successfully
            // data.subscriptionId contains the id associated with the created subscription
        }
    }
);
```

### `updateSubscription`

Update context subscription.

```javascript
updateSubscription(subId, duration, throttling, conditions[, options])
```

- `subId` is the id of the context subscription to cancel
- `duration` is the **Duration** of this subscription
- `throttling` is the proposed minimum interval between notifications. This
  value must be provided using the **Duration** type. This parameter is
  optional accepting `null`, in that case the throttling configuration of the
  subscription will not be updated
- `conditions` is a list of **Conditions** that will trigger queries using the
  provided information and their subsequent notifications to the `onNotify`
  callback. This parameter is optional accepting `null`, in that case the
  conditions configuration of the subscription will not be updated

**Example usage:**

```javascript
connection.updateSubscription('sub1',
    'PT20H',
    null,
    null,
    {
        onSuccess: function (response_data) {
            // subscription updated successfully
        }
    }
);
```


### `cancelSubscription`

Cancels or deletes context subscription.

```javascript
cancelSubscription(subId[, options])
```

- `subId` is the id of the context subscription to cancel

**Example usage:**

```javascript
connection.cancelSubscription('sub1',
    {
        onSuccess: function (data) {
            // Subscription canceled successfully
            // data.subscriptionId should be equal to 'sub1'
        }
    }
);
```


### `getAvailableTypes`

Get info about about the used context types. This information is currently
composed of the type name and the attributes used with that type (the attribute
set returned by this operation is the union of the attributes used in each of the
entities belonging to that type).

```javascript
getAvailableTypes(options)
```

The `getAvailableTypes` method supports an extra option:

- `limit` (Number; default: 20): This option allow you to specify the maximum
  number of entities you want to receive from the server
- `offset` (Number; default: 0): Allows you to skip a given number of elements
  at the beginning
- `details` (Boolean; default: `true`): Makes the server return more detailed
  information about the request (currently those details are related to the
  pagination)

**Example usage:**

```javascript
connection.getAvailableTypes({
    onSuccess: function (types, details) {
        // The types parameter contains the information
        // about the available types, see next slide for
        // more info
    }
});
```

`types` parameter example:

```json
[
    {
        "attributes": [
            "speed",
            "fuel",
            "temperature"
        ],
        "name": "Car"
    },
    {
        "attributes": [
            "pressure",
            "hummidity",
            "temperature"
        ],
        "name": "Room"
    }
]
```


### `getTypeInfo`

Get info about about a concrete entity type. This information is currently
composed of the type name and the attributes used with that type (the attribute
set returned by this operation is the union of the attributes used in each of the
entities belonging to that type).

```javascript
getTypeInfo(type, options)
```

**Example usage:**

```javascript
connection.getTypeInfo("Room", {
    onSuccess: function (type_info) {
        // The type_info parameter contains the information
        // about the Room type, see next slide for more info
    }
});
```

`type_info` parameter example:

```json
{
    "attributes": [
        "hummidity",
        "pressure",
        "temperature"
    ],
    "name": "Room"
}
```
