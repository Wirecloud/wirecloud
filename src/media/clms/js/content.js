function content_view() {
    var selected_index = document.getElementById("id_type_content").selectedIndex;
    var selected_input = document.getElementById("id_type_content").options[selected_index];
    if (selected_input.value === "H")
    {
        document.getElementById("id_html").parentNode.parentNode.style.display= "block";
        document.getElementById("id_url").parentNode.parentNode.style.display= "none";
        document.getElementById("id_image").parentNode.parentNode.style.display = "none";
    }
    else if (selected_input.value === "O")
    {
        document.getElementById("id_html").parentNode.parentNode.style.display= "none";
        document.getElementById("id_url").parentNode.parentNode.style.display= "block";
        document.getElementById("id_image").parentNode.parentNode.style.display = "none";
    }
    else if (selected_input.value === "I")
    {
        document.getElementById("id_url").parentNode.parentNode.style.display= "block";
        document.getElementById("id_html").parentNode.parentNode.style.display= "none";
        document.getElementById("id_image").parentNode.parentNode.style.display = "none";
    }
    else if (selected_input.value === "E")
    {   
        document.getElementById("id_url").parentNode.parentNode.style.display= "none";
        document.getElementById("id_html").parentNode.parentNode.style.display= "none";
        document.getElementById("id_image").parentNode.parentNode.style.display = "none";
    }
    else if (selected_input.value === "IF")
    {
        document.getElementById("id_url").parentNode.parentNode.style.display= "none";
        document.getElementById("id_html").parentNode.parentNode.style.display= "none";
        document.getElementById("id_image").parentNode.parentNode.style.display = "block";

    }
}


