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
                    }

                    if(this.allItems && this.inboxFiltered && this.serachFiltered && !this.startUpdate){
                        console.log("Start updating....");

                        this.startUpdate = true;
                        this.updateBulk();
                    }

                    if(this.bulkUpdated && !this.startDelete){
                        console.log("Start deleting....");

                        this.startDelete = true;
                        this.removeItem();
                        this.removeBulk();

                       this.enoughBulshit = true;
                    }
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
                            callback();
                        }else{
                            console.log("collection.size: " + this.collection.size());
                        }
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

            updateBulk:function(){

                var selectedItems = [];

                selectedItems.push(this.collection.models[0].id);
                selectedItems.push(this.collection.models[1].id);

                this.collection.models[0].set("labels", {
                    "buzi": false,
                    "bibi": true,
                    "important": null
                });

                this.collection.models[0].set("groups",{
                    "sent": false,
                    "kuku":true
                });

                this.collection.models[1].set("labels",{
                    "bibi": false,
                    "buzi": true,
                    "important": null
                });

                this.collection.models[0].set("groups",{
                    "sent": false,
                    "bubu":true
                });

                this.collection.update({

                    selectedItems: selectedItems,
                    fields: ['id', 'labels', 'groups'],

                    success: _.bind(function () {
                        this.bulkUpdated = true;
                        this.getAll(_.bind(function(){
                            var x1 =  this.collection.models[0].get("labels")["buzi"] === false;
                            var x2 =  this.collection.models[0].get("groups")["kuku"] === true;
                            var x3 =  this.collection.models[1].get("labels")["buzi"] === true;
                            var x4 =  this.collection.models[1].get("groups")["bubu"] === true;

                            if(x1 === true && x2 === true && x3 === true  && x4 === true){
                                console.log("update bulk works great");
                            }else{
                                console.log("update bulk : something went wrong");
                            }
                        },this));
                    }, this),
                    error:function(){
                        this.bulkUpdated = true;
                        console.log("update bulk error");
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
                        this.getAll();
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
