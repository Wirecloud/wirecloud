# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

"""
MIME-Type Parser

This module provides basic functions for handling mime-types. It can handle
matching mime-types against a list of media-ranges. See section 14.1 of the
HTTP specification [RFC 2616] for a complete explanation.

   http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.1

Contents:
 - parse_mime_type():   Parses a mime-type into its component parts.
 - parse_media_range(): Media-ranges are mime-types with wild-cards and a 'q'
                          quality parameter.
 - best_match():        Choose the mime-type with the highest quality ('q')
                          from a list of candidates.
"""

from functools import reduce


class InvalidMimeType(Exception):
    pass


def parse_mime_type(mime_type, split_type=False):
    """Parses a mime-type into its component parts.

    If split_type is True, this method carves up a mime-type and returns a
    tuple of the (type, subtype, params) where 'params' is a dictionary of all
    the parameters for the media range.

    For example, the media range 'application/xhtml;q=0.5' would get parsed
    into:

       ('application', 'xhtml', {'q', '0.5'})

    If split_type is False, this method carves up a mime-type and returns a
    tuple of the (fulltype, params) where 'params' is a dictionary of all
    the parameters for the media range.

    For example, the media range 'application/xhtml;q=0.5' would get parsed
    into:

       ('application/xhtml', {'q', '0.5'})

       """
    parts = mime_type.split(';')
    params = dict([tuple(s.strip() for s in param.split('=', 1)) for param in parts[1:]])
    full_type = parts[0].strip()
    # Java URLConnection class sends an Accept header that includes a
    # single '*'. Turn it into a legal wildcard.
    if full_type == '*':
        full_type = '*/*'

    try:
        (type, subtype) = full_type.split('/')
    except ValueError:
        raise InvalidMimeType(full_type)

    if split_type:
        return (type.strip(), subtype.strip(), params)
    else:
        return (type.strip() + "/" + subtype.strip(), params)


def parse_media_range(range):
    """Parse a media-range into its component parts.

    Carves up a media range and returns a tuple of the (type, subtype,
    params) where 'params' is a dictionary of all the parameters for the media
    range.  For example, the media range 'application/*;q=0.5' would get parsed
    into:

       ('application', '*', {'q', '0.5'})

    In addition this function also guarantees that there is a value for 'q'
    in the params dictionary, filling it in with a proper default if
    necessary.
    """
    (type, subtype, params) = parse_mime_type(range, split_type=True)
    if 'q' not in params or not params['q'] or \
            not float(params['q']) or float(params['q']) > 1\
            or float(params['q']) < 0:
        params['q'] = '1'

    return (type, subtype, params)


def fitness_and_quality_parsed(mime_type, parsed_ranges):
    """Find the best match for a mime-type amongst parsed media-ranges.

    Find the best match for a given mime-type against a list of media_ranges
    that have already been parsed by parse_media_range(). Returns a tuple of
    the fitness value and the value of the 'q' quality parameter of the best
    match, or (-1, 0) if no match was found. Just as for quality_parsed(),
    'parsed_ranges' must be a list of parsed media ranges.
    """
    best_fitness = -1
    best_fit_q = 0
    (target_type, target_subtype, target_params) = parse_media_range(mime_type)
    for (type, subtype, params) in parsed_ranges:
        type_match = (type == target_type or type == '*' or target_type == '*')
        subtype_match = (subtype == target_subtype or subtype == '*' or target_subtype == '*')
        if type_match and subtype_match:
            param_matches = reduce(
                lambda x, y: x + y,
                [1 for (key, value) in target_params.items() if key != 'q' and key in params and value == params[key]],
                0
            )
            fitness = (type == target_type) and 100 or 0
            fitness += (subtype == target_subtype) and 10 or 0
            fitness += param_matches
            if fitness > best_fitness:
                best_fitness = fitness
                best_fit_q = params['q']

    return best_fitness, float(best_fit_q)


def best_match(supported, header):
    """Return mime-type with the highest quality ('q') from list of candidates.

    Takes a list of supported mime-types and finds the best match for all the
    media-ranges listed in header. The value of header must be a string that
    conforms to the format of the HTTP Accept: header. The value of 'supported'
    is a list of mime-types. The list of supported mime-types should be sorted
    in order of increasing desirability, in case of a situation where there is
    a tie.

    >>> best_match(['application/xbel+xml', 'text/xml'],
                   'text/*;q=0.5,*/*; q=0.1')
    'text/xml'
    """
    parsed_header = []
    for range in header.split(','):
        try:
            parsed_header.append(parse_media_range(range))
        except InvalidMimeType:
            # Ingore invalid media range
            pass

    weighted_matches = []
    for mime_type in supported:
        (score, quality) = fitness_and_quality_parsed(mime_type, parsed_header)
        if quality > 0:
            weighted_matches.append((quality, score, mime_type))
    weighted_matches.sort()

    return weighted_matches and weighted_matches[-1][2] or ''
