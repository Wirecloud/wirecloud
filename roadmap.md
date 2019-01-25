# WireCloud Roadmap

This product is a FIWARE Generic Enabler. If you would like to learn about the
overall Roadmap of FIWARE, please check section "Roadmap" on the FIWARE
Catalogue.


## Introduction

This section elaborates on proposed new features or tasks which are expected to
be added to the product in the foreseeable future. There should be no assumption
of a commitment to deliver these features on specific dates or in the order
given. The development team will be doing their best to follow the proposed
dates and priorities, but please bear in mind that plans to work on a given
feature or task may be revised. All information is provided as a general
guidelines only, and this section may be revised to provide newer information at
any time.


## Short term

The following list of features are planned to be addressed in the short term,
and incorporated in the next release of the product planned for
**February 2019**:

* Create a catalogue outside FIWARE Lab for the official components.


## Medium term

The following list of features are planned to be addressed in the medium term,
typically within the subsequent release(s) generated in the next **9 months**
after next planned release:

* Edit mode (see more detailed description below)
* New layout modes.
* Support for Django 1.9 and 1.10 will be dropped and support for Django 2.0
  and 2.1 added.
* Support for Python 2 will be also dropped. The next major release, WireCloud
  1.3, will only support Python 3.4+.
* WireCloud 1.3 will use move to use django-channels 2.x


### Edit mode

After introduction of the edit mode into WireCloud, workspaces will be loaded
in execution mode by default, having to click on the edit button for being able
to make modifications onto the workspace.

This mode will simplify the implementation and evolution of other features, like
the implementation of widgets without titles (See #67), improving the behaviour
of minimized widgets, etc.


## Long term

The following list of features are proposals regarding the longer-term evolution
of the product even though development of these features has not yet been
scheduled for a release in the near future. Please feel free to contact us if
you wish to get involved in the implementation or influence the roadmap

* "Responsive" dashboards. Improve dashboard configurability to better
  visualization in different devices: mobile, desktop, video walls, ...
* More layout modes.
