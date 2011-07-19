Introduction
============

Wirecloud is a gadgets container that allow the user to create and manage
workspaces where he can add gadget instances picked from a catalogue. One
big feature of Wirecloud is the capability to connect two or more gadgets
so that the events that one gadget emits can be received from other gadgets.
All this is easily configurable by the user. Other important feature is
sharing workspaces among users.

Wirecloud is a fork from the `EzWeb project`_. The main reason for doing
this fork is that we wanted to change the code in many incompatible ways
from the original one because it was a little bit bloated with many
different features added by different companies and sometime it was not
clear the benefits of such complexity. We believe a big cleanup was needed
and we think a more pluggable architecture is desirable to allow people
add their custom modifications without losing quality in the core. Other
reasons are more pragmatic like the lack of a good project infrastructure
that allow easy collaboration like a DVCS. Finally we think some of the
parts of EzWeb were not very Pythonic or even Djangoish and we wanted to
fix that too.

.. _EzWeb project: http://ezweb.morfeo-project.org/


TODO: write more information about the project and its features.
