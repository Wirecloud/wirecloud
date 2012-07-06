Widget development documentation
================================

Widgets are formed by three different components:

* Template, which is a declarative description of the widget, and represents its
  main entry point. This file contains, among other things, references to the
  rest of resources of a widget.
* Code, composed of HTML, JavaScript and CSS files containing the definition and
  the behaviour of the widget.
* Static resources, such as images, documentation and other static resources.

Design principles
-----------------

Before starting the creation of a widget, the developer should be aware of
certain design principles of the widgets:

* Widgets are supposed to be small, reusable and user centric web applications.
* Generic widgets are desirable, but ad-hoc solutions are allowed too if they
  are quick and cheap enough.
* Widgets should be adapted to real problems.
* Widgets are elements of the front-end layer (View). It's not desirable for
  widgets to perform back-end layer functions (controller or model) because they
  can be provided by the platform (persistent state).
* During the development of widgets any technology accepted by web browsers
  (XHTML, JavaScript, SVG, Flash, applets ....) can be used.

More precise documentation of widgets is explained in the following sections:

.. toctree::
    :maxdepth: 1

    template.rst
    javascript_API.rst
    EzWebAPI.rst
    widget_mashup_rdf_ontology.rst
    gadget_template_schema.rst
    widget_rdf_template_schema.rst
