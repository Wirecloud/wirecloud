Administrator Manual
====================

Dependencies
------------

South, lxml, django_compressor (BeautifulSoup)


Deployment notes
----------------

If DEBUG is False you will need to collect your static files first:

python manage.py collectstatic

And if you use runserver (not recommended for production) you will have to
call it with the --insecure switch in order to make it serve the static files
when not debugging.

Any way, you should serve the static files with a fast performance http server
like Nginx or Apache.
