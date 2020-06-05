## Administration tools

WireCloud provides some extra features on the user interface when signed in as an administrator. This section
describes where and how to use those extra features.


### Impersonating other users

WireCloud allows admin users to impersonate other users. This is meant to check WireCloud behaviour when signed in as a
specific user. This feature does not require you to know the credentials of the user to impersonate him, and it's very
useful for debugging problems and helping other users to do some tasks.

This feature can be found on the global menu:

<img src="../images/administration_guide/switchuser/menu.png" srcset="../images/administration_guide/switchuser/menu.png 2x" alt="Menu entry for impersonating other users"/>

Once you're done, you can directly sign out or, alternatively, sign in back as the initial admin user:

<img src="../images/administration_guide/switchuser/signout.png" srcset="../images/administration_guide/switchuser/signout.png 2x" alt="Menu entry for leaving user impersonation"/>


## Administration commands

WireCloud provides a set of command line tools that can be used from the command line (manually or by scripts) on the
folder of the WireCloud instance.

### addtocatalogue

Adds one or more packaged mashable application components into the catalogue. At least one of the following flags:

-   **redeploy** Replace mashable application components files with the new ones.
-   **users**=USERS Comma separated list of users that will obtain access to the uploaded mashable application
    components
-   **groups**=GROUPS Comma separated list of groups that will obtain access rights to the uploaded mashable application
    components
-   **public** Allow any user to access the mashable application components.

Example usage:

```bash
python manage.py addtocatalogue --users=admin,ringo file1.wgt file2.wgt
```

### changepassword

Allows changing a user’s password. It prompts you to enter twice the password of the user given as parameter. If they
both match, the new password will be changed immediately. If you do not supply a user, the command will attempt to
change the password whose username matches the current user.

Example usage:

```bash
python manage.py changepassword ringo
```

### createorganization

Creates an empty organization. Once created, you will be able to add users to the associated group.

Example usage:

```bash
python manage.py createorganization
```

### createsuperuser

Creates a superuser account (a user who has all permissions). This is useful if you need to create an initial superuser
account or if you need to programmatically generate superuser accounts for your site(s).

When run interactively, this command will prompt for a password for the new superuser account. When run
non-interactively, no password will be set, and the superuser account will not be able to log in until a password has
been manually set for it.

-   **--noinput** Tells Django to NOT prompt the user for input of any kind. You must use **--username** with
    **--noinput**, along with an option for any other required field. Superusers created with **--noinput** will not be
    able to sign in until they're given a valid password.
-   **--username** Specifies the login for the superuser.
-   **--email** Specifies the email for the superuser.

The username and email address for the new account can be supplied by using the **--username** and **--email** arguments
on the command line. If either of those is not supplied, `createsuperuser` will prompt for it when running
interactively.

Example usage:

```bash
python manage.py createsuperuser
```

### rebuild_index

Rebuilds Haystack indexes used by the search engine of WireCloud. See Haystack [documentation][haystack_rebuild_index]
for more details.

-   **--noinput** If provided, no prompts will be issued to the user and the data will be wiped out.

Example usage:

```bash
python manage.py rebuild_index
```

[haystack_rebuild_index]: http://django-haystack.readthedocs.io/en/master/management_commands.html#rebuild-index

## Creating WireCloud backups and restoring them

1.  Create a backup of your instance folder. For example:

```bash
tar -cvjf wirecloud-backup.tar.bz2 -C /path/to/your/instance .
```

2.  Create a backup of your database.

There are several ways for creating backups of the data stored in the database used by WireCloud, each of them with its
advantages and disadvantages.

> **NOTE:** Always stop WireCloud before creating a backup for ensuring data consistency.

### Database backups using Django

Django provides the `dumpdata` and `loaddata` commands that can be used for creating and restoring backups. Those
commands can be used independently of the database engine used. Moreover, you can create those backups using a given
database engine and restore them using a different one. Run the following command for creating a backup of your database
using Django:

```bash
python manage.py dumpdata > wirecloud.backup
```

For restoring the backup you only have to run the `loaddata` command, using a clean database:

```bash
python manage.py loaddata wirecloud.backup
```

> **NOTE**: Backups created using `dumpdata` can only be restored using the same WireCloud version used for creating the
> backup. If you need to use a different version, restore the backup using the original version and then
> upgrade/downgrade it.

### SQLite3 database backups

Creating a backup of a SQLite3 database is as easy as creating a copy of the file where the database is stored. The only
thing to take into account is to stop WireCloud before creating the copy to avoid possible inconsistences.

The restoration procedure is as easy as the creation, you only have to make WireCloud use the copied database file by
editing the `settings.py` file or by moving the copied database file to the place expected by WireCloud.

> **NOTE**: Take into account that this means that if you are making a full backup of your WireCloud instance, you don't
> need an extra step for backing up the database, this backup is already performed by backing up the instance directory.

### PostgreSQL database backups

You can find more information about how to create PostgreSQL backups in this
[page](http://www.postgresql.org/docs/9.1/static/backup-dump.html). Basically, you have to run the following command:

```bash
pg_dump <dbname> > wirecloud.backup
```

> Make sure WireCloud is not running before making the backup

You can restore the backup using the following command:

```bash
psql <dbname> < wirecloud.backup
```

## Upgrading from previous versions

1.  Install the new version of WireCloud
2.  Migrate the database and populate it with any new base component, rebuild the search indexes and collect the new
    static files by running the following commands:

```bash
python manage.py migrate
python manage.py populate
python manage.py rebuild_index
python manage.py collectstatic --noinput
```

    > **NOTE**: Remember to run those commands using the user serving wirecloud (e.g. `su wirecloud`)

3.  Reload WireCloud (e.g. `$ service apache2 graceful`)

You can determine your currently installed version using `wirecloud-admin --version`:

```bash
wirecloud-admin --version
1.0.0
```

> **NOTE:** It is strongly recommended to perform a full database backup before starting to migrate WireCloud to a new
> version.

## From 1.2.x to 1.3.x

WireCloud 1.3 has done minor changes to the search index schemas, so you have to update search indexes by running the
`rebuild_index` command. Also, there are new versions of the predefined dashboards and widgets, so you have use to the
`populate` command to update them.


## From 1.1.x to 1.2.x

WireCloud 1.2 has moved from directly use Whoosh for using search indexes to use Haystack for managing search indexes.
Although Haystack has support for using Whoosh as search index backend, the schema used for the search indexes are
different. You have to incorporate Haystack configuration into your `settings.py` file and rebuild them by running the
`rebuild_index` command.

## From 1.0.x to 1.1.x

NGSI bindings (ngsijs) have been updated to `v1.0.2`. This allows WireCloud to directly use CORS requests when
connecting to a `ngsi-proxy`. The downside is that WireCloud is unable to detect the version of ngsi-proxy used, so we
had to drop support for `ngsi-proxy` version `v1.0.0` and below.

WireCloud 1.1 has changed the schema of the workspace search index, you have to update this index by running the
`resetsearchindexes` command. Also, there are new predefined dashboards, so you have use to the `populate` command.

IdM integration has migrated from `python-social-auth` to `social-auth-app-django` (see this [link][migrating_to_social]
for more info about this change)

[migrating_to_social]: https://github.com/omab/python-social-auth/blob/master/MIGRATING_TO_SOCIAL.md
