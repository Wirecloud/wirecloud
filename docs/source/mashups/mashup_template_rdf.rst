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

* **Class**: wire-m:Channel

  This class represents a wiring channel between two iWidgets.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#Channel
  * **Properties include**:

    wire-m:hasIn, wire-m:hasOut, dcterms:title, wire-m:readonly, wire-m:channelFilter,
    wire-m:channelFilterparam, wire-m:hasOutChannel

  * **Used with**:

    wire-m:hasChannel

* **Class**: wire-m:In

  This class represents an iWidget that is the in of a channel.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#In
  * **Properties include**:

    wire-m:iniWidget, dcterms:title

  * **Used with**:

    wire-m:hasIn

* **Class**: wire-m:In

  This class represents an iWidget that is the out of a channel.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#Out
  * **Properties include**:

    wire-m:outiWidget, dcterms:title

  * **Used with**:

    wire-m:hasOut


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

* **Property**: wire-m:hasChannel

  Indicates a channel of the wiring.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasChannel
  * **Domain**: wire:PlatformWiring
  * **Range**: wire-m:Channel

* **Property**: wire-m:hasOutChannel

  Indicates that a given channel is an out channel of another channel.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasOutChannel
  * **Domain**: wire-m:Channel
  * **Range**: wire-m:Channel

* **Property**: wire-m:hasIn

  Indicates an input of a channel.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasIn
  * **Domain**: wire-m:Channel
  * **Range**: wire-m:In

* **Property**: wire-m:hasOut

  Indicates an output of a channel.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#hasOut
  * **Domain**: wire-m:Channel
  * **Range**: wire-m:Out

* **Property**: wire-m:channelFilter

  Indicates a filter of a channel.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#channelFilter
  * **Domain**: wire-m:Channel
  * **Range**: rdfs:Literal

* **Property**: wire-m:channelFilterParam

  Indicates a parameter  of a channel filter.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/mashup#channelFilterParam
  * **Domain**: wire-m:Channel
  * **Range**: rdfs:Literal

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
