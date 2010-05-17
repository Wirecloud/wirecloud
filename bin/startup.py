import os, sys
from getopt import getopt, GetoptError

def usage():
    pass

def start_server(ezweb_path, server_name='', server_port=8000):

    #Running WSGI server
    from wsgiref.simple_server import make_server
    from django.core.handlers.wsgi import WSGIHandler
    from django.core.servers.basehttp import AdminMediaHandler

    os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'


    httpd = make_server(server_name, server_port, AdminMediaHandler(WSGIHandler()))

    print "Listening at http://%s:%s/" % (server_name, server_port)
    httpd.serve_forever()

if __name__ == '__main__':
    try:
        opts, args = getopt(sys.argv[1:], "", [])
    except GetoptError, err:
        print str(err)
        usage()
        sys.exit(2)

    script_path = os.path.dirname(os.path.realpath(__file__))
    ezweb_path = os.path.abspath(os.path.join(script_path, '..'))
    activate_this = os.path.join(ezweb_path, 'python-env', 'bin', 'activate_this.py')
    if os.path.isfile(activate_this):
        execfile(activate_this, dict(__file__=activate_this))

    # Add EzWeb to the python path
    sys.path.append(ezweb_path)

    # Read config from config.py
    try:
        import config
    except:
        config = {}

    if hasattr(config, 'SERVER_NAME'):
        server_name = config.SERVER_NAME
    else:
        server_name = 'localhost'

    if hasattr(config, 'SERVER_PORT'):
        server_port = int(config.SERVER_PORT)
    else:
        server_port = 8000

    # Read command line arguments
    if len(args) > 0:
        server_name = args[0]
    if len(args) > 1:
        server_port = int(args[1])
    if len(args) > 2:
        usage()
        sys.exit(2)

    start_server(ezweb_path, server_name, server_port)
