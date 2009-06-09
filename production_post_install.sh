#!/bin/bash
# Post installation script. Optimization tasks for production environment.
# Check 'settings.py' file for properties:
#     ONLY_ONE_JS_FILE=True
#     ONLY_ONE_CSS_FILE=True
#     EZWEB_RELEASE='[_release_number]'
# Release number can be obtained from SVN revision, executing 'svn info' or 'svnversion' commands

set DJANGO_SETTINGS_MODULE=settings

python generate_ezweb_js_file.py
python generate_ezweb_css_file.py