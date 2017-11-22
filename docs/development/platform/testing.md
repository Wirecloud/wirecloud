Before running any of the tests provided by WireCloud, you need to install some
extra dependencies:

```
$ pip install django-nose "mock>=1.0,<2.0"
```

## Unit tests

Server unit tests are executed:

```
python manage.py test -v 2 --noinput --nologcapture -a tags="wirecloud-noselenium"
```

These unit tests use mocks for replacing several external services although
there are some systems used and configured by Django using the configuration
provided in the `settings.py` file. For example, django uses the database
configuration provided in this file when running the tests.


There are also unit tests for the JavaScript code that is executed in the client
side. You can tun those tests by executing the following command:

```
$ grunt karma
```

> **Note**: JavaScript unit tests are work in progress, do not expect a great
> code coverage.

## Integration tests

The integration tests make use of selenium, you can also install it through pip:

```
$ pip install selenium
```

Once installed you, you will have to install the drivers for the browsers you
want to use for testing. The preferred browsers for testing are Firefox and
Chrome/Chromium. You can download the required drivers for those browser from
the following links:

- [geckodriver](https://github.com/mozilla/geckodriver/releases)
- [chromedriver](https://sites.google.com/a/chromium.org/chromedriver/downloads)

Browsers to use for testing are configured in the `settings.py` file by using
the `WIRECLOUD_SELENIUM_TEST_BROWSERS` setting. The following snippet is an
example of the possible configuration:

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

Now you can pass the integration tests by running the following command:

```
python manage.py test -v 2 --noinput --nologcapture -a tags="wirecloud-selenium"
```

## Using other search backeds

By default, tests are run using Whoosh, however, this can be configured to use Solr or ElasticSearch2.

To change the testing search backed, configure the `TEST_HAYSTACK_CONNECTIONS` propertie on the `settings.py` file.

### For Whoosh

Manually configuring Whoosh as the testing search backend allows to set a custom path to store the Whoosh indexes. The default `PATH` used by Wirecloud tests is removed after the testing ends.

```python
TEST_HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'wirecloud.commons.haystack_backends.whoosh_backend.WhooshEngine',
        'PATH': path.join(path.dirname(__file__), 'whoosh_index'), # This setting is optional, if not set, the default tmp location will be used.
    },
}
```

### For Solr

```python
TEST_HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'wirecloud.commons.haystack_backends.solr_backend.SolrEngine',
        'URL': 'http://127.0.0.1:8983/solr/wirecloud_test_core'
    },
}
```

Where `URL` is the URL of the Solr core that will be used for testing.

### For ElasticSearch

```python
TEST_HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'wirecloud.commons.haystack_backends.elasticsearch2_backend.Elasticsearch2SearchEngine',
        'URL': 'http://127.0.0.1:9200/',
        'INDEX_NAME': 'wirecloud_testing',
    },
}
```

Where `URL` is the URL of the Haystack server.