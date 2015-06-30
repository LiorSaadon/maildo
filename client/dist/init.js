(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var BaseCollection = Backbone.Collection.extend({

    metadata: {},

    //------------------------------------------------
    // override fetch for triggering.
    //------------------------------------------------

    fetch: function fetch(options) {

        options = options || {};

        var successFunc = options.success;
        var errorFunc = options.error;

        options.success = function (collection, response, options) {

            collection.trigger("fetch:success", response);
            if (_.isFunction(successFunc)) {
                successFunc(collection, response, options);
            }
        };
        options.error = function (collection, response, options) {

            collection.trigger("fetch:error", response);
            if (_.isFunction(errorFunc)) {
                errorFunc(collection, response, options);
            }
        };

        return Backbone.Collection.prototype.fetch.call(this, options);
    },

    //------------------------------------------------
    // set
    //------------------------------------------------

    set: function set(response, options) {

        response = _.isObject(response) ? response : {};

        if (_.isObject(response.collection) && _.isObject(response.metadata)) {
            Backbone.Collection.prototype.set.call(this, response.collection, options);
            this.updateMetadata(response.metadata);
        } else {
            Backbone.Collection.prototype.set.call(this, response, options);
        }
    },

    //--------------------------------------------------

    updateMetadata: function updateMetadata(metadata) {

        if (!_.isEqual(this.metadata, metadata)) {

            this.metadata = _.clone(metadata);
            this.trigger("change:metadata", metadata);
        }
    },

    //--------------------------------------------------
    // destroy
    //--------------------------------------------------

    destroy: function destroy(_options) {

        var that = this,
            options = _options ? _.clone(_options) : {},
            success = options.success;

        if (_.isArray(options.selectedItems)) {
            options.data = options.selectedItems.splice(0);
        } else {
            options.data = this.getModelIds(); // all items
        }

        _.each(options.data, function (item) {
            // remove new or not existed items
            var model = that.get(item);
            if (!model || model.isNew()) {
                options.data = options.data.slice($.inArray(item, options.data), 1);
            }
        });

        if (_.isEmpty(options.data)) {
            //no items to delete
            options.success();
            return false;
        }

        options.success = function (resp) {
            if (success) {
                success(that, resp, options);
            }
            that.trigger("delete:success", that, resp, options);
        };

        return Backbone.sync.apply(this, ["delete", this, options]);
    },

    //--------------------------------------------------
    // update
    //--------------------------------------------------

    update: function update(_options) {

        var that = this,
            options = _options ? _.clone(_options) : {},
            successFunc = options.success;

        options.success = function (resp) {
            if (successFunc) {
                successFunc(that, resp, options);
            }
            that.trigger("update:success", that, resp, options);
        };

        return Backbone.sync.apply(this, ["update", this, options]);
    },

    //--------------------------------------------------

    toJSON: function toJSON(_options) {

        var arr = [],
            that = this,
            options = _options || {},
            items = options.selectedItems || this.getModelIds();

        _.each(items, function (item) {

            var model = that.get(item);

            if (model) {
                if (!model.isNew() && options.fields) {
                    options.fields.push("id");
                    model = model.toJSON({ fields: options.fields });
                } else {
                    model = model.toJSON();
                }
                arr.push(model);
            }
        });
        return arr;
    },

    //---------------------------------------------------

    getModelIds: function getModelIds() {

        return this.map(function (model) {
            return model.id;
        });
    }
});

module.exports = BaseCollection;

},{}],2:[function(require,module,exports){
"use strict";

var BaseCollection = require("./baseCollection");

var FilteredCollection = BaseCollection.extend({

    PAGE_SIZE: 10,

    initialize: function initialize(options) {

        BaseCollection.prototype.initialize(options);
        this.setFilters(options);
    },

    //-------------------------------------------------
    // fetchBy
    //-------------------------------------------------

    fetchBy: function fetchBy(options) {

        options = options || {};

        this.setFilters(options);

        this.fetch({

            reset: true,

            data: this.filters,

            success: _.bind(function (collection) {
                this.isFetched = true;
                if (_.isFunction(options.success)) {
                    options.success(collection);
                }
            }, this),

            error: function error(collection) {
                if (_.isFunction(options.error)) {
                    options.error(collection);
                }
            }
        });
    },

    //-------------------------------------------------

    setFilters: function setFilters(options) {

        options = options || {};
        this.filters = options.filters ? _.clone(options.filters) : { query: "", page: 1 };
    },

    //-------------------------------------------------
    // refresh
    //-------------------------------------------------

    refresh: function refresh() {

        this.fetchBy({ filters: this.filters });
    }
});

module.exports = FilteredCollection;

},{"./baseCollection":1}],3:[function(require,module,exports){
"use strict";

var DeepModel = require("backbone-deep-model");

var BaseModel = DeepModel.extend({

    //-------------------------------------------
    // save
    //-------------------------------------------

    save: function save(key, val, options) {

        if (key == null || typeof key === "object") {
            options = val;
        }
        if (options.invalid) {
            this.on("invalid", options.invalid);
        }

        var result = DeepModel.prototype.save.call(this, key, val, options);

        if (options.invalid) {
            this.off("invalid", options.invalid);
        }
        return result;
    },

    //------------------------------------------------
    // toJSON
    //------------------------------------------------

    toJSON: function toJSON(options) {

        options = options || {};

        if (options.fields) {
            var copy = {},
                clone = _.deepClone(this.attributes);

            _.each(options.fields, function (field) {
                copy[field] = clone[field];
            });

            return copy;
        }
        return DeepModel.prototype.toJSON.call(this, options);
    }
});

module.exports = BaseModel;

},{"backbone-deep-model":false}],4:[function(require,module,exports){
"use strict";

var DeepModel = require("backbone-deep-model");

var Context = DeepModel.extend({

    defaults: {
        module: "",
        mail: {
            action: {}
        },
        tasks: {
            selectedCategory: {}
        }
    }
});

module.exports = Context;

},{"backbone-deep-model":false}],5:[function(require,module,exports){
"use strict";

var FilterCollectionDecorator = function FilterCollectionDecorator(original, filterModel) {

    var filterCollection = $.extend({}, original);

    filterCollection.models = [];
    filterCollection.filterModel = filterModel;

    //------------------------------------------------
    // filterBy
    //------------------------------------------------

    filterCollection.filterBy = function (options) {

        options = options || {};

        var items;

        if (this.filterModel) {
            items = _.filter(original.models, _.bind(function (model) {
                return this.filterModel.predicate(model);
            }, this));
        } else {
            items = original.models;
        }

        if (_.isArray(options.mandatoryItems)) {
            items = _.union(options.mandatoryItems, items);
        }

        if (_.isFinite(options.maxItems)) {
            items = items.slice(0, options.maxItems);
        }

        if (_.isEmpty(items)) {
            filterCollection.trigger("empty:collection");
        }
        filterCollection.reset(items);
    };

    //------------------------------------------------
    // filterAll
    //------------------------------------------------

    filterCollection.filterAll = function () {

        filterCollection.trigger("empty:collection");
        filterCollection.reset([]);
    };

    return filterCollection;
};

module.exports = FilterCollectionDecorator;

},{}],6:[function(require,module,exports){
"use strict";

var SelectableCollectionDecorator = function SelectableCollectionDecorator(original) {

    var decoratedCollection = $.extend({}, original);

    decoratedCollection.selected = [];

    //--------------------------------------------------

    decoratedCollection.getSelected = function () {

        return this.selected.slice();
    };

    //--------------------------------------------------

    decoratedCollection.isSelected = function (model) {

        var id = model.get("id");
        return $.inArray(id, decoratedCollection.selected) !== -1;
    };

    //-------------------------------------------------

    decoratedCollection.unselectModel = function (model, options) {

        var id = model.get("id");

        if (this.get(id) && $.inArray(id, this.selected) !== -1) {
            this.selected.splice($.inArray(id, this.selected), 1);
            raiseTrigger(options);
            return true;
        }
        return false;
    };

    //--------------------------------------------------

    decoratedCollection.updateSelection = function (options) {

        var itemsToRemove = [];

        _.each(this.selected, _.bind(function (selectedItem) {
            var model = this.get(selectedItem);

            if (_.isEmpty(model)) {
                itemsToRemove.push(selectedItem);
            }
        }, this));

        if (!_.isEmpty(itemsToRemove)) {
            this.selected = _.difference(this.selected, itemsToRemove);
            raiseTrigger(options);
        }
    };

    //--------------------------------------------------

    decoratedCollection.clearSelected = function (options) {

        this.selected.length = 0;
        raiseTrigger(options);
    };

    //--------------------------------------------------

    decoratedCollection.selectAll = function (options) {

        decoratedCollection.selectModels(this.models, options);
    };

    //--------------------------------------------------

    decoratedCollection.selectModels = function (models, options) {

        var exclusively = options ? options.exclusively : null,
            raise = false;

        if (exclusively) {
            raise = true;
            this.selected.length = 0;
        }

        _.each(models, function (model) {
            raise = decoratedCollection.selectModel(model, { silent: true }) || raise;
        }, this);

        if (raise) {
            raiseTrigger(options);
        }
    };

    //--------------------------------------------------

    decoratedCollection.selectModel = function (model, options) {

        var id = model.get("id");

        if (this.get(id) && $.inArray(id, this.selected) === -1) {
            this.selected.push(id);
            raiseTrigger(options);
            return true;
        }
        return false;
    };

    //----------------------------------------------------

    decoratedCollection.toggleSelection = function (model, options) {

        if (this.isSelected(model)) {
            this.unselectModel(model, options);
        } else {
            this.selectModel(model, options);
        }
    };

    //-----------------------------------------------------

    var raiseTrigger = function raiseTrigger(options) {

        var silent = options ? options.silent : null;

        if (!silent) {
            decoratedCollection.trigger("change:selection", decoratedCollection.selected, options);
            return true;
        }
    };

    return decoratedCollection;
};

module.exports = SelectableCollectionDecorator;

},{}],7:[function(require,module,exports){
"use strict";

//---------------------------------------------------
// socketsSync
//---------------------------------------------------

var socketSync = function socketSync(method, model, options) {

    var opts = _.extend({}, options),
        defer = $.Deferred(),
        promise = defer.promise(),
        reqName,
        socket;

    opts.data = opts.data || model.toJSON(options);

    socket = opts.socket || model.socket;
    reqName = socket.requestName + ":" + method;

    socket.io.once(reqName, function (res) {
        var success = res && res.success; // Expects server json response to contain a boolean 'success' field
        if (success) {
            if (_.isFunction(options.success)) options.success(res.data);
            defer.resolve(res);
            return;
        }
        if (_.isFunction(options.error)) options.error(model, res);
        defer.reject(res);
    });

    socket.io.emit(reqName, model.userName, opts.data);
    model.trigger("request", model, promise, opts);

    return promise;
};

//---------------------------------------------------
// localSync
//---------------------------------------------------

var localSync = function localSync(method, model, options) {

    var store = model.localStorage || model.collection.localStorage;

    var resp,
        errorMessage,
        syncDfd = $.Deferred && $.Deferred(); //If $ is having Deferred - use it.

    try {
        switch (method) {
            case "read":
                resp = model.id !== undefined ? store.find(model) : store.findAll(model, options);
                break;
            case "create":
                resp = store.create(model);
                break;
            case "update":
                resp = model.id !== undefined ? store.update(model) : store.updateBulk(model, options);
                break;
            case "delete":
                resp = model.id !== undefined ? store.destroy(model) : store.destroyAll(model, options);
                break;
        }
    } catch (error) {
        if (window.localStorage.length === 0) {
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

var getSyncMethod = function getSyncMethod(model) {
    if (model.localStorage || model.collection && model.collection.localStorage) {
        return localSync;
    }
    if (model.socket || model.collection && model.collection.socket) {
        return socketSync;
    }
    return ajaxSync;
};

Backbone.sync = function (method, model, options) {
    getSyncMethod(model).apply(this, [method, model, options]);
};

module.exports = Backbone.Sync;

},{}],8:[function(require,module,exports){
"use strict";

var app = require('./../../../setup/app.js');

//-------------------------------------------------------
// onInvalid
//-------------------------------------------------------

var delegateEvents = Marionette.View.prototype.delegateEvents;

Marionette.View.prototype.delegateEvents = function () {

    delegateEvents.apply(this, [].slice.apply(arguments));

    var view = this;
    var viewModel = view.model;

    if (!_.isUndefined(viewModel)) {

        view.listenTo(viewModel, "invalid", function (model, errorObject) {

            if (_.isFunction(view.onInvalid)) {
                view.onInvalid(model, errorObject);
            }
        });
    }
};

//-------------------------------------------------------------
// add - an alternative to region.show(), doesn't not remove permanent views
//-------------------------------------------------------------

Marionette.Region.prototype.add = function (view, options) {

    options = options || {};

    if (_.isObject(view) && !_.isEmpty(view.cid)) {

        this.views = this.views || {};
        this._ensureElement();
        this.clean(view.cid);

        if (!this._hasView(view)) {
            this._addView(view);
            view.render();
            this.$el.append(view.el);
        }

        if (options.hideOtherViews) {
            this._showView(view);
        }

        Marionette.triggerMethod.call(view, "show");
        Marionette.triggerMethod.call(this, "show", view);
    }
};

//-------------------------------------------------------------

Marionette.Region.prototype.clean = function (currViewId) {

    for (var key in this.views) {

        var view = this.views[key];

        if (view && !view.isPermanent && !view.isDestroyed && view.cid !== currViewId) {
            if (view.destroy) {
                view.destroy();
            } else if (view.remove) {
                view.remove();
            }
            delete this.views[key];
        }
    }
};

//-------------------------------------------------------------

Marionette.Region.prototype._hasView = function (view) {

    return _.isObject(this.views[view.cid]);
};

//-------------------------------------------------------------

Marionette.Region.prototype._addView = function (view) {

    var that = this;
    this.views[view.cid] = view;

    this.listenTo(view, "destroy", function () {
        delete that.views[view.cid];
    });
};

//-------------------------------------------------------------

Marionette.Region.prototype._showView = function (view, options) {

    for (var key in this.views) {
        var _view = this.views[key];
        if (_view.cid !== view.cid) {
            _view.$el.hide();
        }
    }
    view.$el.show();
};

//-------------------------------------------------------------
// override destroy - called by region.show()
//-------------------------------------------------------------

var _originalDestroy = Marionette.Region.prototype.destroy;

Marionette.Region.prototype.destroy = function () {

    _originalDestroy.apply(this, [].slice.apply(arguments));

    for (var key in this.views) {

        var view = this.views[key];

        if (_.isObject(view)) {
            if (view.destroy) {
                view.destroy();
            } else if (view.remove) {
                view.remove();
            }
            delete this.views[key];
        }
    }
};

module.exports = Marionette;

},{"./../../../setup/app.js":88}],9:[function(require,module,exports){
"use strict";

var arrays,
    basicObjects,
    deepClone,
    deepExtend,
    deepExtendCouple,
    isBasicObject,
    __slice = [].slice;

deepClone = function (obj) {
    var func, isArr;
    if (!_.isObject(obj) || _.isFunction(obj)) {
        return obj;
    }
    if (obj instanceof Backbone.Collection || obj instanceof Backbone.Model) {
        return obj;
    }
    if (_.isDate(obj)) {
        return new Date(obj.getTime());
    }
    if (_.isRegExp(obj)) {
        return new RegExp(obj.source, obj.toString().replace(/.*\//, ""));
    }
    isArr = _.isArray(obj || _.isArguments(obj));
    func = function (memo, value, key) {
        if (isArr) {
            memo.push(deepClone(value));
        } else {
            memo[key] = deepClone(value);
        }
        return memo;
    };
    return _.reduce(obj, func, isArr ? [] : {});
};

isBasicObject = function (object) {
    if (object == null) return false;
    return (object.prototype === ({}).prototype || object.prototype === Object.prototype) && _.isObject(object) && !_.isArray(object) && !_.isFunction(object) && !_.isDate(object) && !_.isRegExp(object) && !_.isArguments(object);
};

basicObjects = function (object) {
    return _.filter(_.keys(object), function (key) {
        return isBasicObject(object[key]);
    });
};

arrays = function (object) {
    return _.filter(_.keys(object), function (key) {
        return _.isArray(object[key]);
    });
};

deepExtendCouple = function (destination, source, maxDepth) {
    var combine, recurse, sharedArrayKey, sharedArrayKeys, sharedObjectKey, sharedObjectKeys, _i, _j, _len, _len1;
    if (maxDepth == null) {
        maxDepth = 20;
    }
    if (maxDepth <= 0) {
        console.warn("_.deepExtend(): Maximum depth of recursion hit.");
        return _.extend(destination, source);
    }
    sharedObjectKeys = _.intersection(basicObjects(destination), basicObjects(source));
    recurse = function (key) {
        source[key] = deepExtendCouple(destination[key], source[key], maxDepth - 1);
        return source[key];
    };
    for (_i = 0, _len = sharedObjectKeys.length; _i < _len; _i++) {
        sharedObjectKey = sharedObjectKeys[_i];
        recurse(sharedObjectKey);
    }
    sharedArrayKeys = _.intersection(arrays(destination), arrays(source));
    combine = function (key) {
        source[key] = _.union(destination[key], source[key]);
        return source[key];
    };
    for (_j = 0, _len1 = sharedArrayKeys.length; _j < _len1; _j++) {
        sharedArrayKey = sharedArrayKeys[_j];
        combine(sharedArrayKey);
    }
    return _.extend(destination, source);
};

deepExtend = function () {
    var finalObj, maxDepth, objects, _i;
    objects = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []);
    maxDepth = arguments[_i++];
    if (!_.isNumber(maxDepth)) {
        objects.push(maxDepth);
        maxDepth = 20;
    }
    if (objects.length <= 1) {
        return objects[0];
    }
    if (maxDepth <= 0) {
        return _.extend.apply(this, objects);
    }
    finalObj = objects.shift();
    while (objects.length > 0) {
        finalObj = deepExtendCouple(finalObj, deepClone(objects.shift()), maxDepth);
    }
    return finalObj;
};

_.mixin({
    deepClone: deepClone,
    isBasicObject: isBasicObject,
    basicObjects: basicObjects,
    arrays: arrays,
    deepExtend: deepExtend
});

},{}],10:[function(require,module,exports){
/*!
 * jQuery outside events - v1.1 - 3/16/2010
 * http://benalman.com/projects/jquery-outside-events-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

// Script: jQuery outside events
//
// *Version: 1.1, Last updated: 3/16/2010*
//
// Project Home - http://benalman.com/projects/jquery-outside-events-plugin/
// GitHub       - http://github.com/cowboy/jquery-outside-events/
// Source       - http://github.com/cowboy/jquery-outside-events/raw/master/jquery.ba-outside-events.js
// (Minified)   - http://github.com/cowboy/jquery-outside-events/raw/master/jquery.ba-outside-events.min.js (0.9kb)
//
// About: License
//
// Copyright (c) 2010 "Cowboy" Ben Alman,
// Dual licensed under the MIT and GPL licenses.
// http://benalman.com/about/license/
//
// About: Examples
//
// These working examples, complete with fully commented code, illustrate a few
// ways in which this plugin can be used.
//
// clickoutside - http://benalman.com/code/projects/jquery-outside-events/examples/clickoutside/
// dblclickoutside - http://benalman.com/code/projects/jquery-outside-events/examples/dblclickoutside/
// mouseoveroutside - http://benalman.com/code/projects/jquery-outside-events/examples/mouseoveroutside/
// focusoutside - http://benalman.com/code/projects/jquery-outside-events/examples/focusoutside/
//
// About: Support and Testing
//
// Information about what version or versions of jQuery this plugin has been
// tested with, what browsers it has been tested in, and where the unit tests
// reside (so you can test it yourself).
//
// jQuery Versions - 1.4.2
// Browsers Tested - Internet Explorer 6-8, Firefox 2-3.6, Safari 3-4, Chrome, Opera 9.6-10.1.
// Unit Tests      - http://benalman.com/code/projects/jquery-outside-events/unit/
//
// About: Release History
//
// 1.1 - (3/16/2010) Made "clickoutside" plugin more general, resulting in a
//       whole new plugin with more than a dozen default "outside" events and
//       a method that can be used to add new ones.
// 1.0 - (2/27/2010) Initial release
//
// Topic: Default "outside" events
//
// Note that each "outside" event is powered by an "originating" event. Only
// when the originating event is triggered on an element outside the element
// to which that outside event is bound will the bound event be triggered.
//
// Because each outside event is powered by a separate originating event,
// stopping propagation of that originating event will prevent its related
// outside event from triggering.
//
//  OUTSIDE EVENT     - ORIGINATING EVENT
//  clickoutside      - click
//  dblclickoutside   - dblclick
//  focusoutside      - focusin
//  bluroutside       - focusout
//  mousemoveoutside  - mousemove
//  mousedownoutside  - mousedown
//  mouseupoutside    - mouseup
//  mouseoveroutside  - mouseover
//  mouseoutoutside   - mouseout
//  keydownoutside    - keydown
//  keypressoutside   - keypress
//  keyupoutside      - keyup
//  changeoutside     - change
//  selectoutside     - select
//  submitoutside     - submit

'use strict';

var jQuery = require('jquery');

(function ($, doc, outside) {
  '$:nomunge'; // Used by YUI compressor.

  $.map(
  // All these events will get an "outside" event counterpart by default.
  'click dblclick mousemove mousedown mouseup mouseover mouseout change select submit keydown keypress keyup'.split(' '), function (event_name) {
    jq_addOutsideEvent(event_name);
  });

  // The focus and blur events are really focusin and focusout when it comes
  // to delegation, so they are a special case.
  jq_addOutsideEvent('focusin', 'focus' + outside);
  jq_addOutsideEvent('focusout', 'blur' + outside);

  // Method: jQuery.addOutsideEvent
  //
  // Register a new "outside" event to be with this method. Adding an outside
  // event that already exists will probably blow things up, so check the
  // <Default "outside" events> list before trying to add a new one.
  //
  // Usage:
  //
  // > jQuery.addOutsideEvent( event_name [, outside_event_name ] );
  //
  // Arguments:
  //
  //  event_name - (String) The name of the originating event that the new
  //    "outside" event will be powered by. This event can be a native or
  //    custom event, as long as it bubbles up the DOM tree.
  //  outside_event_name - (String) An optional name for the new "outside"
  //    event. If omitted, the outside event will be named whatever the
  //    value of `event_name` is plus the "outside" suffix.
  //
  // Returns:
  //
  //  Nothing.

  $.addOutsideEvent = jq_addOutsideEvent;

  function jq_addOutsideEvent(event_name, outside_event_name) {

    // The "outside" event name.
    outside_event_name = outside_event_name || event_name + outside;

    // A jQuery object containing all elements to which the "outside" event is
    // bound.
    var elems = $(),

    // The "originating" event, namespaced for easy unbinding.
    event_namespaced = event_name + '.' + outside_event_name + '-special-event';

    // Event: outside events
    //
    // An "outside" event is triggered on an element when its corresponding
    // "originating" event is triggered on an element outside the element in
    // question. See the <Default "outside" events> list for more information.
    //
    // Usage:
    //
    // > jQuery('selector').bind( 'clickoutside', function(event) {
    // >   var clicked_elem = $(event.target);
    // >   ...
    // > });
    //
    // > jQuery('selector').bind( 'dblclickoutside', function(event) {
    // >   var double_clicked_elem = $(event.target);
    // >   ...
    // > });
    //
    // > jQuery('selector').bind( 'mouseoveroutside', function(event) {
    // >   var moused_over_elem = $(event.target);
    // >   ...
    // > });
    //
    // > jQuery('selector').bind( 'focusoutside', function(event) {
    // >   var focused_elem = $(event.target);
    // >   ...
    // > });
    //
    // You get the idea, right?

    $.event.special[outside_event_name] = {

      // Called only when the first "outside" event callback is bound per
      // element.
      setup: function setup() {

        // Add this element to the list of elements to which this "outside"
        // event is bound.
        elems = elems.add(this);

        // If this is the first element getting the event bound, bind a handler
        // to document to catch all corresponding "originating" events.
        if (elems.length === 1) {
          $(doc).bind(event_namespaced, handle_event);
        }
      },

      // Called only when the last "outside" event callback is unbound per
      // element.
      teardown: function teardown() {

        // Remove this element from the list of elements to which this
        // "outside" event is bound.
        elems = elems.not(this);

        // If this is the last element removed, remove the "originating" event
        // handler on document that powers this "outside" event.
        if (elems.length === 0) {
          $(doc).unbind(event_namespaced);
        }
      },

      // Called every time a "outside" event callback is bound to an element.
      add: function add(handleObj) {
        var old_handler = handleObj.handler;

        // This function is executed every time the event is triggered. This is
        // used to override the default event.target reference with one that is
        // more useful.
        handleObj.handler = function (event, elem) {

          // Set the event object's .target property to the element that the
          // user interacted with, not the element that the "outside" event was
          // was triggered on.
          event.target = elem;

          // Execute the actual bound handler.
          old_handler.apply(this, arguments);
        };
      }
    };

    // When the "originating" event is triggered..
    function handle_event(event) {

      // Iterate over all elements to which this "outside" event is bound.
      $(elems).each(function () {
        var elem = $(this);

        // If this element isn't the element on which the event was triggered,
        // and this element doesn't contain said element, then said element is
        // considered to be outside, and the "outside" event will be triggered!
        if (this !== event.target && !elem.has(event.target).length) {

          // Use triggerHandler instead of trigger so that the "outside" event
          // doesn't bubble. Pass in the "originating" event's .target so that
          // the "outside" event.target can be overridden with something more
          // meaningful.
          elem.triggerHandler(outside_event_name, [event.target]);
        }
      });
    }
  }
})(jQuery, document, 'outside');

},{"jquery":false}],11:[function(require,module,exports){
'use strict';

var jQuery = require('jquery');

(function ($, window, document) {

    $.fn.toggleBlock = function (show) {

        this.css('display', show ? 'block' : 'none');
    };
})(jQuery, window, document);

},{"jquery":false}],12:[function(require,module,exports){
'use strict';

var dropdownDisplayer = (function () {

    $('body').on('click', function (e) {
        $('.dropdown-slider').hide();
        $('.clicked').removeClass('clicked');
    });

    $('body').on('click', '.button.dropdown', function (ev) {

        if (!$(this).hasClass('clicked')) {
            $('.dropdown-slider').hide();
            $('.clicked').removeClass('clicked');
        }

        var parentFloat = $(this).parent().css('float');
        var ddsId = getDropDownSliderId($(this));

        if (parentFloat === 'right') {
            $('.dropdown-slider.' + ddsId).css('right', $(this).position().right);
        } else {
            $('.dropdown-slider.' + ddsId).css('left', $(this).position().left); // - 5
        }

        $('.dropdown-slider.' + ddsId).toggle();
        $(this).toggleClass('clicked');
        return false;
    });

    //-------------------------------------------------------

    var getDropDownSliderId = function getDropDownSliderId(btn) {

        var ddsId = '';
        var classList = btn.attr('class').split(/\s+/);

        $.each(classList, function (index, item) {
            if (item.indexOf('ddsId_') === 0) {
                ddsId = item.replace('ddsId_', '');
                return false;
            }
        });
        return ddsId;
    };
})();

},{}],13:[function(require,module,exports){
"use strict";

var Formatter = (function () {

    var formatAddresses = function formatAddresses(titles) {

        var res = "";

        titles = titles || [];

        if (titles.length === 1) {
            return titles[0];
        }
        _.each(titles, function (title) {
            res += _s.strLeftBack(title, " ") + ", ";
        });

        return _s.strLeftBack(res, ",");
    };

    //-------------------------------------------------------------

    var formatShortDate = function formatShortDate(ticks, translator) {

        if (_.isFinite(ticks)) {

            var now = new Date();
            var date = new Date(parseInt(ticks, 10));
            var timeDiff = Math.abs(now.getTime() - date.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (diffDays > 1) {
                return translator.translate("mail:timerange.months." + date.getMonth()) + " " + date.getDay();
            } else {
                var hours = date.getHours();
                var minutes = date.getMinutes();
                var ampm = hours >= 12 ? "pm" : "am";

                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                minutes = minutes < 10 ? "0" + minutes : minutes;

                return hours + ":" + minutes + " " + ampm;
            }
        }
        return "";
    };

    //-------------------------------------------------------------

    var formatSubject = function formatSubject(subject, translator) {

        if (_.isEmpty(subject)) {
            subject = "(" + translator.translate("mail:nosubject") + ")";
        }
        return subject;
    };

    //-------------------------------------------------------------

    var formatContent = function formatContent(content) {

        if (!_.isEmpty(content)) {
            return content.replace(/(<([^>]+)>)/ig, " ").replace(/&nbsp;/ig, " ");
        }
        return content;
    };

    //-------------------------------------------------------------

    return {
        formatSubject: formatSubject,
        formatContent: formatContent,
        formatShortDate: formatShortDate,
        formatAddresses: formatAddresses
    };
})();

module.exports = Formatter;

},{}],14:[function(require,module,exports){
"use strict";

var Translator = (function () {

    var dictionary = {};

    //--------------------------------------------

    Handlebars.registerHelper("_i18n", function (text) {
        return translate(text);
    });

    //--------------------------------------------

    var updateDictionary = function updateDictionary(obj) {
        $.extend(dictionary, obj);
    };

    //--------------------------------------------

    var translate = function translate(key) {

        if (_.isString(key)) {

            var subkeys = key.split(":");

            if (subkeys.length == 2) {

                if (_.has(dictionary, subkeys[0])) {

                    return dictionary[subkeys[0]][subkeys[1]];
                }
            }
        }
        return "";
    };

    return {
        dictionary: dictionary,
        translate: translate,
        updateDictionary: updateDictionary
    };
})();

module.exports = Translator;

},{}],15:[function(require,module,exports){
"use strict";

var BaseModel = require('./../base-models/baseModel.js');

var SettingsModel = BaseModel.extend({

    defaults: {
        lang: "en-US",
        theme: "dust",
        userName: "demo@mailbone.com"
    },

    url: function url() {
        return "settings";
    },

    initialize: function initialize() {
        this.set("id", _.uniqueId("_"));
    }
});

module.exports = SettingsModel;

},{"./../base-models/baseModel.js":3}],16:[function(require,module,exports){
"use strict";

var app = require('./../../../setup/app.js');
var Settings = require("./settings");

var SettingsController = Marionette.Controller.extend({

    initialize: function initialize() {
        app.settings = new Settings();
    },

    //----------------------------------------------------

    fetch: function fetch() {

        app.settings.fetch({
            success: _.bind(function (model, resp, options) {
                $.when(this.loadTheme(), this.loadDictionary()).then(function () {
                    app.channel.vent.trigger("onSettingsLoaded");
                });
            }, this)
        });
    },

    //----------------------------------------------------

    loadTheme: function loadTheme() {

        var theme = app.settings.get("theme");

        return $.get("dist/css/themes/" + theme + "/" + theme + ".css", function (_css) {

            $("theme-css").remove();
            $(["<style type=\"text/css\" id=\"theme-css\">", _css, "</style>"].join("")).appendTo("head");
        });
    },

    //----------------------------------------------------

    loadDictionary: function loadDictionary() {

        return $.getJSON("dist/i18n/" + app.settings.get("lang") + ".json", function (i18nObject) {
            app.translator.updateDictionary(i18nObject);
        });
    }
});

module.exports = SettingsController;

},{"./../../../setup/app.js":88,"./settings":15}],17:[function(require,module,exports){
'use strict';

var app = require('./../../../setup/app.js');
var io = require('socket.io-client');

var SocketController = Marionette.Controller.extend({

    initialize: function initialize() {

        var socketURI = window.location.hostname + ':' + '8000' + '/';
        this._socket = io.connect(socketURI);

        this._socket.on('connect', function () {
            console.log('connection to server established.');
        });
        this._socket.on('error', function () {
            console.log('sorry, we are experiencing technical difficulties.');
        });
        this._socket.on('data:change', function (message) {
            app.vent.trigger('data:change', message);
        });
        this._socket.on('error1', function (err) {
            app.vent.trigger('socket:error', err);
        });

        window.addEventListener('unload', this._socket.close);
    },

    //------------------------------------------------------------

    getSocket: function getSocket() {
        return this._socket;
    },

    //------------------------------------------------------------

    registerUser: function registerUser(userName) {
        this._socket.emit('add-user', userName);
    }
});

module.exports = SocketController;

},{"./../../../setup/app.js":88,"socket.io-client":false}],18:[function(require,module,exports){
"use strict";

var AutoCompleteModel = require("./js/models/autoCompleteModel");
var AutoCompleteItemView = require("./js/views/autoCompleteItemView");
var AutoCompleteCompositeView = require("./js/views/autoCompleteCompositeView");
var AutoCompleteCollection = require("./js/collections/autoCompleteCollection");
var FilterCollectionDecorator = require('./../../../js/decorators/FilterCollectionDecorator');

var AutoComplete = Marionette.Controller.extend({

    initialize: function initialize(options) {

        this.el = options.el;
        this.vent = options.vent;
        this.maxItems = options.maxItems || 5;
        this.filterModel = options.filterModel;
        this.collection = new FilterCollectionDecorator(new AutoCompleteCollection(options.items || []), this.filterModel);

        this.listenTo(this.vent, "input:change", this.onInputChange, this);
    },

    //----------------------------------------------------
    // onFilterChange
    //----------------------------------------------------

    onInputChange: function onInputChange(input, options) {

        options = options || {};

        if (_.isEmpty(input)) {
            this.collection.filterAll();
        } else {
            this.filterModel.setInput(input);
            this.collection.filterBy({
                maxItems: this.maxItems,
                mandatoryItems: options.addSearchKey ? [new AutoCompleteModel({
                    text: input,
                    value: input,
                    type: AutoComplete.TYPES.SEARCH
                })] : []
            });
        }
    },

    //----------------------------------------------------
    // show
    //----------------------------------------------------

    show: function show() {
        this.collection.filterAll();

        this.autoCompleteTableView = new AutoCompleteCompositeView({
            vent: this.vent,
            collection: this.collection,
            el: this.el
        });
        this.autoCompleteTableView.render();
    }
});

AutoComplete.TYPES = AutoCompleteItemView.TYPES;

module.exports = AutoComplete;

},{"./../../../js/decorators/FilterCollectionDecorator":5,"./js/collections/autoCompleteCollection":19,"./js/models/autoCompleteModel":20,"./js/views/autoCompleteCompositeView":21,"./js/views/autoCompleteItemView":22}],19:[function(require,module,exports){
"use strict";

var AutoCompleteModel = require("../models/autoCompleteModel");

var AutoCompleteCollection = Backbone.Collection.extend({

    model: AutoCompleteModel
});

module.exports = AutoCompleteCollection;

},{"../models/autoCompleteModel":20}],20:[function(require,module,exports){
"use strict";

var AutoCompleteModel = Backbone.Model.extend({

    "default": {
        text: "",
        value: ""
    },

    //---------------------------------------------------\

    initialize: function initialize(obj, options) {

        if (_.isString(obj.text)) {
            this.set("text", obj.text.toLowerCase());
        }
        if (_.isString(obj.value)) {
            this.set("value", obj.value.toLowerCase());
        }
    }
});
module.exports = AutoCompleteModel;

},{}],21:[function(require,module,exports){
"use strict";

var template = require("../../ui/templates/autoComplete.hbs");
var AutoCompleteItemView = require("./autoCompleteItemView");

var KeyCode = {
    ENTER: 13,
    ARROW_UP: 38,
    ARROW_DOWN: 40
};

var AutoCompleteCompositeView = Marionette.CompositeView.extend({

    template: template,
    childView: AutoCompleteItemView,
    childViewContainer: ".menu",

    //-------------------------------------------------------------

    initialize: function initialize(options) {

        this.vent = options.vent;

        this.listenTo(this.collection, "empty:collection", this.closeEl);
        this.listenTo(this.vent, "autocomplete:item:click", this.selectItem);
        this.listenTo(this.vent, "autocomplete:item:over", this.onHover);
        this.listenTo(this.vent, "key:press", this.onKeyPress);
        this.listenTo(this.vent, "closeAll", this.closeEl);
    },

    //--------------------------------------------------------------

    buildChildView: function buildChildView(item, ItemView) {

        var view = new ItemView({
            model: item,
            vent: this.vent,
            filterModel: this.collection.filterModel
        });
        return view;
    },

    //------------------------------------------------------------

    onRender: function onRender() {

        this.closeEl();
    },

    //------------------------------------------------------------

    onRenderCollection: function onRenderCollection() {

        this.childArr = [];

        this.children.each(_.bind(function (view) {
            this.childArr.push(view);
        }, this));

        this.selectedItem = 0;
        this.showEl();
    },

    //-------------------------------------------------------------

    closeEl: function closeEl() {
        _.defer(_.bind(function () {
            this.selectedItem = -1;
            this.$el.hide();
        }, this));
    },

    //-------------------------------------------------------------

    showEl: function showEl() {
        this.setActive();
        this.$el.show();
    },

    //-------------------------------------------------------------

    onKeyPress: function onKeyPress(key) {

        switch (key) {
            case KeyCode.ARROW_UP:
                this.selectedItem = Math.max(0, this.selectedItem - 1);
                this.setActive();
                break;
            case KeyCode.ARROW_DOWN:
                this.selectedItem = Math.min(this.children.length - 1, this.selectedItem + 1);
                this.setActive();
                break;
            case KeyCode.ENTER:
                this.selectItem();
                break;
        }
    },

    //--------------------------------------------------------------

    setActive: function setActive() {

        this.children.each(function (view) {
            view.setActive(false);
        });

        var selectedView = this.childArr[this.selectedItem];

        if (_.isObject(selectedView)) {
            selectedView.setActive(true);
            this.vent.trigger("autocomplete:item:active", selectedView.model.get("text"), selectedView.model.get("value"));
        }
    },

    //-------------------------------------------------------------

    selectItem: function selectItem() {

        var selectedView = this.childArr[this.selectedItem];

        if (_.isObject(selectedView)) {
            this.vent.trigger("autocomplete:item:selected", selectedView.model.get("text"), selectedView.model.get("value"));
        }
        this.closeEl();
    },

    //--------------------------------------------------------------

    onHover: function onHover(item) {

        for (var i = 0; i < this.childArr.length; i++) {
            if (this.childArr[i].cid === item.cid) {
                this.selectedItem = i;
                break;
            }
        }
        this.setActive();
    }
});
module.exports = AutoCompleteCompositeView;

},{"../../ui/templates/autoComplete.hbs":23,"./autoCompleteItemView":22}],22:[function(require,module,exports){
"use strict";

var template = require("../../ui/templates/autoCompleteItem.hbs");

var AutoCompleteItemView = Marionette.ItemView.extend({
    template: template,
    tagName: "li",
    className: "li_row",

    ui: {
        "title": ".title",
        "text": ".text"
    },

    events: {
        "mouseenter": "_onMouseEnter",
        "click": "_onClick"
    },

    //-------------------------------------------------------------

    initialize: function initialize(options) {

        this.vent = options.vent;
        this.filterModel = options.filterModel;
    },

    //-------------------------------------------------------------

    templateHelpers: function templateHelpers() {

        var type = this.model.get("type");

        return {
            isContact: type === AutoCompleteItemView.TYPES.CONTACT,
            isSearch: type === AutoCompleteItemView.TYPES.SEARCH
        };
    },

    //-------------------------------------------------------------

    onRender: function onRender() {

        this.ui.title.html(this.filterModel.highlightKey(this.model.get("text")));
        this.ui.text.html(this.filterModel.highlightKey(this.model.get("value")));
    },

    //-------------------------------------------------------------

    _onMouseEnter: function _onMouseEnter() {

        this.vent.trigger("autocomplete:item:over", this);
    },

    //-------------------------------------------------------------

    _onClick: function _onClick() {

        this.vent.trigger("autocomplete:item:click");
    },

    //-------------------------------------------------------------

    setActive: function setActive(isActive) {
        this.$el.toggleClass("active", isActive);
    }
});

AutoCompleteItemView.TYPES = {
    CONTACT: 1,
    SEARCH: 2,
    RECENT: 3
};

module.exports = AutoCompleteItemView;

},{"../../ui/templates/autoCompleteItem.hbs":24}],23:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"autoComplete autoComplete-size\">\r\n    <ul class=\"menu browser-scroll light default-list\"></ul>\r\n</div>\r\n";
  });

},{"hbsfy/runtime":98}],24:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\r\n        <div class=\"icon contact\"></div>\r\n        <div class=\"contentWrapper\">\r\n            <div class=\"title\">";
  if (helper = helpers.text) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.text); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n            <div class=\"text\">";
  if (helper = helpers.value) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.value); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n        </div>\r\n    ";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\r\n        <div class=\"icon search\"></div>\r\n        <div class=\"contentWrapper\">\r\n            <div class=\"title\">";
  if (helper = helpers.text) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.text); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n        </div>\r\n    ";
  return buffer;
  }

  buffer += "<div class=\"dropdown-li-value\">\r\n    ";
  options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}
  if (helper = helpers.isContact) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.isContact); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.isContact) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\r\n\r\n    ";
  options={hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data}
  if (helper = helpers.isSearch) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.isSearch); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.isSearch) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\r\n</div>\r\n\r\n";
  return buffer;
  });

},{"hbsfy/runtime":98}],25:[function(require,module,exports){
"use strict";

var DialogView = require("./js/views/dialogView1");

var AutoComplete = Marionette.Controller.extend({

    initialize: function initialize(options) {

        options = options || {};

        this.el = options.el;
        this.vent = options.vent;
        this.title = options.title || "";
        this.insideView = options.insideView;
    },

    //----------------------------------------------------
    // show
    //----------------------------------------------------

    show: function show() {

        this.dialogView = new DialogView({
            vent: this.vent,
            el: this.el,
            title: this.title,
            zindex: 1000,
            insideView: this.insideView
        });
        this.dialogView.render();
    }
});

module.exports = AutoComplete;

},{"./js/views/dialogView1":26}],26:[function(require,module,exports){
"use strict";

var template = require("../../ui/templates/dialog.hbs");

var DialogView = Marionette.ItemView.extend({

    className: "dialog",
    template: template,
    insideView: null,
    templateId: null,

    ui: {
        btnClose: ".dialog-header-closeBtn"
    },

    events: {
        "click @ui.btnClose": "closeBtn"
    },

    initialize: function initialize(options) {

        if (options && options.insideView) {

            this.title = options.title;
            this.zIndex = options.zIndex;
            this.insideView = options.insideView;
            this.templateId = new Date().getTime().toString();
        }
    },

    //-----------------------------------------------
    // render
    //-----------------------------------------------

    onBeforeRender: function onBeforeRender() {

        this._$el = this.$el;
        this.$el = $("<div/>").addClass(this.className).addClass(this.templateId);
    },

    //-----------------------------------------------

    onRender: function onRender() {

        if (this.insideView) {
            this.$el.find(".dialog-header-title").html(this.title);
            this.$el.find(".dialog-innerBox").append(this.insideView.render().el);
            this._$el.append(this.$el);

            this.$el.find(".dialog-outerbox").css("margin-top", -this.insideView.$el.height() / 2 + "px");
            this.$el.find(".dialog-outerbox").css("margin-left", -this.insideView.$el.width() / 2 + "px");
        }
        return this;
    },

    //-----------------------------------------------
    // close
    //-----------------------------------------------

    closeBtn: function closeBtn(ev) {

        this.insideView.destroy();
        this._$el.find(".dialog." + this.templateId).remove();
    }
});

module.exports = DialogView;

},{"../../ui/templates/dialog.hbs":27}],27:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"dialog-overlay\"></div>\r\n\r\n<div class=\"dialog-outerbox\">\r\n\r\n    <div class=\"dialog-header\">\r\n        <div class=\"dialog-header-title\"></div>\r\n        <div class=\"dialog-header-closeBtn\"></div>\r\n    </div>\r\n\r\n    <div class=\"dialog-innerBox\">\r\n    </div>\r\n</div>\r\n\r\n\r\n";
  });

},{"hbsfy/runtime":98}],28:[function(require,module,exports){
"use strict";

var template = require("./ui/templates/search.hbs");

require('./../../../js/plugins/jquery.ba-outside-events');

var KeyCode = {
    ESC: 27,
    ENTER: 13,
    ARROW_UP: 38,
    ARROW_DOWN: 40
};

var SearchView = Marionette.ItemView.extend({

    template: template,

    ui: {
        "searchInput": ".search-input"
    },

    events: {
        "click .btnSearch": "search",
        "keyup .search-input": "onButtonKeyUp",
        "input .search-input": "onInputChange",
        "clickoutside": "outsideClicked"
    },

    //----------------------------------------------------------

    initialize: function initialize(options) {

        this.el = options.el;
        this.vent = options.vent;
        this.caption = options.caption;

        this.listenTo(this.vent, "autocomplete:item:selected", this.search, this);
        this.listenTo(this.vent, "autocomplete:item:active", this.onItemActive, this);
    },

    //-----------------------------------------------------------

    templateHelpers: function templateHelpers() {

        return {
            caption: this.caption
        };
    },

    //----------------------------------------------------------

    onItemActive: function onItemActive(text, value) {
        this.ui.searchInput.val(text);
    },

    //----------------------------------------------------------

    onButtonKeyUp: function onButtonKeyUp(event) {

        var key = event.keyCode;

        if (key === KeyCode.ARROW_DOWN || key === KeyCode.ARROW_UP || key === KeyCode.ENTER) {
            event.preventDefault();
            this.vent.trigger("key:press", key);
        }
    },

    //-----------------------------------------------------------

    onInputChange: function onInputChange() {
        this.vent.trigger("input:change", this.ui.searchInput.val(), { "addSearchKey": true });
    },

    //-----------------------------------------------------------

    search: function search() {
        this.vent.trigger("closeAll");
        this.vent.trigger("search", this.ui.searchInput.val());
    },

    //------------------------------------------------------------

    clear: function clear() {
        this.ui.searchInput.val("");
    },

    //------------------------------------------------------------

    outsideClicked: function outsideClicked() {
        this.vent.trigger("closeAll");
    }
});
module.exports = SearchView;

},{"./../../../js/plugins/jquery.ba-outside-events":10,"./ui/templates/search.hbs":29}],29:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<input class=\"search-input\" type=\"text\" autocomplete=\"off\" value=\"\">\r\n<a href=\"javascript:void(0)\" class=\"button primeIcon btnSearch\"><span class=\"searchIcon\"></span></a>";
  });

},{"hbsfy/runtime":98}],30:[function(require,module,exports){
"use strict";

var TagModel = require('./../models/tagModel');

var TagsCollection = Backbone.Collection.extend({
    model: TagModel
});

module.exports = TagsCollection;

},{"./../models/tagModel":31}],31:[function(require,module,exports){
"use strict";

var TagModel = Backbone.Model.extend({
    defaults: {
        text: "",
        value: "",
        isValid: true
    }
});

module.exports = TagModel;

},{}],32:[function(require,module,exports){
"use strict";

var template = require("../../ui/templates/tag.hbs");

var TagItemView = Marionette.ItemView.extend({
    template: template,
    className: "tag",

    ui: {
        content: ".content",
        btnClose: ".close-button"
    },

    events: {
        "click .close-button": "_onCloseBtnClick"
    },

    initialize: function initialize(options) {
        this.vent = options.vent;
    },

    onRender: function onRender() {
        this.$el.toggleClass("err", !this.model.get("isValid"));
    },

    _onCloseBtnClick: function _onCloseBtnClick() {
        this.vent.trigger("tag:item:remove", this.model.cid);
    }
});

module.exports = TagItemView;

},{"../../ui/templates/tag.hbs":35}],33:[function(require,module,exports){
"use strict";

var template = require("../../ui/templates/tagsContainer.hbs");
var TagsItemView = require("./tagsItemView");

require('./../../../../../js/plugins/jquery.ba-outside-events');

var KeyCode = {
    ESC: 27,
    ENTER: 13,
    ARROW_UP: 38,
    ARROW_DOWN: 40
};

var AutoCompleteCompositeView = Marionette.CompositeView.extend({

    template: template,
    childView: TagsItemView,
    childViewContainer: ".selectedTags",

    ui: {
        container: ".tags-container",
        tagSelector: ".tag-input"
    },

    events: {
        "click": "onClick",
        "keydown .tag-input": "onButtonKeyDown",
        "input .tag-input": "onInputChange",
        "clickoutside": "outsideClicked"
    },

    //----------------------------------------------------------
    // initialize
    //----------------------------------------------------------

    initialize: function initialize(options) {

        this.el = options.el;
        this.vent = options.vent;
        this.listenTo(this.vent, "tag:add", this.afterItemAdded);
    },

    //--------------------------------------------------------------

    buildChildView: function buildChildView(item, ItemView) {

        var view = new ItemView({
            model: item,
            vent: this.vent
        });
        return view;
    },

    //------------------------------------------------------------

    afterItemAdded: function afterItemAdded() {

        this.ui.tagSelector.text("");
        if (this.inFocus) {
            this.onClick();
        }
    },

    //----------------------------------------------------------
    // onClick
    //----------------------------------------------------------

    onClick: function onClick() {

        if (_.isEmpty(this.ui.tagSelector.text())) {
            this.resetSelector();
            this.inFocus = true;
        }
    },

    //------------------------------------------------------------

    resetSelector: function resetSelector() {

        this.ui.tagSelector.text("");
        this.ui.tagSelector.show();
        this.ui.tagSelector.focus();
    },

    //----------------------------------------------------------

    onButtonKeyDown: function onButtonKeyDown(event) {

        var key = event.keyCode;

        if (key === KeyCode.ARROW_DOWN || key === KeyCode.ARROW_UP) {
            event.preventDefault();
            this.vent.trigger("key:press", key);
        }

        if (key === KeyCode.ENTER) {
            this.ui.tagSelector.hide();
            this.vent.trigger("tag:input:enter", this.ui.tagSelector.text());
        }
    },

    //------------------------------------------------------------

    onInputChange: function onInputChange() {
        this.vent.trigger("input:change", this.ui.tagSelector.text());
    },

    //------------------------------------------------------------

    outsideClicked: function outsideClicked() {

        if (!_.isEmpty(this.ui.tagSelector.text())) {

            this.inFocus = false;
            this.vent.trigger("closeAll");
        }
    }
});
module.exports = AutoCompleteCompositeView;

},{"../../ui/templates/tagsContainer.hbs":36,"./../../../../../js/plugins/jquery.ba-outside-events":10,"./tagsItemView":32}],34:[function(require,module,exports){
"use strict";

var TagsView = require("./js/views/tagsView");
var TagModel = require("./js/models/tagModel");
var TagsCollection = require("./js/collections/tagCollection");

var Tags = Marionette.Controller.extend({

        initialize: function initialize(options) {

                var initialTags = options.initialTags || [];

                this.collection = new TagsCollection(initialTags);
                this.validator = options.validator;
                this.vent = options.vent;
                this.el = options.el;

                this._bindEvents();
        },

        //--------------------------------------------------

        _bindEvents: function _bindEvents() {

                this.listenTo(this.vent, "tag:input:enter", this.onEnter);
                this.listenTo(this.vent, "tag:item:remove", this.onRemoveItem);
                this.listenTo(this.vent, "autocomplete:item:selected", this.onItemSelected);
        },

        //----------------------------------------------------
        // show
        //----------------------------------------------------

        show: function show() {

                this.tagsView = new TagsView({
                        collection: this.collection,
                        vent: this.vent,
                        el: this.el
                });
                this.tagsView.render();
        },

        //---------------------------------------------------

        onEnter: function onEnter(val) {

                this.enterState = "unhandle";
                this.vent.trigger("key:press", 13);

                setTimeout(_.bind(function () {
                        if (this.enterState === "unhandle") {
                                this.addItem(val, val);
                        }
                }, this), 100);
        },

        //---------------------------------------------------

        onItemSelected: function onItemSelected(text, value) {

                this.enterState = "handle";
                this.addItem(text, value, true);
        },

        //---------------------------------------------------

        onRemoveItem: function onRemoveItem(tagId) {

                var tagModel = this.collection.get(tagId);

                if (_.isObject(tagModel)) {
                        this.collection.remove(tagModel);
                        this.vent.trigger("tag:remove", tagModel.get("value"));
                }
        },

        //---------------------------------------------------

        addItem: function addItem(text, val) {

                if (!_.isEmpty(val)) {

                        text = _.isEmpty(text) ? val : text;

                        var tag = new TagModel({ value: val, text: text, isValid: this._validate(val) });
                        this.collection.add(tag);

                        this.vent.trigger("tag:add", val);
                }
        },

        //---------------------------------------------------

        _validate: function _validate(val) {

                var isValid = true;

                if (_.isFunction(this.validator)) {
                        isValid = this.validator(val);
                }
                return isValid;
        }
});
module.exports = Tags;

},{"./js/collections/tagCollection":30,"./js/models/tagModel":31,"./js/views/tagsView":33}],35:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"content\">";
  if (helper = helpers.text) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.text); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n<div class=\"close-button\"></div>\r\n";
  return buffer;
  });

},{"hbsfy/runtime":98}],36:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"tags-container\">\r\n   <div class=\"selectedTags\"></div>\r\n   <div class=\"tag-selector\">\r\n       <span class=\"tag-input\" contenteditable=\"true\" tabindex=\"-1\"></span>\r\n   </div>\r\n</div>";
  });

},{"hbsfy/runtime":98}],37:[function(require,module,exports){
'use strict';

var app = require('./../setup/app.js');
var FrameLayout = require('./js/views/frameLayout');
var LayoutHelpers = require('./../common/js/resolvers/dropdownDisplayer');

var Frame = Marionette.Controller.extend({

    currSubLayout: '',

    //---------------------------------------------------
    // initialize
    //---------------------------------------------------

    initialize: function initialize(options) {

        this.frameLayout = new FrameLayout();
        this.listenTo(app.context, 'change:module', this.changeSublayout, this);
    },

    //---------------------------------------------------
    // setLayout
    //---------------------------------------------------

    setLayout: function setLayout(mainRegion) {
        mainRegion.show(this.frameLayout);
    },

    //--------------------------------------------------

    changeSublayout: function changeSublayout() {

        var subModule = app.submodules[app.context.get('module')];

        if (_.isObject(subModule) && _.isFunction(subModule.setLayout)) {
            subModule.setLayout();
            this.frameLayout.onModuleChange();
        }
    },

    //----------------------------------------------------
    // getRegions
    //----------------------------------------------------

    setRegion: function setRegion(regionName, view) {

        if (this.frameLayout[regionName + 'Region'] && !_.isEmpty(view)) {
            this.frameLayout[regionName + 'Region'].show(view);
        }
    }
});

module.exports = Frame;

},{"./../common/js/resolvers/dropdownDisplayer":12,"./../setup/app.js":88,"./js/views/frameLayout":38}],38:[function(require,module,exports){
"use strict";

var app = require('./../../../setup/app.js');
var Dialog = require('./../../../common/ui/components/dialog/dialog.js');
var TechBarView = require('./techBarView');
var LoaderView = require('./loaderView');
var SettingsView = require('./settingsView');
var FrameTemplate = require('./../../ui/templates/frameLayout.hbs');

var FrameLayout = Marionette.LayoutView.extend({
    template: FrameTemplate,

    ui: {
        switcherCaption: ".moduleSwitcher .caption",
        techbarWrapper: ".techbar-wrapper",
        loaderWrapper: ".loader-wrapper",
        btnSettings: ".btnSettings"
    },

    regions: {
        settingsRegion: ".settings-region",
        searchRegion: ".search-region",
        actionsRegion: ".actions-region",
        mainRegion: ".main-region"
    },

    events: {
        "click @ui.btnSettings": "openSettings"
    },

    //---------------------------------------------------------

    onRender: function onRender() {

        var techBarView = new TechBarView({
            el: this.ui.techbarWrapper
        });
        techBarView.render();

        var loaderView = new LoaderView({
            el: this.ui.loaderWrapper
        });
        loaderView.render();
    },

    //-------------------------------------------------------

    openSettings: function openSettings() {

        var settingsView = new SettingsView({
            model: app.settings
        });

        var dialog = new Dialog({
            el: this.el,
            title: app.translator.translate("frame:settings"),
            insideView: settingsView
        });
        dialog.show();
    },

    //-------------------------------------------------------

    onModuleChange: function onModuleChange() {
        this.ui.switcherCaption.html(app.translator.translate("frame:module." + app.context.get("module")));
    }
});

module.exports = FrameLayout;

},{"./../../../common/ui/components/dialog/dialog.js":25,"./../../../setup/app.js":88,"./../../ui/templates/frameLayout.hbs":42,"./loaderView":39,"./settingsView":40,"./techBarView":41}],39:[function(require,module,exports){
"use strict";

var app = require('./../../../setup/app.js');
var template = require('./../../ui/templates/loader.hbs');

var LoadingView = Marionette.ItemView.extend({
    template: template,

    ui: {
        loader: ".loader"
    },

    showLoader: function showLoader() {
        this.$el.show();
    },

    closeLoader: function closeLoader() {
        this.$el.hide();
    }
});

module.exports = LoadingView;

},{"./../../../setup/app.js":88,"./../../ui/templates/loader.hbs":43}],40:[function(require,module,exports){
"use strict";

var app = require('./../../../setup/app.js');
var template = require('./../../ui/templates/settingsView.hbs');

var SettingsView = Marionette.ItemView.extend({
    template: template,

    ui: {
        btnDark: ".darkTheme",
        btnDust: ".dustTheme",
        ddlLang: ".language-box"
    },

    events: {
        "click .themeBox": "onThemeClick",
        "change @ui.ddlLang": "onLanguageChange"
    },

    //----------------------------------------------------------------------

    onRender: function onRender() {

        this.ui.ddlLang.val(app.settings.get("lang"));
    },

    //----------------------------------------------------------------------

    onLanguageChange: function onLanguageChange() {

        var lang = this.ui.ddlLang.val();

        app.settings.set("lang", lang);
        app.settings.save(null, {
            success: function success() {
                location.reload(true);
            }
        });
    },

    //----------------------------------------------------------------------

    onThemeClick: function onThemeClick(e) {

        var target = $(e.currentTarget || e.srcElement);
        var theme = target.attr("data-name");

        app.settings.set("theme", theme);
        app.settings.save(null, {
            success: function success() {
                app.settingsController.loadTheme();
            }
        });
    }
});

module.exports = SettingsView;

},{"./../../../setup/app.js":88,"./../../ui/templates/settingsView.hbs":44}],41:[function(require,module,exports){
"use strict";

var template = require('./../../ui/templates/techBar.hbs');

var TechBarView = Marionette.ItemView.extend({
    template: template,

    ui: {
        ddsResources: ".ddsResources"
    },

    events: {
        "click .ddsResources": "onResourcesMenuClick"
    },

    onResourcesMenuClick: function onResourcesMenuClick(e) {
        e.stopPropagation();
    }
});

module.exports = TechBarView;

},{"./../../ui/templates/techBar.hbs":45}],42:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


  buffer += "<div class=\"techbar-wrapper\"></div>\r\n<div class=\"loader-wrapper\"></div>\r\n<div class=\"header-wrapper\">\r\n     <div class=\"logo\"></div>\r\n     <div class=\"search-region\"></div>\r\n     <div class=\"accountName\" alt=";
  if (helper = helpers.accountName) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.accountName); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + " title=\"";
  if (helper = helpers.accountName) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.accountName); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\"></div>\r\n</div>\r\n<div class=\"actions-wrapper\">\r\n    <div class=\"moduleSwitcher\">\r\n        <a href=\"javascript:void(0)\" class=\"button link dropdown ddsId_ddsModules\"><span class=\"caption\"></span><span class=\"toggle\"></span></a>\r\n        <div class=\"dropdown-slider ddsModules\">\r\n           <a class=\"ddm selectMail\" href=\"#inbox\"></span><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "frame:module.mail", options) : helperMissing.call(depth0, "_i18n", "frame:module.mail", options)))
    + "</span></a>\r\n           <a class=\"ddm selectTasks\" href=\"#tasks\"><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "frame:module.tasks", options) : helperMissing.call(depth0, "_i18n", "frame:module.tasks", options)))
    + "</span></a>\r\n        </div>\r\n    </div>\r\n     <div class=\"actions-region\"></div>\r\n     <div class=\"btnSettings\"><a href=\"javascript:void(0)\" class=\"button primeIcon _btnSettings\"><span class=\"settingsIcon\"></span></a></div>\r\n</div>\r\n<div class=\"main-region\"></div>";
  return buffer;
  });

},{"hbsfy/runtime":98}],43:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"loader\">Loading......</div>\r\n\r\n\r\n";
  });

},{"hbsfy/runtime":98}],44:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  buffer += "<div class=\"settingsView\">\r\n\r\n       <div class=\"section\">\r\n           <div class=\"title\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "frame:settings.language", options) : helperMissing.call(depth0, "_i18n", "frame:settings.language", options)))
    + "</div>\r\n           <select class=\"language-box\" name=\"languages\" data-action=\"languages\" >\r\n               <option value=\"en-US\">English (US)</option>\r\n               <option value=\"es-ES\">Español</option>\r\n           </select>\r\n       </div>\r\n\r\n       <div class=\"section\">\r\n            <div class=\"title\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "frame:settings.theme", options) : helperMissing.call(depth0, "_i18n", "frame:settings.theme", options)))
    + "</div>\r\n            <div class=\"themeBox dustTheme\" data-name=\"dust\"></div>\r\n            <div class=\"themeBox darkTheme\" data-name=\"dark\"></div>\r\n       </div>\r\n</div>";
  return buffer;
  });

},{"hbsfy/runtime":98}],45:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  buffer += "<div class=\"techbar\">\r\n    <div class=\"title\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "frame:techbar.slogan", options) : helperMissing.call(depth0, "_i18n", "frame:techbar.slogan", options)))
    + "</div>\r\n    <div class=\"menu\">\r\n        <a href=\"javascript:void(0)\" class=\"button link menuitem\"><span class=\"caption\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "frame:techbar.about", options) : helperMissing.call(depth0, "_i18n", "frame:techbar.about", options)))
    + "</span></a>\r\n        <a href=\"javascript:void(0)\" class=\"button link menuitem\"><span class=\"caption\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "frame:techbar.tutorial", options) : helperMissing.call(depth0, "_i18n", "frame:techbar.tutorial", options)))
    + "</span></a>\r\n        <a href=\"javascript:void(0)\" class=\"button link dropdown menuitem ddsId_ddsResources\"><span class=\"caption\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "frame:techbar.resources", options) : helperMissing.call(depth0, "_i18n", "frame:techbar.resources", options)))
    + "</span><span class=\"toggle\"></span></a>\r\n\r\n        <div class=\"dropdown-slider ddsResources\" display=\"none\">\r\n            <div class=\"container\">\r\n                <ul>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Client-side</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Backbone</span>\r\n                            <span class=\"item\">Backbone.DeepModel</span>\r\n                            <span class=\"item\">Marionette</span>\r\n                            <span class=\"item\">Underscore</span>\r\n                            <span class=\"item\">Browserify</span>\r\n                            <span class=\"item\">Handlebars</span>\r\n                            <span class=\"item\">Sass\\Compass</span>\r\n                            <span class=\"item\">ECMAScript 6 (Babel)</span>\r\n                         </p>\r\n                    </li>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Server-side</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Node.js (Express 4.0)</span>\r\n                             <span class=\"item\">Passport.js</span>\r\n                            <span class=\"item\">MongoDB</span>\r\n                            <span class=\"item\">Mongoose</span>\r\n                            <span class=\"item\">Socket.io</span>\r\n                         </p>\r\n                    </li>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Testing tools</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Mocha + Chai</span>\r\n                            <span class=\"item\">Sinon</span>\r\n                            <span class=\"item\">Blanket</span>\r\n                         </p>\r\n                    </li>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Deploying tools</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Grunt</span>\r\n                          </p>\r\n                    </li>\r\n\r\n                </ul>\r\n            </div>\r\n\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n\r\n";
  return buffer;
  });

},{"hbsfy/runtime":98}],46:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var ContactModel = require('./../models/contactModel');
var BaseCollection = require('./../../../../common/js/base-collections/baseCollection');


var _strContacts = "[\r\n    \"demo\",\r\n    \"maildo\",\r\n    \"Angela,Powell\",\r\n    \"Alan,Rogers\",\r\n    \"Patricia,White\",\r\n    \"Pamela,Johnson\",\r\n    \"Dennis,King\",\r\n    \"Edward,Williams\",\r\n    \"Julia,Ward\",\r\n    \"Benjamin,Ross\",\r\n    \"Keith,Lee\",\r\n    \"Mark,Patterson\",\r\n    \"Daniel,Taylor\",\r\n    \"Earl,Morris\",\r\n    \"Diana,Adams\",\r\n    \"Peter,Jones\",\r\n    \"Cynthia,Nelson\",\r\n    \"Mary,Griffin\",\r\n    \"Anna,James\",\r\n    \"Charles,Watson\",\r\n    \"Martin,Sanchez\",\r\n    \"Stephanie,Henderson\",\r\n    \"Jean,Jackson\",\r\n    \"Michael,Martin\",\r\n    \"Jerry,Garcia\",\r\n    \"Jane,Gonzales\",\r\n    \"David,Evans\",\r\n    \"Lawrence,Simmons\",\r\n    \"Helen,Hernandez\",\r\n    \"Patrick,Stewart\",\r\n    \"Howard,Alexander\",\r\n    \"Theresa,Barnes\",\r\n    \"Lori,Thomas\",\r\n    \"Judith,Miller\",\r\n    \"Phyllis,Morgan\",\r\n    \"Ashley,Bell\",\r\n    \"Denise,Wright\",\r\n    \"Nicole,Smith\",\r\n    \"Deborah,Robinson\",\r\n    \"Rebecca,Brooks\",\r\n    \"Ralph,Bryant\",\r\n    \"Anne,Rivera\",\r\n    \"Rose,Gonzalez\",\r\n    \"James,Davis\",\r\n    \"Russell,Russell\",\r\n    \"Larry,Kelly\",\r\n    \"Jeffrey,Collins\",\r\n    \"Raymond,Harris\",\r\n    \"Sarah,Mitchell\",\r\n    \"Andrew,Howard\",\r\n    \"Tammy,Cook\",\r\n    \"Brandon,Rodriguez\",\r\n    \"Jessica,Phillips\",\r\n    \"Barbara,Anderson\",\r\n    \"Louis,Flores\",\r\n    \"Janet,Clark\",\r\n    \"Shawn,Allen\",\r\n    \"Kenneth,Diaz\",\r\n    \"Carl,Butler\",\r\n    \"Kathryn,Price\",\r\n    \"Anthony,Walker\",\r\n    \"Jose,Brown\",\r\n    \"Willie,Wood\",\r\n    \"Gary,Green\",\r\n    \"Susan,Scott\",\r\n    \"Andrea,Gray\",\r\n    \"Wanda,Ramirez\",\r\n    \"Teresa,Foster\",\r\n    \"Rachel,Carter\",\r\n    \"Amy,Wilson\",\r\n    \"Randy,Edwards\",\r\n    \"Wayne,Perez\",\r\n    \"Nancy,Hall\",\r\n    \"Dorothy,Campbell\",\r\n    \"Steven,Reed\",\r\n    \"Karen,Perry\",\r\n    \"George,Bailey\",\r\n    \"Eric,Murphy\",\r\n    \"Billy,Young\",\r\n    \"Bonnie,Roberts\",\r\n    \"Bobby,Lopez\",\r\n    \"Judy,Thompson\",\r\n    \"Paul,Hill\",\r\n    \"Gregory,Torres\",\r\n    \"Alice,Peterson\",\r\n    \"Jimmy,Cox\",\r\n    \"Eugene,Cooper\",\r\n    \"Katherine,Long\",\r\n    \"Mildred,Martinez\",\r\n    \"Jennifer,Washington\",\r\n    \"Timothy,Bennett\",\r\n    \"Richard,Richardson\",\r\n    \"Diane,Parker\",\r\n    \"Victor,Jenkins\",\r\n    \"Bruce,Coleman\",\r\n    \"Joshua,Lewis\",\r\n    \"Margaret,Hughes\",\r\n    \"Samuel,Baker\",\r\n    \"Marilyn,Sanders\",\r\n    \"Lois,Turner\",\r\n    \"Donna,Moore\",\r\n    \"Iris,Wilkerson\",\r\n    \"Nichole,Hampton\",\r\n    \"Rodolfo,Larson\",\r\n    \"Roosevelt,Paul\",\r\n    \"Ervin,Chapman\",\r\n    \"Abraham,Norton\",\r\n    \"Marlon,Cox\",\r\n    \"Neil,Gibson\",\r\n    \"Leah,Little\",\r\n    \"Joshua,Cunningham\",\r\n    \"Toby,Simon\",\r\n    \"Walter,Gardner\",\r\n    \"Shelia,Jensen\",\r\n    \"Forrest,White\",\r\n    \"Lonnie,Byrd\",\r\n    \"Sherri,Lyons\",\r\n    \"Don,Stewart\",\r\n    \"Phillip,Parsons\",\r\n    \"Melanie,Mcgee\",\r\n    \"Armando,Sims\",\r\n    \"Lucille,Higgins\",\r\n    \"Ralph,Douglas\",\r\n    \"Laurie,Patton\",\r\n    \"Chester,Mccoy\",\r\n    \"Francisco,Sherman\",\r\n    \"Chad,Owen\",\r\n    \"Stacey,Greene\",\r\n    \"Kelly,Mcbride\",\r\n    \"Valerie,Lamb\",\r\n    \"Dominic,Carroll\",\r\n    \"Gerardo,Becker\",\r\n    \"Danny,Carlson\",\r\n    \"Regina,Mack\",\r\n    \"Jason,Powell\",\r\n    \"Wilma,Perkins\",\r\n    \"Rebecca,Reyes\",\r\n    \"Lynda,Richards\",\r\n    \"Omar,Woods\",\r\n    \"Sylvia,Pearson\",\r\n    \"Lynn,Hines\",\r\n    \"Elbert,Johnston\",\r\n    \"Tracey,Weaver\",\r\n    \"Faye,Young\",\r\n    \"Kristina,Perez\",\r\n    \"Kenneth,Green\",\r\n    \"Barbara,Garrett\",\r\n    \"Tommie,Crawford\",\r\n    \"Kerry,Steele\",\r\n    \"Joy,Brewer\",\r\n    \"Lula,Barker\",\r\n    \"Sue,French\",\r\n    \"Marty,Jefferson\",\r\n    \"Rosalie,Gross\",\r\n    \"Chris,Frazier\",\r\n    \"Cecilia,Hayes\",\r\n    \"Elsa,Rodgers\",\r\n    \"Myra,Kelly\",\r\n    \"Bernard,Blake\",\r\n    \"Leon,Phillips\",\r\n    \"Monique,Todd\",\r\n    \"Catherine,Rodriquez\",\r\n    \"Angel,Roy\",\r\n    \"Elsie,Wood\",\r\n    \"Dean,Morton\",\r\n    \"Teresa,Oliver\",\r\n    \"Lucia,Benson\",\r\n    \"Misty,Andrews\",\r\n    \"Douglas,Caldwell\",\r\n    \"Joe,Maxwell\",\r\n    \"Ollie,Warren\",\r\n    \"Mildred,Bradley\",\r\n    \"Christie,Fox\",\r\n    \"Colin,Jacobs\",\r\n    \"Joann,Cummings\",\r\n    \"Delia,Wagner\",\r\n    \"Jesse,Chambers\",\r\n    \"Byron,Craig\",\r\n    \"Evan,Huff\",\r\n    \"Dianna,Schneider\",\r\n    \"Dwight,Morales\",\r\n    \"Jeannie,Coleman\",\r\n    \"Doyle,Reed\",\r\n    \"Constance,Perry\",\r\n    \"Amy,Wallace\",\r\n    \"Ellis,Cook\",\r\n    \"Olga,Santiago\",\r\n    \"Jesus,Mitchell\",\r\n    \"Minnie,Reid\",\r\n    \"Gina,Vaughn\",\r\n    \"Adam,Jackson\",\r\n    \"Simon,Wilson\",\r\n    \"Judy,Fernandez\",\r\n    \"Adrienne,Bowen\",\r\n    \"Isabel,Haynes\",\r\n    \"Darla,Bridges\",\r\n    \"Laura,Padilla\",\r\n    \"Earl,Webb\",\r\n    \"Warren,Ortega\",\r\n    \"Garrett,Stokes\",\r\n    \"Edgar,Gibbs\",\r\n    \"Araceli,Callender\",\r\n    \"Salena,Corona\",\r\n    \"Harlan,Berlin\",\r\n    \"Keira,Trinidad\",\r\n    \"Digna,Fogle\",\r\n    \"Brandon,Melvin\",\r\n    \"Waltraud,Rife\",\r\n    \"Lenora,Parrott\",\r\n    \"Gillian,Stamps\",\r\n    \"Toshiko,Hagan\",\r\n    \"Mariette,Machado\",\r\n    \"Chrystal,Dove\",\r\n    \"Verlene,Partin\",\r\n    \"Annita,Pedersen\",\r\n    \"Luanne,Burnside\",\r\n    \"Mari,Macias\",\r\n    \"Joselyn,Gilson\",\r\n    \"Kenya,Peeler\",\r\n    \"Suellen,Gamboa\",\r\n    \"Trudy,Gale\",\r\n    \"Cristopher,Brink\",\r\n    \"Ria,Whalen\",\r\n    \"Dulcie,Preston\",\r\n    \"Tari,Baird\",\r\n    \"Karrie,Griffis\",\r\n    \"Shonna,Andersen\",\r\n    \"Sonny,Mccloskey\",\r\n    \"Alline,Acosta\",\r\n    \"Winter,Corey\",\r\n    \"Janessa,Madsen\",\r\n    \"Rikki,Cowles\",\r\n    \"Kaila,Luce\",\r\n    \"Lucila,Rickard\",\r\n    \"Tammi,Boland\",\r\n    \"Dayna,Heck\",\r\n    \"Ayako,Kruse\",\r\n    \"Chrissy,Ellsworth\",\r\n    \"Gricelda,Jude\",\r\n    \"Yu,Richter\",\r\n    \"Robena,Wallen\",\r\n    \"Fredricka,Mccaskill\",\r\n    \"Bobby,Simonson\",\r\n    \"Fernande,Pearce\",\r\n    \"Glendora,Searcy\",\r\n    \"Tamisha,Thornhill\",\r\n    \"Retta,Tubbs\",\r\n    \"Era,Hatley\",\r\n    \"Laurel,Dockery\",\r\n    \"Vanita,William\",\r\n    \"Ashleigh,Orr\",\r\n    \"Janita,Houser\",\r\n    \"Zora,Wilt\",\r\n    \"Anamaria,Ramey\",\r\n    \"Louetta,Headrick\",\r\n    \"Sheena,Elam\",\r\n    \"Cindie,Winchester\",\r\n    \"Glynis,Connelly\",\r\n    \"Ty,Beal\",\r\n    \"Lieselotte,Barr\",\r\n    \"Santina,Hoang\",\r\n    \"Idalia,Shank\",\r\n    \"Reynalda,Linares\",\r\n    \"Ulrike,Marr\",\r\n    \"Dodie,South\",\r\n    \"Sadye,Spellman\",\r\n    \"Frida,Reyna\",\r\n    \"Elina,Lennon\",\r\n    \"Berna,Clement\",\r\n    \"Filiberto,Grimes\",\r\n    \"Anibal,Howe\",\r\n    \"Arthur,Levine\",\r\n    \"See,Mcdonough\",\r\n    \"Nisha,Moniz\",\r\n    \"Lianne,Butcher\",\r\n    \"Demetria,Mcgraw\",\r\n    \"Roxann,Kaplan\",\r\n    \"Yong,Sikes\",\r\n    \"Lesley,Reedy\",\r\n    \"Aundrea,Abraham\",\r\n    \"Mireille,Quezada\",\r\n    \"Loree,Asher\",\r\n    \"Kathi,Dejesus\",\r\n    \"Rashida,Whitlock\",\r\n    \"Bettie,Hacker\",\r\n    \"Oneida,Traylor\",\r\n    \"August,Moreland\",\r\n    \"Margery,Henning\",\r\n    \"Winona,Coe\",\r\n    \"Adam,Mcnabb\",\r\n    \"Kenda,Hackney\",\r\n    \"Arnita,Duggan\",\r\n    \"Eliz,Mauldin\",\r\n    \"Raymundo,Rosenbaum\",\r\n    \"Palmira,Autry\",\r\n    \"Kathrine,Tillery\",\r\n    \"George,Mcmillan\",\r\n    \"Manda,Waddell\",\r\n    \"Pasquale,Royer\",\r\n    \"Stefania,Buckingham\",\r\n    \"Ramonita,Kidwel\"\r\n]";

var ContactsCollection = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        ContactsCollection = BaseCollection.extend({

                model: ContactModel,

                //----------------------------------------------------

                initialize: function initialize() {

                        var contactList = this._createContactList();
                        this.set(contactList);
                },

                //----------------------------------------------------

                _createContactList: function _createContactList() {

                        var contactList = [],
                            contacts = JSON.parse(_strContacts);

                        _.each(contacts, function (contact) {
                                contactList.push({
                                        title: contact.replace(",", " "),
                                        address: contact.replace(",", ".").toLowerCase() + "@maildo.com"
                                });
                        });

                        return contactList;
                },

                //----------------------------------------------------

                getTitles: function getTitles(addressList) {

                        var res = [];

                        _.each(addressList, _.bind(function (address) {

                                var model = _.find(this.models, function (record) {
                                        return record.get("address") === address;
                                });
                                res.push(model ? model.get("title") : address);
                        }, this));

                        return res;
                },

                //------------------------------------------------------

                addContact: function addContact(contactInfo) {

                        var contactModel = new ContactModel({
                                title: contactInfo,
                                address: contactInfo + "@maildo.com"
                        });
                        this.add(contactModel, { silent: true });
                }
        });
});
module.exports = ContactsCollection;

},{"./../../../../common/js/base-collections/baseCollection":1,"./../../../../setup/app.js":88,"./../models/contactModel":53}],47:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var MailModel = require('./../models/mailModel');
var FilteredCollection = require('./../../../../common/js/base-collections/filteredCollection');

var MailCollection = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        MailCollection = FilteredCollection.extend({

                isFetched: false,

                model: MailModel,

                resource: "mails",

                initialize: function initialize(attrs, options) {

                        this.socket = {
                                requestName: this.resource,
                                io: app.socketController.getSocket()
                        };
                },

                //--------------------------------------------------

                url: function url() {
                        return window.location.hostname + "/" + this.resource;
                },

                //--------------------------------------------------

                comparator: function comparator(model) {
                        return -new Date(model.get("sentTime")).getTime();
                },

                //--------------------------------------------------

                filterByLabel: function filterByLabel(label) {

                        var filtered = [];

                        if (_.isString(label)) {

                                filtered = _.filter(this.models, function (model) {
                                        return !!model.get("labels." + label);
                                });
                        }

                        return filtered;
                }
        });
});
module.exports = MailCollection;

},{"./../../../../common/js/base-collections/filteredCollection":2,"./../../../../setup/app.js":88,"./../models/mailModel":55}],48:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');

var ActionsController = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

    ActionsController = Marionette.Controller.extend({

        initialize: function initialize() {

            this.mails = mail.channel.reqres.request("mail:collection");
            this._bindEvents();
        },

        //-----------------------------------------------------

        _bindEvents: function _bindEvents() {

            this.listenTo(this.mails, "change:metadata", this.fixUrl, this);
            this.listenTo(mail.channel.vent, "mail:send", this.send, this);
            this.listenTo(mail.channel.vent, "mail:select", this.select, this);
            this.listenTo(mail.channel.vent, "mail:moveTo", this.moveTo, this);
            this.listenTo(mail.channel.vent, "mail:delete", this.deleteItems, this);
            this.listenTo(mail.channel.vent, "mail:markAs", this.markAs, this);
            this.listenTo(mail.channel.vent, "mail:discard", this.discard, this);
            this.listenTo(mail.channel.vent, "mail:change", this.saveAsDraft, this);
        },

        //----------------------------------------------------

        select: function select(options) {

            switch (options.selectBy) {

                case "all":
                    this.mails.selectAll();
                    break;
                case "none":
                    this.mails.clearSelected();
                    break;
                case "read":
                    this.mails.selectModels(this.mails.filterByLabel("read"), { exclusively: true });
                    break;
                case "unread":
                    this.mails.selectModels(this.mails.filterByLabel("unread"), { exclusively: true });
                    break;
            }
        },

        //----------------------------------------------------

        markAs: function markAs(options) {

            var that = this,
                items = options.items || this.mails.getSelected();

            _.each(items, function (item) {
                var model = that.mails.get(item);
                if (model) {
                    model.markAs(options.label);
                }
            });
            this.updateItems(items, options);
        },

        //----------------------------------------------------

        moveTo: function moveTo(options) {

            var that = this,
                items = options.items || this.mails.getSelected();

            _.each(items, function (item) {
                var model = that.mails.get(item);
                if (model) {
                    model.moveTo(options.target, options);
                }
            });
            this.updateItems(items, _.extend({}, options, { "refresh": true }));
        },

        //----------------------------------------------------

        updateItems: function updateItems(items, options) {

            this.mails.update({

                selectedItems: items,
                fields: ["labels", "groups"],

                success: _.bind(function () {
                    if (options.refresh) {
                        this.handleSuccess();
                    }
                }, this),
                error: function error() {
                    mail.channel.vent.trigger("mail:updateItems:error");
                }
            });
        },

        //----------------------------------------------------

        deleteItems: function deleteItems() {

            this.mails.destroy({

                selectedItems: this.mails.getSelected(),

                success: _.bind(function () {
                    this.handleSuccess();
                }, this),
                error: function error() {
                    mail.channel.vent.trigger("mail:deleteItems:error");
                }
            });
        },

        //-------------------------------------------

        send: function send(mailModel) {

            if (_.isObject(mailModel)) {

                mailModel.set("groups", [], { silent: true });

                mailModel.save(null, {
                    silent: true,
                    success: _.bind(function () {
                        this.handleSuccess();
                    }, this),
                    error: function error() {
                        mail.channel.vent.trigger("mail:save:error", mailModel);
                    }
                });
            }
        },

        //-------------------------------------------

        discard: function discard(mailModel) {

            if (mailModel.isNew()) {
                mail.router.previous();
            } else {
                mailModel.destroy({
                    success: _.bind(function () {
                        this.handleSuccess();
                    }, this),
                    error: function error() {
                        mail.channel.vent.trigger("mail:delete:error", mailModel);
                    }
                });
            }
        },

        //-------------------------------------------

        saveAsDraft: function saveAsDraft(mailModel) {

            mailModel.set("groups", ["draft"], { silent: true });

            mailModel.save(null, {
                saveAs: "draft",
                silent: true
            });
        },

        //------------------------------------------

        fixUrl: function fixUrl(metadata) {
            mail.router.fixUrl({ page: metadata.currPage + 1 });
        },

        //------------------------------------------

        handleSuccess: function handleSuccess() {

            if (app.context.get("mail.action.type") === "compose") {
                mail.router.previous();
            } else {
                this.mails.refresh();
            }
        }
    });
});
module.exports = ActionsController;

},{"./../../../../setup/app.js":88}],49:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var ContentLayout = require('./../views/mailContentLayout');
var MailsView = require('./../views/mailsView');
var PreviewView = require('./../views/previewView');
var ComposeView = require('./../views/composeView/composeView');
var EmptyMailView = require('./../views/emptyMailView');

var MailContentController = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        MailContentController = Marionette.Controller.extend({

                initialize: function initialize() {

                        this.mails = mail.channel.reqres.request("mail:collection");
                        this._bindEvents();
                },

                //-----------------------------------------------------

                _bindEvents: function _bindEvents() {

                        this.listenTo(this.mails, "change:items", this.closePreview);
                        this.listenTo(this.mails, "change:selection", this.togglePreview);
                        this.listenTo(mail.channel.vent, "mailTable:ItemClicked", this.showPreview);
                },

                //----------------------------------------------------
                // newLayout
                //----------------------------------------------------

                newLayout: function newLayout() {

                        this.contentLayout = new ContentLayout();
                        this.listenTo(this.contentLayout, "render", this.onLayoutRender);

                        return this.contentLayout;
                },

                //----------------------------------------------------

                onLayoutRender: function onLayoutRender() {

                        var action = app.context.get("mail.action");

                        var emptyMailView = new EmptyMailView();
                        this.contentLayout.previewRegion.add(emptyMailView);

                        var tableView = new MailsView({ collection: this.mails });
                        this.contentLayout.itemsRegion.add(tableView);
                },

                //----------------------------------------------------
                // showPreview
                //----------------------------------------------------

                showPreview: function showPreview(mailModel) {

                        if (_.isObject(mailModel)) {

                                mail.channel.vent.trigger("mail:select", { selectBy: "none" });
                                mail.channel.vent.trigger("mail:markAs", { label: "read", items: [mailModel.id] });

                                this.preview = !mailModel.get("groups.draft") ? new PreviewView({ model: mailModel }) : new ComposeView({ model: mailModel });
                                this.contentLayout.previewRegion.add(this.preview);
                        }
                },

                //----------------------------------------------------

                togglePreview: function togglePreview() {

                        if (_.isObject(this.preview)) {

                                var selected = this.mails.getSelected().length;
                                this.preview.$el.toggle(selected === 0);
                        }
                },

                //----------------------------------------------------

                closePreview: function closePreview() {

                        if (this.preview && this.preview.model) {

                                var isModelExist = _.isObject(this.mails.get(this.preview.model.id));

                                if (!isModelExist) {
                                        this.contentLayout.previewRegion.clean();
                                }
                        }
                }
        });
});
module.exports = MailContentController;

},{"./../../../../setup/app.js":88,"./../views/composeView/composeView":62,"./../views/emptyMailView":64,"./../views/mailContentLayout":65,"./../views/mailsView":68,"./../views/previewView":70}],50:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var MailCollection = require('./../collections/mailCollection');
var ContactsCollection = require('./../collections/contactsCollection');
var SelectableDecorator = require('./../../../../common/js/decorators/selectableCollectionDecorator');

var DataController = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        DataController = Marionette.Controller.extend({

                //---------------------------------------------------
                // initialize
                //---------------------------------------------------

                initialize: function initialize() {

                        this.contactCollection = new ContactsCollection();
                        this.mailCollection = new SelectableDecorator(new MailCollection());

                        this._bindEvents();
                        this._setHandlers();
                },

                //-----------------------------------------------------

                _bindEvents: function _bindEvents() {

                        this.listenTo(this.mailCollection, "fetch:success", this._updateSelection, this);
                        this.listenTo(app.context, "change:mail.action", this._refreshMailCollection, this);
                        this.listenTo(app.vent, "onSettingsLoaded", this._updateContacts, this);
                        this.listenTo(app.vent, "data:change", this._onDataChange, this);
                },

                //------------------------------------------------------

                _setHandlers: function _setHandlers() {

                        mail.channel.reqres.setHandler("mail:collection", this._getMailCollection, this);
                        mail.channel.reqres.setHandler("contact:collection", this._getContactCollection, this);
                },

                //------------------------------------------------------
                // get collections
                //-------------------------------------------------------

                _getMailCollection: function _getMailCollection() {
                        return this.mailCollection;
                },

                //------------------------------------------------------

                _getContactCollection: function _getContactCollection() {
                        return this.contactCollection;
                },

                //-----------------------------------------------------
                // data change
                //-----------------------------------------------------

                _onDataChange: function _onDataChange() {
                        this._refreshMailCollection();
                },

                //------------------------------------------------------

                _updateSelection: function _updateSelection() {
                        this.mailCollection.updateSelection({});
                },

                //-----------------------------------------------------

                _updateContacts: function _updateContacts() {
                        this.contactCollection.addContact(app.settings.get("userName"));
                },

                //-----------------------------------------------------

                _refreshMailCollection: function _refreshMailCollection() {

                        var action = app.context.get("mail.action") || {};
                        var params = action.params || {};

                        if (_.isFinite(params.page)) {
                                this.mailCollection.fetchBy({
                                        filters: {
                                                pageNumber: params.page,
                                                query: params.query || "groups:" + action.type
                                        }
                                });
                        }
                }
        });
});
module.exports = DataController;

},{"./../../../../common/js/decorators/selectableCollectionDecorator":6,"./../../../../setup/app.js":88,"./../collections/contactsCollection":46,"./../collections/mailCollection":47}],51:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var MailModel = require('./../models/mailModel');
var MainLayout = require('./../views/mailMainLayout');
var SearchView = require('./../views/searchView');
var NavView = require('./../views/navView');
var ActionView = require('./../views/actionView/actionView');
var ComposeView = require('./../views/composeView/composeView');
var EmptyFoldersView = require('./../views/emptyFolderView');
var ContentLayoutController = require("./mailContentLayoutController");

var MainLayoutController = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        MainLayoutController = Marionette.Controller.extend({

                initialize: function initialize() {

                        this.contentLayoutController = new ContentLayoutController();
                        this.listenTo(app.context, "change:mail.action", this.onActionChange, this);
                },

                //----------------------------------------------------
                // setViews
                //----------------------------------------------------

                setViews: function setViews() {

                        this.searchView = new SearchView();
                        this.mainLayout = new MainLayout();
                        this.actionView = new ActionView();

                        this.listenTo(this.mainLayout, "render", this.onMainLayoutRender, this);

                        app.frame.setRegion("search", this.searchView);
                        app.frame.setRegion("actions", this.actionView);
                        app.frame.setRegion("main", this.mainLayout);
                },

                //----------------------------------------------------

                onMainLayoutRender: function onMainLayoutRender() {

                        var navView = new NavView();
                        this.mainLayout.navRegion.add(navView);

                        var emptyFolderView = new EmptyFoldersView();
                        this.mainLayout.workRegion.add(emptyFolderView);
                },

                //----------------------------------------------------
                // onActionChange
                //----------------------------------------------------

                onActionChange: function onActionChange() {

                        var action = app.context.get("mail.action.type");

                        switch (action) {
                                case "compose":
                                        this.compose();
                                        break;
                                default:
                                        this.showMails();
                        }
                },

                //----------------------------------------------------

                compose: function compose() {

                        var composeView = new ComposeView({
                                model: new MailModel()
                        });
                        this.mainLayout.workRegion.add(composeView);
                },

                //----------------------------------------------------

                showMails: function showMails() {

                        if (!this.contentLayout) {
                                this.contentLayout = this.contentLayoutController.newLayout();
                        }
                        this.mainLayout.workRegion.add(this.contentLayout);
                }
        });
});
module.exports = MainLayoutController;

},{"./../../../../setup/app.js":88,"./../models/mailModel":55,"./../views/actionView/actionView":60,"./../views/composeView/composeView":62,"./../views/emptyFolderView":63,"./../views/mailMainLayout":67,"./../views/navView":69,"./../views/searchView":71,"./mailContentLayoutController":49}],52:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');

var MailRouterController = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        MailRouterController = Marionette.Controller.extend({

                compose: function compose() {
                        app.context.set("mail.action", { "type": "compose", "params": {} });
                },

                //-------------------------------------------------

                inbox: function inbox(param) {
                        app.context.set("mail.action", { "type": "inbox", "params": this.analyzeParams(param) });
                },

                //-------------------------------------------------

                sent: function sent(param) {
                        app.context.set("mail.action", { "type": "sent", "params": this.analyzeParams(param) });
                },

                //-------------------------------------------------

                draft: function draft(param) {
                        app.context.set("mail.action", { "type": "draft", "params": this.analyzeParams(param) });
                },

                //-------------------------------------------------

                trash: function trash(param) {
                        app.context.set("mail.action", { "type": "trash", "params": this.analyzeParams(param) });
                },

                //-------------------------------------------------

                spam: function spam(param) {
                        app.context.set("mail.action", { "type": "spam", "params": this.analyzeParams(param) });
                },

                //-------------------------------------------------

                search: function search(param1, param2) {
                        app.context.set("mail.action", { "type": "search", "params": this.analyzeParams(param2, param1) });
                },

                //-------------------------------------------------

                analyzeParams: function analyzeParams(id, query) {

                        var params = { page: 1, query: query };

                        if (_s.startsWith(id, "p")) {
                                var page = id.split("p")[1];

                                if (_.isFinite(page)) {
                                        params.page = page;
                                }
                        }
                        return params;
                },

                //-----------------------------------------------------------------
                // beforeRoute
                //-----------------------------------------------------------------

                beforeRoute: function beforeRoute() {

                        app.context.set("module", "mail");
                        app.context.set("mail.action", null, { silent: true });
                }
        });
});
module.exports = MailRouterController;

},{"./../../../../setup/app.js":88}],53:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var DeepModel = require('./../../../../common/js/base-models/baseModel.js');

var ContactModel = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

    ContactModel = DeepModel.extend({

        defaults: {
            title: "",
            address: ""
        },

        parse: function parse(response, options) {
            return {
                title: response.replace(",", " "),
                address: response.replace(",", ".").toLowerCase() + "@maildo.com"
            };
        }
    });
});

module.exports = ContactModel;

},{"./../../../../common/js/base-models/baseModel.js":3,"./../../../../setup/app.js":88}],54:[function(require,module,exports){
"use strict";

var AutoCompleteFilterModel = Backbone.Model.extend({

    setInput: function setInput(input) {
        this.input = _.isString(input) ? input.toLowerCase() : "";
    },

    //-----------------------------------------------------------------------

    predicate: function predicate(model) {

        return this.test(model.get("text")) || this.test(model.get("value"));
    },

    //------------------------------------------------------------------------

    test: function test(text) {

        var res = false;

        if (_.isString(text)) {

            text = text.toLowerCase();

            res = _s.startsWith(text, this.input) || _s.contains(text, " " + this.input) || _s.contains(text, ":" + this.input) || _s.contains(text, "." + this.input) || _s.contains(text, "@" + this.input);
        }
        return res;
    },

    //------------------------------------------------------------------------

    highlightKey: function highlightKey(key) {

        if (_.isString(key)) {
            return key.replace(new RegExp("^" + this.input, "gi"), function (str) {
                return "<b>" + str + "</b>";
            }).replace(new RegExp(" " + this.input, "gi"), function (str) {
                return " <b>" + _s.strRight(str, " ") + "</b>";
            }).replace(new RegExp(":" + this.input, "gi"), function (str) {
                return ":<b>" + _s.strRight(str, ":") + "</b>";
            }).replace(new RegExp("@" + this.input, "gi"), function (str) {
                return "@<b>" + _s.strRight(str, "@") + "</b>";
            }).replace(new RegExp("\\." + this.input, "gi"), function (str) {
                return ".<b>" + _s.strRight(str, ".") + "</b>";
            });
        }
        return key;
    }
});
module.exports = AutoCompleteFilterModel;

},{}],55:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var BaseModel = require('./../../../../common/js/base-models/baseModel.js');

var MailModel = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        MailModel = BaseModel.extend({

                defaults: {
                        from: "",
                        to: "",
                        cc: "",
                        bcc: "",
                        subject: "",
                        sentTime: "",
                        body: "",
                        labels: {},
                        groups: []
                },

                resource: "mail",

                initialize: function initialize(attrs, options) {

                        this.userName = app.settings.get("userName");

                        this.socket = {
                                requestName: this.resource,
                                io: app.socketController.getSocket()
                        };
                },

                //--------------------------------------------------

                url: function url() {
                        return window.location.hostname + "/" + this.resource;
                },

                //-------------------------------------------------------------
                // get addresses
                //-------------------------------------------------------------

                getIngoingAddresses: function getIngoingAddresses() {
                        return this._getAddresses("from");
                },

                //-------------------------------------------------------------

                getOutgoingAddresses: function getOutgoingAddresses() {
                        return this._getAddresses("to").concat(this._getAddresses("cc"), this._getAddresses("bcc"));
                },

                //-------------------------------------------------------------

                _getAddresses: function _getAddresses(attr) {

                        var addresses = this.get(attr).split(";");

                        if (_.isEmpty(_.last(addresses))) {
                                addresses = _.first(addresses, addresses.length - 1);
                        }
                        return addresses;
                },

                //----------------------------------------------------------------
                // add\remove address
                //----------------------------------------------------------------

                addAddress: function addAddress(attr, address) {

                        this.updateLastAddress(attr, address + ";");
                },

                //----------------------------------------------------------------

                updateLastAddress: function updateLastAddress(attr, address) {

                        var addrList = this.get(attr).split(";");
                        addrList[addrList.length - 1] = address;
                        this.set(attr, addrList.join(";"));
                },

                //----------------------------------------------------------------

                removeAddress: function removeAddress(attr, address) {

                        var addrList = this.get(attr).replace(address + ";", "");
                        this.set(attr, addrList);
                },

                //----------------------------------------------------------------
                // validate
                //----------------------------------------------------------------

                validate: function validate(attrs, options) {

                        options = options || {};

                        if (options.saveAs !== "draft") {

                                var outgoingAddresses = this.getOutgoingAddresses();
                                if (_.isEmpty(outgoingAddresses)) {
                                        return MailModel.Errors.NoRecipient;
                                }

                                var to = this._getAddresses("to");
                                for (var i = 0; i < to.length; i++) {
                                        if (!this.validateAddress(to[i])) {
                                                return MailModel.Errors.InvalidToAddress;
                                        }
                                }

                                var cc = this._getAddresses("cc");
                                for (i = 0; i < cc.length; i++) {
                                        if (!this.validateAddress(cc[i])) {
                                                return MailModel.Errors.InvalidCcAddress;
                                        }
                                }
                        }
                },

                //-------------------------------------------------------------

                validateAddress: function validateAddress(address) {

                        var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
                        return reg.test(address);
                },

                //----------------------------------------------------------------
                // markAs
                //----------------------------------------------------------------

                markAs: function markAs(label) {

                        var oppositeLabel = this._getOpositeLabel(label);

                        this._removeLabel(oppositeLabel);
                        this._addLabel(label);
                },

                //----------------------------------------------------------------

                _getOpositeLabel: function _getOpositeLabel(label) {

                        if (_s.startsWith(label, "un")) {
                                return _s.strRight(label, "un");
                        }
                        return "un" + label;
                },

                //----------------------------------------------------------------

                _addLabel: function _addLabel(label) {

                        if (!this.get("labels." + label)) {
                                this.set("labels." + label, true);
                        }
                },

                //----------------------------------------------------------------

                _removeLabel: function _removeLabel(labelName) {

                        var labels = this.get("labels");

                        if (_.has(labels, labelName)) {
                                delete labels[labelName];
                        }
                },

                //----------------------------------------------------------------
                // moveTo
                //----------------------------------------------------------------

                moveTo: function moveTo(dest) {

                        var groups = this.get("groups");

                        if (_.contains(groups, "trash") || _.contains(groups, "spam") || dest === "trash" || dest === "spam") {
                                groups = [];
                        }

                        groups.push(dest);
                        this.set("groups", groups);
                }
        });

        //----------------------------------------------------------------

        MailModel.Errors = {

                NoRecipient: 1,
                InvalidToAddress: 2,
                InvalidCcAddress: 3
        };
});
module.exports = MailModel;

},{"./../../../../common/js/base-models/baseModel.js":3,"./../../../../setup/app.js":88}],56:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var MailRouter = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        MailRouter = Marionette.AppRouter.extend({

                appRoutes: {
                        "": "inbox",
                        "inbox": "inbox",
                        "inbox/:param": "inbox",
                        "draft": "draft",
                        "draft/:param": "draft",
                        "sent": "sent",
                        "sent/:param": "sent",
                        "trash": "trash",
                        "trash/:param": "trash",
                        "spam": "spam",
                        "spam/:param": "spam",
                        "search/:param1": "search",
                        "search/:param1/:param2": "search",
                        "compose": "compose"
                },

                //---------------------------------------------

                initialize: function initialize(options) {
                        this.controller = options.controller;
                },

                //---------------------------------------------

                route: function route(_route, name, callback) {
                        return Backbone.Router.prototype.route.call(this, _route, name, function () {
                                this.controller.beforeRoute();
                                callback.apply(this, arguments);
                        });
                },

                //---------------------------------------------

                previous: function previous() {
                        mail.router.navigate("inbox", { trigger: true });
                },

                //----------------------------------------------

                fixUrl: function fixUrl(options) {}
        });
});

module.exports = MailRouter;

},{"./../../../../setup/app.js":88}],57:[function(require,module,exports){
"use strict";
require('./../../../../../common/js/plugins/toggle.block');

var app = require('./../../../../../setup/app.js');
var template = require('./../../../ui/templates/moreActionsView.hbs');

var MoreActionsView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {
    MoreActionsView = Marionette.ItemView.extend({

        template: template,
        className: "actionOptionsView",

        ui: {
            ddiStarred: ".addStar",
            ddiNotStarred: ".removeStar",
            ddiImp: ".markImp",
            ddiNotImp: ".markNotImp",
            ddiRead: ".markRead",
            ddiUnread: ".markUnread"
        },

        events: {
            "click @ui.ddiRead": function clickUiDdiRead() {
                mail.channel.vent.trigger("mail:markAs", { label: "read" });
            },
            "click @ui.ddiUnread": function clickUiDdiUnread() {
                mail.channel.vent.trigger("mail:markAs", { label: "unread" });
            },
            "click @ui.ddiImp": function clickUiDdiImp() {
                mail.channel.vent.trigger("mail:markAs", { label: "important" });
            },
            "click @ui.ddiNotImp": function clickUiDdiNotImp() {
                mail.channel.vent.trigger("mail:markAs", { label: "unimportant" });
            },
            "click @ui.ddiStarred": function clickUiDdiStarred() {
                mail.channel.vent.trigger("mail:markAs", { label: "starred" });
            },
            "click @ui.ddiNotStarred": function clickUiDdiNotStarred() {
                mail.channel.vent.trigger("mail:markAs", { label: "unstarred" });
            }
        },

        //-----------------------------------------------------------

        initialize: function initialize(options) {

            this.mails = mail.channel.reqres.request("mail:collection");
            this._bindEvents();
        },

        //-----------------------------------------------------------

        _bindEvents: function _bindEvents() {
            this.listenTo(this.mails, "change:items update:success change:selection", this.setDropDownItems, this);
        },

        //------------------------------------------------------------

        setDropDownItems: function setDropDownItems() {

            var items = this.itemsToShow();

            this.ui.ddiStarred.toggleBlock(items.stared);
            this.ui.ddiNotStarred.toggleBlock(items["not-stared"]);
            this.ui.ddiImp.toggleBlock(items.important);
            this.ui.ddiNotImp.toggleBlock(items["not-important"]);
            this.ui.ddiRead.toggleBlock(items.read);
            this.ui.ddiUnread.toggleBlock(items.unread);
        },

        //------------------------------------------------------------

        itemsToShow: function itemsToShow() {

            var that = this,
                items = {};

            _.each(this.mails.getSelected(), function (item) {

                var model = that.mails.get(item);
                if (model) {
                    var labels = model.get("labels");
                    that.updateItemToShow(labels, items);
                }
            });
            return items;
        },

        //-----------------------------------------------------------

        updateItemToShow: function updateItemToShow(labels, items) {

            if (_.has(labels, "starred")) {
                items["not-stared"] = true;
            } else {
                items.stared = true;
            }
            if (_.has(labels, "important")) {
                items["not-important"] = true;
            } else {
                items.important = true;
            }
            if (_.has(labels, "read")) {
                items.unread = true;
            } else {
                items.read = true;
            }
        }
    });
});

module.exports = MoreActionsView;

},{"./../../../../../common/js/plugins/toggle.block":11,"./../../../../../setup/app.js":88,"./../../../ui/templates/moreActionsView.hbs":82}],58:[function(require,module,exports){
"use strict";

var app = require('./../../../../../setup/app.js');
var template = require('./../../../ui/templates/moveToView.hbs');

require('./../../../../../common/js/plugins/toggle.block');

var MoreView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {
    MoreView = Marionette.ItemView.extend({

        template: template,
        className: "moveToView",

        ui: {
            ddiInbox: ".moveToInbox",
            ddiTrash: ".moveToTrash",
            ddiSpam: ".moveToSpam"
        },

        events: {
            "click @ui.ddiInbox": function clickUiDdiInbox() {
                mail.channel.vent.trigger("mail:moveTo", { target: "inbox" });
            },
            "click @ui.ddiTrash": function clickUiDdiTrash() {
                mail.channel.vent.trigger("mail:moveTo", { target: "trash" });
            },
            "click @ui.ddiSpam": function clickUiDdiSpam() {
                mail.channel.vent.trigger("mail:moveTo", { target: "spam" });
            }
        },

        //-----------------------------------------------------------

        initialize: function initialize() {

            this.listenTo(app.context, "change:mail.action", this.showRelevantItems, this);
        },

        //-----------------------------------------------------------

        showRelevantItems: function showRelevantItems() {

            this.currAction = app.context.get("mail.action.type");

            this.ui.ddiInbox.toggleBlock(!_.contains(["inbox"], this.currAction));
            this.ui.ddiSpam.toggleBlock(_.contains(["inbox", "trash"], this.currAction));
            this.ui.ddiTrash.toggleBlock(_.contains(["spam", "inbox"], this.currAction));
        }
    });
});

module.exports = MoreView;

},{"./../../../../../common/js/plugins/toggle.block":11,"./../../../../../setup/app.js":88,"./../../../ui/templates/moveToView.hbs":83}],59:[function(require,module,exports){
"use strict";

var app = require('./../../../../../setup/app.js');
var template = require('./../../../ui/templates/pagerView.hbs');

var PagerView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {
        PagerView = Marionette.ItemView.extend({

                template: template,
                className: "pageInfoView",
                pageInfo: {},

                ui: {
                        container: ".pagerInnerContainer",
                        btnNewer: ".btnNewer",
                        btnOlder: ".btnOlder",
                        lblTotal: ".total",
                        lblFrom: ".lblForm",
                        lblTo: ".lblTo"
                },

                events: {
                        "click @ui.btnNewer": "showNewerItems",
                        "click @ui.btnOlder": "showOlderItems"
                },

                initialize: function initialize() {

                        this.mails = mail.channel.reqres.request("mail:collection");
                        this._bindEvents();
                },

                //---------------------------------------------------

                _bindEvents: function _bindEvents() {
                        this.listenTo(this.mails, "change:metadata", this.adjustPage, this);
                },

                //----------------------------------------------------

                onRender: function onRender() {
                        this.adjustPage();
                },

                //----------------------------------------------------
                // adjustPage
                //----------------------------------------------------

                adjustPage: function adjustPage() {

                        if (_.isObject(this.mails.metadata) && this.mails.metadata.total > 0) {

                                this.updatePageInfo();
                                this.adjustButtons();
                                this.adjustLabels();
                                this.ui.container.show();
                        } else {
                                this.ui.container.hide();
                        }
                },

                //----------------------------------------------------

                updatePageInfo: function updatePageInfo() {

                        var metadata = this.mails.metadata;

                        this.pageInfo.total = metadata.total;
                        this.pageInfo.currPage = metadata.currPage + 1;
                        this.pageInfo.from = metadata.from + 1;
                        this.pageInfo.to = Math.min(metadata.total, metadata.to + 1);
                },

                //----------------------------------------------------

                adjustButtons: function adjustButtons() {

                        this.ui.btnNewer.toggleClass("disable", this.pageInfo.from === 1);
                        this.ui.btnOlder.toggleClass("disable", this.pageInfo.to >= this.pageInfo.total);
                },

                //----------------------------------------------------

                adjustLabels: function adjustLabels() {

                        this.ui.lblFrom.text(this.pageInfo.from);
                        this.ui.lblTo.text(Math.min(this.pageInfo.to, this.pageInfo.total));
                        this.ui.lblTotal.text(this.pageInfo.total);
                },

                //----------------------------------------------------
                // buttons click
                //----------------------------------------------------

                showNewerItems: function showNewerItems() {

                        if (this.pageInfo.from > 1) {
                                this.navigate(this.pageInfo.currPage - 1);
                        }
                },

                //----------------------------------------------------

                showOlderItems: function showOlderItems() {

                        if (this.pageInfo.to < this.pageInfo.total) {
                                this.navigate(this.pageInfo.currPage + 1);
                        }
                },

                //----------------------------------------------------

                navigate: function navigate(page) {

                        var action = app.context.get("mail.action");
                        var search = action.params.query ? "/" + action.params.query : "";
                        mail.router.navigate(action.type + search + "/p" + page.toString(), { trigger: true });
                }
        });
});

module.exports = PagerView;

},{"./../../../../../setup/app.js":88,"./../../../ui/templates/pagerView.hbs":85}],60:[function(require,module,exports){
"use strict";

var app = require('./../../../../../setup/app.js');
var PagerView = require("./_pagerView");
var MoveToView = require("./_moveToView");
var MoreActionsView = require("./_moreActionsView");
var template = require('./../../../ui/templates/actionView.hbs');

var ActionView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {
    ActionView = Marionette.ItemView.extend({
        template: template,
        className: "actionView",

        ui: {
            btnSelect: ".btnSelect",
            btnMoveTo: ".btnMoveTo",
            btnDelete: ".btnDelete",
            btnMore: ".btnMore",
            pagerRegion: ".pager",
            serverActionsRegion: ".serverActions",
            lblCompose: ".lblCompose",
            btnDiscardDrafts: ".btnDiscardDrafts",
            btnDeleteForever: ".btnDeleteForever",
            btnNotSpam: ".btnNotSpam"
        },

        events: {
            "click .selectAll": function clickSelectAll() {
                mail.channel.vent.trigger("mail:select", { selectBy: "all" });
            },
            "click .selectNone": function clickSelectNone() {
                mail.channel.vent.trigger("mail:select", { selectBy: "none" });
            },
            "click .selectRead": function clickSelectRead() {
                mail.channel.vent.trigger("mail:select", { selectBy: "read" });
            },
            "click .selectUnread": function clickSelectUnread() {
                mail.channel.vent.trigger("mail:select", { selectBy: "unread" });
            },
            "click @ui.btnDelete": function clickUiBtnDelete() {
                mail.channel.vent.trigger("mail:moveTo", { target: "trash" });
            },
            "click @ui.btnNotSpam": function clickUiBtnNotSpam() {
                mail.channel.vent.trigger("mail:moveTo", { target: "inbox" });
            },
            "click @ui.btnDiscardDrafts": function clickUiBtnDiscardDrafts() {
                mail.channel.vent.trigger("mail:delete");
            },
            "click @ui.btnDeleteForever": function clickUiBtnDeleteForever() {
                mail.channel.vent.trigger("mail:delete");
            }
        },

        //-----------------------------------------------------------

        initialize: function initialize(options) {

            this.mails = mail.channel.reqres.request("mail:collection");
            this._bindEvents();
        },

        //-----------------------------------------------------

        _bindEvents: function _bindEvents() {

            this.listenTo(mail.channel.vent, "mail:change", this.onMailChange, this);
            this.listenTo(this.mails, "change:selection", this.showRelevantItems, this);
            this.listenTo(app.context, "change:mail.action", this.showRelevantItems, this);
        },

        //------------------------------------------------------

        templateHelpers: function templateHelpers() {

            return {
                action: _s.capitalize(app.context.get("mail.action.type"))
            };
        },

        //------------------------------------------------------

        onRender: function onRender() {

            this.pagerView = new PagerView({
                el: this.ui.pagerRegion
            });
            this.pagerView.render();

            this.moreActionsView = new MoreActionsView({
                el: this.ui.btnMore
            });
            this.moreActionsView.render();

            this.moveToView = new MoveToView({
                el: this.ui.btnMoveTo
            });
            this.moveToView.render();
        },

        //------------------------------------------------------
        // showRelevantItems
        //------------------------------------------------------

        showRelevantItems: function showRelevantItems() {

            var action = app.context.get("mail.action.type");

            this.resetUI();

            switch (action) {
                case "compose":
                    this.showItems(["lblCompose"]);
                    break;
                default:
                    this.showListOptions(action);
                    break;
            }
        },

        //-------------------------------------------------------

        resetUI: function resetUI() {

            this.showItems(_.keys(this.ui), false);
            this.ui.lblCompose.text(app.translator.translate("mail:newMessage"));
        },

        //---------------------------------------------------------

        showListOptions: function showListOptions(action) {

            this.showItems(["btnSelect", "pagerRegion"]);

            if (!_.isEmpty(this.mails.getSelected())) {

                switch (action) {
                    case "draft":
                        this.showItems(["btnSelect", "btnDiscardDrafts", "btnMore"]);
                        break;
                    case "spam":
                        this.showItems(["btnSelect", "btnNotSpam", "btnDeleteForever", "btnMore"]);
                        break;
                    case "trash":
                        this.showItems(["btnSelect", "btnDeleteForever", "btnMoveTo", "btnMore"]);
                        break;
                    default:
                        this.showItems(["btnSelect", "btnDelete", "btnMoveTo", "btnMore"]);
                        break;
                }
            }
        },

        //------------------------------------------------------

        showItems: function showItems(items, show) {

            show = _.isBoolean(show) ? show : true;

            _.each(items, _.bind(function (item) {
                this.ui[item].toggle(show);
            }, this));
        },

        //---------------------------------------------------------
        // onMailChange
        //---------------------------------------------------------

        onMailChange: function onMailChange(mailModel) {

            var subject = mailModel.get("subject");

            if (_.isEmpty(subject)) {
                subject = app.translator.translate("mail:newMessage");
            }
            this.ui.lblCompose.text(subject);
        }
    });
});

module.exports = ActionView;

},{"./../../../../../setup/app.js":88,"./../../../ui/templates/actionView.hbs":74,"./_moreActionsView":57,"./_moveToView":58,"./_pagerView":59}],61:[function(require,module,exports){
"use strict";

var app = require('./../../../../../setup/app.js');
var Tags = require('./../../../../../common/ui/components/tags/tags.js');
var AutoComplete = require('./../../../../../common/ui/components/autoComplete/autoComplete.js');
var template = require('./../../../ui/templates/_addressView.hbs');
var ContactsFilterModel = require('./../../models/contactsFilterModel');

var AddressView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {
        AddressView = Marionette.ItemView.extend({

                className: "addressView",
                template: template,

                ui: {
                        tagsPlaceholder: ".tagsPlaceholder",
                        autoCompletePlaceholder: ".autoCompletePlaceholder"
                },

                //----------------------------------------------------------------
                // initialize
                //----------------------------------------------------------------

                initialize: function initialize(options) {

                        this.modelAttr = options.modelAttr;
                        this.vent = new Backbone.Wreqr.EventAggregator();
                        this.contacts = mail.channel.reqres.request("contact:collection");

                        this._bindEvents();
                },

                //--------------------------------------------------------

                _bindEvents: function _bindEvents() {

                        this.listenTo(this.vent, "tag:add", this.addAddress, this);
                        this.listenTo(this.vent, "tag:remove", this.removeAddress, this);
                        this.listenTo(this.vent, "input:change", this.updateLastAddress, this);
                        this.listenTo(this.contacts, "fetch:success", this.renderAutoComponent, this);
                },

                //----------------------------------------------------------------
                // onRender
                //----------------------------------------------------------------

                onRender: function onRender() {

                        this.renderTagComponent();
                        this.renderAutoComponent();
                },

                //----------------------------------------------------------------

                renderTagComponent: function renderTagComponent() {

                        this.tags = new Tags({
                                el: this.ui.tagsPlaceholder,
                                vent: this.vent,
                                validator: this.model.validateAddress,
                                initialTags: this.getAddresses()
                        });
                        this.tags.show();
                },

                //----------------------------------------------------------------

                renderAutoComponent: function renderAutoComponent() {

                        if (!this.autoComplete && !this.contacts.isEmpty()) {

                                this.autoComplete = new AutoComplete({
                                        vent: this.vent,
                                        items: this.getContactArray(),
                                        el: this.ui.autoCompletePlaceholder,
                                        filterModel: new ContactsFilterModel()
                                });
                                this.autoComplete.show();
                        }
                },

                //-----------------------------------------------------------------

                getContactArray: function getContactArray() {

                        var _contacts = [];

                        this.contacts.each(function (model) {
                                _contacts.push({
                                        text: model.get("title"),
                                        value: model.get("address"),
                                        type: AutoComplete.TYPES.CONTACT
                                });
                        });
                        return _contacts;
                },

                //-----------------------------------------------------------------

                getAddresses: function getAddresses() {

                        var res = [],
                            addresses = this.model.get(this.modelAttr);

                        if (!_.isEmpty(addresses)) {
                                var addressArr = _s.strLeftBack(addresses, ";").split(";");

                                _.each(addressArr, function (address) {
                                        res.push({
                                                text: mail.dataController.contactCollection.getTitles([address]),
                                                value: address
                                        });
                                });
                        }
                        return res;
                },

                //-----------------------------------------------------------------

                addAddress: function addAddress(address) {
                        this.model.addAddress(this.modelAttr, address);
                },

                //-----------------------------------------------------------------

                updateLastAddress: function updateLastAddress(address) {
                        this.model.updateLastAddress(this.modelAttr, address);
                },

                //-----------------------------------------------------------------

                removeAddress: function removeAddress(address) {
                        this.model.removeAddress(this.modelAttr, address);
                }
        });
});

module.exports = AddressView;

},{"./../../../../../common/ui/components/autoComplete/autoComplete.js":18,"./../../../../../common/ui/components/tags/tags.js":34,"./../../../../../setup/app.js":88,"./../../../ui/templates/_addressView.hbs":73,"./../../models/contactsFilterModel":54}],62:[function(require,module,exports){
"use strict";

var app = require('./../../../../../setup/app.js');
var AddressView = require("./_addressView");
var MailModel = require('./../../models/mailModel');
var template = require('./../../../ui/templates/composeView.hbs');

var ComposeView = {};

app.module("mail", function (mail, mb, Backbone, Marionette, $, _) {
        ComposeView = Marionette.ItemView.extend({
                template: template,
                className: "composeView",

                ui: {
                        toInputWrapper: ".toInputWrapper",
                        ccInputWrapper: ".ccInputWrapper",
                        inputSubject: ".subject",
                        inputEditor: ".compose-editor",
                        header: ".compose-header",
                        ccLine: ".ccLine",
                        sendBtn: ".sendBtn",
                        closeBtn: ".closeBtn"
                },

                events: {
                        "click  @ui.closeBtn": "onCloseBtnClick",
                        "click  @ui.sendBtn": "onSendClick",
                        "blur   @ui.inputSubject": "onSubjectBlur",
                        "blur   @ui.inputEditor": "onEditorBlur",
                        "click  @ui.toInputWrapper": "onToInputWrapperClick",
                        "click  @ui.ccInputWrapper": "onCcInputWrapperClick"
                },

                modelEvents: {
                        change: "onModelChange"
                },

                //------------------------------------------------------

                initialize: function initialize(options) {

                        this.contacts = options.contacts;
                },

                //------------------------------------------------------
                // onRender
                //------------------------------------------------------

                onRender: function onRender() {

                        this.renderToView();
                        this.renderCcView();
                        this.ui.inputEditor.html(this.model.get("body"));
                },

                //-------------------------------------------------------

                renderToView: function renderToView() {

                        this.toView = new AddressView({
                                model: this.model,
                                modelAttr: "to",
                                el: this.ui.toInputWrapper
                        });
                        this.toView.render();
                },

                //-------------------------------------------------------

                renderCcView: function renderCcView() {

                        this.ccView = new AddressView({
                                model: this.model,
                                modelAttr: "cc",
                                el: this.ui.ccInputWrapper
                        });
                        this.ccView.render();
                },

                //-------------------------------------------------------
                // events handlers
                //-------------------------------------------------------

                onSubjectBlur: function onSubjectBlur() {
                        this.model.set("subject", this.ui.inputSubject.val());
                },

                //-------------------------------------------------------

                onEditorBlur: function onEditorBlur() {
                        this.model.set("body", this.ui.inputEditor.html());
                },

                //-------------------------------------------------------

                onSendClick: function onSendClick() {
                        mail.channel.vent.trigger("mail:send", this.model);
                },

                //-------------------------------------------------------

                onCloseBtnClick: function onCloseBtnClick() {
                        mail.channel.vent.trigger("mail:discard", this.model);
                },

                //-------------------------------------------------------

                onToInputWrapperClick: function onToInputWrapperClick() {
                        this.ui.toInputWrapper.removeClass("error");
                },

                //-------------------------------------------------------

                onCcInputWrapperClick: function onCcInputWrapperClick() {
                        this.ui.ccInputWrapper.removeClass("error");
                },

                //-------------------------------------------------------

                onModelChange: function onModelChange() {
                        mail.channel.vent.trigger("mail:change", this.model);
                },

                //-------------------------------------------------------

                onInvalid: function onInvalid(model, error) {

                        switch (error) {
                                case MailModel.Errors.NoRecipient:case MailModel.Errors.InvalidToAddress:
                                        this.ui.toInputWrapper.addClass("error");
                                        break;
                                case MailModel.Errors.InvalidCcAddress:
                                        this.ui.ccInputWrapper.addClass("error");
                                        break;
                        }
                }
        });
});

module.exports = ComposeView;

},{"./../../../../../setup/app.js":88,"./../../../ui/templates/composeView.hbs":75,"./../../models/mailModel":55,"./_addressView":61}],63:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var template = require('./../../ui/templates/emptyFolderView.hbs');

var EmptyFolderView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        EmptyFolderView = Marionette.ItemView.extend({
                template: template,
                isPermanent: true,
                className: "empty-folder",

                ui: {
                        "msgTitle": ".msgTitle"
                },

                //--------------------------------------------------

                initialize: function initialize() {

                        this.mails = mail.channel.reqres.request("mail:collection");
                        this._bindEvents();
                },

                //--------------------------------------------------

                _bindEvents: function _bindEvents() {

                        this.listenTo(this.mails, "change:items update:success delete:success fetch:success", this._checkIfEmpty, this);
                },

                //--------------------------------------------------

                _checkIfEmpty: function _checkIfEmpty() {

                        var isEmpty = this.mails.isEmpty();

                        if (isEmpty) {
                                var action = app.context.get("mail.action");
                                this.ui.msgTitle.html(app.translator.translate("mail:emptyFolder." + action.type));
                        }
                        this.$el.toggle(isEmpty);
                }
        });
});

module.exports = EmptyFolderView;

},{"./../../../../setup/app.js":88,"./../../ui/templates/emptyFolderView.hbs":77}],64:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var template = require('./../../ui/templates/emptyMailView.hbs');

var EmptyMailView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        EmptyMailView = Marionette.ItemView.extend({
                template: template,
                isPermanent: true,

                ui: {
                        counter: ".counter",
                        message: ".message"
                },

                initialize: function initialize() {

                        this.mails = mail.channel.reqres.request("mail:collection");
                        this._bindEvents();
                },

                //-------------------------------------------------------------

                _bindEvents: function _bindEvents() {
                        this.listenTo(this.mails, "change:selection", this.onSelectionChange, this);
                },

                //--------------------------------------------------------------

                onSelectionChange: function onSelectionChange() {

                        var selected = this.mails.getSelected().length;

                        this.ui.counter.html(selected);
                        this.ui.counter.toggle(selected > 0);
                        this.ui.message.toggle(selected === 0);
                }
        });
});

module.exports = EmptyMailView;

},{"./../../../../setup/app.js":88,"./../../ui/templates/emptyMailView.hbs":78}],65:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var layoutTemplate = require('./../../ui/templates/contentLayout.hbs');

var ContentLayout = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

    ContentLayout = Marionette.LayoutView.extend({
        template: layoutTemplate,
        isPermanent: true,
        regions: {
            itemsRegion: ".mail-items-region",
            previewRegion: ".mail-preview-region",
            messageBoard: ".mail-message-board-region"
        }
    });
});

module.exports = ContentLayout;

},{"./../../../../setup/app.js":88,"./../../ui/templates/contentLayout.hbs":76}],66:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var formatter = require('./../../../../common/js/resolvers/formatter');
var template = require('./../../ui/templates/mailItemView.hbs');

var MailTableRowView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        MailTableRowView = Marionette.ItemView.extend({
                template: template,
                tagName: "tr",
                className: "inbox_row",

                ui: {
                        checkBox: ".chkBox",
                        selector: ".selector",
                        starIcon: ".star-icon",
                        impIcon: ".importance-icon",
                        address: ".address",
                        subject: ".subject",
                        body: ".body",
                        sentTime: ".sentTime"
                },

                triggers: {
                        "click .star": "click",
                        "click .importance": "click",
                        "click .address": "click",
                        "click .content": "click",
                        "click .sentTime": "click"
                },

                events: {
                        "click .selector": "onRowSelect"
                },

                modelEvents: {
                        "change:subject": "_onSubjectChanged",
                        "change:body": "_onBodyChanged"
                },

                initialize: function initialize() {

                        this.action = app.context.get("mail.action.type");
                        this.contacts = mail.channel.reqres.request("contact:collection");

                        this._bindEvents();
                },

                //-----------------------------------------------------

                _bindEvents: function _bindEvents() {
                        this.listenTo(this.model, "change:labels.*", this.toggleUI);
                },

                //-------------------------------------------------------------
                // templateHelpers
                //-------------------------------------------------------------

                templateHelpers: function templateHelpers() {

                        return {
                                isInbox: this.action === "inbox",
                                isSent: this.action === "sent",
                                isDraft: this.action === "draft",
                                isTrash: this.action === "trash",
                                isSpam: this.action === "spam",
                                isSearch: this.action === "search",

                                body: formatter.formatContent(this.model.get("body")),
                                subject: formatter.formatSubject(this.model.get("subject"), app.translator),
                                sentTime: formatter.formatShortDate(this.model.get("sentTime"), app.translator),
                                to: formatter.formatAddresses(this.contacts.getTitles(this.model.getOutgoingAddresses())),
                                from: formatter.formatAddresses(this.contacts.getTitles(this.model.getIngoingAddresses()))
                        };
                },

                //-------------------------------------------------------------
                // onRender
                //-------------------------------------------------------------

                onRender: function onRender() {

                        this.toggleUI();
                        this.setSelection();
                },

                //-------------------------------------------------------------

                toggleUI: function toggleUI() {

                        var labels = this.model.get("labels");

                        this.ui.sentTime.toggleClass("unread", !_.has(labels, "read"));
                        this.ui.address.toggleClass("unread", !_.has(labels, "read"));
                        this.ui.subject.toggleClass("unread", !_.has(labels, "read"));
                        this.ui.starIcon.toggleClass("disable", !_.has(labels, "starred"));
                        this.ui.impIcon.toggleClass("disable", !_.has(labels, "important"));
                },

                //------------------------------------------------

                setSelection: function setSelection() {

                        var selected = this.model.collection.isSelected(this.model);

                        this.$el.toggleClass("selected", selected);
                        this.ui.checkBox.prop("checked", selected);
                },

                //-------------------------------------------------------------
                // dataChanged
                //-------------------------------------------------------------

                _onSubjectChanged: function _onSubjectChanged() {

                        this.ui.subject.text(formatter.formatSubject(this.model.get("subject")), app.translator);
                },

                //-------------------------------------------------------------

                _onBodyChanged: function _onBodyChanged() {

                        this.ui.body.text(formatter.formatContent(this.model.get("body")));
                },

                //-------------------------------------------------------------
                // rowEvents
                //-------------------------------------------------------------

                onRowSelect: function onRowSelect() {

                        mail.channel.vent.trigger("mailTable:ItemClicked", null);
                        this.model.collection.toggleSelection(this.model, { callerName: "itemView" });
                },

                //-------------------------------------------------------------

                markAsClicked: function markAsClicked(clicked) {

                        this.$el.toggleClass("clickedRow", clicked);
                }
        });
});
module.exports = MailTableRowView;

},{"./../../../../common/js/resolvers/formatter":13,"./../../../../setup/app.js":88,"./../../ui/templates/mailItemView.hbs":79}],67:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var layoutTemplate = require('./../../ui/templates/mainLayout.hbs');

var MailLayout = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

    MailLayout = Marionette.LayoutView.extend({
        template: layoutTemplate,
        isPermanent: true,
        regions: {
            navRegion: ".mail-nav-region",
            workRegion: ".mail-work-region"
        }
    });
});

module.exports = MailLayout;

},{"./../../../../setup/app.js":88,"./../../ui/templates/mainLayout.hbs":81}],68:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var template = require('./../../ui/templates/mailsView.hbs');
var MailableRowView = require('./mailItemView');

var MailTableView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

    MailTableView = Marionette.CompositeView.extend({
        name: "mailTable",
        template: template,
        childView: MailableRowView,
        childViewContainer: "tbody",

        initialize: function initialize() {

            this.listenTo(this, "childview:click", this._handleChildClick);
            this.listenTo(this.collection, "change:selection", this.onSelectionChange, this);
        },

        //-------------------------------------------------------
        // onSelectionChange
        //-------------------------------------------------------

        onSelectionChange: function onSelectionChange(options) {

            options = options || {};

            if (options.callerName !== "itemView") {
                this.children.each(_.bind(function (view) {
                    view.setSelection();
                    view.markAsClicked(this.collection.getSelected().length === 0 && view === this.clickedItem);
                }, this));
            }
        },

        //-------------------------------------------------------

        _handleChildClick: function _handleChildClick(_itemView) {

            this.children.each(function (itemView) {
                itemView.markAsClicked(false);
            });

            if (_itemView) {
                this.clickedItem = _itemView;
                this.clickedItem.markAsClicked(true);
                mail.channel.vent.trigger("mailTable:ItemClicked", this.clickedItem.model);
            }
        }
    });
});
module.exports = MailTableView;

},{"./../../../../setup/app.js":88,"./../../ui/templates/mailsView.hbs":80,"./mailItemView":66}],69:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var template = require('./../../ui/templates/navView.hbs');

var NavView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        NavView = Marionette.ItemView.extend({
                template: template,

                //-----------------------------------------------

                initialize: function initialize() {
                        this.listenTo(app.context, "change:mail.action", this.onActionChange, this);
                },

                //-----------------------------------------------

                onActionChange: function onActionChange() {

                        this.$el.find("li").removeClass("selected");
                        var action = app.context.get("mail.action.type");
                        this.$el.find(".nav-" + action).addClass("selected");
                }
        });
});

module.exports = NavView;

},{"./../../../../setup/app.js":88,"./../../ui/templates/navView.hbs":84}],70:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var formatter = require('./../../../../common/js/resolvers/formatter');
var template = require('./../../ui/templates/previewView.hbs');

var PreviewView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

    PreviewView = Marionette.ItemView.extend({
        template: template,

        ui: {
            subject: ".subject",
            to: ".to",
            from: ".from",
            body: ".body"
        },

        initialize: function initialize() {

            this.contacts = mail.channel.reqres.request("contact:collection");
        },

        //-------------------------------------------------------------

        templateHelpers: function templateHelpers() {

            return {
                subject: formatter.formatSubject(this.model.get("subject"), app.translator),
                to: formatter.formatAddresses(this.contacts.getTitles(this.model.getOutgoingAddresses())),
                from: formatter.formatAddresses(this.contacts.getTitles(this.model.getIngoingAddresses()))
            };
        },

        //-----------------------------------------------------------

        onRender: function onRender() {

            if (this.model.has("relatedBody")) {} else {
                this.ui.body.html(this.model.get("body"));
            }
        }
    });
});

module.exports = PreviewView;

//require(["onDemandLoader!text!app/assets/data/" + this.model.get("relatedBody") + ".txt"], _.bind(function (text) {
//    this.ui.body.html(text);
//}, this));

},{"./../../../../common/js/resolvers/formatter":13,"./../../../../setup/app.js":88,"./../../ui/templates/previewView.hbs":86}],71:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var template = require('./../../ui/templates/searchView.hbs');
var ContactsFilterModel = require('./../models/contactsFilterModel');
var AutoComplete = require('./../../../../common/ui/components/autoComplete/autoComplete');
var SearchComponent = require('./../../../../common/ui/components/search/search');

var SearchView = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        SearchView = Marionette.ItemView.extend({
                template: template,
                className: "searchPanel",

                ui: {
                        searchPlaceholder: ".search-placeholder",
                        autoCompletePlaceholder: ".autoCompletePlaceholder"
                },

                //---------------------------------------------------------

                initialize: function initialize() {

                        this.vent = new Backbone.Wreqr.EventAggregator();
                        this.contacts = mail.channel.reqres.request("contact:collection");

                        this._bindEvents();
                },

                //--------------------------------------------------------

                _bindEvents: function _bindEvents() {

                        this.listenTo(this.vent, "search", this.search, this);
                        this.listenTo(app.context, "change:mail.action", this.onActionChange, this);
                        this.listenTo(this.contacts, "fetch:success", this.renderAutoComponent, this);
                },

                //---------------------------------------------------------
                // onRender
                //---------------------------------------------------------

                onRender: function onRender() {

                        this.renderSearchComponent();
                        this.renderAutoComponent();
                },

                //---------------------------------------------------------

                renderSearchComponent: function renderSearchComponent() {

                        this.searchComponent = new SearchComponent({
                                el: this.ui.searchPlaceholder,
                                vent: this.vent,
                                caption: app.translator.translate("mail:search.caption")
                        });
                        this.searchComponent.render();
                },

                //---------------------------------------------------------

                renderAutoComponent: function renderAutoComponent() {

                        if (!this.autoComplete && !this.contacts.isEmpty()) {

                                this.autoComplete = new AutoComplete({
                                        items: this.getContactArray(),
                                        el: this.ui.autoCompletePlaceholder,
                                        filterModel: new ContactsFilterModel(),
                                        vent: this.vent
                                });
                                this.autoComplete.show();
                        }
                },

                //---------------------------------------------------------

                getContactArray: function getContactArray() {

                        var _contacts = [];

                        this.contacts.each(function (model) {
                                _contacts.push({
                                        text: model.get("title"),
                                        value: model.get("address"),
                                        type: AutoComplete.TYPES.CONTACT
                                });
                        });
                        return _contacts;
                },

                //---------------------------------------------------------
                // search
                //---------------------------------------------------------

                search: function search(key) {

                        if (!_.isEmpty(key)) {
                                mail.router.navigate("search/" + key, { trigger: true });
                        }
                },

                //----------------------------------------------------
                // onActionChange
                //----------------------------------------------------

                onActionChange: function onActionChange() {

                        var action = app.context.get("mail.action.type");

                        if (action != "search") {
                                if (this.searchComponent) {
                                        this.searchComponent.clear();
                                }
                        }
                }
        });
});

module.exports = SearchView;

},{"./../../../../common/ui/components/autoComplete/autoComplete":18,"./../../../../common/ui/components/search/search":28,"./../../../../setup/app.js":88,"./../../ui/templates/searchView.hbs":87,"./../models/contactsFilterModel":54}],72:[function(require,module,exports){
"use strict";

var app = require('./../../setup/app.js');

app.module("mail", function (mail, App, Backbone, Marionette, $, _) {

    var Router = require('./js/routers/mailRouter');
    var MainLayoutController = require('./js/controllers/mailMainLayoutController');
    var DataController = require('./js/controllers/mailDataController');
    var ActionsController = require('./js/controllers/mailActionsController');
    var RouterController = require('./js/controllers/mailRouterController');

    //------------------------------------------
    // init
    //------------------------------------------

    this.addInitializer(function (options) {

        this.channel = Backbone.Wreqr.radio.channel("mail");
        this.dataController = new DataController();
        this.actionsController = new ActionsController();
        this.mainLayoutController = new MainLayoutController(options);
        this.router = new Router({ controller: new RouterController() });
    });

    //------------------------------------------
    // setLayout
    //------------------------------------------

    this.setLayout = function () {
        return this.mainLayoutController.setViews();
    };
});

module.exports = app.module("mail");

},{"./../../setup/app.js":88,"./js/controllers/mailActionsController":48,"./js/controllers/mailDataController":50,"./js/controllers/mailMainLayoutController":51,"./js/controllers/mailRouterController":52,"./js/routers/mailRouter":56}],73:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"tagsPlaceholder\"></div>\r\n<div class=\"autoCompletePlaceholder\"></div>\r\n";
  });

},{"hbsfy/runtime":98}],74:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  buffer += "<div class=\"lblCompose\">New Message</div>\r\n<div class=\"buttonsToolbar\">\r\n    <div class=\"action-list-section\">\r\n        <div class=\"btnSelect\">\r\n            <a href=\"javascript:void(0)\" class=\"button dropdown ddsId_ddsSelect\"><span class=\"caption\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:select", options) : helperMissing.call(depth0, "_i18n", "mail:select", options)))
    + "</span><span class=\"toggle\"></span></a>\r\n            <div class=\"dropdown-slider ddsSelect\">\r\n               <a href=\"javascript:void(0)\" class=\"ddm selectAll\"></span><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:select.all", options) : helperMissing.call(depth0, "_i18n", "mail:select.all", options)))
    + "</span></a>\r\n               <a href=\"javascript:void(0)\" class=\"ddm selectNone\"><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:select.none", options) : helperMissing.call(depth0, "_i18n", "mail:select.none", options)))
    + "</span></a>\r\n               <a href=\"javascript:void(0)\" class=\"ddm selectRead\"><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:select.read", options) : helperMissing.call(depth0, "_i18n", "mail:select.read", options)))
    + "</span></a>\r\n               <a href=\"javascript:void(0)\" class=\"ddm selectUnread\"><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:select.unread", options) : helperMissing.call(depth0, "_i18n", "mail:select.unread", options)))
    + "</span></a>\r\n            </div>\r\n        </div>\r\n        <div class=\"btnDeleteForever\"><a href=\"javascript:void(0)\" class=\"button left\"><span class=\"caption\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.deleteForever", options) : helperMissing.call(depth0, "_i18n", "mail:actions.deleteForever", options)))
    + "</span></a></div>\r\n        <div class=\"btnNotSpam\"><a href=\"javascript:void(0)\" class=\"button\"><span class=\"caption\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.notSpam", options) : helperMissing.call(depth0, "_i18n", "mail:actions.notSpam", options)))
    + "</span></a></div>\r\n        <div class=\"btnDiscardDrafts\"><a href=\"javascript:void(0)\" class=\"button\"><span class=\"caption\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.discardDraft", options) : helperMissing.call(depth0, "_i18n", "mail:actions.discardDraft", options)))
    + "</span></a></div>\r\n        <div class=\"btnDelete\"><a href=\"javascript:void(0)\" class=\"button left\"><span class=\"caption\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.delete", options) : helperMissing.call(depth0, "_i18n", "mail:actions.delete", options)))
    + "</span></a></div>\r\n        <div class=\"btnMoveTo\"></div>\r\n        <div class=\"btnMore\"></div>\r\n    </div>\r\n</div>\r\n<div class=\"pager\"></div>";
  return buffer;
  });

},{"hbsfy/runtime":98}],75:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function";


  buffer += "<div class=\"composeView\">\r\n    <div class=\"compose-header\">\r\n        <div class=\"field\">\r\n            <div class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:to", options) : helperMissing.call(depth0, "_i18n", "mail:to", options)))
    + "</div>\r\n            <div class=\"inputbox\"><div class=\"toInputWrapper\"></div></div>\r\n        </div>\r\n        <div class=\"field ccLine\">\r\n            <div class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:cc", options) : helperMissing.call(depth0, "_i18n", "mail:cc", options)))
    + "</div>\r\n            <div class=\"inputbox\"><div class=\"ccInputWrapper\"></div></div>\r\n        </div>\r\n        <div class=field>\r\n            <div class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:subject", options) : helperMissing.call(depth0, "_i18n", "mail:subject", options)))
    + "</div>\r\n            <div class=\"inputbox inputbox1\"><input type=\"text\" class=\"subject\" value=\"";
  if (helper = helpers.subject) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.subject); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\"></input></div>\r\n        </div>\r\n    </div>\r\n    <div class=\"compose-editor browser-scroll\" contenteditable=\"true\"></div>\r\n    <a class=\"button sendBtn\"><span>"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:composeview.send", options) : helperMissing.call(depth0, "_i18n", "mail:composeview.send", options)))
    + "</span></a>\r\n    <a class=\"closeBtn\"></a>\r\n</div>";
  return buffer;
  });

},{"hbsfy/runtime":98}],76:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"mail-items-region browser-scroll light\">\r\n</div>\r\n<div class=\"mail-preview-region browser-scroll light\">\r\n</div>\r\n";
  });

},{"hbsfy/runtime":98}],77:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"msgTitle\"></div>\r\n";
  });

},{"hbsfy/runtime":98}],78:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  buffer += "<div class=\"emptyMail\">\r\n    <div class=\"counter\"></div>\r\n    <div class=\"message\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:emptyMail.selectitem", options) : helperMissing.call(depth0, "_i18n", "mail:emptyMail.selectitem", options)))
    + "</div>\r\n</div>";
  return buffer;
  });

},{"hbsfy/runtime":98}],79:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\r\n        <div class=\"inbox\">";
  if (helper = helpers.from) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.from); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "<div>\r\n    ";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\r\n        <div class=\"sent\"><span class=\"sent-to\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:to", options) : helperMissing.call(depth0, "_i18n", "mail:to", options)))
    + ":</span><span class=\"sent-address\">";
  if (helper = helpers.to) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.to); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span></div>\r\n    ";
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = "", helper, options;
  buffer += "\r\n        <div class=\"draft\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:draft", options) : helperMissing.call(depth0, "_i18n", "mail:draft", options)))
    + "</div>\r\n    ";
  return buffer;
  }

function program7(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\r\n        <div class=\"trash-icon-wrapper\"><div class=\"trash-icon\"></div></div><div class=\"trash-address\"><div>";
  if (helper = helpers.from) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.from); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div></div>\r\n    ";
  return buffer;
  }

function program9(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\r\n        <div class=\"spam\">";
  if (helper = helpers.from) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.from); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n    ";
  return buffer;
  }

  buffer += "<td class=\"selector\"><input type=\"checkbox\" class=\"chkBox\"></td>\r\n<td class=\"star\"><div class=\"star-icon\"></div></td>\r\n<td class=\"importance\"><div class=\"importance-icon\"></div></td>\r\n<td class=\"address\">\r\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isInbox), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\r\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSent), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\r\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isDraft), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\r\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isTrash), {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\r\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSpam), {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\r\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSearch), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\r\n</td>\r\n<td><div class=\"content\"><span class=\"subject\">";
  if (helper = helpers.subject) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.subject); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span><span class=\"separator\">-</span><span class=\"body\">";
  if (helper = helpers.body) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.body); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span></div></td>\r\n<td><div class=\"sentTime\">";
  if (helper = helpers.sentTime) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.sentTime); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div></td>";
  return buffer;
  });

},{"hbsfy/runtime":98}],80:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"mail-table-contanier\">\r\n    <table class=\"data-table mail-table\">\r\n        <colgroup>\r\n            <col style=\"width:30px\"/>\r\n            <col style=\"width:30px\"/>\r\n            <col style=\"width:30px\"/>\r\n            <col style=\"width:190px\"/>\r\n            <col/>\r\n            <col style=\"width:80px\"/>\r\n        </colgroup>\r\n        <tbody>\r\n        </tbody>\r\n    </table>\r\n</div>";
  });

},{"hbsfy/runtime":98}],81:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"mail-nav-region\">\r\n</div>\r\n<div class=\"mail-work-region\">\r\n</div>\r\n\r\n";
  });

},{"hbsfy/runtime":98}],82:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  buffer += "<a href=\"javascript:void(0)\" class=\"button dropdown ddsId_ddsMore\"><span class=\"caption\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.more", options) : helperMissing.call(depth0, "_i18n", "mail:actions.more", options)))
    + "</span><span class=\"toggle\"></span></a>\r\n<div  class=\"dropdown-slider ddsMore\">\r\n   <a href=\"javascript:void(0)\" class=\"ddm markRead\"></span><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.markAs.read", options) : helperMissing.call(depth0, "_i18n", "mail:actions.markAs.read", options)))
    + "</span></a>\r\n   <a href=\"javascript:void(0)\" class=\"ddm markUnread\"><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.markAs.unread", options) : helperMissing.call(depth0, "_i18n", "mail:actions.markAs.unread", options)))
    + "</span></a>\r\n   <a href=\"javascript:void(0)\" class=\"ddm markImp\"><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.markAs.important", options) : helperMissing.call(depth0, "_i18n", "mail:actions.markAs.important", options)))
    + "</span></a>\r\n   <a href=\"javascript:void(0)\" class=\"ddm markNotImp\"><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.markAs.notImportant", options) : helperMissing.call(depth0, "_i18n", "mail:actions.markAs.notImportant", options)))
    + "</span></a>\r\n   <a href=\"javascript:void(0)\" class=\"ddm addStar\"><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.add.star", options) : helperMissing.call(depth0, "_i18n", "mail:actions.add.star", options)))
    + "</span></a>\r\n   <a href=\"javascript:void(0)\" class=\"ddm removeStar\"><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.remove.star", options) : helperMissing.call(depth0, "_i18n", "mail:actions.remove.star", options)))
    + "</span></a>\r\n</div>\r\n\r\n\r\n\r\n\r\n\r\n";
  return buffer;
  });

},{"hbsfy/runtime":98}],83:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  buffer += "<a href=\"javascript:void(0)\" class=\"button dropdown ddsId_ddsMove\"><span class=\"caption\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:actions.moveTo", options) : helperMissing.call(depth0, "_i18n", "mail:actions.moveTo", options)))
    + "</span><span class=\"toggle\"></span></a>\r\n<div  class=\"dropdown-slider ddsMove\">\r\n   <a href=\"javascript:void(0)\" class=\"ddm moveToInbox\"></span><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:inbox", options) : helperMissing.call(depth0, "_i18n", "mail:inbox", options)))
    + "</span></a>\r\n   <a href=\"javascript:void(0)\" class=\"ddm moveToSpam\"><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:spam", options) : helperMissing.call(depth0, "_i18n", "mail:spam", options)))
    + "</span></a>\r\n   <a href=\"javascript:void(0)\" class=\"ddm moveToTrash\"><span class=\"label\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:trash", options) : helperMissing.call(depth0, "_i18n", "mail:trash", options)))
    + "</span></a>\r\n</div>\r\n\r\n\r\n";
  return buffer;
  });

},{"hbsfy/runtime":98}],84:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  buffer += "<a href=\"#compose\" class=\"button prime btnCompose\"><span class=\"caption\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:compose", options) : helperMissing.call(depth0, "_i18n", "mail:compose", options)))
    + "</span></a></div>\r\n<div class=\"navigator mailNav\">\r\n  <ul>\r\n      <li class=\"nav-inbox\"><a href=\"#inbox\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:inbox", options) : helperMissing.call(depth0, "_i18n", "mail:inbox", options)))
    + "</a></li>\r\n      <li class=\"nav-sent\"><a href=\"#sent\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:sent", options) : helperMissing.call(depth0, "_i18n", "mail:sent", options)))
    + "</a></li>\r\n      <li class=\"nav-draft\"><a href=\"#draft\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:draft", options) : helperMissing.call(depth0, "_i18n", "mail:draft", options)))
    + "</a></li>\r\n      <li class=\"nav-trash\"><a href=\"#trash\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:trash", options) : helperMissing.call(depth0, "_i18n", "mail:trash", options)))
    + "</a></li>\r\n      <li class=\"nav-spam\"><a href=\"#spam\">"
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:spam", options) : helperMissing.call(depth0, "_i18n", "mail:spam", options)))
    + "</a></li>\r\n  </ul>\r\n</div>\r\n\r\n";
  return buffer;
  });

},{"hbsfy/runtime":98}],85:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  buffer += "<div class=\"pagerInnerContainer\">\r\n    <div class=\"pagerButtons\">\r\n        <a href=\"javascript:void(0)\" class=\"button left icon btnNewer\" title=\""
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:page.prev", options) : helperMissing.call(depth0, "_i18n", "mail:page.prev", options)))
    + "\"><span class=\"icoNewer\"></span></a>\r\n        <a href=\"javascript:void(0)\" class=\"button right icon btnOlder\" title=\""
    + escapeExpression((helper = helpers._i18n || (depth0 && depth0._i18n),options={hash:{},data:data},helper ? helper.call(depth0, "mail:page.next", options) : helperMissing.call(depth0, "_i18n", "mail:page.next", options)))
    + "\"><span class=\"icoOlder\"></span></a>\r\n    </div>\r\n    <div class=\"pagerInfo\">\r\n        <span class=\"lblForm\"></span>\r\n        <span> - </span>\r\n        <span class=\"lblTo\"></span>\r\n        <span> of </span>\r\n        <span class=\"total\"></span>\r\n    </div>\r\n</div>\r\n\r\n\r\n";
  return buffer;
  });

},{"hbsfy/runtime":98}],86:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"previewMail\">\r\n   <div class=\"subject\">";
  if (helper = helpers.subject) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.subject); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n   <div class=\"addressRegion\">\r\n       <div class=\"icon\"></div>\r\n       <div class=\"from\">";
  if (helper = helpers.from) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.from); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n       <div class=\"to\">";
  if (helper = helpers.to) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.to); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n   </div>\r\n   <div class=\"body\">";
  if (helper = helpers.body) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.body); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n</div>";
  return buffer;
  });

},{"hbsfy/runtime":98}],87:[function(require,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = require('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"search-placeholder\"></div>\r\n<div class=\"autoCompletePlaceholder\"></div>\r\n";
  });

},{"hbsfy/runtime":98}],88:[function(require,module,exports){
'use strict';

var app = new Marionette.Application({ channelName: 'appChannel' });

module.exports = app;

},{}],89:[function(require,module,exports){
"use strict";

require("./vendorsLoader");

var app = require('./app.js');
var Frame = require('./../frame/frame');
var Context = require('./../common/js/context/context');
var MailModule = require('./../modules/mail/mail');
var Translator = require('./../common/js/resolvers/translator');
var SocketController = require('./../common/js/socket/socketController.js');
var SettingsController = require('./../common/js/settings/settingsController.js');

//------------------------------------------
// init
//------------------------------------------

app.on("before:start", function () {

    app.translator = Translator;
    app.context = new Context();
    app.frame = new Frame();
    app.socketController = new SocketController();
    app.settingsController = new SettingsController();
});

//------------------------------------------
// start
//------------------------------------------

app.on("start", function () {

    app.channel.vent.once("onSettingsLoaded", onSettingsLoaded);
    app.settingsController.fetch();
});

//------------------------------------------

var onSettingsLoaded = function onSettingsLoaded() {

    registerUser();
    setLayout();
    startHistory();
    removeSplashScreen();
};

//------------------------------------------

var registerUser = function registerUser() {
    app.socketController.registerUser(app.settings.get("userName"));
};

//------------------------------------------

var setLayout = function setLayout() {

    app.addRegions({
        mainRegion: ".mb"
    });
    app.frame.setLayout(app.mainRegion);
};

//------------------------------------------

var startHistory = function startHistory() {
    Backbone.history.start();
};

//-------------------------------------------

var removeSplashScreen = function removeSplashScreen() {

    $(".spinner").hide();
    $(".mb").show();
};

app.start();

},{"./../common/js/context/context":4,"./../common/js/resolvers/translator":14,"./../common/js/settings/settingsController.js":16,"./../common/js/socket/socketController.js":17,"./../frame/frame":37,"./../modules/mail/mail":72,"./app.js":88,"./vendorsLoader":90}],90:[function(require,module,exports){
"use strict";

window.$ = require("jquery");
window._ = require("underscore");
window._s = require("underscore.string");
window.Backbone = require("backbone");
window.Marionette = require("backbone.marionette");
window.Handlebars = require("hbsfy/runtime");

require('./../common/js/lib-extensions/backbone.sync');
require('./../common/js/lib-extensions/underscore.mixin.deepExtend');
require('./../common/js/lib-extensions/marionette.extensions');

},{"./../common/js/lib-extensions/backbone.sync":7,"./../common/js/lib-extensions/marionette.extensions":8,"./../common/js/lib-extensions/underscore.mixin.deepExtend":9,"backbone":false,"backbone.marionette":false,"hbsfy/runtime":98,"jquery":false,"underscore":false,"underscore.string":false}],91:[function(require,module,exports){
"use strict";
/*globals Handlebars: true */
var base = require("./handlebars/base");

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)
var SafeString = require("./handlebars/safe-string")["default"];
var Exception = require("./handlebars/exception")["default"];
var Utils = require("./handlebars/utils");
var runtime = require("./handlebars/runtime");

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
var create = function create() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = SafeString;
  hb.Exception = Exception;
  hb.Utils = Utils;

  hb.VM = runtime;
  hb.template = function (spec) {
    return runtime.template(spec, hb);
  };

  return hb;
};

var Handlebars = create();
Handlebars.create = create;

exports["default"] = Handlebars;

},{"./handlebars/base":92,"./handlebars/exception":93,"./handlebars/runtime":94,"./handlebars/safe-string":95,"./handlebars/utils":96}],92:[function(require,module,exports){
"use strict";
var Utils = require("./utils");
var Exception = require("./exception")["default"];

var VERSION = "1.3.0";
exports.VERSION = VERSION;var COMPILER_REVISION = 4;
exports.COMPILER_REVISION = COMPILER_REVISION;
var REVISION_CHANGES = {
  1: "<= 1.0.rc.2", // 1.0.rc.2 is actually rev2 but doesn't report it
  2: "== 1.0.0-rc.3",
  3: "== 1.0.0-rc.4",
  4: ">= 1.0.0"
};
exports.REVISION_CHANGES = REVISION_CHANGES;
var isArray = Utils.isArray,
    isFunction = Utils.isFunction,
    toString = Utils.toString,
    objectType = "[object Object]";

function HandlebarsEnvironment(helpers, partials) {
  this.helpers = helpers || {};
  this.partials = partials || {};

  registerDefaultHelpers(this);
}

exports.HandlebarsEnvironment = HandlebarsEnvironment;HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: logger,
  log: log,

  registerHelper: function registerHelper(name, fn, inverse) {
    if (toString.call(name) === objectType) {
      if (inverse || fn) {
        throw new Exception("Arg not supported with multiple helpers");
      }
      Utils.extend(this.helpers, name);
    } else {
      if (inverse) {
        fn.not = inverse;
      }
      this.helpers[name] = fn;
    }
  },

  registerPartial: function registerPartial(name, str) {
    if (toString.call(name) === objectType) {
      Utils.extend(this.partials, name);
    } else {
      this.partials[name] = str;
    }
  }
};

function registerDefaultHelpers(instance) {
  instance.registerHelper("helperMissing", function (arg) {
    if (arguments.length === 2) {
      return undefined;
    } else {
      throw new Exception("Missing helper: '" + arg + "'");
    }
  });

  instance.registerHelper("blockHelperMissing", function (context, options) {
    var inverse = options.inverse || function () {},
        fn = options.fn;

    if (isFunction(context)) {
      context = context.call(this);
    }

    if (context === true) {
      return fn(this);
    } else if (context === false || context == null) {
      return inverse(this);
    } else if (isArray(context)) {
      if (context.length > 0) {
        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      return fn(context);
    }
  });

  instance.registerHelper("each", function (context, options) {
    var fn = options.fn,
        inverse = options.inverse;
    var i = 0,
        ret = "",
        data;

    if (isFunction(context)) {
      context = context.call(this);
    }

    if (options.data) {
      data = createFrame(options.data);
    }

    if (context && typeof context === "object") {
      if (isArray(context)) {
        for (var j = context.length; i < j; i++) {
          if (data) {
            data.index = i;
            data.first = i === 0;
            data.last = i === context.length - 1;
          }
          ret = ret + fn(context[i], { data: data });
        }
      } else {
        for (var key in context) {
          if (context.hasOwnProperty(key)) {
            if (data) {
              data.key = key;
              data.index = i;
              data.first = i === 0;
            }
            ret = ret + fn(context[key], { data: data });
            i++;
          }
        }
      }
    }

    if (i === 0) {
      ret = inverse(this);
    }

    return ret;
  });

  instance.registerHelper("if", function (conditional, options) {
    if (isFunction(conditional)) {
      conditional = conditional.call(this);
    }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if (!options.hash.includeZero && !conditional || Utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper("unless", function (conditional, options) {
    return instance.helpers["if"].call(this, conditional, { fn: options.inverse, inverse: options.fn, hash: options.hash });
  });

  instance.registerHelper("with", function (context, options) {
    if (isFunction(context)) {
      context = context.call(this);
    }

    if (!Utils.isEmpty(context)) return options.fn(context);
  });

  instance.registerHelper("log", function (context, options) {
    var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
    instance.log(level, context);
  });
}

var logger = {
  methodMap: { 0: "debug", 1: "info", 2: "warn", 3: "error" },

  // State enum
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  level: 3,

  // can be overridden in the host environment
  log: function log(level, obj) {
    if (logger.level <= level) {
      var method = logger.methodMap[level];
      if (typeof console !== "undefined" && console[method]) {
        console[method].call(console, obj);
      }
    }
  }
};
exports.logger = logger;
function log(level, obj) {
  logger.log(level, obj);
}

exports.log = log;var createFrame = function createFrame(object) {
  var obj = {};
  Utils.extend(obj, object);
  return obj;
};
exports.createFrame = createFrame;

},{"./exception":93,"./utils":96}],93:[function(require,module,exports){
'use strict';

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var line;
  if (node && node.firstLine) {
    line = node.firstLine;

    message += ' - ' + line + ':' + node.firstColumn;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  if (line) {
    this.lineNumber = line;
    this.column = node.firstColumn;
  }
}

Exception.prototype = new Error();

exports['default'] = Exception;

},{}],94:[function(require,module,exports){
"use strict";
var Utils = require("./utils");
var Exception = require("./exception")["default"];
var COMPILER_REVISION = require("./base").COMPILER_REVISION;
var REVISION_CHANGES = require("./base").REVISION_CHANGES;

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = COMPILER_REVISION;

  if (compilerRevision !== currentRevision) {
    if (compilerRevision < currentRevision) {
      var runtimeVersions = REVISION_CHANGES[currentRevision],
          compilerVersions = REVISION_CHANGES[compilerRevision];
      throw new Exception("Template was precompiled with an older version of Handlebars than the current runtime. " + "Please update your precompiler to a newer version (" + runtimeVersions + ") or downgrade your runtime to an older version (" + compilerVersions + ").");
    } else {
      // Use the embedded version info since the runtime doesn't know about this revision yet
      throw new Exception("Template was precompiled with a newer version of Handlebars than the current runtime. " + "Please update your runtime to a newer version (" + compilerInfo[1] + ").");
    }
  }
}

exports.checkRevision = checkRevision; // TODO: Remove this line and break up compilePartial

function template(templateSpec, env) {
  if (!env) {
    throw new Exception("No environment passed to template");
  }

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as psuedo-supported APIs.
  var invokePartialWrapper = function invokePartialWrapper(partial, name, context, helpers, partials, data) {
    var result = env.VM.invokePartial.apply(this, arguments);
    if (result != null) {
      return result;
    }

    if (env.compile) {
      var options = { helpers: helpers, partials: partials, data: data };
      partials[name] = env.compile(partial, { data: data !== undefined }, env);
      return partials[name](context, options);
    } else {
      throw new Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
    }
  };

  // Just add water
  var container = {
    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,
    programs: [],
    program: (function (_program) {
      function program(_x, _x2, _x3) {
        return _program.apply(this, arguments);
      }

      program.toString = function () {
        return _program.toString();
      };

      return program;
    })(function (i, fn, data) {
      var programWrapper = this.programs[i];
      if (data) {
        programWrapper = program(i, fn, data);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = program(i, fn);
      }
      return programWrapper;
    }),
    merge: function merge(param, common) {
      var ret = param || common;

      if (param && common && param !== common) {
        ret = {};
        Utils.extend(ret, common);
        Utils.extend(ret, param);
      }
      return ret;
    },
    programWithDepth: env.VM.programWithDepth,
    noop: env.VM.noop,
    compilerInfo: null
  };

  return function (context, options) {
    options = options || {};
    var namespace = options.partial ? options : env,
        helpers,
        partials;

    if (!options.partial) {
      helpers = options.helpers;
      partials = options.partials;
    }
    var result = templateSpec.call(container, namespace, context, helpers, partials, options.data);

    if (!options.partial) {
      env.VM.checkRevision(container.compilerInfo);
    }

    return result;
  };
}

exports.template = template;function programWithDepth(i, fn, data /*, $depth */) {
  var args = Array.prototype.slice.call(arguments, 3);

  var prog = function prog(context, options) {
    options = options || {};

    return fn.apply(this, [context, options.data || data].concat(args));
  };
  prog.program = i;
  prog.depth = args.length;
  return prog;
}

exports.programWithDepth = programWithDepth;function program(i, fn, data) {
  var prog = function prog(context, options) {
    options = options || {};

    return fn(context, options.data || data);
  };
  prog.program = i;
  prog.depth = 0;
  return prog;
}

exports.program = program;function invokePartial(partial, name, context, helpers, partials, data) {
  var options = { partial: true, helpers: helpers, partials: partials, data: data };

  if (partial === undefined) {
    throw new Exception("The partial " + name + " could not be found");
  } else if (partial instanceof Function) {
    return partial(context, options);
  }
}

exports.invokePartial = invokePartial;function noop() {
  return "";
}

exports.noop = noop;

},{"./base":92,"./exception":93,"./utils":96}],95:[function(require,module,exports){
"use strict";
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = function () {
  return "" + this.string;
};

exports["default"] = SafeString;

},{}],96:[function(require,module,exports){
"use strict";
/*jshint -W004 */
var SafeString = require("./safe-string")["default"];

var escape = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#x27;",
  "`": "&#x60;"
};

var badChars = /[&<>"'`]/g;
var possible = /[&<>"'`]/;

function escapeChar(chr) {
  return escape[chr] || "&amp;";
}

function extend(obj, value) {
  for (var key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      obj[key] = value[key];
    }
  }
}

exports.extend = extend;var toString = Object.prototype.toString;
exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
var isFunction = function isFunction(value) {
  return typeof value === "function";
};
// fallback for older versions of Chrome and Safari
if (isFunction(/x/)) {
  isFunction = function (value) {
    return typeof value === "function" && toString.call(value) === "[object Function]";
  };
}
var isFunction;
exports.isFunction = isFunction;
var isArray = Array.isArray || function (value) {
  return value && typeof value === "object" ? toString.call(value) === "[object Array]" : false;
};
exports.isArray = isArray;

function escapeExpression(string) {
  // don't escape SafeStrings, since they're already safe
  if (string instanceof SafeString) {
    return string.toString();
  } else if (!string && string !== 0) {
    return "";
  }

  // Force a string conversion as this will be done by the append regardless and
  // the regex test will do this transparently behind the scenes, causing issues if
  // an object's to string has escaped characters in it.
  string = "" + string;

  if (!possible.test(string)) {
    return string;
  }
  return string.replace(badChars, escapeChar);
}

exports.escapeExpression = escapeExpression;function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

exports.isEmpty = isEmpty;

},{"./safe-string":95}],97:[function(require,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
'use strict';

module.exports = require('./dist/cjs/handlebars.runtime');

},{"./dist/cjs/handlebars.runtime":91}],98:[function(require,module,exports){
"use strict";

module.exports = require("handlebars/runtime")["default"];

},{"handlebars/runtime":97}]},{},[89])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6XFxzbWRcXG1haWxkb1xcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2Jhc2UtY29sbGVjdGlvbnMvYmFzZUNvbGxlY3Rpb24uanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2Jhc2UtY29sbGVjdGlvbnMvZmlsdGVyZWRDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9iYXNlLW1vZGVscy9iYXNlTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2NvbnRleHQvY29udGV4dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvZGVjb3JhdG9ycy9GaWx0ZXJDb2xsZWN0aW9uRGVjb3JhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9kZWNvcmF0b3JzL3NlbGVjdGFibGVDb2xsZWN0aW9uRGVjb3JhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9saWItZXh0ZW5zaW9ucy9iYWNrYm9uZS5zeW5jLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9saWItZXh0ZW5zaW9ucy9tYXJpb25ldHRlLmV4dGVuc2lvbnMuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2xpYi1leHRlbnNpb25zL3VuZGVyc2NvcmUubWl4aW4uZGVlcEV4dGVuZC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvcGx1Z2lucy9qcXVlcnkuYmEtb3V0c2lkZS1ldmVudHMuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3BsdWdpbnMvdG9nZ2xlLmJsb2NrLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9yZXNvbHZlcnMvZHJvcGRvd25EaXNwbGF5ZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3Jlc29sdmVycy9mb3JtYXR0ZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3Jlc29sdmVycy90cmFuc2xhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9zZXR0aW5ncy9zZXR0aW5ncy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvc2V0dGluZ3Mvc2V0dGluZ3NDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9zb2NrZXQvc29ja2V0Q29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9hdXRvQ29tcGxldGUvYXV0b0NvbXBsZXRlLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS9qcy9jb2xsZWN0aW9ucy9hdXRvQ29tcGxldGVDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS9qcy9tb2RlbHMvYXV0b0NvbXBsZXRlTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvYXV0b0NvbXBsZXRlL2pzL3ZpZXdzL2F1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvYXV0b0NvbXBsZXRlL2pzL3ZpZXdzL2F1dG9Db21wbGV0ZUl0ZW1WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS91aS90ZW1wbGF0ZXMvYXV0b0NvbXBsZXRlLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9hdXRvQ29tcGxldGUvdWkvdGVtcGxhdGVzL2F1dG9Db21wbGV0ZUl0ZW0uaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2RpYWxvZy9kaWFsb2cuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvZGlhbG9nL2pzL3ZpZXdzL2RpYWxvZ1ZpZXcxLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2RpYWxvZy91aS90ZW1wbGF0ZXMvZGlhbG9nLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9zZWFyY2gvc2VhcmNoLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL3NlYXJjaC91aS90ZW1wbGF0ZXMvc2VhcmNoLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL2pzL2NvbGxlY3Rpb25zL3RhZ0NvbGxlY3Rpb24uanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy9tb2RlbHMvdGFnTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy92aWV3cy90YWdzSXRlbVZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy92aWV3cy90YWdzVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL3RhZ3MuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy91aS90ZW1wbGF0ZXMvdGFnLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL3VpL3RlbXBsYXRlcy90YWdzQ29udGFpbmVyLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9mcmFtZS5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy9mcmFtZUxheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy9sb2FkZXJWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL2pzL3ZpZXdzL3NldHRpbmdzVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy90ZWNoQmFyVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS91aS90ZW1wbGF0ZXMvZnJhbWVMYXlvdXQuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy9sb2FkZXIuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy9zZXR0aW5nc1ZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy90ZWNoQmFyLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29sbGVjdGlvbnMvY29udGFjdHNDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb2xsZWN0aW9ucy9tYWlsQ29sbGVjdGlvbi5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29udHJvbGxlcnMvbWFpbEFjdGlvbnNDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb250cm9sbGVycy9tYWlsQ29udGVudExheW91dENvbnRyb2xsZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL2NvbnRyb2xsZXJzL21haWxEYXRhQ29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29udHJvbGxlcnMvbWFpbE1haW5MYXlvdXRDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb250cm9sbGVycy9tYWlsUm91dGVyQ29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvbW9kZWxzL2NvbnRhY3RNb2RlbC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvbW9kZWxzL2NvbnRhY3RzRmlsdGVyTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL21vZGVscy9tYWlsTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL3JvdXRlcnMvbWFpbFJvdXRlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvYWN0aW9uVmlldy9fbW9yZUFjdGlvbnNWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9hY3Rpb25WaWV3L19tb3ZlVG9WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9hY3Rpb25WaWV3L19wYWdlclZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL3ZpZXdzL2FjdGlvblZpZXcvYWN0aW9uVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvY29tcG9zZVZpZXcvX2FkZHJlc3NWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9jb21wb3NlVmlldy9jb21wb3NlVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvZW1wdHlGb2xkZXJWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9lbXB0eU1haWxWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9tYWlsQ29udGVudExheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvbWFpbEl0ZW1WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9tYWlsTWFpbkxheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvbWFpbHNWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9uYXZWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9wcmV2aWV3Vmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3Mvc2VhcmNoVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvbWFpbC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL19hZGRyZXNzVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9hY3Rpb25WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2NvbXBvc2VWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2NvbnRlbnRMYXlvdXQuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvZW1wdHlGb2xkZXJWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2VtcHR5TWFpbFZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvbWFpbEl0ZW1WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL21haWxzVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9tYWluTGF5b3V0LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL21vcmVBY3Rpb25zVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9tb3ZlVG9WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL25hdlZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvcGFnZXJWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL3ByZXZpZXdWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL3NlYXJjaFZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL3NldHVwL2FwcC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9zZXR1cC9pbml0LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL3NldHVwL3ZlbmRvcnNMb2FkZXIuanMiLCJEOi9zbWQvbWFpbGRvL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMucnVudGltZS5qcyIsIkQ6L3NtZC9tYWlsZG8vbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9iYXNlLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL2V4Y2VwdGlvbi5qcyIsIkQ6L3NtZC9tYWlsZG8vbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9ydW50aW1lLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3NhZmUtc3RyaW5nLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3V0aWxzLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9ydW50aW1lLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGJzZnkvcnVudGltZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLFlBQVksQ0FBQzs7QUFFYixJQUFJLGNBQWMsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQzs7QUFFNUMsWUFBUSxFQUFFLEVBQUU7Ozs7OztBQU1aLFNBQUssRUFBRSxlQUFVLE9BQU8sRUFBRTs7QUFFdEIsZUFBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7O0FBRXhCLFlBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDbEMsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LEtBQUssQ0FBQyxFQUFFO0FBQy9DLFdBQU8sSUFBSSxDQUFDO0dBQ2IsTUFBTTtBQUNMLFdBQU8sS0FBSyxDQUFDO0dBQ2Q7Q0FDRjs7QUFFRCxPQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQzs7Ozs7OztBQ3pFMUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQzs7Ozs7QUNGMUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBCYXNlQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcclxuXHJcbiAgICBtZXRhZGF0YToge30sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIG92ZXJyaWRlIGZldGNoIGZvciB0cmlnZ2VyaW5nLlxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBmZXRjaDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgIHZhciBzdWNjZXNzRnVuYyA9IG9wdGlvbnMuc3VjY2VzcztcclxuICAgICAgICB2YXIgZXJyb3JGdW5jID0gb3B0aW9ucy5lcnJvcjtcclxuXHJcbiAgICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIHJlc3BvbnNlLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLnRyaWdnZXIoXCJmZXRjaDpzdWNjZXNzXCIsIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihzdWNjZXNzRnVuYykpIHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3NGdW5jKGNvbGxlY3Rpb24sIHJlc3BvbnNlLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgb3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCByZXNwb25zZSwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKFwiZmV0Y2g6ZXJyb3JcIiwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGVycm9yRnVuYykpIHtcclxuICAgICAgICAgICAgICAgIGVycm9yRnVuYyhjb2xsZWN0aW9uLCByZXNwb25zZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuZmV0Y2guY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBzZXRcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2V0OiBmdW5jdGlvbiAocmVzcG9uc2UsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgcmVzcG9uc2UgPSBfLmlzT2JqZWN0KHJlc3BvbnNlKSA/IHJlc3BvbnNlIDoge307XHJcblxyXG4gICAgICAgIGlmIChfLmlzT2JqZWN0KHJlc3BvbnNlLmNvbGxlY3Rpb24pICYmIF8uaXNPYmplY3QocmVzcG9uc2UubWV0YWRhdGEpKSB7XHJcbiAgICAgICAgICAgIEJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLnNldC5jYWxsKHRoaXMsIHJlc3BvbnNlLmNvbGxlY3Rpb24sIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1ldGFkYXRhKHJlc3BvbnNlLm1ldGFkYXRhKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuc2V0LmNhbGwodGhpcywgcmVzcG9uc2UsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHVwZGF0ZU1ldGFkYXRhOiBmdW5jdGlvbiAobWV0YWRhdGEpIHtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzRXF1YWwodGhpcy5tZXRhZGF0YSwgbWV0YWRhdGEpKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1ldGFkYXRhID0gXy5jbG9uZShtZXRhZGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcihcImNoYW5nZTptZXRhZGF0YVwiLCBtZXRhZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBkZXN0cm95XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVzdHJveTogZnVuY3Rpb24gKF9vcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgb3B0aW9ucyA9IF9vcHRpb25zID8gXy5jbG9uZShfb3B0aW9ucykgOiB7fSxcclxuICAgICAgICAgICAgc3VjY2VzcyA9IG9wdGlvbnMuc3VjY2VzcztcclxuXHJcbiAgICAgICAgaWYgKF8uaXNBcnJheShvcHRpb25zLnNlbGVjdGVkSXRlbXMpKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMuZGF0YSA9IG9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5zcGxpY2UoMCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgb3B0aW9ucy5kYXRhID0gdGhpcy5nZXRNb2RlbElkcygpOyAvLyBhbGwgaXRlbXNcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF8uZWFjaChvcHRpb25zLmRhdGEsIGZ1bmN0aW9uIChpdGVtKSB7IC8vIHJlbW92ZSBuZXcgb3Igbm90IGV4aXN0ZWQgaXRlbXNcclxuICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgIGlmICghbW9kZWwgfHwgbW9kZWwuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5kYXRhID0gb3B0aW9ucy5kYXRhLnNsaWNlKCQuaW5BcnJheShpdGVtLCBvcHRpb25zLmRhdGEpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoXy5pc0VtcHR5KG9wdGlvbnMuZGF0YSkpIHsgLy9ubyBpdGVtcyB0byBkZWxldGVcclxuICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwKSB7XHJcbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzKHRoYXQsIHJlc3AsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoYXQudHJpZ2dlcignZGVsZXRlOnN1Y2Nlc3MnLCB0aGF0LCByZXNwLCBvcHRpb25zKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gQmFja2JvbmUuc3luYy5hcHBseSh0aGlzLCBbJ2RlbGV0ZScsIHRoaXMsIG9wdGlvbnNdKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gdXBkYXRlXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAoX29wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICBvcHRpb25zID0gX29wdGlvbnMgPyBfLmNsb25lKF9vcHRpb25zKSA6IHt9LFxyXG4gICAgICAgICAgICBzdWNjZXNzRnVuYyA9IG9wdGlvbnMuc3VjY2VzcztcclxuXHJcbiAgICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3ApIHtcclxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NGdW5jKSB7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzRnVuYyh0aGF0LCByZXNwLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGF0LnRyaWdnZXIoJ3VwZGF0ZTpzdWNjZXNzJywgdGhhdCwgcmVzcCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIEJhY2tib25lLnN5bmMuYXBwbHkodGhpcywgWyd1cGRhdGUnLCB0aGlzLCBvcHRpb25zXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB0b0pTT046IGZ1bmN0aW9uIChfb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgYXJyID0gW10sXHJcbiAgICAgICAgICAgIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICBvcHRpb25zID0gX29wdGlvbnMgfHwge30sXHJcbiAgICAgICAgICAgIGl0ZW1zID0gb3B0aW9ucy5zZWxlY3RlZEl0ZW1zIHx8IHRoaXMuZ2V0TW9kZWxJZHMoKTtcclxuXHJcbiAgICAgICAgXy5lYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5nZXQoaXRlbSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgIGlmICghbW9kZWwuaXNOZXcoKSAmJiBvcHRpb25zLmZpZWxkcykge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZmllbGRzLnB1c2goXCJpZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbCA9IG1vZGVsLnRvSlNPTih7ZmllbGRzOiBvcHRpb25zLmZpZWxkc30pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbCA9IG1vZGVsLnRvSlNPTigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYXJyLnB1c2gobW9kZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBnZXRNb2RlbElkczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKG1vZGVsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb2RlbC5pZDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VDb2xsZWN0aW9uO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBCYXNlQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCIuL2Jhc2VDb2xsZWN0aW9uXCIpO1xyXG5cclxudmFyIEZpbHRlcmVkQ29sbGVjdGlvbiA9IEJhc2VDb2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgUEFHRV9TSVpFOiAxMCxcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBCYXNlQ29sbGVjdGlvbi5wcm90b3R5cGUuaW5pdGlhbGl6ZShvcHRpb25zKTtcclxuICAgICAgICB0aGlzLnNldEZpbHRlcnMob3B0aW9ucyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gZmV0Y2hCeVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZmV0Y2hCeTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgIHRoaXMuc2V0RmlsdGVycyhvcHRpb25zKTtcclxuXHJcbiAgICAgICAgdGhpcy5mZXRjaCh7XHJcblxyXG4gICAgICAgICAgICByZXNldDogdHJ1ZSxcclxuXHJcbiAgICAgICAgICAgIGRhdGE6IHRoaXMuZmlsdGVycyxcclxuXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IF8uYmluZChmdW5jdGlvbiAoY29sbGVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0ZldGNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihvcHRpb25zLnN1Y2Nlc3MpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKGNvbGxlY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB0aGlzKSxcclxuXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihvcHRpb25zLmVycm9yKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IoY29sbGVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2V0RmlsdGVyczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gb3B0aW9ucy5maWx0ZXJzID8gXy5jbG9uZShvcHRpb25zLmZpbHRlcnMpIDoge3F1ZXJ5OiAnJywgcGFnZTogMX07XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gcmVmcmVzaFxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgcmVmcmVzaDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLmZldGNoQnkoe2ZpbHRlcnM6IHRoaXMuZmlsdGVyc30pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmlsdGVyZWRDb2xsZWN0aW9uOyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIERlZXBNb2RlbCA9IHJlcXVpcmUoXCJiYWNrYm9uZS1kZWVwLW1vZGVsXCIpO1xyXG5cclxudmFyIEJhc2VNb2RlbCA9IERlZXBNb2RlbC5leHRlbmQoe1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gc2F2ZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2F2ZTpmdW5jdGlvbiAoa2V5LCB2YWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaWYgKGtleSA9PSBudWxsIHx8IHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLmludmFsaWQpIHtcclxuICAgICAgICAgICAgdGhpcy5vbihcImludmFsaWRcIiwgb3B0aW9ucy5pbnZhbGlkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXN1bHQgPSBEZWVwTW9kZWwucHJvdG90eXBlLnNhdmUuY2FsbCh0aGlzLCBrZXksIHZhbCwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLmludmFsaWQpIHtcclxuICAgICAgICAgICAgdGhpcy5vZmYoXCJpbnZhbGlkXCIsIG9wdGlvbnMuaW52YWxpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyB0b0pTT05cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdG9KU09OOmZ1bmN0aW9uKG9wdGlvbnMpe1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgaWYob3B0aW9ucy5maWVsZHMpe1xyXG4gICAgICAgICAgICB2YXIgY29weSA9IHt9LCBjbG9uZSA9IF8uZGVlcENsb25lKHRoaXMuYXR0cmlidXRlcyk7XHJcblxyXG4gICAgICAgICAgICBfLmVhY2gob3B0aW9ucy5maWVsZHMsIGZ1bmN0aW9uKGZpZWxkKXtcclxuICAgICAgICAgICAgICAgIGNvcHlbZmllbGRdID0gY2xvbmVbZmllbGRdO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjb3B5O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gRGVlcE1vZGVsLnByb3RvdHlwZS50b0pTT04uY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VNb2RlbDtcclxuXHJcblxyXG5cclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIERlZXBNb2RlbCA9IHJlcXVpcmUoXCJiYWNrYm9uZS1kZWVwLW1vZGVsXCIpO1xyXG5cclxudmFyIENvbnRleHQgPSBEZWVwTW9kZWwuZXh0ZW5kKHtcclxuXHJcbiAgICBkZWZhdWx0czoge1xyXG4gICAgICAgIG1vZHVsZTogJycsXHJcbiAgICAgICAgbWFpbDoge1xyXG4gICAgICAgICAgICBhY3Rpb246IHt9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0YXNrczoge1xyXG4gICAgICAgICAgICBzZWxlY3RlZENhdGVnb3J5OiB7fVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRleHQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEZpbHRlckNvbGxlY3Rpb25EZWNvcmF0b3IgPSBmdW5jdGlvbiAob3JpZ2luYWwsIGZpbHRlck1vZGVsKSB7XHJcblxyXG4gICAgdmFyIGZpbHRlckNvbGxlY3Rpb24gPSAkLmV4dGVuZCh7fSwgb3JpZ2luYWwpO1xyXG5cclxuICAgIGZpbHRlckNvbGxlY3Rpb24ubW9kZWxzID0gW107XHJcbiAgICBmaWx0ZXJDb2xsZWN0aW9uLmZpbHRlck1vZGVsID0gZmlsdGVyTW9kZWw7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGZpbHRlckJ5XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGZpbHRlckNvbGxlY3Rpb24uZmlsdGVyQnkgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgdmFyIGl0ZW1zO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5maWx0ZXJNb2RlbCkge1xyXG4gICAgICAgICAgICBpdGVtcyA9IF8uZmlsdGVyKG9yaWdpbmFsLm1vZGVscywgXy5iaW5kKGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyTW9kZWwucHJlZGljYXRlKG1vZGVsKTtcclxuICAgICAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGl0ZW1zID0gb3JpZ2luYWwubW9kZWxzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKF8uaXNBcnJheShvcHRpb25zLm1hbmRhdG9yeUl0ZW1zKSkge1xyXG4gICAgICAgICAgICBpdGVtcyA9IF8udW5pb24ob3B0aW9ucy5tYW5kYXRvcnlJdGVtcywgaXRlbXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKF8uaXNGaW5pdGUob3B0aW9ucy5tYXhJdGVtcykpIHtcclxuICAgICAgICAgICAgaXRlbXMgPSBpdGVtcy5zbGljZSgwLCBvcHRpb25zLm1heEl0ZW1zKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChfLmlzRW1wdHkoaXRlbXMpKSB7XHJcbiAgICAgICAgICAgIGZpbHRlckNvbGxlY3Rpb24udHJpZ2dlcihcImVtcHR5OmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbHRlckNvbGxlY3Rpb24ucmVzZXQoaXRlbXMpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGZpbHRlckFsbFxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBmaWx0ZXJDb2xsZWN0aW9uLmZpbHRlckFsbCA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgZmlsdGVyQ29sbGVjdGlvbi50cmlnZ2VyKFwiZW1wdHk6Y29sbGVjdGlvblwiKTtcclxuICAgICAgICBmaWx0ZXJDb2xsZWN0aW9uLnJlc2V0KFtdKTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIGZpbHRlckNvbGxlY3Rpb247XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZpbHRlckNvbGxlY3Rpb25EZWNvcmF0b3I7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFNlbGVjdGFibGVDb2xsZWN0aW9uRGVjb3JhdG9yID0gZnVuY3Rpb24gKG9yaWdpbmFsKSB7XHJcblxyXG4gICAgdmFyIGRlY29yYXRlZENvbGxlY3Rpb24gPSAkLmV4dGVuZCh7fSwgb3JpZ2luYWwpO1xyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0ZWQgPSBbXTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVjb3JhdGVkQ29sbGVjdGlvbi5nZXRTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWQuc2xpY2UoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uaXNTZWxlY3RlZCA9IGZ1bmN0aW9uIChtb2RlbCkge1xyXG5cclxuICAgICAgICB2YXIgaWQgPSBtb2RlbC5nZXQoXCJpZFwiKTtcclxuICAgICAgICByZXR1cm4gJC5pbkFycmF5KGlkLCBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdGVkKSAhPT0gLTE7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24udW5zZWxlY3RNb2RlbCA9IGZ1bmN0aW9uIChtb2RlbCwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgaWQgPSBtb2RlbC5nZXQoXCJpZFwiKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZ2V0KGlkKSAmJiAkLmluQXJyYXkoaWQsIHRoaXMuc2VsZWN0ZWQpICE9PSAtMSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkLnNwbGljZSgkLmluQXJyYXkoaWQsIHRoaXMuc2VsZWN0ZWQpLCAxKTtcclxuICAgICAgICAgICAgcmFpc2VUcmlnZ2VyKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVjb3JhdGVkQ29sbGVjdGlvbi51cGRhdGVTZWxlY3Rpb24gPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgaXRlbXNUb1JlbW92ZSA9IFtdO1xyXG5cclxuICAgICAgICBfLmVhY2godGhpcy5zZWxlY3RlZCwgXy5iaW5kKGZ1bmN0aW9uIChzZWxlY3RlZEl0ZW0pIHtcclxuICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5nZXQoc2VsZWN0ZWRJdGVtKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzRW1wdHkobW9kZWwpKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtc1RvUmVtb3ZlLnB1c2goc2VsZWN0ZWRJdGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzRW1wdHkoaXRlbXNUb1JlbW92ZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IF8uZGlmZmVyZW5jZSh0aGlzLnNlbGVjdGVkLCBpdGVtc1RvUmVtb3ZlKTtcclxuICAgICAgICAgICAgcmFpc2VUcmlnZ2VyKG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uY2xlYXJTZWxlY3RlZCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWQubGVuZ3RoID0gMDtcclxuICAgICAgICByYWlzZVRyaWdnZXIob3B0aW9ucyk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdEFsbCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0TW9kZWxzKHRoaXMubW9kZWxzLCBvcHRpb25zKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0TW9kZWxzID0gZnVuY3Rpb24gKG1vZGVscywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgZXhjbHVzaXZlbHkgPSBvcHRpb25zID8gb3B0aW9ucy5leGNsdXNpdmVseSA6IG51bGwsIHJhaXNlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChleGNsdXNpdmVseSkge1xyXG4gICAgICAgICAgICByYWlzZSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQubGVuZ3RoID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF8uZWFjaChtb2RlbHMsIGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgICAgICAgICByYWlzZSA9IGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0TW9kZWwobW9kZWwsIHtzaWxlbnQ6IHRydWV9KSB8fCByYWlzZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgICAgaWYgKHJhaXNlKSB7XHJcbiAgICAgICAgICAgIHJhaXNlVHJpZ2dlcihvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdE1vZGVsID0gZnVuY3Rpb24gKG1vZGVsLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHZhciBpZCA9IG1vZGVsLmdldChcImlkXCIpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5nZXQoaWQpICYmICQuaW5BcnJheShpZCwgdGhpcy5zZWxlY3RlZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQucHVzaChpZCk7XHJcbiAgICAgICAgICAgIHJhaXNlVHJpZ2dlcihvcHRpb25zKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVjb3JhdGVkQ29sbGVjdGlvbi50b2dnbGVTZWxlY3Rpb24gPSBmdW5jdGlvbiAobW9kZWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3RlZChtb2RlbCkpIHtcclxuICAgICAgICAgICAgdGhpcy51bnNlbGVjdE1vZGVsKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdE1vZGVsKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgcmFpc2VUcmlnZ2VyID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdmFyIHNpbGVudCA9IG9wdGlvbnMgPyBvcHRpb25zLnNpbGVudCA6IG51bGw7XHJcblxyXG4gICAgICAgIGlmICghc2lsZW50KSB7XHJcbiAgICAgICAgICAgIGRlY29yYXRlZENvbGxlY3Rpb24udHJpZ2dlcignY2hhbmdlOnNlbGVjdGlvbicsIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0ZWQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBkZWNvcmF0ZWRDb2xsZWN0aW9uO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RhYmxlQ29sbGVjdGlvbkRlY29yYXRvcjtcclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gc29ja2V0c1N5bmNcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnZhciBzb2NrZXRTeW5jID0gZnVuY3Rpb24gKG1ldGhvZCwgbW9kZWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICB2YXIgb3B0cyA9IF8uZXh0ZW5kKHt9LCBvcHRpb25zKSxcclxuICAgICAgICBkZWZlciA9ICQuRGVmZXJyZWQoKSxcclxuICAgICAgICBwcm9taXNlID0gZGVmZXIucHJvbWlzZSgpLFxyXG4gICAgICAgIHJlcU5hbWUsXHJcbiAgICAgICAgc29ja2V0O1xyXG5cclxuICAgIG9wdHMuZGF0YSA9IG9wdHMuZGF0YSB8fCBtb2RlbC50b0pTT04ob3B0aW9ucyk7XHJcblxyXG4gICAgc29ja2V0ID0gb3B0cy5zb2NrZXQgfHwgbW9kZWwuc29ja2V0O1xyXG4gICAgcmVxTmFtZSA9IHNvY2tldC5yZXF1ZXN0TmFtZSArIFwiOlwiICsgbWV0aG9kO1xyXG5cclxuICAgIHNvY2tldC5pby5vbmNlKHJlcU5hbWUsIGZ1bmN0aW9uIChyZXMpIHtcclxuICAgICAgICB2YXIgc3VjY2VzcyA9IChyZXMgJiYgcmVzLnN1Y2Nlc3MpOyAvLyBFeHBlY3RzIHNlcnZlciBqc29uIHJlc3BvbnNlIHRvIGNvbnRhaW4gYSBib29sZWFuICdzdWNjZXNzJyBmaWVsZFxyXG4gICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24ob3B0aW9ucy5zdWNjZXNzKSkgb3B0aW9ucy5zdWNjZXNzKHJlcy5kYXRhKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShyZXMpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24ob3B0aW9ucy5lcnJvcikpIG9wdGlvbnMuZXJyb3IobW9kZWwsIHJlcyk7XHJcbiAgICAgICAgZGVmZXIucmVqZWN0KHJlcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzb2NrZXQuaW8uZW1pdChyZXFOYW1lLCBtb2RlbC51c2VyTmFtZSwgb3B0cy5kYXRhKTtcclxuICAgIG1vZGVsLnRyaWdnZXIoJ3JlcXVlc3QnLCBtb2RlbCwgcHJvbWlzZSwgb3B0cyk7XHJcblxyXG4gICAgcmV0dXJuIHByb21pc2U7XHJcbn07XHJcblxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gbG9jYWxTeW5jXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgbG9jYWxTeW5jID0gZnVuY3Rpb24gKG1ldGhvZCwgbW9kZWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICB2YXIgc3RvcmUgPSBtb2RlbC5sb2NhbFN0b3JhZ2UgfHwgbW9kZWwuY29sbGVjdGlvbi5sb2NhbFN0b3JhZ2U7XHJcblxyXG4gICAgdmFyIHJlc3AsIGVycm9yTWVzc2FnZSwgc3luY0RmZCA9ICQuRGVmZXJyZWQgJiYgJC5EZWZlcnJlZCgpOyAvL0lmICQgaXMgaGF2aW5nIERlZmVycmVkIC0gdXNlIGl0LlxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgc3dpdGNoIChtZXRob2QpIHtcclxuICAgICAgICAgICAgY2FzZSBcInJlYWRcIjpcclxuICAgICAgICAgICAgICAgIHJlc3AgPSBtb2RlbC5pZCAhPT0gdW5kZWZpbmVkID8gc3RvcmUuZmluZChtb2RlbCkgOiBzdG9yZS5maW5kQWxsKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXNwID0gc3RvcmUuY3JlYXRlKG1vZGVsKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwidXBkYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXNwID0gbW9kZWwuaWQgIT09IHVuZGVmaW5lZCA/IHN0b3JlLnVwZGF0ZShtb2RlbCkgOiBzdG9yZS51cGRhdGVCdWxrKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiZGVsZXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXNwID0gbW9kZWwuaWQgIT09IHVuZGVmaW5lZCA/IHN0b3JlLmRlc3Ryb3kobW9kZWwpIDogc3RvcmUuZGVzdHJveUFsbChtb2RlbCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gXCJQcml2YXRlIGJyb3dzaW5nIGlzIHVuc3VwcG9ydGVkXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaWYgKHJlc3ApIHtcclxuICAgICAgICBtb2RlbC50cmlnZ2VyKFwic3luY1wiLCBtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgIGlmIChCYWNrYm9uZS5WRVJTSU9OID09PSBcIjAuOS4xMFwiKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MobW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKHJlc3ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3luY0RmZCkge1xyXG4gICAgICAgICAgICBzeW5jRGZkLnJlc29sdmUocmVzcCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlcnJvck1lc3NhZ2UgPSBlcnJvck1lc3NhZ2UgPyBlcnJvck1lc3NhZ2UgOiBcIlJlY29yZCBOb3QgRm91bmRcIjtcclxuXHJcbiAgICAgICAgbW9kZWwudHJpZ2dlcihcImVycm9yXCIsIG1vZGVsLCBlcnJvck1lc3NhZ2UsIG9wdGlvbnMpO1xyXG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZXJyb3IpIHtcclxuICAgICAgICAgICAgaWYgKEJhY2tib25lLlZFUlNJT04gPT09IFwiMC45LjEwXCIpIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IobW9kZWwsIGVycm9yTWVzc2FnZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLmVycm9yKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN5bmNEZmQpIHtcclxuICAgICAgICAgICAgc3luY0RmZC5yZWplY3QoZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5jb21wbGV0ZSkge1xyXG4gICAgICAgIG9wdGlvbnMuY29tcGxldGUocmVzcCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN5bmNEZmQgJiYgc3luY0RmZC5wcm9taXNlKCk7XHJcbn07XHJcblxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gT3ZlcnJpZGUgQmFja2JvbmUuc3luY1xyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxudmFyIGFqYXhTeW5jID0gQmFja2JvbmUuc3luYztcclxuXHJcbnZhciBnZXRTeW5jTWV0aG9kID0gZnVuY3Rpb24gKG1vZGVsKSB7XHJcbiAgICBpZiAobW9kZWwubG9jYWxTdG9yYWdlIHx8IChtb2RlbC5jb2xsZWN0aW9uICYmIG1vZGVsLmNvbGxlY3Rpb24ubG9jYWxTdG9yYWdlKSkge1xyXG4gICAgICAgIHJldHVybiBsb2NhbFN5bmM7XHJcbiAgICB9XHJcbiAgICBpZiAobW9kZWwuc29ja2V0IHx8IChtb2RlbC5jb2xsZWN0aW9uICYmIG1vZGVsLmNvbGxlY3Rpb24uc29ja2V0KSkge1xyXG4gICAgICAgIHJldHVybiBzb2NrZXRTeW5jO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFqYXhTeW5jO1xyXG59O1xyXG5cclxuQmFja2JvbmUuc3luYyA9IGZ1bmN0aW9uIChtZXRob2QsIG1vZGVsLCBvcHRpb25zKSB7XHJcbiAgICBnZXRTeW5jTWV0aG9kKG1vZGVsKS5hcHBseSh0aGlzLCBbbWV0aG9kLCBtb2RlbCwgb3B0aW9uc10pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5TeW5jO1xyXG4iLCIgICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBvbkludmFsaWRcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHZhciBkZWxlZ2F0ZUV2ZW50cyA9IE1hcmlvbmV0dGUuVmlldy5wcm90b3R5cGUuZGVsZWdhdGVFdmVudHM7XHJcblxyXG4gICAgTWFyaW9uZXR0ZS5WaWV3LnByb3RvdHlwZS5kZWxlZ2F0ZUV2ZW50cyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgZGVsZWdhdGVFdmVudHMuYXBwbHkodGhpcywgW10uc2xpY2UuYXBwbHkoYXJndW1lbnRzKSk7XHJcblxyXG4gICAgICAgIHZhciB2aWV3ID0gdGhpcztcclxuICAgICAgICB2YXIgdmlld01vZGVsID0gdmlldy5tb2RlbDtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzVW5kZWZpbmVkKHZpZXdNb2RlbCkpIHtcclxuXHJcbiAgICAgICAgICAgIHZpZXcubGlzdGVuVG8odmlld01vZGVsLCBcImludmFsaWRcIiwgZnVuY3Rpb24gKG1vZGVsLCBlcnJvck9iamVjdCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odmlldy5vbkludmFsaWQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmlldy5vbkludmFsaWQobW9kZWwsIGVycm9yT2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGFkZCAtIGFuIGFsdGVybmF0aXZlIHRvIHJlZ2lvbi5zaG93KCksIGRvZXNuJ3Qgbm90IHJlbW92ZSBwZXJtYW5lbnQgdmlld3NcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIE1hcmlvbmV0dGUuUmVnaW9uLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2aWV3LCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICBpZihfLmlzT2JqZWN0KHZpZXcpICYmICFfLmlzRW1wdHkodmlldy5jaWQpKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudmlld3MgPSB0aGlzLnZpZXdzIHx8IHt9O1xyXG4gICAgICAgICAgICB0aGlzLl9lbnN1cmVFbGVtZW50KCk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYW4odmlldy5jaWQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9oYXNWaWV3KHZpZXcpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hZGRWaWV3KHZpZXcpO1xyXG4gICAgICAgICAgICAgICAgdmlldy5yZW5kZXIoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGVsLmFwcGVuZCh2aWV3LmVsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYob3B0aW9ucy5oaWRlT3RoZXJWaWV3cyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93Vmlldyh2aWV3KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgTWFyaW9uZXR0ZS50cmlnZ2VyTWV0aG9kLmNhbGwodmlldywgXCJzaG93XCIpO1xyXG4gICAgICAgICAgICBNYXJpb25ldHRlLnRyaWdnZXJNZXRob2QuY2FsbCh0aGlzLCBcInNob3dcIiwgdmlldyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBNYXJpb25ldHRlLlJlZ2lvbi5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbihjdXJyVmlld0lkKSB7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLnZpZXdzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgdmlldyA9IHRoaXMudmlld3Nba2V5XTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2aWV3ICYmICF2aWV3LmlzUGVybWFuZW50ICYmICF2aWV3LmlzRGVzdHJveWVkICYmIHZpZXcuY2lkICE9PSBjdXJyVmlld0lkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmlldy5kZXN0cm95KSB7dmlldy5kZXN0cm95KCk7fVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodmlldy5yZW1vdmUpIHt2aWV3LnJlbW92ZSgpO31cclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnZpZXdzW2tleV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIE1hcmlvbmV0dGUuUmVnaW9uLnByb3RvdHlwZS5faGFzVmlldyA9IGZ1bmN0aW9uICh2aWV3KSB7XHJcblxyXG4gICAgICAgIHJldHVybiBfLmlzT2JqZWN0KHRoaXMudmlld3Nbdmlldy5jaWRdKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgTWFyaW9uZXR0ZS5SZWdpb24ucHJvdG90eXBlLl9hZGRWaWV3ID0gZnVuY3Rpb24odmlldyl7XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICB0aGlzLnZpZXdzW3ZpZXcuY2lkXSA9IHZpZXc7XHJcblxyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odmlldywgXCJkZXN0cm95XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZGVsZXRlIHRoYXQudmlld3Nbdmlldy5jaWRdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBNYXJpb25ldHRlLlJlZ2lvbi5wcm90b3R5cGUuX3Nob3dWaWV3ID0gZnVuY3Rpb24gKHZpZXcsb3B0aW9ucykge1xyXG5cclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy52aWV3cykge1xyXG4gICAgICAgICAgICB2YXIgX3ZpZXcgPSB0aGlzLnZpZXdzW2tleV07XHJcbiAgICAgICAgICAgIGlmIChfdmlldy5jaWQgIT09IHZpZXcuY2lkKSB7XHJcbiAgICAgICAgICAgICAgICBfdmlldy4kZWwuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZpZXcuJGVsLnNob3coKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gb3ZlcnJpZGUgZGVzdHJveSAtIGNhbGxlZCBieSByZWdpb24uc2hvdygpXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgX29yaWdpbmFsRGVzdHJveSA9IE1hcmlvbmV0dGUuUmVnaW9uLnByb3RvdHlwZS5kZXN0cm95O1xyXG5cclxuICAgIE1hcmlvbmV0dGUuUmVnaW9uLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICBfb3JpZ2luYWxEZXN0cm95LmFwcGx5KHRoaXMsIFtdLnNsaWNlLmFwcGx5KGFyZ3VtZW50cykpO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy52aWV3cykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHZpZXcgPSB0aGlzLnZpZXdzW2tleV07XHJcblxyXG4gICAgICAgICAgICBpZihfLmlzT2JqZWN0KHZpZXcpKXtcclxuICAgICAgICAgICAgICAgIGlmICh2aWV3LmRlc3Ryb3kpIHt2aWV3LmRlc3Ryb3koKTt9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2aWV3LnJlbW92ZSkge3ZpZXcucmVtb3ZlKCk7fVxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMudmlld3Nba2V5XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBNYXJpb25ldHRlO1xyXG4iLCIgICAgICAgIHZhciBhcnJheXMsIGJhc2ljT2JqZWN0cywgZGVlcENsb25lLCBkZWVwRXh0ZW5kLCBkZWVwRXh0ZW5kQ291cGxlLCBpc0Jhc2ljT2JqZWN0LFxyXG4gICAgICAgICAgICBfX3NsaWNlID0gW10uc2xpY2U7XHJcblxyXG5cclxuICAgICAgICBkZWVwQ2xvbmUgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgIHZhciBmdW5jLCBpc0FycjtcclxuICAgICAgICAgICAgaWYgKCFfLmlzT2JqZWN0KG9iaikgfHwgXy5pc0Z1bmN0aW9uKG9iaikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmo7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEJhY2tib25lLkNvbGxlY3Rpb24gfHwgb2JqIGluc3RhbmNlb2YgQmFja2JvbmUuTW9kZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmo7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKF8uaXNEYXRlKG9iaikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZShvYmouZ2V0VGltZSgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoXy5pc1JlZ0V4cChvYmopKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChvYmouc291cmNlLCBvYmoudG9TdHJpbmcoKS5yZXBsYWNlKC8uKlxcLy8sIFwiXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpc0FyciA9IF8uaXNBcnJheShvYmogfHwgXy5pc0FyZ3VtZW50cyhvYmopKTtcclxuICAgICAgICAgICAgZnVuYyA9IGZ1bmN0aW9uIChtZW1vLCB2YWx1ZSwga2V5KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNBcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBtZW1vLnB1c2goZGVlcENsb25lKHZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG1lbW9ba2V5XSA9IGRlZXBDbG9uZSh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWVtbztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIF8ucmVkdWNlKG9iaiwgZnVuYywgaXNBcnIgPyBbXSA6IHt9KTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgaXNCYXNpY09iamVjdCA9IGZ1bmN0aW9uIChvYmplY3QpIHtcclxuICAgICAgICAgICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybiAob2JqZWN0LnByb3RvdHlwZSA9PT0ge30ucHJvdG90eXBlIHx8IG9iamVjdC5wcm90b3R5cGUgPT09IE9iamVjdC5wcm90b3R5cGUpICYmIF8uaXNPYmplY3Qob2JqZWN0KSAmJiAhXy5pc0FycmF5KG9iamVjdCkgJiYgIV8uaXNGdW5jdGlvbihvYmplY3QpICYmICFfLmlzRGF0ZShvYmplY3QpICYmICFfLmlzUmVnRXhwKG9iamVjdCkgJiYgIV8uaXNBcmd1bWVudHMob2JqZWN0KTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgYmFzaWNPYmplY3RzID0gZnVuY3Rpb24gKG9iamVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5maWx0ZXIoXy5rZXlzKG9iamVjdCksIGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpc0Jhc2ljT2JqZWN0KG9iamVjdFtrZXldKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIGFycmF5cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZmlsdGVyKF8ua2V5cyhvYmplY3QpLCBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5pc0FycmF5KG9iamVjdFtrZXldKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIGRlZXBFeHRlbmRDb3VwbGUgPSBmdW5jdGlvbiAoZGVzdGluYXRpb24sIHNvdXJjZSwgbWF4RGVwdGgpIHtcclxuICAgICAgICAgICAgdmFyIGNvbWJpbmUsIHJlY3Vyc2UsIHNoYXJlZEFycmF5S2V5LCBzaGFyZWRBcnJheUtleXMsIHNoYXJlZE9iamVjdEtleSwgc2hhcmVkT2JqZWN0S2V5cywgX2ksIF9qLCBfbGVuLCBfbGVuMTtcclxuICAgICAgICAgICAgaWYgKG1heERlcHRoID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIG1heERlcHRoID0gMjA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG1heERlcHRoIDw9IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignXy5kZWVwRXh0ZW5kKCk6IE1heGltdW0gZGVwdGggb2YgcmVjdXJzaW9uIGhpdC4nKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmV4dGVuZChkZXN0aW5hdGlvbiwgc291cmNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzaGFyZWRPYmplY3RLZXlzID0gXy5pbnRlcnNlY3Rpb24oYmFzaWNPYmplY3RzKGRlc3RpbmF0aW9uKSwgYmFzaWNPYmplY3RzKHNvdXJjZSkpO1xyXG4gICAgICAgICAgICByZWN1cnNlID0gZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICAgICAgc291cmNlW2tleV0gPSBkZWVwRXh0ZW5kQ291cGxlKGRlc3RpbmF0aW9uW2tleV0sIHNvdXJjZVtrZXldLCBtYXhEZXB0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvdXJjZVtrZXldO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHNoYXJlZE9iamVjdEtleXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcclxuICAgICAgICAgICAgICAgIHNoYXJlZE9iamVjdEtleSA9IHNoYXJlZE9iamVjdEtleXNbX2ldO1xyXG4gICAgICAgICAgICAgICAgcmVjdXJzZShzaGFyZWRPYmplY3RLZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNoYXJlZEFycmF5S2V5cyA9IF8uaW50ZXJzZWN0aW9uKGFycmF5cyhkZXN0aW5hdGlvbiksIGFycmF5cyhzb3VyY2UpKTtcclxuICAgICAgICAgICAgY29tYmluZSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgICAgIHNvdXJjZVtrZXldID0gXy51bmlvbihkZXN0aW5hdGlvbltrZXldLCBzb3VyY2Vba2V5XSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc291cmNlW2tleV07XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IHNoYXJlZEFycmF5S2V5cy5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcclxuICAgICAgICAgICAgICAgIHNoYXJlZEFycmF5S2V5ID0gc2hhcmVkQXJyYXlLZXlzW19qXTtcclxuICAgICAgICAgICAgICAgIGNvbWJpbmUoc2hhcmVkQXJyYXlLZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBfLmV4dGVuZChkZXN0aW5hdGlvbiwgc291cmNlKTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgZGVlcEV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGZpbmFsT2JqLCBtYXhEZXB0aCwgb2JqZWN0cywgX2k7XHJcbiAgICAgICAgICAgIG9iamVjdHMgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBfaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxKSA6IChfaSA9IDAsIFtdKTtcclxuICAgICAgICAgICAgbWF4RGVwdGggPSBhcmd1bWVudHNbX2krK107XHJcbiAgICAgICAgICAgIGlmICghXy5pc051bWJlcihtYXhEZXB0aCkpIHtcclxuICAgICAgICAgICAgICAgIG9iamVjdHMucHVzaChtYXhEZXB0aCk7XHJcbiAgICAgICAgICAgICAgICBtYXhEZXB0aCA9IDIwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChvYmplY3RzLmxlbmd0aCA8PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqZWN0c1swXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobWF4RGVwdGggPD0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZXh0ZW5kLmFwcGx5KHRoaXMsIG9iamVjdHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZpbmFsT2JqID0gb2JqZWN0cy5zaGlmdCgpO1xyXG4gICAgICAgICAgICB3aGlsZSAob2JqZWN0cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBmaW5hbE9iaiA9IGRlZXBFeHRlbmRDb3VwbGUoZmluYWxPYmosIGRlZXBDbG9uZShvYmplY3RzLnNoaWZ0KCkpLCBtYXhEZXB0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZpbmFsT2JqO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICBfLm1peGluKHtcclxuICAgICAgICAgICAgZGVlcENsb25lOmRlZXBDbG9uZSxcclxuICAgICAgICAgICAgaXNCYXNpY09iamVjdDppc0Jhc2ljT2JqZWN0LFxyXG4gICAgICAgICAgICBiYXNpY09iamVjdHM6YmFzaWNPYmplY3RzLFxyXG4gICAgICAgICAgICBhcnJheXM6YXJyYXlzLFxyXG4gICAgICAgICAgICBkZWVwRXh0ZW5kOmRlZXBFeHRlbmRcclxuICAgICAgICB9KTtcclxuIiwiLyohXHJcbiAqIGpRdWVyeSBvdXRzaWRlIGV2ZW50cyAtIHYxLjEgLSAzLzE2LzIwMTBcclxuICogaHR0cDovL2JlbmFsbWFuLmNvbS9wcm9qZWN0cy9qcXVlcnktb3V0c2lkZS1ldmVudHMtcGx1Z2luL1xyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAgXCJDb3dib3lcIiBCZW4gQWxtYW5cclxuICogRHVhbCBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgbGljZW5zZXMuXHJcbiAqIGh0dHA6Ly9iZW5hbG1hbi5jb20vYWJvdXQvbGljZW5zZS9cclxuICovXHJcblxyXG4vLyBTY3JpcHQ6IGpRdWVyeSBvdXRzaWRlIGV2ZW50c1xyXG4vL1xyXG4vLyAqVmVyc2lvbjogMS4xLCBMYXN0IHVwZGF0ZWQ6IDMvMTYvMjAxMCpcclxuLy9cclxuLy8gUHJvamVjdCBIb21lIC0gaHR0cDovL2JlbmFsbWFuLmNvbS9wcm9qZWN0cy9qcXVlcnktb3V0c2lkZS1ldmVudHMtcGx1Z2luL1xyXG4vLyBHaXRIdWIgICAgICAgLSBodHRwOi8vZ2l0aHViLmNvbS9jb3dib3kvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL1xyXG4vLyBTb3VyY2UgICAgICAgLSBodHRwOi8vZ2l0aHViLmNvbS9jb3dib3kvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL3Jhdy9tYXN0ZXIvanF1ZXJ5LmJhLW91dHNpZGUtZXZlbnRzLmpzXHJcbi8vIChNaW5pZmllZCkgICAtIGh0dHA6Ly9naXRodWIuY29tL2Nvd2JveS9qcXVlcnktb3V0c2lkZS1ldmVudHMvcmF3L21hc3Rlci9qcXVlcnkuYmEtb3V0c2lkZS1ldmVudHMubWluLmpzICgwLjlrYilcclxuLy9cclxuLy8gQWJvdXQ6IExpY2Vuc2VcclxuLy9cclxuLy8gQ29weXJpZ2h0IChjKSAyMDEwIFwiQ293Ym95XCIgQmVuIEFsbWFuLFxyXG4vLyBEdWFsIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCBsaWNlbnNlcy5cclxuLy8gaHR0cDovL2JlbmFsbWFuLmNvbS9hYm91dC9saWNlbnNlL1xyXG4vL1xyXG4vLyBBYm91dDogRXhhbXBsZXNcclxuLy9cclxuLy8gVGhlc2Ugd29ya2luZyBleGFtcGxlcywgY29tcGxldGUgd2l0aCBmdWxseSBjb21tZW50ZWQgY29kZSwgaWxsdXN0cmF0ZSBhIGZld1xyXG4vLyB3YXlzIGluIHdoaWNoIHRoaXMgcGx1Z2luIGNhbiBiZSB1c2VkLlxyXG4vL1xyXG4vLyBjbGlja291dHNpZGUgLSBodHRwOi8vYmVuYWxtYW4uY29tL2NvZGUvcHJvamVjdHMvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL2V4YW1wbGVzL2NsaWNrb3V0c2lkZS9cclxuLy8gZGJsY2xpY2tvdXRzaWRlIC0gaHR0cDovL2JlbmFsbWFuLmNvbS9jb2RlL3Byb2plY3RzL2pxdWVyeS1vdXRzaWRlLWV2ZW50cy9leGFtcGxlcy9kYmxjbGlja291dHNpZGUvXHJcbi8vIG1vdXNlb3Zlcm91dHNpZGUgLSBodHRwOi8vYmVuYWxtYW4uY29tL2NvZGUvcHJvamVjdHMvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL2V4YW1wbGVzL21vdXNlb3Zlcm91dHNpZGUvXHJcbi8vIGZvY3Vzb3V0c2lkZSAtIGh0dHA6Ly9iZW5hbG1hbi5jb20vY29kZS9wcm9qZWN0cy9qcXVlcnktb3V0c2lkZS1ldmVudHMvZXhhbXBsZXMvZm9jdXNvdXRzaWRlL1xyXG4vL1xyXG4vLyBBYm91dDogU3VwcG9ydCBhbmQgVGVzdGluZ1xyXG4vL1xyXG4vLyBJbmZvcm1hdGlvbiBhYm91dCB3aGF0IHZlcnNpb24gb3IgdmVyc2lvbnMgb2YgalF1ZXJ5IHRoaXMgcGx1Z2luIGhhcyBiZWVuXHJcbi8vIHRlc3RlZCB3aXRoLCB3aGF0IGJyb3dzZXJzIGl0IGhhcyBiZWVuIHRlc3RlZCBpbiwgYW5kIHdoZXJlIHRoZSB1bml0IHRlc3RzXHJcbi8vIHJlc2lkZSAoc28geW91IGNhbiB0ZXN0IGl0IHlvdXJzZWxmKS5cclxuLy9cclxuLy8galF1ZXJ5IFZlcnNpb25zIC0gMS40LjJcclxuLy8gQnJvd3NlcnMgVGVzdGVkIC0gSW50ZXJuZXQgRXhwbG9yZXIgNi04LCBGaXJlZm94IDItMy42LCBTYWZhcmkgMy00LCBDaHJvbWUsIE9wZXJhIDkuNi0xMC4xLlxyXG4vLyBVbml0IFRlc3RzICAgICAgLSBodHRwOi8vYmVuYWxtYW4uY29tL2NvZGUvcHJvamVjdHMvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL3VuaXQvXHJcbi8vXHJcbi8vIEFib3V0OiBSZWxlYXNlIEhpc3RvcnlcclxuLy9cclxuLy8gMS4xIC0gKDMvMTYvMjAxMCkgTWFkZSBcImNsaWNrb3V0c2lkZVwiIHBsdWdpbiBtb3JlIGdlbmVyYWwsIHJlc3VsdGluZyBpbiBhXHJcbi8vICAgICAgIHdob2xlIG5ldyBwbHVnaW4gd2l0aCBtb3JlIHRoYW4gYSBkb3plbiBkZWZhdWx0IFwib3V0c2lkZVwiIGV2ZW50cyBhbmRcclxuLy8gICAgICAgYSBtZXRob2QgdGhhdCBjYW4gYmUgdXNlZCB0byBhZGQgbmV3IG9uZXMuXHJcbi8vIDEuMCAtICgyLzI3LzIwMTApIEluaXRpYWwgcmVsZWFzZVxyXG4vL1xyXG4vLyBUb3BpYzogRGVmYXVsdCBcIm91dHNpZGVcIiBldmVudHNcclxuLy9cclxuLy8gTm90ZSB0aGF0IGVhY2ggXCJvdXRzaWRlXCIgZXZlbnQgaXMgcG93ZXJlZCBieSBhbiBcIm9yaWdpbmF0aW5nXCIgZXZlbnQuIE9ubHlcclxuLy8gd2hlbiB0aGUgb3JpZ2luYXRpbmcgZXZlbnQgaXMgdHJpZ2dlcmVkIG9uIGFuIGVsZW1lbnQgb3V0c2lkZSB0aGUgZWxlbWVudFxyXG4vLyB0byB3aGljaCB0aGF0IG91dHNpZGUgZXZlbnQgaXMgYm91bmQgd2lsbCB0aGUgYm91bmQgZXZlbnQgYmUgdHJpZ2dlcmVkLlxyXG4vL1xyXG4vLyBCZWNhdXNlIGVhY2ggb3V0c2lkZSBldmVudCBpcyBwb3dlcmVkIGJ5IGEgc2VwYXJhdGUgb3JpZ2luYXRpbmcgZXZlbnQsXHJcbi8vIHN0b3BwaW5nIHByb3BhZ2F0aW9uIG9mIHRoYXQgb3JpZ2luYXRpbmcgZXZlbnQgd2lsbCBwcmV2ZW50IGl0cyByZWxhdGVkXHJcbi8vIG91dHNpZGUgZXZlbnQgZnJvbSB0cmlnZ2VyaW5nLlxyXG4vL1xyXG4vLyAgT1VUU0lERSBFVkVOVCAgICAgLSBPUklHSU5BVElORyBFVkVOVFxyXG4vLyAgY2xpY2tvdXRzaWRlICAgICAgLSBjbGlja1xyXG4vLyAgZGJsY2xpY2tvdXRzaWRlICAgLSBkYmxjbGlja1xyXG4vLyAgZm9jdXNvdXRzaWRlICAgICAgLSBmb2N1c2luXHJcbi8vICBibHVyb3V0c2lkZSAgICAgICAtIGZvY3Vzb3V0XHJcbi8vICBtb3VzZW1vdmVvdXRzaWRlICAtIG1vdXNlbW92ZVxyXG4vLyAgbW91c2Vkb3dub3V0c2lkZSAgLSBtb3VzZWRvd25cclxuLy8gIG1vdXNldXBvdXRzaWRlICAgIC0gbW91c2V1cFxyXG4vLyAgbW91c2VvdmVyb3V0c2lkZSAgLSBtb3VzZW92ZXJcclxuLy8gIG1vdXNlb3V0b3V0c2lkZSAgIC0gbW91c2VvdXRcclxuLy8gIGtleWRvd25vdXRzaWRlICAgIC0ga2V5ZG93blxyXG4vLyAga2V5cHJlc3NvdXRzaWRlICAgLSBrZXlwcmVzc1xyXG4vLyAga2V5dXBvdXRzaWRlICAgICAgLSBrZXl1cFxyXG4vLyAgY2hhbmdlb3V0c2lkZSAgICAgLSBjaGFuZ2VcclxuLy8gIHNlbGVjdG91dHNpZGUgICAgIC0gc2VsZWN0XHJcbi8vICBzdWJtaXRvdXRzaWRlICAgICAtIHN1Ym1pdFxyXG5cclxuXHJcbnZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbihmdW5jdGlvbigkLGRvYyxvdXRzaWRlKXtcclxuICAnJDpub211bmdlJzsgLy8gVXNlZCBieSBZVUkgY29tcHJlc3Nvci5cclxuXHJcbiAgJC5tYXAoXHJcbiAgICAvLyBBbGwgdGhlc2UgZXZlbnRzIHdpbGwgZ2V0IGFuIFwib3V0c2lkZVwiIGV2ZW50IGNvdW50ZXJwYXJ0IGJ5IGRlZmF1bHQuXHJcbiAgICAnY2xpY2sgZGJsY2xpY2sgbW91c2Vtb3ZlIG1vdXNlZG93biBtb3VzZXVwIG1vdXNlb3ZlciBtb3VzZW91dCBjaGFuZ2Ugc2VsZWN0IHN1Ym1pdCBrZXlkb3duIGtleXByZXNzIGtleXVwJy5zcGxpdCgnICcpLFxyXG4gICAgZnVuY3Rpb24oIGV2ZW50X25hbWUgKSB7IGpxX2FkZE91dHNpZGVFdmVudCggZXZlbnRfbmFtZSApOyB9XHJcbiAgKTtcclxuXHJcbiAgLy8gVGhlIGZvY3VzIGFuZCBibHVyIGV2ZW50cyBhcmUgcmVhbGx5IGZvY3VzaW4gYW5kIGZvY3Vzb3V0IHdoZW4gaXQgY29tZXNcclxuICAvLyB0byBkZWxlZ2F0aW9uLCBzbyB0aGV5IGFyZSBhIHNwZWNpYWwgY2FzZS5cclxuICBqcV9hZGRPdXRzaWRlRXZlbnQoICdmb2N1c2luJywgICdmb2N1cycgKyBvdXRzaWRlICk7XHJcbiAganFfYWRkT3V0c2lkZUV2ZW50KCAnZm9jdXNvdXQnLCAnYmx1cicgKyBvdXRzaWRlICk7XHJcblxyXG4gIC8vIE1ldGhvZDogalF1ZXJ5LmFkZE91dHNpZGVFdmVudFxyXG4gIC8vXHJcbiAgLy8gUmVnaXN0ZXIgYSBuZXcgXCJvdXRzaWRlXCIgZXZlbnQgdG8gYmUgd2l0aCB0aGlzIG1ldGhvZC4gQWRkaW5nIGFuIG91dHNpZGVcclxuICAvLyBldmVudCB0aGF0IGFscmVhZHkgZXhpc3RzIHdpbGwgcHJvYmFibHkgYmxvdyB0aGluZ3MgdXAsIHNvIGNoZWNrIHRoZVxyXG4gIC8vIDxEZWZhdWx0IFwib3V0c2lkZVwiIGV2ZW50cz4gbGlzdCBiZWZvcmUgdHJ5aW5nIHRvIGFkZCBhIG5ldyBvbmUuXHJcbiAgLy9cclxuICAvLyBVc2FnZTpcclxuICAvL1xyXG4gIC8vID4galF1ZXJ5LmFkZE91dHNpZGVFdmVudCggZXZlbnRfbmFtZSBbLCBvdXRzaWRlX2V2ZW50X25hbWUgXSApO1xyXG4gIC8vXHJcbiAgLy8gQXJndW1lbnRzOlxyXG4gIC8vXHJcbiAgLy8gIGV2ZW50X25hbWUgLSAoU3RyaW5nKSBUaGUgbmFtZSBvZiB0aGUgb3JpZ2luYXRpbmcgZXZlbnQgdGhhdCB0aGUgbmV3XHJcbiAgLy8gICAgXCJvdXRzaWRlXCIgZXZlbnQgd2lsbCBiZSBwb3dlcmVkIGJ5LiBUaGlzIGV2ZW50IGNhbiBiZSBhIG5hdGl2ZSBvclxyXG4gIC8vICAgIGN1c3RvbSBldmVudCwgYXMgbG9uZyBhcyBpdCBidWJibGVzIHVwIHRoZSBET00gdHJlZS5cclxuICAvLyAgb3V0c2lkZV9ldmVudF9uYW1lIC0gKFN0cmluZykgQW4gb3B0aW9uYWwgbmFtZSBmb3IgdGhlIG5ldyBcIm91dHNpZGVcIlxyXG4gIC8vICAgIGV2ZW50LiBJZiBvbWl0dGVkLCB0aGUgb3V0c2lkZSBldmVudCB3aWxsIGJlIG5hbWVkIHdoYXRldmVyIHRoZVxyXG4gIC8vICAgIHZhbHVlIG9mIGBldmVudF9uYW1lYCBpcyBwbHVzIHRoZSBcIm91dHNpZGVcIiBzdWZmaXguXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zOlxyXG4gIC8vXHJcbiAgLy8gIE5vdGhpbmcuXHJcblxyXG4gICQuYWRkT3V0c2lkZUV2ZW50ID0ganFfYWRkT3V0c2lkZUV2ZW50O1xyXG5cclxuICBmdW5jdGlvbiBqcV9hZGRPdXRzaWRlRXZlbnQoIGV2ZW50X25hbWUsIG91dHNpZGVfZXZlbnRfbmFtZSApIHtcclxuXHJcbiAgICAvLyBUaGUgXCJvdXRzaWRlXCIgZXZlbnQgbmFtZS5cclxuICAgIG91dHNpZGVfZXZlbnRfbmFtZSA9IG91dHNpZGVfZXZlbnRfbmFtZSB8fCBldmVudF9uYW1lICsgb3V0c2lkZTtcclxuXHJcbiAgICAvLyBBIGpRdWVyeSBvYmplY3QgY29udGFpbmluZyBhbGwgZWxlbWVudHMgdG8gd2hpY2ggdGhlIFwib3V0c2lkZVwiIGV2ZW50IGlzXHJcbiAgICAvLyBib3VuZC5cclxuICAgIHZhciBlbGVtcyA9ICQoKSxcclxuXHJcbiAgICAgIC8vIFRoZSBcIm9yaWdpbmF0aW5nXCIgZXZlbnQsIG5hbWVzcGFjZWQgZm9yIGVhc3kgdW5iaW5kaW5nLlxyXG4gICAgICBldmVudF9uYW1lc3BhY2VkID0gZXZlbnRfbmFtZSArICcuJyArIG91dHNpZGVfZXZlbnRfbmFtZSArICctc3BlY2lhbC1ldmVudCc7XHJcblxyXG4gICAgLy8gRXZlbnQ6IG91dHNpZGUgZXZlbnRzXHJcbiAgICAvL1xyXG4gICAgLy8gQW4gXCJvdXRzaWRlXCIgZXZlbnQgaXMgdHJpZ2dlcmVkIG9uIGFuIGVsZW1lbnQgd2hlbiBpdHMgY29ycmVzcG9uZGluZ1xyXG4gICAgLy8gXCJvcmlnaW5hdGluZ1wiIGV2ZW50IGlzIHRyaWdnZXJlZCBvbiBhbiBlbGVtZW50IG91dHNpZGUgdGhlIGVsZW1lbnQgaW5cclxuICAgIC8vIHF1ZXN0aW9uLiBTZWUgdGhlIDxEZWZhdWx0IFwib3V0c2lkZVwiIGV2ZW50cz4gbGlzdCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgIC8vXHJcbiAgICAvLyBVc2FnZTpcclxuICAgIC8vXHJcbiAgICAvLyA+IGpRdWVyeSgnc2VsZWN0b3InKS5iaW5kKCAnY2xpY2tvdXRzaWRlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIC8vID4gICB2YXIgY2xpY2tlZF9lbGVtID0gJChldmVudC50YXJnZXQpO1xyXG4gICAgLy8gPiAgIC4uLlxyXG4gICAgLy8gPiB9KTtcclxuICAgIC8vXHJcbiAgICAvLyA+IGpRdWVyeSgnc2VsZWN0b3InKS5iaW5kKCAnZGJsY2xpY2tvdXRzaWRlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIC8vID4gICB2YXIgZG91YmxlX2NsaWNrZWRfZWxlbSA9ICQoZXZlbnQudGFyZ2V0KTtcclxuICAgIC8vID4gICAuLi5cclxuICAgIC8vID4gfSk7XHJcbiAgICAvL1xyXG4gICAgLy8gPiBqUXVlcnkoJ3NlbGVjdG9yJykuYmluZCggJ21vdXNlb3Zlcm91dHNpZGUnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgLy8gPiAgIHZhciBtb3VzZWRfb3Zlcl9lbGVtID0gJChldmVudC50YXJnZXQpO1xyXG4gICAgLy8gPiAgIC4uLlxyXG4gICAgLy8gPiB9KTtcclxuICAgIC8vXHJcbiAgICAvLyA+IGpRdWVyeSgnc2VsZWN0b3InKS5iaW5kKCAnZm9jdXNvdXRzaWRlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIC8vID4gICB2YXIgZm9jdXNlZF9lbGVtID0gJChldmVudC50YXJnZXQpO1xyXG4gICAgLy8gPiAgIC4uLlxyXG4gICAgLy8gPiB9KTtcclxuICAgIC8vXHJcbiAgICAvLyBZb3UgZ2V0IHRoZSBpZGVhLCByaWdodD9cclxuXHJcbiAgICAkLmV2ZW50LnNwZWNpYWxbIG91dHNpZGVfZXZlbnRfbmFtZSBdID0ge1xyXG5cclxuICAgICAgLy8gQ2FsbGVkIG9ubHkgd2hlbiB0aGUgZmlyc3QgXCJvdXRzaWRlXCIgZXZlbnQgY2FsbGJhY2sgaXMgYm91bmQgcGVyXHJcbiAgICAgIC8vIGVsZW1lbnQuXHJcbiAgICAgIHNldHVwOiBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAvLyBBZGQgdGhpcyBlbGVtZW50IHRvIHRoZSBsaXN0IG9mIGVsZW1lbnRzIHRvIHdoaWNoIHRoaXMgXCJvdXRzaWRlXCJcclxuICAgICAgICAvLyBldmVudCBpcyBib3VuZC5cclxuICAgICAgICBlbGVtcyA9IGVsZW1zLmFkZCggdGhpcyApO1xyXG5cclxuICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBlbGVtZW50IGdldHRpbmcgdGhlIGV2ZW50IGJvdW5kLCBiaW5kIGEgaGFuZGxlclxyXG4gICAgICAgIC8vIHRvIGRvY3VtZW50IHRvIGNhdGNoIGFsbCBjb3JyZXNwb25kaW5nIFwib3JpZ2luYXRpbmdcIiBldmVudHMuXHJcbiAgICAgICAgaWYgKCBlbGVtcy5sZW5ndGggPT09IDEgKSB7XHJcbiAgICAgICAgICAkKGRvYykuYmluZCggZXZlbnRfbmFtZXNwYWNlZCwgaGFuZGxlX2V2ZW50ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gQ2FsbGVkIG9ubHkgd2hlbiB0aGUgbGFzdCBcIm91dHNpZGVcIiBldmVudCBjYWxsYmFjayBpcyB1bmJvdW5kIHBlclxyXG4gICAgICAvLyBlbGVtZW50LlxyXG4gICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHRoaXMgZWxlbWVudCBmcm9tIHRoZSBsaXN0IG9mIGVsZW1lbnRzIHRvIHdoaWNoIHRoaXNcclxuICAgICAgICAvLyBcIm91dHNpZGVcIiBldmVudCBpcyBib3VuZC5cclxuICAgICAgICBlbGVtcyA9IGVsZW1zLm5vdCggdGhpcyApO1xyXG5cclxuICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IGVsZW1lbnQgcmVtb3ZlZCwgcmVtb3ZlIHRoZSBcIm9yaWdpbmF0aW5nXCIgZXZlbnRcclxuICAgICAgICAvLyBoYW5kbGVyIG9uIGRvY3VtZW50IHRoYXQgcG93ZXJzIHRoaXMgXCJvdXRzaWRlXCIgZXZlbnQuXHJcbiAgICAgICAgaWYgKCBlbGVtcy5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgICAkKGRvYykudW5iaW5kKCBldmVudF9uYW1lc3BhY2VkICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gQ2FsbGVkIGV2ZXJ5IHRpbWUgYSBcIm91dHNpZGVcIiBldmVudCBjYWxsYmFjayBpcyBib3VuZCB0byBhbiBlbGVtZW50LlxyXG4gICAgICBhZGQ6IGZ1bmN0aW9uKCBoYW5kbGVPYmogKSB7XHJcbiAgICAgICAgdmFyIG9sZF9oYW5kbGVyID0gaGFuZGxlT2JqLmhhbmRsZXI7XHJcblxyXG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZXZlcnkgdGltZSB0aGUgZXZlbnQgaXMgdHJpZ2dlcmVkLiBUaGlzIGlzXHJcbiAgICAgICAgLy8gdXNlZCB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBldmVudC50YXJnZXQgcmVmZXJlbmNlIHdpdGggb25lIHRoYXQgaXNcclxuICAgICAgICAvLyBtb3JlIHVzZWZ1bC5cclxuICAgICAgICBoYW5kbGVPYmouaGFuZGxlciA9IGZ1bmN0aW9uKCBldmVudCwgZWxlbSApIHtcclxuXHJcbiAgICAgICAgICAvLyBTZXQgdGhlIGV2ZW50IG9iamVjdCdzIC50YXJnZXQgcHJvcGVydHkgdG8gdGhlIGVsZW1lbnQgdGhhdCB0aGVcclxuICAgICAgICAgIC8vIHVzZXIgaW50ZXJhY3RlZCB3aXRoLCBub3QgdGhlIGVsZW1lbnQgdGhhdCB0aGUgXCJvdXRzaWRlXCIgZXZlbnQgd2FzXHJcbiAgICAgICAgICAvLyB3YXMgdHJpZ2dlcmVkIG9uLlxyXG4gICAgICAgICAgZXZlbnQudGFyZ2V0ID0gZWxlbTtcclxuXHJcbiAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBhY3R1YWwgYm91bmQgaGFuZGxlci5cclxuICAgICAgICAgIG9sZF9oYW5kbGVyLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFdoZW4gdGhlIFwib3JpZ2luYXRpbmdcIiBldmVudCBpcyB0cmlnZ2VyZWQuLlxyXG4gICAgZnVuY3Rpb24gaGFuZGxlX2V2ZW50KCBldmVudCApIHtcclxuXHJcbiAgICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgZWxlbWVudHMgdG8gd2hpY2ggdGhpcyBcIm91dHNpZGVcIiBldmVudCBpcyBib3VuZC5cclxuICAgICAgJChlbGVtcykuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBlbGVtID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhpcyBlbGVtZW50IGlzbid0IHRoZSBlbGVtZW50IG9uIHdoaWNoIHRoZSBldmVudCB3YXMgdHJpZ2dlcmVkLFxyXG4gICAgICAgIC8vIGFuZCB0aGlzIGVsZW1lbnQgZG9lc24ndCBjb250YWluIHNhaWQgZWxlbWVudCwgdGhlbiBzYWlkIGVsZW1lbnQgaXNcclxuICAgICAgICAvLyBjb25zaWRlcmVkIHRvIGJlIG91dHNpZGUsIGFuZCB0aGUgXCJvdXRzaWRlXCIgZXZlbnQgd2lsbCBiZSB0cmlnZ2VyZWQhXHJcbiAgICAgICAgaWYgKCB0aGlzICE9PSBldmVudC50YXJnZXQgJiYgIWVsZW0uaGFzKGV2ZW50LnRhcmdldCkubGVuZ3RoICkge1xyXG5cclxuICAgICAgICAgIC8vIFVzZSB0cmlnZ2VySGFuZGxlciBpbnN0ZWFkIG9mIHRyaWdnZXIgc28gdGhhdCB0aGUgXCJvdXRzaWRlXCIgZXZlbnRcclxuICAgICAgICAgIC8vIGRvZXNuJ3QgYnViYmxlLiBQYXNzIGluIHRoZSBcIm9yaWdpbmF0aW5nXCIgZXZlbnQncyAudGFyZ2V0IHNvIHRoYXRcclxuICAgICAgICAgIC8vIHRoZSBcIm91dHNpZGVcIiBldmVudC50YXJnZXQgY2FuIGJlIG92ZXJyaWRkZW4gd2l0aCBzb21ldGhpbmcgbW9yZVxyXG4gICAgICAgICAgLy8gbWVhbmluZ2Z1bC5cclxuICAgICAgICAgIGVsZW0udHJpZ2dlckhhbmRsZXIoIG91dHNpZGVfZXZlbnRfbmFtZSwgWyBldmVudC50YXJnZXQgXSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbn0pKGpRdWVyeSxkb2N1bWVudCxcIm91dHNpZGVcIik7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuKGZ1bmN0aW9uICgkLCB3aW5kb3csIGRvY3VtZW50KSB7XHJcblxyXG4gICAgJC5mbi50b2dnbGVCbG9jayA9IGZ1bmN0aW9uKHNob3cpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jc3MoXCJkaXNwbGF5XCIsIHNob3cgPyBcImJsb2NrXCIgOiBcIm5vbmVcIik7XHJcblxyXG4gICAgfTtcclxufSkoalF1ZXJ5LCB3aW5kb3csIGRvY3VtZW50KTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgZHJvcGRvd25EaXNwbGF5ZXIgPSAoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICQoJ2JvZHknKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICQoJy5kcm9wZG93bi1zbGlkZXInKS5oaWRlKCk7XHJcbiAgICAgICAgJChcIi5jbGlja2VkXCIpLnJlbW92ZUNsYXNzKFwiY2xpY2tlZFwiKTtcclxuICAgIH0pO1xyXG5cclxuICAgICQoXCJib2R5XCIpLm9uKFwiY2xpY2tcIiwgXCIuYnV0dG9uLmRyb3Bkb3duXCIsIGZ1bmN0aW9uIChldikge1xyXG5cclxuICAgICAgICBpZiAoISQodGhpcykuaGFzQ2xhc3MoJ2NsaWNrZWQnKSkge1xyXG4gICAgICAgICAgICAkKCcuZHJvcGRvd24tc2xpZGVyJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAkKFwiLmNsaWNrZWRcIikucmVtb3ZlQ2xhc3MoXCJjbGlja2VkXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmVudEZsb2F0ID0gJCh0aGlzKS5wYXJlbnQoKS5jc3MoXCJmbG9hdFwiKTtcclxuICAgICAgICB2YXIgZGRzSWQgPSBnZXREcm9wRG93blNsaWRlcklkKCQodGhpcykpO1xyXG5cclxuICAgICAgICBpZihwYXJlbnRGbG9hdCA9PT0gXCJyaWdodFwiKXtcclxuICAgICAgICAgICAgJCgnLmRyb3Bkb3duLXNsaWRlci4nICsgZGRzSWQpLmNzcyhcInJpZ2h0XCIsICQodGhpcykucG9zaXRpb24oKS5yaWdodCk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICQoJy5kcm9wZG93bi1zbGlkZXIuJyArIGRkc0lkKS5jc3MoXCJsZWZ0XCIsICQodGhpcykucG9zaXRpb24oKS5sZWZ0KTsgLy8gLSA1XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkKCcuZHJvcGRvd24tc2xpZGVyLicgKyBkZHNJZCkudG9nZ2xlKCk7XHJcbiAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnY2xpY2tlZCcpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgZ2V0RHJvcERvd25TbGlkZXJJZCA9IGZ1bmN0aW9uIChidG4pIHtcclxuXHJcbiAgICAgICAgdmFyIGRkc0lkID0gJyc7XHJcbiAgICAgICAgdmFyIGNsYXNzTGlzdCA9IGJ0bi5hdHRyKCdjbGFzcycpLnNwbGl0KC9cXHMrLyk7XHJcblxyXG4gICAgICAgICQuZWFjaChjbGFzc0xpc3QsIGZ1bmN0aW9uIChpbmRleCwgaXRlbSkge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5pbmRleE9mKCdkZHNJZF8nKSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZGRzSWQgPSBpdGVtLnJlcGxhY2UoJ2Rkc0lkXycsICcnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBkZHNJZDtcclxuICAgIH07XHJcbn0oKSk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEZvcm1hdHRlciA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIGZvcm1hdEFkZHJlc3NlcyA9IGZ1bmN0aW9uICh0aXRsZXMpIHtcclxuXHJcbiAgICAgICAgdmFyIHJlcyA9IFwiXCI7XHJcblxyXG4gICAgICAgIHRpdGxlcyA9IHRpdGxlcyB8fCBbXTtcclxuXHJcbiAgICAgICAgaWYgKHRpdGxlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRpdGxlc1swXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXy5lYWNoKHRpdGxlcywgZnVuY3Rpb24gKHRpdGxlKSB7XHJcbiAgICAgICAgICAgIHJlcyArPSBfcy5zdHJMZWZ0QmFjayh0aXRsZSwgXCIgXCIpICsgXCIsIFwiO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gX3Muc3RyTGVmdEJhY2socmVzLCBcIixcIik7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHZhciBmb3JtYXRTaG9ydERhdGUgPSBmdW5jdGlvbiAodGlja3MsdHJhbnNsYXRvcikge1xyXG5cclxuICAgICAgICBpZiAoXy5pc0Zpbml0ZSh0aWNrcykpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHBhcnNlSW50KHRpY2tzLCAxMCkpO1xyXG4gICAgICAgICAgICB2YXIgdGltZURpZmYgPSBNYXRoLmFicyhub3cuZ2V0VGltZSgpIC0gZGF0ZS5nZXRUaW1lKCkpO1xyXG4gICAgICAgICAgICB2YXIgZGlmZkRheXMgPSBNYXRoLmNlaWwodGltZURpZmYgLyAoMTAwMCAqIDM2MDAgKiAyNCkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRpZmZEYXlzID4gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zbGF0b3IudHJhbnNsYXRlKFwibWFpbDp0aW1lcmFuZ2UubW9udGhzLlwiICsgZGF0ZS5nZXRNb250aCgpKSArIFwiIFwiICsgZGF0ZS5nZXREYXkoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBob3VycyA9IGRhdGUuZ2V0SG91cnMoKTtcclxuICAgICAgICAgICAgICAgIHZhciBtaW51dGVzID0gZGF0ZS5nZXRNaW51dGVzKCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgYW1wbSA9IGhvdXJzID49IDEyID8gJ3BtJyA6ICdhbSc7XHJcblxyXG4gICAgICAgICAgICAgICAgaG91cnMgPSBob3VycyAlIDEyO1xyXG4gICAgICAgICAgICAgICAgaG91cnMgPSBob3VycyA/IGhvdXJzIDogMTI7IC8vIHRoZSBob3VyICcwJyBzaG91bGQgYmUgJzEyJ1xyXG4gICAgICAgICAgICAgICAgbWludXRlcyA9IG1pbnV0ZXMgPCAxMCA/ICcwJyArIG1pbnV0ZXMgOiBtaW51dGVzO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBob3VycyArICc6JyArIG1pbnV0ZXMgKyAnICcgKyBhbXBtO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgZm9ybWF0U3ViamVjdCA9IGZ1bmN0aW9uIChzdWJqZWN0LHRyYW5zbGF0b3IpIHtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNFbXB0eShzdWJqZWN0KSkge1xyXG4gICAgICAgICAgICBzdWJqZWN0ID0gXCIoXCIgKyB0cmFuc2xhdG9yLnRyYW5zbGF0ZShcIm1haWw6bm9zdWJqZWN0XCIpICsgXCIpXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzdWJqZWN0O1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgZm9ybWF0Q29udGVudCA9IGZ1bmN0aW9uIChjb250ZW50KSB7XHJcblxyXG4gICAgICAgIGlmICghXy5pc0VtcHR5KGNvbnRlbnQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250ZW50LnJlcGxhY2UoLyg8KFtePl0rKT4pL2lnLCBcIiBcIikucmVwbGFjZSgvJm5ic3A7L2lnLCBcIiBcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGZvcm1hdFN1YmplY3Q6IGZvcm1hdFN1YmplY3QsXHJcbiAgICAgICAgZm9ybWF0Q29udGVudDogZm9ybWF0Q29udGVudCxcclxuICAgICAgICBmb3JtYXRTaG9ydERhdGU6IGZvcm1hdFNob3J0RGF0ZSxcclxuICAgICAgICBmb3JtYXRBZGRyZXNzZXM6IGZvcm1hdEFkZHJlc3Nlc1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRm9ybWF0dGVyO1xyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgVHJhbnNsYXRvciA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIGRpY3Rpb25hcnkgPSB7fTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcihcIl9pMThuXCIsIGZ1bmN0aW9uKHRleHQpIHtcclxuICAgICAgICByZXR1cm4gdHJhbnNsYXRlKHRleHQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHZhciB1cGRhdGVEaWN0aW9uYXJ5ID0gZnVuY3Rpb24ob2JqKXtcclxuICAgICAgICAkLmV4dGVuZChkaWN0aW9uYXJ5LCBvYmopO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdmFyIHRyYW5zbGF0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcoa2V5KSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHN1YmtleXMgPSBrZXkuc3BsaXQoXCI6XCIpO1xyXG5cclxuICAgICAgICAgICAgaWYoc3Via2V5cy5sZW5ndGggPT0gMil7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoXy5oYXMoZGljdGlvbmFyeSwgc3Via2V5c1swXSkpe1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGljdGlvbmFyeVtzdWJrZXlzWzBdXVtzdWJrZXlzWzFdXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBkaWN0aW9uYXJ5IDogZGljdGlvbmFyeSxcclxuICAgICAgICB0cmFuc2xhdGUgOiB0cmFuc2xhdGUsXHJcbiAgICAgICAgdXBkYXRlRGljdGlvbmFyeTp1cGRhdGVEaWN0aW9uYXJ5XHJcbiAgICB9O1xyXG5cclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJhbnNsYXRvcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgQmFzZU1vZGVsID0gcmVxdWlyZShcImJhc2UtbW9kZWxcIik7XHJcblxyXG52YXIgU2V0dGluZ3NNb2RlbCA9IEJhc2VNb2RlbC5leHRlbmQoe1xyXG5cclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgbGFuZzogXCJlbi1VU1wiLFxyXG4gICAgICAgIHRoZW1lOiAnZHVzdCcsXHJcbiAgICAgICAgdXNlck5hbWU6ICdkZW1vQG1haWxib25lLmNvbSdcclxuICAgIH0sXHJcblxyXG4gICAgdXJsOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuICdzZXR0aW5ncyc7XHJcbiAgICB9LFxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnNldChcImlkXCIsIF8udW5pcXVlSWQoJ18nKSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXR0aW5nc01vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCdhcHAnKTtcclxudmFyIFNldHRpbmdzID0gcmVxdWlyZShcIi4vc2V0dGluZ3NcIik7XHJcblxyXG52YXIgU2V0dGluZ3NDb250cm9sbGVyID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGFwcC5zZXR0aW5ncyA9IG5ldyBTZXR0aW5ncygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBmZXRjaDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICBhcHAuc2V0dGluZ3MuZmV0Y2goe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiBfLmJpbmQoZnVuY3Rpb24gKG1vZGVsLCByZXNwLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAkLndoZW4odGhpcy5sb2FkVGhlbWUoKSwgdGhpcy5sb2FkRGljdGlvbmFyeSgpKS50aGVuKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwLmNoYW5uZWwudmVudC50cmlnZ2VyKFwib25TZXR0aW5nc0xvYWRlZFwiKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LCB0aGlzKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBsb2FkVGhlbWU6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgdmFyIHRoZW1lID0gYXBwLnNldHRpbmdzLmdldChcInRoZW1lXCIpO1xyXG5cclxuICAgICAgICByZXR1cm4gJC5nZXQoXCJkaXN0L2Nzcy90aGVtZXMvXCIgKyB0aGVtZSArIFwiL1wiICsgdGhlbWUgKyBcIi5jc3NcIiwgZnVuY3Rpb24gKF9jc3MpIHtcclxuXHJcbiAgICAgICAgICAgICQoXCJ0aGVtZS1jc3NcIikucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICQoWyc8c3R5bGUgdHlwZT1cInRleHQvY3NzXCIgaWQ9XCJ0aGVtZS1jc3NcIj4nLCBfY3NzLCAnPC9zdHlsZT4nXS5qb2luKCcnKSkuYXBwZW5kVG8oJ2hlYWQnKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgbG9hZERpY3Rpb25hcnk6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgcmV0dXJuICQuZ2V0SlNPTihcImRpc3QvaTE4bi9cIiArIGFwcC5zZXR0aW5ncy5nZXQoXCJsYW5nXCIpICsgXCIuanNvblwiLCBmdW5jdGlvbiAoaTE4bk9iamVjdCkge1xyXG4gICAgICAgICAgICBhcHAudHJhbnNsYXRvci51cGRhdGVEaWN0aW9uYXJ5KGkxOG5PYmplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NDb250cm9sbGVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCdhcHAnKTtcclxudmFyIGlvID0gcmVxdWlyZSgnc29ja2V0LmlvLWNsaWVudCcpO1xyXG5cclxudmFyIFNvY2tldENvbnRyb2xsZXIgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICBpbml0aWFsaXplOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciBzb2NrZXRVUkkgPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyBcIjpcIiArIFwiODAwMFwiICsgXCIvXCI7XHJcbiAgICAgICAgdGhpcy5fc29ja2V0ID0gaW8uY29ubmVjdChzb2NrZXRVUkkpO1xyXG5cclxuICAgICAgICB0aGlzLl9zb2NrZXQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gdG8gc2VydmVyIGVzdGFibGlzaGVkLicpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX3NvY2tldC5vbignZXJyb3InLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3NvcnJ5LCB3ZSBhcmUgZXhwZXJpZW5jaW5nIHRlY2huaWNhbCBkaWZmaWN1bHRpZXMuJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fc29ja2V0Lm9uKCdkYXRhOmNoYW5nZScsIGZ1bmN0aW9uKG1lc3NhZ2Upe1xyXG4gICAgICAgICAgICBhcHAudmVudC50cmlnZ2VyKFwiZGF0YTpjaGFuZ2VcIiwgbWVzc2FnZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fc29ja2V0Lm9uKCdlcnJvcjEnLCBmdW5jdGlvbihlcnIpe1xyXG4gICAgICAgICAgICBhcHAudmVudC50cmlnZ2VyKCdzb2NrZXQ6ZXJyb3InLCBlcnIpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInVubG9hZFwiLCB0aGlzLl9zb2NrZXQuY2xvc2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGdldFNvY2tldDpmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9zb2NrZXQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgcmVnaXN0ZXJVc2VyOmZ1bmN0aW9uKHVzZXJOYW1lKXtcclxuICAgICAgICB0aGlzLl9zb2NrZXQuZW1pdCgnYWRkLXVzZXInLHVzZXJOYW1lKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvY2tldENvbnRyb2xsZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZU1vZGVsID0gcmVxdWlyZShcIi4vanMvbW9kZWxzL2F1dG9Db21wbGV0ZU1vZGVsXCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlSXRlbVZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy9hdXRvQ29tcGxldGVJdGVtVmlld1wiKTtcclxudmFyIEF1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy9hdXRvQ29tcGxldGVDb21wb3NpdGVWaWV3XCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCIuL2pzL2NvbGxlY3Rpb25zL2F1dG9Db21wbGV0ZUNvbGxlY3Rpb25cIik7XHJcbnZhciBGaWx0ZXJDb2xsZWN0aW9uRGVjb3JhdG9yID0gcmVxdWlyZShcImRlY29yYXRvcnMvRmlsdGVyQ29sbGVjdGlvbkRlY29yYXRvclwiKTtcclxuXHJcbnZhciBBdXRvQ29tcGxldGUgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLmVsID0gb3B0aW9ucy5lbDtcclxuICAgICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XHJcbiAgICAgICAgdGhpcy5tYXhJdGVtcyA9IG9wdGlvbnMubWF4SXRlbXMgfHwgNTtcclxuICAgICAgICB0aGlzLmZpbHRlck1vZGVsID0gb3B0aW9ucy5maWx0ZXJNb2RlbDtcclxuICAgICAgICB0aGlzLmNvbGxlY3Rpb24gPSBuZXcgRmlsdGVyQ29sbGVjdGlvbkRlY29yYXRvcihuZXcgQXV0b0NvbXBsZXRlQ29sbGVjdGlvbihvcHRpb25zLml0ZW1zIHx8IFtdKSwgdGhpcy5maWx0ZXJNb2RlbCk7XHJcblxyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCAnaW5wdXQ6Y2hhbmdlJywgdGhpcy5vbklucHV0Q2hhbmdlLCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBvbkZpbHRlckNoYW5nZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25JbnB1dENoYW5nZTogZnVuY3Rpb24gKGlucHV0LCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICBpZiAoXy5pc0VtcHR5KGlucHV0KSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24uZmlsdGVyQWxsKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5maWx0ZXJNb2RlbC5zZXRJbnB1dChpbnB1dCk7XHJcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5maWx0ZXJCeSh7XHJcbiAgICAgICAgICAgICAgICBtYXhJdGVtczogdGhpcy5tYXhJdGVtcyxcclxuICAgICAgICAgICAgICAgIG1hbmRhdG9yeUl0ZW1zOiBvcHRpb25zLmFkZFNlYXJjaEtleSA/IFtuZXcgQXV0b0NvbXBsZXRlTW9kZWwoe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGlucHV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBBdXRvQ29tcGxldGUuVFlQRVMuU0VBUkNIXHJcbiAgICAgICAgICAgICAgICB9KV0gOiBbXVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gc2hvd1xyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2hvdzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbi5maWx0ZXJBbGwoKTtcclxuXHJcbiAgICAgICAgdGhpcy5hdXRvQ29tcGxldGVUYWJsZVZpZXcgPSBuZXcgQXV0b0NvbXBsZXRlQ29tcG9zaXRlVmlldyh7XHJcbiAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudCxcclxuICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy5jb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICBlbDogdGhpcy5lbFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlVGFibGVWaWV3LnJlbmRlcigpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbkF1dG9Db21wbGV0ZS5UWVBFUyA9IEF1dG9Db21wbGV0ZUl0ZW1WaWV3LlRZUEVTO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGU7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVNb2RlbCA9IHJlcXVpcmUoXCIuLi9tb2RlbHMvYXV0b0NvbXBsZXRlTW9kZWxcIik7XHJcblxyXG52YXIgQXV0b0NvbXBsZXRlQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcclxuXHJcbiAgICBtb2RlbDogQXV0b0NvbXBsZXRlTW9kZWxcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9Db21wbGV0ZUNvbGxlY3Rpb247XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZU1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHtcclxuXHJcbiAgICBkZWZhdWx0OiB7XHJcbiAgICAgICAgdGV4dDogXCJcIixcclxuICAgICAgICB2YWx1ZTogXCJcIlxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxcXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9iaiwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICBpZiAoXy5pc1N0cmluZyhvYmoudGV4dCkpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXQoXCJ0ZXh0XCIsIG9iai50ZXh0LnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXy5pc1N0cmluZyhvYmoudmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KFwidmFsdWVcIiwgb2JqLnZhbHVlLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gQXV0b0NvbXBsZXRlTW9kZWw7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIi4uLy4uL3VpL3RlbXBsYXRlcy9hdXRvQ29tcGxldGUuaGJzXCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlSXRlbVZpZXcgPSByZXF1aXJlKFwiLi9hdXRvQ29tcGxldGVJdGVtVmlld1wiKTtcclxuXHJcbnZhciBLZXlDb2RlID0ge1xyXG4gICAgRU5URVI6IDEzLFxyXG4gICAgQVJST1dfVVA6IDM4LFxyXG4gICAgQVJST1dfRE9XTjogNDBcclxufTtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVDb21wb3NpdGVWaWV3ID0gTWFyaW9uZXR0ZS5Db21wb3NpdGVWaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgY2hpbGRWaWV3OiBBdXRvQ29tcGxldGVJdGVtVmlldyxcclxuICAgIGNoaWxkVmlld0NvbnRhaW5lcjogXCIubWVudVwiLFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuXHJcbiAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLmNvbGxlY3Rpb24sIFwiZW1wdHk6Y29sbGVjdGlvblwiLCB0aGlzLmNsb3NlRWwpO1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImF1dG9jb21wbGV0ZTppdGVtOmNsaWNrXCIsIHRoaXMuc2VsZWN0SXRlbSk7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsIFwiYXV0b2NvbXBsZXRlOml0ZW06b3ZlclwiLCB0aGlzLm9uSG92ZXIpO1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImtleTpwcmVzc1wiLCB0aGlzLm9uS2V5UHJlc3MpO1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImNsb3NlQWxsXCIsIHRoaXMuY2xvc2VFbCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBidWlsZENoaWxkVmlldzogZnVuY3Rpb24gKGl0ZW0sIEl0ZW1WaWV3KSB7XHJcblxyXG4gICAgICAgIHZhciB2aWV3ID0gbmV3IEl0ZW1WaWV3KHtcclxuICAgICAgICAgICAgbW9kZWw6IGl0ZW0sXHJcbiAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudCxcclxuICAgICAgICAgICAgZmlsdGVyTW9kZWw6IHRoaXMuY29sbGVjdGlvbi5maWx0ZXJNb2RlbFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuY2xvc2VFbCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uUmVuZGVyQ29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLmNoaWxkQXJyID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uZWFjaChfLmJpbmQoZnVuY3Rpb24gKHZpZXcpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEFyci5wdXNoKHZpZXcpO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZEl0ZW0gPSAwO1xyXG4gICAgICAgIHRoaXMuc2hvd0VsKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGNsb3NlRWw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBfLmRlZmVyKF8uYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gLTE7XHJcbiAgICAgICAgICAgIHRoaXMuJGVsLmhpZGUoKTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNob3dFbDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlKCk7XHJcbiAgICAgICAgdGhpcy4kZWwuc2hvdygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbktleVByZXNzOiBmdW5jdGlvbiAoa2V5KSB7XHJcblxyXG4gICAgICAgIHN3aXRjaCAoa2V5KSB7XHJcbiAgICAgICAgICAgIGNhc2UgS2V5Q29kZS5BUlJPV19VUDpcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gTWF0aC5tYXgoMCwgdGhpcy5zZWxlY3RlZEl0ZW0gLSAxKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBLZXlDb2RlLkFSUk9XX0RPV046XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkSXRlbSA9IE1hdGgubWluKHRoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMSwgdGhpcy5zZWxlY3RlZEl0ZW0gKyAxKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBLZXlDb2RlLkVOVEVSOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RJdGVtKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBzZXRBY3RpdmU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5lYWNoKGZ1bmN0aW9uICh2aWV3KSB7XHJcbiAgICAgICAgICAgIHZpZXcuc2V0QWN0aXZlKGZhbHNlKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIHNlbGVjdGVkVmlldyA9IHRoaXMuY2hpbGRBcnJbdGhpcy5zZWxlY3RlZEl0ZW1dO1xyXG5cclxuICAgICAgICBpZiAoXy5pc09iamVjdChzZWxlY3RlZFZpZXcpKSB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkVmlldy5zZXRBY3RpdmUodHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiYXV0b2NvbXBsZXRlOml0ZW06YWN0aXZlXCIsIHNlbGVjdGVkVmlldy5tb2RlbC5nZXQoXCJ0ZXh0XCIpLCBzZWxlY3RlZFZpZXcubW9kZWwuZ2V0KFwidmFsdWVcIikpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2VsZWN0SXRlbTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgc2VsZWN0ZWRWaWV3ID0gdGhpcy5jaGlsZEFyclt0aGlzLnNlbGVjdGVkSXRlbV07XHJcblxyXG4gICAgICAgIGlmIChfLmlzT2JqZWN0KHNlbGVjdGVkVmlldykpIHtcclxuICAgICAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJhdXRvY29tcGxldGU6aXRlbTpzZWxlY3RlZFwiLCBzZWxlY3RlZFZpZXcubW9kZWwuZ2V0KFwidGV4dFwiKSwgc2VsZWN0ZWRWaWV3Lm1vZGVsLmdldChcInZhbHVlXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jbG9zZUVsKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbkhvdmVyOiBmdW5jdGlvbiAoaXRlbSkge1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRBcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRBcnJbaV0uY2lkID09PSBpdGVtLmNpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEl0ZW0gPSBpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmUoKTtcclxuICAgIH1cclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gQXV0b0NvbXBsZXRlQ29tcG9zaXRlVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwiLi4vLi4vdWkvdGVtcGxhdGVzL2F1dG9Db21wbGV0ZUl0ZW0uaGJzXCIpO1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZUl0ZW1WaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgdGFnTmFtZTogJ2xpJyxcclxuICAgIGNsYXNzTmFtZTogJ2xpX3JvdycsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiLnRpdGxlXCIsXHJcbiAgICAgICAgXCJ0ZXh0XCI6IFwiLnRleHRcIlxyXG4gICAgfSxcclxuXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgICBcIm1vdXNlZW50ZXJcIjogXCJfb25Nb3VzZUVudGVyXCIsXHJcbiAgICAgICAgXCJjbGlja1wiOiBcIl9vbkNsaWNrXCJcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xyXG4gICAgICAgIHRoaXMuZmlsdGVyTW9kZWwgPSBvcHRpb25zLmZpbHRlck1vZGVsO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIHR5cGUgPSB0aGlzLm1vZGVsLmdldChcInR5cGVcIik7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGlzQ29udGFjdDogdHlwZSA9PT0gQXV0b0NvbXBsZXRlSXRlbVZpZXcuVFlQRVMuQ09OVEFDVCxcclxuICAgICAgICAgICAgaXNTZWFyY2g6IHR5cGUgPT09IEF1dG9Db21wbGV0ZUl0ZW1WaWV3LlRZUEVTLlNFQVJDSFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudWkudGl0bGUuaHRtbCh0aGlzLmZpbHRlck1vZGVsLmhpZ2hsaWdodEtleSh0aGlzLm1vZGVsLmdldChcInRleHRcIikpKTtcclxuICAgICAgICB0aGlzLnVpLnRleHQuaHRtbCh0aGlzLmZpbHRlck1vZGVsLmhpZ2hsaWdodEtleSh0aGlzLm1vZGVsLmdldChcInZhbHVlXCIpKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIF9vbk1vdXNlRW50ZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJhdXRvY29tcGxldGU6aXRlbTpvdmVyXCIsIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBfb25DbGljazogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImF1dG9jb21wbGV0ZTppdGVtOmNsaWNrXCIpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBzZXRBY3RpdmU6IGZ1bmN0aW9uIChpc0FjdGl2ZSkge1xyXG4gICAgICAgIHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCdhY3RpdmUnLCBpc0FjdGl2ZSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbkF1dG9Db21wbGV0ZUl0ZW1WaWV3LlRZUEVTID0ge1xyXG4gICAgQ09OVEFDVDogMSxcclxuICAgIFNFQVJDSDogMixcclxuICAgIFJFQ0VOVDogM1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGVJdGVtVmlldztcclxuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwiYXV0b0NvbXBsZXRlIGF1dG9Db21wbGV0ZS1zaXplXFxcIj5cXHJcXG4gICAgPHVsIGNsYXNzPVxcXCJtZW51IGJyb3dzZXItc2Nyb2xsIGxpZ2h0IGRlZmF1bHQtbGlzdFxcXCI+PC91bD5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyLCBvcHRpb25zLCBmdW5jdGlvblR5cGU9XCJmdW5jdGlvblwiLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbiwgc2VsZj10aGlzLCBibG9ja0hlbHBlck1pc3Npbmc9aGVscGVycy5ibG9ja0hlbHBlck1pc3Npbmc7XG5cbmZ1bmN0aW9uIHByb2dyYW0xKGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXI7XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaWNvbiBjb250YWN0XFxcIj48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImNvbnRlbnRXcmFwcGVyXFxcIj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0aXRsZVxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnRleHQpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudGV4dCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0ZXh0XFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMudmFsdWUpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudmFsdWUpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuZnVuY3Rpb24gcHJvZ3JhbTMoZGVwdGgwLGRhdGEpIHtcbiAgXG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlcjtcbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpY29uIHNlYXJjaFxcXCI+PC9kaXY+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjb250ZW50V3JhcHBlclxcXCI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwidGl0bGVcXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy50ZXh0KSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnRleHQpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJkcm9wZG93bi1saS12YWx1ZVxcXCI+XFxyXFxuICAgIFwiO1xuICBvcHRpb25zPXtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgxLCBwcm9ncmFtMSwgZGF0YSksZGF0YTpkYXRhfVxuICBpZiAoaGVscGVyID0gaGVscGVycy5pc0NvbnRhY3QpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCBvcHRpb25zKTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuaXNDb250YWN0KTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCBvcHRpb25zKSA6IGhlbHBlcjsgfVxuICBpZiAoIWhlbHBlcnMuaXNDb250YWN0KSB7IHN0YWNrMSA9IGJsb2NrSGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgc3RhY2sxLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMSwgcHJvZ3JhbTEsIGRhdGEpLGRhdGE6ZGF0YX0pOyB9XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG5cXHJcXG4gICAgXCI7XG4gIG9wdGlvbnM9e2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDMsIHByb2dyYW0zLCBkYXRhKSxkYXRhOmRhdGF9XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmlzU2VhcmNoKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwgb3B0aW9ucyk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmlzU2VhcmNoKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCBvcHRpb25zKSA6IGhlbHBlcjsgfVxuICBpZiAoIWhlbHBlcnMuaXNTZWFyY2gpIHsgc3RhY2sxID0gYmxvY2tIZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBzdGFjazEsIHtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgzLCBwcm9ncmFtMywgZGF0YSksZGF0YTpkYXRhfSk7IH1cbiAgaWYoc3RhY2sxIHx8IHN0YWNrMSA9PT0gMCkgeyBidWZmZXIgKz0gc3RhY2sxOyB9XG4gIGJ1ZmZlciArPSBcIlxcclxcbjwvZGl2PlxcclxcblxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIERpYWxvZ1ZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy9kaWFsb2dWaWV3MVwiKTtcclxuXHJcbnZhciBBdXRvQ29tcGxldGUgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5lbCA9IG9wdGlvbnMuZWw7XHJcbiAgICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xyXG4gICAgICAgIHRoaXMudGl0bGUgPSBvcHRpb25zLnRpdGxlIHx8IFwiXCI7XHJcbiAgICAgICAgdGhpcy5pbnNpZGVWaWV3ID0gb3B0aW9ucy5pbnNpZGVWaWV3O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIHNob3dcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNob3c6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5kaWFsb2dWaWV3ID0gbmV3IERpYWxvZ1ZpZXcoe1xyXG4gICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgIGVsOiB0aGlzLmVsLFxyXG4gICAgICAgICAgICB0aXRsZTogdGhpcy50aXRsZSxcclxuICAgICAgICAgICAgemluZGV4OiAxMDAwLFxyXG4gICAgICAgICAgICBpbnNpZGVWaWV3OiB0aGlzLmluc2lkZVZpZXdcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmRpYWxvZ1ZpZXcucmVuZGVyKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGU7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi91aS90ZW1wbGF0ZXMvZGlhbG9nLmhic1wiKTtcclxuXHJcbnZhciBEaWFsb2dWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG5cclxuICAgIGNsYXNzTmFtZTogXCJkaWFsb2dcIixcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgIGluc2lkZVZpZXc6IG51bGwsXHJcbiAgICB0ZW1wbGF0ZUlkOiBudWxsLFxyXG5cclxuICAgIHVpOiB7XHJcbiAgICAgICAgYnRuQ2xvc2U6IFwiLmRpYWxvZy1oZWFkZXItY2xvc2VCdG5cIlxyXG4gICAgfSxcclxuXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgICBcImNsaWNrIEB1aS5idG5DbG9zZVwiOiBcImNsb3NlQnRuXCJcclxuICAgIH0sXHJcblxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuaW5zaWRlVmlldykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy50aXRsZSA9IG9wdGlvbnMudGl0bGU7XHJcbiAgICAgICAgICAgIHRoaXMuekluZGV4ID0gb3B0aW9ucy56SW5kZXg7XHJcbiAgICAgICAgICAgIHRoaXMuaW5zaWRlVmlldyA9IG9wdGlvbnMuaW5zaWRlVmlldztcclxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZUlkID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKS50b1N0cmluZygpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gcmVuZGVyXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25CZWZvcmVSZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5fJGVsID0gdGhpcy4kZWw7XHJcbiAgICAgICAgdGhpcy4kZWwgPSAkKFwiPGRpdi8+XCIpLmFkZENsYXNzKHRoaXMuY2xhc3NOYW1lKS5hZGRDbGFzcyh0aGlzLnRlbXBsYXRlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaW5zaWRlVmlldykge1xyXG4gICAgICAgICAgICB0aGlzLiRlbC5maW5kKFwiLmRpYWxvZy1oZWFkZXItdGl0bGVcIikuaHRtbCh0aGlzLnRpdGxlKTtcclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZChcIi5kaWFsb2ctaW5uZXJCb3hcIikuYXBwZW5kKHRoaXMuaW5zaWRlVmlldy5yZW5kZXIoKS5lbCk7XHJcbiAgICAgICAgICAgIHRoaXMuXyRlbC5hcHBlbmQodGhpcy4kZWwpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZChcIi5kaWFsb2ctb3V0ZXJib3hcIikuY3NzKFwibWFyZ2luLXRvcFwiLCAtdGhpcy5pbnNpZGVWaWV3LiRlbC5oZWlnaHQoKSAvIDIgKyBcInB4XCIpO1xyXG4gICAgICAgICAgICB0aGlzLiRlbC5maW5kKFwiLmRpYWxvZy1vdXRlcmJveFwiKS5jc3MoXCJtYXJnaW4tbGVmdFwiLCAtdGhpcy5pbnNpZGVWaWV3LiRlbC53aWR0aCgpIC8gMiArIFwicHhcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBjbG9zZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGNsb3NlQnRuOiBmdW5jdGlvbiAoZXYpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pbnNpZGVWaWV3LmRlc3Ryb3koKTtcclxuICAgICAgICB0aGlzLl8kZWwuZmluZChcIi5kaWFsb2cuXCIgKyB0aGlzLnRlbXBsYXRlSWQpLnJlbW92ZSgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRGlhbG9nVmlldztcclxuXHJcblxyXG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJkaWFsb2ctb3ZlcmxheVxcXCI+PC9kaXY+XFxyXFxuXFxyXFxuPGRpdiBjbGFzcz1cXFwiZGlhbG9nLW91dGVyYm94XFxcIj5cXHJcXG5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiZGlhbG9nLWhlYWRlclxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJkaWFsb2ctaGVhZGVyLXRpdGxlXFxcIj48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImRpYWxvZy1oZWFkZXItY2xvc2VCdG5cXFwiPjwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiZGlhbG9nLWlubmVyQm94XFxcIj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXCI7XG4gIH0pO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwiLi91aS90ZW1wbGF0ZXMvc2VhcmNoLmhic1wiKTtcclxuXHJcbnJlcXVpcmUoXCJwbHVnaW5zL2pxdWVyeS5iYS1vdXRzaWRlLWV2ZW50c1wiKTtcclxuXHJcbnZhciBLZXlDb2RlID0ge1xyXG4gICAgRVNDOiAyNyxcclxuICAgIEVOVEVSOiAxMyxcclxuICAgIEFSUk9XX1VQOiAzOCxcclxuICAgIEFSUk9XX0RPV046IDQwXHJcbn07XHJcblxyXG52YXIgU2VhcmNoVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuXHJcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBcInNlYXJjaElucHV0XCI6IFwiLnNlYXJjaC1pbnB1dFwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgLmJ0blNlYXJjaFwiOiBcInNlYXJjaFwiLFxyXG4gICAgICAgIFwia2V5dXAgLnNlYXJjaC1pbnB1dFwiOiBcIm9uQnV0dG9uS2V5VXBcIixcclxuICAgICAgICBcImlucHV0IC5zZWFyY2gtaW5wdXRcIjogXCJvbklucHV0Q2hhbmdlXCIsXHJcbiAgICAgICAgXCJjbGlja291dHNpZGVcIjogXCJvdXRzaWRlQ2xpY2tlZFwiXHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZWwgPSBvcHRpb25zLmVsO1xyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuICAgICAgICB0aGlzLmNhcHRpb24gPSBvcHRpb25zLmNhcHRpb247XHJcblxyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImF1dG9jb21wbGV0ZTppdGVtOnNlbGVjdGVkXCIsIHRoaXMuc2VhcmNoLCB0aGlzKTtcclxuICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJhdXRvY29tcGxldGU6aXRlbTphY3RpdmVcIiwgdGhpcy5vbkl0ZW1BY3RpdmUsIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNhcHRpb246IHRoaXMuY2FwdGlvblxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uSXRlbUFjdGl2ZTogZnVuY3Rpb24gKHRleHQsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy51aS5zZWFyY2hJbnB1dC52YWwodGV4dCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uQnV0dG9uS2V5VXA6IGZ1bmN0aW9uIChldmVudCkge1xyXG5cclxuICAgICAgICB2YXIga2V5ID0gZXZlbnQua2V5Q29kZTtcclxuXHJcbiAgICAgICAgaWYgKGtleSA9PT0gS2V5Q29kZS5BUlJPV19ET1dOIHx8IGtleSA9PT0gS2V5Q29kZS5BUlJPV19VUCB8fCBrZXkgPT09IEtleUNvZGUuRU5URVIpIHtcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJrZXk6cHJlc3NcIiwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbklucHV0Q2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJpbnB1dDpjaGFuZ2VcIiwgdGhpcy51aS5zZWFyY2hJbnB1dC52YWwoKSwge1wiYWRkU2VhcmNoS2V5XCI6IHRydWV9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNlYXJjaDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2xvc2VBbGxcIik7XHJcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJzZWFyY2hcIiwgdGhpcy51aS5zZWFyY2hJbnB1dC52YWwoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgY2xlYXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnVpLnNlYXJjaElucHV0LnZhbChcIlwiKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvdXRzaWRlQ2xpY2tlZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2xvc2VBbGxcIik7XHJcbiAgICB9XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFNlYXJjaFZpZXc7XHJcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxpbnB1dCBjbGFzcz1cXFwic2VhcmNoLWlucHV0XFxcIiB0eXBlPVxcXCJ0ZXh0XFxcIiBhdXRvY29tcGxldGU9XFxcIm9mZlxcXCIgdmFsdWU9XFxcIlxcXCI+XFxyXFxuPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIHByaW1lSWNvbiBidG5TZWFyY2hcXFwiPjxzcGFuIGNsYXNzPVxcXCJzZWFyY2hJY29uXFxcIj48L3NwYW4+PC9hPlwiO1xuICB9KTtcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFRhZ01vZGVsID0gcmVxdWlyZShcInVpLWNvbXBvbmVudHMvdGFncy9qcy9tb2RlbHMvdGFnTW9kZWxcIik7XHJcblxyXG52YXIgVGFnc0NvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XHJcbiAgICBtb2RlbDogVGFnTW9kZWxcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhZ3NDb2xsZWN0aW9uO1xyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgVGFnTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgICB0ZXh0OiBcIlwiLFxyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWVcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhZ01vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi91aS90ZW1wbGF0ZXMvdGFnLmhic1wiKTtcclxuXHJcbnZhciBUYWdJdGVtVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgIGNsYXNzTmFtZTogJ3RhZycsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBjb250ZW50OiBcIi5jb250ZW50XCIsXHJcbiAgICAgICAgYnRuQ2xvc2U6IFwiLmNsb3NlLWJ1dHRvblwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgLmNsb3NlLWJ1dHRvblwiOiBcIl9vbkNsb3NlQnRuQ2xpY2tcIlxyXG4gICAgfSxcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuICAgIH0sXHJcblxyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLiRlbC50b2dnbGVDbGFzcyhcImVyclwiLCAhdGhpcy5tb2RlbC5nZXQoXCJpc1ZhbGlkXCIpKTtcclxuICAgIH0sXHJcblxyXG4gICAgX29uQ2xvc2VCdG5DbGljazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidGFnOml0ZW06cmVtb3ZlXCIsIHRoaXMubW9kZWwuY2lkKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhZ0l0ZW1WaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi91aS90ZW1wbGF0ZXMvdGFnc0NvbnRhaW5lci5oYnNcIik7XHJcbnZhciBUYWdzSXRlbVZpZXcgPSByZXF1aXJlKFwiLi90YWdzSXRlbVZpZXdcIik7XHJcblxyXG5yZXF1aXJlKFwicGx1Z2lucy9qcXVlcnkuYmEtb3V0c2lkZS1ldmVudHNcIik7XHJcblxyXG52YXIgS2V5Q29kZSA9IHtcclxuICAgIEVTQzogMjcsXHJcbiAgICBFTlRFUjogMTMsXHJcbiAgICBBUlJPV19VUDogMzgsXHJcbiAgICBBUlJPV19ET1dOOiA0MFxyXG59O1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXcgPSBNYXJpb25ldHRlLkNvbXBvc2l0ZVZpZXcuZXh0ZW5kKHtcclxuXHJcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICBjaGlsZFZpZXc6IFRhZ3NJdGVtVmlldyxcclxuICAgIGNoaWxkVmlld0NvbnRhaW5lcjogXCIuc2VsZWN0ZWRUYWdzXCIsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBjb250YWluZXI6IFwiLnRhZ3MtY29udGFpbmVyXCIsXHJcbiAgICAgICAgdGFnU2VsZWN0b3I6IFwiLnRhZy1pbnB1dFwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2tcIjogXCJvbkNsaWNrXCIsXHJcbiAgICAgICAgXCJrZXlkb3duIC50YWctaW5wdXRcIjogXCJvbkJ1dHRvbktleURvd25cIixcclxuICAgICAgICBcImlucHV0IC50YWctaW5wdXRcIjogXCJvbklucHV0Q2hhbmdlXCIsXHJcbiAgICAgICAgXCJjbGlja291dHNpZGVcIjogXCJvdXRzaWRlQ2xpY2tlZFwiXHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gaW5pdGlhbGl6ZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy5lbCA9IG9wdGlvbnMuZWw7XHJcbiAgICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcInRhZzphZGRcIiwgdGhpcy5hZnRlckl0ZW1BZGRlZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBidWlsZENoaWxkVmlldzogZnVuY3Rpb24gKGl0ZW0sIEl0ZW1WaWV3KSB7XHJcblxyXG4gICAgICAgIHZhciB2aWV3ID0gbmV3IEl0ZW1WaWV3KHtcclxuICAgICAgICAgICAgbW9kZWw6IGl0ZW0sXHJcbiAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGFmdGVySXRlbUFkZGVkOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudWkudGFnU2VsZWN0b3IudGV4dChcIlwiKTtcclxuICAgICAgICBpZiAodGhpcy5pbkZvY3VzKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25DbGljaygpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBvbkNsaWNrXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIGlmIChfLmlzRW1wdHkodGhpcy51aS50YWdTZWxlY3Rvci50ZXh0KCkpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVzZXRTZWxlY3RvcigpO1xyXG4gICAgICAgICAgICB0aGlzLmluRm9jdXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICByZXNldFNlbGVjdG9yOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudWkudGFnU2VsZWN0b3IudGV4dChcIlwiKTtcclxuICAgICAgICB0aGlzLnVpLnRhZ1NlbGVjdG9yLnNob3coKTtcclxuICAgICAgICB0aGlzLnVpLnRhZ1NlbGVjdG9yLmZvY3VzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uQnV0dG9uS2V5RG93bjogZnVuY3Rpb24gKGV2ZW50KSB7XHJcblxyXG4gICAgICAgIHZhciBrZXkgPSBldmVudC5rZXlDb2RlO1xyXG5cclxuICAgICAgICBpZiAoa2V5ID09PSBLZXlDb2RlLkFSUk9XX0RPV04gfHwga2V5ID09PSBLZXlDb2RlLkFSUk9XX1VQKSB7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwia2V5OnByZXNzXCIsIGtleSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoa2V5ID09PSBLZXlDb2RlLkVOVEVSKSB7XHJcbiAgICAgICAgICAgIHRoaXMudWkudGFnU2VsZWN0b3IuaGlkZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcInRhZzppbnB1dDplbnRlclwiLCB0aGlzLnVpLnRhZ1NlbGVjdG9yLnRleHQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uSW5wdXRDaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImlucHV0OmNoYW5nZVwiLCB0aGlzLnVpLnRhZ1NlbGVjdG9yLnRleHQoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb3V0c2lkZUNsaWNrZWQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzRW1wdHkodGhpcy51aS50YWdTZWxlY3Rvci50ZXh0KCkpKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluRm9jdXMgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJjbG9zZUFsbFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXc7XHJcbiIsIiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICB2YXIgVGFnc1ZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy90YWdzVmlld1wiKTtcclxuICAgIHZhciBUYWdNb2RlbCA9IHJlcXVpcmUoXCIuL2pzL21vZGVscy90YWdNb2RlbFwiKTtcclxuICAgIHZhciBUYWdzQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCIuL2pzL2NvbGxlY3Rpb25zL3RhZ0NvbGxlY3Rpb25cIik7XHJcblxyXG4gICAgdmFyIFRhZ3MgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBpbml0aWFsVGFncyA9IG9wdGlvbnMuaW5pdGlhbFRhZ3MgfHwgW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24gPSBuZXcgVGFnc0NvbGxlY3Rpb24oaW5pdGlhbFRhZ3MpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRvciA9IG9wdGlvbnMudmFsaWRhdG9yO1xyXG4gICAgICAgICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XHJcbiAgICAgICAgICAgIHRoaXMuZWwgPSBvcHRpb25zLmVsO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LFwidGFnOmlucHV0OmVudGVyXCIsIHRoaXMub25FbnRlcik7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LFwidGFnOml0ZW06cmVtb3ZlXCIsIHRoaXMub25SZW1vdmVJdGVtKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsXCJhdXRvY29tcGxldGU6aXRlbTpzZWxlY3RlZFwiLHRoaXMub25JdGVtU2VsZWN0ZWQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHNob3dcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvdzogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy50YWdzVmlldyA9IG5ldyBUYWdzVmlldyh7XHJcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLmNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgICAgICBlbDogdGhpcy5lbFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy50YWdzVmlldy5yZW5kZXIoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkVudGVyOmZ1bmN0aW9uKHZhbCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVudGVyU3RhdGUgPSBcInVuaGFuZGxlXCI7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwia2V5OnByZXNzXCIsIDEzKTtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoXy5iaW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuZW50ZXJTdGF0ZSA9PT0gXCJ1bmhhbmRsZVwiKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEl0ZW0odmFsLCB2YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB0aGlzKSwgMTAwKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkl0ZW1TZWxlY3RlZDpmdW5jdGlvbih0ZXh0LCB2YWx1ZSl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVudGVyU3RhdGUgPSBcImhhbmRsZVwiO1xyXG4gICAgICAgICAgICB0aGlzLmFkZEl0ZW0odGV4dCx2YWx1ZSx0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbW92ZUl0ZW06ZnVuY3Rpb24odGFnSWQpe1xyXG5cclxuICAgICAgICAgICAgdmFyIHRhZ01vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmdldCh0YWdJZCk7XHJcblxyXG4gICAgICAgICAgICBpZihfLmlzT2JqZWN0KHRhZ01vZGVsKSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ucmVtb3ZlKHRhZ01vZGVsKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidGFnOnJlbW92ZVwiLCB0YWdNb2RlbC5nZXQoXCJ2YWx1ZVwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBhZGRJdGVtOmZ1bmN0aW9uKHRleHQsIHZhbCl7XHJcblxyXG4gICAgICAgICAgICBpZighXy5pc0VtcHR5KHZhbCkpe1xyXG5cclxuICAgICAgICAgICAgICAgIHRleHQgPSBfLmlzRW1wdHkodGV4dCkgPyB2YWwgOiB0ZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnTW9kZWwoe3ZhbHVlOnZhbCwgdGV4dDp0ZXh0LCBpc1ZhbGlkOnRoaXMuX3ZhbGlkYXRlKHZhbCl9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5hZGQodGFnKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcInRhZzphZGRcIiwgdmFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF92YWxpZGF0ZTpmdW5jdGlvbih2YWwpe1xyXG5cclxuICAgICAgICAgICAgdmFyIGlzVmFsaWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYoXy5pc0Z1bmN0aW9uKHRoaXMudmFsaWRhdG9yKSl7XHJcbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdGhpcy52YWxpZGF0b3IodmFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaXNWYWxpZDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGFncztcclxuXHJcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXIsIGZ1bmN0aW9uVHlwZT1cImZ1bmN0aW9uXCIsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwiY29udGVudFxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnRleHQpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudGV4dCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJjbG9zZS1idXR0b25cXFwiPjwvZGl2PlxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcInRhZ3MtY29udGFpbmVyXFxcIj5cXHJcXG4gICA8ZGl2IGNsYXNzPVxcXCJzZWxlY3RlZFRhZ3NcXFwiPjwvZGl2PlxcclxcbiAgIDxkaXYgY2xhc3M9XFxcInRhZy1zZWxlY3RvclxcXCI+XFxyXFxuICAgICAgIDxzcGFuIGNsYXNzPVxcXCJ0YWctaW5wdXRcXFwiIGNvbnRlbnRlZGl0YWJsZT1cXFwidHJ1ZVxcXCIgdGFiaW5kZXg9XFxcIi0xXFxcIj48L3NwYW4+XFxyXFxuICAgPC9kaXY+XFxyXFxuPC9kaXY+XCI7XG4gIH0pO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZSgnYXBwJyk7XHJcbnZhciBGcmFtZUxheW91dCA9IHJlcXVpcmUoJy4vanMvdmlld3MvZnJhbWVMYXlvdXQnKTtcclxudmFyIExheW91dEhlbHBlcnMgPSByZXF1aXJlKFwicmVzb2x2ZXJzL2Ryb3Bkb3duRGlzcGxheWVyXCIpO1xyXG5cclxudmFyIEZyYW1lID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgY3VyclN1YkxheW91dDogXCJcIixcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gaW5pdGlhbGl6ZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLmZyYW1lTGF5b3V0ID0gbmV3IEZyYW1lTGF5b3V0KCk7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5UbyhhcHAuY29udGV4dCwgJ2NoYW5nZTptb2R1bGUnLCB0aGlzLmNoYW5nZVN1YmxheW91dCwgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBzZXRMYXlvdXRcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2V0TGF5b3V0OiBmdW5jdGlvbiAobWFpblJlZ2lvbikge1xyXG4gICAgICAgIG1haW5SZWdpb24uc2hvdyh0aGlzLmZyYW1lTGF5b3V0KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGNoYW5nZVN1YmxheW91dDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgc3ViTW9kdWxlID0gYXBwLnN1Ym1vZHVsZXNbYXBwLmNvbnRleHQuZ2V0KFwibW9kdWxlXCIpXTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNPYmplY3Qoc3ViTW9kdWxlKSAmJiBfLmlzRnVuY3Rpb24oc3ViTW9kdWxlLnNldExheW91dCkpIHtcclxuICAgICAgICAgICAgc3ViTW9kdWxlLnNldExheW91dCgpO1xyXG4gICAgICAgICAgICB0aGlzLmZyYW1lTGF5b3V0Lm9uTW9kdWxlQ2hhbmdlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGdldFJlZ2lvbnNcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNldFJlZ2lvbjogZnVuY3Rpb24gKHJlZ2lvbk5hbWUsIHZpZXcpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZnJhbWVMYXlvdXRbcmVnaW9uTmFtZSArIFwiUmVnaW9uXCJdICYmICFfLmlzRW1wdHkodmlldykpIHtcclxuICAgICAgICAgICAgdGhpcy5mcmFtZUxheW91dFtyZWdpb25OYW1lICsgXCJSZWdpb25cIl0uc2hvdyh2aWV3KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIERpYWxvZyA9IHJlcXVpcmUoXCJkaWFsb2dcIik7XHJcbnZhciBUZWNoQmFyVmlldyA9IHJlcXVpcmUoJ2ZyYW1lLXZpZXdzL3RlY2hCYXJWaWV3Jyk7XHJcbnZhciBMb2FkZXJWaWV3ID0gcmVxdWlyZSgnZnJhbWUtdmlld3MvbG9hZGVyVmlldycpO1xyXG52YXIgU2V0dGluZ3NWaWV3ID0gcmVxdWlyZSgnZnJhbWUtdmlld3Mvc2V0dGluZ3NWaWV3Jyk7XHJcbnZhciBGcmFtZVRlbXBsYXRlID0gcmVxdWlyZShcImZyYW1lLXRlbXBsYXRlcy9mcmFtZUxheW91dC5oYnNcIik7XHJcblxyXG52YXIgRnJhbWVMYXlvdXQgPSBNYXJpb25ldHRlLkxheW91dFZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiBGcmFtZVRlbXBsYXRlLFxyXG5cclxuICAgIHVpOiB7XHJcbiAgICAgICAgc3dpdGNoZXJDYXB0aW9uOiBcIi5tb2R1bGVTd2l0Y2hlciAuY2FwdGlvblwiLFxyXG4gICAgICAgIHRlY2hiYXJXcmFwcGVyOiBcIi50ZWNoYmFyLXdyYXBwZXJcIixcclxuICAgICAgICBsb2FkZXJXcmFwcGVyOiBcIi5sb2FkZXItd3JhcHBlclwiLFxyXG4gICAgICAgIGJ0blNldHRpbmdzOiBcIi5idG5TZXR0aW5nc1wiXHJcbiAgICB9LFxyXG5cclxuICAgIHJlZ2lvbnM6IHtcclxuICAgICAgICBzZXR0aW5nc1JlZ2lvbjogXCIuc2V0dGluZ3MtcmVnaW9uXCIsXHJcbiAgICAgICAgc2VhcmNoUmVnaW9uOiBcIi5zZWFyY2gtcmVnaW9uXCIsXHJcbiAgICAgICAgYWN0aW9uc1JlZ2lvbjogXCIuYWN0aW9ucy1yZWdpb25cIixcclxuICAgICAgICBtYWluUmVnaW9uOiBcIi5tYWluLXJlZ2lvblwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgQHVpLmJ0blNldHRpbmdzXCI6IFwib3BlblNldHRpbmdzXCJcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgdGVjaEJhclZpZXcgPSBuZXcgVGVjaEJhclZpZXcoe1xyXG4gICAgICAgICAgICBlbDogdGhpcy51aS50ZWNoYmFyV3JhcHBlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRlY2hCYXJWaWV3LnJlbmRlcigpO1xyXG5cclxuICAgICAgICB2YXIgbG9hZGVyVmlldyA9IG5ldyBMb2FkZXJWaWV3KHtcclxuICAgICAgICAgICAgZWw6IHRoaXMudWkubG9hZGVyV3JhcHBlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGxvYWRlclZpZXcucmVuZGVyKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9wZW5TZXR0aW5nczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgc2V0dGluZ3NWaWV3ID0gbmV3IFNldHRpbmdzVmlldyh7XHJcbiAgICAgICAgICAgIG1vZGVsOiBhcHAuc2V0dGluZ3NcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGRpYWxvZyA9IG5ldyBEaWFsb2coe1xyXG4gICAgICAgICAgICBlbDogdGhpcy5lbCxcclxuICAgICAgICAgICAgdGl0bGU6IGFwcC50cmFuc2xhdG9yLnRyYW5zbGF0ZShcImZyYW1lOnNldHRpbmdzXCIpLFxyXG4gICAgICAgICAgICBpbnNpZGVWaWV3OiBzZXR0aW5nc1ZpZXdcclxuICAgICAgICB9KTtcclxuICAgICAgICBkaWFsb2cuc2hvdygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbk1vZHVsZUNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudWkuc3dpdGNoZXJDYXB0aW9uLmh0bWwoYXBwLnRyYW5zbGF0b3IudHJhbnNsYXRlKFwiZnJhbWU6bW9kdWxlLlwiICsgYXBwLmNvbnRleHQuZ2V0KFwibW9kdWxlXCIpKSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZUxheW91dDtcclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJmcmFtZS10ZW1wbGF0ZXMvbG9hZGVyLmhic1wiKTtcclxuXHJcbnZhciBMb2FkaW5nVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOnRlbXBsYXRlLFxyXG5cclxuICAgIHVpOntcclxuICAgICAgICBsb2FkZXI6XCIubG9hZGVyXCJcclxuICAgIH0sXHJcblxyXG4gICAgc2hvd0xvYWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuJGVsLnNob3coKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvc2VMb2FkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLiRlbC5oaWRlKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2FkaW5nVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcImZyYW1lLXRlbXBsYXRlcy9zZXR0aW5nc1ZpZXcuaGJzXCIpO1xyXG5cclxudmFyIFNldHRpbmdzVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuXHJcbiAgICB1aToge1xyXG4gICAgICAgIGJ0bkRhcms6IFwiLmRhcmtUaGVtZVwiLFxyXG4gICAgICAgIGJ0bkR1c3Q6IFwiLmR1c3RUaGVtZVwiLFxyXG4gICAgICAgIGRkbExhbmc6IFwiLmxhbmd1YWdlLWJveFwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgLnRoZW1lQm94XCI6IFwib25UaGVtZUNsaWNrXCIsXHJcbiAgICAgICAgXCJjaGFuZ2UgQHVpLmRkbExhbmdcIjogXCJvbkxhbmd1YWdlQ2hhbmdlXCJcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy51aS5kZGxMYW5nLnZhbChhcHAuc2V0dGluZ3MuZ2V0KFwibGFuZ1wiKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uTGFuZ3VhZ2VDaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIGxhbmcgPSB0aGlzLnVpLmRkbExhbmcudmFsKCk7XHJcblxyXG4gICAgICAgIGFwcC5zZXR0aW5ncy5zZXQoXCJsYW5nXCIsIGxhbmcpO1xyXG4gICAgICAgIGFwcC5zZXR0aW5ncy5zYXZlKG51bGwsIHtcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uVGhlbWVDbGljazogZnVuY3Rpb24gKGUpIHtcclxuXHJcbiAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5jdXJyZW50VGFyZ2V0IHx8IGUuc3JjRWxlbWVudCk7XHJcbiAgICAgICAgdmFyIHRoZW1lID0gdGFyZ2V0LmF0dHIoXCJkYXRhLW5hbWVcIik7XHJcblxyXG4gICAgICAgIGFwcC5zZXR0aW5ncy5zZXQoXCJ0aGVtZVwiLCB0aGVtZSk7XHJcbiAgICAgICAgYXBwLnNldHRpbmdzLnNhdmUobnVsbCwge1xyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBhcHAuc2V0dGluZ3NDb250cm9sbGVyLmxvYWRUaGVtZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXR0aW5nc1ZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcImZyYW1lLXRlbXBsYXRlcy90ZWNoQmFyLmhic1wiKTtcclxuXHJcbnZhciBUZWNoQmFyVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuXHJcbiAgICB1aToge1xyXG4gICAgICAgIGRkc1Jlc291cmNlczogXCIuZGRzUmVzb3VyY2VzXCJcclxuICAgIH0sXHJcblxyXG4gICAgZXZlbnRzOiB7XHJcbiAgICAgICAgXCJjbGljayAuZGRzUmVzb3VyY2VzXCI6IFwib25SZXNvdXJjZXNNZW51Q2xpY2tcIlxyXG4gICAgfSxcclxuXHJcbiAgICBvblJlc291cmNlc01lbnVDbGljazogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGVjaEJhclZpZXc7XHJcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXIsIG9wdGlvbnMsIGZ1bmN0aW9uVHlwZT1cImZ1bmN0aW9uXCIsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZztcblxuXG4gIGJ1ZmZlciArPSBcIjxkaXYgY2xhc3M9XFxcInRlY2hiYXItd3JhcHBlclxcXCI+PC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwibG9hZGVyLXdyYXBwZXJcXFwiPjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcImhlYWRlci13cmFwcGVyXFxcIj5cXHJcXG4gICAgIDxkaXYgY2xhc3M9XFxcImxvZ29cXFwiPjwvZGl2PlxcclxcbiAgICAgPGRpdiBjbGFzcz1cXFwic2VhcmNoLXJlZ2lvblxcXCI+PC9kaXY+XFxyXFxuICAgICA8ZGl2IGNsYXNzPVxcXCJhY2NvdW50TmFtZVxcXCIgYWx0PVwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5hY2NvdW50TmFtZSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5hY2NvdW50TmFtZSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCIgdGl0bGU9XFxcIlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5hY2NvdW50TmFtZSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5hY2NvdW50TmFtZSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCJcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcImFjdGlvbnMtd3JhcHBlclxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm1vZHVsZVN3aXRjaGVyXFxcIj5cXHJcXG4gICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsaW5rIGRyb3Bkb3duIGRkc0lkX2Rkc01vZHVsZXNcXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj48L3NwYW4+PHNwYW4gY2xhc3M9XFxcInRvZ2dsZVxcXCI+PC9zcGFuPjwvYT5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImRyb3Bkb3duLXNsaWRlciBkZHNNb2R1bGVzXFxcIj5cXHJcXG4gICAgICAgICAgIDxhIGNsYXNzPVxcXCJkZG0gc2VsZWN0TWFpbFxcXCIgaHJlZj1cXFwiI2luYm94XFxcIj48L3NwYW4+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTptb2R1bGUubWFpbFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTptb2R1bGUubWFpbFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICA8YSBjbGFzcz1cXFwiZGRtIHNlbGVjdFRhc2tzXFxcIiBocmVmPVxcXCIjdGFza3NcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6bW9kdWxlLnRhc2tzXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcImZyYW1lOm1vZHVsZS50YXNrc1wiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICAgICA8ZGl2IGNsYXNzPVxcXCJhY3Rpb25zLXJlZ2lvblxcXCI+PC9kaXY+XFxyXFxuICAgICA8ZGl2IGNsYXNzPVxcXCJidG5TZXR0aW5nc1xcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIHByaW1lSWNvbiBfYnRuU2V0dGluZ3NcXFwiPjxzcGFuIGNsYXNzPVxcXCJzZXR0aW5nc0ljb25cXFwiPjwvc3Bhbj48L2E+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwibWFpbi1yZWdpb25cXFwiPjwvZGl2PlwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcImxvYWRlclxcXCI+TG9hZGluZy4uLi4uLjwvZGl2PlxcclxcblxcclxcblxcclxcblwiO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJzZXR0aW5nc1ZpZXdcXFwiPlxcclxcblxcclxcbiAgICAgICA8ZGl2IGNsYXNzPVxcXCJzZWN0aW9uXFxcIj5cXHJcXG4gICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInRpdGxlXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTpzZXR0aW5ncy5sYW5ndWFnZVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTpzZXR0aW5ncy5sYW5ndWFnZVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgICAgPHNlbGVjdCBjbGFzcz1cXFwibGFuZ3VhZ2UtYm94XFxcIiBuYW1lPVxcXCJsYW5ndWFnZXNcXFwiIGRhdGEtYWN0aW9uPVxcXCJsYW5ndWFnZXNcXFwiID5cXHJcXG4gICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJlbi1VU1xcXCI+RW5nbGlzaCAoVVMpPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiZXMtRVNcXFwiPkVzcGHDsW9sPC9vcHRpb24+XFxyXFxuICAgICAgICAgICA8L3NlbGVjdD5cXHJcXG4gICAgICAgPC9kaXY+XFxyXFxuXFxyXFxuICAgICAgIDxkaXYgY2xhc3M9XFxcInNlY3Rpb25cXFwiPlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInRpdGxlXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTpzZXR0aW5ncy50aGVtZVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTpzZXR0aW5ncy50aGVtZVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInRoZW1lQm94IGR1c3RUaGVtZVxcXCIgZGF0YS1uYW1lPVxcXCJkdXN0XFxcIj48L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0aGVtZUJveCBkYXJrVGhlbWVcXFwiIGRhdGEtbmFtZT1cXFwiZGFya1xcXCI+PC9kaXY+XFxyXFxuICAgICAgIDwvZGl2PlxcclxcbjwvZGl2PlwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJ0ZWNoYmFyXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwidGl0bGVcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcImZyYW1lOnRlY2hiYXIuc2xvZ2FuXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcImZyYW1lOnRlY2hiYXIuc2xvZ2FuXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm1lbnVcXFwiPlxcclxcbiAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGxpbmsgbWVudWl0ZW1cXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTp0ZWNoYmFyLmFib3V0XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcImZyYW1lOnRlY2hiYXIuYWJvdXRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGxpbmsgbWVudWl0ZW1cXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTp0ZWNoYmFyLnR1dG9yaWFsXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcImZyYW1lOnRlY2hiYXIudHV0b3JpYWxcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGxpbmsgZHJvcGRvd24gbWVudWl0ZW0gZGRzSWRfZGRzUmVzb3VyY2VzXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6dGVjaGJhci5yZXNvdXJjZXNcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwiZnJhbWU6dGVjaGJhci5yZXNvdXJjZXNcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PHNwYW4gY2xhc3M9XFxcInRvZ2dsZVxcXCI+PC9zcGFuPjwvYT5cXHJcXG5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImRyb3Bkb3duLXNsaWRlciBkZHNSZXNvdXJjZXNcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImNvbnRhaW5lclxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDx1bD5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxsaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGNoZWNrZWQ+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGk+PC9pPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMj5DbGllbnQtc2lkZTwvaDI+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDxwPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbSBmaXJzdFxcXCI+QmFja2JvbmU8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5CYWNrYm9uZS5EZWVwTW9kZWw8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5NYXJpb25ldHRlPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+VW5kZXJzY29yZTwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPkJyb3dzZXJpZnk8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5IYW5kbGViYXJzPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+U2Fzc1xcXFxDb21wYXNzPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+RUNNQVNjcmlwdCA2IChCYWJlbCk8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8bGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBjaGVja2VkPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpPjwvaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aDI+U2VydmVyLXNpZGU8L2gyPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICA8cD5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW0gZmlyc3RcXFwiPk5vZGUuanMgKEV4cHJlc3MgNC4wKTwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5QYXNzcG9ydC5qczwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPk1vbmdvREI8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5Nb25nb29zZTwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPlNvY2tldC5pbzwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPC9saT5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxsaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGNoZWNrZWQ+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGk+PC9pPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMj5UZXN0aW5nIHRvb2xzPC9oMj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgPHA+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtIGZpcnN0XFxcIj5Nb2NoYSArIENoYWk8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5TaW5vbjwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPkJsYW5rZXQ8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8bGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBjaGVja2VkPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpPjwvaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aDI+RGVwbG95aW5nIHRvb2xzPC9oMj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgPHA+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtIGZpcnN0XFxcIj5HcnVudDwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XFxyXFxuXFxyXFxuICAgICAgICAgICAgICAgIDwvdWw+XFxyXFxuICAgICAgICAgICAgPC9kaXY+XFxyXFxuXFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIENvbnRhY3RNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9jb250YWN0TW9kZWxcIik7XHJcbnZhciBCYXNlQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCJiYXNlLWNvbGxlY3Rpb25zL2Jhc2VDb2xsZWN0aW9uXCIpO1xyXG5cclxudmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcclxudmFyIF9zdHJDb250YWN0cyA9IGZzLnJlYWRGaWxlU3luYygnLi9jbGllbnQvc3JjL2NvbW1vbi9kYXRhL2NvbnRhY3RzLmpzb24nLCAndXRmOCcpO1xyXG5cclxudmFyIENvbnRhY3RzQ29sbGVjdGlvbiA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgQ29udGFjdHNDb2xsZWN0aW9uID0gQmFzZUNvbGxlY3Rpb24uZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgbW9kZWw6IENvbnRhY3RNb2RlbCxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjb250YWN0TGlzdCA9IHRoaXMuX2NyZWF0ZUNvbnRhY3RMaXN0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KGNvbnRhY3RMaXN0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2NyZWF0ZUNvbnRhY3RMaXN0OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgY29udGFjdExpc3QgPSBbXSwgY29udGFjdHMgPSBKU09OLnBhcnNlKF9zdHJDb250YWN0cyk7XHJcblxyXG4gICAgICAgICAgICBfLmVhY2goY29udGFjdHMsIGZ1bmN0aW9uKGNvbnRhY3Qpe1xyXG4gICAgICAgICAgICAgICAgY29udGFjdExpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6Y29udGFjdC5yZXBsYWNlKFwiLFwiLCBcIiBcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgYWRkcmVzczpjb250YWN0LnJlcGxhY2UoXCIsXCIsIFwiLlwiKS50b0xvd2VyQ2FzZSgpICsgXCJAbWFpbGRvLmNvbVwiXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY29udGFjdExpc3Q7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGdldFRpdGxlczpmdW5jdGlvbihhZGRyZXNzTGlzdCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVzID0gW107XHJcblxyXG4gICAgICAgICAgICBfLmVhY2goYWRkcmVzc0xpc3QsIF8uYmluZChmdW5jdGlvbihhZGRyZXNzKXtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSBfLmZpbmQodGhpcy5tb2RlbHMsZnVuY3Rpb24gKHJlY29yZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWNvcmQuZ2V0KFwiYWRkcmVzc1wiKSA9PT0gYWRkcmVzcztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2gobW9kZWwgPyBtb2RlbC5nZXQoXCJ0aXRsZVwiKSA6IGFkZHJlc3MpO1xyXG4gICAgICAgICAgICB9LHRoaXMpKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgYWRkQ29udGFjdDpmdW5jdGlvbihjb250YWN0SW5mbyl7XHJcblxyXG4gICAgICAgICAgICB2YXIgY29udGFjdE1vZGVsID0gbmV3IENvbnRhY3RNb2RlbCh7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTpjb250YWN0SW5mbyxcclxuICAgICAgICAgICAgICAgIGFkZHJlc3M6Y29udGFjdEluZm8gKyBcIkBtYWlsZG8uY29tXCJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkKGNvbnRhY3RNb2RlbCwge3NpbGVudDp0cnVlfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRhY3RzQ29sbGVjdGlvbjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIE1haWxNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9tYWlsTW9kZWxcIik7XHJcbnZhciBGaWx0ZXJlZENvbGxlY3Rpb24gPSByZXF1aXJlKFwiYmFzZS1jb2xsZWN0aW9ucy9maWx0ZXJlZENvbGxlY3Rpb25cIik7XHJcblxyXG52YXIgTWFpbENvbGxlY3Rpb24gPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxDb2xsZWN0aW9uID0gRmlsdGVyZWRDb2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGlzRmV0Y2hlZDogZmFsc2UsXHJcblxyXG4gICAgICAgIG1vZGVsOiBNYWlsTW9kZWwsXHJcblxyXG4gICAgICAgIHJlc291cmNlOiAnbWFpbHMnLFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXR0cnMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc29ja2V0ID0ge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdE5hbWU6IHRoaXMucmVzb3VyY2UsXHJcbiAgICAgICAgICAgICAgICBpbzogYXBwLnNvY2tldENvbnRyb2xsZXIuZ2V0U29ja2V0KClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHVybDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgXCIvXCIgKyB0aGlzLnJlc291cmNlO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgY29tcGFyYXRvcjogZnVuY3Rpb24gKG1vZGVsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtKG5ldyBEYXRlKG1vZGVsLmdldChcInNlbnRUaW1lXCIpKS5nZXRUaW1lKCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZmlsdGVyQnlMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlsdGVyZWQgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGlmKF8uaXNTdHJpbmcobGFiZWwpKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZCA9IF8uZmlsdGVyKHRoaXMubW9kZWxzLCBmdW5jdGlvbiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gISFtb2RlbC5nZXQoXCJsYWJlbHMuXCIrbGFiZWwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJlZDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbENvbGxlY3Rpb247XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcblxyXG52YXIgQWN0aW9uc0NvbnRyb2xsZXIgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIEFjdGlvbnNDb250cm9sbGVyID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJtYWlsOmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbHMsIFwiY2hhbmdlOm1ldGFkYXRhXCIsIHRoaXMuZml4VXJsLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6c2VuZCcsIHRoaXMuc2VuZCwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8obWFpbC5jaGFubmVsLnZlbnQsICdtYWlsOnNlbGVjdCcsIHRoaXMuc2VsZWN0LCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6bW92ZVRvJywgdGhpcy5tb3ZlVG8sIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKG1haWwuY2hhbm5lbC52ZW50LCAnbWFpbDpkZWxldGUnLCB0aGlzLmRlbGV0ZUl0ZW1zLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6bWFya0FzJywgdGhpcy5tYXJrQXMsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKG1haWwuY2hhbm5lbC52ZW50LCAnbWFpbDpkaXNjYXJkJywgdGhpcy5kaXNjYXJkLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6Y2hhbmdlJywgdGhpcy5zYXZlQXNEcmFmdCwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5zZWxlY3RCeSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWlscy5zZWxlY3RBbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ25vbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbHMuY2xlYXJTZWxlY3RlZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAncmVhZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWlscy5zZWxlY3RNb2RlbHModGhpcy5tYWlscy5maWx0ZXJCeUxhYmVsKFwicmVhZFwiKSwge2V4Y2x1c2l2ZWx5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd1bnJlYWQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbHMuc2VsZWN0TW9kZWxzKHRoaXMubWFpbHMuZmlsdGVyQnlMYWJlbChcInVucmVhZFwiKSwge2V4Y2x1c2l2ZWx5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbWFya0FzOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLCBpdGVtcyA9IG9wdGlvbnMuaXRlbXMgfHwgdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5tYWlscy5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5tYXJrQXMob3B0aW9ucy5sYWJlbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUl0ZW1zKGl0ZW1zLCBvcHRpb25zKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbW92ZVRvOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLCBpdGVtcyA9IG9wdGlvbnMuaXRlbXMgfHwgdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5tYWlscy5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5tb3ZlVG8ob3B0aW9ucy50YXJnZXQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVJdGVtcyhpdGVtcywgXy5leHRlbmQoe30sIG9wdGlvbnMsIHtcInJlZnJlc2hcIjogdHJ1ZX0pKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdXBkYXRlSXRlbXM6IGZ1bmN0aW9uIChpdGVtcywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWlscy51cGRhdGUoe1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkSXRlbXM6IGl0ZW1zLFxyXG4gICAgICAgICAgICAgICAgZmllbGRzOiBbJ2xhYmVscycsICdncm91cHMnXSxcclxuXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBfLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlZnJlc2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgdGhpcyksXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOnVwZGF0ZUl0ZW1zOmVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZGVsZXRlSXRlbXM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMuZGVzdHJveSh7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtczogdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpLFxyXG5cclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IF8uYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6ZGVsZXRlSXRlbXM6ZXJyb3JcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZW5kOiBmdW5jdGlvbiAobWFpbE1vZGVsKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc09iamVjdChtYWlsTW9kZWwpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbWFpbE1vZGVsLnNldChcImdyb3Vwc1wiLCBbXSwge3NpbGVudDogdHJ1ZX0pO1xyXG5cclxuICAgICAgICAgICAgICAgIG1haWxNb2RlbC5zYXZlKG51bGwsIHtcclxuICAgICAgICAgICAgICAgICAgICBzaWxlbnQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogXy5iaW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcyksXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6c2F2ZTplcnJvclwiLCBtYWlsTW9kZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGRpc2NhcmQ6IGZ1bmN0aW9uIChtYWlsTW9kZWwpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYWlsTW9kZWwuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5yb3V0ZXIucHJldmlvdXMoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG1haWxNb2RlbC5kZXN0cm95KHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBfLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVN1Y2Nlc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCB0aGlzKSxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpkZWxldGU6ZXJyb3JcIiwgbWFpbE1vZGVsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzYXZlQXNEcmFmdDogZnVuY3Rpb24gKG1haWxNb2RlbCkge1xyXG5cclxuICAgICAgICAgICAgbWFpbE1vZGVsLnNldChcImdyb3Vwc1wiLCBbXCJkcmFmdFwiXSwge3NpbGVudDogdHJ1ZX0pO1xyXG5cclxuICAgICAgICAgICAgbWFpbE1vZGVsLnNhdmUobnVsbCwge1xyXG4gICAgICAgICAgICAgICAgc2F2ZUFzOiBcImRyYWZ0XCIsXHJcbiAgICAgICAgICAgICAgICBzaWxlbnQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZml4VXJsOiBmdW5jdGlvbiAobWV0YWRhdGEpIHtcclxuICAgICAgICAgICAgbWFpbC5yb3V0ZXIuZml4VXJsKHtwYWdlOiBtZXRhZGF0YS5jdXJyUGFnZSArIDF9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBoYW5kbGVTdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb24udHlwZVwiKSA9PT0gXCJjb21wb3NlXCIpIHtcclxuICAgICAgICAgICAgICAgIG1haWwucm91dGVyLnByZXZpb3VzKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haWxzLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBBY3Rpb25zQ29udHJvbGxlcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIENvbnRlbnRMYXlvdXQgPSByZXF1aXJlKFwibWFpbC12aWV3cy9tYWlsQ29udGVudExheW91dFwiKTtcclxudmFyIE1haWxzVmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL21haWxzVmlld1wiKTtcclxudmFyIFByZXZpZXdWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvcHJldmlld1ZpZXdcIik7XHJcbnZhciBDb21wb3NlVmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL2NvbXBvc2VWaWV3L2NvbXBvc2VWaWV3XCIpO1xyXG52YXIgRW1wdHlNYWlsVmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL2VtcHR5TWFpbFZpZXdcIik7XHJcblxyXG52YXIgTWFpbENvbnRlbnRDb250cm9sbGVyID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBNYWlsQ29udGVudENvbnRyb2xsZXIgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWlscyA9IG1haWwuY2hhbm5lbC5yZXFyZXMucmVxdWVzdChcIm1haWw6Y29sbGVjdGlvblwiKTtcclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6aXRlbXNcIiwgdGhpcy5jbG9zZVByZXZpZXcpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbHMsIFwiY2hhbmdlOnNlbGVjdGlvblwiLCB0aGlzLnRvZ2dsZVByZXZpZXcpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKG1haWwuY2hhbm5lbC52ZW50LCBcIm1haWxUYWJsZTpJdGVtQ2xpY2tlZFwiLCB0aGlzLnNob3dQcmV2aWV3KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBuZXdMYXlvdXRcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbmV3TGF5b3V0OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQgPSBuZXcgQ29udGVudExheW91dCgpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMuY29udGVudExheW91dCwgXCJyZW5kZXJcIiwgdGhpcy5vbkxheW91dFJlbmRlcik7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50TGF5b3V0O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkxheW91dFJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uXCIpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGVtcHR5TWFpbFZpZXcgPSBuZXcgRW1wdHlNYWlsVmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQucHJldmlld1JlZ2lvbi5hZGQoZW1wdHlNYWlsVmlldyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGFibGVWaWV3ID0gbmV3IE1haWxzVmlldyh7Y29sbGVjdGlvbjogdGhpcy5tYWlsc30pO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQuaXRlbXNSZWdpb24uYWRkKHRhYmxlVmlldyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gc2hvd1ByZXZpZXdcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvd1ByZXZpZXc6IGZ1bmN0aW9uIChtYWlsTW9kZWwpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzT2JqZWN0KG1haWxNb2RlbCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpzZWxlY3RcIiwge3NlbGVjdEJ5OiBcIm5vbmVcIn0pO1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHtsYWJlbDogJ3JlYWQnLCBpdGVtczogW21haWxNb2RlbC5pZF19KTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnByZXZpZXcgPSAhbWFpbE1vZGVsLmdldChcImdyb3Vwcy5kcmFmdFwiKSA/IG5ldyBQcmV2aWV3Vmlldyh7bW9kZWw6IG1haWxNb2RlbH0pIDogbmV3IENvbXBvc2VWaWV3KHttb2RlbDogbWFpbE1vZGVsfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQucHJldmlld1JlZ2lvbi5hZGQodGhpcy5wcmV2aWV3KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0b2dnbGVQcmV2aWV3OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc09iamVjdCh0aGlzLnByZXZpZXcpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkID0gdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJldmlldy4kZWwudG9nZ2xlKHNlbGVjdGVkID09PSAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBjbG9zZVByZXZpZXc6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZpZXcgJiYgdGhpcy5wcmV2aWV3Lm1vZGVsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGlzTW9kZWxFeGlzdCA9IF8uaXNPYmplY3QodGhpcy5tYWlscy5nZXQodGhpcy5wcmV2aWV3Lm1vZGVsLmlkKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFpc01vZGVsRXhpc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQucHJldmlld1JlZ2lvbi5jbGVhbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE1haWxDb250ZW50Q29udHJvbGxlcjsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgTWFpbENvbGxlY3Rpb24gPSByZXF1aXJlKFwibWFpbC1jb2xsZWN0aW9ucy9tYWlsQ29sbGVjdGlvblwiKTtcclxudmFyIENvbnRhY3RzQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCJtYWlsLWNvbGxlY3Rpb25zL2NvbnRhY3RzQ29sbGVjdGlvblwiKTtcclxudmFyIFNlbGVjdGFibGVEZWNvcmF0b3IgPSByZXF1aXJlKFwiZGVjb3JhdG9ycy9zZWxlY3RhYmxlQ29sbGVjdGlvbkRlY29yYXRvclwiKTtcclxuXHJcbnZhciBEYXRhQ29udHJvbGxlciA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgRGF0YUNvbnRyb2xsZXIgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBpbml0aWFsaXplXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250YWN0Q29sbGVjdGlvbiA9IG5ldyBDb250YWN0c0NvbGxlY3Rpb24oKTtcclxuICAgICAgICAgICAgdGhpcy5tYWlsQ29sbGVjdGlvbiA9IG5ldyBTZWxlY3RhYmxlRGVjb3JhdG9yKG5ldyBNYWlsQ29sbGVjdGlvbigpKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICAgICAgdGhpcy5fc2V0SGFuZGxlcnMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbENvbGxlY3Rpb24sIFwiZmV0Y2g6c3VjY2Vzc1wiLCB0aGlzLl91cGRhdGVTZWxlY3Rpb24sIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKGFwcC5jb250ZXh0LCBcImNoYW5nZTptYWlsLmFjdGlvblwiLCB0aGlzLl9yZWZyZXNoTWFpbENvbGxlY3Rpb24sIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKGFwcC52ZW50LFwib25TZXR0aW5nc0xvYWRlZFwiLCB0aGlzLl91cGRhdGVDb250YWN0cyx0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhhcHAudmVudCwgXCJkYXRhOmNoYW5nZVwiLCB0aGlzLl9vbkRhdGFDaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9zZXRIYW5kbGVyczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgbWFpbC5jaGFubmVsLnJlcXJlcy5zZXRIYW5kbGVyKFwibWFpbDpjb2xsZWN0aW9uXCIsIHRoaXMuX2dldE1haWxDb2xsZWN0aW9uLCB0aGlzKTtcclxuICAgICAgICAgICAgbWFpbC5jaGFubmVsLnJlcXJlcy5zZXRIYW5kbGVyKFwiY29udGFjdDpjb2xsZWN0aW9uXCIsIHRoaXMuX2dldENvbnRhY3RDb2xsZWN0aW9uLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBnZXQgY29sbGVjdGlvbnNcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2dldE1haWxDb2xsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1haWxDb2xsZWN0aW9uO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9nZXRDb250YWN0Q29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb250YWN0Q29sbGVjdGlvbjtcclxuICAgICAgICB9LFxyXG5cclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGRhdGEgY2hhbmdlXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfb25EYXRhQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hNYWlsQ29sbGVjdGlvbigpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF91cGRhdGVTZWxlY3Rpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5tYWlsQ29sbGVjdGlvbi51cGRhdGVTZWxlY3Rpb24oe30pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX3VwZGF0ZUNvbnRhY3RzOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdENvbGxlY3Rpb24uYWRkQ29udGFjdChhcHAuc2V0dGluZ3MuZ2V0KFwidXNlck5hbWVcIikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX3JlZnJlc2hNYWlsQ29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uXCIpIHx8IHt9O1xyXG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gYWN0aW9uLnBhcmFtcyB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzRmluaXRlKHBhcmFtcy5wYWdlKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYWlsQ29sbGVjdGlvbi5mZXRjaEJ5KHtcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VOdW1iZXI6IHBhcmFtcy5wYWdlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeTogcGFyYW1zLnF1ZXJ5IHx8ICdncm91cHM6JyArIGFjdGlvbi50eXBlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gRGF0YUNvbnRyb2xsZXI7XHJcblxyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIE1haWxNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9tYWlsTW9kZWxcIik7XHJcbnZhciBNYWluTGF5b3V0ID0gcmVxdWlyZShcIm1haWwtdmlld3MvbWFpbE1haW5MYXlvdXRcIik7XHJcbnZhciBTZWFyY2hWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3Mvc2VhcmNoVmlld1wiKTtcclxudmFyIE5hdlZpZXcgPSByZXF1aXJlKFwibWFpbC12aWV3cy9uYXZWaWV3XCIpO1xyXG52YXIgQWN0aW9uVmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL2FjdGlvblZpZXcvYWN0aW9uVmlld1wiKTtcclxudmFyIENvbXBvc2VWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvY29tcG9zZVZpZXcvY29tcG9zZVZpZXdcIik7XHJcbnZhciBFbXB0eUZvbGRlcnNWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvZW1wdHlGb2xkZXJWaWV3XCIpO1xyXG52YXIgQ29udGVudExheW91dENvbnRyb2xsZXIgPSByZXF1aXJlKFwiLi9tYWlsQ29udGVudExheW91dENvbnRyb2xsZXJcIik7XHJcblxyXG52YXIgTWFpbkxheW91dENvbnRyb2xsZXIgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haW5MYXlvdXRDb250cm9sbGVyID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dENvbnRyb2xsZXIgPSBuZXcgQ29udGVudExheW91dENvbnRyb2xsZXIoKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhhcHAuY29udGV4dCwgJ2NoYW5nZTptYWlsLmFjdGlvbicsIHRoaXMub25BY3Rpb25DaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHNldFZpZXdzXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNldFZpZXdzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaFZpZXcgPSBuZXcgU2VhcmNoVmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLm1haW5MYXlvdXQgPSBuZXcgTWFpbkxheW91dCgpO1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvblZpZXcgPSBuZXcgQWN0aW9uVmlldygpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1haW5MYXlvdXQsIFwicmVuZGVyXCIsIHRoaXMub25NYWluTGF5b3V0UmVuZGVyLCB0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIGFwcC5mcmFtZS5zZXRSZWdpb24oXCJzZWFyY2hcIiwgdGhpcy5zZWFyY2hWaWV3KTtcclxuICAgICAgICAgICAgYXBwLmZyYW1lLnNldFJlZ2lvbihcImFjdGlvbnNcIiwgdGhpcy5hY3Rpb25WaWV3KTtcclxuICAgICAgICAgICAgYXBwLmZyYW1lLnNldFJlZ2lvbihcIm1haW5cIiwgdGhpcy5tYWluTGF5b3V0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25NYWluTGF5b3V0UmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmF2VmlldyA9IG5ldyBOYXZWaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbkxheW91dC5uYXZSZWdpb24uYWRkKG5hdlZpZXcpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGVtcHR5Rm9sZGVyVmlldyA9IG5ldyBFbXB0eUZvbGRlcnNWaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbkxheW91dC53b3JrUmVnaW9uLmFkZChlbXB0eUZvbGRlclZpZXcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG9uQWN0aW9uQ2hhbmdlXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uQWN0aW9uQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb24udHlwZVwiKTtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29tcG9zZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNYWlscygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGNvbXBvc2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjb21wb3NlVmlldyA9IG5ldyBDb21wb3NlVmlldyh7XHJcbiAgICAgICAgICAgICAgICBtb2RlbDogbmV3IE1haWxNb2RlbCgpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLm1haW5MYXlvdXQud29ya1JlZ2lvbi5hZGQoY29tcG9zZVZpZXcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93TWFpbHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5jb250ZW50TGF5b3V0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQgPSB0aGlzLmNvbnRlbnRMYXlvdXRDb250cm9sbGVyLm5ld0xheW91dCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubWFpbkxheW91dC53b3JrUmVnaW9uLmFkZCh0aGlzLmNvbnRlbnRMYXlvdXQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBNYWluTGF5b3V0Q29udHJvbGxlcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxuXHJcbnZhciBNYWlsUm91dGVyQ29udHJvbGxlciA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgTWFpbFJvdXRlckNvbnRyb2xsZXIgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgY29tcG9zZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCB7J3R5cGUnOiAnY29tcG9zZScsICdwYXJhbXMnOiB7fX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbmJveDogZnVuY3Rpb24gKHBhcmFtKSB7XHJcbiAgICAgICAgICAgIGFwcC5jb250ZXh0LnNldChcIm1haWwuYWN0aW9uXCIsIHsndHlwZSc6ICdpbmJveCcsICdwYXJhbXMnOiB0aGlzLmFuYWx5emVQYXJhbXMocGFyYW0pfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNlbnQ6IGZ1bmN0aW9uIChwYXJhbSkge1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCB7J3R5cGUnOiAnc2VudCcsICdwYXJhbXMnOiB0aGlzLmFuYWx5emVQYXJhbXMocGFyYW0pfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGRyYWZ0OiBmdW5jdGlvbiAocGFyYW0pIHtcclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibWFpbC5hY3Rpb25cIiwgeyd0eXBlJzogJ2RyYWZ0JywgJ3BhcmFtcyc6IHRoaXMuYW5hbHl6ZVBhcmFtcyhwYXJhbSl9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdHJhc2g6IGZ1bmN0aW9uIChwYXJhbSkge1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCB7J3R5cGUnOiAndHJhc2gnLCAncGFyYW1zJzogdGhpcy5hbmFseXplUGFyYW1zKHBhcmFtKX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzcGFtOiBmdW5jdGlvbiAocGFyYW0pIHtcclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibWFpbC5hY3Rpb25cIiwgeyd0eXBlJzogJ3NwYW0nLCAncGFyYW1zJzogdGhpcy5hbmFseXplUGFyYW1zKHBhcmFtKX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZWFyY2g6IGZ1bmN0aW9uIChwYXJhbTEsIHBhcmFtMikge1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCB7J3R5cGUnOiAnc2VhcmNoJywgJ3BhcmFtcyc6IHRoaXMuYW5hbHl6ZVBhcmFtcyhwYXJhbTIsIHBhcmFtMSl9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgYW5hbHl6ZVBhcmFtczogZnVuY3Rpb24gKGlkLCBxdWVyeSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHtwYWdlOiAxLCBxdWVyeTogcXVlcnl9O1xyXG5cclxuICAgICAgICAgICAgaWYoX3Muc3RhcnRzV2l0aChpZCwgXCJwXCIpKXtcclxuICAgICAgICAgICAgICAgIHZhciBwYWdlID0gaWQuc3BsaXQoXCJwXCIpWzFdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChfLmlzRmluaXRlKHBhZ2UpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zLnBhZ2UgPSBwYWdlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGJlZm9yZVJvdXRlXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBiZWZvcmVSb3V0ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibW9kdWxlXCIsIFwibWFpbFwiKTtcclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibWFpbC5hY3Rpb25cIiwgbnVsbCwge3NpbGVudDogdHJ1ZX0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsUm91dGVyQ29udHJvbGxlcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIERlZXBNb2RlbCA9IHJlcXVpcmUoXCJiYXNlLW1vZGVsXCIpO1xyXG5cclxudmFyIENvbnRhY3RNb2RlbCA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgQ29udGFjdE1vZGVsID0gRGVlcE1vZGVsLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGRlZmF1bHRzIDoge1xyXG4gICAgICAgICAgICB0aXRsZTonJyxcclxuICAgICAgICAgICAgYWRkcmVzczonJ1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbihyZXNwb25zZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6cmVzcG9uc2UucmVwbGFjZShcIixcIiwgXCIgXCIpLFxyXG4gICAgICAgICAgICAgICAgYWRkcmVzczpyZXNwb25zZS5yZXBsYWNlKFwiLFwiLCBcIi5cIikudG9Mb3dlckNhc2UoKSArIFwiQG1haWxkby5jb21cIlxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29udGFjdE1vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVGaWx0ZXJNb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XHJcblxyXG4gICAgc2V0SW5wdXQ6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgIHRoaXMuaW5wdXQgPSBfLmlzU3RyaW5nKGlucHV0KSA/IGlucHV0LnRvTG93ZXJDYXNlKCkgOiBcIlwiO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgcHJlZGljYXRlOiBmdW5jdGlvbiAobW9kZWwpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGVzdChtb2RlbC5nZXQoXCJ0ZXh0XCIpKSB8fCB0aGlzLnRlc3QobW9kZWwuZ2V0KFwidmFsdWVcIikpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHRlc3Q6IGZ1bmN0aW9uICh0ZXh0KSB7XHJcblxyXG4gICAgICAgIHZhciByZXMgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcodGV4dCkpIHtcclxuXHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICByZXMgPSBfcy5zdGFydHNXaXRoKHRleHQsIHRoaXMuaW5wdXQpIHx8XHJcbiAgICAgICAgICAgICAgICBfcy5jb250YWlucyh0ZXh0LCBcIiBcIiArIHRoaXMuaW5wdXQpIHx8XHJcbiAgICAgICAgICAgICAgICBfcy5jb250YWlucyh0ZXh0LCBcIjpcIiArIHRoaXMuaW5wdXQpIHx8XHJcbiAgICAgICAgICAgICAgICBfcy5jb250YWlucyh0ZXh0LCBcIi5cIiArIHRoaXMuaW5wdXQpIHx8XHJcbiAgICAgICAgICAgICAgICBfcy5jb250YWlucyh0ZXh0LCBcIkBcIiArIHRoaXMuaW5wdXQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGhpZ2hsaWdodEtleTogZnVuY3Rpb24gKGtleSkge1xyXG5cclxuICAgICAgICBpZiAoXy5pc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoXCJeXCIgKyB0aGlzLmlucHV0LCAnZ2knKSwgZnVuY3Rpb24gKHN0cikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnPGI+JyArIHN0ciArICc8L2I+JztcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5pbnB1dCwgJ2dpJyksIGZ1bmN0aW9uIChzdHIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyA8Yj4nICsgX3Muc3RyUmlnaHQoc3RyLCAnICcpICsgJzwvYj4nO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoXCI6XCIgKyB0aGlzLmlucHV0LCBcImdpXCIpLCBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc6PGI+JyArIF9zLnN0clJpZ2h0KHN0ciwgJzonKSArICc8L2I+JztcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKFwiQFwiICsgdGhpcy5pbnB1dCwgXCJnaVwiKSwgZnVuY3Rpb24gKHN0cikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnQDxiPicgKyBfcy5zdHJSaWdodChzdHIsICdAJykgKyAnPC9iPic7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UobmV3IFJlZ0V4cChcIlxcXFwuXCIgKyB0aGlzLmlucHV0LCBcImdpXCIpLCBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcuPGI+JyArIF9zLnN0clJpZ2h0KHN0ciwgJy4nKSArICc8L2I+JztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ga2V5O1xyXG4gICAgfVxyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGVGaWx0ZXJNb2RlbDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIEJhc2VNb2RlbCA9IHJlcXVpcmUoXCJiYXNlLW1vZGVsXCIpO1xyXG5cclxudmFyIE1haWxNb2RlbCA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgTWFpbE1vZGVsID0gQmFzZU1vZGVsLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgICAgIGZyb206ICcnLFxyXG4gICAgICAgICAgICB0bzogJycsXHJcbiAgICAgICAgICAgIGNjOiAnJyxcclxuICAgICAgICAgICAgYmNjOiAnJyxcclxuICAgICAgICAgICAgc3ViamVjdDogJycsXHJcbiAgICAgICAgICAgIHNlbnRUaW1lOiAnJyxcclxuICAgICAgICAgICAgYm9keTogJycsXHJcbiAgICAgICAgICAgIGxhYmVsczoge30sXHJcbiAgICAgICAgICAgIGdyb3VwczogW11cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZXNvdXJjZTogJ21haWwnLFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXR0cnMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXNlck5hbWUgPSBhcHAuc2V0dGluZ3MuZ2V0KFwidXNlck5hbWVcIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNvY2tldCA9IHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3ROYW1lOiB0aGlzLnJlc291cmNlLFxyXG4gICAgICAgICAgICAgICAgaW86IGFwcC5zb2NrZXRDb250cm9sbGVyLmdldFNvY2tldCgpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB1cmw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSArIFwiL1wiICsgdGhpcy5yZXNvdXJjZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBnZXQgYWRkcmVzc2VzXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGdldEluZ29pbmdBZGRyZXNzZXM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldEFkZHJlc3NlcygnZnJvbScpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBnZXRPdXRnb2luZ0FkZHJlc3NlczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0QWRkcmVzc2VzKCd0bycpLmNvbmNhdCh0aGlzLl9nZXRBZGRyZXNzZXMoJ2NjJyksIHRoaXMuX2dldEFkZHJlc3NlcygnYmNjJykpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfZ2V0QWRkcmVzc2VzOiBmdW5jdGlvbiAoYXR0cikge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFkZHJlc3NlcyA9IHRoaXMuZ2V0KGF0dHIpLnNwbGl0KFwiO1wiKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzRW1wdHkoXy5sYXN0KGFkZHJlc3NlcykpKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRyZXNzZXMgPSBfLmZpcnN0KGFkZHJlc3NlcywgYWRkcmVzc2VzLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhZGRyZXNzZXM7XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGFkZFxccmVtb3ZlIGFkZHJlc3NcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgYWRkQWRkcmVzczogZnVuY3Rpb24gKGF0dHIsIGFkZHJlc3MpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGFzdEFkZHJlc3MoYXR0ciwgYWRkcmVzcyArIFwiO1wiKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdXBkYXRlTGFzdEFkZHJlc3M6IGZ1bmN0aW9uIChhdHRyLCBhZGRyZXNzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWRkckxpc3QgPSB0aGlzLmdldChhdHRyKS5zcGxpdChcIjtcIik7XHJcbiAgICAgICAgICAgIGFkZHJMaXN0W2FkZHJMaXN0Lmxlbmd0aCAtIDFdID0gYWRkcmVzcztcclxuICAgICAgICAgICAgdGhpcy5zZXQoYXR0ciwgYWRkckxpc3Quam9pbihcIjtcIikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW1vdmVBZGRyZXNzOiBmdW5jdGlvbiAoYXR0ciwgYWRkcmVzcykge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFkZHJMaXN0ID0gdGhpcy5nZXQoYXR0cikucmVwbGFjZShhZGRyZXNzICsgXCI7XCIsIFwiXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNldChhdHRyLCBhZGRyTGlzdCk7XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHZhbGlkYXRlXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAoYXR0cnMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc2F2ZUFzICE9PSBcImRyYWZ0XCIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgb3V0Z29pbmdBZGRyZXNzZXMgPSB0aGlzLmdldE91dGdvaW5nQWRkcmVzc2VzKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoXy5pc0VtcHR5KG91dGdvaW5nQWRkcmVzc2VzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBNYWlsTW9kZWwuRXJyb3JzLk5vUmVjaXBpZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0byA9IHRoaXMuX2dldEFkZHJlc3NlcygndG8nKTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG8ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsaWRhdGVBZGRyZXNzKHRvW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWFpbE1vZGVsLkVycm9ycy5JbnZhbGlkVG9BZGRyZXNzO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgY2MgPSB0aGlzLl9nZXRBZGRyZXNzZXMoJ2NjJyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsaWRhdGVBZGRyZXNzKGNjW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWFpbE1vZGVsLkVycm9ycy5JbnZhbGlkQ2NBZGRyZXNzO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB2YWxpZGF0ZUFkZHJlc3M6IGZ1bmN0aW9uIChhZGRyZXNzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVnID0gL15cXHcrKFstKy4nXVxcdyspKkBcXHcrKFstLl1cXHcrKSpcXC5cXHcrKFstLl1cXHcrKSokLztcclxuICAgICAgICAgICAgcmV0dXJuIHJlZy50ZXN0KGFkZHJlc3MpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG1hcmtBc1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBtYXJrQXM6IGZ1bmN0aW9uIChsYWJlbCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIG9wcG9zaXRlTGFiZWwgPSB0aGlzLl9nZXRPcG9zaXRlTGFiZWwobGFiZWwpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlTGFiZWwob3Bwb3NpdGVMYWJlbCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2FkZExhYmVsKGxhYmVsKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2dldE9wb3NpdGVMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoX3Muc3RhcnRzV2l0aChsYWJlbCwgXCJ1blwiKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9zLnN0clJpZ2h0KGxhYmVsLCBcInVuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBcInVuXCIgKyBsYWJlbDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2FkZExhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5nZXQoXCJsYWJlbHMuXCIgKyBsYWJlbCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KFwibGFiZWxzLlwiICsgbGFiZWwsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9yZW1vdmVMYWJlbDogZnVuY3Rpb24gKGxhYmVsTmFtZSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGxhYmVscyA9IHRoaXMuZ2V0KCdsYWJlbHMnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmhhcyhsYWJlbHMsIGxhYmVsTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBsYWJlbHNbbGFiZWxOYW1lXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG1vdmVUb1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBtb3ZlVG86IGZ1bmN0aW9uIChkZXN0KSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZ3JvdXBzID0gdGhpcy5nZXQoJ2dyb3VwcycpO1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uY29udGFpbnMoZ3JvdXBzLCBcInRyYXNoXCIpIHx8IF8uY29udGFpbnMoZ3JvdXBzLCBcInNwYW1cIikgfHwgZGVzdCA9PT0gXCJ0cmFzaFwiIHx8IGRlc3QgPT09IFwic3BhbVwiKSB7XHJcbiAgICAgICAgICAgICAgICBncm91cHMgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ3JvdXBzLnB1c2goZGVzdCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KCdncm91cHMnLCBncm91cHMpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIE1haWxNb2RlbC5FcnJvcnMgPSB7XHJcblxyXG4gICAgICAgIE5vUmVjaXBpZW50OiAxLFxyXG4gICAgICAgIEludmFsaWRUb0FkZHJlc3M6IDIsXHJcbiAgICAgICAgSW52YWxpZENjQWRkcmVzczogM1xyXG4gICAgfTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbE1vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgTWFpbFJvdXRlciA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgTWFpbFJvdXRlciA9IE1hcmlvbmV0dGUuQXBwUm91dGVyLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGFwcFJvdXRlczoge1xyXG4gICAgICAgICAgICBcIlwiOiBcImluYm94XCIsXHJcbiAgICAgICAgICAgIFwiaW5ib3hcIjogXCJpbmJveFwiLFxyXG4gICAgICAgICAgICBcImluYm94LzpwYXJhbVwiOiBcImluYm94XCIsXHJcbiAgICAgICAgICAgIFwiZHJhZnRcIjogXCJkcmFmdFwiLFxyXG4gICAgICAgICAgICBcImRyYWZ0LzpwYXJhbVwiOiBcImRyYWZ0XCIsXHJcbiAgICAgICAgICAgIFwic2VudFwiOiBcInNlbnRcIixcclxuICAgICAgICAgICAgXCJzZW50LzpwYXJhbVwiOiBcInNlbnRcIixcclxuICAgICAgICAgICAgXCJ0cmFzaFwiOiBcInRyYXNoXCIsXHJcbiAgICAgICAgICAgIFwidHJhc2gvOnBhcmFtXCI6IFwidHJhc2hcIixcclxuICAgICAgICAgICAgXCJzcGFtXCI6IFwic3BhbVwiLFxyXG4gICAgICAgICAgICBcInNwYW0vOnBhcmFtXCI6IFwic3BhbVwiLFxyXG4gICAgICAgICAgICBcInNlYXJjaC86cGFyYW0xXCI6IFwic2VhcmNoXCIsXHJcbiAgICAgICAgICAgIFwic2VhcmNoLzpwYXJhbTEvOnBhcmFtMlwiOiBcInNlYXJjaFwiLFxyXG4gICAgICAgICAgICBcImNvbXBvc2VcIjogXCJjb21wb3NlXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xsZXIgPSBvcHRpb25zLmNvbnRyb2xsZXI7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcm91dGU6IGZ1bmN0aW9uIChyb3V0ZSwgbmFtZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgcmV0dXJuIEJhY2tib25lLlJvdXRlci5wcm90b3R5cGUucm91dGUuY2FsbCh0aGlzLCByb3V0ZSwgbmFtZSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250cm9sbGVyLmJlZm9yZVJvdXRlKCk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBwcmV2aW91czogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBtYWlsLnJvdXRlci5uYXZpZ2F0ZShcImluYm94XCIsIHt0cmlnZ2VyOiB0cnVlfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGZpeFVybDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsUm91dGVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxucmVxdWlyZShcInBsdWdpbnMvdG9nZ2xlLmJsb2NrXCIpO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9tb3JlQWN0aW9uc1ZpZXcuaGJzXCIpO1xyXG5cclxudmFyIE1vcmVBY3Rpb25zVmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcbiAgICBNb3JlQWN0aW9uc1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICBjbGFzc05hbWU6ICdhY3Rpb25PcHRpb25zVmlldycsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIGRkaVN0YXJyZWQ6XCIuYWRkU3RhclwiLFxyXG4gICAgICAgICAgICBkZGlOb3RTdGFycmVkOlwiLnJlbW92ZVN0YXJcIixcclxuICAgICAgICAgICAgZGRpSW1wOlwiLm1hcmtJbXBcIixcclxuICAgICAgICAgICAgZGRpTm90SW1wOlwiLm1hcmtOb3RJbXBcIixcclxuICAgICAgICAgICAgZGRpUmVhZDpcIi5tYXJrUmVhZFwiLFxyXG4gICAgICAgICAgICBkZGlVbnJlYWQ6XCIubWFya1VucmVhZFwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaVJlYWRcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHtsYWJlbDogJ3JlYWQnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaVVucmVhZFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptYXJrQXNcIiwge2xhYmVsOiAndW5yZWFkJ30pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5kZGlJbXBcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHtsYWJlbDogJ2ltcG9ydGFudCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpTm90SW1wXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1hcmtBc1wiLCB7IGxhYmVsOiAndW5pbXBvcnRhbnQnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaVN0YXJyZWRcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHtsYWJlbDogJ3N0YXJyZWQnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaU5vdFN0YXJyZWRcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHtsYWJlbDogJ3Vuc3RhcnJlZCd9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJtYWlsOmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6aXRlbXMgdXBkYXRlOnN1Y2Nlc3MgY2hhbmdlOnNlbGVjdGlvblwiLCB0aGlzLnNldERyb3BEb3duSXRlbXMsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNldERyb3BEb3duSXRlbXM6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBpdGVtcyA9IHRoaXMuaXRlbXNUb1Nob3coKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudWkuZGRpU3RhcnJlZC50b2dnbGVCbG9jayhpdGVtcy5zdGFyZWQpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaU5vdFN0YXJyZWQudG9nZ2xlQmxvY2soaXRlbXNbXCJub3Qtc3RhcmVkXCJdKTtcclxuICAgICAgICAgICAgdGhpcy51aS5kZGlJbXAudG9nZ2xlQmxvY2soaXRlbXMuaW1wb3J0YW50KTtcclxuICAgICAgICAgICAgdGhpcy51aS5kZGlOb3RJbXAudG9nZ2xlQmxvY2soaXRlbXNbXCJub3QtaW1wb3J0YW50XCJdKTtcclxuICAgICAgICAgICAgdGhpcy51aS5kZGlSZWFkLnRvZ2dsZUJsb2NrKGl0ZW1zLnJlYWQpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaVVucmVhZC50b2dnbGVCbG9jayhpdGVtcy51bnJlYWQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGl0ZW1zVG9TaG93OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXMsIGl0ZW1zID0ge307XHJcblxyXG4gICAgICAgICAgICBfLmVhY2godGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpLCBmdW5jdGlvbiAoaXRlbSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9IHRoYXQubWFpbHMuZ2V0KGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgaWYobW9kZWwpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsYWJlbHMgPSBtb2RlbC5nZXQoXCJsYWJlbHNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC51cGRhdGVJdGVtVG9TaG93KGxhYmVscyxpdGVtcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gaXRlbXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB1cGRhdGVJdGVtVG9TaG93OmZ1bmN0aW9uKGxhYmVscyxpdGVtcyl7XHJcblxyXG4gICAgICAgICAgICBpZihfLmhhcyhsYWJlbHMsXCJzdGFycmVkXCIpKXtcclxuICAgICAgICAgICAgICAgIGl0ZW1zW1wibm90LXN0YXJlZFwiXSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgaXRlbXMuc3RhcmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihfLmhhcyhsYWJlbHMsXCJpbXBvcnRhbnRcIikpe1xyXG4gICAgICAgICAgICAgICAgaXRlbXNbXCJub3QtaW1wb3J0YW50XCJdID0gdHJ1ZTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBpdGVtcy5pbXBvcnRhbnQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKF8uaGFzKGxhYmVscyxcInJlYWRcIikpe1xyXG4gICAgICAgICAgICAgICAgaXRlbXMudW5yZWFkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBpdGVtcy5yZWFkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9yZUFjdGlvbnNWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvbW92ZVRvVmlldy5oYnNcIik7XHJcblxyXG5yZXF1aXJlKFwicGx1Z2lucy90b2dnbGUuYmxvY2tcIik7XHJcblxyXG52YXIgTW9yZVZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG4gICAgTW9yZVZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICBjbGFzc05hbWU6ICdtb3ZlVG9WaWV3JyxcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgZGRpSW5ib3g6IFwiLm1vdmVUb0luYm94XCIsXHJcbiAgICAgICAgICAgIGRkaVRyYXNoOiBcIi5tb3ZlVG9UcmFzaFwiLFxyXG4gICAgICAgICAgICBkZGlTcGFtOiBcIi5tb3ZlVG9TcGFtXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpSW5ib3hcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bW92ZVRvXCIsIHt0YXJnZXQ6ICdpbmJveCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpVHJhc2hcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bW92ZVRvXCIsIHt0YXJnZXQ6ICd0cmFzaCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpU3BhbVwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptb3ZlVG9cIiwge3RhcmdldDogJ3NwYW0nfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsICdjaGFuZ2U6bWFpbC5hY3Rpb24nLCB0aGlzLnNob3dSZWxldmFudEl0ZW1zLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNob3dSZWxldmFudEl0ZW1zOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmN1cnJBY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvbi50eXBlXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy51aS5kZGlJbmJveC50b2dnbGVCbG9jayghXy5jb250YWlucyhbXCJpbmJveFwiXSwgdGhpcy5jdXJyQWN0aW9uKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuZGRpU3BhbS50b2dnbGVCbG9jayhfLmNvbnRhaW5zKFtcImluYm94XCIsIFwidHJhc2hcIl0sIHRoaXMuY3VyckFjdGlvbikpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaVRyYXNoLnRvZ2dsZUJsb2NrKF8uY29udGFpbnMoW1wic3BhbVwiLCBcImluYm94XCJdLCB0aGlzLmN1cnJBY3Rpb24pKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vcmVWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvcGFnZXJWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBQYWdlclZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG4gICAgUGFnZXJWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG5cclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiAncGFnZUluZm9WaWV3JyxcclxuICAgICAgICBwYWdlSW5mbzoge30sXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjpcIi5wYWdlcklubmVyQ29udGFpbmVyXCIsXHJcbiAgICAgICAgICAgIGJ0bk5ld2VyOiBcIi5idG5OZXdlclwiLFxyXG4gICAgICAgICAgICBidG5PbGRlcjogXCIuYnRuT2xkZXJcIixcclxuICAgICAgICAgICAgbGJsVG90YWw6IFwiLnRvdGFsXCIsXHJcbiAgICAgICAgICAgIGxibEZyb206IFwiLmxibEZvcm1cIixcclxuICAgICAgICAgICAgbGJsVG86IFwiLmxibFRvXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuYnRuTmV3ZXJcIjogXCJzaG93TmV3ZXJJdGVtc1wiLFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5idG5PbGRlclwiOiBcInNob3dPbGRlckl0ZW1zXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1haWxzLCBcImNoYW5nZTptZXRhZGF0YVwiLHRoaXMuYWRqdXN0UGFnZSwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgdGhpcy5hZGp1c3RQYWdlKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gYWRqdXN0UGFnZVxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBhZGp1c3RQYWdlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZihfLmlzT2JqZWN0KHRoaXMubWFpbHMubWV0YWRhdGEpICYmIHRoaXMubWFpbHMubWV0YWRhdGEudG90YWwgPiAwKXtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVBhZ2VJbmZvKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkanVzdEJ1dHRvbnMoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRqdXN0TGFiZWxzKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVpLmNvbnRhaW5lci5zaG93KCk7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgdGhpcy51aS5jb250YWluZXIuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHVwZGF0ZVBhZ2VJbmZvOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgbWV0YWRhdGEgPSB0aGlzLm1haWxzLm1ldGFkYXRhO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wYWdlSW5mby50b3RhbCA9IG1ldGFkYXRhLnRvdGFsO1xyXG4gICAgICAgICAgICB0aGlzLnBhZ2VJbmZvLmN1cnJQYWdlID0gbWV0YWRhdGEuY3VyclBhZ2UgKyAxO1xyXG4gICAgICAgICAgICB0aGlzLnBhZ2VJbmZvLmZyb20gPSBtZXRhZGF0YS5mcm9tICsgMTtcclxuICAgICAgICAgICAgdGhpcy5wYWdlSW5mby50byA9IE1hdGgubWluKG1ldGFkYXRhLnRvdGFsLCBtZXRhZGF0YS50byArIDEpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBhZGp1c3RCdXR0b25zOiBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy51aS5idG5OZXdlci50b2dnbGVDbGFzcyhcImRpc2FibGVcIix0aGlzLnBhZ2VJbmZvLmZyb20gPT09IDEpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmJ0bk9sZGVyLnRvZ2dsZUNsYXNzKFwiZGlzYWJsZVwiLHRoaXMucGFnZUluZm8udG8gPj0gdGhpcy5wYWdlSW5mby50b3RhbCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGFkanVzdExhYmVsczogZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudWkubGJsRnJvbS50ZXh0KHRoaXMucGFnZUluZm8uZnJvbSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkubGJsVG8udGV4dChNYXRoLm1pbih0aGlzLnBhZ2VJbmZvLnRvLCB0aGlzLnBhZ2VJbmZvLnRvdGFsKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkubGJsVG90YWwudGV4dCh0aGlzLnBhZ2VJbmZvLnRvdGFsKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBidXR0b25zIGNsaWNrXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNob3dOZXdlckl0ZW1zOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5wYWdlSW5mby5mcm9tID4gMSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5hdmlnYXRlKHRoaXMucGFnZUluZm8uY3VyclBhZ2UgLSAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93T2xkZXJJdGVtczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMucGFnZUluZm8udG8gPCB0aGlzLnBhZ2VJbmZvLnRvdGFsKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubmF2aWdhdGUodGhpcy5wYWdlSW5mby5jdXJyUGFnZSArIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG5hdmlnYXRlOiBmdW5jdGlvbihwYWdlKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvblwiKTtcclxuICAgICAgICAgICAgdmFyIHNlYXJjaCA9IGFjdGlvbi5wYXJhbXMucXVlcnkgPyBcIi9cIiArIGFjdGlvbi5wYXJhbXMucXVlcnkgOiBcIlwiO1xyXG4gICAgICAgICAgICBtYWlsLnJvdXRlci5uYXZpZ2F0ZShhY3Rpb24udHlwZSArIHNlYXJjaCArIFwiL3BcIiArIHBhZ2UudG9TdHJpbmcoKSwgeyB0cmlnZ2VyOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGFnZXJWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgUGFnZXJWaWV3ID0gcmVxdWlyZShcIi4vX3BhZ2VyVmlld1wiKTtcclxudmFyIE1vdmVUb1ZpZXcgPSByZXF1aXJlKFwiLi9fbW92ZVRvVmlld1wiKTtcclxudmFyIE1vcmVBY3Rpb25zVmlldyA9IHJlcXVpcmUoXCIuL19tb3JlQWN0aW9uc1ZpZXdcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9hY3Rpb25WaWV3Lmhic1wiKTtcclxuXHJcbnZhciBBY3Rpb25WaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuICAgIEFjdGlvblZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogJ2FjdGlvblZpZXcnLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBidG5TZWxlY3Q6IFwiLmJ0blNlbGVjdFwiLFxyXG4gICAgICAgICAgICBidG5Nb3ZlVG86IFwiLmJ0bk1vdmVUb1wiLFxyXG4gICAgICAgICAgICBidG5EZWxldGU6IFwiLmJ0bkRlbGV0ZVwiLFxyXG4gICAgICAgICAgICBidG5Nb3JlOiBcIi5idG5Nb3JlXCIsXHJcbiAgICAgICAgICAgIHBhZ2VyUmVnaW9uOiBcIi5wYWdlclwiLFxyXG4gICAgICAgICAgICBzZXJ2ZXJBY3Rpb25zUmVnaW9uOiBcIi5zZXJ2ZXJBY3Rpb25zXCIsXHJcbiAgICAgICAgICAgIGxibENvbXBvc2U6XCIubGJsQ29tcG9zZVwiLFxyXG4gICAgICAgICAgICBidG5EaXNjYXJkRHJhZnRzOiBcIi5idG5EaXNjYXJkRHJhZnRzXCIsXHJcbiAgICAgICAgICAgIGJ0bkRlbGV0ZUZvcmV2ZXI6IFwiLmJ0bkRlbGV0ZUZvcmV2ZXJcIixcclxuICAgICAgICAgICAgYnRuTm90U3BhbTogXCIuYnRuTm90U3BhbVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgIFwiY2xpY2sgLnNlbGVjdEFsbFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpzZWxlY3RcIiwge3NlbGVjdEJ5OiBcImFsbFwifSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgLnNlbGVjdE5vbmVcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6c2VsZWN0XCIsIHtzZWxlY3RCeTogXCJub25lXCJ9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayAuc2VsZWN0UmVhZFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpzZWxlY3RcIiwge3NlbGVjdEJ5OiBcInJlYWRcIn0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIC5zZWxlY3RVbnJlYWRcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6c2VsZWN0XCIsIHtzZWxlY3RCeTogXCJ1bnJlYWRcIn0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5idG5EZWxldGVcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bW92ZVRvXCIsIHt0YXJnZXQ6ICd0cmFzaCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuYnRuTm90U3BhbVwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptb3ZlVG9cIiwge3RhcmdldDogJ2luYm94J30pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5idG5EaXNjYXJkRHJhZnRzXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOmRlbGV0ZVwiKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuYnRuRGVsZXRlRm9yZXZlclwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpkZWxldGVcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgXCJtYWlsOmNoYW5nZVwiLCB0aGlzLm9uTWFpbENoYW5nZSwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6c2VsZWN0aW9uXCIsIHRoaXMuc2hvd1JlbGV2YW50SXRlbXMsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKGFwcC5jb250ZXh0LCAnY2hhbmdlOm1haWwuYWN0aW9uJywgdGhpcy5zaG93UmVsZXZhbnRJdGVtcywgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm57XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246IF9zLmNhcGl0YWxpemUoYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb24udHlwZVwiKSlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wYWdlclZpZXcgPSBuZXcgUGFnZXJWaWV3KHtcclxuICAgICAgICAgICAgICAgIGVsOiB0aGlzLnVpLnBhZ2VyUmVnaW9uXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnBhZ2VyVmlldy5yZW5kZXIoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubW9yZUFjdGlvbnNWaWV3ID0gbmV3IE1vcmVBY3Rpb25zVmlldyh7XHJcbiAgICAgICAgICAgICAgICBlbDogdGhpcy51aS5idG5Nb3JlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLm1vcmVBY3Rpb25zVmlldy5yZW5kZXIoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubW92ZVRvVmlldyA9IG5ldyBNb3ZlVG9WaWV3KHtcclxuICAgICAgICAgICAgICAgIGVsOiB0aGlzLnVpLmJ0bk1vdmVUb1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5tb3ZlVG9WaWV3LnJlbmRlcigpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gc2hvd1JlbGV2YW50SXRlbXNcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93UmVsZXZhbnRJdGVtczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uLnR5cGVcIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJlc2V0VUkoKTtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29tcG9zZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0l0ZW1zKFtcImxibENvbXBvc2VcIl0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dMaXN0T3B0aW9ucyhhY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJlc2V0VUk6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0l0ZW1zKF8ua2V5cyh0aGlzLnVpKSwgZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmxibENvbXBvc2UudGV4dChhcHAudHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOm5ld01lc3NhZ2VcIikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNob3dMaXN0T3B0aW9uczogZnVuY3Rpb24gKGFjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zaG93SXRlbXMoW1wiYnRuU2VsZWN0XCIsIFwicGFnZXJSZWdpb25cIl0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFfLmlzRW1wdHkodGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImRyYWZ0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0l0ZW1zKFtcImJ0blNlbGVjdFwiLCBcImJ0bkRpc2NhcmREcmFmdHNcIiwgXCJidG5Nb3JlXCJdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNwYW1cIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SXRlbXMoW1wiYnRuU2VsZWN0XCIsIFwiYnRuTm90U3BhbVwiLCBcImJ0bkRlbGV0ZUZvcmV2ZXJcIiwgXCJidG5Nb3JlXCJdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRyYXNoXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0l0ZW1zKFtcImJ0blNlbGVjdFwiLCBcImJ0bkRlbGV0ZUZvcmV2ZXJcIiwgXCJidG5Nb3ZlVG9cIiwgXCJidG5Nb3JlXCJdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SXRlbXMoW1wiYnRuU2VsZWN0XCIsIFwiYnRuRGVsZXRlXCIsIFwiYnRuTW92ZVRvXCIsIFwiYnRuTW9yZVwiXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvd0l0ZW1zOiBmdW5jdGlvbiAoaXRlbXMsIHNob3cpIHtcclxuXHJcbiAgICAgICAgICAgIHNob3cgPSBfLmlzQm9vbGVhbihzaG93KSA/IHNob3cgOiB0cnVlO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBfLmJpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudWlbaXRlbV0udG9nZ2xlKHNob3cpO1xyXG4gICAgICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBvbk1haWxDaGFuZ2VcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbk1haWxDaGFuZ2U6ZnVuY3Rpb24obWFpbE1vZGVsKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdWJqZWN0ID0gbWFpbE1vZGVsLmdldCgnc3ViamVjdCcpO1xyXG5cclxuICAgICAgICAgICAgaWYoXy5pc0VtcHR5KHN1YmplY3QpKXtcclxuICAgICAgICAgICAgICAgIHN1YmplY3QgPSBhcHAudHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOm5ld01lc3NhZ2VcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy51aS5sYmxDb21wb3NlLnRleHQoc3ViamVjdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBY3Rpb25WaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgVGFncyA9IHJlcXVpcmUoXCJ0YWdzXCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlID0gcmVxdWlyZShcImF1dG9Db21wbGV0ZVwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL19hZGRyZXNzVmlldy5oYnNcIik7XHJcbnZhciBDb250YWN0c0ZpbHRlck1vZGVsID0gcmVxdWlyZShcIm1haWwtbW9kZWxzL2NvbnRhY3RzRmlsdGVyTW9kZWxcIik7XHJcblxyXG52YXIgQWRkcmVzc1ZpZXcgPXt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsICBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG4gICAgQWRkcmVzc1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGNsYXNzTmFtZTogJ2FkZHJlc3NWaWV3JyxcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIHRhZ3NQbGFjZWhvbGRlcjogXCIudGFnc1BsYWNlaG9sZGVyXCIsXHJcbiAgICAgICAgICAgIGF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyOiBcIi5hdXRvQ29tcGxldGVQbGFjZWhvbGRlclwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gaW5pdGlhbGl6ZVxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOmZ1bmN0aW9uKG9wdGlvbnMpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tb2RlbEF0dHIgPSBvcHRpb25zLm1vZGVsQXR0cjtcclxuICAgICAgICAgICAgdGhpcy52ZW50ID0gbmV3IEJhY2tib25lLldyZXFyLkV2ZW50QWdncmVnYXRvcigpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwiY29udGFjdDpjb2xsZWN0aW9uXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcInRhZzphZGRcIiwgdGhpcy5hZGRBZGRyZXNzLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsIFwidGFnOnJlbW92ZVwiLCB0aGlzLnJlbW92ZUFkZHJlc3MsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJpbnB1dDpjaGFuZ2VcIiwgdGhpcy51cGRhdGVMYXN0QWRkcmVzcywgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5jb250YWN0cywgXCJmZXRjaDpzdWNjZXNzXCIsIHRoaXMucmVuZGVyQXV0b0NvbXBvbmVudCwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25SZW5kZXJcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25SZW5kZXI6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyVGFnQ29tcG9uZW50KCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQXV0b0NvbXBvbmVudCgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW5kZXJUYWdDb21wb25lbnQ6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudGFncyA9IG5ldyBUYWdzKHtcclxuICAgICAgICAgICAgICAgIGVsOnRoaXMudWkudGFnc1BsYWNlaG9sZGVyLFxyXG4gICAgICAgICAgICAgICAgdmVudDogdGhpcy52ZW50LFxyXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yOiB0aGlzLm1vZGVsLnZhbGlkYXRlQWRkcmVzcyxcclxuICAgICAgICAgICAgICAgIGluaXRpYWxUYWdzOiB0aGlzLmdldEFkZHJlc3NlcygpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnRhZ3Muc2hvdygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW5kZXJBdXRvQ29tcG9uZW50OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICBpZighdGhpcy5hdXRvQ29tcGxldGUgJiYgIXRoaXMuY29udGFjdHMuaXNFbXB0eSgpKXtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmF1dG9Db21wbGV0ZSA9IG5ldyBBdXRvQ29tcGxldGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudCxcclxuICAgICAgICAgICAgICAgICAgICBpdGVtczogdGhpcy5nZXRDb250YWN0QXJyYXkoKSxcclxuICAgICAgICAgICAgICAgICAgICBlbDp0aGlzLnVpLmF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlck1vZGVsOiBuZXcgQ29udGFjdHNGaWx0ZXJNb2RlbCgpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZ2V0Q29udGFjdEFycmF5OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgX2NvbnRhY3RzID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RzLmVhY2goZnVuY3Rpb24obW9kZWwpe1xyXG4gICAgICAgICAgICAgICAgX2NvbnRhY3RzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IG1vZGVsLmdldChcInRpdGxlXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtb2RlbC5nZXQoXCJhZGRyZXNzXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IEF1dG9Db21wbGV0ZS5UWVBFUy5DT05UQUNUXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBfY29udGFjdHM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBnZXRBZGRyZXNzZXM6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXMgPSBbXSwgYWRkcmVzc2VzID0gdGhpcy5tb2RlbC5nZXQodGhpcy5tb2RlbEF0dHIpO1xyXG5cclxuICAgICAgICAgICAgaWYoIV8uaXNFbXB0eShhZGRyZXNzZXMpKXtcclxuICAgICAgICAgICAgICAgIHZhciBhZGRyZXNzQXJyID0gX3Muc3RyTGVmdEJhY2soYWRkcmVzc2VzLCBcIjtcIikuc3BsaXQoXCI7XCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIF8uZWFjaChhZGRyZXNzQXJyLCBmdW5jdGlvbihhZGRyZXNzKXtcclxuICAgICAgICAgICAgICAgICAgICByZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6bWFpbC5kYXRhQ29udHJvbGxlci5jb250YWN0Q29sbGVjdGlvbi5nZXRUaXRsZXMoW2FkZHJlc3NdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6YWRkcmVzc1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGFkZEFkZHJlc3M6IGZ1bmN0aW9uKGFkZHJlc3Mpe1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmFkZEFkZHJlc3ModGhpcy5tb2RlbEF0dHIsIGFkZHJlc3MpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdXBkYXRlTGFzdEFkZHJlc3M6IGZ1bmN0aW9uKGFkZHJlc3Mpe1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLnVwZGF0ZUxhc3RBZGRyZXNzKHRoaXMubW9kZWxBdHRyLCBhZGRyZXNzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJlbW92ZUFkZHJlc3M6IGZ1bmN0aW9uKGFkZHJlc3Mpe1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLnJlbW92ZUFkZHJlc3ModGhpcy5tb2RlbEF0dHIsIGFkZHJlc3MpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWRkcmVzc1ZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBBZGRyZXNzVmlldyA9IHJlcXVpcmUoXCIuL19hZGRyZXNzVmlld1wiKTtcclxudmFyIE1haWxNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9tYWlsTW9kZWxcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9jb21wb3NlVmlldy5oYnNcIik7XHJcblxyXG52YXIgQ29tcG9zZVZpZXcgPXt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBtYiwgIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcbiAgICBDb21wb3NlVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiAnY29tcG9zZVZpZXcnLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICB0b0lucHV0V3JhcHBlcjogXCIudG9JbnB1dFdyYXBwZXJcIixcclxuICAgICAgICAgICAgY2NJbnB1dFdyYXBwZXI6IFwiLmNjSW5wdXRXcmFwcGVyXCIsXHJcbiAgICAgICAgICAgIGlucHV0U3ViamVjdDogXCIuc3ViamVjdFwiLFxyXG4gICAgICAgICAgICBpbnB1dEVkaXRvcjogXCIuY29tcG9zZS1lZGl0b3JcIixcclxuICAgICAgICAgICAgaGVhZGVyOlwiLmNvbXBvc2UtaGVhZGVyXCIsXHJcbiAgICAgICAgICAgIGNjTGluZTogJy5jY0xpbmUnLFxyXG4gICAgICAgICAgICBzZW5kQnRuOlwiLnNlbmRCdG5cIixcclxuICAgICAgICAgICAgY2xvc2VCdG46XCIuY2xvc2VCdG5cIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNsaWNrICBAdWkuY2xvc2VCdG5cIjogXCJvbkNsb3NlQnRuQ2xpY2tcIixcclxuICAgICAgICAgICAgXCJjbGljayAgQHVpLnNlbmRCdG5cIjogXCJvblNlbmRDbGlja1wiLFxyXG4gICAgICAgICAgICBcImJsdXIgICBAdWkuaW5wdXRTdWJqZWN0XCI6IFwib25TdWJqZWN0Qmx1clwiLFxyXG4gICAgICAgICAgICBcImJsdXIgICBAdWkuaW5wdXRFZGl0b3JcIjogXCJvbkVkaXRvckJsdXJcIixcclxuICAgICAgICAgICAgXCJjbGljayAgQHVpLnRvSW5wdXRXcmFwcGVyXCI6IFwib25Ub0lucHV0V3JhcHBlckNsaWNrXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgIEB1aS5jY0lucHV0V3JhcHBlclwiOiBcIm9uQ2NJbnB1dFdyYXBwZXJDbGlja1wiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbW9kZWxFdmVudHM6e1xyXG4gICAgICAgICAgY2hhbmdlOlwib25Nb2RlbENoYW5nZVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTpmdW5jdGlvbihvcHRpb25zKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdHMgPSBvcHRpb25zLmNvbnRhY3RzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25SZW5kZXJcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJUb1ZpZXcoKTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJDY1ZpZXcoKTtcclxuICAgICAgICAgICAgdGhpcy51aS5pbnB1dEVkaXRvci5odG1sKHRoaXMubW9kZWwuZ2V0KCdib2R5JykpO1xyXG4gICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcmVuZGVyVG9WaWV3OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRvVmlldyA9IG5ldyBBZGRyZXNzVmlldyh7XHJcbiAgICAgICAgICAgICAgICBtb2RlbDp0aGlzLm1vZGVsLFxyXG4gICAgICAgICAgICAgICAgbW9kZWxBdHRyOid0bycsXHJcbiAgICAgICAgICAgICAgICBlbDogdGhpcy51aS50b0lucHV0V3JhcHBlclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy50b1ZpZXcucmVuZGVyKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJlbmRlckNjVmlldzpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jY1ZpZXcgPSBuZXcgQWRkcmVzc1ZpZXcoe1xyXG4gICAgICAgICAgICAgICAgbW9kZWw6dGhpcy5tb2RlbCxcclxuICAgICAgICAgICAgICAgIG1vZGVsQXR0cjonY2MnLFxyXG4gICAgICAgICAgICAgICAgZWw6IHRoaXMudWkuY2NJbnB1dFdyYXBwZXJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuY2NWaWV3LnJlbmRlcigpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGV2ZW50cyBoYW5kbGVyc1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblN1YmplY3RCbHVyOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLnNldCgnc3ViamVjdCcsIHRoaXMudWkuaW5wdXRTdWJqZWN0LnZhbCgpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25FZGl0b3JCbHVyOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLnNldCgnYm9keScsdGhpcy51aS5pbnB1dEVkaXRvci5odG1sKCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblNlbmRDbGljazpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpzZW5kXCIsdGhpcy5tb2RlbCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uQ2xvc2VCdG5DbGljazpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpkaXNjYXJkXCIsdGhpcy5tb2RlbCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uVG9JbnB1dFdyYXBwZXJDbGljazpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLnVpLnRvSW5wdXRXcmFwcGVyLnJlbW92ZUNsYXNzKFwiZXJyb3JcIik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uQ2NJbnB1dFdyYXBwZXJDbGljazpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLnVpLmNjSW5wdXRXcmFwcGVyLnJlbW92ZUNsYXNzKFwiZXJyb3JcIik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uTW9kZWxDaGFuZ2U6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6Y2hhbmdlXCIsdGhpcy5tb2RlbCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uSW52YWxpZDpmdW5jdGlvbihtb2RlbCwgZXJyb3Ipe1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoKGVycm9yKXtcclxuICAgICAgICAgICAgICAgIGNhc2UgTWFpbE1vZGVsLkVycm9ycy5Ob1JlY2lwaWVudDogY2FzZSBNYWlsTW9kZWwuRXJyb3JzLkludmFsaWRUb0FkZHJlc3M6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51aS50b0lucHV0V3JhcHBlci5hZGRDbGFzcyhcImVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBNYWlsTW9kZWwuRXJyb3JzLkludmFsaWRDY0FkZHJlc3M6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51aS5jY0lucHV0V3JhcHBlci5hZGRDbGFzcyhcImVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb21wb3NlVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL2VtcHR5Rm9sZGVyVmlldy5oYnNcIik7XHJcblxyXG52YXIgRW1wdHlGb2xkZXJWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBFbXB0eUZvbGRlclZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGlzUGVybWFuZW50OiB0cnVlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogXCJlbXB0eS1mb2xkZXJcIixcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgXCJtc2dUaXRsZVwiOiBcIi5tc2dUaXRsZVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1haWxzLCBcImNoYW5nZTppdGVtcyB1cGRhdGU6c3VjY2VzcyBkZWxldGU6c3VjY2VzcyBmZXRjaDpzdWNjZXNzXCIsIHRoaXMuX2NoZWNrSWZFbXB0eSwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfY2hlY2tJZkVtcHR5OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgaXNFbXB0eSA9IHRoaXMubWFpbHMuaXNFbXB0eSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzRW1wdHkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvblwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudWkubXNnVGl0bGUuaHRtbChhcHAudHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOmVtcHR5Rm9sZGVyLlwiICsgYWN0aW9uLnR5cGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLiRlbC50b2dnbGUoaXNFbXB0eSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbXB0eUZvbGRlclZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9lbXB0eU1haWxWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBFbXB0eU1haWxWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBFbXB0eU1haWxWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICBpc1Blcm1hbmVudDogdHJ1ZSxcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgY291bnRlcjogXCIuY291bnRlclwiLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIi5tZXNzYWdlXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6c2VsZWN0aW9uXCIsIHRoaXMub25TZWxlY3Rpb25DaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25TZWxlY3Rpb25DaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMubWFpbHMuZ2V0U2VsZWN0ZWQoKS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVpLmNvdW50ZXIuaHRtbChzZWxlY3RlZCk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuY291bnRlci50b2dnbGUoc2VsZWN0ZWQgPiAwKTtcclxuICAgICAgICAgICAgdGhpcy51aS5tZXNzYWdlLnRvZ2dsZShzZWxlY3RlZCA9PT0gMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbXB0eU1haWxWaWV3O1xyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIGxheW91dFRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL2NvbnRlbnRMYXlvdXQuaGJzXCIpO1xyXG5cclxudmFyIENvbnRlbnRMYXlvdXQgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIENvbnRlbnRMYXlvdXQgPSBNYXJpb25ldHRlLkxheW91dFZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTogbGF5b3V0VGVtcGxhdGUsXHJcbiAgICAgICAgaXNQZXJtYW5lbnQ6IHRydWUsXHJcbiAgICAgICAgcmVnaW9uczoge1xyXG4gICAgICAgICAgICBpdGVtc1JlZ2lvbjogXCIubWFpbC1pdGVtcy1yZWdpb25cIixcclxuICAgICAgICAgICAgcHJldmlld1JlZ2lvbjogXCIubWFpbC1wcmV2aWV3LXJlZ2lvblwiLFxyXG4gICAgICAgICAgICBtZXNzYWdlQm9hcmQ6IFwiLm1haWwtbWVzc2FnZS1ib2FyZC1yZWdpb25cIlxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29udGVudExheW91dDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIGZvcm1hdHRlciA9IHJlcXVpcmUoXCJyZXNvbHZlcnMvZm9ybWF0dGVyXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvbWFpbEl0ZW1WaWV3Lmhic1wiKTtcclxuXHJcbnZhciBNYWlsVGFibGVSb3dWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBNYWlsVGFibGVSb3dWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICB0YWdOYW1lOiAndHInLFxyXG4gICAgICAgIGNsYXNzTmFtZTogJ2luYm94X3JvdycsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIGNoZWNrQm94OiBcIi5jaGtCb3hcIixcclxuICAgICAgICAgICAgc2VsZWN0b3I6IFwiLnNlbGVjdG9yXCIsXHJcbiAgICAgICAgICAgIHN0YXJJY29uOiBcIi5zdGFyLWljb25cIixcclxuICAgICAgICAgICAgaW1wSWNvbjogXCIuaW1wb3J0YW5jZS1pY29uXCIsXHJcbiAgICAgICAgICAgIGFkZHJlc3M6IFwiLmFkZHJlc3NcIixcclxuICAgICAgICAgICAgc3ViamVjdDogXCIuc3ViamVjdFwiLFxyXG4gICAgICAgICAgICBib2R5OiBcIi5ib2R5XCIsXHJcbiAgICAgICAgICAgIHNlbnRUaW1lOiBcIi5zZW50VGltZVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHJpZ2dlcnM6IHtcclxuICAgICAgICAgICAgXCJjbGljayAuc3RhclwiOiBcImNsaWNrXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgLmltcG9ydGFuY2VcIjogXCJjbGlja1wiLFxyXG4gICAgICAgICAgICBcImNsaWNrIC5hZGRyZXNzXCI6IFwiY2xpY2tcIixcclxuICAgICAgICAgICAgXCJjbGljayAuY29udGVudFwiOiBcImNsaWNrXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgLnNlbnRUaW1lXCI6IFwiY2xpY2tcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNsaWNrIC5zZWxlY3RvclwiOiBcIm9uUm93U2VsZWN0XCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBtb2RlbEV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNoYW5nZTpzdWJqZWN0XCI6IFwiX29uU3ViamVjdENoYW5nZWRcIixcclxuICAgICAgICAgICAgXCJjaGFuZ2U6Ym9keVwiOiBcIl9vbkJvZHlDaGFuZ2VkXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uLnR5cGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJjb250YWN0OmNvbGxlY3Rpb25cIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmxhYmVscy4qXCIsIHRoaXMudG9nZ2xlVUkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHRlbXBsYXRlSGVscGVyc1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBpc0luYm94OiB0aGlzLmFjdGlvbiA9PT0gXCJpbmJveFwiLFxyXG4gICAgICAgICAgICAgICAgaXNTZW50OiB0aGlzLmFjdGlvbiA9PT0gXCJzZW50XCIsXHJcbiAgICAgICAgICAgICAgICBpc0RyYWZ0OiB0aGlzLmFjdGlvbiA9PT0gXCJkcmFmdFwiLFxyXG4gICAgICAgICAgICAgICAgaXNUcmFzaDogdGhpcy5hY3Rpb24gPT09IFwidHJhc2hcIixcclxuICAgICAgICAgICAgICAgIGlzU3BhbTogdGhpcy5hY3Rpb24gPT09IFwic3BhbVwiLFxyXG4gICAgICAgICAgICAgICAgaXNTZWFyY2g6IHRoaXMuYWN0aW9uID09PSBcInNlYXJjaFwiLFxyXG5cclxuICAgICAgICAgICAgICAgIGJvZHk6IGZvcm1hdHRlci5mb3JtYXRDb250ZW50KHRoaXMubW9kZWwuZ2V0KFwiYm9keVwiKSksXHJcbiAgICAgICAgICAgICAgICBzdWJqZWN0OiBmb3JtYXR0ZXIuZm9ybWF0U3ViamVjdCh0aGlzLm1vZGVsLmdldChcInN1YmplY3RcIiksYXBwLnRyYW5zbGF0b3IpLFxyXG4gICAgICAgICAgICAgICAgc2VudFRpbWU6IGZvcm1hdHRlci5mb3JtYXRTaG9ydERhdGUodGhpcy5tb2RlbC5nZXQoXCJzZW50VGltZVwiKSxhcHAudHJhbnNsYXRvciksXHJcbiAgICAgICAgICAgICAgICB0bzogZm9ybWF0dGVyLmZvcm1hdEFkZHJlc3Nlcyh0aGlzLmNvbnRhY3RzLmdldFRpdGxlcyh0aGlzLm1vZGVsLmdldE91dGdvaW5nQWRkcmVzc2VzKCkpKSxcclxuICAgICAgICAgICAgICAgIGZyb206IGZvcm1hdHRlci5mb3JtYXRBZGRyZXNzZXModGhpcy5jb250YWN0cy5nZXRUaXRsZXModGhpcy5tb2RlbC5nZXRJbmdvaW5nQWRkcmVzc2VzKCkpKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG9uUmVuZGVyXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZVVJKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U2VsZWN0aW9uKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRvZ2dsZVVJOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbGFiZWxzID0gdGhpcy5tb2RlbC5nZXQoXCJsYWJlbHNcIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVpLnNlbnRUaW1lLnRvZ2dsZUNsYXNzKFwidW5yZWFkXCIsICFfLmhhcyhsYWJlbHMsICdyZWFkJykpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmFkZHJlc3MudG9nZ2xlQ2xhc3MoXCJ1bnJlYWRcIiwgIV8uaGFzKGxhYmVscywgJ3JlYWQnKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuc3ViamVjdC50b2dnbGVDbGFzcyhcInVucmVhZFwiLCAhXy5oYXMobGFiZWxzLCAncmVhZCcpKTtcclxuICAgICAgICAgICAgdGhpcy51aS5zdGFySWNvbi50b2dnbGVDbGFzcyhcImRpc2FibGVcIiwgIV8uaGFzKGxhYmVscywgJ3N0YXJyZWQnKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuaW1wSWNvbi50b2dnbGVDbGFzcyhcImRpc2FibGVcIiwgIV8uaGFzKGxhYmVscywgJ2ltcG9ydGFudCcpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZXRTZWxlY3Rpb246IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMubW9kZWwuY29sbGVjdGlvbi5pc1NlbGVjdGVkKHRoaXMubW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy4kZWwudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJywgc2VsZWN0ZWQpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmNoZWNrQm94LnByb3AoJ2NoZWNrZWQnLCBzZWxlY3RlZCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gZGF0YUNoYW5nZWRcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX29uU3ViamVjdENoYW5nZWQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudWkuc3ViamVjdC50ZXh0KGZvcm1hdHRlci5mb3JtYXRTdWJqZWN0KHRoaXMubW9kZWwuZ2V0KFwic3ViamVjdFwiKSksYXBwLnRyYW5zbGF0b3IpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfb25Cb2R5Q2hhbmdlZDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy51aS5ib2R5LnRleHQoZm9ybWF0dGVyLmZvcm1hdENvbnRlbnQodGhpcy5tb2RlbC5nZXQoXCJib2R5XCIpKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gcm93RXZlbnRzXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUm93U2VsZWN0OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbFRhYmxlOkl0ZW1DbGlja2VkXCIsIG51bGwpO1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmNvbGxlY3Rpb24udG9nZ2xlU2VsZWN0aW9uKHRoaXMubW9kZWwsIHtjYWxsZXJOYW1lOiAnaXRlbVZpZXcnfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG1hcmtBc0NsaWNrZWQ6IGZ1bmN0aW9uIChjbGlja2VkKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLiRlbC50b2dnbGVDbGFzcygnY2xpY2tlZFJvdycsIGNsaWNrZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsVGFibGVSb3dWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgbGF5b3V0VGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvbWFpbkxheW91dC5oYnNcIik7XHJcblxyXG52YXIgTWFpbExheW91dCA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsICBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgTWFpbExheW91dCA9IE1hcmlvbmV0dGUuTGF5b3V0Vmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOmxheW91dFRlbXBsYXRlLFxyXG4gICAgICAgIGlzUGVybWFuZW50OnRydWUsXHJcbiAgICAgICAgcmVnaW9uczp7XHJcbiAgICAgICAgICAgIG5hdlJlZ2lvbjpcIi5tYWlsLW5hdi1yZWdpb25cIixcclxuICAgICAgICAgICAgd29ya1JlZ2lvbjpcIi5tYWlsLXdvcmstcmVnaW9uXCJcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1haWxMYXlvdXQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9tYWlsc1ZpZXcuaGJzXCIpO1xyXG52YXIgTWFpbGFibGVSb3dWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvbWFpbEl0ZW1WaWV3XCIpO1xyXG5cclxudmFyIE1haWxUYWJsZVZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxUYWJsZVZpZXcgPSBNYXJpb25ldHRlLkNvbXBvc2l0ZVZpZXcuZXh0ZW5kKHtcclxuICAgICAgICBuYW1lOiAnbWFpbFRhYmxlJyxcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgY2hpbGRWaWV3OiBNYWlsYWJsZVJvd1ZpZXcsXHJcbiAgICAgICAgY2hpbGRWaWV3Q29udGFpbmVyOiBcInRib2R5XCIsXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcywgXCJjaGlsZHZpZXc6Y2xpY2tcIiwgdGhpcy5faGFuZGxlQ2hpbGRDbGljayk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5jb2xsZWN0aW9uLCBcImNoYW5nZTpzZWxlY3Rpb25cIiwgdGhpcy5vblNlbGVjdGlvbkNoYW5nZSwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25TZWxlY3Rpb25DaGFuZ2VcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25TZWxlY3Rpb25DaGFuZ2U6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNhbGxlck5hbWUgIT09ICdpdGVtVmlldycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uZWFjaChfLmJpbmQoZnVuY3Rpb24gKHZpZXcpIHtcclxuICAgICAgICAgICAgICAgICAgICB2aWV3LnNldFNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZpZXcubWFya0FzQ2xpY2tlZCh0aGlzLmNvbGxlY3Rpb24uZ2V0U2VsZWN0ZWQoKS5sZW5ndGggPT09IDAgJiYgdmlldyA9PT0gdGhpcy5jbGlja2VkSXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2hhbmRsZUNoaWxkQ2xpY2s6IGZ1bmN0aW9uIChfaXRlbVZpZXcpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uZWFjaChmdW5jdGlvbiAoaXRlbVZpZXcpIHtcclxuICAgICAgICAgICAgICAgIGl0ZW1WaWV3Lm1hcmtBc0NsaWNrZWQoZmFsc2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfaXRlbVZpZXcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tlZEl0ZW0gPSBfaXRlbVZpZXc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrZWRJdGVtLm1hcmtBc0NsaWNrZWQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbFRhYmxlOkl0ZW1DbGlja2VkXCIsIHRoaXMuY2xpY2tlZEl0ZW0ubW9kZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE1haWxUYWJsZVZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9uYXZWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBOYXZWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBOYXZWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsICdjaGFuZ2U6bWFpbC5hY3Rpb24nLCB0aGlzLm9uQWN0aW9uQ2hhbmdlLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uQWN0aW9uQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLiRlbC5maW5kKCdsaScpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb24udHlwZVwiKTtcclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZCgnLm5hdi0nICsgYWN0aW9uKS5hZGRDbGFzcygnc2VsZWN0ZWQnKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE5hdlZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBmb3JtYXR0ZXIgPSByZXF1aXJlKFwicmVzb2x2ZXJzL2Zvcm1hdHRlclwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL3ByZXZpZXdWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBQcmV2aWV3VmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgUHJldmlld1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBzdWJqZWN0OiBcIi5zdWJqZWN0XCIsXHJcbiAgICAgICAgICAgIHRvOiBcIi50b1wiLFxyXG4gICAgICAgICAgICBmcm9tOiBcIi5mcm9tXCIsXHJcbiAgICAgICAgICAgIGJvZHk6IFwiLmJvZHlcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJjb250YWN0OmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN1YmplY3Q6IGZvcm1hdHRlci5mb3JtYXRTdWJqZWN0KHRoaXMubW9kZWwuZ2V0KFwic3ViamVjdFwiKSwgYXBwLnRyYW5zbGF0b3IpLFxyXG4gICAgICAgICAgICAgICAgdG86IGZvcm1hdHRlci5mb3JtYXRBZGRyZXNzZXModGhpcy5jb250YWN0cy5nZXRUaXRsZXModGhpcy5tb2RlbC5nZXRPdXRnb2luZ0FkZHJlc3NlcygpKSksXHJcbiAgICAgICAgICAgICAgICBmcm9tOiBmb3JtYXR0ZXIuZm9ybWF0QWRkcmVzc2VzKHRoaXMuY29udGFjdHMuZ2V0VGl0bGVzKHRoaXMubW9kZWwuZ2V0SW5nb2luZ0FkZHJlc3NlcygpKSlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlbC5oYXMoXCJyZWxhdGVkQm9keVwiKSkge1xyXG4gICAgICAgICAgICAgICAgLy9yZXF1aXJlKFtcIm9uRGVtYW5kTG9hZGVyIXRleHQhYXBwL2Fzc2V0cy9kYXRhL1wiICsgdGhpcy5tb2RlbC5nZXQoXCJyZWxhdGVkQm9keVwiKSArIFwiLnR4dFwiXSwgXy5iaW5kKGZ1bmN0aW9uICh0ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAvLyAgICB0aGlzLnVpLmJvZHkuaHRtbCh0ZXh0KTtcclxuICAgICAgICAgICAgICAgIC8vfSwgdGhpcykpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51aS5ib2R5Lmh0bWwodGhpcy5tb2RlbC5nZXQoXCJib2R5XCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJldmlld1ZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9zZWFyY2hWaWV3Lmhic1wiKTtcclxudmFyIENvbnRhY3RzRmlsdGVyTW9kZWwgPSByZXF1aXJlKFwibWFpbC1tb2RlbHMvY29udGFjdHNGaWx0ZXJNb2RlbFwiKTtcclxudmFyIEF1dG9Db21wbGV0ZSA9IHJlcXVpcmUoXCJ1aS1jb21wb25lbnRzL2F1dG9Db21wbGV0ZS9hdXRvQ29tcGxldGVcIik7XHJcbnZhciBTZWFyY2hDb21wb25lbnQgPSByZXF1aXJlKFwidWktY29tcG9uZW50cy9zZWFyY2gvc2VhcmNoXCIpO1xyXG5cclxudmFyIFNlYXJjaFZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIFNlYXJjaFZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogXCJzZWFyY2hQYW5lbFwiLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBzZWFyY2hQbGFjZWhvbGRlcjogXCIuc2VhcmNoLXBsYWNlaG9sZGVyXCIsXHJcbiAgICAgICAgICAgIGF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyOiBcIi5hdXRvQ29tcGxldGVQbGFjZWhvbGRlclwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy52ZW50ID0gbmV3IEJhY2tib25lLldyZXFyLkV2ZW50QWdncmVnYXRvcigpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwiY29udGFjdDpjb2xsZWN0aW9uXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcInNlYXJjaFwiLCB0aGlzLnNlYXJjaCwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsIFwiY2hhbmdlOm1haWwuYWN0aW9uXCIsIHRoaXMub25BY3Rpb25DaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMuY29udGFjdHMsIFwiZmV0Y2g6c3VjY2Vzc1wiLCB0aGlzLnJlbmRlckF1dG9Db21wb25lbnQsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25SZW5kZXJcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJTZWFyY2hDb21wb25lbnQoKTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJBdXRvQ29tcG9uZW50KCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcmVuZGVyU2VhcmNoQ29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaENvbXBvbmVudCA9IG5ldyBTZWFyY2hDb21wb25lbnQoe1xyXG4gICAgICAgICAgICAgICAgZWw6IHRoaXMudWkuc2VhcmNoUGxhY2Vob2xkZXIsXHJcbiAgICAgICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiBhcHAudHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOnNlYXJjaC5jYXB0aW9uXCIpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaENvbXBvbmVudC5yZW5kZXIoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW5kZXJBdXRvQ29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuYXV0b0NvbXBsZXRlICYmICF0aGlzLmNvbnRhY3RzLmlzRW1wdHkoKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlID0gbmV3IEF1dG9Db21wbGV0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHRoaXMuZ2V0Q29udGFjdEFycmF5KCksXHJcbiAgICAgICAgICAgICAgICAgICAgZWw6IHRoaXMudWkuYXV0b0NvbXBsZXRlUGxhY2Vob2xkZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyTW9kZWw6IG5ldyBDb250YWN0c0ZpbHRlck1vZGVsKCksXHJcbiAgICAgICAgICAgICAgICAgICAgdmVudDogdGhpcy52ZW50XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGdldENvbnRhY3RBcnJheTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIF9jb250YWN0cyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250YWN0cy5lYWNoKGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgX2NvbnRhY3RzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IG1vZGVsLmdldChcInRpdGxlXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtb2RlbC5nZXQoXCJhZGRyZXNzXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IEF1dG9Db21wbGV0ZS5UWVBFUy5DT05UQUNUXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBfY29udGFjdHM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBzZWFyY2hcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZWFyY2g6IGZ1bmN0aW9uIChrZXkpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghXy5pc0VtcHR5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgIG1haWwucm91dGVyLm5hdmlnYXRlKFwic2VhcmNoL1wiICsga2V5LCB7dHJpZ2dlcjogdHJ1ZX0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25BY3Rpb25DaGFuZ2VcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25BY3Rpb25DaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvbi50eXBlXCIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGFjdGlvbiAhPSBcInNlYXJjaFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWFyY2hDb21wb25lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaENvbXBvbmVudC5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZWFyY2hWaWV3O1xyXG4iLCIgICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcblxyXG4gICAgYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBBcHAsICBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgICAgICB2YXIgUm91dGVyID0gcmVxdWlyZShcIm1haWwtcm91dGVycy9tYWlsUm91dGVyXCIpO1xyXG4gICAgICAgIHZhciBNYWluTGF5b3V0Q29udHJvbGxlciA9IHJlcXVpcmUoXCJtYWlsLWNvbnRyb2xsZXJzL21haWxNYWluTGF5b3V0Q29udHJvbGxlclwiKTtcclxuICAgICAgICB2YXIgRGF0YUNvbnRyb2xsZXIgPSByZXF1aXJlKFwibWFpbC1jb250cm9sbGVycy9tYWlsRGF0YUNvbnRyb2xsZXJcIik7XHJcbiAgICAgICAgdmFyIEFjdGlvbnNDb250cm9sbGVyID0gcmVxdWlyZShcIm1haWwtY29udHJvbGxlcnMvbWFpbEFjdGlvbnNDb250cm9sbGVyXCIpO1xyXG4gICAgICAgIHZhciBSb3V0ZXJDb250cm9sbGVyID0gcmVxdWlyZShcIm1haWwtY29udHJvbGxlcnMvbWFpbFJvdXRlckNvbnRyb2xsZXJcIik7XHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gaW5pdFxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRoaXMuYWRkSW5pdGlhbGl6ZXIoZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2hhbm5lbCA9IEJhY2tib25lLldyZXFyLnJhZGlvLmNoYW5uZWwoXCJtYWlsXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGFDb250cm9sbGVyID0gbmV3IERhdGFDb250cm9sbGVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aW9uc0NvbnRyb2xsZXIgPSBuZXcgQWN0aW9uc0NvbnRyb2xsZXIoKTtcclxuICAgICAgICAgICAgdGhpcy5tYWluTGF5b3V0Q29udHJvbGxlciA9IG5ldyBNYWluTGF5b3V0Q29udHJvbGxlcihvcHRpb25zKTtcclxuICAgICAgICAgICAgdGhpcy5yb3V0ZXIgPSBuZXcgUm91dGVyKHsgY29udHJvbGxlcjogbmV3IFJvdXRlckNvbnRyb2xsZXIoKSB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBzZXRMYXlvdXRcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0aGlzLnNldExheW91dCA9ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFpbkxheW91dENvbnRyb2xsZXIuc2V0Vmlld3MoKTtcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhcHAubW9kdWxlKFwibWFpbFwiKTtcclxuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwidGFnc1BsYWNlaG9sZGVyXFxcIj48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJhdXRvQ29tcGxldGVQbGFjZWhvbGRlclxcXCI+PC9kaXY+XFxyXFxuXCI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBoZWxwZXIsIG9wdGlvbnMsIGhlbHBlck1pc3Npbmc9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXG4gIGJ1ZmZlciArPSBcIjxkaXYgY2xhc3M9XFxcImxibENvbXBvc2VcXFwiPk5ldyBNZXNzYWdlPC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwiYnV0dG9uc1Rvb2xiYXJcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJhY3Rpb24tbGlzdC1zZWN0aW9uXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0blNlbGVjdFxcXCI+XFxyXFxuICAgICAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGRyb3Bkb3duIGRkc0lkX2Rkc1NlbGVjdFxcXCI+PHNwYW4gY2xhc3M9XFxcImNhcHRpb25cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6c2VsZWN0XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJ0b2dnbGVcXFwiPjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiZHJvcGRvd24tc2xpZGVyIGRkc1NlbGVjdFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIHNlbGVjdEFsbFxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZWxlY3QuYWxsXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0LmFsbFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIHNlbGVjdE5vbmVcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZWxlY3Qubm9uZVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnNlbGVjdC5ub25lXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICAgICAgICAgICAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gc2VsZWN0UmVhZFxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNlbGVjdC5yZWFkXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0LnJlYWRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBzZWxlY3RVbnJlYWRcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZWxlY3QudW5yZWFkXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0LnVucmVhZFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0bkRlbGV0ZUZvcmV2ZXJcXFwiPjxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsZWZ0XFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLmRlbGV0ZUZvcmV2ZXJcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLmRlbGV0ZUZvcmV2ZXJcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuTm90U3BhbVxcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLm5vdFNwYW1cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLm5vdFNwYW1cIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuRGlzY2FyZERyYWZ0c1xcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLmRpc2NhcmREcmFmdFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMuZGlzY2FyZERyYWZ0XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0bkRlbGV0ZVxcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGxlZnRcXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMuZGVsZXRlXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5kZWxldGVcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuTW92ZVRvXFxcIj48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0bk1vcmVcXFwiPjwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJwYWdlclxcXCI+PC9kaXY+XCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uLCBmdW5jdGlvblR5cGU9XCJmdW5jdGlvblwiO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwiY29tcG9zZVZpZXdcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb21wb3NlLWhlYWRlclxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJmaWVsZFxcXCI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6dG9cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDp0b1wiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImlucHV0Ym94XFxcIj48ZGl2IGNsYXNzPVxcXCJ0b0lucHV0V3JhcHBlclxcXCI+PC9kaXY+PC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImZpZWxkIGNjTGluZVxcXCI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6Y2NcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpjY1wiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImlucHV0Ym94XFxcIj48ZGl2IGNsYXNzPVxcXCJjY0lucHV0V3JhcHBlclxcXCI+PC9kaXY+PC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9ZmllbGQ+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6c3ViamVjdFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnN1YmplY3RcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpbnB1dGJveCBpbnB1dGJveDFcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwic3ViamVjdFxcXCIgdmFsdWU9XFxcIlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5zdWJqZWN0KSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnN1YmplY3QpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiXFxcIj48L2lucHV0PjwvZGl2PlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb21wb3NlLWVkaXRvciBicm93c2VyLXNjcm9sbFxcXCIgY29udGVudGVkaXRhYmxlPVxcXCJ0cnVlXFxcIj48L2Rpdj5cXHJcXG4gICAgPGEgY2xhc3M9XFxcImJ1dHRvbiBzZW5kQnRuXFxcIj48c3Bhbj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmNvbXBvc2V2aWV3LnNlbmRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpjb21wb3Nldmlldy5zZW5kXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICAgPGEgY2xhc3M9XFxcImNsb3NlQnRuXFxcIj48L2E+XFxyXFxuPC9kaXY+XCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwibWFpbC1pdGVtcy1yZWdpb24gYnJvd3Nlci1zY3JvbGwgbGlnaHRcXFwiPlxcclxcbjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcIm1haWwtcHJldmlldy1yZWdpb24gYnJvd3Nlci1zY3JvbGwgbGlnaHRcXFwiPlxcclxcbjwvZGl2PlxcclxcblwiO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcIm1zZ1RpdGxlXFxcIj48L2Rpdj5cXHJcXG5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwiZW1wdHlNYWlsXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY291bnRlclxcXCI+PC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm1lc3NhZ2VcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6ZW1wdHlNYWlsLnNlbGVjdGl0ZW1cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDplbXB0eU1haWwuc2VsZWN0aXRlbVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbjwvZGl2PlwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXIsIGZ1bmN0aW9uVHlwZT1cImZ1bmN0aW9uXCIsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgc2VsZj10aGlzO1xuXG5mdW5jdGlvbiBwcm9ncmFtMShkZXB0aDAsZGF0YSkge1xuICBcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyO1xuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImluYm94XFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuZnJvbSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5mcm9tKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjxkaXY+XFxyXFxuICAgIFwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbmZ1bmN0aW9uIHByb2dyYW0zKGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXIsIG9wdGlvbnM7XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwic2VudFxcXCI+PHNwYW4gY2xhc3M9XFxcInNlbnQtdG9cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6dG9cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDp0b1wiLCBvcHRpb25zKSkpXG4gICAgKyBcIjo8L3NwYW4+PHNwYW4gY2xhc3M9XFxcInNlbnQtYWRkcmVzc1xcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnRvKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnRvKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvc3Bhbj48L2Rpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuZnVuY3Rpb24gcHJvZ3JhbTUoZGVwdGgwLGRhdGEpIHtcbiAgXG4gIHZhciBidWZmZXIgPSBcIlwiLCBoZWxwZXIsIG9wdGlvbnM7XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiZHJhZnRcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6ZHJhZnRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpkcmFmdFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICBcIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxuXG5mdW5jdGlvbiBwcm9ncmFtNyhkZXB0aDAsZGF0YSkge1xuICBcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyO1xuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcInRyYXNoLWljb24td3JhcHBlclxcXCI+PGRpdiBjbGFzcz1cXFwidHJhc2gtaWNvblxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwidHJhc2gtYWRkcmVzc1xcXCI+PGRpdj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuZnJvbSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5mcm9tKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvZGl2PjwvZGl2PlxcclxcbiAgICBcIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxuXG5mdW5jdGlvbiBwcm9ncmFtOShkZXB0aDAsZGF0YSkge1xuICBcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyO1xuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcInNwYW1cXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5mcm9tKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmZyb20pOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgIFwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbiAgYnVmZmVyICs9IFwiPHRkIGNsYXNzPVxcXCJzZWxlY3RvclxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBjbGFzcz1cXFwiY2hrQm94XFxcIj48L3RkPlxcclxcbjx0ZCBjbGFzcz1cXFwic3RhclxcXCI+PGRpdiBjbGFzcz1cXFwic3Rhci1pY29uXFxcIj48L2Rpdj48L3RkPlxcclxcbjx0ZCBjbGFzcz1cXFwiaW1wb3J0YW5jZVxcXCI+PGRpdiBjbGFzcz1cXFwiaW1wb3J0YW5jZS1pY29uXFxcIj48L2Rpdj48L3RkPlxcclxcbjx0ZCBjbGFzcz1cXFwiYWRkcmVzc1xcXCI+XFxyXFxuICAgIFwiO1xuICBzdGFjazEgPSBoZWxwZXJzWydpZiddLmNhbGwoZGVwdGgwLCAoZGVwdGgwICYmIGRlcHRoMC5pc0luYm94KSwge2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDEsIHByb2dyYW0xLCBkYXRhKSxkYXRhOmRhdGF9KTtcbiAgaWYoc3RhY2sxIHx8IHN0YWNrMSA9PT0gMCkgeyBidWZmZXIgKz0gc3RhY2sxOyB9XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICBcIjtcbiAgc3RhY2sxID0gaGVscGVyc1snaWYnXS5jYWxsKGRlcHRoMCwgKGRlcHRoMCAmJiBkZXB0aDAuaXNTZW50KSwge2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDMsIHByb2dyYW0zLCBkYXRhKSxkYXRhOmRhdGF9KTtcbiAgaWYoc3RhY2sxIHx8IHN0YWNrMSA9PT0gMCkgeyBidWZmZXIgKz0gc3RhY2sxOyB9XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICBcIjtcbiAgc3RhY2sxID0gaGVscGVyc1snaWYnXS5jYWxsKGRlcHRoMCwgKGRlcHRoMCAmJiBkZXB0aDAuaXNEcmFmdCksIHtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSg1LCBwcm9ncmFtNSwgZGF0YSksZGF0YTpkYXRhfSk7XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgXCI7XG4gIHN0YWNrMSA9IGhlbHBlcnNbJ2lmJ10uY2FsbChkZXB0aDAsIChkZXB0aDAgJiYgZGVwdGgwLmlzVHJhc2gpLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oNywgcHJvZ3JhbTcsIGRhdGEpLGRhdGE6ZGF0YX0pO1xuICBpZihzdGFjazEgfHwgc3RhY2sxID09PSAwKSB7IGJ1ZmZlciArPSBzdGFjazE7IH1cbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgIFwiO1xuICBzdGFjazEgPSBoZWxwZXJzWydpZiddLmNhbGwoZGVwdGgwLCAoZGVwdGgwICYmIGRlcHRoMC5pc1NwYW0pLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oOSwgcHJvZ3JhbTksIGRhdGEpLGRhdGE6ZGF0YX0pO1xuICBpZihzdGFjazEgfHwgc3RhY2sxID09PSAwKSB7IGJ1ZmZlciArPSBzdGFjazE7IH1cbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgIFwiO1xuICBzdGFjazEgPSBoZWxwZXJzWydpZiddLmNhbGwoZGVwdGgwLCAoZGVwdGgwICYmIGRlcHRoMC5pc1NlYXJjaCksIHtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgxLCBwcm9ncmFtMSwgZGF0YSksZGF0YTpkYXRhfSk7XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG48L3RkPlxcclxcbjx0ZD48ZGl2IGNsYXNzPVxcXCJjb250ZW50XFxcIj48c3BhbiBjbGFzcz1cXFwic3ViamVjdFxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnN1YmplY3QpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuc3ViamVjdCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L3NwYW4+PHNwYW4gY2xhc3M9XFxcInNlcGFyYXRvclxcXCI+LTwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiYm9keVxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmJvZHkpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuYm9keSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L3NwYW4+PC9kaXY+PC90ZD5cXHJcXG48dGQ+PGRpdiBjbGFzcz1cXFwic2VudFRpbWVcXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5zZW50VGltZSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5zZW50VGltZSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj48L3RkPlwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcIm1haWwtdGFibGUtY29udGFuaWVyXFxcIj5cXHJcXG4gICAgPHRhYmxlIGNsYXNzPVxcXCJkYXRhLXRhYmxlIG1haWwtdGFibGVcXFwiPlxcclxcbiAgICAgICAgPGNvbGdyb3VwPlxcclxcbiAgICAgICAgICAgIDxjb2wgc3R5bGU9XFxcIndpZHRoOjMwcHhcXFwiLz5cXHJcXG4gICAgICAgICAgICA8Y29sIHN0eWxlPVxcXCJ3aWR0aDozMHB4XFxcIi8+XFxyXFxuICAgICAgICAgICAgPGNvbCBzdHlsZT1cXFwid2lkdGg6MzBweFxcXCIvPlxcclxcbiAgICAgICAgICAgIDxjb2wgc3R5bGU9XFxcIndpZHRoOjE5MHB4XFxcIi8+XFxyXFxuICAgICAgICAgICAgPGNvbC8+XFxyXFxuICAgICAgICAgICAgPGNvbCBzdHlsZT1cXFwid2lkdGg6ODBweFxcXCIvPlxcclxcbiAgICAgICAgPC9jb2xncm91cD5cXHJcXG4gICAgICAgIDx0Ym9keT5cXHJcXG4gICAgICAgIDwvdGJvZHk+XFxyXFxuICAgIDwvdGFibGU+XFxyXFxuPC9kaXY+XCI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwibWFpbC1uYXYtcmVnaW9uXFxcIj5cXHJcXG48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJtYWlsLXdvcmstcmVnaW9uXFxcIj5cXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGRyb3Bkb3duIGRkc0lkX2Rkc01vcmVcXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMubW9yZVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMubW9yZVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwidG9nZ2xlXFxcIj48L3NwYW4+PC9hPlxcclxcbjxkaXYgIGNsYXNzPVxcXCJkcm9wZG93bi1zbGlkZXIgZGRzTW9yZVxcXCI+XFxyXFxuICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIG1hcmtSZWFkXFxcIj48L3NwYW4+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMubWFya0FzLnJlYWRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLm1hcmtBcy5yZWFkXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gbWFya1VucmVhZFxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMubWFya0FzLnVucmVhZFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMubWFya0FzLnVucmVhZFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIG1hcmtJbXBcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLm1hcmtBcy5pbXBvcnRhbnRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLm1hcmtBcy5pbXBvcnRhbnRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBtYXJrTm90SW1wXFxcIj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6YWN0aW9ucy5tYXJrQXMubm90SW1wb3J0YW50XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5tYXJrQXMubm90SW1wb3J0YW50XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gYWRkU3RhclxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMuYWRkLnN0YXJcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLmFkZC5zdGFyXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gcmVtb3ZlU3RhclxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMucmVtb3ZlLnN0YXJcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLnJlbW92ZS5zdGFyXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cXHJcXG5cXHJcXG5cXHJcXG5cXHJcXG5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGRyb3Bkb3duIGRkc0lkX2Rkc01vdmVcXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMubW92ZVRvXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5tb3ZlVG9cIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PHNwYW4gY2xhc3M9XFxcInRvZ2dsZVxcXCI+PC9zcGFuPjwvYT5cXHJcXG48ZGl2ICBjbGFzcz1cXFwiZHJvcGRvd24tc2xpZGVyIGRkc01vdmVcXFwiPlxcclxcbiAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBtb3ZlVG9JbmJveFxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDppbmJveFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmluYm94XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gbW92ZVRvU3BhbVxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNwYW1cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpzcGFtXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gbW92ZVRvVHJhc2hcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDp0cmFzaFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnRyYXNoXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cXHJcXG5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGEgaHJlZj1cXFwiI2NvbXBvc2VcXFwiIGNsYXNzPVxcXCJidXR0b24gcHJpbWUgYnRuQ29tcG9zZVxcXCI+PHNwYW4gY2xhc3M9XFxcImNhcHRpb25cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6Y29tcG9zZVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmNvbXBvc2VcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcIm5hdmlnYXRvciBtYWlsTmF2XFxcIj5cXHJcXG4gIDx1bD5cXHJcXG4gICAgICA8bGkgY2xhc3M9XFxcIm5hdi1pbmJveFxcXCI+PGEgaHJlZj1cXFwiI2luYm94XFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmluYm94XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6aW5ib3hcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2E+PC9saT5cXHJcXG4gICAgICA8bGkgY2xhc3M9XFxcIm5hdi1zZW50XFxcIj48YSBocmVmPVxcXCIjc2VudFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZW50XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VudFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvYT48L2xpPlxcclxcbiAgICAgIDxsaSBjbGFzcz1cXFwibmF2LWRyYWZ0XFxcIj48YSBocmVmPVxcXCIjZHJhZnRcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6ZHJhZnRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpkcmFmdFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvYT48L2xpPlxcclxcbiAgICAgIDxsaSBjbGFzcz1cXFwibmF2LXRyYXNoXFxcIj48YSBocmVmPVxcXCIjdHJhc2hcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6dHJhc2hcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDp0cmFzaFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvYT48L2xpPlxcclxcbiAgICAgIDxsaSBjbGFzcz1cXFwibmF2LXNwYW1cXFwiPjxhIGhyZWY9XFxcIiNzcGFtXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNwYW1cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpzcGFtXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9hPjwvbGk+XFxyXFxuICA8L3VsPlxcclxcbjwvZGl2PlxcclxcblxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJwYWdlcklubmVyQ29udGFpbmVyXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwicGFnZXJCdXR0b25zXFxcIj5cXHJcXG4gICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsZWZ0IGljb24gYnRuTmV3ZXJcXFwiIHRpdGxlPVxcXCJcIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnBhZ2UucHJldlwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnBhZ2UucHJldlwiLCBvcHRpb25zKSkpXG4gICAgKyBcIlxcXCI+PHNwYW4gY2xhc3M9XFxcImljb05ld2VyXFxcIj48L3NwYW4+PC9hPlxcclxcbiAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIHJpZ2h0IGljb24gYnRuT2xkZXJcXFwiIHRpdGxlPVxcXCJcIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnBhZ2UubmV4dFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnBhZ2UubmV4dFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIlxcXCI+PHNwYW4gY2xhc3M9XFxcImljb09sZGVyXFxcIj48L3NwYW4+PC9hPlxcclxcbiAgICA8L2Rpdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwicGFnZXJJbmZvXFxcIj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJsYmxGb3JtXFxcIj48L3NwYW4+XFxyXFxuICAgICAgICA8c3Bhbj4gLSA8L3NwYW4+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwibGJsVG9cXFwiPjwvc3Bhbj5cXHJcXG4gICAgICAgIDxzcGFuPiBvZiA8L3NwYW4+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwidG90YWxcXFwiPjwvc3Bhbj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlciwgZnVuY3Rpb25UeXBlPVwiZnVuY3Rpb25cIiwgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJwcmV2aWV3TWFpbFxcXCI+XFxyXFxuICAgPGRpdiBjbGFzcz1cXFwic3ViamVjdFxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnN1YmplY3QpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuc3ViamVjdCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICA8ZGl2IGNsYXNzPVxcXCJhZGRyZXNzUmVnaW9uXFxcIj5cXHJcXG4gICAgICAgPGRpdiBjbGFzcz1cXFwiaWNvblxcXCI+PC9kaXY+XFxyXFxuICAgICAgIDxkaXYgY2xhc3M9XFxcImZyb21cXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5mcm9tKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmZyb20pOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgIDxkaXYgY2xhc3M9XFxcInRvXFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMudG8pIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudG8pOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgPC9kaXY+XFxyXFxuICAgPGRpdiBjbGFzcz1cXFwiYm9keVxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmJvZHkpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuYm9keSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG48L2Rpdj5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJzZWFyY2gtcGxhY2Vob2xkZXJcXFwiPjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcImF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyXFxcIj48L2Rpdj5cXHJcXG5cIjtcbiAgfSk7XG4iLCJ2YXIgYXBwID0gbmV3IE1hcmlvbmV0dGUuQXBwbGljYXRpb24oeyBjaGFubmVsTmFtZTogJ2FwcENoYW5uZWwnIH0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcHA7IiwicmVxdWlyZShcIi4vdmVuZG9yc0xvYWRlclwiKTtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCdhcHAnKTtcclxudmFyIEZyYW1lID0gcmVxdWlyZShcImZyYW1lXCIpO1xyXG52YXIgQ29udGV4dCA9IHJlcXVpcmUoXCJjb250ZXh0XCIpO1xyXG52YXIgTWFpbE1vZHVsZSA9IHJlcXVpcmUoXCJtYWlsLW1vZHVsZVwiKTtcclxudmFyIFRyYW5zbGF0b3IgPSByZXF1aXJlKFwicmVzb2x2ZXJzL3RyYW5zbGF0b3JcIik7XHJcbnZhciBTb2NrZXRDb250cm9sbGVyID0gcmVxdWlyZShcInNvY2tldC1jb250cm9sbGVyXCIpO1xyXG52YXIgU2V0dGluZ3NDb250cm9sbGVyID0gcmVxdWlyZShcInNldHRpbmdzLWNvbnRyb2xsZXJcIik7XHJcblxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gaW5pdFxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuYXBwLm9uKFwiYmVmb3JlOnN0YXJ0XCIsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICBhcHAudHJhbnNsYXRvciA9IFRyYW5zbGF0b3I7XHJcbiAgICBhcHAuY29udGV4dCA9IG5ldyBDb250ZXh0KCk7XHJcbiAgICBhcHAuZnJhbWUgPSBuZXcgRnJhbWUoKTtcclxuICAgIGFwcC5zb2NrZXRDb250cm9sbGVyID0gbmV3IFNvY2tldENvbnRyb2xsZXIoKTtcclxuICAgIGFwcC5zZXR0aW5nc0NvbnRyb2xsZXIgPSBuZXcgU2V0dGluZ3NDb250cm9sbGVyKCk7XHJcbn0pO1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gc3RhcnRcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbmFwcC5vbihcInN0YXJ0XCIsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICBhcHAuY2hhbm5lbC52ZW50Lm9uY2UoXCJvblNldHRpbmdzTG9hZGVkXCIsIG9uU2V0dGluZ3NMb2FkZWQpO1xyXG4gICAgYXBwLnNldHRpbmdzQ29udHJvbGxlci5mZXRjaCgpO1xyXG59KTtcclxuXHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxudmFyIG9uU2V0dGluZ3NMb2FkZWQgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIHJlZ2lzdGVyVXNlcigpO1xyXG4gICAgc2V0TGF5b3V0KCk7XHJcbiAgICBzdGFydEhpc3RvcnkoKTtcclxuICAgIHJlbW92ZVNwbGFzaFNjcmVlbigpO1xyXG59O1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnZhciByZWdpc3RlclVzZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBhcHAuc29ja2V0Q29udHJvbGxlci5yZWdpc3RlclVzZXIoYXBwLnNldHRpbmdzLmdldChcInVzZXJOYW1lXCIpKTtcclxufTtcclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgc2V0TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIGFwcC5hZGRSZWdpb25zKHtcclxuICAgICAgICBtYWluUmVnaW9uOiAnLm1iJ1xyXG4gICAgfSk7XHJcbiAgICBhcHAuZnJhbWUuc2V0TGF5b3V0KGFwcC5tYWluUmVnaW9uKTtcclxufTtcclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgc3RhcnRIaXN0b3J5ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xyXG59O1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgcmVtb3ZlU3BsYXNoU2NyZWVuID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICQoXCIuc3Bpbm5lclwiKS5oaWRlKCk7XHJcbiAgICAkKFwiLm1iXCIpLnNob3coKTtcclxufTtcclxuXHJcbmFwcC5zdGFydCgpO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJ3aW5kb3cuJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG53aW5kb3cuXyA9ICByZXF1aXJlKFwidW5kZXJzY29yZVwiKTtcclxud2luZG93Ll9zID0gcmVxdWlyZShcInVuZGVyc2NvcmUuc3RyaW5nXCIpO1xyXG53aW5kb3cuQmFja2JvbmUgPSByZXF1aXJlKFwiYmFja2JvbmVcIik7XHJcbndpbmRvdy5NYXJpb25ldHRlID0gcmVxdWlyZSgnYmFja2JvbmUubWFyaW9uZXR0ZScpO1xyXG53aW5kb3cuSGFuZGxlYmFycyA9IHJlcXVpcmUoXCJoYnNmeS9ydW50aW1lXCIpO1xyXG5cclxucmVxdWlyZShcImV4dGVuc2lvbnMvYmFja2JvbmUuc3luY1wiKTtcclxucmVxdWlyZShcImV4dGVuc2lvbnMvdW5kZXJzY29yZS5taXhpbi5kZWVwRXh0ZW5kXCIpO1xyXG5yZXF1aXJlKFwiZXh0ZW5zaW9ucy9tYXJpb25ldHRlLmV4dGVuc2lvbnNcIik7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qZ2xvYmFscyBIYW5kbGViYXJzOiB0cnVlICovXG52YXIgYmFzZSA9IHJlcXVpcmUoXCIuL2hhbmRsZWJhcnMvYmFzZVwiKTtcblxuLy8gRWFjaCBvZiB0aGVzZSBhdWdtZW50IHRoZSBIYW5kbGViYXJzIG9iamVjdC4gTm8gbmVlZCB0byBzZXR1cCBoZXJlLlxuLy8gKFRoaXMgaXMgZG9uZSB0byBlYXNpbHkgc2hhcmUgY29kZSBiZXR3ZWVuIGNvbW1vbmpzIGFuZCBicm93c2UgZW52cylcbnZhciBTYWZlU3RyaW5nID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9zYWZlLXN0cmluZ1wiKVtcImRlZmF1bHRcIl07XG52YXIgRXhjZXB0aW9uID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9leGNlcHRpb25cIilbXCJkZWZhdWx0XCJdO1xudmFyIFV0aWxzID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy91dGlsc1wiKTtcbnZhciBydW50aW1lID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9ydW50aW1lXCIpO1xuXG4vLyBGb3IgY29tcGF0aWJpbGl0eSBhbmQgdXNhZ2Ugb3V0c2lkZSBvZiBtb2R1bGUgc3lzdGVtcywgbWFrZSB0aGUgSGFuZGxlYmFycyBvYmplY3QgYSBuYW1lc3BhY2VcbnZhciBjcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGhiID0gbmV3IGJhc2UuSGFuZGxlYmFyc0Vudmlyb25tZW50KCk7XG5cbiAgVXRpbHMuZXh0ZW5kKGhiLCBiYXNlKTtcbiAgaGIuU2FmZVN0cmluZyA9IFNhZmVTdHJpbmc7XG4gIGhiLkV4Y2VwdGlvbiA9IEV4Y2VwdGlvbjtcbiAgaGIuVXRpbHMgPSBVdGlscztcblxuICBoYi5WTSA9IHJ1bnRpbWU7XG4gIGhiLnRlbXBsYXRlID0gZnVuY3Rpb24oc3BlYykge1xuICAgIHJldHVybiBydW50aW1lLnRlbXBsYXRlKHNwZWMsIGhiKTtcbiAgfTtcblxuICByZXR1cm4gaGI7XG59O1xuXG52YXIgSGFuZGxlYmFycyA9IGNyZWF0ZSgpO1xuSGFuZGxlYmFycy5jcmVhdGUgPSBjcmVhdGU7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gSGFuZGxlYmFyczsiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBVdGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIEV4Y2VwdGlvbiA9IHJlcXVpcmUoXCIuL2V4Y2VwdGlvblwiKVtcImRlZmF1bHRcIl07XG5cbnZhciBWRVJTSU9OID0gXCIxLjMuMFwiO1xuZXhwb3J0cy5WRVJTSU9OID0gVkVSU0lPTjt2YXIgQ09NUElMRVJfUkVWSVNJT04gPSA0O1xuZXhwb3J0cy5DT01QSUxFUl9SRVZJU0lPTiA9IENPTVBJTEVSX1JFVklTSU9OO1xudmFyIFJFVklTSU9OX0NIQU5HRVMgPSB7XG4gIDE6ICc8PSAxLjAucmMuMicsIC8vIDEuMC5yYy4yIGlzIGFjdHVhbGx5IHJldjIgYnV0IGRvZXNuJ3QgcmVwb3J0IGl0XG4gIDI6ICc9PSAxLjAuMC1yYy4zJyxcbiAgMzogJz09IDEuMC4wLXJjLjQnLFxuICA0OiAnPj0gMS4wLjAnXG59O1xuZXhwb3J0cy5SRVZJU0lPTl9DSEFOR0VTID0gUkVWSVNJT05fQ0hBTkdFUztcbnZhciBpc0FycmF5ID0gVXRpbHMuaXNBcnJheSxcbiAgICBpc0Z1bmN0aW9uID0gVXRpbHMuaXNGdW5jdGlvbixcbiAgICB0b1N0cmluZyA9IFV0aWxzLnRvU3RyaW5nLFxuICAgIG9iamVjdFR5cGUgPSAnW29iamVjdCBPYmplY3RdJztcblxuZnVuY3Rpb24gSGFuZGxlYmFyc0Vudmlyb25tZW50KGhlbHBlcnMsIHBhcnRpYWxzKSB7XG4gIHRoaXMuaGVscGVycyA9IGhlbHBlcnMgfHwge307XG4gIHRoaXMucGFydGlhbHMgPSBwYXJ0aWFscyB8fCB7fTtcblxuICByZWdpc3RlckRlZmF1bHRIZWxwZXJzKHRoaXMpO1xufVxuXG5leHBvcnRzLkhhbmRsZWJhcnNFbnZpcm9ubWVudCA9IEhhbmRsZWJhcnNFbnZpcm9ubWVudDtIYW5kbGViYXJzRW52aXJvbm1lbnQucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogSGFuZGxlYmFyc0Vudmlyb25tZW50LFxuXG4gIGxvZ2dlcjogbG9nZ2VyLFxuICBsb2c6IGxvZyxcblxuICByZWdpc3RlckhlbHBlcjogZnVuY3Rpb24obmFtZSwgZm4sIGludmVyc2UpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgaWYgKGludmVyc2UgfHwgZm4pIHsgdGhyb3cgbmV3IEV4Y2VwdGlvbignQXJnIG5vdCBzdXBwb3J0ZWQgd2l0aCBtdWx0aXBsZSBoZWxwZXJzJyk7IH1cbiAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLmhlbHBlcnMsIG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaW52ZXJzZSkgeyBmbi5ub3QgPSBpbnZlcnNlOyB9XG4gICAgICB0aGlzLmhlbHBlcnNbbmFtZV0gPSBmbjtcbiAgICB9XG4gIH0sXG5cbiAgcmVnaXN0ZXJQYXJ0aWFsOiBmdW5jdGlvbihuYW1lLCBzdHIpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMucGFydGlhbHMsICBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJ0aWFsc1tuYW1lXSA9IHN0cjtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyRGVmYXVsdEhlbHBlcnMoaW5zdGFuY2UpIHtcbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbihhcmcpIHtcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiTWlzc2luZyBoZWxwZXI6ICdcIiArIGFyZyArIFwiJ1wiKTtcbiAgICB9XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdibG9ja0hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UgfHwgZnVuY3Rpb24oKSB7fSwgZm4gPSBvcHRpb25zLmZuO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHsgY29udGV4dCA9IGNvbnRleHQuY2FsbCh0aGlzKTsgfVxuXG4gICAgaWYoY29udGV4dCA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGZuKHRoaXMpO1xuICAgIH0gZWxzZSBpZihjb250ZXh0ID09PSBmYWxzZSB8fCBjb250ZXh0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgaWYoY29udGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzLmVhY2goY29udGV4dCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZuKGNvbnRleHQpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2VhY2gnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGZuID0gb3B0aW9ucy5mbiwgaW52ZXJzZSA9IG9wdGlvbnMuaW52ZXJzZTtcbiAgICB2YXIgaSA9IDAsIHJldCA9IFwiXCIsIGRhdGE7XG5cbiAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkgeyBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpOyB9XG5cbiAgICBpZiAob3B0aW9ucy5kYXRhKSB7XG4gICAgICBkYXRhID0gY3JlYXRlRnJhbWUob3B0aW9ucy5kYXRhKTtcbiAgICB9XG5cbiAgICBpZihjb250ZXh0ICYmIHR5cGVvZiBjb250ZXh0ID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcbiAgICAgICAgZm9yKHZhciBqID0gY29udGV4dC5sZW5ndGg7IGk8ajsgaSsrKSB7XG4gICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEuaW5kZXggPSBpO1xuICAgICAgICAgICAgZGF0YS5maXJzdCA9IChpID09PSAwKTtcbiAgICAgICAgICAgIGRhdGEubGFzdCAgPSAoaSA9PT0gKGNvbnRleHQubGVuZ3RoLTEpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0ID0gcmV0ICsgZm4oY29udGV4dFtpXSwgeyBkYXRhOiBkYXRhIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IodmFyIGtleSBpbiBjb250ZXh0KSB7XG4gICAgICAgICAgaWYoY29udGV4dC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBpZihkYXRhKSB7IFxuICAgICAgICAgICAgICBkYXRhLmtleSA9IGtleTsgXG4gICAgICAgICAgICAgIGRhdGEuaW5kZXggPSBpO1xuICAgICAgICAgICAgICBkYXRhLmZpcnN0ID0gKGkgPT09IDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0ID0gcmV0ICsgZm4oY29udGV4dFtrZXldLCB7ZGF0YTogZGF0YX0pO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmKGkgPT09IDApe1xuICAgICAgcmV0ID0gaW52ZXJzZSh0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaWYnLCBmdW5jdGlvbihjb25kaXRpb25hbCwgb3B0aW9ucykge1xuICAgIGlmIChpc0Z1bmN0aW9uKGNvbmRpdGlvbmFsKSkgeyBjb25kaXRpb25hbCA9IGNvbmRpdGlvbmFsLmNhbGwodGhpcyk7IH1cblxuICAgIC8vIERlZmF1bHQgYmVoYXZpb3IgaXMgdG8gcmVuZGVyIHRoZSBwb3NpdGl2ZSBwYXRoIGlmIHRoZSB2YWx1ZSBpcyB0cnV0aHkgYW5kIG5vdCBlbXB0eS5cbiAgICAvLyBUaGUgYGluY2x1ZGVaZXJvYCBvcHRpb24gbWF5IGJlIHNldCB0byB0cmVhdCB0aGUgY29uZHRpb25hbCBhcyBwdXJlbHkgbm90IGVtcHR5IGJhc2VkIG9uIHRoZVxuICAgIC8vIGJlaGF2aW9yIG9mIGlzRW1wdHkuIEVmZmVjdGl2ZWx5IHRoaXMgZGV0ZXJtaW5lcyBpZiAwIGlzIGhhbmRsZWQgYnkgdGhlIHBvc2l0aXZlIHBhdGggb3IgbmVnYXRpdmUuXG4gICAgaWYgKCghb3B0aW9ucy5oYXNoLmluY2x1ZGVaZXJvICYmICFjb25kaXRpb25hbCkgfHwgVXRpbHMuaXNFbXB0eShjb25kaXRpb25hbCkpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3VubGVzcycsIGZ1bmN0aW9uKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGluc3RhbmNlLmhlbHBlcnNbJ2lmJ10uY2FsbCh0aGlzLCBjb25kaXRpb25hbCwge2ZuOiBvcHRpb25zLmludmVyc2UsIGludmVyc2U6IG9wdGlvbnMuZm4sIGhhc2g6IG9wdGlvbnMuaGFzaH0pO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignd2l0aCcsIGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkgeyBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpOyB9XG5cbiAgICBpZiAoIVV0aWxzLmlzRW1wdHkoY29udGV4dCkpIHJldHVybiBvcHRpb25zLmZuKGNvbnRleHQpO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignbG9nJywgZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBsZXZlbCA9IG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmRhdGEubGV2ZWwgIT0gbnVsbCA/IHBhcnNlSW50KG9wdGlvbnMuZGF0YS5sZXZlbCwgMTApIDogMTtcbiAgICBpbnN0YW5jZS5sb2cobGV2ZWwsIGNvbnRleHQpO1xuICB9KTtcbn1cblxudmFyIGxvZ2dlciA9IHtcbiAgbWV0aG9kTWFwOiB7IDA6ICdkZWJ1ZycsIDE6ICdpbmZvJywgMjogJ3dhcm4nLCAzOiAnZXJyb3InIH0sXG5cbiAgLy8gU3RhdGUgZW51bVxuICBERUJVRzogMCxcbiAgSU5GTzogMSxcbiAgV0FSTjogMixcbiAgRVJST1I6IDMsXG4gIGxldmVsOiAzLFxuXG4gIC8vIGNhbiBiZSBvdmVycmlkZGVuIGluIHRoZSBob3N0IGVudmlyb25tZW50XG4gIGxvZzogZnVuY3Rpb24obGV2ZWwsIG9iaikge1xuICAgIGlmIChsb2dnZXIubGV2ZWwgPD0gbGV2ZWwpIHtcbiAgICAgIHZhciBtZXRob2QgPSBsb2dnZXIubWV0aG9kTWFwW2xldmVsXTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgY29uc29sZVttZXRob2RdKSB7XG4gICAgICAgIGNvbnNvbGVbbWV0aG9kXS5jYWxsKGNvbnNvbGUsIG9iaik7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuZXhwb3J0cy5sb2dnZXIgPSBsb2dnZXI7XG5mdW5jdGlvbiBsb2cobGV2ZWwsIG9iaikgeyBsb2dnZXIubG9nKGxldmVsLCBvYmopOyB9XG5cbmV4cG9ydHMubG9nID0gbG9nO3ZhciBjcmVhdGVGcmFtZSA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB2YXIgb2JqID0ge307XG4gIFV0aWxzLmV4dGVuZChvYmosIG9iamVjdCk7XG4gIHJldHVybiBvYmo7XG59O1xuZXhwb3J0cy5jcmVhdGVGcmFtZSA9IGNyZWF0ZUZyYW1lOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgZXJyb3JQcm9wcyA9IFsnZGVzY3JpcHRpb24nLCAnZmlsZU5hbWUnLCAnbGluZU51bWJlcicsICdtZXNzYWdlJywgJ25hbWUnLCAnbnVtYmVyJywgJ3N0YWNrJ107XG5cbmZ1bmN0aW9uIEV4Y2VwdGlvbihtZXNzYWdlLCBub2RlKSB7XG4gIHZhciBsaW5lO1xuICBpZiAobm9kZSAmJiBub2RlLmZpcnN0TGluZSkge1xuICAgIGxpbmUgPSBub2RlLmZpcnN0TGluZTtcblxuICAgIG1lc3NhZ2UgKz0gJyAtICcgKyBsaW5lICsgJzonICsgbm9kZS5maXJzdENvbHVtbjtcbiAgfVxuXG4gIHZhciB0bXAgPSBFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBtZXNzYWdlKTtcblxuICAvLyBVbmZvcnR1bmF0ZWx5IGVycm9ycyBhcmUgbm90IGVudW1lcmFibGUgaW4gQ2hyb21lIChhdCBsZWFzdCksIHNvIGBmb3IgcHJvcCBpbiB0bXBgIGRvZXNuJ3Qgd29yay5cbiAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgZXJyb3JQcm9wcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgdGhpc1tlcnJvclByb3BzW2lkeF1dID0gdG1wW2Vycm9yUHJvcHNbaWR4XV07XG4gIH1cblxuICBpZiAobGluZSkge1xuICAgIHRoaXMubGluZU51bWJlciA9IGxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSBub2RlLmZpcnN0Q29sdW1uO1xuICB9XG59XG5cbkV4Y2VwdGlvbi5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBFeGNlcHRpb247IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgVXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBFeGNlcHRpb24gPSByZXF1aXJlKFwiLi9leGNlcHRpb25cIilbXCJkZWZhdWx0XCJdO1xudmFyIENPTVBJTEVSX1JFVklTSU9OID0gcmVxdWlyZShcIi4vYmFzZVwiKS5DT01QSUxFUl9SRVZJU0lPTjtcbnZhciBSRVZJU0lPTl9DSEFOR0VTID0gcmVxdWlyZShcIi4vYmFzZVwiKS5SRVZJU0lPTl9DSEFOR0VTO1xuXG5mdW5jdGlvbiBjaGVja1JldmlzaW9uKGNvbXBpbGVySW5mbykge1xuICB2YXIgY29tcGlsZXJSZXZpc2lvbiA9IGNvbXBpbGVySW5mbyAmJiBjb21waWxlckluZm9bMF0gfHwgMSxcbiAgICAgIGN1cnJlbnRSZXZpc2lvbiA9IENPTVBJTEVSX1JFVklTSU9OO1xuXG4gIGlmIChjb21waWxlclJldmlzaW9uICE9PSBjdXJyZW50UmV2aXNpb24pIHtcbiAgICBpZiAoY29tcGlsZXJSZXZpc2lvbiA8IGN1cnJlbnRSZXZpc2lvbikge1xuICAgICAgdmFyIHJ1bnRpbWVWZXJzaW9ucyA9IFJFVklTSU9OX0NIQU5HRVNbY3VycmVudFJldmlzaW9uXSxcbiAgICAgICAgICBjb21waWxlclZlcnNpb25zID0gUkVWSVNJT05fQ0hBTkdFU1tjb21waWxlclJldmlzaW9uXTtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJUZW1wbGF0ZSB3YXMgcHJlY29tcGlsZWQgd2l0aCBhbiBvbGRlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiBcIitcbiAgICAgICAgICAgIFwiUGxlYXNlIHVwZGF0ZSB5b3VyIHByZWNvbXBpbGVyIHRvIGEgbmV3ZXIgdmVyc2lvbiAoXCIrcnVudGltZVZlcnNpb25zK1wiKSBvciBkb3duZ3JhZGUgeW91ciBydW50aW1lIHRvIGFuIG9sZGVyIHZlcnNpb24gKFwiK2NvbXBpbGVyVmVyc2lvbnMrXCIpLlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVXNlIHRoZSBlbWJlZGRlZCB2ZXJzaW9uIGluZm8gc2luY2UgdGhlIHJ1bnRpbWUgZG9lc24ndCBrbm93IGFib3V0IHRoaXMgcmV2aXNpb24geWV0XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYSBuZXdlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiBcIitcbiAgICAgICAgICAgIFwiUGxlYXNlIHVwZGF0ZSB5b3VyIHJ1bnRpbWUgdG8gYSBuZXdlciB2ZXJzaW9uIChcIitjb21waWxlckluZm9bMV0rXCIpLlwiKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0cy5jaGVja1JldmlzaW9uID0gY2hlY2tSZXZpc2lvbjsvLyBUT0RPOiBSZW1vdmUgdGhpcyBsaW5lIGFuZCBicmVhayB1cCBjb21waWxlUGFydGlhbFxuXG5mdW5jdGlvbiB0ZW1wbGF0ZSh0ZW1wbGF0ZVNwZWMsIGVudikge1xuICBpZiAoIWVudikge1xuICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJObyBlbnZpcm9ubWVudCBwYXNzZWQgdG8gdGVtcGxhdGVcIik7XG4gIH1cblxuICAvLyBOb3RlOiBVc2luZyBlbnYuVk0gcmVmZXJlbmNlcyByYXRoZXIgdGhhbiBsb2NhbCB2YXIgcmVmZXJlbmNlcyB0aHJvdWdob3V0IHRoaXMgc2VjdGlvbiB0byBhbGxvd1xuICAvLyBmb3IgZXh0ZXJuYWwgdXNlcnMgdG8gb3ZlcnJpZGUgdGhlc2UgYXMgcHN1ZWRvLXN1cHBvcnRlZCBBUElzLlxuICB2YXIgaW52b2tlUGFydGlhbFdyYXBwZXIgPSBmdW5jdGlvbihwYXJ0aWFsLCBuYW1lLCBjb250ZXh0LCBoZWxwZXJzLCBwYXJ0aWFscywgZGF0YSkge1xuICAgIHZhciByZXN1bHQgPSBlbnYuVk0uaW52b2tlUGFydGlhbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmIChyZXN1bHQgIT0gbnVsbCkgeyByZXR1cm4gcmVzdWx0OyB9XG5cbiAgICBpZiAoZW52LmNvbXBpbGUpIHtcbiAgICAgIHZhciBvcHRpb25zID0geyBoZWxwZXJzOiBoZWxwZXJzLCBwYXJ0aWFsczogcGFydGlhbHMsIGRhdGE6IGRhdGEgfTtcbiAgICAgIHBhcnRpYWxzW25hbWVdID0gZW52LmNvbXBpbGUocGFydGlhbCwgeyBkYXRhOiBkYXRhICE9PSB1bmRlZmluZWQgfSwgZW52KTtcbiAgICAgIHJldHVybiBwYXJ0aWFsc1tuYW1lXShjb250ZXh0LCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIlRoZSBwYXJ0aWFsIFwiICsgbmFtZSArIFwiIGNvdWxkIG5vdCBiZSBjb21waWxlZCB3aGVuIHJ1bm5pbmcgaW4gcnVudGltZS1vbmx5IG1vZGVcIik7XG4gICAgfVxuICB9O1xuXG4gIC8vIEp1c3QgYWRkIHdhdGVyXG4gIHZhciBjb250YWluZXIgPSB7XG4gICAgZXNjYXBlRXhwcmVzc2lvbjogVXRpbHMuZXNjYXBlRXhwcmVzc2lvbixcbiAgICBpbnZva2VQYXJ0aWFsOiBpbnZva2VQYXJ0aWFsV3JhcHBlcixcbiAgICBwcm9ncmFtczogW10sXG4gICAgcHJvZ3JhbTogZnVuY3Rpb24oaSwgZm4sIGRhdGEpIHtcbiAgICAgIHZhciBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV07XG4gICAgICBpZihkYXRhKSB7XG4gICAgICAgIHByb2dyYW1XcmFwcGVyID0gcHJvZ3JhbShpLCBmbiwgZGF0YSk7XG4gICAgICB9IGVsc2UgaWYgKCFwcm9ncmFtV3JhcHBlcikge1xuICAgICAgICBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV0gPSBwcm9ncmFtKGksIGZuKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcm9ncmFtV3JhcHBlcjtcbiAgICB9LFxuICAgIG1lcmdlOiBmdW5jdGlvbihwYXJhbSwgY29tbW9uKSB7XG4gICAgICB2YXIgcmV0ID0gcGFyYW0gfHwgY29tbW9uO1xuXG4gICAgICBpZiAocGFyYW0gJiYgY29tbW9uICYmIChwYXJhbSAhPT0gY29tbW9uKSkge1xuICAgICAgICByZXQgPSB7fTtcbiAgICAgICAgVXRpbHMuZXh0ZW5kKHJldCwgY29tbW9uKTtcbiAgICAgICAgVXRpbHMuZXh0ZW5kKHJldCwgcGFyYW0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuICAgIHByb2dyYW1XaXRoRGVwdGg6IGVudi5WTS5wcm9ncmFtV2l0aERlcHRoLFxuICAgIG5vb3A6IGVudi5WTS5ub29wLFxuICAgIGNvbXBpbGVySW5mbzogbnVsbFxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIG5hbWVzcGFjZSA9IG9wdGlvbnMucGFydGlhbCA/IG9wdGlvbnMgOiBlbnYsXG4gICAgICAgIGhlbHBlcnMsXG4gICAgICAgIHBhcnRpYWxzO1xuXG4gICAgaWYgKCFvcHRpb25zLnBhcnRpYWwpIHtcbiAgICAgIGhlbHBlcnMgPSBvcHRpb25zLmhlbHBlcnM7XG4gICAgICBwYXJ0aWFscyA9IG9wdGlvbnMucGFydGlhbHM7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSB0ZW1wbGF0ZVNwZWMuY2FsbChcbiAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgbmFtZXNwYWNlLCBjb250ZXh0LFxuICAgICAgICAgIGhlbHBlcnMsXG4gICAgICAgICAgcGFydGlhbHMsXG4gICAgICAgICAgb3B0aW9ucy5kYXRhKTtcblxuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsKSB7XG4gICAgICBlbnYuVk0uY2hlY2tSZXZpc2lvbihjb250YWluZXIuY29tcGlsZXJJbmZvKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG5leHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7ZnVuY3Rpb24gcHJvZ3JhbVdpdGhEZXB0aChpLCBmbiwgZGF0YSAvKiwgJGRlcHRoICovKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAzKTtcblxuICB2YXIgcHJvZyA9IGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBbY29udGV4dCwgb3B0aW9ucy5kYXRhIHx8IGRhdGFdLmNvbmNhdChhcmdzKSk7XG4gIH07XG4gIHByb2cucHJvZ3JhbSA9IGk7XG4gIHByb2cuZGVwdGggPSBhcmdzLmxlbmd0aDtcbiAgcmV0dXJuIHByb2c7XG59XG5cbmV4cG9ydHMucHJvZ3JhbVdpdGhEZXB0aCA9IHByb2dyYW1XaXRoRGVwdGg7ZnVuY3Rpb24gcHJvZ3JhbShpLCBmbiwgZGF0YSkge1xuICB2YXIgcHJvZyA9IGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiBmbihjb250ZXh0LCBvcHRpb25zLmRhdGEgfHwgZGF0YSk7XG4gIH07XG4gIHByb2cucHJvZ3JhbSA9IGk7XG4gIHByb2cuZGVwdGggPSAwO1xuICByZXR1cm4gcHJvZztcbn1cblxuZXhwb3J0cy5wcm9ncmFtID0gcHJvZ3JhbTtmdW5jdGlvbiBpbnZva2VQYXJ0aWFsKHBhcnRpYWwsIG5hbWUsIGNvbnRleHQsIGhlbHBlcnMsIHBhcnRpYWxzLCBkYXRhKSB7XG4gIHZhciBvcHRpb25zID0geyBwYXJ0aWFsOiB0cnVlLCBoZWxwZXJzOiBoZWxwZXJzLCBwYXJ0aWFsczogcGFydGlhbHMsIGRhdGE6IGRhdGEgfTtcblxuICBpZihwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiVGhlIHBhcnRpYWwgXCIgKyBuYW1lICsgXCIgY291bGQgbm90IGJlIGZvdW5kXCIpO1xuICB9IGVsc2UgaWYocGFydGlhbCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIHBhcnRpYWwoY29udGV4dCwgb3B0aW9ucyk7XG4gIH1cbn1cblxuZXhwb3J0cy5pbnZva2VQYXJ0aWFsID0gaW52b2tlUGFydGlhbDtmdW5jdGlvbiBub29wKCkgeyByZXR1cm4gXCJcIjsgfVxuXG5leHBvcnRzLm5vb3AgPSBub29wOyIsIlwidXNlIHN0cmljdFwiO1xuLy8gQnVpbGQgb3V0IG91ciBiYXNpYyBTYWZlU3RyaW5nIHR5cGVcbmZ1bmN0aW9uIFNhZmVTdHJpbmcoc3RyaW5nKSB7XG4gIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xufVxuXG5TYWZlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gXCJcIiArIHRoaXMuc3RyaW5nO1xufTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBTYWZlU3RyaW5nOyIsIlwidXNlIHN0cmljdFwiO1xuLypqc2hpbnQgLVcwMDQgKi9cbnZhciBTYWZlU3RyaW5nID0gcmVxdWlyZShcIi4vc2FmZS1zdHJpbmdcIilbXCJkZWZhdWx0XCJdO1xuXG52YXIgZXNjYXBlID0ge1xuICBcIiZcIjogXCImYW1wO1wiLFxuICBcIjxcIjogXCImbHQ7XCIsXG4gIFwiPlwiOiBcIiZndDtcIixcbiAgJ1wiJzogXCImcXVvdDtcIixcbiAgXCInXCI6IFwiJiN4Mjc7XCIsXG4gIFwiYFwiOiBcIiYjeDYwO1wiXG59O1xuXG52YXIgYmFkQ2hhcnMgPSAvWyY8PlwiJ2BdL2c7XG52YXIgcG9zc2libGUgPSAvWyY8PlwiJ2BdLztcblxuZnVuY3Rpb24gZXNjYXBlQ2hhcihjaHIpIHtcbiAgcmV0dXJuIGVzY2FwZVtjaHJdIHx8IFwiJmFtcDtcIjtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKG9iaiwgdmFsdWUpIHtcbiAgZm9yKHZhciBrZXkgaW4gdmFsdWUpIHtcbiAgICBpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGtleSkpIHtcbiAgICAgIG9ialtrZXldID0gdmFsdWVba2V5XTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0cy5leHRlbmQgPSBleHRlbmQ7dmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmV4cG9ydHMudG9TdHJpbmcgPSB0b1N0cmluZztcbi8vIFNvdXJjZWQgZnJvbSBsb2Rhc2hcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iZXN0aWVqcy9sb2Rhc2gvYmxvYi9tYXN0ZXIvTElDRU5TRS50eHRcbnZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn07XG4vLyBmYWxsYmFjayBmb3Igb2xkZXIgdmVyc2lvbnMgb2YgQ2hyb21lIGFuZCBTYWZhcmlcbmlmIChpc0Z1bmN0aW9uKC94LykpIHtcbiAgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbiAgfTtcbn1cbnZhciBpc0Z1bmN0aW9uO1xuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpID8gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XScgOiBmYWxzZTtcbn07XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBlc2NhcGVFeHByZXNzaW9uKHN0cmluZykge1xuICAvLyBkb24ndCBlc2NhcGUgU2FmZVN0cmluZ3MsIHNpbmNlIHRoZXkncmUgYWxyZWFkeSBzYWZlXG4gIGlmIChzdHJpbmcgaW5zdGFuY2VvZiBTYWZlU3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy50b1N0cmluZygpO1xuICB9IGVsc2UgaWYgKCFzdHJpbmcgJiYgc3RyaW5nICE9PSAwKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICAvLyBGb3JjZSBhIHN0cmluZyBjb252ZXJzaW9uIGFzIHRoaXMgd2lsbCBiZSBkb25lIGJ5IHRoZSBhcHBlbmQgcmVnYXJkbGVzcyBhbmRcbiAgLy8gdGhlIHJlZ2V4IHRlc3Qgd2lsbCBkbyB0aGlzIHRyYW5zcGFyZW50bHkgYmVoaW5kIHRoZSBzY2VuZXMsIGNhdXNpbmcgaXNzdWVzIGlmXG4gIC8vIGFuIG9iamVjdCdzIHRvIHN0cmluZyBoYXMgZXNjYXBlZCBjaGFyYWN0ZXJzIGluIGl0LlxuICBzdHJpbmcgPSBcIlwiICsgc3RyaW5nO1xuXG4gIGlmKCFwb3NzaWJsZS50ZXN0KHN0cmluZykpIHsgcmV0dXJuIHN0cmluZzsgfVxuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoYmFkQ2hhcnMsIGVzY2FwZUNoYXIpO1xufVxuXG5leHBvcnRzLmVzY2FwZUV4cHJlc3Npb24gPSBlc2NhcGVFeHByZXNzaW9uO2Z1bmN0aW9uIGlzRW1wdHkodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnRzLmlzRW1wdHkgPSBpc0VtcHR5OyIsIi8vIENyZWF0ZSBhIHNpbXBsZSBwYXRoIGFsaWFzIHRvIGFsbG93IGJyb3dzZXJpZnkgdG8gcmVzb2x2ZVxuLy8gdGhlIHJ1bnRpbWUgb24gYSBzdXBwb3J0ZWQgcGF0aC5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kaXN0L2Nqcy9oYW5kbGViYXJzLnJ1bnRpbWUnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImhhbmRsZWJhcnMvcnVudGltZVwiKVtcImRlZmF1bHRcIl07XG4iXX0=
