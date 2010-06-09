import os, sys, shutil
from getopt import getopt, GetoptError

def update_code(ezweb_path):
    os.system('svn up "%s"' % ezweb_path)

def update_db(ezweb_path, manage_script):
    os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

    import settings

    db_file = os.path.join(ezweb_path, settings.DATABASE_NAME)
    if os.path.isfile(db_file):
        print "Backing up old db"
        shutil.move(db_file, db_file + '.bak')


    old_cwd = os.getcwd()
    os.chdir(ezweb_path)

    if sys.platform == 'win32':
        python_interpreter = os.path.join(ezweb_path, 'python-env', 'Scripts', 'python.exe')
    else:
        python_interpreter = os.path.join(ezweb_path, 'python-env', 'bin', 'python')

    os.system('%s %s syncdb --noinput --settings settings' % (python_interpreter, manage_script))

    os.chdir(old_cwd)

if __name__ == '__main__':
    try:
        opts, args = getopt(sys.argv[1:], "", ['only-db'])
    except GetoptError, err:
        print str(err)
        usage()
        sys.exit(2)

    only_db = False
    for (opt, _) in opts:
        if (opt == "--only-db"): only_db = True

    script_path = os.path.dirname(os.path.realpath(__file__))
    ezweb_path = os.path.abspath(os.path.join(script_path, '..'))
    manage_script = os.path.join(ezweb_path, 'manage.py')

    if sys.platform == 'win32':
        activate_this = os.path.join(ezweb_path, 'python-env', 'Scripts', 'activate_this.py')
    else:
        activate_this = os.path.join(ezweb_path, 'python-env', 'bin', 'activate_this.py')
    
    if os.path.isfile(activate_this):
        execfile(activate_this, dict(__file__=activate_this))

    sys.path.append(ezweb_path)

    if not only_db:
        update_code(ezweb_path)

    update_db(ezweb_path, manage_script)
