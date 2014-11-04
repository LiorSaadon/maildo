define(function (require) {
    "use strict";

    require(["backbone", "tests/setup/squirePlus","tests/setup/AppMock"], function (Backbone, squirePlus, AppMock) {

        var squirePlus = new squirePlus();


        var ContentLayout = function(){return new Backbone.Wreqr.CommandStorage();};

        var MailsView = function(){return{
            "P":"dummy"
        }};

        var PreviewView = function(){return{
            "P":"dummy"
        }};

        var ComposeView = function(){return{
            "P":"dummy"
        }};

        var EmptyMailView= function(){return{
            "P":"dummy"
        }};

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

        squirePlus.require(["mail-controllers/mailContentLayoutController"], function (MailContentLayoutController) {

            describe('Foobar', function() {
                describe('#sayHello()', function() {
                    it('should return some text', function() {
                        var mailContentLayoutController = new MailContentLayoutController();
                        mailContentLayoutController.newLayout();
                        chai.assert.equal('Hello World!', 'Hello World!');
                    })
                })
            });

            mocha.run();
        });

    });
});

