define(function (require) {
    "use strict";

    require(["tests/setup/squirePlus"], function (squirePlus) {

        var squirePlus = new squirePlus();

        //var ContentLayout = require("tests/unit-tests/modules/mail/mocks/ContentLayout_mock");

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

        var EmptyMailView= function(){return{
            "P":"dummy"
        }};

        squirePlus.mock("mail-views/mailContentLayout", ContentLayout);
        squirePlus.mock("mail-views/mailsView", MailsView);
        squirePlus.mock("mail-views/previewView", PreviewView);
        squirePlus.mock("mail-views/composeView/composeView", ComposeView);
        squirePlus.mock("mail-views/emptyMailView", EmptyMailView);

        //************************************************************************************
        // Start testing....
        //************************************************************************************

        squirePlus.require(["mail-controllers/mailContentLayoutController"], function (MailContentLayoutController) {

            var mailContentLayoutController = new MailContentLayoutController();

            mailContentLayoutController.newLayout();
        });
    });

});

