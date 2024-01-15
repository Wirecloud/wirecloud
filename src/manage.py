#!/usr/bin/env python
import os
import sys
# Collections.abc imports for Python 3.10+ compatibility
if sys.version_info.major == 3 and sys.version_info.minor >= 10:
    import collections
    from collections.abc import Callable as collectionsCallable
    from collections.abc import Iterable as collectionsIterable
    from collections.abc import Iterator as collectionsIterator
    from collections.abc import Mapping as collectionsMapping
    from collections.abc import Sequence as collectionsSequence
    collections.Callable = collectionsCallable
    collections.Iterable = collectionsIterable
    collections.Iterator = collectionsIterator
    collections.Mapping = collectionsMapping
    collections.Sequence = collectionsSequence


if __name__ == "__main__":

    # Browsers doesn't use content negotiation using ETags with HTTP 1.0 servers
    # Force Django to use HTTP 1.1 when using the runserver command
    from wsgiref import simple_server
    simple_server.ServerHandler.http_version = "1.1"

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
