/*
 *     Copyright (c) 2016-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements, TransitionEvent */


(function () {

    "use strict";

    describe("Alternatives", function () {
        var endTransition, dom = null;

        beforeEach(function () {
            dom = document.createElement('div');
            document.body.appendChild(dom);
        });

        afterEach(function () {
            if (dom != null) {
                dom.remove();
                dom = null;
            }
        });

        endTransition = function endTransition(element) {
            element.dispatchEvent(new TransitionEvent("transitionend"));
        };

        describe("new Alternatives([options])", function () {

            it("should support the full option", function () {
                var element = new StyledElements.Alternatives({full: false});
                expect(element.hasClassName('full')).toBe(false);
            });

            it("should support the id option", function () {
                var element = new StyledElements.Alternatives({id: 'myid'});
                expect(element.wrapperElement.id).toBe('myid');
            });
        });

        describe("clear()", function () {
            var element;

            beforeEach(function () {
                element = new StyledElements.Alternatives();
                element.appendTo(dom);
                element.createAlternative();
                element.createAlternative();
            });

            it("should remove all the alternatives", function () {
                expect(element.clear()).toBe(element);
                expect(element.alternativeList).toEqual([]);
            });

        });

        describe("createAlternative([options])", function () {

            var element;

            beforeEach(function () {
                element = new StyledElements.Alternatives();
                element.appendTo(dom);
            });

            it("should support create new alternatives without passing options", function () {
                var alt1, alt2;

                expect(element.visibleAlt).toBe(null);
                alt1 = element.createAlternative();
                expect(element.visibleAlt).toBe(alt1);
                alt2 = element.createAlternative();
                expect(element.visibleAlt).toBe(alt1);

                expect(element.alternativeList).toEqual([alt1, alt2]);
            });

            it("should support create new alternatives using the initiallyVisible option", function () {
                var alt1, alt2;

                spyOn(element, "showAlternative");

                expect(element.visibleAlt).toBe(null);
                alt1 = element.createAlternative({initiallyVisible: true});
                expect(element.visibleAlt).toBe(alt1);
                // Once we have a visibleAlt, the alternative is switched the using showAlternative method
                alt2 = element.createAlternative({initiallyVisible: true});

                expect(element.showAlternative).toHaveBeenCalledWith(alt2);
                expect(element.alternativeList).toEqual([alt1, alt2]);
            });

            it("should raise an exception when using an invalid value for the alternative_constructor option", function () {
                expect(function () {element.createAlternative({alternative_constructor: Object});}).toThrow(jasmine.any(TypeError));
            });

        });

        describe("getCurrentAlternative()", function () {

            it("should return the same value as the visibleAlt attribute", function () {
                var element = new StyledElements.Alternatives();
                expect(element.getCurrentAlternative()).toBe(element.visibleAlt);
                element.createAlternative();
                expect(element.getCurrentAlternative()).toBe(element.visibleAlt);
            });

        });

        describe("removeAlternative(alternative)", function () {
            var element, alt1, alt2, alt3;

            beforeEach(function () {
                element = new StyledElements.Alternatives();
                element.appendTo(dom);
                alt1 = element.createAlternative();
                alt2 = element.createAlternative();
                alt3 = element.createAlternative();
            });

            it("does nothing if alternative is null", function (done) {
                var listener = jasmine.createSpy("listener", function listener() {
                    expect(element.wrapperElement.children[0]).toBe(alt1.wrapperElement);
                    expect(element.wrapperElement.children[1]).toBe(alt2.wrapperElement);
                    expect(element.wrapperElement.children[2]).toBe(alt3.wrapperElement);
                });
                var p = element.removeAlternative(null, {onComplete: listener});

                expect(p).toEqual(jasmine.any(Promise));
                p.then(() => {
                    expect(element.alternativeList).toEqual([alt1, alt2, alt3]);
                    // Old behaviour, now deprecated in favour of promises
                    expect(listener).toHaveBeenCalled();
                    done();
                });
            });

            it("does nothing if alternative is not found", function (done) {
                var listener = jasmine.createSpy("listener").and.callFake(function () {
                    expect(element.alternativeList).toEqual([alt1, alt2, alt3]);
                    expect(element.wrapperElement.children[0]).toBe(alt1.wrapperElement);
                    expect(element.wrapperElement.children[1]).toBe(alt2.wrapperElement);
                    expect(element.wrapperElement.children[2]).toBe(alt3.wrapperElement);
                });

                var p = element.removeAlternative("myalt4", {onComplete: listener});

                expect(p).toEqual(jasmine.any(Promise));
                p.then(() => {
                    expect(element.alternativeList).toEqual([alt1, alt2, alt3]);
                    // Old behaviour, now deprecated in favour of promises
                    expect(listener).toHaveBeenCalled();
                    done();
                });
            });

            it("should allow to remove alternatives by id", function (done) {
                var listener = jasmine.createSpy("listener").and.callFake(function () {
                    expect(element.wrapperElement.children[0]).toBe(alt1.wrapperElement);
                    expect(element.wrapperElement.children[1]).toBe(alt3.wrapperElement);
                });

                var p = element.removeAlternative(alt2.getId(), {onComplete: listener});

                expect(element.alternativeList).toEqual([alt1, alt3]);
                expect(p).toEqual(jasmine.any(Promise));
                p.then(() => {
                    // Old behaviour, now deprecated in favour of promises
                    expect(listener).toHaveBeenCalled();
                    done();
                });
            });

            it("should allow to remove alternatives using Alternative instances", function (done) {
                var listener = jasmine.createSpy("listener").and.callFake(function () {
                    expect(element.wrapperElement.children[0]).toBe(alt1.wrapperElement);
                    expect(element.wrapperElement.children[1]).toBe(alt3.wrapperElement);
                });
                var p = element.removeAlternative(alt2, {onComplete: listener});

                expect(element.alternativeList).toEqual([alt1, alt3]);
                p.then(() => {
                    // Old behaviour, now deprecated in favour of promises
                    expect(listener).toHaveBeenCalled();
                    done();
                });
            });

            it("should raise an exception if the passed alternative is not owned by the alternatives element", function () {
                var other_alternatives = new StyledElements.Alternatives();
                var other_alt = other_alternatives.createAlternative();
                expect(() => {
                    element.removeAlternative(other_alt);
                }).toThrow(jasmine.any(TypeError));

                expect(element.alternativeList).toEqual([alt1, alt2, alt3]);
                expect(element.wrapperElement.children[0]).toBe(alt1.wrapperElement);
                expect(element.wrapperElement.children[1]).toBe(alt2.wrapperElement);
                expect(element.wrapperElement.children[2]).toBe(alt3.wrapperElement);
            });

            it("should allow to remove the active alternative", function (done) {
                var listener = jasmine.createSpy("listener").and.callFake(function () {
                    expect(element.visibleAlt).toBe(alt2);
                    expect(element.wrapperElement.children[0]).toBe(alt2.wrapperElement);
                    expect(element.wrapperElement.children[1]).toBe(alt3.wrapperElement);
                });

                expect(element.visibleAlt).toBe(alt1);

                var p = element.removeAlternative(alt1, {onComplete: listener});

                expect(element.alternativeList).toEqual([alt2, alt3]);

                p.then(() => {
                    // Old behaviour, now deprecated in favour of promises
                    expect(listener).toHaveBeenCalled();
                    done();
                });
            });

            it("should allow removing the active alternative when the active alternative is the right most alternative", function (done) {

                var listener = jasmine.createSpy("listener").and.callFake(function () {
                    expect(element.visibleAlt).toBe(alt2);
                    expect(element.wrapperElement.children[0]).toBe(alt1.wrapperElement);
                    expect(element.wrapperElement.children[1]).toBe(alt2.wrapperElement);
                });

                element.showAlternative(alt3).then(() => {
                    expect(element.visibleAlt).toBe(alt3);

                    var p = element.removeAlternative(alt3, {onComplete: listener});
                    expect(element.alternativeList).toEqual([alt1, alt2]);
                    p.then(() => {
                        // Old behaviour, now deprecated in favour of promises
                        expect(listener).toHaveBeenCalled();
                        done();
                    });
                });
            });

            it("should allow to remove all the alternatives", function (done) {
                var listener = function listener() {
                    expect(element.visibleAlt).toEqual(null);
                    expect(element.wrapperElement.children.length).toBe(0);
                    done();
                };

                element.removeAlternative(alt1);
                element.removeAlternative(alt2);
                element.removeAlternative(alt3, {onComplete: listener});

                expect(element.alternativeList).toEqual([]);
            });

        });

        describe("repaint(temporal)", function () {
            var element, alt1, alt2, alt3;

            beforeEach(function () {
                element = new StyledElements.Alternatives();
                element.appendTo(dom);
                alt1 = element.createAlternative();
                spyOn(alt1, 'repaint');
                alt2 = element.createAlternative();
                spyOn(alt2, 'repaint');
                alt3 = element.createAlternative();
                spyOn(alt3, 'repaint');
            });

            it("should no crash if there are no alternatives", function () {
                // Create an empty alternatives for this tests
                element = new StyledElements.Alternatives();
                element.appendTo(dom);
                expect(element.repaint(true)).toBe(element);
            });

            it("should call to the repaint method of the visible alternative when doing a temporal repaint", function () {
                expect(element.repaint(true)).toBe(element);
                expect(alt1.repaint).toHaveBeenCalledWith(true);
                expect(alt2.repaint).not.toHaveBeenCalled();
                expect(alt3.repaint).not.toHaveBeenCalled();
            });

            it("should call to the repaint method of the visible alternative when doing a normal repaint", function () {
                expect(element.repaint()).toBe(element);
                expect(alt1.repaint).toHaveBeenCalledWith(false);
                expect(alt2.repaint).not.toHaveBeenCalled();
                expect(alt3.repaint).not.toHaveBeenCalled();
            });
        });

        describe("showAlternative(alternative[, options])", function () {
            var element, alt1, alt2, alt3;

            beforeEach(function () {
                element = new StyledElements.Alternatives();
                element.appendTo(dom);
                alt1 = element.createAlternative();
                alt2 = element.createAlternative();
                alt3 = element.createAlternative();
            });

            it("throws an exception if alternative is null", function () {
                expect(function () {element.showAlternative(null);}).toThrow(jasmine.any(TypeError));
            });

            it("throws an exception if alternative is not a valid alternative id", function () {
                expect(function () {element.showAlternative("myalt4");}).toThrow(jasmine.any(TypeError));
            });

            it("should raise an exception if the passed alternative is not owned by the alternatives element", function () {
                var other_alternatives = new StyledElements.Alternatives();
                var other_alt = other_alternatives.createAlternative();
                expect(function () {element.showAlternative(other_alt);}).toThrow(jasmine.any(TypeError));
            });

            it("does nothing if the passed alternative is the visible alternative", function (done) {
                var p = element.showAlternative(alt1);

                expect(p).toEqual(jasmine.any(Promise));
                p.then(() => {
                    expect(element.visibleAlt).toBe(alt1);
                    done();
                });
            });

            it("should call the onComplete listener", function (done) {
                var listener = jasmine.createSpy("listener");

                var p = element.showAlternative(alt3, {
                    onComplete: listener
                });

                expect(p).toEqual(jasmine.any(Promise));
                p.then(() => {
                    expect(element.visibleAlt).toBe(alt3);
                    done();
                });
            });

            it("should allow to use alternative ids", function (done) {
                var listener = jasmine.createSpy("listener").and.callFake(function () {
                    expect(element.visibleAlt).toBe(alt2);
                });

                var p = element.showAlternative(alt2.getId(), {
                    onComplete: listener
                });

                expect(p).toEqual(jasmine.any(Promise));
                p.then(() => {
                    expect(listener).toHaveBeenCalledWith(element, alt1, alt2);
                    done();
                });
            });

            it("should allow to use the effect option (horizontal slide)", function (done) {
                var listener = function listener(_element, _alt1, _alt2) {
                    expect(element.visibleAlt).toBe(alt2);
                    expect(_element).toBe(element);
                    expect(_alt1).toBe(alt1);
                    expect(_alt2).toBe(alt2);

                    expect(alt1.addClassName).toHaveBeenCalledWith("slide");
                    expect(alt2.addClassName).toHaveBeenCalledWith(['slide', 'right']);
                    expect(alt1.hasClassName('slide')).toBeFalsy();
                    expect(alt2.hasClassName('slide')).toBeFalsy();

                    done();
                };

                spyOn(alt1, "addClassName").and.callThrough();
                spyOn(alt2, "addClassName").and.callThrough();
                element.showAlternative(alt2, {effect: StyledElements.Alternatives.HORIZONTAL_SLIDE, onComplete: listener});

                // Continue with the animation effect
                setTimeout(function () {
                    endTransition(alt1.get());
                    endTransition(alt2.get());
                }, 15);
            });

            it("should allow to use the effect option (horizontal slide, left-to-right)", function (done) {
                var listener = function listener(_element, _alt2, _alt1) {
                    expect(element.visibleAlt).toBe(alt1);
                    expect(_element).toBe(element);
                    expect(_alt1).toBe(alt1);
                    expect(_alt2).toBe(alt2);

                    expect(alt1.addClassName).toHaveBeenCalledWith(['slide', 'left']);
                    expect(alt2.addClassName).toHaveBeenCalledWith("slide");
                    expect(alt1.hasClassName('slide')).toBeFalsy();
                    expect(alt2.hasClassName('slide')).toBeFalsy();

                    done();
                };

                element.showAlternative(alt2);

                spyOn(alt1, "addClassName").and.callThrough();
                spyOn(alt2, "addClassName").and.callThrough();
                element.showAlternative(alt1, {effect: StyledElements.Alternatives.HORIZONTAL_SLIDE, onComplete: listener});

                // Continue with the animation effect
                setTimeout(function () {
                    endTransition(alt1.get());
                    endTransition(alt2.get());
                }, 15);
            });

            it("should allow to use the effect option (cross dissolve)", function (done) {
                var listener = function listener(_element, _alt1, _alt2) {
                    expect(element.visibleAlt).toBe(alt2);
                    expect(_element).toBe(element);
                    expect(_alt1).toBe(alt1);
                    expect(_alt2).toBe(alt2);

                    expect(alt1.addClassName).toHaveBeenCalledWith("fade in");
                    expect(alt2.addClassName).toHaveBeenCalledWith("fade");
                    expect(alt1.hasClassName('fade')).toBeFalsy();
                    expect(alt2.hasClassName('fade')).toBeFalsy();

                    done();
                };

                spyOn(alt1, "addClassName").and.callThrough();
                spyOn(alt2, "addClassName").and.callThrough();
                element.showAlternative(alt2, {effect: StyledElements.Alternatives.CROSS_DISSOLVE, onComplete: listener});

                // Continue with the animation effect
                setTimeout(function () {
                    endTransition(alt1.get());
                    endTransition(alt2.get());
                }, 15);
            });

            it("should allow to use the effect option (none)", function (done) {
                var listener = function listener(_element, _alt1, _alt2) {
                    expect(element.visibleAlt).toBe(alt2);
                    expect(_element).toBe(element);
                    expect(_alt1).toBe(alt1);
                    expect(_alt2).toBe(alt2);

                    done();
                };

                element.showAlternative(alt2, {effect: StyledElements.Alternatives.NONE, onComplete: listener});
            });

            it("should allow to use the effect option (invalid value, should be equivalent to none)", function (done) {
                var listener = function listener(_element, _alt1, _alt2) {
                    expect(element.visibleAlt).toBe(alt2);
                    expect(_element).toBe(element);
                    expect(_alt1).toBe(alt1);
                    expect(_alt2).toBe(alt2);

                    done();
                };

                element.showAlternative(alt2, {effect: "invalid", onComplete: listener});
            });
        });
    });

})();
