define(function (require) {
    "use strict";

        var squirePlus = require("tests/setup/squirePlus");
        var mock = require("tests/mocks/test1");

        squirePlus.require(["tests/code/layoutController"], function (LayoutController) {

            describe('Foobar', function() {
                describe('#sayHello()', function() {
                    it('should return some text', function() {
                        var layoutController = new LayoutController();
                        var layout = layoutController.newLayout();
                        var t = layout.render();
                        assert.equal(t, "2");
                    })
                })
            });
            mocha.run();
        });
});

