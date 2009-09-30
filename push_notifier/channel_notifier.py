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

#!/usr/bin/env python

import logging
import tornado.escape
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import os.path

from push_notifier.external_channel import ExternalChannel, ChannelCollection
from push_notifier.services import NotifyClientsHandler, RegisterSubscriptionHandler

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)

########################################################################
# Push_Notifier Application class!
# URLs mapping
########################################################################
class Push_Notifier(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r'/notifier/channels/notify', NotifyClientsHandler),
            (r'/notifier/channels/register', RegisterSubscriptionHandler),
        ]

        tornado.web.Application.__init__(self, handlers, None)

########################################################################
# Main function
########################################################################
def main():
    #Parsing command-line options!
    tornado.options.parse_command_line()

    http_server = tornado.httpserver.HTTPServer(Push_Notifier())
    http_server.listen(options.port)

    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()