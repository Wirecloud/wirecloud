
function popup_list(link_token) {

    var token_id = link_token.id.split("_")[1];
    var win_href = window.location.href.split("/");
    var _href = "";
    if (win_href[win_href.length-2]=='add')
    {
        _href = "/admin/clms/content/popup/";

    }
    else
    {
        _href = "/admin/clms/"+win_href[win_href.length-2]+"/content/popup/";

    }
    
    var contents_for_token = document.getElementsByClassName("content_"+token_id);
    var contents_for_token_str = "";
    var tmp_replace; 
    var separator="";
    for(var i=0; i< contents_for_token.length; i++)
    {
        tmp_replace = contents_for_token[i].id;
        tmp_replace = tmp_replace.replace("#","@");
        tmp_replace = tmp_replace.replace("&","!");
        contents_for_token_str+=separator+tmp_replace;
        separator=",";
    }
    var win = window.open(_href+"?token_id="+token_id+"&contents="+contents_for_token_str, "popup", "height=500,width=800,resizable=yes,scrollbars=yes");
    win.focus();
    return false;
}

function delete_content(link_delete_content)
{
    var p = link_delete_content.parentNode;
    var token_panels = null;
    if (window.opener)
    {
        var token_panels = window.opener.document.getElementById("id_token_panels");
    }
    else
    {
        var token_panels = document.getElementById("id_token_panels");

    }
    list_new_tokens_value = [];
    token_panels_list = token_panels.value.split(",");
    for (i=0; i<token_panels_list.length; i++ )
    {
        if(token_panels_list[i]!=p.id)
        {
            list_new_tokens_value[list_new_tokens_value.length] = token_panels_list[i];
        }
    }
    token_panels.value = list_new_tokens_value.join(",");
    if (window.opener)
    {
        list_new_tokens_value = [];
        token_panels_list = asig_text.split(",");
        for (i=0; i<token_panels_list.length; i++ )
        {
            if(token_panels_list[i]!=p.id)
            {
                list_new_tokens_value[list_new_tokens_value.length] = token_panels_list[i];
            }
        }
        asig_text = list_new_tokens_value.join(",");
    }
    p.parentNode.removeChild(p);

    if(!window.opener)
    {
        document.getElementById("id_select_layout").value = "<div id='select_layout_div'>" + document.getElementById("select_layout_div").innerHTML+ "</div>";
    }

}