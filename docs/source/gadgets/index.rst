Gadget development documentation
================================

Gadgets are formed by three different components:

* Template, which is a declarative description of the gadget, and represents its
  main entry point. This file contains, among other things, references to the
  rest of resources of a gadget.
* Code, composed of HTML, JavaScript and CSS files containing the definition and
  the behaviour of the gadget.
* Static resources, such as images, documentation and other static resources.

Design principles
-----------------

Before starting the creation of a gadget, the developer should be aware of
certain design principles of the gadgets:

* Gadgets are supposed to be small, reusable and user centric web applications.
* Generic gadgets are desirable, but ad-hoc solutions are allowed too if they
  are quick and cheap enough.
* Gadgets should be adapted to real problems.
* Gadgets are elements of the front-end layer (View). It's not desirable for
  gadgets to perform back-end layer functions (controller or model) because they
  can be provided by the platform (persistent state).
* During the development of gadgets any technology accepted by web browsers
  (XHTML, JavaScript, SVG, Flash, applets ....) can be used.

More precise documentation of gadgets is explained in the following sections:

.. toctree::
    :maxdepth: 1

    template.rst
    javascript_API.rst
    EzWebAPI.rst
    widget_mashup_rdf_ontology.rst
    gadget_template_schema.rst
    widget_rdf_template_schema.rst
