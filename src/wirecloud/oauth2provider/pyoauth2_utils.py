import string
import urllib
import urlparse
import random

UNICODE_ASCII_CHARACTERS = (string.ascii_letters.decode('ascii') +
    string.digits.decode('ascii'))


def random_ascii_string(length):
    return ''.join([random.choice(UNICODE_ASCII_CHARACTERS) for x in xrange(length)])


def build_url(base, additional_params=None):
    """Construct a URL based off of base containing all parameters in
    the query portion of base plus any additional parameters.

    :param base: Base URL
    :type base: str
    ::param additional_params: Additional query parameters to include.
    :type additional_params: dict
    :rtype: str
    """
    url = urlparse.urlparse(base)
    query_params = {}
    query_params.update(urlparse.parse_qsl(url.query, True))
    if additional_params is not None:
        query_params.update(additional_params)
        for k, v in additional_params.iteritems():
            if v is None:
                query_params.pop(k)

    return urlparse.urlunparse((url.scheme,
                                url.netloc,
                                url.path,
                                url.params,
                                urllib.urlencode(query_params),
                                url.fragment))
