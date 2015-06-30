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

        if (_.isObject(response.collection)) {
            Backbone.Collection.prototype.set.call(this, response.collection, options);
        }
        if (_.isObject(response.metadata)) {
            this.updateMetadata(response.metadata);
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
                        this.set({ collection: contactList });
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

                addContact: function addContact(contactInfo) {}
        });
});
module.exports = ContactsCollection;

//this.set({collection:[{
//    title:contactInfo,
//    address:contactInfo + "@maildo.com"
//}]});

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6XFxzbWRcXG1haWxkb1xcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2Jhc2UtY29sbGVjdGlvbnMvYmFzZUNvbGxlY3Rpb24uanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2Jhc2UtY29sbGVjdGlvbnMvZmlsdGVyZWRDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9iYXNlLW1vZGVscy9iYXNlTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2NvbnRleHQvY29udGV4dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvZGVjb3JhdG9ycy9GaWx0ZXJDb2xsZWN0aW9uRGVjb3JhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9kZWNvcmF0b3JzL3NlbGVjdGFibGVDb2xsZWN0aW9uRGVjb3JhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9saWItZXh0ZW5zaW9ucy9iYWNrYm9uZS5zeW5jLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9saWItZXh0ZW5zaW9ucy9tYXJpb25ldHRlLmV4dGVuc2lvbnMuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2xpYi1leHRlbnNpb25zL3VuZGVyc2NvcmUubWl4aW4uZGVlcEV4dGVuZC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvcGx1Z2lucy9qcXVlcnkuYmEtb3V0c2lkZS1ldmVudHMuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3BsdWdpbnMvdG9nZ2xlLmJsb2NrLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9yZXNvbHZlcnMvZHJvcGRvd25EaXNwbGF5ZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3Jlc29sdmVycy9mb3JtYXR0ZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3Jlc29sdmVycy90cmFuc2xhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9zZXR0aW5ncy9zZXR0aW5ncy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvc2V0dGluZ3Mvc2V0dGluZ3NDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9zb2NrZXQvc29ja2V0Q29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9hdXRvQ29tcGxldGUvYXV0b0NvbXBsZXRlLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS9qcy9jb2xsZWN0aW9ucy9hdXRvQ29tcGxldGVDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS9qcy9tb2RlbHMvYXV0b0NvbXBsZXRlTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvYXV0b0NvbXBsZXRlL2pzL3ZpZXdzL2F1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvYXV0b0NvbXBsZXRlL2pzL3ZpZXdzL2F1dG9Db21wbGV0ZUl0ZW1WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS91aS90ZW1wbGF0ZXMvYXV0b0NvbXBsZXRlLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9hdXRvQ29tcGxldGUvdWkvdGVtcGxhdGVzL2F1dG9Db21wbGV0ZUl0ZW0uaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2RpYWxvZy9kaWFsb2cuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvZGlhbG9nL2pzL3ZpZXdzL2RpYWxvZ1ZpZXcxLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2RpYWxvZy91aS90ZW1wbGF0ZXMvZGlhbG9nLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9zZWFyY2gvc2VhcmNoLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL3NlYXJjaC91aS90ZW1wbGF0ZXMvc2VhcmNoLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL2pzL2NvbGxlY3Rpb25zL3RhZ0NvbGxlY3Rpb24uanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy9tb2RlbHMvdGFnTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy92aWV3cy90YWdzSXRlbVZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy92aWV3cy90YWdzVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL3RhZ3MuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy91aS90ZW1wbGF0ZXMvdGFnLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL3VpL3RlbXBsYXRlcy90YWdzQ29udGFpbmVyLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9mcmFtZS5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy9mcmFtZUxheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy9sb2FkZXJWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL2pzL3ZpZXdzL3NldHRpbmdzVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy90ZWNoQmFyVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS91aS90ZW1wbGF0ZXMvZnJhbWVMYXlvdXQuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy9sb2FkZXIuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy9zZXR0aW5nc1ZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy90ZWNoQmFyLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29sbGVjdGlvbnMvY29udGFjdHNDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb2xsZWN0aW9ucy9tYWlsQ29sbGVjdGlvbi5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29udHJvbGxlcnMvbWFpbEFjdGlvbnNDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb250cm9sbGVycy9tYWlsQ29udGVudExheW91dENvbnRyb2xsZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL2NvbnRyb2xsZXJzL21haWxEYXRhQ29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29udHJvbGxlcnMvbWFpbE1haW5MYXlvdXRDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb250cm9sbGVycy9tYWlsUm91dGVyQ29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvbW9kZWxzL2NvbnRhY3RNb2RlbC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvbW9kZWxzL2NvbnRhY3RzRmlsdGVyTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL21vZGVscy9tYWlsTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL3JvdXRlcnMvbWFpbFJvdXRlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvYWN0aW9uVmlldy9fbW9yZUFjdGlvbnNWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9hY3Rpb25WaWV3L19tb3ZlVG9WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9hY3Rpb25WaWV3L19wYWdlclZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL3ZpZXdzL2FjdGlvblZpZXcvYWN0aW9uVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvY29tcG9zZVZpZXcvX2FkZHJlc3NWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9jb21wb3NlVmlldy9jb21wb3NlVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvZW1wdHlGb2xkZXJWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9lbXB0eU1haWxWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9tYWlsQ29udGVudExheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvbWFpbEl0ZW1WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9tYWlsTWFpbkxheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvbWFpbHNWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9uYXZWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9wcmV2aWV3Vmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3Mvc2VhcmNoVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvbWFpbC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL19hZGRyZXNzVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9hY3Rpb25WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2NvbXBvc2VWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2NvbnRlbnRMYXlvdXQuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvZW1wdHlGb2xkZXJWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2VtcHR5TWFpbFZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvbWFpbEl0ZW1WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL21haWxzVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9tYWluTGF5b3V0LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL21vcmVBY3Rpb25zVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9tb3ZlVG9WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL25hdlZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvcGFnZXJWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL3ByZXZpZXdWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL3NlYXJjaFZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL3NldHVwL2FwcC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9zZXR1cC9pbml0LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL3NldHVwL3ZlbmRvcnNMb2FkZXIuanMiLCJEOi9zbWQvbWFpbGRvL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMucnVudGltZS5qcyIsIkQ6L3NtZC9tYWlsZG8vbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9iYXNlLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL2V4Y2VwdGlvbi5qcyIsIkQ6L3NtZC9tYWlsZG8vbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9ydW50aW1lLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3NhZmUtc3RyaW5nLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3V0aWxzLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9ydW50aW1lLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGJzZnkvcnVudGltZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLFlBQVksQ0FBQzs7QUFFYixJQUFJLGNBQWMsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQzs7QUFFNUMsWUFBUSxFQUFFLEVBQUU7Ozs7OztBQU1aLFNBQUssRUFBRSxlQUFVLE9BQU8sRUFBRTs7QUFFdEIsZUFBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7O0FBRXhCLFlBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDbEMsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtB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Q0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQ3BFLENBQUMsQ0FBQzs7Ozs7O0FBTUgsUUFBSSxDQUFDLFNBQVMsR0FBRSxZQUFVO0FBQ3RCLGVBQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQy9DLENBQUM7Q0FDTCxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7QUNsQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNB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QUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgQmFzZUNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgbWV0YWRhdGE6IHt9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBvdmVycmlkZSBmZXRjaCBmb3IgdHJpZ2dlcmluZy5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZmV0Y2g6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICB2YXIgc3VjY2Vzc0Z1bmMgPSBvcHRpb25zLnN1Y2Nlc3M7XHJcbiAgICAgICAgdmFyIGVycm9yRnVuYyA9IG9wdGlvbnMuZXJyb3I7XHJcblxyXG4gICAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCByZXNwb25zZSwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKFwiZmV0Y2g6c3VjY2Vzc1wiLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24oc3VjY2Vzc0Z1bmMpKSB7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzRnVuYyhjb2xsZWN0aW9uLCByZXNwb25zZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIG9wdGlvbnMuZXJyb3IgPSBmdW5jdGlvbiAoY29sbGVjdGlvbiwgcmVzcG9uc2UsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcihcImZldGNoOmVycm9yXCIsIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihlcnJvckZ1bmMpKSB7XHJcbiAgICAgICAgICAgICAgICBlcnJvckZ1bmMoY29sbGVjdGlvbiwgcmVzcG9uc2UsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIEJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLmZldGNoLmNhbGwodGhpcywgb3B0aW9ucyk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gc2V0XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNldDogZnVuY3Rpb24gKHJlc3BvbnNlLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHJlc3BvbnNlID0gXy5pc09iamVjdChyZXNwb25zZSkgPyByZXNwb25zZSA6IHt9O1xyXG5cclxuICAgICAgICBpZiAoXy5pc09iamVjdChyZXNwb25zZS5jb2xsZWN0aW9uKSkge1xyXG4gICAgICAgICAgICBCYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5zZXQuY2FsbCh0aGlzLCByZXNwb25zZS5jb2xsZWN0aW9uLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKF8uaXNPYmplY3QocmVzcG9uc2UubWV0YWRhdGEpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTWV0YWRhdGEocmVzcG9uc2UubWV0YWRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHVwZGF0ZU1ldGFkYXRhOiBmdW5jdGlvbiAobWV0YWRhdGEpIHtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzRXF1YWwodGhpcy5tZXRhZGF0YSwgbWV0YWRhdGEpKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1ldGFkYXRhID0gXy5jbG9uZShtZXRhZGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcihcImNoYW5nZTptZXRhZGF0YVwiLCBtZXRhZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBkZXN0cm95XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVzdHJveTogZnVuY3Rpb24gKF9vcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgb3B0aW9ucyA9IF9vcHRpb25zID8gXy5jbG9uZShfb3B0aW9ucykgOiB7fSxcclxuICAgICAgICAgICAgc3VjY2VzcyA9IG9wdGlvbnMuc3VjY2VzcztcclxuXHJcbiAgICAgICAgaWYgKF8uaXNBcnJheShvcHRpb25zLnNlbGVjdGVkSXRlbXMpKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMuZGF0YSA9IG9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5zcGxpY2UoMCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgb3B0aW9ucy5kYXRhID0gdGhpcy5nZXRNb2RlbElkcygpOyAvLyBhbGwgaXRlbXNcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF8uZWFjaChvcHRpb25zLmRhdGEsIGZ1bmN0aW9uIChpdGVtKSB7IC8vIHJlbW92ZSBuZXcgb3Igbm90IGV4aXN0ZWQgaXRlbXNcclxuICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgIGlmICghbW9kZWwgfHwgbW9kZWwuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5kYXRhID0gb3B0aW9ucy5kYXRhLnNsaWNlKCQuaW5BcnJheShpdGVtLCBvcHRpb25zLmRhdGEpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoXy5pc0VtcHR5KG9wdGlvbnMuZGF0YSkpIHsgLy9ubyBpdGVtcyB0byBkZWxldGVcclxuICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwKSB7XHJcbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzKHRoYXQsIHJlc3AsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoYXQudHJpZ2dlcignZGVsZXRlOnN1Y2Nlc3MnLCB0aGF0LCByZXNwLCBvcHRpb25zKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gQmFja2JvbmUuc3luYy5hcHBseSh0aGlzLCBbJ2RlbGV0ZScsIHRoaXMsIG9wdGlvbnNdKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gdXBkYXRlXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAoX29wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICBvcHRpb25zID0gX29wdGlvbnMgPyBfLmNsb25lKF9vcHRpb25zKSA6IHt9LFxyXG4gICAgICAgICAgICBzdWNjZXNzRnVuYyA9IG9wdGlvbnMuc3VjY2VzcztcclxuXHJcbiAgICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3ApIHtcclxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NGdW5jKSB7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzRnVuYyh0aGF0LCByZXNwLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGF0LnRyaWdnZXIoJ3VwZGF0ZTpzdWNjZXNzJywgdGhhdCwgcmVzcCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIEJhY2tib25lLnN5bmMuYXBwbHkodGhpcywgWyd1cGRhdGUnLCB0aGlzLCBvcHRpb25zXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB0b0pTT046IGZ1bmN0aW9uIChfb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgYXJyID0gW10sXHJcbiAgICAgICAgICAgIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICBvcHRpb25zID0gX29wdGlvbnMgfHwge30sXHJcbiAgICAgICAgICAgIGl0ZW1zID0gb3B0aW9ucy5zZWxlY3RlZEl0ZW1zIHx8IHRoaXMuZ2V0TW9kZWxJZHMoKTtcclxuXHJcbiAgICAgICAgXy5lYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5nZXQoaXRlbSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgIGlmICghbW9kZWwuaXNOZXcoKSAmJiBvcHRpb25zLmZpZWxkcykge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZmllbGRzLnB1c2goXCJpZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbCA9IG1vZGVsLnRvSlNPTih7ZmllbGRzOiBvcHRpb25zLmZpZWxkc30pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbCA9IG1vZGVsLnRvSlNPTigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYXJyLnB1c2gobW9kZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBnZXRNb2RlbElkczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKG1vZGVsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb2RlbC5pZDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VDb2xsZWN0aW9uO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBCYXNlQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCIuL2Jhc2VDb2xsZWN0aW9uXCIpO1xyXG5cclxudmFyIEZpbHRlcmVkQ29sbGVjdGlvbiA9IEJhc2VDb2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgUEFHRV9TSVpFOiAxMCxcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBCYXNlQ29sbGVjdGlvbi5wcm90b3R5cGUuaW5pdGlhbGl6ZShvcHRpb25zKTtcclxuICAgICAgICB0aGlzLnNldEZpbHRlcnMob3B0aW9ucyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gZmV0Y2hCeVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZmV0Y2hCeTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgIHRoaXMuc2V0RmlsdGVycyhvcHRpb25zKTtcclxuXHJcbiAgICAgICAgdGhpcy5mZXRjaCh7XHJcblxyXG4gICAgICAgICAgICByZXNldDogdHJ1ZSxcclxuXHJcbiAgICAgICAgICAgIGRhdGE6IHRoaXMuZmlsdGVycyxcclxuXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IF8uYmluZChmdW5jdGlvbiAoY29sbGVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0ZldGNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihvcHRpb25zLnN1Y2Nlc3MpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKGNvbGxlY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB0aGlzKSxcclxuXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihvcHRpb25zLmVycm9yKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IoY29sbGVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2V0RmlsdGVyczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gb3B0aW9ucy5maWx0ZXJzID8gXy5jbG9uZShvcHRpb25zLmZpbHRlcnMpIDoge3F1ZXJ5OiAnJywgcGFnZTogMX07XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gcmVmcmVzaFxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgcmVmcmVzaDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLmZldGNoQnkoe2ZpbHRlcnM6IHRoaXMuZmlsdGVyc30pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmlsdGVyZWRDb2xsZWN0aW9uOyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIERlZXBNb2RlbCA9IHJlcXVpcmUoXCJiYWNrYm9uZS1kZWVwLW1vZGVsXCIpO1xyXG5cclxudmFyIEJhc2VNb2RlbCA9IERlZXBNb2RlbC5leHRlbmQoe1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gc2F2ZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2F2ZTpmdW5jdGlvbiAoa2V5LCB2YWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaWYgKGtleSA9PSBudWxsIHx8IHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLmludmFsaWQpIHtcclxuICAgICAgICAgICAgdGhpcy5vbihcImludmFsaWRcIiwgb3B0aW9ucy5pbnZhbGlkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXN1bHQgPSBEZWVwTW9kZWwucHJvdG90eXBlLnNhdmUuY2FsbCh0aGlzLCBrZXksIHZhbCwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLmludmFsaWQpIHtcclxuICAgICAgICAgICAgdGhpcy5vZmYoXCJpbnZhbGlkXCIsIG9wdGlvbnMuaW52YWxpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyB0b0pTT05cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdG9KU09OOmZ1bmN0aW9uKG9wdGlvbnMpe1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgaWYob3B0aW9ucy5maWVsZHMpe1xyXG4gICAgICAgICAgICB2YXIgY29weSA9IHt9LCBjbG9uZSA9IF8uZGVlcENsb25lKHRoaXMuYXR0cmlidXRlcyk7XHJcblxyXG4gICAgICAgICAgICBfLmVhY2gob3B0aW9ucy5maWVsZHMsIGZ1bmN0aW9uKGZpZWxkKXtcclxuICAgICAgICAgICAgICAgIGNvcHlbZmllbGRdID0gY2xvbmVbZmllbGRdO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjb3B5O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gRGVlcE1vZGVsLnByb3RvdHlwZS50b0pTT04uY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VNb2RlbDtcclxuXHJcblxyXG5cclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIERlZXBNb2RlbCA9IHJlcXVpcmUoXCJiYWNrYm9uZS1kZWVwLW1vZGVsXCIpO1xyXG5cclxudmFyIENvbnRleHQgPSBEZWVwTW9kZWwuZXh0ZW5kKHtcclxuXHJcbiAgICBkZWZhdWx0czoge1xyXG4gICAgICAgIG1vZHVsZTogJycsXHJcbiAgICAgICAgbWFpbDoge1xyXG4gICAgICAgICAgICBhY3Rpb246IHt9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0YXNrczoge1xyXG4gICAgICAgICAgICBzZWxlY3RlZENhdGVnb3J5OiB7fVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRleHQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEZpbHRlckNvbGxlY3Rpb25EZWNvcmF0b3IgPSBmdW5jdGlvbiAob3JpZ2luYWwsIGZpbHRlck1vZGVsKSB7XHJcblxyXG4gICAgdmFyIGZpbHRlckNvbGxlY3Rpb24gPSAkLmV4dGVuZCh7fSwgb3JpZ2luYWwpO1xyXG5cclxuICAgIGZpbHRlckNvbGxlY3Rpb24ubW9kZWxzID0gW107XHJcbiAgICBmaWx0ZXJDb2xsZWN0aW9uLmZpbHRlck1vZGVsID0gZmlsdGVyTW9kZWw7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGZpbHRlckJ5XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGZpbHRlckNvbGxlY3Rpb24uZmlsdGVyQnkgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgdmFyIGl0ZW1zO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5maWx0ZXJNb2RlbCkge1xyXG4gICAgICAgICAgICBpdGVtcyA9IF8uZmlsdGVyKG9yaWdpbmFsLm1vZGVscywgXy5iaW5kKGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyTW9kZWwucHJlZGljYXRlKG1vZGVsKTtcclxuICAgICAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGl0ZW1zID0gb3JpZ2luYWwubW9kZWxzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKF8uaXNBcnJheShvcHRpb25zLm1hbmRhdG9yeUl0ZW1zKSkge1xyXG4gICAgICAgICAgICBpdGVtcyA9IF8udW5pb24ob3B0aW9ucy5tYW5kYXRvcnlJdGVtcywgaXRlbXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKF8uaXNGaW5pdGUob3B0aW9ucy5tYXhJdGVtcykpIHtcclxuICAgICAgICAgICAgaXRlbXMgPSBpdGVtcy5zbGljZSgwLCBvcHRpb25zLm1heEl0ZW1zKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChfLmlzRW1wdHkoaXRlbXMpKSB7XHJcbiAgICAgICAgICAgIGZpbHRlckNvbGxlY3Rpb24udHJpZ2dlcihcImVtcHR5OmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbHRlckNvbGxlY3Rpb24ucmVzZXQoaXRlbXMpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGZpbHRlckFsbFxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBmaWx0ZXJDb2xsZWN0aW9uLmZpbHRlckFsbCA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgZmlsdGVyQ29sbGVjdGlvbi50cmlnZ2VyKFwiZW1wdHk6Y29sbGVjdGlvblwiKTtcclxuICAgICAgICBmaWx0ZXJDb2xsZWN0aW9uLnJlc2V0KFtdKTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIGZpbHRlckNvbGxlY3Rpb247XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZpbHRlckNvbGxlY3Rpb25EZWNvcmF0b3I7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFNlbGVjdGFibGVDb2xsZWN0aW9uRGVjb3JhdG9yID0gZnVuY3Rpb24gKG9yaWdpbmFsKSB7XHJcblxyXG4gICAgdmFyIGRlY29yYXRlZENvbGxlY3Rpb24gPSAkLmV4dGVuZCh7fSwgb3JpZ2luYWwpO1xyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0ZWQgPSBbXTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVjb3JhdGVkQ29sbGVjdGlvbi5nZXRTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWQuc2xpY2UoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uaXNTZWxlY3RlZCA9IGZ1bmN0aW9uIChtb2RlbCkge1xyXG5cclxuICAgICAgICB2YXIgaWQgPSBtb2RlbC5nZXQoXCJpZFwiKTtcclxuICAgICAgICByZXR1cm4gJC5pbkFycmF5KGlkLCBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdGVkKSAhPT0gLTE7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24udW5zZWxlY3RNb2RlbCA9IGZ1bmN0aW9uIChtb2RlbCwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgaWQgPSBtb2RlbC5nZXQoXCJpZFwiKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZ2V0KGlkKSAmJiAkLmluQXJyYXkoaWQsIHRoaXMuc2VsZWN0ZWQpICE9PSAtMSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkLnNwbGljZSgkLmluQXJyYXkoaWQsIHRoaXMuc2VsZWN0ZWQpLCAxKTtcclxuICAgICAgICAgICAgcmFpc2VUcmlnZ2VyKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVjb3JhdGVkQ29sbGVjdGlvbi51cGRhdGVTZWxlY3Rpb24gPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgaXRlbXNUb1JlbW92ZSA9IFtdO1xyXG5cclxuICAgICAgICBfLmVhY2godGhpcy5zZWxlY3RlZCwgXy5iaW5kKGZ1bmN0aW9uIChzZWxlY3RlZEl0ZW0pIHtcclxuICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5nZXQoc2VsZWN0ZWRJdGVtKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzRW1wdHkobW9kZWwpKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtc1RvUmVtb3ZlLnB1c2goc2VsZWN0ZWRJdGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzRW1wdHkoaXRlbXNUb1JlbW92ZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IF8uZGlmZmVyZW5jZSh0aGlzLnNlbGVjdGVkLCBpdGVtc1RvUmVtb3ZlKTtcclxuICAgICAgICAgICAgcmFpc2VUcmlnZ2VyKG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uY2xlYXJTZWxlY3RlZCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWQubGVuZ3RoID0gMDtcclxuICAgICAgICByYWlzZVRyaWdnZXIob3B0aW9ucyk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdEFsbCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0TW9kZWxzKHRoaXMubW9kZWxzLCBvcHRpb25zKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0TW9kZWxzID0gZnVuY3Rpb24gKG1vZGVscywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgZXhjbHVzaXZlbHkgPSBvcHRpb25zID8gb3B0aW9ucy5leGNsdXNpdmVseSA6IG51bGwsIHJhaXNlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChleGNsdXNpdmVseSkge1xyXG4gICAgICAgICAgICByYWlzZSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQubGVuZ3RoID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF8uZWFjaChtb2RlbHMsIGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgICAgICAgICByYWlzZSA9IGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0TW9kZWwobW9kZWwsIHtzaWxlbnQ6IHRydWV9KSB8fCByYWlzZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgICAgaWYgKHJhaXNlKSB7XHJcbiAgICAgICAgICAgIHJhaXNlVHJpZ2dlcihvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdE1vZGVsID0gZnVuY3Rpb24gKG1vZGVsLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHZhciBpZCA9IG1vZGVsLmdldChcImlkXCIpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5nZXQoaWQpICYmICQuaW5BcnJheShpZCwgdGhpcy5zZWxlY3RlZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQucHVzaChpZCk7XHJcbiAgICAgICAgICAgIHJhaXNlVHJpZ2dlcihvcHRpb25zKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVjb3JhdGVkQ29sbGVjdGlvbi50b2dnbGVTZWxlY3Rpb24gPSBmdW5jdGlvbiAobW9kZWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3RlZChtb2RlbCkpIHtcclxuICAgICAgICAgICAgdGhpcy51bnNlbGVjdE1vZGVsKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdE1vZGVsKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgcmFpc2VUcmlnZ2VyID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdmFyIHNpbGVudCA9IG9wdGlvbnMgPyBvcHRpb25zLnNpbGVudCA6IG51bGw7XHJcblxyXG4gICAgICAgIGlmICghc2lsZW50KSB7XHJcbiAgICAgICAgICAgIGRlY29yYXRlZENvbGxlY3Rpb24udHJpZ2dlcignY2hhbmdlOnNlbGVjdGlvbicsIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0ZWQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBkZWNvcmF0ZWRDb2xsZWN0aW9uO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RhYmxlQ29sbGVjdGlvbkRlY29yYXRvcjtcclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gc29ja2V0c1N5bmNcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnZhciBzb2NrZXRTeW5jID0gZnVuY3Rpb24gKG1ldGhvZCwgbW9kZWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICB2YXIgb3B0cyA9IF8uZXh0ZW5kKHt9LCBvcHRpb25zKSxcclxuICAgICAgICBkZWZlciA9ICQuRGVmZXJyZWQoKSxcclxuICAgICAgICBwcm9taXNlID0gZGVmZXIucHJvbWlzZSgpLFxyXG4gICAgICAgIHJlcU5hbWUsXHJcbiAgICAgICAgc29ja2V0O1xyXG5cclxuICAgIG9wdHMuZGF0YSA9IG9wdHMuZGF0YSB8fCBtb2RlbC50b0pTT04ob3B0aW9ucyk7XHJcblxyXG4gICAgc29ja2V0ID0gb3B0cy5zb2NrZXQgfHwgbW9kZWwuc29ja2V0O1xyXG4gICAgcmVxTmFtZSA9IHNvY2tldC5yZXF1ZXN0TmFtZSArIFwiOlwiICsgbWV0aG9kO1xyXG5cclxuICAgIHNvY2tldC5pby5vbmNlKHJlcU5hbWUsIGZ1bmN0aW9uIChyZXMpIHtcclxuICAgICAgICB2YXIgc3VjY2VzcyA9IChyZXMgJiYgcmVzLnN1Y2Nlc3MpOyAvLyBFeHBlY3RzIHNlcnZlciBqc29uIHJlc3BvbnNlIHRvIGNvbnRhaW4gYSBib29sZWFuICdzdWNjZXNzJyBmaWVsZFxyXG4gICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24ob3B0aW9ucy5zdWNjZXNzKSkgb3B0aW9ucy5zdWNjZXNzKHJlcy5kYXRhKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShyZXMpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24ob3B0aW9ucy5lcnJvcikpIG9wdGlvbnMuZXJyb3IobW9kZWwsIHJlcyk7XHJcbiAgICAgICAgZGVmZXIucmVqZWN0KHJlcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzb2NrZXQuaW8uZW1pdChyZXFOYW1lLCBtb2RlbC51c2VyTmFtZSwgb3B0cy5kYXRhKTtcclxuICAgIG1vZGVsLnRyaWdnZXIoJ3JlcXVlc3QnLCBtb2RlbCwgcHJvbWlzZSwgb3B0cyk7XHJcblxyXG4gICAgcmV0dXJuIHByb21pc2U7XHJcbn07XHJcblxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gbG9jYWxTeW5jXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgbG9jYWxTeW5jID0gZnVuY3Rpb24gKG1ldGhvZCwgbW9kZWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICB2YXIgc3RvcmUgPSBtb2RlbC5sb2NhbFN0b3JhZ2UgfHwgbW9kZWwuY29sbGVjdGlvbi5sb2NhbFN0b3JhZ2U7XHJcblxyXG4gICAgdmFyIHJlc3AsIGVycm9yTWVzc2FnZSwgc3luY0RmZCA9ICQuRGVmZXJyZWQgJiYgJC5EZWZlcnJlZCgpOyAvL0lmICQgaXMgaGF2aW5nIERlZmVycmVkIC0gdXNlIGl0LlxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgc3dpdGNoIChtZXRob2QpIHtcclxuICAgICAgICAgICAgY2FzZSBcInJlYWRcIjpcclxuICAgICAgICAgICAgICAgIHJlc3AgPSBtb2RlbC5pZCAhPT0gdW5kZWZpbmVkID8gc3RvcmUuZmluZChtb2RlbCkgOiBzdG9yZS5maW5kQWxsKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXNwID0gc3RvcmUuY3JlYXRlKG1vZGVsKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwidXBkYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXNwID0gbW9kZWwuaWQgIT09IHVuZGVmaW5lZCA/IHN0b3JlLnVwZGF0ZShtb2RlbCkgOiBzdG9yZS51cGRhdGVCdWxrKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiZGVsZXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXNwID0gbW9kZWwuaWQgIT09IHVuZGVmaW5lZCA/IHN0b3JlLmRlc3Ryb3kobW9kZWwpIDogc3RvcmUuZGVzdHJveUFsbChtb2RlbCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gXCJQcml2YXRlIGJyb3dzaW5nIGlzIHVuc3VwcG9ydGVkXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaWYgKHJlc3ApIHtcclxuICAgICAgICBtb2RlbC50cmlnZ2VyKFwic3luY1wiLCBtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgIGlmIChCYWNrYm9uZS5WRVJTSU9OID09PSBcIjAuOS4xMFwiKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MobW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKHJlc3ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3luY0RmZCkge1xyXG4gICAgICAgICAgICBzeW5jRGZkLnJlc29sdmUocmVzcCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlcnJvck1lc3NhZ2UgPSBlcnJvck1lc3NhZ2UgPyBlcnJvck1lc3NhZ2UgOiBcIlJlY29yZCBOb3QgRm91bmRcIjtcclxuXHJcbiAgICAgICAgbW9kZWwudHJpZ2dlcihcImVycm9yXCIsIG1vZGVsLCBlcnJvck1lc3NhZ2UsIG9wdGlvbnMpO1xyXG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZXJyb3IpIHtcclxuICAgICAgICAgICAgaWYgKEJhY2tib25lLlZFUlNJT04gPT09IFwiMC45LjEwXCIpIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IobW9kZWwsIGVycm9yTWVzc2FnZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLmVycm9yKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN5bmNEZmQpIHtcclxuICAgICAgICAgICAgc3luY0RmZC5yZWplY3QoZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5jb21wbGV0ZSkge1xyXG4gICAgICAgIG9wdGlvbnMuY29tcGxldGUocmVzcCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN5bmNEZmQgJiYgc3luY0RmZC5wcm9taXNlKCk7XHJcbn07XHJcblxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gT3ZlcnJpZGUgQmFja2JvbmUuc3luY1xyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxudmFyIGFqYXhTeW5jID0gQmFja2JvbmUuc3luYztcclxuXHJcbnZhciBnZXRTeW5jTWV0aG9kID0gZnVuY3Rpb24gKG1vZGVsKSB7XHJcbiAgICBpZiAobW9kZWwubG9jYWxTdG9yYWdlIHx8IChtb2RlbC5jb2xsZWN0aW9uICYmIG1vZGVsLmNvbGxlY3Rpb24ubG9jYWxTdG9yYWdlKSkge1xyXG4gICAgICAgIHJldHVybiBsb2NhbFN5bmM7XHJcbiAgICB9XHJcbiAgICBpZiAobW9kZWwuc29ja2V0IHx8IChtb2RlbC5jb2xsZWN0aW9uICYmIG1vZGVsLmNvbGxlY3Rpb24uc29ja2V0KSkge1xyXG4gICAgICAgIHJldHVybiBzb2NrZXRTeW5jO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFqYXhTeW5jO1xyXG59O1xyXG5cclxuQmFja2JvbmUuc3luYyA9IGZ1bmN0aW9uIChtZXRob2QsIG1vZGVsLCBvcHRpb25zKSB7XHJcbiAgICBnZXRTeW5jTWV0aG9kKG1vZGVsKS5hcHBseSh0aGlzLCBbbWV0aG9kLCBtb2RlbCwgb3B0aW9uc10pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5TeW5jO1xyXG4iLCIgICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBvbkludmFsaWRcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHZhciBkZWxlZ2F0ZUV2ZW50cyA9IE1hcmlvbmV0dGUuVmlldy5wcm90b3R5cGUuZGVsZWdhdGVFdmVudHM7XHJcblxyXG4gICAgTWFyaW9uZXR0ZS5WaWV3LnByb3RvdHlwZS5kZWxlZ2F0ZUV2ZW50cyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgZGVsZWdhdGVFdmVudHMuYXBwbHkodGhpcywgW10uc2xpY2UuYXBwbHkoYXJndW1lbnRzKSk7XHJcblxyXG4gICAgICAgIHZhciB2aWV3ID0gdGhpcztcclxuICAgICAgICB2YXIgdmlld01vZGVsID0gdmlldy5tb2RlbDtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzVW5kZWZpbmVkKHZpZXdNb2RlbCkpIHtcclxuXHJcbiAgICAgICAgICAgIHZpZXcubGlzdGVuVG8odmlld01vZGVsLCBcImludmFsaWRcIiwgZnVuY3Rpb24gKG1vZGVsLCBlcnJvck9iamVjdCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odmlldy5vbkludmFsaWQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmlldy5vbkludmFsaWQobW9kZWwsIGVycm9yT2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGFkZCAtIGFuIGFsdGVybmF0aXZlIHRvIHJlZ2lvbi5zaG93KCksIGRvZXNuJ3Qgbm90IHJlbW92ZSBwZXJtYW5lbnQgdmlld3NcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIE1hcmlvbmV0dGUuUmVnaW9uLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2aWV3LCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICBpZihfLmlzT2JqZWN0KHZpZXcpICYmICFfLmlzRW1wdHkodmlldy5jaWQpKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudmlld3MgPSB0aGlzLnZpZXdzIHx8IHt9O1xyXG4gICAgICAgICAgICB0aGlzLl9lbnN1cmVFbGVtZW50KCk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYW4odmlldy5jaWQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9oYXNWaWV3KHZpZXcpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hZGRWaWV3KHZpZXcpO1xyXG4gICAgICAgICAgICAgICAgdmlldy5yZW5kZXIoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGVsLmFwcGVuZCh2aWV3LmVsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYob3B0aW9ucy5oaWRlT3RoZXJWaWV3cyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93Vmlldyh2aWV3KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgTWFyaW9uZXR0ZS50cmlnZ2VyTWV0aG9kLmNhbGwodmlldywgXCJzaG93XCIpO1xyXG4gICAgICAgICAgICBNYXJpb25ldHRlLnRyaWdnZXJNZXRob2QuY2FsbCh0aGlzLCBcInNob3dcIiwgdmlldyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBNYXJpb25ldHRlLlJlZ2lvbi5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbihjdXJyVmlld0lkKSB7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLnZpZXdzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgdmlldyA9IHRoaXMudmlld3Nba2V5XTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2aWV3ICYmICF2aWV3LmlzUGVybWFuZW50ICYmICF2aWV3LmlzRGVzdHJveWVkICYmIHZpZXcuY2lkICE9PSBjdXJyVmlld0lkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmlldy5kZXN0cm95KSB7dmlldy5kZXN0cm95KCk7fVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodmlldy5yZW1vdmUpIHt2aWV3LnJlbW92ZSgpO31cclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnZpZXdzW2tleV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIE1hcmlvbmV0dGUuUmVnaW9uLnByb3RvdHlwZS5faGFzVmlldyA9IGZ1bmN0aW9uICh2aWV3KSB7XHJcblxyXG4gICAgICAgIHJldHVybiBfLmlzT2JqZWN0KHRoaXMudmlld3Nbdmlldy5jaWRdKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgTWFyaW9uZXR0ZS5SZWdpb24ucHJvdG90eXBlLl9hZGRWaWV3ID0gZnVuY3Rpb24odmlldyl7XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICB0aGlzLnZpZXdzW3ZpZXcuY2lkXSA9IHZpZXc7XHJcblxyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odmlldywgXCJkZXN0cm95XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZGVsZXRlIHRoYXQudmlld3Nbdmlldy5jaWRdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBNYXJpb25ldHRlLlJlZ2lvbi5wcm90b3R5cGUuX3Nob3dWaWV3ID0gZnVuY3Rpb24gKHZpZXcsb3B0aW9ucykge1xyXG5cclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy52aWV3cykge1xyXG4gICAgICAgICAgICB2YXIgX3ZpZXcgPSB0aGlzLnZpZXdzW2tleV07XHJcbiAgICAgICAgICAgIGlmIChfdmlldy5jaWQgIT09IHZpZXcuY2lkKSB7XHJcbiAgICAgICAgICAgICAgICBfdmlldy4kZWwuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZpZXcuJGVsLnNob3coKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gb3ZlcnJpZGUgZGVzdHJveSAtIGNhbGxlZCBieSByZWdpb24uc2hvdygpXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgX29yaWdpbmFsRGVzdHJveSA9IE1hcmlvbmV0dGUuUmVnaW9uLnByb3RvdHlwZS5kZXN0cm95O1xyXG5cclxuICAgIE1hcmlvbmV0dGUuUmVnaW9uLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICBfb3JpZ2luYWxEZXN0cm95LmFwcGx5KHRoaXMsIFtdLnNsaWNlLmFwcGx5KGFyZ3VtZW50cykpO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy52aWV3cykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHZpZXcgPSB0aGlzLnZpZXdzW2tleV07XHJcblxyXG4gICAgICAgICAgICBpZihfLmlzT2JqZWN0KHZpZXcpKXtcclxuICAgICAgICAgICAgICAgIGlmICh2aWV3LmRlc3Ryb3kpIHt2aWV3LmRlc3Ryb3koKTt9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2aWV3LnJlbW92ZSkge3ZpZXcucmVtb3ZlKCk7fVxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMudmlld3Nba2V5XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBNYXJpb25ldHRlO1xyXG4iLCIgICAgICAgIHZhciBhcnJheXMsIGJhc2ljT2JqZWN0cywgZGVlcENsb25lLCBkZWVwRXh0ZW5kLCBkZWVwRXh0ZW5kQ291cGxlLCBpc0Jhc2ljT2JqZWN0LFxyXG4gICAgICAgICAgICBfX3NsaWNlID0gW10uc2xpY2U7XHJcblxyXG5cclxuICAgICAgICBkZWVwQ2xvbmUgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgIHZhciBmdW5jLCBpc0FycjtcclxuICAgICAgICAgICAgaWYgKCFfLmlzT2JqZWN0KG9iaikgfHwgXy5pc0Z1bmN0aW9uKG9iaikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmo7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEJhY2tib25lLkNvbGxlY3Rpb24gfHwgb2JqIGluc3RhbmNlb2YgQmFja2JvbmUuTW9kZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmo7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKF8uaXNEYXRlKG9iaikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZShvYmouZ2V0VGltZSgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoXy5pc1JlZ0V4cChvYmopKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChvYmouc291cmNlLCBvYmoudG9TdHJpbmcoKS5yZXBsYWNlKC8uKlxcLy8sIFwiXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpc0FyciA9IF8uaXNBcnJheShvYmogfHwgXy5pc0FyZ3VtZW50cyhvYmopKTtcclxuICAgICAgICAgICAgZnVuYyA9IGZ1bmN0aW9uIChtZW1vLCB2YWx1ZSwga2V5KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNBcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBtZW1vLnB1c2goZGVlcENsb25lKHZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG1lbW9ba2V5XSA9IGRlZXBDbG9uZSh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWVtbztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIF8ucmVkdWNlKG9iaiwgZnVuYywgaXNBcnIgPyBbXSA6IHt9KTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgaXNCYXNpY09iamVjdCA9IGZ1bmN0aW9uIChvYmplY3QpIHtcclxuICAgICAgICAgICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybiAob2JqZWN0LnByb3RvdHlwZSA9PT0ge30ucHJvdG90eXBlIHx8IG9iamVjdC5wcm90b3R5cGUgPT09IE9iamVjdC5wcm90b3R5cGUpICYmIF8uaXNPYmplY3Qob2JqZWN0KSAmJiAhXy5pc0FycmF5KG9iamVjdCkgJiYgIV8uaXNGdW5jdGlvbihvYmplY3QpICYmICFfLmlzRGF0ZShvYmplY3QpICYmICFfLmlzUmVnRXhwKG9iamVjdCkgJiYgIV8uaXNBcmd1bWVudHMob2JqZWN0KTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgYmFzaWNPYmplY3RzID0gZnVuY3Rpb24gKG9iamVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5maWx0ZXIoXy5rZXlzKG9iamVjdCksIGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpc0Jhc2ljT2JqZWN0KG9iamVjdFtrZXldKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIGFycmF5cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZmlsdGVyKF8ua2V5cyhvYmplY3QpLCBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5pc0FycmF5KG9iamVjdFtrZXldKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIGRlZXBFeHRlbmRDb3VwbGUgPSBmdW5jdGlvbiAoZGVzdGluYXRpb24sIHNvdXJjZSwgbWF4RGVwdGgpIHtcclxuICAgICAgICAgICAgdmFyIGNvbWJpbmUsIHJlY3Vyc2UsIHNoYXJlZEFycmF5S2V5LCBzaGFyZWRBcnJheUtleXMsIHNoYXJlZE9iamVjdEtleSwgc2hhcmVkT2JqZWN0S2V5cywgX2ksIF9qLCBfbGVuLCBfbGVuMTtcclxuICAgICAgICAgICAgaWYgKG1heERlcHRoID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIG1heERlcHRoID0gMjA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG1heERlcHRoIDw9IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignXy5kZWVwRXh0ZW5kKCk6IE1heGltdW0gZGVwdGggb2YgcmVjdXJzaW9uIGhpdC4nKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmV4dGVuZChkZXN0aW5hdGlvbiwgc291cmNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzaGFyZWRPYmplY3RLZXlzID0gXy5pbnRlcnNlY3Rpb24oYmFzaWNPYmplY3RzKGRlc3RpbmF0aW9uKSwgYmFzaWNPYmplY3RzKHNvdXJjZSkpO1xyXG4gICAgICAgICAgICByZWN1cnNlID0gZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICAgICAgc291cmNlW2tleV0gPSBkZWVwRXh0ZW5kQ291cGxlKGRlc3RpbmF0aW9uW2tleV0sIHNvdXJjZVtrZXldLCBtYXhEZXB0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvdXJjZVtrZXldO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHNoYXJlZE9iamVjdEtleXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcclxuICAgICAgICAgICAgICAgIHNoYXJlZE9iamVjdEtleSA9IHNoYXJlZE9iamVjdEtleXNbX2ldO1xyXG4gICAgICAgICAgICAgICAgcmVjdXJzZShzaGFyZWRPYmplY3RLZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNoYXJlZEFycmF5S2V5cyA9IF8uaW50ZXJzZWN0aW9uKGFycmF5cyhkZXN0aW5hdGlvbiksIGFycmF5cyhzb3VyY2UpKTtcclxuICAgICAgICAgICAgY29tYmluZSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgICAgIHNvdXJjZVtrZXldID0gXy51bmlvbihkZXN0aW5hdGlvbltrZXldLCBzb3VyY2Vba2V5XSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc291cmNlW2tleV07XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IHNoYXJlZEFycmF5S2V5cy5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcclxuICAgICAgICAgICAgICAgIHNoYXJlZEFycmF5S2V5ID0gc2hhcmVkQXJyYXlLZXlzW19qXTtcclxuICAgICAgICAgICAgICAgIGNvbWJpbmUoc2hhcmVkQXJyYXlLZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBfLmV4dGVuZChkZXN0aW5hdGlvbiwgc291cmNlKTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgZGVlcEV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGZpbmFsT2JqLCBtYXhEZXB0aCwgb2JqZWN0cywgX2k7XHJcbiAgICAgICAgICAgIG9iamVjdHMgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBfaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxKSA6IChfaSA9IDAsIFtdKTtcclxuICAgICAgICAgICAgbWF4RGVwdGggPSBhcmd1bWVudHNbX2krK107XHJcbiAgICAgICAgICAgIGlmICghXy5pc051bWJlcihtYXhEZXB0aCkpIHtcclxuICAgICAgICAgICAgICAgIG9iamVjdHMucHVzaChtYXhEZXB0aCk7XHJcbiAgICAgICAgICAgICAgICBtYXhEZXB0aCA9IDIwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChvYmplY3RzLmxlbmd0aCA8PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqZWN0c1swXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobWF4RGVwdGggPD0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZXh0ZW5kLmFwcGx5KHRoaXMsIG9iamVjdHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZpbmFsT2JqID0gb2JqZWN0cy5zaGlmdCgpO1xyXG4gICAgICAgICAgICB3aGlsZSAob2JqZWN0cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBmaW5hbE9iaiA9IGRlZXBFeHRlbmRDb3VwbGUoZmluYWxPYmosIGRlZXBDbG9uZShvYmplY3RzLnNoaWZ0KCkpLCBtYXhEZXB0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZpbmFsT2JqO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICBfLm1peGluKHtcclxuICAgICAgICAgICAgZGVlcENsb25lOmRlZXBDbG9uZSxcclxuICAgICAgICAgICAgaXNCYXNpY09iamVjdDppc0Jhc2ljT2JqZWN0LFxyXG4gICAgICAgICAgICBiYXNpY09iamVjdHM6YmFzaWNPYmplY3RzLFxyXG4gICAgICAgICAgICBhcnJheXM6YXJyYXlzLFxyXG4gICAgICAgICAgICBkZWVwRXh0ZW5kOmRlZXBFeHRlbmRcclxuICAgICAgICB9KTtcclxuIiwiLyohXHJcbiAqIGpRdWVyeSBvdXRzaWRlIGV2ZW50cyAtIHYxLjEgLSAzLzE2LzIwMTBcclxuICogaHR0cDovL2JlbmFsbWFuLmNvbS9wcm9qZWN0cy9qcXVlcnktb3V0c2lkZS1ldmVudHMtcGx1Z2luL1xyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAgXCJDb3dib3lcIiBCZW4gQWxtYW5cclxuICogRHVhbCBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgbGljZW5zZXMuXHJcbiAqIGh0dHA6Ly9iZW5hbG1hbi5jb20vYWJvdXQvbGljZW5zZS9cclxuICovXHJcblxyXG4vLyBTY3JpcHQ6IGpRdWVyeSBvdXRzaWRlIGV2ZW50c1xyXG4vL1xyXG4vLyAqVmVyc2lvbjogMS4xLCBMYXN0IHVwZGF0ZWQ6IDMvMTYvMjAxMCpcclxuLy9cclxuLy8gUHJvamVjdCBIb21lIC0gaHR0cDovL2JlbmFsbWFuLmNvbS9wcm9qZWN0cy9qcXVlcnktb3V0c2lkZS1ldmVudHMtcGx1Z2luL1xyXG4vLyBHaXRIdWIgICAgICAgLSBodHRwOi8vZ2l0aHViLmNvbS9jb3dib3kvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL1xyXG4vLyBTb3VyY2UgICAgICAgLSBodHRwOi8vZ2l0aHViLmNvbS9jb3dib3kvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL3Jhdy9tYXN0ZXIvanF1ZXJ5LmJhLW91dHNpZGUtZXZlbnRzLmpzXHJcbi8vIChNaW5pZmllZCkgICAtIGh0dHA6Ly9naXRodWIuY29tL2Nvd2JveS9qcXVlcnktb3V0c2lkZS1ldmVudHMvcmF3L21hc3Rlci9qcXVlcnkuYmEtb3V0c2lkZS1ldmVudHMubWluLmpzICgwLjlrYilcclxuLy9cclxuLy8gQWJvdXQ6IExpY2Vuc2VcclxuLy9cclxuLy8gQ29weXJpZ2h0IChjKSAyMDEwIFwiQ293Ym95XCIgQmVuIEFsbWFuLFxyXG4vLyBEdWFsIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCBsaWNlbnNlcy5cclxuLy8gaHR0cDovL2JlbmFsbWFuLmNvbS9hYm91dC9saWNlbnNlL1xyXG4vL1xyXG4vLyBBYm91dDogRXhhbXBsZXNcclxuLy9cclxuLy8gVGhlc2Ugd29ya2luZyBleGFtcGxlcywgY29tcGxldGUgd2l0aCBmdWxseSBjb21tZW50ZWQgY29kZSwgaWxsdXN0cmF0ZSBhIGZld1xyXG4vLyB3YXlzIGluIHdoaWNoIHRoaXMgcGx1Z2luIGNhbiBiZSB1c2VkLlxyXG4vL1xyXG4vLyBjbGlja291dHNpZGUgLSBodHRwOi8vYmVuYWxtYW4uY29tL2NvZGUvcHJvamVjdHMvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL2V4YW1wbGVzL2NsaWNrb3V0c2lkZS9cclxuLy8gZGJsY2xpY2tvdXRzaWRlIC0gaHR0cDovL2JlbmFsbWFuLmNvbS9jb2RlL3Byb2plY3RzL2pxdWVyeS1vdXRzaWRlLWV2ZW50cy9leGFtcGxlcy9kYmxjbGlja291dHNpZGUvXHJcbi8vIG1vdXNlb3Zlcm91dHNpZGUgLSBodHRwOi8vYmVuYWxtYW4uY29tL2NvZGUvcHJvamVjdHMvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL2V4YW1wbGVzL21vdXNlb3Zlcm91dHNpZGUvXHJcbi8vIGZvY3Vzb3V0c2lkZSAtIGh0dHA6Ly9iZW5hbG1hbi5jb20vY29kZS9wcm9qZWN0cy9qcXVlcnktb3V0c2lkZS1ldmVudHMvZXhhbXBsZXMvZm9jdXNvdXRzaWRlL1xyXG4vL1xyXG4vLyBBYm91dDogU3VwcG9ydCBhbmQgVGVzdGluZ1xyXG4vL1xyXG4vLyBJbmZvcm1hdGlvbiBhYm91dCB3aGF0IHZlcnNpb24gb3IgdmVyc2lvbnMgb2YgalF1ZXJ5IHRoaXMgcGx1Z2luIGhhcyBiZWVuXHJcbi8vIHRlc3RlZCB3aXRoLCB3aGF0IGJyb3dzZXJzIGl0IGhhcyBiZWVuIHRlc3RlZCBpbiwgYW5kIHdoZXJlIHRoZSB1bml0IHRlc3RzXHJcbi8vIHJlc2lkZSAoc28geW91IGNhbiB0ZXN0IGl0IHlvdXJzZWxmKS5cclxuLy9cclxuLy8galF1ZXJ5IFZlcnNpb25zIC0gMS40LjJcclxuLy8gQnJvd3NlcnMgVGVzdGVkIC0gSW50ZXJuZXQgRXhwbG9yZXIgNi04LCBGaXJlZm94IDItMy42LCBTYWZhcmkgMy00LCBDaHJvbWUsIE9wZXJhIDkuNi0xMC4xLlxyXG4vLyBVbml0IFRlc3RzICAgICAgLSBodHRwOi8vYmVuYWxtYW4uY29tL2NvZGUvcHJvamVjdHMvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL3VuaXQvXHJcbi8vXHJcbi8vIEFib3V0OiBSZWxlYXNlIEhpc3RvcnlcclxuLy9cclxuLy8gMS4xIC0gKDMvMTYvMjAxMCkgTWFkZSBcImNsaWNrb3V0c2lkZVwiIHBsdWdpbiBtb3JlIGdlbmVyYWwsIHJlc3VsdGluZyBpbiBhXHJcbi8vICAgICAgIHdob2xlIG5ldyBwbHVnaW4gd2l0aCBtb3JlIHRoYW4gYSBkb3plbiBkZWZhdWx0IFwib3V0c2lkZVwiIGV2ZW50cyBhbmRcclxuLy8gICAgICAgYSBtZXRob2QgdGhhdCBjYW4gYmUgdXNlZCB0byBhZGQgbmV3IG9uZXMuXHJcbi8vIDEuMCAtICgyLzI3LzIwMTApIEluaXRpYWwgcmVsZWFzZVxyXG4vL1xyXG4vLyBUb3BpYzogRGVmYXVsdCBcIm91dHNpZGVcIiBldmVudHNcclxuLy9cclxuLy8gTm90ZSB0aGF0IGVhY2ggXCJvdXRzaWRlXCIgZXZlbnQgaXMgcG93ZXJlZCBieSBhbiBcIm9yaWdpbmF0aW5nXCIgZXZlbnQuIE9ubHlcclxuLy8gd2hlbiB0aGUgb3JpZ2luYXRpbmcgZXZlbnQgaXMgdHJpZ2dlcmVkIG9uIGFuIGVsZW1lbnQgb3V0c2lkZSB0aGUgZWxlbWVudFxyXG4vLyB0byB3aGljaCB0aGF0IG91dHNpZGUgZXZlbnQgaXMgYm91bmQgd2lsbCB0aGUgYm91bmQgZXZlbnQgYmUgdHJpZ2dlcmVkLlxyXG4vL1xyXG4vLyBCZWNhdXNlIGVhY2ggb3V0c2lkZSBldmVudCBpcyBwb3dlcmVkIGJ5IGEgc2VwYXJhdGUgb3JpZ2luYXRpbmcgZXZlbnQsXHJcbi8vIHN0b3BwaW5nIHByb3BhZ2F0aW9uIG9mIHRoYXQgb3JpZ2luYXRpbmcgZXZlbnQgd2lsbCBwcmV2ZW50IGl0cyByZWxhdGVkXHJcbi8vIG91dHNpZGUgZXZlbnQgZnJvbSB0cmlnZ2VyaW5nLlxyXG4vL1xyXG4vLyAgT1VUU0lERSBFVkVOVCAgICAgLSBPUklHSU5BVElORyBFVkVOVFxyXG4vLyAgY2xpY2tvdXRzaWRlICAgICAgLSBjbGlja1xyXG4vLyAgZGJsY2xpY2tvdXRzaWRlICAgLSBkYmxjbGlja1xyXG4vLyAgZm9jdXNvdXRzaWRlICAgICAgLSBmb2N1c2luXHJcbi8vICBibHVyb3V0c2lkZSAgICAgICAtIGZvY3Vzb3V0XHJcbi8vICBtb3VzZW1vdmVvdXRzaWRlICAtIG1vdXNlbW92ZVxyXG4vLyAgbW91c2Vkb3dub3V0c2lkZSAgLSBtb3VzZWRvd25cclxuLy8gIG1vdXNldXBvdXRzaWRlICAgIC0gbW91c2V1cFxyXG4vLyAgbW91c2VvdmVyb3V0c2lkZSAgLSBtb3VzZW92ZXJcclxuLy8gIG1vdXNlb3V0b3V0c2lkZSAgIC0gbW91c2VvdXRcclxuLy8gIGtleWRvd25vdXRzaWRlICAgIC0ga2V5ZG93blxyXG4vLyAga2V5cHJlc3NvdXRzaWRlICAgLSBrZXlwcmVzc1xyXG4vLyAga2V5dXBvdXRzaWRlICAgICAgLSBrZXl1cFxyXG4vLyAgY2hhbmdlb3V0c2lkZSAgICAgLSBjaGFuZ2VcclxuLy8gIHNlbGVjdG91dHNpZGUgICAgIC0gc2VsZWN0XHJcbi8vICBzdWJtaXRvdXRzaWRlICAgICAtIHN1Ym1pdFxyXG5cclxuXHJcbnZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbihmdW5jdGlvbigkLGRvYyxvdXRzaWRlKXtcclxuICAnJDpub211bmdlJzsgLy8gVXNlZCBieSBZVUkgY29tcHJlc3Nvci5cclxuXHJcbiAgJC5tYXAoXHJcbiAgICAvLyBBbGwgdGhlc2UgZXZlbnRzIHdpbGwgZ2V0IGFuIFwib3V0c2lkZVwiIGV2ZW50IGNvdW50ZXJwYXJ0IGJ5IGRlZmF1bHQuXHJcbiAgICAnY2xpY2sgZGJsY2xpY2sgbW91c2Vtb3ZlIG1vdXNlZG93biBtb3VzZXVwIG1vdXNlb3ZlciBtb3VzZW91dCBjaGFuZ2Ugc2VsZWN0IHN1Ym1pdCBrZXlkb3duIGtleXByZXNzIGtleXVwJy5zcGxpdCgnICcpLFxyXG4gICAgZnVuY3Rpb24oIGV2ZW50X25hbWUgKSB7IGpxX2FkZE91dHNpZGVFdmVudCggZXZlbnRfbmFtZSApOyB9XHJcbiAgKTtcclxuXHJcbiAgLy8gVGhlIGZvY3VzIGFuZCBibHVyIGV2ZW50cyBhcmUgcmVhbGx5IGZvY3VzaW4gYW5kIGZvY3Vzb3V0IHdoZW4gaXQgY29tZXNcclxuICAvLyB0byBkZWxlZ2F0aW9uLCBzbyB0aGV5IGFyZSBhIHNwZWNpYWwgY2FzZS5cclxuICBqcV9hZGRPdXRzaWRlRXZlbnQoICdmb2N1c2luJywgICdmb2N1cycgKyBvdXRzaWRlICk7XHJcbiAganFfYWRkT3V0c2lkZUV2ZW50KCAnZm9jdXNvdXQnLCAnYmx1cicgKyBvdXRzaWRlICk7XHJcblxyXG4gIC8vIE1ldGhvZDogalF1ZXJ5LmFkZE91dHNpZGVFdmVudFxyXG4gIC8vXHJcbiAgLy8gUmVnaXN0ZXIgYSBuZXcgXCJvdXRzaWRlXCIgZXZlbnQgdG8gYmUgd2l0aCB0aGlzIG1ldGhvZC4gQWRkaW5nIGFuIG91dHNpZGVcclxuICAvLyBldmVudCB0aGF0IGFscmVhZHkgZXhpc3RzIHdpbGwgcHJvYmFibHkgYmxvdyB0aGluZ3MgdXAsIHNvIGNoZWNrIHRoZVxyXG4gIC8vIDxEZWZhdWx0IFwib3V0c2lkZVwiIGV2ZW50cz4gbGlzdCBiZWZvcmUgdHJ5aW5nIHRvIGFkZCBhIG5ldyBvbmUuXHJcbiAgLy9cclxuICAvLyBVc2FnZTpcclxuICAvL1xyXG4gIC8vID4galF1ZXJ5LmFkZE91dHNpZGVFdmVudCggZXZlbnRfbmFtZSBbLCBvdXRzaWRlX2V2ZW50X25hbWUgXSApO1xyXG4gIC8vXHJcbiAgLy8gQXJndW1lbnRzOlxyXG4gIC8vXHJcbiAgLy8gIGV2ZW50X25hbWUgLSAoU3RyaW5nKSBUaGUgbmFtZSBvZiB0aGUgb3JpZ2luYXRpbmcgZXZlbnQgdGhhdCB0aGUgbmV3XHJcbiAgLy8gICAgXCJvdXRzaWRlXCIgZXZlbnQgd2lsbCBiZSBwb3dlcmVkIGJ5LiBUaGlzIGV2ZW50IGNhbiBiZSBhIG5hdGl2ZSBvclxyXG4gIC8vICAgIGN1c3RvbSBldmVudCwgYXMgbG9uZyBhcyBpdCBidWJibGVzIHVwIHRoZSBET00gdHJlZS5cclxuICAvLyAgb3V0c2lkZV9ldmVudF9uYW1lIC0gKFN0cmluZykgQW4gb3B0aW9uYWwgbmFtZSBmb3IgdGhlIG5ldyBcIm91dHNpZGVcIlxyXG4gIC8vICAgIGV2ZW50LiBJZiBvbWl0dGVkLCB0aGUgb3V0c2lkZSBldmVudCB3aWxsIGJlIG5hbWVkIHdoYXRldmVyIHRoZVxyXG4gIC8vICAgIHZhbHVlIG9mIGBldmVudF9uYW1lYCBpcyBwbHVzIHRoZSBcIm91dHNpZGVcIiBzdWZmaXguXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zOlxyXG4gIC8vXHJcbiAgLy8gIE5vdGhpbmcuXHJcblxyXG4gICQuYWRkT3V0c2lkZUV2ZW50ID0ganFfYWRkT3V0c2lkZUV2ZW50O1xyXG5cclxuICBmdW5jdGlvbiBqcV9hZGRPdXRzaWRlRXZlbnQoIGV2ZW50X25hbWUsIG91dHNpZGVfZXZlbnRfbmFtZSApIHtcclxuXHJcbiAgICAvLyBUaGUgXCJvdXRzaWRlXCIgZXZlbnQgbmFtZS5cclxuICAgIG91dHNpZGVfZXZlbnRfbmFtZSA9IG91dHNpZGVfZXZlbnRfbmFtZSB8fCBldmVudF9uYW1lICsgb3V0c2lkZTtcclxuXHJcbiAgICAvLyBBIGpRdWVyeSBvYmplY3QgY29udGFpbmluZyBhbGwgZWxlbWVudHMgdG8gd2hpY2ggdGhlIFwib3V0c2lkZVwiIGV2ZW50IGlzXHJcbiAgICAvLyBib3VuZC5cclxuICAgIHZhciBlbGVtcyA9ICQoKSxcclxuXHJcbiAgICAgIC8vIFRoZSBcIm9yaWdpbmF0aW5nXCIgZXZlbnQsIG5hbWVzcGFjZWQgZm9yIGVhc3kgdW5iaW5kaW5nLlxyXG4gICAgICBldmVudF9uYW1lc3BhY2VkID0gZXZlbnRfbmFtZSArICcuJyArIG91dHNpZGVfZXZlbnRfbmFtZSArICctc3BlY2lhbC1ldmVudCc7XHJcblxyXG4gICAgLy8gRXZlbnQ6IG91dHNpZGUgZXZlbnRzXHJcbiAgICAvL1xyXG4gICAgLy8gQW4gXCJvdXRzaWRlXCIgZXZlbnQgaXMgdHJpZ2dlcmVkIG9uIGFuIGVsZW1lbnQgd2hlbiBpdHMgY29ycmVzcG9uZGluZ1xyXG4gICAgLy8gXCJvcmlnaW5hdGluZ1wiIGV2ZW50IGlzIHRyaWdnZXJlZCBvbiBhbiBlbGVtZW50IG91dHNpZGUgdGhlIGVsZW1lbnQgaW5cclxuICAgIC8vIHF1ZXN0aW9uLiBTZWUgdGhlIDxEZWZhdWx0IFwib3V0c2lkZVwiIGV2ZW50cz4gbGlzdCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgIC8vXHJcbiAgICAvLyBVc2FnZTpcclxuICAgIC8vXHJcbiAgICAvLyA+IGpRdWVyeSgnc2VsZWN0b3InKS5iaW5kKCAnY2xpY2tvdXRzaWRlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIC8vID4gICB2YXIgY2xpY2tlZF9lbGVtID0gJChldmVudC50YXJnZXQpO1xyXG4gICAgLy8gPiAgIC4uLlxyXG4gICAgLy8gPiB9KTtcclxuICAgIC8vXHJcbiAgICAvLyA+IGpRdWVyeSgnc2VsZWN0b3InKS5iaW5kKCAnZGJsY2xpY2tvdXRzaWRlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIC8vID4gICB2YXIgZG91YmxlX2NsaWNrZWRfZWxlbSA9ICQoZXZlbnQudGFyZ2V0KTtcclxuICAgIC8vID4gICAuLi5cclxuICAgIC8vID4gfSk7XHJcbiAgICAvL1xyXG4gICAgLy8gPiBqUXVlcnkoJ3NlbGVjdG9yJykuYmluZCggJ21vdXNlb3Zlcm91dHNpZGUnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgLy8gPiAgIHZhciBtb3VzZWRfb3Zlcl9lbGVtID0gJChldmVudC50YXJnZXQpO1xyXG4gICAgLy8gPiAgIC4uLlxyXG4gICAgLy8gPiB9KTtcclxuICAgIC8vXHJcbiAgICAvLyA+IGpRdWVyeSgnc2VsZWN0b3InKS5iaW5kKCAnZm9jdXNvdXRzaWRlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIC8vID4gICB2YXIgZm9jdXNlZF9lbGVtID0gJChldmVudC50YXJnZXQpO1xyXG4gICAgLy8gPiAgIC4uLlxyXG4gICAgLy8gPiB9KTtcclxuICAgIC8vXHJcbiAgICAvLyBZb3UgZ2V0IHRoZSBpZGVhLCByaWdodD9cclxuXHJcbiAgICAkLmV2ZW50LnNwZWNpYWxbIG91dHNpZGVfZXZlbnRfbmFtZSBdID0ge1xyXG5cclxuICAgICAgLy8gQ2FsbGVkIG9ubHkgd2hlbiB0aGUgZmlyc3QgXCJvdXRzaWRlXCIgZXZlbnQgY2FsbGJhY2sgaXMgYm91bmQgcGVyXHJcbiAgICAgIC8vIGVsZW1lbnQuXHJcbiAgICAgIHNldHVwOiBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAvLyBBZGQgdGhpcyBlbGVtZW50IHRvIHRoZSBsaXN0IG9mIGVsZW1lbnRzIHRvIHdoaWNoIHRoaXMgXCJvdXRzaWRlXCJcclxuICAgICAgICAvLyBldmVudCBpcyBib3VuZC5cclxuICAgICAgICBlbGVtcyA9IGVsZW1zLmFkZCggdGhpcyApO1xyXG5cclxuICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBlbGVtZW50IGdldHRpbmcgdGhlIGV2ZW50IGJvdW5kLCBiaW5kIGEgaGFuZGxlclxyXG4gICAgICAgIC8vIHRvIGRvY3VtZW50IHRvIGNhdGNoIGFsbCBjb3JyZXNwb25kaW5nIFwib3JpZ2luYXRpbmdcIiBldmVudHMuXHJcbiAgICAgICAgaWYgKCBlbGVtcy5sZW5ndGggPT09IDEgKSB7XHJcbiAgICAgICAgICAkKGRvYykuYmluZCggZXZlbnRfbmFtZXNwYWNlZCwgaGFuZGxlX2V2ZW50ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gQ2FsbGVkIG9ubHkgd2hlbiB0aGUgbGFzdCBcIm91dHNpZGVcIiBldmVudCBjYWxsYmFjayBpcyB1bmJvdW5kIHBlclxyXG4gICAgICAvLyBlbGVtZW50LlxyXG4gICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHRoaXMgZWxlbWVudCBmcm9tIHRoZSBsaXN0IG9mIGVsZW1lbnRzIHRvIHdoaWNoIHRoaXNcclxuICAgICAgICAvLyBcIm91dHNpZGVcIiBldmVudCBpcyBib3VuZC5cclxuICAgICAgICBlbGVtcyA9IGVsZW1zLm5vdCggdGhpcyApO1xyXG5cclxuICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IGVsZW1lbnQgcmVtb3ZlZCwgcmVtb3ZlIHRoZSBcIm9yaWdpbmF0aW5nXCIgZXZlbnRcclxuICAgICAgICAvLyBoYW5kbGVyIG9uIGRvY3VtZW50IHRoYXQgcG93ZXJzIHRoaXMgXCJvdXRzaWRlXCIgZXZlbnQuXHJcbiAgICAgICAgaWYgKCBlbGVtcy5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgICAkKGRvYykudW5iaW5kKCBldmVudF9uYW1lc3BhY2VkICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gQ2FsbGVkIGV2ZXJ5IHRpbWUgYSBcIm91dHNpZGVcIiBldmVudCBjYWxsYmFjayBpcyBib3VuZCB0byBhbiBlbGVtZW50LlxyXG4gICAgICBhZGQ6IGZ1bmN0aW9uKCBoYW5kbGVPYmogKSB7XHJcbiAgICAgICAgdmFyIG9sZF9oYW5kbGVyID0gaGFuZGxlT2JqLmhhbmRsZXI7XHJcblxyXG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZXZlcnkgdGltZSB0aGUgZXZlbnQgaXMgdHJpZ2dlcmVkLiBUaGlzIGlzXHJcbiAgICAgICAgLy8gdXNlZCB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBldmVudC50YXJnZXQgcmVmZXJlbmNlIHdpdGggb25lIHRoYXQgaXNcclxuICAgICAgICAvLyBtb3JlIHVzZWZ1bC5cclxuICAgICAgICBoYW5kbGVPYmouaGFuZGxlciA9IGZ1bmN0aW9uKCBldmVudCwgZWxlbSApIHtcclxuXHJcbiAgICAgICAgICAvLyBTZXQgdGhlIGV2ZW50IG9iamVjdCdzIC50YXJnZXQgcHJvcGVydHkgdG8gdGhlIGVsZW1lbnQgdGhhdCB0aGVcclxuICAgICAgICAgIC8vIHVzZXIgaW50ZXJhY3RlZCB3aXRoLCBub3QgdGhlIGVsZW1lbnQgdGhhdCB0aGUgXCJvdXRzaWRlXCIgZXZlbnQgd2FzXHJcbiAgICAgICAgICAvLyB3YXMgdHJpZ2dlcmVkIG9uLlxyXG4gICAgICAgICAgZXZlbnQudGFyZ2V0ID0gZWxlbTtcclxuXHJcbiAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBhY3R1YWwgYm91bmQgaGFuZGxlci5cclxuICAgICAgICAgIG9sZF9oYW5kbGVyLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFdoZW4gdGhlIFwib3JpZ2luYXRpbmdcIiBldmVudCBpcyB0cmlnZ2VyZWQuLlxyXG4gICAgZnVuY3Rpb24gaGFuZGxlX2V2ZW50KCBldmVudCApIHtcclxuXHJcbiAgICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgZWxlbWVudHMgdG8gd2hpY2ggdGhpcyBcIm91dHNpZGVcIiBldmVudCBpcyBib3VuZC5cclxuICAgICAgJChlbGVtcykuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBlbGVtID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhpcyBlbGVtZW50IGlzbid0IHRoZSBlbGVtZW50IG9uIHdoaWNoIHRoZSBldmVudCB3YXMgdHJpZ2dlcmVkLFxyXG4gICAgICAgIC8vIGFuZCB0aGlzIGVsZW1lbnQgZG9lc24ndCBjb250YWluIHNhaWQgZWxlbWVudCwgdGhlbiBzYWlkIGVsZW1lbnQgaXNcclxuICAgICAgICAvLyBjb25zaWRlcmVkIHRvIGJlIG91dHNpZGUsIGFuZCB0aGUgXCJvdXRzaWRlXCIgZXZlbnQgd2lsbCBiZSB0cmlnZ2VyZWQhXHJcbiAgICAgICAgaWYgKCB0aGlzICE9PSBldmVudC50YXJnZXQgJiYgIWVsZW0uaGFzKGV2ZW50LnRhcmdldCkubGVuZ3RoICkge1xyXG5cclxuICAgICAgICAgIC8vIFVzZSB0cmlnZ2VySGFuZGxlciBpbnN0ZWFkIG9mIHRyaWdnZXIgc28gdGhhdCB0aGUgXCJvdXRzaWRlXCIgZXZlbnRcclxuICAgICAgICAgIC8vIGRvZXNuJ3QgYnViYmxlLiBQYXNzIGluIHRoZSBcIm9yaWdpbmF0aW5nXCIgZXZlbnQncyAudGFyZ2V0IHNvIHRoYXRcclxuICAgICAgICAgIC8vIHRoZSBcIm91dHNpZGVcIiBldmVudC50YXJnZXQgY2FuIGJlIG92ZXJyaWRkZW4gd2l0aCBzb21ldGhpbmcgbW9yZVxyXG4gICAgICAgICAgLy8gbWVhbmluZ2Z1bC5cclxuICAgICAgICAgIGVsZW0udHJpZ2dlckhhbmRsZXIoIG91dHNpZGVfZXZlbnRfbmFtZSwgWyBldmVudC50YXJnZXQgXSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbn0pKGpRdWVyeSxkb2N1bWVudCxcIm91dHNpZGVcIik7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuKGZ1bmN0aW9uICgkLCB3aW5kb3csIGRvY3VtZW50KSB7XHJcblxyXG4gICAgJC5mbi50b2dnbGVCbG9jayA9IGZ1bmN0aW9uKHNob3cpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jc3MoXCJkaXNwbGF5XCIsIHNob3cgPyBcImJsb2NrXCIgOiBcIm5vbmVcIik7XHJcblxyXG4gICAgfTtcclxufSkoalF1ZXJ5LCB3aW5kb3csIGRvY3VtZW50KTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgZHJvcGRvd25EaXNwbGF5ZXIgPSAoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICQoJ2JvZHknKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICQoJy5kcm9wZG93bi1zbGlkZXInKS5oaWRlKCk7XHJcbiAgICAgICAgJChcIi5jbGlja2VkXCIpLnJlbW92ZUNsYXNzKFwiY2xpY2tlZFwiKTtcclxuICAgIH0pO1xyXG5cclxuICAgICQoXCJib2R5XCIpLm9uKFwiY2xpY2tcIiwgXCIuYnV0dG9uLmRyb3Bkb3duXCIsIGZ1bmN0aW9uIChldikge1xyXG5cclxuICAgICAgICBpZiAoISQodGhpcykuaGFzQ2xhc3MoJ2NsaWNrZWQnKSkge1xyXG4gICAgICAgICAgICAkKCcuZHJvcGRvd24tc2xpZGVyJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAkKFwiLmNsaWNrZWRcIikucmVtb3ZlQ2xhc3MoXCJjbGlja2VkXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmVudEZsb2F0ID0gJCh0aGlzKS5wYXJlbnQoKS5jc3MoXCJmbG9hdFwiKTtcclxuICAgICAgICB2YXIgZGRzSWQgPSBnZXREcm9wRG93blNsaWRlcklkKCQodGhpcykpO1xyXG5cclxuICAgICAgICBpZihwYXJlbnRGbG9hdCA9PT0gXCJyaWdodFwiKXtcclxuICAgICAgICAgICAgJCgnLmRyb3Bkb3duLXNsaWRlci4nICsgZGRzSWQpLmNzcyhcInJpZ2h0XCIsICQodGhpcykucG9zaXRpb24oKS5yaWdodCk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICQoJy5kcm9wZG93bi1zbGlkZXIuJyArIGRkc0lkKS5jc3MoXCJsZWZ0XCIsICQodGhpcykucG9zaXRpb24oKS5sZWZ0KTsgLy8gLSA1XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkKCcuZHJvcGRvd24tc2xpZGVyLicgKyBkZHNJZCkudG9nZ2xlKCk7XHJcbiAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnY2xpY2tlZCcpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgZ2V0RHJvcERvd25TbGlkZXJJZCA9IGZ1bmN0aW9uIChidG4pIHtcclxuXHJcbiAgICAgICAgdmFyIGRkc0lkID0gJyc7XHJcbiAgICAgICAgdmFyIGNsYXNzTGlzdCA9IGJ0bi5hdHRyKCdjbGFzcycpLnNwbGl0KC9cXHMrLyk7XHJcblxyXG4gICAgICAgICQuZWFjaChjbGFzc0xpc3QsIGZ1bmN0aW9uIChpbmRleCwgaXRlbSkge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5pbmRleE9mKCdkZHNJZF8nKSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZGRzSWQgPSBpdGVtLnJlcGxhY2UoJ2Rkc0lkXycsICcnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBkZHNJZDtcclxuICAgIH07XHJcbn0oKSk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEZvcm1hdHRlciA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIGZvcm1hdEFkZHJlc3NlcyA9IGZ1bmN0aW9uICh0aXRsZXMpIHtcclxuXHJcbiAgICAgICAgdmFyIHJlcyA9IFwiXCI7XHJcblxyXG4gICAgICAgIHRpdGxlcyA9IHRpdGxlcyB8fCBbXTtcclxuXHJcbiAgICAgICAgaWYgKHRpdGxlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRpdGxlc1swXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXy5lYWNoKHRpdGxlcywgZnVuY3Rpb24gKHRpdGxlKSB7XHJcbiAgICAgICAgICAgIHJlcyArPSBfcy5zdHJMZWZ0QmFjayh0aXRsZSwgXCIgXCIpICsgXCIsIFwiO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gX3Muc3RyTGVmdEJhY2socmVzLCBcIixcIik7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHZhciBmb3JtYXRTaG9ydERhdGUgPSBmdW5jdGlvbiAodGlja3MsdHJhbnNsYXRvcikge1xyXG5cclxuICAgICAgICBpZiAoXy5pc0Zpbml0ZSh0aWNrcykpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHBhcnNlSW50KHRpY2tzLCAxMCkpO1xyXG4gICAgICAgICAgICB2YXIgdGltZURpZmYgPSBNYXRoLmFicyhub3cuZ2V0VGltZSgpIC0gZGF0ZS5nZXRUaW1lKCkpO1xyXG4gICAgICAgICAgICB2YXIgZGlmZkRheXMgPSBNYXRoLmNlaWwodGltZURpZmYgLyAoMTAwMCAqIDM2MDAgKiAyNCkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRpZmZEYXlzID4gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zbGF0b3IudHJhbnNsYXRlKFwibWFpbDp0aW1lcmFuZ2UubW9udGhzLlwiICsgZGF0ZS5nZXRNb250aCgpKSArIFwiIFwiICsgZGF0ZS5nZXREYXkoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBob3VycyA9IGRhdGUuZ2V0SG91cnMoKTtcclxuICAgICAgICAgICAgICAgIHZhciBtaW51dGVzID0gZGF0ZS5nZXRNaW51dGVzKCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgYW1wbSA9IGhvdXJzID49IDEyID8gJ3BtJyA6ICdhbSc7XHJcblxyXG4gICAgICAgICAgICAgICAgaG91cnMgPSBob3VycyAlIDEyO1xyXG4gICAgICAgICAgICAgICAgaG91cnMgPSBob3VycyA/IGhvdXJzIDogMTI7IC8vIHRoZSBob3VyICcwJyBzaG91bGQgYmUgJzEyJ1xyXG4gICAgICAgICAgICAgICAgbWludXRlcyA9IG1pbnV0ZXMgPCAxMCA/ICcwJyArIG1pbnV0ZXMgOiBtaW51dGVzO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBob3VycyArICc6JyArIG1pbnV0ZXMgKyAnICcgKyBhbXBtO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgZm9ybWF0U3ViamVjdCA9IGZ1bmN0aW9uIChzdWJqZWN0LHRyYW5zbGF0b3IpIHtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNFbXB0eShzdWJqZWN0KSkge1xyXG4gICAgICAgICAgICBzdWJqZWN0ID0gXCIoXCIgKyB0cmFuc2xhdG9yLnRyYW5zbGF0ZShcIm1haWw6bm9zdWJqZWN0XCIpICsgXCIpXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzdWJqZWN0O1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgZm9ybWF0Q29udGVudCA9IGZ1bmN0aW9uIChjb250ZW50KSB7XHJcblxyXG4gICAgICAgIGlmICghXy5pc0VtcHR5KGNvbnRlbnQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250ZW50LnJlcGxhY2UoLyg8KFtePl0rKT4pL2lnLCBcIiBcIikucmVwbGFjZSgvJm5ic3A7L2lnLCBcIiBcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGZvcm1hdFN1YmplY3Q6IGZvcm1hdFN1YmplY3QsXHJcbiAgICAgICAgZm9ybWF0Q29udGVudDogZm9ybWF0Q29udGVudCxcclxuICAgICAgICBmb3JtYXRTaG9ydERhdGU6IGZvcm1hdFNob3J0RGF0ZSxcclxuICAgICAgICBmb3JtYXRBZGRyZXNzZXM6IGZvcm1hdEFkZHJlc3Nlc1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRm9ybWF0dGVyO1xyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgVHJhbnNsYXRvciA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIGRpY3Rpb25hcnkgPSB7fTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcihcIl9pMThuXCIsIGZ1bmN0aW9uKHRleHQpIHtcclxuICAgICAgICByZXR1cm4gdHJhbnNsYXRlKHRleHQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHZhciB1cGRhdGVEaWN0aW9uYXJ5ID0gZnVuY3Rpb24ob2JqKXtcclxuICAgICAgICAkLmV4dGVuZChkaWN0aW9uYXJ5LCBvYmopO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdmFyIHRyYW5zbGF0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcoa2V5KSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHN1YmtleXMgPSBrZXkuc3BsaXQoXCI6XCIpO1xyXG5cclxuICAgICAgICAgICAgaWYoc3Via2V5cy5sZW5ndGggPT0gMil7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoXy5oYXMoZGljdGlvbmFyeSwgc3Via2V5c1swXSkpe1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGljdGlvbmFyeVtzdWJrZXlzWzBdXVtzdWJrZXlzWzFdXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBkaWN0aW9uYXJ5IDogZGljdGlvbmFyeSxcclxuICAgICAgICB0cmFuc2xhdGUgOiB0cmFuc2xhdGUsXHJcbiAgICAgICAgdXBkYXRlRGljdGlvbmFyeTp1cGRhdGVEaWN0aW9uYXJ5XHJcbiAgICB9O1xyXG5cclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJhbnNsYXRvcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgQmFzZU1vZGVsID0gcmVxdWlyZShcImJhc2UtbW9kZWxcIik7XHJcblxyXG52YXIgU2V0dGluZ3NNb2RlbCA9IEJhc2VNb2RlbC5leHRlbmQoe1xyXG5cclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgbGFuZzogXCJlbi1VU1wiLFxyXG4gICAgICAgIHRoZW1lOiAnZHVzdCcsXHJcbiAgICAgICAgdXNlck5hbWU6ICdkZW1vQG1haWxib25lLmNvbSdcclxuICAgIH0sXHJcblxyXG4gICAgdXJsOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuICdzZXR0aW5ncyc7XHJcbiAgICB9LFxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnNldChcImlkXCIsIF8udW5pcXVlSWQoJ18nKSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXR0aW5nc01vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCdhcHAnKTtcclxudmFyIFNldHRpbmdzID0gcmVxdWlyZShcIi4vc2V0dGluZ3NcIik7XHJcblxyXG52YXIgU2V0dGluZ3NDb250cm9sbGVyID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGFwcC5zZXR0aW5ncyA9IG5ldyBTZXR0aW5ncygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBmZXRjaDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICBhcHAuc2V0dGluZ3MuZmV0Y2goe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiBfLmJpbmQoZnVuY3Rpb24gKG1vZGVsLCByZXNwLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAkLndoZW4odGhpcy5sb2FkVGhlbWUoKSwgdGhpcy5sb2FkRGljdGlvbmFyeSgpKS50aGVuKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwLmNoYW5uZWwudmVudC50cmlnZ2VyKFwib25TZXR0aW5nc0xvYWRlZFwiKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LCB0aGlzKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBsb2FkVGhlbWU6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgdmFyIHRoZW1lID0gYXBwLnNldHRpbmdzLmdldChcInRoZW1lXCIpO1xyXG5cclxuICAgICAgICByZXR1cm4gJC5nZXQoXCJkaXN0L2Nzcy90aGVtZXMvXCIgKyB0aGVtZSArIFwiL1wiICsgdGhlbWUgKyBcIi5jc3NcIiwgZnVuY3Rpb24gKF9jc3MpIHtcclxuXHJcbiAgICAgICAgICAgICQoXCJ0aGVtZS1jc3NcIikucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICQoWyc8c3R5bGUgdHlwZT1cInRleHQvY3NzXCIgaWQ9XCJ0aGVtZS1jc3NcIj4nLCBfY3NzLCAnPC9zdHlsZT4nXS5qb2luKCcnKSkuYXBwZW5kVG8oJ2hlYWQnKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgbG9hZERpY3Rpb25hcnk6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgcmV0dXJuICQuZ2V0SlNPTihcImRpc3QvaTE4bi9cIiArIGFwcC5zZXR0aW5ncy5nZXQoXCJsYW5nXCIpICsgXCIuanNvblwiLCBmdW5jdGlvbiAoaTE4bk9iamVjdCkge1xyXG4gICAgICAgICAgICBhcHAudHJhbnNsYXRvci51cGRhdGVEaWN0aW9uYXJ5KGkxOG5PYmplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NDb250cm9sbGVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCdhcHAnKTtcclxudmFyIGlvID0gcmVxdWlyZSgnc29ja2V0LmlvLWNsaWVudCcpO1xyXG5cclxudmFyIFNvY2tldENvbnRyb2xsZXIgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICBpbml0aWFsaXplOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciBzb2NrZXRVUkkgPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyBcIjpcIiArIFwiODAwMFwiICsgXCIvXCI7XHJcbiAgICAgICAgdGhpcy5fc29ja2V0ID0gaW8uY29ubmVjdChzb2NrZXRVUkkpO1xyXG5cclxuICAgICAgICB0aGlzLl9zb2NrZXQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gdG8gc2VydmVyIGVzdGFibGlzaGVkLicpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX3NvY2tldC5vbignZXJyb3InLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3NvcnJ5LCB3ZSBhcmUgZXhwZXJpZW5jaW5nIHRlY2huaWNhbCBkaWZmaWN1bHRpZXMuJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fc29ja2V0Lm9uKCdkYXRhOmNoYW5nZScsIGZ1bmN0aW9uKG1lc3NhZ2Upe1xyXG4gICAgICAgICAgICBhcHAudmVudC50cmlnZ2VyKFwiZGF0YTpjaGFuZ2VcIiwgbWVzc2FnZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fc29ja2V0Lm9uKCdlcnJvcjEnLCBmdW5jdGlvbihlcnIpe1xyXG4gICAgICAgICAgICBhcHAudmVudC50cmlnZ2VyKCdzb2NrZXQ6ZXJyb3InLCBlcnIpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInVubG9hZFwiLCB0aGlzLl9zb2NrZXQuY2xvc2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGdldFNvY2tldDpmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9zb2NrZXQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgcmVnaXN0ZXJVc2VyOmZ1bmN0aW9uKHVzZXJOYW1lKXtcclxuICAgICAgICB0aGlzLl9zb2NrZXQuZW1pdCgnYWRkLXVzZXInLHVzZXJOYW1lKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvY2tldENvbnRyb2xsZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZU1vZGVsID0gcmVxdWlyZShcIi4vanMvbW9kZWxzL2F1dG9Db21wbGV0ZU1vZGVsXCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlSXRlbVZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy9hdXRvQ29tcGxldGVJdGVtVmlld1wiKTtcclxudmFyIEF1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy9hdXRvQ29tcGxldGVDb21wb3NpdGVWaWV3XCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCIuL2pzL2NvbGxlY3Rpb25zL2F1dG9Db21wbGV0ZUNvbGxlY3Rpb25cIik7XHJcbnZhciBGaWx0ZXJDb2xsZWN0aW9uRGVjb3JhdG9yID0gcmVxdWlyZShcImRlY29yYXRvcnMvRmlsdGVyQ29sbGVjdGlvbkRlY29yYXRvclwiKTtcclxuXHJcbnZhciBBdXRvQ29tcGxldGUgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLmVsID0gb3B0aW9ucy5lbDtcclxuICAgICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XHJcbiAgICAgICAgdGhpcy5tYXhJdGVtcyA9IG9wdGlvbnMubWF4SXRlbXMgfHwgNTtcclxuICAgICAgICB0aGlzLmZpbHRlck1vZGVsID0gb3B0aW9ucy5maWx0ZXJNb2RlbDtcclxuICAgICAgICB0aGlzLmNvbGxlY3Rpb24gPSBuZXcgRmlsdGVyQ29sbGVjdGlvbkRlY29yYXRvcihuZXcgQXV0b0NvbXBsZXRlQ29sbGVjdGlvbihvcHRpb25zLml0ZW1zIHx8IFtdKSwgdGhpcy5maWx0ZXJNb2RlbCk7XHJcblxyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCAnaW5wdXQ6Y2hhbmdlJywgdGhpcy5vbklucHV0Q2hhbmdlLCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBvbkZpbHRlckNoYW5nZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25JbnB1dENoYW5nZTogZnVuY3Rpb24gKGlucHV0LCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICBpZiAoXy5pc0VtcHR5KGlucHV0KSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24uZmlsdGVyQWxsKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5maWx0ZXJNb2RlbC5zZXRJbnB1dChpbnB1dCk7XHJcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5maWx0ZXJCeSh7XHJcbiAgICAgICAgICAgICAgICBtYXhJdGVtczogdGhpcy5tYXhJdGVtcyxcclxuICAgICAgICAgICAgICAgIG1hbmRhdG9yeUl0ZW1zOiBvcHRpb25zLmFkZFNlYXJjaEtleSA/IFtuZXcgQXV0b0NvbXBsZXRlTW9kZWwoe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGlucHV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBBdXRvQ29tcGxldGUuVFlQRVMuU0VBUkNIXHJcbiAgICAgICAgICAgICAgICB9KV0gOiBbXVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gc2hvd1xyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2hvdzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbi5maWx0ZXJBbGwoKTtcclxuXHJcbiAgICAgICAgdGhpcy5hdXRvQ29tcGxldGVUYWJsZVZpZXcgPSBuZXcgQXV0b0NvbXBsZXRlQ29tcG9zaXRlVmlldyh7XHJcbiAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudCxcclxuICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy5jb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICBlbDogdGhpcy5lbFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlVGFibGVWaWV3LnJlbmRlcigpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbkF1dG9Db21wbGV0ZS5UWVBFUyA9IEF1dG9Db21wbGV0ZUl0ZW1WaWV3LlRZUEVTO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGU7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVNb2RlbCA9IHJlcXVpcmUoXCIuLi9tb2RlbHMvYXV0b0NvbXBsZXRlTW9kZWxcIik7XHJcblxyXG52YXIgQXV0b0NvbXBsZXRlQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcclxuXHJcbiAgICBtb2RlbDogQXV0b0NvbXBsZXRlTW9kZWxcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9Db21wbGV0ZUNvbGxlY3Rpb247XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZU1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHtcclxuXHJcbiAgICBkZWZhdWx0OiB7XHJcbiAgICAgICAgdGV4dDogXCJcIixcclxuICAgICAgICB2YWx1ZTogXCJcIlxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxcXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9iaiwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICBpZiAoXy5pc1N0cmluZyhvYmoudGV4dCkpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXQoXCJ0ZXh0XCIsIG9iai50ZXh0LnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXy5pc1N0cmluZyhvYmoudmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KFwidmFsdWVcIiwgb2JqLnZhbHVlLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gQXV0b0NvbXBsZXRlTW9kZWw7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIi4uLy4uL3VpL3RlbXBsYXRlcy9hdXRvQ29tcGxldGUuaGJzXCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlSXRlbVZpZXcgPSByZXF1aXJlKFwiLi9hdXRvQ29tcGxldGVJdGVtVmlld1wiKTtcclxuXHJcbnZhciBLZXlDb2RlID0ge1xyXG4gICAgRU5URVI6IDEzLFxyXG4gICAgQVJST1dfVVA6IDM4LFxyXG4gICAgQVJST1dfRE9XTjogNDBcclxufTtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVDb21wb3NpdGVWaWV3ID0gTWFyaW9uZXR0ZS5Db21wb3NpdGVWaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgY2hpbGRWaWV3OiBBdXRvQ29tcGxldGVJdGVtVmlldyxcclxuICAgIGNoaWxkVmlld0NvbnRhaW5lcjogXCIubWVudVwiLFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuXHJcbiAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLmNvbGxlY3Rpb24sIFwiZW1wdHk6Y29sbGVjdGlvblwiLCB0aGlzLmNsb3NlRWwpO1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImF1dG9jb21wbGV0ZTppdGVtOmNsaWNrXCIsIHRoaXMuc2VsZWN0SXRlbSk7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsIFwiYXV0b2NvbXBsZXRlOml0ZW06b3ZlclwiLCB0aGlzLm9uSG92ZXIpO1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImtleTpwcmVzc1wiLCB0aGlzLm9uS2V5UHJlc3MpO1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImNsb3NlQWxsXCIsIHRoaXMuY2xvc2VFbCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBidWlsZENoaWxkVmlldzogZnVuY3Rpb24gKGl0ZW0sIEl0ZW1WaWV3KSB7XHJcblxyXG4gICAgICAgIHZhciB2aWV3ID0gbmV3IEl0ZW1WaWV3KHtcclxuICAgICAgICAgICAgbW9kZWw6IGl0ZW0sXHJcbiAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudCxcclxuICAgICAgICAgICAgZmlsdGVyTW9kZWw6IHRoaXMuY29sbGVjdGlvbi5maWx0ZXJNb2RlbFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuY2xvc2VFbCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uUmVuZGVyQ29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLmNoaWxkQXJyID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uZWFjaChfLmJpbmQoZnVuY3Rpb24gKHZpZXcpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEFyci5wdXNoKHZpZXcpO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZEl0ZW0gPSAwO1xyXG4gICAgICAgIHRoaXMuc2hvd0VsKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGNsb3NlRWw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBfLmRlZmVyKF8uYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gLTE7XHJcbiAgICAgICAgICAgIHRoaXMuJGVsLmhpZGUoKTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNob3dFbDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlKCk7XHJcbiAgICAgICAgdGhpcy4kZWwuc2hvdygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbktleVByZXNzOiBmdW5jdGlvbiAoa2V5KSB7XHJcblxyXG4gICAgICAgIHN3aXRjaCAoa2V5KSB7XHJcbiAgICAgICAgICAgIGNhc2UgS2V5Q29kZS5BUlJPV19VUDpcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gTWF0aC5tYXgoMCwgdGhpcy5zZWxlY3RlZEl0ZW0gLSAxKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBLZXlDb2RlLkFSUk9XX0RPV046XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkSXRlbSA9IE1hdGgubWluKHRoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMSwgdGhpcy5zZWxlY3RlZEl0ZW0gKyAxKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBLZXlDb2RlLkVOVEVSOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RJdGVtKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBzZXRBY3RpdmU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5lYWNoKGZ1bmN0aW9uICh2aWV3KSB7XHJcbiAgICAgICAgICAgIHZpZXcuc2V0QWN0aXZlKGZhbHNlKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIHNlbGVjdGVkVmlldyA9IHRoaXMuY2hpbGRBcnJbdGhpcy5zZWxlY3RlZEl0ZW1dO1xyXG5cclxuICAgICAgICBpZiAoXy5pc09iamVjdChzZWxlY3RlZFZpZXcpKSB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkVmlldy5zZXRBY3RpdmUodHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiYXV0b2NvbXBsZXRlOml0ZW06YWN0aXZlXCIsIHNlbGVjdGVkVmlldy5tb2RlbC5nZXQoXCJ0ZXh0XCIpLCBzZWxlY3RlZFZpZXcubW9kZWwuZ2V0KFwidmFsdWVcIikpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2VsZWN0SXRlbTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgc2VsZWN0ZWRWaWV3ID0gdGhpcy5jaGlsZEFyclt0aGlzLnNlbGVjdGVkSXRlbV07XHJcblxyXG4gICAgICAgIGlmIChfLmlzT2JqZWN0KHNlbGVjdGVkVmlldykpIHtcclxuICAgICAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJhdXRvY29tcGxldGU6aXRlbTpzZWxlY3RlZFwiLCBzZWxlY3RlZFZpZXcubW9kZWwuZ2V0KFwidGV4dFwiKSwgc2VsZWN0ZWRWaWV3Lm1vZGVsLmdldChcInZhbHVlXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jbG9zZUVsKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbkhvdmVyOiBmdW5jdGlvbiAoaXRlbSkge1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRBcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRBcnJbaV0uY2lkID09PSBpdGVtLmNpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEl0ZW0gPSBpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmUoKTtcclxuICAgIH1cclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gQXV0b0NvbXBsZXRlQ29tcG9zaXRlVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwiLi4vLi4vdWkvdGVtcGxhdGVzL2F1dG9Db21wbGV0ZUl0ZW0uaGJzXCIpO1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZUl0ZW1WaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgdGFnTmFtZTogJ2xpJyxcclxuICAgIGNsYXNzTmFtZTogJ2xpX3JvdycsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiLnRpdGxlXCIsXHJcbiAgICAgICAgXCJ0ZXh0XCI6IFwiLnRleHRcIlxyXG4gICAgfSxcclxuXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgICBcIm1vdXNlZW50ZXJcIjogXCJfb25Nb3VzZUVudGVyXCIsXHJcbiAgICAgICAgXCJjbGlja1wiOiBcIl9vbkNsaWNrXCJcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xyXG4gICAgICAgIHRoaXMuZmlsdGVyTW9kZWwgPSBvcHRpb25zLmZpbHRlck1vZGVsO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIHR5cGUgPSB0aGlzLm1vZGVsLmdldChcInR5cGVcIik7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGlzQ29udGFjdDogdHlwZSA9PT0gQXV0b0NvbXBsZXRlSXRlbVZpZXcuVFlQRVMuQ09OVEFDVCxcclxuICAgICAgICAgICAgaXNTZWFyY2g6IHR5cGUgPT09IEF1dG9Db21wbGV0ZUl0ZW1WaWV3LlRZUEVTLlNFQVJDSFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudWkudGl0bGUuaHRtbCh0aGlzLmZpbHRlck1vZGVsLmhpZ2hsaWdodEtleSh0aGlzLm1vZGVsLmdldChcInRleHRcIikpKTtcclxuICAgICAgICB0aGlzLnVpLnRleHQuaHRtbCh0aGlzLmZpbHRlck1vZGVsLmhpZ2hsaWdodEtleSh0aGlzLm1vZGVsLmdldChcInZhbHVlXCIpKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIF9vbk1vdXNlRW50ZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJhdXRvY29tcGxldGU6aXRlbTpvdmVyXCIsIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBfb25DbGljazogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImF1dG9jb21wbGV0ZTppdGVtOmNsaWNrXCIpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBzZXRBY3RpdmU6IGZ1bmN0aW9uIChpc0FjdGl2ZSkge1xyXG4gICAgICAgIHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCdhY3RpdmUnLCBpc0FjdGl2ZSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbkF1dG9Db21wbGV0ZUl0ZW1WaWV3LlRZUEVTID0ge1xyXG4gICAgQ09OVEFDVDogMSxcclxuICAgIFNFQVJDSDogMixcclxuICAgIFJFQ0VOVDogM1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGVJdGVtVmlldztcclxuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwiYXV0b0NvbXBsZXRlIGF1dG9Db21wbGV0ZS1zaXplXFxcIj5cXHJcXG4gICAgPHVsIGNsYXNzPVxcXCJtZW51IGJyb3dzZXItc2Nyb2xsIGxpZ2h0IGRlZmF1bHQtbGlzdFxcXCI+PC91bD5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyLCBvcHRpb25zLCBmdW5jdGlvblR5cGU9XCJmdW5jdGlvblwiLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbiwgc2VsZj10aGlzLCBibG9ja0hlbHBlck1pc3Npbmc9aGVscGVycy5ibG9ja0hlbHBlck1pc3Npbmc7XG5cbmZ1bmN0aW9uIHByb2dyYW0xKGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXI7XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaWNvbiBjb250YWN0XFxcIj48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImNvbnRlbnRXcmFwcGVyXFxcIj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0aXRsZVxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnRleHQpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudGV4dCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0ZXh0XFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMudmFsdWUpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudmFsdWUpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuZnVuY3Rpb24gcHJvZ3JhbTMoZGVwdGgwLGRhdGEpIHtcbiAgXG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlcjtcbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpY29uIHNlYXJjaFxcXCI+PC9kaXY+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjb250ZW50V3JhcHBlclxcXCI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwidGl0bGVcXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy50ZXh0KSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnRleHQpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJkcm9wZG93bi1saS12YWx1ZVxcXCI+XFxyXFxuICAgIFwiO1xuICBvcHRpb25zPXtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgxLCBwcm9ncmFtMSwgZGF0YSksZGF0YTpkYXRhfVxuICBpZiAoaGVscGVyID0gaGVscGVycy5pc0NvbnRhY3QpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCBvcHRpb25zKTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuaXNDb250YWN0KTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCBvcHRpb25zKSA6IGhlbHBlcjsgfVxuICBpZiAoIWhlbHBlcnMuaXNDb250YWN0KSB7IHN0YWNrMSA9IGJsb2NrSGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgc3RhY2sxLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMSwgcHJvZ3JhbTEsIGRhdGEpLGRhdGE6ZGF0YX0pOyB9XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG5cXHJcXG4gICAgXCI7XG4gIG9wdGlvbnM9e2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDMsIHByb2dyYW0zLCBkYXRhKSxkYXRhOmRhdGF9XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmlzU2VhcmNoKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwgb3B0aW9ucyk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmlzU2VhcmNoKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCBvcHRpb25zKSA6IGhlbHBlcjsgfVxuICBpZiAoIWhlbHBlcnMuaXNTZWFyY2gpIHsgc3RhY2sxID0gYmxvY2tIZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBzdGFjazEsIHtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgzLCBwcm9ncmFtMywgZGF0YSksZGF0YTpkYXRhfSk7IH1cbiAgaWYoc3RhY2sxIHx8IHN0YWNrMSA9PT0gMCkgeyBidWZmZXIgKz0gc3RhY2sxOyB9XG4gIGJ1ZmZlciArPSBcIlxcclxcbjwvZGl2PlxcclxcblxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIERpYWxvZ1ZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy9kaWFsb2dWaWV3MVwiKTtcclxuXHJcbnZhciBBdXRvQ29tcGxldGUgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5lbCA9IG9wdGlvbnMuZWw7XHJcbiAgICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xyXG4gICAgICAgIHRoaXMudGl0bGUgPSBvcHRpb25zLnRpdGxlIHx8IFwiXCI7XHJcbiAgICAgICAgdGhpcy5pbnNpZGVWaWV3ID0gb3B0aW9ucy5pbnNpZGVWaWV3O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIHNob3dcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNob3c6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5kaWFsb2dWaWV3ID0gbmV3IERpYWxvZ1ZpZXcoe1xyXG4gICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgIGVsOiB0aGlzLmVsLFxyXG4gICAgICAgICAgICB0aXRsZTogdGhpcy50aXRsZSxcclxuICAgICAgICAgICAgemluZGV4OiAxMDAwLFxyXG4gICAgICAgICAgICBpbnNpZGVWaWV3OiB0aGlzLmluc2lkZVZpZXdcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmRpYWxvZ1ZpZXcucmVuZGVyKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGU7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi91aS90ZW1wbGF0ZXMvZGlhbG9nLmhic1wiKTtcclxuXHJcbnZhciBEaWFsb2dWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG5cclxuICAgIGNsYXNzTmFtZTogXCJkaWFsb2dcIixcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgIGluc2lkZVZpZXc6IG51bGwsXHJcbiAgICB0ZW1wbGF0ZUlkOiBudWxsLFxyXG5cclxuICAgIHVpOiB7XHJcbiAgICAgICAgYnRuQ2xvc2U6IFwiLmRpYWxvZy1oZWFkZXItY2xvc2VCdG5cIlxyXG4gICAgfSxcclxuXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgICBcImNsaWNrIEB1aS5idG5DbG9zZVwiOiBcImNsb3NlQnRuXCJcclxuICAgIH0sXHJcblxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuaW5zaWRlVmlldykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy50aXRsZSA9IG9wdGlvbnMudGl0bGU7XHJcbiAgICAgICAgICAgIHRoaXMuekluZGV4ID0gb3B0aW9ucy56SW5kZXg7XHJcbiAgICAgICAgICAgIHRoaXMuaW5zaWRlVmlldyA9IG9wdGlvbnMuaW5zaWRlVmlldztcclxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZUlkID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKS50b1N0cmluZygpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gcmVuZGVyXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25CZWZvcmVSZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5fJGVsID0gdGhpcy4kZWw7XHJcbiAgICAgICAgdGhpcy4kZWwgPSAkKFwiPGRpdi8+XCIpLmFkZENsYXNzKHRoaXMuY2xhc3NOYW1lKS5hZGRDbGFzcyh0aGlzLnRlbXBsYXRlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaW5zaWRlVmlldykge1xyXG4gICAgICAgICAgICB0aGlzLiRlbC5maW5kKFwiLmRpYWxvZy1oZWFkZXItdGl0bGVcIikuaHRtbCh0aGlzLnRpdGxlKTtcclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZChcIi5kaWFsb2ctaW5uZXJCb3hcIikuYXBwZW5kKHRoaXMuaW5zaWRlVmlldy5yZW5kZXIoKS5lbCk7XHJcbiAgICAgICAgICAgIHRoaXMuXyRlbC5hcHBlbmQodGhpcy4kZWwpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZChcIi5kaWFsb2ctb3V0ZXJib3hcIikuY3NzKFwibWFyZ2luLXRvcFwiLCAtdGhpcy5pbnNpZGVWaWV3LiRlbC5oZWlnaHQoKSAvIDIgKyBcInB4XCIpO1xyXG4gICAgICAgICAgICB0aGlzLiRlbC5maW5kKFwiLmRpYWxvZy1vdXRlcmJveFwiKS5jc3MoXCJtYXJnaW4tbGVmdFwiLCAtdGhpcy5pbnNpZGVWaWV3LiRlbC53aWR0aCgpIC8gMiArIFwicHhcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBjbG9zZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGNsb3NlQnRuOiBmdW5jdGlvbiAoZXYpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pbnNpZGVWaWV3LmRlc3Ryb3koKTtcclxuICAgICAgICB0aGlzLl8kZWwuZmluZChcIi5kaWFsb2cuXCIgKyB0aGlzLnRlbXBsYXRlSWQpLnJlbW92ZSgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRGlhbG9nVmlldztcclxuXHJcblxyXG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJkaWFsb2ctb3ZlcmxheVxcXCI+PC9kaXY+XFxyXFxuXFxyXFxuPGRpdiBjbGFzcz1cXFwiZGlhbG9nLW91dGVyYm94XFxcIj5cXHJcXG5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiZGlhbG9nLWhlYWRlclxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJkaWFsb2ctaGVhZGVyLXRpdGxlXFxcIj48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImRpYWxvZy1oZWFkZXItY2xvc2VCdG5cXFwiPjwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiZGlhbG9nLWlubmVyQm94XFxcIj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXCI7XG4gIH0pO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwiLi91aS90ZW1wbGF0ZXMvc2VhcmNoLmhic1wiKTtcclxuXHJcbnJlcXVpcmUoXCJwbHVnaW5zL2pxdWVyeS5iYS1vdXRzaWRlLWV2ZW50c1wiKTtcclxuXHJcbnZhciBLZXlDb2RlID0ge1xyXG4gICAgRVNDOiAyNyxcclxuICAgIEVOVEVSOiAxMyxcclxuICAgIEFSUk9XX1VQOiAzOCxcclxuICAgIEFSUk9XX0RPV046IDQwXHJcbn07XHJcblxyXG52YXIgU2VhcmNoVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuXHJcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBcInNlYXJjaElucHV0XCI6IFwiLnNlYXJjaC1pbnB1dFwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgLmJ0blNlYXJjaFwiOiBcInNlYXJjaFwiLFxyXG4gICAgICAgIFwia2V5dXAgLnNlYXJjaC1pbnB1dFwiOiBcIm9uQnV0dG9uS2V5VXBcIixcclxuICAgICAgICBcImlucHV0IC5zZWFyY2gtaW5wdXRcIjogXCJvbklucHV0Q2hhbmdlXCIsXHJcbiAgICAgICAgXCJjbGlja291dHNpZGVcIjogXCJvdXRzaWRlQ2xpY2tlZFwiXHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZWwgPSBvcHRpb25zLmVsO1xyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuICAgICAgICB0aGlzLmNhcHRpb24gPSBvcHRpb25zLmNhcHRpb247XHJcblxyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImF1dG9jb21wbGV0ZTppdGVtOnNlbGVjdGVkXCIsIHRoaXMuc2VhcmNoLCB0aGlzKTtcclxuICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJhdXRvY29tcGxldGU6aXRlbTphY3RpdmVcIiwgdGhpcy5vbkl0ZW1BY3RpdmUsIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNhcHRpb246IHRoaXMuY2FwdGlvblxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uSXRlbUFjdGl2ZTogZnVuY3Rpb24gKHRleHQsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy51aS5zZWFyY2hJbnB1dC52YWwodGV4dCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uQnV0dG9uS2V5VXA6IGZ1bmN0aW9uIChldmVudCkge1xyXG5cclxuICAgICAgICB2YXIga2V5ID0gZXZlbnQua2V5Q29kZTtcclxuXHJcbiAgICAgICAgaWYgKGtleSA9PT0gS2V5Q29kZS5BUlJPV19ET1dOIHx8IGtleSA9PT0gS2V5Q29kZS5BUlJPV19VUCB8fCBrZXkgPT09IEtleUNvZGUuRU5URVIpIHtcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJrZXk6cHJlc3NcIiwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbklucHV0Q2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJpbnB1dDpjaGFuZ2VcIiwgdGhpcy51aS5zZWFyY2hJbnB1dC52YWwoKSwge1wiYWRkU2VhcmNoS2V5XCI6IHRydWV9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNlYXJjaDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2xvc2VBbGxcIik7XHJcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJzZWFyY2hcIiwgdGhpcy51aS5zZWFyY2hJbnB1dC52YWwoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgY2xlYXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnVpLnNlYXJjaElucHV0LnZhbChcIlwiKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvdXRzaWRlQ2xpY2tlZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2xvc2VBbGxcIik7XHJcbiAgICB9XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFNlYXJjaFZpZXc7XHJcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxpbnB1dCBjbGFzcz1cXFwic2VhcmNoLWlucHV0XFxcIiB0eXBlPVxcXCJ0ZXh0XFxcIiBhdXRvY29tcGxldGU9XFxcIm9mZlxcXCIgdmFsdWU9XFxcIlxcXCI+XFxyXFxuPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIHByaW1lSWNvbiBidG5TZWFyY2hcXFwiPjxzcGFuIGNsYXNzPVxcXCJzZWFyY2hJY29uXFxcIj48L3NwYW4+PC9hPlwiO1xuICB9KTtcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFRhZ01vZGVsID0gcmVxdWlyZShcInVpLWNvbXBvbmVudHMvdGFncy9qcy9tb2RlbHMvdGFnTW9kZWxcIik7XHJcblxyXG52YXIgVGFnc0NvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XHJcbiAgICBtb2RlbDogVGFnTW9kZWxcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhZ3NDb2xsZWN0aW9uO1xyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgVGFnTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgICB0ZXh0OiBcIlwiLFxyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWVcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhZ01vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi91aS90ZW1wbGF0ZXMvdGFnLmhic1wiKTtcclxuXHJcbnZhciBUYWdJdGVtVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgIGNsYXNzTmFtZTogJ3RhZycsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBjb250ZW50OiBcIi5jb250ZW50XCIsXHJcbiAgICAgICAgYnRuQ2xvc2U6IFwiLmNsb3NlLWJ1dHRvblwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgLmNsb3NlLWJ1dHRvblwiOiBcIl9vbkNsb3NlQnRuQ2xpY2tcIlxyXG4gICAgfSxcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuICAgIH0sXHJcblxyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLiRlbC50b2dnbGVDbGFzcyhcImVyclwiLCAhdGhpcy5tb2RlbC5nZXQoXCJpc1ZhbGlkXCIpKTtcclxuICAgIH0sXHJcblxyXG4gICAgX29uQ2xvc2VCdG5DbGljazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidGFnOml0ZW06cmVtb3ZlXCIsIHRoaXMubW9kZWwuY2lkKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhZ0l0ZW1WaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi91aS90ZW1wbGF0ZXMvdGFnc0NvbnRhaW5lci5oYnNcIik7XHJcbnZhciBUYWdzSXRlbVZpZXcgPSByZXF1aXJlKFwiLi90YWdzSXRlbVZpZXdcIik7XHJcblxyXG5yZXF1aXJlKFwicGx1Z2lucy9qcXVlcnkuYmEtb3V0c2lkZS1ldmVudHNcIik7XHJcblxyXG52YXIgS2V5Q29kZSA9IHtcclxuICAgIEVTQzogMjcsXHJcbiAgICBFTlRFUjogMTMsXHJcbiAgICBBUlJPV19VUDogMzgsXHJcbiAgICBBUlJPV19ET1dOOiA0MFxyXG59O1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXcgPSBNYXJpb25ldHRlLkNvbXBvc2l0ZVZpZXcuZXh0ZW5kKHtcclxuXHJcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICBjaGlsZFZpZXc6IFRhZ3NJdGVtVmlldyxcclxuICAgIGNoaWxkVmlld0NvbnRhaW5lcjogXCIuc2VsZWN0ZWRUYWdzXCIsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBjb250YWluZXI6IFwiLnRhZ3MtY29udGFpbmVyXCIsXHJcbiAgICAgICAgdGFnU2VsZWN0b3I6IFwiLnRhZy1pbnB1dFwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2tcIjogXCJvbkNsaWNrXCIsXHJcbiAgICAgICAgXCJrZXlkb3duIC50YWctaW5wdXRcIjogXCJvbkJ1dHRvbktleURvd25cIixcclxuICAgICAgICBcImlucHV0IC50YWctaW5wdXRcIjogXCJvbklucHV0Q2hhbmdlXCIsXHJcbiAgICAgICAgXCJjbGlja291dHNpZGVcIjogXCJvdXRzaWRlQ2xpY2tlZFwiXHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gaW5pdGlhbGl6ZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy5lbCA9IG9wdGlvbnMuZWw7XHJcbiAgICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcInRhZzphZGRcIiwgdGhpcy5hZnRlckl0ZW1BZGRlZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBidWlsZENoaWxkVmlldzogZnVuY3Rpb24gKGl0ZW0sIEl0ZW1WaWV3KSB7XHJcblxyXG4gICAgICAgIHZhciB2aWV3ID0gbmV3IEl0ZW1WaWV3KHtcclxuICAgICAgICAgICAgbW9kZWw6IGl0ZW0sXHJcbiAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGFmdGVySXRlbUFkZGVkOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudWkudGFnU2VsZWN0b3IudGV4dChcIlwiKTtcclxuICAgICAgICBpZiAodGhpcy5pbkZvY3VzKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25DbGljaygpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBvbkNsaWNrXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIGlmIChfLmlzRW1wdHkodGhpcy51aS50YWdTZWxlY3Rvci50ZXh0KCkpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVzZXRTZWxlY3RvcigpO1xyXG4gICAgICAgICAgICB0aGlzLmluRm9jdXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICByZXNldFNlbGVjdG9yOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudWkudGFnU2VsZWN0b3IudGV4dChcIlwiKTtcclxuICAgICAgICB0aGlzLnVpLnRhZ1NlbGVjdG9yLnNob3coKTtcclxuICAgICAgICB0aGlzLnVpLnRhZ1NlbGVjdG9yLmZvY3VzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uQnV0dG9uS2V5RG93bjogZnVuY3Rpb24gKGV2ZW50KSB7XHJcblxyXG4gICAgICAgIHZhciBrZXkgPSBldmVudC5rZXlDb2RlO1xyXG5cclxuICAgICAgICBpZiAoa2V5ID09PSBLZXlDb2RlLkFSUk9XX0RPV04gfHwga2V5ID09PSBLZXlDb2RlLkFSUk9XX1VQKSB7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwia2V5OnByZXNzXCIsIGtleSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoa2V5ID09PSBLZXlDb2RlLkVOVEVSKSB7XHJcbiAgICAgICAgICAgIHRoaXMudWkudGFnU2VsZWN0b3IuaGlkZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcInRhZzppbnB1dDplbnRlclwiLCB0aGlzLnVpLnRhZ1NlbGVjdG9yLnRleHQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uSW5wdXRDaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImlucHV0OmNoYW5nZVwiLCB0aGlzLnVpLnRhZ1NlbGVjdG9yLnRleHQoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb3V0c2lkZUNsaWNrZWQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzRW1wdHkodGhpcy51aS50YWdTZWxlY3Rvci50ZXh0KCkpKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluRm9jdXMgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJjbG9zZUFsbFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXc7XHJcbiIsIiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICB2YXIgVGFnc1ZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy90YWdzVmlld1wiKTtcclxuICAgIHZhciBUYWdNb2RlbCA9IHJlcXVpcmUoXCIuL2pzL21vZGVscy90YWdNb2RlbFwiKTtcclxuICAgIHZhciBUYWdzQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCIuL2pzL2NvbGxlY3Rpb25zL3RhZ0NvbGxlY3Rpb25cIik7XHJcblxyXG4gICAgdmFyIFRhZ3MgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBpbml0aWFsVGFncyA9IG9wdGlvbnMuaW5pdGlhbFRhZ3MgfHwgW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24gPSBuZXcgVGFnc0NvbGxlY3Rpb24oaW5pdGlhbFRhZ3MpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRvciA9IG9wdGlvbnMudmFsaWRhdG9yO1xyXG4gICAgICAgICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XHJcbiAgICAgICAgICAgIHRoaXMuZWwgPSBvcHRpb25zLmVsO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LFwidGFnOmlucHV0OmVudGVyXCIsIHRoaXMub25FbnRlcik7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LFwidGFnOml0ZW06cmVtb3ZlXCIsIHRoaXMub25SZW1vdmVJdGVtKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsXCJhdXRvY29tcGxldGU6aXRlbTpzZWxlY3RlZFwiLHRoaXMub25JdGVtU2VsZWN0ZWQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHNob3dcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvdzogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy50YWdzVmlldyA9IG5ldyBUYWdzVmlldyh7XHJcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLmNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgICAgICBlbDogdGhpcy5lbFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy50YWdzVmlldy5yZW5kZXIoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkVudGVyOmZ1bmN0aW9uKHZhbCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVudGVyU3RhdGUgPSBcInVuaGFuZGxlXCI7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwia2V5OnByZXNzXCIsIDEzKTtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoXy5iaW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuZW50ZXJTdGF0ZSA9PT0gXCJ1bmhhbmRsZVwiKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEl0ZW0odmFsLCB2YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB0aGlzKSwgMTAwKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkl0ZW1TZWxlY3RlZDpmdW5jdGlvbih0ZXh0LCB2YWx1ZSl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVudGVyU3RhdGUgPSBcImhhbmRsZVwiO1xyXG4gICAgICAgICAgICB0aGlzLmFkZEl0ZW0odGV4dCx2YWx1ZSx0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbW92ZUl0ZW06ZnVuY3Rpb24odGFnSWQpe1xyXG5cclxuICAgICAgICAgICAgdmFyIHRhZ01vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmdldCh0YWdJZCk7XHJcblxyXG4gICAgICAgICAgICBpZihfLmlzT2JqZWN0KHRhZ01vZGVsKSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ucmVtb3ZlKHRhZ01vZGVsKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidGFnOnJlbW92ZVwiLCB0YWdNb2RlbC5nZXQoXCJ2YWx1ZVwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBhZGRJdGVtOmZ1bmN0aW9uKHRleHQsIHZhbCl7XHJcblxyXG4gICAgICAgICAgICBpZighXy5pc0VtcHR5KHZhbCkpe1xyXG5cclxuICAgICAgICAgICAgICAgIHRleHQgPSBfLmlzRW1wdHkodGV4dCkgPyB2YWwgOiB0ZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnTW9kZWwoe3ZhbHVlOnZhbCwgdGV4dDp0ZXh0LCBpc1ZhbGlkOnRoaXMuX3ZhbGlkYXRlKHZhbCl9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5hZGQodGFnKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcInRhZzphZGRcIiwgdmFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF92YWxpZGF0ZTpmdW5jdGlvbih2YWwpe1xyXG5cclxuICAgICAgICAgICAgdmFyIGlzVmFsaWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYoXy5pc0Z1bmN0aW9uKHRoaXMudmFsaWRhdG9yKSl7XHJcbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdGhpcy52YWxpZGF0b3IodmFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaXNWYWxpZDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGFncztcclxuXHJcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXIsIGZ1bmN0aW9uVHlwZT1cImZ1bmN0aW9uXCIsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwiY29udGVudFxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnRleHQpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudGV4dCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJjbG9zZS1idXR0b25cXFwiPjwvZGl2PlxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcInRhZ3MtY29udGFpbmVyXFxcIj5cXHJcXG4gICA8ZGl2IGNsYXNzPVxcXCJzZWxlY3RlZFRhZ3NcXFwiPjwvZGl2PlxcclxcbiAgIDxkaXYgY2xhc3M9XFxcInRhZy1zZWxlY3RvclxcXCI+XFxyXFxuICAgICAgIDxzcGFuIGNsYXNzPVxcXCJ0YWctaW5wdXRcXFwiIGNvbnRlbnRlZGl0YWJsZT1cXFwidHJ1ZVxcXCIgdGFiaW5kZXg9XFxcIi0xXFxcIj48L3NwYW4+XFxyXFxuICAgPC9kaXY+XFxyXFxuPC9kaXY+XCI7XG4gIH0pO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZSgnYXBwJyk7XHJcbnZhciBGcmFtZUxheW91dCA9IHJlcXVpcmUoJy4vanMvdmlld3MvZnJhbWVMYXlvdXQnKTtcclxudmFyIExheW91dEhlbHBlcnMgPSByZXF1aXJlKFwicmVzb2x2ZXJzL2Ryb3Bkb3duRGlzcGxheWVyXCIpO1xyXG5cclxudmFyIEZyYW1lID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgY3VyclN1YkxheW91dDogXCJcIixcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gaW5pdGlhbGl6ZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLmZyYW1lTGF5b3V0ID0gbmV3IEZyYW1lTGF5b3V0KCk7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5UbyhhcHAuY29udGV4dCwgJ2NoYW5nZTptb2R1bGUnLCB0aGlzLmNoYW5nZVN1YmxheW91dCwgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBzZXRMYXlvdXRcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2V0TGF5b3V0OiBmdW5jdGlvbiAobWFpblJlZ2lvbikge1xyXG4gICAgICAgIG1haW5SZWdpb24uc2hvdyh0aGlzLmZyYW1lTGF5b3V0KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGNoYW5nZVN1YmxheW91dDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgc3ViTW9kdWxlID0gYXBwLnN1Ym1vZHVsZXNbYXBwLmNvbnRleHQuZ2V0KFwibW9kdWxlXCIpXTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNPYmplY3Qoc3ViTW9kdWxlKSAmJiBfLmlzRnVuY3Rpb24oc3ViTW9kdWxlLnNldExheW91dCkpIHtcclxuICAgICAgICAgICAgc3ViTW9kdWxlLnNldExheW91dCgpO1xyXG4gICAgICAgICAgICB0aGlzLmZyYW1lTGF5b3V0Lm9uTW9kdWxlQ2hhbmdlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGdldFJlZ2lvbnNcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNldFJlZ2lvbjogZnVuY3Rpb24gKHJlZ2lvbk5hbWUsIHZpZXcpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZnJhbWVMYXlvdXRbcmVnaW9uTmFtZSArIFwiUmVnaW9uXCJdICYmICFfLmlzRW1wdHkodmlldykpIHtcclxuICAgICAgICAgICAgdGhpcy5mcmFtZUxheW91dFtyZWdpb25OYW1lICsgXCJSZWdpb25cIl0uc2hvdyh2aWV3KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIERpYWxvZyA9IHJlcXVpcmUoXCJkaWFsb2dcIik7XHJcbnZhciBUZWNoQmFyVmlldyA9IHJlcXVpcmUoJ2ZyYW1lLXZpZXdzL3RlY2hCYXJWaWV3Jyk7XHJcbnZhciBMb2FkZXJWaWV3ID0gcmVxdWlyZSgnZnJhbWUtdmlld3MvbG9hZGVyVmlldycpO1xyXG52YXIgU2V0dGluZ3NWaWV3ID0gcmVxdWlyZSgnZnJhbWUtdmlld3Mvc2V0dGluZ3NWaWV3Jyk7XHJcbnZhciBGcmFtZVRlbXBsYXRlID0gcmVxdWlyZShcImZyYW1lLXRlbXBsYXRlcy9mcmFtZUxheW91dC5oYnNcIik7XHJcblxyXG52YXIgRnJhbWVMYXlvdXQgPSBNYXJpb25ldHRlLkxheW91dFZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiBGcmFtZVRlbXBsYXRlLFxyXG5cclxuICAgIHVpOiB7XHJcbiAgICAgICAgc3dpdGNoZXJDYXB0aW9uOiBcIi5tb2R1bGVTd2l0Y2hlciAuY2FwdGlvblwiLFxyXG4gICAgICAgIHRlY2hiYXJXcmFwcGVyOiBcIi50ZWNoYmFyLXdyYXBwZXJcIixcclxuICAgICAgICBsb2FkZXJXcmFwcGVyOiBcIi5sb2FkZXItd3JhcHBlclwiLFxyXG4gICAgICAgIGJ0blNldHRpbmdzOiBcIi5idG5TZXR0aW5nc1wiXHJcbiAgICB9LFxyXG5cclxuICAgIHJlZ2lvbnM6IHtcclxuICAgICAgICBzZXR0aW5nc1JlZ2lvbjogXCIuc2V0dGluZ3MtcmVnaW9uXCIsXHJcbiAgICAgICAgc2VhcmNoUmVnaW9uOiBcIi5zZWFyY2gtcmVnaW9uXCIsXHJcbiAgICAgICAgYWN0aW9uc1JlZ2lvbjogXCIuYWN0aW9ucy1yZWdpb25cIixcclxuICAgICAgICBtYWluUmVnaW9uOiBcIi5tYWluLXJlZ2lvblwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgQHVpLmJ0blNldHRpbmdzXCI6IFwib3BlblNldHRpbmdzXCJcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgdGVjaEJhclZpZXcgPSBuZXcgVGVjaEJhclZpZXcoe1xyXG4gICAgICAgICAgICBlbDogdGhpcy51aS50ZWNoYmFyV3JhcHBlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRlY2hCYXJWaWV3LnJlbmRlcigpO1xyXG5cclxuICAgICAgICB2YXIgbG9hZGVyVmlldyA9IG5ldyBMb2FkZXJWaWV3KHtcclxuICAgICAgICAgICAgZWw6IHRoaXMudWkubG9hZGVyV3JhcHBlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGxvYWRlclZpZXcucmVuZGVyKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9wZW5TZXR0aW5nczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgc2V0dGluZ3NWaWV3ID0gbmV3IFNldHRpbmdzVmlldyh7XHJcbiAgICAgICAgICAgIG1vZGVsOiBhcHAuc2V0dGluZ3NcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGRpYWxvZyA9IG5ldyBEaWFsb2coe1xyXG4gICAgICAgICAgICBlbDogdGhpcy5lbCxcclxuICAgICAgICAgICAgdGl0bGU6IGFwcC50cmFuc2xhdG9yLnRyYW5zbGF0ZShcImZyYW1lOnNldHRpbmdzXCIpLFxyXG4gICAgICAgICAgICBpbnNpZGVWaWV3OiBzZXR0aW5nc1ZpZXdcclxuICAgICAgICB9KTtcclxuICAgICAgICBkaWFsb2cuc2hvdygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbk1vZHVsZUNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudWkuc3dpdGNoZXJDYXB0aW9uLmh0bWwoYXBwLnRyYW5zbGF0b3IudHJhbnNsYXRlKFwiZnJhbWU6bW9kdWxlLlwiICsgYXBwLmNvbnRleHQuZ2V0KFwibW9kdWxlXCIpKSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZUxheW91dDtcclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJmcmFtZS10ZW1wbGF0ZXMvbG9hZGVyLmhic1wiKTtcclxuXHJcbnZhciBMb2FkaW5nVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOnRlbXBsYXRlLFxyXG5cclxuICAgIHVpOntcclxuICAgICAgICBsb2FkZXI6XCIubG9hZGVyXCJcclxuICAgIH0sXHJcblxyXG4gICAgc2hvd0xvYWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuJGVsLnNob3coKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvc2VMb2FkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLiRlbC5oaWRlKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2FkaW5nVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcImZyYW1lLXRlbXBsYXRlcy9zZXR0aW5nc1ZpZXcuaGJzXCIpO1xyXG5cclxudmFyIFNldHRpbmdzVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuXHJcbiAgICB1aToge1xyXG4gICAgICAgIGJ0bkRhcms6IFwiLmRhcmtUaGVtZVwiLFxyXG4gICAgICAgIGJ0bkR1c3Q6IFwiLmR1c3RUaGVtZVwiLFxyXG4gICAgICAgIGRkbExhbmc6IFwiLmxhbmd1YWdlLWJveFwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgLnRoZW1lQm94XCI6IFwib25UaGVtZUNsaWNrXCIsXHJcbiAgICAgICAgXCJjaGFuZ2UgQHVpLmRkbExhbmdcIjogXCJvbkxhbmd1YWdlQ2hhbmdlXCJcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy51aS5kZGxMYW5nLnZhbChhcHAuc2V0dGluZ3MuZ2V0KFwibGFuZ1wiKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uTGFuZ3VhZ2VDaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIGxhbmcgPSB0aGlzLnVpLmRkbExhbmcudmFsKCk7XHJcblxyXG4gICAgICAgIGFwcC5zZXR0aW5ncy5zZXQoXCJsYW5nXCIsIGxhbmcpO1xyXG4gICAgICAgIGFwcC5zZXR0aW5ncy5zYXZlKG51bGwsIHtcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uVGhlbWVDbGljazogZnVuY3Rpb24gKGUpIHtcclxuXHJcbiAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5jdXJyZW50VGFyZ2V0IHx8IGUuc3JjRWxlbWVudCk7XHJcbiAgICAgICAgdmFyIHRoZW1lID0gdGFyZ2V0LmF0dHIoXCJkYXRhLW5hbWVcIik7XHJcblxyXG4gICAgICAgIGFwcC5zZXR0aW5ncy5zZXQoXCJ0aGVtZVwiLCB0aGVtZSk7XHJcbiAgICAgICAgYXBwLnNldHRpbmdzLnNhdmUobnVsbCwge1xyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBhcHAuc2V0dGluZ3NDb250cm9sbGVyLmxvYWRUaGVtZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXR0aW5nc1ZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcImZyYW1lLXRlbXBsYXRlcy90ZWNoQmFyLmhic1wiKTtcclxuXHJcbnZhciBUZWNoQmFyVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuXHJcbiAgICB1aToge1xyXG4gICAgICAgIGRkc1Jlc291cmNlczogXCIuZGRzUmVzb3VyY2VzXCJcclxuICAgIH0sXHJcblxyXG4gICAgZXZlbnRzOiB7XHJcbiAgICAgICAgXCJjbGljayAuZGRzUmVzb3VyY2VzXCI6IFwib25SZXNvdXJjZXNNZW51Q2xpY2tcIlxyXG4gICAgfSxcclxuXHJcbiAgICBvblJlc291cmNlc01lbnVDbGljazogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGVjaEJhclZpZXc7XHJcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXIsIG9wdGlvbnMsIGZ1bmN0aW9uVHlwZT1cImZ1bmN0aW9uXCIsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZztcblxuXG4gIGJ1ZmZlciArPSBcIjxkaXYgY2xhc3M9XFxcInRlY2hiYXItd3JhcHBlclxcXCI+PC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwibG9hZGVyLXdyYXBwZXJcXFwiPjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcImhlYWRlci13cmFwcGVyXFxcIj5cXHJcXG4gICAgIDxkaXYgY2xhc3M9XFxcImxvZ29cXFwiPjwvZGl2PlxcclxcbiAgICAgPGRpdiBjbGFzcz1cXFwic2VhcmNoLXJlZ2lvblxcXCI+PC9kaXY+XFxyXFxuICAgICA8ZGl2IGNsYXNzPVxcXCJhY2NvdW50TmFtZVxcXCIgYWx0PVwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5hY2NvdW50TmFtZSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5hY2NvdW50TmFtZSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCIgdGl0bGU9XFxcIlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5hY2NvdW50TmFtZSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5hY2NvdW50TmFtZSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCJcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcImFjdGlvbnMtd3JhcHBlclxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm1vZHVsZVN3aXRjaGVyXFxcIj5cXHJcXG4gICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsaW5rIGRyb3Bkb3duIGRkc0lkX2Rkc01vZHVsZXNcXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj48L3NwYW4+PHNwYW4gY2xhc3M9XFxcInRvZ2dsZVxcXCI+PC9zcGFuPjwvYT5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImRyb3Bkb3duLXNsaWRlciBkZHNNb2R1bGVzXFxcIj5cXHJcXG4gICAgICAgICAgIDxhIGNsYXNzPVxcXCJkZG0gc2VsZWN0TWFpbFxcXCIgaHJlZj1cXFwiI2luYm94XFxcIj48L3NwYW4+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTptb2R1bGUubWFpbFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTptb2R1bGUubWFpbFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICA8YSBjbGFzcz1cXFwiZGRtIHNlbGVjdFRhc2tzXFxcIiBocmVmPVxcXCIjdGFza3NcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6bW9kdWxlLnRhc2tzXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcImZyYW1lOm1vZHVsZS50YXNrc1wiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICAgICA8ZGl2IGNsYXNzPVxcXCJhY3Rpb25zLXJlZ2lvblxcXCI+PC9kaXY+XFxyXFxuICAgICA8ZGl2IGNsYXNzPVxcXCJidG5TZXR0aW5nc1xcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIHByaW1lSWNvbiBfYnRuU2V0dGluZ3NcXFwiPjxzcGFuIGNsYXNzPVxcXCJzZXR0aW5nc0ljb25cXFwiPjwvc3Bhbj48L2E+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwibWFpbi1yZWdpb25cXFwiPjwvZGl2PlwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcImxvYWRlclxcXCI+TG9hZGluZy4uLi4uLjwvZGl2PlxcclxcblxcclxcblxcclxcblwiO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJzZXR0aW5nc1ZpZXdcXFwiPlxcclxcblxcclxcbiAgICAgICA8ZGl2IGNsYXNzPVxcXCJzZWN0aW9uXFxcIj5cXHJcXG4gICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInRpdGxlXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTpzZXR0aW5ncy5sYW5ndWFnZVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTpzZXR0aW5ncy5sYW5ndWFnZVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgICAgPHNlbGVjdCBjbGFzcz1cXFwibGFuZ3VhZ2UtYm94XFxcIiBuYW1lPVxcXCJsYW5ndWFnZXNcXFwiIGRhdGEtYWN0aW9uPVxcXCJsYW5ndWFnZXNcXFwiID5cXHJcXG4gICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJlbi1VU1xcXCI+RW5nbGlzaCAoVVMpPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiZXMtRVNcXFwiPkVzcGHDsW9sPC9vcHRpb24+XFxyXFxuICAgICAgICAgICA8L3NlbGVjdD5cXHJcXG4gICAgICAgPC9kaXY+XFxyXFxuXFxyXFxuICAgICAgIDxkaXYgY2xhc3M9XFxcInNlY3Rpb25cXFwiPlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInRpdGxlXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTpzZXR0aW5ncy50aGVtZVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTpzZXR0aW5ncy50aGVtZVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInRoZW1lQm94IGR1c3RUaGVtZVxcXCIgZGF0YS1uYW1lPVxcXCJkdXN0XFxcIj48L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0aGVtZUJveCBkYXJrVGhlbWVcXFwiIGRhdGEtbmFtZT1cXFwiZGFya1xcXCI+PC9kaXY+XFxyXFxuICAgICAgIDwvZGl2PlxcclxcbjwvZGl2PlwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJ0ZWNoYmFyXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwidGl0bGVcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcImZyYW1lOnRlY2hiYXIuc2xvZ2FuXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcImZyYW1lOnRlY2hiYXIuc2xvZ2FuXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm1lbnVcXFwiPlxcclxcbiAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGxpbmsgbWVudWl0ZW1cXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTp0ZWNoYmFyLmFib3V0XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcImZyYW1lOnRlY2hiYXIuYWJvdXRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGxpbmsgbWVudWl0ZW1cXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTp0ZWNoYmFyLnR1dG9yaWFsXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcImZyYW1lOnRlY2hiYXIudHV0b3JpYWxcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGxpbmsgZHJvcGRvd24gbWVudWl0ZW0gZGRzSWRfZGRzUmVzb3VyY2VzXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6dGVjaGJhci5yZXNvdXJjZXNcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwiZnJhbWU6dGVjaGJhci5yZXNvdXJjZXNcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PHNwYW4gY2xhc3M9XFxcInRvZ2dsZVxcXCI+PC9zcGFuPjwvYT5cXHJcXG5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImRyb3Bkb3duLXNsaWRlciBkZHNSZXNvdXJjZXNcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImNvbnRhaW5lclxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDx1bD5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxsaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGNoZWNrZWQ+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGk+PC9pPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMj5DbGllbnQtc2lkZTwvaDI+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDxwPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbSBmaXJzdFxcXCI+QmFja2JvbmU8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5CYWNrYm9uZS5EZWVwTW9kZWw8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5NYXJpb25ldHRlPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+VW5kZXJzY29yZTwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPkJyb3dzZXJpZnk8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5IYW5kbGViYXJzPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+U2Fzc1xcXFxDb21wYXNzPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+RUNNQVNjcmlwdCA2IChCYWJlbCk8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8bGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBjaGVja2VkPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpPjwvaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aDI+U2VydmVyLXNpZGU8L2gyPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICA8cD5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW0gZmlyc3RcXFwiPk5vZGUuanMgKEV4cHJlc3MgNC4wKTwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5QYXNzcG9ydC5qczwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPk1vbmdvREI8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5Nb25nb29zZTwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPlNvY2tldC5pbzwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPC9saT5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxsaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGNoZWNrZWQ+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGk+PC9pPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMj5UZXN0aW5nIHRvb2xzPC9oMj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgPHA+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtIGZpcnN0XFxcIj5Nb2NoYSArIENoYWk8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5TaW5vbjwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPkJsYW5rZXQ8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8bGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBjaGVja2VkPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpPjwvaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aDI+RGVwbG95aW5nIHRvb2xzPC9oMj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgPHA+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtIGZpcnN0XFxcIj5HcnVudDwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XFxyXFxuXFxyXFxuICAgICAgICAgICAgICAgIDwvdWw+XFxyXFxuICAgICAgICAgICAgPC9kaXY+XFxyXFxuXFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIENvbnRhY3RNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9jb250YWN0TW9kZWxcIik7XHJcbnZhciBCYXNlQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCJiYXNlLWNvbGxlY3Rpb25zL2Jhc2VDb2xsZWN0aW9uXCIpO1xyXG5cclxudmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcclxudmFyIF9zdHJDb250YWN0cyA9IGZzLnJlYWRGaWxlU3luYygnLi9jbGllbnQvc3JjL2NvbW1vbi9kYXRhL2NvbnRhY3RzLmpzb24nLCAndXRmOCcpO1xyXG5cclxudmFyIENvbnRhY3RzQ29sbGVjdGlvbiA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgQ29udGFjdHNDb2xsZWN0aW9uID0gQmFzZUNvbGxlY3Rpb24uZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgbW9kZWw6IENvbnRhY3RNb2RlbCxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjb250YWN0TGlzdCA9IHRoaXMuX2NyZWF0ZUNvbnRhY3RMaXN0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KHtjb2xsZWN0aW9uOmNvbnRhY3RMaXN0fSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9jcmVhdGVDb250YWN0TGlzdDpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdmFyIGNvbnRhY3RMaXN0ID0gW10sIGNvbnRhY3RzID0gSlNPTi5wYXJzZShfc3RyQ29udGFjdHMpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGNvbnRhY3RzLCBmdW5jdGlvbihjb250YWN0KXtcclxuICAgICAgICAgICAgICAgIGNvbnRhY3RMaXN0LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOmNvbnRhY3QucmVwbGFjZShcIixcIiwgXCIgXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIGFkZHJlc3M6Y29udGFjdC5yZXBsYWNlKFwiLFwiLCBcIi5cIikudG9Mb3dlckNhc2UoKSArIFwiQG1haWxkby5jb21cIlxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGNvbnRhY3RMaXN0O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBnZXRUaXRsZXM6ZnVuY3Rpb24oYWRkcmVzc0xpc3Qpe1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGFkZHJlc3NMaXN0LCBfLmJpbmQoZnVuY3Rpb24oYWRkcmVzcyl7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gXy5maW5kKHRoaXMubW9kZWxzLGZ1bmN0aW9uIChyZWNvcmQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVjb3JkLmdldChcImFkZHJlc3NcIikgPT09IGFkZHJlc3M7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKG1vZGVsID8gbW9kZWwuZ2V0KFwidGl0bGVcIikgOiBhZGRyZXNzKTtcclxuICAgICAgICAgICAgfSx0aGlzKSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGFkZENvbnRhY3Q6ZnVuY3Rpb24oY29udGFjdEluZm8pe1xyXG5cclxuICAgICAgICAgICAgLy90aGlzLnNldCh7Y29sbGVjdGlvbjpbe1xyXG4gICAgICAgICAgICAvLyAgICB0aXRsZTpjb250YWN0SW5mbyxcclxuICAgICAgICAgICAgLy8gICAgYWRkcmVzczpjb250YWN0SW5mbyArIFwiQG1haWxkby5jb21cIlxyXG4gICAgICAgICAgICAvL31dfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRhY3RzQ29sbGVjdGlvbjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIE1haWxNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9tYWlsTW9kZWxcIik7XHJcbnZhciBGaWx0ZXJlZENvbGxlY3Rpb24gPSByZXF1aXJlKFwiYmFzZS1jb2xsZWN0aW9ucy9maWx0ZXJlZENvbGxlY3Rpb25cIik7XHJcblxyXG52YXIgTWFpbENvbGxlY3Rpb24gPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxDb2xsZWN0aW9uID0gRmlsdGVyZWRDb2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGlzRmV0Y2hlZDogZmFsc2UsXHJcblxyXG4gICAgICAgIG1vZGVsOiBNYWlsTW9kZWwsXHJcblxyXG4gICAgICAgIHJlc291cmNlOiAnbWFpbHMnLFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXR0cnMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc29ja2V0ID0ge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdE5hbWU6IHRoaXMucmVzb3VyY2UsXHJcbiAgICAgICAgICAgICAgICBpbzogYXBwLnNvY2tldENvbnRyb2xsZXIuZ2V0U29ja2V0KClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHVybDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgXCIvXCIgKyB0aGlzLnJlc291cmNlO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgY29tcGFyYXRvcjogZnVuY3Rpb24gKG1vZGVsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtKG5ldyBEYXRlKG1vZGVsLmdldChcInNlbnRUaW1lXCIpKS5nZXRUaW1lKCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZmlsdGVyQnlMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlsdGVyZWQgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGlmKF8uaXNTdHJpbmcobGFiZWwpKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZCA9IF8uZmlsdGVyKHRoaXMubW9kZWxzLCBmdW5jdGlvbiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gISFtb2RlbC5nZXQoXCJsYWJlbHMuXCIrbGFiZWwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJlZDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbENvbGxlY3Rpb247XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcblxyXG52YXIgQWN0aW9uc0NvbnRyb2xsZXIgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIEFjdGlvbnNDb250cm9sbGVyID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJtYWlsOmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbHMsIFwiY2hhbmdlOm1ldGFkYXRhXCIsIHRoaXMuZml4VXJsLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6c2VuZCcsIHRoaXMuc2VuZCwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8obWFpbC5jaGFubmVsLnZlbnQsICdtYWlsOnNlbGVjdCcsIHRoaXMuc2VsZWN0LCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6bW92ZVRvJywgdGhpcy5tb3ZlVG8sIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKG1haWwuY2hhbm5lbC52ZW50LCAnbWFpbDpkZWxldGUnLCB0aGlzLmRlbGV0ZUl0ZW1zLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6bWFya0FzJywgdGhpcy5tYXJrQXMsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKG1haWwuY2hhbm5lbC52ZW50LCAnbWFpbDpkaXNjYXJkJywgdGhpcy5kaXNjYXJkLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6Y2hhbmdlJywgdGhpcy5zYXZlQXNEcmFmdCwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5zZWxlY3RCeSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWlscy5zZWxlY3RBbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ25vbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbHMuY2xlYXJTZWxlY3RlZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAncmVhZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWlscy5zZWxlY3RNb2RlbHModGhpcy5tYWlscy5maWx0ZXJCeUxhYmVsKFwicmVhZFwiKSwge2V4Y2x1c2l2ZWx5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd1bnJlYWQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbHMuc2VsZWN0TW9kZWxzKHRoaXMubWFpbHMuZmlsdGVyQnlMYWJlbChcInVucmVhZFwiKSwge2V4Y2x1c2l2ZWx5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbWFya0FzOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLCBpdGVtcyA9IG9wdGlvbnMuaXRlbXMgfHwgdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5tYWlscy5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5tYXJrQXMob3B0aW9ucy5sYWJlbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUl0ZW1zKGl0ZW1zLCBvcHRpb25zKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbW92ZVRvOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLCBpdGVtcyA9IG9wdGlvbnMuaXRlbXMgfHwgdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5tYWlscy5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5tb3ZlVG8ob3B0aW9ucy50YXJnZXQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVJdGVtcyhpdGVtcywgXy5leHRlbmQoe30sIG9wdGlvbnMsIHtcInJlZnJlc2hcIjogdHJ1ZX0pKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdXBkYXRlSXRlbXM6IGZ1bmN0aW9uIChpdGVtcywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWlscy51cGRhdGUoe1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkSXRlbXM6IGl0ZW1zLFxyXG4gICAgICAgICAgICAgICAgZmllbGRzOiBbJ2xhYmVscycsICdncm91cHMnXSxcclxuXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBfLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlZnJlc2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgdGhpcyksXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOnVwZGF0ZUl0ZW1zOmVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZGVsZXRlSXRlbXM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMuZGVzdHJveSh7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtczogdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpLFxyXG5cclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IF8uYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6ZGVsZXRlSXRlbXM6ZXJyb3JcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZW5kOiBmdW5jdGlvbiAobWFpbE1vZGVsKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc09iamVjdChtYWlsTW9kZWwpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbWFpbE1vZGVsLnNldChcImdyb3Vwc1wiLCBbXSwge3NpbGVudDogdHJ1ZX0pO1xyXG5cclxuICAgICAgICAgICAgICAgIG1haWxNb2RlbC5zYXZlKG51bGwsIHtcclxuICAgICAgICAgICAgICAgICAgICBzaWxlbnQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogXy5iaW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcyksXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6c2F2ZTplcnJvclwiLCBtYWlsTW9kZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGRpc2NhcmQ6IGZ1bmN0aW9uIChtYWlsTW9kZWwpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYWlsTW9kZWwuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5yb3V0ZXIucHJldmlvdXMoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG1haWxNb2RlbC5kZXN0cm95KHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBfLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVN1Y2Nlc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCB0aGlzKSxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpkZWxldGU6ZXJyb3JcIiwgbWFpbE1vZGVsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzYXZlQXNEcmFmdDogZnVuY3Rpb24gKG1haWxNb2RlbCkge1xyXG5cclxuICAgICAgICAgICAgbWFpbE1vZGVsLnNldChcImdyb3Vwc1wiLCBbXCJkcmFmdFwiXSwge3NpbGVudDogdHJ1ZX0pO1xyXG5cclxuICAgICAgICAgICAgbWFpbE1vZGVsLnNhdmUobnVsbCwge1xyXG4gICAgICAgICAgICAgICAgc2F2ZUFzOiBcImRyYWZ0XCIsXHJcbiAgICAgICAgICAgICAgICBzaWxlbnQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZml4VXJsOiBmdW5jdGlvbiAobWV0YWRhdGEpIHtcclxuICAgICAgICAgICAgbWFpbC5yb3V0ZXIuZml4VXJsKHtwYWdlOiBtZXRhZGF0YS5jdXJyUGFnZSArIDF9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBoYW5kbGVTdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb24udHlwZVwiKSA9PT0gXCJjb21wb3NlXCIpIHtcclxuICAgICAgICAgICAgICAgIG1haWwucm91dGVyLnByZXZpb3VzKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haWxzLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBBY3Rpb25zQ29udHJvbGxlcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIENvbnRlbnRMYXlvdXQgPSByZXF1aXJlKFwibWFpbC12aWV3cy9tYWlsQ29udGVudExheW91dFwiKTtcclxudmFyIE1haWxzVmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL21haWxzVmlld1wiKTtcclxudmFyIFByZXZpZXdWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvcHJldmlld1ZpZXdcIik7XHJcbnZhciBDb21wb3NlVmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL2NvbXBvc2VWaWV3L2NvbXBvc2VWaWV3XCIpO1xyXG52YXIgRW1wdHlNYWlsVmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL2VtcHR5TWFpbFZpZXdcIik7XHJcblxyXG52YXIgTWFpbENvbnRlbnRDb250cm9sbGVyID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBNYWlsQ29udGVudENvbnRyb2xsZXIgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWlscyA9IG1haWwuY2hhbm5lbC5yZXFyZXMucmVxdWVzdChcIm1haWw6Y29sbGVjdGlvblwiKTtcclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6aXRlbXNcIiwgdGhpcy5jbG9zZVByZXZpZXcpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbHMsIFwiY2hhbmdlOnNlbGVjdGlvblwiLCB0aGlzLnRvZ2dsZVByZXZpZXcpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKG1haWwuY2hhbm5lbC52ZW50LCBcIm1haWxUYWJsZTpJdGVtQ2xpY2tlZFwiLCB0aGlzLnNob3dQcmV2aWV3KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBuZXdMYXlvdXRcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbmV3TGF5b3V0OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQgPSBuZXcgQ29udGVudExheW91dCgpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMuY29udGVudExheW91dCwgXCJyZW5kZXJcIiwgdGhpcy5vbkxheW91dFJlbmRlcik7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50TGF5b3V0O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkxheW91dFJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uXCIpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGVtcHR5TWFpbFZpZXcgPSBuZXcgRW1wdHlNYWlsVmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQucHJldmlld1JlZ2lvbi5hZGQoZW1wdHlNYWlsVmlldyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGFibGVWaWV3ID0gbmV3IE1haWxzVmlldyh7Y29sbGVjdGlvbjogdGhpcy5tYWlsc30pO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQuaXRlbXNSZWdpb24uYWRkKHRhYmxlVmlldyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gc2hvd1ByZXZpZXdcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvd1ByZXZpZXc6IGZ1bmN0aW9uIChtYWlsTW9kZWwpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzT2JqZWN0KG1haWxNb2RlbCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpzZWxlY3RcIiwge3NlbGVjdEJ5OiBcIm5vbmVcIn0pO1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHtsYWJlbDogJ3JlYWQnLCBpdGVtczogW21haWxNb2RlbC5pZF19KTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnByZXZpZXcgPSAhbWFpbE1vZGVsLmdldChcImdyb3Vwcy5kcmFmdFwiKSA/IG5ldyBQcmV2aWV3Vmlldyh7bW9kZWw6IG1haWxNb2RlbH0pIDogbmV3IENvbXBvc2VWaWV3KHttb2RlbDogbWFpbE1vZGVsfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQucHJldmlld1JlZ2lvbi5hZGQodGhpcy5wcmV2aWV3KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0b2dnbGVQcmV2aWV3OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc09iamVjdCh0aGlzLnByZXZpZXcpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkID0gdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJldmlldy4kZWwudG9nZ2xlKHNlbGVjdGVkID09PSAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBjbG9zZVByZXZpZXc6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZpZXcgJiYgdGhpcy5wcmV2aWV3Lm1vZGVsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGlzTW9kZWxFeGlzdCA9IF8uaXNPYmplY3QodGhpcy5tYWlscy5nZXQodGhpcy5wcmV2aWV3Lm1vZGVsLmlkKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFpc01vZGVsRXhpc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQucHJldmlld1JlZ2lvbi5jbGVhbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE1haWxDb250ZW50Q29udHJvbGxlcjsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgTWFpbENvbGxlY3Rpb24gPSByZXF1aXJlKFwibWFpbC1jb2xsZWN0aW9ucy9tYWlsQ29sbGVjdGlvblwiKTtcclxudmFyIENvbnRhY3RzQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCJtYWlsLWNvbGxlY3Rpb25zL2NvbnRhY3RzQ29sbGVjdGlvblwiKTtcclxudmFyIFNlbGVjdGFibGVEZWNvcmF0b3IgPSByZXF1aXJlKFwiZGVjb3JhdG9ycy9zZWxlY3RhYmxlQ29sbGVjdGlvbkRlY29yYXRvclwiKTtcclxuXHJcbnZhciBEYXRhQ29udHJvbGxlciA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgRGF0YUNvbnRyb2xsZXIgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBpbml0aWFsaXplXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250YWN0Q29sbGVjdGlvbiA9IG5ldyBDb250YWN0c0NvbGxlY3Rpb24oKTtcclxuICAgICAgICAgICAgdGhpcy5tYWlsQ29sbGVjdGlvbiA9IG5ldyBTZWxlY3RhYmxlRGVjb3JhdG9yKG5ldyBNYWlsQ29sbGVjdGlvbigpKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICAgICAgdGhpcy5fc2V0SGFuZGxlcnMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbENvbGxlY3Rpb24sIFwiZmV0Y2g6c3VjY2Vzc1wiLCB0aGlzLl91cGRhdGVTZWxlY3Rpb24sIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKGFwcC5jb250ZXh0LCBcImNoYW5nZTptYWlsLmFjdGlvblwiLCB0aGlzLl9yZWZyZXNoTWFpbENvbGxlY3Rpb24sIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKGFwcC52ZW50LFwib25TZXR0aW5nc0xvYWRlZFwiLCB0aGlzLl91cGRhdGVDb250YWN0cyx0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhhcHAudmVudCwgXCJkYXRhOmNoYW5nZVwiLCB0aGlzLl9vbkRhdGFDaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9zZXRIYW5kbGVyczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgbWFpbC5jaGFubmVsLnJlcXJlcy5zZXRIYW5kbGVyKFwibWFpbDpjb2xsZWN0aW9uXCIsIHRoaXMuX2dldE1haWxDb2xsZWN0aW9uLCB0aGlzKTtcclxuICAgICAgICAgICAgbWFpbC5jaGFubmVsLnJlcXJlcy5zZXRIYW5kbGVyKFwiY29udGFjdDpjb2xsZWN0aW9uXCIsIHRoaXMuX2dldENvbnRhY3RDb2xsZWN0aW9uLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBnZXQgY29sbGVjdGlvbnNcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2dldE1haWxDb2xsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1haWxDb2xsZWN0aW9uO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9nZXRDb250YWN0Q29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb250YWN0Q29sbGVjdGlvbjtcclxuICAgICAgICB9LFxyXG5cclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGRhdGEgY2hhbmdlXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfb25EYXRhQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hNYWlsQ29sbGVjdGlvbigpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF91cGRhdGVTZWxlY3Rpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5tYWlsQ29sbGVjdGlvbi51cGRhdGVTZWxlY3Rpb24oe30pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX3VwZGF0ZUNvbnRhY3RzOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdENvbGxlY3Rpb24uYWRkQ29udGFjdChhcHAuc2V0dGluZ3MuZ2V0KFwidXNlck5hbWVcIikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX3JlZnJlc2hNYWlsQ29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uXCIpIHx8IHt9O1xyXG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gYWN0aW9uLnBhcmFtcyB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzRmluaXRlKHBhcmFtcy5wYWdlKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYWlsQ29sbGVjdGlvbi5mZXRjaEJ5KHtcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VOdW1iZXI6IHBhcmFtcy5wYWdlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeTogcGFyYW1zLnF1ZXJ5IHx8ICdncm91cHM6JyArIGFjdGlvbi50eXBlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gRGF0YUNvbnRyb2xsZXI7XHJcblxyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIE1haWxNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9tYWlsTW9kZWxcIik7XHJcbnZhciBNYWluTGF5b3V0ID0gcmVxdWlyZShcIm1haWwtdmlld3MvbWFpbE1haW5MYXlvdXRcIik7XHJcbnZhciBTZWFyY2hWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3Mvc2VhcmNoVmlld1wiKTtcclxudmFyIE5hdlZpZXcgPSByZXF1aXJlKFwibWFpbC12aWV3cy9uYXZWaWV3XCIpO1xyXG52YXIgQWN0aW9uVmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL2FjdGlvblZpZXcvYWN0aW9uVmlld1wiKTtcclxudmFyIENvbXBvc2VWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvY29tcG9zZVZpZXcvY29tcG9zZVZpZXdcIik7XHJcbnZhciBFbXB0eUZvbGRlcnNWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvZW1wdHlGb2xkZXJWaWV3XCIpO1xyXG52YXIgQ29udGVudExheW91dENvbnRyb2xsZXIgPSByZXF1aXJlKFwiLi9tYWlsQ29udGVudExheW91dENvbnRyb2xsZXJcIik7XHJcblxyXG52YXIgTWFpbkxheW91dENvbnRyb2xsZXIgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haW5MYXlvdXRDb250cm9sbGVyID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dENvbnRyb2xsZXIgPSBuZXcgQ29udGVudExheW91dENvbnRyb2xsZXIoKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhhcHAuY29udGV4dCwgJ2NoYW5nZTptYWlsLmFjdGlvbicsIHRoaXMub25BY3Rpb25DaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHNldFZpZXdzXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNldFZpZXdzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaFZpZXcgPSBuZXcgU2VhcmNoVmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLm1haW5MYXlvdXQgPSBuZXcgTWFpbkxheW91dCgpO1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvblZpZXcgPSBuZXcgQWN0aW9uVmlldygpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1haW5MYXlvdXQsIFwicmVuZGVyXCIsIHRoaXMub25NYWluTGF5b3V0UmVuZGVyLCB0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIGFwcC5mcmFtZS5zZXRSZWdpb24oXCJzZWFyY2hcIiwgdGhpcy5zZWFyY2hWaWV3KTtcclxuICAgICAgICAgICAgYXBwLmZyYW1lLnNldFJlZ2lvbihcImFjdGlvbnNcIiwgdGhpcy5hY3Rpb25WaWV3KTtcclxuICAgICAgICAgICAgYXBwLmZyYW1lLnNldFJlZ2lvbihcIm1haW5cIiwgdGhpcy5tYWluTGF5b3V0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25NYWluTGF5b3V0UmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmF2VmlldyA9IG5ldyBOYXZWaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbkxheW91dC5uYXZSZWdpb24uYWRkKG5hdlZpZXcpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGVtcHR5Rm9sZGVyVmlldyA9IG5ldyBFbXB0eUZvbGRlcnNWaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbkxheW91dC53b3JrUmVnaW9uLmFkZChlbXB0eUZvbGRlclZpZXcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG9uQWN0aW9uQ2hhbmdlXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uQWN0aW9uQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb24udHlwZVwiKTtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29tcG9zZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNYWlscygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGNvbXBvc2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjb21wb3NlVmlldyA9IG5ldyBDb21wb3NlVmlldyh7XHJcbiAgICAgICAgICAgICAgICBtb2RlbDogbmV3IE1haWxNb2RlbCgpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLm1haW5MYXlvdXQud29ya1JlZ2lvbi5hZGQoY29tcG9zZVZpZXcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93TWFpbHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5jb250ZW50TGF5b3V0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXQgPSB0aGlzLmNvbnRlbnRMYXlvdXRDb250cm9sbGVyLm5ld0xheW91dCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubWFpbkxheW91dC53b3JrUmVnaW9uLmFkZCh0aGlzLmNvbnRlbnRMYXlvdXQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBNYWluTGF5b3V0Q29udHJvbGxlcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxuXHJcbnZhciBNYWlsUm91dGVyQ29udHJvbGxlciA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgTWFpbFJvdXRlckNvbnRyb2xsZXIgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgY29tcG9zZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCB7J3R5cGUnOiAnY29tcG9zZScsICdwYXJhbXMnOiB7fX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbmJveDogZnVuY3Rpb24gKHBhcmFtKSB7XHJcbiAgICAgICAgICAgIGFwcC5jb250ZXh0LnNldChcIm1haWwuYWN0aW9uXCIsIHsndHlwZSc6ICdpbmJveCcsICdwYXJhbXMnOiB0aGlzLmFuYWx5emVQYXJhbXMocGFyYW0pfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNlbnQ6IGZ1bmN0aW9uIChwYXJhbSkge1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCB7J3R5cGUnOiAnc2VudCcsICdwYXJhbXMnOiB0aGlzLmFuYWx5emVQYXJhbXMocGFyYW0pfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGRyYWZ0OiBmdW5jdGlvbiAocGFyYW0pIHtcclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibWFpbC5hY3Rpb25cIiwgeyd0eXBlJzogJ2RyYWZ0JywgJ3BhcmFtcyc6IHRoaXMuYW5hbHl6ZVBhcmFtcyhwYXJhbSl9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdHJhc2g6IGZ1bmN0aW9uIChwYXJhbSkge1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCB7J3R5cGUnOiAndHJhc2gnLCAncGFyYW1zJzogdGhpcy5hbmFseXplUGFyYW1zKHBhcmFtKX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzcGFtOiBmdW5jdGlvbiAocGFyYW0pIHtcclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibWFpbC5hY3Rpb25cIiwgeyd0eXBlJzogJ3NwYW0nLCAncGFyYW1zJzogdGhpcy5hbmFseXplUGFyYW1zKHBhcmFtKX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZWFyY2g6IGZ1bmN0aW9uIChwYXJhbTEsIHBhcmFtMikge1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCB7J3R5cGUnOiAnc2VhcmNoJywgJ3BhcmFtcyc6IHRoaXMuYW5hbHl6ZVBhcmFtcyhwYXJhbTIsIHBhcmFtMSl9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgYW5hbHl6ZVBhcmFtczogZnVuY3Rpb24gKGlkLCBxdWVyeSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHtwYWdlOiAxLCBxdWVyeTogcXVlcnl9O1xyXG5cclxuICAgICAgICAgICAgaWYoX3Muc3RhcnRzV2l0aChpZCwgXCJwXCIpKXtcclxuICAgICAgICAgICAgICAgIHZhciBwYWdlID0gaWQuc3BsaXQoXCJwXCIpWzFdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChfLmlzRmluaXRlKHBhZ2UpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zLnBhZ2UgPSBwYWdlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGJlZm9yZVJvdXRlXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBiZWZvcmVSb3V0ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibW9kdWxlXCIsIFwibWFpbFwiKTtcclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibWFpbC5hY3Rpb25cIiwgbnVsbCwge3NpbGVudDogdHJ1ZX0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsUm91dGVyQ29udHJvbGxlcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIERlZXBNb2RlbCA9IHJlcXVpcmUoXCJiYXNlLW1vZGVsXCIpO1xyXG5cclxudmFyIENvbnRhY3RNb2RlbCA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgQ29udGFjdE1vZGVsID0gRGVlcE1vZGVsLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGRlZmF1bHRzIDoge1xyXG4gICAgICAgICAgICB0aXRsZTonJyxcclxuICAgICAgICAgICAgYWRkcmVzczonJ1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbihyZXNwb25zZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6cmVzcG9uc2UucmVwbGFjZShcIixcIiwgXCIgXCIpLFxyXG4gICAgICAgICAgICAgICAgYWRkcmVzczpyZXNwb25zZS5yZXBsYWNlKFwiLFwiLCBcIi5cIikudG9Mb3dlckNhc2UoKSArIFwiQG1haWxkby5jb21cIlxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29udGFjdE1vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVGaWx0ZXJNb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XHJcblxyXG4gICAgc2V0SW5wdXQ6IGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgIHRoaXMuaW5wdXQgPSBfLmlzU3RyaW5nKGlucHV0KSA/IGlucHV0LnRvTG93ZXJDYXNlKCkgOiBcIlwiO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgcHJlZGljYXRlOiBmdW5jdGlvbiAobW9kZWwpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGVzdChtb2RlbC5nZXQoXCJ0ZXh0XCIpKSB8fCB0aGlzLnRlc3QobW9kZWwuZ2V0KFwidmFsdWVcIikpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHRlc3Q6IGZ1bmN0aW9uICh0ZXh0KSB7XHJcblxyXG4gICAgICAgIHZhciByZXMgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcodGV4dCkpIHtcclxuXHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICByZXMgPSBfcy5zdGFydHNXaXRoKHRleHQsIHRoaXMuaW5wdXQpIHx8XHJcbiAgICAgICAgICAgICAgICBfcy5jb250YWlucyh0ZXh0LCBcIiBcIiArIHRoaXMuaW5wdXQpIHx8XHJcbiAgICAgICAgICAgICAgICBfcy5jb250YWlucyh0ZXh0LCBcIjpcIiArIHRoaXMuaW5wdXQpIHx8XHJcbiAgICAgICAgICAgICAgICBfcy5jb250YWlucyh0ZXh0LCBcIi5cIiArIHRoaXMuaW5wdXQpIHx8XHJcbiAgICAgICAgICAgICAgICBfcy5jb250YWlucyh0ZXh0LCBcIkBcIiArIHRoaXMuaW5wdXQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGhpZ2hsaWdodEtleTogZnVuY3Rpb24gKGtleSkge1xyXG5cclxuICAgICAgICBpZiAoXy5pc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoXCJeXCIgKyB0aGlzLmlucHV0LCAnZ2knKSwgZnVuY3Rpb24gKHN0cikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnPGI+JyArIHN0ciArICc8L2I+JztcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5pbnB1dCwgJ2dpJyksIGZ1bmN0aW9uIChzdHIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyA8Yj4nICsgX3Muc3RyUmlnaHQoc3RyLCAnICcpICsgJzwvYj4nO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoXCI6XCIgKyB0aGlzLmlucHV0LCBcImdpXCIpLCBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc6PGI+JyArIF9zLnN0clJpZ2h0KHN0ciwgJzonKSArICc8L2I+JztcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKFwiQFwiICsgdGhpcy5pbnB1dCwgXCJnaVwiKSwgZnVuY3Rpb24gKHN0cikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnQDxiPicgKyBfcy5zdHJSaWdodChzdHIsICdAJykgKyAnPC9iPic7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UobmV3IFJlZ0V4cChcIlxcXFwuXCIgKyB0aGlzLmlucHV0LCBcImdpXCIpLCBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcuPGI+JyArIF9zLnN0clJpZ2h0KHN0ciwgJy4nKSArICc8L2I+JztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ga2V5O1xyXG4gICAgfVxyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGVGaWx0ZXJNb2RlbDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIEJhc2VNb2RlbCA9IHJlcXVpcmUoXCJiYXNlLW1vZGVsXCIpO1xyXG5cclxudmFyIE1haWxNb2RlbCA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgTWFpbE1vZGVsID0gQmFzZU1vZGVsLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgICAgIGZyb206ICcnLFxyXG4gICAgICAgICAgICB0bzogJycsXHJcbiAgICAgICAgICAgIGNjOiAnJyxcclxuICAgICAgICAgICAgYmNjOiAnJyxcclxuICAgICAgICAgICAgc3ViamVjdDogJycsXHJcbiAgICAgICAgICAgIHNlbnRUaW1lOiAnJyxcclxuICAgICAgICAgICAgYm9keTogJycsXHJcbiAgICAgICAgICAgIGxhYmVsczoge30sXHJcbiAgICAgICAgICAgIGdyb3VwczogW11cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZXNvdXJjZTogJ21haWwnLFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXR0cnMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXNlck5hbWUgPSBhcHAuc2V0dGluZ3MuZ2V0KFwidXNlck5hbWVcIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNvY2tldCA9IHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3ROYW1lOiB0aGlzLnJlc291cmNlLFxyXG4gICAgICAgICAgICAgICAgaW86IGFwcC5zb2NrZXRDb250cm9sbGVyLmdldFNvY2tldCgpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB1cmw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSArIFwiL1wiICsgdGhpcy5yZXNvdXJjZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBnZXQgYWRkcmVzc2VzXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGdldEluZ29pbmdBZGRyZXNzZXM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldEFkZHJlc3NlcygnZnJvbScpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBnZXRPdXRnb2luZ0FkZHJlc3NlczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0QWRkcmVzc2VzKCd0bycpLmNvbmNhdCh0aGlzLl9nZXRBZGRyZXNzZXMoJ2NjJyksIHRoaXMuX2dldEFkZHJlc3NlcygnYmNjJykpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfZ2V0QWRkcmVzc2VzOiBmdW5jdGlvbiAoYXR0cikge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFkZHJlc3NlcyA9IHRoaXMuZ2V0KGF0dHIpLnNwbGl0KFwiO1wiKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzRW1wdHkoXy5sYXN0KGFkZHJlc3NlcykpKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRyZXNzZXMgPSBfLmZpcnN0KGFkZHJlc3NlcywgYWRkcmVzc2VzLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhZGRyZXNzZXM7XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGFkZFxccmVtb3ZlIGFkZHJlc3NcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgYWRkQWRkcmVzczogZnVuY3Rpb24gKGF0dHIsIGFkZHJlc3MpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGFzdEFkZHJlc3MoYXR0ciwgYWRkcmVzcyArIFwiO1wiKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdXBkYXRlTGFzdEFkZHJlc3M6IGZ1bmN0aW9uIChhdHRyLCBhZGRyZXNzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWRkckxpc3QgPSB0aGlzLmdldChhdHRyKS5zcGxpdChcIjtcIik7XHJcbiAgICAgICAgICAgIGFkZHJMaXN0W2FkZHJMaXN0Lmxlbmd0aCAtIDFdID0gYWRkcmVzcztcclxuICAgICAgICAgICAgdGhpcy5zZXQoYXR0ciwgYWRkckxpc3Quam9pbihcIjtcIikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW1vdmVBZGRyZXNzOiBmdW5jdGlvbiAoYXR0ciwgYWRkcmVzcykge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFkZHJMaXN0ID0gdGhpcy5nZXQoYXR0cikucmVwbGFjZShhZGRyZXNzICsgXCI7XCIsIFwiXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNldChhdHRyLCBhZGRyTGlzdCk7XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHZhbGlkYXRlXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAoYXR0cnMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc2F2ZUFzICE9PSBcImRyYWZ0XCIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgb3V0Z29pbmdBZGRyZXNzZXMgPSB0aGlzLmdldE91dGdvaW5nQWRkcmVzc2VzKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoXy5pc0VtcHR5KG91dGdvaW5nQWRkcmVzc2VzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBNYWlsTW9kZWwuRXJyb3JzLk5vUmVjaXBpZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0byA9IHRoaXMuX2dldEFkZHJlc3NlcygndG8nKTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG8ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsaWRhdGVBZGRyZXNzKHRvW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWFpbE1vZGVsLkVycm9ycy5JbnZhbGlkVG9BZGRyZXNzO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgY2MgPSB0aGlzLl9nZXRBZGRyZXNzZXMoJ2NjJyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsaWRhdGVBZGRyZXNzKGNjW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWFpbE1vZGVsLkVycm9ycy5JbnZhbGlkQ2NBZGRyZXNzO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB2YWxpZGF0ZUFkZHJlc3M6IGZ1bmN0aW9uIChhZGRyZXNzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVnID0gL15cXHcrKFstKy4nXVxcdyspKkBcXHcrKFstLl1cXHcrKSpcXC5cXHcrKFstLl1cXHcrKSokLztcclxuICAgICAgICAgICAgcmV0dXJuIHJlZy50ZXN0KGFkZHJlc3MpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG1hcmtBc1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBtYXJrQXM6IGZ1bmN0aW9uIChsYWJlbCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIG9wcG9zaXRlTGFiZWwgPSB0aGlzLl9nZXRPcG9zaXRlTGFiZWwobGFiZWwpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlTGFiZWwob3Bwb3NpdGVMYWJlbCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2FkZExhYmVsKGxhYmVsKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2dldE9wb3NpdGVMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoX3Muc3RhcnRzV2l0aChsYWJlbCwgXCJ1blwiKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9zLnN0clJpZ2h0KGxhYmVsLCBcInVuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBcInVuXCIgKyBsYWJlbDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2FkZExhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5nZXQoXCJsYWJlbHMuXCIgKyBsYWJlbCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KFwibGFiZWxzLlwiICsgbGFiZWwsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9yZW1vdmVMYWJlbDogZnVuY3Rpb24gKGxhYmVsTmFtZSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGxhYmVscyA9IHRoaXMuZ2V0KCdsYWJlbHMnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmhhcyhsYWJlbHMsIGxhYmVsTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBsYWJlbHNbbGFiZWxOYW1lXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG1vdmVUb1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBtb3ZlVG86IGZ1bmN0aW9uIChkZXN0KSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZ3JvdXBzID0gdGhpcy5nZXQoJ2dyb3VwcycpO1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uY29udGFpbnMoZ3JvdXBzLCBcInRyYXNoXCIpIHx8IF8uY29udGFpbnMoZ3JvdXBzLCBcInNwYW1cIikgfHwgZGVzdCA9PT0gXCJ0cmFzaFwiIHx8IGRlc3QgPT09IFwic3BhbVwiKSB7XHJcbiAgICAgICAgICAgICAgICBncm91cHMgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ3JvdXBzLnB1c2goZGVzdCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KCdncm91cHMnLCBncm91cHMpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIE1haWxNb2RlbC5FcnJvcnMgPSB7XHJcblxyXG4gICAgICAgIE5vUmVjaXBpZW50OiAxLFxyXG4gICAgICAgIEludmFsaWRUb0FkZHJlc3M6IDIsXHJcbiAgICAgICAgSW52YWxpZENjQWRkcmVzczogM1xyXG4gICAgfTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbE1vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgTWFpbFJvdXRlciA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgTWFpbFJvdXRlciA9IE1hcmlvbmV0dGUuQXBwUm91dGVyLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGFwcFJvdXRlczoge1xyXG4gICAgICAgICAgICBcIlwiOiBcImluYm94XCIsXHJcbiAgICAgICAgICAgIFwiaW5ib3hcIjogXCJpbmJveFwiLFxyXG4gICAgICAgICAgICBcImluYm94LzpwYXJhbVwiOiBcImluYm94XCIsXHJcbiAgICAgICAgICAgIFwiZHJhZnRcIjogXCJkcmFmdFwiLFxyXG4gICAgICAgICAgICBcImRyYWZ0LzpwYXJhbVwiOiBcImRyYWZ0XCIsXHJcbiAgICAgICAgICAgIFwic2VudFwiOiBcInNlbnRcIixcclxuICAgICAgICAgICAgXCJzZW50LzpwYXJhbVwiOiBcInNlbnRcIixcclxuICAgICAgICAgICAgXCJ0cmFzaFwiOiBcInRyYXNoXCIsXHJcbiAgICAgICAgICAgIFwidHJhc2gvOnBhcmFtXCI6IFwidHJhc2hcIixcclxuICAgICAgICAgICAgXCJzcGFtXCI6IFwic3BhbVwiLFxyXG4gICAgICAgICAgICBcInNwYW0vOnBhcmFtXCI6IFwic3BhbVwiLFxyXG4gICAgICAgICAgICBcInNlYXJjaC86cGFyYW0xXCI6IFwic2VhcmNoXCIsXHJcbiAgICAgICAgICAgIFwic2VhcmNoLzpwYXJhbTEvOnBhcmFtMlwiOiBcInNlYXJjaFwiLFxyXG4gICAgICAgICAgICBcImNvbXBvc2VcIjogXCJjb21wb3NlXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xsZXIgPSBvcHRpb25zLmNvbnRyb2xsZXI7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcm91dGU6IGZ1bmN0aW9uIChyb3V0ZSwgbmFtZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgcmV0dXJuIEJhY2tib25lLlJvdXRlci5wcm90b3R5cGUucm91dGUuY2FsbCh0aGlzLCByb3V0ZSwgbmFtZSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250cm9sbGVyLmJlZm9yZVJvdXRlKCk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBwcmV2aW91czogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBtYWlsLnJvdXRlci5uYXZpZ2F0ZShcImluYm94XCIsIHt0cmlnZ2VyOiB0cnVlfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGZpeFVybDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsUm91dGVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxucmVxdWlyZShcInBsdWdpbnMvdG9nZ2xlLmJsb2NrXCIpO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9tb3JlQWN0aW9uc1ZpZXcuaGJzXCIpO1xyXG5cclxudmFyIE1vcmVBY3Rpb25zVmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcbiAgICBNb3JlQWN0aW9uc1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICBjbGFzc05hbWU6ICdhY3Rpb25PcHRpb25zVmlldycsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIGRkaVN0YXJyZWQ6XCIuYWRkU3RhclwiLFxyXG4gICAgICAgICAgICBkZGlOb3RTdGFycmVkOlwiLnJlbW92ZVN0YXJcIixcclxuICAgICAgICAgICAgZGRpSW1wOlwiLm1hcmtJbXBcIixcclxuICAgICAgICAgICAgZGRpTm90SW1wOlwiLm1hcmtOb3RJbXBcIixcclxuICAgICAgICAgICAgZGRpUmVhZDpcIi5tYXJrUmVhZFwiLFxyXG4gICAgICAgICAgICBkZGlVbnJlYWQ6XCIubWFya1VucmVhZFwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaVJlYWRcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHtsYWJlbDogJ3JlYWQnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaVVucmVhZFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptYXJrQXNcIiwge2xhYmVsOiAndW5yZWFkJ30pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5kZGlJbXBcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHtsYWJlbDogJ2ltcG9ydGFudCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpTm90SW1wXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1hcmtBc1wiLCB7IGxhYmVsOiAndW5pbXBvcnRhbnQnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaVN0YXJyZWRcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHtsYWJlbDogJ3N0YXJyZWQnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaU5vdFN0YXJyZWRcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHtsYWJlbDogJ3Vuc3RhcnJlZCd9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJtYWlsOmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6aXRlbXMgdXBkYXRlOnN1Y2Nlc3MgY2hhbmdlOnNlbGVjdGlvblwiLCB0aGlzLnNldERyb3BEb3duSXRlbXMsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNldERyb3BEb3duSXRlbXM6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBpdGVtcyA9IHRoaXMuaXRlbXNUb1Nob3coKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudWkuZGRpU3RhcnJlZC50b2dnbGVCbG9jayhpdGVtcy5zdGFyZWQpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaU5vdFN0YXJyZWQudG9nZ2xlQmxvY2soaXRlbXNbXCJub3Qtc3RhcmVkXCJdKTtcclxuICAgICAgICAgICAgdGhpcy51aS5kZGlJbXAudG9nZ2xlQmxvY2soaXRlbXMuaW1wb3J0YW50KTtcclxuICAgICAgICAgICAgdGhpcy51aS5kZGlOb3RJbXAudG9nZ2xlQmxvY2soaXRlbXNbXCJub3QtaW1wb3J0YW50XCJdKTtcclxuICAgICAgICAgICAgdGhpcy51aS5kZGlSZWFkLnRvZ2dsZUJsb2NrKGl0ZW1zLnJlYWQpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaVVucmVhZC50b2dnbGVCbG9jayhpdGVtcy51bnJlYWQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGl0ZW1zVG9TaG93OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXMsIGl0ZW1zID0ge307XHJcblxyXG4gICAgICAgICAgICBfLmVhY2godGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpLCBmdW5jdGlvbiAoaXRlbSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9IHRoYXQubWFpbHMuZ2V0KGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgaWYobW9kZWwpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsYWJlbHMgPSBtb2RlbC5nZXQoXCJsYWJlbHNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC51cGRhdGVJdGVtVG9TaG93KGxhYmVscyxpdGVtcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gaXRlbXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB1cGRhdGVJdGVtVG9TaG93OmZ1bmN0aW9uKGxhYmVscyxpdGVtcyl7XHJcblxyXG4gICAgICAgICAgICBpZihfLmhhcyhsYWJlbHMsXCJzdGFycmVkXCIpKXtcclxuICAgICAgICAgICAgICAgIGl0ZW1zW1wibm90LXN0YXJlZFwiXSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgaXRlbXMuc3RhcmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihfLmhhcyhsYWJlbHMsXCJpbXBvcnRhbnRcIikpe1xyXG4gICAgICAgICAgICAgICAgaXRlbXNbXCJub3QtaW1wb3J0YW50XCJdID0gdHJ1ZTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBpdGVtcy5pbXBvcnRhbnQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKF8uaGFzKGxhYmVscyxcInJlYWRcIikpe1xyXG4gICAgICAgICAgICAgICAgaXRlbXMudW5yZWFkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBpdGVtcy5yZWFkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9yZUFjdGlvbnNWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvbW92ZVRvVmlldy5oYnNcIik7XHJcblxyXG5yZXF1aXJlKFwicGx1Z2lucy90b2dnbGUuYmxvY2tcIik7XHJcblxyXG52YXIgTW9yZVZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG4gICAgTW9yZVZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICBjbGFzc05hbWU6ICdtb3ZlVG9WaWV3JyxcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgZGRpSW5ib3g6IFwiLm1vdmVUb0luYm94XCIsXHJcbiAgICAgICAgICAgIGRkaVRyYXNoOiBcIi5tb3ZlVG9UcmFzaFwiLFxyXG4gICAgICAgICAgICBkZGlTcGFtOiBcIi5tb3ZlVG9TcGFtXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpSW5ib3hcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bW92ZVRvXCIsIHt0YXJnZXQ6ICdpbmJveCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpVHJhc2hcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bW92ZVRvXCIsIHt0YXJnZXQ6ICd0cmFzaCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpU3BhbVwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptb3ZlVG9cIiwge3RhcmdldDogJ3NwYW0nfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsICdjaGFuZ2U6bWFpbC5hY3Rpb24nLCB0aGlzLnNob3dSZWxldmFudEl0ZW1zLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNob3dSZWxldmFudEl0ZW1zOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmN1cnJBY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvbi50eXBlXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy51aS5kZGlJbmJveC50b2dnbGVCbG9jayghXy5jb250YWlucyhbXCJpbmJveFwiXSwgdGhpcy5jdXJyQWN0aW9uKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuZGRpU3BhbS50b2dnbGVCbG9jayhfLmNvbnRhaW5zKFtcImluYm94XCIsIFwidHJhc2hcIl0sIHRoaXMuY3VyckFjdGlvbikpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaVRyYXNoLnRvZ2dsZUJsb2NrKF8uY29udGFpbnMoW1wic3BhbVwiLCBcImluYm94XCJdLCB0aGlzLmN1cnJBY3Rpb24pKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vcmVWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvcGFnZXJWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBQYWdlclZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG4gICAgUGFnZXJWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG5cclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiAncGFnZUluZm9WaWV3JyxcclxuICAgICAgICBwYWdlSW5mbzoge30sXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjpcIi5wYWdlcklubmVyQ29udGFpbmVyXCIsXHJcbiAgICAgICAgICAgIGJ0bk5ld2VyOiBcIi5idG5OZXdlclwiLFxyXG4gICAgICAgICAgICBidG5PbGRlcjogXCIuYnRuT2xkZXJcIixcclxuICAgICAgICAgICAgbGJsVG90YWw6IFwiLnRvdGFsXCIsXHJcbiAgICAgICAgICAgIGxibEZyb206IFwiLmxibEZvcm1cIixcclxuICAgICAgICAgICAgbGJsVG86IFwiLmxibFRvXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuYnRuTmV3ZXJcIjogXCJzaG93TmV3ZXJJdGVtc1wiLFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5idG5PbGRlclwiOiBcInNob3dPbGRlckl0ZW1zXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1haWxzLCBcImNoYW5nZTptZXRhZGF0YVwiLHRoaXMuYWRqdXN0UGFnZSwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgdGhpcy5hZGp1c3RQYWdlKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gYWRqdXN0UGFnZVxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBhZGp1c3RQYWdlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZihfLmlzT2JqZWN0KHRoaXMubWFpbHMubWV0YWRhdGEpICYmIHRoaXMubWFpbHMubWV0YWRhdGEudG90YWwgPiAwKXtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVBhZ2VJbmZvKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkanVzdEJ1dHRvbnMoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRqdXN0TGFiZWxzKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVpLmNvbnRhaW5lci5zaG93KCk7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgdGhpcy51aS5jb250YWluZXIuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHVwZGF0ZVBhZ2VJbmZvOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgbWV0YWRhdGEgPSB0aGlzLm1haWxzLm1ldGFkYXRhO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wYWdlSW5mby50b3RhbCA9IG1ldGFkYXRhLnRvdGFsO1xyXG4gICAgICAgICAgICB0aGlzLnBhZ2VJbmZvLmN1cnJQYWdlID0gbWV0YWRhdGEuY3VyclBhZ2UgKyAxO1xyXG4gICAgICAgICAgICB0aGlzLnBhZ2VJbmZvLmZyb20gPSBtZXRhZGF0YS5mcm9tICsgMTtcclxuICAgICAgICAgICAgdGhpcy5wYWdlSW5mby50byA9IE1hdGgubWluKG1ldGFkYXRhLnRvdGFsLCBtZXRhZGF0YS50byArIDEpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBhZGp1c3RCdXR0b25zOiBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy51aS5idG5OZXdlci50b2dnbGVDbGFzcyhcImRpc2FibGVcIix0aGlzLnBhZ2VJbmZvLmZyb20gPT09IDEpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmJ0bk9sZGVyLnRvZ2dsZUNsYXNzKFwiZGlzYWJsZVwiLHRoaXMucGFnZUluZm8udG8gPj0gdGhpcy5wYWdlSW5mby50b3RhbCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGFkanVzdExhYmVsczogZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudWkubGJsRnJvbS50ZXh0KHRoaXMucGFnZUluZm8uZnJvbSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkubGJsVG8udGV4dChNYXRoLm1pbih0aGlzLnBhZ2VJbmZvLnRvLCB0aGlzLnBhZ2VJbmZvLnRvdGFsKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkubGJsVG90YWwudGV4dCh0aGlzLnBhZ2VJbmZvLnRvdGFsKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBidXR0b25zIGNsaWNrXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNob3dOZXdlckl0ZW1zOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5wYWdlSW5mby5mcm9tID4gMSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5hdmlnYXRlKHRoaXMucGFnZUluZm8uY3VyclBhZ2UgLSAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93T2xkZXJJdGVtczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMucGFnZUluZm8udG8gPCB0aGlzLnBhZ2VJbmZvLnRvdGFsKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubmF2aWdhdGUodGhpcy5wYWdlSW5mby5jdXJyUGFnZSArIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG5hdmlnYXRlOiBmdW5jdGlvbihwYWdlKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvblwiKTtcclxuICAgICAgICAgICAgdmFyIHNlYXJjaCA9IGFjdGlvbi5wYXJhbXMucXVlcnkgPyBcIi9cIiArIGFjdGlvbi5wYXJhbXMucXVlcnkgOiBcIlwiO1xyXG4gICAgICAgICAgICBtYWlsLnJvdXRlci5uYXZpZ2F0ZShhY3Rpb24udHlwZSArIHNlYXJjaCArIFwiL3BcIiArIHBhZ2UudG9TdHJpbmcoKSwgeyB0cmlnZ2VyOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGFnZXJWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgUGFnZXJWaWV3ID0gcmVxdWlyZShcIi4vX3BhZ2VyVmlld1wiKTtcclxudmFyIE1vdmVUb1ZpZXcgPSByZXF1aXJlKFwiLi9fbW92ZVRvVmlld1wiKTtcclxudmFyIE1vcmVBY3Rpb25zVmlldyA9IHJlcXVpcmUoXCIuL19tb3JlQWN0aW9uc1ZpZXdcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9hY3Rpb25WaWV3Lmhic1wiKTtcclxuXHJcbnZhciBBY3Rpb25WaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuICAgIEFjdGlvblZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogJ2FjdGlvblZpZXcnLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBidG5TZWxlY3Q6IFwiLmJ0blNlbGVjdFwiLFxyXG4gICAgICAgICAgICBidG5Nb3ZlVG86IFwiLmJ0bk1vdmVUb1wiLFxyXG4gICAgICAgICAgICBidG5EZWxldGU6IFwiLmJ0bkRlbGV0ZVwiLFxyXG4gICAgICAgICAgICBidG5Nb3JlOiBcIi5idG5Nb3JlXCIsXHJcbiAgICAgICAgICAgIHBhZ2VyUmVnaW9uOiBcIi5wYWdlclwiLFxyXG4gICAgICAgICAgICBzZXJ2ZXJBY3Rpb25zUmVnaW9uOiBcIi5zZXJ2ZXJBY3Rpb25zXCIsXHJcbiAgICAgICAgICAgIGxibENvbXBvc2U6XCIubGJsQ29tcG9zZVwiLFxyXG4gICAgICAgICAgICBidG5EaXNjYXJkRHJhZnRzOiBcIi5idG5EaXNjYXJkRHJhZnRzXCIsXHJcbiAgICAgICAgICAgIGJ0bkRlbGV0ZUZvcmV2ZXI6IFwiLmJ0bkRlbGV0ZUZvcmV2ZXJcIixcclxuICAgICAgICAgICAgYnRuTm90U3BhbTogXCIuYnRuTm90U3BhbVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgIFwiY2xpY2sgLnNlbGVjdEFsbFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpzZWxlY3RcIiwge3NlbGVjdEJ5OiBcImFsbFwifSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgLnNlbGVjdE5vbmVcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6c2VsZWN0XCIsIHtzZWxlY3RCeTogXCJub25lXCJ9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayAuc2VsZWN0UmVhZFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpzZWxlY3RcIiwge3NlbGVjdEJ5OiBcInJlYWRcIn0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIC5zZWxlY3RVbnJlYWRcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6c2VsZWN0XCIsIHtzZWxlY3RCeTogXCJ1bnJlYWRcIn0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5idG5EZWxldGVcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bW92ZVRvXCIsIHt0YXJnZXQ6ICd0cmFzaCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuYnRuTm90U3BhbVwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptb3ZlVG9cIiwge3RhcmdldDogJ2luYm94J30pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5idG5EaXNjYXJkRHJhZnRzXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOmRlbGV0ZVwiKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuYnRuRGVsZXRlRm9yZXZlclwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpkZWxldGVcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgXCJtYWlsOmNoYW5nZVwiLCB0aGlzLm9uTWFpbENoYW5nZSwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6c2VsZWN0aW9uXCIsIHRoaXMuc2hvd1JlbGV2YW50SXRlbXMsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKGFwcC5jb250ZXh0LCAnY2hhbmdlOm1haWwuYWN0aW9uJywgdGhpcy5zaG93UmVsZXZhbnRJdGVtcywgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm57XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246IF9zLmNhcGl0YWxpemUoYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb24udHlwZVwiKSlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wYWdlclZpZXcgPSBuZXcgUGFnZXJWaWV3KHtcclxuICAgICAgICAgICAgICAgIGVsOiB0aGlzLnVpLnBhZ2VyUmVnaW9uXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnBhZ2VyVmlldy5yZW5kZXIoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubW9yZUFjdGlvbnNWaWV3ID0gbmV3IE1vcmVBY3Rpb25zVmlldyh7XHJcbiAgICAgICAgICAgICAgICBlbDogdGhpcy51aS5idG5Nb3JlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLm1vcmVBY3Rpb25zVmlldy5yZW5kZXIoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubW92ZVRvVmlldyA9IG5ldyBNb3ZlVG9WaWV3KHtcclxuICAgICAgICAgICAgICAgIGVsOiB0aGlzLnVpLmJ0bk1vdmVUb1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5tb3ZlVG9WaWV3LnJlbmRlcigpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gc2hvd1JlbGV2YW50SXRlbXNcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93UmVsZXZhbnRJdGVtczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uLnR5cGVcIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJlc2V0VUkoKTtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY29tcG9zZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0l0ZW1zKFtcImxibENvbXBvc2VcIl0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dMaXN0T3B0aW9ucyhhY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJlc2V0VUk6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0l0ZW1zKF8ua2V5cyh0aGlzLnVpKSwgZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmxibENvbXBvc2UudGV4dChhcHAudHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOm5ld01lc3NhZ2VcIikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNob3dMaXN0T3B0aW9uczogZnVuY3Rpb24gKGFjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zaG93SXRlbXMoW1wiYnRuU2VsZWN0XCIsIFwicGFnZXJSZWdpb25cIl0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFfLmlzRW1wdHkodGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImRyYWZ0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0l0ZW1zKFtcImJ0blNlbGVjdFwiLCBcImJ0bkRpc2NhcmREcmFmdHNcIiwgXCJidG5Nb3JlXCJdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNwYW1cIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SXRlbXMoW1wiYnRuU2VsZWN0XCIsIFwiYnRuTm90U3BhbVwiLCBcImJ0bkRlbGV0ZUZvcmV2ZXJcIiwgXCJidG5Nb3JlXCJdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRyYXNoXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0l0ZW1zKFtcImJ0blNlbGVjdFwiLCBcImJ0bkRlbGV0ZUZvcmV2ZXJcIiwgXCJidG5Nb3ZlVG9cIiwgXCJidG5Nb3JlXCJdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SXRlbXMoW1wiYnRuU2VsZWN0XCIsIFwiYnRuRGVsZXRlXCIsIFwiYnRuTW92ZVRvXCIsIFwiYnRuTW9yZVwiXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvd0l0ZW1zOiBmdW5jdGlvbiAoaXRlbXMsIHNob3cpIHtcclxuXHJcbiAgICAgICAgICAgIHNob3cgPSBfLmlzQm9vbGVhbihzaG93KSA/IHNob3cgOiB0cnVlO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBfLmJpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudWlbaXRlbV0udG9nZ2xlKHNob3cpO1xyXG4gICAgICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBvbk1haWxDaGFuZ2VcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbk1haWxDaGFuZ2U6ZnVuY3Rpb24obWFpbE1vZGVsKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdWJqZWN0ID0gbWFpbE1vZGVsLmdldCgnc3ViamVjdCcpO1xyXG5cclxuICAgICAgICAgICAgaWYoXy5pc0VtcHR5KHN1YmplY3QpKXtcclxuICAgICAgICAgICAgICAgIHN1YmplY3QgPSBhcHAudHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOm5ld01lc3NhZ2VcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy51aS5sYmxDb21wb3NlLnRleHQoc3ViamVjdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBY3Rpb25WaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgVGFncyA9IHJlcXVpcmUoXCJ0YWdzXCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlID0gcmVxdWlyZShcImF1dG9Db21wbGV0ZVwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL19hZGRyZXNzVmlldy5oYnNcIik7XHJcbnZhciBDb250YWN0c0ZpbHRlck1vZGVsID0gcmVxdWlyZShcIm1haWwtbW9kZWxzL2NvbnRhY3RzRmlsdGVyTW9kZWxcIik7XHJcblxyXG52YXIgQWRkcmVzc1ZpZXcgPXt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsICBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG4gICAgQWRkcmVzc1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGNsYXNzTmFtZTogJ2FkZHJlc3NWaWV3JyxcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIHRhZ3NQbGFjZWhvbGRlcjogXCIudGFnc1BsYWNlaG9sZGVyXCIsXHJcbiAgICAgICAgICAgIGF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyOiBcIi5hdXRvQ29tcGxldGVQbGFjZWhvbGRlclwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gaW5pdGlhbGl6ZVxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOmZ1bmN0aW9uKG9wdGlvbnMpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tb2RlbEF0dHIgPSBvcHRpb25zLm1vZGVsQXR0cjtcclxuICAgICAgICAgICAgdGhpcy52ZW50ID0gbmV3IEJhY2tib25lLldyZXFyLkV2ZW50QWdncmVnYXRvcigpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwiY29udGFjdDpjb2xsZWN0aW9uXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcInRhZzphZGRcIiwgdGhpcy5hZGRBZGRyZXNzLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsIFwidGFnOnJlbW92ZVwiLCB0aGlzLnJlbW92ZUFkZHJlc3MsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJpbnB1dDpjaGFuZ2VcIiwgdGhpcy51cGRhdGVMYXN0QWRkcmVzcywgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5jb250YWN0cywgXCJmZXRjaDpzdWNjZXNzXCIsIHRoaXMucmVuZGVyQXV0b0NvbXBvbmVudCwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25SZW5kZXJcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25SZW5kZXI6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyVGFnQ29tcG9uZW50KCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQXV0b0NvbXBvbmVudCgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW5kZXJUYWdDb21wb25lbnQ6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudGFncyA9IG5ldyBUYWdzKHtcclxuICAgICAgICAgICAgICAgIGVsOnRoaXMudWkudGFnc1BsYWNlaG9sZGVyLFxyXG4gICAgICAgICAgICAgICAgdmVudDogdGhpcy52ZW50LFxyXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yOiB0aGlzLm1vZGVsLnZhbGlkYXRlQWRkcmVzcyxcclxuICAgICAgICAgICAgICAgIGluaXRpYWxUYWdzOiB0aGlzLmdldEFkZHJlc3NlcygpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnRhZ3Muc2hvdygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW5kZXJBdXRvQ29tcG9uZW50OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICBpZighdGhpcy5hdXRvQ29tcGxldGUgJiYgIXRoaXMuY29udGFjdHMuaXNFbXB0eSgpKXtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmF1dG9Db21wbGV0ZSA9IG5ldyBBdXRvQ29tcGxldGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudCxcclxuICAgICAgICAgICAgICAgICAgICBpdGVtczogdGhpcy5nZXRDb250YWN0QXJyYXkoKSxcclxuICAgICAgICAgICAgICAgICAgICBlbDp0aGlzLnVpLmF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlck1vZGVsOiBuZXcgQ29udGFjdHNGaWx0ZXJNb2RlbCgpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZ2V0Q29udGFjdEFycmF5OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgX2NvbnRhY3RzID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RzLmVhY2goZnVuY3Rpb24obW9kZWwpe1xyXG4gICAgICAgICAgICAgICAgX2NvbnRhY3RzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IG1vZGVsLmdldChcInRpdGxlXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtb2RlbC5nZXQoXCJhZGRyZXNzXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IEF1dG9Db21wbGV0ZS5UWVBFUy5DT05UQUNUXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBfY29udGFjdHM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBnZXRBZGRyZXNzZXM6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXMgPSBbXSwgYWRkcmVzc2VzID0gdGhpcy5tb2RlbC5nZXQodGhpcy5tb2RlbEF0dHIpO1xyXG5cclxuICAgICAgICAgICAgaWYoIV8uaXNFbXB0eShhZGRyZXNzZXMpKXtcclxuICAgICAgICAgICAgICAgIHZhciBhZGRyZXNzQXJyID0gX3Muc3RyTGVmdEJhY2soYWRkcmVzc2VzLCBcIjtcIikuc3BsaXQoXCI7XCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIF8uZWFjaChhZGRyZXNzQXJyLCBmdW5jdGlvbihhZGRyZXNzKXtcclxuICAgICAgICAgICAgICAgICAgICByZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6bWFpbC5kYXRhQ29udHJvbGxlci5jb250YWN0Q29sbGVjdGlvbi5nZXRUaXRsZXMoW2FkZHJlc3NdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6YWRkcmVzc1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGFkZEFkZHJlc3M6IGZ1bmN0aW9uKGFkZHJlc3Mpe1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmFkZEFkZHJlc3ModGhpcy5tb2RlbEF0dHIsIGFkZHJlc3MpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdXBkYXRlTGFzdEFkZHJlc3M6IGZ1bmN0aW9uKGFkZHJlc3Mpe1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLnVwZGF0ZUxhc3RBZGRyZXNzKHRoaXMubW9kZWxBdHRyLCBhZGRyZXNzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJlbW92ZUFkZHJlc3M6IGZ1bmN0aW9uKGFkZHJlc3Mpe1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLnJlbW92ZUFkZHJlc3ModGhpcy5tb2RlbEF0dHIsIGFkZHJlc3MpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWRkcmVzc1ZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBBZGRyZXNzVmlldyA9IHJlcXVpcmUoXCIuL19hZGRyZXNzVmlld1wiKTtcclxudmFyIE1haWxNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9tYWlsTW9kZWxcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9jb21wb3NlVmlldy5oYnNcIik7XHJcblxyXG52YXIgQ29tcG9zZVZpZXcgPXt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBtYiwgIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcbiAgICBDb21wb3NlVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiAnY29tcG9zZVZpZXcnLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICB0b0lucHV0V3JhcHBlcjogXCIudG9JbnB1dFdyYXBwZXJcIixcclxuICAgICAgICAgICAgY2NJbnB1dFdyYXBwZXI6IFwiLmNjSW5wdXRXcmFwcGVyXCIsXHJcbiAgICAgICAgICAgIGlucHV0U3ViamVjdDogXCIuc3ViamVjdFwiLFxyXG4gICAgICAgICAgICBpbnB1dEVkaXRvcjogXCIuY29tcG9zZS1lZGl0b3JcIixcclxuICAgICAgICAgICAgaGVhZGVyOlwiLmNvbXBvc2UtaGVhZGVyXCIsXHJcbiAgICAgICAgICAgIGNjTGluZTogJy5jY0xpbmUnLFxyXG4gICAgICAgICAgICBzZW5kQnRuOlwiLnNlbmRCdG5cIixcclxuICAgICAgICAgICAgY2xvc2VCdG46XCIuY2xvc2VCdG5cIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNsaWNrICBAdWkuY2xvc2VCdG5cIjogXCJvbkNsb3NlQnRuQ2xpY2tcIixcclxuICAgICAgICAgICAgXCJjbGljayAgQHVpLnNlbmRCdG5cIjogXCJvblNlbmRDbGlja1wiLFxyXG4gICAgICAgICAgICBcImJsdXIgICBAdWkuaW5wdXRTdWJqZWN0XCI6IFwib25TdWJqZWN0Qmx1clwiLFxyXG4gICAgICAgICAgICBcImJsdXIgICBAdWkuaW5wdXRFZGl0b3JcIjogXCJvbkVkaXRvckJsdXJcIixcclxuICAgICAgICAgICAgXCJjbGljayAgQHVpLnRvSW5wdXRXcmFwcGVyXCI6IFwib25Ub0lucHV0V3JhcHBlckNsaWNrXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgIEB1aS5jY0lucHV0V3JhcHBlclwiOiBcIm9uQ2NJbnB1dFdyYXBwZXJDbGlja1wiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbW9kZWxFdmVudHM6e1xyXG4gICAgICAgICAgY2hhbmdlOlwib25Nb2RlbENoYW5nZVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTpmdW5jdGlvbihvcHRpb25zKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdHMgPSBvcHRpb25zLmNvbnRhY3RzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25SZW5kZXJcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJUb1ZpZXcoKTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJDY1ZpZXcoKTtcclxuICAgICAgICAgICAgdGhpcy51aS5pbnB1dEVkaXRvci5odG1sKHRoaXMubW9kZWwuZ2V0KCdib2R5JykpO1xyXG4gICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcmVuZGVyVG9WaWV3OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRvVmlldyA9IG5ldyBBZGRyZXNzVmlldyh7XHJcbiAgICAgICAgICAgICAgICBtb2RlbDp0aGlzLm1vZGVsLFxyXG4gICAgICAgICAgICAgICAgbW9kZWxBdHRyOid0bycsXHJcbiAgICAgICAgICAgICAgICBlbDogdGhpcy51aS50b0lucHV0V3JhcHBlclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy50b1ZpZXcucmVuZGVyKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJlbmRlckNjVmlldzpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jY1ZpZXcgPSBuZXcgQWRkcmVzc1ZpZXcoe1xyXG4gICAgICAgICAgICAgICAgbW9kZWw6dGhpcy5tb2RlbCxcclxuICAgICAgICAgICAgICAgIG1vZGVsQXR0cjonY2MnLFxyXG4gICAgICAgICAgICAgICAgZWw6IHRoaXMudWkuY2NJbnB1dFdyYXBwZXJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuY2NWaWV3LnJlbmRlcigpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGV2ZW50cyBoYW5kbGVyc1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblN1YmplY3RCbHVyOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLnNldCgnc3ViamVjdCcsIHRoaXMudWkuaW5wdXRTdWJqZWN0LnZhbCgpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25FZGl0b3JCbHVyOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLnNldCgnYm9keScsdGhpcy51aS5pbnB1dEVkaXRvci5odG1sKCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblNlbmRDbGljazpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpzZW5kXCIsdGhpcy5tb2RlbCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uQ2xvc2VCdG5DbGljazpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpkaXNjYXJkXCIsdGhpcy5tb2RlbCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uVG9JbnB1dFdyYXBwZXJDbGljazpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLnVpLnRvSW5wdXRXcmFwcGVyLnJlbW92ZUNsYXNzKFwiZXJyb3JcIik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uQ2NJbnB1dFdyYXBwZXJDbGljazpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLnVpLmNjSW5wdXRXcmFwcGVyLnJlbW92ZUNsYXNzKFwiZXJyb3JcIik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uTW9kZWxDaGFuZ2U6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6Y2hhbmdlXCIsdGhpcy5tb2RlbCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uSW52YWxpZDpmdW5jdGlvbihtb2RlbCwgZXJyb3Ipe1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoKGVycm9yKXtcclxuICAgICAgICAgICAgICAgIGNhc2UgTWFpbE1vZGVsLkVycm9ycy5Ob1JlY2lwaWVudDogY2FzZSBNYWlsTW9kZWwuRXJyb3JzLkludmFsaWRUb0FkZHJlc3M6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51aS50b0lucHV0V3JhcHBlci5hZGRDbGFzcyhcImVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBNYWlsTW9kZWwuRXJyb3JzLkludmFsaWRDY0FkZHJlc3M6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51aS5jY0lucHV0V3JhcHBlci5hZGRDbGFzcyhcImVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb21wb3NlVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL2VtcHR5Rm9sZGVyVmlldy5oYnNcIik7XHJcblxyXG52YXIgRW1wdHlGb2xkZXJWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBFbXB0eUZvbGRlclZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGlzUGVybWFuZW50OiB0cnVlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogXCJlbXB0eS1mb2xkZXJcIixcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgXCJtc2dUaXRsZVwiOiBcIi5tc2dUaXRsZVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1haWxzLCBcImNoYW5nZTppdGVtcyB1cGRhdGU6c3VjY2VzcyBkZWxldGU6c3VjY2VzcyBmZXRjaDpzdWNjZXNzXCIsIHRoaXMuX2NoZWNrSWZFbXB0eSwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfY2hlY2tJZkVtcHR5OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgaXNFbXB0eSA9IHRoaXMubWFpbHMuaXNFbXB0eSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzRW1wdHkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvblwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudWkubXNnVGl0bGUuaHRtbChhcHAudHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOmVtcHR5Rm9sZGVyLlwiICsgYWN0aW9uLnR5cGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLiRlbC50b2dnbGUoaXNFbXB0eSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbXB0eUZvbGRlclZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9lbXB0eU1haWxWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBFbXB0eU1haWxWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBFbXB0eU1haWxWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICBpc1Blcm1hbmVudDogdHJ1ZSxcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgY291bnRlcjogXCIuY291bnRlclwiLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIi5tZXNzYWdlXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6c2VsZWN0aW9uXCIsIHRoaXMub25TZWxlY3Rpb25DaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25TZWxlY3Rpb25DaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMubWFpbHMuZ2V0U2VsZWN0ZWQoKS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVpLmNvdW50ZXIuaHRtbChzZWxlY3RlZCk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuY291bnRlci50b2dnbGUoc2VsZWN0ZWQgPiAwKTtcclxuICAgICAgICAgICAgdGhpcy51aS5tZXNzYWdlLnRvZ2dsZShzZWxlY3RlZCA9PT0gMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbXB0eU1haWxWaWV3O1xyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIGxheW91dFRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL2NvbnRlbnRMYXlvdXQuaGJzXCIpO1xyXG5cclxudmFyIENvbnRlbnRMYXlvdXQgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIENvbnRlbnRMYXlvdXQgPSBNYXJpb25ldHRlLkxheW91dFZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTogbGF5b3V0VGVtcGxhdGUsXHJcbiAgICAgICAgaXNQZXJtYW5lbnQ6IHRydWUsXHJcbiAgICAgICAgcmVnaW9uczoge1xyXG4gICAgICAgICAgICBpdGVtc1JlZ2lvbjogXCIubWFpbC1pdGVtcy1yZWdpb25cIixcclxuICAgICAgICAgICAgcHJldmlld1JlZ2lvbjogXCIubWFpbC1wcmV2aWV3LXJlZ2lvblwiLFxyXG4gICAgICAgICAgICBtZXNzYWdlQm9hcmQ6IFwiLm1haWwtbWVzc2FnZS1ib2FyZC1yZWdpb25cIlxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29udGVudExheW91dDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIGZvcm1hdHRlciA9IHJlcXVpcmUoXCJyZXNvbHZlcnMvZm9ybWF0dGVyXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvbWFpbEl0ZW1WaWV3Lmhic1wiKTtcclxuXHJcbnZhciBNYWlsVGFibGVSb3dWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBNYWlsVGFibGVSb3dWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICB0YWdOYW1lOiAndHInLFxyXG4gICAgICAgIGNsYXNzTmFtZTogJ2luYm94X3JvdycsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIGNoZWNrQm94OiBcIi5jaGtCb3hcIixcclxuICAgICAgICAgICAgc2VsZWN0b3I6IFwiLnNlbGVjdG9yXCIsXHJcbiAgICAgICAgICAgIHN0YXJJY29uOiBcIi5zdGFyLWljb25cIixcclxuICAgICAgICAgICAgaW1wSWNvbjogXCIuaW1wb3J0YW5jZS1pY29uXCIsXHJcbiAgICAgICAgICAgIGFkZHJlc3M6IFwiLmFkZHJlc3NcIixcclxuICAgICAgICAgICAgc3ViamVjdDogXCIuc3ViamVjdFwiLFxyXG4gICAgICAgICAgICBib2R5OiBcIi5ib2R5XCIsXHJcbiAgICAgICAgICAgIHNlbnRUaW1lOiBcIi5zZW50VGltZVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHJpZ2dlcnM6IHtcclxuICAgICAgICAgICAgXCJjbGljayAuc3RhclwiOiBcImNsaWNrXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgLmltcG9ydGFuY2VcIjogXCJjbGlja1wiLFxyXG4gICAgICAgICAgICBcImNsaWNrIC5hZGRyZXNzXCI6IFwiY2xpY2tcIixcclxuICAgICAgICAgICAgXCJjbGljayAuY29udGVudFwiOiBcImNsaWNrXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgLnNlbnRUaW1lXCI6IFwiY2xpY2tcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNsaWNrIC5zZWxlY3RvclwiOiBcIm9uUm93U2VsZWN0XCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBtb2RlbEV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNoYW5nZTpzdWJqZWN0XCI6IFwiX29uU3ViamVjdENoYW5nZWRcIixcclxuICAgICAgICAgICAgXCJjaGFuZ2U6Ym9keVwiOiBcIl9vbkJvZHlDaGFuZ2VkXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uLnR5cGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJjb250YWN0OmNvbGxlY3Rpb25cIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmxhYmVscy4qXCIsIHRoaXMudG9nZ2xlVUkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHRlbXBsYXRlSGVscGVyc1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBpc0luYm94OiB0aGlzLmFjdGlvbiA9PT0gXCJpbmJveFwiLFxyXG4gICAgICAgICAgICAgICAgaXNTZW50OiB0aGlzLmFjdGlvbiA9PT0gXCJzZW50XCIsXHJcbiAgICAgICAgICAgICAgICBpc0RyYWZ0OiB0aGlzLmFjdGlvbiA9PT0gXCJkcmFmdFwiLFxyXG4gICAgICAgICAgICAgICAgaXNUcmFzaDogdGhpcy5hY3Rpb24gPT09IFwidHJhc2hcIixcclxuICAgICAgICAgICAgICAgIGlzU3BhbTogdGhpcy5hY3Rpb24gPT09IFwic3BhbVwiLFxyXG4gICAgICAgICAgICAgICAgaXNTZWFyY2g6IHRoaXMuYWN0aW9uID09PSBcInNlYXJjaFwiLFxyXG5cclxuICAgICAgICAgICAgICAgIGJvZHk6IGZvcm1hdHRlci5mb3JtYXRDb250ZW50KHRoaXMubW9kZWwuZ2V0KFwiYm9keVwiKSksXHJcbiAgICAgICAgICAgICAgICBzdWJqZWN0OiBmb3JtYXR0ZXIuZm9ybWF0U3ViamVjdCh0aGlzLm1vZGVsLmdldChcInN1YmplY3RcIiksYXBwLnRyYW5zbGF0b3IpLFxyXG4gICAgICAgICAgICAgICAgc2VudFRpbWU6IGZvcm1hdHRlci5mb3JtYXRTaG9ydERhdGUodGhpcy5tb2RlbC5nZXQoXCJzZW50VGltZVwiKSxhcHAudHJhbnNsYXRvciksXHJcbiAgICAgICAgICAgICAgICB0bzogZm9ybWF0dGVyLmZvcm1hdEFkZHJlc3Nlcyh0aGlzLmNvbnRhY3RzLmdldFRpdGxlcyh0aGlzLm1vZGVsLmdldE91dGdvaW5nQWRkcmVzc2VzKCkpKSxcclxuICAgICAgICAgICAgICAgIGZyb206IGZvcm1hdHRlci5mb3JtYXRBZGRyZXNzZXModGhpcy5jb250YWN0cy5nZXRUaXRsZXModGhpcy5tb2RlbC5nZXRJbmdvaW5nQWRkcmVzc2VzKCkpKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG9uUmVuZGVyXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZVVJKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U2VsZWN0aW9uKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRvZ2dsZVVJOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbGFiZWxzID0gdGhpcy5tb2RlbC5nZXQoXCJsYWJlbHNcIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVpLnNlbnRUaW1lLnRvZ2dsZUNsYXNzKFwidW5yZWFkXCIsICFfLmhhcyhsYWJlbHMsICdyZWFkJykpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmFkZHJlc3MudG9nZ2xlQ2xhc3MoXCJ1bnJlYWRcIiwgIV8uaGFzKGxhYmVscywgJ3JlYWQnKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuc3ViamVjdC50b2dnbGVDbGFzcyhcInVucmVhZFwiLCAhXy5oYXMobGFiZWxzLCAncmVhZCcpKTtcclxuICAgICAgICAgICAgdGhpcy51aS5zdGFySWNvbi50b2dnbGVDbGFzcyhcImRpc2FibGVcIiwgIV8uaGFzKGxhYmVscywgJ3N0YXJyZWQnKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuaW1wSWNvbi50b2dnbGVDbGFzcyhcImRpc2FibGVcIiwgIV8uaGFzKGxhYmVscywgJ2ltcG9ydGFudCcpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZXRTZWxlY3Rpb246IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMubW9kZWwuY29sbGVjdGlvbi5pc1NlbGVjdGVkKHRoaXMubW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy4kZWwudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJywgc2VsZWN0ZWQpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmNoZWNrQm94LnByb3AoJ2NoZWNrZWQnLCBzZWxlY3RlZCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gZGF0YUNoYW5nZWRcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX29uU3ViamVjdENoYW5nZWQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudWkuc3ViamVjdC50ZXh0KGZvcm1hdHRlci5mb3JtYXRTdWJqZWN0KHRoaXMubW9kZWwuZ2V0KFwic3ViamVjdFwiKSksYXBwLnRyYW5zbGF0b3IpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfb25Cb2R5Q2hhbmdlZDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy51aS5ib2R5LnRleHQoZm9ybWF0dGVyLmZvcm1hdENvbnRlbnQodGhpcy5tb2RlbC5nZXQoXCJib2R5XCIpKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gcm93RXZlbnRzXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUm93U2VsZWN0OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbFRhYmxlOkl0ZW1DbGlja2VkXCIsIG51bGwpO1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmNvbGxlY3Rpb24udG9nZ2xlU2VsZWN0aW9uKHRoaXMubW9kZWwsIHtjYWxsZXJOYW1lOiAnaXRlbVZpZXcnfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG1hcmtBc0NsaWNrZWQ6IGZ1bmN0aW9uIChjbGlja2VkKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLiRlbC50b2dnbGVDbGFzcygnY2xpY2tlZFJvdycsIGNsaWNrZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsVGFibGVSb3dWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgbGF5b3V0VGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvbWFpbkxheW91dC5oYnNcIik7XHJcblxyXG52YXIgTWFpbExheW91dCA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsICBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgTWFpbExheW91dCA9IE1hcmlvbmV0dGUuTGF5b3V0Vmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOmxheW91dFRlbXBsYXRlLFxyXG4gICAgICAgIGlzUGVybWFuZW50OnRydWUsXHJcbiAgICAgICAgcmVnaW9uczp7XHJcbiAgICAgICAgICAgIG5hdlJlZ2lvbjpcIi5tYWlsLW5hdi1yZWdpb25cIixcclxuICAgICAgICAgICAgd29ya1JlZ2lvbjpcIi5tYWlsLXdvcmstcmVnaW9uXCJcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1haWxMYXlvdXQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9tYWlsc1ZpZXcuaGJzXCIpO1xyXG52YXIgTWFpbGFibGVSb3dWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvbWFpbEl0ZW1WaWV3XCIpO1xyXG5cclxudmFyIE1haWxUYWJsZVZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxUYWJsZVZpZXcgPSBNYXJpb25ldHRlLkNvbXBvc2l0ZVZpZXcuZXh0ZW5kKHtcclxuICAgICAgICBuYW1lOiAnbWFpbFRhYmxlJyxcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgY2hpbGRWaWV3OiBNYWlsYWJsZVJvd1ZpZXcsXHJcbiAgICAgICAgY2hpbGRWaWV3Q29udGFpbmVyOiBcInRib2R5XCIsXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcywgXCJjaGlsZHZpZXc6Y2xpY2tcIiwgdGhpcy5faGFuZGxlQ2hpbGRDbGljayk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5jb2xsZWN0aW9uLCBcImNoYW5nZTpzZWxlY3Rpb25cIiwgdGhpcy5vblNlbGVjdGlvbkNoYW5nZSwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25TZWxlY3Rpb25DaGFuZ2VcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25TZWxlY3Rpb25DaGFuZ2U6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNhbGxlck5hbWUgIT09ICdpdGVtVmlldycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uZWFjaChfLmJpbmQoZnVuY3Rpb24gKHZpZXcpIHtcclxuICAgICAgICAgICAgICAgICAgICB2aWV3LnNldFNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZpZXcubWFya0FzQ2xpY2tlZCh0aGlzLmNvbGxlY3Rpb24uZ2V0U2VsZWN0ZWQoKS5sZW5ndGggPT09IDAgJiYgdmlldyA9PT0gdGhpcy5jbGlja2VkSXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2hhbmRsZUNoaWxkQ2xpY2s6IGZ1bmN0aW9uIChfaXRlbVZpZXcpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uZWFjaChmdW5jdGlvbiAoaXRlbVZpZXcpIHtcclxuICAgICAgICAgICAgICAgIGl0ZW1WaWV3Lm1hcmtBc0NsaWNrZWQoZmFsc2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfaXRlbVZpZXcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tlZEl0ZW0gPSBfaXRlbVZpZXc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrZWRJdGVtLm1hcmtBc0NsaWNrZWQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbFRhYmxlOkl0ZW1DbGlja2VkXCIsIHRoaXMuY2xpY2tlZEl0ZW0ubW9kZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE1haWxUYWJsZVZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9uYXZWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBOYXZWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBOYXZWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsICdjaGFuZ2U6bWFpbC5hY3Rpb24nLCB0aGlzLm9uQWN0aW9uQ2hhbmdlLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uQWN0aW9uQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLiRlbC5maW5kKCdsaScpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb24udHlwZVwiKTtcclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZCgnLm5hdi0nICsgYWN0aW9uKS5hZGRDbGFzcygnc2VsZWN0ZWQnKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE5hdlZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBmb3JtYXR0ZXIgPSByZXF1aXJlKFwicmVzb2x2ZXJzL2Zvcm1hdHRlclwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL3ByZXZpZXdWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBQcmV2aWV3VmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgUHJldmlld1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBzdWJqZWN0OiBcIi5zdWJqZWN0XCIsXHJcbiAgICAgICAgICAgIHRvOiBcIi50b1wiLFxyXG4gICAgICAgICAgICBmcm9tOiBcIi5mcm9tXCIsXHJcbiAgICAgICAgICAgIGJvZHk6IFwiLmJvZHlcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJjb250YWN0OmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN1YmplY3Q6IGZvcm1hdHRlci5mb3JtYXRTdWJqZWN0KHRoaXMubW9kZWwuZ2V0KFwic3ViamVjdFwiKSwgYXBwLnRyYW5zbGF0b3IpLFxyXG4gICAgICAgICAgICAgICAgdG86IGZvcm1hdHRlci5mb3JtYXRBZGRyZXNzZXModGhpcy5jb250YWN0cy5nZXRUaXRsZXModGhpcy5tb2RlbC5nZXRPdXRnb2luZ0FkZHJlc3NlcygpKSksXHJcbiAgICAgICAgICAgICAgICBmcm9tOiBmb3JtYXR0ZXIuZm9ybWF0QWRkcmVzc2VzKHRoaXMuY29udGFjdHMuZ2V0VGl0bGVzKHRoaXMubW9kZWwuZ2V0SW5nb2luZ0FkZHJlc3NlcygpKSlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlbC5oYXMoXCJyZWxhdGVkQm9keVwiKSkge1xyXG4gICAgICAgICAgICAgICAgLy9yZXF1aXJlKFtcIm9uRGVtYW5kTG9hZGVyIXRleHQhYXBwL2Fzc2V0cy9kYXRhL1wiICsgdGhpcy5tb2RlbC5nZXQoXCJyZWxhdGVkQm9keVwiKSArIFwiLnR4dFwiXSwgXy5iaW5kKGZ1bmN0aW9uICh0ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAvLyAgICB0aGlzLnVpLmJvZHkuaHRtbCh0ZXh0KTtcclxuICAgICAgICAgICAgICAgIC8vfSwgdGhpcykpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51aS5ib2R5Lmh0bWwodGhpcy5tb2RlbC5nZXQoXCJib2R5XCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJldmlld1ZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9zZWFyY2hWaWV3Lmhic1wiKTtcclxudmFyIENvbnRhY3RzRmlsdGVyTW9kZWwgPSByZXF1aXJlKFwibWFpbC1tb2RlbHMvY29udGFjdHNGaWx0ZXJNb2RlbFwiKTtcclxudmFyIEF1dG9Db21wbGV0ZSA9IHJlcXVpcmUoXCJ1aS1jb21wb25lbnRzL2F1dG9Db21wbGV0ZS9hdXRvQ29tcGxldGVcIik7XHJcbnZhciBTZWFyY2hDb21wb25lbnQgPSByZXF1aXJlKFwidWktY29tcG9uZW50cy9zZWFyY2gvc2VhcmNoXCIpO1xyXG5cclxudmFyIFNlYXJjaFZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIFNlYXJjaFZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogXCJzZWFyY2hQYW5lbFwiLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBzZWFyY2hQbGFjZWhvbGRlcjogXCIuc2VhcmNoLXBsYWNlaG9sZGVyXCIsXHJcbiAgICAgICAgICAgIGF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyOiBcIi5hdXRvQ29tcGxldGVQbGFjZWhvbGRlclwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy52ZW50ID0gbmV3IEJhY2tib25lLldyZXFyLkV2ZW50QWdncmVnYXRvcigpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwiY29udGFjdDpjb2xsZWN0aW9uXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcInNlYXJjaFwiLCB0aGlzLnNlYXJjaCwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsIFwiY2hhbmdlOm1haWwuYWN0aW9uXCIsIHRoaXMub25BY3Rpb25DaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMuY29udGFjdHMsIFwiZmV0Y2g6c3VjY2Vzc1wiLCB0aGlzLnJlbmRlckF1dG9Db21wb25lbnQsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25SZW5kZXJcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJTZWFyY2hDb21wb25lbnQoKTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJBdXRvQ29tcG9uZW50KCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcmVuZGVyU2VhcmNoQ29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaENvbXBvbmVudCA9IG5ldyBTZWFyY2hDb21wb25lbnQoe1xyXG4gICAgICAgICAgICAgICAgZWw6IHRoaXMudWkuc2VhcmNoUGxhY2Vob2xkZXIsXHJcbiAgICAgICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiBhcHAudHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOnNlYXJjaC5jYXB0aW9uXCIpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaENvbXBvbmVudC5yZW5kZXIoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW5kZXJBdXRvQ29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuYXV0b0NvbXBsZXRlICYmICF0aGlzLmNvbnRhY3RzLmlzRW1wdHkoKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlID0gbmV3IEF1dG9Db21wbGV0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHRoaXMuZ2V0Q29udGFjdEFycmF5KCksXHJcbiAgICAgICAgICAgICAgICAgICAgZWw6IHRoaXMudWkuYXV0b0NvbXBsZXRlUGxhY2Vob2xkZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyTW9kZWw6IG5ldyBDb250YWN0c0ZpbHRlck1vZGVsKCksXHJcbiAgICAgICAgICAgICAgICAgICAgdmVudDogdGhpcy52ZW50XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGdldENvbnRhY3RBcnJheTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIF9jb250YWN0cyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250YWN0cy5lYWNoKGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgX2NvbnRhY3RzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IG1vZGVsLmdldChcInRpdGxlXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtb2RlbC5nZXQoXCJhZGRyZXNzXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IEF1dG9Db21wbGV0ZS5UWVBFUy5DT05UQUNUXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBfY29udGFjdHM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBzZWFyY2hcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZWFyY2g6IGZ1bmN0aW9uIChrZXkpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghXy5pc0VtcHR5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgIG1haWwucm91dGVyLm5hdmlnYXRlKFwic2VhcmNoL1wiICsga2V5LCB7dHJpZ2dlcjogdHJ1ZX0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25BY3Rpb25DaGFuZ2VcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25BY3Rpb25DaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvbi50eXBlXCIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGFjdGlvbiAhPSBcInNlYXJjaFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWFyY2hDb21wb25lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaENvbXBvbmVudC5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZWFyY2hWaWV3O1xyXG4iLCIgICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcblxyXG4gICAgYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBBcHAsICBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgICAgICB2YXIgUm91dGVyID0gcmVxdWlyZShcIm1haWwtcm91dGVycy9tYWlsUm91dGVyXCIpO1xyXG4gICAgICAgIHZhciBNYWluTGF5b3V0Q29udHJvbGxlciA9IHJlcXVpcmUoXCJtYWlsLWNvbnRyb2xsZXJzL21haWxNYWluTGF5b3V0Q29udHJvbGxlclwiKTtcclxuICAgICAgICB2YXIgRGF0YUNvbnRyb2xsZXIgPSByZXF1aXJlKFwibWFpbC1jb250cm9sbGVycy9tYWlsRGF0YUNvbnRyb2xsZXJcIik7XHJcbiAgICAgICAgdmFyIEFjdGlvbnNDb250cm9sbGVyID0gcmVxdWlyZShcIm1haWwtY29udHJvbGxlcnMvbWFpbEFjdGlvbnNDb250cm9sbGVyXCIpO1xyXG4gICAgICAgIHZhciBSb3V0ZXJDb250cm9sbGVyID0gcmVxdWlyZShcIm1haWwtY29udHJvbGxlcnMvbWFpbFJvdXRlckNvbnRyb2xsZXJcIik7XHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gaW5pdFxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRoaXMuYWRkSW5pdGlhbGl6ZXIoZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2hhbm5lbCA9IEJhY2tib25lLldyZXFyLnJhZGlvLmNoYW5uZWwoXCJtYWlsXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGFDb250cm9sbGVyID0gbmV3IERhdGFDb250cm9sbGVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aW9uc0NvbnRyb2xsZXIgPSBuZXcgQWN0aW9uc0NvbnRyb2xsZXIoKTtcclxuICAgICAgICAgICAgdGhpcy5tYWluTGF5b3V0Q29udHJvbGxlciA9IG5ldyBNYWluTGF5b3V0Q29udHJvbGxlcihvcHRpb25zKTtcclxuICAgICAgICAgICAgdGhpcy5yb3V0ZXIgPSBuZXcgUm91dGVyKHsgY29udHJvbGxlcjogbmV3IFJvdXRlckNvbnRyb2xsZXIoKSB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBzZXRMYXlvdXRcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0aGlzLnNldExheW91dCA9ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFpbkxheW91dENvbnRyb2xsZXIuc2V0Vmlld3MoKTtcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhcHAubW9kdWxlKFwibWFpbFwiKTtcclxuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwidGFnc1BsYWNlaG9sZGVyXFxcIj48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJhdXRvQ29tcGxldGVQbGFjZWhvbGRlclxcXCI+PC9kaXY+XFxyXFxuXCI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBoZWxwZXIsIG9wdGlvbnMsIGhlbHBlck1pc3Npbmc9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXG4gIGJ1ZmZlciArPSBcIjxkaXYgY2xhc3M9XFxcImxibENvbXBvc2VcXFwiPk5ldyBNZXNzYWdlPC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwiYnV0dG9uc1Rvb2xiYXJcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJhY3Rpb24tbGlzdC1zZWN0aW9uXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0blNlbGVjdFxcXCI+XFxyXFxuICAgICAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGRyb3Bkb3duIGRkc0lkX2Rkc1NlbGVjdFxcXCI+PHNwYW4gY2xhc3M9XFxcImNhcHRpb25cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6c2VsZWN0XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJ0b2dnbGVcXFwiPjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiZHJvcGRvd24tc2xpZGVyIGRkc1NlbGVjdFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIHNlbGVjdEFsbFxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZWxlY3QuYWxsXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0LmFsbFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIHNlbGVjdE5vbmVcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZWxlY3Qubm9uZVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnNlbGVjdC5ub25lXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICAgICAgICAgICAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gc2VsZWN0UmVhZFxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNlbGVjdC5yZWFkXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0LnJlYWRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBzZWxlY3RVbnJlYWRcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZWxlY3QudW5yZWFkXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0LnVucmVhZFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0bkRlbGV0ZUZvcmV2ZXJcXFwiPjxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsZWZ0XFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLmRlbGV0ZUZvcmV2ZXJcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLmRlbGV0ZUZvcmV2ZXJcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuTm90U3BhbVxcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLm5vdFNwYW1cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLm5vdFNwYW1cIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuRGlzY2FyZERyYWZ0c1xcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLmRpc2NhcmREcmFmdFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMuZGlzY2FyZERyYWZ0XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0bkRlbGV0ZVxcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGxlZnRcXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMuZGVsZXRlXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5kZWxldGVcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuTW92ZVRvXFxcIj48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0bk1vcmVcXFwiPjwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJwYWdlclxcXCI+PC9kaXY+XCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uLCBmdW5jdGlvblR5cGU9XCJmdW5jdGlvblwiO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwiY29tcG9zZVZpZXdcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb21wb3NlLWhlYWRlclxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJmaWVsZFxcXCI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6dG9cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDp0b1wiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImlucHV0Ym94XFxcIj48ZGl2IGNsYXNzPVxcXCJ0b0lucHV0V3JhcHBlclxcXCI+PC9kaXY+PC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImZpZWxkIGNjTGluZVxcXCI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6Y2NcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpjY1wiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImlucHV0Ym94XFxcIj48ZGl2IGNsYXNzPVxcXCJjY0lucHV0V3JhcHBlclxcXCI+PC9kaXY+PC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9ZmllbGQ+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6c3ViamVjdFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnN1YmplY3RcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpbnB1dGJveCBpbnB1dGJveDFcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwic3ViamVjdFxcXCIgdmFsdWU9XFxcIlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5zdWJqZWN0KSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnN1YmplY3QpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiXFxcIj48L2lucHV0PjwvZGl2PlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb21wb3NlLWVkaXRvciBicm93c2VyLXNjcm9sbFxcXCIgY29udGVudGVkaXRhYmxlPVxcXCJ0cnVlXFxcIj48L2Rpdj5cXHJcXG4gICAgPGEgY2xhc3M9XFxcImJ1dHRvbiBzZW5kQnRuXFxcIj48c3Bhbj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmNvbXBvc2V2aWV3LnNlbmRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpjb21wb3Nldmlldy5zZW5kXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICAgPGEgY2xhc3M9XFxcImNsb3NlQnRuXFxcIj48L2E+XFxyXFxuPC9kaXY+XCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwibWFpbC1pdGVtcy1yZWdpb24gYnJvd3Nlci1zY3JvbGwgbGlnaHRcXFwiPlxcclxcbjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcIm1haWwtcHJldmlldy1yZWdpb24gYnJvd3Nlci1zY3JvbGwgbGlnaHRcXFwiPlxcclxcbjwvZGl2PlxcclxcblwiO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcIm1zZ1RpdGxlXFxcIj48L2Rpdj5cXHJcXG5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwiZW1wdHlNYWlsXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY291bnRlclxcXCI+PC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm1lc3NhZ2VcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6ZW1wdHlNYWlsLnNlbGVjdGl0ZW1cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDplbXB0eU1haWwuc2VsZWN0aXRlbVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbjwvZGl2PlwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXIsIGZ1bmN0aW9uVHlwZT1cImZ1bmN0aW9uXCIsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgc2VsZj10aGlzO1xuXG5mdW5jdGlvbiBwcm9ncmFtMShkZXB0aDAsZGF0YSkge1xuICBcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyO1xuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImluYm94XFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuZnJvbSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5mcm9tKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjxkaXY+XFxyXFxuICAgIFwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbmZ1bmN0aW9uIHByb2dyYW0zKGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXIsIG9wdGlvbnM7XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwic2VudFxcXCI+PHNwYW4gY2xhc3M9XFxcInNlbnQtdG9cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6dG9cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDp0b1wiLCBvcHRpb25zKSkpXG4gICAgKyBcIjo8L3NwYW4+PHNwYW4gY2xhc3M9XFxcInNlbnQtYWRkcmVzc1xcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnRvKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnRvKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvc3Bhbj48L2Rpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuZnVuY3Rpb24gcHJvZ3JhbTUoZGVwdGgwLGRhdGEpIHtcbiAgXG4gIHZhciBidWZmZXIgPSBcIlwiLCBoZWxwZXIsIG9wdGlvbnM7XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiZHJhZnRcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6ZHJhZnRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpkcmFmdFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICBcIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxuXG5mdW5jdGlvbiBwcm9ncmFtNyhkZXB0aDAsZGF0YSkge1xuICBcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyO1xuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcInRyYXNoLWljb24td3JhcHBlclxcXCI+PGRpdiBjbGFzcz1cXFwidHJhc2gtaWNvblxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwidHJhc2gtYWRkcmVzc1xcXCI+PGRpdj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuZnJvbSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5mcm9tKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvZGl2PjwvZGl2PlxcclxcbiAgICBcIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxuXG5mdW5jdGlvbiBwcm9ncmFtOShkZXB0aDAsZGF0YSkge1xuICBcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyO1xuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcInNwYW1cXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5mcm9tKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmZyb20pOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgIFwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbiAgYnVmZmVyICs9IFwiPHRkIGNsYXNzPVxcXCJzZWxlY3RvclxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBjbGFzcz1cXFwiY2hrQm94XFxcIj48L3RkPlxcclxcbjx0ZCBjbGFzcz1cXFwic3RhclxcXCI+PGRpdiBjbGFzcz1cXFwic3Rhci1pY29uXFxcIj48L2Rpdj48L3RkPlxcclxcbjx0ZCBjbGFzcz1cXFwiaW1wb3J0YW5jZVxcXCI+PGRpdiBjbGFzcz1cXFwiaW1wb3J0YW5jZS1pY29uXFxcIj48L2Rpdj48L3RkPlxcclxcbjx0ZCBjbGFzcz1cXFwiYWRkcmVzc1xcXCI+XFxyXFxuICAgIFwiO1xuICBzdGFjazEgPSBoZWxwZXJzWydpZiddLmNhbGwoZGVwdGgwLCAoZGVwdGgwICYmIGRlcHRoMC5pc0luYm94KSwge2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDEsIHByb2dyYW0xLCBkYXRhKSxkYXRhOmRhdGF9KTtcbiAgaWYoc3RhY2sxIHx8IHN0YWNrMSA9PT0gMCkgeyBidWZmZXIgKz0gc3RhY2sxOyB9XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICBcIjtcbiAgc3RhY2sxID0gaGVscGVyc1snaWYnXS5jYWxsKGRlcHRoMCwgKGRlcHRoMCAmJiBkZXB0aDAuaXNTZW50KSwge2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDMsIHByb2dyYW0zLCBkYXRhKSxkYXRhOmRhdGF9KTtcbiAgaWYoc3RhY2sxIHx8IHN0YWNrMSA9PT0gMCkgeyBidWZmZXIgKz0gc3RhY2sxOyB9XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICBcIjtcbiAgc3RhY2sxID0gaGVscGVyc1snaWYnXS5jYWxsKGRlcHRoMCwgKGRlcHRoMCAmJiBkZXB0aDAuaXNEcmFmdCksIHtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSg1LCBwcm9ncmFtNSwgZGF0YSksZGF0YTpkYXRhfSk7XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgXCI7XG4gIHN0YWNrMSA9IGhlbHBlcnNbJ2lmJ10uY2FsbChkZXB0aDAsIChkZXB0aDAgJiYgZGVwdGgwLmlzVHJhc2gpLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oNywgcHJvZ3JhbTcsIGRhdGEpLGRhdGE6ZGF0YX0pO1xuICBpZihzdGFjazEgfHwgc3RhY2sxID09PSAwKSB7IGJ1ZmZlciArPSBzdGFjazE7IH1cbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgIFwiO1xuICBzdGFjazEgPSBoZWxwZXJzWydpZiddLmNhbGwoZGVwdGgwLCAoZGVwdGgwICYmIGRlcHRoMC5pc1NwYW0pLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oOSwgcHJvZ3JhbTksIGRhdGEpLGRhdGE6ZGF0YX0pO1xuICBpZihzdGFjazEgfHwgc3RhY2sxID09PSAwKSB7IGJ1ZmZlciArPSBzdGFjazE7IH1cbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgIFwiO1xuICBzdGFjazEgPSBoZWxwZXJzWydpZiddLmNhbGwoZGVwdGgwLCAoZGVwdGgwICYmIGRlcHRoMC5pc1NlYXJjaCksIHtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgxLCBwcm9ncmFtMSwgZGF0YSksZGF0YTpkYXRhfSk7XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG48L3RkPlxcclxcbjx0ZD48ZGl2IGNsYXNzPVxcXCJjb250ZW50XFxcIj48c3BhbiBjbGFzcz1cXFwic3ViamVjdFxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnN1YmplY3QpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuc3ViamVjdCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L3NwYW4+PHNwYW4gY2xhc3M9XFxcInNlcGFyYXRvclxcXCI+LTwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiYm9keVxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmJvZHkpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuYm9keSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L3NwYW4+PC9kaXY+PC90ZD5cXHJcXG48dGQ+PGRpdiBjbGFzcz1cXFwic2VudFRpbWVcXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5zZW50VGltZSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5zZW50VGltZSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj48L3RkPlwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcIm1haWwtdGFibGUtY29udGFuaWVyXFxcIj5cXHJcXG4gICAgPHRhYmxlIGNsYXNzPVxcXCJkYXRhLXRhYmxlIG1haWwtdGFibGVcXFwiPlxcclxcbiAgICAgICAgPGNvbGdyb3VwPlxcclxcbiAgICAgICAgICAgIDxjb2wgc3R5bGU9XFxcIndpZHRoOjMwcHhcXFwiLz5cXHJcXG4gICAgICAgICAgICA8Y29sIHN0eWxlPVxcXCJ3aWR0aDozMHB4XFxcIi8+XFxyXFxuICAgICAgICAgICAgPGNvbCBzdHlsZT1cXFwid2lkdGg6MzBweFxcXCIvPlxcclxcbiAgICAgICAgICAgIDxjb2wgc3R5bGU9XFxcIndpZHRoOjE5MHB4XFxcIi8+XFxyXFxuICAgICAgICAgICAgPGNvbC8+XFxyXFxuICAgICAgICAgICAgPGNvbCBzdHlsZT1cXFwid2lkdGg6ODBweFxcXCIvPlxcclxcbiAgICAgICAgPC9jb2xncm91cD5cXHJcXG4gICAgICAgIDx0Ym9keT5cXHJcXG4gICAgICAgIDwvdGJvZHk+XFxyXFxuICAgIDwvdGFibGU+XFxyXFxuPC9kaXY+XCI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwibWFpbC1uYXYtcmVnaW9uXFxcIj5cXHJcXG48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJtYWlsLXdvcmstcmVnaW9uXFxcIj5cXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGRyb3Bkb3duIGRkc0lkX2Rkc01vcmVcXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMubW9yZVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMubW9yZVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwidG9nZ2xlXFxcIj48L3NwYW4+PC9hPlxcclxcbjxkaXYgIGNsYXNzPVxcXCJkcm9wZG93bi1zbGlkZXIgZGRzTW9yZVxcXCI+XFxyXFxuICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIG1hcmtSZWFkXFxcIj48L3NwYW4+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMubWFya0FzLnJlYWRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLm1hcmtBcy5yZWFkXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gbWFya1VucmVhZFxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMubWFya0FzLnVucmVhZFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMubWFya0FzLnVucmVhZFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIG1hcmtJbXBcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLm1hcmtBcy5pbXBvcnRhbnRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLm1hcmtBcy5pbXBvcnRhbnRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBtYXJrTm90SW1wXFxcIj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6YWN0aW9ucy5tYXJrQXMubm90SW1wb3J0YW50XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5tYXJrQXMubm90SW1wb3J0YW50XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gYWRkU3RhclxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMuYWRkLnN0YXJcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLmFkZC5zdGFyXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gcmVtb3ZlU3RhclxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMucmVtb3ZlLnN0YXJcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLnJlbW92ZS5zdGFyXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cXHJcXG5cXHJcXG5cXHJcXG5cXHJcXG5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGRyb3Bkb3duIGRkc0lkX2Rkc01vdmVcXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMubW92ZVRvXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5tb3ZlVG9cIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PHNwYW4gY2xhc3M9XFxcInRvZ2dsZVxcXCI+PC9zcGFuPjwvYT5cXHJcXG48ZGl2ICBjbGFzcz1cXFwiZHJvcGRvd24tc2xpZGVyIGRkc01vdmVcXFwiPlxcclxcbiAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBtb3ZlVG9JbmJveFxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDppbmJveFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmluYm94XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gbW92ZVRvU3BhbVxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNwYW1cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpzcGFtXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gbW92ZVRvVHJhc2hcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDp0cmFzaFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnRyYXNoXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cXHJcXG5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGEgaHJlZj1cXFwiI2NvbXBvc2VcXFwiIGNsYXNzPVxcXCJidXR0b24gcHJpbWUgYnRuQ29tcG9zZVxcXCI+PHNwYW4gY2xhc3M9XFxcImNhcHRpb25cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6Y29tcG9zZVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmNvbXBvc2VcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcIm5hdmlnYXRvciBtYWlsTmF2XFxcIj5cXHJcXG4gIDx1bD5cXHJcXG4gICAgICA8bGkgY2xhc3M9XFxcIm5hdi1pbmJveFxcXCI+PGEgaHJlZj1cXFwiI2luYm94XFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmluYm94XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6aW5ib3hcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2E+PC9saT5cXHJcXG4gICAgICA8bGkgY2xhc3M9XFxcIm5hdi1zZW50XFxcIj48YSBocmVmPVxcXCIjc2VudFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZW50XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VudFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvYT48L2xpPlxcclxcbiAgICAgIDxsaSBjbGFzcz1cXFwibmF2LWRyYWZ0XFxcIj48YSBocmVmPVxcXCIjZHJhZnRcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6ZHJhZnRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpkcmFmdFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvYT48L2xpPlxcclxcbiAgICAgIDxsaSBjbGFzcz1cXFwibmF2LXRyYXNoXFxcIj48YSBocmVmPVxcXCIjdHJhc2hcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6dHJhc2hcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDp0cmFzaFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvYT48L2xpPlxcclxcbiAgICAgIDxsaSBjbGFzcz1cXFwibmF2LXNwYW1cXFwiPjxhIGhyZWY9XFxcIiNzcGFtXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNwYW1cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpzcGFtXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9hPjwvbGk+XFxyXFxuICA8L3VsPlxcclxcbjwvZGl2PlxcclxcblxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJwYWdlcklubmVyQ29udGFpbmVyXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwicGFnZXJCdXR0b25zXFxcIj5cXHJcXG4gICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsZWZ0IGljb24gYnRuTmV3ZXJcXFwiIHRpdGxlPVxcXCJcIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnBhZ2UucHJldlwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnBhZ2UucHJldlwiLCBvcHRpb25zKSkpXG4gICAgKyBcIlxcXCI+PHNwYW4gY2xhc3M9XFxcImljb05ld2VyXFxcIj48L3NwYW4+PC9hPlxcclxcbiAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIHJpZ2h0IGljb24gYnRuT2xkZXJcXFwiIHRpdGxlPVxcXCJcIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnBhZ2UubmV4dFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnBhZ2UubmV4dFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIlxcXCI+PHNwYW4gY2xhc3M9XFxcImljb09sZGVyXFxcIj48L3NwYW4+PC9hPlxcclxcbiAgICA8L2Rpdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwicGFnZXJJbmZvXFxcIj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJsYmxGb3JtXFxcIj48L3NwYW4+XFxyXFxuICAgICAgICA8c3Bhbj4gLSA8L3NwYW4+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwibGJsVG9cXFwiPjwvc3Bhbj5cXHJcXG4gICAgICAgIDxzcGFuPiBvZiA8L3NwYW4+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwidG90YWxcXFwiPjwvc3Bhbj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlciwgZnVuY3Rpb25UeXBlPVwiZnVuY3Rpb25cIiwgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJwcmV2aWV3TWFpbFxcXCI+XFxyXFxuICAgPGRpdiBjbGFzcz1cXFwic3ViamVjdFxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnN1YmplY3QpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuc3ViamVjdCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICA8ZGl2IGNsYXNzPVxcXCJhZGRyZXNzUmVnaW9uXFxcIj5cXHJcXG4gICAgICAgPGRpdiBjbGFzcz1cXFwiaWNvblxcXCI+PC9kaXY+XFxyXFxuICAgICAgIDxkaXYgY2xhc3M9XFxcImZyb21cXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5mcm9tKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmZyb20pOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgIDxkaXYgY2xhc3M9XFxcInRvXFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMudG8pIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudG8pOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgPC9kaXY+XFxyXFxuICAgPGRpdiBjbGFzcz1cXFwiYm9keVxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmJvZHkpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuYm9keSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG48L2Rpdj5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJzZWFyY2gtcGxhY2Vob2xkZXJcXFwiPjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcImF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyXFxcIj48L2Rpdj5cXHJcXG5cIjtcbiAgfSk7XG4iLCJ2YXIgYXBwID0gbmV3IE1hcmlvbmV0dGUuQXBwbGljYXRpb24oeyBjaGFubmVsTmFtZTogJ2FwcENoYW5uZWwnIH0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcHA7IiwicmVxdWlyZShcIi4vdmVuZG9yc0xvYWRlclwiKTtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCdhcHAnKTtcclxudmFyIEZyYW1lID0gcmVxdWlyZShcImZyYW1lXCIpO1xyXG52YXIgQ29udGV4dCA9IHJlcXVpcmUoXCJjb250ZXh0XCIpO1xyXG52YXIgTWFpbE1vZHVsZSA9IHJlcXVpcmUoXCJtYWlsLW1vZHVsZVwiKTtcclxudmFyIFRyYW5zbGF0b3IgPSByZXF1aXJlKFwicmVzb2x2ZXJzL3RyYW5zbGF0b3JcIik7XHJcbnZhciBTb2NrZXRDb250cm9sbGVyID0gcmVxdWlyZShcInNvY2tldC1jb250cm9sbGVyXCIpO1xyXG52YXIgU2V0dGluZ3NDb250cm9sbGVyID0gcmVxdWlyZShcInNldHRpbmdzLWNvbnRyb2xsZXJcIik7XHJcblxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gaW5pdFxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuYXBwLm9uKFwiYmVmb3JlOnN0YXJ0XCIsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICBhcHAudHJhbnNsYXRvciA9IFRyYW5zbGF0b3I7XHJcbiAgICBhcHAuY29udGV4dCA9IG5ldyBDb250ZXh0KCk7XHJcbiAgICBhcHAuZnJhbWUgPSBuZXcgRnJhbWUoKTtcclxuICAgIGFwcC5zb2NrZXRDb250cm9sbGVyID0gbmV3IFNvY2tldENvbnRyb2xsZXIoKTtcclxuICAgIGFwcC5zZXR0aW5nc0NvbnRyb2xsZXIgPSBuZXcgU2V0dGluZ3NDb250cm9sbGVyKCk7XHJcbn0pO1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gc3RhcnRcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbmFwcC5vbihcInN0YXJ0XCIsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICBhcHAuY2hhbm5lbC52ZW50Lm9uY2UoXCJvblNldHRpbmdzTG9hZGVkXCIsIG9uU2V0dGluZ3NMb2FkZWQpO1xyXG4gICAgYXBwLnNldHRpbmdzQ29udHJvbGxlci5mZXRjaCgpO1xyXG59KTtcclxuXHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxudmFyIG9uU2V0dGluZ3NMb2FkZWQgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIHJlZ2lzdGVyVXNlcigpO1xyXG4gICAgc2V0TGF5b3V0KCk7XHJcbiAgICBzdGFydEhpc3RvcnkoKTtcclxuICAgIHJlbW92ZVNwbGFzaFNjcmVlbigpO1xyXG59O1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnZhciByZWdpc3RlclVzZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBhcHAuc29ja2V0Q29udHJvbGxlci5yZWdpc3RlclVzZXIoYXBwLnNldHRpbmdzLmdldChcInVzZXJOYW1lXCIpKTtcclxufTtcclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgc2V0TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIGFwcC5hZGRSZWdpb25zKHtcclxuICAgICAgICBtYWluUmVnaW9uOiAnLm1iJ1xyXG4gICAgfSk7XHJcbiAgICBhcHAuZnJhbWUuc2V0TGF5b3V0KGFwcC5tYWluUmVnaW9uKTtcclxufTtcclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgc3RhcnRIaXN0b3J5ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xyXG59O1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgcmVtb3ZlU3BsYXNoU2NyZWVuID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICQoXCIuc3Bpbm5lclwiKS5oaWRlKCk7XHJcbiAgICAkKFwiLm1iXCIpLnNob3coKTtcclxufTtcclxuXHJcbmFwcC5zdGFydCgpO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJ3aW5kb3cuJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG53aW5kb3cuXyA9ICByZXF1aXJlKFwidW5kZXJzY29yZVwiKTtcclxud2luZG93Ll9zID0gcmVxdWlyZShcInVuZGVyc2NvcmUuc3RyaW5nXCIpO1xyXG53aW5kb3cuQmFja2JvbmUgPSByZXF1aXJlKFwiYmFja2JvbmVcIik7XHJcbndpbmRvdy5NYXJpb25ldHRlID0gcmVxdWlyZSgnYmFja2JvbmUubWFyaW9uZXR0ZScpO1xyXG53aW5kb3cuSGFuZGxlYmFycyA9IHJlcXVpcmUoXCJoYnNmeS9ydW50aW1lXCIpO1xyXG5cclxucmVxdWlyZShcImV4dGVuc2lvbnMvYmFja2JvbmUuc3luY1wiKTtcclxucmVxdWlyZShcImV4dGVuc2lvbnMvdW5kZXJzY29yZS5taXhpbi5kZWVwRXh0ZW5kXCIpO1xyXG5yZXF1aXJlKFwiZXh0ZW5zaW9ucy9tYXJpb25ldHRlLmV4dGVuc2lvbnNcIik7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qZ2xvYmFscyBIYW5kbGViYXJzOiB0cnVlICovXG52YXIgYmFzZSA9IHJlcXVpcmUoXCIuL2hhbmRsZWJhcnMvYmFzZVwiKTtcblxuLy8gRWFjaCBvZiB0aGVzZSBhdWdtZW50IHRoZSBIYW5kbGViYXJzIG9iamVjdC4gTm8gbmVlZCB0byBzZXR1cCBoZXJlLlxuLy8gKFRoaXMgaXMgZG9uZSB0byBlYXNpbHkgc2hhcmUgY29kZSBiZXR3ZWVuIGNvbW1vbmpzIGFuZCBicm93c2UgZW52cylcbnZhciBTYWZlU3RyaW5nID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9zYWZlLXN0cmluZ1wiKVtcImRlZmF1bHRcIl07XG52YXIgRXhjZXB0aW9uID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9leGNlcHRpb25cIilbXCJkZWZhdWx0XCJdO1xudmFyIFV0aWxzID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy91dGlsc1wiKTtcbnZhciBydW50aW1lID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9ydW50aW1lXCIpO1xuXG4vLyBGb3IgY29tcGF0aWJpbGl0eSBhbmQgdXNhZ2Ugb3V0c2lkZSBvZiBtb2R1bGUgc3lzdGVtcywgbWFrZSB0aGUgSGFuZGxlYmFycyBvYmplY3QgYSBuYW1lc3BhY2VcbnZhciBjcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGhiID0gbmV3IGJhc2UuSGFuZGxlYmFyc0Vudmlyb25tZW50KCk7XG5cbiAgVXRpbHMuZXh0ZW5kKGhiLCBiYXNlKTtcbiAgaGIuU2FmZVN0cmluZyA9IFNhZmVTdHJpbmc7XG4gIGhiLkV4Y2VwdGlvbiA9IEV4Y2VwdGlvbjtcbiAgaGIuVXRpbHMgPSBVdGlscztcblxuICBoYi5WTSA9IHJ1bnRpbWU7XG4gIGhiLnRlbXBsYXRlID0gZnVuY3Rpb24oc3BlYykge1xuICAgIHJldHVybiBydW50aW1lLnRlbXBsYXRlKHNwZWMsIGhiKTtcbiAgfTtcblxuICByZXR1cm4gaGI7XG59O1xuXG52YXIgSGFuZGxlYmFycyA9IGNyZWF0ZSgpO1xuSGFuZGxlYmFycy5jcmVhdGUgPSBjcmVhdGU7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gSGFuZGxlYmFyczsiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBVdGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIEV4Y2VwdGlvbiA9IHJlcXVpcmUoXCIuL2V4Y2VwdGlvblwiKVtcImRlZmF1bHRcIl07XG5cbnZhciBWRVJTSU9OID0gXCIxLjMuMFwiO1xuZXhwb3J0cy5WRVJTSU9OID0gVkVSU0lPTjt2YXIgQ09NUElMRVJfUkVWSVNJT04gPSA0O1xuZXhwb3J0cy5DT01QSUxFUl9SRVZJU0lPTiA9IENPTVBJTEVSX1JFVklTSU9OO1xudmFyIFJFVklTSU9OX0NIQU5HRVMgPSB7XG4gIDE6ICc8PSAxLjAucmMuMicsIC8vIDEuMC5yYy4yIGlzIGFjdHVhbGx5IHJldjIgYnV0IGRvZXNuJ3QgcmVwb3J0IGl0XG4gIDI6ICc9PSAxLjAuMC1yYy4zJyxcbiAgMzogJz09IDEuMC4wLXJjLjQnLFxuICA0OiAnPj0gMS4wLjAnXG59O1xuZXhwb3J0cy5SRVZJU0lPTl9DSEFOR0VTID0gUkVWSVNJT05fQ0hBTkdFUztcbnZhciBpc0FycmF5ID0gVXRpbHMuaXNBcnJheSxcbiAgICBpc0Z1bmN0aW9uID0gVXRpbHMuaXNGdW5jdGlvbixcbiAgICB0b1N0cmluZyA9IFV0aWxzLnRvU3RyaW5nLFxuICAgIG9iamVjdFR5cGUgPSAnW29iamVjdCBPYmplY3RdJztcblxuZnVuY3Rpb24gSGFuZGxlYmFyc0Vudmlyb25tZW50KGhlbHBlcnMsIHBhcnRpYWxzKSB7XG4gIHRoaXMuaGVscGVycyA9IGhlbHBlcnMgfHwge307XG4gIHRoaXMucGFydGlhbHMgPSBwYXJ0aWFscyB8fCB7fTtcblxuICByZWdpc3RlckRlZmF1bHRIZWxwZXJzKHRoaXMpO1xufVxuXG5leHBvcnRzLkhhbmRsZWJhcnNFbnZpcm9ubWVudCA9IEhhbmRsZWJhcnNFbnZpcm9ubWVudDtIYW5kbGViYXJzRW52aXJvbm1lbnQucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogSGFuZGxlYmFyc0Vudmlyb25tZW50LFxuXG4gIGxvZ2dlcjogbG9nZ2VyLFxuICBsb2c6IGxvZyxcblxuICByZWdpc3RlckhlbHBlcjogZnVuY3Rpb24obmFtZSwgZm4sIGludmVyc2UpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgaWYgKGludmVyc2UgfHwgZm4pIHsgdGhyb3cgbmV3IEV4Y2VwdGlvbignQXJnIG5vdCBzdXBwb3J0ZWQgd2l0aCBtdWx0aXBsZSBoZWxwZXJzJyk7IH1cbiAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLmhlbHBlcnMsIG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaW52ZXJzZSkgeyBmbi5ub3QgPSBpbnZlcnNlOyB9XG4gICAgICB0aGlzLmhlbHBlcnNbbmFtZV0gPSBmbjtcbiAgICB9XG4gIH0sXG5cbiAgcmVnaXN0ZXJQYXJ0aWFsOiBmdW5jdGlvbihuYW1lLCBzdHIpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMucGFydGlhbHMsICBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJ0aWFsc1tuYW1lXSA9IHN0cjtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyRGVmYXVsdEhlbHBlcnMoaW5zdGFuY2UpIHtcbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbihhcmcpIHtcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiTWlzc2luZyBoZWxwZXI6ICdcIiArIGFyZyArIFwiJ1wiKTtcbiAgICB9XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdibG9ja0hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UgfHwgZnVuY3Rpb24oKSB7fSwgZm4gPSBvcHRpb25zLmZuO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHsgY29udGV4dCA9IGNvbnRleHQuY2FsbCh0aGlzKTsgfVxuXG4gICAgaWYoY29udGV4dCA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGZuKHRoaXMpO1xuICAgIH0gZWxzZSBpZihjb250ZXh0ID09PSBmYWxzZSB8fCBjb250ZXh0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgaWYoY29udGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzLmVhY2goY29udGV4dCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZuKGNvbnRleHQpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2VhY2gnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGZuID0gb3B0aW9ucy5mbiwgaW52ZXJzZSA9IG9wdGlvbnMuaW52ZXJzZTtcbiAgICB2YXIgaSA9IDAsIHJldCA9IFwiXCIsIGRhdGE7XG5cbiAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkgeyBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpOyB9XG5cbiAgICBpZiAob3B0aW9ucy5kYXRhKSB7XG4gICAgICBkYXRhID0gY3JlYXRlRnJhbWUob3B0aW9ucy5kYXRhKTtcbiAgICB9XG5cbiAgICBpZihjb250ZXh0ICYmIHR5cGVvZiBjb250ZXh0ID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcbiAgICAgICAgZm9yKHZhciBqID0gY29udGV4dC5sZW5ndGg7IGk8ajsgaSsrKSB7XG4gICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEuaW5kZXggPSBpO1xuICAgICAgICAgICAgZGF0YS5maXJzdCA9IChpID09PSAwKTtcbiAgICAgICAgICAgIGRhdGEubGFzdCAgPSAoaSA9PT0gKGNvbnRleHQubGVuZ3RoLTEpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0ID0gcmV0ICsgZm4oY29udGV4dFtpXSwgeyBkYXRhOiBkYXRhIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IodmFyIGtleSBpbiBjb250ZXh0KSB7XG4gICAgICAgICAgaWYoY29udGV4dC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBpZihkYXRhKSB7IFxuICAgICAgICAgICAgICBkYXRhLmtleSA9IGtleTsgXG4gICAgICAgICAgICAgIGRhdGEuaW5kZXggPSBpO1xuICAgICAgICAgICAgICBkYXRhLmZpcnN0ID0gKGkgPT09IDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0ID0gcmV0ICsgZm4oY29udGV4dFtrZXldLCB7ZGF0YTogZGF0YX0pO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmKGkgPT09IDApe1xuICAgICAgcmV0ID0gaW52ZXJzZSh0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaWYnLCBmdW5jdGlvbihjb25kaXRpb25hbCwgb3B0aW9ucykge1xuICAgIGlmIChpc0Z1bmN0aW9uKGNvbmRpdGlvbmFsKSkgeyBjb25kaXRpb25hbCA9IGNvbmRpdGlvbmFsLmNhbGwodGhpcyk7IH1cblxuICAgIC8vIERlZmF1bHQgYmVoYXZpb3IgaXMgdG8gcmVuZGVyIHRoZSBwb3NpdGl2ZSBwYXRoIGlmIHRoZSB2YWx1ZSBpcyB0cnV0aHkgYW5kIG5vdCBlbXB0eS5cbiAgICAvLyBUaGUgYGluY2x1ZGVaZXJvYCBvcHRpb24gbWF5IGJlIHNldCB0byB0cmVhdCB0aGUgY29uZHRpb25hbCBhcyBwdXJlbHkgbm90IGVtcHR5IGJhc2VkIG9uIHRoZVxuICAgIC8vIGJlaGF2aW9yIG9mIGlzRW1wdHkuIEVmZmVjdGl2ZWx5IHRoaXMgZGV0ZXJtaW5lcyBpZiAwIGlzIGhhbmRsZWQgYnkgdGhlIHBvc2l0aXZlIHBhdGggb3IgbmVnYXRpdmUuXG4gICAgaWYgKCghb3B0aW9ucy5oYXNoLmluY2x1ZGVaZXJvICYmICFjb25kaXRpb25hbCkgfHwgVXRpbHMuaXNFbXB0eShjb25kaXRpb25hbCkpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3VubGVzcycsIGZ1bmN0aW9uKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGluc3RhbmNlLmhlbHBlcnNbJ2lmJ10uY2FsbCh0aGlzLCBjb25kaXRpb25hbCwge2ZuOiBvcHRpb25zLmludmVyc2UsIGludmVyc2U6IG9wdGlvbnMuZm4sIGhhc2g6IG9wdGlvbnMuaGFzaH0pO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignd2l0aCcsIGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkgeyBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpOyB9XG5cbiAgICBpZiAoIVV0aWxzLmlzRW1wdHkoY29udGV4dCkpIHJldHVybiBvcHRpb25zLmZuKGNvbnRleHQpO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignbG9nJywgZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBsZXZlbCA9IG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmRhdGEubGV2ZWwgIT0gbnVsbCA/IHBhcnNlSW50KG9wdGlvbnMuZGF0YS5sZXZlbCwgMTApIDogMTtcbiAgICBpbnN0YW5jZS5sb2cobGV2ZWwsIGNvbnRleHQpO1xuICB9KTtcbn1cblxudmFyIGxvZ2dlciA9IHtcbiAgbWV0aG9kTWFwOiB7IDA6ICdkZWJ1ZycsIDE6ICdpbmZvJywgMjogJ3dhcm4nLCAzOiAnZXJyb3InIH0sXG5cbiAgLy8gU3RhdGUgZW51bVxuICBERUJVRzogMCxcbiAgSU5GTzogMSxcbiAgV0FSTjogMixcbiAgRVJST1I6IDMsXG4gIGxldmVsOiAzLFxuXG4gIC8vIGNhbiBiZSBvdmVycmlkZGVuIGluIHRoZSBob3N0IGVudmlyb25tZW50XG4gIGxvZzogZnVuY3Rpb24obGV2ZWwsIG9iaikge1xuICAgIGlmIChsb2dnZXIubGV2ZWwgPD0gbGV2ZWwpIHtcbiAgICAgIHZhciBtZXRob2QgPSBsb2dnZXIubWV0aG9kTWFwW2xldmVsXTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgY29uc29sZVttZXRob2RdKSB7XG4gICAgICAgIGNvbnNvbGVbbWV0aG9kXS5jYWxsKGNvbnNvbGUsIG9iaik7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuZXhwb3J0cy5sb2dnZXIgPSBsb2dnZXI7XG5mdW5jdGlvbiBsb2cobGV2ZWwsIG9iaikgeyBsb2dnZXIubG9nKGxldmVsLCBvYmopOyB9XG5cbmV4cG9ydHMubG9nID0gbG9nO3ZhciBjcmVhdGVGcmFtZSA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB2YXIgb2JqID0ge307XG4gIFV0aWxzLmV4dGVuZChvYmosIG9iamVjdCk7XG4gIHJldHVybiBvYmo7XG59O1xuZXhwb3J0cy5jcmVhdGVGcmFtZSA9IGNyZWF0ZUZyYW1lOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgZXJyb3JQcm9wcyA9IFsnZGVzY3JpcHRpb24nLCAnZmlsZU5hbWUnLCAnbGluZU51bWJlcicsICdtZXNzYWdlJywgJ25hbWUnLCAnbnVtYmVyJywgJ3N0YWNrJ107XG5cbmZ1bmN0aW9uIEV4Y2VwdGlvbihtZXNzYWdlLCBub2RlKSB7XG4gIHZhciBsaW5lO1xuICBpZiAobm9kZSAmJiBub2RlLmZpcnN0TGluZSkge1xuICAgIGxpbmUgPSBub2RlLmZpcnN0TGluZTtcblxuICAgIG1lc3NhZ2UgKz0gJyAtICcgKyBsaW5lICsgJzonICsgbm9kZS5maXJzdENvbHVtbjtcbiAgfVxuXG4gIHZhciB0bXAgPSBFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBtZXNzYWdlKTtcblxuICAvLyBVbmZvcnR1bmF0ZWx5IGVycm9ycyBhcmUgbm90IGVudW1lcmFibGUgaW4gQ2hyb21lIChhdCBsZWFzdCksIHNvIGBmb3IgcHJvcCBpbiB0bXBgIGRvZXNuJ3Qgd29yay5cbiAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgZXJyb3JQcm9wcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgdGhpc1tlcnJvclByb3BzW2lkeF1dID0gdG1wW2Vycm9yUHJvcHNbaWR4XV07XG4gIH1cblxuICBpZiAobGluZSkge1xuICAgIHRoaXMubGluZU51bWJlciA9IGxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSBub2RlLmZpcnN0Q29sdW1uO1xuICB9XG59XG5cbkV4Y2VwdGlvbi5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBFeGNlcHRpb247IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgVXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBFeGNlcHRpb24gPSByZXF1aXJlKFwiLi9leGNlcHRpb25cIilbXCJkZWZhdWx0XCJdO1xudmFyIENPTVBJTEVSX1JFVklTSU9OID0gcmVxdWlyZShcIi4vYmFzZVwiKS5DT01QSUxFUl9SRVZJU0lPTjtcbnZhciBSRVZJU0lPTl9DSEFOR0VTID0gcmVxdWlyZShcIi4vYmFzZVwiKS5SRVZJU0lPTl9DSEFOR0VTO1xuXG5mdW5jdGlvbiBjaGVja1JldmlzaW9uKGNvbXBpbGVySW5mbykge1xuICB2YXIgY29tcGlsZXJSZXZpc2lvbiA9IGNvbXBpbGVySW5mbyAmJiBjb21waWxlckluZm9bMF0gfHwgMSxcbiAgICAgIGN1cnJlbnRSZXZpc2lvbiA9IENPTVBJTEVSX1JFVklTSU9OO1xuXG4gIGlmIChjb21waWxlclJldmlzaW9uICE9PSBjdXJyZW50UmV2aXNpb24pIHtcbiAgICBpZiAoY29tcGlsZXJSZXZpc2lvbiA8IGN1cnJlbnRSZXZpc2lvbikge1xuICAgICAgdmFyIHJ1bnRpbWVWZXJzaW9ucyA9IFJFVklTSU9OX0NIQU5HRVNbY3VycmVudFJldmlzaW9uXSxcbiAgICAgICAgICBjb21waWxlclZlcnNpb25zID0gUkVWSVNJT05fQ0hBTkdFU1tjb21waWxlclJldmlzaW9uXTtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJUZW1wbGF0ZSB3YXMgcHJlY29tcGlsZWQgd2l0aCBhbiBvbGRlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiBcIitcbiAgICAgICAgICAgIFwiUGxlYXNlIHVwZGF0ZSB5b3VyIHByZWNvbXBpbGVyIHRvIGEgbmV3ZXIgdmVyc2lvbiAoXCIrcnVudGltZVZlcnNpb25zK1wiKSBvciBkb3duZ3JhZGUgeW91ciBydW50aW1lIHRvIGFuIG9sZGVyIHZlcnNpb24gKFwiK2NvbXBpbGVyVmVyc2lvbnMrXCIpLlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVXNlIHRoZSBlbWJlZGRlZCB2ZXJzaW9uIGluZm8gc2luY2UgdGhlIHJ1bnRpbWUgZG9lc24ndCBrbm93IGFib3V0IHRoaXMgcmV2aXNpb24geWV0XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYSBuZXdlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiBcIitcbiAgICAgICAgICAgIFwiUGxlYXNlIHVwZGF0ZSB5b3VyIHJ1bnRpbWUgdG8gYSBuZXdlciB2ZXJzaW9uIChcIitjb21waWxlckluZm9bMV0rXCIpLlwiKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0cy5jaGVja1JldmlzaW9uID0gY2hlY2tSZXZpc2lvbjsvLyBUT0RPOiBSZW1vdmUgdGhpcyBsaW5lIGFuZCBicmVhayB1cCBjb21waWxlUGFydGlhbFxuXG5mdW5jdGlvbiB0ZW1wbGF0ZSh0ZW1wbGF0ZVNwZWMsIGVudikge1xuICBpZiAoIWVudikge1xuICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJObyBlbnZpcm9ubWVudCBwYXNzZWQgdG8gdGVtcGxhdGVcIik7XG4gIH1cblxuICAvLyBOb3RlOiBVc2luZyBlbnYuVk0gcmVmZXJlbmNlcyByYXRoZXIgdGhhbiBsb2NhbCB2YXIgcmVmZXJlbmNlcyB0aHJvdWdob3V0IHRoaXMgc2VjdGlvbiB0byBhbGxvd1xuICAvLyBmb3IgZXh0ZXJuYWwgdXNlcnMgdG8gb3ZlcnJpZGUgdGhlc2UgYXMgcHN1ZWRvLXN1cHBvcnRlZCBBUElzLlxuICB2YXIgaW52b2tlUGFydGlhbFdyYXBwZXIgPSBmdW5jdGlvbihwYXJ0aWFsLCBuYW1lLCBjb250ZXh0LCBoZWxwZXJzLCBwYXJ0aWFscywgZGF0YSkge1xuICAgIHZhciByZXN1bHQgPSBlbnYuVk0uaW52b2tlUGFydGlhbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmIChyZXN1bHQgIT0gbnVsbCkgeyByZXR1cm4gcmVzdWx0OyB9XG5cbiAgICBpZiAoZW52LmNvbXBpbGUpIHtcbiAgICAgIHZhciBvcHRpb25zID0geyBoZWxwZXJzOiBoZWxwZXJzLCBwYXJ0aWFsczogcGFydGlhbHMsIGRhdGE6IGRhdGEgfTtcbiAgICAgIHBhcnRpYWxzW25hbWVdID0gZW52LmNvbXBpbGUocGFydGlhbCwgeyBkYXRhOiBkYXRhICE9PSB1bmRlZmluZWQgfSwgZW52KTtcbiAgICAgIHJldHVybiBwYXJ0aWFsc1tuYW1lXShjb250ZXh0LCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIlRoZSBwYXJ0aWFsIFwiICsgbmFtZSArIFwiIGNvdWxkIG5vdCBiZSBjb21waWxlZCB3aGVuIHJ1bm5pbmcgaW4gcnVudGltZS1vbmx5IG1vZGVcIik7XG4gICAgfVxuICB9O1xuXG4gIC8vIEp1c3QgYWRkIHdhdGVyXG4gIHZhciBjb250YWluZXIgPSB7XG4gICAgZXNjYXBlRXhwcmVzc2lvbjogVXRpbHMuZXNjYXBlRXhwcmVzc2lvbixcbiAgICBpbnZva2VQYXJ0aWFsOiBpbnZva2VQYXJ0aWFsV3JhcHBlcixcbiAgICBwcm9ncmFtczogW10sXG4gICAgcHJvZ3JhbTogZnVuY3Rpb24oaSwgZm4sIGRhdGEpIHtcbiAgICAgIHZhciBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV07XG4gICAgICBpZihkYXRhKSB7XG4gICAgICAgIHByb2dyYW1XcmFwcGVyID0gcHJvZ3JhbShpLCBmbiwgZGF0YSk7XG4gICAgICB9IGVsc2UgaWYgKCFwcm9ncmFtV3JhcHBlcikge1xuICAgICAgICBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV0gPSBwcm9ncmFtKGksIGZuKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcm9ncmFtV3JhcHBlcjtcbiAgICB9LFxuICAgIG1lcmdlOiBmdW5jdGlvbihwYXJhbSwgY29tbW9uKSB7XG4gICAgICB2YXIgcmV0ID0gcGFyYW0gfHwgY29tbW9uO1xuXG4gICAgICBpZiAocGFyYW0gJiYgY29tbW9uICYmIChwYXJhbSAhPT0gY29tbW9uKSkge1xuICAgICAgICByZXQgPSB7fTtcbiAgICAgICAgVXRpbHMuZXh0ZW5kKHJldCwgY29tbW9uKTtcbiAgICAgICAgVXRpbHMuZXh0ZW5kKHJldCwgcGFyYW0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuICAgIHByb2dyYW1XaXRoRGVwdGg6IGVudi5WTS5wcm9ncmFtV2l0aERlcHRoLFxuICAgIG5vb3A6IGVudi5WTS5ub29wLFxuICAgIGNvbXBpbGVySW5mbzogbnVsbFxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIG5hbWVzcGFjZSA9IG9wdGlvbnMucGFydGlhbCA/IG9wdGlvbnMgOiBlbnYsXG4gICAgICAgIGhlbHBlcnMsXG4gICAgICAgIHBhcnRpYWxzO1xuXG4gICAgaWYgKCFvcHRpb25zLnBhcnRpYWwpIHtcbiAgICAgIGhlbHBlcnMgPSBvcHRpb25zLmhlbHBlcnM7XG4gICAgICBwYXJ0aWFscyA9IG9wdGlvbnMucGFydGlhbHM7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSB0ZW1wbGF0ZVNwZWMuY2FsbChcbiAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgbmFtZXNwYWNlLCBjb250ZXh0LFxuICAgICAgICAgIGhlbHBlcnMsXG4gICAgICAgICAgcGFydGlhbHMsXG4gICAgICAgICAgb3B0aW9ucy5kYXRhKTtcblxuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsKSB7XG4gICAgICBlbnYuVk0uY2hlY2tSZXZpc2lvbihjb250YWluZXIuY29tcGlsZXJJbmZvKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG5leHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7ZnVuY3Rpb24gcHJvZ3JhbVdpdGhEZXB0aChpLCBmbiwgZGF0YSAvKiwgJGRlcHRoICovKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAzKTtcblxuICB2YXIgcHJvZyA9IGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBbY29udGV4dCwgb3B0aW9ucy5kYXRhIHx8IGRhdGFdLmNvbmNhdChhcmdzKSk7XG4gIH07XG4gIHByb2cucHJvZ3JhbSA9IGk7XG4gIHByb2cuZGVwdGggPSBhcmdzLmxlbmd0aDtcbiAgcmV0dXJuIHByb2c7XG59XG5cbmV4cG9ydHMucHJvZ3JhbVdpdGhEZXB0aCA9IHByb2dyYW1XaXRoRGVwdGg7ZnVuY3Rpb24gcHJvZ3JhbShpLCBmbiwgZGF0YSkge1xuICB2YXIgcHJvZyA9IGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiBmbihjb250ZXh0LCBvcHRpb25zLmRhdGEgfHwgZGF0YSk7XG4gIH07XG4gIHByb2cucHJvZ3JhbSA9IGk7XG4gIHByb2cuZGVwdGggPSAwO1xuICByZXR1cm4gcHJvZztcbn1cblxuZXhwb3J0cy5wcm9ncmFtID0gcHJvZ3JhbTtmdW5jdGlvbiBpbnZva2VQYXJ0aWFsKHBhcnRpYWwsIG5hbWUsIGNvbnRleHQsIGhlbHBlcnMsIHBhcnRpYWxzLCBkYXRhKSB7XG4gIHZhciBvcHRpb25zID0geyBwYXJ0aWFsOiB0cnVlLCBoZWxwZXJzOiBoZWxwZXJzLCBwYXJ0aWFsczogcGFydGlhbHMsIGRhdGE6IGRhdGEgfTtcblxuICBpZihwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiVGhlIHBhcnRpYWwgXCIgKyBuYW1lICsgXCIgY291bGQgbm90IGJlIGZvdW5kXCIpO1xuICB9IGVsc2UgaWYocGFydGlhbCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIHBhcnRpYWwoY29udGV4dCwgb3B0aW9ucyk7XG4gIH1cbn1cblxuZXhwb3J0cy5pbnZva2VQYXJ0aWFsID0gaW52b2tlUGFydGlhbDtmdW5jdGlvbiBub29wKCkgeyByZXR1cm4gXCJcIjsgfVxuXG5leHBvcnRzLm5vb3AgPSBub29wOyIsIlwidXNlIHN0cmljdFwiO1xuLy8gQnVpbGQgb3V0IG91ciBiYXNpYyBTYWZlU3RyaW5nIHR5cGVcbmZ1bmN0aW9uIFNhZmVTdHJpbmcoc3RyaW5nKSB7XG4gIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xufVxuXG5TYWZlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gXCJcIiArIHRoaXMuc3RyaW5nO1xufTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBTYWZlU3RyaW5nOyIsIlwidXNlIHN0cmljdFwiO1xuLypqc2hpbnQgLVcwMDQgKi9cbnZhciBTYWZlU3RyaW5nID0gcmVxdWlyZShcIi4vc2FmZS1zdHJpbmdcIilbXCJkZWZhdWx0XCJdO1xuXG52YXIgZXNjYXBlID0ge1xuICBcIiZcIjogXCImYW1wO1wiLFxuICBcIjxcIjogXCImbHQ7XCIsXG4gIFwiPlwiOiBcIiZndDtcIixcbiAgJ1wiJzogXCImcXVvdDtcIixcbiAgXCInXCI6IFwiJiN4Mjc7XCIsXG4gIFwiYFwiOiBcIiYjeDYwO1wiXG59O1xuXG52YXIgYmFkQ2hhcnMgPSAvWyY8PlwiJ2BdL2c7XG52YXIgcG9zc2libGUgPSAvWyY8PlwiJ2BdLztcblxuZnVuY3Rpb24gZXNjYXBlQ2hhcihjaHIpIHtcbiAgcmV0dXJuIGVzY2FwZVtjaHJdIHx8IFwiJmFtcDtcIjtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKG9iaiwgdmFsdWUpIHtcbiAgZm9yKHZhciBrZXkgaW4gdmFsdWUpIHtcbiAgICBpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGtleSkpIHtcbiAgICAgIG9ialtrZXldID0gdmFsdWVba2V5XTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0cy5leHRlbmQgPSBleHRlbmQ7dmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmV4cG9ydHMudG9TdHJpbmcgPSB0b1N0cmluZztcbi8vIFNvdXJjZWQgZnJvbSBsb2Rhc2hcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iZXN0aWVqcy9sb2Rhc2gvYmxvYi9tYXN0ZXIvTElDRU5TRS50eHRcbnZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn07XG4vLyBmYWxsYmFjayBmb3Igb2xkZXIgdmVyc2lvbnMgb2YgQ2hyb21lIGFuZCBTYWZhcmlcbmlmIChpc0Z1bmN0aW9uKC94LykpIHtcbiAgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbiAgfTtcbn1cbnZhciBpc0Z1bmN0aW9uO1xuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpID8gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XScgOiBmYWxzZTtcbn07XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBlc2NhcGVFeHByZXNzaW9uKHN0cmluZykge1xuICAvLyBkb24ndCBlc2NhcGUgU2FmZVN0cmluZ3MsIHNpbmNlIHRoZXkncmUgYWxyZWFkeSBzYWZlXG4gIGlmIChzdHJpbmcgaW5zdGFuY2VvZiBTYWZlU3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy50b1N0cmluZygpO1xuICB9IGVsc2UgaWYgKCFzdHJpbmcgJiYgc3RyaW5nICE9PSAwKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICAvLyBGb3JjZSBhIHN0cmluZyBjb252ZXJzaW9uIGFzIHRoaXMgd2lsbCBiZSBkb25lIGJ5IHRoZSBhcHBlbmQgcmVnYXJkbGVzcyBhbmRcbiAgLy8gdGhlIHJlZ2V4IHRlc3Qgd2lsbCBkbyB0aGlzIHRyYW5zcGFyZW50bHkgYmVoaW5kIHRoZSBzY2VuZXMsIGNhdXNpbmcgaXNzdWVzIGlmXG4gIC8vIGFuIG9iamVjdCdzIHRvIHN0cmluZyBoYXMgZXNjYXBlZCBjaGFyYWN0ZXJzIGluIGl0LlxuICBzdHJpbmcgPSBcIlwiICsgc3RyaW5nO1xuXG4gIGlmKCFwb3NzaWJsZS50ZXN0KHN0cmluZykpIHsgcmV0dXJuIHN0cmluZzsgfVxuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoYmFkQ2hhcnMsIGVzY2FwZUNoYXIpO1xufVxuXG5leHBvcnRzLmVzY2FwZUV4cHJlc3Npb24gPSBlc2NhcGVFeHByZXNzaW9uO2Z1bmN0aW9uIGlzRW1wdHkodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnRzLmlzRW1wdHkgPSBpc0VtcHR5OyIsIi8vIENyZWF0ZSBhIHNpbXBsZSBwYXRoIGFsaWFzIHRvIGFsbG93IGJyb3dzZXJpZnkgdG8gcmVzb2x2ZVxuLy8gdGhlIHJ1bnRpbWUgb24gYSBzdXBwb3J0ZWQgcGF0aC5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kaXN0L2Nqcy9oYW5kbGViYXJzLnJ1bnRpbWUnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImhhbmRsZWJhcnMvcnVudGltZVwiKVtcImRlZmF1bHRcIl07XG4iXX0=
