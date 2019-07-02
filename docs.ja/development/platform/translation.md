まず、github リポジトリから WireCloud のソースコードをダウンロードする必要があります：

```bash
git clone https://github.com/Wirecloud/wirecloud.git
````

翻訳するソースコードを取得したら、次に翻訳するメッセージのカタログを作成または更新します。
これは次のコマンドで実行できます :

```bsah
cd ${wirecloud_repo_path}/src
cd ${module}
django-admin makemessages -l ${locale}
django-admin makemessages -l ${locale} -d djangojs
```

ここで ：

-   `${wirecloud_repo_path}` は、WireCloud の git リポジトリの作業コピーがダウンロードされたパスです

-   `${module}` は、翻訳する django モジュールです。現在、WireCloud には次のモジュールの翻訳カタログがあります :

    -   `wirecloud/commons`
    -   `wirecloud/catalogue`
    -   `wirecloud/platform`

-   `${locale}` は、作成/更新されるメッセージファイルのロケールです。例えばメキシコで利用されているスペイン語は
    `es_MX`, ドイツ語は `de`, ...

これらのコマンドを実行すると、`${wirecloud_repo_path}/${module}/locale/${locale}/LC_MESSAGES/` にある `django.po`
と `djangojs.po` ファイルを編集することができます。これらのファイルは、手動で、または一般的な PO ファイルエディタを
使用して編集できます。

翻訳されたメッセージ・カタログができたら、モジュールごとに、次のコマンドを実行することで、それをコンパイルしてテスト
することができます：

```bash
cd ${wirecloud_repo_path}/src
cd ${module}
django-admin compilemessages
```

メッセージをコンパイルしたら、WireCloud を実行してメッセージをテストできます。私たちが開発しているように、
runserver コマンドを実行することをお勧めします :

```bash
python manage.py runserver --insecure
```

翻訳にはいくつかの選択肢があります。まず、github プルリクエストを送信するのが快適であると感じたら、
これはあらかじめ決められた方法です。その後、パッチ/コミットを電子メールで wirewoud.com に直接送信します。
別のオプションは、電子メールで `po` ファイル全体を送信することです。
