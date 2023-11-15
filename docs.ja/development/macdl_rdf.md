マッシャブル・アプリケーション・コンポーネントを [Store GE](https://github.com/conwetlab/wstore) で提供するには、
MACs は、FIWARE の Marketplace, Store, Repository Generic Enablers でサポートされているフォーマットを使用して
メタデータ情報を提供する必要があります。それらの GE は USDL ドキュメント (RDF)の使用に基づいているため、
Application Mashup GE はリンクデータの原則に基づいて作成された MACDL の RDF フレーバをサポートし、MAC 記述ファイルを
USDL ドキュメントから直接リンク可能にします。

MACDL の RDF フレーバは、2つの新しい RDF ボキャブラリに基づいています。最初のキャブラリである
[WIRE](https://github.com/Wirecloud/wirecloud/blob/develop/src/wirecloud/commons/utils/template/schemas/wire.rdf)
では、最初のボキャブラリである WIRE は、Application Mashup GE がウィジェットやオペレータをインスタンス化するために
使用する必要がある情報の定義を扱います。ユーザのプレファレンス、永続変数ワイヤーリング情報などが含まれます。
第2のキャブラリである
[WIRE-M](https://github.com/Wirecloud/wirecloud/blob/develop/src/wirecloud/commons/utils/template/schemas/wire-m.rdf)
は、ウィジェット・インスタンス、ウィジェットとオペレータ間のワイヤーリングやパイピングなどのプラットフォーム固有の
情報を含む、ユーザ・ワークスペースのインスタンスを作成するために必要なマッシュアップ関連情報を定義します。

次のセクションでは、RDF を使用して MACs を記述するために使用できる両方のボキャブラリを表します。

## WIRE ボキャブラリ

下の図は、WIRE ボキャブラリを示しています。

![The WIRE vocabulary](../../docs/images/mac_description_rdf_wire_diagram.png)

<div style="text-align: center; font-weight: bold;">`WIRE` ボキャブラリ</div>

Application Mashup GE は、MAC 情報を RDF として表現する手段を提供し、これらの記述を USDL ドキュメントから使用
できるようにするために、このボキャブラリをサポートしなければなりません。

### クラス

#### `wire:Widget` クラス

このクラスはウィジェットを表します。これは、このボキャブラリのルートクラスの1つで、`wire:Operator`
とジョイントしています。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/widget#Widget`

-   **Properties include**: `wire:macVersion`, `dcterms:title`, `dcterms:description`, `dcterms:creator`, 
    `usdl:hasProvider`, `usdl:utilizedResource`, `foaf:page`, `wire:hasPlatformPreference`, `wire:hasPlatformWiring`,
    `wire:hasPlatformRendering`, `wire:hasPlatformStateProperty`, `usdl:versionInfo`, `wire:hasImageUri`,
    `wire.hasiPhoneImageUri`, `wire:displayName`, `vcard:addr`

-   **Subclassof**: `usdl-core:Service`


#### `wire:Operator` クラス

このクラスはオペレータを表します。これは、このボキャブラリのルートクラスの1つで `wire:Widget` とジョイントています。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/widget#Operator`

-   **Properties include**: `wire:macVersion`, `dcterms:title`, `dcterms:description`, `dcterms:creator`,     
    `usdl:hasProvider`, `usdl:utilizedResource`, `foaf: page`, `wire:hasPlatformPreference`, `wire:hasPlatformWiring`,
    `wire:hasPlatformRendering`, `wire:hasPlatformStateProperty`, `usdl:versionInfo`, `wire:hasImageUri`,
    `wire.hasiPhoneImageUri`, `wire:displayName`, `vcard:addr`

-   **Subclassof**: `usdl-core:Service`


#### `wire:PlatformPreference` クラス

このクラスは、Application Mashup GE のユーザ設定、つまり、ユーザが表示および構成できるデータを表します。
イネーブラはこの値を永続化し、ユーザにこのデータを編集して検証するツールを提供する必要があります。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/widget#PlatformPreference`

-   **Properties include**: `wire:hasOption`, `dcterms:title`, `dcterms:description`, `rdfs:label`, `wire:type`,
    `wire:default`, `wire:secure`

-   **Used with**: `wire:hasPlatformPreference`


#### `wire:PlatformWiring` クラス

このクラスは、ウィジェットのワイヤーリング状態を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/widget#PlatformWiring`

-   **Properties include**: `wire:hasOutputEndpoint, wire:hasInputEnpoint`

-   **Used with**: `wire:hasPlatformWiring`


#### `wire:PlatformRendering` クラス

このクラスは、インスタンス化されるときのウィジェットのサイズを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/widget#PlatformRendering`

-   **Properties include**: `wire:renderingWidth`, `wire.renderingHeight`

-   **Used with**: `wire:hasPlatformRendering`


#### `wire:PlatformStateProperty` クラス

このクラスは、プラットフォームが永続化するために知る必要があるウィジェット状態変数を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/widget#PlatformStateProperty`

-   **Properties include**: `dcterms:title`, `dcterms:description`, `wire:type`, `rdfs:label`, `wire:default`,
    `wire:secure`, `wire:multiuser`

-   **Used with**: `wire:hasPlatformStateProperty`


#### `wire:Option` クラス

このクラスは、ユーザのプリファレンスが持つことができるオプションを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/widget#Option`

-   **Properties include**: `dcterms:title`, `wire:value`

-   **Used with**: `wire:hasOption`


#### `wire:OutputEndpoint` クラス

このクラスは、出力エンドポイントを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/widget#OutputEndpoint`

-   **Properties include**: `dcterms:title`, `dcterms:description`, `rdfs:label`, `wire:type`, `wire:friendcode`

-   **Used with**: `wire:hasOutputEndpoint`


#### `wire:InputEndpoint` クラス

このクラスは、入力エンドポイントを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/widget#InputEndpoint`

-   **Properties include**: `dcterms:title`, `dcterms:description`, `rdfs:label`, `wire:type`, `wire:friendcode`,
    `wire:actionLabel`

-   **Used with**: `wire:hasInputEndpoint`


### プロパティ

#### `wire:macVersion` プロパティ

このプロパティは、ウィジェットまたはオペレータを記述するために使用されるMACDLのバージョンを示す。 現在、サポートされているのはの値は`1`である。 このプロパティは必須ではないが、使用すべきである。 このプロパティがない場合、バージョン`1`はを想定している。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#macVersion`
-   **Domain**: `wire:Widget` と `wire:Operator`
-   **Range**: `rdfs:Literal`

#### `wire:hasPlatformPreference` プロパティ

このプロパティは、ユーザ・ウィジェットの設定を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#hasPlatformPreference`
-   **Domain**: `wire:Widget`  
-   **Range**: `wire:PlatformPreference`


#### `wire:hasPlatformWiring` プロパティ

このプロパティは、ウィジェットのワイヤーリング状態を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#hasPlatformWiring`
-   **Domain**: `wire:Widget`
-   **Range**: `wire:PlatformWiring`


#### `wire:hasPlatformRendering` プロパティ

このプロパティは、ウィジェットのレンダリング方法を指定します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#hasPlatformRendering`
-   **Domain**: `wire:Widget`
-   **Range**: `wire:PlatformRendering`


#### `wire:hasPlatformStateProperty` プロパティ

このプロパティは、ウィジェットの永続変数を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#hasPlatformStateProperty`
-   **Domain**: `wire:Widget`
-   **Range**: `wire:PlatformStateProperty`


#### `wire:hasOption` プロパティ

このプロパティは、ユーザのプレファレンス・オプションを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#hasOption`
-   **Domain**: `wire:PlatformPreference`
-   **Range**: `wire:Option`


#### `wire:hasOutputEndpoint` プロパティ

このプロパティは、ウィジェットのワイヤーリング出力エンドポイントを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#hasOutputEndpoint`
-   **Domain**: `wire:PlatformWiring`
-   **Range**: `wire:OutputEndpoint`


#### `wire:hasInputEndpoint` プロパティ

このプロパティは、ウィジェットのワイヤーリング入力エンドポイントを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#hasInputEndpoint`
-   **Domain**: `wire:PlatformWiring`
-   **Range**: `wire:InputEndpoint`


#### `wire:friendcode` プロパティ

このプロパティは、_friendcode_ を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#friendcode`
-   **Domain**: `wire:InputEndpoint` and `wire:OutputEndpoint`
-   **Range**: `rdfs:Literal`


#### `wire:actionLabel` プロパティ

このプロパティは、入力のアクション・ラベルを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#actionLabel`
-   **Domain**: `wire:InputEndpoint`
-   **Range**: `rdfs:Literal`


#### `wire:hasImageUri` プロパティ

このプロパティは、ウィジェットに関連付けられたイメージの URI を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#hasImageUri`
-   **Domain**: `wire:Widget`
-   **Range**: `foaf:Image`


#### `wire:hasiPhoneImageUri` プロパティ

このプロパティは、プラットフォームが iPhone 上で実行されている場合、ウィジェットに関連付けられている画像の URI
を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#hasiPhoneImageUri`
-   **Domain**: `wire:Widget`
-   **Range**: `foaf:Image`


#### `wire:displayName` プロパティ

このプロパティは、表示されるウィジェット名を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#displayName`
-   **Domain**: `wire:Widget`
-   **Range**: `rdfs:Literal`


#### `wire:value` プロパティ

このプロパティは、ウィジェット構成要素の値を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#value`
-   **Range**: `rdfs:Literal`


#### `wire:type` プロパティ

このプロパティは、ウィジェット構成要素のタイプを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#type`
-   **Range**: `rdfs:Literal`


#### `wire:default` プロパティ

このプロパティは、ウィジェット構成要素のデフォルト値を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#default`
-   **Range**: `rdfs:Literal`


#### `wire:secure` プロパティ

このプロパティは、ウィジェット構成要素が安全かどうかを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#value`
-   **Range**: `rdfs:Literal`


#### `wire:multiuser` プロパティ

このプロパティは、コンポーネントの永続変数がマルチユーザであるかどうかを表します。マルチユーザ永続変数は、
ダッシュボードへのアクセス権を持つ各ユーザの値を格納します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#value`
-   **Range**: `rdfs:Literal`


#### `wire:index` プロパティ

このプロパティは、同じ型の要素の論理的順序を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#value`
-   **Range**: `rdfs:Literal`


#### `wire:codeContentType` プロパティ

このプロパティは、ウィジェット・コードの MIME タイプを表します。ウィジェット・コード URI は、`usdl-core:Resource`
を使用して表されます。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#codeContentType`
-   **Domain**: `usdl-core:Resource`
-   **Range**: `rdfs:Literal`


#### `wire:codeCacheable` プロパティ

このプロパティは、ウィジェット・コードがキャッシュ可能かどうかを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/Widget#codeCacheable`
-   **Domain**: `usdl-core:Resource`
-   **Range**: `rdfs:Literal`


## WIRE-M ボキャブラリ

下の図は、WIRE-M のボキャブラリを示しています。

![The WIRE-M vocabulary](../../docs/images/mac_description_rdf_wire-m_diagram.png)

<div style="text-align: center; font-weight: bold;">WIRE-M ボキャブラリ</div>

このボキャブラリは、WIRE ボキャブラリと同様に、RDF を使用して、マッシュアップ情報を表現する方法を提供し、
これらの記述を USDL 文書から使用できるようにするには、このボキャブラリを Application Mashup GE 実装でサポートする
必要があります。


### クラス


#### `wire-m:Mashup` クラス

このクラスはマッシュアップを表します。これはワークスペースとして実装されます。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#Mashup`

-   **Properties include**: `wire:macVersion`, `wire-m:hasMashupPreference`, `wire-m:hasMashupParam`, `wire-m:hasTab`,
    `wire-m:hasMashupWiring`, `wire:hasImageUri`, `wire:hasiPhoneImageUri`, `wire:version`

-   **subClassOf**: `usdl:CompositeService`


#### `wire-m:Tab` クラス

このクラスは、ワークスペース・タブを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#Tab`

-   **Properties include**: `wire-m:hasiWidget`, `wire-m:hasTabPreference`, `dcterms:title`

-   **Used with**: `wire-m:hasTab`


#### `wire-m:iWidget` クラス

このクラスは、ウィジェットのインスタンスを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#iWidget`

-   **Properties include**: `wire-m:hasPosition`, `wire-m:hasiWidgetRendering`, `wire-m:hasiWidgetPreference`,
    `wire-m:hasiWidgetProperty `

-   **Used with**: `wire-m:hasiWidget`

-   **subClassOf**: `wire:Widget`


#### `wire-m:MashupPreference` クラス

このクラスは、マッシュアップの設定を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#MashupPreference`

-   **Properties include**: `dcterms:title`, `wire:value`

-   **Used with**: `wire-m:hasMashupPreference`


#### `wire-m:MashupParam` クラス

このクラスは、マッシュアップ・パラメータを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#MashupParam`

-   **Properties include**: `dcterms:title`, `wire:value`

-   **Used with**: `wire-m:hasMashupParam`


#### `wire-m:Position` クラス

このクラスは、タブ内のウィジェット・インスタンスの位置を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#Position`

-   **Properties include**: `wire-m:x, wire-m:y, wire-m:z`

-   **Used with**: `wire-m:hasPosition`


#### `wire-m:iWidgetPreference` クラス

このクラスは、ウィジェット・インスタンスのプレファレンスを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#iWidgetPreference`

-   **Properties include**: `dcterms:title`, `wire:value`, `wire-m:readonly`, `wire-m:hidden`

-   **Used with**: `wire-m:hasiWidgetPreference`


#### `wire-m:iWidgetRendering` クラス

このクラスは、ウィジェットのインスタンス・レンダリングを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#iWidgetRendering`

-   **Properties include**: `wire-m:fullDragboard`, `wire-m:layout`, `wire-m:minimized`, `wire:renderingHeight`,
    `wire:renderingWidth`

-   **Used with**: `wire-m:hasiWidgetRendering`


#### `wire-m:iWidgetProperty` クラス

このクラスは、ウィジェットのインスタンス・プロパティを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#iWidgetProperty`

-   **Properties include**: `wire-m:readonly`, `wire:value`

-   **Used with**: `wire-m:hasiWidgetProperty`


#### `wire-m:TabPreference` クラス

このクラスは、タブのプレファレンスを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#TabPreference`

-   **Properties include**: `dcterms:title`, `wire:value`

-   **Used with**: `wire-m:hasTabPreference`


#### `wire-m:Connection` クラス

このクラスは、2つのウィジェット・インスタンスまたはオペレータ・インスタンス間のワイヤーリング接続を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#Connection`

-   **Properties include**: `wire-m:hasSource`, `wire-m:hasTarget`, `dcterms:title`, `wire-m:readonly`

-   **Used with**: `wire-m:hasConnection`


#### `wire-m:Source` クラス

このクラスは、接続のソースであるウィジェット・インスタンスまたはオペレータ・インスタンスを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#Source`

-   **Properties include**: `wire-m:sourceId`, `wire-m:endpoint`, `wire:type`

-   **Used with**: `wire-m:hasSource`


#### `wire-m:Target` クラス

このクラスは、接続のターゲットとなるウィジェット・インスタンスまたはオペレータ・インスタンスを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#Target`

-   **Properties include**: `wire-m:targetId`, `wire-m:endpoint`, `wire:type`

-   **Used with**: `wire-m:hasTarget`


#### `wire-m:iOperator` クラス

このクラスは、ワイヤーリング構成内のオペレータ・インスタンスを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#iOperator`

-   **Properties include**: `wire-m:iOperatorId, dcterms:title`

-   **Used with**: `wire-m:hasiOperator`


### プロパティ

#### `wire-m:hasMashupPreference` プロパティ

このプロパティは、マッシュアップのプレファレンスを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasMashupPreference`

-   **Domain**: `wire-m:Mashup`

-   **Range**: `wire-m:MashupPreference`


#### `wire-m:hasMashupParam` プロパティ

このプロパティは、マッシュアップ・パラメータを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasMashupParam`

-   **Domain**: `wire-m:Mashup`

-   **Range**: `wire-m:MashupParam`


#### `wire-m:hasTab` プロパティ

このプロパティは、指定されたタブがワークスペースの一部であることを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasTab`

-   **Domain**: `wire-m:Mashup`

-   **Range**: `wire-m:Tab`


#### `wire-m:hasiWidget` プロパティ

このプロパティは、指定されたウィジェット・インスタンスがタブでインスタンス化されることを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasiWidget`

-   **Domain**: `wire-m:Tab`

-   **Range**: `wire-m:iWidget`


#### `wire-m:hasTabPreference` プロパティ

このプロパティは、タブのプレファレンスを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasTabPreference`

-   **Domain**: `wire-m:Tab`

-   **Range**: `wire-m:TabPreference`


#### `wire-m:hasPosition` プロパティ

このプロパティは、タブ内のウィジェット・インスタンスの位置を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasPosition`

-   **Domain**: `wire-m:iWidget`

-   **Range**: `wire-m:Position`


#### `wire-m:hasiWidgetPreference` プロパティ

このプロパティは、ウィジェット・インスタンスのプレファレンスを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasiWidgetPreference`

-   **Domain**: `wire-m:iWidget`

-   **Range**: `wire-m:iWidgetPreference`


#### `wire-m:hasiWidgetProperty` プロパティ

このプロパティは、ウィジェット・インスタンスのプロパティを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasiWidgetProperty`

-   **Domain**: `wire-m:iWidget`

-   **Range**: `wire-m:iWidgetProperty`


#### `wire-m:hasiWidgetRendering` プロパティ

このプロパティは、ウィジェット・インスタンスのレンダリングを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasiWidgetRendering`

-   **Domain**: `wire-m:iWidget`

-   **Range**: `wire-m:iWidgetRendering`


#### `wire-m:hasConnection` プロパティ

このプロパティはワイヤーリング接続を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasConnection`

-   **Domain**: `wire:PlatformWiring`

-   **Range**: `wire-m:Connection`


#### `wire-m:hasSource` プロパティ

このプロパティは、接続のソースを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasSource`

-   **Domain**: `wire-m:Connection`

-   **Range**: `wire-m:Source`


#### `wire-m:hasTarget` プロパティ

このプロパティは、接続のターゲットを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasTarget`

-   **Domain**: `wire-m:Connection`

-   **Range**: `wire-m:Target`


#### `wire-m:targetId` プロパティ

このプロパティは、ターゲットの id を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#targetId`

-   **Domain**: `wire-m:Target`

-   **Range**: `rdfs:Literal`


#### `wire-m:sourceId` プロパティ

このプロパティは、ソースの id を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#sourceId`

-   **Domain**: `wire-m:Source`

-   **Range**: `rdfs:Literal`


#### `wire-m:endpoint` プロパティ

このプロパティは、接続のソースまたはターゲットであるウィジェット・インスタンスまたはオペレータ・インスタンスの
id を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#endpoint`

-   **Range**: `rdfs:Literal`


#### `wire-m:hasiOperator` プロパティ

このプロパティは、オペレータのインスタンスのワイヤーリングを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hasiOperator`

-   **Domain**: `wire:PlatformWiring`

-   **Range**: `wire-m:iOperator`


#### `wire-m:x` プロパティ

このプロパティは、ウィジェット・インスタンスの位置の x 座標を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#x`

-   **Domain**: `wire-m:Position`

-   **Range**: `rdfs:Literal`


#### `wire-m:y` プロパティ

このプロパティは、ウィジェット・インスタンスの位置の y 座標を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#y`

-   **Domain**: `wire-m:Position`

-   **Range**: `rdfs:Literal`


#### `wire-m:z` プロパティ

このプロパティは、ウィジェット・インスタンスの位置の z 座標を表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#z`

-   **Domain**: `wire-m:Position`

-   **Range**: `rdfs:Literal`


#### `wire-m:fullDragboard` プロパティ

このプロパティは、ウィジェット・インスタンスがタブ内の全領域を占有しているかどうかを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#fullDragboard`

-   **Domain**: `wire-m:iWidgetRendering`

-   **Range**: `rdfs:Literal`


#### `wire-m:layout` プロパティ

このプロパティは、ウィジェット・インスタンスのレイアウトを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#layout`

-   **Domain**: `wire-m:iWidgetRendering`

-   **Range**: `rdfs:Literal`


#### `wire-m:minimized` プロパティ

このプロパティは、ウィジェット・インスタンスがそのタブで最小化されているかどうかを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#minimized`

-   **Domain**: `wire-m:iWidgetRendering`

-   **Range**: `rdfs:Literal`


#### `wire-m:hidden` プロパティ

このプロパティは、ウィジェット・インスタンスがタブ内に隠れているかどうかを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#hidden`

-   **Domain**: `wire-m:iWidgetPreference`

-   **Range**: `rdfs:Literal`


#### `wire-m:readonly` プロパティ

このプロパティは、マッシュアップの構成要素が読み取り専用かどうかを表します。

-   **URI**: `http://wirecloud.conwet.fi.upm.es/ns/mashup#readonly`

-   **Range**: `rdfs:Literal`
