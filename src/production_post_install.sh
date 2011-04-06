#!/bin/bash
# Post installation script. Optimization tasks for production environment.
# Check 'settings.py' file for properties:
#     ONLY_ONE_JS_FILE=True
#     ONLY_ONE_CSS_FILE=True
#     EZWEB_RELEASE='[release_number]'
# [release_number] can be obtained from SVN revision, executing 'svn info' or 'svnversion' commands
# 
# ---------------------------- lighttpd optimizations -------------------------
#
# - Enable "mod_expire"
# - Set expiration time for images and versioned files (js, css)
# 
# $HTTP["url"] =~ "(gif|png|jpg|ico|dat)$" {
#  expire.url = ( "" => "access 2 months" )
# }
#
# $HTTP["url"] =~ "(js|css)$" {
#  expire.url = ( "" => "access 14 days" )
# }
# -------------------------- End lighttpd optimizations -----------------------

export DJANGO_SETTINGS_MODULE=settings

python generate_ezweb_js_file.py $*
python generate_ezweb_css_file.py $*