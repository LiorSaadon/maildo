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
                        console.log("greatos");
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
                    //
                    //if(this.allItems && this.inboxFiltered && this.serachFiltered && !this.startUpdate){
                    //    console.log("Start updating....");
                    //
                    //    this.startUpdate = true;
                    //    this.updateItem();
                    //    this.updateBulk();
                    //}
                    //
                    //if(this.itemUpdated && this.bulkUpdated && !this.startDelete){
                    //    console.log("Start deleting....");
                    //
                    //    this.startDelete = true;
                    //    this.removeItem();
                    //    this.removeBulk();
                    //
                    //   this.enoughBulshit = true;
                    //}
                }

                 if(!this.enoughBulshit){
                    setTimeout(_.bind(function(){
                        this.runTester();
                    },this),300);
                }
            },

            //------------------------------------------------------

            getAll:function(callback){
                this.collection.fetch({
                    reset:true,
                    success: _.bind(function(collection, resp, options) {
                        this.allItems = true;
                        if(_.isFunction(callback)){
                            callback(collection);
                        }else{
                            console.log("collection.size: " + this.collection.size());
                        }
                    },this),
                    error:_.bind(function(collection, resp, options) {
                        this.allItems = true;
                        console.log('%c getAll:error ', 'color: #FF0511');
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

            updateItem:function(){

                var item = this.collection.models[3];

                item.set("groups", ["i1", "i2"]);
                item.set("labels.read", false);
                item.set("labels.important", false);

                item.save(null, {
                    success: _.bind(function () {
                        this.itemUpdated = true;
                        this.getAll(_.bind(function(collection){
                            var x = collection.findWhere({"id":item.id});

                            if(_.isObject(x) && _.indexOf(x.get("groups"), "i1")>=0 && x.get("labels.read") === false && item.get("labels.important") === false){
                                console.log("update works great");
                            }else{
                                console.log("update - not good");
                            }
                        },this));
                    }, this),
                    error: _.bind(function(){
                        this.itemUpdated = true;
                        console.log('%c Update item failed! ', 'color: #FF0511');
                    },this)
                });
            },
            //-----------------------------------------------------------

            updateBulk:function(){

                var item1 = this.collection.models[0];
                var item2 = this.collection.models[1];

                item1.set("groups", ["inbox1", "sent1"]);
                item1.set("labels.read", false);

                item2.set("groups", ["inbox2", "sent2"]);
                item2.set("labels.important", false);

                this.collection.update({

                    selectedItems: [item1.id, item2.id],
                    fields: ["labels", "groups"] ,

                    success: _.bind(function () {
                        this.bulkUpdated = true;
                        this.getAll(_.bind(function(collection){
                            var x1 = collection.findWhere({"id":item1.id});
                            var x2 = collection.findWhere({"id":item2.id});

                            if((_.indexOf(x1.get("groups"), "sent1")>=0) && (_.indexOf(x2.get("groups"), "sent2")>=0) && x1.get("labels.read") === false && x2.get("labels.important") === false){
                                console.log("update bulk works great");
                            }else{
                                console.log("update bulk - not good");
                            }
                        },this));
                    }, this),
                    error:function(){
                        this.bulkUpdated = true;
                        console.log('%c update bulk error! ', 'color: #FF0511');
                    }
                });
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
                                console.log("remove finished successfully");
                            }else{
                                console.log("remove failed");
                            }
                        },this),
                        error:_.bind(function(collection, resp, options) {
                            this.itemRemoved = true;
                            console.log('%c remove failed. (error) ', 'color: #FF0511');
                        },this)
                    });
                }
            },

            //-----------------------------------------------------------

            removeBulk:function(){

                this.collection.destroy({

                    success: _.bind(function () {
                        this.bulkRemoved = true;
                        this.getAll(_.bind(function(collection){
                            console.log("romoveBulk finished successfully");
                        }));
                    }, this),
                    error:function(){
                        this.bulkRemoved = true;
                        console.log('%c remove bulk error', 'color: #FF0511');
                    }
                });
            }
        });
    });
    return ServerActionsController;
});
