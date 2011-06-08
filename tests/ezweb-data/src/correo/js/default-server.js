/******************** INIT **************************/

/* Instanciate Classes */
ClienteCorreo = new ClienteCorreo();
var AccountsManager = new AccountsManagerBasic();
SlotManager = new SlotManager();

/* Init Tiny MCE */
tinyMCE_config["content_css"] = ClienteCorreo.getResourceURL("css/tinymce_content.css");
tinyMCE.init(tinyMCE_config);
