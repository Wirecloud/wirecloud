## Introduction

This Installation WireCloud version 1.2 (starting from FIWARE release 7.4). Any
feedback on this document is highly welcomed, including bugs, typos or things
you think should be included but are not. Please send it to the "Contact Person"
email that appears in the [Catalogue page for this GEi][catalogue].

[catalogue]: http://catalogue.fiware.org/enablers/application-mashup-wirecloud


## Requirements

This section describes all the requirements of a basic WireCloud installation.
**However, these dependencies are not meant to be installed manually in this
step, as they will be installed throughout the documentation:**

- A Database Manager (MySQL, PostgreSQL, SQLite3...)
- Python 2.7 or python 3.4+. In any case, the following python packages must be
  installed:
    - Django 1.9-1.11
    - lxml 2.3.0+
    - django-appconf 1.0.1+
    - django_compressor 2.0+
    - rdflib 3.2.0+
    - requests 2.1.0+
    - futures 2.1.3+ (only on python 2.7)
    - selenium 3.4+
    - pytz
    - django_relatives 0.3.x
    - user-agents
    - regex
    - markdown
    - haystack 2.4.1+
    - whoosh 2.7.2+
    - pycrypto
    - pyScss 1.3.4+
    - Pygments
    - pillow
    - jsonpatch

All these dependencies are available for Linux, Mac OS and Windows, so WireCloud
should work on any of these operating systems. However, it is better to use
Debian Wheezy+, CentOS 6+, Ubuntu 12.04+ or Mac OS X 10.9+ (only recommended for
development/testing) as these operating systems are actively tested.
Specifically, this installation guide was tested in the following systems:

- Ubuntu 16.04
- Ubuntu 14.04
- Ubuntu 12.04
- CentOS 6
- CentOS 7
- Debian Wheezy
- Debian Jessie
- Mac OS 10.9+

> **NOTE**: WireCloud can make use of the
> [Marketplace](http://catalogue.fiware.org/enablers/marketplace-wmarket),
> the [Store](http://catalogue.fiware.org/enablers/store-wstore) and the
> [Repository](http://catalogue.fiware.org/enablers/repository-repository-ri)
> GEs, but take into account that those GEs has been deprecated in favor of the
> Bussiness API Ecosystem GE.
>
> [http://catalogue.fiware.org](http://catalogue.fiware.org)).


## Installing basic dependencies

Before installing WireCloud, you will need to have some basic dependencies installed: python and [pip](http://www.pip-installer.org/en/latest/installing.html).

> **NOTE**: Although virtualenv is not required, you should install it before installing WireCloud if you intend to use it. It is highly recommended to use virtualenv (see the using [virtualenv section](#using-virtualenv) for more info) when installing WireCloud in CentOS/RedHat as those systems usually raise problems when installing python packages from their official repositories and, at the same time, from pip (a common case in those systems, as some packages should be updated for being compatible with WireCloud, but are requirements of other system applications). Anyway, although harder, it is possible to install WireCloud in those systems without using virtual environments.


### Debian/Ubuntu

This guide assumes you system's package list is up to date. Otherwise, run the following command:

    $ apt-get update

before installing software in Debian/Ubuntu:

    $ apt-get install python python-pip --no-install-recommends

It's recommended to upgrade your pip installation:

    $ pip install -U pip

And make sure you have a updated version of setuptools:

    $ pip install "setuptools>18.5"

It's also recommended to install the following packages:

    $ apt-get install build-essential python-dev libxml2-dev libxslt1-dev zlib1g-dev libpcre3-dev libcurl4-openssl-dev libjpeg-dev

and the following pip packages:

    $ pip install pyOpenSSL ndg-httpsclient pyasn1

### CentOS & Red Hat Enterprise Linux


#### CentOS/RHEL 6

CentOS/RHEL 6 only ships python 2.6, so you have to install python 2.7 from a
different repository. We recommend you to use the Software Collection
respository:

```
# 1. Install a package with repository for your system:
# On CentOS, install package centos-release-scl available in CentOS repository:
$ sudo yum install centos-release-scl

# On RHEL, enable RHSCL repository for you system:
$ sudo yum-config-manager --enable rhel-server-rhscl-7-rpms

# 2. Install the collection:
$ sudo yum install python27

# 3. Start using software collections:
$ scl enable python27 bash
```

After installing python 2.7 from Software Collections, you have to manually
install pip using `easy_install`:

    $ easy_install pip

It's also recommended to install the following packages:

    $ yum install gcc libxslt-devel zlib-devel pcre-devel libcurl-devel libjpeg-devel libffi-devel openssl-devel

and the following pip packages:

    $ pip install pyOpenSSL ndg-httpsclient pyasn1


> **NOTE**: installing python2.7 using SCL automatically installs
> `python27-python-devel`, if you install python using another source, you
> should ensure the equivalent package is also installed.

#### CentOS/RHEL 7

The python package shiped by default by CentOS/RHEL 7 is enough for using
WireCloud, so you can install it directly from their repositories:

    $ yum install python

Whereas pip and other packages should be installed from 3rd party repositories.
The most common one is the EPEL repository (see
http://fedoraproject.org/wiki/EPEL for instructions about how to add it). If you
has such a repository, you will be able to install pip using the following
command:

    $ yum install epel-release
    $ yum install python-pip

It's also recommended to install the following packages:

    $ yum install gcc python-devel libxslt-devel zlib-devel pcre-devel libcurl-devel libjpeg-devel libffi-devel openssl-devel

and the following pip packages:

    $ pip install pyOpenSSL ndg-httpsclient pyasn1

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

- Go to the WireCloud repository on GitHub, switch to the `1.0.x` branch (or select a specific 1.0.x tag, e.g. `1.0.0`) and click on the *Download ZIP* button to download the repository as a zip file, or just click on this [link](https://github.com/Wirecloud/wirecloud/zipball/1.0.x). Unzip it.
- Or use a [GIT](http://git-scm.com/) client to get the latest development version via Git:

        $ git clone https://github.com/Wirecloud/wirecloud.git
        $ cd wirecloud
        $ git checkout 1.0.x

> **NOTE**: The `1.0.x` branch provides the latests stable version for the `1.0`
> version of WireCloud (that is, the version described in this guide). the
> latest development version for the `1.0.x` serie is provided by the
> `1.0.x-dev` branch, while the latest development version of WireCloud is
> available in the `develop` branch.
>
> It's recommended to check if you are reading the latest version of this guide
> (e.g. following this [link][latest_docs]) if you are going to install the
> latest version of WireCloud from the `develop` branch instead of using the
> `1.0.x` branch.

Once downloaded the source code, you can install WireCloud using the `setup.py` script (this step requires root privileges):

    $ cd ${path_to_source_code}/src
    $ python setup.py bdist_wheel
    $ sudo pip install dist/wirecloud-${version}-py2.py3-none-any.whl

Where `${version}` is the version of WireCloud to install.

> **NOTE**: There are extra dependencies for being able to use the `setup.py`
> script: `setuptools` >= 18.5 and `wheel` > 0.24. You can install them using
> pip: `pip install "setuptools>18.5" "wheel>=0.24"`

[latest_docs]: https://wirecloud.readthedocs.org/en/latest/installation_guide/


## Installing WireCloud using Docker

WireCloud can also be deployed using [Docker](https://www.docker.com/), the images can be found on [docker hub](https://hub.docker.com/r/fiware/wirecloud/). This guide doesn't cover WireCloud installation using docker, please refere to the [docker's documentation](https://docs.docker.com/userguide/dockerimages/), as it can be used as any other docker image (e.g. it can also be used with docker-machine); and to the documentation available on docker hub about the WireCloud's image for more info about how to procede in this case. Anyway, once installed, you can make changes in the configuration of your WireCloud container following the steps described in this guide as well as make use of any of the administration procedures described in the [Administration Guide](administration_guide.md) section.

> WireCloud's DockerFiles and image documentation are hosted on the [docker-wirecloud](https://github.com/Wirecloud/docker-wirecloud/) repository.

## Creating a new instance of WireCloud

Once installed WireCloud, you will have access to the `wirecloud-admin` script.
This script is, among other things, used for deploy new instances of WireCloud.
Before creating the instance, we recommend you to create a special user for
managing and running WireCloud. Through the use of this user, WireCloud will be
able to limit the potential effects of a security breach.

For example, you can create such a user using the following commands in
Debian/Ubuntu:

    $ adduser --system --group --shell /bin/bash wirecloud

Remember to use this user for creating new instances, for running the
`manage.py` script and for running the WireCloud instance (e.g. when using
Apache).

New instances of WireCloud can be created using the `wirecloud-admin`'s
`startproject` command. This will create a new directory containing the
`manage.py` script, the configuration files, ... related to the new instance.
Moreover, you can add new python modules into this directory to customise your
instance.

    $ cd /opt
    $ wirecloud-admin startproject wirecloud_instance

> **NOTE**: This guide assumes that the WireCloud instances are created in
> `/opt`, although you can create them in any place on the filesystem. Anyway,
> if you decide to install into `/opt` and you chose to create a user for
> WireCloud, take into account that this user might not have enough permissions
> for writing inside `/opt`.
>
> One option is to create the instance using a user with enough permissions
> (e.g. `root`) and then changing the owner of the instance (e.g.
> `chown wirecloud:wirecloud -R /opt/wirecloud_instance`).

After creating the new instance, you have to configure it choosing a database,
populating it and performing final Django configurations. These steps can be
skipped using the `--quick-start` option. This will configure the instance to
use SQLite3 with a default `admin` user (**password**: `admin`). This method is
very useful for creating a WireCloud instance for testing:

    $ cd /opt
    $ wirecloud-admin startproject wirecloud_instance --quick-start

> **NOTE**: Remember to change the default `admin` credentials as soon as
> possible, especially if the instance is publicly accessible.

If you make use of the `--quick-start` option, you should be able to go directly
to the [Running WireCloud](#running-wirecloud) section.


## Database installation and configuration

To set up the database engine, it is necessary to modify the `DATABASE`
configuration setting in the instance `settings.py` file (e.g.
`/opt/wirecloud_instance/wirecloud_instance/settings.py`). You can use any of
the [database engines supported by Django].

The following examples show you how to configure SQLite and PostgreSQL databases.

[database engines supported by Django]: https://docs.djangoproject.com/en/1.11/ref/settings/#databases


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
             'ENGINE': 'django.db.backends.postgresql',
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

Before running WireCloud, it is necessary to populate the database. This can be
achieved by using this command:

    $ python manage.py migrate

This command is used for migrating the database between different versions of
WireCloud, but when executed the first time, it will serve for creating the
initial database structure. Once create, we have to create a superuser to be
able to login into WireCloud and to be able to perform administrative tasks from
the web interface. Use the `createsuperuser` command for creating such a user.
An example of the command output, where `user`/`password` are `admin`/`admin`,
is the following:


    $ python manage.py createsuperuser
    Username (leave blank to use 'wirecloud'): admin
    Email address: admin@myemaildomain.com
    Password: ***** (admin)
    Password (again): ***** (admin)
    Superuser created successfully.

WireCloud 1.0 added some predefined dashboards, so you have to create them by
running the following command:

```
$ python manage.py populate
```


## Search indexes configuration

Wirecloud uses [Haystack](http://haystacksearch.org/) to handle the search
indexes.

Currently, [Solr][], [ElasticSearch2][] and [Whoosh][] are supported. Whoosh is enabled by
default.

To modify the search engine configuration, it is necessary to modify the
`HAYSTACK_CONNECTIONS` configuration setting in the instance `settings.py` file
(e.g. `/opt/wirecloud_instance/wirecloud_instance/settings.py`).

[Solr]: http://lucene.apache.org/solr/
[ElasticSearch2]: https://www.elastic.co/products/elasticsearch
[Whoosh]: https://whoosh.readthedocs.io/en/latest/

### Whoosh configuration

[Whoosh][] is a fast, featureful full-text indexing and searching library
implemented in pure Python. It is very easy to configure and does not require to
configure any service, so it is ideal for basic installations. This make this
engine the default engine for using WireCloud, altough probably ElasticSearch2
or Solr are better choices if you require to provide an high availablility
installation of WireCloud.

This is the default configuration:

```python
HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'wirecloud.commons.haystack_backends.whoosh_backend.WhooshEngine',
        'PATH': path.join(BASEDIR, 'index'),
    },
}
```

You can add the `HAYSTACK_CONNECTIONS` setting in the `settings.py` file to
change the `PATH` where Whoosh indices will be stored.


### ElasticSearch2 configuration

[ElasticSearch][] support is not installed by default, so the first thing is to
install the python module required to connect to ElasticSearch:

```
$ pip install elasticsearch==2.4.1
```

Next step is to configure haystack to use ElasticSearch:

```python
HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'wirecloud.commons.haystack_backends.elasticsearch2_backend.Elasticsearch2SearchEngine',
        'URL': 'http://127.0.0.1:9200/',
        'INDEX_NAME': 'wirecloud',
    },
}
```

Where `URL` is the URL of the ElasticSearch2 server.


### Solr cofiguration

Solr support is not installed by default, so the first thing is to install the python library required to connect to Solr:

```
$ pip install pysolr
```

Once installed `pysolr`, you have to change the Haystack configuration:

```python
HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'wirecloud.commons.haystack_backends.solr_backend.SolrEngine',
        'URL': 'http://127.0.0.1:8983/solr/wirecloud_core',
        'ADMIN_URL': 'http://127.0.0.1:8983/solr/admin/cores',
    },
}
```

Where the `URL` setting should point to the Solr core URL.

Haystack provides a command for generating the solr schema (needed to create the
solr core), but requires you to configure haystack to use the rSsolr engine before
running that command. You can provide and invalid URL (e.g. an empty string:
`''`) and change this configuration once you have created the core in the
Solr server.

The Solr core can be created by running the following commannd: `bin/solr create -c wirecloud_core -n basic_config` on the Solr installation, where `wirecloud_core` is the core name. Then you have to execute the `python manage.py build_solr_schema` command jointly with the `--configure-directory` option on the WireCloud installation. Ideally, you should use the `--configure-directory` to point into the configuration folder (e.g. to `${SOLR_ROOT}/server/solr/wirecloud_core/conf`) of the Solr core, so it gets configured automatically. But if this is not possible (because the folder is in a remote server), you should point it into a temporal folder and copy the generated files (`schema.xml` and `solrconfig.xml`) to the final destination. You should also ensure the configuration folder does not contain a `managed-schema.xml` file, as this file is created by default and conflicts with the configuration created by Haystack.


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


### FIWARE_PORTALS
> (TUPLE, DEFAULT: `()`[Empty tuple])

List of associated portals. This setting is used for signing out from other
portals at the same time the user sign out from Wirecloud, providing a single
sign out experience. This setting is also used for building the navigation bar
when using the `wirecloud.fiwarelabtheme` and `wirecloud.fiwarelabdarktheme`
themes.

As example, this is the configuration used in FIWARE Lab:

```python
FIWARE_PORTALS = (
    {
        "name": "Cloud",
        "url": "https://cloud.lab.fiware.org",
        "logout_path": "/logout"
    },
    {
        "name": "Store",
        "url": "https://store.lab.fiware.org",
        "logout_path": "/logout"
    },
    {
        "name": "Mashup",
        "url": "https://mashup.lab.fiware.org",
        "logout_path": "/logout"
    },
    {
        "name": "Data",
        "url": "https://data.lab.fiware.org",
        "logout_path": "/user/logout"
    },
    {
        "name": "Account",
        "url": "https://account.lab.fiware.org",
        "logout_path": "/auth/logout/"
    },
    {
        "name": "Help&info",
        "url": "http://help.lab.fiware.org"
    },
)
```

If you want to add a portal into this list, but not in the navigation bar, you
only have to use the display attribute:

```python
FIWARE_IDM_SERVER = "https://account.mydomain.com"
FIWARE_PORTALS = (
    {
        "name": "Mashup",
        "url": "https://mashup.mydomain.com",
        "logout_path": "/logout"
    },
    {
        "name": "Account",
        "url": FIWARE_IDM_SERVER,
        "logout_path": "/auth/logout/",
        "display": False
    },
)
```

### FORCE_DOMAIN
> (String, default: `None`)

Set `FORCE_DOMAIN` using an string if you want to force WireCloud to use a
concrete domain name (without including the port) when building internal URLs.
If this setting is `None` (the default), WireCloud will try to use the [Django's
sites framework](https://docs.djangoproject.com/en/1.11/ref/contrib/sites/) for
obtaining the domain info. If the sites framework is not used, the domain is
extracted from the request.

**Example Usage**:

```python
FORCE_DOMAIN = "mashup.lab.fiware.org"
```

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


### LOGGING
> (Dictionary; default: A logging configuration dictionary)

A data structure containing configuration information. The contents of this data
structure will be passed as the argument to the configuration method described
in [LOGGING_CONFIG].

Among other things, the default logging configuration passes HTTP 500 server
errors to an email log handler when `DEBUG` is `False`.

You can see the default logging configuration by looking in
wirecloud/commons/utils/conf.py (or view the [online
source](https://github.com/Wirecloud/wirecloud/blob/1.2.x/src/wirecloud/commons/utils/conf.py)).

[LOGGING_CONFIG]: https://docs.djangoproject.com/es/1.11/ref/settings/#logging-config


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

You should use this setting as replacement of the Django's MIDDLEWARE_CLASSES setting (See [Django's middleware documentation](https://docs.djangoproject.com/en/1.11/topics/http/middleware/))

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

> **NOTE**: Don't forget to rerun the collectstatic command each time the
> WireCloud code is updated, this include each time a WireCloud plugin or Django
> app is enabled/disabled and when the default theme is changed.


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

Don't forget to run the collectstatic commands on your WireCloud installation:

    $ ./manage.py collectstatic


### NGSI proxy

WireCloud comes with a JavaScript library that allows widgets and operators to
connect to NGSI-9/10 servers. This support works out of the box when installing
WireCloud except for receiving notification directly to widgets and operators.
To enable it WireCloud requires what is called [NGSI proxy], this proxy is a
facade that receives NGSI notifications and passes them to Widgets or Operators.

This NGSI proxy doesn't need to be installed in the same machine as WireCloud
and can be shared with other WireCloud instances. Follow this [link][NGSI proxy]
for more information about how to install and configure such a NGSI proxy.

[NGSI proxy]: https://github.com/conwetlab/ngsi-proxy


### Integration with the IdM GE

The first thing to take into account is that this version of WireCloud is compatible with KeyRock v6 and KeyRock v7. To enable this integration, the first step is creating a new Application using the IdM server that is going to be used (for example: `https://account.lab.fiware.org`). See the [KeyRock's User and Programmers Guide] for more information about how to create such an Application. Redirect URI must be: `http(s)://${wirecloud_server}/complete/fiware/`. Take note of the *Client ID* and the *Client Secret* values (those values are available in the Application details page, inside the *OAuth2 Credentials* section) as they are going to be used later.

On the WireCloud instance:

1. Install the `social-auth-app-django` module (e.g. `pip install "social-auth-app-django"`)
2. Edit `settings.py`:
    - Remove `wirecloud.oauth2provider` from `INSTALLED_APPS`
    - Add `social_django` to `INSTALLED_APPS`
    - Add `wirecloud.fiware.social_auth_backend.FIWAREOAuth2` to `AUTHENTICATION_BACKENDS`. example:

        ```python
        AUTHENTICATION_BACKENDS = (
            'wirecloud.fiware.social_auth_backend.FIWAREOAuth2',
        )
        ```

        > **Note**: Django supports several authentication backends (see this [link](https://docs.djangoproject.com/en/1.11/topics/auth/customizing/#specifying-authentication-backends) for more details). For example, you can continue authenticating users using the local db by also listing `django.contrib.auth.backends.ModelBackend` in `AUTHENTICATION_BACKENDS`, although this will require extra configuration not documented in this guide.

    - Add a `FIWARE_IDM_SERVER` setting pointing to the IdM server to use (e.g. `FIWARE_IDM_SERVER = "https://account.lab.fiware.org"`)
    - Add `SOCIAL_AUTH_FIWARE_KEY` and `SOCIAL_AUTH_FIWARE_SECRET` settings using the *Client ID* and the *Client Secret* values provided by the IdM. You should end having something like this:

        ```python
        SOCIAL_AUTH_FIWARE_KEY = "43"
        SOCIAL_AUTH_FIWARE_SECRET = "a6ded8771f7438ce430dd93067a328fd282c6df8c6c793fc8225e2cf940f746e6b229158b5e3828e2716b915d2c4762a34219e1792b85e4d3cdf66d70d72840b"
        ```

3. Edit `urls.py`:
    - Replace the login endpoint:
        - Add the following import line at the beginning of the file:
          `from wirecloud.fiware import views as wc_fiware`
        - Remove:
          `url(r'^login/?$', django_auth.login, name="login"),`
        - Add:
          `url(r'^login/?$', wc_fiware.login, name="login"),`
    - Add `social-auth-app-django` url endpoints at the end of the pattern list: `url('', include('social_django.urls', namespace='social')),`

4. [Optional]: Change the `THEME_ACTIVE` setting to `wirecloud.fiwarelabtheme`.
   This theme is the one used by the FIWARE Lab's Mashup portal.
5. [Optional]: Provide a [`FIWARE_PORTALS` setting](#fiware_portals). This
   setting is used for signing out from other portals at the same time the user
   sign out from WireCloud, providing a single sign out experience. This setting
   is also used for building the navigation bar.
6. Run `python manage.py migrate; python manage.py collectstatic --noinput`


[KeyRock's User and Programmers Guide]: https://fi-ware-idm.readthedocs.org/en/latest/user_guide/#registering-an-application
[`FIWARE_PORTALS` setting]: #fiware_portals


### Enabling the real-time synchronization support

WireCloud 1.0 adds experimental support for real time synchronization through
web sockets.

The steps for enabling this support are the following:

1. Install [Django channels](https://channels.readthedocs.io/en/latest/):
  ```
  $ pip install channels
  ```
2. Add `channels` and `wirecloud.live` into the `INSTALLED_APPS` setting in the
    `settings.py` file.
3. Configure the channels framework by configuring the `CHANNEL_LAYERS` setting.
    For example, you can make use of the following configuration:

    ```python
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "asgiref.inmemory.ChannelLayer",
            "ROUTING": "wirecloud.live.routing.channel_routing",
        },
    }
    ```

Once done those steps, you will be able to use WireCloud using the runserver
command. Take into account that is not possible to deploy WireCloud when using
the real-time synchronization support using the standar Apache configuration.
We are working on providing better documentation and examples on how to deploy
WireCloud in this case for a production ready environment, in the meantime, you
can take a look into the [Django channels
documentation](https://channels.readthedocs.io/en/latest/deploying.html).

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

> **NOTE**: Be aware that this way of running WireCloud should be used for evaluation/testing purposes. Do not use it in a production environment.

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

Assuming that your WireCloud instance is available at `/opt/wirecloud_instance`
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

Assuming that your WireCloud instance is available at `/opt/wirecloud_instance`
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

### I'm getting strange errors (e.g. Internal Server Errors). Is there any way to get better info about the problem?

The best option without compromising the security of your server is to provide
the adecuate values for the [`ADMINS`](#admins),
[`SERVER_EMAIL`](#server_email), [`LOGGING`](#logging), ... settings. This way
you will receive a detailed email for each error detected in WireCloud.

If you don't receive those emails or if you are just creating the instance, you
can set the [`DEBUG` setting](#debug) to `True`, making WireCloud provide a more
verbose and detailed web page when an error occurs.

> **NOTE**: Remember to restore the `DEBUG` setting to its previous value:
> `False`.


### pip has problems installing lxml. What I have to do?

See http://lxml.de/installation.html#installation for more detailed info.

For instance, in Debian and Ubuntu you probably have to install the `python-dev`, `libxml2-dev` and `libxslt1-dev` packages:

    $ sudo apt-get install python-dev libxml2-dev libxslt1-dev

In Mac OS, remember to install XCode and its Command Line Tools. If this doesn't work and you use're using the [Homebrew](http://brew.sh/) tools for Mac, you can try the following commands:

    $ brew install libxml2
    $ pip install lxml


### I don't want to receive Django's invalid HTTP_HOST mails

Django will send mails for any raised `SuspiciousOperation` exception by
default. You can disable those mails by adding the following snipet into your
`settings.py` file:

```python
LOGGING['loggers']['django.security.DisallowedHost'] = {
    'handlers': ['null'],
    'propagate': False,
}
```

This method can be used also for disabling other `SuspiciousOperation` error mails.
See the [Django documentation](https://docs.djangoproject.com/es/1.9/topics/logging/#django-security)
for more info.

### I don't remember the admin credentials. How can I recover it?

You have two options:

- change the password of your admin user: see `python manage.py help changepassword`
- create a new admin user: see `python manage.py help createsuperuser`


### I get errors while running the `manage.py` script or when running the `startproject` command

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

The Sanity Check Procedures are the steps that a System Administrator will take
to verify that an installation is ready to be tested. This is therefore a
preliminary set of tests to ensure that obvious or basic malfunctioning is fixed
before proceeding to unit tests, integration tests and user validation.

### End to End testing

Please note that the following information is required before carrying out this
procedure:

- computer_name_or_IP_address is the name or IP address of the computer on which
  WireCloud has been installed.
- Valid credentials for the WireCloud instance to test (e.g. user: `admin` /
  password: `admin`, as stated in the [Database population](#database-population)
  section of this guide).

The following file:

- [CoNWeT_weather-mashup-example_1.0.2.wgt](attachments/CoNWeT_weather-mashup-example_1.0.2.wgt)

To quickly check if the application is running, follow these steps:

1. Open a browser and type `http://${computer_name_or_IP_address}/login` in the address bar.
2. The following user login form should appear:

    <img src="../images/installation_guide/login.png" srcset="../images/installation_guide/login.png 2x" alt="Login form">

3. Enter the credentials and click on the *Log in* button.
4. Click on the *My Resources* button:

    <img src="../images/installation_guide/my_resources_button.png" srcset="../images/installation_guide/my_resources_button.png 2x" alt="Click *My Resources*">

5. Click on the *Upload* button:

    <img src="../images/installation_guide/upload_button.png" srcset="../images/installation_guide/upload_button.png 2x" alt="Click *Upload*">

6. Add the `CoNWeT_weather-mashup-example_1.0.2.wgt` file to the upload form and click *Upload*.
7. You should see two widgets (*Web Map Service* and *Weather Widget Example*) and one mashup (*Weather Mashup Example*) components:

    <img src="../images/installation_guide/used_resources.png" srcset="../images/installation_guide/used_resources.png 2x" alt="Click *Upload*">

8. Go back to the editor view:

    <img src="../images/installation_guide/back_button.png" srcset="../images/installation_guide/back_button.png 2x" alt="Click *Back*">

9. Click on the *New workspace* option:

    <img src="../images/installation_guide/new_workspace_entry.png" srcset="../images/installation_guide/new_workspace_entry.png 2x" alt="Click *New workspace*">

10. And use the *Weather Mashup Example* as template:

    <img src="../images/installation_guide/new_workspace_dialog.png" srcset="../images/installation_guide/new_workspace_dialog.png 2x" alt="Create a new workspace using the *Weather Mashup Example* template">

11. The view should automatically change to the *Weather Example Mashup* workspace and widgets should appear in it:

    <img src="../images/installation_guide/weather_dashboard.png" srcset="../images/installation_guide/weather_dashboard.png 2x" alt="Final weather dashboard">

12. Select the pin tool in the *Web Map Service* widget clicking the appropriated button as shown in the image.
13. And click the desired location. The *Weather Widget Example* should update the forecast info:

    <img src="../images/installation_guide/example_usage.png" srcset="../images/installation_guide/example_usage.png 2x" alt="Example usage">

By performing this sequence of steps, you will check that the WireCloud Mashup
platform is running and correctly deployed, and its database has been properly
set up and populated.

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
