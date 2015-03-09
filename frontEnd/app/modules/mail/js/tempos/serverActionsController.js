define(function (require) {
    "use strict";

    var app = require("mbApp");
    var TestModel = require("app/modules/mail/js/tempos/model");
    var TestCollection = require("app/modules/mail/js/tempos/collection");

    var ServerActionsController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        ServerActionsController = Marionette.Controller.extend({

            initialize: function () {
                this.testCollection = new TestCollection();
            },

            //-----------------------------------------------------------

            addItem:function(){

                var model = new TestModel({
                    "userId":"1",
                    "from": "demo@mailbone.com",
                    "to": "patricia.white@mailbone.com;michael.martin@mailbone.com;",
                    "cc": "williams@mailbone.com",
                    "bcc": "",
                    "subject": "Things You Can Do With JavaScript",
                    "sentTime": "2014-04-12 15:06:51",
                    "body": "later",
                    "relatedBody": "mail1",
                    "labels": {
                        "read": true,
                        "starred": true,
                        "important": true
                    },
                    "groups": {
                        "sent": true
                    }
                });

                model.save(null, {
                    success:function (model, response){
                        window.localStorage.setItem("lastCreateItem", model.id);
                        debugger;
                    },
                    error:function (model, response) {
                        console.log("error");
                        debugger;
                    }
                });
            },

            //-----------------------------------------------------------

            getItems:function(){
                this.testCollection.fetch({
                    reset:true,
                    success: _.bind(function(collection, resp, options) {
                        console.log("size: " + this.testCollection.size());
                    },this),
                    error:function(collection, resp, options) {
                        console.log("error:getItem");
                    }
                })
            },

            //-----------------------------------------------------------

            deleteItem:function(){

                var modeId = window.localStorage.getItem("lastCreateItem");

                if(!_.isEmpty(modeId)){

                    var model = this.testCollection.find({id:modeId});

                    if(_.isObject(model)){
                        model.destroy({
                            success: _.bind(function(collection, resp, options) {
                                window.localStorage.removeItem("lastCreateItem");
                            },this),
                            error:function(collection, resp, options) {
                                console.log("error:deleteItem");
                            }
                        })
                    }
                }
            }
        });
    });
    return ServerActionsController;
});
