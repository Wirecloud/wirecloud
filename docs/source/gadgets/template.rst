Gadget Template
===============

Gadget Template is a XML document that defines and provides information about
the gadget and its behavior within its environment (user, platform, other gadgets
...). Moreover, it is possible to define several templates each of them
parametrizing the behaviour of the gadget in different ways.

Here we are going to talk about the gadget template in a functional way, but you
can see the :ref:`gadget_template_schema` for a more formal description.

First of all, gadgets templates are XML using the
'http://morfeo-project.org/2007/Template' namespace for the root element.

Template is divided into two main :

1. **Description**: Contains all the gadget contextual information in an XML
   element called **Catalog.ResourceDescription**. This element is compulsory
   and only one element can be present in the XML document.

    + **Vendor**. The distributor of the gadget. It cannot contain the character
      "/".
    + **Name**. Name of the gadget. It cannot contain the character "/".
    + **Version**. Current version of the gadget. It must define 
      starting sequences of numbers separated by dots. Moreover, zeros can only be
      used alone (e.g. 0.1 is valid but 03.2 is not).
      
      These tree fields (vendor, name and version) identify the gadget, therefore
      there can not be a repetition of such identifier in any collection of
      wirecloud resources (gadgets or mashups).

    + **DisplayName**
    + **Author**. Developer of the gadget.
    + **Mail**. E-mail address to get in touch with the developer(s).
    + **Description**. A brief textual description of the gadget.
    + **ImageURI**. Absolute or template-relative URL of the gadget image for
      the catalog.
    + **iPhoneImageURI**. Image to be used in iPhone and other smartphones.
    + **WikiURI**. Entry to a Wiki where to find a complete description of the gadget
    
2. **Integration Variables and Platform Elements**. The variables that uses the
   gadget to interact with the environment, associating concepts with aspects are
   defined in this block. Likewise, it also defines some other elements of the
   interface, such as the initial size of the gadget. All of them are managed by the
   platform, which will ensure their persistence.

    + **Platform.Preferences**. The user preferences, which may be changed
      through the platform interface. It's a mandatory element, consisting of
      one, several or even none preference sub-elements:

        + **Preference**. Defines a user preference. It has the following
          required attributes:

            + *name*. Name of the variable to reference it in the code.
            + *type*. Data type of the variable: text (string), number, boolean, password and list.
            + *description*. Descriptive text.
            + *label*. Label which the variable will be shown in the user interface.
            + *default*. Default value.

          The **Preference** elements of type *list* specify the available choices
          using the **Option** element:

            + **Option**. Defines an item of the selection list. It has the
              following attributes:

                + *name*. Text to display in the selection list.
                + *value*. The value used when the option is selected.

    + **Platform.StateProperties**. This element contains some variables that
      reflects the persitant gadget state. The state can be any information
      desired to be persisted. It's required element and contains a list of
      property definitions:

        + **Property**. Defines a state variable. It has the following required
          attributes:

            + *name*. Name of the variable.
            + *type*. Data type of the variable. So far only the type text (string) is allowed.
            + *label*. Label to be displayed in the user interface.

    + **Platform.Wiring**. Defines the list of variables to communicate with
      other gadgets. It may contain any number of these elements:

        + **Event**. Events produced by a gadget, which value will be received by other gadgets as slots. Must have the following attributes mandatorily:

            + *name*. Name of the variable.
            + *type*. Data type of the variable. So far only the type text (string) is allowed.
            + *label*. Label to be displayed in the user interface.
            + *friendcode*. Keyword used to tag the event, so it can be easily
              suggested valid conection during the wiring process.

        + **Slot**. Define the variable where gadget receives the value of the event which another gadget has produced. Each slot must have the following attributes:

            + *name*. Name of the variable.
            + *type*. Data type of the variable. So far only the type text (string) is allowed.
            + *label*. Label to be displayed in the user interface.
            + *friendcode*. Keyword used to tag the slot, so it can be easily
              suggested valid conection during the wiring process.

    + **Platform.Context**. Element in which variables of context are defined.
      These variables provide gadgets with a context, which are managed by the
      platform. Like case before, is a mandatory element and can contain any
      number of the following two elements:

        + **Context**. Defines a context variable within platform scope (e.g.
          username, etc.).
        + **GadgetContext**. Defines a context  variable within gadget scope
          (e.g. height, width, etc.).

      Both of them must have the following attributes:

            + *name*. Name of the variable.
            + *type*. Data type of the variable. So far only the type text
              (string) is allowed.
            + *concept*. Label that provides variable with semantic. It must
              match with one of the concepts managed by the platform. Currently
              only *user_name* and *language* has been defined as platform
              concepts, and *height* and *width* in the gadget scope.

    + **Platform.Link**. Gadget source code related to the template. It's formed
      by an unique element:
      
        + **XHTML**. This elements is used to link the template with the code
          of the gadget.

            + *href*: Absolute or template-relative URL of gadget code.
            + *contenttype*: Content type of the linked resource. Suggested
              values are: text/html and application/xml+xhtml. Optional
              attribute, 'text/html' by default.
            + *cacheable*: Whether this code can be cached by the platform.
              Possible values are "true" and "false". Optional attribute, "false"
              by default.

    + **Platform.Rendering**. Contains information about how to show the gadget.

        + *width*: Initial width of the gadget in cells.
        + *height*: Initial height of the gadget in cells.


Examples:
