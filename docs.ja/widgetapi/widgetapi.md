# FIWAREアプリケーションマッシュアップ - Widget API 仕様

日付 : 2016年8月26日

このバージョン :

https://github.com/Wirecloud/wirecloud/tree/1.0.x/docs/widgetapi/

前のバージョン : 

https://github.com/Wirecloud/wirecloud/tree/0.9.x/docs/widgetapi/

最新バージョン : 

https://github.com/Wirecloud/wirecloud/tree/develop/docs/widgetapi/

## 編集者

-   Álvaro Arranz, Universidad Politécnica de Madrid

## 著作権

Copyright © 2012-2016 by Universidad Politécnica de Madrid

## ライセンス

この仕様書は、
[FIWARE Open Specification License (暗黙の特許ライセンス) ](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/FI-WARE_Open_Specification_Legal_Notice_%28implicit_patents_license%29)
の下でライセンスされています。

---

## 要約

Application Mashup GE は、さまざまな性質のために組み合わせられない2つの別々のAPIを提供しています。Widget API
(本書の対象) は JavaScript API であり、Application Mashup API は RESTful API です。Application Mashup RESTful API
は、次のリンクから入手できます :

http://wirecloud.github.io/wirecloud/restapi/latest/

Widget API は、ウィジェット/オペレータが Application Mashup GE  (ワイヤーリング、プレファレンス、コンテキスト情報、
ログなど)によって提供される機能にアクセスできるようにする JavaScript API です。他の機能の中でも、このAPI は、
ウィジェット/オペレータがリモートリソースにアクセスできるようにします (クロスドメイン・プロキシ経由で リモート
REST API にアクセスするなど)。

また、このドキュメントでは、FIWARE Application Mashup GE のリファレンス実装である WireCloud を使用してテスト
できるいくつかの例を示します。

## このドキュメントのステータス

これは進行中の作業であり、日々変化しています。利用可能な最新バージョンは、
<https://github.com/Wirecloud/wirecloud/tree/develop> で確認できます。あなたのコメントを <wirecloud@conwet.com>
に送ってください。

この仕様書は、
[FIWARE Open Specification License (暗黙の特許ライセンス)](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/FI-WARE_Open_Specification_Legal_Notice_%28implicit_patents_license%29)
の下でライセンスされています。

---

## Widget API

### MashupPlatform.http

このモジュールは、クロスドメイン・プロキシの使用をサポートするなど、HTTP リクエストを処理するいくつかの方法を
提供します。

現在、このモジュールは2つの方法で構成されています :

-   [`buildProxyURL`](#mashupplatformhttpbuildproxyurl-method)
-   [`makeRequest`](#mashupplatformhttpmakerequest-method)


#### `MashupPlatform.http.buildProxyURL` メソッド

このメソッドは、クロスドメイン間の問題を回避するのに適した URL を作成します。通常、Application Mashup Proxy
を使用して処理されますが、ブラウザがサポートしている場合は、アクセス制御リクエストヘッダを使用して処理することも
できます。必要な要件がすべて満たされている場合、この関数はプロキシを使用せずに URL を返します。

```javascript
MashupPlatform.http.buildProxyURL(url, options)
```

-   `url` (_required, string_): ターゲット URL
-   `options` (_optional, object_): リクエスト・オプションを持つオブジェクト (後述)

**使用例 :**

```javascript
var internal_url = "http://server.intranet.com/image/a.png";
var url = MashupPlatform.http.buildProxyURL(internal_url, {forceProxy: true});
var img = document.createElement("img");
img.src = url;
```


#### `MashupPlatform.http.makeRequest` メソッド

このメソッドは内部的に buildProxyURL メソッドを呼び出して、CORS リクエストを許可するブラウザに続く同じ起点ポリシーに
関連する問題を回避します。

```javascript
MashupPlatform.http.makeRequest(url, options)
```

-   `url` (_required, string_): リクエストを送信する URL
-   `options` (_optional, object_): リクエスト・オプションのリストを持つオブジェクト (後述)

このメソッドは、_Request_ オブジェクトを返します。

**使用例:**

```javascript
$("loading").show();
var request = MashupPlatform.http.makeRequest("http://api.example.com", {
    method: "POST",
    postBody: JSON.stringify({ key: value }),
    contentType: "application/json",
    onSuccess: function(response) {
        // Everything went ok
    },
    onFailure: function(response) {
        // Something went wrong
    },
    onComplete: function() {
        $("loading").hide();
    }
});
```


#### リクエスト・オプション : 一般オプション

-   `contentType` (_string_): リクエストの Content-Type ヘッダ。提供されていない場合は、`postBody` オプションの値から
    Content-Type ヘッダが推定されます。`postBody` 値が String の場合、デフォルトは `application/x-www-form-urlencoded`
    になります。`Content-Type` ヘッダの値を強制的に使用する場合は、このオプションを指定します
-   `encoding` (_string; default `UTF-8`_): リクエストの内容のエンコーディング。現状のまま残しておくのが最善ですが、
    奇妙なエンコーディングの問題が発生した場合は、これを調整する必要があります
-   `method` (_string; default `POST`_): リクエストに使用する HTTP メソッド
-   `responseType` (_string; default: ""_): レスポンス・タイプを変更するために設定できます。このオプションの有効な値は
   、"", "arraybuffer", "blob", "document", "json" と "text" です
-   `parameters` (_object_): リクエストのためのパラメータ。これは、`GET` メソッドのURLに、または `PUT` メソッドと
    `POST` メソッドを使用するときにリクエスト・ボディにエンコードされます
-   `postBody` (_`ArrayBufferView`, `Blob`, `Document`, `String`, `FormData`_): リクエスト・ボディとして使用する
    コンテンツ。通常は POST  と PUT リクエストを使用しますが、すべてのリクエストで使用することができます。
    提供されていない場合は、代わりに parameters オプションの内容が使用されます。最後に、パラメータがない場合、
    リクエストにはボディがありません
-   `requestHeaders` (_object_): ヘッダ名を表すプロパティを持つ、一連のキーと値のペア
-   `supportsAccessControl` (_boolean; default `false`_): ターゲットサーバが
    [Access Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS)
    ヘッダをサポートするかどうかを示します。したがって、可能な場合はクロスドメイン・プロキシを使用せずに
    リクエストします
-   `withCredentials` (_boolean; default `false`_): `Access-Control` クッキーや承認ヘッダなどの資格情報を使用して
    クロスサイト・リクエストを行う必要があるかどうかを示します。さらに、このフラグは、クッキーをレスポンスで
    無視する時を示すためにも使用されます。
-   `forceProxy` (_boolean; default `false`_): 渡された他のオプションに関係なく、プロキシを介してリクエストを
    送信します
-   `context` (_object; default `null`_): このパラメータとしてコールバックに渡す値。context が `null` の場合、
    コールバックの `this` パラメータはそのまま残されます


#### リクエスト・オプション : コールバック・オプション

-   `onAbort` (WireCloud 0.8.2 の新機能): `MashupPlatform.http.makeRequest()` によって返された、
    リクエスト・オブジェクトの `abort（）` メソッドが呼び出されたときに呼び出されます

-   `onSuccess`: リクエストが完了し、そのステータ・スコードが 2xy ファミリに属しているときに呼び出されます。
    これは、コード固有のコールバックが定義されている場合にはスキップされ、`onComplete` の前に発生します。
    レスポンス・オブジェクトを第1引数として受け取ります
-   `onFailure`: リクエストが完了し、ステータス・コードは存在しても、2xy ファミリにないときに呼び出されます。
    これは、コード固有のコールバックが定義されている場合にはスキップされ、`onComplete` の前に発生します。
    レスポンス・オブジェクトを第1引数として受け取ります
-   `onXYZ` (任意の HTTP ステータス・コードを表す XYZ): ステータス・コードがコールバック名で使用されたコードと
    完全に一致する場合、レスポンスが完了した直後に呼び出されます。`onSuccess` と `onFailure` の実行を防ぎます。
    `onComplete` の前に発生します。レスポンス・オブジェクトを第1引数として受け取ります
-   `onComplete`: リクエストのライフサイクルの最後にトリガされ、リクエストが完了した後、ステータス固有の
    コールバックが呼び出され、可能な自動ビヘイビアが処理されます。リクエスト中に何が起きたかにかかわらず、
    実行が保証されます。レスポンス・オブジェクトを第1引数として受け取ります
-   `onException`: `onXYZ`, `onSuccess`, `onFailure`, `onComplete` コールバックのいずれかを実行して例外が
    発生するたびにトリガされます。リクエストを第1引数として受け取り、例外オブジェクトを第2引数として受け取ります


#### リクエスト・オブジェクト

`MashupPlatform.http.makeRequest` メソッドによって返されたリクエスト・オブジェクトは、次の属性を提供します :

-   `method` (_string_): "GET", "POST", "PUT", "DELETE" など、リクエストによって使用される HTTP メソッド
-   `url` (_string_): リクエストが送信された最終的な URL

そして、次のメソッド :

-   `abort()`: すでにリクエストが送信されている場合は、リクエストを中止します


#### レスポンス・オブジェクト

`MashupPlatform.http.makeRequest` メソッドで使用されるコールバックに渡されるレスポンス・オブジェクトは、
次の属性を提供します :

-   `request` (_Request_): 現在のレスポンスのリクエスト
-   `status` (_number_): リクエストに対するレスポンスのステータス。これは HTTP の結果コードです
-   `statusText` (_string_): HTTP サーバから返されるレスポンス文字列。ステータスとは異なり、
    これにはレスポンス・メッセージのテキスト全体が含まれます
-   `response` (_`ArrayBuffer`, `Blob`, `Document`, *object*, `String`_): `responseType` に応じた
    レスポンス・エンティティ・ボディを `ArrayBuffer`, `Blob`, `String` として返します。リクエストが完了していない、
    または、成功しなかった、リクエストの `responseType` オプションが "" だった場合、これは `null` です
-   `responseText` (_string_): リクエストが失敗した場合、または、リクエストの `responseType` オプションが ""
    と異なる場合、text としてリクエストにレスポンスするか、または `null` です
-   `responseXML` (_Document_): リクエストが失敗した場合、または XML または HTML として解析できない場合、
    _Document_ としてのリクエストにレスポンスするか、または `null` です。レスポンスは、あたかも text/xml
    ストリームであるかのように解析されます。`responseType` が  "" と異なる場合、この属性は使用できません。


<a name="mashupplatform-log"></a>
### MashupPlatform.log

このモジュールには以下の定数が含まれています : 

-   **ERROR:** : エラーレベルを示すために使用します
-   **WARN:** : 警告レベルを示すために使用されます
-   **INFO:** : Infoレベルを示すために使用されます

これらの定数は、`MashupPlatform.widget.log` と `MashupPlatform.operator.log` メソッドを呼び出すときに使用できます。


### MashupPlatform.prefs

このモジュールは、マッシブル・アプリケーション・コンポーネントのディスクリプション・ファイル(`config.xml` ファイル)
で定義されたプレファレンスを管理するためのメソッドを提供します。

現在、このモジュールは3つの方法を提供しています : 

-   [`get`](#mashupplatformprefsget-method)
-   [`registerCallback`](#mashupplatformprefsregistercallback-method)
-   [`set`](#mashupplatformprefsset-method)

1つの例外 :

-   [`PreferenceDoesNotExistError`](#mashupplatformprefspreferencedoesnotexisterror-exception)


#### `MashupPlatform.prefs.get` メソッド

このメソッドは、プリファレンスの値を取得します。このメソッドによって返される値のタイプは、プリファレンスのタイプに
よって異なります。

```javascript
MashupPlatform.prefs.get(key)
```

-   `key` (required, string): `config.xml` ファイルに定義されているプリファレンスの名前

このメソッドは、次の例外を発生させる可能性があります :

-   `MashupPlatform.prefs.PreferenceDoesNotExistError`

**使用例 :**

```javascript
MashupPlatform.prefs.get("boolean-pref"); // true or false
MashupPlatform.prefs.get("number-prefs"); // a number value
MashupPlatform.prefs.get("text-prefs");   // a string value
```


#### `MashupPlatform.prefs.registerCallback` メソッド

このメソッドは、プリファレンスの変更を待機するコールバックを登録します。

```javascript
MashupPlatform.prefs.registerCallback(callback)
```

-   1つ以上のプレファレンスの変化が検出されたときに呼び出される `callback` 関数。このコールバックは、変更された
    プリファレンスとその新しい値を持つ Key-Value オブジェクトを受け取ります。

**使用例 :**

```javascript
MashupPlatform.prefs.registerCallback(function(new_values) {
    if ("some-pref" in new_values) {
        // some-pref has been changed
        // new_values["some-pref"] contains the new value
    }
});
```


#### `MashupPlatform.prefs.set` メソッド

このメソッドは、プレファレンスの値を設定します。

```javascript
MashupPlatform.prefs.set(key, value)
```

-   `key` (_required, string_): `config.xml` ファイルに定義されているプリファレンスの名前 
-   `value` (_required, any_): プリファレンスの新しい値。このパラメータの許容値は、プリファレンスのタイプに依存します

このメソッドは、次の例外を発生させる可能性があります :

-   `MashupPlatform.prefs.PreferenceDoesNotExistError`

**使用例 :**

```javascript
MashupPlatform.prefs.set("boolean-pref", true);
```


### `MashupPlatform.prefs.PreferenceDoesNotExistError` 例外

この例外は、プリファレンスが見つからない場合に発生します。

```javascript
MashupPlatform.prefs.PreferenceDoesNotExistError
```


### MashupPlatform.mashup

マッシュアップ・モジュールには1つの属性が含まれています :

-   [`context`](#mashupplatformmashupcontext-attribute)

次の方法があります :

-   [`addWidget`](#mashupplatformmashupaddwidget-method)
-   [`addOperator`](#mashupplatformmashupaddoperator-method)
-   [`createWorkspace`](#mashupplatformmashupcreateworkspace-method)
-   [`openWorkspace`](#mashupplatformmashupopenworkspace-method)
-   [`removeWorkspace`](#mashupplatformmashupremoveworkspace-method)


#### `MashupPlatform.mashup.context` 属性

この属性には、マッシュアップのコンテキスト・マネージャが含まれます。詳細については、
[コンテキスト・マネージャに関するドキュメント](#context-managers) を参照してください。

```javascript
MashupPlatform.mashup.context
```

**使用例 :**

```javascript
MashupPlatform.mashup.context.get("title");
```


<a name="mashupplatformmashupaddwidget-method"></a>
#### `MashupPlatform.mashup.addWidget` メソッド

> WireCloud 0.8.0 の新機能 / Widget API v2

このメソッドにより、ウィジェットおよびオペレータは、新しい一時的なウィジェットを現在のワークスペースに追加することが
できます。

このメソッドは、`DashboardManagement` 機能を使用する場合にのみ使用できます。

```javascript
MashupPlatform.mashup.addWidget(widget_ref, options);
```

-   `widget_ref` (_required, string_): 使用するウィジェットのid (ベンダー/名前/バージョン)
-   `options` (_optional, object_): 追加のオプションを持つオブジェクト

サポートされるオプション :

-   `title` (_string_): ウィジェットのタイトル。提供されていない場合、ウィジェットの説明で提供されるデフォルトの
    タイトルが使用されます
-   `permissions` (_object_): ウィジェットに適用する権限を持つオブジェクト。現在、次の権限が用意されています :
    `close`, `configure`, `minimize`, `move`, `resize` と `upgrade`
-   `preferences` (_object_): プレファレンスの初期設定を持つオブジェクト。指定されていない場合は、ウィジェットの
    デフォルト設定が使用されます
-   `properties` (_object_): プロパティの初期設定を持つオブジェクト。指定されていない場合は、ウィジェットの
    デフォルト設定が使用されます
-   `refposition` (_`ClientRect`_): 新しいウィジェットを配置するためのリファレンスとして使用する要素の位置。
    [`getBoundingClientRect`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
    メソッドを使用してそのようなオブジェクトを取得することができます。このオプションは、オペレータからの
    `addWidget` メソッドを使用する場合は使用できません
-   `top` (_string, default: `0px`_): このオプションは、要素の上端とダッシュボードの上端の間の距離を指定します。
    refpositionオプションに値を指定すると、この値は無視されます
-   `left` (_string, default: `0px`_): このオプションは、エレメントの左マージン・エッジとダッシュボードの上端との間の
    距離を指定します。`refposition` オプションに値を指定すると、この値は無視されます
-   `width` (_string, default: `null`_): このオプションは、ウィジェットの幅を指定します。指定されていない場合、
    デフォルトの幅が使用されます
-   `height` (_string, default: `null`_): このオプションは、ウィジェットの高さを指定します。指定されていない場合、
    デフォルトの高さが使用されます


**使用例 :**

```javascript
var widget = MashupPlatform.mashup.addWidget("CoNWeT/kurento-one2one/1.0", {
    "permissions": {
        "close": false,
        "configure": false
    },
    "preferences": {
        "stand-alone": {
            "value": false
        }
    },
    "top": "0px",
    "left": "66%"
});
```


<a name="mashupplatformmashupaddoperator-method"></a>
#### `MashupPlatform.mashup.addOperator` メソッド

> WireCloud 0.8.0 の新機能 / Widget API v2

このメソッドにより、ウィジェットおよびオペレータは、新しい一時的なオペレータを現在の作業領域に追加できます。

このメソッドは、`DashboardManagement` 機能を使用する場合にのみ使用できます。

```javascript
MashupPlatform.mashup.addOperator(operator_ref, options);
```

-   `operator_ref` (_required, string_): 使用するオペレータのid (ベンダー/名前/バージョン)
-   `options` (_optional, object_): 追加のオプションを持つオブジェクト

サポートされるオプション :

-   `permissions` (_object_): オペレータに適用する権限を持つオブジェクト。現在、以下の権限が利用できます :
    `close`,`configure` および `upgrade`
-   `preferences` (_object_): プレファレンスの初期設定を持つオブジェクト。指定されていない場合は、オペレータの
    デフォルト設定が使用されます

**使用例 :**

```javascript
var operator = MashupPlatform.mashup.addOperator("CoNWeT/ngsientity2poi/3.0.3", {
    "preferences": {
        "coordinates_attr": {
            "value": "current_position"
        }
    }
});
```


<a name="mashupplatformmashupcreateworkspace-method"></a>
#### `MashupPlatform.mashup.createWorkspace` メソッド

> WireCloud 0.8.0 の新機能 / Widget API v2

このメソッドにより、ウィジェットおよびオペレータは、現在のユーザの新しいワークスペースを作成できます。このメソッドは
非同期です。

このメソッドは、`DashboardManagement` 機能を使用する場合にのみ使用できます。

```javascript
MashupPlatform.mashup.createWorkspace(options)
```

-   `options` (_required, object_): ワークスペースの作成に使用するオプションを持つオブジェクト。次のオプションの
    うちの少なくとも一方が提供されなければなりません : `name`, `mashup`, `workspace`

サポートされるオプション :

-   `name` (_string_): 新しいワークスペースの名前。`mashup` と ` workspace` のどちらのオプションも使用しない場合、
    このオプションは必須です。提供されていない場合、マッシュアップの名前はマッシュアップまたはワークスペースから
    取り込まれ、テンプレートとして使用されます
-   `mashup` (_string_): 新しいワークスペースを作成するためのテンプレートとして使用するマッシュアップの id
    (ベンダー/名前/バージョン)。`mashup` 属性と `workspace` 属性の両方はオプションですが、一緒に指定することは
    できません
-   `workspace` (_string_): 新しいワークスペースを作成するためのテンプレートとして使用するワークスペースのid
    (所有者/名前)。 `mashup` 属性と `workspace` 属性の両方はオプションですが、一緒に指定することはできません
-   `allowrenaming` (_boolean, default `false`_): このオプションが `true` の場合、同じ名前のワークスペースがすでに
    存在する場合、Application Mashup Server はワークスペースの名前を変更します
-   `preferences` (_object_): ワークスペース・プレファレンスの初期値を持つオブジェクト。指定されていない場合、
    デフォルト値が使用されます
-   `onSuccess` (_function_): ワークスペースが正常に作成された場合に呼ばれるコールバック
-   `onFailure` (_function_): ワークスペースの作成中に何らかのエラーが発生した場合に呼ばれるコールバック

**使用例 :**

```javascript
MashupPlatform.mashup.createWorkspace({
    name: "New workspace",
    mashup: "CoNWeT/ckan-graph-mashup/1.0",
    onSuccess: function(workspace) {
        alert(workspace.owner + "/" + workspace.name + " created successfully");
    }
});
```


<a name="#mashupplatformmashupopenworkspace-method"></a>
#### `MashupPlatform.mashup.openWorkspace` メソッド

> WireCloud 1.0.0 の新機能 / Widget API v3

このメソッドにより、ウィジェットおよびオペレータは現在の作業領域を切り替えることができます。このメソッドは非同期です。

このメソッドは、`DashboardManagement` 機能を使用する場合にのみ使用できます。

```javascript
MashupPlatform.mashup.openWorkspace(workspace, options);
```

-   `workspace` (_required, object_): 次の属性で構成されるオブジェクト :
    -   `owner` (_required, string_): ワークスペースの所有者のユーザ名
    -   `name` (_required, string_): ワークスペースの名前
-   `options` (_object_): ワークスペースを開くために使用するオプションを持つオブジェクト

サポートされるオプション :

-   `onFailure` (_function_): ワークスペースを開いているときに何らかのエラーが発生した場合に呼ばれるコールバック

**使用例 :**

```javascript
MashupPlatform.mashup.openWorkspace({
    owner: "wirecloud",
    name: "home"
});
```

<a name="mashupplatformmashupremoveworkspace-method"></a>
#### `MashupPlatform.mashup.removeWorkspace` メソッド

> WireCloud 1.0.0 の新機能 / Widget API v3

このメソッドにより、ウィジェットおよびオペレータはワークスペースを削除できます。このメソッドは非同期です。

このメソッドは、`DashboardManagement` 機能を使用する場合にのみ使用できます。

```javascript
MashupPlatform.mashup.removeWorkspace(workspace, options);
```

-   `workspace` (_required, object_): 次の属性で構成されるオブジェクト :
    -   `owner` (_required, string_): ワークスペースの所有者のユーザ名
    -   `name` (_required, string_): ワークスペースの名前
-   `options` (_object_): ワークスペースの削除に使用するオプションを持つオブジェクト

サポートされるオプション :

-   `onSuccess` (_function_): ワークスペースが正常に削除された場合に呼ばれるコールバック
-   `onFailure` (_function_): ワークスペースを削除しているときに何らかのエラーが発生した場合に呼ばれるコールバック

**使用例 :**

```javascript
MashupPlatform.mashup.removeWorkspace({
    owner: "user",
    name: "workspace"
});
```


### MashupPlatform.operator

このモジュールは、オペレータの中で実行されている場合にのみ使用できます。現在、Widget API には次の属性があります。

-   [`id`](#mashupplatformoperatorid-attribute)
-   [`context`](#mashupplatformoperatorcontext-attribute)
-   [`inputs`](#mashupplatformoperatorinputs-attribute)
-   [`outputs`](#mashupplatformoperatoroutputs-attribute)


そして、3つのメソッド :

-   [`createInputEndpoint`](#mashupplatformoperatorcreateinputendpoint-method)
-   [`createOutputEndpoint`](#mashupplatformoperatorcreateoutputendpoint-method)
-   [`log`](#mashupplatformoperatorlog-method)


<a name="mashupplatformoperatorid-attribute"></a>
#### `MashupPlatform.operator.id` 属性

この属性には、オペレータの id が含まれます。

```javascript
MashupPlatform.operator.id
```

<a name="mashupplatformoperatorcontext-attribute"></a>
#### `MashupPlatform.operator.context` 属性

この属性には、オペレータのコンテキスト・マネージャが含まれます。詳細については、
[コンテキスト・マネージャに関するドキュメント](#context-managers)を参照してください。

```javascript
MashupPlatform.operator.context;
```

**使用例 :**

```javascript
MashupPlatform.operator.context.get("version");
```

<a name="mashupplatformoperatorinputs-attribute"></a>
#### `MashupPlatform.operator.inputs` 属性

> WireCloud 0.8.0 の新機能 / Widget API v2

入力エンドポイントの名前をキーとして使用するオペレータの入力エンドポイントを指定します。

```javascript
MashupPlatform.operator.inputs;
```

<a name="mashupplatformoperatoroutputs-attribute"></a>
#### `MashupPlatform.operator.outputs` 属性

> WireCloud 0.8.0 の新機能 / Widget API v2

オペレータの入力エンドポイントを指定して、出力エンドポイントの名前をキーとして使用します。

```javascript
MashupPlatform.operator.outputs;
```

<a name="mashupplatformoperatorcreateinputendpoint-method"></a>
#### `MashupPlatform.operator.createInputEndpoint` メソッド

> WireCloud 0.8.0 の新機能 / Widget API v2

このメソッドは、動的入力エンドポイントを作成します。

このメソッドは、`DashboardManagement` 機能を使用する場合にのみ使用できます。

```javascript
MashupPlatform.operator.createInputEndpoint(callback);
```

-   `callback` (_required, function_): イベントが入力エンドポイントに到着したときに呼び出される関数

**使用例 :**

```javascript
MashupPlatform.operator.createInputEndpoint(function(data_string) {
    var data = JSON.parse(data_string);
    ...
});
```

<a name="mashupplatformoperatorcreateoutputendpoint-method"></a>
#### `MashupPlatform.operator.createOutputEndpoint` メソッド

> WireCloud 0.8.0 の新機能 / Widget API v2

このメソッドは、動的出力エンドポイントを作成します。

このメソッドは、`DashboardManagement` 機能を使用する場合にのみ使用できます。

```javascript
MashupPlatform.operator.createOutputEndpoint();
```

**使用例 :**

```javascript
var endpoint = MashupPlatform.operator.createOutputEndpoint();
...
endpoint.pushEvent("event data");
```

<a name="mashupplatformoperatorlog-method"></a>
#### `MashupPlatform.operator.log` メソッド

このメソッドは、アプリケーション・マッシュアップのログ・コンソールにメッセージを書き込みます。

```javascript
MashupPlatform.operator.log(msg, level);
```

-   `msg` (_required, string_): ログに記録するメッセージのテキストです
-   `level` (_optional, default: `MashupPlatform.log.ERROR`_): このオプションのパラメータは、メッセージをログする
    ために使用するレベルを指定します。使用可能なログレベルについては、[MashupPlatform.log](#mashupplatformlog)
    を参照してください

**使用例 :**

```javascript
MashupPlatform.operator.log("error message description");
MashupPlatform.operator.log("info message description", MashupPlatform.log.INFO);
```


### MashupPlatform.widget

このモジュールは、ウィジェット内で実行されている場合にのみ使用できます。現在、Widget API には次の属性があります :

-   [`id`](#mashupplatformwidgetid-attribute)
-   [`context`](#mashupplatformwidgetcontext-attribute)
-   [`inputs`](#mashupplatformwidgetinputs-attribute)
-   [`outputs`](#mashupplatformwidgetoutputs-attribute)

そいて、次のメソッドがあります :

-   [`createInputEndpoint`](#mashupplatformwidgetcreateinputendpoint-method)
-   [`createOutputEndpoint`](#mashupplatformwidgetcreateoutputendpoint-method)
-   [`getVariable`](#mashupplatformwidgetgetvariable-method)
-   [`drawAttention`](#mashupplatformwidgetdrawattention-method)
-   [`log`](#mashupplatformwidgetlog-method)


#### `MashupPlatform.widget.id` 属性

この属性には、ウィジェットの id が含まれます。

```javascript
MashupPlatform.widget.id;
```


#### `MashupPlatform.widget.context` 属性

この属性には、ウィジェットのコンテキスト・マネージャが含まれます。詳細については、
[コンテキスト・マネージャに関するドキュメント](#context-managers)を参照してください。

```javascript
MashupPlatform.widget.context;
```

**使用例 :**

```javascript
MashupPlatform.widget.context.get("version");
```


#### `MashupPlatform.widget.inputs` 属性

> WireCloud 0.8.0 の新機能 / Widget API v2

入力エンドポイントの名前をキーとして使用して、ウィジェットの入力エンドポイントを指定します。

```javascript
MashupPlatform.widget.inputs;
```


#### `MashupPlatform.widget.outputs` 属性

> WireCloud 0.8.0 の新機能 / Widget API v2

出力エンドポイントの名前をキーとして使用して、ウィジェットの入力エンドポイントを指定します。

```javascript
MashupPlatform.widget.outputs;
```

<a name="mashupplatformwidgetcreateinputendpoint-method"></a>
#### `MashupPlatform.widget.createInputEndpoint` メソッド

> WireCloud 0.8.0 の新機能 / Widget API v2

このメソッドは、動的入力エンドポイントを作成します。

このメソッドは、`DashboardManagement` 機能を使用する場合にのみ使用できます。

```javascript
MashupPlatform.widget.createInputEndpoint(callback);
```

-   `callback` (_required, function_): イベントが入力エンドポイントに到着したときに呼び出される関数

**使用例 :**

```javascript
MashupPlatform.widget.createInputEndpoint(function(data_string) {
    var data = JSON.parse(data_string);
    ...
});
```

<a name="mashupplatformwidgetcreateoutputendpoint-method"></a>
#### `MashupPlatform.widget.createOutputEndpoint` メソッド

> WireCloud 0.8.0 の新機能 / Widget API v2

このメソッドは、動的出力エンドポイントを作成します。

このメソッドは、`DashboardManagement` 機能を使用する場合にのみ使用できます。

```javascript
MashupPlatform.widget.createOutputEndpoint();
```

**使用例 :**

```javascript
var endpoint = MashupPlatform.widget.createOutputEndpoint();
...
endpoint.pushEvent("event data");
```

<a name="mashupplatformwidgetgetvariable-method"></a>
#### `MashupPlatform.widget.getVariable` メソッド

ウィジェット変数をその名前で返します。

```javascript
MashupPlatform.widget.getVariable(name);
```

-   `name` (_required, string_): `config.xml` ファイルに定義されている永続変数の名前

**使用例 :**

```javascript
var variable = MashupPlatform.widget.getVariable("persistent-var");
variable.set(JSON.stringify(data));
```

<a name="mashupplatformwidgetdrawattention-method"></a>
#### `MashupPlatform.widget.drawAttention` メソッド

アプリケーション・マッシュアップ・エンジンは、ウィジェットにユーザの注意が必要であることを通知します。

```javascript
MashupPlatform.widget.drawAttention()
```

<a name="mashupplatformwidgetlog-method"></a>
#### `MashupPlatform.widget.log` メソッド

Application Mashup のログ・コンソールにメッセージを書き込みます。

```javascript
MashupPlatform.widget.log(msg, level);
```

-   `msg` (_required, string_): ログに記録するメッセージのテキストです
-   `level` (_optional, default: `MashupPlatform.log.ERROR`_): このオプションのパラメータは、メッセージをログする
    ために使用するレベルを指定します。使用可能なログレベルについては、[MashupPlatform.log](#mashupplatform-log)
    を参照してください 

**使用例 :**

```javascript
MashupPlatform.widget.log("error message description");
MashupPlatform.widget.log("warning message description", MashupPlatform.log.WARN);
```


### MashupPlatform.wiring

このモジュールは、ウィジェット間の通信を処理するためのいくつかの方法を提供します。

現在、このモジュールは5つの方法で構成されています :

-   [`hasInputConnections`](#mashupplatformwiringhasinputconnections-method)
-   [`hasOutputConnections`](#mashupplatformwiringhasoutputconnections-method)
-   [`pushEvent`](#mashupplatformwiringpushevent-method)
-   [`registerCallback`](#mashupplatformwiringregistercallback-method)
-   [`registerStatusCallback`](#mashupplatformwiringregisterstatuscallback-method)

そして、3つの例外があります :

-   [`EndpointDoesNotExistError`](#mashupplatformwiringendpointdoesnotexisterror-exception)
-   [`EndpointTypeError`](#mashupplatformwiringendpointtypeerror-exception)
-   [`EndpointValueError`](#mashupplatformwiringendpointvalueerror-exception)

<a name="mashupplatformwiringhasinputconnections-method"></a>
#### `MashupPlatform.wiring.hasInputConnections` メソッド

> WireCloud 0.8.0 の新機能 / Widget API v2

ワイヤーリングを介してイベントを送信します。

```javascript
MashupPlatform.wiring.hasInputConnections(inputName);
```

-   `inputName` (_required, string_): 接続がある場合にクエリする入力エンドポイントの名前

このメソッドは、次の例外を発生させる可能性があります :

-   `MashupPlatform.wiring.EndpointDoesNotExistError`

**使用例 :**

```javascript
MashupPlatform.wiring.hasInputConnections("inputendpoint");
```

<a name="mashupplatformwiringhasoutputconnections-method"></a>
#### `MashupPlatform.wiring.hasOutputConnections` メソッド

> WireCloud 0.8.0 の新機能 / Widget API v2

ワイヤーリングを介してイベントを送信します。

```javascript
MashupPlatform.wiring.hasOutputConnections(outputName);
```

-   `outputName` (_required, string_): 接続がある場合にクエリする出力エンドポイントの名前

このメソッドは、次の例外を発生させる可能性があります :

-   `MashupPlatform.wiring.EndpointDoesNotExistError`

**使用例 :**

```javascript
MashupPlatform.wiring.hasOutputConnections("outputendpoint");
```

<a name="mashupplatformwiringpushevent-method"></a>
#### `MashupPlatform.wiring.pushEvent` メソッド


ワイヤーリングを介してイベントを送信します。

```javascript
MashupPlatform.wiring.pushEvent(outputName, data);
```

-   `outputName` (_required, string_): イベントの送信に使用する出力エンドポイントの名前
-   `data` (_required, any_): 送信するデータ

このメソッドは、次の例外を発生させる可能性があります :

-   `MashupPlatform.wiring.EndpointDoesNotExistError`

**使用例 :**

```javascript
MashupPlatform.wiring.pushEvent("outputendpoint", "event data");
```

<a name="mashupplatformwiringregistercallback-method"></a>
#### `MashupPlatform.wiring.registerCallback` メソッド

指定された入力エンドポイントのコールバックを登録します。指定されたエンドポイントが既にコールバックを登録している場合、
それは新しいものに置き換えられます。

```javascript
MashupPlatform.wiring.registerCallback(inputName, callback);
```

-   `inputName` (_required, string_): コールバック関数が登録される入力エンドポイントの名前
-   `callback` (_required, function_): イベントが入力エンドポイントに到着したときに呼び出される関数

このメソッドは、次の例外を発生させる可能性があります :

-   `MashupPlatform.wiring.EndpointDoesNotExistError`

**使用例 :**

```javascript
MashupPlatform.wiring.registerCallback("inputendpoint", function(data_string) {
    var data = JSON.parse(data_string);
    ...
});
```

<a name="mashupplatformwiringregisterstatuscallback-method"></a>
#### `MashupPlatform.wiring.registerStatusCallback` メソッド

> WireCloud 0.8.0 の新機能 / Widget API v2

Widget API を使用して行われた変更を除いて、マッシュアップのワイヤーリング状態が変更されるたびに呼び出される
コールバックを登録します。

```javascript
MashupPlatform.wiring.registerStatusCallback(callback);
```

-   `callback` (_required, function_): ワイヤーリング設定が変更されるたびに呼び出される機能

**使用例 :**

```javascript
MashupPlatform.wiring.registerStatusCallback(function() {
    ...
});
```


<a name="mashupplatformwiringendpointdoesnotexisterror-exception"></a>
#### `MashupPlatform.wiring.EndpointDoesNotExistError` 例外

この例外は、入出力エンドポイントが見つからない場合に発生します。

```javascript
MashupPlatform.wiring.EndpointDoesNotExistError;
```


<a name="mashupplatformwiringendpointtypeerror-exception"></a>
#### `MashupPlatform.wiring.EndpointTypeError` 例外

> WireCloud 0.8.0 の新機能 / Widget API v2

ウィジェット/オペレータは、入力エンドポイントに到着するデータが期待されるタイプではないことを検出すると、
この例外をスローできます。

```javascript
MashupPlatform.wiring.EndpointTypeError(message);
```

-   `message` (_required, string_): 例外を説明するメッセージテキスト

**使用例 :**

```javascript
MashupPlatform.wiring.registerCallback("inputendpoint", function(data) {
    try {
        data = JSON.parse(data);
    } catch (error) {
        throw new MashupPlatform.wiring.EndpointTypeError("data should be encoded as JSON");
    }

    ...
});
```

<a name="mashupplatformwiringendpointvalueerror-exception"></a>
#### `MashupPlatform.wiring.EndpointValueError` 例外

> WireCloud 0.8.0 の新機能 / Widget API v2

ウィジェット/オペレータは、適切なタイプを持っていても入力エンドポイントに到着するデータに不適切な値が含まれている
ことを検出すると、この例外をスローできます。

```javascript
MashupPlatform.wiring.EndpointValueError(message);
```

-   `message` (_required, string_): 例外を説明するメッセージテキスト

**使用例 :**

```javascript
MashupPlatform.wiring.registerCallback("inputendpoint", function(data) {
    ...

    if (data.level > 4 || data.level < 0) {
        throw new MashupPlatform.wiring.EndpointValueError("level out of range");
    }

    ...
});
```

### エンドポイント・インスタンス

> WireCloud 0.8.0 の新機能 / Widget API v2

エンドポイント・インスタンスは1つの属性を提供します :

-   [`connected`](#endpointconnected-attribute)

エンドポイントのタイプに応じて、以下のメソッドがあります :

-   [`connect`](#endpointconnect-method)
-   [`disconnect`](#endpointdisconnect-method)
-   [`pushEvent`](#endpointpushevent-method)

<a name="endpointconnected-attribute"></a>
#### `Endpoint.connected` 属性

この属性は、関連付けられたエンドポイントに少なくとも1つの接続があるかどうかを示します。

```javascript
Endpoint.connected;
```

**使用例 :**

```javascript
if (MashupPlatform.widget.inputs.source.connected) {
    $("#alert").hide();
} else {
    $("#alert").show();
}

```
<a name="endpointconnect-method"></a>
#### `Endpoint.connect` メソッド

このメソッドは、インスタンスに関連付けられたエンドポイントとパラメータとして渡されたエンドポイントの間の接続を
確立します。

```javascript
Endpoint.connect(endpoint);
```

-   `endpoint` (_required, `Endpoint`_): 接続のもう一方の端に接続する入出力エンドポイント

**使用例 :**

```javascript
var operator = MashupPlatform.mashup.addOperator("CoNWeT/ngsientity2poi/3.0.3", ...);
var widget = MashupPlatform.mashup.addWidget("CoNWeT/map-viewer/2.5.7", ...);

MashupPlatform.widget.outputs.entity.connect(operator.inputs.entityInput);
operator.outputs.poiOutput.connect(widget.inputs.poiInput);
```

<a name="endpointdisconnect-method"></a>
#### `Endpoint.disconnect` メソッド

> WireCloud 1.0 / Widget API v2 の新機能

このエンドポイントで開始または終了する動的接続を削除します。このメソッドは、ワイヤーリング・エディタを使用して
ユーザが作成した接続の切断には使用できません。

```javascript
Endpoint.disconnect(endpoint);
```

-   `endpoint` (_optional, `Endpoint`_): 削除する接続の反対側のエンドポイント。`endpoint` が `null` の場合、
このエンドポイントに関連するすべての動的な接続が切断されます

**使用例 :**

```javascript
var operator = MashupPlatform.mashup.addOperator("CoNWeT/ngsientity2poi/3.0.3", ...);
var widget = MashupPlatform.mashup.addWidget("CoNWeT/map-viewer/2.5.7", ...);

MashupPlatform.widget.outputs.entity.connect(operator.inputs.entityInput);
operator.outputs.poiOutput.connect(widget.inputs.poiInput);

...

MashupPlatform.widget.outputs.entity.disconnect(operator.inputs.entityInput);
operator.outputs.poiOutput.disconnect(widget.inputs.poiInput);

```

<a name="endpointpushevent-method"></a>
#### `Endpoint.pushEvent` メソッド

ワイヤーリングを介してイベントを送信します。

出力エンドポイントでのみ使用できます。

```javascript
Endpoint.pushEvent(data);
```

-   `data` (_required, any_): 送信するデータ

**使用例 :**

```javascript
MashupPlatform.widget.outputs.entity.pushEvent("event data");
```


### ウィジェット・インスタンス
> WireCloud 0.8.0 の新機能 / Widget API v2

`MashupPlatform.mashup.addWidget` メソッドを使用して取得された ウィジェットのインスタンスは、次の属性を提供します :

-   [`inputs`](#widgetinputs-attribute)
-   [`outputs`](#widgetoutputs-attribute)

そして、次のメソッド : 

-   [`addEventListener`](#widgetaddeventlistener-method)
-   [`remove`](#widgetremove-method)


<a name="widgetinputs-attribute"></a>
#### `Widget.inputs` 属性

入力エンドポイントの名前をキーとして使用して、ウィジェットの入力エンドポイントを指定します。

```javascript
Widget.inputs;
```


<a name="widgetoutputs-attribute"></a>
#### `Widget.outputs` 属性

出力エンドポイントの名前をキーとして使用して、ウィジェットの入力エンドポイントを指定します。

```javascript
Widget.outputs;
```


<a name="widgetaddeventlistener-method"></a>
#### `Widget.addEventListener` メソッド

このメソッドは、呼び出された `Widget` のリスナーに指定されたリスナーを登録します。

```javascript
Widget.addEventListener(name, handler);
```

-   `name` (_required, string_): 待機するイベントの名前
-   `listener` (_required, function_): 指定されたタイプのイベントがウィジェットによって発生されたときに呼び出される関数

**使用例 :**

```javascript
var widget = MashupPlatform.mashup.addWidget(...);
....
widget.addEventListener("close", onWidgetClose);
```


<a name="widgetremove-method"></a>
#### `Widget.remove` メソッド

このメソッドは、ワークスペースからウィジェットを削除します。ウィジェットを削除する前に、このウィジェットを含む
ワイヤーリング接続が切断されます。

```javascript
Widget.remove();
```

**使用例 :**

```javascript
var widget = MashupPlatform.mashup.addWidget(...);
....
widget.remove();
```


### ワークスペース・インスタンス

> WireCloud 1.0.0の新機能/ Widget API  v3

`MashupPlatform.mashup.createWorkspace` メソッドを使用して取得されワークスペースのインスタンスには、
次の属性があります :

-   [`name`](#workspacename-attribute)
-   [`owner`](#workspaceowner-attribute)

そして、次のメソッドがあります :

-   [`open`](#workspaceopen-method)
-   [`remove`](#workspaceremove-method)


<a name="workspacename-attribute"></a>
#### `Workspace.name` 属性

ワークスペースの名前の文字列。

```javascript
Workspace.name;
```

<a name="workspaceowner-attribute"></a>
#### `Workspace.owner` 属性

ワークスペースの所有者のユーザ名を含む文字列。

```javascript
Workspace.owner
```

<a name="workspaceopen-method"></a>
#### `Workspace.open` メソッド

> WireCloud 1.0.0 の新機能 / Widget API v3

このメソッドはワークスペースを開き、現在のワークスペースを閉じます。

```javascript
Workspace.open(options);
```

-   `options` (_object_): ワークスペースを開くために使用するオプションを持つオブジェクト

サポートされるオプション : 

-   `onFailure` (_function_): ワークスペースを開いているときに何らかのエラーが発生した場合に呼び出すコールバック

**使用例 :**

```javascript
MashupPlatform.mashup.createWorkspace({
    ...,
    onSuccess: function(workspace) {
        workspace.open();
    }
);
```


<a name="workspaceremove-method"></a>
#### `Workspace.remove` メソッド

> WireCloud 1.0.0 の新機能 / Widget API v3

このメソッドは、ワークスペースを削除します。

```javascript
Workspace.remove(options);
```

-   `options` (_object_): ワークスペースの削除に使用するオプションを持つオブジェクト

サポートされるオプション : 

-   `onSuccess` (_function_): ワークスペースが正常に削除された場合に呼び出すコールバック
-   `onFailure` (_function_): ワークスペースを削除しているときに何らかのエラーが発生した場合に呼ばれるすコールバック


**使用例 :**

```javascript
var myWorkspace;

MashupPlatform.mashup.createWorkspace({
    ...,
    onSuccess: function(workspace) {
        myWorkspace = workspace;
    }
);

...

myWorkspace.remove();
```


### オペレータ・インスタンス

> new in WireCloud 0.8.0 / Widget API v2

`MashupPlatform.mashup.addOperator` メソッドを使用して取得したオペレータ・インスタンスには、次の属性があります :

-   [`inputs`](#operatorinputs-attribute)
-   [`outputs`](#operatoroutputs-attribute)

そして、次のメソッド : 

-   [`addEventListener`](#operatoraddeventlistener-method)
-   [`remove`](#operatorremove-method)


<a name="operatorinputs-attribute"></a>
#### `Operator.inputs` 属性

入力エンドポイントの名前をキーとして使用するオペレータの入力エンドポイントを指定します。

```javascript
Operator.inputs;
```

<a name="operatoroutputs-attribute"></a>
#### `Operator.outputs` 属性

オペレータの入力エンドポイントを指定して、出力エンドポイントの名前をキーとして使用します。

```javascript
Operator.outputs;
```

<a name="operatoraddeventlistener-method"></a>
#### `Operator.addEventListener` メソッド

このメソッドは、呼び出されたオペレータのリスナーに指定されたリスナーを登録します。

```javascript
Operator.addEventListener(name, handler);
```

-   `name` (_required, string_): 待機するイベントの名前
-   `listener` (_required, function_): 指定されたタイプのイベントがオペレータによって発生したときに呼び出される関数

**使用例 :**

```javascript
var operator = MashupPlatform.mashup.addOperator(...);
....
operator.addEventListener("close", onOperatorClose);
```


<a name="operatorremove-method"></a>
#### `Operator.remove` メソッド

このメソッドは、作業領域からオペレータを削除します。オペレータを取り外す前に、このオペレータに関係するワイヤーリング
接続を切断します。

```javascript
Operator.remove();
```

**使用例 :**

```javascript
var operator = MashupPlatform.mashup.addOperator(...);
....
operator.remove();
```

<a name="context-managers"></a>
### コンテキスト・マネージャ

各コンテキスト・マネージャは、3つのメソッドをサポートしています :

-   [`getAvailableContext`](#contextmanagergetavailablecontext-method)
-   [`get`](#contextmanagerget-method)
-   [`registerCallback`](#contextmanagerregistercallback-method)

<a name="contextmanagergetavailablecontext-method"></a>
#### `ContextManager.getAvailableContext` メソッド

このメソッドは、指定されたレベルで使用できるコンセプトについての情報を提供します。

```javascript
ContextManager.getAvailableContext();
```

**使用例 :**

```javascript
MashupPlatform.context.getAvailableContext();
```

<a name="contextmanagerget-method"></a>
#### `ContextManager.get` メソッド

コンセプトの現在の値を取得します。

```javascript
ContextManager.get(key);
```

-   `key` (_required, string_): name of the concept to query.

**使用例 :**

```javascript
MashupPlatform.widget.context.get("heightInPixels");
MashupPlatform.mashup.context.get("name");
MashupPlatform.context.get("username");
```

<a name="contextmanagerregistercallback-method"></a>
#### `ContextManager.registerCallback` メソッド

いずれかのコンセプトが変更されたときに呼び出されるコールバックを登録できます。

```javascript
ContextManager.registerCallback(callback);
```

-   `callback` (_required, function_): コンテキスト・マネージャが管理するコンテキスト情報が変更されるたびに
    呼び出される関数

**使用例 :**

```javascript
MashupPlatform.widget.context.registerCallback(function(new_values) {
    if ("some-context-concept" in new_values) {
        // some-context-concept has been changed
        // new_values["some-context-concept"] contains the new value
    }
});
```

## 謝辞

編集者はこの仕様に積極的に貢献した以下の人々に感謝の意を表します : Aitor Magan と Francisco de la Vega

## 参考文献

-   [Github source](https://github.com/Wirecloud/wirecloud)
-   [Application Mashup API](http://wirecloud.github.io/wirecloud/restapi/latest/)
-   [FIWARE Open Specification License (implicit patents license)](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/FI-WARE_Open_Specification_Legal_Notice_%28implicit_patents_license%29)
-   [CSSOM Views: The getClientRects() and getBoundingClientRect() methods](http://www.w3.org/TR/cssom-view/#the-getclientrects%28%29-and-getboundingclientrect%28%29-methods)
-   [Cross-Origin Resource Sharing](http://www.w3.org/TR/cors/)
