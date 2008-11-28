
function delete_message()
{
    $('messagebox').innerHTML= '';
}

function change_img(action, layout_id, view, type_petition)
{

  if(view == 'normal')  
  {
    if (action == 'add')
    {
        if(type_petition=='default')
        {
            var del_layouts=$('layouts').getElementsByClassName('del_default');
            var i ;
            for(i=0;i<del_layouts.length; i++)
            {
                del_layouts[i].style.display="none";
                $(del_layouts[i].id.replace('del','add')).style.display = "inline";
            }
        }

        $('del_'+type_petition+'_'+layout_id).style.display='inline';
        $('add_'+type_petition+'_'+layout_id).style.display='none';
    }
    else if (action == 'del')
    {
        $('del_'+type_petition+'_'+layout_id).style.display='none';
        $('add_'+type_petition+'_'+layout_id).style.display='inline';
    }
  }
  else if (view == 'favourite')
  {
    Effect.Fade('layout_box_'+layout_id);
  }
}


function petition_ajax(url, layout_id, view, type_petition)
{
var post_data='';
var opt = {
    // Use POST
    method: 'post',
    // Send this lovely data
    postBody: escape(post_data),
    // Handle successful response
    onSuccess: function(t) {
        var response_text = eval("("+t.responseText+")");
        if (response_text.done == true)
        {
            $('messagebox').innerHTML="<ul id='info-list'><li><span class='infomsg'>"+response_text.message+"</span></li></ul>";
            change_img(response_text.action, layout_id, view, type_petition);
            setTimeout("delete_message()", 3000);

        }
        else
        {
            $('messagebox').innerHTML="<ul id='info-list'><li><span class='errormsg'>"+response_text.message+"</span></li></ul>";
        }
    },
    // Handle 404
    on404: function(t) {
        $('messagebox').innerHTML="<ul id='info-list'><li><span class='errormsg'>Error 404</span></li></ul>";
    },
    on500: function(t) {
        $('messagebox').innerHTML="<ul id='info-list'><li><span class='errormsg'>Error 500</span></li></ul>";
    },

    onFailure: function(t) {
        $('messagebox').innerHTML="<ul id='info-list'><li><span class='errormsg'>Failed</span></li></ul>";
    }
}
new Ajax.Request(url, opt);
}