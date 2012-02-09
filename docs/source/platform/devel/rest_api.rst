HTTP API
========

Wirecloud provides an HTTP API for interacting with it. Some of these APIs
follows the REST paradigm and others are services that does not represent
Wirecloud resources.

Application Mashup Editor
-------------------------

Add a gadget into a workspace
.............................

Request
~~~~~~~

**POST /workspace/{workspace_id}/tab/{tab_id}/igadgets**

Parameters
..........

* *gadget* (required): URI of the gadget to instanciate.
*

Export a workspace as mashup
............................

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


Import a mashup
...............

Reads a mashup description and creates a new workspace following the mashup
description.

Request
~~~~~~~

**POST /workspace/import**

Parameters
''''''''''

* *template_uri* (required): URL of the mashup description (template).

Responses
~~~~~~~~~

* 200 - Mashup imported successfully
* 403 - Forbidden

Examples
~~~~~~~~

Request: ::

    POST /workspace/import
    {"template_url": "http://server.com/mashup_template.xml"}

Response: ::


Merge a mashup in a workspace
.............................

Reads a mashup description and adds all its resources into an existing
workspace. Repeated tab and channel names will be adapted to avoid conflicts
with existing tabs and channels.

Request
~~~~~~~

**POST /workspace/{workspace_id}/merge**

Parameters
''''''''''

* *template_uri* (required): URL of the mashup description (template).

Responses
~~~~~~~~~

* 200 - Mashup merged successfully
* 403 - Forbidden

Examples
~~~~~~~~

Request: ::

    POST /workspace/1/merge
    {"template_url": "http://server.com/mashup_template.xml"}

Response: ::


Local catalogue (showcase)
--------------------------

Add a gadget/mashup into the showcase
.....................................

Request
~~~~~~~

**POST /showcase**

Parameters
''''''''''

* *url*: Template URL of the Gadget/Mashup to add.
* *file*:

*url* or *file* is required.

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



* 200 - Gadget/Mashup added to the showcase successfully
