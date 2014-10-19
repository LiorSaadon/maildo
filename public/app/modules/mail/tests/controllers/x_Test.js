define(function (require) {
    "use strict";

    var LETestEnvironment = require("squire/squire1");

    var environment = new LETestEnvironment({module: "mail"});

    var ContentLayout = function(){return{
        "P":"dummy"
    }};

    var MailsView = function(){return{
        "P":"dummy"
    }};

    var PreviewView = function(){return{
        "P":"dummy"
    }};

    var ComposeView = function(){return{
        "P":"dummy"
    }};

    var EmptyMailView = function(){return{
        "P":"dummy"
    }};

    environment.addDependencyMock("mail-views/mailContentLayout", environment.constructs(ContentLayout));
    environment.addDependencyMock("mail-views/mailsView", environment.constructs(MailsView));
    environment.addDependencyMock("mail-views/previewView", environment.constructs(PreviewView));
    environment.addDependencyMock("mail-views/composeView/composeView", environment.constructs(ComposeView));
    environment.addDependencyMock("mail-views/emptyMailView", environment.constructs(EmptyMailView));

    //************************************************************************************
    // Start testing....
    //************************************************************************************

    environment.require(["mail-controllers/mailContentLayoutController"], function (MailContentLayoutController) {

        var mailContentLayoutController = new MailContentLayoutController();

    });
});

