## サポートしているブラウザ

WireCloud 1.3 は、次のデスクトップ・ブラウザをサポートしています :

-   Firefox 52+
-   Chrome 57+
-   Safari 10.1+
-   Opera 43+

WireCloud 1.3 は、ワイヤリングエディタが現在タッチスクリーンでは動作しないことを除けば、以前のブラウザのモバイル版
でも動作します。

> **注意**： WireCloud はこれらのブラウザをサポートしていますが、一部のウィジェットやオペレータはこれらのブラウザの
> すべてをサポートしていない場合があります。使用しているブラウザに制限があるかどうかを知るために、各ウィジェットと
> オペレータのドキュメントを読んでください。

## 新しいワークスペースの作成

WireCloud のマッシュアップは、**workspaces** のコンテキストで構築されています。ワークスペースは、複数のタブに
またがってマッシュアップできるウィジェットとオペレータのセットで構成されています。ワークスペース内のウィジェット
およびオペレータは、データ・フローまたはイベント・ベースのメカニズムを介してデータを共有できます。

使用中のワークスペースが画面上部に表示されます。これはよく知られている REST 命名法に似ています。たとえば、次の
スクリーンショットは、"Workspace" という名前のワークスペースを示しています。ユーザ "admin" に関連し、FIWARE Lab の
WireCloud インスタンスで実行されています。つまり、admin/Workspace という名前です。

<img src="../docs/images/user_guide/create_workspace/empty_workspace.png" srcset="../docs/images/user_guide/create_workspace/empty_workspace.png 2x" alt="Empty workspace"/>

ワークスペース名の近くには、クリックしてワークスペース・ドロップダウン・メニューを展開できるボタンがあります :

<img src="../docs/images/user_guide/create_workspace/workspace_menu.png" srcset="../docs/images/user_guide/create_workspace/workspace_menu.png 2x" alt="Workspace menu"/>

展開されると、メニューには既に作成されたワークスペースのリストが表示されます。上の図のワークスペース、
_My Multimedia Workspace_ および _IssueTrouble_ を参照してください :

-   **New workspace** は、新しいワークスペースを作成します
-   **Rename** は、現在のワークスペースの名前を変更します
-   **Share** は、現在のワークスペースの共有設定を表示します
-   **Upload to my resources** は、現在の作業領域をローカル・カタログに保存して後で使用できるようになります
-   **Embed** は、他の Web ページに現在のワークスペースを埋め込む方法を表示します
-   **Settings** は、現在のワークスペースの設定を変更します
-   **Remove** は、現在のワークスペースを削除します

"History Info" という名前の新しいワークスペースを作成したい場合は、ドロップダウンメニューで、_New workspace_
を選択します :

<img src="../docs/images/user_guide/create_workspace/new_workspace_entry.png" srcset="../docs/images/user_guide/create_workspace/new_workspace_entry.png 2x" alt="Click *New workspace*"/>

新しいワークスペースの名前を要求するダイアログが表示されます。設定したい名前を入力し、Accept ボタンをクリックします :

<img src="../docs/images/user_guide/create_workspace/new_workspace_dialog.png" srcset="../docs/images/user_guide/create_workspace/new_workspace_dialog.png 2x" alt="Dialog for creating a new workspace"/>

受け付けられると、新しいワークスペースの名前がウィンドウの上部に表示されます :

<img src="../docs/images/user_guide/create_workspace/new_workspace.png" srcset="../docs/images/user_guide/create_workspace/new_workspace.png 2x" alt=""History Info" workspace just after being created"/>

次のスクリーンショットは、ワークスペース機能を設定できる "Settings" メニューを示しています :

<img src="../docs/images/user_guide/create_workspace/workspace_settings.png" srcset="../docs/images/user_guide/create_workspace/workspace_settings.png 2x" alt="create_workspace/WorkspaceSettings.png"/>


## マーケットプレイスの閲覧

WireCloud のようなマッシュアップツールは、商品のようなウィジェットやオペレータを通してアクセス可能にされたサービスを
提供し処理することができる**マーケットプレイス** へのアクセスをサポートしなければなりません。

マーケットプレイスでは、ウィジェットとオペレータをすばやく見つけて比較することができます。これにより、以前よりも優れた
業界のエコシステムに参加することができます。ウィジェット、オペレータ、さらには事前に構築されたマッシュアップは、
インターネットベースのマーケットプレイスで提供および取得できる取引な可能商品になります。パートナー企業や他のユーザは、
既存のサービスと新しいサービスを組み合わせることで、新しいビジネスモデルが発生し、付加価値の高いチェーンが
拡張されます。

次の図は、WireCloud のスクリーンショットで、FIWARE Lab マーケットプレイスを示しています。

<img src="../docs/images/user_guide/bae/summary.png" srcset="../docs/images/user_guide/bae/summary.png 2x" alt="Initial marketplace view"/>


### マーケットプレイスの管理

ウィジェット、オペレータ、マッシュアップのオファーを探すときは、まずマーケットプレイスを選択する必要があります。
この目的のために、ワークスペース・パスに表示されるドロップダウン・メニューを使用してください。

<img src="../docs/images/user_guide/bae/marketplace_dropdown.png" srcset="../docs/images/user_guide/bae/marketplace_dropdown.png 2x" alt="Marketplace dropdown"/>

前のスクリーンショットに示されているように、このメニューではアクセスしているさまざまなマーケットプレイスの中から
選択することができます。新しいマーケットプレースを追加するには、そのエンドポイント (URL) を指定するだけです。
コンテキスト・メニューの _Delete Marketplace_ オプションで、現在のマーケットプレイスを削除することもできます。

次のスクリーン・ショットに示すように、_Add new marketplace_ オプションを使用して、FIWARE Lab マーケットプレイス
を追加できます :

<img src="../docs/images/user_guide/bae/add_new_marketplace_entry.png" srcset="../docs/images/user_guide/bae/add_new_marketplace_entry.png 2x" alt="Click *Add new marketplace*"/>

<img src="../docs/images/user_guide/bae/add_new_marketplace_dialog.png" srcset="../docs/images/user_guide/bae/add_new_marketplace_dialog.png 2x" alt="*Add new marketplace* dialog"/>

WireCloud には _My Resources_ と呼ばれる組み込みのローカル・カタログが用意されています。これにより、ユーザが
現在利用できるウィジェット、オペレータ、マッシュアップの中から検索することができます。次の図は、WireCloud
の特定のインスタンスのユーザの _My Resources_ のスクリーン・ショットを示しています。

<img src="../docs/images/user_guide/browsing_marketplace/my_resources.png" srcset="../docs/images/user_guide/browsing_marketplace/my_resources.png 2x" alt="*My Resources* view"/>

あなたが共有する全く新しいウィジェットを持っているウィジェット開発者であるか、どこかから WireCloud 対応ウィジェットをダウンロードしたばかりであれば、_My Resources_ ビューの _Upload_ ボタンを使って、簡単に新しいウィジェットを内蔵のローカルカタログにアップロードすることができます。

<img src="../docs/images/user_guide/browsing_marketplace/upload_button.png" srcset="../docs/images/user_guide/browsing_marketplace/upload_button.png 2x" alt="Click *Upload*"/>

<img src="../docs/images/user_guide/browsing_marketplace/upload_dialog.png" srcset="../docs/images/user_guide/browsing_marketplace/upload_dialog.png 2x" alt="MAC upload dialog"/>

## GitHub で既存のオープンソース・ウィジェットをブラウズ

多くのウィジェットは GitHub から無料でダウンロードできます。次の検索クエリは `wirecloud-widget` とタグ付けされた
すべてのリポジトリを取得します。

```text
https://github.com/search?q=wirecloud-widget&type=Repositories
```

[付録](widgets.md) には、GitHub で利用可能な80を超える一連のオープンソース・ウィジェットの最新バージョンへの詳細と
リンクの一覧があります。`git clone` して最新の開発ソースを直接構築することもできます。

## 新しいマッシュアップの構築

"[Creating a new workspace](#creating-a-new-workspace)" のセクションに記載されている手順に従った場合は、
"History Info" のワークスペースが必要です。この点から始めてみましょう：

<img src="../docs/images/user_guide/create_workspace/new_workspace.png" srcset="../docs/images/user_guide/create_workspace/new_workspace.png 2x" alt="Starting point"/>

マーケットプレイスにアクセスして、カタログ内のマッシュアップで使用したいコンポーネントを選択します :

<img src="../docs/images/user_guide/building_mashup/get_more_components.png" srcset="../docs/images/user_guide/building_mashup/get_more_components.png 2x" alt="Button for searching more components"/>

このマッシュアップ例のために必要なウィジェット/オペレータを確実に見つけるには、FIWARE Lab マーケットプレイスで、
[_WireCloudUserGuide_ offering](https://store.lab.fiware.org/#/offering/458) を使用して、それらをインストールして
ください。次の URL を使用してダウンロードすることもできます :

-   [CoNWeT_simple-history-module2linear-graph_2.3.2.wgt](attachments/CoNWeT_simple-history-module2linear-graph_2.3.2.wgt)
-   [CoNWeT_ngsi-source_3.0.7.wgt](attachments/CoNWeT_ngsi-source_3.0.7.wgt)
-   [CoNWeT_ngsientity2poi_3.0.3.wgt](attachments/CoNWeT_ngsientity2poi_3.0.3.wgt)
-   [CoNWeT_map-viewer_2.6.2.wgt](attachments/CoNWeT_map-viewer_2.6.2.wgt)
-   [CoNWeT_linear-graph_3.0.0b3.wgt](attachments/CoNWeT_linear-graph_3.0.0b3.wgt)

インストールしたら、この例で使用されているすべてのウィジェット/オペレータを _My Resources_ ビューで見ることができます :

<img src="../docs/images/user_guide/browsing_marketplace/my_resources.png" srcset="../docs/images/user_guide/browsing_marketplace/my_resources.png 2x" alt="List of used components"/>

エディタ・ビューに移動して、_Add components_ ボタンをクリックします :

<img src="../docs/images/user_guide/building_mashup/add_widget_button.png" srcset="../docs/images/user_guide/building_mashup/add_widget_button.png 2x" alt="Click *Add conponents*"/>

_Linear Graph_ ウィジェットを探し、_Add to workspace_ ボタンをクリックします :

<img src="../docs/images/user_guide/building_mashup/add_linear_graph.png" srcset="../docs/images/user_guide/building_mashup/add_linear_graph.png 2x" alt="Click *Add to workspace*"/>

これにより、_Linear Graph_ ウィジェットがダッシュボードに追加されます。必要なレイアウトが得られるまで移動して
サイズを変更することができます :

<img src="../docs/images/user_guide/building_mashup/initial_linear_graph_layout.png" srcset="../docs/images/user_guide/building_mashup/initial_linear_graph_layout.png 2x" alt="Initial *Linear Graph* layout"/>

_Linear Graph_ ウィジェットの追加手順と同じ手順に従って、_Map Viewer_ ウィジェットをダッシュボードに追加します。
並べ替え後、次のビューが表示されます。このビューには、デフォルトのタブにある2つのウィジェットが表示されます。
フッター・バーのワークスペースで使用されているタブが表示され、新しいタブを作成して、マッシュアップ内のウィジェットの
整理することができます。

<img src="../docs/images/user_guide/building_mashup/final_layout.png" srcset="../docs/images/user_guide/building_mashup/final_layout.png 2x" alt="Final layout"/>

### ウィジェットの設定を変更

目的のウィジェットをマッシュアップに追加し、そのウィジェットを配置してサイズを変更して、選択した情報ダッシュボードを
構成したら、その設定を変更できます。これを行うには、ウィジェットの右上隅に移動し、次のスクリーン・ショットに示すように
プロパティ・アイコンをクリックします :

<img src="../docs/images/user_guide/building_mashup/widget_menu_button.png" srcset="../docs/images/user_guide/building_mashup/widget_menu_button.png 2x" alt="Widget *Menu* button"/>

次に、いくつかのオプションを含むドロップダウン・メニューが表示されます。

<img src="../docs/images/user_guide/building_mashup/widget_menu_dropdown.png" srcset="../docs/images/user_guide/building_mashup/widget_menu_dropdown.png 2x" alt="Widget menu dropdown"/>

-   **Rename** は、ワークスペース・エディタおよびワイヤーリング・エディタのビューに表示されるウィジェット名を変更します
-   **Reload** は、ウィジェットをリロードします
-   **Upgrade/Downgrade** は、 ウィジェットのバージョンを変更することができます
-   **Logs** は、 ウィジェットのログ履歴を含むダイアログが表示されます
-   **Settings** は、現在のウィジェットの設定を変更するためのフォームが表示されます
-   **User's Manual** は、ウィジェットのドキュメントを開きます
-   **Full Dragboard** は、選択したウィジェットを最大化するので、キャンバス領域全体を占有します。このオプションは、
    ウィジェットがすでに"Full Dragboard" モードになっている場合は、**Exit Full Dragboard** になります。その場合、
    このオプションはウィジェットのサイズを最大化する前のサイズに戻します
-   **Extract from grid** は、グリッドからの抽出はキャンバスからウィジェットを持ち上げ、キャンバス上に、
    他のウィジェットの上にでも配置することができます。ウィジェットが現在グリッド外にある場合、このオプションは 
    **Snap to grid** になります。この場合、このオプションはウィジェットをグリッドにドッキングします

最後に、**Settings** をクリックすると、ウィジェットの設定用のカスタマイズされたダイアログが表示されます。この例では、
視覚化をカスタマイズするために、 _Map Viewer_ に初期位置、ズームレベル、および マーク・シャドウ半径
(Mark shadow radius) を指定する必要があります。

<img src="../docs/images/user_guide/building_mashup/mapviewer_settings.png" srcset="../docs/images/user_guide/building_mashup/mapviewer_settings.png 2x" alt="*Map Viewer* Settings"/>

初期位置と初期ズームを設定したので、ウィジェットをリロードする必要があります。これを行うには、プロパティのアイコンを
再度クリックしてから、 _Reload_ オプションをクリックします。

<img src="../docs/images/user_guide/building_mashup/mapviewer_reload_entry.png" srcset="../docs/images/user_guide/building_mashup/mapviewer_reload_entry.png 2x" alt="Reload option"/>

今度はウィジェットを新しい場所のサンタンデールを中心にし、設定した初期ズームレベルを使用します。

<img src="../docs/images/user_guide/building_mashup/mapviewer_configured.png" srcset="../docs/images/user_guide/building_mashup/mapviewer_configured.png 2x" alt="MapViewer widget after being configured"/>

現時点では、2つの個別のウィジェットでマッシュアップを作成しています。_Linear Graph_ ウィジェットは空で、描画するための
情報を提供して何かをワイヤーリングする必要があり、_Map Viewer_ は、"Points of Interest" のいずれかの種類を表示して、
ユーザがそれらを容易に選択できるようにするには良いオプションです。

<img src="../docs/images/user_guide/building_mashup/workspace_mapviewer_configured.png" srcset="../docs/images/user_guide/building_mashup/workspace_mapviewer_configured.png 2x" alt="Mashup with the map viewer configured"/>

### ワイヤーリング・ウィジェットとオペレータ

必要なウィジェットを選択したら、それらのウィジェットをワイヤーリングして相互通信を可能にし、調整された動作を実現
できます。WireCloud のウィジェットとオペレータは、エンドポイントと呼ばれる明確に識別されたポートを通じてイベントと
データを送受信できます。互換性のある2つのエンドポイントを接続すると、2つ目のエンドポイント、つまり入力エンドポイント
またはターゲットエンドポイントは、最初の1つ、つまり出力エンドポイントまたはソースエンドポイントからのデータフローおよび/またはイベントを受信する準備をします。

#### 基本的なワイヤーリングの概念

ウィジェットを接続してオペレータをマッシュアップに追加するには、ツールの Wiring ビューに移動します :

<img src="../docs/images/user_guide/building_mashup/wiring_button.png" srcset="../docs/images/user_guide/building_mashup/wiring_button.png 2x" alt="Click *Wiring*"/>

次に、空のワイヤーリング構成が表示されます。ウェルカム・メッセージを表示する空のキャンバスと表示されます :

<img src="../docs/images/user_guide/wiring/empty_wiring.png" srcset="../docs/images/user_guide/wiring/empty_wiring.png 2x" alt="Emtpy wiring"/>

ウィジェットの設計に内在する最も重要な特性の1つは、ウィジェットができるだけジェネリックでなければならないということ
です。たとえば、データソースをハードコーディングした特定の情報源を持つよりも、任意の情報源にオペレータを介して
ワイヤーリングできる汎用の _Map Viewer_ ウィジェットを持つ方がはるかに意味があります。オペレータは、特定の
マッシュアップのコンテキストで使用したい具体的なサービスまたは情報源とウィジェットを動的に関連付ける手段を表すため、
この一般性を実現する手段を表します。

この場合、*Map Viewer* ウィジェットにデータ情報を提供する NGSI ソースオペレータがあります。この種のオペレータは
パイピング・オペレータ (piping operators) と呼ばれます。したがって、これをワイヤーリングに追加する必要があります。

これを行うには、コンポーネントのサイドパネルを開いて、_NGSI source_ オペレータを検索し、_Create_ ボタンをクリック
します :

<img src="../docs/images/user_guide/wiring/create_operator_button.png" srcset="../docs/images/user_guide/wiring/create_operator_button.png 2x" alt="Click *Create*"/>

これにより、そのオペレータのインスタンスが作成され、_NGSI Source_ オペレータに関連付けられたボックスの下部に
表示されます。新しいオペレータがワイヤーリング設定で使用されていないことを示すハイライト表示されていることが
わかります。ワイヤーリング・エディタを離れるときに使用されないすべてのオペレータは、ワイヤーリング設定から
削除されます。

オペレータをオペレータ・リストからワイヤリング・キャンバスにドラッグします：

<img src="../docs/images/user_guide/wiring/add_ngsisource_sidebar.png" srcset="../docs/images/user_guide/wiring/add_ngsisource_sidebar.png 2x" alt="Recently created operator in the sidebar"/>

<img src="../docs/images/user_guide/wiring/add_ngsisource_drag.png" srcset="../docs/images/user_guide/wiring/add_ngsisource_drag.png 2x" alt="Drag the *NGSI Source* operator"/>

<img src="../docs/images/user_guide/wiring/add_ngsisource_finish.png" srcset="../docs/images/user_guide/wiring/add_ngsisource_finish.png 2x" alt="*NGSI Source* added to the wiring canvas"/>

一度追加すると、
[Orion Context Broker](http://catalogue.fiware.org/enablers/publishsubscribe-context-broker-orion-context-broker)
から取得する情報とそのインスタンスを知るように設定する必要があります。これを行うには、_Settings_ メニュー項目を
クリックします :

<img src="../docs/images/user_guide/wiring/ngsisource_settings.png" srcset="../docs/images/user_guide/wiring/ngsisource_settings.png 2x" alt="NGSI Source Settings option"/>

そして、次の設定が使用されていることを確認してください :

-   **NGSI server URL**: `http://orion.lab.fiware.org:1026/`
-   **NGSI proxy URL**: `https://ngsiproxy.lab.fiware.org`
-   **Use the FIWARE credentials of the user**: Enabled
-   **Use the FIWARE credentials of the workspace owner**: Disabled
-   **NGSI tenant/service:** Emtpy
-   **NGSI scope:** `/`
-   **NGSI entity types**: `Node, AMMS, Regulator`
-   **Id pattern**: Empty
-   **Monitored NGSI attributes**: `Latitud, Longitud, presence, batteryCharge, illuminance, ActivePower,
    ReactivePower, electricPotential, electricalCurrent`

さて、_Map Viewer_ ウィジェットに表示される情報源を準備しました。次のステップは _Map Viewer_ ウィジェットを
ワイヤリング・キャンバスに追加することです。この方法でそれらを接続することができます。これは、_NGSI Source_
オペレータと同じ方法で行いますが、サイド・バーの _Widget_ タブを使用して行います :

<img src="../docs/images/user_guide/wiring/add_mapviewer_sidebar.png" srcset="../docs/images/user_guide/wiring/add_mapviewer_sidebar.png 2x" alt="wiring/Wiring_NGSISource_MapViewer.png"/>

> **注**：エディタ・ビューで _Map Viewe_ ウィジェットのインスタンスを作成しましたが、_Create_ ボタンを使用して
> ワイヤエディタからウィジェット・インスタンスを作成することもできます :
>
> <img src="../docs/images/user_guide/wiring/create_widget_button.png" srcset="../docs/images/user_guide/wiring/create_widget_button.png 2x" alt="*Create* button"/>
>
> ワイヤーリング・エディタを終了したら、新しいウィジェットのサイズを変更して配置してください。

_Map Viewer_ ウィジェットをワイヤリング・キャンバスに追加した後は、これと同じようなものが必要です :

<img src="../docs/images/user_guide/wiring/wiring_after_adding_mapviewer.png" srcset="../docs/images/user_guide/wiring/wiring_after_adding_mapviewer.png 2x" alt="Wiring diagram after adding the *Map Viewer* widget"/>

ワイヤーリング・エディタには、接続用の推奨システムが付属しています。たとえば、_Provide entity_ エンドポイントに
ポインタを移動します。エンドポイントが強調表示されていることがわかります。これは、推奨システムが互換性のある
エンドポイントを検索していることを意味します。この場合、互換性のあるエンドポイントはありません。

<img src="../docs/images/user_guide/wiring/missing_connection_recommendations.png" srcset="../docs/images/user_guide/wiring/missing_connection_recommendations.png 2x" alt="Missing connection recommendations"/>

これは、_NGSI source_ の出力を _Map Viewer_ ウィジェットを直接接続できないためです。変換オペレータを使用して、
_NGSI source_ オペレータによって提供されるイベントデータを _Map Viewer_ ウィジェットが使用するフォーマットに変換する
ことができます。この例では、この変換を実行しようとするオペレータは、_NGSI Entity to PoI_ と呼ばれます :

<img src="../docs/images/user_guide/wiring/wiring_after_adding_ngsientity2poi.png" srcset="../docs/images/user_guide/wiring/wiring_after_adding_ngsientity2poi.png 2x" alt="Wiring diagram after adding the *NGSI Entity to PoI* operator"/>

オペレータを追加した後、ポインタを _Provide entity_ エンドポイントに移動して、推奨の接続があることを確認できます :

<img src="../docs/images/user_guide/wiring/endpoint_recommendation.png" srcset="../docs/images/user_guide/wiring/endpoint_recommendation.png 2x" alt="Connection recommendation over the *Provide entity* endpoint"/>

それで、それを接続することができます。これを行うために、_Provide entity_ エンドポイント上で、マウスボタンを押し下げて、
_Entity_ エンドポイントに矢印をドラッグします：

<img src="../docs/images/user_guide/wiring/ngsientity2poi_connection_dragging.png" srcset="../docs/images/user_guide/wiring/ngsientity2poi_connection_dragging.png 2x" alt="Dragging a connection"/>
<img src="../docs/images/user_guide/wiring/ngsientity2poi_connection_created.png" srcset="../docs/images/user_guide/wiring/ngsientity2poi_connection_created.png 2x" alt="Created connection"/>

_Map Viewer_ ウィジェットの _Insert/Update PoI_ エンドポイントに _NGSI Entity To PoI_ オペレータの _PoI_
エンドポイントも接続する必要があります :

<img src="../docs/images/user_guide/wiring/wiring_after_connecting_ngsientity2poin_and_mapviewer.png" srcset="../docs/images/user_guide/wiring/wiring_after_connecting_ngsientity2poin_and_mapviewer.png 2x" alt="Wiring diagram after connecting the *NGSI entity To PoI* operator and the *Map Viewer* widget"/>

もう一度、_NGSI Entity To PoI_ オペレータを構成する必要があります。これは、_NGSI Source_ と同じ方法で行われます。
この場合、値は次のようになります :

-   **Coordinates attribute**: `Latitud, Longitud`
-   **Marker Icon**: Empty

_Editor_ ビューに戻ると、マップ・ウィジェットが更新され、_NGSI source_ オペレータから取得した PoIs が表示されます。

<img src="../docs/images/user_guide/wiring/mapviewer_with_entities.png" srcset="../docs/images/user_guide/wiring/mapviewer_with_entities.png 2x" alt="Map Viewer widget displaying shome PoIs"/>

_Map Viewer_ を使用して、ビュー・ポートを移動したり、PoI を選択したりすることができます。実際には、データソースに
接続された _Map Viewer_ ウィジェットだけですが、パイピングと変換オペレータを使用することで大きな柔軟性が得られます。

<img src="../docs/images/user_guide/wiring/mapviewer_entity_details.png" srcset="../docs/images/user_guide/wiring/mapviewer_entity_details.png 2x" alt="Map Viewer widget displaying the details of an entity"/>


#### その他の一般的なワイヤーリング

最も一般的な操作の1つは、ワイヤーリングで接続を削除する作業です。たとえば、何らかの理由で間違えた場合は、接続の途中に
表示される _Remove_ ボタンをクリックして修正できます :

<img src="../docs/images/user_guide/wiring/delete_arrow1.png" srcset="../docs/images/user_guide/wiring/delete_arrow1.png 2x" alt="*Remove* button"/>

場合によっては、接続の1つを変更することが必要な場合もあります。ワイヤーリング・エディタを使用すると、接続を削除したり、
新しい接続を作成しなくても、この操作を実行できます。これを行うには、接続を選択して、変更するエンドポイントから接続を
ドラッグするだけです :

<img src="../docs/images/user_guide/wiring/modify_connection1.png" srcset="../docs/images/user_guide/wiring/modify_connection1.png 2x" alt="How to modify a connection"/>
<img src="../docs/images/user_guide/wiring/modify_connection2.png" srcset="../docs/images/user_guide/wiring/modify_connection2.png 2x" alt="Dragging the new connection"/>
<img src="../docs/images/user_guide/wiring/modify_connection3.png" srcset="../docs/images/user_guide/wiring/modify_connection3.png 2x" alt="Connection once modified"/>
<img src="../docs/images/user_guide/wiring/modify_connection4.png" srcset="../docs/images/user_guide/wiring/modify_connection4.png 2x" alt="Connection once modified"/>

別の一般的なタスクは、接続の形状を変更することです。これを行うには、接続の _Customize_ オプションをクリックする必要が
あります :

<img src="../docs/images/user_guide/wiring/reshape_arrow_pre.png" srcset="../docs/images/user_guide/wiring/reshape_arrow_pre.png 2x" alt="*Customize* option"/>

有効になると、接続の形状を変更するために表示されるハンドルを移動するだけで済みます。

<img src="../docs/images/user_guide/wiring/reshape_arrow1.png" srcset="../docs/images/user_guide/wiring/reshape_arrow1.png 2x" alt="wiring/reshape_arrow1.png"/>
<img src="../docs/images/user_guide/wiring/reshape_arrow2.png" srcset="../docs/images/user_guide/wiring/reshape_arrow2.png 2x" alt="wiring/reshape_arrow2.png"/>

接続のカスタマイズを停止する場合は、接続の外側をクリックするか、_Stop Customizing_ オプションを使用します :

<img src="../docs/images/user_guide/wiring/reshape_arrow_stop.png" srcset="../docs/images/user_guide/wiring/reshape_arrow_stop.png 2x" alt="*Stop Customizing* option"/>

また、スペース使用量を改善するためにオペレータを最小化することもできます。これは、コンポーネントメニューに表示される
_Collapse_ オプションを使用して実行できます  :

<img src="../docs/images/user_guide/wiring/minimize_option.png" srcset="../docs/images/user_guide/wiring/minimize_option.png 2x" alt="*Collapse* option"/>
<img src="../docs/images/user_guide/wiring/collapsed_operators.png" srcset="../docs/images/user_guide/wiring/collapsed_operators.png 2x" alt="Collapsed operators"/>

#### 例のまとめ

あなたの直感や、ドキュメンテーション、各ウィジェット/オペレータが提供するコンテキスト・ヘルプに従って、マッシュアップの
残りのウィジェットを引き続きワイヤーリングします。念のため、次のスクリーンショットで最終結果を確認できます：

<img src="../docs/images/user_guide/wiring/final_wiring.png" srcset="../docs/images/user_guide/wiring/final_wiring.png 2x" alt="Final wiring configuration"/>

これで新しいワークスペースで遊ぶことができます。

<img src="../docs/images/user_guide/wiring/final_mashup.png" srcset="../docs/images/user_guide/wiring/final_mashup.png 2x" alt="Final mashup"/>

<img src="../docs/images/user_guide/wiring/linear_graph_zoom1.png" srcset="../docs/images/user_guide/wiring/linear_graph_zoom1.png 2x" alt="How to select an area in the linear graph widget"/>

<img src="../docs/images/user_guide/wiring/linear_graph_zoom2.png" srcset="../docs/images/user_guide/wiring/linear_graph_zoom2.png 2x" alt="Final mashup linear graph with zoom"/>

## ビヘイビア指向のワイヤーリング

WireCloud 0.8.0 から、いくつかの _behaviours_ を合成することでワイヤーリング設定を作成することができます。

_behaviours_ は、アプリケーションのマッシュアップに機能やビヘイビアを追加するために、それらの間に確立された接続を
持つコンポーネントのセットです。たとえば、前のセクションで作成したダッシュボードで使用されていたワイヤーリング設定を
2つのビヘイビアに分割できます :

-   最初のものは、**Show lampposts on map** を呼び出すことができます。この動作は、`NGSI Source`, `NGSI Entity To PoI`,
    `Map Viewe` コンポーネントとそれらのコンポーネント間の接続で構成されます :

    <img src="../docs/images/user_guide/behaviour_oriented_wiring/santander_behaviour1.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/santander_behaviour1.png 2x" alt="*Show lampposts on map* behaviour (Santander example)"/>

-   2番目のものは、**Show lamppost details** を呼び出すことができます。この動作は、`Map Viewer`, `History Module`,
    `Map Viewer`, `Linear Graph` コンポーネントとそれらのコンポーネント間の接続で構成されます :

    <img src="../docs/images/user_guide/behaviour_oriented_wiring/santander_behaviour2.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/santander_behaviour2.png 2x" alt="*Show lampposts details* behaviour (Santander example)"/>

> コンポーネントと接続が複数の動作で存在する可能性があることを考慮してください。たとえば、前の例では、_Map Viewer_
> ウィジェットが両方のビヘイビアで使用されていました。

WireCloud は、ビヘイビア方法論を使用することなく、アプリケーション・マッシュアップの作成をサポートし続けます。
ただし、この新機能を使用すると、WireCloud は、いくつかの利点を提供します :

-   ワイヤーリング構成を複数のビヘイビアに分割することで、より組織的で構造化されたダイアグラムと、特定の方法で
    コンポーネントを使用して接続する理由をドキュメント化する方法を提供できます
-   ビヘイビア指向ワイヤーリングを使用することで学習曲線がより困難になるという事実を無視して、ワイヤーリング構成の
    開発が容易になり、いくつかのフェーズを使用して開発することができます
-   このドキュメントは、初心者の開発者や、特定のアプリケーション・マッシュアップのビヘイビアを再現したい開発者の
    ための良い出発点でもあります。他のユーザによって開発されたアプリケーションマッシュアップにアクセスし、
    ビヘイビアの記述を読むことによってワイヤーリング構成がどのように機能するかを知る必要があります

### ビヘイビア・エンジンの有効化/無効化

ビヘイビア指向の方法論を使用する前に、それを有効にする必要があります。これを行うには、ワイヤリング・エディタ・ビューに
移動し、_List behaviors_ ボタンをクリックします。

<img src="../docs/images/user_guide/behaviour_oriented_wiring/list_behaviours_button.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/list_behaviours_button.png 2x" alt="*List behaviours* button"/>

これは、現在、ビヘイビアがないサイドパネルを表示します。_Enable_ ボタンをクリックします :

<img src="../docs/images/user_guide/behaviour_oriented_wiring/enable_behaviours_button.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/enable_behaviours_button.png 2x" alt="*Enable* behaviour engine button"/>

有効になると、ワイヤーリング構成に以前に追加されたすべてのコンポーネントと接続を使用して、最初のビヘイビアを持ちます。

> _注_：_disable_ ボタンをクリックして、ビヘイビア・エンジンを使用しないように、いつでも戻すことができます。
>
> <img src="../docs/images/user_guide/behaviour_oriented_wiring/disable_behaviours_button.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/disable_behaviours_button.png 2x" alt="*Disable* behaviour engine button"/>
>
> ビヘイビア・エンジンを無効にすると、すべてのコンポーネントと接続が単一のビューに収縮します。
>
> この操作を元に戻すことはできません。

### ビヘイビア指向のワイヤーリング・ユーザインターフェイスの使用

<img src="../docs/images/user_guide/behaviour_oriented_wiring/general_aspect.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/general_aspect.png 2x" alt="General aspect of the behaviour oriented wiring user interface"/>

これは、ビヘイビア・エンジンが有効になっているときのワイヤーリング・エディタ・インターフェイスの外観です。_Behaviours_
セクションの各パネルはビヘイビアを表し、表現されたビヘイビアの名前と説明を表示します。

注目するのは、ビヘイビアの1つが強調表示されていることです。これは、一度に1つのビヘイビアだけを編集できるためです。
これはアクティブなビヘイビアです。アクティブなビヘイビアの名前はワイヤーリングエディタのフッターにも表示されるので、
ビヘイビア・リストパネルが非表示になっている場合も含めて、常にどのビヘイビアがアクティブなビヘイビアであるかを
知ることができます。アクティブなビヘイビアを変更することは、ビヘイビアを表すパネルをクリックするだけです。

注意すべき他の重要なことは、ワイヤリング・キャンバス内にいくつかの "色あせた(faded)" コンポーネントがあることです
(_Search For_ ウィジェットなど)。バックグラウンド・コンポーネントは、アクティブ・ビヘイビアの一部を形成しないため、
他のビヘイビアの一部を形成しますが、色あせします。

#### コンポーネントの追加と接続の作成

ビヘイビア・エンジンを無効にしたときに追加されたのと同じ方法で、新しいコンポーネントをビヘイビアに追加できます。
すなわち、それらをコンポーネントのサイドパネルからドラッグします。考慮する必要があるのは、これらのコンポーネントが
アクティブなビヘイビアに追加されることだけです。

他のビヘイビアにすでに含まれているコンポーネントを使用する場合は、含めたいバックグラウンド・コンポーネントの
_Add_ ボタンを使用できます :

<img src="../docs/images/user_guide/behaviour_oriented_wiring/component_share_button.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/component_share_button.png 2x" alt="Component *Add* button"/>

接続にも同じことが適用されます。新しい接続を作成すると、その接続はアクティブな動作にのみ追加されます。すでに他の
ビヘイビアで使用可能な接続を含める場合は、バックグラウンド接続の _Add_ ボタンをクリックします :

<img src="../docs/images/user_guide/behaviour_oriented_wiring/connection_share_button.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/connection_share_button.png 2x" alt="Connection *Add* button"/>

> **注**：バックグラウンド接続がバックグラウンド・コンポーネントを意味する場合、その接続を追加すると、
> そのバックグラウンド・コンポーネントもアクティブなビヘイビアに追加されます。

#### 新しいビヘイビアを作成

新しいビヘイビアを作成するには、リスト・ビヘイビアのサイドパネルで _Create behaviour_ ボタンをクリックします。

<img src="../docs/images/user_guide/behaviour_oriented_wiring/create_behaviour_button.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/create_behaviour_button.png 2x" alt="*Create* behaviour button"/>

<img src="../docs/images/user_guide/behaviour_oriented_wiring/new_behaviour_dialog.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/new_behaviour_dialog.png 2x" alt="*New Behaviour* dialog"/>

ビヘイビアのタイトルと説明を編集するには、環境設定メニューを開き、_Settings_ オプションをクリックします :

<img src="../docs/images/user_guide/behaviour_oriented_wiring/behaviour_settings_option.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/behaviour_settings_option.png 2x" alt="Behaviour *Settings* option"/>

#### ビヘイビアの削除

ビヘイビアが1つしかない場合 (ビヘイビア・エンジンが有効なときに少なくとも1つのビヘイビアがワイヤーリング設定に
存在する必要があります) を除いて、いつでもビヘイビアをいつでも削除できます。これを行うには、削除する動作の _Remove_
ボタンをクリックします :

<img src="../docs/images/user_guide/behaviour_oriented_wiring/remove_behaviour_button.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/remove_behaviour_button.png 2x" alt="*Remove* behaviour button"/>

> **注**：他のビヘイビアで使用されていないすべてのコンポーネントは、ワイヤーリング設定から削除されます。
> また、この操作を元に戻すことができないことも考慮してください。

#### コンポーネントと接続の削除

ビヘイビアからコンポーネントを削除するには、_Delete_ ボタンをクリックします :

<img src="../docs/images/user_guide/behaviour_oriented_wiring/remove_component.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/remove_component.png 2x" alt="*Remove* component button"/>

使用可能なビヘイビアで使用されていないコンポーネントは、ワイヤーリング構成から完全に削除されます。

接続にも同じことが適用されますが、_Delete_ ボタンを使用してビヘイビアな動作から削除できます :

<img src="../docs/images/user_guide/behaviour_oriented_wiring/remove_connection.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/remove_connection.png 2x" alt="*Remove* connection button"/>

この場合も、接続がすべてのビヘイビアから削除されると、ワイヤーリング構成から接続が削除されます。

#### ビヘイビアの順序

ビヘイビア・エンジンの主な目的は、ワイヤーリング構成をドキュメント化することであり、その意味で、人間は特定の順序を
使用してアイデアを公開する傾向があります。ワイヤーリング・エディタでは、ビヘイビア・リストで使用されている順序を
変更できますが、その順序はワイヤーリング・エンジンに適用されません。

ビヘイビア順を変更するには、 _Order behaviours_ ボタンをクリックする必要があります :

<img src="../docs/images/user_guide/behaviour_oriented_wiring/order_behaviours_button.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/order_behaviours_button.png 2x" alt="*Remove* connection button"/>

順序モード (ordering mode) を起動すると、ビヘイビア・ボックスをドラッグ＆ドロップできます：

<img src="../docs/images/user_guide/behaviour_oriented_wiring/ordering_behaviours.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/ordering_behaviours.png 2x" alt="Ordering behaviours"/>

最後に、_Order behaviours_ ボタンを再度クリックして、オーダー・モード を終了します :

<img src="../docs/images/user_guide/behaviour_oriented_wiring/exit_order_behaviours_mode.png" srcset="../docs/images/user_guide/behaviour_oriented_wiring/exit_order_behaviours_mode.png 2x" alt="Exit the ordering mode"/>

> **注**：いずれにしても、サイドバーを閉じるか、サイドバー内のサーチ・コンポーネントのフォームを開いて、ビヘイビアの
> オーダー・モードを終了することもできます。


## マッシュアップの共有

ワークスペースは、以下のように設定を変更して公開することができます :

1.  ワークスペース・メニューボタンをクリックし、_Share_ をクリックします :
    <img src="../docs/images/user_guide/wiring/share_workspace_entry.png" srcset="../docs/images/user_guide/wiring/share_workspace_entry.png 2x" alt="*Share* option"/>

2.  ワークスペースの共有設定を編集するためのダイアログが表示されます :
    <img src="../docs/images/user_guide/wiring/share_workspace_dialog.png" srcset="../docs/images/user_guide/wiring/share_workspace_dialog.png 2x" alt="Sharing settings dialog"/>

ワークスペースをパブリックにすると、ワークスペースの URL を他のユーザと共有することができます

### マッシュアップを他の Web ページに埋め込む

すべてのワークスペースを埋め込むことができますが、WireCloud からワークスペースを直接使用する場合に適用されるアクセスルールは同じです。ワークスペースをパブリックにしない場合は、ユーザは WireCloud にログインし、十分なアクセス権が必要です。このため、マッシュアップを他の Web ページに埋め込む前に、ワークスペースの共有設定を最初に変更する必要があります。

また、次の手順に従って、他のWebページにコピー＆ペーストする必要があるコードを取得することもできます :

1.  ワークスペース・メニューボタンをクリックし、*Embed* をクリックします :
    <img src="../docs/images/user_guide/wiring/embed_workspace_entry.png" srcset="../docs/images/user_guide/wiring/embed_workspace_entry.png 2x" alt="*Embed* workspace option"/>

2.  マッシュアップを埋め込むためのコードを示す新しいウィンドウです。HTML ドキュメントにコピー＆ペーストします :
    <img src="../docs/images/user_guide/wiring/embed_workspace_dialog.png" srcset="../docs/images/user_guide/wiring/embed_workspace_dialog.png 2x" alt="Embed workspace dialog"/>

## その他の情報源

さまざまな視点 (エンドユーザ、開発者、管理者) から WireCloud を使用する方法の詳細については、FIWARE Academy の
[Application Mashup GE fundamentals course ](https://fiware-academy.readthedocs.io/en/latest/processing/wirecloud/index.html) を参照してください。
もう一つの情報源は [WireCloud のウェブサイト](https://conwet.fi.upm.es/wirecloud/) で、より一般的な情報や
デモ・ビデオなどの興味深いリソースがあります。
