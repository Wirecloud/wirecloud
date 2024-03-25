#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.

import grp
import pwd
import os
import shutil
import time
import unittest
from urllib.parse import parse_qs, urlparse

import requests
import sh

POLL_FREQUENCY = 0.5  # How long to sleep inbetween calls to the method


class TimeoutException(Exception):
    """
    Thrown when a command does not complete in enough time.
    """
    pass


def wait_until_running(timeout=120):
    end_time = time.time() + timeout
    while True:
        try:
            response = requests.get("http://localhost/api/version")
            if response.status_code != 502:
                return
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(POLL_FREQUENCY)
        if time.time() > end_time:
            break
    raise TimeoutException()


class WireCloudTests(object):

    def test_version_api_should_be_available(self):
        response = requests.get("http://localhost/api/version")
        self.assertEqual(response.status_code, 200)

    def test_search_engine_should_work(self):
        response = requests.get("http://localhost/api/search?namespace=workspace&maxresults=1")
        self.assertEqual(response.status_code, 200)

    def test_root_page_should_work(self):
        response = requests.get("http://localhost/")
        self.assertEqual(response.status_code, 200)

    def test_home_page_should_work(self):
        response = requests.get("http://localhost/wirecloud/home")
        self.assertEqual(response.status_code, 200)

    def test_should_serve_static_files(self):
        response = requests.get("http://localhost/static/theme/wirecloud.defaulttheme/images/logos/header.png")
        self.assertEqual(response.status_code, 200)

    def test_should_serve_translations(self):
        response = requests.get("http://localhost/api/i18n/js_catalogue?language=es")
        self.assertEqual(response.status_code, 200)
        # Look for basic translations
        self.assertIn('"Yes"', response.text)
        self.assertIn('"No"', response.text)
        self.assertIn('"Warning"', response.text)


class StandaloneTests(unittest.TestCase, WireCloudTests):

    @classmethod
    def setUpClass(cls):
        print("\n################################################################################\n")
        print("#")
        print("# Initializing standalone test case")
        print("#\n", flush=True)
        sh.docker_compose("-f", "docker-compose-standalone.yml", "up", d=True, remove_orphans=True, _fg=True)
        wait_until_running()
        print(flush=True)

    @classmethod
    def tearDownClass(cls):
        print()
        print("#")
        print("# Removing containers and volumes")
        print("#\n", flush=True)
        sh.docker_compose.down(remove_orphans=True, v=True, _fg=True)
        print(flush=True)


class SimpleTests(unittest.TestCase, WireCloudTests):

    @classmethod
    def setUpClass(cls):
        print("\n################################################################################\n")
        print("#")
        print("# Initializing simple test case")
        print("#\n", flush=True)
        sh.docker_compose("-f", "docker-compose-simple.yml", "up", d=True, remove_orphans=True, _fg=True)
        wait_until_running()
        print(flush=True)

    @classmethod
    def tearDownClass(cls):
        print()
        print("#")
        print("# Removing containers and volumes")
        print("#\n", flush=True)
        sh.docker_compose.down(remove_orphans=True, v=True, _fg=True)
        print(flush=True)


class ComposedTests(unittest.TestCase, WireCloudTests):

    @classmethod
    def setUpClass(cls):
        print("\n################################################################################\n")
        print("#")
        print("# Initializing composed test case")
        print("#\n", flush=True)
        sh.docker_compose.up(d=True, remove_orphans=True, _fg=True)
        wait_until_running()
        print(flush=True)

    @classmethod
    def tearDownClass(cls):
        print()
        print("#")
        print("# Removing containers and volumes")
        print("#\n", flush=True)
        sh.docker_compose.down(remove_orphans=True, v=True, _fg=True)
        print(flush=True)


class ReadOnlyConfigTests(unittest.TestCase, WireCloudTests):

    @classmethod
    def setUpClass(cls):
        print("\n################################################################################\n")
        print("#")
        print("# Initializing read-only config test case")
        print("#\n", flush=True)

        sh.docker_compose("-f", "docker-compose-config-file.yml", "up", d=True, remove_orphans=True, _fg=True)
        wait_until_running()
        print(flush=True)

    @classmethod
    def tearDownClass(cls):
        print()
        print("#")
        print("# Removing containers and volumes")
        print("#\n", flush=True)
        sh.docker_compose.down(remove_orphans=True, v=True, _fg=True)
        print(flush=True)


class IDMTests(unittest.TestCase, WireCloudTests):

    @classmethod
    def setUpClass(cls):
        print("\n################################################################################\n")
        print("#")
        print("# Initializing idm test case")
        print("#\n", flush=True)

        env = {}
        env.update(os.environ)
        env["FIWARE_IDM_SERVER"] = "https://accounts.example.com"
        env["SOCIAL_AUTH_FIWARE_KEY"] = "wirecloud_test_client_id"
        env["SOCIAL_AUTH_FIWARE_SECRET"] = "notused"
        sh.docker_compose("-f", "docker-compose-idm.yml", "up", d=True, remove_orphans=True, _env=env, _fg=True)
        wait_until_running()
        print(flush=True)

    @classmethod
    def tearDownClass(cls):
        print()
        print("#")
        print("# Removing containers and volumes")
        print("#\n", flush=True)
        sh.docker_compose.down(remove_orphans=True, v=True, _fg=True)
        print(flush=True)

    def test_login_should_redirect_to_idm(self):
        response = requests.get("http://localhost/login/fiware/", allow_redirects=False)
        self.assertEqual(response.status_code, 302)
        location = urlparse(response.headers['Location'])
        self.assertEqual(location.scheme, 'https')
        self.assertEqual(location.netloc, 'accounts.example.com')
        self.assertEqual(location.path, '/oauth2/authorize')
        parameters = parse_qs(location.query)
        self.assertEqual(parameters['client_id'], ['wirecloud_test_client_id'])
        self.assertEqual(parameters['redirect_uri'], ['http://localhost/complete/fiware/'])


class CustomUserTests(unittest.TestCase, WireCloudTests):

    @classmethod
    def setUpClass(cls):
        print("\n################################################################################\n")
        print("#")
        print("# Initializing custom user test case")
        print("#\n", flush=True)

        sh.adduser("mycustomuser", system=True, group=True, shell="/bin/bash")
        uid = pwd.getpwnam("mycustomuser").pw_uid
        gid = grp.getgrnam("mycustomuser").gr_gid
        os.mkdir('wirecloud-data', 0o700)
        os.chown('wirecloud-data', uid, gid)
        os.mkdir('wirecloud-static', 0o700)
        os.chown('wirecloud-static', uid, gid)

        env = {}
        env.update(os.environ)
        env["WIRECLOUD_USER"] = "{}".format(uid)
        sh.docker_compose("-f", "docker-compose-custom-user.yml", "up", d=True, remove_orphans=True, _env=env, _fg=True)
        wait_until_running()
        print(flush=True)

    @classmethod
    def tearDownClass(cls):
        print()
        print("#")
        print("# Removing containers and volumes")
        print("#\n", flush=True)
        sh.docker_compose.down(remove_orphans=True, v=True, _fg=True)
        shutil.rmtree('wirecloud-data')
        shutil.rmtree('wirecloud-static')
        print(flush=True)


if __name__ == "__main__":
    unittest.main(verbosity=2)
