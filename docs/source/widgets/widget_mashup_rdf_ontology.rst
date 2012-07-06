Widget/Mashup template ontology
================================

Abstract
--------

In order to support MDL/WDL technical descriptions, needed in wirecloud platform,
two  specifications ,that build upon the linked data principles, has been defined
as RDF(S) vocabularies. The first one defines the information wirecloud uses to
instantiate a widget, including user preferences, state properties, wiring info etc.
On the other hand, the second ontology specifies information about a mashup in wirecloud,
that is a workspace instance, including platform information like tabs, and widget
composition information like widget instances, wiring and channels between widgets etc.

WDL technical description - Widget vocabulary
---------------------------------------------

This vocabulary provides a way to represent WDL information using existing ontologies
where possible and linking it to usdl-core specification in order to use the descriptions
it defines and link this technical information to a linked-USDL service description.

Classes
+++++++

* **Class**: wire:Widget

  This class represents a wirecloud widget, this is the principal class of the vocabulary
  so the other classes are properties of this class.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#Widget
  * **Properties include**:

    wire:hasPlatformPreference, wire:hasContext, wire:hasPlatformWiring,
    wire:hasPlatformRendering, wire:hasPlatformStateProperty, usdl:versionInfo,
    wire:hasImageUri, wire.hasiPhoneImageUri, wire:displayName, vcard:addr

  * **Subclassof**: usdl-core:Service

* **Class**: wire:Operator

  This class represents a wirecloud operator, that is a kind of widget that only exist
  in wiring.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#Operator
  * **Properties include**:

    wire:hasPlatformPreference, wire:hasPlatformWiring, wire:hasPlatformStateProperty,
    usdl:versionInfo, wire:hasImageUri, wire.hasiPhoneImageUri, wire:displayName, vcard:addr

  * **Subclassof**: usdl-core:Service

* **Class**: wire:PlatformPreference

  This class represents a user preference in wirecloud platform, that is data that an user
  can view and configure. The platform makes this values persistent and provides users
  tools to edit and validate this data.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#PlatformPreference
  * **Properties include**:

    wire:hasOption, dcterms:title, dcterms:description, rdfs:label, wire:type,
    wire:default, wire:secure

  * **Used with**:

    wire:hasPlatformPreference

* **Class**: wire:Context

  This class represents the general context of a widget

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#Context
  * **Properties include**:

    wire:hasPlatformContext, wire:haswidgetContext

  * **Used with**:

    wire:hasContext

* **Class**: wire:PlatformWiring

  This class represents the general wiring  of a widget.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#PlatformWiring
  * **Properties include**:

    wire:hasEvent, wire:hasSlot

  * **Used with**:

    wire:hasPlatformWiring

* **Class**: wire:PlatformRendering

  This class represents the size a widget has when it is instantiated.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#PlatformRendering
  * **Properties include**:

    wire:renderingWidth, wire.renderingHeight

  * **Used with**:

    wire:hasPlatformRendering

* **Class**: wire:PlatformStateProperty

    This class represents a widget state variable that the platform need to know in order to make it persistent.

    * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#PlatformStateProperty
    * **Properties include**:

      dcterms:title, dcterms:description, wire:type, rdfs:label, wire:default, wire:secure

    * **Used with**:

      wire:hasPlatformStateProperty

* **Class**: wire:Option

  This class represent an option that a user preference could have.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#Option
  * **Properties include**:

    dcterms:title, wire:value

  * **Used with**:

    wire:hasOption

* **Class**: wire:PlatformContext

  This class represents a platform context variable

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#PlatformContext
  * **Properties include**:

    dcterms:title, wire:type, wire:concept

  * **Used with**:

    wire:hasPlatformContext

* **Class**: wire:widgetContext

  This class represents a context variable of a widget

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#widgetContext
  * **Properties include**:

    dcterms:title, wire:type, wire:concept

  * **Used with**:

    wire:haswidgetContext

* **Class**: wire:Event

    This class represents a wirecloud event, that is the events the widget spread to the rest of the platform.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#Event
  * **Properties include**:

    dcterms:title, dcterms:description, rdfs:label, wire:type, wire:eventFriendcode

  * **Used with**:

    wire:hasEvent

* **Class**: wire:Slot

  This class represents a wirecloud slot, that is the events the widget can use.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/widget#Slot
  * **Properties include**:

    dcterms:title, dcterms:description, rdfs:label, wire:type, wire:slotFriendcode, wire:actionLabel

  * **Used with**:

    wire:hasSlot

Properties
++++++++++

* **Property**: wire:hasPlatformPreference

  Indicates a user preference of a Widget.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasPlatformPreference
  * **Domain**: wire:Widget
  * **Range**: wire:PlatformPreference

* **Property**: wire:hasContext

  Indicates context of a Widget.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasContext
  * **Domain**: wire:Widget
  * **Range**: wire:Context

* **Property**: wire:hasPlatformWiring

  Indicates the wiring of a Widget.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasPlatformWiring
  * **Domain**: wire:Gadged
  * **Range**: wire:PlatformWiring

* **Property**: wire:hasPlatformRendering

  Indicates the rendering of a Widget.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasPlatformRendering
  * **Domain**: wire:Widget
  * **Range**: wire:PlatformRendering

* **Property**: wire:hasPlatformStateProperty

  Indicates a state variable of a Widget.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasPlatformStateProperty
  * **Domain**: wire:Widget
  * **Range**: wire:PlatformStateProperty


* **Property**: wire:hasOption

  Indicates an option  of a user preference.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasOption
  * **Domain**: wire:PlatformPreference
  * **Range**: wire:Option

* **Property**: wire:hasPlatformContext

  Indicates a platform context variable  of the context

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasPlatformContext
  * **Domain**: wire:Context
  * **Range**: wire:PlatformContext

* **Property**: wire:hasWidgetContext

  Indicates a Widget context variable of the context

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasWidgetContext
  * **Domain**: wire:Context
  * **Range**: wire:WidgetContext

* **Property**: wire:hasEvent

  Indicates an event of the Widget wiring

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasEvent
  * **Domain**: wire:PlatformWiring
  * **Range**: wire:Event

* **Property**: wire:hasSlot

  Indicates an slot of the Widget wiring

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasSlot
  * **Domain**: wire:PlatformWiring
  * **Range**: wire:Slot

* **Property**: wire:platformContextConcept

  Indicates the concept of a platform context variable

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#platformContextConcept
  * **Domain**: wire:PlatformContext
  * **Range**: rdfs:Literal

* **Property**: wire:WidgetContextConcept

  Indicates the concept of a Widget context variable

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#platformWidgetConcept
  * **Domain**: wire:WidgetContext
  * **Range**: rdfs:Literal

* **Property**: wire:eventFriendcode

  Indicates the friendcode of an event, that is the identifier of the data type the event spread.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#eventFriendcode
  * **Domain**: wire:Event
  * **Range**: rdfs:Literal

* **Property**: wire:slotFriendcode

  Indicates the friendcode of an slot, that is the identifier of the data type the slot consumes.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#slotFriendcode
  * **Domain**: wire:Slot
  * **Range**: rdfs:Literal

* **Property**: wire:actionLabel

  Indicates the action label of an slot.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#actioLabel
  * **Domain**: wire:Slot
  * **Range**: rdfs:Literal

* **Property**: wire:version

  Indicates the version of the Widget.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#version
  * **Domain**: wire:Widget
  * **Range**: rdfs:Literal

* **Property**: wire:hasImageUri

  Indicates the URI of the image asociated to the Widget

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasImageUri
  * **Domain**: wire:Widget
  * **Range**: foaf:Image

* **Property**: wire:hasiPhoneImageUri

  Indicates the URI of the image asociated to the Widget if the platform is running in an iPhone.

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#hasiPhoneImageUri
  * **Domain**: wire:Widget
  * **Range**: foaf:Image

* **Property**: wire:displayName

  Indicates the Widget name to be displayed

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#displayName
  * **Domain**: wire:Widget
  * **Range**: rdfs:Literal

* **Property**: wire:value

  Indicates the value of a Widget configuration element

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#value
  * **Range**: rdfs:Literal

* **Property**: wire:type

  Indicates the type of a Widget configuration element

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#type
  * **Range**: rdfs:Literal

* **Property**: wire:default

  Indicates the default value of a Widget configuration element

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#default
  * **Range**: rdfs:Literal

* **Property**: wire:secure

  Indicates if a Widget configuration element is secure

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#value
  * **Range**: rdfs:Literal

* **Property**: wire:codeContentType

  Indicates the MIME type of the Widget code. The Widget code URI is represented using usdl-core:Resource

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#codeContentType
  * **Domain**: usdl-core:Resource
  * **Range**: rdfs:Literal

* **Property**: wire:codeCacheable

  Indicates if the Widget code is cacheable

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#codeCacheable
  * **Domain**: usdl-core:Resource
  * **Range**: rdfs:Literal

MDL technical description – Mashup vocabulary
----------------------------------------------

This vocabulary provides a way to represent MDL information using existing ontologies
where possible and linking it to usdl-core specification in order to use the descriptions
it defines and link this technical information to a linked-USDL service description.
This vocabulary uses some classes and properties defined in the widget vocabulary.

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
