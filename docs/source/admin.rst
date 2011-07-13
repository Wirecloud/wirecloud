Administrator Manual
====================

Dependencies
------------

* A Database Manager (MySQL, PostgreSQL, Sqlite3...)
* Python 2.5, 2.6 or 2.7. Python 3 and other versions are not supported.
* Django 1.3
* South
* lxml
* django_compressor (BeautifulSoup)
* johnny-cache

Database Installation and Configuration
---------------------------------------

The database connection must be defined in the configuration file by setting
the ``DATABASE`` setting. You can use all `database engines supported by Django.`_

We will include in this documentation examples of configuring both PostgreSQL
and SQLite databases.

.. _`database engines supported by Django.`: http://docs.djangoproject.com/en/1.3/ref/settings/#database-engine

SQLite
~~~~~~

You can quickly setup a SQLite database by simply using the following
parameters into the settings.py file:

    .. code-block:: python

        DATABASE = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': 'database.db',
                'USER': '',
                'PASSWORD': '',
                'HOST': '',
                'PORT': '',
            }
        }

where ``NAME`` is the path of the database.

.. admonition:: Note

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
                'NAME': 'myproject',
                'USER': 'myprojectuser',
                'PASSWORD': 'password',
                'HOST': '',
                'PORT': '',
            }
        }

Install the database and the appropriate python dependencies: ``postgresql``, ``python-psycopg2``.

* ``postgresql``: the object-relational database system that we will use.

    .. code-block:: bash

        $ apt-get install postgresql

* ``python-psycopg``: the python interface to the PostgreSQL database.

    .. code-block:: bash

        $ apt-get install python-psycopg2


Now you have to creating the project Database

.. admonition:: Note

    We assume that your user has superadmin permissions in PostgreSQL.

The PostgreSQL database and user is created with these instructions:

.. code-block:: bash

    $ createuser myprojectuser
    $ createdb --owner=myprojectuser myproject

We have to permit connections to the database from the local computer. Edit
/etc/postgresql/X.X/main/pg_hba.conf and add the following line (not at
the end):

.. code-block:: bash

    local myproject myprojectuser trust
    local test_myproject myprojectuser trust # necessary for tests

Reload pg_hba.conf in PostgreSQL server with the following command:

.. code-block:: bash

    $ /etc/init.d/postgresql-X.X reload

Restart PostgreSQL and check your user access with this command:

.. code-block:: bash

    $ psql myproject -U myprojectuser

Deployment notes
----------------

If DEBUG is False you will need to collect your static files first:

python manage.py collectstatic

And if you use runserver (not recommended for production) you will have to
call it with the --insecure switch in order to make it serve the static files
when not debugging.

Any way, you should serve the static files with a fast performance http server
like Nginx or Apache.
