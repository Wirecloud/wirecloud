.. _wdl_rdf:

RDF Widget Description Language
===============================

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

  * **URI**: http://wirecloud.conwet.fi.upm.es/ns/Widget#actionLabel
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

* **Property**: wire:index

  Specify the logical order of elements with the same type

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

