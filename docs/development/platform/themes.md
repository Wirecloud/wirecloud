This section describe how to create new themes for WireCloud.

> This documentation is based in WireCloud 1.0+. Previous versions of WireCloud
> works in a similiar way, but some details may differ.

## Basic themes

If you do not require a full customised theme, you can create a new one by
changing some of the values (colours, default sizes, etc.) used by another
theme. This means you only have to change the set of SCSS variables used by the
original theme.

However, to do so, you have to previously create a new folder with the following
structure:

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

By default, all themes will extend from `wirecloud.defaulttheme`. Should you
want to extend from another theme, e.g. from the `wirecloud.fiwarelabtheme` one,
add the following content into the `__init__.py` file:

```python
parent = "wirecloud.fiwarelabtheme"
```

The `_variables.scss` file is the one that is going to allow us to change the
values used by the theme. The list of available variables is described
later in the [Available SCSS Variables](#available-scss-variables) section.

For example, you can use this `_variables.scss` example file to change the
primary colour used by the primary buttons, the highlighted menu items, ... and
to use plain buttons.

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
and is used for overwriting the values for the variables used by the theme.
This file must always import the `_defaults.scss` file (using the
`@import 'defaults'` line) to load the default values for the variables.

[SCSS (Sassy CSS) syntax]: http://sass-lang.com/guide


## Using your themes

There are two options for using your themes:

1.  If you don't want to distribute or share it with other WireCloud instances
    you can simply drop the theme folder inside your WireCloud instance folder.
    Then you can configure your WireCloud instance for using your theme by
    editing the `settings.py` file and modifying the [`THEME_ACTIVE`
    setting](../../installation_guide/#theme_active).

    For example, if you created your WireCloud instance at
    `/opt/wirecloud_instance`, the `mytheme` folder should be placed at
    `/opt/wirecloud_instance/mytheme`. Once deployed the theme, you should be
    able to use `THEME_ACTIVE = 'mytheme'` in your `settings.py` file for using
    your custom theme.

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
        `wirecloud/workspace/widget.html` template is used for creating the
        HTML of the widgets as shown in the workspace area.

        The main exception are the templates provided in the `views` folder that
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
[Django's admin app]: https://docs.djangoproject.com/en/1.11/ref/contrib/admin/#admin-overriding-templates
[Django's staticfiles app]: https://docs.djangoproject.com/en/1.6/ref/contrib/staticfiles/


### Theme settings

- `parent` (***New in WireCloud 0.9.0***): Name of the theme to extend. Themes
  will extend `wirecloud.defaulttheme` by default if you don't provide a value
  for this setting. Use `parent = None` for creating new root themes.

- `label` (***New in WireCloud 0.9.0***): Human-readable name for the theme. It
  defaults to the last component of the python module.


## Available templates

- `wirecloud/catalogue/modals/upload.html`: content to be displayed inside the
  upload component modal used in the *My Resources* view.
- `wirecloud/workspace/missing_widget.html`: content to be displayed inside
  missing widgets.
- `wirecloud/workspace/widget.html`: HTML structure for the boxes where the
  widget iframes are inserted on the dashboards.
- `wirecloud/modals/base.html`: HTML structure for the dialogs/modals displayed
  in WireCloud.
- `wirecloud/modals/embed_code.html`: content of the embed code modal.
- `wirecloud/modals/upgrade_downgrade_component.html`: content of the
  upgrade/downgrade component modal used by the workspace view and the wiring
  view.
- `wirecloud/wiring/behaviour_sidebar.html`: HTML structure for the behaviour
  sidebar used in the Wiring Editor view.
- `wirecloud/wiring/component_group.html`: HTML structure used for displaying
  component groups inside the component sidebar used in the Wiring Editor view.
- `wirecloud/wiring/component_sidebar.html`: HTML structure for the component
  sidebar used in the Wiring Editor view.
- `wirecloud/views/embedded.html`: HTML structure for the embedded version of
  WireCloud.


### Template: `wirecloud/catalogue/modals/upload.html`

This template is used for rendering the initial content of the upload modal used
in the *My Resources* view for uploading new components.


**Related SCSS files**:

- `catalogue/modals/upload.scss`


#### Available components

- `uploadfilebutton`: button for opening the browser dialog for selecting files.

**Example usage**:

```html+django
{% load i18n %}{% load wirecloudtags %}
<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml">
    <div class="wc-upload-mac-message">
        <div class="alert alert-info">
            <img class="mac-package" src="{% theme_static "images/catalogue/mac_package.png" %}" />
            <p>{% trans "Do you have a widget, operator or mashup stored in a wgt file? Then you can upload it to the catalogue by means of this dialog." %}</p>
        </div>
        <div class="wc-upload-mac-title">{% trans "Drag files here" %}</div>
        <div class="wc-upload-mac-or">{% trans "- or -" %}</div>
        <div class="wc-upload-mac-button"><t:uploadfilebutton/></div>
    </div>
</s:styledgui>
```

### Template: `wirecloud/workspace/missing_widget.html`

This template allows to configure the content to be displayed inside missing
widgets. This content is rendered inside the `iframe` element so this template
should provide an HTML document.


**Available context**:

This is the list of context variables provided to the Django template engine:

- `style`: List of stylesheet files needed for applying the default style.


**Example usage**:

```html+django
{% load i18n %}<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="width=device-width, user-scalable=no" />
        {% for file in style %}<link rel="stylesheet" type="text/css" href="{{ file }}" />
        {% endfor %}
    </head>

    <body style="padding: 10px;">
        <div class="alert alert-danger alert-block">
            <h4>{% trans "Missing widget" %}</h4>
            {% trans "This widget is currently not available. Probably you or an administrator uninstalled it." %}
            {% blocktrans %}<h5>Suggestions:</h5>
            <ul>
                <li>Remove this widget from the dashboard</li>
                <li>Reinstall the appropiated version of the widget</li>
                <li>Install another version of the widget and use the <em>Upgrade/Downgrade</em> option</li>
            </ul>{% endblocktrans %}
        </div>
    </body>
</html>
```

### Template: `wirecloud/workspace/widget.html`

> Previously known as: `wirecloud/ui/iwidget.html`


**Related SCSS files**:

- `wirecloud/workspace/widget.scss`

**Available components**:

- `title`: injects a `spam` element with the title of the widget.
- `errorbutton`: button that will be enabled if the widget has errors. This
  button will open the log manager window if clicked by the user.
- `minimizebutton`: button used for maximizing and minimizing widgets.
- `menubutton`: button used for opening the preferences menu.
- `closebutton`: button used for removing the widget from the workspace.
- `iframe` (required): iframe with the content of the widget.
- `leftresizehandle`: `div` element using for resizing the widget from the
  bottom-left square. This element will use the `wc-bottom-left-resize-handle`
  class.
- `bottomresizehandle`: `div` element using for resizing the widget from the
  bottom side. This element will use the `wc-bottom-resize-handle` class.
- `rightresizehandle`: `div` element using for resizing the widget from the
  bottom-right square. This element will use the `wc-bottom-right-resize-handle`
  class.

**Example usage**:

```html+django
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div class="fade panel panel-default">
    <div class="panel-heading"><h4 class="panel-title"><t:title/></h4><div class="wc-iwidget-infobuttons"><t:errorbutton/></div><div class="wc-iwidget-buttons"><t:minimizebutton/><t:menubutton/><t:closebutton/></div></div>
    <div class="panel-body">
        <t:iframe/>
    </div>
    <div class="panel-footer"><t:leftresizehandle/><t:bottomresizehandle/><t:rightresizehandle/></div>
</div>

</s:styledgui>
```

### Template: `wirecloud/modals/base.html`

> Previously known as: `wirecloud/ui/window_menu.html`

**Related SCSS files**:

- `modals/base.scss`: Stylesheet with the custom style for this template.

**Available components**:

- `closebutton`: button for closing the modal.
- `title`: `span` element with the name of the modal.
- `body`: `div` where the body of the modal will be attached to.
- `footer`: `div` used for adding the main buttons.

**Example usage**:

```html+django
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div>
    <div class="window_top"><t:closebutton/><t:title/></div>
    <t:body class="window_content"/>
    <t:footer class="window_bottom"/>
</div>

</s:styledgui>
```

### Template: `wirecloud/modals/embed_code.html`

> Previously known as: `wirecloud/ui/embed_code_dialog.html`

**Related SCSS files**:

- `modals/embed_code.scss`: Stylesheet with the custom style for this template.

**Available components**:

- `themeselect`: provides a `select` element that the user can use for
  controlling the theme used by the code provided for embedding the dashboard.
- `code`: provides a `textarea` element with the embedding code.

**Example usage**:

```html+django
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div><b>{% trans "Theme" %}</b>: <t:themeselect/></div>
<t:code/>

</s:styledgui>
```


### Template: `wirecloud/modals/upgrade_downgrade_component.html`

> Previously known as: `wirecloud/ui/embed_code_dialog.html`


**Related SCSS files**:

- `base/markdown.scss`: Used for styling changelogs.
- `modals/upgrade_downgrade_component.scss`: Stylesheet with the custom style
  for this template.


**Available components**:

- `currentversion`: provides a text node with the current version of the
  widget/operator.
- `versionselect`: provides a select combo with the available version
  alternatives.
- `changelog`: provides a `div` element with the changelog between the current
  version and the selected version. The content of this element will change each
  time the user changes the selected version.


**Example usage**:

```html+django
{% load i18n %}
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div class="wc-upgrade-component-info"><div><b>{% trans "Current version" %}</b>: <t:currentversion/></div><div><b>{% trans "New version" %}</b>: <t:versionselect/></div></div>
<h3>{% trans "Change Log" %}</h3>
<t:changelog/>

</s:styledgui>
```


### Template: `wirecloud/wiring/behaviour_sidebar.html`


**Related SCSS files**:

- `wiring/behviours.scss`: Stylesheet with the wiring's behaviours style.


**Available components**:

- `enablebutton`: provides a toggle button used for enabling and disabling the
  behaviour engine for the current workspace.
- `createbutton`: provides a button for creating new behaviours.
- `orderbutton`: provides a toggle button for enabling and disabling the
  behaviour ordering mode.
- `behaviourlist`: provides a `div` element with the available behaviours. This
  `div` element is also used for displaying an alert message with some tips if
  the behaviour engine is currently disabled.


**Example usage**:

```html+django
{% load i18n %}
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div class="panel panel-default se-vertical-layout we-panel-behaviours">
    <div class="panel-heading se-vl-north-container">
        <div class="panel-title">
            <strong>{% trans "Behaviours" %}</strong>
            <div class="panel-options"><t:enablebutton/></div>
        </div>
        <div class="btn-group pull-right"><t:createbutton/><t:orderbutton/></div>
    </div>
    <t:behaviourlist class="panel-body se-vl-center-container"/>
</div>

</s:styledgui>
```


### Template: `wirecloud/wiring/component_group.html`


**Related SCSS files**:

- `wiring/components.scss`: Stylesheet with the style used for displaying
  components in the wiring editor view.


**Available components**:

- `createbutton`: Provides a button for creating new instances of the
  component.
- `description`: Provides a `div` element with the description of the
  component.
- `image`: Provides an `img` element with the component thumbnail.
- `title`:  Provides a `span` element with the title of the component.
- `vendor`: Provides a text node with the vendor name of the component.
- `versionselect`: Provides a select component for switching between the
  different available versions of the component.


**Example usage**:

```html+django
{% load i18n %}
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<div class="we-component-group">
    <div class="panel panel-default we-component-meta">
        <div class="panel-heading">
            <div class="panel-title"><t:title/></div>
        </div>
        <div class="panel-body">
            <div class="se-thumbnail se-thumbnail-sm"><t:image/></div>
            <div class="se-input-group se-input-group-sm"><t:versionselect/><t:createbutton/></div>
            <h5><t:vendor/></h5>
            <t:description/>
        </div>
    </div>
</div>

</s:styledgui>
```

### Template: `wirecloud/wiring/component_sidebar.html`


**Related SCSS files**:

- `wiring/components.scss`: Stylesheet with the style used for displaying
  components in the wiring editor view.


**Available components**:

- `searchinput`: provides an `input` element to be used by users for filtering
  the available components.
- `typebuttons`: provides two buttons for switching between searching widgets
  and operators.
- `list`: provides a `div` element that will display the available components.


**Example usage**:

```html+django
{% load i18n %}
<s:styledgui
    xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements"
    xmlns:t="http://wirecloud.conwet.fi.upm.es/Template"
    xmlns="http://www.w3.org/1999/xhtml">

<s:verticallayout class="panel panel-default we-panel-components">

    <s:northcontainer class="panel-heading">
        <div class="panel-title">
            <strong>{% trans "Components" %}</strong>
        </div>
        <t:searchinput/>
        <div class="btn-group btn-group-justified"><t:typebuttons/></div>
    </s:northcontainer>

    <s:centercontainer class="panel-body">
        <t:list/>
    </s:centercontainer>

</s:verticallayout>
</s:styledgui>
```

### Template: `wirecloud/views/embedded.html`

**Example usage**:

```html+django
{% extends "wirecloud/views/base.html" %}{% load wirecloudtags %}

{% load i18n %}

{% block title %}{% trans "WireCloud Platform" %}{% endblock %}

{% block header %}<div id="wirecloud_header"></div>{% endblock %}

{% block core_scripts %}
{% wirecloud_bootstrap "embedded" %}
{% extra_javascripts "embedded" %}
{% endblock %}
```

### Template: `wirecloud/views/footer.html`

Html to display in the footer section of the theme.

**Example usage**:

```html+django
<footer>My custom footer. Copyright © 2017 My company.</footer>
```

## Available SCSS files

- `_variables.scss`: File defining the values of the variables used in the other
  SCSS files.
- `header.scss`: style to use for the header.
- `modals/base.scss`: contains the style used on all the modals used by
  WireCloud.
- `modals/logs.scss`: contains the style used on the log modals.
- `modals/upgrade_downgrade_component.scss`: contains the style used by the
  upgrade/downgrade modals used by the workspace view and the wiring editor view
  for updating the version of widgets and by the wiring editor for updating the
  version of operators.
- `workspace/dragboard_cursor.scss`: contains the style for the cursor
  displayed when moving widgets inside a workspace.
- `workspace/modals/share.scss`: contains the style used on the modal for
  changing the sharing properties of the workspace.
- `wiring/behaviours.scss`:
- `wiring/connection.scss`:
- `wiring/layout.scss`:
- `workspace/widget.scss`: contains the style for displaying widgets inside the
  workspace/dashboard view.
- `mac_field.scss`: contains the style for the mashable application component
  input fields.


## Default theme: `wirecloud.defaulttheme`

### Used images

- `favicon.ico`: Image in `image/x-icon` format to use as favicon. Remember to
  provide a multi-resolution image for better results. *This file is used only
  when the theme is configured as the main theme.*
- `logos/header.png`: Image in `image/png` used in the header. *This file is
  used only when the theme is configured as the main theme.*

### Available SCSS variables

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


Misc variables:

- `button-gradients`: `true` for styling buttons using gradients, `false` for
  plain colour buttons. `true` by default.
- `high-resoulution-images`: `true` if the theme is going to use high-resolution
  images (e.g. for the header logo). In that case the theme should provide
  images files using a 2x resolution (e.g. 800x600 for an image of 400x300
  pixels). `false` for using standard resolution images. `true` by default.
