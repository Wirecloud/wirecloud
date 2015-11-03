This section describe how to create new themes for WireCloud.

## Basic themes

If you do not require a full customised theme, you can create a new theme by
changing some of the values (colours, default sizes, etc.) used by another
theme.

> **NOTE:** Currently you can only customise in this way the default theme,
> although support for parameterizing other themes is work in progress. For now
> you can copy the theme folder and make the changes as described in this
> section.

For doing that you have to create a new folder with the following structure:

```
mytheme
+-- __init__.py
+-- static
    +-- css
        +-- _variables.scss
```

The `__init__.py` file is required by the plugin architecture used by WireCloud
and should be an empty file (although you know what you do :-). See the next
section for more details). The `_variables.scss` file is the one that is going
to allow us to change the values used by the theme.

For example, you can use this example `_variables.scss` file for changing the
primary color and use plain buttons:

```SCSS
$brand-primary: rgb(107, 21, 161);
$button-gradients: false;

@import 'defaults';
```

The `_variables.scss` uses the [SCSS (Sassy CSS) syntax] for defining the base
constants to be used by the theme. This file must always import the
`_defaults.scss` file (using the `@import 'defaults'` line).

[SCSS (Sassy CSS) syntax]: http://sass-lang.com/guide


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
    +-- wirecloud
```

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
  [Django's admin app]).

    - `wirecloud`: This folder contains the templates used directly by
      WireCloud.

> **Note**: Take into account that the SCSS syntax is compatible with the
> standard CSS syntax. You do not have to use the SCSS features if you do not
> want to do it (except for the `_variables.scss` file).

When developing a WireCloud theme you have to take into account two things:

- You can add any file you want into the `static` folder, but WireCloud will use
  a predefined list of SCSS files. If you add a SCSS file not used by WireCloud
  it just will not be used. The same applies to templates, the list of the used
  templates is defined by WireCloud and the third party applications used by it.
- You do not have to write a complete version of every SCSS and template files
  used by WireCloud. If the corresponding file does not exits, the default
  version of the file will be used (taken from `wirecloud.defaulttheme`).

The list of the used SCSS files and django templates is provided in the next
sections.


[Compass]: http://compass-style.org/help/tutorials/integration/
[Django's admin app]: https://docs.djangoproject.com/en/1.8/ref/contrib/admin/#admin-overriding-templates
[Django's staticfiles app]: https://docs.djangoproject.com/en/1.6/ref/contrib/staticfiles/


### Available templates

- `workspace/iwidget.html`: HTML structure for the boxes where the widget
  iframes are inserted on the workspaces.
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
  plain buttons.
