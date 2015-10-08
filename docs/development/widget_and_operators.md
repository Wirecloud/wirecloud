Before starting the creation of a widget, the developer should be aware of
certain design principles of the widgets:

- Widgets are supposed to be small, reusable and user centric web applications.
- Generic widgets are desirable, but ad-hoc solutions are allowed too if they
  are quick and cheap enough.
- Widgets should be adapted to real problems.
- Widgets are mainly elements of the front-end layer (View). Widgets can access
  backend services directly, but is preferred to create operators when possible
  for those tasks. Then those widgets and operators can be connected by making
  use of the wiring editor.
- During the development of widgets any technology accepted by web browsers
  (XHTML, JavaScript, SVG, Flash, applets ....) can be used.

Widgets can be split up into three different components:

- A Descriptor (`config.xml`), which is a declarative description of the widget.
  This file contains, among other things, references to the rest of resources of
  the widget. This description file is written using the Mashable Application
  Component Description Language (a.k.a [MACDL](macdl.md)).
- Code, composed of HTML files, JavaScript files, CSS files, SVG files ...:
  those files contains the implementation of the widget and they work exactly if
  you were creating a standard web page. The only thing to take into account is
  that your code will have access to a new API: the
  [Widget API](../widgetapi/widgetapi.md).
- Static resources, such as images, documentation and other static resources.

All those files should be packaged together into a zip file (usually renamed to
use the `.wgt` extension). The following figure shows one possible structure of
files for a widget:

```
.
+-- docs
|   |   ...
|   +-- index.md
+-- css
|   |   ...
|   +-- style.css
+-- images
|   |   ...
|   +-- catalogue.png
+-- js
|   |   ...
|   +-- main.js
+-- CHANGELOG.md
+-- config.xml
+-- index.html
+-- DESCRIPTION.md
```

> It's recommended to use this kind of structure (or a similar one), but you can
> use whatever you want, except that the `config.xml` file MUST be at the root
> of the zip file.

Operators are created in the same way as widgets, the only difference is that
the descriptor file (`config.xml`) does not link to an initial HTML document (as
operators doesn't have a visual component). Instead, you will have to link the
list of used JavaScript files from the `config.xml` file.

Operators can be classified using three types:

- **Data source operators:** Operators that provide information that can be
  consumed by other widgets/operators. For example, an operator that retrieves
  some type of information from a web service.
- **Data target operators:** Operators that are provided information and use it
  to do some tasks. For example, an operator that receives some information and
  push it to a web service.
- **Data transformation operators:** This type of operators can be very useful
  since they can transform data in order to make it usable by widgets or
  operators that expect data structure to be slightly different.


Preparing your widget/operator projects
=======================================

As you see, building a WireCloud widget/operator is a matter of editing some
files and packaging them into a zip file, so simple widgets/operators can be
created using a simple editor and a zip tool.

However, you will need a more sophisticated schema if you want to pass unit
tests, deploy widgets/operators automatically, etc.

WireCloud provides the following tools to ease this process:

- A
  [mock of the Widget API](https://github.com/Wirecloud/mock-applicationmashup),
  so you can pass your unit tests without having to deploy your widget/operator
  into a WireCloud instance.
- A [set of tools for grunt](https://github.com/Wirecloud/grunt-wirecloud)
  allowing you to deploy widgets and operators using grunt tasks.
- A [grunt-init template for operator projects](https://github.com/Wirecloud/grunt-init-wirecloud-operator)
  and another [grunt-init template for widget projects](https://github.com/Wirecloud/grunt-init-wirecloud-widget).
  Projects created using those templates, will make use of the Widget API mock
  and [jasmine](http://jasmine.github.io/) for unit testing the widget/operator,
  [grunt](http://gruntjs.com/) for building it and grunt-wirecloud for deploying
  it. Remember that you can always fork those templates for adapting them to
  your needs (or requesting new features, bug fixes, etc. through the issue
  tracker of the template repo).
- An [Eclipse plugin](eclipse_ide.md) for those preferring a full IDE.


What next?
==========

We recommend you to continue following the
[WireCloud course at the FIWARE Academy](http://edu.fiware.org/course/view.php?id=53),
as we think that it's easier to learn by examples. Anyway, the following
sections will provide the reference documentation for developing widgets and
operators for WireCloud.
