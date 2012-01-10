Testing
-------

There are several test suites to check that nothing is broken. These test
suites are composed of unittests, integration tests, ... and are implemented
using the django testing and the selenium fameworks.

You can run django tests with this command:

.. code-block:: bash

    $ python manage.py test

One thing to take into account it's that Django, by default, has not support
for selenium tests. Wirecloud can use django-sane-testing, a django application
that, among other things, integrates python-nose into django and adds support
for selenium tests. Python-nose provides an alternate test discovery and
running process for unittest. Moreover, python-nose has a fantastic collection of
plugins that can increase the funcionality of the django testing framework.

One of the most interesting plugins for nose is the xunit plugin that provides
a fantastic way for integraing these tests with a continuos integration
framework as jenkins.

Insalling django-sane-testing
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

    $ sudo apt-get install python-nose
    $ sudo pip install django-sane-testing

Since django-sane-testing extends Django's built-in test command, you should
add it to your ``INSTALLED_APPS`` in ``settings.py``::

    INSTALLED_APPS = (
        ...
        'djangosanetesting',
        ...
    )

Then set ``TEST_RUNNER`` in ``settings.py``: ::

    TEST_RUNNER = 'djangosanetesting.testrunner.DstNoseTestSuiteRunner'

.. admonition:: Note

    Make sure that ``djangosanetesting`` comes *after* ``south`` in
    ``INSTALLED_APPS``.

Selenium tests
~~~~~~~~~~~~~~

These tests are performed with Selenium IDE, a Firefox add-on that records
clicking, typing, and other actions to make a test, which you can play back
in the browser. You can find more information about Selenium
at http://seleniumhq.org/


Things to be considered before running the selenium tests
.........................................................

Before running the seleniun test, you must copy wirecloud /tests/ezweb-data
folder into /var/ezweb-data and provide the test gadget code through a HTTP
server in http://localhost:8001/.

A very easy way for having a HTTP server for the gadgets is executing:
.. code-block:: bash

    $ cd tests/ezweb-data/gadgets
    $ python -m SimpleHTTPServer 8001

Wirecloud's Selenium tests are designed to leave the database in a similar
state to the initial one. But if a test fails is very likely that the
database will be messed with erroneus data.

When running these tests using django-sane-testing, databases are created,
cleaned and populated with test data automatically. In this way, each test run
independently regardless of whether a test fails messing the databases.

If you still want to run the tests manually with Selenium IDE you should
configure not only a wirecloud server, but also populate the database with the
correct data. This can be done with the following commands:
.. code-block:: bash

   $ python manage.py syncdb --migrate
   $ python manage.py loaddata extra_data selenium_test_data

Test gadget
...........

This project has a special gadget only for testing wiring and verify that the
properties of gadgets apply when they are changed. This gadget called "Test"
works in pairs. This means that in tests this gadget is added to a workspace
twice and interconected, and what you write in event field of one gadget
appears in the "slot" field of the other. You can also change a gadget
preference and it appears in the field "Text Pref".
