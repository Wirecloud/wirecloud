var WorkspaceItems = function(handler) {
    StyledElements.DynamicMenuItems.call(this);

    this.handler = handler;
};
WorkspaceItems.prototype = new StyledElements.DynamicMenuItems();

WorkspaceItems.prototype.build = function() {
    var workspace_keys, i, items, workspace;

    items = [];

    workspace_keys = OpManagerFactory.getInstance().workSpaceInstances.keys();
    for (i = 0; i < workspace_keys.length; i += 1) {
        workspace = OpManagerFactory.getInstance().workSpaceInstances.get(workspace_keys[i]);
        items.push(new StyledElements.MenuItem(
            workspace.getName(),
            this.handler.bind(this, workspace)
        ));
    }

    return items;
};
