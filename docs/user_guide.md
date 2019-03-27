## Supported browsers

WireCloud 1.2 supports the following desktop browsers:

-   Firefox 45+
-   Chrome 52+
-   Safari 10+
-   Opera 39+

WireCloud 1.2 also works on the mobile version of the previous browsers, except the wiring editor currently does not
work with touch screens.

> **Note:** Although WireCloud supports those browsers, some widgets and operators may not support all of them. Read
> each widget and operators documentation for knowing if they have any restriction on the used browser.

## Creating a new workspace

Mashups in WireCloud are built in the context of **workspaces**. A workspace consists of the set of widgets and
operators that can be mashed-up, even spanning multiple tabs. Widgets and operators in a workspace can share data though
data flow- or event-based mechanisms.

The workspace in use is shown in the upper area of the screen. It resembles the well-known REST nomenclature. For
example, the following screenshot shows a workspace named "Workspace", pertaining the user "admin" and running in the
FIWARE Lab’s instance of WireCloud, i.e. it is named admin/Workspace.

<img src="../images/user_guide/create_workspace/empty_workspace.png" srcset="../images/user_guide/create_workspace/empty_workspace.png 2x" alt="Empty workspace"/>

Near the workspace name there is a button that you can click on to expand the workspace dropdown menu:

<img src="../images/user_guide/create_workspace/workspace_menu.png" srcset="../images/user_guide/create_workspace/workspace_menu.png 2x" alt="Workspace menu"/>

Once expanded, the menu shows a list of the already created workspaces (see _Workspace_, _My Multimedia Workspace_ and
_IssueTrouble_ in the figure above) that allows you to quickly switch between them, followed by a list of options:

-   **New workspace** creates a new workspace
-   **Rename** changes the name of the current workspace
-   **Share** shows the sharing configuration of the current workspace
-   **Upload to my resources** allows you to save the current workspace to the local catalogue for later usage
-   **Embed** shows info about how to embed current workspace in other web pages
-   **Settings** changes the settings of the current workspace
-   **Remove** deletes the current workspace

If you want to create a new workspace named "History Info", choose _New workspace_ in the dropdown menu:

<img src="../images/user_guide/create_workspace/new_workspace_entry.png" srcset="../images/user_guide/create_workspace/new_workspace_entry.png 2x" alt="Click *New workspace*"/>

A dialog will pop up requiring a name for the new workspace. Type the desired name and click the accept button:

<img src="../images/user_guide/create_workspace/new_workspace_dialog.png" srcset="../images/user_guide/create_workspace/new_workspace_dialog.png 2x" alt="Dialog for creating a new workspace"/>

Once accepted, the name of the new workspace is shown in the upper area of the window:

<img src="../images/user_guide/create_workspace/new_workspace.png"
srcset="../images/user_guide/create_workspace/new_workspace.png 2x" alt=""History Info" workspace just after being
created"/>

The following screenshot show the "Settings" menu, where you can set workspace features:

<img src="../images/user_guide/create_workspace/workspace_settings.png" srcset="../images/user_guide/create_workspace/workspace_settings.png 2x" alt="create_workspace/WorkspaceSettings.png"/>

## Browsing the Marketplace

A mashup tool like WireCloud must support access to **marketplaces**, where people can offer and deal with services made
accessible through widgets and operators, like goods, and finally mashup them to create value added services and
applications.

On the marketplace you can quickly find and compare widgets and operators, which enable you to attend an
industry-ecosystem better than before. Widgets, operators, and even pre-built mashups become tradable goods, which can
be offered and acquired on Internet based marketplaces. Partner companies and other users can combine existing services
to new services whereby new business models will be incurred and the value added chain is extended.

The following figure shows a screenshot of WireCloud where you can see the FIWARE Lab marketplace.

<img src="../images/user_guide/bae/summary.png" srcset="../images/user_guide/bae/summary.png 2x" alt="Initial marketplace view"/>

### Managing marketplaces

When looking for an offer of widgets, operators and mashups, you first need to choose a marketplace. Use the dropdown
menu shown in the workspace path for this purpose.

<img src="../images/user_guide/bae/marketplace_dropdown.png" srcset="../images/user_guide/bae/marketplace_dropdown.png 2x" alt="Marketplace dropdown"/>

As shown in the previous screenshot, this menu allows you to choose among the different marketplaces you have access to.
To add a new marketplace, you only need to provide its endpoint (URL). You can also delete the current markeplace
through the _Delete Marketplace_ option in the context menu.

You can add the FIWARE Lab marketplace using the _Add new marketplace_ option as shown in the following screenshots:

<img src="../images/user_guide/bae/add_new_marketplace_entry.png" srcset="../images/user_guide/bae/add_new_marketplace_entry.png 2x" alt="Click *Add new marketplace*"/>

<img src="../images/user_guide/bae/add_new_marketplace_dialog.png" srcset="../images/user_guide/bae/add_new_marketplace_dialog.png 2x" alt="*Add new marketplace* dialog"/>

WireCloud offers a built-in local catalogue called _My Resources_, which allows you to search among the widgets,
operators and mashups currently available for the user. The following figure shows a screenshot of the _My Resources_
for a user in a given instance of WireCloud.

<img src="../images/user_guide/browsing_marketplace/my_resources.png" srcset="../images/user_guide/browsing_marketplace/my_resources.png 2x" alt="*My Resources* view"/>

If you are a widget developer with brand new widgets to share, or you just have downloaded a WireCloud-compliant widget
from anywhere, you can easily upload your new widgets to the built-in local catalogue through the _Upload_ button
available on the _My Resources_ view.

<img src="../images/user_guide/browsing_marketplace/upload_button.png" srcset="../images/user_guide/browsing_marketplace/upload_button.png 2x" alt="Click *Upload*"/>

<img src="../images/user_guide/browsing_marketplace/upload_dialog.png" srcset="../images/user_guide/browsing_marketplace/upload_dialog.png 2x" alt="MAC upload dialog"/>

## Building a new mashup

If you followed the instructions documented in the "[Creating a new workspace](#creating-a-new-workspace)" section, you
should have a "History Info" workspace. Let's assume that we start from this point:

<img src="../images/user_guide/create_workspace/new_workspace.png" srcset="../images/user_guide/create_workspace/new_workspace.png 2x" alt="Starting point"/>

Go then to the Marketplace to choose among the components available in the catalogue those you want to use in your
mashup:

<img src="../images/user_guide/building_mashup/get_more_components.png" srcset="../images/user_guide/building_mashup/get_more_components.png 2x" alt="Button for searching more components"/>

To ensure that you find the required widgets/operators for this example mashup, go to the FIWARE Lab marketplace and
install them using the [_WireCloudUserGuide_ offering](https://store.lab.fiware.org/#/offering/458). You can also
download them using the following URLs:

-   [CoNWeT_simple-history-module2linear-graph_2.3.2.wgt](attachments/CoNWeT_simple-history-module2linear-graph_2.3.2.wgt)
-   [CoNWeT_ngsi-source_3.0.7.wgt](attachments/CoNWeT_ngsi-source_3.0.7.wgt)
-   [CoNWeT_ngsientity2poi_3.0.3.wgt](attachments/CoNWeT_ngsientity2poi_3.0.3.wgt)
-   [CoNWeT_map-viewer_2.5.8.wgt](attachments/CoNWeT_map-viewer_2.5.8.wgt)
-   [CoNWeT_linear-graph_3.0.0b3.wgt](attachments/CoNWeT_linear-graph_3.0.0b3.wgt)

Once installed, you should be able to see all the widgets/operators used in this example in the _My Resources_ view:

<img src="../images/user_guide/browsing_marketplace/my_resources.png" srcset="../images/user_guide/browsing_marketplace/my_resources.png 2x" alt="List of used components"/>

Go to the editor view and click on the _Add components_ button:

<img src="../images/user_guide/building_mashup/add_widget_button.png" srcset="../images/user_guide/building_mashup/add_widget_button.png 2x" alt="Click *Add conponents*"/>

Look for the _Linear Graph_ widget and click on the _Add to workspace_ button:

<img src="../images/user_guide/building_mashup/add_linear_graph.png" srcset="../images/user_guide/building_mashup/add_linear_graph.png 2x" alt="Click *Add to workspace*"/>

This will add the _Linear Graph_ widget into the dashboard, you can move and resize it until you obtain the desired
layout:

<img src="../images/user_guide/building_mashup/initial_linear_graph_layout.png" srcset="../images/user_guide/building_mashup/initial_linear_graph_layout.png 2x" alt="Initial *Linear Graph* layout"/>

Add the _Map Viewer_ widget to the dashboard following the same steps for adding the _Linear Graph_ widget. After
rearranging it you will be presented with the following view, which shows you the two widgets in the default tab. You
can see the tabs used in your workspace at the footer bar, and you can create new tabs to better organize the
distribution of the widgets in your mashup.

<img src="../images/user_guide/building_mashup/final_layout.png" srcset="../images/user_guide/building_mashup/final_layout.png 2x" alt="Final layout"/>

### Changing the settings of a widget

Once you have added the desired widgets to your mashup and you have placed and resized them to configure the information
dashboard of your choice, you can change their settings. To do so, go to the upper-right corner of the widget and click
the properties icon as shown in the following screenshot:

<img src="../images/user_guide/building_mashup/widget_menu_button.png" srcset="../images/user_guide/building_mashup/widget_menu_button.png 2x" alt="Widget *Menu* button"/>

You will then be presented with a dropdown menu with several options.

<img src="../images/user_guide/building_mashup/widget_menu_dropdown.png" srcset="../images/user_guide/building_mashup/widget_menu_dropdown.png 2x" alt="Widget menu dropdown"/>

-   **Rename** changes the widget name shown in workspace editor and wiring Editor views
-   **Reload** reloads the widget
-   **Upgrade/Downgrade** allows you to change the version of the widget
-   **Logs** shows a dialog with the log history of the widget
-   **Settings** shows a form for changing the settings of the current widget
-   **User's Manual** will open the widget documentation
-   **Full Dragboard** maximises the selected widget, so it will take up the full canvas area. This option becomes
    **Exit Full Dragboard** if the widget is already on "Full Dragboard" mode. In that case, this option will restore
    the size of the widget to the one it had before maximising it
-   **Extract from grid** lifts up the widget from the canvas, allowing you to place it wherever you want on the canvas,
    even on top of other widgets. This option becomes **Snap to grid** if the widget is currently outside the grid, in
    this case, this option docks the widget into the grid.

Finally, click on the **Settings** and you will be prompted with a customised dialog for the settings of the widget. In
this example, the _Map Viewer_ should be provided with initial location, zoom level and mark shadow radius to customise
the visualisation.

<img src="../images/user_guide/building_mashup/mapviewer_settings.png" srcset="../images/user_guide/building_mashup/mapviewer_settings.png 2x" alt="*Map Viewer* Settings"/>

As we have configure the initial position and the initial zoom, we need to reload the widget. To do so, we click again
on the properties icon and then on the _Reload_ option:

<img src="../images/user_guide/building_mashup/mapviewer_reload_entry.png" srcset="../images/user_guide/building_mashup/mapviewer_reload_entry.png 2x" alt="Reload option"/>

Now we have our widget centered in the new location, Santander, and using the configured initial zoom level.

<img src="../images/user_guide/building_mashup/mapviewer_configured.png" srcset="../images/user_guide/building_mashup/mapviewer_configured.png 2x" alt="MapViewer widget after being configured"/>

At this time, you have created a mashup with two individual widgets. The _Linear Graph_ widget is empty and need to be
wired with something that provides information to draw, and the _Map Viewer_ is a good option to show any kind of
"Points of Interest" and allow the user to select them easily.

<img src="../images/user_guide/building_mashup/workspace_mapviewer_configured.png" srcset="../images/user_guide/building_mashup/workspace_mapviewer_configured.png 2x" alt="Mashup with the map viewer configured"/>

### Wiring widgets and operators

Once you have chosen the desired widgets, you can wire them to enable their intercommunication and to achieve
coordinated behaviour. Widgets and operators in WireCloud, are capable of sending and/or receiving events and data
through well-identified ports called endpoints. When you connect two compatible endpoints, the second one (i.e. the
input or target endpoint) prepares to receive data flows and/or events coming from the first one (i.e. the output or
source endpoint).

#### Basic wiring concepts

To wire the widgets and add operators to your mashup go to the Wiring view of the tool:

<img src="../images/user_guide/building_mashup/wiring_button.png" srcset="../images/user_guide/building_mashup/wiring_button.png 2x" alt="Click *Wiring*"/>

You will then be presented with an empty wiring configuration (denoted by an empty canvas displaying a welcome message):

<img src="../images/user_guide/wiring/empty_wiring.png" srcset="../images/user_guide/wiring/empty_wiring.png 2x" alt="Emtpy wiring"/>

One of the most important characteristics that should be intrinsic to the design of widgets is that they must be as
generic as possible. For example, it makes much more sense to have a generic _Map Viewer_ widget that can be wired
through an operator to any source of information of your choice, than to have an specific one that has hard-coded the
source of data. Operators represents the means to achieve this generality, because they represents the means to
dynamically associate the widgets with the concrete services or sources of information you want to use in the context of
a particular mashup.

In this case, we have an _NGSI source_ operator that is going to provide the data information to the _Map Viewer_
widget. This kind of operators are called piping operators. So we have to add it to the wiring.

To do so, open the components side panel and search the _NGSI source_ operator, then click on the _Create_ button:

<img src="../images/user_guide/wiring/create_operator_button.png" srcset="../images/user_guide/wiring/create_operator_button.png 2x" alt="Click *Create*"/>

This will create an instance of that operator and will appear in the bottom of the box associated with the _NGSI Source_
operator. You can see that it is highlighted indicating that the new operator is not used in the wiring configuration.
All operators not used when leaving the wiring editor will be removed from the wiring configuration.

Now drag the operator from the operator list to the wiring canvas:

<img src="../images/user_guide/wiring/add_ngsisource_sidebar.png" srcset="../images/user_guide/wiring/add_ngsisource_sidebar.png 2x" alt="Recently created operator in the sidebar"/>

<img src="../images/user_guide/wiring/add_ngsisource_drag.png" srcset="../images/user_guide/wiring/add_ngsisource_drag.png 2x" alt="Drag the *NGSI Source* operator"/>

<img src="../images/user_guide/wiring/add_ngsisource_finish.png" srcset="../images/user_guide/wiring/add_ngsisource_finish.png 2x" alt="*NGSI Source* added to the wiring canvas"/>

Once added, we need to configure it so it knows what info to retrieve from the [Orion Context Broker] and from what
instance. To do so, click on the **Settings** menu entry:

<img src="../images/user_guide/wiring/ngsisource_settings.png" srcset="../images/user_guide/wiring/ngsisource_settings.png 2x" alt="NGSI Source Settings option"/>

And make sure the following configuration is used:

-   **NGSI server URL**: `http://orion.lab.fiware.org:1026/`
-   **NGSI proxy URL**: `https://ngsiproxy.lab.fiware.org`
-   **Use the FIWARE credentials of the user**: Enabled
-   **Use the FIWARE credentials of the workspace owner**: Disabled
-   **NGSI tenant/service:** Emtpy
-   **NGSI scope:** `/`
-   **NGSI entity types**: `Node, AMMS, Regulator`
-   **Id pattern**: Empty
-   **Monitored NGSI attributes**:
    `Latitud, Longitud, presence, batteryCharge, illuminance, ActivePower, ReactivePower, electricPotential, electricalCurrent`

Now, we have ready the source of information that is going to be presented in the _Map Viewer_ widget. So, the next step
is adding the _Map Viewer_ widget to the wiring canvas, this way we will be able to connect them. This is accomplished
in the same way we did with the _NGSI Source_ operator, but using the _Widget_ tab in the sidebar:

<img src="../images/user_guide/wiring/add_mapviewer_sidebar.png" srcset="../images/user_guide/wiring/add_mapviewer_sidebar.png 2x" alt="wiring/Wiring_NGSISource_MapViewer.png"/>

> **NOTE**: We have created the instance of the _Map Viewer_ widget in the editor view, but you can also create widget
> instances from the wiring editor using the _Create_ button:
>
> <img src="../images/user_guide/wiring/create_widget_button.png" srcset="../images/user_guide/wiring/create_widget_button.png 2x" alt="*Create* button"/>
>
> Remember to resize and place the new widget after exiting the wiring editor.

After adding the _Map Viewer_ widget into the wiring canvas, you should have something similiar to this:

<img src="../images/user_guide/wiring/wiring_after_adding_mapviewer.png" srcset="../images/user_guide/wiring/wiring_after_adding_mapviewer.png 2x" alt="Wiring diagram after adding the *Map Viewer* widget"/>

The wiring editor comes with a recommendation system for connections. For example, move the pointer to the _Provide
entity_ endpoint. You will see that the endpoint get highlighted, this means that the recommendation system is searching
for compatible endpoints. In this case there are no compatible endpoints.

<img src="../images/user_guide/wiring/missing_connection_recommendations.png" srcset="../images/user_guide/wiring/missing_connection_recommendations.png 2x" alt="Missing connection recommendations"/>

This is because the output of the _NGSI source_ cannot be connected directly with the _Map Viewer_ widget. We can use a
transform operator to convert the event data provided by the _NGSI source_ operator to the format used by the _Map
Viewer_ widget. In this example, the operator that is going to perform this transformation is called _NGSI Entity to
PoI_:

<img src="../images/user_guide/wiring/wiring_after_adding_ngsientity2poi.png" srcset="../images/user_guide/wiring/wiring_after_adding_ngsientity2poi.png 2x" alt="Wiring diagram after adding the *NGSI Entity to PoI* operator"/>

After adding the operator, we can move the pointer to the _Provide entity_ endpoint to see that now we have a connection
recommendation:

<img src="../images/user_guide/wiring/endpoint_recommendation.png" srcset="../images/user_guide/wiring/endpoint_recommendation.png 2x" alt="Connection recommendation over the *Provide entity* endpoint"/>

So, we can connect it. To do so, push down the mouse button on the _Provide entity_ endpoint and drag the arrow to the
_Entity_ endpoint:

<img src="../images/user_guide/wiring/ngsientity2poi_connection_dragging.png" srcset="../images/user_guide/wiring/ngsientity2poi_connection_dragging.png 2x" alt="Dragging a connection"/>
<img src="../images/user_guide/wiring/ngsientity2poi_connection_created.png" srcset="../images/user_guide/wiring/ngsientity2poi_connection_created.png 2x" alt="Created connection"/>

We have to connect also the _PoI_ endpoint of the _NGSI Entity To PoI_ operator to the _Insert/Update PoI_ endpoint on
the _Map Viewer_ widget:

<img src="../images/user_guide/wiring/wiring_after_connecting_ngsientity2poin_and_mapviewer.png" srcset="../images/user_guide/wiring/wiring_after_connecting_ngsientity2poin_and_mapviewer.png 2x" alt="Wiring diagram after connecting the *NGSI entity To PoI* operator and the *Map Viewer* widget"/>

Once again, we need to configure the _NGSI Entity To PoI_ operator, this is done in the same way as we have done with
the _NGSI Source_. In this case the values should be:

-   **Coordinates attribute**: `Latitud, Longitud`
-   **Marker Icon**: Empty

If you return to the _Editor_ view, you will see that the map widget has been updated and is showing the PoIs obtained
from the _NGSI source_ operator.

<img src="../images/user_guide/wiring/mapviewer_with_entities.png" srcset="../images/user_guide/wiring/mapviewer_with_entities.png 2x" alt="Map Viewer widget displaying shome PoIs"/>

You can use the _Map Viewer_ moving the viewport, selecting PoI's, etc. But in really, what we have is just the _Map
Viewer_ widget connected to a source of data, but using piping and transformation operators that is going to give us a
great flexibility.

<img src="../images/user_guide/wiring/mapviewer_entity_details.png" srcset="../images/user_guide/wiring/mapviewer_entity_details.png 2x" alt="Map Viewer widget displaying the details of an entity"/>

[orion context broker]: http://catalogue.fiware.org/enablers/publishsubscribe-context-broker-orion-context-broker

#### Other wiring common tasks

One of the most common operations is the task of getting the connections removed in the wiring. For example, when you
make some mistake for some reason, you can fix it by clicking the _Remove_ button that appears in the middle a of the
connection:

<img src="../images/user_guide/wiring/delete_arrow1.png" srcset="../images/user_guide/wiring/delete_arrow1.png 2x" alt="*Remove* button"/>

Sometimes what you want is to modify one of the connections. The Wiring Editor allows you to do this operation without
having to remove the connection and having to create a new one. To do so, you only have to select the connection and
drag the connection from the endpoint you want to modify:

<img src="../images/user_guide/wiring/modify_connection1.png" srcset="../images/user_guide/wiring/modify_connection1.png 2x" alt="How to modify a connection"/>
<img src="../images/user_guide/wiring/modify_connection2.png" srcset="../images/user_guide/wiring/modify_connection2.png 2x" alt="Dragging the new connection"/>
<img src="../images/user_guide/wiring/modify_connection3.png" srcset="../images/user_guide/wiring/modify_connection3.png 2x" alt="Connection once modified"/>
<img src="../images/user_guide/wiring/modify_connection4.png" srcset="../images/user_guide/wiring/modify_connection4.png 2x" alt="Connection once modified"/>

Another common task is to change the shape of connections. To do so, you have to click on the _Customize_ option of the
connection:

<img src="../images/user_guide/wiring/reshape_arrow_pre.png" srcset="../images/user_guide/wiring/reshape_arrow_pre.png 2x" alt="*Customize* option"/>

Once enabled, you only have to move the handles that appear to modify the shape of the connection.

<img src="../images/user_guide/wiring/reshape_arrow1.png" srcset="../images/user_guide/wiring/reshape_arrow1.png 2x" alt="wiring/reshape_arrow1.png"/>
<img src="../images/user_guide/wiring/reshape_arrow2.png" srcset="../images/user_guide/wiring/reshape_arrow2.png 2x" alt="wiring/reshape_arrow2.png"/>

If you want to stop customising the connection, click outside the connection or use the _Stop Customizing_ option:

<img src="../images/user_guide/wiring/reshape_arrow_stop.png" srcset="../images/user_guide/wiring/reshape_arrow_stop.png 2x" alt="*Stop Customizing* option"/>

You can also minimize operators with the intention of improving space usage. This can be accomplished using the
_Collapse_ option that appears in the component menu:

<img src="../images/user_guide/wiring/minimize_option.png" srcset="../images/user_guide/wiring/minimize_option.png 2x" alt="*Collapse* option"/>
<img src="../images/user_guide/wiring/collapsed_operators.png" srcset="../images/user_guide/wiring/collapsed_operators.png 2x" alt="Collapsed operators"/>

#### Cloncluding our example

Continue wiring the rest of the widgets in your mashup following your intuition, the documentation and the contextual
help offered by each widget/operator. Anyway, just in case you have difficulties, you can see the final result in the
following screenshot:

<img src="../images/user_guide/wiring/final_wiring.png" srcset="../images/user_guide/wiring/final_wiring.png 2x" alt="Final wiring configuration"/>

Now you can play with your new workspace.

<img src="../images/user_guide/wiring/final_mashup.png" srcset="../images/user_guide/wiring/final_mashup.png 2x" alt="Final mashup"/>

<img src="../images/user_guide/wiring/linear_graph_zoom1.png" srcset="../images/user_guide/wiring/linear_graph_zoom1.png 2x" alt="How to select an area in the linear graph widget"/>

<img src="../images/user_guide/wiring/linear_graph_zoom2.png" srcset="../images/user_guide/wiring/linear_graph_zoom2.png 2x" alt="Final mashup linear graph with zoom"/>

## Behaviour Oriented Wiring

Starting at WireCloud 0.8.0, you can create wiring configurations by means of compositing several _behaviours_.

A _behaviour_ is a set of components jointly with the connections established between them for adding a feature or
behaviour to the application mashup. For example, we can split the wiring configuration used by the dashboard created on
the previous section into two behaviours:

-   The first one can be called: **Show lampposts on map**. This behaviour is composed of the `NGSI Source`,
    `NGSI Entity To PoI` and `Map Viewer` components as well as the connections between those components:

    <img src="../images/user_guide/behaviour_oriented_wiring/santander_behaviour1.png" srcset="../images/user_guide/behaviour_oriented_wiring/santander_behaviour1.png 2x" alt="*Show lampposts on map* behaviour (Santander example)"/>

-   The second one can be called: **Show lamppost details**. This behaviour is composed of the `Map Viewer`,
    `History Module to Linear Graph` and `Linear Graph` components as well as the connections between those components:

    <img src="../images/user_guide/behaviour_oriented_wiring/santander_behaviour2.png" srcset="../images/user_guide/behaviour_oriented_wiring/santander_behaviour2.png 2x" alt="*Show lampposts details* behaviour (Santander example)"/>

> Take into account that components and connections can be present in more than one behaviour. For example, in the
> previous example the _Map Viewer_ widgets was used in both behaviours.

WireCloud will continue supporting the creation of application mashups without having to use the behaviour methodology.
However, by using this brand new feature WireCloud provides several benefits:

-   Splitting the wiring configuration into severals behaviours helps to provide a more organised and structured diagram
    as well as a way for documenting the reasons for using and connecting components in a particular way.
-   Ignoring the fact that using the behaviour oriented wiring has a harder learning curve, using it eases the
    development of wiring configurations as it allows you to develop them using several phases.
-   This documentation is also a good starting point for novice developers and experiences developers wanting to
    replicate the behaviour of a given application mashup. They only need to access the application mashups developed by
    other users and learn how the wiring configuration works by reading the behaviour descriptions.

### Enabling/disabling the behaviour engine

Before using the Behaviour Oriented methodology, it must be enabled. To do so, go to the wiring editor view and click on
the _List behaviours_ button.

<img src="../images/user_guide/behaviour_oriented_wiring/list_behaviours_button.png" srcset="../images/user_guide/behaviour_oriented_wiring/list_behaviours_button.png 2x" alt="*List behaviours* button"/>

This will display a side panel, currently without any behaviour. Click on the _Enable_ button:

<img src="../images/user_guide/behaviour_oriented_wiring/enable_behaviours_button.png" srcset="../images/user_guide/behaviour_oriented_wiring/enable_behaviours_button.png 2x" alt="*Enable* behaviour engine button"/>

Once enabled, you will have a first behaviour with all the components and connections previously added into the wiring
configuration.

> _Note:_ You can always go back to not use the behaviour engine by clicking on the _disable_ button.
>
> <img src="../images/user_guide/behaviour_oriented_wiring/disable_behaviours_button.png" srcset="../images/user_guide/behaviour_oriented_wiring/disable_behaviours_button.png 2x" alt="*Disable* behaviour engine button"/>
>
> If you disable the behaviour engine, all components and connections will be squashed into a single view.
>
> Take into account that this operation cannot be undone.

### Using the behaviour oriented wiring user interface

<img src="../images/user_guide/behaviour_oriented_wiring/general_aspect.png" srcset="../images/user_guide/behaviour_oriented_wiring/general_aspect.png 2x" alt="General aspect of the behaviour oriented wiring user interface"/>

This is the look of the wiring editor interface when the behaviour engine is enabled. Each of the panels in the
_Behaviours_ section represents a behaviour and displays the name and the description of the represented behaviour.

Noticed that one of the behaviours is highlighted, this is because you can edit only a behaviour at a time, this is the
active behaviour. The name of the active behaviour is also displayed in the footer of the wiring editor, so you can know
which is the active behaviour all the time (i.e. including when the behaviour list panel is hidden). Changing the active
behaviour is just a matter of clicking on the panel representing the behaviour.

The other important thing to notice is that there are some "faded" components inside the wiring canvas (e.g. the _Search
For_ widget). Background components are faded because they do not form part of the active behaviour, although they form
part of other behaviours.

#### Adding components and creating connections

You can add new components into a behaviour in the same way they are added when the behaviour engine is disabled. That
is, by draging them from the component side panel. The only thing you have to take into account is that those components
are only added into the active behaviour.

If you want to use a component already involved in other behaviour, you can use the _Add_ button of the background
component you want to include:

<img src="../images/user_guide/behaviour_oriented_wiring/component_share_button.png" srcset="../images/user_guide/behaviour_oriented_wiring/component_share_button.png 2x" alt="Component *Add* button"/>

The same applies to the connections, if you create a new connection, that connection is added only into the active
behaviour. If you want to include a connection already available on other behaviour, you can click on the _Add_ button
of the background connection:

<img src="../images/user_guide/behaviour_oriented_wiring/connection_share_button.png" srcset="../images/user_guide/behaviour_oriented_wiring/connection_share_button.png 2x" alt="Connection *Add* button"/>

> **Note:** If a background connection implies background components, adding that connection will also add that
> background components into the active behaviour.

#### Creating a new behaviour

You can create new behaviours by clicking on the _Create behaviour_ button available on the list behaviour side panel:

<img src="../images/user_guide/behaviour_oriented_wiring/create_behaviour_button.png" srcset="../images/user_guide/behaviour_oriented_wiring/create_behaviour_button.png 2x" alt="*Create* behaviour button"/>

<img src="../images/user_guide/behaviour_oriented_wiring/new_behaviour_dialog.png" srcset="../images/user_guide/behaviour_oriented_wiring/new_behaviour_dialog.png 2x" alt="*New Behaviour* dialog"/>

If you want to edit the title and the description of a behaviour, you can open the preferences menu and click on the
_Settings_ option:

<img src="../images/user_guide/behaviour_oriented_wiring/behaviour_settings_option.png" srcset="../images/user_guide/behaviour_oriented_wiring/behaviour_settings_option.png 2x" alt="Behaviour *Settings* option"/>

#### Removing behaviours

You can always remove a behaviour at any time, except when there is only one behaviour (at least one behaviour must be
present in a wiring configuration when the behaviour engine is enabled). To do so, click on the _Remove_ button of the
behaviour you want to remove:

<img src="../images/user_guide/behaviour_oriented_wiring/remove_behaviour_button.png" srcset="../images/user_guide/behaviour_oriented_wiring/remove_behaviour_button.png 2x" alt="*Remove* behaviour button"/>

> **Note:** All the components not used on other behaviour will be removed from the wiring configuration. Also take into
> account that this operation cannot be undone.

#### Removing components and connections

To remove a component from a behaviour, click on the _Delete_ button:

<img src="../images/user_guide/behaviour_oriented_wiring/remove_component.png" srcset="../images/user_guide/behaviour_oriented_wiring/remove_component.png 2x" alt="*Remove* component button"/>

Components are only totaly removed from the wiring configuration when they are not used in any of the available
behaviours.

The same applies to connections, you can remove them from the active behaviour using the _Delete_ button:

<img src="../images/user_guide/behaviour_oriented_wiring/remove_connection.png" srcset="../images/user_guide/behaviour_oriented_wiring/remove_connection.png 2x" alt="*Remove* connection button"/>

Again, connections are remove from the wiring configuration when the are removed from all the behaviours.

#### Ordering behaviours

The main purpose of the behaviour engine is to be able to document the wiring configuration and, in that sense, humans
tend to expose the ideas using a particular order. Said that, the Wiring Editor allows you to change the order used in
the behaviour list, but that order will not affet to the wiring engine.

To change the behaviour order, you only have to click on the _Order behaviours_ button:

<img src="../images/user_guide/behaviour_oriented_wiring/order_behaviours_button.png" srcset="../images/user_guide/behaviour_oriented_wiring/order_behaviours_button.png 2x" alt="*Remove* connection button"/>

Once activated the ordering mode, you will be able to drag and drop the behaviour boxes:

<img src="../images/user_guide/behaviour_oriented_wiring/ordering_behaviours.png" srcset="../images/user_guide/behaviour_oriented_wiring/ordering_behaviours.png 2x" alt="Ordering behaviours"/>

Finally, click again on the _Order behaviours_ button to exit the ordering mode:

<img src="../images/user_guide/behaviour_oriented_wiring/exit_order_behaviours_mode.png" srcset="../images/user_guide/behaviour_oriented_wiring/exit_order_behaviours_mode.png 2x" alt="Exit the ordering mode"/>

> **Note:** Anyway, you can also exit from the behaviour ordering mode by closing the sidebar or by opening the seach
> component form inside the sidebar.

## Sharing your mashups

Workspaces can be made public by means of modifying their settings as Follows:

1.  Click on the workspace menu button and click _Share_:
    <img src="../images/user_guide/wiring/share_workspace_entry.png" srcset="../images/user_guide/wiring/share_workspace_entry.png 2x" alt="*Share* option"/>

2.  You will be presented with a dialog for editing the sharing configuration of the workspace:
    <img src="../images/user_guide/wiring/share_workspace_dialog.png" srcset="../images/user_guide/wiring/share_workspace_dialog.png 2x" alt="Sharing settings dialog"/>

After making a workspace public, you will be able to share the workspace URL with other users.

### Embedding mashups inside other web pages

All workspaces can be embedded, but take into account that access rules are the same that applies when using the
workspace directly from WireCloud. If you don't make the workspace public, you will require users to be logged in
WireCloud and having enough access permission. This make changing sharing settings of the workspace a first step before
embedding mashups into other web pages.

You can also obtain the code you have to copy & paste into other web pages following those steps:

1.  Click on the workspace menu button and click _Embed_:
    <img src="../images/user_guide/wiring/embed_workspace_entry.png" srcset="../images/user_guide/wiring/embed_workspace_entry.png 2x" alt="*Embed* workspace option"/>

1.  A new window showing you the code for embedding the mashup. Copy & paste it into you HTML document.
    <img src="../images/user_guide/wiring/embed_workspace_dialog.png" srcset="../images/user_guide/wiring/embed_workspace_dialog.png 2x" alt="Embed workspace dialog"/>

## Additional sources of information

See the [Application Mashup GE fundamentals course](http://edu.fiware.org/course/view.php?id=53) at the FIWARE Academy
for detailed documentation on how to use WireCloud from different perspectives (end-user, developer and administrators).
Another source of information is [the WireCloud website](https://conwet.fi.upm.es/wirecloud/) where you can find more
general information and other interesting resources such as demo videos.
