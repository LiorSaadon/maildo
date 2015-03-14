define(function (require) {
    "use strict";

    var app = require("mbApp");
    var TestModel = require("app/modules/mail/js/tempos/model");
    var TestCollection = require("app/modules/mail/js/tempos/collection");
    var data = require("json!app/modules/mail/js/tempos/data.json");

    var ServerActionsController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        ServerActionsController = Marionette.Controller.extend({

            initialize: function () {

                this.collection = new TestCollection();
                this.addItemResponses = 0;

                this.addNewItems();
                this.runTester();
            },

            //------------------------------------------------------
            // addItems
            //------------------------------------------------------

            addNewItems:function(){
                for(var i=0;i<data.length;i++){
                    this.addItem(data[i]);
                }
            },

            //--------------------------------------------------------

            addItem:function(dataModel){

                var model = new TestModel(dataModel);

                model.save(null, {
                    success: _.bind(function (model, response){
                        this.addItemResponses += 1;
                        console.log("great");
                    },this),
                    error: _.bind(function (model, response) {
                        this.addItemResponses += 1;
                        console.log(response.error);
                    },this)
                });
            },

            //------------------------------------------------------
            // runTester
            //------------------------------------------------------

            runTester:function(){

                if(this.addItemResponses === data.length){

                    if(!this.startFetching){
                        console.log("Data added successfully. Start fetching....");

                        this.startFetching = true;
                        this.getAll();
                        this.filterByInbox();
                        this.filterBySearchWord();

                        this.enoughBulshit = true;
                    }

//                    if(this.allItems && this.inboxFiltered && this.serachFiltered && !this.startDelete){
//                        console.log("Data fetched. Start deleting....");
//
//                       this.startDelete = true;
//                       this.removeItem();
//                       this.removeBulk();
//                    }

//                    if(this.itemRemoved && this.bulkRemoved && !this.startUpdate){
//                        this.startUpdate = true;
//
//                        this.updateFirst();
//                        this.updateLast2Items();
//
//                        this.enoughBulshit = true;
//                    }
                }

                 if(!this.enoughBulshit){
                    setTimeout(_.bind(function(){
                        this.runTester();
                    },this),300);
                }
            },

            //------------------------------------------------------

            getAll:function(){
                this.collection.fetch({
                    reset:true,
                    success: _.bind(function(collection, resp, options) {
                        this.allItems = true;
                        console.log("collection.size: " + this.collection.size());
                    },this),
                    error:_.bind(function(collection, resp, options) {
                        this.allItems = true;
                        console.log("getAll:error");
                    },this)
                });
            },

            //-------------------------------------------------------

            filterByInbox:function(){

                this.inboxFiltered = true;
            },

            //-------------------------------------------------------

            filterBySearchWord:function(){

                this.serachFiltered = true;
            },

            //-----------------------------------------------------------

            removeItem:function(){

                var model = this.collection.models[0];

                if(_.isObject(model)){
                    var id = model.id;

                    model.destroy({
                        success: _.bind(function(collection, resp, options) {
                            this.itemRemoved = true;
                            if(_.isEmpty(this.collection.findWhere({id:id}))){
                                console.log("remove successed");
                            }else{
                                console.log("remove failed");
                            }
                        },this),
                        error:_.bind(function(collection, resp, options) {
                            this.itemRemoved = true;
                            console.log("remove failed. (error)");
                        },this)
                    });
                }
            },

            //-----------------------------------------------------------

            removeBulk:function(){

                this.collection.destroy({

                    success: _.bind(function () {
                        this.bulkRemoved = true;
                        console.log("collection.size (after remove all)): " + this.collection.size());
                    }, this),
                    error:function(){
                        this.bulkRemoved = true;
                        console.log("remove bulk error");
                    }
                });
            }
        });
    });
    return ServerActionsController;
});