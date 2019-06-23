このセクションでは、WireCloud の新しいテーマを作成する方法について説明します。

> このドキュメントは WireCloud 1.0 以降をベースにしています。以前のバージョンの WireCloud も同様の方法で動作しますが、
> 詳細は異なる場合があります。

## 基本テーマ

完全にカスタマイズされたテーマを必要としない場合は、別のテーマで使用される値 (色、デフォルトサイズなど) の一部を
変更して、新しいテーマを作成できます。つまり、元のテーマで使用されている SCSS 変数のセットを変更するだけです。

ただし、これを行うには、次の構造の新しいフォルダを事前に作成する必要があります :

```text
mytheme
+-- __init__.py
+-- static
    +-- css
        +-- _variables.scss
```

`__init__.py` ファイルは、WireCloud で使用されるプラグイン・アーキテクチャによって必要とされます。既定の設定を使用する
場合は空のファイルにすることができますが、存在する必要があります。利用可能な設定変数の完全なリストと説明については、
"[テーマ作成](#theme-settings)" のセクションを参照してください。

デフォルトでは、すべてのテーマが `wirecloud.defaulttheme` から拡張されます。別のテーマから拡張する必要がありますか？
例えば、`wirecloud.fiwarelabtheme` のテーマから拡張したい場合、次のコンテンツを `__init__.py`
ファイルに追加してください：

```python
parent = "wirecloud.fiwarelabtheme"
```

`_variables.scss` ファイルは、テーマによって使用される値を変更できるようにするものです。使用可能な変数のリストに
ついては、後の "[使用可能な SCSS 変数](#available-scss-variables)" のセクションで説明します。

たとえば、この `_variables.scss` サンプルファイルを使用して、プライマリ・ボタン、強調表示されたメニュー項目、
およびプレーン・ボタンが使用するプライマリ・カラーを変更できます。

```SCSS
$brand-primary: rgb(107, 21, 161);
/*
This color can also be defined using its hex code or its hsl definition:
$brand-primary: #6B15A1;
$brand-primary: hsl(277, 77%, 36%);
*/
$button-gradients: false;

@import 'defaults';
```

`_variables.scss` ファイルは、[SCSS (Sassy CSS) 構文](http://sass-lang.com/guide)を使用して記述する必要があり、
テーマによって使用される変数の値を上書きするために使用されます。このファイルは、変数のデフォルト値をロードするために、
`@import 'defaults'` 行を使用して、`_defaults.scss` ファイルをインポートする必要があります。


## テーマを使用

テーマを使用するには2つの方法があります :

1.  他の WireCloud インスタンスと一緒に配布または共有したくない場合は、テーマフォルダを WireCloud
    インスタンス・フォルダ内にドロップするだけです。次に、`settings.py` ファイルを編集して
    [`THEME_ACTIVE` setting](../../installation_guide/#theme_active) 設定を変更して、テーマを使用するための
    WireCloud インスタンスを設定できます。

    たとえば、`/opt/wirecloud_instance` フォルダに WireCloud インスタンスを作成した場合は、`mytheme` フォルダは、
    `/opt/wirecloud_instance/mytheme` に配置する必要があります 。テーマをデプロイしたら、カスタムテーマを使用する
    ために、`settings.py` ファイルに `THEME_ACTIVE = 'mytheme'` を設定してください。

2.  パッケージ化の目的で、python で使われている標準的なツールを使ってあなたのテーマをパッケージ化して配布することが
    できます。例えば、パッケージを構築するための [setuptools](http://pythonhosted.org/setuptools/) と、
    テーマを配布するための [pypi](https://pypi.python.org/pypi) を使用します。

    テーマ・パッケージをシステム, virtual env にインストールすると、WireCloud インスタンスによって使用される仮想環境が
    使用され、いつものように `THEME_ACTIVE` 設定を使用することができます

    > この場合、他の Python モジュールとの衝突を避けるために、テーマに適したモジュール名を提供する必要があることに
    > 注意してください。


## 完全なテーマ構造と背景の詳細

WireCloud のテーマは、Django アプリケーションと Python モジュールです。これが `__init__.py` ファイルが必要な理由です。
テーマ・フォルダは複数のフォルダに分割されており、テーマごとに異なるリソース (テンプレート、画像、SCSS ファイルなど)
が含まれています。WireCloud テーマのフォルダ構造は、次のようになります :

```text
mytheme
+-- __init__.py
+-- static
|   |   ...
|   +-- css
|   +-- fonts
|   +-- images
+-- templates
    |   ...
    +-- 400.html
    +-- 401.html
    +-- 403.html
    +-- 404.html
    +-- 500.html
    +-- wirecloud
        |   ...
        +-- workspace
        +-- views

```

-   `__init__.py`  : このファイルはテーマフォルダが python モジュールである必要があるため必須です。このファイルは、
    テーマの設定を変更するためにも使用されます。
-   `static` : テーマによって提供される静的ファイルを含みます。 これは
    [Django の staticfiles app](https://docs.djangoproject.com/en/1.6/ref/contrib/staticfile)
    を使用して提供されます。 通常、このフォルダは次のサブフォルダで構成されています :

    -   `css` : テーマで使用される SCSS ファイルが含まれています。前述のように、WireCloud はスタイルシートに
        [SCSS (Sassy CSS) 構文](http://sass-lang.com/guide)を使用します。WireCoud には
        [Compass](http://compass-style.org/help/tutorials/integration/) v0.12.1 も含まれているので、
        必要に応じて使用することができます
    -   `fonts` : SCSS ファイルで使用されるフォント
    -   `images` : SCSS ファイルまたは Django テンプレートから直接使用されるイメージ

-   `templates` : このフォルダには、テーマによって使用される Django テンプレートが含まれています。このフォルダを
    使用すると、テーマは WireCloud で使用されるサードパーティの Django アプリ、例えば
    [Django の管理アプリ](https://docs.djangoproject.com/en/1.8/ref/contrib/admin/#admin-overriding-templates)
    によって提供されるテンプレートを上書きすることもできることを考慮してください 。このフォルダを使用して
    オーバーライドすることができ、他の一般的なテンプレートもあります。たとえば、`404.html`, `500.html`, ...

    -   `wirecloud` : このフォルダには、WireCloud によって直接使用されるテンプレートが含まれています。一般に、
        これらのテンプレートは、WireCloud 内で使用される各コンポーネント/スニペットのスニペットです。たとえば、
        ワークスペース領域に示されているように、ウィジェットの HTML を作成するために
        `wirecloud/workspace/widget.html` テンプレートが使用されます

        主な例外は、WireCloud で使用されるマスター HTML ドキュメントのテンプレートを提供するような、`views`
        フォルダ内に用意されているテンプレートです。


> **注**: SCSS 構文は標準の CSS 構文と互換性があることを考慮してください。`_variables.scss` ファイルを除き、SCSS
> 機能を使用したくない場合、SCSS機能を使用する必要はありません。

WireCloud テーマを開発するときは、次の2点を考慮する必要があります :

-   任意のファイルを `static` フォルダに追加できますが、WireCloud はあらかじめ定義された SCSS ファイルのリストを
    使用します。WireCloud で使用されていない SCSS ファイルを追加すると、デフォルトでは無視されます。WireCloud
    で使用される SCSS ファイルに SCSS ファイルを追加する場合は、マスター HTML ページの Django
    テンプレートを変更する必要があります

-   Django テンプレートにも同様のことが適用されます : 使用されるテンプレートのリストは、WireCloudによって、WireCloud
    によって使用されるサードパーティ・アプリケーション、および有効な WireCloud プラグインによって定義されます

-   WireCloud で使用されるすべての SCSS とテンプレートファイルの完全バージョンを書く必要はありません。
    対応するファイルが存在しない場合は、ファイルのデフォルト・バージョンが `wirecloud.defaulttheme` から取得されて、
    使用されます

使用される SCSS ファイルと django テンプレートのリストは、次のセクションで提供されています。


### テーマ設定

-   `parent` (***WireCloud 0.9.0 の新機能***) : 拡張するテーマの名前。この設定に値を指定しないと、テーマは
    デフォルトで `wirecloud.defaulttheme` が拡張されます。新しいルートテーマの作成には、`parent = None` を使用します。

-   `label` (***WireCloud 0.9.0 の新機能***) : テーマの人間が読める名前です。デフォルトでは、Python モジュールの
    最後のコンポーネントになります。


## 使用可能なテンプレート

-   `wirecloud/catalogue/modals/upload.html` : _My Resources_ ビューで使用されるアップロード・コンポーネントの
    モーダル内に表示されるコンテンツ
-   `wirecloud/workspace/missing_widget.html` : 欠落しているウィジェット内に表示されるコンテンツ
-   `wirecloud/workspace/widget.html` : ウィジェットの iframes がダッシュボードに挿入されるボックスの HTML 構造
-   `wirecloud/modals/base.html` : WireCloud に表示されるダイアログ/モーダルの HTML 構造
-   `wirecloud/modals/embed_code.html` : 埋め込みコード・モーダルの内容
-   `wirecloud/modals/upgrade_downgrade_component.html` : ワークスペース・ビューとワイヤーリング・ビューで使用される
    アップグレード/ダウングレードのコンポーネント・モーダルの内容
-   `wirecloud/wiring/behaviour_sidebar.html` : ワイヤーリング・エディタ・ビューで使用されるビヘイビアのサイドバーの
    HTML 構造
-   `wirecloud/wiring/component_group.html` : ワイヤーリング・エディタ・ビューで使用されるコンポーネントのサイドバー
    内にコンポーネント・グループを表示するために使用される HTML 構造
-   `wirecloud/wiring/component_sidebar.html` :ワイヤーリング・エディタ・ビューで使用されるコンポーネントのサイドバー
    の HTML 構造
-   `wirecloud/views/embedded.html` : WireCloud の埋め込みバージョン用の HTML 構造


### テンプレート : `wirecloud/catalogue/modals/upload.html`

このテンプレートは、新しいコンポーネントをアップロードするために、_My Resources_ ビューで使用される
アップロード・モーダルの初期コンテンツをレンダリングするために使用されます。


**関連する SCSS ファイル** : 

-   `catalogue/modals/upload.scss`


#### 利用可能なコンポーネント

-   `uploadfilebutton` : ファイルを選択するためのブラウザ・ダイアログを開くためのボタン

**使用例**:

```html+django
{% load i18n %}{% load wirecloudtags %}
<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml">
    <div class="wc-upload-mac-message">
        <div class="alert alert-info">
            <img class="mac-package" src="{% theme_static "images/catalogue/mac_package.png" %}" />
            <p>{% trans "Do you have a widget, operator or mashup stored in a wgt file? Then you can upload it to the catalogue by means of this dialog." %}</p>
        </div>
        <div class="wc-upload-mac-title">{% trans "Drag files here" %}</div>
        <div class="wc-upload-mac-or">{% trans "- or -" %}</div>
        <div class="wc-upload-mac-button"><t:uploadfilebutton/></div>
    </div>
</s:styledgui>
```

### テンプレート : `wirecloud/workspace/missing_widget.html`

このテンプレートを使用すると、不足しているウィジェット内に表示されるコンテンツを設定できます。このコンテンツは
`iframe` 要素内でレンダリングされるので、このテンプレートは HTML ドキュメントを提供する必要があります。


**利用可能なコンテキスト**:

これは、Django テンプレート・エンジンに提供されるコンテキスト変数のリストです : 

-   `style` : デフォルトのスタイルを適用するのに必要なスタイルシートのファイルのリスト


**使用例**:

```html+django
{% load i18n %}<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="width=device-width, user-scalable=no" />
        {% for file in style %}<link rel="stylesheet" type="text/css" href="{{ file }}" />
        {% endfor %}
    </head>

    <body style="padding: 10px;">
        <div class="alert alert-danger alert-block">
            <h4>{% trans "Missing widget" %}</h4>
            {% trans "This widget is currently not available. Probably you or an administrator uninstalled it." %}
            {% blocktrans %}<h5>Suggestions:</h5>
            <ul>
                <li>Remove this widget from the dashboard</li>
                <li>Reinstall the appropiated version of the widget</li>
                <li>Install another version of the widget and use the <em>Upgrade/Downgrade</em> option</li>
            </ul>{% endblocktrans %}
        </div>
    </body>
</html>
```

### テンプレート : `wirecloud/workspace/widget.html`

> 以前の名称 : `wirecloud/ui/iwidget.html`


**関連する SCSS ファイル**:

-   `wirecloud/workspace/widget.scss`

**利用可能なコンポーネント**:

-   `title` : ウィジェットのタイトルを持つ `spam` 要素を挿入します
-   `errorbutton` : ウィジェットにエラーがある場合に有効になるボタン。このボタンは、ユーザがクリックすると
    ログ・マネージャのウィンドウを開きます
-   `minimizebutton` : ウィジェットを最大化および最小化するために使用されるボタン
-   `menubutton` : プレファレンス設定メニューを開くためのボタン
-   `closebutton` : ワークスペースからウィジェットを削除するためのボタン
-   `iframe` (必須) : ウィジェットのコンテンツを含む iframe
-   `leftresizehandle` : `div` 要素は、左下の四角からウィジェットのサイズを変更するために使用します。
    この要素は `wc-bottom-left-resize-handle` クラスを使用します
-   `bottomresizehandle` : 下側からウィジェットのサイズを変更するための `div` 要素。この要素は
    `wc-bottom-resize-handle` クラスを使用します
-   `rightresizehandle` : 右下の正方形からウィジェットのサイズを変更するための `div` 要素。この要素は
    `wc-bottom-right-resize-handle` クラスを使用します

**使用例**:

```html+django
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div class="fade panel panel-default">
    <div class="panel-heading"><h4 class="panel-title"><t:title/></h4><div class="wc-iwidget-infobuttons"><t:errorbutton/></div><div class="wc-iwidget-buttons"><t:minimizebutton/><t:menubutton/><t:closebutton/></div></div>
    <div class="panel-body">
        <t:iframe/>
    </div>
    <div class="panel-footer"><t:leftresizehandle/><t:bottomresizehandle/><t:rightresizehandle/></div>
</div>

</s:styledgui>
```

### テンプレート : `wirecloud/modals/base.html`

> 以前の名称 : `wirecloud/ui/window_menu.html`

**関連する SCSS ファイル**:

-   `modals/base.scss` : このテンプレートのカスタムスタイルのスタイルシート

**利用可能なコンポーネント**:

-   `closebutton` : モーダルを閉じるためのボタン
-   `title` : モーダルの名前を持つ `span` 要素
-   `body` : モーダルの本体が接続される場所 `div`
-   `footer` : メインボタンの追加に使用される `div`

**使用例**:

```html+django
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div>
    <div class="window_top"><t:closebutton/><t:title/></div>
    <t:body class="window_content"/>
    <t:footer class="window_bottom"/>
</div>

</s:styledgui>
```

### テンプレート : `wirecloud/modals/embed_code.html`

> 以前の名称 : `wirecloud/ui/embed_code_dialog.html`

**関連する SCSS ファイル**:

-   `modals/embed_code.scss` : このテンプレートのカスタム・スタイルのスタイルシート

**利用可能なコンポーネント**:

-   `themeselect` : ダッシュボードを埋め込むために提供されたコードで使用されるテーマを制御するためにユーザが
    使用できる `select` 要素を提供します
-   `code` : 埋め込みコードを持つ `textarea` 要素を提供します

**使用例**:

```html+django
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div><b>{% trans "Theme" %}</b>: <t:themeselect/></div>
<t:code/>

</s:styledgui>
```


### テンプレート : `wirecloud/modals/upgrade_downgrade_component.html`

> 以前の名称 : `wirecloud/ui/embed_code_dialog.html`


**関連する SCSS ファイル**:

-   `base/markdown.scss` : チェンジログのスタイリングに使用されます
-   `modals/upgrade_downgrade_component.scss` : このテンプレートのカスタム・スタイルのスタイルシート


**利用可能なコンポーネント**:

-   `currentversion` : ウィジェット/オペレータの現在のバージョンをテキスト・ノードに提供します
-   `versionselect` : 使用可能なバージョンの選択肢と選択コンボを提供します
-   `changelog` : 現在のバージョンと選択されたバージョンの間のチェンジログを `div` 要素に提供します。
    この要素の内容は、ユーザが選択したバージョンを変更するたびに変更されます


**使用例**:

```html+django
{% load i18n %}
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div class="wc-upgrade-component-info"><div><b>{% trans "Current version" %}</b>: <t:currentversion/></div><div><b>{% trans "New version" %}</b>: <t:versionselect/></div></div>
<h3>{% trans "Change Log" %}</h3>
<t:changelog/>

</s:styledgui>
```


### テンプレート : `wirecloud/wiring/behaviour_sidebar.html`


**関連する SCSS ファイル**:

-   `wiring/behviours.scss` : ワイヤリングのビヘイビア・スタイルのスタイルシート 


**利用可能なコンポーネント**:

-   `enablebutton` : 現在のワークスペースのビヘイビアエンジンを有効または無効にするためのトグルボタンを提供します
-   `createbutton` : 新しいビヘイビアを作成するためのボタンを提供します
-   `orderbutton` : ビヘイビアのオーダリング・モードを有効または無効にするためのトグルボタンを提供します
-   `behaviourlist` : `div` 要素に利用可能な振る舞いを提供します。この `div` 要素は、ビヘイビア・エンジンが
    現在無効になっている場合にいくつかのヒントを含む警告メッセージを表示するためにも使用されます


**使用例**:

```html+django
{% load i18n %}
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div class="panel panel-default se-vertical-layout we-panel-behaviours">
    <div class="panel-heading se-vl-north-container">
        <div class="panel-title">
            <strong>{% trans "Behaviours" %}</strong>
            <div class="panel-options"><t:enablebutton/></div>
        </div>
        <div class="btn-group pull-right"><t:createbutton/><t:orderbutton/></div>
    </div>
    <t:behaviourlist class="panel-body se-vl-center-container"/>
</div>

</s:styledgui>
```


### テンプレート : `wirecloud/wiring/component_group.html`


**関連するSCSSファイル**:

-   `wiring/components.scss` : ワイヤーリング・エディタビューでコンポーネントを表示するために使用されるスタイルの
    スタイルシート


**利用可能なコンポーネント**:

-   `createbutton` : コンポーネントの新しいインスタンスを作成するためのボタンを提供します
-   `description` : コンポーネントの説明を `div` 要素に提供します
-   `image` : コンポーネントのサムネイルを持つ `img` 要素を提供します
-   `title` : コンポーネントのタイトルを `span` 要素に提供します
-   `vendor` : コンポーネントのベンダー名をテキスト・ノードに提供します
-   `versionselect` : 使用可能なコンポーネントの異なるバージョンを切り替えるための選択コンポーネントを提供します


**使用例**:

```html+django
{% load i18n %}
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div class="we-component-group">
    <div class="panel panel-default we-component-meta">
        <div class="panel-heading">
            <div class="panel-title"><t:title/></div>
        </div>
        <div class="panel-body">
            <div class="se-thumbnail se-thumbnail-sm"><t:image/></div>
            <div class="se-input-group se-input-group-sm"><t:versionselect/><t:createbutton/></div>
            <h5><t:vendor/></h5>
            <t:description/>
        </div>
    </div>
</div>

</s:styledgui>
```

### テンプレート : `wirecloud/wiring/component_sidebar.html`


**関連する SCSS ファイル**:

-   `wiring/components.scss` : ワイヤーリング・エディタビューでコンポーネントを表示するために使用されるスタイルの
    スタイルシート


**利用可能なコンポーネント**:

-   `searchinput` : 使用可能なコンポーネントをフィルタリングするためにユーザが使用する `input` 要素を提供します
-   `typebuttons` : 検索ウィジェットとオペレータを切り替えるための2つのボタンを提供します
-   `list` : 利用可能なコンポーネントを表示する `div` 要素を提供します


**使用例**:

```html+django
{% load i18n %}
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<s:verticallayout class="panel panel-default we-panel-components">

    <s:northcontainer class="panel-heading">
        <div class="panel-title">
            <strong>{% trans "Components" %}</strong>
        </div>
        <t:searchinput/>
        <div class="btn-group btn-group-justified"><t:typebuttons/></div>
    </s:northcontainer>

    <s:centercontainer class="panel-body">
        <t:list/>
    </s:centercontainer>

</s:verticallayout>
</s:styledgui>
```

### テンプレート : `wirecloud/views/embedded.html`

**使用例**:

```html+django
{% extends "wirecloud/views/base.html" %}{% load wirecloudtags %}

{% load i18n %}

{% block title %}{% trans "WireCloud Platform" %}{% endblock %}

{% block header %}<div id="wirecloud_header"></div>{% endblock %}

{% block core_scripts %}
{% wirecloud_bootstrap "embedded" %}
{% extra_javascripts "embedded" %}
{% endblock %}
```

### テンプレート : `wirecloud/views/footer.html`

テーマのフッター・セクションに表示する HTML

**使用例**:

```html+django
<footer>My custom footer. Copyright © 2017 My company.</footer>
```

## 使用可能な SCSS ファイル

-   `_variables.scss` : 他の SCSS ファイルで使用される変数の値を定義するファイル
-   `header.scss` : ヘッダーに使用するスタイル
-   `modals/base.scss` : WireCloud で使用されるすべてのモーダルで使用されるスタイルを含みます
-   `modals/logs.scss` : ログ・モーダルで使用されるスタイルを含みます
-   `modals/upgrade_downgrade_component.scss` : ワークスペース・ビューで使用されるアップグレード/ダウングレードの
    モーダルによって使用されるスタイルと、ウィジェットのバージョンを更新するためのワイヤーリング・エディタビューと、
    オペレータのバージョンを更新するワイヤーリング・エディタによって含まれます
-   `workspace/dragboard_cursor.scss` : ワークスペース内でウィジェットを移動するときに表示されるカーソルのスタイルを
    含みます
-   `workspace/modals/share.scss` : ワークスペースの共有プロパティを変更するためにモーダルに使用されるスタイルを含みます
-   `wiring/behaviours.scss` :
-   `wiring/connection.scss` :
-   `wiring/layout.scss` :
-   `workspace/widget.scss` : ワークスペース/ダッシュボード・ビュー内にウィジェットを表示するためのスタイルが
    含まれています
-   `mac_field.scss` : マッシャブル・アプリケーションのコンポーネント入力フィールドのスタイルを含みます


## デフォルトのテーマ : `wirecloud.defaulttheme`

### 使用イメージ

-   `favicon.ico` : favicon として使用する `image/x-icon` フォーマットの画像。より良い結果を得るには、
    マルチ解像度画像を提供することを忘れないでください。
    _このファイルは、テーマがメインテーマとして設定されている場合にのみ使用されます_
-   `logos/header.png` : ヘッダーで使用されている `image/png` の中の画像。
    _このファイルは、テーマがメインテーマとして設定されている場合にのみ使用されます_

### 使用可能な SCSS 変数

基本色 :

-   `$brand-default` : WireCloud が具体的なステータスを要素に関連付ける必要がない場合にデフォルトで使用される色
-   `$brand-primary` : 主なアクションのベースとして使用される色
-   `$brand-success` : 成功を示すために使用される色
-   `$brand-info` : 情報要素に使用される色
-   `$brand-warning` : 警告要素に使用される色とユーザに警告が必要な場合に警告する色
-   `$brand-danger` : 何らかの危険または潜在的に否定的なことが起こる可能性があることをユーザに警告するために使用される色


その他の変数 :

-   `button-gradients` : グラデーションを使用するスタイリングボタンの場合は `true`、プレーン・カラーボタンの場合は
    `false`。デフォルトでは `true`
-   `high-resoulution-images` : テーマがヘッダロゴなどの高解像度画像を使用する場合は `true`。その場合、テーマは2倍の
    解像度を使用して画像ファイルを提供する必要があります。例えば、400 x 300 ピクセルの画像の場合は 800 x 600 です。
    標準的な解像度の画像を使用する場合は `false`。デフォルトでは `true`
