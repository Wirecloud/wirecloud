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

The templates are usually found right in the templates directory but the
static resources are placed into another directory inside the static one.
This middle directory should has the same name as the theme itself.

So, let's say your theme is called `serenity`, its directory layout should
look like this:

.. code-block:: bash

 serenity/
     __init__.py
     static/
         serenity/
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



How to contribute to EzWeb
--------------------------

TODO


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
