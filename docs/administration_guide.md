## Administration commands

WireCloud provides a set of command line tools that can be used from the command
line (manually or by scripts) on the folder of the WireCloud instance.

### addtocatalogue

Adds one or more packaged mashable application components into the catalogue. At
least one of the following flags:

- **redeploy**
  Replace mashable application components files with the new ones.
- **users**=USERS
  Comma separated list of users that will obtain access to the uploaded mashable
  application components
- **groups**=GROUPS
  Comma separated list of groups that will obtain access rights to the uploaded
  mashable application components
- **public**
  Allow any user to access the mashable application components.

Example usage:

	$ python manage.py addtocatalogue --users=admin,ringo file1.wgt file2.wgt


### changepassword

Allows changing a user’s password. It prompts you to enter twice the password of the user given as parameter. If they both match, the new password will be changed immediately. If you do not supply a user, the command will attempt to change the password whose username matches the current user.

Example usage:

	$ python manage.py changepassword ringo


### createorganization

Creates an empty organization. Once created, you will be able to add users to
the associated group.

Example usage:

	$ python manage.py createorganization


### createsuperuser

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


### rebuild_index

Rebuilds Haystack indexes used by the search engine of WireCloud. See Haystack
[documentation][haystack_rebuild_index] for more details.

- **--noinput**
  If provided, no prompts will be issued to the user and the data will be wiped out.

Example usage:

	$ python manage.py rebuild_index

[haystack_rebuild_index]: http://django-haystack.readthedocs.io/en/master/management_commands.html#rebuild-index


### resetsearchindexes (deprecated)

Rebuilds Haystack indexes used by the search engine of WireCloud. To be removed in Wirecloud WireCloud v1.3.

- **--noinput**
  Tells Django to NOT prompt the user for input of any kind.

Example usage:

    $ python manage.py resetsearchindexes


## Creating WireCloud backups and restoring them

1. Create a backup of your instance folder. For example:

        $ tar -cvjf wirecloud-backup.tar.bz2 -C /path/to/your/instance .

2. Create a backup of your database.

There are several ways for creating backups of the data stored in the database
used by WireCloud, each of them with its advantages and disadvantages.

> **NOTE:** Always stop WireCloud before creating a backup for ensuring data
> consistency.

### Database backups using Django

Django provides the `dumpdata` and `loaddata` commands that can be used for
creating and restoring backups. Those commands can be used independently of the
database engine used. Moreover, you can create those backups using a given
database engine and restore them using a different one. Run the following
command for creating a backup of your database using Django:

    $ python manage.py dumpdata > wirecloud.backup

For restoring the backup you only have to run the `loaddata` command, using a
clean database:

    $ python manage.py loaddata wirecloud.backup

> **NOTE**: Backups created using `dumpdata` can only be restored using the same
> WireCloud version used for creating the backup. If you need to use a different
> version, restore the backup using the original version and then
> upgrade/downgrade it.


### SQLite3 database backups

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

### PostgreSQL database backups

You can find more information about how to create PostgreSQL backups in this
[page](http://www.postgresql.org/docs/9.1/static/backup-dump.html). Basically,
you have to run the following command:

    $ pg_dump <dbname> > wirecloud.backup

> Make sure WireCloud is not running before making the backup

You can restore the backup using the following command:

    $ psql <dbname> < wirecloud.backup


## Upgrading from previous versions

1. Install the new version of WireCloud
2. Migrate the database and populate it with any new base component, rebuild the
   search indexes and collect the new static files by running the following
   commands:

        $ python manage.py migrate
        $ python manage.py populate
        $ python manage.py rebuild_index
        $ python manage.py collectstatic --noinput

    > **NOTE**: Remember to run those commands using the user serving wirecloud
    > (e.g. `su wirecloud`)

3. Reload WireCloud (e.g. `$ service apache2 graceful`)

You can determine your currently installed version using
`wirecloud-admin --version`:

```
$ wirecloud-admin --version
1.0.0

```

> **NOTE:** It is strongly recommended to perform a full database backup before
> starting to migrate WireCloud to a new version.


## From 1.1.x to 1.2.x

WireCloud 1.2 has moved from directly use Whoosh for using search indexes to use
Haystack for managing search indexes. Although Haystack has support for using
Whoosh as search index backend, the schema used for the search indexes are
different. You have to incorporate Haystack configuration into your
`settings.py` file and rebuild them by running the `rebuild_index` command.


## From 1.0.x to 1.1.x

NGSI bindings (ngsijs) have been updated to `v1.0.2`. This allows WireCloud to
directly use CORS requests when connecting to a `ngsi-proxy`. The downside is
that WireCloud is unable to detect the version of ngsi-proxy used, so we had to
drop support for `ngsi-proxy` version `v1.0.0` and below.

WireCloud 1.1 has changed the schema of the workspace search index, you have to
update this index by running the `resetsearchindexes` command. Also, there are
new predefined dashboards, so you have to the `populate` command.

IdM integration has migrated from `python-social-auth` to
`social-auth-app-django` (see this [link][MIGRATING_TO_SOCIAL] for more info
about this change)

[MIGRATING_TO_SOCIAL]: https://github.com/omab/python-social-auth/blob/master/MIGRATING_TO_SOCIAL.md


## From 0.9.x to 1.0.x

> **NOTE**: Support for Django 1.6 and Django 1.7 were removed in this version.
> Please, follow the steps described in the [Upgrading to Django
> 1.7+](#upgrading-to-django-17) section before upgrading to WireCloud 1.0.
>
> You can determine your currently installed version of Django by running the
> following command:
>
> ```
> $ django-admin --version
> 1.9.9
> ```

WireCloud 1.0 has changed some url definitions to remove some django warnings,
so you should update your `urls.py` file. In particular, you have to change the
following lines:

```python
...

    # Catalogue
    url(r'^catalogue', include('wirecloud.catalogue.urls')),

    # Proxy
    url(r'^cdp', include('wirecloud.proxy.urls')),

...
```

To:

```python
...

    # Catalogue
    url(r'^catalogue/', include('wirecloud.catalogue.urls')),

    # Proxy
    url(r'^cdp/', include('wirecloud.proxy.urls')),

...

```

> **NOTE**: If you plan to upgrade to Django 1.10, take into account that
> there were some deprecations regarding the syntax of the `url.py` file. We
> have updated the `urls.py` template in WireCloud 1.0 to support Django
> 1.8-1.10 but if you created your WireCloud instance using an older version,
> you will have to update it manually. You can find the current template at
> [github](https://github.com/Wirecloud/wirecloud/blob/develop/src/wirecloud/commons/conf/platform_project_template/project_name/urls.py)

WireCloud 1.0 has also added a search index for workspaces, you have to
initialize it by running the `resetsearchindexes` command. The db should be
migrated before running this command.

```
$ python manage.py migrate
$ python manage.py resetsearchindexes
```

WireCloud 1.0 added some predefined dashboards, so you have to create them by
running the following command:

```
$ python manage.py populate
```

Also, WireCloud 1.0 provides support for real-time synchronization using web
sockets, see the [Enabling the real-time synchronization
support](installation_guide#enabling-the-real-time-synchronization-support)
section for instructions on how to enable it.


## From 0.8.x to 0.9.x

### IdM integration changes

- `FIWARE_PORTALS` has been change to be empty by default. You can add the
  following code into your `settings.py` file for obtaining the previous
  behaviour:

    ```python
    from wirecloud.fiware import FIWARE_LAB_PORTALS
    FIWARE_PORTALS = FIWARE_LAB_PORTALS
    ```

  See the [`FIWARE_PORTALS` documentation](installation_guide#fiware_portals) for more info.

### Upgrading to Django 1.7+

Wirecloud 0.9.0+ adds support for Django 1.7-1.9 and next version of WireCloud
(1.0) will drop support for Django 1.6 and Django 1.7. Moreover, at the time of
releasing WireCloud 0.9.0, Django 1.6 and 1.7 were unsupported by the Django
community.

The only thing to take into account when upgrading your WireCloud installation
to use Django 1.7+ is that you need to migrate your db to Wirecloud 0.9.0 using
Django 1.6 and South before upgrading to the new version of Django.

Once migrated the database and installed the new version of Django, run
the following command for initializing the Django db migration framework:

    $ python manage.py migrate --fake-initial


## From 0.7.x to 0.8.x

### Migrate from `django-social-auth` to `python-social-auth`

WireCloud 0.8.x migrated FIWARE IdM code to use `python-social-auth` instead of
using `django-social-auth` due to the later being deprecated. Please, follow
these instructions if you are using the IdM integration:

1. Install `python-social-auth` (e.g. `pip install python-social-auth`)
2. Edit your `settings.py` making the following changes:
    1. replace `social_auth` with `social.apps.django_app.default` in the
    `INSTALLED_APPS` setting
    2. replace `wirecloud.fiware.social_auth_backend.FiwareBackend` with
    `wirecloud.fiware.social_auth_backend.FIWAREOAuth2` in the
    `AUTHENTICATION_BACKENDS` setting.
    3. rename `FIWARE_APP_ID` to `SOCIAL_AUTH_FIWARE_KEY` and
    `FIWARE_APP_SECRET` to `SOCIAL_AUTH_FIWARE_SECRET`
3. Edit your `urls.py` file and replace:

    ```python
        url(r'', include('social_auth.urls')),
    ```

    with

    ```python
        url('', include('social.apps.django_app.urls', namespace='social'))
    ```

4. Fake `python-social-auth` migrations (it uses the same dabase schema than `django-social-auth`):

    ```
    $ python manage.py migrate default --fake
    ```

5. Now you can remove django-social-auth :). E.g.:

    ```
    $ pip uninstall django-social-auth
    ```

### Migrate the user search index

WireCloud 0.8.2 updated the information stored in the user search index, so you
should run the following command for updating this index:

```
$ python manage.py resetsearchindexes --indexes=user
```

## From 0.6.x to 0.7.x

WireCloud 0.7.x adds support for using Whoosh indexes for searching, as
WireCloud 0.6.x didn't use Whoosh, you need to run an extra step when migrating
from 0.6.x to 0.7.x for creating a initial version of those indexes:

    $ python manage.py resetsearchindexes
