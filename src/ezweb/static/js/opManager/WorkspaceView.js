var WorkspaceView = function (id, options) {
    options.id = 'workspace';
    StyledElements.Alternative.call(this, id, options);
}
WorkspaceView.prototype = new StyledElements.Alternative();

WorkspaceView.prototype.view_name = 'workspace';
WorkspaceView.prototype.getSubMenuItems = function () {
    return WorkSpace.prototype.getSubMenuItems();
};

WorkspaceView.prototype.getBreadcrum = function () {
    var workspace, workspace_name;

    workspace = OpManagerFactory.getInstance().activeWorkSpace;
    if (workspace != null) {
        workspace_name = workspace.getName();
    } else {
        workspace_name = gettext('loading...');
    }

    return [
        {
            'label': ezweb_user_name,
        },
        {
            'label': workspace_name,
        }
    ];
}
