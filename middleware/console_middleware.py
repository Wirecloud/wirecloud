from django.contrib.auth.views import redirect_to_login


class SiteLogin:
    """ This middleware requires a login for every view """

    def process_request(self, request):
        path = request.path
        if path == '/':
            initialpath = '/'
        else:
            initialpath = path.split('/')[1]
        if not (request.user.is_authenticated() or initialpath in ['public','login','logout', 'rss', 'site_media'] or "/projmember/activate/" in path):
            return redirect_to_login(request.path, login_url="/login/")


class ConsoleExceptionMiddleware:
    def process_exception(self, request, exception):
        import traceback
        import sys
        exc_info = sys.exc_info()
        print "######################## Exception #############################"
        print '\n'.join(traceback.format_exception(*(exc_info or sys.exc_info())))
        print "################################################################"
        #print repr(request)
        #print "################################################################"
