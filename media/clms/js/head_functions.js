
function hide_head(make_resize)
{
    var header_height_value = $("header").offsetHeight;
    Effect.toggle('header', 'blind',{ duration: 1.0 });
    $('head_control_tab').innerHTML = "<a href='javascript:{show_head("+make_resize+");}'>Show Menu</a>";
    if(make_resize)
    {
        resize('+');
    }
}

function show_head(make_resize)
{
    Effect.toggle('header', 'blind',{ duration: 1.0 });
    $('head_control_tab').innerHTML = "<a href='javascript:{hide_head("+make_resize+");}'>Hide  Menu</a>";
    if(make_resize)
    {
        setTimeout("resize('-')", 2000);
    }
}

function resize(operator)
{
    var header_height_value = $("header").offsetHeight;
    var container_height_value = $('container_wrapper').style.height.replace('px','');
    if (operator == '+')
    {
        $('container_wrapper').style.height = parseInt(container_height_value) + parseInt(header_height_value) + 'px';
    }
    else if (operator == '-')
    {
        $('container_wrapper').style.height = parseInt(container_height_value) - parseInt(header_height_value) + 'px';
    }
}