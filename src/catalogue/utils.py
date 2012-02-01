# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#


#

import os
from datetime import datetime
from urllib2 import URLError, HTTPError

from django.conf import settings
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _

from catalogue.catalogue_utils import get_latest_resource_version
from catalogue.get_json_catalogue_data import get_resource_data
from catalogue.models import GadgetWiring, CatalogueResource, Tag, UserTag, UserVote
from commons.user_utils import get_certification_status
from commons.authentication import Http403
from commons.exceptions import TemplateParseException
from commons.http_utils import download_http_content
from commons.template import TemplateParser
from commons.wgt import WgtFile
from deployment.utils import undeploy_wgt_gadget
from deployment.wgtPackageUtils import get_wgt_local_path
from gadget.views import deleteGadget
from translator.models import Translation



def extract_resource_media_from_package(template, package, base_path):

    overrides = {}
    resource_info = template.get_resource_info()

    if not resource_info['image_uri'].startswith(('http://', 'https://', '//')):
        package.extract_file(resource_info['image_uri'], os.path.join(base_path, resource_info['image_uri']), True)
        overrides['image_uri'] = '/catalogue/media/' + '/'.join((
            template.get_resource_vendor(),
            template.get_resource_name(),
            template.get_resource_version(),
            resource_info['image_uri']
        ))

    return overrides


def add_gadget_from_wgt(file, user, wgt_file=None, template=None):

    if wgt_file is None:
        wgt_file = WgtFile(file)

    if template is None:
        template_contents = wgt_file.get_template()
        template = TemplateParser(template_contents)

    resource_id = (
        template.get_resource_vendor(),
        template.get_resource_name(),
        template.get_resource_version(),
    )
    file_name = '_'.join(resource_id) + '.wgt'
    wgt_dir = os.path.join(*resource_id)
    local_dir = os.path.join(settings.CATALOGUE_MEDIA_ROOT, wgt_dir)
    wgt_path = os.path.join(wgt_dir, file_name)
    local_wgt = os.path.join(settings.CATALOGUE_MEDIA_ROOT, wgt_path)

    if not os.path.exists(local_dir):
        os.makedirs(local_dir)

    overrides = extract_resource_media_from_package(template, wgt_file, local_dir)
    template_uri = reverse('wirecloud_catalogue.media', args=resource_id + (file_name,))
    if wgt_file != file:
        wgt_file.close()

    f = open(local_wgt, "wb")
    file.seek(0)
    f.write(file.read())
    f.close()

    resource = add_resource_from_template(template_uri, template, user, overrides=overrides)
    return resource


def add_resource_from_template_uri(template_uri, user, fromWGT=False):

    if fromWGT:

        localPath = get_wgt_local_path(template_uri)
        if not os.path.isfile(localPath):
            raise Exception(_("'%(file)s' is not a file") % {'file': localPath})

        f = open(localPath, 'r')
        template = f.read()
        f.close()

    else:

        try:
            template = download_http_content(template_uri, user=user)
        except HTTPError, e:
            msg = _("Error downloading resource template '%(url)s': code %(errorCode)s (%(errorMsg)s)")
            raise TemplateParseException(msg % {'url': template_uri, 'errorCode': e.code, 'errorMsg': e.msg})
        except URLError, e:
            if isinstance(e.reason, str) or isinstance(e.reason, unicode):
                context = {'errorMsg': e.reason, 'url': template_uri}
                msg = _("Bad resource template URL '%(url)s': %(errorMsg)s") % context
            else:
                context = {'errorMsg': e.reason.strerror, 'url': template_uri}
                msg = _("Error downloading resource template '%(url)s': %(errorMsg)s") % context

            raise TemplateParseException(msg)
        except ValueError, e:
            context = {'errorMsg': e, 'url': template_uri}
            msg = _("Bad resource template URL '%(url)s': %(errorMsg)s") % context
            raise TemplateParseException(msg)

    return add_resource_from_template(template_uri, template, user, fromWGT=fromWGT)


def add_resource_from_template(template_uri, template, user, fromWGT=False, overrides=None):

    if isinstance(template, TemplateParser):
        parser = template
    else:
        parser = TemplateParser(template, base=template_uri)

    resource_info = parser.get_resource_info()
    if overrides is not None:
        resource_info.update(overrides)

    resource = CatalogueResource(
        short_name=resource_info['name'],
        display_name=resource_info['display_name'],
        vendor=resource_info['vendor'],
        version=resource_info['version'],
        author=resource_info['author'],
        description=resource_info['description'],
        mail=resource_info['mail'],
        image_uri=resource_info['image_uri'],
        iphone_image_uri=resource_info['iphone_image_uri'],
        wiki_page_uri=resource_info['doc_uri'],
        template_uri=template_uri,
        creation_date=datetime.today(),
        popularity='0.0',
        certification=get_certification_status(user)
    )

    if resource_info['type'] == 'mashup':
        resource.type = 1
    else:
        resource.type = 0

    resource.save()

    for slot in resource_info['slots']:
        GadgetWiring.objects.create(
            idResource=resource,
            wiring='in',
            friendcode=slot['friendcode']
        )

    for event in resource_info['events']:
        GadgetWiring.objects.create(
            idResource=resource,
            wiring='out',
            friendcode=event['friendcode']
        )

    resource_table = resource.__class__.__module__ + "." + resource.__class__.__name__
    for lang in resource_info['translations']:
        translation = resource_info['translations'][lang]
        for index in translation:
            value = translation[index]
            usages = resource_info['translation_index_usage'][index]
            for use in usages:
                if use['type'] != 'gadget':
                    continue

                Translation.objects.create(
                    text_id=index,
                    element_id=resource.id,
                    table=resource_table,
                    language=lang,
                    value=value,
                    default=resource_info['default_lang'] == lang
                )

                # Create only a translation entry for this index
                break

    return resource


def get_added_resource_info(resource, user):

    info = {
        'vendor': resource.vendor,
        'name': resource.short_name,
        'type': resource.resource_type(),
        'versions': [get_resource_data(resource, user)],
    }

    latest_version = get_latest_resource_version(resource.short_name, resource.vendor)
    if latest_version != resource:
        info['versions'].append(get_resource_data(latest_version, user))

    return info


def delete_resource(resource, user):

    # Delete the resource only if this user is the owner
    if not user.is_superuser and resource.creator != user:
        msg = _("user %(username)s is not the owner of the resource %(resource_id)s") % {'username': user.username, 'resource_id': resource.id}

        raise Http403(msg)

    # Delete the related wiring information for that resource
    GadgetWiring.objects.filter(idResource=resource.id).delete()

    # Delete the related tags for that resource
    UserTag.objects.filter(idResource=resource.id).delete()

    # Delete the related votes for that resource
    UserVote.objects.filter(idResource=resource.id).delete()

    result = {'removedIGadgets': []}
    if resource.resource_type() == 'gadget':
        # Remove the gadget from the showcase
        result = deleteGadget(user, resource.short_name, resource.vendor, resource.version)

        # Delete the gadget if it is saved in the platform
        if resource.fromWGT:
            undeploy_wgt_gadget(resource)

    # Delete the object
    resource.delete()

    return result


def tag_resource(user, tag, resource):
    tag, _junk = Tag.objects.get_or_create(name=tag)
    UserTag.objects.get_or_create(tag=tag, idUser=user, idResource=resource)
