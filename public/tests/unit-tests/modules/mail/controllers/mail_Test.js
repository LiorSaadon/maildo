define(function (require) {
    "use strict";

       var SquirePlus = require("tests/setup/squirePlus");
       var Backbone  = require("backbone");
       var AppMock = require("tests/setup/AppMock");

        var squirePlus = new SquirePlus();

        var ContentLayout = function(){return new Backbone.Wreqr.CommandStorage();};

        var MailsView = sinon.stub().returns({
            render:function(){
                return "2";
            }
        });

        var PreviewView = sinon.stub().returns({x:"333"});
        var ComposeView = sinon.stub().returns({x:"333"});
        var EmptyMailView = sinon.stub().returns({x:"333"});

        squirePlus.mock("mbApp",AppMock);
        squirePlus.mock("mail-views/mailContentLayout", ContentLayout);
        squirePlus.mock("mail-views/mailsView", MailsView);
        squirePlus.mock("mail-views/previewView", PreviewView);
        squirePlus.mock("mail-views/composeView/composeView", ComposeView);
        squirePlus.mock("mail-views/emptyMailView", EmptyMailView);

        var t =  Backbone.Wreqr.radio.channel("name").vent;

        AppMock.moduleObject.channel = {
            reqres : {
                request:function(name){
                   return new Backbone.Collection();
                }
            },
            vent: t
        };

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

