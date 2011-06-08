Developer Manual
================


Writing custom themes
---------------------

If you want to customize the look and fell of EzWeb you need to write a custom
`theme`. Doing so it's not a difficult task. These are the things you can do
by writing a custom theme:

- Change CSS files
- Replace or add images
- Add custom Javascript files
- Change Django templates

EzWeb comes with a very basic theme called the `default theme`. It is very useful
for two reasons:

- It's a good starting point to learn how to write a theme.
- Your theme does not need to define everything. If something is not found in
  it, Ezweb will use the matching file in the default theme.


Anatomy of a theme
~~~~~~~~~~~~~~~~~~

A theme is a python package with just an __init__.py file on it. It doesn't need
to be a Django application but you can choose to add more funcionality on it
(e. g. custom views or models) if your want and make it a real Django app. It's
just not required.

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
o a EzWeb instance. This may change in the future so we can allow the users
to specify a different theme.

They way the active theme is selected is by using a option in the settings.py
file. That option is called `THEME_ACTIVE` and its value should be the name
of the Python package that contains the theme. EzWeb will try to import the
theme using the `__import__` function so it's very important that the theme
directory is located somewhere in your PYTHONPATH.

Proxy Processors
----------------

Activating proxy processor
~~~~~~~~~~~~~~~~~~~~~~~~~~~

To activate a proxy processor, add it to the PROXY_PROCESSORS list in your
Django settings. For example, here's the default PROXY_PROCESSORS used by
EzWeb::

  PROXY_PROCESSORS = (
    'proxy.processors.SecureDataProcessor',
  )

During the request phase, EzWeb applies proxy processors in the order it's
defined in PROXY_PROCESSORS, top-down. During the response phase, the classes
are applied in reverse order, from the bottom up.

An EzWeb installation doesn't requre any proxy processor -- e.g.,
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

How to contribute to EzWeb
--------------------------

EzWeb is a free software project. It's free to use and modify but it also
means that your contributions are more than welcomed. What EzWeb can do
for you is not the right question. Ask yourself what can you do for Ezweb!

I'm glad you asked since there are a lot of things you can do:

- Participate in the mailing lists. We want to hear you opinion and suggestions
  so subscribe you to one of more of our mailing lists and write us emails.
- Test the software and report bugs. Yes they are rare but we know there are
  a few of them hidden waiting for you
- Submit patches. If you found a bug and have a fix, please share it with
  the community. If you have implemented a new cool feature do it too, there
  is always room for improvements.
- Translate it to your language. Right now only spanish, english and an
  outdated portuguesse translation is what we have. Translating EzWeb is a
  quite simple task if you happen to speak another language.
- Write some documentation. We should have user, administrator and developer
  guides and a bunch of tutorial and other newbie resources. We do have
  documentation but we need your help to make it more consistent and easy to
  find.
- Spread the word. Everybody that sees the demo like it a lot but the problem
  is that not a lot of people know EzWeb. Help us communicate its coolness
  so more people can make it perfect.

Let's see how you can participate in more detail.


Participating in the mailing lists
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

There are several mailing lists you can subscribe to:

TODO: put the new mailing lists here

Testing the software and reporting bugs
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

First download the software and install it. If you have any problem, please use
the TODO:SUPPORT mailing list and we will happy to help you.

Now, if you find a bug and it is confirmed in the mailing list, the next step
is to report it so we don't forget about it and fix it. The place to do it is
the TODO:TRACKER.

Submitting patches
~~~~~~~~~~~~~~~~~~

EzWeb project is composed by Django (and hence Python) code and JavaScript
code. Wherever you submit your patch you have follow the code guidelienes.
Otherwise it's likely that your patch will be rejected and nobody wants
that, right?

So, what are those guidelines?

Python code style
.................

We basically follow Django coding standards which, in turn, uses `PEP 8`_.
We validate every commit agains the pep8_ program and also the pyflakes_
program. Pyflakes will just help you to clean those parts that you not
use anymore such as forgotten and unused module imports and variables.

.. _PEP 8: http://www.python.org/dev/peps/pep-0008
.. _pep8: http://pypi.python.org/pypi/pep8/
.. _pyflakes: http://pypi.python.org/pypi/pyflakes/

JavaScript code style
.....................

We have a JavaScript coding standard so you should follow it closely.
We use the jslint_ program to validate every JavaScript commit.

.. _jslint: http://www.jslint.com

Once you have write the modification to the code we would like you to
send the patch as a diff file. Use svn diff from the top-level trunk
directory. Always attach your patch to a ticket in the Trac website,
do not send it to the mailing list. Feel free to send a message to
the mailing list if no recent activity is done in the ticket.

A good thing when writing patches is to write tests too. If the patch
fixes a bug, the test would be a regression test. If the patch
implements a new feature, the tests could be several unit tests and
some functional tests. Adding tests to your patch is a cheap ticket
for success as it will rise the probabilities to have it accepted.

Before writing a new feature patch is recommended to discuss it
in the developer mailing list so no duplication work is done and
the general design is similar with the rest of the project.


Translating the documentation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Localizating a package is a very important phase of the project as it
dramatically increase the number of potential users. All you have to
do is take the .pot template and translate the strings using your
favourite gettext strings editor.

When you are finished create a ticket in the Trac website and attach
your translation to it like any other patch.


Writing documentation
~~~~~~~~~~~~~~~~~~~~~

We use the Sphinx_ documentation system so the docs should be written in
`ReStructured text`_. The official documentation should be written in english
but you are free to translate it to your favourite language. Keep in mind
that we will only maintain the official one. As with the other patches
you should create a ticket and attach your patch to it.

.. _Sphinx: http://sphinx.pocoo.org/
.. _ReStructured text: http://docutils.sourceforge.net/docs/user/rst/quickstart.html

This documentation will be versioned with the rest of the code helping to
keep it up to date. It should also be accesible at a public URL. Ideally
one URL for each EzWeb version.


Spreading the word
~~~~~~~~~~~~~~~~~~

Feel free to talk about the nice things of EzWeb with your familiy, friends,
coworkers and bosses. If you have some rants we prefer to read about them
if the mailing lists just in case we can fix something that can change your
opinion.

In any case we need more marketing and you can easily help us here.


Becoming a comitter
~~~~~~~~~~~~~~~~~~~

If the number and quality of your contributions are high, we will be very
happy to give you write access to the main repository no matter your
sex, race, religion or favourite ice cream flavour. Traditionally EzWeb
development has not be very open but we are here to change that direction
with your help.


SCM branches guide
------------------

EzWeb uses Mercurial, a distributed source code management tool. As with other
DSCM tools, it's very easy to create branches and merge them later and because
of that a set of rules and guidelines are needed in order to keep insanity
under control.

There are two types of branches in the repository:

- Permanent branches
- Volatile branches

There are at least two permanent branches but there can be more. The default
branch has the current stable version of the code. The develop branch has
the code that has not been released yet because people are adding features
and fixing non critical bugs on that branch. If, at some point, there is a
new release that breaks backward compatibility there will be another
permanent branch for the old version. The default branch will always has
the last stable version.

On the other hand, the volatile branches are branches that are created
with a focused goal and they will die after they are merged to one of the
permanent branches. Examples of these branches are feature branches,
release branches and hotfixes branches.

The default branch
~~~~~~~~~~~~~~~~~~

Each changeset in the default branch is considered to be production-ready.
When the source code in the develop branch reaches a stable point and
is ready to be released, all of its changesets shoul be merged back into
the default branch and tagged with a release number.

The develop branch
~~~~~~~~~~~~~~~~~~

This branch is often called the integration branch since it gets the
features one by one before reaching a stable state ready to release.

The tests should be executed agains this branch and even when it's
called develop, we should always try to keep it stable. No feature
should be merged in this branch without a previous testing effort
in the release branch.

Feature branches
~~~~~~~~~~~~~~~~

These branches are branched off from the develop branch and merged
back into the develop branch again. Each feature should be implemented
in one and only one feature branch. Each feature branch should contain
only one feature.

The name of a feature branch should always start with the prefix 'feature-'

Release branches
~~~~~~~~~~~~~~~~

These branches are branched off from the develop branch and merged
back into the develop branch and the default branch. The main purpose
of a release branch is to polish a release by fixing very small bugs
and updating the version metadata and changelog files. By doing this
in a separate branch, the develop branch can keep getting features
and it is not blocked until the release is done. So the moment when
a release branch should be created is when all the features that
were planned for the next release are in the develop branch.

When merging a release branch back into the default branch a tag
should be created in the default branch.

The name of a release branch should always be 'release-0.1.0'
where '0.1.0' is the version that it is being released.

Hotfix branches
~~~~~~~~~~~~~~~

These branches are branched off from the default branch and merged
back into the default branch and the develop branch. The main purpose
of a hotfix branch is to quickly fix a critical problem in production
without blocking the development on the develop branch. After
finishing the fix, a new release in the default branch should be created
and tagged.

The name of a hotfix branch should always start with the prefix 'bug-'

How to create and merge the branches
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Alex is a developer that wants to add a new feature to the codebase.
He starts by cloning the repo and he update his working copy
to the develop branch::

  hg clone https://hg.yaco.es/ezweb
  hg update develop

If he already had an old version of ezweb he would do a pull instead
of a clone. The update is still mandatory.

Now he can create a new branch to start developing a new feature::

  hg branch feature-flying-gadgets

He will commit as many changesets as he needs and ocasionally he will
push to the server to let other developers see what he is doing.

  hg push --new-branch
  hg pull
  hg update feature-flyging-gadgets

The '--new-branch' option to the push command is needed the first time
this branch is being pushed into the server. After that, it's not
needed.

When the feature is stable enough it can be integrated into the
develop branch. That means it's merge time. But before the merge
he needs to close the branch::

  hg commit -m "Close the branch feature-flying-gadgets" --close-branch

Now he can start the merge. Alex will update its working copy to
the destination branch, in this case the develop branch::

  hg update develop

And now he can do the merge itself::

  hg merge feature-flying-gadgets  # some conflicts may happen here
  hg commit -m "Merge feature-flying-gadgets back into develop"
  hg push

References:

- http://nvie.com/posts/a-successful-git-branching-model/
- http://stevelosh.com/blog/2009/08/a-guide-to-branching-in-mercurial/


Testing
-------

Selenium tests
~~~~~~~~~~~~~~

These tests are performed with Selenium IDE, a Firefox add-on that records
clicking, typing, and other actions to make a test, which you can play back
in the browser. You can find more information about Selenium
at http://seleniumhq.org/download/

Things to consider before running the tests
...........................................

#. You must have some test data in your /var/ezweb-data/ directory.
   You can get this test data from the project directory /tests/ezweb-data
#. You must have executed ``python manage.py syncdb --migrate`` and
   ``python manage.py loaddata extra_data``. These two commands will
   syncronize the database and load some data needed for testing. All tests has been performed with the user **admin**, so this user must be in your database.
#. For testing the adition of gadgets by template it's necessary a web server that serves this gadgets (you can see an example of web server in the next section).
#. Finally you must run ezweb ``python manage.py runserver`` and you'll
   be able to open any test suite placed in tests directory and play selenium tests with no problem.

Note: It's highly recommended to run the tests with private browsing mode active in your Firefox to avoid cache problems.

Serving the templates of gadgets
................................

As it's been said before, for testing the adition of gadgets by template it's necessary a web server that serves this gadgets in http://localhost/gadgets/ url, for example Apache Web Server. The configuration must be the next:

Create a simbolyc link from gadgets templates to /var/www/

.. code-block:: bash

   sudo ln -s ~/ezweb_project/tests/ezweb-data/src/ /var/www/

Create and alias in /etc/apache2/apache2.conf for showing in http://localhost/gadgets/ the content of /var/www/src/ . You must also add the server name, in this case, localhost:

.. code-block:: bash

   ServerName localhost
   Alias /gadgets/ /var/www/src/

Add all permissions to /var/www/src

.. code-block:: bash

   chmod 777 src

Finally, in http://localhost/gadgets/ you'll be able to get gadgets by template.

Test gadget
...........

This project has a special gadget only for testing wiring and verify that the
properties of gadgets apply when they are changed. This gadget called "Test"
works in pairs. This means that in tests this gadget is added to a workspace
twice and interconected, and what you write in event field of one gadget
appears in the "slot" field of the other. You can also change a gadget
preference and it appears in the field "Text Pref".
