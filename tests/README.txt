Things to consider before playing the tests
===========================================

This tests are performed with Selenium IDE thats is a Firefox add-on that records clicks, typing, and other actions to make a test, which you can play back in the browser. More information and download here http://seleniumhq.org/download/

Before playing tests
---------------------
#. You must have some test data in your /var/ezweb-data/ directory. You can get this test data from the project directory /tests/ezweb-data
#. You must have executed ``python manage.py syncdb --migrate`` and ``python manage.py loaddata extra_data``. This two commands will syncronize the database and load some data needed for testing.
#. Finally you must run ezweb ``python manage.py runserver`` and you'll be able to open any test suite placed in tests directory and play selenium tests with no problem.

Test gadget
-----------

