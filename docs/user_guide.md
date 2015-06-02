User Guide
==========

Web mashups integrate heterogeneous data, application logic, and UI
components (widgets/gadgets) sourced from the Web to create new coherent
and value-adding composite applications.

Web mashups are targeted at leveraging the "long tail" of the Web of
Services by exploiting rapid development, DIY, and shareability. They
typically serve a specific situational (i.e. immediate, short-lived,
customised, specific) need, frequently with high potential for reuse. Is
this "situational" character which preclude them to be offered as
'off-the-self' functionality by solution providers.

Web mashups can be manually developed using conventional web programming
technologies (e.g. see <http://programmableweb.com>). But this approach
fails to take full advantage of the approach. Mashup tools and platforms
like WireCloud aim at development paradigms that do not require
programming skills and, hence, address end users, thus leveraging the
long tail of the Web of Services.

WireCloud builds on cutting-edge end-user development, RIA and semantic
technologies to offer a next-generation end-user centred mashup platform
aimed at leveraging the long tail of the Internet of Services.

Key Features
------------

WireCloud helps end users to innovate through experimentation by
choosing the best suited widgets and prefab mashups (a.k.a. mashup-lets)
for your devised mashup from a vast, ever-growing distributed catalogue.

WireCloud offers its main features through two integrated tools:

1.  The **wiring editor**, which allows you to easily connect widgets in
    a mashup to create a full-fledged dashboard with RIA functionality
2.  The **piping editor**, which allows you to easily connect widgets to
    back-end services or data sources through an extendable set of
    operators, including filters, aggregators, adapters, etc.

Besides, WireCloud allows you to easily share your newly created mashup
with other colleagues and users. Comment it, tag it and rate it to
foster discoverability and shareability. WireCloud helps to build a
strong community by commenting, tagging and rating others' widgets,
operators and mashups. The platform will also do its best to complement
your contribution.

Creating a new workspace
------------------------

Mashups in WireCloud are built in the context of **workspaces**. A
workspace consists of the set of widgets and operators that can be
mashed-up, even spanning multiple tabs. Widgets and operators in a
workspace can share data though data flow- or event-based mechanisms.

The workspace in use is shown in the upper area of the screen. It
resembles the well-known REST nomenclature. For example, the following
screenshot shows a workspace named "Workspace", pertaining the user
"admin" and running in the FIWARE Lab’s instance of WireCloud, i.e. it
is named admin/Workspace.

![Wirecloud_UG_1.png](images/user_guide/Wirecloud_UG_1.png)

Near the workspace name there is a button that you can click on to
expand the workspace dropdown menu:

![Wirecloud_UG_3.png](images/user_guide/Wirecloud_UG_3.png)

Once expanded, the menu shows a list of the already created workspaces
(see *Workspace*, *My Multimedia Workspace* and *IssueTrouble* in the
figure above) that allows you to quickly switch between them, followed
by a list of options:

-   **Rename** changes the name of the current workspace
-   **Settings** changes the settings of the current workspace
-   **Remove** deletes the current workspace
-   **New workspace** creates a new workspace
-   **Embed** shows info about how to embed current workspace in other
    web pages
-   **Upload to my resources** allows you to save the current
    workspace to the local catalogue for later usage

If you want to create a new workspace named "History Info", choose "New
workspace" in the dropdown menu:

![Wirecloud_UG_4.png](images/user_guide/Wirecloud_UG_4.png)

A dialog will pop up requiring a name for the new workspace. Type the
desired name and click the accept button:

![Wirecloud_UG_5.png](images/user_guide/Wirecloud_UG_5.png)

Once accepted, the name of the new workspace is shown in the upper area of
the window:

![Wirecloud_UG_HistoryInfoWorkspace.png](images/user_guide/Wirecloud_UG_HistoryInfoWorkspace.png)

The following screenshot show the "Settings" menu, where you can set
workspace features:

![Wirecloud_UG_WorkspaceSettings.png](images/user_guide/Wirecloud_UG_WorkspaceSettings.png)

Browsing the Marketplace
------------------------

### Marketplaces and Stores

A mashup tool like WireCloud must support access to a **marketplace**
made up of **stores**, where people can offer and deal with services
made accessible through widgets and operators, like goods, and finally
mashup them to create value added services and applications.

On the marketplace you can quickly find and compare widgets and
operators, which enable you to attend an industry-ecosystem better than
before. Widgets, operators, and even pre-built mashups become tradable
goods, which can be offered and acquired on Internet based marketplaces.
Partner companies and other users can combine existing services to new
services whereby new business models will be incurred and the value
added chain is extended.

We differentiate the marketplace from a store. While a store is owned by
a store owner who has full control over the specific (limited) widget,
operator and mashup portfolio and offerings, a marketplace is a platform
for many stores to make their offerings available to a broader audience
and enable consumers to search and compare widgets, operators and
pre-built mashups and find the store, where to buy. The final business
transaction (buying) is done at the store and the whole back office
process is handled by the store.

The following figure shows a screenshot of WireCloud where you can see
the FIWARE Lab marketplace and the different stores made available through
it.

![Wirecloud_Marketplace_plus_stores.png](images/user_guide/Wirecloud_Marketplace_plus_stores.png)

### Managing marketplaces

When looking for an offer of widgets, operators and mashups, you first
need to choose a marketplace. Use the dropdown menu shown in the
workspace path for this purpose.

![Wirecloud_UG_8.png](images/user_guide/Wirecloud_UG_8.png)

As shown in the previous screenshot, this menu allows you to choose
among the different marketplaces you have access to. To add a new
marketplace, you only need to provide its endpoint (URL). You can also
delete the current markeplace through the "Delete Marketplace" option in
the context menu.

If you have only Local marketplace available, you can add the FIWARE Lab
marketplace using "Add new marketplace", as shown in the following
screenshots.
![Wirecloud_UG_AddNewMarketplace.png](images/user_guide/Wirecloud_UG_AddNewMarketplace.png)
![Wirecloud_UG_AddingFiwareMarketplace.png](images/user_guide/Wirecloud_UG_AddingFiwareMarketplace.png)

WireCloud offers a built-in local catalogue called "My Resources", which
allows you to search among the widgets, operators and mashups currently
available for the user. The following figure shows a screenshot of the
"My Resources" for a user in a given instance of WireCloud.

![Wirecloud_UG_9.png](images/user_guide/Wirecloud_UG_9.png)

If you are a widget developer with brand new widgets to share, or you
just have downloaded a WireCloud-compliant widget from anywhere, you can
easily upload your new widgets to the built-in local catalogue through
the "Upload" button available on the "My Resources" view.

![Wirecloud_UG_UploadButton.png](images/user_guide/Wirecloud_UG_UploadButton.png)
![Wirecloud_UG_uploadNew.png](images/user_guide/Wirecloud_UG_uploadNew.png)

### Choosing an available store

Stores in WireCloud are associated to a specific marketplace. Therefore,
to surf a store you first need to choose the FIWARE Lab marketplace that
publishes it. In the following figure, the user uses the dropdown menu
to choose FIWARE Lab’s marketplace:

![Wirecloud_UG_10.png](images/user_guide/Wirecloud_UG_10.png)

Once in the FIWARE Lab marketplace, the store dropdown menu shows all
its available stores (CoNWeT, WStore FIWARE Lab and Another Store). The
following figure shows the options available in the stores dropdown
menu:

![Wirecloud_Marketplace_plus_stores.png](images/user_guide/Wirecloud_Marketplace_plus_stores.png)

Last, but not least, you can return to surf the entire marketplace and
see the global offer at a glance by selecting the “All stores” option.

### Publishing mashable application components into Stores

1.  Go to the local catalogue:
    ![Wirecloud_switch_to_local.png](images/user_guide/Wirecloud_switch_to_local.png)

1.  Open the mashable application component details clicking on it:
    ![Wirecloud_open_details.png](images/user_guide/Wirecloud_open_details.png)

1.  Click on Publish:
     ![Wirecloud_click_publish.png](images/user_guide/Wirecloud_click_publish.png)

1.  Check the marketplace and the Store where the mashable application
    component is going to be uploaded
    ![Wirecloud_publish_resource_store_select.png](images/user_guide/Wirecloud_publish_resource_store_select.png)

1.  That's all!. Now you will be able to create new offerings at the
    selected Store using the uploaded resource. See the [WStore
    documentation](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Store_-_W-Store_-_User_and_Programmer_Guide#Creating_an_offering)
    for more information on how to create offering using the uploaded
    resources.

Building a new mashup
---------------------

If you followed the instructions documented in the "[Creating a new
workspace](#Creating_a_new_workspace)" section, you should
have a "History Info" workspace. Let's assume that we start from this
point:

![Wirecloud_UG_HistoryInfoWorkspace.png](images/user_guide/Wirecloud_UG_HistoryInfoWorkspace.png)

Go then to the Marketplace to choose among the widgets available in the
catalogue those you want to use in your mashup:

![Wirecloud_UG_17.png](images/user_guide/Wirecloud_UG_17.png)

To ensure that you find the required widgets/operators for this example
mashup, go to the FIWARE Lab marketplace and install them using the
[WireCloudUserGuide offering](https://store.lab.fiware.org/offering/CoNWeT/WireCloudUserGuide/1.0).
You can also download them using the following URLs:

-   [CoNWeT_simple-history-module2linear-graph_2.3.2.wgt](https://wirecloud.conwet.etsiinf.upm.es/slides/attachments/CoNWeT_simple-history-module2linear-graph_2.3.2.wgt)
-   [CoNWeT_ngsi-source_3.0.2.wgt](https://wirecloud.conwet.etsiinf.upm.es/slides/attachments/CoNWeT_ngsi-source_3.0.2.wgt)
-   [CoNWeT_ngsientity2poi_3.0.3.wgt](https://wirecloud.conwet.etsiinf.upm.es/slides/attachments/CoNWeT_ngsientity2poi_3.0.3.wgt)
-   [CoNWeT_map-viewer_2.5.6.wgt](https://wirecloud.conwet.etsiinf.upm.es/slides/attachments/CoNWeT_map-viewer_2.5.3.wgt)
-   [CoNWeT_linear-graph_3.0.0b3.wgt](https://wirecloud.conwet.etsiinf.upm.es/slides/attachments/CoNWeT_linear-graph_3.0.0b3.wgt)

Once installed, you should be able to see all the widgets/operators used
in this example in the "My Resources" view:

![Wirecloud_UG_9.png](images/user_guide/Wirecloud_UG_9.png)

Go to the editor view and click on the "Add widget" button:

![Wirecloud_UG_19.png](images/user_guide/Wirecloud_UG_19.png)

Look for the *Linear Graph* widget and click on the "Add to workspace"
button:

![Wirecloud_UG_20.png](images/user_guide/Wirecloud_UG_20.png)

This will add the *Linear Graph* widget into the dashboard, you can move
and resize it until you obtain the desired layout:

![Wirecloud_UG_21.png](images/user_guide/Wirecloud_UG_21.png)

Add the "Map Viewer" widget to the dashboard following the same steps
for adding the *Linear Graph* widget. After rearranging it you will be
presented with the following view, which shows you the two widgets in
the default tab. You can see the tabs used in your workspace at the
footer bar, and you can create new tabs to better organize the
distribution of the widgets in your mashup.

![Wirecloud_UG_22.png](images/user_guide/Wirecloud_UG_22.png)

### Changing the settings of a widget

Once you have added the desired widgets to your mashup and you have
placed and resized them to configure the information dashboard of your
choice, you can change their settings. To do so, go to the upper-right
corner of the widget and click the properties icon as shown in the
following screen shot

![Wirecloud_UG_23.png](images/user_guide/Wirecloud_UG_23.png)

You will then be presented with a dropdown menu with several options.

![Wirecloud_UG_24.png](images/user_guide/Wirecloud_UG_24.png)

-   **Rename** changes the widget name shown in workspace editor and
    wiring Editor views
-   **Settings** shows a form for changing the settings of the current
    widget
-   **Log** shows a dialog with the log history of the widget
-   **Reload** reloads the widget
-   **User's Manual** will open the widget documentation
-   **Full Dragboard** maximises the selected widget, so it will take up
    the full canvas area. This option becomes **Exit Full Dragboard** if
    the widget is already on "Full Dragboard" mode. In that case, this
    option will restore the size of the widget to the one it had before
    maximising it
-   **Extract from grid** lifts up the widget from the canvas, allowing
    you to place it wherever you want on the canvas, even on top of
    other widgets. This option becomes **Snap to grid** if the widget is
    currently outside the grid, in this case, this option docks the
    widget into the grid.W

Finally, click on the settings and you will be prompted with a
customised dialog for the settings of the widget. In this example, the
*Map Viewer* should be provided with initial location, zoom level and
mark shadow radius to customise the visualisation.

![Wirecloud_UG_25.png](images/user_guide/Wirecloud_UG_25.png)

After configuring the settings, the widget will show the new location,
Santander, with the new zoom.

![Wirecloud_UG_26.png](images/user_guide/Wirecloud_UG_26.png)

At this time, you have created a mashup with two individual widgets. The
Linear Graph widget is empty and need to be wired with something that
provides information to draw, and the Map Viewer is a good option to
show any kind of "Points of Interest" and allow the user to select them
easily.

![Wirecloud_UG_27.png](images/user_guide/Wirecloud_UG_27.png)

### Wiring widgets and operators

Once you have chosen the desired widgets, you can wire them to enable
their intercommunication and to achieve coordinated behaviour. Widgets
and operators in WireCloud, are capable of sending and/or receiving
events and data through well-identified ports called endpoints. When you
connect two compatible endpoints, the second one (i.e. the input or
target endpoint) prepares to receive data flows and/or events coming
from the first one (i.e. the output or source endpoint).

#### Basic wiring concepts

To wire the widgets and add operators to your mashup go to the Wiring
view of the tool:

![Wirecloud_UG_28.png](images/user_guide/Wirecloud_UG_28.png)

You will then be presented with the set of widgets currently added to
the workspace and the set of operators currently available:

![Wirecloud_UG_Empty_Wiring_Operators.png](images/user_guide/Wirecloud_UG_Empty_Wiring_Operators.png)

One of the most important characteristics that should be intrinsic to
the design of widgets is that they must be as generic as possible. For
example, it makes much more sense to have a generic Map Viewer widget
that can be wired through an operator to any source of information of
your choice, than to have an specific one that has hard-coded the source
of data. Operators represents the means to achieve this generality,
because they represents the means to dynamically associate the widgets
with the concrete services or sources of information you want to use in
the context of a particular mashup.

In this case, we have an *NGSI source* operator that is going to
provide the data information to the *Map Viewer* widget. This kind of
operators are called piping operators. So we have to add it to the
wiring. To do so, drag the operator from the operator list to wiring
canvas:

![Wirecloud_UG_Wiring_NGSISource_drag.png](images/user_guide/Wirecloud_UG_Wiring_NGSISource_drag.png)
![Wirecloud_UG_Wiring_NGSISource.png](images/user_guide/Wirecloud_UG_Wiring_NGSISource.png)

Now, we have the source of information that is going to be presented in
the *Map Viewer* widget. So we need to add it to the wiring status
following the same process for the operator, but dragging the widget
instead of the operator:

![Wirecloud_UG_Wiring_NGSISource_MapViewer.png](images/user_guide/Wirecloud_UG_Wiring_NGSISource_MapViewer.png)

The wiring editor comes with a recommendation system for connections.
For example, move the pointer to the *Provide entity* endpoint. You will
see that the endpoint get highlighted, this means that te recommendation
system is searching for compatible endpoints. In this case there are no
compatible endpoints.

![Wirecloud_UG_Wiring_NGSISource_MapViewer_rec.png](images/user_guide/Wirecloud_UG_Wiring_NGSISource_MapViewer_rec.png)

This is because the output of the *NGSI source* cannot be connected
directly with the *Map Viewer* widget. We can use a transform operator
to convert the event data provided by the *NGSI source* operator to
the format used by the *Map Viewer* widget. In this example, the
operator that is going to perform this transformation is *Entity to
PoI*:

![Wirecloud_UG_Wiring_NGSIEntity2PoI.png](images/user_guide/Wirecloud_UG_Wiring_NGSIEntity2PoI.png)

After adding the operator, we can move the pointer to the *Provide
entity* endpoint to see that now we have a connection recommendation:

![Wirecloud_UG_Wiring_NGSIEntity2PoI_rec.png](images/user_guide/Wirecloud_UG_Wiring_NGSIEntity2PoI_rec.png)

So, we can connect it. To do so, push down the mouse button on the
*Provide entity* endpoint and drag the arrow to the *Entity* endpoint:

![Wirecloud_UG_Wiring_NGSIEntity2PoI_connection.png](images/user_guide/Wirecloud_UG_Wiring_NGSIEntity2PoI_connection.png)
![Wirecloud_UG_Wiring_NGSIEntity2PoI_c_done.png](images/user_guide/Wirecloud_UG_Wiring_NGSIEntity2PoI_c_done.png)

And we can also connect also the *PoI* endpoint of the *NGSI Entity To PoI*
operator to the *Insert/Update PoI* endpoint on the *Map Viewer* widget:

![Wirecloud_UG_Wiring_End_1st_ph.png](images/user_guide/Wirecloud_UG_Wiring_End_1st_ph.png)

If you return to the *Editor* view, you will see that the map widget has
been updated and is showing the PoIs obtained from the *NGSI source*
operator.

![Wirecloud_UG_32.png](images/user_guide/Wirecloud_UG_32.png)

You can use the *Map Viewer* moving the viewport, selecting PoI's, etc.
But in really, what we have is just the *Map Viewer* widget connected to
a source of data, but using piping and transformation operators that is
going to give us a great flexibility.

![Wirecloud_UG_MapViewerWithEntities.png](images/user_guide/Wirecloud_UG_MapViewerWithEntities.png)


#### Other wiring common tasks

One of the most common operations is the task of getting the connections
removed in the wiring. For example, when you make some mistake for some
reason, you can fix it by selecting the connection (by clicking on it)
and then by clicking the red dot that appears in the middle of it.

![Wirecloud_UG_delete_arrow1.png](images/user_guide/Wirecloud_UG_delete_arrow1.png)
![Wirecloud_UG_delete_arrow2.png](images/user_guide/Wirecloud_UG_delete_arrow2.png)

Another common task is to change the shape of connections. This can be
accomplished by moving the handles that appear when they are selected.

![Wirecloud_UG_reshape_arrow1.png](images/user_guide/Wirecloud_UG_reshape_arrow1.png)
![Wirecloud_UG_reshape_arrow2.png](images/user_guide/Wirecloud_UG_reshape_arrow2.png)

You can also minimize operators with the intention of improving space
usage. This can be accomplished using the "Minimize" option that appears
in the Widget's menu:

![Wirecloud_UG_minimize_option.png](images/user_guide/Wirecloud_UG_minimize_option.png)
![Wirecloud_UG_33.png](images/user_guide/Wirecloud_UG_33.png)

#### Cloncluding our example

Continue wiring the rest of the widgets in your mashup following your
intuition, the documentation and the contextual help offered by each
widget/operator. Anyway, just in case you have difficulties, you can see
the final result in the following screenshot:

![Wirecloud_UG_FinalWiring.png](images/user_guide/Wirecloud_UG_FinalWiring.png)

Operators, like widget has also settings that can be modified using the
following steps:

![Wirecloud_UG_HistoryOperatorSettings1.png](images/user_guide/Wirecloud_UG_HistoryOperatorSettings1.png)
![Wirecloud_UG_HistoryOperatorSettings2.png](images/user_guide/Wirecloud_UG_HistoryOperatorSettings2.png)

Now you can play with your new workspace.

![Wirecloud_UG_34.png](images/user_guide/Wirecloud_UG_34.png)
![Wirecloud_UG_35.png](images/user_guide/Wirecloud_UG_35.png)
![Wirecloud_UG_LinearGraphZoom1.png](images/user_guide/Wirecloud_UG_LinearGraphZoom1.png)

Sharing your mashups
--------------------

Workspaces can be made public by means of modifying their settings as
Follows:

1.  Click on the workspace menu button and click *Settings*:
    ![Wirecloud_UG_Public_Workspace_Menu.png](images/user_guide/Wirecloud_UG_Public_Workspace_Menu.png)

1.  You will be presented with a dialog for editing workspace's
    settings:
    ![Wirecloud_UG_Public_Workspace_Settings.png](images/user_guide/Wirecloud_UG_Public_Workspace_Settings.png)

After making a workspace public, you will be able to share the workspace
URL with other users.

### Embedding mashups inside other web pages

All workspaces can be embedded, but take into account that access rules
are the same that applies when using the workspace directly from
WireCloud. If you don't make the workspace public, you will require
users to be logged in WireCloud and having enough access permission.
This make changing sharing settings of the workspace a first step before
embedding mashups into other web pages.

You can also obtain the code you have to copy & paste into other web
pages following those steps:

1.  Click on the workspace menu button and click *Embed*:
    ![Wirecloud_UG_Embed_Workspace_Menu.png](images/user_guide/Wirecloud_UG_Embed_Workspace_Menu.png)

1.  A new window showing you the code for embedding the mashup. Copy &
    paste it into you HTML document.
    ![Wirecloud_UG_Embed_Dialog.png](images/user_guide/Wirecloud_UG_Embed_Dialog.png)

Additional sources of information
---------------------------------

See the [Application Mashup GE fundamentals
course](http://edu.fiware.org/course/view.php?id=53) at the FIWARE
Academy for detailed documentation on how to use WireCloud from
different perspectives (end-user, developer and administrators). Another
source of information is [the WireCloud
website](https://conwet.fi.upm.es/wirecloud/) where you can find more
general information and other interesting resources such as demo videos.
