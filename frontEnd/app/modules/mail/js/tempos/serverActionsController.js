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
                this.createMethodList();
                this.execAll();
            },

            //-------------------------------------------------

            createMethodList: function () {

                this.methods = [];

                for (var i = 0; i < 20; i++) {
                    this.methods.push({name: "addItem", options: data[i]});
                }
                this.methods.push({
                    name: "fetch",
                    options: {collection: this.collection, data: {"nPerPage": 25, "pageNumber": 1, "query": ''}}
                });
                this.methods.push({
                    name: "fetch",
                    options: {data: {"nPerPage": 25, "pageNumber": 1, "query": 'groups:inbox'}}
                });
                this.methods.push({
                    name: "fetch",
                    options: {data: {"nPerPage": 25, "pageNumber": 1, "query": 'groups:sent'}}
                });
                this.methods.push({
                    name: "updateItem",
                    options:{collection:this.collection, item:0, values:{"groups": ["i1", "i2"], "labels.read":true,"labels.important":true}}
                });
                this.methods.push({
                    name: "updateItem",
                    options:{collection:this.collection, item:2, values:{"groups": ["b1", "b2"], "labels.read":false, "subject":"sub3"}}
                });

                //this.methods.push("updateBulk", {});
                //this.methods.push("removeBulk", {});
                //this.methods.push("removeItem", {});
            },

            //----------------------------------------------------

            execAll: function (i) {
                i = i || 0
                if (i < this.methods.length) {
                    setTimeout(_.bind(function () {
                        this[this.methods[i].name](this.methods[i].options);
                        this.execAll(i + 1);
                    }, this), 1000);
                }
            },

            //--------------------------------------------------------

            addItem: function (dataModel) {

                var model = new TestModel(dataModel);

                model.save(null, {
                    success: _.bind(function (model, response) {
                        console.log(model.id);
                    }, this),
                    error: _.bind(function (model, response) {
                        console.log(response.error);
                    }, this)
                });
            },

            //-------------------------------------------------------

            fetch: function (_options) {

                var _collection = _options.collection || new TestCollection();

                _collection.fetch({
                    reset: true,
                    data: _options.data,
                    success: _.bind(function (collection, resp, options) {
                        console.log("filtered item: " + collection.size());
                    }, this),
                    error: _.bind(function (collection, resp, options) {
                        console.log('%c getAll:error ', 'color: #FF0511');
                    }, this)
                });
            },

            //-----------------------------------------------------------

            updateItem:function(options){

                var model = options.collection.models[options.item];

                _.each(options.values, _.bind(function(value, key, obj) {
                    model.set(key,value);
                },this));

                model.save(null, {
                    success: _.bind(function (model, resp, _options) {
                         console.log(model.attributes);
                    }, this),
                    error: _.bind(function(){
                        console.log('%c Update item failed! ', 'color: #FF0511');
                    },this)
                });
            }
        });
    });
    return ServerActionsController;
});
