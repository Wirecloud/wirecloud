WireCloud Installation and Administration Guide
===============================================

## Introduction

This Installation and Administration Guide covers WireCloud version 0.7 (starting from FIWARE release 4.2). Any feedback on this document is highly welcomed, including bugs, typos or things you think should be included but are not. Please send it to the "Contact Person" email that appears in the [Catalogue page for this GEi](http://catalogue.fiware.org/enablers/application-mashup-wirecloud).


## Installation

This page contains the Installation and Administration Guide for the WireCloud Mashup Platform, a reference implementation of the Application Mashup Generic Enabler, based on the [WireCloud](https://conwet.fi.upm.es/wirecloud) Open Source project. The corresponding [online documentation](https://wirecloud.conwet.fi.upm.es/docs/) is continuously updated and improved, and provides the most appropriate source to get the most up-to-date information on installation and administration. Both WireCloud users and developers have the option to create tickets though the [github's issue tracker](https://github.com/Wirecloud/wirecloud/issues) of the project.


### Requirements

This section describes all the requirements of a basic WireCloud installation. **However, these dependencies are not meant to be installed manually in this step, as they will be installed throughout the documentation:**

- A Database Manager (MySQL, PostgreSQL, SQLite3...)
- Python 2.6 or 2.7. Python 3 and other versions are currently not supported. Also the following python packages must be installed:
    - Django 1.5+
    - South 0.7.4+
    - lxml 2.3.0+
    - django-compressor 1.4+
    - rdflib 3.2.0+
    - requests 2.1.0+
    - futures 2.1.3+ (WireCloud 0.7.0 and 0.7.1 required gevent 1.0.0+ but this requirement has been changed by futures on WireCloud 0.7.2+)
    - selenium 2.41+
    - pytz
    - django_relatives
    - user-agents
    - regex
    - markdown
    - whoosh 2.5.6+
    - pycrypto
    - pyScss 1.3.4+
    - Pygments

All these dependencies are available for Linux, Mac OS and Windows, so WireCloud should work on any of these operating systems. However, it is better to use Debian Wheezy+, CentOS 6.3+, Ubuntu 12.04+ or Mac OS X 10.9 as these operating systems are actively tested. Specifically, this installation guide was tested in the following systems: 

- Ubuntu 14.04
- Ubuntu 12.04
- CentOS 6.3
- CentOS 6.5
- Debian Wheezy
- Debian Jessie
- Mac OS 10.9

> *NOTE:* WireCloud can make use of the Marketplace, Store and Repository GEs. If you want to exploit this support, you can choose between installing these GEs or using any of the instances publicly available, for example, on FIWARE Lab (see the "Instances" tab of the corresponding entries at http://catalogue.fiware.org).


### Installing basic dependencies

Before installing WireCloud, you will need to have some basic dependencies installed: python and pip.

> NOTE: Although virtualenv is not required, you should install it before installing WireCloud if you intend to use it. It is highly recommended to use virtualenv (see the using [virtualenv section](#using_virtualenv) for more info) when installing WireCloud in CentOS/RedHat as those systems usually raise problems when installing python packages using their official repositories and pip (a common case, as some packages should be updated for being compatible with WireCloud). Anyway, it is possible to install WireCloud in those systems without using virtual environments.


#### Debian/Ubuntu

This guide assumes you system's package list is up to date. Otherwise, run the following command:

	$ apt-get update

before installing software in Debian/Ubuntu.

    $ apt-get install python python-pip


#### CentOS/RedHat

Python itself can be found in the official CentOS/RedHat repositories:

    $ yum install python

Whereas pip and other packages should be installed from 3rd party repositories. The most common one is the EPEL repository (see http://fedoraproject.org/wiki/EPEL for instructions about how to add it). If you has such a repository, you will be able to install pip using the following command:

    $ yum install python-pip


#### Mac OS

Python comes installed by default in Mac OS, so you don't need to install it. pip can be installed using the following command:

    $ sudo easy_install pip

However, we recommend you to upgrade your python installation using the [Homebrew](http://brew.sh/) tools for Mac:

    $ brew install python

This command will install, as bonus, the pip command tool.

<a id="using_virtualenv"/>
#### Using virtualenv

[virtualenv](http://virtualenv.readthedocs.org/en/latest/virtualenv.html) is a tool to create isolated Python environments. Those Virtual Environments, are an isolated working copy of Python which allows you to work on a specific project without worry of affecting other projects.

virtualenv can be installed using pip:

    $ pip install virtualenv

Once installed virtualenv, you will be able to create virtual environments using the following command:

    $ virtualenv venv

This will create an `venv` folder for storing all the resources related to the virtual environment. To begin using the virtual environment, it needs to be activated:

    $ source venv/bin/activate

You can then begin installing any new modules without affecting the system default Python or other virtual environments. If you are done working in the virtual environment for the moment, you can deactivate it:

    $ deactivate

This puts you back to the system’s default Python interpreter with all its installed libraries.

To delete a virtual environment, just delete its folder.


### Installing WireCloud using pip

WireCloud can be easily installed using [pip](http://www.pip-installer.org/en/latest/installing.html). To install WireCloud from a FIWARE release, download the desired version from the [FIWARE PPP Public Files area](https://forge.fiware.org/frs/?group_id=7).

Once downloaded, you can install it using the following command (assuming you downloaded APPS-Application-Mashup-Wirecloud-4.2.3.tar.gz):

    $ sudo pip install APPS-Application-Mashup-Wirecloud-4.2.3.tar.gz

You can always install the latest version of WireCloud from PyPI using the following command:

    $ sudo pip install wirecloud


### Installing WireCloud from sources

The WireCloud source code is available from the [GitHub WireCloud repository](https://github.com/Wirecloud/wirecloud).

To get the latest development version of the code, you can choose between two options:

- Go to the WireCloud repository on GitHub, switch to the 0.7.x branch (or select a specific 0.7.x tag) and click on the ZIP button to download the repository as a zip file, or just click on this [link](https://github.com/Wirecloud/wirecloud/zipball/0.7.x). Unzip it.
- Or use a [GIT](http://git-scm.com/) client to get the latest development version via Git:

        $ git clone git://github.com/Wirecloud/wirecloud.git
        $ cd wirecloud
        $ git checkout 0.7.x

Once downloaded the source code, you can install WireCloud using the `setup.py` script (this step requires root privileges):

    $ cd <path/to/source/code>/src
    $ sudo python setup.py sdist
    $ sudo pip install dist/wirecloud-<version>.tar.gz

Where `<version>` is the version of WireCloud to install.

### Creating a new instance of WireCloud

Once installed WireCloud, you will have access to the `wirecloud-admin` script. This script is, among other things, used for deploy new instances of WireCloud. Before creating the instance, we recommend you to create a special user for managing and running WireCloud. For example, in Debian/Ubuntu:

    $ adduser --system --group --shell /bin/bash wirecloud

Then, create a new instance directory using the `startproject` command. This will create a new directory containing the `manage.py` script, the configuration files, ... related to the new instance. Moreover, you can add new python modules into this directory to customise your instance.

    $ cd /opt
    $ wirecloud-admin startproject wirecloud_instance

After creating the new instance, you have to configure it choosing a database, populating it and performing final DJango configurations. These steps can be skipped using the `--quick-start` option. This will configure the instance to use SQLite3 with a default admin user (password:admin). This method is very useful for creating a WireCloud instance for testing:

    $ cd /opt
    $ wirecloud-admin startproject wirecloud_instance --quick-start

If you make use of the `--quick-start` option, you should be able to go directly to the [Running WireCloud](#running_wirecloud) section.


### Database installation and configuration

To set up the database engine, it is necessary to modify the `DATABASE` configuration setting in the instance `settings.py` file (e.g. `/opt/wirecloud_instance/wirecloud_instance/settings.py`). You can use any of the [database engines supported by Django](https://docs.djangoproject.com/en/1.4/ref/settings/#databases).

The following examples show you how to configure SQLite and PostgreSQL databases.


#### SQLite

Setting up a SQLite database can be just accomplished within seconds by using the following parameters into the `settings.py` file:

    DATABASES = {
          'default': {
                 'ENGINE': 'django.db.backends.sqlite3',
                 'NAME': '<dbfile>',
                 'USER': '',
                 'PASSWORD': '',
                 'HOST': '',
                 'PORT': '',
         }
    }

where `<dbfile>` is the full path to the database file.

Python directly comes with support for SQLite, but we recommend you to install the pysqlite2 module as it provides a more updated driver:

    $ sudo pip install pysqlite

Finally, please take into account that SQLite database is **not recommended for production purposes**. It is only useful for evaluation purposes.


#### PostgreSQL

For production purposes, PostgreSQL database is a much better choice. To do so, the following parameters must be set in `settings.py`:

    DATABASES = {
          'default': {
                 'ENGINE': 'django.db.backends.postgresql_psycopg2',
                 'NAME': '<dbname>',
                 'USER': '<dbuser>',
                 'PASSWORD': '<dbpassword>',
                 'HOST': '<dbhost>',
                 'PORT': '<dbport>',
         }
    }

where `<dbname>` represents the name of the database, `<dbuser>` is the name of the user with privileges on the database and `<dbpassword>` is the password to use for authenticating the user. `<dbhost>` and `<dbport>` are the host and the port of the database server to use (leave these settings empty if the server is running on the same machine as WireCloud).

The only thing that remains is installing the python bindings for PostgreSQL:

    $ sudo pip install psycopg2

Or alternatively, for Debian/Ubuntu:

    $ sudo apt-get install python-psycopg2

##### Installing PostgresSQL on Debian/Ubuntu

First install the object-relational database system.

    $ sudo apt-get install postgresql

Afterwards you have to create the project Database. We assume that your user has super administrator permissions in PostgreSQL. This usually means that you have to login as the postgres user (i.e. `$ sudo su postgres`).

Both the PostgreSQL database and its user can be created with the following commands:

    $ createuser <dbuser> [-P]
    $ createdb --owner=<dbuser> <dbname>

If you want to create a password protected user you must use the `-P` option.

If you want to create a database called 'wirecloud' and a user called 'wc_user' with privileges on this database, you should write the following:

    $ createuser wc_user [-P]
    $ createdb --owner=wc_user wirecloud

Finally, it is also needed to allow local connections to the database, i.e. from the computer you are installing WireCloud. To do so, add the following rules to the beginning of the `/etc/postgresql/X.X/main/pg_hba.conf` file. In other words, the following two rules MUST be the first two rules of the file:

    # TYPE  DATABASE           USER            CIDR-ADDRESS          METHOD
    local   wirecloud          wc_user                               trust
    local   test_wirecloud     wc_user                               trust # only necessary for testing Wirecloud

Reload `pg_hba.conf` in PostgreSQL server with the following command:

    $ sudo service postgresql reload

And finally, restart PostgreSQL and check if your user has access using this command:

    $ psql wirecloud -U wc_user

##### Installing PostgresSQL on other platforms

Please, follow the [oficial PostgresSQL installation guide](http://www.postgresql.org/download/).

### Database population

Before running WireCloud, it is necessary to populate the database. This can be achieved by using this command:

    $ python manage.py syncdb --migrate

This command creates some tables and asks you if you want to create a Django superuser. This user is required to login into WireCloud and to be able to perform administrative tasks; please respond yes. An example of the command output, where user/password are admin/admin, is the following:

    ...

    You just installed Django's auth system, which means you don't have any superusers defined.
    Would you like to create one now? (yes/no): yes
    Username (leave blank to use 'wirecloud'): admin
    E-mail address: admin@c.com
    Password: ***** (admin)
    Password (again): ***** (admin)

Finally, whenever the WireCloud code is updated, the database must be migrated (and this is one of those times):

    $ python manage.py migrate

> **NOTE:** It is strongly recommended to perform a full database backup before starting to migrate WireCloud to a new version.

### Extra options

Here’s a list of general settings available in WireCloud and their default values. These settings are configured in the `settings.py` file. Also, take into account that most of these settings are based on settings provided by Django (see [Django documentation](https://docs.djangoproject.com/en/dev/ref/settings) for more info).


#### ADMINS
(Tuple, default: `()` [Empty tuple])

A tuple that lists people who get code error notifications. When `DEBUG=False` and a view raises an exception, WireCloud will email these people with the full exception information. Each member of the tuple should be a tuple of (Full name, email address). Example:

    (('John', 'john@example.com'), ('Mary', 'mary@example.com'))

Note that Django will email all of these people whenever an error happens.


#### ALLOW_ANONYMOUS_USER
(Boolean; default: `True`)

A boolean that turns on/off anonymous user access. Take into account that disabling anonymous access will reduce the usefulness of embedded and public workspaces as they will require users to be logged in.


#### DEBUG
(Boolean; default: `False`)

A boolean that turns on/off debug mode.

**Never deploy a site into production with `DEBUG` turned on.**

One of the main features of debug mode is the display of detailed error pages. If WireCloud raises an exception when `DEBUG` is `True`, Django will display a detailed traceback, including a lot of metadata about your environment, such as all the currently defined Django settings (from `settings.py`).


#### DEFAULT_LANGUAGE
(String; default: "browser")

Language code to use by default (e.g. "en"). This setting also support other values: "browser", meaning "use the language detected from browser" and "default" for using the value of the `LANGUAGE_CODE` setting.


#### FORCE_DOMAIN
(String, default: `None`)

Set `FORCE_DOMAIN` using an string if you want to force WireCloud to use a
concrete domain name when building internal URLs. If this setting is `None` (the
default), WireCloud will use the domain info coming with the requests or from
the [Django's sites
framework](https://docs.djangoproject.com/en/1.4/ref/contrib/sites/) if
configured and used.

This setting is mainly useful when WireCloud is behind a web server acting as
proxy.


#### FORCE_PROTO
(String, default: `None`)

Set `FORCE_PROTO` to "http" or to "https" if you want to force WireCloud to use
one of those schemes when building internal URLs.

If this setting is `None` (the default), WireCloud will check if the request
comes from a secure connection and, in that case, it will use https as the
scheme for building the internal URLs. In any other case, WireCloud will use
http as the scheme for the internal URLs.

This setting is mainly useful when WireCloud is behind a web server acting as
proxy.


#### LANGUAGE_CODE
(String; default: "en-us") 

A string representing the language code to use as fallback when no translation exist for a given literal to the user’s preferred language. For example, U.S. English is "en-us".


#### SERVER_EMAIL
(String; default: 'root@localhost')

The email address that error messages come from, such as those sent to `ADMINS`.


#### THEME_ACTIVE
(String, default: "wirecloud.defaulttheme")

A string representing the module that will be use for theming WireCloud. Current themes shipped with WireCloud are "wirecloud.defaulttheme", "wirecloud.fiwaretheme" and "wirecloud.oiltheme".


#### URL_MIDDLEWARE_CLASSES
(Dictionary; default: A middleware configuration dictionary)

A data structure containing the middleware configuration per URL group where the URL group name are the keys of the dictionary and the value should be a tuple of middleware classes to use for that group.

You should use this setting as replacement of the Django's MIDDLEWARE_CLASSES setting (See [Django's middleware documentation](https://docs.djangoproject.com/en/dev/topics/http/middleware/))

Currently available groups are "default", "api" and "proxy". For example, if you want to add a middleware class to the "api" group, you can use the following code:

    URL_MIDDLEWARE_CLASSES['api'] += ('my.middleware.module.MyMiddlware',)


#### WIRECLOUD_HTTPS_VERIFY
*new in WireCloud 0.7.0*

(Boolean or String, default: True)

Set `WIRECLOUD_HTTPS_VERIFY` to False if you want WireCloud not validate HTTPS certificates. If this setting is True (the default), WireCloud will verify https certificates using the CA certificates bundled with python requests or using the certificates provided by the system (this depends on the procedure followed for installing the python requests module). You can also provide a path to a CA bundle file to use instead (e.g. `WIRECLOUD_HTTPS_VERIFY = "/etc/ssl/certs/ca-certificates.crt"`).


### Django configuration

The `settings.py` file allows you to set several options in WireCloud. If `DEBUG` is `False` you will need to collect WireCloud static files using the following command and answering 'yes' when asked:

    $ python manage.py collectstatic

In addition, you should serve the static files with a fast performance http server like [Nginx](http://nginx.org/) or [Apache](http://httpd.apache.org/). Django has documentation for this [topic](https://docs.djangoproject.com/en/dev/howto/deployment/).

Finally, you can compress css and javascript code files for better performance using the following command:

    $ python manage.py compress

> NOTE: Don't forget to rerun the collectstatic and compress commands each time the WireCloud code is updated, this include each time an add-on is added or remove or the default theme is changed.


### Advanced configurations

#### Installing the WireCloud Pub Sub add-on

The development of the Pub Sub add-on is carried out at they own [github repository](https://github.com/conwetlab/wirecloud-pubsub). You can always find the latest information about how to install and use it on the main page of the repository.

Newer versions of the Pub Sub add-on can be installed directly using pip:

    $ pip install wirecloud-pubsub

Since wirecloud_pubsub uses `django.contrib.static` functionalities, you should add it to your `INSTALLED_APPS` in `settings.py`:

    INSTALLED_APPS = (
        ...
        'wirecloud_pubsub',
       ...
    )

As last step, add a `DEFAULT_SILBOPS_BROKER` setting with the URL of the broker to use:

    DEFAULT_SILBOPS_BROKER = 'http://pubsub.server.com:8080/silbops/CometAPI'

Don't forget to run the collectstatic and compress commands on your WireCloud installation:

    $ ./manage.py collectstatic
    $ ./manage.py compress


#### NGSI proxy

WireCloud comes with a javascript library that allows widgets and operators to connect to NGSI-9/10 servers. This support works out of the box when installing WireCloud except for receiving notification directly to widgets and operators. To enable it WireCloud requires what is called NGSI proxy, this proxy is a facade that receives NGSI notifications and passes them to Widgets or Operators.

This NGSI proxy doesn't need to be installed in the same machine as WireCloud and can be shared with other WireCloud instances. WireCloud will use the NGSI proxy passed to the ngsi_proxy_url option of the NGSI.Connection object. This URL can be obtained from Widget/Operator preference defined in its `config.xml`.

You can install a NGSI proxy following those steps:

    $ apt-get install nodejs npm
    $ ln -s /usr/bin/nodejs /usr/bin/node
    $ git clone git://github.com/conwetlab/ngsijs.git
    $ cd ngsijs/ngsi-proxy
    $ npm install

After this, you can run the NGSI proxy issuing the following command:

    $ npm run start


#### Integration with the IdM GE

Create a new Application using the IdM server to use (for example: `https://account.lab.fiware.org`).

1. Redirect URI must be: http(s)://<wirecloud_server>/complete/fiware/
2. Install the `social-auth` django module (e.g. `pip install django-social-auth`)
3. Edit settings.py:
    - Remove wirecloud.oauth2provider from `INSTALLED_APPS`
    - Add social_auth to `INSTALLED_APPS`
    - Add `wirecloud.fiware.social_auth_backend.FiwareBackend` to `AUTHENTICATION_BACKENDS`. example:

            AUTHENTICATION_BACKENDS = (
                'wirecloud.fiware.social_auth_backend.FiwareBackend',
                'django.contrib.auth.backends.ModelBackend',
            )

    - Add a `FIWARE_IDM_SERVER` setting pointing to the IdM server to use (e.g. `FIWARE_IDM_SERVER = "https://account.lab.fiware.org"`)
    - Add `FIWARE_APP_ID` and `FIWARE_APP_SECRET` settings using the id and secret values provided by the IdM. You should end having something like this:

            FIWARE_APP_ID = "43"
            FIWARE_APP_SECRET = "a6ded8771f7438ce430dd93067a328fd282c6df8c6c793fc8225e2cf940f746e6b229158b5e3828e2716b915d2c4762a34219e1792b85e4d3cdf66d70d72840b"

4. Edit `urls.py`:
    - Replace the login endpoint:
        - Remove: `url(r'^login/?$', 'django.contrib.auth.views.login', name="login"),`
        - Add: `url(r'^login/?$', 'wirecloud.fiware.views.login', name="login"),`
    - Add social-auth url endpoints at the end of the pattern list: `url(r'', include('social_auth.urls'))`,
5. Run `python manage.py syncdb --migrate; python manage.py collectstatic --noinput; python manage.py compress --force`

<a id="running_wirecloud" />
### Running WireCloud

We recommend running WireCloud based on an Apache Web Server. However, it is also possible to run it using the Django internal web server, just for testing purposes. In any case, WireCloud should be configured for being served over HTTPS, this can be accomplished in severals ways as you can use another server as frontend and configure the encryption on that server. We recommend you to visit the [Security/Server Side TLS](https://wiki.mozilla.org/Security/Server_Side_TLS) page from mozilla for more information about how to configure efficiently your https security parameters.

#### Running WireCloud using the Django internal web server

> **Note:** Be aware that this way of running WireCloud should be used for evaluation/testing purposes. Do not use it in a production environment.

To start WireCloud, type the following command:

    $ python manage.py runserver 0.0.0.0:8000 --insecure

Then, go to `http://computer_name_or_IP_address:8000/` where computer_name_or_IP_address is the name or IP address of the computer on which WireCloud is installed, and use the username and password you provided when populating the database to sign in on the platform.

#### Running WireCloud using Apache 2

If you choose to deploy WireCloud in Apache, the [mod_wsgi](https://github.com/GrahamDumpleton/mod_wsgi) module must be installed (and so does Apache!).

##### Installing Apache 2 on Debian/Ubuntu

To do so, type the following command on Debian/Ubuntu:

    $ sudo apt-get install apache2 libapache2-mod-wsgi

Once you have installed Apache and mod_wsgi you have to enable the latest:

    $ a2enmod wsgi

The next step is the creation of a `VirtualHost` for WireCloud using the Apache's configuration files. On Debian and Ubuntu the configuration files for the VirtualHosts are stored at `/etc/apache2/sites-available` and enabled and disabled using `a2enmod` and `a2dissite`. The syntax of the `VirtualHost` definition depends on the version of Apache 2 of your system, so they are going to be described in different sections.

##### Installing Apache 2 on CentOS/RedHat

    $ yum install httpd mod_wsgi

##### Apache 2.2

You can use this template as starting point:

    <VirtualHost *:80>
            ...
            ### Wirecloud ###
            WSGIPassAuthorization On

            WSGIDaemonProcess wirecloud python-path=<path_to_wirecloud>
            WSGIScriptAlias / <path_to_wirecloud_wsgi.py>
            <Location />
                    WSGIProcessGroup wirecloud
            </Location>

            Alias /static <path_to_wirecloud>/static
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

Assuming that your wirecloud instance is available at `/opt/wirecloud_instance`, you should have something similar to:

    <VirtualHost *:80>
            ...
            ### Wirecloud ###
            WSGIPassAuthorization On

            WSGIDaemonProcess wirecloud python-path=/opt/wirecloud_instance
            WSGIScriptAlias / /opt/wirecloud_instance/wirecloud_instance/wsgi.py
            <Location />
                    WSGIProcessGroup wirecloud
            </Location>

            Alias /static /opt/wirecloud_instance/static
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

Once you have the site enabled, restart Apache

    # apache2ctl graceful

and go to `http://computer_name_or_IP_address/` to get into WireCloud.

See the [Apache 2.2 documentation about how to configure the TLS encryption](http://httpd.apache.org/docs/2.2/ssl/ssl_howto.html) and the [Security/Server Side TLS](https://wiki.mozilla.org/Security/Server_Side_TLS) page from mozilla for more information about how to configure efficiently your https security parameters.


##### Apache 2.4

You can use this template as starting point:

    <VirtualHost *:80>
            ...

            <Directory <path_to_wirecloud>/<instance_name>
                    <Files "wsgi.py">
                            Require all granted
                            Order allow,deny
                            Allow from all
                    </Files>
            </Directory>
            ### Wirecloud ###
            WSGIPassAuthorization On

            WSGIDaemonProcess wirecloud python-path=<path_to_wirecloud>
            WSGIScriptAlias / <path_to_wirecloud_wsgi.py>
            <Location />
                    WSGIProcessGroup wirecloud
            </Location>

            Alias /static <path_to_wirecloud>/static
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

Assuming that your wirecloud instance is available at `/opt/wirecloud_instance`, you should have something similar to:

    <VirtualHost *:80>
            ...

            <Directory /opt/wirecloud_instance/wirecloud_instance>
                    <Files "wsgi.py">
                            Require all granted
                            Order allow,deny
                            Allow from all
                    </Files>
            </Directory>

            ### Wirecloud ###
            WSGIPassAuthorization On

            WSGIDaemonProcess wirecloud python-path=/opt/wirecloud_instance
            WSGIScriptAlias / /opt/wirecloud_instance/wirecloud_instance/wsgi.py
            <Location />
                    WSGIProcessGroup wirecloud
            </Location>

            Alias /static /opt/wirecloud_instance/static
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

Once you have the site enabled, restart Apache

    # apache2ctl graceful

and go to `http://computer_name_or_IP_address/` to get into WireCloud.

See the [Apache 2.4 documentation about how to configure the TLS encryption](http://httpd.apache.org/docs/2.2/ssl/ssl_howto.html) and the [Security/Server Side TLS](https://wiki.mozilla.org/Security/Server_Side_TLS) page from mozilla for more information about how to configure efficiently your https security parameters..


### FAQ

#### pip has problems installing lxml. What I have to do?

See http://lxml.de/installation.html#installation for more detailed info.

For instance, in Debian and Ubuntu you probably have to install the `python-dev`, `libxml2-dev` and `libxslt1-dev` packages:

    $ sudo apt-get install python-dev libxml2-dev libxslt1-dev

In Mac OS, remember to install XCode and its Command Line Tools. If this doesn't work and you use're using the [Homebrew](http://brew.sh/) tools for Mac, you can try the following commands:

    $ brew install libxml2
    $ pip install lxml


#### I'm getting strange errors. Is there any way to get better info about the problem?

You can set the `DEBUG` setting to `True`


#### I don't remember the admin credentials. How can I recover it?

You have two options:

- change the password of your admin user: see `python manage.py help changepassword`
- create a new admin user: see `python manage.py help createsuperuser`


#### I get errors while running the manage.py script or when running the startproject command

If the error is similar to the following one:

       Traceback (most recent call last):
         File "./manage.py", line 8 in <module>
           from django.core.management import execute_from_command_line
       ImportError: No module named django.core.management

check that you python installation is correctly configured (using the python interpreter used for running WireCloud):

    $ python
    Python 2.7.6 (default, Nov 13 2013, 20:19:29)
    [GCC 4.2.1 Compatible Apple LLVM 5.0 (clang-500.2.79)] on darwin
    Type "help", "copyright", "credits" or "license" for more information.
    >>> import django
    >>> django.VERSION
    (1, 5, 5, 'final', 0)

#### WireCloud server is giving 503 error responses

If you see messages in the apache log file like:

    (13)Permission denied: mod_wsgi (pid=26962): Unable to connect to WSGI \
    daemon process '<process-name>' on '/etc/httpd/logs/wsgi.26957.0.1.sock' \
    after multiple attempts.

edit `/etc/httpd/conf.d/wsgi.conf` and add the following line:

    WSGISocketPrefix /var/run/wsgi

See the following [link](https://code.google.com/p/modwsgi/wiki/ConfigurationIssues#Location_Of_UNIX_Sockets) for more information about this problem.


#### I get the following error \...

##### Error processing proxy request: 'HTTPResponse' object has no attribute 'stream'

Check your python requests module version.

##### AttributeError: This StreamingHttpResponse instance has no \`content\` attribute. Use \`streaming_content\` instead.

Remove `MIDDLEWARE` configuration from your `settings.py` file.


## Administration procedures

### Administration commands

WireCloud provides a set of command line tools that can be used from the command line (manually or by scripts) on the folder of the WireCloud instance.

#### addtocatalogue

Adds one or more packaged mashable application components into the catalogue. At least one of the following flags:

- **redeploy**
  Replace mashable application components files with the new ones.
- **users**=USERS
  Comma separated list of users that will obtain access to the uploaded mashable application components
- **groups**=GROUPS
  Comma separated list of groups that will obtain access rights to the uploaded mashable application components
- **public**
  Allow any user to access the mashable application components.

Example usage:

	$ python manage.py addtocatalogue --users=admin,ringo file1.wgt file2.wgt


#### changepassword

Allows changing a user’s password. It prompts you to enter twice the password of the user given as parameter. If they both match, the new password will be changed immediately. If you do not supply a user, the command will attempt to change the password whose username matches the current user.

Example usage:

	$ python manage.py changepassword ringo


#### createsuperuser

Creates a superuser account (a user who has all permissions). This is useful if you need to create an initial superuser account or if you need to programmatically generate superuser accounts for your site(s).

When run interactively, this command will prompt for a password for the new superuser account. When run non-interactively, no password will be set, and the superuser account will not be able to log in until a password has been manually set for it.

- **--noinput**
  Tells Django to NOT prompt the user for input of any kind. You must use **--username** with **--noinput**, along with an option for any other required field. Superusers created with **--noinput** will not be able to sign in until they're given a valid password.
- **--username**
  Specifies the login for the superuser.
- **--email**
  Specifies the email for the superuser.

The username and email address for the new account can be supplied by using the **--username** and **--email** arguments on the command line. If either of those is not supplied, `createsuperuser` will prompt for it when running interactively.

Example usage:

	$ python manage.py createsuperuser


#### resetsearchindexes

Rebuilds whoosh indexes used by the search engine of WireCloud. Some commonly used options are:

- **noinput**
  Do NOT prompt the user for input of any kind.
- **indexes**=INDEXES
  Comma separated list of indexes to reset. Current available indexes: user, group and resource. All by default.

Example usage:

	$ python manage.py resetsearchindexes --noinput --indexes=user,group


### Creating WireCloud backups and restoring them

1. Create a backup of your instance folder. For example:

        $ tar -cvjf wirecloud-backup.tar.bz2 -C /path/to/your/instance .

2. Create a backup of your database.

There are several ways for creating backups of the data stored in the database
used by WireCloud, each of them with its advantages and disadvantages.

> **NOTE:** Always stop WireCloud before creating a backup for ensuring data
> consistency.

#### Database backups using Django

Django provides the `dumpdata` and `loaddata` commands that can be used for
creating and restoring backups. Those commands can be used independently of the
database engine used. Moreover, you can create those backups using a given
database engine and restore them using a different one. Run the following
command for creating a backup of your database using Django:

    $ python manage.py dumpdata > wirecloud.backup

For restoring the backup you only have to run the `loaddata` command, using a
clean database:

    $ python manage.py loaddata wirecloud.backup

> **Note**: Backups created using `dumpdata` can only be restored using the same
> WireCloud version used for creating the backup. If you need to use a different
> version, restore the backup using the original version and then
> upgrade/downgrade it.


#### SQLite3 database backups

Creating a backup of a SQLite3 database is as easy as creating a copy of the
file where the database is stored. The only thing to take into account is to
stop WireCloud before creating the copy to avoid possible inconsistences.

The restoration procedure is as easy as the creation, you only have to make
WireCloud use the copied database file by editing the `settings.py` file or by
moving the copied database file to the place expected by WireCloud.

> **NOTE**: Take into account that this means that if you are making a full
> backup of your WireCloud instance, you don't need an extra step for
> backing up the database, this backup is already performed by backing up
> the instance directory.

#### PostgreSQL database backups

You can find more informatio about how to create PostgreSQL backups in this
[page](http://www.postgresql.org/docs/9.1/static/backup-dump.html). Basically,
you have to run the following command:

    $ pg_dump <dbname> > wirecloud.backup

> Make sure WireCloud is not running before making the backup

You can restore the backup using the following command:

    $ psql <dbname> < wirecloud.backup


### Upgrading from previous versions

1. Install the new version of WireCloud
2. Migrate the database, collect the new static files and create the compressed
versions of the JavaScript and CSS files by running the following command:

        $ python manage.py syncdb --migrate; python manage.py collectstatic --noinput; python manage.py compress --force

3. Reload WireCloud (e.g. `$ service apache2 restart`)

### From 0.6.x to 0.7.x

WireCloud 0.7.x adds support for using Whoosh indexes for searching, as
WireCloud 0.6.x didn't use Whoosh, you need to run an extra step when migrating
from 0.6.x to 0.7.x for creating a initial version of those indexes:

    $ python manage.py resetsearchindexes
