/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/* globals Wirecloud */


(function () {

    "use strict";

    describe("Version", function () {

        describe("new Version(version)", function () {

            it("should throw a TypeError when not passing the version parameter", function () {
                expect(function () {
                    new Wirecloud.Version();
                }).toThrowError(TypeError);
            });

            describe("should throw a TypeError if the passed version is not valid", function () {
                const test = (version) => {
                    it(version, () => {
                        expect(() => {
                            new Wirecloud.Version(version);
                        }).toThrowError(TypeError);
                    });
                };

                test('invalid version');
                test('1abc');
                test('1.01');
                test('1.0a01');
                test('1.0b01');
                test('1.0rc01');
                test('1.0rcc1');
            });

        });

        describe("compareTo(version)", function () {

            it("should allow passing strings to the version parameter", function () {
                const version1 = new Wirecloud.Version('1.0');
                expect(version1.compareTo("2.0")).toBeLessThan(0);
            });

            it("should throw TypeError exception if the version strings cannot be parsed as a version", function () {
                const version1 = new Wirecloud.Version('1.0');
                expect(function () {
                    version1.compareTo("invalid version");
                }).toThrowError(TypeError);
            });

            describe("should return a number less than zero", function () {
                const test = function test(version1, version2) {
                    expect(version1.compareTo(version2)).toBeLessThan(0);
                };

                it("(1.0 < 1.0.1)", test.bind(null, new Wirecloud.Version("1.0"), new Wirecloud.Version("1.0.1")));
                it("(1.0a1 < 1.0)", test.bind(null, new Wirecloud.Version("1.0a1"), new Wirecloud.Version("1.0")));
                it("(1.0a2 < 1.0a10)", test.bind(null, new Wirecloud.Version("1.0a2"), new Wirecloud.Version("1.0a10")));
                it("(1.0a2 < 1.0b1)", test.bind(null, new Wirecloud.Version("1.0a2"), new Wirecloud.Version("1.0b1")));
                it("(1.0b2 < 1.0b10)", test.bind(null, new Wirecloud.Version("1.0b2"), new Wirecloud.Version("1.0b10")));
                it("(1.0b9 < 1.0rc1)", test.bind(null, new Wirecloud.Version("1.0b9"), new Wirecloud.Version("1.0rc1")));
                it("(1.0rc2 < 1.0rc10)", test.bind(null, new Wirecloud.Version("1.0rc2"), new Wirecloud.Version("1.0rc10")));
                it("(1.0rc9 < 1.0-dev)", test.bind(null, new Wirecloud.Version("1.0rc9"), new Wirecloud.Version("1.0-dev")));
                it("(1.0-dev < 1.0)", test.bind(null, new Wirecloud.Version("1.0-dev"), new Wirecloud.Version("1.0")));
            });

            describe("should return zero for equivalent versions", function () {
                const test = function test(version1, version2) {
                    expect(version1.compareTo(version2)).toBe(0);
                };

                it("(1.0 == 1.0.0)", test.bind(null, new Wirecloud.Version("1.0"), new Wirecloud.Version("1.0.0")));
                it("(1.0.0 == 1.0)", test.bind(null, new Wirecloud.Version("1.0.0"), new Wirecloud.Version("1.0")));
                it("(1.0a1 == 1.0.0a1)", test.bind(null, new Wirecloud.Version("1.0a1"), new Wirecloud.Version("1.0.0a1")));
                it("(1.0b1 == 1.0.0b1)", test.bind(null, new Wirecloud.Version("1.0b1"), new Wirecloud.Version("1.0.0b1")));
                it("(1.0rc1 == 1.0.0rc1)", test.bind(null, new Wirecloud.Version("1.0rc1"), new Wirecloud.Version("1.0.0rc1")));
                it("(1.0-dev == 1.0.0-dev)", test.bind(null, new Wirecloud.Version("1.0-dev"), new Wirecloud.Version("1.0.0-dev")));
                it("(1.0-deva == 1.0.0-deva)", test.bind(null, new Wirecloud.Version("1.0-deva"), new Wirecloud.Version("1.0.0-deva")));
            });

            describe("should return a positive number if the version is greater than the specified version", function () {
                const test = function test(version1, version2) {
                    expect(version1.compareTo(version2)).toBeGreaterThan(0);
                };

                it("(1.0 > 0.9)", test.bind(null, new Wirecloud.Version("1.0"), new Wirecloud.Version("0.9")));
                it("(1.0a10 > 1.0a9)", test.bind(null, new Wirecloud.Version("1.0a10"), new Wirecloud.Version("1.0a9")));
                it("(1.0b1 > 1.0a9)", test.bind(null, new Wirecloud.Version("1.0b1"), new Wirecloud.Version("1.0a9")));
                it("(1.0b10 > 1.0b9)", test.bind(null, new Wirecloud.Version("1.0b10"), new Wirecloud.Version("1.0b9")));
                it("(1.0rc1 > 1.0b9)", test.bind(null, new Wirecloud.Version("1.0rc1"), new Wirecloud.Version("1.0b9")));
                it("(1.0rc10 > 1.0rc9)", test.bind(null, new Wirecloud.Version("1.0rc10"), new Wirecloud.Version("1.0rc9")));
                it("(1.0 > 1.0rc9)", test.bind(null, new Wirecloud.Version("1.0"), new Wirecloud.Version("1.0rc9")));
                it("(1.0rc1 > 1.0rc1-dev)", test.bind(null, new Wirecloud.Version("1.0rc1"), new Wirecloud.Version("1.0rc1-dev")));
                it("(1.0-dev > 1.0b9)", test.bind(null, new Wirecloud.Version("1.0-dev"), new Wirecloud.Version("1.0b9")));
            });

            it("should return a non-zero value for different dev versions", function () {
                const version1 = new Wirecloud.Version('1.0-deva');
                expect(version1.compareTo("1.0-devb")).not.toBe(0);
            });

        });

        describe("toString()", function () {

            it("should simplify dev versions", function () {
                const version = new Wirecloud.Version("1.0-devadmin");
                expect(version.toString()).toEqual("1.0-dev");
            });

        });

    });

})();
