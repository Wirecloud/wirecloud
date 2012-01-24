HTTP API
========

Wirecloud provides an HTTP (almost REST based) API.

Application Mashup Editor
-------------------------

Adding a gadget to a workspace
..............................

Request
~~~~~~~

**POST /workspace/{workspace_id}/tab/{tab_id}/igadgets**

Parameters
..........

* *gadget* (required): URI of the gadget to instanciate.
*

Showcase
--------

Adding gadgets/mashups
......................

Request
~~~~~~~

**POST /showcase**

Parameters
''''''''''

* *url* (required): Template URL of the Gadget/Mashup to add.

Responses
~~~~~~~~~

* 200 - Gadget/Mashup added successfully
* 403 - Forbidden

Examples
~~~~~~~~

Request: ::

    POST /showcase
    url=http%3A%2F%2Fexample.com%2Ftemplate.xml

Response: ::

    200

Exporting a mashup
..................

Request
~~~~~~~

**POST /workspace/{workspace_id}/export**

Parameters
''''''''''

* *name* (required): Name to assign to the newly created mashup.
* *vendor* (required): Vendor to assign to the newly created mashup.
* *version* (required): Version to assign to the newly created mashup.
* *email* (required): Email.

Responses
~~~~~~~~~

* 200 - Mashup exported successfully
* 403 - Forbidden

Examples
~~~~~~~~

Request: ::

    POST /workspace/1/export
    options="%7B%22name%22%3A%20%22Test%22%2C%20%22vendor%22%3A%20%22Test%22%2C%20%22version%22%3A%20%220.1%22%2C%20%22email%22%3A%20%22email@server.com%22%7D"

Response: ::

    <?xml version='1.0' encoding='UTF-8'?>
    <Template xmlns="http://morfeo-project.org/2007/Template">
      <Catalog.ResourceDescription>
        <Vendor>Test</Vendor>
        <Name>Test</Name>
        <Version>0.1</Version>
        <Author>...</Author>
        <Mail>a@c.com</Mail>
        <Description>EzWeb Mashup composed of</Description>
        <ImageURI>/ezweb/images/headshot_mashup.jpg</ImageURI>
        <WikiURI>http://trac.morfeo-project.org/trac/ezwebplatform/wiki/options</WikiURI>
        <IncludedResources>
            ...
        </IncludedResources>
      </Catalog.ResourceDescription>

      ...

    </Template>
