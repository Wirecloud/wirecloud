このドキュメントは、WireCloud が提供する NGSI API のリファレンス・ドキュメントです。この API を使用できるようにする
には、この API の要件をウィジェット/オペレータのディスクリプション・ファイルに追加する必要があります。この API
の使用方法に関する詳細なドキュメント、および例については、"[Orion Context Brokerの使用](3.2.1_Using Orion Context)"
のチュートリアルを参照してください。

## ライブラリで使用されるデータ・タイプ

-   **Entity** タイプは、エンティティを参照するために使用されます。このタイプは、以下のフィールドで構成された
   オブジェクトとして定義されます :

    -   `id` は、エンティティの id を持つ文字列です。このフィールドでパターンを使用できます
    -   `isPatternid` は、フィールドに正規表現パターンが含まれているかどうかを示すブール値です
        (_オプション・フィールド_)
    -   `type` は、**Entity** のタイプです (_オプション・フィールド_)

-   **Attribute** タイプは、属性を参照するために使用されます。このタイプは、以下のフィールドで構成されたオブジェクト
    として定義されます :

    -   `name` は、 属性の名前です
    -   `type` は、**Attribute** のタイプです (_オプション・フィールド_)

-   **Duration** タイプは、は時間間隔を記述するために使用され、<http://books.xmlschemata.org/relaxng/ch19-77073.html>
   で定義されたフォーマットに従った文字列として定義されます

-   **Condition** タイプは、通知をトリガする条件を宣言するために使用されます。このタイプは、以下のフィールドで
    構成されたオブジェクトとして定義されます :

    -   `type` は、`ONTIMEINTERVAL` か` ONCHANGE` を含む文字列です
    -   `values` は、 文字列の配列。タイプ。フィールドの値によって異なります :
        -   `ONTIMEINTERVAL` : 正確に1つの値が存在し、通知間の時間間隔を表すべきものです
        -   `ONCHANGE` : この要素は、変更のために監視されるコンテキスト属性の名前を含むべきです

-   **MetadataValue** タイプは、メタデータを属性に割り当てるために使用されます。このタイプは、以下のフィールドで
    構成されたオブジェクトとして定義されます :

    -   `name` は、属性メタデータの名前です
    -   `type` は、属性メタデータのタイプです
    -   `value` は、属性メタデータに割り当てる値です

-   **AttributeValue** タイプは、属性に値を割り当てるために使用されます。このタイプは、以下のフィールドで
    構成されたオブジェクトとして定義されます :

    -   `name` は、属性の名前です
    -   `type` は、属性のタイプです (_オプション・フィールド_)
    -   `contextValue` は、属性に割り当てる値です。
    -   `metadata` は、属性に関連付けられたメタデータです。このフィールドは **MetadataValue**
        配列として定義されています 

-   **AttributeUpdate** タイプは、コンテキスト更新を説明するために使用されます。このタイプは、以下のフィールドで
    構成されたオブジェクトとして定義されます :

    -   `entity` は、更新の影響を受けるエンティティです。このフィールドは **Entity** 配列として定義されます
        -   `attributes` は、エンティティの属性の新しい値です。このフィールドは **AttributeValue** 配列として
             定義されます 

-   **AttributeDeletion** タイプは、エンティティからの属性の削除を記述するために使用されます。このタイプは、
    以下のフィールドで構成されたオブジェクトとして定義されます :

        -   `entity` は、更新の影響を受けるエンティティです。このフィールドは **Entity** 配列として定義されます 
        -   `attributes` は、エンティティの属性の新しい値です。このフィールドは **AttributeValue** 配列として
            定義されます。このフィールドに、`null` または 空の配列を使用すると、エンティティは完全に削除されます


## NGSI.Connection

新しい `NGSI.Connection` は、次のコンストラクタを使用して、インスタンス化できます :

```javascript
NGSI.Connection(url[, options]);
```

-   `url` (String): Orion Pub/Sub Context Broker インスタンスの URL です
-   `options` (Object; default `null`): 余分なオプションが必要ない場合、このパラメータは `null` になることがあります。
    現在サポートされているオプションは :
	-   `ngsi_proxy_url` (String; default `null`): サブスクリプションに使用される NGSI プロキシの URL
	-   `request_headers` (Object; default `null`): ヘッダ名を表すプロパティを持つ、一連のキーと値のペア。
             これらの余分なヘッダは、Context Broker にリクエストを行うときに使用されます
	-   `use_user_fiware_token` (Boolean; default: `false`): IdM システムから取得した現在のユーザ認証トークンを
            使用します

**使用例 :**

このコードでは、FIWARE Lab の NGSI プロキシを通じて、サブスクリプションをサポートし、WireCloud  にログインしているユーザの資格情報を使用して接続を作成します :

```javascript
var connection = new NGSI.Connection("http://orion.lab.fiware.org:1026/", {
    ngsi_proxy_url: "https://ngsiproxy.lab.fiware.org",
    use_user_fiware_token: true
});
```

このコードは、Context Broker  によって提供されるマルチテナンシー・サポートを利用するために `FIWARE-Service` ヘッダを使用して接続を作成します。

```javascript
var connection = new NGSI.Connection("http://<mi_context_broker_ip>:1026/", {
    request_headers: {
        "FIWARE-Service": "fiwareiot"
    }
});
```


### コールバック・オプション

`NGSI.Connection` すべてのメソッドは、少なくとも以下のコールバックをサポートします :

-   `onSuccess` は、リクエストが正常に終了すると呼び出されます
-   `onFailure` は、リクエストがエラーで終了したときに呼び出されます
-   `onComplete` は、リクエストが成功したかどうかにかかわらずリクエストが終了したときに呼び出されます


### `createRegistration`

NGSI サーバにコンテキスト情報 (エンティティと属性) をレジストレーションします

```javascript
createRegistration(entities, attributes, duration, providingApplication[, options]);
```

-   `entities` は、レジストレーションしようとしているエンティティのリストです
-   `attributes` は、エンティティの前のリストに割り当てられる **Attributes** のリストです
-   `duration` は、このレジストレーションの期間 (**Duration**)です
-   `providingApplication` は、 このレジストレーションが属しているアプリケーションの URI です

`onSuccess` は、コールバックは、次のフィールドを持つオブジェクトを受け取ります :

-   `registrationId` は、最後に割り当てられた id です
-   `duration` は、このレジストレーションの最終的な割り当て期間です

**使用例 :**

```javascript
connection.createRegistration(
    [{type: "Technician", id: "entity1"}],
    [{name: "attr1", type: "string"}, {name: "attr2"}, {name: "attr3", type: "number"}],
    "PT24H",
    "http://app.example.com/",
    {
        onSuccess: function(data) {
            //data.subscriptionId
        }
    }
)
```


### `updateRegistration`

特定のレジストレーションを更新します。

```javascript
updateRegistration(entities, attributes, duration, providingApplication, options);
```

-   `regId` は、 更新するレジストレーションの id です
-   `entities` は、以前に確立されたものを置き換える **Entities** のリストです
-   `attributes` は、エンティティの提供されたリストに割り当てられる **Attributes** のリストです
-   `duration` は、`regId` によって識別されたレジストレーションの新しい期間です
-   `providingApplication` は、 レジストレーションの providingApplication プロパティの新しい値です

`onSuccess` は、コールバックは、次のフィールドを持つオブジェクトを受け取ります :

-   `registrationId` は、レジストレーションの id　です
-   `duration` は、このレジストレーションの最終的な割り当て期間です

**使用例 :**

```javascript
connection.updateRegistration(
    "167",
    [{type: "Technician", id: "entity1"}],
    [{name: "attr1", type: "string"}, {name: "attr2"}],
    "PT24H",
    "http://app.example.com/"
);
```


### `cancelRegistration`

特定のレジストレーションを取り消したり、削除したりします。

```javascript
cancelRegistration(regId[, options]);
```

-   `regId` は、キャンセルするレジストレーションの id です

**使用例 :**

```javascript
connection.cancelRegistration("167", {
    onSuccess: function() {
        // Registration cancelled successfully
    }
});
```


### `discoverAvailability`

NGSI サーバでコンテキスト情報のレジストレーションを検出します。

```javascript
discoverAvailability(entities, attributeNames[, options]);
```

-   `entities` は、クエリされる **Entities** のリストです
-   `attributeNames` は、クエリされる属性名のリストです。このパラメータはオプションであり、したがって、`null`
    は有効な値です

`onSuccess` コールバックは、最初のパラメータとしてクエリの要件を満たすレジストレーションで配列を受け取ることになります :

**使用例 :**

```javascript
connection.discoverAvailability(
    [
        {type: "Technician", id: "entity1"},
        {type: "Van", id: ".*", isPattern: true},
    ],
    null,
    {
        onSuccess: function(registrations) {
            ...
        }
    }
);
```


### `query`

コンテキスト情報をクエリします。その情報はページネーション を使用して返されます (サポートされているオプションを参照)。
`details` オプションの使用を推奨します。このオプションは現在デフォルトでは無効になっていますが、WireCloud
の次のバージョンではデフォルトで有効になっているはずです。

```javascript
query(entities, attributeNames[, options]);
```

-   `entities` は、クエリする **Entities** のリスト
-   `attributeNames` は、クエリする属性名のリストです。すべての属性を取得するために `null` を使用します

この `query` メソッドは他の追加オプションをサポートしています :

-   `flat` (Boolean; default: `false`): このオプションは、返されるデータを表すために使用されるデータ構造を簡素化する
    ために使用されます
-   `limit` (Number; default: 20): このオプションを使用すると、サーバから受信するエンティティの最大数を指定できます
-   `offset` (Number; default: 0): 最初に指定された数の要素をスキップすることができます
-   `details` (Boolean; default: `false`): サーバが要求に関するより詳細な情報を返すようにします。現在、これらの詳細は
    ページネーションに関連しています

**使用例 :**

```javascript
connection.query([
        {type: "Technician", id: ".*", isPattern: true}
    ],
    null,
    {
        limit: 100,
        offset: 200,
        details: true
        onSuccess: function(data, details) {
            ...
        }
    }
);
```

`flat` が `false` のときに、これは、`onSuccess` コールバックに渡されるデータ・パラメータの値です :

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

`flat` が `ture` のときに、これは、データ・パラメータの値です :

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

コンテキスト情報を更新します。

```javascript
updateAttributes(update[, options]);
```

-   `update` は、**AttributeUpdates** のリスト

`onSuccess` コールバックは、レスポンスを持つ配列と受け取られなかった配列を、それぞれ1番目と2番目のパラメータとして
受け取ります。

**使用例 :**

```javascript
connection.updateAttributes([
        {
            "entity": {type: "Technician", id: "entity1"},
            "attributes": [
                {name: "mobile_phone", type: "string", contextValue: "0034223456789"},
                {name: "attr2", contextValue: "value"},
                {name: "attr3", contextValue: 5}
            ]
        }
    ], {
        onSuccess: function(data) {
        }
    }
);
```


### `addAttributes`

エンティティ属性を追加/更新します。この操作は、存在しないエンティティに属性を作成します。これに加えて、
存在しない場合、このオペレーションによってエンティティも作成されます。

```javascript
addAttributes(toAdd[, options]);
```

-   `toAdd` は、**AttributeUpdates** のリスト

`onSuccess` コールバックは、レスポンスを持つ配列と受け入れられなかった配列を、それぞれ1番目と2番目のパラメータとして
受け取ります。

**使用例 :**

```javascript
connection.addAttributes([
        {
            "entity": {type: "Technician", id: "entity1"},
            "attributes": [
                {"name": "new_attribute", "type": "string", "contextValue": "value"}
            ]
        }
    ], {
        onSuccess: function(data, partial_errors) {
        }
    }
);
```


### `deleteAttributes`

エンティティから属性を削除します。このメソッドは、Context Broker からエンティティを削除するためにも使用できます。

```javascript
deleteAttributes(toDelete[, options]);
```

-   `toDelete` は、**AttributeDeletion** のリスト

`onSuccess` コールバックは、レスポンスを持つ配列と受け取られなかった配列を、それぞれ第1と第2のパラメータとして
受け取ります。

**使用例 (`Madrid` エンティティ から `position` 属性を削除) :**

```javascript
connection.deleteAttributes([
        {
            "entity": {type: "City", id: "Madrid"},
            "attributes": {
                "name": "position",
                "type": "coords"
            }
        }
    ], {
        onSuccess: function(data, partial_errors) {
        }
    }
);
```

**使用例 (Context Broker から `Madrid` を削除) :** 

```javascript
connection.deleteAttributes([
        {
            "entity": {type: "City", id: "Madrid"}
        }
    ], {
        onSuccess: function(data, partial_errors) {
        }
    }
);
```


### `createSubscription`

コンテキスト情報の変更をサブスクライブします。

```javascript
createSubscription(entities, attributeNames, duration, throttling, conditions, options);
```

-   `entities` は、このサブスクリプションでクエリする _Entities_ のリストです
-   `attributeNames` は、このサブスクリプションでクエリする属性名のリストです。すべての属性を取得するために `null`
    を使用します
-   `duration` は、このサブスクリプションの期間 (**Duration **) です
-   `throttling` は、通知間に提案された最小間隔です。この値は **Duration** タイプ を使用して指定する必要があります
スロットリング値を提供したくない場合は、`null ` を渡すこともできます
-   `conditions` は、提供された情報と `onNotify` コールバックへのその後の通知を使用して、クエリをトリガする条件
    (**Conditions**)のリストです

このメソッドは、新しいタイプのコールバック `onNotify` をサポートします。このコールバックは必須であり、URL
または関数のどちらでもかまいません。後者の場合、NGSI プロキシを使用して、NGSI Connection を作成し、NGSI
サーバからの通知があるたびに呼び出されます。

`onNotify` コールバック関数の最初のパラメータは、レスポンス・データを持つオブジェクトになります。

これに加えて、`createSubscription` メソッドは追加のオプションをサポートしています : 

-   `flat` (ブール;デフォルト : false) : このオプションは、返されるデータを表すために使用されるデータ構造を
    簡素化するために使用されます

**使用例 :**

```javascript
connection.createSubscription([
        {type: "Technician", id: "tech*", isPattern: true},
        {type: "Van", id: "van1"},
    ],
    null,
    "PT24H",
    null,
    [{type: "ONCHANGE", condValues: ["position"]}],
    {
        onNotify: function(data) {
            // called when a notification arrives
        },
        onSuccess: function(data) {
            // subscription created successfully
            // data.subscriptionId contains the id associated with the created subscription
        }
    }
);
```

### `updateSubscription`

コンテキストのサブスクリプションを更新します。

```javascript
updateSubscription(subId, duration, throttling, conditions[, options]);
```

-   `subId` は、 キャンセルするコンテキストのサブスクリプションの id です。
-   `duration` は、このサブスクリプションの期間 (**Duration**)です
-   `throttling` は、通知間に提案された最小間隔です。この値は **Duration** タイプを使用して指定する必要があります。
    このパラメータは `null` を受け付けるオプションです。この場合、サブスクリプションのスロットリング設定は
    更新されません
-   `conditions` は、提供された情報と `onNotify` コールバックへのその後の通知を使用してクエリをトリガする条件の
    リストです。このパラメータはnullを受け入れるオプションです。この場合、サブスクリプションの条件設定は更新されません

**使用例 :**

```javascript
connection.updateSubscription("sub1",
    "PT20H",
    null,
    null,
    {
        onSuccess: function(response_data) {
            // subscription updated successfully
        }
    }
);
```


### `cancelSubscription`

コンテキストのサブスクリプションをキャンセルまたは削除します。

```javascript
cancelSubscription(subId[, options]);
```

-   `subId` は、キャンセルするコンテキスト・サブスクリプションの id です。

**使用例 :**

```javascript
connection.cancelSubscription("sub1",
    {
        onSuccess: function(data) {
            // Subscription canceled successfully
            // data.subscriptionId should be equal to "sub1"
        }
    }
);
```


### `getAvailableTypes`

使用されているコンテキスト・タイプについての情報を取得します。この情報は、現在、タイプ名とそのタイプで使用される属性
で構成されます。このオペレーションによって戻される属性セットは、そのタイプに属する各エンティティで使用される属性の
和集合です。

```javascript
getAvailableTypes(options);
```

`getAvailableTypes` メソッドは特別なオプションをサポートしています : 

-   `limit` (Number; default: 20): このオプションを使用すると、サーバから受信するエンティティの最大数を指定できます
-   `offset` (Number; default: 0): 最初に指定された数の要素をスキップすることができます
-   `details` (Boolean; default: `true`): サーバがリクエストに関するより詳細な情報を返すようにします。
    現在、これらの詳細はページネーションに関連しています

**使用例 :**

```javascript
connection.getAvailableTypes({
    onSuccess: function(types, details) {
        // The types parameter contains the information
        // about the available types, see next slide for
        // more info
    }
});
```

`types` パラメータの例 : 

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

具体的なエンティティ・タイプについての情報を取得します。この情報は、現在、タイプ名とそのタイプで使用される属性で
構成されます。このオペレーションによって戻される属性セットは、そのタイプに属する各エンティティで使用される属性の
和集合です。

```javascript
getTypeInfo(type, options);
```

**使用例 :**

```javascript
connection.getTypeInfo("Room", {
    onSuccess: function(type_info) {
        // The type_info parameter contains the information
        // about the Room type, see next slide for more info
    }
});
```

`type_info` パラメータの例 : 

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
