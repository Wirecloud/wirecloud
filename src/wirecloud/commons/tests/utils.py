# -*- coding: utf-8 -*-

# Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.test import TestCase

from wirecloud.commons.utils.html import clean_html


class HTMLCleanupTestCase(TestCase):

    tags = ('wirecloud-html-cleanup',)

    def test_scripts_are_removed(self):
        self.assertEqual(clean_html('<script>asdfas</script>'), '')
        self.assertEqual(clean_html('start content <script>asdfas</script> valid content'), 'start content  valid content')

    def test_event_attributes_are_removed(self):
        self.assertEqual(clean_html('<div onclick="evil_script();" class="alert">content</div>'), '<div class="alert">content</div>')

    def test_processing_instructions_are_removed(self):
        self.assertEqual(clean_html('<div class="alert"><?php echo "<p>Hello World</p>"; ?>content</div>'), '<div class="alert">content</div>')

    def test_audio_elements_are_removed(self):
        initial_code = '<div class="alert"><audio controls="controls"><source src="sound.ogg" type="audio/ogg"/><source src="sound.mp3" type="audio/mpeg"/>Your browser does not support the audio tag.</audio>content</div>'
        self.assertEqual(clean_html(initial_code), '<div class="alert">content</div>')

    def test_video_elements_need_controls(self):
        initial_code = '<video><source src="movie.mp4" type="video/mp4"/><source src="movie.ogg" type="video/ogg"/>Your browser does not support the video tag.</video>content'
        expected_code = '<video controls="controls"><source src="movie.mp4" type="video/mp4"/><source src="movie.ogg" type="video/ogg"/>Your browser does not support the video tag.</video>content'
        self.assertEqual(clean_html(initial_code), expected_code)

    def test_links_are_forced_to_target_blank(self):
        self.assertEqual(clean_html('<div class="alert">Follow this <a href="http://example.com">link</a></div>'), '<div class="alert">Follow this <a href="http://example.com" target="_blank">link</a></div>')

    def test_relative_links_are_removed(self):
        initial_code = '<div class="alert">Follow this <a href="files/insecure_content.exe">link</a></div>'
        expected_code = '<div class="alert">Follow this link</div>'
        self.assertEqual(clean_html(initial_code), expected_code)

    def test_relative_image_urls(self):
        initial_code = 'Example image: <img src="images/example.png"/>'
        expected_code = 'Example image: <img src="http://example.com/images/example.png"/>'
        self.assertEqual(clean_html(initial_code, base_url='http://example.com'), expected_code)
