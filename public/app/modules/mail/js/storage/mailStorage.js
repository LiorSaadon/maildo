define(function (require) {
    "use strict";

    var Filterer  = require("assets-resolvers-storage/localStorageFilterer");
    var ChangesDetector  = require("assets-resolvers-storage/localStorageChangesDetector");
    var dateResolver = require("assets-resolvers-date/dateResolver");


    var MailStorage = function (_orderBy) {

        var orderBy = "DESC",
            _localStorage = window.localStorage,
            filteringMap = {
                 defaultQuery:"in:inbox",
                 fields: {
                    _in:'tag',
                    labels:'tag',
                    to:'data',
                    from:'data',
                    cc:'data',
                    bcc:'data',
                    subject:'data',
                    body:'data'
                }
            };

        //-------------------------------------------------
        // create
        //-------------------------------------------------

        var create = function (model) {

            if(_.isObject(model)){

                var labels = {'sent':true};
                var records = getRecords();

                if (!model.id) {
                    model.id = _.uniqueId('_');
                    model.set(model.idAttribute, model.id);
                }

                if(_.include(model.get('to'),'demo@mailbone.com')){
                    model.set("in",'inbox');
                    labels.inbox = true;
                }

                model.set("labels",labels);
                model.set("sentTime", dateResolver.date2Str(new Date(),false));

                if(orderBy === 'DESC'){
                    records.unshift(model);
                }else{
                    records.push(model);
                }

                _localStorage.setItem('mails', JSON.stringify(records));
                return model;
            }

            return {status:"error", message:'model not valid'};
        };

        //-------------------------------------------------
        // update
        //-------------------------------------------------

        var update = function (model) {

            if(_.isObject(model)){

                var records = getRecords();
                var record = _.find(records, {'id': model.id});

                if (record) {
                    _localStorage.setItem('mails', JSON.stringify(records));
                }
                return model;
            }

            return {status:"error", message:'model not valid'};
        };

        //-------------------------------------------------
        // updateBulk
        //-------------------------------------------------

        var updateBulk = function(collection, options){

            var records = getRecords();
            var arr = collection.toJSON({selectedItems: options.selectedItems, fields:options.fields});

           if(_.isArray(arr)){
               _.each(arr, function(item){

                   var record = _.find(records, {'id': item.id});
                   if(record){
                       for (var key in item){
                           record[key] = item[key];
                       }
                   }
               });
               _localStorage.setItem('mails', JSON.stringify(records));
               return collection;
           }
            return {status:"error", message:'collection is not valid'};
        };

        //-------------------------------------------------
        // destroy
        //-------------------------------------------------

        var destroy = function (model) {

            var id = _.isObject(model) ? model.id : model;

            var records = getRecords();
            var record = _.find(records, {'id': id});

            if (record) {
                record.labels = {'trash':true};
                _localStorage.setItem('mails', JSON.stringify(records));
            }

            return model;
        };

        //-------------------------------------------------
        // destroyAll
        //-------------------------------------------------

        var destroyAll = function (model, options) {

            _.each(options.data, function(item){
                destroy(item);
            });

            return model;
        };

        //-------------------------------------------------
        // find
        //-------------------------------------------------

        var find = function (model,options) {

            var records = getRecords();
            return _.find(records, {'id': model.id});
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

            if(data.persist && !changed){
                return {
                    metadata: {status: 'nochange'},
                    collection: []
                };
            }
            return result;
        };

        //------------------------------------------------

        var adjustFilters = function(data){

            if(_.isObject(data.filters)){

                data.filters.query = data.filters.query.replace(/\s{2,}/g, ' ').replace( /\s\:/g, ':').replace( /:\s/g, ':').replace("label:", "labels:");

                if(data.filters.query.indexOf("in:") === -1 && data.filters.query.indexOf("labels:") === -1){
                    data.filters.query  += ' ' + filteringMap.defaultQuery;
                }
            }else{
                data.filters = {query:'', page:1};
            }
        };

        //------------------------------------------------
        // getRecords
        //------------------------------------------------

        var getRecords = function () {

            var store = _localStorage.getItem('mails');
            return typeof(store) === 'string' ? JSON.parse(store) : [];
        };


        return{
            create: create,
            update: update,
            destroy: destroy,
            find: find,
            findAll: findAll,
            destroyAll:destroyAll,
            updateBulk:updateBulk
        };
    };

    return MailStorage;
});