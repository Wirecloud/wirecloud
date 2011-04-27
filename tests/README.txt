Things to consider before playing the tests
===========================================

This tests are performed with Selenium IDE thats is a Firefox add-on that records clicks, typing, and other actions to make a test, which you can play back in the browser. More information and download here http://seleniumhq.org/download/

Before playing tests
---------------------
#. You must have some test data in your /var/ezweb-data/ directory. You can get this test data from the project directory /tests/ezweb-data
#. You must have executed ``python manage.py syncdb --migrate`` and ``python manage.py loaddata extra_data``. This two commands will syncronize the database and load some data needed for testing.
#. Finally you must run ezweb ``python manage.py runserver`` and you'll be able to open any test suite placed in tests directory and play selenium tests with no problem. 

Note: It's highly recommended to run the tests with private browsing mode active in your Firefox to avoid cache problems.



Test gadget
-----------
This project has a special gadget only for testing wiring and verify that the properties of gadgets apply when they are changed. This gadget called "Test" works in pairs. This means that in tests this gadget is added to a workspace twice and interconected, and what you write in event field of one gadget appears in the "slot" field of the other. You can also change a gadget preference and it appears in the field "Text Pref".
