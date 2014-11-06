define(function (require) {
    "use strict";

    var squirePlus = require("tests/setup/squirePlus");
    var AppMock = require("tests/mocks/app");
    var Backbone  = require("backbone");

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
});

