Wirecloud = {
    constants: {
        HTTP_STATUS_DESCRIPTIONS: {
            503: "Service unavailable"
        },
        LOGGING: {
            ERROR_MSG: "error"
        },
        UNKNOWN_STATUS_CODE_DESCRIPTION: "Unknown error code"
    },
    currentTheme: {
        templates: {
            'wirecloud/logs/details': '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><h5>Exception details</h5><p><t:message/></p><h5>Stacktrace</h5><pre><t:stacktrace/></pre></s:styledgui>'
        }
    },
    location: {
        domain: "https://wirecloud.example.com",
        protocol: "https",
        host: "wirecloud.example.com"
    },
    ui: {},
    URLs: {
        LOCAL_RESOURCE_COLLECTION: "/api/resources",
        PLATFORM_CONTEXT_COLLECTION: "/api/context",
        PLATFORM_PREFERENCES: "/api/preferences/platform",
        PROXY: new StyledElements.Utils.Template("/cdp/%(protocol)s/%(domain)s%(path)s"),
        ROOT_URL: '/',
        TAB_COLLECTION: new StyledElements.Utils.Template("/api/workspace/%(workspace_id)s/tabs"),
        THEME_ENTRY: new StyledElements.Utils.Template("/api/theme/%(name)s"),
        WIRING_ENTRY: new StyledElements.Utils.Template("/api/workspace/%(workspace_id)s/wiring"),
        WORKSPACE_COLLECTION: "/api/workspaces",
        WORKSPACE_ENTRY: new StyledElements.Utils.Template("/api/workspace/%(workspace_id)s"),
        WORKSPACE_MERGE: new StyledElements.Utils.Template("/api/workspace/%(to_ws_id)s/merge"),
        WORKSPACE_PUBLISH: new StyledElements.Utils.Template("/api/workspace/%(workspace_id)s/publish"),
        WORKSPACE_VIEW: new StyledElements.Utils.Template("/%(owner)s/%(name)s")
    },
    Utils: StyledElements.Utils
};

var gettext = function gettext(msg) {
    return msg;
};
