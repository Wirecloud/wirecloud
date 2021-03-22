## [Unreleased] WireCloud v1.4.0 (FIWARE 7.9.2)

### Main changes between WireCloud 1.3.1 and 1.4.0:

- Added support for Django 2.0, 2.1 and 2.2. See #446, #448, #453
- NGSI-LD support. See #500
- Allow to duplicate workspaces from the user interface. See #493
- Switched from Travis CI to GitHub Actions for CI. See #496
- JavaScript code modernization. See #486, #502
- Support for a new sharing mode: public-authenticated. Also allow sharing with
  groups in addition to allow sharing with organizations and users. See #428,
  #478
- Improvements into the switching user feature. Also documentation about this
  feature has been created. See #435
- New layout: SidebarLayout. See #438, #466 and #501
- Improvements regarding widget placement when using the overlay layout
  (`FreeLayout`). See #443, #445, #459, #473, #490
- Improve context information. Now the organizations and the groups the current
  user belongs to can be retrived as context information. See #457, #458
- Minor improvements and fixes: #436, #439, #440, #441, #442, #444, #451, #452,
  #454, #455, #456, #463, #464, #465, #467, #470, #477, #479, #480, #481, #484,
  #484, #485, #491, #492


### Removed deprecated features

- Dropped support for the workspace managers feature. See #429
- Dropped 4CaaSt code (FP7 proyect). See #460
- Dropped Django 1.10 and Django 1.11. See #448

### Foreseen changes

Next major version of WireCloud:
- Will drop support for Django 2.0 and 2.1. Support for Django 3.x



## WireCloud v1.3.1 (FIWARE v7.7.1) - 21/07/1029

### Main changes between WireCloud 1.2.0 and 1.3.x:

- New Edit mode and support for configuring when to show or hide widget titles. See #358, #407, #408, #414 and #416.
- Improved support for full dragboard widgets. See #411.
- Updated NGSI bindings to v1.2.1.
- Updated Font Awesome to v5. See #403 and #415.
- Improved support for organizations. See #335.
- New docker image for deploying WireCloud catalogues. See #382.
- Added Japanese translation. See #396 and #417
- Minor improvements and fixes: #273, #356, #362, #363, #366, #368, #381, #386, #384, #387, #389, #393, #397, #398 #401, #405, #409, #419, #421, #425 and #426.


- Added support for KeyRock v7. Also, when KeyRock support is enabled, users with the `admin` role assigned in KeyRock will have administration permissions in WireCloud. See #347, #332

### Removed deprecated features

- Dropped Django 1.9 support. See #391
- Dropped support for python 2. See #355 and #402
- Dropped support for the `resetsearchindexes` command, please use the `rebuild_index` command from haystack. See #357

### Foreseen changes

Next major version of WireCloud:
- Will drop support for Django 1.10 and 1.11. Support for Django 2.0 and 2.1 will be added and adding support for Django 2.2 will be analysed.
- Will move to django-channels 2.x



## WireCloud v1.2.0 (FIWARE v7.4.1) - 25/10/2018

### Main changes between WireCloud 1.1.0 and 1.2.x:

- Use django-haystack for search indexes, supporting ElasticSearch and Solr in addition to the already supported whoosh backend. See #280, #316, #336, #348 and #354.
- Added support for KeyRock v7. Also, when KeyRock support is enabled, users with the `admin` role assigned in KeyRock will have administration permissions in WireCloud. See #347, #332
- Updated NGSI bindings to v1.2.0. See #351.
- Improved support for organizations. See #335.
- Minor improvements and fixes: #310, #320, #321, #328, #333, #334, #337, #338, #339, #341, #342, #343, #344, #345, #346, #349, #350, #351, #352 and #353.

### Removed deprecated features

- Removed support for KeyRock v5. See #347
- Removed support for the old Marketplace and Store FIWARE GEs. See #314.
- Dropped Django 1.8 support. See #313

### Foreseen changes

Next major version of WireCloud:
- Will drop support for Django 1.9 and 1.10 but will add support for Django 2.0 and 2.1.
- Will drop support for Python 2. The next major release, WireCloud 1.3, will only support Python 3.4+.
- Will move to django-channels 2.x
- Will drop the `resetsearchindexes` commannd
