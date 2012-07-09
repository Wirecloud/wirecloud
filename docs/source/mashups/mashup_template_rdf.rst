Mashup Description Language
---------------------------

This vocabulary provides a way to represent MDL information using existing ontologies
where possible and linking it to usdl-core specification in order to use the descriptions
it defines and link this technical information to a linked-USDL service description.
This vocabulary uses some classes and properties defined for the :ref:`wdl_rdf`.

Classes
+++++++

* **Class**: wire-m:Mashup

  This class represents a wirecloud mashup, which is a wirecloud workspace instance.

  * **URI**:http://wirecloud.conwet.fi.upm.es/ns/mashup#Mashup
  * **Properties include**:

    wire-m:hasMashupPreference, wire-m:hasMashupParam, wire-m:hasTab,
    wire-m:hasMashupWiring, wire:hasImageUri, wire:hasiPhoneImageUri, wire:version

  * **subClassOf**: usdl:CompositeService

* **Class**: wire-m:Tab

  This class represents a tab into a wirecloud workspace.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#Tab
  * **Properties include**:

    wire-m:hasiWidget, wire-m:hasTabPreference, dcterms:title

  * **Used with**:

    wire-m:hasTab

* **Class**: wire-m:iWidget

  This class represents a wirecloud iWidget, that is a Widget instance.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#iWidget
  * **Properties include**:

    wire-m:hasPosition, wire-m:hasiWidgetRendering,
    wire-m:hasiWidgetPreference, wire-m:hasiWidgetProperty

  * **Used with**:

    wire-m:hasiWidget

  * **subClassOf**: wire:Widget

* **Class**: wire-m:MashupPreference

  This class represents a preference of a wirecloud mashup.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#MashupPreference
  * **Properties include**:

       dcterms:title, wire:value

  * **Used with**:

       wire-m:hasMashupPreference

* **Class**: wire-m:MashupParam

  This class represents a param  of a wirecloud mashup.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#MashupParam
  * **Properties include**:

    dcterms:title, wire:value

  * **Used with**:

    wire-m:hasMashupParam

* **Class**: wire-m:Position

  This class represents the position of an iWidget in the tab.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#Position
  * **Properties include**:

    wire-m:x, wire-m:y, wire-m:z

  * **Used with**:

    wire-m:hasPosition

* **Class**: wire-m:iWidgetPreference

  This class represents a preference of an iWidget.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#iWidgetPreference
  * **Properties include**:

    dcterms:title, wire:value, wire-m:readonly, wire-m:hidden

  * **Used with**:

    wire-m:hasiWidgetPreference

* **Class**: wire-m:iWidgetRendering

  This class represents the rendering of an iWidget.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#iWidgetRendering
  * **Properties include**:

    wire-m:fullDragboard, wire-m:layout, wire-m:minimized, wire:renderingHeight, wire:renderingWidth

  * **Used with**:

    wire-m:hasiWidgetRendering

* **Class**: wire-m:iWidgetProperty

  This class represents a property of an iWidget.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#iWidgetProperty
  * **Properties include**:

    wire-m:readonly, wire:value

  * **Used with**:

    wire-m:hasiWidgetProperty

* **Class**: wire-m:TabPreference

  This class represents a preference of a Tab.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#TabPreference
  * **Properties include**:

    dcterms:title, wire:value

  * **Used with**:

    wire-m:hasTabPreference

* **Class**: wire-m:Connection

  This class represents a wiring connection between two iWidgets or iOperators.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#Connection
  * **Properties include**:

    wire-m:hasSource, wire-m:hasTarget, dcterms:title, wire-m:readonly

  * **Used with**:

    wire-m:hasConnection

* **Class**: wire-m:Source

  This class represents an iWidget or iOperator that is the source of a connection.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#Source
  * **Properties include**:

    wire-m:sourceId, wire-m:endpoint, wire:type

  * **Used with**:

    wire-m:hasSource

* **Class**: wire-m:Target

  This class represents an iWidget or iOperator that is the target of a connection.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#Target
  * **Properties include**:

    wire-m:targetId, wire-m:endpoint, wire:type

  * **Used with**:

    wire-m:hasTarget

* **Class**: wire-m:iOperator

  This class represents an instance of an operator.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#iOperator
  * **Properties include**:

    wire-m:iOperatorId, dcterms:title

  * **Used with**:

    wire-m:hasiOperator

Properties
++++++++++

* **Property**: wire-m:hasMashupPreference

  Indicates a preference of a mashup.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasMashupPreference
  * **Domain**: wire-m:Mashup
  * **Range**: wire-m:MashupPreference

* **Property**: wire-m:hasMashupParam

  Indicates a param of a mashup.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasMashupParam
  * **Domain**: wire-m:Mashup
  * **Range**: wire-m:MashupParam

* **Property**: wire-m:hasTab

  Indicates that a given tab is part of a workspace

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasTab
  * **Domain**: wire-m:Mashup
  * **Range**: wire-m:Tab

* **Property**: wire-m:hasiWidget

  Indicates that a given iWidget is instantiated in a tab.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasiWidget
  * **Domain**: wire-m:Tab
  * **Range**: wire-m:iWidget

* **Property**: wire-m:hasTabPreference

  Indicates a preference of a Tab.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasTabPreference
  * **Domain**: wire-m:Tab
  * **Range**: wire-m:TabPreference

* **Property**: wire-m:hasPosition

  Indicates the position of an iWidget in a tab.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasPosition
  * **Domain**: wire-m:iWidget
  * **Range**: wire-m:Position

* **Property**: wire-m:hasiWidgetPreference

  Indicates a preference of an iWidget.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasiWidgetPreference
  * **Domain**: wire-m:iWidget
  * **Range**: wire-m:iWidgetPreference

* **Property**: wire-m:hasiWidgetProperty

  Indicates a property of an iWidget

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasiWidgetProperty
  * **Domain**: wire-m:iWidget
  * **Range**: wire-m:iWidgetProperty

* **Property**: wire-m:hasiWidgetRendering

  Indicates the rendering of an iWidget

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasiWidgetRendering
  * **Domain**: wire-m:iWidget
  * **Range**: wire-m:iWidgetRendering

* **Property**: wire-m:hasConnection

  Indicates a connection of the wiring.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasConnection
  * **Domain**: wire:PlatformWiring
  * **Range**: wire-m:Connection

* **Property**: wire-m:hasSource

  Indicates the source of a connection.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasSource
  * **Domain**: wire-m:Connection
  * **Range**: wire-m:Source

* **Property**: wire-m:hasTarget

  Indicates the target of a connection.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasTarget
  * **Domain**: wire-m:Connection
  * **Range**: wire-m:Target

* **Property**: wire-m:targetId

  Indicates the id of a target.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#targetId
  * **Domain**: wire-m:Target
  * **Range**: rdfs:Literal

* **Property**: wire-m:sourceId

  Indicates the id of a source.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#sourceId
  * **Domain**: wire-m:Source
  * **Range**: rdfs:Literal

* **Property**: wire-m:endpoint

  Indicates the id of the iWidget or iOperator that is the source or target of a connection.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#endpoint
  * **Range**: rdfs:Literal

* **Property**: wire-m:hasiOperator

  Indicates the wiring iOperators.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasiOperator
  * **Domain**: wire:PlatformWiring
  * **Range**: wire-m:iOperator


* **Property**: wire-m:x

  Indicates the x coordinate of an iWidget position.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#x
  * **Domain**: wire-m:Position
  * **Range**: rdfs:Literal

* **Property**: wire-m:y

  Indicates the y coordinate of an iWidget position.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#y
  * **Domain**: wire-m:Position
  * **Range**: rdfs:Literal

* **Property**: wire-m:z

  Indicates the z coordinate of an iWidget position.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#z
  * **Domain**: wire-m:Position
  * **Range**: rdfs:Literal

* **Property**: wire-m:fullDragboard

  Indicates if an iWidget occupies the whole space in the tab.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#fullDragboard
  * **Domain**: wire-m:iWidgetRendering
  * **Range**: rdfs:Literal

* **Property**: wire-m:layout

  Indicates the layout of an iWidget

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#layout
  * **Domain**: wire-m:iWidgetRendering
  * **Range**: rdfs:Literal

* **Property**: wire-m:minimized

  Indicates if an iWidget  is minimized in is tab.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#minimized
  * **Domain**: wire-m:iWidgetRendering
  * **Range**: rdfs:Literal

* **Property**: wire-m:hidden

  Indicates if an iWidget is hidden in his tab.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hidden
  * **Domain**: wire-m:iWidgetPreference
  * **Range**: rdfs:Literal

* **Property**: wire-m:readonly

  Indicates if a mashup configuration element can only be readed.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#readonly
  * **Range**: rdfs:Literal
