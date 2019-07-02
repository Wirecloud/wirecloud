WireCloud が提供するテストを実行する前に、いくつかの依存関係をインストールする必要があります :

```bash
pip install django-nose "mock>=1.0,<2.0"
```

## 単体テスト

サーバのユニット・テストが実行されます :

```bash
python manage.py test -v 2 --noinput --nologcapture -a tags="wirecloud-noselenium"
```

これらの単体テストは、いくつかの外部サービスを置き換えるためにモックを使用しますが、Django が `settings.py`
ファイルで提供されている設定を使用して設定しています。たとえば、django は、テスト実行時にこのファイルで提供される
データベース設定を使用します。


クライアント側で実行される JavaScript コードの単体テストもあります。次のコマンドを実行することで、
これらのテストを調整できます :

```bash
grunt karma
```

> **注**: JavaScript 単体テストは進行中であり、コード・カバレッジは期待できません。

## 統合テスト

統合テストでは selenium を使用しますが、pip 経由でインストールすることもできます :

```bash
pip install selenium
```

インストールしたら、テストに使用するブラウザ用のドライバをインストールする必要があります。テスト用に推奨されるブラウザ
は、Firefoxと Chrome/Chromium です。これらのブラウザに必要なドライバは、次のリンクからダウンロードできます :

-   [geckodriver](https://github.com/mozilla/geckodriver/releases)
-   [chromedriver](https://sites.google.com/a/chromium.org/chromedriver/downloads)

テストに使用するブラウザは、この `WIRECLOUD_SELENIUM_TEST_BROWSERS` 設定を使用して `settings.py`
ファイルに構成されます。次のスニペットは、可能な構成の例です :

```python
WIRECLOUD_SELENIUM_TEST_BROWSERS = {

    # Download geckodriver from the following URL:
    #     https://github.com/mozilla/geckodriver/releases
    # Old versions of Firefox can be found here:
    #     http://archive.mozilla.org/pub/mozilla.org/firefox/releases/

    'Firefox': {
        'CLASS': 'selenium.webdriver.Firefox',
    },

    # Download chromedriver from the following URL:
    #     https://sites.google.com/a/chromium.org/chromedriver/downloads
    # Old versions of chrome can be found here:
    #     http://google-chrome.en.uptodown.com/mac/old
    'GoogleChrome': {
        'CLASS': 'selenium.webdriver.Chrome',
    },

    # Download opera driver from the following URL:
    #     https://github.com/operasoftware/operachromiumdriver/releases
    # Old versions of Opera can be found here:
    #     http://get.geo.opera.com.global.prod.fastly.net/pub/opera/

    'Opera': {
        'CLASS': 'selenium.webdriver.Opera',
    },

    # https://blog.codecentric.de/en/2015/02/selenium-webdriver-safari-8/
    'Safari': {
        'CLASS': 'selenium.webdriver.Safari',
    },
}
```

これで、次のコマンドを実行して統合テストにパスすることができます :

```
python manage.py test -v 2 --noinput --nologcapture -a tags="wirecloud-selenium"
```

## 他のサーチバックを使用

デフォルトでは、テストは Whoosh を使用して実行されますが、これは、Solr または ElasticSearch2
を使用するように構成できます。

テスト検索のバックアップを変更するには、`settings.py` ファイルの `TEST_HAYSTACK_CONNECTIONS` プロパティを設定します。

### Whoosh の場合

テスト検索のバックエンドとして手動で Whoosh を設定すると、Whoosh インデックスを格納するカスタムパスを設定できます。
Wirecloud テストで使用されるデフォルト `PATH` は、テストが終了した後に削除されます。

```python
TEST_HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'wirecloud.commons.haystack_backends.whoosh_backend.WhooshEngine',
        'PATH': path.join(path.dirname(__file__), 'whoosh_index'), # This setting is optional, if not set, the default tmp location will be used.
    },
}
```

### Solr の場合

```python
TEST_HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'wirecloud.commons.haystack_backends.solr_backend.SolrEngine',
        'URL': 'http://127.0.0.1:8983/solr/wirecloud_test_core'
    },
}
```

ここでの、`URL` は、テストに使用される Solr コアの URL です。

### ElasticSearch について

```python
TEST_HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'wirecloud.commons.haystack_backends.elasticsearch2_backend.Elasticsearch2SearchEngine',
        'URL': 'http://127.0.0.1:9200/',
        'INDEX_NAME': 'wirecloud_testing',
    },
}
```

ここでの、`URL` は、Haystack サーバの URL です。
