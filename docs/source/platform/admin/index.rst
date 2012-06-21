Administrator Manual
====================

Dependencies
------------

* A Database Manager (MySQL, PostgreSQL, Sqlite3...)
* Python 2.5, 2.6 or 2.7. Python 3 and other versions are not supported.
* Django 1.3
* South 0.7.3+
* lxml
* django-compressor (BeautifulSoup)

Installing basic dependencies in Debian Wheeze and Ubuntu oneiric
-----------------------------------------------------------------

.. code-block:: bash

    $ sudo apt-get install python-django python-django-south python-beautifulsoup python-lxml python-pip

There are other dependencies that cannot be installed using apt. Install them
using pip:

.. code-block:: bash

    $ sudo pip install django-compressor


Database Installation and Configuration
---------------------------------------

The database connection must be defined in the configuration file by modifying
the ``DATABASE`` setting. You can use all `database engines supported by Django.`_

By default, Wirecloud is configured and prepared to use a SQLite database. This
is the recommended database for giving it a try. To use this configuration, just
make sure you have installed the sqlite module for python:

.. code-block:: bash

    $ sudo apt-get install python-pysqlite2


Here below there are examples of how to configure both PostgreSQL and SQLite
databases.

.. _`database engines supported by Django.`: http://docs.djangoproject.com/en/1.3/ref/settings/#databases

SQLite
~~~~~~

You can quickly setup a SQLite database by simply using the following
parameters into the local_settings.py file:

    .. code-block:: python

        DATABASE = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': '<dbfile>',
                'USER': '',
                'PASSWORD': '',
                'HOST': '',
                'PORT': '',
            }
        }

where ``dbfile`` is the full path to the database file.

Install the appropriate python module: ``python-pysqlite2``:

.. code-block:: bash

    $ sudo apt-get install python-pysqlite2


.. note::

    SQLite is not a recommended database for put your site in production, but
    it is only useful in the developing process.

PostgreSQL
~~~~~~~~~~

Let's suppose that you were configuring a PostgreSQL database with the
following parameters:

    .. code-block:: python

        DATABASE = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql_psycopg2',
                'NAME': '<dbname>',
                'USER': '<dbuser>',
                'PASSWORD': '<dbpassword>',
                'HOST': '',
                'PORT': '',
            }
        }

Install the database and the appropriate python dependencies: ``postgresql``, ``python-psycopg2``.

* ``postgresql``: the object-relational database system that we will use.

    .. code-block:: bash

        $ sudo apt-get install postgresql

* ``python-psycopg``: the python interface to the PostgreSQL database.

    .. code-block:: bash

        $ sudo apt-get install python-psycopg2


Now you have to create the project Database.

.. note::

    We assume that your user has superadmin permissions in PostgreSQL. Usually
    this means that you have to login as the postgres user (i.e. $ su postgres).

The PostgreSQL database and user can be created with these instructions:

.. code-block:: bash

    $ createuser <dbuser> [-P]
    $ createdb --owner=<dbuser> <dbname>

If you want to create a user protected with password you should use the -P option.

We also have to permit connections to the database from the local computer. To
do so, edit /etc/postgresql/X.X/main/pg_hba.conf and add the following lines
as the firsts rules:

.. code-block:: bash

    # TYPE  DATABASE        USER            CIDR-ADDRESS            METHOD
    local   <dbname>        <dbuser>                                trust
    local   test_<dbname>   <dbuser>                                trust # only necessary for testing Wirecloud

Reload pg_hba.conf in PostgreSQL server with the following command:

.. code-block:: bash

    $ sudo service postgresql reload

Restart PostgreSQL and check your user access with this command:

.. code-block:: bash

    $ psql <dbname> -U <dbuser>


Database population
~~~~~~~~~~~~~~~~~~~

Before running Wirecloud you must populate the database using this command:

.. code-block:: bash

    $ python manage.py syncdb --migrate

This will create database tables without adding any content. You can add
initial demo content issuing the following command:

.. code-block:: bash

    $ python manage.py loaddata extra_data

You must migrate the database whenever you update the wirecloud code. This can
be accomplished by running:

.. code-block:: bash

    $ python manage.py migrate

.. note::

    It is strongly recommended to perform a full database backup before
    starting to migrate wirecloud to a new version.


Last remarks to the installation
--------------------------------

First of all, you must go to the administration panel on:

.. code-block:: bash

    http://wirecloud.server.com/admin/sites/site/

Here you have two options:

* You can remove all entries and wirecloud will use the server name and port from the request for building absolute URLs.
* Set just one entry with the server name/port to use for building absolute URLs in the domain field (i.e. example.com or example:8080).

Make sure both ``GADGETS_DEPLOYMENT_DIR`` and ``GADGETS_DEPLOYMENT_TMPDIR``
(by default, these configuration variables point to
<wirecloud>/src/deployment/gadgets and <wirecloud>/src/deployment/tmps
respectively) exist and the server has enough permissions to write over them.

If ``DEBUG`` is False you will need to collect Wirecloud static files using the
following command:

.. code-block:: bash

    $ python manage.py collectstatic

If you use the `runserver command`_ (not recommended for production) you will
have to call it with the --insecure switch in order to make it serve the
static files when not debugging.

Anyway, you should serve the static files with a fast performance http server
like Nginx or Apache. Django has documentation for this `topic`_.

In addition, you can compress css and javascript code files for better
performance using the following command:

.. code-block:: bash

    $ python manage.py compress

.. note::

    Don't forget to rerun the collectstatic and compress commands each time the
    wirecloud code is updated.

.. _`runserver command`: https://docs.djangoproject.com/en/dev/ref/django-admin/#runserver-port-or-address-port
.. _`topic`: https://docs.djangoproject.com/en/dev/howto/deployment/


Example of deployment using Apache
----------------------------------

First install the Apache server:

.. code-block:: bash

    $ sudo apt-get install apache2 libapache2-mod-wsgi

Then create a django.wsgi file anywhere (It's recommended to have it inside
your wirecloud installation):

.. code-block:: python

    import os
    import sys

    path = '/path/to/wirecloud/src'
    if path not in sys.path:
        sys.path.insert(0, path)

    os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

    import django.core.handlers.wsgi
    application = django.core.handlers.wsgi.WSGIHandler()

Add a virtualhost to the apache configuration:

.. code-block:: bash

    <VirtualHost ...>

            ...

            ### Wirecloud / EzWeb ###
            WSGIScriptAlias / /path/to/django.wsgi

            Alias /static /path/to/wirecloud/src/static
            <Location "/static">
                    SetHandler None
                    <IfModule mod_expires.c>
                            ExpiresActive On
                            ExpiresDefault "access plus 1 week"
                    </IfModule>
                    <IfModule mod_headers.c>
                            Header append Cache-Control "public"
                    </IfModule>
            </Location>

            <Location "/static/cache">
                    <IfModule mod_expires.c>
                            ExpiresDefault "access plus 3 years"
                    </IfModule>
            </Location>

            ...

    </VirtualHost>

