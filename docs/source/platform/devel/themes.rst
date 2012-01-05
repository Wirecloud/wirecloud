Writing custom themes
---------------------

If you want to customize the look and fell of Wirecloud you need to write a
custom `theme`. Doing so it's not a difficult task. These are the things you
can do by writing a custom theme:

- Change CSS files
- Replace or add images
- Add custom Javascript files
- Change Django templates

Wirecloud comes with a very basic theme called the `default theme`. It is very
useful for two reasons:

- It's a good starting point to learn how to write a theme.
- Your theme does not need to define everything. If something is not found in
  it, Wirecloud will use the matching file in the default theme.


Anatomy of a theme
~~~~~~~~~~~~~~~~~~

A theme is a python package with just an __init__.py file on it. It doesn't
need to be a Django application but you can choose to add more funcionality on
it (e. g. custom views or models) if your want and make it a real Django app.
It's just not required.

Then, there are two main directories in a theme:

- The static directory
- The templates directory

If you are used to Django this should sound familiar. The static directory
contains css, images, javascript and other non dinamic resources that are
sent to the browser as it.

The templates directory contains Django templates that are processed by Django
and converted into XHTML or other output formats before they are sent to the
browser.

So, let's say your theme is called `serenity`, its directory layout should
look like this:

.. code-block:: bash

 serenity/
     __init__.py
     static/
         css/
            styles.css
         js/
            custom_effects.js
         images/
            icon.png
     templates/
         index.html


Activating a theme
~~~~~~~~~~~~~~~~~~
At a given point of time there can be just one active theme for all the users
o a Wirecloud instance. This may change in the future so we can allow the users
to specify a different theme.

They way the active theme is selected is by using a option in the settings.py
file. That option is called `THEME_ACTIVE` and its value should be the name
of the Python package that contains the theme. Wirecloud will try to import the
theme using the `__import__` function so it's very important that the theme
directory is located somewhere in your PYTHONPATH.