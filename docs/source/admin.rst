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

Deployment notes
----------------

If DEBUG is False you will need to collect your static files first:

python manage.py collectstatic

And if you use runserver (not recommended for production) you will have to
call it with the --insecure switch in order to make it serve the static files
when not debugging.

Any way, you should serve the static files with a fast performance http server
like Nginx or Apache.
