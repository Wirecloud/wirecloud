# -*- coding: utf-8 -*-
import urllib2

from django.utils import simplejson

from wirecloud.proxy.views import MethodRequest


base = "http://linkeddata4.dia.fi.upm.es:8080/MatcherService/rest/matcher/matchingsSpace/"
opener = urllib2.build_opener()


def get_widget_semantic_data(widget):

    fields = []
    widget_description = simplejson.loads(widget.json_description)
    for input_endpoint in widget_description['wiring']['inputs']:
        fields.append({
            'syntacticType': input_endpoint['type'],
            'semanticType': input_endpoint['friendcode'],
            'flow': 'input',
            'id': widget.local_uri_part + '/' + input_endpoint['name']
        })

    for output_endpoint in widget_description['wiring']['outputs']:
        fields.append({
            'syntacticType': output_endpoint['type'],
            'semanticType': output_endpoint['friendcode'],
            'flow': 'output',
            'id': widget.local_uri_part + '/' + output_endpoint['name']
        })

    return fields


def add_widget_semantic_data(user, widget):

    matchingSpace = base + str(user.username)
    request = MethodRequest("GET", matchingSpace)
    response = opener.open(request)
    response_text = response.read()

    if response.code == 404 or response_text == '':
        request = MethodRequest("PUT", matchingSpace)
        response = opener.open(request)


    data = {
        'fields': get_widget_semantic_data(widget),
        'type': 'addition',
        'ontologies': [],
    }

    request = MethodRequest("POST", matchingSpace, simplejson.dumps(data), {'Content-Type': 'application/json'})
    try:
        response = opener.open(request)
    except Exception, e:
        import traceback
        traceback.print_exc()

    request = MethodRequest("GET", matchingSpace)
    response = opener.open(request)
    response_text = response.read()

    result = simplejson.loads(response_text)
    semanticStatus = {}
    for match in result["matchings"]:
        origin = match["origin"].split("/")
        source_id = "/".join(origin[:3])
        source_endpoint = origin[3]
        destination = match["destination"].split("/")
        matchCode = match["matchCode"]
        if source_id not in semanticStatus:
            semanticStatus[source_id] = {}
        if source_endpoint not in semanticStatus[source_id]:
            semanticStatus[source_id][source_endpoint] = []
        semanticStatus[source_id][source_endpoint].append({"widget": "/".join(destination[:3]), "endpoint": destination[3]})

    print(semanticStatus)

def remove_widget_semantic_data(user, widget):

    matchingSpace = base + str(user.username)
    request = MethodRequest("GET", matchingSpace)
    response = opener.open(request)
    response_text = response.read()

    if response.code == 404 or response_text == '':
        return

    data = {
        'fields': get_widget_semantic_data(widget),
        'type': 'removal',
        'ontologies': [],
    }

    request = MethodRequest("POST", matchingSpace, simplejson.dumps(data), {'Content-Type': 'application/json'})
    try:
        response = opener.open(request)
    except Exception, e:
        import traceback
        traceback.print_exc()

    request = MethodRequest("GET", matchingSpace)
    response = opener.open(request)
    response_text = response.read()

    result = simplejson.loads(response_text)
    semanticStatus = {}
    for match in result["matchings"]:
        origin = match["origin"].split("/")
        source_id = "/".join(origin[:3])
        source_endpoint = origin[3]
        destination = match["destination"].split("/")
        matchCode = match["matchCode"]
        if source_id not in semanticStatus:
            semanticStatus[source_id] = {}
        if source_endpoint not in semanticStatus[source_id]:
            semanticStatus[source_id][source_endpoint] = []
        semanticStatus[source_id][source_endpoint].append({"widget": "/".join(destination[:3]), "endpoint": destination[3]})

    print(semanticStatus)
