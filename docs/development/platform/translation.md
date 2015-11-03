First of all, you need to download WireCloud's source code from the github
repository:

    $ git clone https://github.com/Wirecloud/wirecloud.git

Once you have the source code to translate, next step is creating or updating
the catalogue of messages to translate, this can be accomplished with the
following commands:

    $ cd ${wirecloud_repo_path}/src
    $ cd ${module}
    $ django-admin.py makemessages -l ${locale}
    $ django-admin.py makemessages -l ${locale} -d djangojs

Where:

- `${wirecloud_repo_path}` is the path where the working copy of the WireCloud's
  git repository has been downloaded.

- `${module}` is the django module to translate. Currently, WireCloud has
  translations catalogues in the following modules:

    - `wirecloud/commons`
    - `wirecloud/catalogue`
    - `wirecloud/platform`

- `${locale}` is the locale of the messages files that are going to be
  created/updated. e.g. `es_MX`  for Mexican Spanish, `de` for German, ...

After running these command, you will be able to edit the `django.po` and
`djangojs.po` files located at
`${wirecloud_repo_path}/${module}/locale/${locale}/LC_MESSAGES/`. Those files
can be edited manually or any generic PO file editor.

Once you feel comfortable with your translated message catalogue, you can
compile it for testing purporses by running the following code (for each
module):

    $ cd ${wirecloud_repo_path}/src
    $ cd ${module}
    $ django-admin.py compilemessages

After compiling messages, you can test it by running WireCloud. As we're
developing, the recommended way is by executing the runserver command:

    $ python manage.py runserver --insecure

You have several choices for contributing your translations. First, if you feel
comfortable sending github pull request, this is the preffered way, followed by
sending directly the patches/commits by email (wirecloud at conwet dot com).
Another option is sending the full po files by email.
