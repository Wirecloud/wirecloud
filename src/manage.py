#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":

    # Browsers doesn't use content negotiation using ETags with HTTP 1.0 servers
    # Force Django to use HTTP 1.1 when using the runserver command
    from wsgiref import simple_server
    simple_server.ServerHandler.http_version = "1.1"

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
