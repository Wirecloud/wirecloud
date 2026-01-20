# Contributing to WireCloud

Looking to contribute something to WireCloud? **Here's how you can help.**

Please take a moment to review this document in order to make the contribution process easy and effective for everyone
involved.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this
open source project. In return, they should reciprocate that respect in addressing your issue or assessing patches and
features.

**Contents**

-   [Ground rules & expectations](#ground-rules-expectations)
-   [Using the issue tracker](#using-the-issue-tracker)
-   [Bug reports](#bug-reports)
-   [Feature requests](#feature-requests)
-   [Contributing code](#contributing-code)
    -   [Code Guidelines](#code-guidelines)
    -   [Code style git hooks](#code-style-git-hooks)
-   [Community](#community)

## Ground rules & expectations

Before we get started, here are a few things we expect from you (and that you should expect from others):

-   Be kind and thoughtful in your conversations around this project. We all come from different backgrounds and
    projects, which means we likely have different perspectives on "how open source is done." Try to listen to others
    rather than convince them that your way is correct.
-   This project is released with a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md). By participating in this
    project, you agree to abide by its terms.
-   If you open a pull request, you must sign the
    [Individual Contributor License Agreement](https://fiware.github.io/contribution-requirements/individual-cla.pdf) by
    stating in a comment _"I have read the CLA Document and I hereby sign the CLA"_
-   Please ensure that your contribution passes all tests. If there are test failures, you will need to address them
    before we can merge your contribution.
-   When adding content, please consider if it is widely valuable. Please don't add references or links to things you or
    your employer have created as others will do so if they appreciate it.

## Using the issue tracker

The [issue tracker](https://github.com/Wirecloud/wirecloud/issues) is the preferred channel for
[bug reports](#bug-reports) and [features requests](#feature-requests), but please respect the following restrictions:

-   Please **do not** use the issue tracker for personal support requests. Stack Overflow
    ([`fiware-wirecloud`](http://stackoverflow.com/questions/tagged/fiware-wirecloud) tag) is a better place to get
    help.

-   Please **do not** derail or troll issues. Keep the discussion on topic and respect the opinions of others.

## Bug reports

A bug is a _demonstrable problem_ that is caused by the code in the repository. Good bug reports are extremely helpful,
so thanks!

Guidelines for bug reports:

1. **Use the GitHub issue search** &mdash; check if the issue has already been reported.

2. **Check if the issue has been fixed** &mdash; try to reproduce it using the latest `master` or development branch in
   the repository.

3. **Isolate the problem** &mdash; ideally create a [reduced test case](http://css-tricks.com/6263-reduced-test-cases/)
   and a live example.

A good bug report shouldn't leave others needing to chase you up for more information. Please try to be as detailed as
possible in your report. What is your environment? What steps will reproduce the issue? What browser(s) and OS
experience the problem? Do other browsers show the bug differently? What would you expect to be the outcome? All these
details will help people to fix any potential bugs.

Example:

> Short and descriptive example bug report title
>
> A summary of the issue and the browser/OS environment in which it occurs. If suitable, include the steps required to
> reproduce the bug.
>
> 1. This is the first step
> 2. This is the second step
> 3. Further steps, etc.
>
> `<url>` - a link to the reduced test case
>
> Any other information you want to share that is relevant to the issue being reported. This might include the lines of
> code that you have identified as causing the bug, and potential solutions (and your opinions on their merits).

## Feature requests

Feature requests are welcome. But take a moment to find out whether your idea fits with the scope and aims of the
project. It's up to _you_ to make a strong case to convince the project's developers of the merits of this feature.
Please provide as much detail and context as possible.

## Contributing code

If you're ready to take the plunge & contribute back some code/docs, the process should look like:

-   Fork the project on GitHub into your own account.
-   Clone your copy of WireCloud.
-   Make a new branch in git & commit your changes there.
-   Push your new branch up to GitHub.
-   Again, ensure there isn't already an issue or pull request out there on it. If there is & you feel you have a better
    fix, please take note of the issue number & mention it in your pull request.
-   Create a new pull request (based on your branch), including what the problem/feature is, versions of your software &
    referencing any related issues/pull requests.

In order to be merged into WireCloud, contributions should follow the following recommendation as much as possible:

-   A solid patch that:
    -   is clear.
    -   works across all supported versions of Python/Django (take a look to the
        [documentation about testing](development/platform/testing.md))
    -   follows the [Code guidelines](#code-guidelines).
    -   comments included as needed.
-   A test case that demonstrates the previous flaw that now passes with the included patch.
-   If it adds/changes a public API, it must also include documentation for those changes.

You can manually test your changes by running WireCloud directly from the working copy source code repository. The
provided `settings.py` file will use a shared security key and a basic configuration (e.g. using `sqlite3`) so it is not
ready for a production environments, but can be used for simple manual tests. Those are the steps to be followed:

```bash
#
# Download your WireCloud repository
#

git clone https://github.com/${your_username}/wirecloud.git


#
# Enter into the source folder
#

cd wirecloud/src


#
# Install basic dependencies (see the installation guide, here are the ones for
# Debian/Ubuntu)
#

apt-get update
apt-get install python python-pip --no-install-recommends
apt-get install build-essential python-dev libxml2-dev libxslt1-dev zlib1g-dev libpcre3-dev libcurl4-openssl-dev libjpeg-dev
pip install -U pip setuptools


#
# Install WireCloud dependencies and WireCloud itself in development mode
#

python setup.py develop


#
# Install extra dependencies
#

pip install django-nose "mock>=1.0,<2.0"


#
# Init db
#

python manage.py migrate
python manage.py createsuperuser


#
# Execute the develpment server
#

python manage.py runserver


#
# Point your browser to http://localhost:8000
#
```

### Code guidelines

#### Python

-   Follow the [PEP 8 style rules](https://www.python.org/dev/peps/pep-0008/)
-   Use [`flake8`](http://flake8.pycqa.org/en/latest/) (or alternatively, `pep8` and `pyflakes` in combination)

#### JavaScript

-   Four spaces for indentation, never tabs.
-   strict mode.
-   "Attractive".
-   Use [`eslint`](http://eslint.org/) (there is a `.eslintrc` file on the source code of WireCloud ;-).

#### HTML

-   Four spaces for indentation, never tabs.
-   Double quotes only, never single quotes.
-   Always use proper indentation.
-   Use tags and elements appropriate for an XHTML5 doctype (e.g., self-closing tags).

#### SCSS

-   Multiple-line approach (one property and value per line).
-   Always a space after a property's colon (e.g., `display: block;` and not `display:block;`).
-   End all lines with a semi-colon.
-   Attribute selectors, like `input[type="text"]` should always wrap the attribute's value in double quotes, for
    consistency and safety (see this
    [blog post on unquoted attribute values](http://mathiasbynens.be/notes/unquoted-attribute-values) that can lead to
    XSS attacks).
-   Attribute selectors should only be used where absolutely necessary (e.g., form controls) and should be avoided on
    custom components for performance and explicitness.
-   Series of classes for a component should include a base class (e.g., `.component`) and use the base class as a
    prefix for modifier and sub-components (e.g., `.component-lg`).
-   Avoid inheritance and over nesting—use single, explicit classes whenever possible.
-   When feasible, default color palettes should comply with
    [WCAG color contrast guidelines](http://www.w3.org/TR/WCAG20/#visual-audio-contrast).
-   Except in rare cases, don't remove default `:focus` styles (via e.g. `outline: none;`) without providing alternative
    styles. See [this A11Y Project post](http://a11yproject.com/posts/never-remove-css-outlines/) for more details.


### Code style git hooks

WireCloud repository provides a `pre-commit` configuration file to provide automatic code style validation through the
use of git hooks. Currently this validation is configured for JavaScript and Python code.

We first need to install pre-commit onto the system. You can refer to the [pre-commit](https://pre-commit.com/#intro)
website for more in-depth information. On the basic scenario, you can install it by running the following command:

```
pip install pre-commit
```

Once installed, you can install git hooks on the working copy by running the following in the terminal:

```
pre-commit install
```

Now `pre-commit` will run automatically on `git commit`!

## Community

Discussions about the Open Source Guides take place on this repository's
[Issues](https://github.com/Wirecloud/wirecloud/issues) and [Pull Requests](https://github.com/Wirecloud/wirecloud/pulls)
sections. Anybody is welcome to join these conversations.

Wherever possible, do not take these conversations to private channels, including contacting the maintainers directly.
Keeping communication public means everybody can benefit and learn from the conversation.
