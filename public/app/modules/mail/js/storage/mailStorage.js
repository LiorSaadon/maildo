define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Filterer = require("assets-resolvers-storage/localStorageFilterer");
    var ChangesDetector = require("assets-resolvers-storage/localStorageChangesDetector");
    var dateResolver = require("assets-resolvers-date/dateResolver");

    var MailStorage = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

         MailStorage = function () {

            var _localStorage = window.localStorage,
                accountName = "demo@mailbone.com",
                filteringMap = {
                    defaultQuery: "groups:inbox",
                    fields: {
                        groups: 'tag',
                        labels: 'tag',
                        to: 'data',
                        from: 'data',
                        cc: 'data',
                        bcc: 'data',
                        subject: 'data',
                        body: 'data'
                    }
                };

            //-------------------------------------------------
            // create
            //-------------------------------------------------

            var create = function (model) {

                if (_.isObject(model)) {

                    var groups = {};
                    var isDraft = !!model.get("groups.draft");
                    var labels = {unread: true, unstarred: true, unimportant: true};

                    var records = getRecords();

                    if(!isDraft){
                        model.set("groups.sent", true);

                        if (_.include(model.getOutgoingAddresses(), accountName)){
                            model.set("groups.inbox", true);
                        }
                    }

                    if (!model.id) {
                        model.id = _.uniqueId('_');
                        model.set(model.idAttribute, model.id);
                    }

                    model.set("labels", labels);
                    model.set("from", accountName);
                    model.set("sentTime", dateResolver.date2Str(new Date(), false));

                    records.unshift(model);
                    _localStorage.setItem('mails', JSON.stringify(records));

                    return model;
                }

                return {status: "error", message: 'model not valid'};
            };

            //-------------------------------------------------
            // update
            //-------------------------------------------------

            var update = function (model) {

                if (_.isObject(model)) {

                    var records = getRecords();
                    var record = _.find(records, function (record) {
                        return record.id == model.id;
                    });

                    if (record) {
                        if(typeof record.groups.draft === "undefined"){
                            record.groups.sent = true;

                            if (_.include(model.getOutgoingAddresses(), "demo@mailbone.com")){
                                record.groups.inbox = true;
                            }
                        }
                        _localStorage.setItem('mails', JSON.stringify(records));
                    }
                    return model;
                }

                return {status: "error", message: 'model not valid'};
            };

            //-------------------------------------------------
            // updateBulk
            //-------------------------------------------------

            var updateBulk = function (collection, options) {

                var records = getRecords();
                var arr = collection.toJSON({selectedItems: options.selectedItems, fields: options.fields});

                if (_.isArray(arr)) {
                    _.each(arr, function (item) {

                        var record = _.find(records, function (record) {
                            return record.id == item.id;
                        });
                        if (record) {
                            _.each(_.keys(item), function (key) {
                                record[key] = item[key];
                            });
                        }
                    });
                    _localStorage.setItem('mails', JSON.stringify(records));
                    return collection;
                }
                return {status: "error", message: 'collection is not valid'};
            };

            //-------------------------------------------------
            // destroy function
            //-------------------------------------------------

            var destroyAll = function (model, options) {

                _.each(options.data, function (item) {
                    deleteItem(item);
                });

                return {res:[]};
            };

            //--------------------------------------------------

            var destroy = function (model, options) {

                if(_.isObject(model)){
                    deleteItem(model.id);
                }
                return {res:[]};
            };

            //--------------------------------------------------

            var deleteItem = function (modelId) {

                var records = getRecords();

                var filtered = _.reject(records, function(record){
                    return record.id === modelId;
                });

                if (!_.isUndefined(filtered)) {
                    _localStorage.setItem('mails', JSON.stringify(filtered));
                }
            };

            //-------------------------------------------------
            // find
            //-------------------------------------------------

            var find = function (model, options) {

                var records = getRecords();
                var _model =  _.find(records, function (record) {
                    return record.id === model.id;
                });
                return _model;
            };

            //------------------------------------------------
            // findAll
            //------------------------------------------------

            var findAll = function (model, options) {

                var filterer = new Filterer(),
                    changesDetector = new ChangesDetector(),
                    data = options.data || {};

                adjustFilters(data);

                var result = filterer.filter(getRecords(), data.filters, filteringMap);
                var changed = changesDetector.detect(model.url, result.records, data.filters);

                if (data.persist && !changed) {
                    return {
                        metadata: {status: 'nochange'},
                        collection: []
                    };
                }
                return result;
            };

            //------------------------------------------------

            var adjustFilters = function (data) {

                if (_.isObject(data.filters)) {

                    data.filters.query = data.filters.query.replace(/\s{2,}/g, ' ').replace(/\s\:/g, ':').replace(/:\s/g, ':').replace("label:", "labels:");

                    if (_.isEmpty(data.filters.query)) {
                        data.filters.query += ' ' + filteringMap.defaultQuery;
                    }
                } else {
                    data.filters = {query: '', page: 1};
                }
            };

            //------------------------------------------------
            // getRecords
            //------------------------------------------------

            var getRecords = function () {

                var store = _localStorage.getItem('mails');
                return _.isString(store) ? JSON.parse(store) : [];
            };


            return{
                create: create,
                update: update,
                destroy: destroy,
                find: find,
                findAll: findAll,
                destroyAll: destroyAll,
                updateBulk: updateBulk
            };
        };

    });

    return MailStorage;
});