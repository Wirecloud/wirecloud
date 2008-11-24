// Finds all fieldsets with class="collapse", collapses them, and gives each
// one a "Show" link that uncollapses it. The "Show" link becomes a "Hide"
// link when the fieldset is visible.

function findForm(node) {
    // returns the node of the form containing the given node
    if (node.tagName.toLowerCase() != 'form') {
        return findForm(node.parentNode);
    }
    return node;
}
var CollapsedFieldsets2 = {
    collapse_re: /\bcollapse2\b/,   // Class of fieldsets that should be dealt with.
    collapsed_re: /\bcollapsed\b/, // Class that fieldsets get when they're hidden.
    collapsed_class: 'collapsed2',
    init: function() {
        var fieldsets = document.getElementsByTagName('fieldset');
        var collapsed_seen = false;
        for (var i = 0, fs; fs = fieldsets[i]; i++) {
            // Collapse this fieldset if it has the correct class, and if it
            // doesn't have any errors. (Collapsing shouldn't apply in the case
            // of error messages.)
            if (fs.className.match(CollapsedFieldsets2.collapse_re) && !CollapsedFieldsets2.fieldset_has_errors(fs)) {
                collapsed_seen = true;
                // Give it an additional class, used by CSS to hide it.
                fs.className += ' ' + CollapsedFieldsets2.collapsed_class;
                // (<a id="fieldsetcollapser3" class="collapse-toggle" href="#">Show</a>)
                var collapse_link = document.createElement('a');
                collapse_link.className = 'collapse2-toggle2';
                collapse_link.id = 'fieldsetcollapser' + i;
                collapse_link.onclick = new Function('CollapsedFieldsets2.show('+i+'); return false;');
                collapse_link.href = '#';
                collapse_link.innerHTML = gettext('File');
                var h2 = fs.getElementsByTagName('h2')[0];
                h2.appendChild(document.createTextNode(' ('));
                h2.appendChild(collapse_link);
                h2.appendChild(document.createTextNode(')'));
                var find = false;
                var i =fs.childNodes.length-1 ;
                while (i>=0 && !find)
                {
                    if(fs.childNodes[i].nodeType!=3 && fs.childNodes[i].tagName=="DIV")
                    {
                        if (fs.childNodes[i].style == null || fs.childNodes[i].style.display=="" || fs.childNodes[i].style.display=="block" )
                        {
                            find = true;
                            fs.childNodes[i].style.display = "none";
                        }
                    }
                    i--;
                }

            }
        }
        if (collapsed_seen) {
            // Expand all collapsed fieldsets when form is submitted.
            addEvent(findForm(document.getElementsByTagName('fieldset')[0]), 'submit', function() { CollapsedFieldsets2.uncollapse_all(); });
        }
    },
    fieldset_has_errors: function(fs) {
        // Returns true if any fields in the fieldset have validation errors.
        var divs = fs.getElementsByTagName('div');
        for (var i=0; i<divs.length; i++) {
            if (divs[i].className.match(/\berrors\b/)) {
                return true;
            }
        }
        return false;
    },
    show: function(fieldset_index) {

        var fs = document.getElementsByTagName('fieldset')[fieldset_index];
        // Remove the class name that causes the "display: none".
        var find = false;
        var find2 = false;
        var i =0;
        while (i<fs.childNodes.length && (!find||!find2))
        {   


            if(fs.childNodes[i].nodeType!=3 && fs.childNodes[i].tagName=="DIV")
            {
                if (fs.childNodes[i].style == null || fs.childNodes[i].style.display=="" || fs.childNodes[i].style.display=="block" )
                {
                    find = true;
                    fs.childNodes[i].style.display = "none";

                }

                else if(fs.childNodes[i].style.display=="none"  )
                {
                    find2 = true;
                    fs.childNodes[i].style.display = "block";
                }
            }
            i++;
        }
        // Toggle the "Show" link to a "Hide" link
        var collapse_link = document.getElementById('fieldsetcollapser' + fieldset_index);
        collapse_link.onclick = new Function('CollapsedFieldsets2.hide('+fieldset_index+'); return false;');
        collapse_link.innerHTML = gettext('Wizard');
    },
    hide: function(fieldset_index) {
        var fs = document.getElementsByTagName('fieldset')[fieldset_index];
        // Add the class name that causes the "display: none".
        var find = false;
        var find2 = false;
        var i =0;
        while (i<fs.childNodes.length && (!find||!find2))
        {   


            if(fs.childNodes[i].nodeType!=3 && fs.childNodes[i].tagName=="DIV")
            {
                if (fs.childNodes[i].style == null || fs.childNodes[i].style.display=="" || fs.childNodes[i].style.display=="block" )
                {
                    find = true;
                    fs.childNodes[i].style.display = "none";

                }

                else if(fs.childNodes[i].style.display=="none")
                {
                    find2 = true;
                    fs.childNodes[i].style.display = "block";
                }
            }
            i++;
        }
        // Toggle the "Hide" link to a "Show" link
        var collapse_link = document.getElementById('fieldsetcollapser' + fieldset_index);
        collapse_link.onclick = new Function('CollapsedFieldsets2.show('+fieldset_index+'); return false;');
        collapse_link.innerHTML = gettext('File');
    }
}

addEvent(window, 'load', CollapsedFieldsets2.init);

