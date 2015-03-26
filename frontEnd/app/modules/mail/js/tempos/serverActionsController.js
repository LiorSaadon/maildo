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
                    }

                    if(this.allItems && this.inboxFiltered && this.serachFiltered && !this.startUpdate){
                        console.log("Start updating....");

                        this.startUpdate = true;
                        this.updateItem();
                        this.updateBulk();
                    }

                    if(this.itemUpdated && this.bulkUpdated && !this.startDelete){
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

                var item = this.collection.models[0];

                item.set("subject", "subject has changed..")

                item.save(null, {
                    success: _.bind(function () {
                        this.itemUpdated = true;
                        this.getAll(_.bind(function(){
                            var x = this.collection.findWhere({"id":item.id});

                            if(_.isObject(x) && (x.get("subject") === "subject has changed..")){
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

                var selectedItems = [];

                selectedItems.push(this.collection.models[0].id);
                selectedItems.push(this.collection.models[1].id);

                this.collection.models[0].set("labels", "x,y,z");
                this.collection.models[1].set("labels", "x1,y1,z1");

                this.collection.update({

                    selectedItems: selectedItems,
                    fields: ['id', 'labels'],

                    success: _.bind(function () {
                        this.bulkUpdated = true;
                        this.getAll(_.bind(function(){
                            var x = _.isObject(this.collection.findWhere({"labels":"x,y,z"}));
                            var x1 = _.isObject(this.collection.findWhere({"labels":"x1,y1,z1"}));

                            if(x && x1){
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
                        this.getAll();
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
