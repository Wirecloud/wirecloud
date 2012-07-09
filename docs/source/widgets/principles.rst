Design principles
=================

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
