#!/usr/bin/env python

#...............................licence...........................................
#
#     (C) Copyright 2009 Telefonica Investigacion y Desarrollo
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

from catalogue.catalogue_utils import get_all_gadget_versions, update_gadget_popularity
from catalogue.models import GadgetResource, UserTag, UserVote

gadgets = GadgetResource.objects.values('vendor', 'short_name').distinct()
for gadget in gadgets:
    gadgetVersions = get_all_gadget_versions(gadget['vendor'], gadget['short_name'])

    gadgetVersions.sort()
    previousVersion = GadgetResource.objects.get(vendor=gadget['vendor'], short_name=gadget['short_name'], version=gadgetVersions[0])
    for i in range(1, len(gadgetVersions)):
        currentVersion = GadgetResource.objects.get(vendor=gadget['vendor'], short_name=gadget['short_name'], version=gadgetVersions[i])

        # Update UserTags
        previousUserTags = UserTag.objects.filter(idResource=previousVersion)

        for previousUserTag in previousUserTags:
            try:
                UserTag.objects.get(tag=previousUserTag.tag, idUser=previousUserTag.idUser, idResource=currentVersion)
            except:
                newUserTag = UserTag(tag=previousUserTag.tag, idUser=previousUserTag.idUser, idResource=currentVersion)
                newUserTag.save()

        # Update UserVotes
        previousUserVotes = UserVote.objects.filter(idResource=previousVersion)

        for previousUserVote in previousUserVotes:
            try:
                UserVote.objects.get(idUser=previousUserVote.idUser, idResource=currentVersion)
            except:
                newUserVote = UserVote(idUser=previousUserVote.idUser, vote=previousUserVote.vote, idResource=currentVersion)
                newUserVote.save()

        # Update popularity
        update_gadget_popularity(currentVersion)

        previousVersion = currentVersion
