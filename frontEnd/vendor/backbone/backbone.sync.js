(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["underscore", "backbone", "socketio"], function (_, Backbone, io) {
            return factory(_ || root._, Backbone || root.Backbone, io || root.io);
        });
    } else {
        factory(_, Backbone, io);
    }
}(this, function (_, Backbone, io) {

    "use strict";

    //---------------------------------------------------
    // socketsSync
    //---------------------------------------------------

    var socketSync = function (method, model, options) {

        var opts = _.extend({}, options),
            defer = $.Deferred(),
            promise = defer.promise(),
            reqName,
            socket;

        opts.data = opts.data || model.toJSON(options);

        socket = opts.socket || model.socket;
        reqName = socket.requestName + ":" + method;

        socket.io.once(reqName, function(res){
            var success = (res && res.success); // Expects server json response to contain a boolean 'success' field
            if (success) {
                if (_.isFunction(options.success)) options.success(res.data);
                defer.resolve(res);
                return;
            }
            if (_.isFunction(options.error)) options.error(model,res);
            defer.reject(res);
        });

        socket.io.emit(reqName, "shaulm", opts.data);
        model.trigger('request', model, promise, opts);

        return promise;
    };


    //---------------------------------------------------
    // localSync
    //---------------------------------------------------

    var localSync = function (method, model, options) {

        var store = model.localStorage || model.collection.localStorage;

        var resp, errorMessage, syncDfd = $.Deferred && $.Deferred(); //If $ is having Deferred - use it.

        try {
            switch (method) {
                case "read":
                    resp = model.id != undefined ? store.find(model) : store.findAll(model, options);
                    break;
                case "create":
                    resp = store.create(model);
                    break;
                case "update":
                    resp = model.id != undefined ? store.update(model) : store.updateBulk(model, options);
                    break;
                case "delete":
                    resp = model.id != undefined ? store.destroy(model) : store.destroyAll(model, options);
                    break;
            }

        } catch (error) {
            if (error.code === DOMException.QUOTA_EXCEEDED_ERR && window.localStorage.length === 0) {
                errorMessage = "Private browsing is unsupported";
            } else {
                errorMessage = error.message;
            }
        }

        //----------------------------------

        if (resp) {
            model.trigger("sync", model, resp, options);
            if (options && options.success) {
                if (Backbone.VERSION === "0.9.10") {
                    options.success(model, resp, options);
                } else {
                    options.success(resp);
                }
            }

            if (syncDfd) {
                syncDfd.resolve(resp);
            }
        } else {
            errorMessage = errorMessage ? errorMessage : "Record Not Found";

            model.trigger("error", model, errorMessage, options);
            if (options && options.error) {
                if (Backbone.VERSION === "0.9.10") {
                    options.error(model, errorMessage, options);
                } else {
                    options.error(errorMessage);
                }
            }
            if (syncDfd) {
                syncDfd.reject(errorMessage);
            }
        }

        if (options && options.complete) {
            options.complete(resp);
        }

        return syncDfd && syncDfd.promise();
    };


    //---------------------------------------------------
    // Override Backbone.sync
    //---------------------------------------------------

    var ajaxSync = Backbone.sync;

    var getSyncMethod = function (model) {
        if (model.localStorage || (model.collection && model.collection.localStorage)) {
            return localSync;
        }
        if (model.socket || (model.collection && model.collection.socket)) {
            return socketSync;
        }
        return ajaxSync;
    };

    Backbone.sync = function (method, model, options) {
        getSyncMethod(model).apply(this, [method, model, options]);
    };

    return Backbone.Sync;
}));