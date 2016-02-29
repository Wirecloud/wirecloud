This section describe how to create new themes for WireCloud.

> This documentation is based in WireCloud 0.9+. Previous versions of WireCloud
> works in a similiar way, but some details may differ.

## Basic themes

If you do not require a full customised theme, you can create a new theme by
changing some of the values (colours, default sizes, etc.) used by another
theme.

For doing that you have to create a new folder with the following structure:

```
mytheme
+-- __init__.py
+-- static
    +-- css
        +-- _variables.scss
```

The `__init__.py` file is required by the plugin architecture used by WireCloud.
It can be an empty file, if you want to use the default settings, but MUST exist.
See the [Theme settings](#theme-settings) section for a full list and
description of the available settings variables.

By default, all the themes will extend from `wirecloud.defaulttheme`, if you
want to extend another theme, e.g. the `wirecloud.fiwarelabtheme` theme, you
will have to add the following content into the `__init__.py` file:

```python
parent = "wirecloud.fiwarelabtheme"
```

The `_variables.scss` file is the one that is going to allow us to change the
values used by the theme.

For example, you can use this `_variables.scss` example file for changing the
primary color used by the primary buttons, the highlighted menu items, ... and
to use plain buttons:

```SCSS
$brand-primary: rgb(107, 21, 161);
/*
This color can also be defined using its hex code or its hsl definition:
$brand-primary: #6B15A1;
$brand-primary: hsl(277, 77%, 36%);
*/
$button-gradients: false;

@import 'defaults';
```

The `_variables.scss` file must be written using the [SCSS (Sassy CSS) syntax]
and is used for defining the base constants to be used by the theme. This file
must always import the `_defaults.scss` file (using the `@import 'defaults'`
line) to load the default values for the other constants.

[SCSS (Sassy CSS) syntax]: http://sass-lang.com/guide


## Using your themes

There are two options for using your themes:

1.  If you don't want to distribute or share it with other WireCloud instances
    you can simply drop the theme folder inside your WireCloud instance folder.
    Then you can configure your WireCloud instance for using your them by
    editing the `settings.py` file and modifying the [`THEME_ACTIVE`
    setting](../../installation_guide/#theme_active).

    For example, if you created the `mytheme` folder, you can move it into the
    folder of your WireCloud instance and use `THEME_ACTIVE = 'mytheme'` in the
    `settings.py` file.

2.  You can package and distribute your theme using the standard tools used in
    python for that purpose, e.g. using [setuptools] for building your packages
    and [[pypi]](the official repository for distributing software for the Python
    programming language) for distributing your theme.

    

    Once installed the theme package into the system, virtual env, ... used by
    the WireCloud instance, you will be able to use it through the `THEME_ACTIVE`
    setting as usual.

    > Take into account that in this case you should provide a good module name
    > for your theme to avoid any clash with other python modules.

[setuptools]: http://pythonhosted.org/setuptools/
[pypi]: https://pypi.python.org/pypi


## Full theme structure and background details

Themes in WireCloud are Django applications as well as python modules (that is
the reason for the `__init__.py` file). The theme folder is splited in several
folders, each of them containing the different resources used by the theme
(templates, images, SCSS files, etc). The folder structure of a WireCloud theme
should be similar to the following one:

```
mytheme
+-- __init__.py
+-- static
|   |   ...
|   +-- css
|   +-- fonts
|   +-- images
+-- templates
    |   ...
    +-- 400.html
    +-- 401.html
    +-- 403.html
    +-- 404.html
    +-- 500.html
    +-- wirecloud
        |   ...
        +-- workspace
        +-- views

```

- `__init__.py`: This file is required as the theme forlder should be also a
  python module. This file is also used for changing the settings of the theme.
- `static`: Contains the static files provided by the theme. This is served using
  the [Django's staticfiles app]. Usually, this folder is composed of the
  following subfolders:

    - `css`: Contains the SCSS files used by the theme. As stated previously,
      WireCloud uses the [SCSS (Sassy CSS) syntax] for the stylesheets. WireCoud
      also include [Compass] v0.12.1 so you can make use of it if needed.
    - `fonts`: Fonts used by the SCSS files
    - `images`: Images used by the SCSS files or directly from the Django
      templates

- `templates`: This folder contains the Django templates used by the theme.
  Take into account that using this folder, themes can also override templates
  provided by the third party Django apps used by WireCloud (e.g. the
  [Django's admin app]). There are also other generic templates that can be
  overrided using this folder (e.g. `404.html`, `500.html`, ...)

    - `wirecloud`: This folder contains the templates used directly by
        WireCloud. In general those templates are snippets for each of the
        components/pieces used inside WireCloud. For example, the
        `wirecloud/workspace/iwidget.html` template is used for creating the
        HTML of the widgets as shown in the workspace area.

        The exception are the templates provided in the `views` folder that
        pretends to provide the templates for the master HTML documents used by
        WireCloud.


> **Note**: Take into account that the SCSS syntax is compatible with the
> standard CSS syntax. You do not have to use the SCSS features if you do not
> want to do it (except for the `_variables.scss` file).

When developing a WireCloud theme you have to take into account two things:

-   You can add any file you want into the `static` folder, but WireCloud will
    use a predefined list of SCSS files. If you add a SCSS file not used by
    WireCloud it just will be ignored by default. If you want to add a SCSS file
    to the ones used by WireCloud you will have to modify the Django template
    for the master HTML pages.

    Something similar applies to the Django templates: the list of the used
    templates is defined by WireCloud, by the third party applications used by
    it and by the enabled WireCloud plugins.

-   You do not have to write a complete version of every SCSS and template files
    used by WireCloud. If the corresponding file does not exits, the default
    version of the file will be used (taken from `wirecloud.defaulttheme`).

The list of the used SCSS files and django templates is provided in the next
sections.


[Compass]: http://compass-style.org/help/tutorials/integration/
[Django's admin app]: https://docs.djangoproject.com/en/1.8/ref/contrib/admin/#admin-overriding-templates
[Django's staticfiles app]: https://docs.djangoproject.com/en/1.6/ref/contrib/staticfiles/


### Theme settings

- `parent` (***New in WireCloud 0.9.0***): Name of the theme to extend. Themes
  will extend `wirecloud.defaulttheme` by default if you don't provide a value
  for this setting. Use `parent = None` for creating new root themes.


### Available templates

- `workspace/iwidget.html`: HTML structure for the boxes where the widget
  iframes are inserted on the workspaces.
- `ui/window_menu.html`: HTML structure for the dialogs/modals displayed in
  WireCloud.
- `views/embedded.html`: HTML structure for the embedded version of WireCloud.


### Available SCSS files

- `_variables.scss`: File defining the values of the constants used in the other
  SCSS files.
- `workspace/dragboard_cursor.scss`: contains the style for the cursor
  displayed when moving widgets inside a workspace.
- `workspace/iwidget.scss`: contains the style for displaying widgets inside the
  dashboard.
- `window_menu.scss`: contains the style for the dialogs used in WireCloud.
- `mac_field.scss`: contains the style for the mashable application component
  input fields.


## Default theme: `wirecloud.defaulttheme`

### Used images

- `favicon.ico`: Image in `image/x-icon` format to use as favicon. Remember to
  provide a multi-resolution image for better results. *This file is used only
  when the theme is configured as the main theme.*
- `logos/header.png`: Image in `image/png` used in the header. *This file is
  used only when the theme is configured as the main theme.*

### Available SCSS constants

Base colours:

- `$brand-default`: Colour used by default when WireCloud does not need to
  associate a concrete status to an element
- `$brand-primary`: Colour used as base for primary actions
- `$brand-success`: Colour used for denoting success
- `$brand-info`: Colour used for informative elements
- `$brand-warning`: Colour used for warning elements and alerting the user it
  might need attention
- `$brand-danger`: Colour used for alerting the user that something danger or
  potentially negative may happen


Misc constants:

- `button-gradients`: `true` for styling buttons using gradients, `false` for
  plain colour buttons. `true` by default.
- `high-resoulution-images`: `true` if the theme is going to use high-resolution
  images (e.g. for the header logo). In that case the theme should provide
  images files using a 2x resolution (e.g. 800x600 for an image of 400x300
  pixels). `false` for using standard resolution images. `true` by default.
