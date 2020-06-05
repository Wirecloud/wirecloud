# -*- coding: utf-8 -*-

# Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import os
import subprocess

import wirecloud.platform


def get_git_info():
    def _minimal_ext_cmd(cmd):
        # construct minimal environment
        env = {}
        for k in ['SYSTEMROOT', 'PATH', 'HOME']:
            v = os.environ.get(k)
            if v is not None:
                env[k] = v
        # LANGUAGE is used on win32
        env['LANGUAGE'] = 'C'
        env['LANG'] = 'C'
        env['LC_ALL'] = 'C'
        out = subprocess.Popen(cmd, stdout=subprocess.PIPE, env=env).communicate()[0]
        return out

    # Check if this working copy is dirty
    try:
        out = _minimal_ext_cmd(['git', 'status', '--porcelain'])
        GIT_DIRTY = out.strip().decode('ascii').strip() != ""
    except OSError:
        GIT_DIRTY = True

    # Get current commit hash
    try:
        out = _minimal_ext_cmd(['git', 'rev-parse', 'HEAD'])
        GIT_REVISION = out.strip().decode('ascii')
    except OSError:
        GIT_REVISION = "Unknown"

    # Check if HEAD points to a release commit
    IS_RELEASE = False
    release_tag = wirecloud.platform.__version__
    try:
        out = _minimal_ext_cmd(['git', 'tag', '-l', '--points-at', 'HEAD'])
        tags = out.strip().decode('ascii').splitlines()
        IS_RELEASE = release_tag in tags
    except OSError:
        pass

    # Provide a release date if this is a released version
    RELEASE_DATE = "Unknown"
    if IS_RELEASE and not GIT_DIRTY:
        try:
            out = _minimal_ext_cmd(['git', 'log', '-1', '--date=short', '--pretty=format:%cd'])
            RELEASE_DATE = out.strip().decode('ascii')
        except OSError:
            pass

    return GIT_REVISION, RELEASE_DATE, GIT_DIRTY
