

// Category API
function API(base_url) {
    if (base_url ==  null)
    {
    this.base_url = "/api";
    }
    else
    {
    this.base_url = base_url;
    this.prototype.response = null;
    }
}

API.prototype.base_url;
API.prototype.response;


API.prototype.do_request = function(url) {
      new Ajax.Request(url, 
        { method: 'get', 
          asynchronous: false, 
          onSuccess: function(t) { API.prototype.response = t;},
          on404: function(t) { API.prototype.response = t;},
          onFailure: function(t) { API.prototype.response = null;} 
        });
}

API.prototype.process_response = function() {
    if (this.response != null && this.response.status == 200)
    {
        res = eval("("+this.response.responseText+")");
    }
    else
    {
        res = null;
    }
    return res;
}


API.prototype.getAllPolicies = function() {
    url = this.base_url + "/policies.json";
    this.do_request(url);
    response_json = this.process_response()
    if (response_json != null)
    {
        policy_list_json = response_json.policy_list;
        var policy_list = Array();
        for (i=0; i < policy_list_json.length; i++)
        {
            policy_json = policy_list_json[i];
            policy_list.push(new Policy(policy_json));
        }
        return policy_list;
    }
    else
        return null;
}


API.prototype.getUserPolicies = function(username) {
    url = this.base_url + "/user/"+username+"/policies.json";
    this.do_request(url);
    response_json = this.process_response()
    if (response_json != null)
    {
        policy_list_json = response_json.policy_list;
        var policy_list = Array();
        for (i=0; i < policy_list_json.length; i++)
        {
            policy_json = policy_list_json[i];
            policy_list.push(new Policy(policy_json));
        }
        return policy_list;
    }
    else
        return null;
}



API.prototype.evaluePolicy = function(username, policy_codename) {
    url = this.base_url + "/user/"+username+"/policies/"+policy_codename+ ".json";
    this.do_request(url);
    response_json = this.process_response()
    if (response_json != null)
    {
        if (response_json.policy != null)
            return true;
        else
            return false;
    }
    else
        return false;
}



API.prototype.getCategories = function(username) {
    url = this.base_url + "/user/"+username+"/categories.json";
    this.do_request(url);
    response_json = this.process_response()
    if (response_json != null)
    {
        category_list_json = response_json.category_list;
        var category_list = Array();
        for (i=0; i < category_list_json.length; i++)
        {
            category_json = category_list_json[i];
            category_list.push(new Category(category_json));
        }
        return category_list;
    }
    else
        return null;
}



API.prototype.checkCategory = function(username, category_name) {
    url = this.base_url + "/user/"+username+"/categories/"+ category_name +".json";
    this.do_request(url);
    response_json = this.process_response()
    if (response_json != null)
    {
        if (response_json.category != null)
            return true;
        else
            return false;
    }
    else
        return false;
}




// Category class

function Category(category_json) {
    for (key in category_json)
    {
        eval("this."+ key +" = " + Object.toJSON(category_json[key]));
    }
}


// Policy class

function Policy(policy_json) {

    for (key in policy_json)
    {
        eval("this."+ key +" = " + Object.toJSON(policy_json[key]));
    }
}

