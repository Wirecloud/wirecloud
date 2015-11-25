## Introduction

This Installation WireCloud version 0.8 (starting from FIWARE release 4.4). Any feedback on this document is highly welcomed, including bugs, typos or things you think should be included but are not. Please send it to the "Contact Person" email that appears in the [Catalogue page for this GEi](http://catalogue.fiware.org/enablers/application-mashup-wirecloud).

## Requirements

This section describes all the requirements of a basic WireCloud installation. **However, these dependencies are not meant to be installed manually in this step, as they will be installed throughout the documentation:**

- A Database Manager (MySQL, PostgreSQL, SQLite3...)
- Python 2.7 or python 3.4+. In any case, the following python packages must be installed:
    - Django 1.5+
    - South 0.7.4+
    - lxml 2.3.0+
    - django-appconf 1.0.1+
    - django-compressor 1.4+
    - rdflib 3.2.0+
    - requests 2.1.0+
    - futures 2.1.3+ (only on python 2.7)
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

All these dependencies are available for Linux, Mac OS and Windows, so WireCloud should work on any of these operating systems. However, it is better to use Debian Wheezy+, CentOS 7+, Ubuntu 12.04+ or Mac OS X 10.9 (only recommended for development/testing) as these operating systems are actively tested. Specifically, this installation guide was tested in the following systems:

- Ubuntu 14.04
- Ubuntu 12.04
- CentOS 7
- Debian Wheezy
- Debian Jessie
- Mac OS 10.9+

> **NOTE:** WireCloud can make use of the Marketplace, Store and Repository GEs. If you want to exploit this support, you can choose between installing these GEs or using any of the instances publicly available, for example, on FIWARE Lab (see the "Instances" tab of the corresponding entries at [http://catalogue.fiware.org](http://catalogue.fiware.org)).


## Installing basic dependencies

Before installing WireCloud, you will need to have some basic dependencies installed: python and [pip](http://www.pip-installer.org/en/latest/installing.html).

> **NOTE:** Although virtualenv is not required, you should install it before installing WireCloud if you intend to use it. It is highly recommended to use virtualenv (see the using [virtualenv section](#using-virtualenv) for more info) when installing WireCloud in CentOS/RedHat as those systems usually raise problems when installing python packages from their official repositories and, at the same time, from pip (a common case in those systems, as some packages should be updated for being compatible with WireCloud, but are requirements of other system applications). Anyway, although harder, it is possible to install WireCloud in those systems without using virtual environments.


### Debian/Ubuntu

This guide assumes you system's package list is up to date. Otherwise, run the following command:

	$ apt-get update

before installing software in Debian/Ubuntu:

    $ apt-get install python python-pip --no-install-recommends

It's also recommended to install the following packages:

    $ apt-get install python-dev libxml2-dev libxslt1-dev zlib1g-dev libpcre3-dev libcurl4-openssl-dev


### CentOS/RedHat

Python itself can be found in the official CentOS/RedHat repositories:

    $ yum install python

Whereas pip and other packages should be installed from 3rd party repositories. The most common one is the EPEL repository (see http://fedoraproject.org/wiki/EPEL for instructions about how to add it). If you has such a repository, you will be able to install pip using the following command:

    $ yum install python-pip


It's also recommended to install the following packages:

    $ yum install gcc python-devel libxslt-devel zlib-devel pcre-devel libcurl-devel


### Mac OS

Python comes installed by default in Mac OS, so you don't need to install it. pip can be installed using the following command:

    $ sudo easy_install pip

However, we recommend you to upgrade your python installation using the [Homebrew](http://brew.sh/) tools for Mac:

    $ brew install python

This command will install, as bonus, the pip command tool.

It's also recommended to install the following package:

    $ brew install pcre

You will also need the command line developer tools for xcode. You can install them by running the following command:

    $ xcode-select --install

### Using virtualenv

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


## Installing WireCloud using pip (recommended)

You can always install the latest stable version of WireCloud using pip:

    $ sudo pip install wirecloud


## Installing WireCloud from sources

The WireCloud source code is available on the [GitHub WireCloud repository](https://github.com/Wirecloud/wirecloud).

To get the latest development version of the code, you can choose between two options:

- Go to the WireCloud repository on GitHub, switch to the `0.8.x` branch (or select a specific 0.8.x tag, e.g. `0.8.0`) and click on the *Download ZIP* button to download the repository as a zip file, or just click on this [link](https://github.com/Wirecloud/wirecloud/zipball/0.8.x). Unzip it.
- Or use a [GIT](http://git-scm.com/) client to get the latest development version via Git:

        $ git clone git://github.com/Wirecloud/wirecloud.git
        $ cd wirecloud
        $ git checkout 0.8.x

Once downloaded the source code, you can install WireCloud using the `setup.py` script (this step requires root privileges):

    $ cd ${path_to_source_code}/src
    $ sudo python setup.py bdist_whell
    $ sudo pip install dist/wirecloud-${version}-py2.py3-none-any.whl

Where `${version}` is the version of WireCloud to install.

## Installing WireCloud using Docker

WireCloud can also be deployed using [Docker](https://www.docker.com/), the images can be found on [docker hub](https://hub.docker.com/r/fiware/wirecloud/). This guide doesn't cover WireCloud installation using docker, please refere to the [docker's documentation](https://docs.docker.com/userguide/dockerimages/), as it can be used as any other docker image (e.g. it can also be used with docker-machine); and to the documentation available on docker hub about the WireCloud's image for more info about how to procede in this case. Anyway, once installed, you can make changes in the configuration of your WireCloud container following the steps described in this guide as well as make use of any of the administration procedures described in the [Administration Guide](administration_guide.md) section.

> WireCloud's DockerFiles and image documentation are hosted on the [docker-wirecloud](https://github.com/Wirecloud/docker-wirecloud/) repository.

## Creating a new instance of WireCloud

Once installed WireCloud, you will have access to the `wirecloud-admin` script. This script is, among other things, used for deploy new instances of WireCloud. Before creating the instance, we recommend you to create a special user for managing and running WireCloud. For example, in Debian/Ubuntu:

    $ adduser --system --group --shell /bin/bash wirecloud

Then, create a new instance directory using the `startproject` command. This will create a new directory containing the `manage.py` script, the configuration files, ... related to the new instance. Moreover, you can add new python modules into this directory to customise your instance.

    $ cd /opt
    $ wirecloud-admin startproject wirecloud_instance

After creating the new instance, you have to configure it choosing a database, populating it and performing final DJango configurations. These steps can be skipped using the `--quick-start` option. This will configure the instance to use SQLite3 with a default admin user (password:admin). This method is very useful for creating a WireCloud instance for testing:

    $ cd /opt
    $ wirecloud-admin startproject wirecloud_instance --quick-start

If you make use of the `--quick-start` option, you should be able to go directly to the [Running WireCloud](#running-wirecloud) section.


## Database installation and configuration

To set up the database engine, it is necessary to modify the `DATABASE` configuration setting in the instance `settings.py` file (e.g. `/opt/wirecloud_instance/wirecloud_instance/settings.py`). You can use any of the [database engines supported by Django](https://docs.djangoproject.com/en/1.4/ref/settings/#databases).

The following examples show you how to configure SQLite and PostgreSQL databases.


### SQLite

Setting up a SQLite database can be just accomplished within seconds by using the following parameters into the `settings.py` file:

```python
DATABASES = {
      'default': {
             'ENGINE': 'django.db.backends.sqlite3',
             'NAME': '${dbfile}',
             'USER': '',
             'PASSWORD': '',
             'HOST': '',
             'PORT': '',
     }
}
```

where `${dbfile}` is the full path to the database file.

Python directly comes with support for SQLite, but we recommend you to install the pysqlite2 module as it provides a more updated driver:

    $ sudo pip install pysqlite

Finally, please take into account that SQLite database is **not recommended for production purposes**. It is only useful for evaluation purposes.


### PostgreSQL

For production purposes, PostgreSQL database is a much better choice. To do so, the following parameters must be set in `settings.py`:

```python
DATABASES = {
      'default': {
             'ENGINE': 'django.db.backends.postgresql_psycopg2',
             'NAME': '${dbname}',
             'USER': '${dbuser}',
             'PASSWORD': '${dbpassword}',
             'HOST': '${dbhost}',
             'PORT': '${dbport}',
     }
}
```

where `${dbname}` represents the name of the database, `${dbuser}` is the name of the user with privileges on the database and `${dbpassword}` is the password to use for authenticating the user. `${dbhost}` and `${dbport}` are the host and the port of the database server to use (leave these settings empty if the server is running on the same machine as WireCloud).

The only thing that remains is installing the python bindings for PostgreSQL:

    $ sudo pip install psycopg2

Or alternatively, for Debian/Ubuntu:

    $ sudo apt-get install python-psycopg2

#### Installing PostgresSQL on Debian/Ubuntu

First install the object-relational database system.

    $ sudo apt-get install postgresql

Afterwards you have to create the project Database. We assume that your user has super administrator permissions in PostgreSQL. This usually means that you have to login as the postgres user (i.e. `$ sudo su postgres`).

Both the PostgreSQL database and its user can be created with the following commands:

    $ createuser ${dbuser} [-P]
    $ createdb --owner=${dbuser} ${dbname}

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

#### Installing PostgresSQL on other platforms

Please, follow the [oficial PostgresSQL installation guide](http://www.postgresql.org/download/).

## Database population

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

## Extra options

Here’s a list of general settings available in WireCloud and their default values. These settings are configured in the `settings.py` file. Also, take into account that most of these settings are based on settings provided by Django (see [Django documentation](https://docs.djangoproject.com/en/dev/ref/settings) for more info).


### ADMINS
> (Tuple, default: `()` [Empty tuple])

A tuple that lists people who get code error notifications. When `DEBUG=False` and a view raises an exception, WireCloud will email these people with the full exception information. Each member of the tuple should be a tuple of (Full name, email address). Example:

```python
(('John', 'john@example.com'), ('Mary', 'mary@example.com'))
```

Note that Django will email all of these people whenever an error happens.


### ALLOW_ANONYMOUS_USER
> (Boolean; default: `True`)

A boolean that turns on/off anonymous user access. Take into account that disabling anonymous access will reduce the usefulness of embedded and public workspaces as they will require users to be logged in.


### DEBUG
> (Boolean; default: `False`)

A boolean that turns on/off debug mode.

**Never deploy a site into production with `DEBUG` turned on.**

One of the main features of debug mode is the display of detailed error pages. If WireCloud raises an exception when `DEBUG` is `True`, Django will display a detailed traceback, including a lot of metadata about your environment, such as all the currently defined Django settings (from `settings.py`).


### DEFAULT_LANGUAGE
> (String; default: "browser")

Language code to use by default (e.g. "en"). This setting also support other values: "browser", meaning "use the language detected from browser" and "default" for using the value of the `LANGUAGE_CODE` setting.


### FORCE_DOMAIN
> (String, default: `None`)

Set `FORCE_DOMAIN` using an string if you want to force WireCloud to use a
concrete domain name (without including the port) when building internal URLs.
If this setting is `None` (the default), WireCloud will try to use the [Django's
sites framework](https://docs.djangoproject.com/en/1.4/ref/contrib/sites/) for
obtaining the domain info. If the sites framework is not used, the domain is
extracted from the request.

> This setting is mainly useful when WireCloud is behind a web server acting as
> proxy.


### FORCE_PORT
> (Integer, default: `None`)

Set `FORCE_PORT` using a number if you want to force WireCloud to use
that port when building internal URLs.

If this setting is `None` (the default), WireCloud will use the port info from
incoming requests for building internal URLs.

> This setting is mainly useful when WireCloud is behind a web server acting as
> proxy.


### FORCE_PROTO
> (String, default: `None`)

Set `FORCE_PROTO` to "http" or to "https" if you want to force WireCloud to use
one of those schemes when building internal URLs.

If this setting is `None` (the default), WireCloud will check if the request
comes from a secure connection and, in that case, it will use https as the
scheme for building the internal URLs. In any other case, WireCloud will use
http as the scheme for the internal URLs.

> This setting is mainly useful when WireCloud is behind a web server acting as
> proxy.


### LANGUAGE_CODE
> (String; default: "en-us")

A string representing the language code to use as fallback when no translation exist for a given literal to the user’s preferred language. For example, U.S. English is "en-us".


### SERVER_EMAIL
> (String; default: 'root@localhost')

The email address that error messages come from, such as those sent to `ADMINS`.


### THEME_ACTIVE
> (String, default: "wirecloud.defaulttheme")

A string representing the module that will be use for theming WireCloud. Current
themes shipped with WireCloud are `wirecloud.defaulttheme`,
`wirecloud.fiwaretheme` and `wirecloud.fiwarelabtheme`. You can also use [custom
themes](development/platform/themes).

> **NOTE**: `wirecloud.fiwarelabtheme` was previously (WireCloud 0.8.1-) known as
> `wirecloud.oiltheme`. Although you can still reference it as
> `wirecloud.oiltheme` is recommended to switch to the new name:
> `wirecloud.fiwarelabtheme`.


### URL_MIDDLEWARE_CLASSES
> (Dictionary; default: A middleware configuration dictionary)

A data structure containing the middleware configuration per URL group where the URL group name are the keys of the dictionary and the value should be a tuple of middleware classes to use for that group.

You should use this setting as replacement of the Django's MIDDLEWARE_CLASSES setting (See [Django's middleware documentation](https://docs.djangoproject.com/en/dev/topics/http/middleware/))

Currently available groups are "default", "api" and "proxy". For example, if you want to add a middleware class to the "api" group, you can use the following code:

```python
URL_MIDDLEWARE_CLASSES['api'] += ('my.middleware.module.MyMiddlware',)
```


### WIRECLOUD_HTTPS_VERIFY
> *new in WireCloud 0.7.0*
>
> (Boolean or String, default: `True`)

Set `WIRECLOUD_HTTPS_VERIFY` to `False` if you want WireCloud not validate HTTPS
certificates. If this setting is `True` (the default), WireCloud will verify
https certificates using the CA certificates bundled with python requests or
using the certificates provided by the system (this depends on the procedure
followed for installing the python requests module). You can also provide a path
to a CA bundle file to use instead (e.g.
`WIRECLOUD_HTTPS_VERIFY = "/etc/ssl/certs/ca-certificates.crt"`).


## Django configuration

The `settings.py` file allows you to set several options in WireCloud. If
`DEBUG` is `False` you will need to collect WireCloud static files using the
following command and answering 'yes' when asked:

    $ python manage.py collectstatic

In addition, you should serve the static files with a fast performance http
server like [Apache](http://httpd.apache.org/), [Nginx](http://nginx.org/),
[Gunicorn](http://gunicorn.org/), etc. We provide documentation on
[how to serve WireCloud using Apache 2](#running-wirecloud-using-apache-2).
Anyway, if you want to use any of the other http servers (e.g using Gunicorn),
Django provides
[documentation on how to do it](https://docs.djangoproject.com/en/dev/howto/deployment/).

Finally, you can compress css and javascript code files for better performance
using the following command:

    $ python manage.py compress --force

> **NOTE:** Don't forget to rerun the collectstatic and compress commands each
> time the WireCloud code is updated, this include each time an add-on is added
> or remove or the default theme is changed.


## Advanced configurations

### Installing the WireCloud Pub Sub add-on

The development of the Pub Sub add-on is carried out at they own [github
repository](https://github.com/conwetlab/wirecloud-pubsub). You can always find
the latest information about how to install and use it on the main page of the
repository.

Newer versions of the Pub Sub add-on can be installed directly using pip:

    $ pip install wirecloud-pubsub

Since wirecloud_pubsub uses `django.contrib.static` functionalities, you should
add it to your `INSTALLED_APPS` in `settings.py`:

```python
INSTALLED_APPS = (
    # ...
    'wirecloud_pubsub',
    # ...
)
```

As last step, add a `DEFAULT_SILBOPS_BROKER` setting with the URL of the broker to use:

```python
DEFAULT_SILBOPS_BROKER = 'http://pubsub.server.com:8080/silbops/CometAPI'
```

Don't forget to run the collectstatic and compress commands on your WireCloud installation:

    $ ./manage.py collectstatic
    $ ./manage.py compress


### NGSI proxy

WireCloud comes with a javascript library that allows widgets and operators to
connect to NGSI-9/10 servers. This support works out of the box when installing
WireCloud except for receiving notification directly to widgets and operators.
To enable it WireCloud requires what is called NGSI proxy, this proxy is a
facade that receives NGSI notifications and passes them to Widgets or Operators.

This NGSI proxy doesn't need to be installed in the same machine as WireCloud
and can be shared with other WireCloud instances. WireCloud will use the NGSI
proxy passed to the `ngsi_proxy_url` option of the `NGSI.Connection` object. This
URL can be obtained from Widget/Operator preference defined in its `config.xml`.

You can install a NGSI proxy following those steps:

    $ apt-get install nodejs npm
    $ ln -s /usr/bin/nodejs /usr/bin/node
    $ git clone git://github.com/conwetlab/ngsijs.git
    $ cd ngsijs/ngsi-proxy
    $ npm install

After this, you can run the NGSI proxy issuing the following command:

    $ npm run start


### Integration with the IdM GE

Create a new Application using the IdM server to use (for example: `https://account.lab.fiware.org`). See the [KeyRock's User and Programmers Guide] for more info.

1. Redirect URI must be: `http(s)://${wirecloud_server}/complete/fiware/`
2. Install the `python-social-auth` module (e.g. `pip install "python-social-auth<0.3,>=0.2.2"`)
3. Edit `settings.py`:
    - Remove `wirecloud.oauth2provider` from `INSTALLED_APPS`
    - Add `social.apps.django_app.default` to `INSTALLED_APPS`
    - Add `wirecloud.fiware.social_auth_backend.FIWAREOAuth2` to `AUTHENTICATION_BACKENDS`. example:

        ```python
        AUTHENTICATION_BACKENDS = (
            'wirecloud.fiware.social_auth_backend.FIWAREOAuth2',
            'django.contrib.auth.backends.ModelBackend',
        )
        ```

    - Add a `FIWARE_IDM_SERVER` setting pointing to the IdM server to use (e.g. `FIWARE_IDM_SERVER = "https://account.lab.fiware.org"`)
    - Add `SOCIAL_AUTH_FIWARE_KEY` and `SOCIAL_AUTH_FIWARE_SECRET` settings using the id and secret values provided by the IdM. You should end having something like this:

        ```python
        SOCIAL_AUTH_FIWARE_KEY = "43"
        SOCIAL_AUTH_FIWARE_SECRET = "a6ded8771f7438ce430dd93067a328fd282c6df8c6c793fc8225e2cf940f746e6b229158b5e3828e2716b915d2c4762a34219e1792b85e4d3cdf66d70d72840b"
        ```

4. Edit `urls.py`:
    - Replace the login endpoint:
        - Remove: `url(r'^login/?$', 'django.contrib.auth.views.login', name="login"),`
        - Add: `url(r'^login/?$', 'wirecloud.fiware.views.login', name="login"),`
    - Add `python-social-auth` url endpoints at the end of the pattern list: `url('', include('social.apps.django_app.urls', namespace='social')),`
5. Run `python manage.py syncdb --migrate; python manage.py collectstatic --noinput; python manage.py compress --force`


[KeyRock's User and Programmers Guide]: https://fi-ware-idm.readthedocs.org/en/latest/user_guide/#registering-an-application
## Running WireCloud

We recommend running WireCloud based on an Apache Web Server. However, it is
also possible to run it using the Django internal web server, just for testing
purposes. In any case, WireCloud should be configured for being served over
HTTPS, this can be accomplished in severals ways as you can use another server
as frontend and configure the encryption on that server. We recommend you to
visit the [Security/Server Side
TLS](https://wiki.mozilla.org/Security/Server_Side_TLS) page from mozilla for
more information about how to configure efficiently your https security
parameters.

### Running WireCloud using the Django internal web server

> **Note:** Be aware that this way of running WireCloud should be used for evaluation/testing purposes. Do not use it in a production environment.

To start WireCloud, type the following command:

    $ python manage.py runserver 0.0.0.0:8000 --insecure

Then, go to `http://computer_name_or_IP_address:8000/` where computer_name_or_IP_address is the name or IP address of the computer on which WireCloud is installed, and use the username and password you provided when populating the database to sign in on the platform.

### Running WireCloud using Apache 2

If you choose to deploy WireCloud in Apache, the [mod_wsgi](https://github.com/GrahamDumpleton/mod_wsgi) module must be installed (and so does Apache!).

#### Installing Apache 2 on Debian/Ubuntu

To do so, type the following command on Debian/Ubuntu:

    $ sudo apt-get install apache2 libapache2-mod-wsgi

Once you have installed Apache and mod_wsgi you have to enable the latest:

    $ a2enmod wsgi

The next step is the creation of a `VirtualHost` for WireCloud using the
Apache's configuration files. On Debian and Ubuntu the configuration files for
the VirtualHosts are stored at `/etc/apache2/sites-available` and enabled and
disabled using `a2enmod` and `a2dissite`. The syntax of the `VirtualHost`
definition depends on the version of Apache 2 of your system, so they are going
to be described in different sections.

#### Installing Apache 2 on CentOS/RedHat

    $ yum install httpd mod_wsgi

#### Apache 2.2

You can use this template as starting point:

```ApacheConf
<VirtualHost *:80>
        ...
        ### Wirecloud ###
        WSGIPassAuthorization On

        WSGIDaemonProcess wirecloud python-path=${path_to_wirecloud_instance} user=${wirecloud_user} group=${wirecloud_group}
        WSGIScriptAlias / ${path_to_wirecloud_instance}/${wirecloud_instance}/wsgi.py
        <Location />
                WSGIProcessGroup wirecloud
        </Location>

        Alias /static ${path_to_wirecloud_instance}/static
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
```

Assuming that your wirecloud instance is available at `/opt/wirecloud_instance`
and you created a `wirecloud` user on the system, then we have the following values:

- `${path_to_wirecloud_instance}` = `/opt/wirecloud_instance`
- `${wirecloud_instance}` = `wirecloud_instance`
- `${wirecloud_user}` = `wirecloud`
- `${wirecloud_group}` = `wirecloud`

You should end with something similar to:

```ApacheConf
<VirtualHost *:80>
        ...
        ### Wirecloud ###
        WSGIPassAuthorization On

        WSGIDaemonProcess wirecloud python-path=/opt/wirecloud_instance user=wirecloud group=wirecloud
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
```

Once you have the site enabled, restart Apache

    # apache2ctl graceful

and go to `http://computer_name_or_IP_address/` to get into WireCloud.

See the [Apache 2.2 documentation about how to configure the TLS
encryption](http://httpd.apache.org/docs/2.2/ssl/ssl_howto.html) and the
[Security/Server Side TLS](https://wiki.mozilla.org/Security/Server_Side_TLS)
page from mozilla for more information about how to configure efficiently your
https security parameters.


#### Apache 2.4

You can use this template as starting point:

```ApacheConf
<VirtualHost *:80>
        ...

        <Directory ${path_to_wirecloud_instance}/${instance_name}>
                <Files "wsgi.py">
                        Require all granted
                </Files>
        </Directory>

        ### Wirecloud ###
        WSGIPassAuthorization On

        WSGIDaemonProcess wirecloud python-path=${path_to_wirecloud_instance} user=${wirecloud_user} group=${wirecloud_group}
        WSGIScriptAlias / ${path_to_wirecloud_instance}/${instance_name}/wsgi.py
        <Location />
                WSGIProcessGroup wirecloud
        </Location>

        Alias /static ${path_to_wirecloud_instance}/static
        <Location "/static">
                SetHandler None
                Require all granted
                <IfModule mod_expires.c>
                        ExpiresActive On
                        ExpiresDefault "access plus 1 week"
                </IfModule>
                <IfModule mod_headers.c>
                        Header append Cache-Control "public"
                </IfModule>
        </Location>
        <Location "/static/cache">
                Require all granted
                <IfModule mod_expires.c>
                        ExpiresDefault "access plus 3 years"
                </IfModule>
        </Location>
        ...
</VirtualHost>
```

Assuming that your wirecloud instance is available at `/opt/wirecloud_instance`
and you created a `wirecloud` user on the system, then we have the following values:

- `${path_to_wirecloud_instance}` = `/opt/wirecloud_instance`
- `${wirecloud_instance}` = `wirecloud_instance`
- `${wirecloud_user}` = `wirecloud`
- `${wirecloud_group}` = `wirecloud`

You should end with something similar to:

```ApacheConf
<VirtualHost *:80>
        ...

        <Directory /opt/wirecloud_instance/wirecloud_instance>
                <Files "wsgi.py">
                        Require all granted
                </Files>
        </Directory>

        ### Wirecloud ###
        WSGIPassAuthorization On

        WSGIDaemonProcess wirecloud python-path=/opt/wirecloud_instance user=wirecloud group=wirecloud
        WSGIScriptAlias / /opt/wirecloud_instance/wirecloud_instance/wsgi.py
        <Location />
                WSGIProcessGroup wirecloud
        </Location>

        Alias /static /opt/wirecloud_instance/static
        <Location "/static">
                SetHandler None
                Require all granted
                <IfModule mod_expires.c>
                        ExpiresActive On
                        ExpiresDefault "access plus 1 week"
                </IfModule>
                <IfModule mod_headers.c>
                        Header append Cache-Control "public"
                </IfModule>
        </Location>
        <Location "/static/cache">
                Require all granted
                <IfModule mod_expires.c>
                        ExpiresDefault "access plus 3 years"
                </IfModule>
        </Location>
        ...
</VirtualHost>
```

Once you have the site enabled, restart Apache

    # apache2ctl graceful

and go to `http://computer_name_or_IP_address/` to get into WireCloud.

See the [Apache 2.4 documentation about how to configure the TLS
encryption](http://httpd.apache.org/docs/2.2/ssl/ssl_howto.html) and the
[Security/Server Side TLS](https://wiki.mozilla.org/Security/Server_Side_TLS)
page from mozilla for more information about how to configure efficiently your
https security parameters.


## FAQ

### pip has problems installing lxml. What I have to do?

See http://lxml.de/installation.html#installation for more detailed info.

For instance, in Debian and Ubuntu you probably have to install the `python-dev`, `libxml2-dev` and `libxslt1-dev` packages:

    $ sudo apt-get install python-dev libxml2-dev libxslt1-dev

In Mac OS, remember to install XCode and its Command Line Tools. If this doesn't work and you use're using the [Homebrew](http://brew.sh/) tools for Mac, you can try the following commands:

    $ brew install libxml2
    $ pip install lxml


### I'm getting strange errors. Is there any way to get better info about the problem?

You can set the `DEBUG` setting to `True`


### I don't remember the admin credentials. How can I recover it?

You have two options:

- change the password of your admin user: see `python manage.py help changepassword`
- create a new admin user: see `python manage.py help createsuperuser`


### I get errors while running the manage.py script or when running the startproject command

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

### WireCloud server is giving 503 error responses

If you see messages in the apache log file like:

    (13)Permission denied: mod_wsgi (pid=26962): Unable to connect to WSGI \
    daemon process '<process-name>' on '/etc/httpd/logs/wsgi.26957.0.1.sock' \
    after multiple attempts.

edit `/etc/httpd/conf.d/wsgi.conf` and add the following line:

    WSGISocketPrefix /var/run/wsgi

See the following [link](https://code.google.com/p/modwsgi/wiki/ConfigurationIssues#Location_Of_UNIX_Sockets) for more information about this problem.


### I get the following error \...

#### Error processing proxy request: 'HTTPResponse' object has no attribute 'stream'

Check your python requests module version.

#### AttributeError: This StreamingHttpResponse instance has no \`content\` attribute. Use \`streaming_content\` instead.

Remove `MIDDLEWARE` configuration from your `settings.py` file.


## Sanity check procedures

The Sanity Check Procedures are the steps that a System Administrator will take to verify that an installation is ready to be tested. This is therefore a preliminary set of tests to ensure that obvious or basic malfunctioning is fixed before proceeding to unit tests, integration tests and user validation.

### End to End testing

Please note that the following information is required before carrying out this procedure:

- computer_name_or_IP_address is the name or IP address of the computer on which WireCloud has been installed.
- Valid credentials for the WireCloud instance to test (e.g. user: `admin` / password: `admin`, as stated in the [Database population](#database-population) section of this guide).

The following files:

- https://conwet.fi.upm.es/docs/download/attachments/1278018/CoNWeT_weather-example_1.0.3.wgt
- https://conwet.fi.upm.es/docs/download/attachments/1278018/CoNWeT_wms-viewer-geowidget_0.5.2.2.wgt
- https://conwet.fi.upm.es/docs/download/attachments/1278018/CoNWeT_weather-mashup-example_2.0.wgt

To quickly check if the application is running, follow these steps:

1. Open a browser and type `http://${computer_name_or_IP_address}/login` in the address bar.
2. The following user login form should appear:

3. Enter the credentials and click on the *Log in* button.
4. Click on the *Marketplace* button.
5. Open the local catalogue uploader view using the path selector as depicted in the following figure:

6. Upload CoNWeT_weather-example_1.0.3.wgt file using the "Adding widgets from packages" form.

7. The new widget should be now available on the local catalogue.

8. Repeat steps 6 and 7 using the `CoNWeT_wms-viewer-geowidget_0.5.2.2.wgt` and `CoNWeT_weather-mashup-example_2.0.wgt` files.
All the widgets and mashups should be now available on the local catalogue.

Click on the "Add to Workspace" button of the "Weather Example Mashup".
Click on the "New workspace" button.

The view should automatically change to the "Weather Example Mashup" view and widgets should appear in it.

Select the pin tool in the "Web Map Service" widget clicking the appropriated button as shown in the image.

And click the desired location. The "Weather Widget Example" should update the forecast info.

By performing this sequence of steps, you will check that the WireCloud Mashup platform is running and correctly deployed, and its database has been properly set up and populated.

### List of Running Processes

We need to check that the Apache web server and the Postgres database are running. WireCloud uses a python interpreter, but it will not be listed as it runs embedded into apache2. If we execute the following command:

    ps -ewF | grep 'apache2\|postgres' | grep -v grep

It should show something similar to the following:

    $ ps -ewF | grep 'apache2\|postgres' | grep -v grep
    postgres  1631     1  0 25212  9452   0 Jul03 ?        00:00:19 /usr/lib/postgresql/9.1/bin/postgres -D /var/lib/postgresql/9.1/main -c config_file=/etc/postgresql/9.1/main/postgresql.conf
    postgres  1702  1631  0 25208  3784   0 Jul03 ?        00:00:47 postgres: writer process
    postgres  1703  1631  0 25208  1452   0 Jul03 ?        00:00:39 postgres: wal writer process
    postgres  1704  1631  0 25462  2964   0 Jul03 ?        00:00:16 postgres: autovacuum launcher process
    postgres  1705  1631  0 17370  1660   0 Jul03 ?        00:00:18 postgres: stats collector process
    root      3811     1  0 50067 10848   0 13:13 ?        00:00:00 /usr/sbin/apache2 -k start
    www-data  3818  3811  0 68663 39820   0 13:13 ?        00:00:00 /usr/sbin/apache2 -k start
    www-data  3819  3811  0 68687 39448   0 13:13 ?        00:00:00 /usr/sbin/apache2 -k start
    www-data  3822  3811  0 68901 40160   0 13:13 ?        00:00:00 /usr/sbin/apache2 -k start


### Network interfaces Up & Open

To check the ports in use and listening, execute the command:

    $ sudo netstat -ltp

The expected results must be something similar to the following:

    Active Internet connections (only servers)
    Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
    tcp        0      0 localhost:postgresql    *:*                     LISTEN      1631/postgres
    tcp        0      0 *:https                 *:*                     LISTEN      3811/apache2

or these ones in case the machine is configured to use IPv6:

    Active Internet connections (only servers)
    Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
    tcp        0      0 localhost:postgresql    *:*                     LISTEN      1631/postgres
    tcp6       0      0 [::]:https              [::]:*                  LISTEN      3811/apache2


### Databases

The last step in the sanity check, once that we have identified the processes and ports, is to check the different databases that have to be up and accepting queries. If we execute the following command:

    $ psql -U wc_user wirecloud

It should show a message text similar to the following:

    psql (9.1.4)
    Type "help" for help.

    wirecloud=>


## Diagnosis Procedures

The Diagnosis Procedures are the first steps that a System Administrator will take to locate the source of an error in a GE. Once the nature of the error is identified with these tests, the system admin will very often have to resort to more concrete and specific testing to pinpoint the exact point of error and a possible solution. Such specific testing is out of the scope of this section.

### Resource availability

WireCloud runs fine with a minimun of 512 MB of available RAM (1024 MB recommended) and 10 GB of hard disk space. Nevertheless memory usage strongly depends on the number of concurrent users. According to normal usage patterns taken from the log history, memory usage exceeding 256 MB per user are to be considered abnormally high. WireCloud is not CPU-intensive and thus CPU usages over 5% per user is considered abnormal. WireCloud is I/O-intensive and performances below 12 http requests per second are considered abnormal.

The results from monitoring the FIWARE Lab Mashup portal usage shows that the aforementioned ranges remains valid.

### Resource consumption

Resource consumption strongly depends on the load, especially on the number of concurrent users logged in.

- The main memory consumption of the Apache Web server should be between 64 MB and 1024 MB.
- Postgresql should consume a small amount of memory, not more than 64 MB.

### I/O flows

The only expected I/O flow is of type HTTP or HTTPS, on port defined in Apache Web Server configuration files.
