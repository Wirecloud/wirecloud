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
  the widget.
- Code, composed of HTML, JavaScript and CSS files containing the definition and
  the behaviour of the widget.
- Static resources, such as images, documentation and other static resources.

The following figure shows the structure of files for a widget, which is
distributed as a zip package of such structure with `.wgt` extension:

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

There are three types of operators:

- Data source operators: Operators that provide information that can be
  consumed by other widgets/operators. For example, an operator that retrieves
  some type of information from a web service.
- Data target operators: Operators that are provided information and use it to
  do some tasks. For example, an operator that receives some information and
  push it to a web service.
- Data transformation operators: This type of operators can be very useful since
  they can transform data in order to make it usable by widgets or operators
  that expect data structure to be slightly different.

Operators use the same structure as widgets. The only difference is that the
descriptor file (`config.xml`) does not link to an initial HTML document. Instead,
it directly links to the list of JavaScript files.
