Before running any of the tests provided by WireCloud, you need to install some
extra dependencies:

```
$ pip install django-nose "mock>=1.0,<2.0"
```

## Unit tests

```
python manage.py test -v 2 --noinput --nologcapture -a tags="wirecloud-noselenium"
```

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
