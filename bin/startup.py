import os, sys
from getopt import getopt, GetoptError

def usage():
    pass

def start_server(ezweb_path, server_name='', server_port=8000):

    #Django WSGI handlers (core and Admin)
    from django.core.handlers.wsgi import WSGIHandler
    from django.core.servers.basehttp import AdminMediaHandler
    
    #Facebook's Tornado WSGI server
    import tornado.httpserver
    import tornado.ioloop
    import tornado.wsgi

    os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

    application = AdminMediaHandler(WSGIHandler(), '')
    container = tornado.wsgi.WSGIContainer(application)
    http_server = tornado.httpserver.HTTPServer(container)

    print "EzWeb server listening at http://%s:%s/" % (server_name, server_port)

    http_server.listen(server_port, server_name)
    
    tornado.ioloop.IOLoop.instance().start()

if __name__ == '__main__':
    try:
        opts, args = getopt(sys.argv[1:], "", [])
    except GetoptError, err:
        print str(err)
        usage()
        sys.exit(2)

    script_path = os.path.dirname(os.path.realpath(__file__))
    ezweb_path = os.path.abspath(os.path.join(script_path, '..'))

    if sys.platform == 'win32':
        activate_this = os.path.join(ezweb_path, 'python-env', 'Scripts', 'activate_this.py')
    else:
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
