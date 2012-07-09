Widget development documentation
================================

Widgets are formed by three different components:

* Template, which is a declarative description of the widget, and represents its
  main entry point. This file contains, among other things, references to the
  rest of resources of a widget.
* Code, composed of HTML, JavaScript and CSS files containing the definition and
  the behaviour of the widget.
* Static resources, such as images, documentation and other static resources.

The interaction between widgets and Mashup Execution Engine is performed using a
Javascript API. Widgets use this Javascript API as an access point to the
features of the Mashup Execution Engine in the scope of Widgets like the
interconnection between widgets.

.. toctree::
    :maxdepth: 1
    :numbered:

    principles.rst
    template/index.rst
    javascript_API.rst
    backwards/EzWebAPI.rst
