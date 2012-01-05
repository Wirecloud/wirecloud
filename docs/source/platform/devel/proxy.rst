Proxy Processors
----------------

Activating proxy processor
~~~~~~~~~~~~~~~~~~~~~~~~~~~

To activate a proxy processor, add it to the PROXY_PROCESSORS list in your
Django settings. For example, here's the default PROXY_PROCESSORS used by
Wirecloud::

  PROXY_PROCESSORS = (
    'proxy.processors.SecureDataProcessor',
  )

During the request phase, Wirecloud applies proxy processors in the order it's
defined in PROXY_PROCESSORS, top-down. During the response phase, the classes
are applied in reverse order, from the bottom up.

An Wirecloud installation doesn't requre any proxy processor -- e.g.,
PROXY_PROCESSORS can be empty, if you'd like.

Writing your own proxy processor
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Writing your own proxy processor is easy. Each proxy processor is a single
Python class that defines one or more of the following methods:

process_request
...............

.. method:: process_request(self, request)

``request`` is a dictionary containing the following keys:

 * ``url``: request URL
 * ``headers``: a dictionary of headers
 * ``data``: request data
 * ``cookies``: a Cookie.SimpleCookie object

process_response
................

.. method:: process_response(self, request, response)

In addition, during the response phase the classes are applied in reverse
order, from the bottom up. This means classes defined at the end of
PROXY_PROCESSORS will be run first.

__init__
........

Most proxy processor classes won't need an initializer since proxy processor
classes are essentially placeholders for the ``process_*`` methods. If you do
need some global state you may use ``__init__`` to set up. However, keep in mind
a couple of caveats:

* Django initializes your middleware without any arguments, so you can't define
  ``__init__`` as requiring any arguments.
* Unlike the ``process_*`` methods which get called once per request,
  ``__init__`` gets called only once, when the Web server starts up.