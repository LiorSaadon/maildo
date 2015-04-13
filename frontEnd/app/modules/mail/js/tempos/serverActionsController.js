define(function (require) {
    "use strict";

    var app = require("mbApp");
    var TestModel = require("app/modules/mail/js/tempos/model");
    var TestCollection = require("app/modules/mail/js/tempos/collection");
    var data = require("json!app/modules/mail/js/tempos/data.json");
    var UrlUtility = require("resolvers/UrlUtility");

    var ServerActionsController = {};


    //   http://localhost:3000/                                    (guest)
    //   http://localhost:3000/?status=player&username=shaulm      (shaulm-player)
    //   http://localhost:3000/?status=watcher&username=shaulm     (shaulm-watcher)


    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        ServerActionsController = Marionette.Controller.extend({

            initialize: function () {

                this.collection = new TestCollection();

                if(UrlUtility.getParameterByName("status") === "player") {
                    this.createMethodList();
                    this.execAll();
                }
            },

            //-------------------------------------------------

            createMethodList: function () {

                var MAX_ITEMS = 20;

                this.methods = [];

                for (var i = 0; i < MAX_ITEMS; i++) {
                    this.methods.push({name: "addItem", options: data[i]});
                }

                this.methods.push({
                    name: "fetch",
                    options: {collection: this.collection, data: {"nPerPage": 25, "pageNumber": 1, "query": ''}, expectedResult:MAX_ITEMS, err:"err1"}  //empty query
                });
                this.methods.push({
                    name: "fetch",
                    options: {data: {"nPerPage": 25, "pageNumber": 1, "query": 'groups:inbox subject2'}, expectedResult:1, err:"err1.1"}  //specific item
                });
                this.methods.push({
                    name: "fetch",
                    options: {data: {"nPerPage": 4, "pageNumber": 1, "query": 'groups:inbox'}, expectedResult:4, err:"err1.2"}  //test paging - page 1
                });
                this.methods.push({
                    name: "fetch",
                    options: {data: {"nPerPage": 4, "pageNumber": 2, "query": 'groups:inbox'}, expectedResult:3, err:"err1.2"}  //test paging - page 2
                });
                this.methods.push({
                    name: "fetch",
                    options: {data: {"nPerPage": 4, "pageNumber": 3, "query": 'groups:inbox'}, expectedResult:3, err:"err1.2.1"}  //test paging - page that not exist
                });
                this.methods.push({
                    name: "fetch",
                    options: {data: {"nPerPage": 25, "pageNumber": 1, "query": 'groups:inbox subject5'}, expectedResult:0, err:"err1.3"}
                });
                this.methods.push({
                    name: "fetch",
                    options: {data: {"nPerPage": 25, "pageNumber": 1, "query": 'groups:sent subject5'}, expectedResult:1, err:"err1.4"}
                });
                this.methods.push({
                    name: "fetch",
                    options: {data: {"nPerPage": 25, "pageNumber": 1, "query": 'groups:sent debka'}, expectedResult:0, err:"err1.5"}
                });
                this.methods.push({
                    name: "updateItem",
                    options:{collection:this.collection, item:0, values:{"groups": ["i1", "i2"], "labels.read":true,"labels.important":true}, callback:{name: "fetch", options: {data: {"nPerPage": 25, "pageNumber": 1, "query": 'groups:i1 groups:i2 labels.read:true labels.important:true'}, expectedResult:1, successMsg:"updateItem(1) finished successfully", err:"err2"}}}
                });
                this.methods.push({
                    name: "updateItem",
                    options:{collection:this.collection, item:1, values:{"groups": ["b1"], "subject":"sub3"}, callback:{name: "fetch", options: {data: {"nPerPage": 25, "pageNumber": 1, "query": 'groups:b1 sub3'}, expectedResult:1, successMsg:"updateItem(2) finished successfully", err:"err2.1"}}}
                });
                this.methods.push({
                    name: "updateBulk",
                    options:{collection:this.collection, items:[2,3,4], fields:["labels", "groups"], values:{"groups": ["c1"], "labels.read":true}, callback:{name: "fetch", options: {data: {"nPerPage": 25, "pageNumber": 1, "query": 'groups:c1 labels.read:true'}, expectedResult:3, successMsg:"updateBulk finished successfully", err:"err3"}}}
                });
                this.methods.push({
                    name: "removeBulk",
                    options:{collection:this.collection, items:[1,3], callback:{name: "fetch", options: {data: {"nPerPage": 25, "pageNumber": 1, "query": ''}, expectedResult:MAX_ITEMS-2, successMsg:"removeBulk(partial) finished successfully",  err:"err4"}}}
                });
                this.methods.push({
                    name: "removeBulk",
                    options:{collection:this.collection, callback:{name: "fetch", options: {data: {"nPerPage": 25, "pageNumber": 1, "query": ''}, expectedResult:0, successMsg:"removeBulk(all) finished successfully", err:"err4.1"}}}
                });
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
                        if(collection.size() === _options.expectedResult){
                            var msg = _.isString(_options.successMsg) ?  _options.successMsg : "fetch return result as expected"
                            console.log(msg);
                        }else{
                            console.log('%c ' + _options.err, 'color: #FF0511');
                        }
                    }, this),
                    error: _.bind(function (collection, resp, options) {
                        console.log('%c getAll:error ', 'color: #FF0511');
                    }, this)
                });
            },

            //-----------------------------------------------------------

            updateItem:function(options){

                var model = options.collection.models[options.item];

                _.each(options.values, function(value, key, obj) {
                    model.set(key,value);
                });

                model.save(null, {
                    success: _.bind(function (model, resp, _options) {
                        this[options.callback.name](options.callback.options);
                    }, this),
                    error: _.bind(function(){
                        console.log('%c Update item failed! ', 'color: #FF0511');
                    },this)
                });
            },

            //-----------------------------------------------------------

            updateBulk:function(options){

                if(options.items){

                    var selectedItems = [];
                    _.each(options.items, function(item){

                        var model = options.collection.models[item];
                        if(model){
                            selectedItems.push(model.id);
                            _.each(options.values, function(value, key) {
                                model.set(key, value);
                            });
                        }
                    });
                }
                options.collection.update({
                    selectedItems: selectedItems,
                    fields: options.fields,
                    success: _.bind(function (model, resp, _options) {
                        this[options.callback.name](options.callback.options);
                    }, this),
                    error: _.bind(function(){
                        console.log('%c Update item failed! ', 'color: #FF0511');
                    },this)
                });
            },

            //-----------------------------------------------------------

            removeBulk:function(options){

                if(options.items) {

                    var selectedItems = [];
                    _.each(options.items, function (item) {
                        var model = options.collection.models[item];
                        selectedItems.push(model.id);
                    });
                }
                options.collection.destroy({
                    selectedItems: selectedItems,
                    success: _.bind(function (model, resp, _options) {
                        this[options.callback.name](options.callback.options);
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
