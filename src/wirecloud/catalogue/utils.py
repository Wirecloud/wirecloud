# -*- coding: utf-8 -*-

# Copyright (c) 2011-2017 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import errno
from io import BytesIO
import json
import os
import re
from urllib.parse import urljoin
from urllib.request import pathname2url, url2pathname
import time

from django.conf import settings
from django.utils import timezone
from django.utils.translation import get_language, ugettext as _
import markdown

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.models import Organization
from wirecloud.commons.utils.downloader import download_http_content, download_local_file
from wirecloud.commons.utils.html import clean_html
from wirecloud.commons.utils.http import get_absolute_reverse_url, force_trailing_slash
from wirecloud.commons.utils.template import ObsoleteFormatError, TemplateParser, TemplateFormatError, TemplateParseException
from wirecloud.commons.utils.version import Version
from wirecloud.commons.utils.wgt import InvalidContents, WgtDeployer, WgtFile


wgt_deployer = WgtDeployer(settings.CATALOGUE_MEDIA_ROOT)


def extract_resource_media_from_package(template, package, base_path):

    overrides = {}
    resource_info = template.get_resource_info()

    if resource_info['image'] != '':
        if not resource_info['image'].startswith(('http://', 'https://', '//', '/')):
            image_path = os.path.normpath(resource_info['image'])
            package.extract_file(resource_info['image'], os.path.join(base_path, image_path), True)
        elif resource_info['image'].startswith(('//', '/')):
            overrides['image'] = template.get_absolute_url(resource_info['image'])

    if resource_info['smartphoneimage'] != '':
        if not resource_info['smartphoneimage'].startswith(('http://', 'https://', '//', '/')):
            image_path = os.path.normpath(resource_info['smartphoneimage'])
            package.extract_file(resource_info['smartphoneimage'], os.path.join(base_path, image_path), True)
        elif resource_info['smartphoneimage'].startswith(('//', '/')):
            overrides['smartphoneimage'] = template.get_absolute_url(resource_info['smartphoneimage'])

    if resource_info['doc'] != '':
        if not resource_info['doc'].startswith(('http://', 'https://', '//', '/')):
            doc_path = os.path.normpath(os.path.dirname(resource_info['doc']))
            package.extract_dir(doc_path, os.path.join(base_path, doc_path))
        elif resource_info['doc'].startswith(('//', '/')):
            overrides['doc'] = template.get_absolute_url(resource_info['doc'])

    longdescription_url = resource_info['longdescription']
    if longdescription_url != '' and not longdescription_url.startswith(('http://', 'https://', '//', '/')):
        longdescription_path = os.path.normpath(longdescription_url)
        package.extract_localized_files(longdescription_path, os.path.join(base_path, os.path.dirname(longdescription_path)))

    changelog_url = resource_info['changelog']
    if changelog_url != '' and not changelog_url.startswith(('http://', 'https://', '//', '/')):
        changelog_path = os.path.normpath(changelog_url)
        package.extract_localized_files(changelog_path, os.path.join(base_path, os.path.dirname(changelog_path)))

    return overrides


def check_invalid_doc_entry(wgt_file, doc_path):

    try:
        doc_code = wgt_file.read(doc_path)
    except Exception:
        raise InvalidContents('missing file: %s' % doc_path)

    try:
        doc_code = doc_code.decode('utf-8')
    except Exception:
        raise InvalidContents('file is not encoded using UTF-8: %s' % doc_path)

    try:
        markdown.markdown(doc_code, output_format='xhtml5', extensions=['markdown.extensions.codehilite', 'markdown.extensions.fenced_code'])
    except Exception:
        raise InvalidContents("file cannot be parsed as markdown: %s" % doc_path)


def check_invalid_doc_content(wgt_file, resource_info, key):

    doc_url = resource_info[key]
    if doc_url != '' and not doc_url.startswith(('http://', 'https://')):
        doc_path = url2pathname(doc_url)

        # Check default version
        check_invalid_doc_entry(wgt_file, doc_path)

        # Check localized versions
        (doc_filename_root, doc_filename_ext) = os.path.splitext(doc_path)
        pattern = re.escape(doc_filename_root) + r'\.\w\w(?:-\w\w)?' + re.escape(doc_filename_ext)
        for filename in wgt_file.namelist():
            if re.match(pattern, filename):
                check_invalid_doc_entry(wgt_file, filename)


def check_invalid_image(wgt_file, resource_info, key):

    image_url = resource_info[key]
    if image_url != '' and not image_url.startswith(('http://', 'https://')):

        image_path = url2pathname(image_url)

        try:
            wgt_file.read(image_path)
        except KeyError:
            raise InvalidContents('missing image file: %s' % image_path)


def check_invalid_embedded_resources(wgt_file, resource_info):

    if resource_info['type'] != 'mashup':
        return

    files = wgt_file.namelist()
    for embedded_resource in resource_info['embedded']:
        if embedded_resource['src'] not in files:
            raise InvalidContents('Missing embedded file: %s' % embedded_resource['src'])

        try:
            embedded_wgt = WgtFile(BytesIO(wgt_file.read(embedded_resource['src'])))
            check_packaged_resource(embedded_wgt)
        except Exception as e:
            raise InvalidContents('Invalid embedded file: %s' % embedded_resource['src'], details=e)


def check_packaged_resource(wgt_file, resource_info=None):

    if resource_info is None:
        template_contents = wgt_file.get_template()
        try:
            template = TemplateParser(template_contents)
            resource_info = template.get_resource_info()
        except ObsoleteFormatError as e:
            msg = _('Unable to process component description file: %s')
            raise InvalidContents(msg % e)
        except TemplateFormatError:
            raise InvalidContents(_('Unable to process component description file'))
        except TemplateParseException as e:
            msg = _('Unable to process component description file: %s')
            raise InvalidContents(msg % e)

    if resource_info['type'] == 'widget':
        code_url = resource_info['contents']['src']
        if not code_url.startswith(('http://', 'https://')):

            try:
                code = wgt_file.read(code_url)
            except KeyError:
                msg = _('Missing contents file: %(file_name)s.')
                raise InvalidContents(msg % {'file_name': code_url})

            try:
                code.decode(resource_info['contents']['charset'])
            except UnicodeDecodeError:
                msg = _('%(file_name)s was not encoded using the specified charset (%(charset)s according to the widget descriptor file).')
                raise InvalidContents(msg % {'file_name': code_url, 'charset': resource_info['contents']['charset']})

    check_invalid_image(wgt_file, resource_info, 'image')
    check_invalid_image(wgt_file, resource_info, 'smartphoneimage')
    check_invalid_doc_content(wgt_file, resource_info, 'longdescription')
    check_invalid_doc_content(wgt_file, resource_info, 'doc')
    check_invalid_doc_content(wgt_file, resource_info, 'changelog')
    check_invalid_embedded_resources(wgt_file, resource_info)


def add_packaged_resource(file, user, wgt_file=None, template=None, deploy_only=False):

    close_wgt = False
    if wgt_file is None:
        wgt_file = WgtFile(file)
        close_wgt = True

    if template is None:
        template_contents = wgt_file.get_template()
        template = TemplateParser(template_contents)

    resource_info = template.get_resource_info()

    resource_id = (
        resource_info['vendor'],
        resource_info['name'],
        resource_info['version'],
    )
    file_name = '_'.join(resource_id) + '.wgt'

    check_packaged_resource(wgt_file, resource_info)

    local_dir = wgt_deployer.get_base_dir(*resource_id)
    local_wgt = os.path.join(local_dir, file_name)

    if not os.path.exists(local_dir):
        os.makedirs(local_dir)

    overrides = extract_resource_media_from_package(template, wgt_file, local_dir)
    if close_wgt:
        wgt_file.close()

    f = open(local_wgt, "wb")
    file.seek(0)
    f.write(file.read())
    f.close()

    if not deploy_only:
        resource_info.update(overrides)
        resource = CatalogueResource.objects.create(
            short_name=resource_info['name'],
            vendor=resource_info['vendor'],
            version=resource_info['version'],
            type=CatalogueResource.RESOURCE_TYPES.index(resource_info['type']),
            creator=user,
            template_uri=file_name,
            creation_date=timezone.now(),
            popularity='0.0',
            json_description=resource_info
        )

        return resource


def get_resource_data(resource, user, request=None):
    """Gets all the information related to the given resource."""
    resource_info = resource.get_processed_info(request)

    template_uri = get_absolute_reverse_url('wirecloud_catalogue.media', kwargs={
        'vendor': resource.vendor,
        'name': resource.short_name,
        'version': resource.version,
        'file_path': resource.template_uri
    }, request=request)

    wgt_path = os.path.join(wgt_deployer.get_base_dir(resource.vendor, resource.short_name, resource.version), resource.template_uri)
    size = os.path.getsize(wgt_path)

    cdate = resource.creation_date
    creation_timestamp = time.mktime(cdate.timetuple()) * 1e3 + cdate.microsecond / 1e3

    longdescription = resource_info['longdescription']
    if longdescription != '':
        longdescription_relative_path = url2pathname(longdescription)
        longdescription_base_url = force_trailing_slash(urljoin(resource.get_template_url(request=request, for_base=True), pathname2url(os.path.dirname(longdescription_relative_path))))
        longdescription_path = os.path.join(wgt_deployer.get_base_dir(resource.vendor, resource.short_name, resource.version), longdescription_relative_path)

        (filename_root, filename_ext) = os.path.splitext(longdescription_path)
        localized_longdescription_path = filename_root + '.' + get_language() + filename_ext

        try:
            description_code = download_local_file(localized_longdescription_path).decode('utf-8')
            longdescription = clean_html(markdown.markdown(description_code, output_format='xhtml5'), base_url=longdescription_base_url)
        except Exception:
            try:
                description_code = download_local_file(longdescription_path).decode('utf-8')
                longdescription = clean_html(markdown.markdown(description_code, output_format='xhtml5'), base_url=longdescription_base_url)
            except Exception:
                longdescription = resource_info['description']

    else:
        longdescription = resource_info['description']

    return {
        'vendor': resource.vendor,
        'name': resource.short_name,
        'version': resource.version,
        'type': resource_info['type'],
        'date': creation_timestamp,
        'permissions': {
            'delete': user.is_superuser,
            'uninstall': resource.public is False and resource.users.filter(pk=user.pk).exists(),
        },
        'authors': resource_info['authors'],
        'contributors': resource_info['contributors'],
        'title': resource_info['title'],
        'description': resource_info['description'],
        'longdescription': longdescription,
        'email': resource_info['email'],
        'image': resource_info['image'],
        'homepage': resource_info['homepage'],
        'doc': resource_info['doc'],
        'changelog': resource_info['changelog'],
        'size': size,
        'uriTemplate': template_uri,
        'license': resource_info['license'],
        'licenseurl': resource_info['licenseurl'],
        'issuetracker': resource_info['issuetracker'],
    }


def get_resource_group_data(resources, user, request=None):

    data = {
        'vendor': resources[0].vendor,
        'name': resources[0].short_name,
        'type': resources[0].resource_type(),
        'versions': [],
    }
    for resource in resources:
        current_resource_data = get_resource_data(resource, user, request)
        del current_resource_data['vendor']
        del current_resource_data['name']
        del current_resource_data['type']
        data['versions'].append(current_resource_data)

    return data


def get_latest_resource_version(name, vendor):

    resources = CatalogueResource.objects.filter(vendor=vendor, short_name=name)
    if resources.count() > 0:
        newest_version = Version(resources[0].version)
        newest_resource = resources[0]
        for resource in resources[1:]:
            current_version = Version(resource.version)
            if current_version > newest_version:
                newest_version = current_version
                newest_resource = resource

        return newest_resource

    return None


def update_resource_catalogue_cache(orm=None):

    if orm is not None:
        resources = orm.CatalogueResource.objects.all()
    else:
        resources = CatalogueResource.objects.all()

    resources_to_remove = []
    for resource in resources:

        try:

            if getattr(resource, 'fromWGT', True):
                base_dir = wgt_deployer.get_base_dir(resource.vendor, resource.short_name, resource.version)
                wgt_file = WgtFile(os.path.join(base_dir, resource.template_uri))
                template = wgt_file.get_template()
                wgt_file.close()
            else:
                # fromWGT attribute support was removed from Wirecloud in version 0.7.0
                template = download_http_content(resource.template_uri)

            template_parser = TemplateParser(template)
            resource.json_description = json.dumps(template_parser.get_resource_info())
            resource.save()

        except (IOError, TemplateParseException) as e:

            if isinstance(e, IOError) and e.errno != errno.ENOENT:
                raise e

            resources_to_remove.append(resource)

    if len(resources_to_remove) > 0 and getattr(settings, 'WIRECLOUD_REMOVE_UNSUPPORTED_RESOURCES_MIGRATION', False) is False:
        raise Exception('There are some mashable application components that are not supported anymore (use WIRECLOUD_REMOVE_UNSUPPORTED_RESOURCES_MIGRATION for removing automatically them in the migration process')

    for resource in resources_to_remove:
        print('    Removing %s' % (resource.vendor + '/' + resource.short_name + '/' + resource.version))
        resource.delete()


def check_vendor_permissions(user, vendor):
    vendor = vendor.strip()
    options = [user.username]
    for group in user.groups.all():
        try:
            group.organization
        except Organization.DoesNotExist:
            continue
        else:
            options.append(group.name)
    return vendor.lower() in options
