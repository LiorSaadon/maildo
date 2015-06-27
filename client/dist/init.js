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

    url: "settings",

    //-------------------------------------------

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

        this.loadThemeAndDic();

        //app.settings.fetch({
        //    success: _.bind(function (model, resp, options) {
        //            this.loadThemeAndDic();
        //    }, this)
        //});
    },

    //------------------------------------------------------

    loadThemeAndDic: function loadThemeAndDic() {

        var theme = app.settings.get("theme");

        $.when($.getJSON("dist/i18n/" + app.settings.get("lang") + ".json", function (i18nObject) {
            app.translator.updateDictionary(i18nObject);
        }), $.get("dist/css/themes/" + theme + "/" + theme + ".css", function (_css) {
            $("theme-css").remove();
            $(["<style type=\"text/css\" id=\"theme-css\">", _css, "</style>"].join("")).appendTo("head");
        })).then(function () {
            app.channel.vent.trigger("onSettingsLoaded");
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
                app.settingsController._loadTheme();
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
    + "</span><span class=\"toggle\"></span></a>\r\n\r\n        <div class=\"dropdown-slider ddsResources\" display=\"none\">\r\n            <div class=\"container\">\r\n                <ul>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Client-side</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Backbone</span>\r\n                            <span class=\"item\">Backbone.DeepModel</span>\r\n                            <span class=\"item\">Marionette</span>\r\n                            <span class=\"item\">Underscore</span>\r\n                            <span class=\"item\">RequireJS (AMD)</span>\r\n                            <span class=\"item\">Mustache</span>\r\n                            <span class=\"item\">Sass\\Compass</span>\r\n                         </p>\r\n                    </li>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Server-side</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Node.js</span>\r\n                            <span class=\"item\">Express 4.0</span>\r\n                            <span class=\"item\">MongoDB</span>\r\n                            <span class=\"item\">Mongoose</span>\r\n                            <span class=\"item\">Socket.io</span>\r\n                            <span class=\"item\">Async.js</span>\r\n                         </p>\r\n                    </li>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Testing tools</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Mocha</span>\r\n                            <span class=\"item\">Chai</span>\r\n                            <span class=\"item\">Sinon</span>\r\n                            <span class=\"item\">Blanket</span>\r\n                            <span class=\"item\">Squire</span>\r\n                         </p>\r\n                    </li>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Deploying tools</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Grunt</span>\r\n                          </p>\r\n                    </li>\r\n\r\n                </ul>\r\n            </div>\r\n\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n\r\n";
  return buffer;
  });

},{"hbsfy/runtime":98}],46:[function(require,module,exports){
"use strict";

var app = require('./../../../../setup/app.js');
var ContactModel = require('./../models/contactModel');
var BaseCollection = require('./../../../../common/js/base-collections/baseCollection');


var _strContacts = "[\r\n    \"demo\",\r\n    \"Angela,Powell\",\r\n    \"Alan,Rogers\",\r\n    \"Patricia,White\",\r\n    \"Pamela,Johnson\",\r\n    \"Dennis,King\",\r\n    \"Edward,Williams\",\r\n    \"Julia,Ward\",\r\n    \"Benjamin,Ross\",\r\n    \"Keith,Lee\",\r\n    \"Mark,Patterson\",\r\n    \"Daniel,Taylor\",\r\n    \"Earl,Morris\",\r\n    \"Diana,Adams\",\r\n    \"Peter,Jones\",\r\n    \"Cynthia,Nelson\",\r\n    \"Mary,Griffin\",\r\n    \"Anna,James\",\r\n    \"Charles,Watson\",\r\n    \"Martin,Sanchez\",\r\n    \"Stephanie,Henderson\",\r\n    \"Jean,Jackson\",\r\n    \"Michael,Martin\",\r\n    \"Jerry,Garcia\",\r\n    \"Jane,Gonzales\",\r\n    \"David,Evans\",\r\n    \"Lawrence,Simmons\",\r\n    \"Helen,Hernandez\",\r\n    \"Patrick,Stewart\",\r\n    \"Howard,Alexander\",\r\n    \"Theresa,Barnes\",\r\n    \"Lori,Thomas\",\r\n    \"Judith,Miller\",\r\n    \"Phyllis,Morgan\",\r\n    \"Ashley,Bell\",\r\n    \"Denise,Wright\",\r\n    \"Nicole,Smith\",\r\n    \"Deborah,Robinson\",\r\n    \"Rebecca,Brooks\",\r\n    \"Ralph,Bryant\",\r\n    \"Anne,Rivera\",\r\n    \"Rose,Gonzalez\",\r\n    \"James,Davis\",\r\n    \"Russell,Russell\",\r\n    \"Larry,Kelly\",\r\n    \"Jeffrey,Collins\",\r\n    \"Raymond,Harris\",\r\n    \"Sarah,Mitchell\",\r\n    \"Andrew,Howard\",\r\n    \"Tammy,Cook\",\r\n    \"Brandon,Rodriguez\",\r\n    \"Jessica,Phillips\",\r\n    \"Barbara,Anderson\",\r\n    \"Louis,Flores\",\r\n    \"Janet,Clark\",\r\n    \"Shawn,Allen\",\r\n    \"Kenneth,Diaz\",\r\n    \"Carl,Butler\",\r\n    \"Kathryn,Price\",\r\n    \"Anthony,Walker\",\r\n    \"Jose,Brown\",\r\n    \"Willie,Wood\",\r\n    \"Gary,Green\",\r\n    \"Susan,Scott\",\r\n    \"Andrea,Gray\",\r\n    \"Wanda,Ramirez\",\r\n    \"Teresa,Foster\",\r\n    \"Rachel,Carter\",\r\n    \"Amy,Wilson\",\r\n    \"Randy,Edwards\",\r\n    \"Wayne,Perez\",\r\n    \"Nancy,Hall\",\r\n    \"Dorothy,Campbell\",\r\n    \"Steven,Reed\",\r\n    \"Karen,Perry\",\r\n    \"George,Bailey\",\r\n    \"Eric,Murphy\",\r\n    \"Billy,Young\",\r\n    \"Bonnie,Roberts\",\r\n    \"Bobby,Lopez\",\r\n    \"Judy,Thompson\",\r\n    \"Paul,Hill\",\r\n    \"Gregory,Torres\",\r\n    \"Alice,Peterson\",\r\n    \"Jimmy,Cox\",\r\n    \"Eugene,Cooper\",\r\n    \"Katherine,Long\",\r\n    \"Mildred,Martinez\",\r\n    \"Jennifer,Washington\",\r\n    \"Timothy,Bennett\",\r\n    \"Richard,Richardson\",\r\n    \"Diane,Parker\",\r\n    \"Victor,Jenkins\",\r\n    \"Bruce,Coleman\",\r\n    \"Joshua,Lewis\",\r\n    \"Margaret,Hughes\",\r\n    \"Samuel,Baker\",\r\n    \"Marilyn,Sanders\",\r\n    \"Lois,Turner\",\r\n    \"Donna,Moore\",\r\n    \"Iris,Wilkerson\",\r\n    \"Nichole,Hampton\",\r\n    \"Rodolfo,Larson\",\r\n    \"Roosevelt,Paul\",\r\n    \"Ervin,Chapman\",\r\n    \"Abraham,Norton\",\r\n    \"Marlon,Cox\",\r\n    \"Neil,Gibson\",\r\n    \"Leah,Little\",\r\n    \"Joshua,Cunningham\",\r\n    \"Toby,Simon\",\r\n    \"Walter,Gardner\",\r\n    \"Shelia,Jensen\",\r\n    \"Forrest,White\",\r\n    \"Lonnie,Byrd\",\r\n    \"Sherri,Lyons\",\r\n    \"Don,Stewart\",\r\n    \"Phillip,Parsons\",\r\n    \"Melanie,Mcgee\",\r\n    \"Armando,Sims\",\r\n    \"Lucille,Higgins\",\r\n    \"Ralph,Douglas\",\r\n    \"Laurie,Patton\",\r\n    \"Chester,Mccoy\",\r\n    \"Francisco,Sherman\",\r\n    \"Chad,Owen\",\r\n    \"Stacey,Greene\",\r\n    \"Kelly,Mcbride\",\r\n    \"Valerie,Lamb\",\r\n    \"Dominic,Carroll\",\r\n    \"Gerardo,Becker\",\r\n    \"Danny,Carlson\",\r\n    \"Regina,Mack\",\r\n    \"Jason,Powell\",\r\n    \"Wilma,Perkins\",\r\n    \"Rebecca,Reyes\",\r\n    \"Lynda,Richards\",\r\n    \"Omar,Woods\",\r\n    \"Sylvia,Pearson\",\r\n    \"Lynn,Hines\",\r\n    \"Elbert,Johnston\",\r\n    \"Tracey,Weaver\",\r\n    \"Faye,Young\",\r\n    \"Kristina,Perez\",\r\n    \"Kenneth,Green\",\r\n    \"Barbara,Garrett\",\r\n    \"Tommie,Crawford\",\r\n    \"Kerry,Steele\",\r\n    \"Joy,Brewer\",\r\n    \"Lula,Barker\",\r\n    \"Sue,French\",\r\n    \"Marty,Jefferson\",\r\n    \"Rosalie,Gross\",\r\n    \"Chris,Frazier\",\r\n    \"Cecilia,Hayes\",\r\n    \"Elsa,Rodgers\",\r\n    \"Myra,Kelly\",\r\n    \"Bernard,Blake\",\r\n    \"Leon,Phillips\",\r\n    \"Monique,Todd\",\r\n    \"Catherine,Rodriquez\",\r\n    \"Angel,Roy\",\r\n    \"Elsie,Wood\",\r\n    \"Dean,Morton\",\r\n    \"Teresa,Oliver\",\r\n    \"Lucia,Benson\",\r\n    \"Misty,Andrews\",\r\n    \"Douglas,Caldwell\",\r\n    \"Joe,Maxwell\",\r\n    \"Ollie,Warren\",\r\n    \"Mildred,Bradley\",\r\n    \"Christie,Fox\",\r\n    \"Colin,Jacobs\",\r\n    \"Joann,Cummings\",\r\n    \"Delia,Wagner\",\r\n    \"Jesse,Chambers\",\r\n    \"Byron,Craig\",\r\n    \"Evan,Huff\",\r\n    \"Dianna,Schneider\",\r\n    \"Dwight,Morales\",\r\n    \"Jeannie,Coleman\",\r\n    \"Doyle,Reed\",\r\n    \"Constance,Perry\",\r\n    \"Amy,Wallace\",\r\n    \"Ellis,Cook\",\r\n    \"Olga,Santiago\",\r\n    \"Jesus,Mitchell\",\r\n    \"Minnie,Reid\",\r\n    \"Gina,Vaughn\",\r\n    \"Adam,Jackson\",\r\n    \"Simon,Wilson\",\r\n    \"Judy,Fernandez\",\r\n    \"Adrienne,Bowen\",\r\n    \"Isabel,Haynes\",\r\n    \"Darla,Bridges\",\r\n    \"Laura,Padilla\",\r\n    \"Earl,Webb\",\r\n    \"Warren,Ortega\",\r\n    \"Garrett,Stokes\",\r\n    \"Edgar,Gibbs\",\r\n    \"Araceli,Callender\",\r\n    \"Salena,Corona\",\r\n    \"Harlan,Berlin\",\r\n    \"Keira,Trinidad\",\r\n    \"Digna,Fogle\",\r\n    \"Brandon,Melvin\",\r\n    \"Waltraud,Rife\",\r\n    \"Lenora,Parrott\",\r\n    \"Gillian,Stamps\",\r\n    \"Toshiko,Hagan\",\r\n    \"Mariette,Machado\",\r\n    \"Chrystal,Dove\",\r\n    \"Verlene,Partin\",\r\n    \"Annita,Pedersen\",\r\n    \"Luanne,Burnside\",\r\n    \"Mari,Macias\",\r\n    \"Joselyn,Gilson\",\r\n    \"Kenya,Peeler\",\r\n    \"Suellen,Gamboa\",\r\n    \"Trudy,Gale\",\r\n    \"Cristopher,Brink\",\r\n    \"Ria,Whalen\",\r\n    \"Dulcie,Preston\",\r\n    \"Tari,Baird\",\r\n    \"Karrie,Griffis\",\r\n    \"Shonna,Andersen\",\r\n    \"Sonny,Mccloskey\",\r\n    \"Alline,Acosta\",\r\n    \"Winter,Corey\",\r\n    \"Janessa,Madsen\",\r\n    \"Rikki,Cowles\",\r\n    \"Kaila,Luce\",\r\n    \"Lucila,Rickard\",\r\n    \"Tammi,Boland\",\r\n    \"Dayna,Heck\",\r\n    \"Ayako,Kruse\",\r\n    \"Chrissy,Ellsworth\",\r\n    \"Gricelda,Jude\",\r\n    \"Yu,Richter\",\r\n    \"Robena,Wallen\",\r\n    \"Fredricka,Mccaskill\",\r\n    \"Bobby,Simonson\",\r\n    \"Fernande,Pearce\",\r\n    \"Glendora,Searcy\",\r\n    \"Tamisha,Thornhill\",\r\n    \"Retta,Tubbs\",\r\n    \"Era,Hatley\",\r\n    \"Laurel,Dockery\",\r\n    \"Vanita,William\",\r\n    \"Ashleigh,Orr\",\r\n    \"Janita,Houser\",\r\n    \"Zora,Wilt\",\r\n    \"Anamaria,Ramey\",\r\n    \"Louetta,Headrick\",\r\n    \"Sheena,Elam\",\r\n    \"Cindie,Winchester\",\r\n    \"Glynis,Connelly\",\r\n    \"Ty,Beal\",\r\n    \"Lieselotte,Barr\",\r\n    \"Santina,Hoang\",\r\n    \"Idalia,Shank\",\r\n    \"Reynalda,Linares\",\r\n    \"Ulrike,Marr\",\r\n    \"Dodie,South\",\r\n    \"Sadye,Spellman\",\r\n    \"Frida,Reyna\",\r\n    \"Elina,Lennon\",\r\n    \"Berna,Clement\",\r\n    \"Filiberto,Grimes\",\r\n    \"Anibal,Howe\",\r\n    \"Arthur,Levine\",\r\n    \"See,Mcdonough\",\r\n    \"Nisha,Moniz\",\r\n    \"Lianne,Butcher\",\r\n    \"Demetria,Mcgraw\",\r\n    \"Roxann,Kaplan\",\r\n    \"Yong,Sikes\",\r\n    \"Lesley,Reedy\",\r\n    \"Aundrea,Abraham\",\r\n    \"Mireille,Quezada\",\r\n    \"Loree,Asher\",\r\n    \"Kathi,Dejesus\",\r\n    \"Rashida,Whitlock\",\r\n    \"Bettie,Hacker\",\r\n    \"Oneida,Traylor\",\r\n    \"August,Moreland\",\r\n    \"Margery,Henning\",\r\n    \"Winona,Coe\",\r\n    \"Adam,Mcnabb\",\r\n    \"Kenda,Hackney\",\r\n    \"Arnita,Duggan\",\r\n    \"Eliz,Mauldin\",\r\n    \"Raymundo,Rosenbaum\",\r\n    \"Palmira,Autry\",\r\n    \"Kathrine,Tillery\",\r\n    \"George,Mcmillan\",\r\n    \"Manda,Waddell\",\r\n    \"Pasquale,Royer\",\r\n    \"Stefania,Buckingham\",\r\n    \"Ramonita,Kidwel\"\r\n]";

var ContactsCollection = {};

app.module("mail", function (mail, app, Backbone, Marionette, $, _) {

        ContactsCollection = BaseCollection.extend({

                model: ContactModel,

                //----------------------------------------------------

                initialize: function initialize(attrs, options) {

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

            mailModel.set("groups.draft", true, { silent: true });

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
                        this.listenTo(app.settings, "change:userName", this._setUserName, this);
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

                _setUserName: function _setUserName() {

                        var userName = app.settings.get("userName");

                        this.mailCollection.userName = userName;
                        this.contactCollection.userName = userName;

                        this.contactCollection.fetch({});
                },

                //------------------------------------------------------

                _updateSelection: function _updateSelection() {
                        this.mailCollection.updateSelection({});
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

                        this.listenTo(this.mails, "change:items update:success delete:success", this.checkIfEmpty, this);
                },

                //--------------------------------------------------

                checkIfEmpty: function checkIfEmpty() {

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

                        this.ui.subject.text(formatter.formatSubject(this.model.get("subject")));
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
                subject: formatter.formatSubject(this.model.get("subject")),
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
    + "\"></input></div>\r\n        </div>\r\n    </div>\r\n    <div class=\"compose-editor browser-scroll\" contenteditable=\"true\"></div>\r\n    <a href=\"javascript:void(0)\" class=\"button sendBtn\">"
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
    + "</span></span></a></div>\r\n<div class=\"navigator mailNav\">\r\n  <ul>\r\n      <li class=\"nav-inbox\"><a href=\"#inbox\">"
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6XFxzbWRcXG1haWxkb1xcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2Jhc2UtY29sbGVjdGlvbnMvYmFzZUNvbGxlY3Rpb24uanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2Jhc2UtY29sbGVjdGlvbnMvZmlsdGVyZWRDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9iYXNlLW1vZGVscy9iYXNlTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2NvbnRleHQvY29udGV4dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvZGVjb3JhdG9ycy9GaWx0ZXJDb2xsZWN0aW9uRGVjb3JhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9kZWNvcmF0b3JzL3NlbGVjdGFibGVDb2xsZWN0aW9uRGVjb3JhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9saWItZXh0ZW5zaW9ucy9iYWNrYm9uZS5zeW5jLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9saWItZXh0ZW5zaW9ucy9tYXJpb25ldHRlLmV4dGVuc2lvbnMuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2xpYi1leHRlbnNpb25zL3VuZGVyc2NvcmUubWl4aW4uZGVlcEV4dGVuZC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvcGx1Z2lucy9qcXVlcnkuYmEtb3V0c2lkZS1ldmVudHMuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3BsdWdpbnMvdG9nZ2xlLmJsb2NrLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9yZXNvbHZlcnMvZHJvcGRvd25EaXNwbGF5ZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3Jlc29sdmVycy9mb3JtYXR0ZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3Jlc29sdmVycy90cmFuc2xhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9zZXR0aW5ncy9zZXR0aW5ncy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvc2V0dGluZ3Mvc2V0dGluZ3NDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9zb2NrZXQvc29ja2V0Q29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9hdXRvQ29tcGxldGUvYXV0b0NvbXBsZXRlLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS9qcy9jb2xsZWN0aW9ucy9hdXRvQ29tcGxldGVDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS9qcy9tb2RlbHMvYXV0b0NvbXBsZXRlTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvYXV0b0NvbXBsZXRlL2pzL3ZpZXdzL2F1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvYXV0b0NvbXBsZXRlL2pzL3ZpZXdzL2F1dG9Db21wbGV0ZUl0ZW1WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS91aS90ZW1wbGF0ZXMvYXV0b0NvbXBsZXRlLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9hdXRvQ29tcGxldGUvdWkvdGVtcGxhdGVzL2F1dG9Db21wbGV0ZUl0ZW0uaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2RpYWxvZy9kaWFsb2cuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvZGlhbG9nL2pzL3ZpZXdzL2RpYWxvZ1ZpZXcxLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2RpYWxvZy91aS90ZW1wbGF0ZXMvZGlhbG9nLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9zZWFyY2gvc2VhcmNoLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL3NlYXJjaC91aS90ZW1wbGF0ZXMvc2VhcmNoLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL2pzL2NvbGxlY3Rpb25zL3RhZ0NvbGxlY3Rpb24uanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy9tb2RlbHMvdGFnTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy92aWV3cy90YWdzSXRlbVZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy92aWV3cy90YWdzVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL3RhZ3MuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy91aS90ZW1wbGF0ZXMvdGFnLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL3VpL3RlbXBsYXRlcy90YWdzQ29udGFpbmVyLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9mcmFtZS5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy9mcmFtZUxheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy9sb2FkZXJWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL2pzL3ZpZXdzL3NldHRpbmdzVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy90ZWNoQmFyVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS91aS90ZW1wbGF0ZXMvZnJhbWVMYXlvdXQuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy9sb2FkZXIuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy9zZXR0aW5nc1ZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy90ZWNoQmFyLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29sbGVjdGlvbnMvY29udGFjdHNDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb2xsZWN0aW9ucy9tYWlsQ29sbGVjdGlvbi5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29udHJvbGxlcnMvbWFpbEFjdGlvbnNDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb250cm9sbGVycy9tYWlsQ29udGVudExheW91dENvbnRyb2xsZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL2NvbnRyb2xsZXJzL21haWxEYXRhQ29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29udHJvbGxlcnMvbWFpbE1haW5MYXlvdXRDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb250cm9sbGVycy9tYWlsUm91dGVyQ29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvbW9kZWxzL2NvbnRhY3RNb2RlbC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvbW9kZWxzL2NvbnRhY3RzRmlsdGVyTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL21vZGVscy9tYWlsTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL3JvdXRlcnMvbWFpbFJvdXRlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvYWN0aW9uVmlldy9fbW9yZUFjdGlvbnNWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9hY3Rpb25WaWV3L19tb3ZlVG9WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9hY3Rpb25WaWV3L19wYWdlclZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL3ZpZXdzL2FjdGlvblZpZXcvYWN0aW9uVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvY29tcG9zZVZpZXcvX2FkZHJlc3NWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9jb21wb3NlVmlldy9jb21wb3NlVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvZW1wdHlGb2xkZXJWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9lbXB0eU1haWxWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9tYWlsQ29udGVudExheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvbWFpbEl0ZW1WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9tYWlsTWFpbkxheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvbWFpbHNWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9uYXZWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9wcmV2aWV3Vmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3Mvc2VhcmNoVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvbWFpbC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL19hZGRyZXNzVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9hY3Rpb25WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2NvbXBvc2VWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2NvbnRlbnRMYXlvdXQuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvZW1wdHlGb2xkZXJWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2VtcHR5TWFpbFZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvbWFpbEl0ZW1WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL21haWxzVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9tYWluTGF5b3V0LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL21vcmVBY3Rpb25zVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9tb3ZlVG9WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL25hdlZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvcGFnZXJWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL3ByZXZpZXdWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL3NlYXJjaFZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL3NldHVwL2FwcC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9zZXR1cC9pbml0LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL3NldHVwL3ZlbmRvcnNMb2FkZXIuanMiLCJEOi9zbWQvbWFpbGRvL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMucnVudGltZS5qcyIsIkQ6L3NtZC9tYWlsZG8vbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9iYXNlLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL2V4Y2VwdGlvbi5qcyIsIkQ6L3NtZC9tYWlsZG8vbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9ydW50aW1lLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3NhZmUtc3RyaW5nLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3V0aWxzLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9ydW50aW1lLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGJzZnkvcnVudGltZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLFlBQVksQ0FBQzs7QUFFYixJQUFJLGNBQWMsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQzs7QUFFNUMsWUFBUSxFQUFFLEVBQUU7Ozs7OztBQU1aLFNBQUssRUFBRSxlQUFVLE9BQU8sRUFBRTs7QUFFdEIsZUFBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7O0FBRXhCLFlBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDbEMsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtB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O0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDOzs7Ozs7O0FDekUxQixNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDOzs7OztBQ0YxRCxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEJhc2VDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xyXG5cclxuICAgIG1ldGFkYXRhOiB7fSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gb3ZlcnJpZGUgZmV0Y2ggZm9yIHRyaWdnZXJpbmcuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGZldGNoOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgdmFyIHN1Y2Nlc3NGdW5jID0gb3B0aW9ucy5zdWNjZXNzO1xyXG4gICAgICAgIHZhciBlcnJvckZ1bmMgPSBvcHRpb25zLmVycm9yO1xyXG5cclxuICAgICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAoY29sbGVjdGlvbiwgcmVzcG9uc2UsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcihcImZldGNoOnN1Y2Nlc3NcIiwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHN1Y2Nlc3NGdW5jKSkge1xyXG4gICAgICAgICAgICAgICAgc3VjY2Vzc0Z1bmMoY29sbGVjdGlvbiwgcmVzcG9uc2UsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBvcHRpb25zLmVycm9yID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIHJlc3BvbnNlLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLnRyaWdnZXIoXCJmZXRjaDplcnJvclwiLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24oZXJyb3JGdW5jKSkge1xyXG4gICAgICAgICAgICAgICAgZXJyb3JGdW5jKGNvbGxlY3Rpb24sIHJlc3BvbnNlLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBCYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5mZXRjaC5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIHNldFxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBzZXQ6IGZ1bmN0aW9uIChyZXNwb25zZSwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICByZXNwb25zZSA9IF8uaXNPYmplY3QocmVzcG9uc2UpID8gcmVzcG9uc2UgOiB7fTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNPYmplY3QocmVzcG9uc2UuY29sbGVjdGlvbikpIHtcclxuICAgICAgICAgICAgQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuc2V0LmNhbGwodGhpcywgcmVzcG9uc2UuY29sbGVjdGlvbiwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzT2JqZWN0KHJlc3BvbnNlLm1ldGFkYXRhKSkge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1ldGFkYXRhKHJlc3BvbnNlLm1ldGFkYXRhKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB1cGRhdGVNZXRhZGF0YTogZnVuY3Rpb24gKG1ldGFkYXRhKSB7XHJcblxyXG4gICAgICAgIGlmICghXy5pc0VxdWFsKHRoaXMubWV0YWRhdGEsIG1ldGFkYXRhKSkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tZXRhZGF0YSA9IF8uY2xvbmUobWV0YWRhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoXCJjaGFuZ2U6bWV0YWRhdGFcIiwgbWV0YWRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gZGVzdHJveVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uIChfb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSBfb3B0aW9ucyA/IF8uY2xvbmUoX29wdGlvbnMpIDoge30sXHJcbiAgICAgICAgICAgIHN1Y2Nlc3MgPSBvcHRpb25zLnN1Y2Nlc3M7XHJcblxyXG4gICAgICAgIGlmIChfLmlzQXJyYXkob3B0aW9ucy5zZWxlY3RlZEl0ZW1zKSkge1xyXG4gICAgICAgICAgICBvcHRpb25zLmRhdGEgPSBvcHRpb25zLnNlbGVjdGVkSXRlbXMuc3BsaWNlKDApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMuZGF0YSA9IHRoaXMuZ2V0TW9kZWxJZHMoKTsgLy8gYWxsIGl0ZW1zXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBfLmVhY2gob3B0aW9ucy5kYXRhLCBmdW5jdGlvbiAoaXRlbSkgeyAvLyByZW1vdmUgbmV3IG9yIG5vdCBleGlzdGVkIGl0ZW1zXHJcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IHRoYXQuZ2V0KGl0ZW0pO1xyXG4gICAgICAgICAgICBpZiAoIW1vZGVsIHx8IG1vZGVsLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZGF0YSA9IG9wdGlvbnMuZGF0YS5zbGljZSgkLmluQXJyYXkoaXRlbSwgb3B0aW9ucy5kYXRhKSwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNFbXB0eShvcHRpb25zLmRhdGEpKSB7IC8vbm8gaXRlbXMgdG8gZGVsZXRlXHJcbiAgICAgICAgICAgIG9wdGlvbnMuc3VjY2VzcygpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcCkge1xyXG4gICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgc3VjY2Vzcyh0aGF0LCByZXNwLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGF0LnRyaWdnZXIoJ2RlbGV0ZTpzdWNjZXNzJywgdGhhdCwgcmVzcCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIEJhY2tib25lLnN5bmMuYXBwbHkodGhpcywgWydkZWxldGUnLCB0aGlzLCBvcHRpb25zXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIHVwZGF0ZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKF9vcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgb3B0aW9ucyA9IF9vcHRpb25zID8gXy5jbG9uZShfb3B0aW9ucykgOiB7fSxcclxuICAgICAgICAgICAgc3VjY2Vzc0Z1bmMgPSBvcHRpb25zLnN1Y2Nlc3M7XHJcblxyXG4gICAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwKSB7XHJcbiAgICAgICAgICAgIGlmIChzdWNjZXNzRnVuYykge1xyXG4gICAgICAgICAgICAgICAgc3VjY2Vzc0Z1bmModGhhdCwgcmVzcCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhhdC50cmlnZ2VyKCd1cGRhdGU6c3VjY2VzcycsIHRoYXQsIHJlc3AsIG9wdGlvbnMpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBCYWNrYm9uZS5zeW5jLmFwcGx5KHRoaXMsIFsndXBkYXRlJywgdGhpcywgb3B0aW9uc10pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdG9KU09OOiBmdW5jdGlvbiAoX29wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdmFyIGFyciA9IFtdLFxyXG4gICAgICAgICAgICB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgb3B0aW9ucyA9IF9vcHRpb25zIHx8IHt9LFxyXG4gICAgICAgICAgICBpdGVtcyA9IG9wdGlvbnMuc2VsZWN0ZWRJdGVtcyB8fCB0aGlzLmdldE1vZGVsSWRzKCk7XHJcblxyXG4gICAgICAgIF8uZWFjaChpdGVtcywgZnVuY3Rpb24gKGl0ZW0pIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IHRoYXQuZ2V0KGl0ZW0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1vZGVsLmlzTmV3KCkgJiYgb3B0aW9ucy5maWVsZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmZpZWxkcy5wdXNoKFwiaWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwgPSBtb2RlbC50b0pTT04oe2ZpZWxkczogb3B0aW9ucy5maWVsZHN9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwgPSBtb2RlbC50b0pTT04oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGFyci5wdXNoKG1vZGVsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZ2V0TW9kZWxJZHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbW9kZWwuaWQ7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYXNlQ29sbGVjdGlvbjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgQmFzZUNvbGxlY3Rpb24gPSByZXF1aXJlKFwiLi9iYXNlQ29sbGVjdGlvblwiKTtcclxuXHJcbnZhciBGaWx0ZXJlZENvbGxlY3Rpb24gPSBCYXNlQ29sbGVjdGlvbi5leHRlbmQoe1xyXG5cclxuICAgIFBBR0VfU0laRTogMTAsXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgQmFzZUNvbGxlY3Rpb24ucHJvdG90eXBlLmluaXRpYWxpemUob3B0aW9ucyk7XHJcbiAgICAgICAgdGhpcy5zZXRGaWx0ZXJzKG9wdGlvbnMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGZldGNoQnlcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGZldGNoQnk6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICB0aGlzLnNldEZpbHRlcnMob3B0aW9ucyk7XHJcblxyXG4gICAgICAgIHRoaXMuZmV0Y2goe1xyXG5cclxuICAgICAgICAgICAgcmVzZXQ6IHRydWUsXHJcblxyXG4gICAgICAgICAgICBkYXRhOiB0aGlzLmZpbHRlcnMsXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBfLmJpbmQoZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNGZXRjaGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24ob3B0aW9ucy5zdWNjZXNzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuc3VjY2Vzcyhjb2xsZWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgdGhpcyksXHJcblxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24ob3B0aW9ucy5lcnJvcikpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmVycm9yKGNvbGxlY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNldEZpbHRlcnM6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIHRoaXMuZmlsdGVycyA9IG9wdGlvbnMuZmlsdGVycyA/IF8uY2xvbmUob3B0aW9ucy5maWx0ZXJzKSA6IHtxdWVyeTogJycsIHBhZ2U6IDF9O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIHJlZnJlc2hcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHJlZnJlc2g6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5mZXRjaEJ5KHtmaWx0ZXJzOiB0aGlzLmZpbHRlcnN9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZpbHRlcmVkQ29sbGVjdGlvbjsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBEZWVwTW9kZWwgPSByZXF1aXJlKFwiYmFja2JvbmUtZGVlcC1tb2RlbFwiKTtcclxuXHJcbnZhciBCYXNlTW9kZWwgPSBEZWVwTW9kZWwuZXh0ZW5kKHtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIHNhdmVcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNhdmU6ZnVuY3Rpb24gKGtleSwgdmFsLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGlmIChrZXkgPT0gbnVsbCB8fCB0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICBvcHRpb25zID0gdmFsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5pbnZhbGlkKSB7XHJcbiAgICAgICAgICAgIHRoaXMub24oXCJpbnZhbGlkXCIsIG9wdGlvbnMuaW52YWxpZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmVzdWx0ID0gRGVlcE1vZGVsLnByb3RvdHlwZS5zYXZlLmNhbGwodGhpcywga2V5LCB2YWwsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucy5pbnZhbGlkKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2ZmKFwiaW52YWxpZFwiLCBvcHRpb25zLmludmFsaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gdG9KU09OXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHRvSlNPTjpmdW5jdGlvbihvcHRpb25zKXtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgIGlmKG9wdGlvbnMuZmllbGRzKXtcclxuICAgICAgICAgICAgdmFyIGNvcHkgPSB7fSwgY2xvbmUgPSBfLmRlZXBDbG9uZSh0aGlzLmF0dHJpYnV0ZXMpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKG9wdGlvbnMuZmllbGRzLCBmdW5jdGlvbihmaWVsZCl7XHJcbiAgICAgICAgICAgICAgICBjb3B5W2ZpZWxkXSA9IGNsb25lW2ZpZWxkXTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY29weTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIERlZXBNb2RlbC5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcywgb3B0aW9ucyk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYXNlTW9kZWw7XHJcblxyXG5cclxuXHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBEZWVwTW9kZWwgPSByZXF1aXJlKFwiYmFja2JvbmUtZGVlcC1tb2RlbFwiKTtcclxuXHJcbnZhciBDb250ZXh0ID0gRGVlcE1vZGVsLmV4dGVuZCh7XHJcblxyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgICBtb2R1bGU6ICcnLFxyXG4gICAgICAgIG1haWw6IHtcclxuICAgICAgICAgICAgYWN0aW9uOiB7fVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGFza3M6IHtcclxuICAgICAgICAgICAgc2VsZWN0ZWRDYXRlZ29yeToge31cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb250ZXh0O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBGaWx0ZXJDb2xsZWN0aW9uRGVjb3JhdG9yID0gZnVuY3Rpb24gKG9yaWdpbmFsLCBmaWx0ZXJNb2RlbCkge1xyXG5cclxuICAgIHZhciBmaWx0ZXJDb2xsZWN0aW9uID0gJC5leHRlbmQoe30sIG9yaWdpbmFsKTtcclxuXHJcbiAgICBmaWx0ZXJDb2xsZWN0aW9uLm1vZGVscyA9IFtdO1xyXG4gICAgZmlsdGVyQ29sbGVjdGlvbi5maWx0ZXJNb2RlbCA9IGZpbHRlck1vZGVsO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBmaWx0ZXJCeVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBmaWx0ZXJDb2xsZWN0aW9uLmZpbHRlckJ5ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgIHZhciBpdGVtcztcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZmlsdGVyTW9kZWwpIHtcclxuICAgICAgICAgICAgaXRlbXMgPSBfLmZpbHRlcihvcmlnaW5hbC5tb2RlbHMsIF8uYmluZChmdW5jdGlvbiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbHRlck1vZGVsLnByZWRpY2F0ZShtb2RlbCk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpdGVtcyA9IG9yaWdpbmFsLm1vZGVscztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChfLmlzQXJyYXkob3B0aW9ucy5tYW5kYXRvcnlJdGVtcykpIHtcclxuICAgICAgICAgICAgaXRlbXMgPSBfLnVuaW9uKG9wdGlvbnMubWFuZGF0b3J5SXRlbXMsIGl0ZW1zKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChfLmlzRmluaXRlKG9wdGlvbnMubWF4SXRlbXMpKSB7XHJcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuc2xpY2UoMCwgb3B0aW9ucy5tYXhJdGVtcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoXy5pc0VtcHR5KGl0ZW1zKSkge1xyXG4gICAgICAgICAgICBmaWx0ZXJDb2xsZWN0aW9uLnRyaWdnZXIoXCJlbXB0eTpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaWx0ZXJDb2xsZWN0aW9uLnJlc2V0KGl0ZW1zKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBmaWx0ZXJBbGxcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZmlsdGVyQ29sbGVjdGlvbi5maWx0ZXJBbGwgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIGZpbHRlckNvbGxlY3Rpb24udHJpZ2dlcihcImVtcHR5OmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgZmlsdGVyQ29sbGVjdGlvbi5yZXNldChbXSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBmaWx0ZXJDb2xsZWN0aW9uO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJDb2xsZWN0aW9uRGVjb3JhdG9yO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBTZWxlY3RhYmxlQ29sbGVjdGlvbkRlY29yYXRvciA9IGZ1bmN0aW9uIChvcmlnaW5hbCkge1xyXG5cclxuICAgIHZhciBkZWNvcmF0ZWRDb2xsZWN0aW9uID0gJC5leHRlbmQoe30sIG9yaWdpbmFsKTtcclxuXHJcbiAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdGVkID0gW107XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uZ2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdGVkLnNsaWNlKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLmlzU2VsZWN0ZWQgPSBmdW5jdGlvbiAobW9kZWwpIHtcclxuXHJcbiAgICAgICAgdmFyIGlkID0gbW9kZWwuZ2V0KFwiaWRcIik7XHJcbiAgICAgICAgcmV0dXJuICQuaW5BcnJheShpZCwgZGVjb3JhdGVkQ29sbGVjdGlvbi5zZWxlY3RlZCkgIT09IC0xO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLnVuc2VsZWN0TW9kZWwgPSBmdW5jdGlvbiAobW9kZWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdmFyIGlkID0gbW9kZWwuZ2V0KFwiaWRcIik7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmdldChpZCkgJiYgJC5pbkFycmF5KGlkLCB0aGlzLnNlbGVjdGVkKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZC5zcGxpY2UoJC5pbkFycmF5KGlkLCB0aGlzLnNlbGVjdGVkKSwgMSk7XHJcbiAgICAgICAgICAgIHJhaXNlVHJpZ2dlcihvcHRpb25zKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24udXBkYXRlU2VsZWN0aW9uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdmFyIGl0ZW1zVG9SZW1vdmUgPSBbXTtcclxuXHJcbiAgICAgICAgXy5lYWNoKHRoaXMuc2VsZWN0ZWQsIF8uYmluZChmdW5jdGlvbiAoc2VsZWN0ZWRJdGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IHRoaXMuZ2V0KHNlbGVjdGVkSXRlbSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc0VtcHR5KG1vZGVsKSkge1xyXG4gICAgICAgICAgICAgICAgaXRlbXNUb1JlbW92ZS5wdXNoKHNlbGVjdGVkSXRlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzKSk7XHJcblxyXG4gICAgICAgIGlmICghXy5pc0VtcHR5KGl0ZW1zVG9SZW1vdmUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBfLmRpZmZlcmVuY2UodGhpcy5zZWxlY3RlZCwgaXRlbXNUb1JlbW92ZSk7XHJcbiAgICAgICAgICAgIHJhaXNlVHJpZ2dlcihvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLmNsZWFyU2VsZWN0ZWQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdGVkLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgcmFpc2VUcmlnZ2VyKG9wdGlvbnMpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVjb3JhdGVkQ29sbGVjdGlvbi5zZWxlY3RBbGwgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdE1vZGVscyh0aGlzLm1vZGVscywgb3B0aW9ucyk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdE1vZGVscyA9IGZ1bmN0aW9uIChtb2RlbHMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdmFyIGV4Y2x1c2l2ZWx5ID0gb3B0aW9ucyA/IG9wdGlvbnMuZXhjbHVzaXZlbHkgOiBudWxsLCByYWlzZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoZXhjbHVzaXZlbHkpIHtcclxuICAgICAgICAgICAgcmFpc2UgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBfLmVhY2gobW9kZWxzLCBmdW5jdGlvbiAobW9kZWwpIHtcclxuICAgICAgICAgICAgcmFpc2UgPSBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdE1vZGVsKG1vZGVsLCB7c2lsZW50OiB0cnVlfSkgfHwgcmFpc2U7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIGlmIChyYWlzZSkge1xyXG4gICAgICAgICAgICByYWlzZVRyaWdnZXIob3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVjb3JhdGVkQ29sbGVjdGlvbi5zZWxlY3RNb2RlbCA9IGZ1bmN0aW9uIChtb2RlbCwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgaWQgPSBtb2RlbC5nZXQoXCJpZFwiKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZ2V0KGlkKSAmJiAkLmluQXJyYXkoaWQsIHRoaXMuc2VsZWN0ZWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkLnB1c2goaWQpO1xyXG4gICAgICAgICAgICByYWlzZVRyaWdnZXIob3B0aW9ucyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24udG9nZ2xlU2VsZWN0aW9uID0gZnVuY3Rpb24gKG1vZGVsLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzU2VsZWN0ZWQobW9kZWwpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudW5zZWxlY3RNb2RlbChtb2RlbCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RNb2RlbChtb2RlbCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdmFyIHJhaXNlVHJpZ2dlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHZhciBzaWxlbnQgPSBvcHRpb25zID8gb3B0aW9ucy5zaWxlbnQgOiBudWxsO1xyXG5cclxuICAgICAgICBpZiAoIXNpbGVudCkge1xyXG4gICAgICAgICAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLnRyaWdnZXIoJ2NoYW5nZTpzZWxlY3Rpb24nLCBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdGVkLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZGVjb3JhdGVkQ29sbGVjdGlvbjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0YWJsZUNvbGxlY3Rpb25EZWNvcmF0b3I7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIHNvY2tldHNTeW5jXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgc29ja2V0U3luYyA9IGZ1bmN0aW9uIChtZXRob2QsIG1vZGVsLCBvcHRpb25zKSB7XHJcblxyXG4gICAgdmFyIG9wdHMgPSBfLmV4dGVuZCh7fSwgb3B0aW9ucyksXHJcbiAgICAgICAgZGVmZXIgPSAkLkRlZmVycmVkKCksXHJcbiAgICAgICAgcHJvbWlzZSA9IGRlZmVyLnByb21pc2UoKSxcclxuICAgICAgICByZXFOYW1lLFxyXG4gICAgICAgIHNvY2tldDtcclxuXHJcbiAgICBvcHRzLmRhdGEgPSBvcHRzLmRhdGEgfHwgbW9kZWwudG9KU09OKG9wdGlvbnMpO1xyXG5cclxuICAgIHNvY2tldCA9IG9wdHMuc29ja2V0IHx8IG1vZGVsLnNvY2tldDtcclxuICAgIHJlcU5hbWUgPSBzb2NrZXQucmVxdWVzdE5hbWUgKyBcIjpcIiArIG1ldGhvZDtcclxuXHJcbiAgICBzb2NrZXQuaW8ub25jZShyZXFOYW1lLCBmdW5jdGlvbiAocmVzKSB7XHJcbiAgICAgICAgdmFyIHN1Y2Nlc3MgPSAocmVzICYmIHJlcy5zdWNjZXNzKTsgLy8gRXhwZWN0cyBzZXJ2ZXIganNvbiByZXNwb25zZSB0byBjb250YWluIGEgYm9vbGVhbiAnc3VjY2VzcycgZmllbGRcclxuICAgICAgICBpZiAoc3VjY2Vzcykge1xyXG4gICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9wdGlvbnMuc3VjY2VzcykpIG9wdGlvbnMuc3VjY2VzcyhyZXMuZGF0YSk7XHJcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmUocmVzKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9wdGlvbnMuZXJyb3IpKSBvcHRpb25zLmVycm9yKG1vZGVsLCByZXMpO1xyXG4gICAgICAgIGRlZmVyLnJlamVjdChyZXMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc29ja2V0LmlvLmVtaXQocmVxTmFtZSwgbW9kZWwudXNlck5hbWUsIG9wdHMuZGF0YSk7XHJcbiAgICBtb2RlbC50cmlnZ2VyKCdyZXF1ZXN0JywgbW9kZWwsIHByb21pc2UsIG9wdHMpO1xyXG5cclxuICAgIHJldHVybiBwcm9taXNlO1xyXG59O1xyXG5cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIGxvY2FsU3luY1xyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxudmFyIGxvY2FsU3luYyA9IGZ1bmN0aW9uIChtZXRob2QsIG1vZGVsLCBvcHRpb25zKSB7XHJcblxyXG4gICAgdmFyIHN0b3JlID0gbW9kZWwubG9jYWxTdG9yYWdlIHx8IG1vZGVsLmNvbGxlY3Rpb24ubG9jYWxTdG9yYWdlO1xyXG5cclxuICAgIHZhciByZXNwLCBlcnJvck1lc3NhZ2UsIHN5bmNEZmQgPSAkLkRlZmVycmVkICYmICQuRGVmZXJyZWQoKTsgLy9JZiAkIGlzIGhhdmluZyBEZWZlcnJlZCAtIHVzZSBpdC5cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHN3aXRjaCAobWV0aG9kKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJyZWFkXCI6XHJcbiAgICAgICAgICAgICAgICByZXNwID0gbW9kZWwuaWQgIT09IHVuZGVmaW5lZCA/IHN0b3JlLmZpbmQobW9kZWwpIDogc3RvcmUuZmluZEFsbChtb2RlbCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcImNyZWF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmVzcCA9IHN0b3JlLmNyZWF0ZShtb2RlbCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInVwZGF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmVzcCA9IG1vZGVsLmlkICE9PSB1bmRlZmluZWQgPyBzdG9yZS51cGRhdGUobW9kZWwpIDogc3RvcmUudXBkYXRlQnVsayhtb2RlbCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcImRlbGV0ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmVzcCA9IG1vZGVsLmlkICE9PSB1bmRlZmluZWQgPyBzdG9yZS5kZXN0cm95KG1vZGVsKSA6IHN0b3JlLmRlc3Ryb3lBbGwobW9kZWwsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2UubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IFwiUHJpdmF0ZSBicm93c2luZyBpcyB1bnN1cHBvcnRlZFwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGlmIChyZXNwKSB7XHJcbiAgICAgICAgbW9kZWwudHJpZ2dlcihcInN5bmNcIiwgbW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xyXG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICBpZiAoQmFja2JvbmUuVkVSU0lPTiA9PT0gXCIwLjkuMTBcIikge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKG1vZGVsLCByZXNwLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuc3VjY2VzcyhyZXNwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHN5bmNEZmQpIHtcclxuICAgICAgICAgICAgc3luY0RmZC5yZXNvbHZlKHJlc3ApO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZXJyb3JNZXNzYWdlID0gZXJyb3JNZXNzYWdlID8gZXJyb3JNZXNzYWdlIDogXCJSZWNvcmQgTm90IEZvdW5kXCI7XHJcblxyXG4gICAgICAgIG1vZGVsLnRyaWdnZXIoXCJlcnJvclwiLCBtb2RlbCwgZXJyb3JNZXNzYWdlLCBvcHRpb25zKTtcclxuICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmVycm9yKSB7XHJcbiAgICAgICAgICAgIGlmIChCYWNrYm9uZS5WRVJTSU9OID09PSBcIjAuOS4xMFwiKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLmVycm9yKG1vZGVsLCBlcnJvck1lc3NhZ2UsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5lcnJvcihlcnJvck1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzeW5jRGZkKSB7XHJcbiAgICAgICAgICAgIHN5bmNEZmQucmVqZWN0KGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuY29tcGxldGUpIHtcclxuICAgICAgICBvcHRpb25zLmNvbXBsZXRlKHJlc3ApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzeW5jRGZkICYmIHN5bmNEZmQucHJvbWlzZSgpO1xyXG59O1xyXG5cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIE92ZXJyaWRlIEJhY2tib25lLnN5bmNcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnZhciBhamF4U3luYyA9IEJhY2tib25lLnN5bmM7XHJcblxyXG52YXIgZ2V0U3luY01ldGhvZCA9IGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgaWYgKG1vZGVsLmxvY2FsU3RvcmFnZSB8fCAobW9kZWwuY29sbGVjdGlvbiAmJiBtb2RlbC5jb2xsZWN0aW9uLmxvY2FsU3RvcmFnZSkpIHtcclxuICAgICAgICByZXR1cm4gbG9jYWxTeW5jO1xyXG4gICAgfVxyXG4gICAgaWYgKG1vZGVsLnNvY2tldCB8fCAobW9kZWwuY29sbGVjdGlvbiAmJiBtb2RlbC5jb2xsZWN0aW9uLnNvY2tldCkpIHtcclxuICAgICAgICByZXR1cm4gc29ja2V0U3luYztcclxuICAgIH1cclxuICAgIHJldHVybiBhamF4U3luYztcclxufTtcclxuXHJcbkJhY2tib25lLnN5bmMgPSBmdW5jdGlvbiAobWV0aG9kLCBtb2RlbCwgb3B0aW9ucykge1xyXG4gICAgZ2V0U3luY01ldGhvZChtb2RlbCkuYXBwbHkodGhpcywgW21ldGhvZCwgbW9kZWwsIG9wdGlvbnNdKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuU3luYztcclxuIiwiICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIHZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gYWRkIC0gYW4gYWx0ZXJuYXRpdmUgdG8gcmVnaW9uLnNob3coKSwgZG9lc24ndCBub3QgcmVtb3ZlIHBlcm1hbmVudCB2aWV3c1xyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgTWFyaW9uZXR0ZS5SZWdpb24ucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHZpZXcsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgIGlmKF8uaXNPYmplY3QodmlldykgJiYgIV8uaXNFbXB0eSh2aWV3LmNpZCkpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy52aWV3cyA9IHRoaXMudmlld3MgfHwge307XHJcbiAgICAgICAgICAgIHRoaXMuX2Vuc3VyZUVsZW1lbnQoKTtcclxuICAgICAgICAgICAgdGhpcy5jbGVhbih2aWV3LmNpZCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2hhc1ZpZXcodmlldykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2FkZFZpZXcodmlldyk7XHJcbiAgICAgICAgICAgICAgICB2aWV3LnJlbmRlcigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kZWwuYXBwZW5kKHZpZXcuZWwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZihvcHRpb25zLmhpZGVPdGhlclZpZXdzKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dWaWV3KHZpZXcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBNYXJpb25ldHRlLnRyaWdnZXJNZXRob2QuY2FsbCh2aWV3LCBcInNob3dcIik7XHJcbiAgICAgICAgICAgIE1hcmlvbmV0dGUudHJpZ2dlck1ldGhvZC5jYWxsKHRoaXMsIFwic2hvd1wiLCB2aWV3KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIE1hcmlvbmV0dGUuUmVnaW9uLnByb3RvdHlwZS5jbGVhbiA9IGZ1bmN0aW9uKGN1cnJWaWV3SWQpIHtcclxuXHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMudmlld3MpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciB2aWV3ID0gdGhpcy52aWV3c1trZXldO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZpZXcgJiYgIXZpZXcuaXNQZXJtYW5lbnQgJiYgIXZpZXcuaXNEZXN0cm95ZWQgJiYgdmlldy5jaWQgIT09IGN1cnJWaWV3SWQpIHtcclxuICAgICAgICAgICAgICAgIGlmICh2aWV3LmRlc3Ryb3kpIHt2aWV3LmRlc3Ryb3koKTt9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2aWV3LnJlbW92ZSkge3ZpZXcucmVtb3ZlKCk7fVxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMudmlld3Nba2V5XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgTWFyaW9uZXR0ZS5SZWdpb24ucHJvdG90eXBlLl9oYXNWaWV3ID0gZnVuY3Rpb24gKHZpZXcpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIF8uaXNPYmplY3QodGhpcy52aWV3c1t2aWV3LmNpZF0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBNYXJpb25ldHRlLlJlZ2lvbi5wcm90b3R5cGUuX2FkZFZpZXcgPSBmdW5jdGlvbih2aWV3KXtcclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMudmlld3Nbdmlldy5jaWRdID0gdmlldztcclxuXHJcbiAgICAgICAgdGhpcy5saXN0ZW5Ubyh2aWV3LCBcImRlc3Ryb3lcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBkZWxldGUgdGhhdC52aWV3c1t2aWV3LmNpZF07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIE1hcmlvbmV0dGUuUmVnaW9uLnByb3RvdHlwZS5fc2hvd1ZpZXcgPSBmdW5jdGlvbiAodmlldyxvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLnZpZXdzKSB7XHJcbiAgICAgICAgICAgIHZhciBfdmlldyA9IHRoaXMudmlld3Nba2V5XTtcclxuICAgICAgICAgICAgaWYgKF92aWV3LmNpZCAhPT0gdmlldy5jaWQpIHtcclxuICAgICAgICAgICAgICAgIF92aWV3LiRlbC5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdmlldy4kZWwuc2hvdygpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBvdmVycmlkZSBkZXN0cm95IC0gY2FsbGVkIGJ5IHJlZ2lvbi5zaG93KClcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHZhciBfb3JpZ2luYWxEZXN0cm95ID0gTWFyaW9uZXR0ZS5SZWdpb24ucHJvdG90eXBlLmRlc3Ryb3k7XHJcblxyXG4gICAgTWFyaW9uZXR0ZS5SZWdpb24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIF9vcmlnaW5hbERlc3Ryb3kuYXBwbHkodGhpcywgW10uc2xpY2UuYXBwbHkoYXJndW1lbnRzKSk7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLnZpZXdzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgdmlldyA9IHRoaXMudmlld3Nba2V5XTtcclxuXHJcbiAgICAgICAgICAgIGlmKF8uaXNPYmplY3Qodmlldykpe1xyXG4gICAgICAgICAgICAgICAgaWYgKHZpZXcuZGVzdHJveSkge3ZpZXcuZGVzdHJveSgpO31cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZpZXcucmVtb3ZlKSB7dmlldy5yZW1vdmUoKTt9XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy52aWV3c1trZXldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IE1hcmlvbmV0dGU7XHJcbiIsIiAgICAgICAgdmFyIGFycmF5cywgYmFzaWNPYmplY3RzLCBkZWVwQ2xvbmUsIGRlZXBFeHRlbmQsIGRlZXBFeHRlbmRDb3VwbGUsIGlzQmFzaWNPYmplY3QsXHJcbiAgICAgICAgICAgIF9fc2xpY2UgPSBbXS5zbGljZTtcclxuXHJcblxyXG4gICAgICAgIGRlZXBDbG9uZSA9IGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICAgICAgdmFyIGZ1bmMsIGlzQXJyO1xyXG4gICAgICAgICAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSB8fCBfLmlzRnVuY3Rpb24ob2JqKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgQmFja2JvbmUuQ29sbGVjdGlvbiB8fCBvYmogaW5zdGFuY2VvZiBCYWNrYm9uZS5Nb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoXy5pc0RhdGUob2JqKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai5nZXRUaW1lKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChfLmlzUmVnRXhwKG9iaikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKG9iai5zb3VyY2UsIG9iai50b1N0cmluZygpLnJlcGxhY2UoLy4qXFwvLywgXCJcIikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlzQXJyID0gXy5pc0FycmF5KG9iaiB8fCBfLmlzQXJndW1lbnRzKG9iaikpO1xyXG4gICAgICAgICAgICBmdW5jID0gZnVuY3Rpb24gKG1lbW8sIHZhbHVlLCBrZXkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc0Fycikge1xyXG4gICAgICAgICAgICAgICAgICAgIG1lbW8ucHVzaChkZWVwQ2xvbmUodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWVtb1trZXldID0gZGVlcENsb25lKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBtZW1vO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gXy5yZWR1Y2Uob2JqLCBmdW5jLCBpc0FyciA/IFtdIDoge30pO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICBpc0Jhc2ljT2JqZWN0ID0gZnVuY3Rpb24gKG9iamVjdCkge1xyXG4gICAgICAgICAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgcmV0dXJuIChvYmplY3QucHJvdG90eXBlID09PSB7fS5wcm90b3R5cGUgfHwgb2JqZWN0LnByb3RvdHlwZSA9PT0gT2JqZWN0LnByb3RvdHlwZSkgJiYgXy5pc09iamVjdChvYmplY3QpICYmICFfLmlzQXJyYXkob2JqZWN0KSAmJiAhXy5pc0Z1bmN0aW9uKG9iamVjdCkgJiYgIV8uaXNEYXRlKG9iamVjdCkgJiYgIV8uaXNSZWdFeHAob2JqZWN0KSAmJiAhXy5pc0FyZ3VtZW50cyhvYmplY3QpO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICBiYXNpY09iamVjdHMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmZpbHRlcihfLmtleXMob2JqZWN0KSwgZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzQmFzaWNPYmplY3Qob2JqZWN0W2tleV0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgYXJyYXlzID0gZnVuY3Rpb24gKG9iamVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5maWx0ZXIoXy5rZXlzKG9iamVjdCksIGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmlzQXJyYXkob2JqZWN0W2tleV0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgZGVlcEV4dGVuZENvdXBsZSA9IGZ1bmN0aW9uIChkZXN0aW5hdGlvbiwgc291cmNlLCBtYXhEZXB0aCkge1xyXG4gICAgICAgICAgICB2YXIgY29tYmluZSwgcmVjdXJzZSwgc2hhcmVkQXJyYXlLZXksIHNoYXJlZEFycmF5S2V5cywgc2hhcmVkT2JqZWN0S2V5LCBzaGFyZWRPYmplY3RLZXlzLCBfaSwgX2osIF9sZW4sIF9sZW4xO1xyXG4gICAgICAgICAgICBpZiAobWF4RGVwdGggPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgbWF4RGVwdGggPSAyMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobWF4RGVwdGggPD0gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdfLmRlZXBFeHRlbmQoKTogTWF4aW11bSBkZXB0aCBvZiByZWN1cnNpb24gaGl0LicpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZXh0ZW5kKGRlc3RpbmF0aW9uLCBzb3VyY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNoYXJlZE9iamVjdEtleXMgPSBfLmludGVyc2VjdGlvbihiYXNpY09iamVjdHMoZGVzdGluYXRpb24pLCBiYXNpY09iamVjdHMoc291cmNlKSk7XHJcbiAgICAgICAgICAgIHJlY3Vyc2UgPSBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2Vba2V5XSA9IGRlZXBFeHRlbmRDb3VwbGUoZGVzdGluYXRpb25ba2V5XSwgc291cmNlW2tleV0sIG1heERlcHRoIC0gMSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc291cmNlW2tleV07XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gc2hhcmVkT2JqZWN0S2V5cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgc2hhcmVkT2JqZWN0S2V5ID0gc2hhcmVkT2JqZWN0S2V5c1tfaV07XHJcbiAgICAgICAgICAgICAgICByZWN1cnNlKHNoYXJlZE9iamVjdEtleSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2hhcmVkQXJyYXlLZXlzID0gXy5pbnRlcnNlY3Rpb24oYXJyYXlzKGRlc3RpbmF0aW9uKSwgYXJyYXlzKHNvdXJjZSkpO1xyXG4gICAgICAgICAgICBjb21iaW5lID0gZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICAgICAgc291cmNlW2tleV0gPSBfLnVuaW9uKGRlc3RpbmF0aW9uW2tleV0sIHNvdXJjZVtrZXldKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzb3VyY2Vba2V5XTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gc2hhcmVkQXJyYXlLZXlzLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xyXG4gICAgICAgICAgICAgICAgc2hhcmVkQXJyYXlLZXkgPSBzaGFyZWRBcnJheUtleXNbX2pdO1xyXG4gICAgICAgICAgICAgICAgY29tYmluZShzaGFyZWRBcnJheUtleSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIF8uZXh0ZW5kKGRlc3RpbmF0aW9uLCBzb3VyY2UpO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICBkZWVwRXh0ZW5kID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgZmluYWxPYmosIG1heERlcHRoLCBvYmplY3RzLCBfaTtcclxuICAgICAgICAgICAgb2JqZWN0cyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIF9pID0gYXJndW1lbnRzLmxlbmd0aCAtIDEpIDogKF9pID0gMCwgW10pO1xyXG4gICAgICAgICAgICBtYXhEZXB0aCA9IGFyZ3VtZW50c1tfaSsrXTtcclxuICAgICAgICAgICAgaWYgKCFfLmlzTnVtYmVyKG1heERlcHRoKSkge1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0cy5wdXNoKG1heERlcHRoKTtcclxuICAgICAgICAgICAgICAgIG1heERlcHRoID0gMjA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG9iamVjdHMubGVuZ3RoIDw9IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3RzWzBdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChtYXhEZXB0aCA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5leHRlbmQuYXBwbHkodGhpcywgb2JqZWN0cyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZmluYWxPYmogPSBvYmplY3RzLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIHdoaWxlIChvYmplY3RzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGZpbmFsT2JqID0gZGVlcEV4dGVuZENvdXBsZShmaW5hbE9iaiwgZGVlcENsb25lKG9iamVjdHMuc2hpZnQoKSksIG1heERlcHRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmluYWxPYmo7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIF8ubWl4aW4oe1xyXG4gICAgICAgICAgICBkZWVwQ2xvbmU6ZGVlcENsb25lLFxyXG4gICAgICAgICAgICBpc0Jhc2ljT2JqZWN0OmlzQmFzaWNPYmplY3QsXHJcbiAgICAgICAgICAgIGJhc2ljT2JqZWN0czpiYXNpY09iamVjdHMsXHJcbiAgICAgICAgICAgIGFycmF5czphcnJheXMsXHJcbiAgICAgICAgICAgIGRlZXBFeHRlbmQ6ZGVlcEV4dGVuZFxyXG4gICAgICAgIH0pO1xyXG4iLCIvKiFcclxuICogalF1ZXJ5IG91dHNpZGUgZXZlbnRzIC0gdjEuMSAtIDMvMTYvMjAxMFxyXG4gKiBodHRwOi8vYmVuYWxtYW4uY29tL3Byb2plY3RzL2pxdWVyeS1vdXRzaWRlLWV2ZW50cy1wbHVnaW4vXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxMCBcIkNvd2JveVwiIEJlbiBBbG1hblxyXG4gKiBEdWFsIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCBsaWNlbnNlcy5cclxuICogaHR0cDovL2JlbmFsbWFuLmNvbS9hYm91dC9saWNlbnNlL1xyXG4gKi9cclxuXHJcbi8vIFNjcmlwdDogalF1ZXJ5IG91dHNpZGUgZXZlbnRzXHJcbi8vXHJcbi8vICpWZXJzaW9uOiAxLjEsIExhc3QgdXBkYXRlZDogMy8xNi8yMDEwKlxyXG4vL1xyXG4vLyBQcm9qZWN0IEhvbWUgLSBodHRwOi8vYmVuYWxtYW4uY29tL3Byb2plY3RzL2pxdWVyeS1vdXRzaWRlLWV2ZW50cy1wbHVnaW4vXHJcbi8vIEdpdEh1YiAgICAgICAtIGh0dHA6Ly9naXRodWIuY29tL2Nvd2JveS9qcXVlcnktb3V0c2lkZS1ldmVudHMvXHJcbi8vIFNvdXJjZSAgICAgICAtIGh0dHA6Ly9naXRodWIuY29tL2Nvd2JveS9qcXVlcnktb3V0c2lkZS1ldmVudHMvcmF3L21hc3Rlci9qcXVlcnkuYmEtb3V0c2lkZS1ldmVudHMuanNcclxuLy8gKE1pbmlmaWVkKSAgIC0gaHR0cDovL2dpdGh1Yi5jb20vY293Ym95L2pxdWVyeS1vdXRzaWRlLWV2ZW50cy9yYXcvbWFzdGVyL2pxdWVyeS5iYS1vdXRzaWRlLWV2ZW50cy5taW4uanMgKDAuOWtiKVxyXG4vL1xyXG4vLyBBYm91dDogTGljZW5zZVxyXG4vL1xyXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTAgXCJDb3dib3lcIiBCZW4gQWxtYW4sXHJcbi8vIER1YWwgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIGxpY2Vuc2VzLlxyXG4vLyBodHRwOi8vYmVuYWxtYW4uY29tL2Fib3V0L2xpY2Vuc2UvXHJcbi8vXHJcbi8vIEFib3V0OiBFeGFtcGxlc1xyXG4vL1xyXG4vLyBUaGVzZSB3b3JraW5nIGV4YW1wbGVzLCBjb21wbGV0ZSB3aXRoIGZ1bGx5IGNvbW1lbnRlZCBjb2RlLCBpbGx1c3RyYXRlIGEgZmV3XHJcbi8vIHdheXMgaW4gd2hpY2ggdGhpcyBwbHVnaW4gY2FuIGJlIHVzZWQuXHJcbi8vXHJcbi8vIGNsaWNrb3V0c2lkZSAtIGh0dHA6Ly9iZW5hbG1hbi5jb20vY29kZS9wcm9qZWN0cy9qcXVlcnktb3V0c2lkZS1ldmVudHMvZXhhbXBsZXMvY2xpY2tvdXRzaWRlL1xyXG4vLyBkYmxjbGlja291dHNpZGUgLSBodHRwOi8vYmVuYWxtYW4uY29tL2NvZGUvcHJvamVjdHMvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL2V4YW1wbGVzL2RibGNsaWNrb3V0c2lkZS9cclxuLy8gbW91c2VvdmVyb3V0c2lkZSAtIGh0dHA6Ly9iZW5hbG1hbi5jb20vY29kZS9wcm9qZWN0cy9qcXVlcnktb3V0c2lkZS1ldmVudHMvZXhhbXBsZXMvbW91c2VvdmVyb3V0c2lkZS9cclxuLy8gZm9jdXNvdXRzaWRlIC0gaHR0cDovL2JlbmFsbWFuLmNvbS9jb2RlL3Byb2plY3RzL2pxdWVyeS1vdXRzaWRlLWV2ZW50cy9leGFtcGxlcy9mb2N1c291dHNpZGUvXHJcbi8vXHJcbi8vIEFib3V0OiBTdXBwb3J0IGFuZCBUZXN0aW5nXHJcbi8vXHJcbi8vIEluZm9ybWF0aW9uIGFib3V0IHdoYXQgdmVyc2lvbiBvciB2ZXJzaW9ucyBvZiBqUXVlcnkgdGhpcyBwbHVnaW4gaGFzIGJlZW5cclxuLy8gdGVzdGVkIHdpdGgsIHdoYXQgYnJvd3NlcnMgaXQgaGFzIGJlZW4gdGVzdGVkIGluLCBhbmQgd2hlcmUgdGhlIHVuaXQgdGVzdHNcclxuLy8gcmVzaWRlIChzbyB5b3UgY2FuIHRlc3QgaXQgeW91cnNlbGYpLlxyXG4vL1xyXG4vLyBqUXVlcnkgVmVyc2lvbnMgLSAxLjQuMlxyXG4vLyBCcm93c2VycyBUZXN0ZWQgLSBJbnRlcm5ldCBFeHBsb3JlciA2LTgsIEZpcmVmb3ggMi0zLjYsIFNhZmFyaSAzLTQsIENocm9tZSwgT3BlcmEgOS42LTEwLjEuXHJcbi8vIFVuaXQgVGVzdHMgICAgICAtIGh0dHA6Ly9iZW5hbG1hbi5jb20vY29kZS9wcm9qZWN0cy9qcXVlcnktb3V0c2lkZS1ldmVudHMvdW5pdC9cclxuLy9cclxuLy8gQWJvdXQ6IFJlbGVhc2UgSGlzdG9yeVxyXG4vL1xyXG4vLyAxLjEgLSAoMy8xNi8yMDEwKSBNYWRlIFwiY2xpY2tvdXRzaWRlXCIgcGx1Z2luIG1vcmUgZ2VuZXJhbCwgcmVzdWx0aW5nIGluIGFcclxuLy8gICAgICAgd2hvbGUgbmV3IHBsdWdpbiB3aXRoIG1vcmUgdGhhbiBhIGRvemVuIGRlZmF1bHQgXCJvdXRzaWRlXCIgZXZlbnRzIGFuZFxyXG4vLyAgICAgICBhIG1ldGhvZCB0aGF0IGNhbiBiZSB1c2VkIHRvIGFkZCBuZXcgb25lcy5cclxuLy8gMS4wIC0gKDIvMjcvMjAxMCkgSW5pdGlhbCByZWxlYXNlXHJcbi8vXHJcbi8vIFRvcGljOiBEZWZhdWx0IFwib3V0c2lkZVwiIGV2ZW50c1xyXG4vL1xyXG4vLyBOb3RlIHRoYXQgZWFjaCBcIm91dHNpZGVcIiBldmVudCBpcyBwb3dlcmVkIGJ5IGFuIFwib3JpZ2luYXRpbmdcIiBldmVudC4gT25seVxyXG4vLyB3aGVuIHRoZSBvcmlnaW5hdGluZyBldmVudCBpcyB0cmlnZ2VyZWQgb24gYW4gZWxlbWVudCBvdXRzaWRlIHRoZSBlbGVtZW50XHJcbi8vIHRvIHdoaWNoIHRoYXQgb3V0c2lkZSBldmVudCBpcyBib3VuZCB3aWxsIHRoZSBib3VuZCBldmVudCBiZSB0cmlnZ2VyZWQuXHJcbi8vXHJcbi8vIEJlY2F1c2UgZWFjaCBvdXRzaWRlIGV2ZW50IGlzIHBvd2VyZWQgYnkgYSBzZXBhcmF0ZSBvcmlnaW5hdGluZyBldmVudCxcclxuLy8gc3RvcHBpbmcgcHJvcGFnYXRpb24gb2YgdGhhdCBvcmlnaW5hdGluZyBldmVudCB3aWxsIHByZXZlbnQgaXRzIHJlbGF0ZWRcclxuLy8gb3V0c2lkZSBldmVudCBmcm9tIHRyaWdnZXJpbmcuXHJcbi8vXHJcbi8vICBPVVRTSURFIEVWRU5UICAgICAtIE9SSUdJTkFUSU5HIEVWRU5UXHJcbi8vICBjbGlja291dHNpZGUgICAgICAtIGNsaWNrXHJcbi8vICBkYmxjbGlja291dHNpZGUgICAtIGRibGNsaWNrXHJcbi8vICBmb2N1c291dHNpZGUgICAgICAtIGZvY3VzaW5cclxuLy8gIGJsdXJvdXRzaWRlICAgICAgIC0gZm9jdXNvdXRcclxuLy8gIG1vdXNlbW92ZW91dHNpZGUgIC0gbW91c2Vtb3ZlXHJcbi8vICBtb3VzZWRvd25vdXRzaWRlICAtIG1vdXNlZG93blxyXG4vLyAgbW91c2V1cG91dHNpZGUgICAgLSBtb3VzZXVwXHJcbi8vICBtb3VzZW92ZXJvdXRzaWRlICAtIG1vdXNlb3ZlclxyXG4vLyAgbW91c2VvdXRvdXRzaWRlICAgLSBtb3VzZW91dFxyXG4vLyAga2V5ZG93bm91dHNpZGUgICAgLSBrZXlkb3duXHJcbi8vICBrZXlwcmVzc291dHNpZGUgICAtIGtleXByZXNzXHJcbi8vICBrZXl1cG91dHNpZGUgICAgICAtIGtleXVwXHJcbi8vICBjaGFuZ2VvdXRzaWRlICAgICAtIGNoYW5nZVxyXG4vLyAgc2VsZWN0b3V0c2lkZSAgICAgLSBzZWxlY3RcclxuLy8gIHN1Ym1pdG91dHNpZGUgICAgIC0gc3VibWl0XHJcblxyXG5cclxudmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuKGZ1bmN0aW9uKCQsZG9jLG91dHNpZGUpe1xyXG4gICckOm5vbXVuZ2UnOyAvLyBVc2VkIGJ5IFlVSSBjb21wcmVzc29yLlxyXG5cclxuICAkLm1hcChcclxuICAgIC8vIEFsbCB0aGVzZSBldmVudHMgd2lsbCBnZXQgYW4gXCJvdXRzaWRlXCIgZXZlbnQgY291bnRlcnBhcnQgYnkgZGVmYXVsdC5cclxuICAgICdjbGljayBkYmxjbGljayBtb3VzZW1vdmUgbW91c2Vkb3duIG1vdXNldXAgbW91c2VvdmVyIG1vdXNlb3V0IGNoYW5nZSBzZWxlY3Qgc3VibWl0IGtleWRvd24ga2V5cHJlc3Mga2V5dXAnLnNwbGl0KCcgJyksXHJcbiAgICBmdW5jdGlvbiggZXZlbnRfbmFtZSApIHsganFfYWRkT3V0c2lkZUV2ZW50KCBldmVudF9uYW1lICk7IH1cclxuICApO1xyXG5cclxuICAvLyBUaGUgZm9jdXMgYW5kIGJsdXIgZXZlbnRzIGFyZSByZWFsbHkgZm9jdXNpbiBhbmQgZm9jdXNvdXQgd2hlbiBpdCBjb21lc1xyXG4gIC8vIHRvIGRlbGVnYXRpb24sIHNvIHRoZXkgYXJlIGEgc3BlY2lhbCBjYXNlLlxyXG4gIGpxX2FkZE91dHNpZGVFdmVudCggJ2ZvY3VzaW4nLCAgJ2ZvY3VzJyArIG91dHNpZGUgKTtcclxuICBqcV9hZGRPdXRzaWRlRXZlbnQoICdmb2N1c291dCcsICdibHVyJyArIG91dHNpZGUgKTtcclxuXHJcbiAgLy8gTWV0aG9kOiBqUXVlcnkuYWRkT3V0c2lkZUV2ZW50XHJcbiAgLy9cclxuICAvLyBSZWdpc3RlciBhIG5ldyBcIm91dHNpZGVcIiBldmVudCB0byBiZSB3aXRoIHRoaXMgbWV0aG9kLiBBZGRpbmcgYW4gb3V0c2lkZVxyXG4gIC8vIGV2ZW50IHRoYXQgYWxyZWFkeSBleGlzdHMgd2lsbCBwcm9iYWJseSBibG93IHRoaW5ncyB1cCwgc28gY2hlY2sgdGhlXHJcbiAgLy8gPERlZmF1bHQgXCJvdXRzaWRlXCIgZXZlbnRzPiBsaXN0IGJlZm9yZSB0cnlpbmcgdG8gYWRkIGEgbmV3IG9uZS5cclxuICAvL1xyXG4gIC8vIFVzYWdlOlxyXG4gIC8vXHJcbiAgLy8gPiBqUXVlcnkuYWRkT3V0c2lkZUV2ZW50KCBldmVudF9uYW1lIFssIG91dHNpZGVfZXZlbnRfbmFtZSBdICk7XHJcbiAgLy9cclxuICAvLyBBcmd1bWVudHM6XHJcbiAgLy9cclxuICAvLyAgZXZlbnRfbmFtZSAtIChTdHJpbmcpIFRoZSBuYW1lIG9mIHRoZSBvcmlnaW5hdGluZyBldmVudCB0aGF0IHRoZSBuZXdcclxuICAvLyAgICBcIm91dHNpZGVcIiBldmVudCB3aWxsIGJlIHBvd2VyZWQgYnkuIFRoaXMgZXZlbnQgY2FuIGJlIGEgbmF0aXZlIG9yXHJcbiAgLy8gICAgY3VzdG9tIGV2ZW50LCBhcyBsb25nIGFzIGl0IGJ1YmJsZXMgdXAgdGhlIERPTSB0cmVlLlxyXG4gIC8vICBvdXRzaWRlX2V2ZW50X25hbWUgLSAoU3RyaW5nKSBBbiBvcHRpb25hbCBuYW1lIGZvciB0aGUgbmV3IFwib3V0c2lkZVwiXHJcbiAgLy8gICAgZXZlbnQuIElmIG9taXR0ZWQsIHRoZSBvdXRzaWRlIGV2ZW50IHdpbGwgYmUgbmFtZWQgd2hhdGV2ZXIgdGhlXHJcbiAgLy8gICAgdmFsdWUgb2YgYGV2ZW50X25hbWVgIGlzIHBsdXMgdGhlIFwib3V0c2lkZVwiIHN1ZmZpeC5cclxuICAvL1xyXG4gIC8vIFJldHVybnM6XHJcbiAgLy9cclxuICAvLyAgTm90aGluZy5cclxuXHJcbiAgJC5hZGRPdXRzaWRlRXZlbnQgPSBqcV9hZGRPdXRzaWRlRXZlbnQ7XHJcblxyXG4gIGZ1bmN0aW9uIGpxX2FkZE91dHNpZGVFdmVudCggZXZlbnRfbmFtZSwgb3V0c2lkZV9ldmVudF9uYW1lICkge1xyXG5cclxuICAgIC8vIFRoZSBcIm91dHNpZGVcIiBldmVudCBuYW1lLlxyXG4gICAgb3V0c2lkZV9ldmVudF9uYW1lID0gb3V0c2lkZV9ldmVudF9uYW1lIHx8IGV2ZW50X25hbWUgKyBvdXRzaWRlO1xyXG5cclxuICAgIC8vIEEgalF1ZXJ5IG9iamVjdCBjb250YWluaW5nIGFsbCBlbGVtZW50cyB0byB3aGljaCB0aGUgXCJvdXRzaWRlXCIgZXZlbnQgaXNcclxuICAgIC8vIGJvdW5kLlxyXG4gICAgdmFyIGVsZW1zID0gJCgpLFxyXG5cclxuICAgICAgLy8gVGhlIFwib3JpZ2luYXRpbmdcIiBldmVudCwgbmFtZXNwYWNlZCBmb3IgZWFzeSB1bmJpbmRpbmcuXHJcbiAgICAgIGV2ZW50X25hbWVzcGFjZWQgPSBldmVudF9uYW1lICsgJy4nICsgb3V0c2lkZV9ldmVudF9uYW1lICsgJy1zcGVjaWFsLWV2ZW50JztcclxuXHJcbiAgICAvLyBFdmVudDogb3V0c2lkZSBldmVudHNcclxuICAgIC8vXHJcbiAgICAvLyBBbiBcIm91dHNpZGVcIiBldmVudCBpcyB0cmlnZ2VyZWQgb24gYW4gZWxlbWVudCB3aGVuIGl0cyBjb3JyZXNwb25kaW5nXHJcbiAgICAvLyBcIm9yaWdpbmF0aW5nXCIgZXZlbnQgaXMgdHJpZ2dlcmVkIG9uIGFuIGVsZW1lbnQgb3V0c2lkZSB0aGUgZWxlbWVudCBpblxyXG4gICAgLy8gcXVlc3Rpb24uIFNlZSB0aGUgPERlZmF1bHQgXCJvdXRzaWRlXCIgZXZlbnRzPiBsaXN0IGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAgLy9cclxuICAgIC8vIFVzYWdlOlxyXG4gICAgLy9cclxuICAgIC8vID4galF1ZXJ5KCdzZWxlY3RvcicpLmJpbmQoICdjbGlja291dHNpZGUnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgLy8gPiAgIHZhciBjbGlja2VkX2VsZW0gPSAkKGV2ZW50LnRhcmdldCk7XHJcbiAgICAvLyA+ICAgLi4uXHJcbiAgICAvLyA+IH0pO1xyXG4gICAgLy9cclxuICAgIC8vID4galF1ZXJ5KCdzZWxlY3RvcicpLmJpbmQoICdkYmxjbGlja291dHNpZGUnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgLy8gPiAgIHZhciBkb3VibGVfY2xpY2tlZF9lbGVtID0gJChldmVudC50YXJnZXQpO1xyXG4gICAgLy8gPiAgIC4uLlxyXG4gICAgLy8gPiB9KTtcclxuICAgIC8vXHJcbiAgICAvLyA+IGpRdWVyeSgnc2VsZWN0b3InKS5iaW5kKCAnbW91c2VvdmVyb3V0c2lkZScsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAvLyA+ICAgdmFyIG1vdXNlZF9vdmVyX2VsZW0gPSAkKGV2ZW50LnRhcmdldCk7XHJcbiAgICAvLyA+ICAgLi4uXHJcbiAgICAvLyA+IH0pO1xyXG4gICAgLy9cclxuICAgIC8vID4galF1ZXJ5KCdzZWxlY3RvcicpLmJpbmQoICdmb2N1c291dHNpZGUnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgLy8gPiAgIHZhciBmb2N1c2VkX2VsZW0gPSAkKGV2ZW50LnRhcmdldCk7XHJcbiAgICAvLyA+ICAgLi4uXHJcbiAgICAvLyA+IH0pO1xyXG4gICAgLy9cclxuICAgIC8vIFlvdSBnZXQgdGhlIGlkZWEsIHJpZ2h0P1xyXG5cclxuICAgICQuZXZlbnQuc3BlY2lhbFsgb3V0c2lkZV9ldmVudF9uYW1lIF0gPSB7XHJcblxyXG4gICAgICAvLyBDYWxsZWQgb25seSB3aGVuIHRoZSBmaXJzdCBcIm91dHNpZGVcIiBldmVudCBjYWxsYmFjayBpcyBib3VuZCBwZXJcclxuICAgICAgLy8gZWxlbWVudC5cclxuICAgICAgc2V0dXA6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIC8vIEFkZCB0aGlzIGVsZW1lbnQgdG8gdGhlIGxpc3Qgb2YgZWxlbWVudHMgdG8gd2hpY2ggdGhpcyBcIm91dHNpZGVcIlxyXG4gICAgICAgIC8vIGV2ZW50IGlzIGJvdW5kLlxyXG4gICAgICAgIGVsZW1zID0gZWxlbXMuYWRkKCB0aGlzICk7XHJcblxyXG4gICAgICAgIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGVsZW1lbnQgZ2V0dGluZyB0aGUgZXZlbnQgYm91bmQsIGJpbmQgYSBoYW5kbGVyXHJcbiAgICAgICAgLy8gdG8gZG9jdW1lbnQgdG8gY2F0Y2ggYWxsIGNvcnJlc3BvbmRpbmcgXCJvcmlnaW5hdGluZ1wiIGV2ZW50cy5cclxuICAgICAgICBpZiAoIGVsZW1zLmxlbmd0aCA9PT0gMSApIHtcclxuICAgICAgICAgICQoZG9jKS5iaW5kKCBldmVudF9uYW1lc3BhY2VkLCBoYW5kbGVfZXZlbnQgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBDYWxsZWQgb25seSB3aGVuIHRoZSBsYXN0IFwib3V0c2lkZVwiIGV2ZW50IGNhbGxiYWNrIGlzIHVuYm91bmQgcGVyXHJcbiAgICAgIC8vIGVsZW1lbnQuXHJcbiAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAvLyBSZW1vdmUgdGhpcyBlbGVtZW50IGZyb20gdGhlIGxpc3Qgb2YgZWxlbWVudHMgdG8gd2hpY2ggdGhpc1xyXG4gICAgICAgIC8vIFwib3V0c2lkZVwiIGV2ZW50IGlzIGJvdW5kLlxyXG4gICAgICAgIGVsZW1zID0gZWxlbXMubm90KCB0aGlzICk7XHJcblxyXG4gICAgICAgIC8vIElmIHRoaXMgaXMgdGhlIGxhc3QgZWxlbWVudCByZW1vdmVkLCByZW1vdmUgdGhlIFwib3JpZ2luYXRpbmdcIiBldmVudFxyXG4gICAgICAgIC8vIGhhbmRsZXIgb24gZG9jdW1lbnQgdGhhdCBwb3dlcnMgdGhpcyBcIm91dHNpZGVcIiBldmVudC5cclxuICAgICAgICBpZiAoIGVsZW1zLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICAgICQoZG9jKS51bmJpbmQoIGV2ZW50X25hbWVzcGFjZWQgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBDYWxsZWQgZXZlcnkgdGltZSBhIFwib3V0c2lkZVwiIGV2ZW50IGNhbGxiYWNrIGlzIGJvdW5kIHRvIGFuIGVsZW1lbnQuXHJcbiAgICAgIGFkZDogZnVuY3Rpb24oIGhhbmRsZU9iaiApIHtcclxuICAgICAgICB2YXIgb2xkX2hhbmRsZXIgPSBoYW5kbGVPYmouaGFuZGxlcjtcclxuXHJcbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBleGVjdXRlZCBldmVyeSB0aW1lIHRoZSBldmVudCBpcyB0cmlnZ2VyZWQuIFRoaXMgaXNcclxuICAgICAgICAvLyB1c2VkIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IGV2ZW50LnRhcmdldCByZWZlcmVuY2Ugd2l0aCBvbmUgdGhhdCBpc1xyXG4gICAgICAgIC8vIG1vcmUgdXNlZnVsLlxyXG4gICAgICAgIGhhbmRsZU9iai5oYW5kbGVyID0gZnVuY3Rpb24oIGV2ZW50LCBlbGVtICkge1xyXG5cclxuICAgICAgICAgIC8vIFNldCB0aGUgZXZlbnQgb2JqZWN0J3MgLnRhcmdldCBwcm9wZXJ0eSB0byB0aGUgZWxlbWVudCB0aGF0IHRoZVxyXG4gICAgICAgICAgLy8gdXNlciBpbnRlcmFjdGVkIHdpdGgsIG5vdCB0aGUgZWxlbWVudCB0aGF0IHRoZSBcIm91dHNpZGVcIiBldmVudCB3YXNcclxuICAgICAgICAgIC8vIHdhcyB0cmlnZ2VyZWQgb24uXHJcbiAgICAgICAgICBldmVudC50YXJnZXQgPSBlbGVtO1xyXG5cclxuICAgICAgICAgIC8vIEV4ZWN1dGUgdGhlIGFjdHVhbCBib3VuZCBoYW5kbGVyLlxyXG4gICAgICAgICAgb2xkX2hhbmRsZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gV2hlbiB0aGUgXCJvcmlnaW5hdGluZ1wiIGV2ZW50IGlzIHRyaWdnZXJlZC4uXHJcbiAgICBmdW5jdGlvbiBoYW5kbGVfZXZlbnQoIGV2ZW50ICkge1xyXG5cclxuICAgICAgLy8gSXRlcmF0ZSBvdmVyIGFsbCBlbGVtZW50cyB0byB3aGljaCB0aGlzIFwib3V0c2lkZVwiIGV2ZW50IGlzIGJvdW5kLlxyXG4gICAgICAkKGVsZW1zKS5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIGVsZW0gPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICAvLyBJZiB0aGlzIGVsZW1lbnQgaXNuJ3QgdGhlIGVsZW1lbnQgb24gd2hpY2ggdGhlIGV2ZW50IHdhcyB0cmlnZ2VyZWQsXHJcbiAgICAgICAgLy8gYW5kIHRoaXMgZWxlbWVudCBkb2Vzbid0IGNvbnRhaW4gc2FpZCBlbGVtZW50LCB0aGVuIHNhaWQgZWxlbWVudCBpc1xyXG4gICAgICAgIC8vIGNvbnNpZGVyZWQgdG8gYmUgb3V0c2lkZSwgYW5kIHRoZSBcIm91dHNpZGVcIiBldmVudCB3aWxsIGJlIHRyaWdnZXJlZCFcclxuICAgICAgICBpZiAoIHRoaXMgIT09IGV2ZW50LnRhcmdldCAmJiAhZWxlbS5oYXMoZXZlbnQudGFyZ2V0KS5sZW5ndGggKSB7XHJcblxyXG4gICAgICAgICAgLy8gVXNlIHRyaWdnZXJIYW5kbGVyIGluc3RlYWQgb2YgdHJpZ2dlciBzbyB0aGF0IHRoZSBcIm91dHNpZGVcIiBldmVudFxyXG4gICAgICAgICAgLy8gZG9lc24ndCBidWJibGUuIFBhc3MgaW4gdGhlIFwib3JpZ2luYXRpbmdcIiBldmVudCdzIC50YXJnZXQgc28gdGhhdFxyXG4gICAgICAgICAgLy8gdGhlIFwib3V0c2lkZVwiIGV2ZW50LnRhcmdldCBjYW4gYmUgb3ZlcnJpZGRlbiB3aXRoIHNvbWV0aGluZyBtb3JlXHJcbiAgICAgICAgICAvLyBtZWFuaW5nZnVsLlxyXG4gICAgICAgICAgZWxlbS50cmlnZ2VySGFuZGxlciggb3V0c2lkZV9ldmVudF9uYW1lLCBbIGV2ZW50LnRhcmdldCBdICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxufSkoalF1ZXJ5LGRvY3VtZW50LFwib3V0c2lkZVwiKTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4oZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQpIHtcclxuXHJcbiAgICAkLmZuLnRvZ2dsZUJsb2NrID0gZnVuY3Rpb24oc2hvdykge1xyXG5cclxuICAgICAgICB0aGlzLmNzcyhcImRpc3BsYXlcIiwgc2hvdyA/IFwiYmxvY2tcIiA6IFwibm9uZVwiKTtcclxuXHJcbiAgICB9O1xyXG59KShqUXVlcnksIHdpbmRvdywgZG9jdW1lbnQpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBkcm9wZG93bkRpc3BsYXllciA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJCgnYm9keScpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgJCgnLmRyb3Bkb3duLXNsaWRlcicpLmhpZGUoKTtcclxuICAgICAgICAkKFwiLmNsaWNrZWRcIikucmVtb3ZlQ2xhc3MoXCJjbGlja2VkXCIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJChcImJvZHlcIikub24oXCJjbGlja1wiLCBcIi5idXR0b24uZHJvcGRvd25cIiwgZnVuY3Rpb24gKGV2KSB7XHJcblxyXG4gICAgICAgIGlmICghJCh0aGlzKS5oYXNDbGFzcygnY2xpY2tlZCcpKSB7XHJcbiAgICAgICAgICAgICQoJy5kcm9wZG93bi1zbGlkZXInKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICQoXCIuY2xpY2tlZFwiKS5yZW1vdmVDbGFzcyhcImNsaWNrZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcGFyZW50RmxvYXQgPSAkKHRoaXMpLnBhcmVudCgpLmNzcyhcImZsb2F0XCIpO1xyXG4gICAgICAgIHZhciBkZHNJZCA9IGdldERyb3BEb3duU2xpZGVySWQoJCh0aGlzKSk7XHJcblxyXG4gICAgICAgIGlmKHBhcmVudEZsb2F0ID09PSBcInJpZ2h0XCIpe1xyXG4gICAgICAgICAgICAkKCcuZHJvcGRvd24tc2xpZGVyLicgKyBkZHNJZCkuY3NzKFwicmlnaHRcIiwgJCh0aGlzKS5wb3NpdGlvbigpLnJpZ2h0KTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgJCgnLmRyb3Bkb3duLXNsaWRlci4nICsgZGRzSWQpLmNzcyhcImxlZnRcIiwgJCh0aGlzKS5wb3NpdGlvbigpLmxlZnQpOyAvLyAtIDVcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICQoJy5kcm9wZG93bi1zbGlkZXIuJyArIGRkc0lkKS50b2dnbGUoKTtcclxuICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdjbGlja2VkJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHZhciBnZXREcm9wRG93blNsaWRlcklkID0gZnVuY3Rpb24gKGJ0bikge1xyXG5cclxuICAgICAgICB2YXIgZGRzSWQgPSAnJztcclxuICAgICAgICB2YXIgY2xhc3NMaXN0ID0gYnRuLmF0dHIoJ2NsYXNzJykuc3BsaXQoL1xccysvKTtcclxuXHJcbiAgICAgICAgJC5lYWNoKGNsYXNzTGlzdCwgZnVuY3Rpb24gKGluZGV4LCBpdGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtLmluZGV4T2YoJ2Rkc0lkXycpID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBkZHNJZCA9IGl0ZW0ucmVwbGFjZSgnZGRzSWRfJywgJycpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGRkc0lkO1xyXG4gICAgfTtcclxufSgpKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgRm9ybWF0dGVyID0gKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgZm9ybWF0QWRkcmVzc2VzID0gZnVuY3Rpb24gKHRpdGxlcykge1xyXG5cclxuICAgICAgICB2YXIgcmVzID0gXCJcIjtcclxuXHJcbiAgICAgICAgdGl0bGVzID0gdGl0bGVzIHx8IFtdO1xyXG5cclxuICAgICAgICBpZiAodGl0bGVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGl0bGVzWzBdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfLmVhY2godGl0bGVzLCBmdW5jdGlvbiAodGl0bGUpIHtcclxuICAgICAgICAgICAgcmVzICs9IF9zLnN0ckxlZnRCYWNrKHRpdGxlLCBcIiBcIikgKyBcIiwgXCI7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBfcy5zdHJMZWZ0QmFjayhyZXMsIFwiLFwiKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdmFyIGZvcm1hdFNob3J0RGF0ZSA9IGZ1bmN0aW9uICh0aWNrcyx0cmFuc2xhdG9yKSB7XHJcblxyXG4gICAgICAgIGlmIChfLmlzRmluaXRlKHRpY2tzKSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUocGFyc2VJbnQodGlja3MsIDEwKSk7XHJcbiAgICAgICAgICAgIHZhciB0aW1lRGlmZiA9IE1hdGguYWJzKG5vdy5nZXRUaW1lKCkgLSBkYXRlLmdldFRpbWUoKSk7XHJcbiAgICAgICAgICAgIHZhciBkaWZmRGF5cyA9IE1hdGguY2VpbCh0aW1lRGlmZiAvICgxMDAwICogMzYwMCAqIDI0KSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlmZkRheXMgPiAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOnRpbWVyYW5nZS5tb250aHMuXCIgKyBkYXRlLmdldE1vbnRoKCkpICsgXCIgXCIgKyBkYXRlLmdldERheSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIGhvdXJzID0gZGF0ZS5nZXRIb3VycygpO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1pbnV0ZXMgPSBkYXRlLmdldE1pbnV0ZXMoKTtcclxuICAgICAgICAgICAgICAgIHZhciBhbXBtID0gaG91cnMgPj0gMTIgPyAncG0nIDogJ2FtJztcclxuXHJcbiAgICAgICAgICAgICAgICBob3VycyA9IGhvdXJzICUgMTI7XHJcbiAgICAgICAgICAgICAgICBob3VycyA9IGhvdXJzID8gaG91cnMgOiAxMjsgLy8gdGhlIGhvdXIgJzAnIHNob3VsZCBiZSAnMTInXHJcbiAgICAgICAgICAgICAgICBtaW51dGVzID0gbWludXRlcyA8IDEwID8gJzAnICsgbWludXRlcyA6IG1pbnV0ZXM7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhvdXJzICsgJzonICsgbWludXRlcyArICcgJyArIGFtcG07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHZhciBmb3JtYXRTdWJqZWN0ID0gZnVuY3Rpb24gKHN1YmplY3QsdHJhbnNsYXRvcikge1xyXG5cclxuICAgICAgICBpZiAoXy5pc0VtcHR5KHN1YmplY3QpKSB7XHJcbiAgICAgICAgICAgIHN1YmplY3QgPSBcIihcIiArIHRyYW5zbGF0b3IudHJhbnNsYXRlKFwibWFpbDpub3N1YmplY3RcIikgKyBcIilcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHN1YmplY3Q7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHZhciBmb3JtYXRDb250ZW50ID0gZnVuY3Rpb24gKGNvbnRlbnQpIHtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzRW1wdHkoY29udGVudCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQucmVwbGFjZSgvKDwoW14+XSspPikvaWcsIFwiIFwiKS5yZXBsYWNlKC8mbmJzcDsvaWcsIFwiIFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9ybWF0U3ViamVjdDogZm9ybWF0U3ViamVjdCxcclxuICAgICAgICBmb3JtYXRDb250ZW50OiBmb3JtYXRDb250ZW50LFxyXG4gICAgICAgIGZvcm1hdFNob3J0RGF0ZTogZm9ybWF0U2hvcnREYXRlLFxyXG4gICAgICAgIGZvcm1hdEFkZHJlc3NlczogZm9ybWF0QWRkcmVzc2VzXHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JtYXR0ZXI7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBUcmFuc2xhdG9yID0gKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgZGljdGlvbmFyeSA9IHt9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKFwiX2kxOG5cIiwgZnVuY3Rpb24odGV4dCkge1xyXG4gICAgICAgIHJldHVybiB0cmFuc2xhdGUodGV4dCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdmFyIHVwZGF0ZURpY3Rpb25hcnkgPSBmdW5jdGlvbihvYmope1xyXG4gICAgICAgICQuZXh0ZW5kKGRpY3Rpb25hcnksIG9iaik7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgdHJhbnNsYXRlID0gZnVuY3Rpb24gKGtleSkge1xyXG5cclxuICAgICAgICBpZiAoXy5pc1N0cmluZyhrZXkpKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3Via2V5cyA9IGtleS5zcGxpdChcIjpcIik7XHJcblxyXG4gICAgICAgICAgICBpZihzdWJrZXlzLmxlbmd0aCA9PSAyKXtcclxuXHJcbiAgICAgICAgICAgICAgICBpZihfLmhhcyhkaWN0aW9uYXJ5LCBzdWJrZXlzWzBdKSl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkaWN0aW9uYXJ5W3N1YmtleXNbMF1dW3N1YmtleXNbMV1dO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGRpY3Rpb25hcnkgOiBkaWN0aW9uYXJ5LFxyXG4gICAgICAgIHRyYW5zbGF0ZSA6IHRyYW5zbGF0ZSxcclxuICAgICAgICB1cGRhdGVEaWN0aW9uYXJ5OnVwZGF0ZURpY3Rpb25hcnlcclxuICAgIH07XHJcblxyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2xhdG9yO1xyXG4iLCJ2YXIgQmFzZU1vZGVsID0gcmVxdWlyZShcImJhc2UtbW9kZWxcIik7XHJcblxyXG52YXIgU2V0dGluZ3NNb2RlbCA9IEJhc2VNb2RlbC5leHRlbmQoe1xyXG5cclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgbGFuZzogXCJlbi1VU1wiLFxyXG4gICAgICAgIHRoZW1lOiAnZHVzdCcsXHJcbiAgICAgICAgdXNlck5hbWU6ICdkZW1vQG1haWxib25lLmNvbSdcclxuICAgIH0sXHJcblxyXG4gICAgdXJsOiAnc2V0dGluZ3MnLFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnNldChcImlkXCIsIF8udW5pcXVlSWQoJ18nKSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXR0aW5nc01vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCdhcHAnKTtcclxudmFyIFNldHRpbmdzID0gcmVxdWlyZShcIi4vc2V0dGluZ3NcIik7XHJcblxyXG52YXIgU2V0dGluZ3NDb250cm9sbGVyID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGFwcC5zZXR0aW5ncyA9IG5ldyBTZXR0aW5ncygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBmZXRjaDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLmxvYWRUaGVtZUFuZERpYygpO1xyXG5cclxuICAgICAgICAvL2FwcC5zZXR0aW5ncy5mZXRjaCh7XHJcbiAgICAgICAgLy8gICAgc3VjY2VzczogXy5iaW5kKGZ1bmN0aW9uIChtb2RlbCwgcmVzcCwgb3B0aW9ucykge1xyXG4gICAgICAgIC8vICAgICAgICAgICAgdGhpcy5sb2FkVGhlbWVBbmREaWMoKTtcclxuICAgICAgICAvLyAgICB9LCB0aGlzKVxyXG4gICAgICAgIC8vfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgbG9hZFRoZW1lQW5kRGljOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciB0aGVtZSA9IGFwcC5zZXR0aW5ncy5nZXQoXCJ0aGVtZVwiKTtcclxuXHJcbiAgICAgICAgJC53aGVuKFxyXG4gICAgICAgICAgICAkLmdldEpTT04oXCJkaXN0L2kxOG4vXCIgKyBhcHAuc2V0dGluZ3MuZ2V0KFwibGFuZ1wiKSArIFwiLmpzb25cIiwgZnVuY3Rpb24oaTE4bk9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgYXBwLnRyYW5zbGF0b3IudXBkYXRlRGljdGlvbmFyeShpMThuT2JqZWN0KTtcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICQuZ2V0KFwiZGlzdC9jc3MvdGhlbWVzL1wiICsgdGhlbWUgKyBcIi9cIiArIHRoZW1lICsgXCIuY3NzXCIsIGZ1bmN0aW9uKF9jc3MpIHtcclxuICAgICAgICAgICAgICAgICQoXCJ0aGVtZS1jc3NcIikucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAkKFsnPHN0eWxlIHR5cGU9XCJ0ZXh0L2Nzc1wiIGlkPVwidGhlbWUtY3NzXCI+JywgX2NzcywgJzwvc3R5bGU+J10uam9pbignJykpLmFwcGVuZFRvKCdoZWFkJyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgYXBwLmNoYW5uZWwudmVudC50cmlnZ2VyKFwib25TZXR0aW5nc0xvYWRlZFwiKTtcclxuICAgICAgICB9KTtcclxuICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NDb250cm9sbGVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCdhcHAnKTtcclxudmFyIGlvID0gcmVxdWlyZSgnc29ja2V0LmlvLWNsaWVudCcpO1xyXG5cclxudmFyIFNvY2tldENvbnRyb2xsZXIgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICBpbml0aWFsaXplOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciBzb2NrZXRVUkkgPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyBcIjpcIiArIFwiODAwMFwiICsgXCIvXCI7XHJcbiAgICAgICAgdGhpcy5fc29ja2V0ID0gaW8uY29ubmVjdChzb2NrZXRVUkkpO1xyXG5cclxuICAgICAgICB0aGlzLl9zb2NrZXQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gdG8gc2VydmVyIGVzdGFibGlzaGVkLicpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX3NvY2tldC5vbignZXJyb3InLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3NvcnJ5LCB3ZSBhcmUgZXhwZXJpZW5jaW5nIHRlY2huaWNhbCBkaWZmaWN1bHRpZXMuJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fc29ja2V0Lm9uKCdkYXRhOmNoYW5nZScsIGZ1bmN0aW9uKG1lc3NhZ2Upe1xyXG4gICAgICAgICAgICBhcHAudmVudC50cmlnZ2VyKFwiZGF0YTpjaGFuZ2VcIiwgbWVzc2FnZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fc29ja2V0Lm9uKCdlcnJvcjEnLCBmdW5jdGlvbihlcnIpe1xyXG4gICAgICAgICAgICBhcHAudmVudC50cmlnZ2VyKCdzb2NrZXQ6ZXJyb3InLCBlcnIpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInVubG9hZFwiLCB0aGlzLl9zb2NrZXQuY2xvc2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGdldFNvY2tldDpmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9zb2NrZXQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgcmVnaXN0ZXJVc2VyOmZ1bmN0aW9uKHVzZXJOYW1lKXtcclxuICAgICAgICB0aGlzLl9zb2NrZXQuZW1pdCgnYWRkLXVzZXInLHVzZXJOYW1lKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNvY2tldENvbnRyb2xsZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZU1vZGVsID0gcmVxdWlyZShcIi4vanMvbW9kZWxzL2F1dG9Db21wbGV0ZU1vZGVsXCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlSXRlbVZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy9hdXRvQ29tcGxldGVJdGVtVmlld1wiKTtcclxudmFyIEF1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy9hdXRvQ29tcGxldGVDb21wb3NpdGVWaWV3XCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCIuL2pzL2NvbGxlY3Rpb25zL2F1dG9Db21wbGV0ZUNvbGxlY3Rpb25cIik7XHJcbnZhciBGaWx0ZXJDb2xsZWN0aW9uRGVjb3JhdG9yID0gcmVxdWlyZShcImRlY29yYXRvcnMvRmlsdGVyQ29sbGVjdGlvbkRlY29yYXRvclwiKTtcclxuXHJcbnZhciBBdXRvQ29tcGxldGUgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLmVsID0gb3B0aW9ucy5lbDtcclxuICAgICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XHJcbiAgICAgICAgdGhpcy5tYXhJdGVtcyA9IG9wdGlvbnMubWF4SXRlbXMgfHwgNTtcclxuICAgICAgICB0aGlzLmZpbHRlck1vZGVsID0gb3B0aW9ucy5maWx0ZXJNb2RlbDtcclxuICAgICAgICB0aGlzLmNvbGxlY3Rpb24gPSBuZXcgRmlsdGVyQ29sbGVjdGlvbkRlY29yYXRvcihuZXcgQXV0b0NvbXBsZXRlQ29sbGVjdGlvbihvcHRpb25zLml0ZW1zIHx8IFtdKSwgdGhpcy5maWx0ZXJNb2RlbCk7XHJcblxyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCAnaW5wdXQ6Y2hhbmdlJywgdGhpcy5vbklucHV0Q2hhbmdlLCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBvbkZpbHRlckNoYW5nZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25JbnB1dENoYW5nZTogZnVuY3Rpb24gKGlucHV0LCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICBpZiAoXy5pc0VtcHR5KGlucHV0KSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24uZmlsdGVyQWxsKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5maWx0ZXJNb2RlbC5zZXRJbnB1dChpbnB1dCk7XHJcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5maWx0ZXJCeSh7XHJcbiAgICAgICAgICAgICAgICBtYXhJdGVtczogdGhpcy5tYXhJdGVtcyxcclxuICAgICAgICAgICAgICAgIG1hbmRhdG9yeUl0ZW1zOiBvcHRpb25zLmFkZFNlYXJjaEtleSA/IFtuZXcgQXV0b0NvbXBsZXRlTW9kZWwoe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGlucHV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBBdXRvQ29tcGxldGUuVFlQRVMuU0VBUkNIXHJcbiAgICAgICAgICAgICAgICB9KV0gOiBbXVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gc2hvd1xyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2hvdzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbi5maWx0ZXJBbGwoKTtcclxuXHJcbiAgICAgICAgdGhpcy5hdXRvQ29tcGxldGVUYWJsZVZpZXcgPSBuZXcgQXV0b0NvbXBsZXRlQ29tcG9zaXRlVmlldyh7XHJcbiAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudCxcclxuICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy5jb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICBlbDogdGhpcy5lbFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlVGFibGVWaWV3LnJlbmRlcigpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbkF1dG9Db21wbGV0ZS5UWVBFUyA9IEF1dG9Db21wbGV0ZUl0ZW1WaWV3LlRZUEVTO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGU7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVNb2RlbCA9IHJlcXVpcmUoXCIuLi9tb2RlbHMvYXV0b0NvbXBsZXRlTW9kZWxcIik7XHJcblxyXG52YXIgQXV0b0NvbXBsZXRlQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcclxuXHJcbiAgICBtb2RlbDogQXV0b0NvbXBsZXRlTW9kZWxcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9Db21wbGV0ZUNvbGxlY3Rpb247XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZU1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHtcclxuXHJcbiAgICBkZWZhdWx0OiB7XHJcbiAgICAgICAgdGV4dDogXCJcIixcclxuICAgICAgICB2YWx1ZTogXCJcIlxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxcXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9iaiwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICBpZiAoXy5pc1N0cmluZyhvYmoudGV4dCkpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXQoXCJ0ZXh0XCIsIG9iai50ZXh0LnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXy5pc1N0cmluZyhvYmoudmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KFwidmFsdWVcIiwgb2JqLnZhbHVlLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gQXV0b0NvbXBsZXRlTW9kZWw7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIi4uLy4uL3VpL3RlbXBsYXRlcy9hdXRvQ29tcGxldGUuaGJzXCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlSXRlbVZpZXcgPSByZXF1aXJlKFwiLi9hdXRvQ29tcGxldGVJdGVtVmlld1wiKTtcclxuXHJcbnZhciBLZXlDb2RlID0ge1xyXG4gICAgRU5URVI6IDEzLFxyXG4gICAgQVJST1dfVVA6IDM4LFxyXG4gICAgQVJST1dfRE9XTjogNDBcclxufTtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVDb21wb3NpdGVWaWV3ID0gTWFyaW9uZXR0ZS5Db21wb3NpdGVWaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgY2hpbGRWaWV3OiBBdXRvQ29tcGxldGVJdGVtVmlldyxcclxuICAgIGNoaWxkVmlld0NvbnRhaW5lcjogXCIubWVudVwiLFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuXHJcbiAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLmNvbGxlY3Rpb24sIFwiZW1wdHk6Y29sbGVjdGlvblwiLCB0aGlzLmNsb3NlRWwpO1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImF1dG9jb21wbGV0ZTppdGVtOmNsaWNrXCIsIHRoaXMuc2VsZWN0SXRlbSk7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsIFwiYXV0b2NvbXBsZXRlOml0ZW06b3ZlclwiLCB0aGlzLm9uSG92ZXIpO1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImtleTpwcmVzc1wiLCB0aGlzLm9uS2V5UHJlc3MpO1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImNsb3NlQWxsXCIsIHRoaXMuY2xvc2VFbCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBidWlsZENoaWxkVmlldzogZnVuY3Rpb24gKGl0ZW0sIEl0ZW1WaWV3KSB7XHJcblxyXG4gICAgICAgIHZhciB2aWV3ID0gbmV3IEl0ZW1WaWV3KHtcclxuICAgICAgICAgICAgbW9kZWw6IGl0ZW0sXHJcbiAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudCxcclxuICAgICAgICAgICAgZmlsdGVyTW9kZWw6IHRoaXMuY29sbGVjdGlvbi5maWx0ZXJNb2RlbFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuY2xvc2VFbCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uUmVuZGVyQ29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLmNoaWxkQXJyID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uZWFjaChfLmJpbmQoZnVuY3Rpb24gKHZpZXcpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEFyci5wdXNoKHZpZXcpO1xyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZEl0ZW0gPSAwO1xyXG4gICAgICAgIHRoaXMuc2hvd0VsKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGNsb3NlRWw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBfLmRlZmVyKF8uYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gLTE7XHJcbiAgICAgICAgICAgIHRoaXMuJGVsLmhpZGUoKTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNob3dFbDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlKCk7XHJcbiAgICAgICAgdGhpcy4kZWwuc2hvdygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbktleVByZXNzOiBmdW5jdGlvbiAoa2V5KSB7XHJcblxyXG4gICAgICAgIHN3aXRjaCAoa2V5KSB7XHJcbiAgICAgICAgICAgIGNhc2UgS2V5Q29kZS5BUlJPV19VUDpcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gTWF0aC5tYXgoMCwgdGhpcy5zZWxlY3RlZEl0ZW0gLSAxKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBLZXlDb2RlLkFSUk9XX0RPV046XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkSXRlbSA9IE1hdGgubWluKHRoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMSwgdGhpcy5zZWxlY3RlZEl0ZW0gKyAxKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBLZXlDb2RlLkVOVEVSOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RJdGVtKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBzZXRBY3RpdmU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5lYWNoKGZ1bmN0aW9uICh2aWV3KSB7XHJcbiAgICAgICAgICAgIHZpZXcuc2V0QWN0aXZlKGZhbHNlKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIHNlbGVjdGVkVmlldyA9IHRoaXMuY2hpbGRBcnJbdGhpcy5zZWxlY3RlZEl0ZW1dO1xyXG5cclxuICAgICAgICBpZiAoXy5pc09iamVjdChzZWxlY3RlZFZpZXcpKSB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkVmlldy5zZXRBY3RpdmUodHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiYXV0b2NvbXBsZXRlOml0ZW06YWN0aXZlXCIsIHNlbGVjdGVkVmlldy5tb2RlbC5nZXQoXCJ0ZXh0XCIpLCBzZWxlY3RlZFZpZXcubW9kZWwuZ2V0KFwidmFsdWVcIikpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2VsZWN0SXRlbTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgc2VsZWN0ZWRWaWV3ID0gdGhpcy5jaGlsZEFyclt0aGlzLnNlbGVjdGVkSXRlbV07XHJcblxyXG4gICAgICAgIGlmIChfLmlzT2JqZWN0KHNlbGVjdGVkVmlldykpIHtcclxuICAgICAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJhdXRvY29tcGxldGU6aXRlbTpzZWxlY3RlZFwiLCBzZWxlY3RlZFZpZXcubW9kZWwuZ2V0KFwidGV4dFwiKSwgc2VsZWN0ZWRWaWV3Lm1vZGVsLmdldChcInZhbHVlXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jbG9zZUVsKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbkhvdmVyOiBmdW5jdGlvbiAoaXRlbSkge1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRBcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRBcnJbaV0uY2lkID09PSBpdGVtLmNpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEl0ZW0gPSBpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmUoKTtcclxuICAgIH1cclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gQXV0b0NvbXBsZXRlQ29tcG9zaXRlVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwiLi4vLi4vdWkvdGVtcGxhdGVzL2F1dG9Db21wbGV0ZUl0ZW0uaGJzXCIpO1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZUl0ZW1WaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgdGFnTmFtZTogJ2xpJyxcclxuICAgIGNsYXNzTmFtZTogJ2xpX3JvdycsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiLnRpdGxlXCIsXHJcbiAgICAgICAgXCJ0ZXh0XCI6IFwiLnRleHRcIlxyXG4gICAgfSxcclxuXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgICBcIm1vdXNlZW50ZXJcIjogXCJfb25Nb3VzZUVudGVyXCIsXHJcbiAgICAgICAgXCJjbGlja1wiOiBcIl9vbkNsaWNrXCJcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xyXG4gICAgICAgIHRoaXMuZmlsdGVyTW9kZWwgPSBvcHRpb25zLmZpbHRlck1vZGVsO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIHR5cGUgPSB0aGlzLm1vZGVsLmdldChcInR5cGVcIik7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGlzQ29udGFjdDogdHlwZSA9PT0gQXV0b0NvbXBsZXRlSXRlbVZpZXcuVFlQRVMuQ09OVEFDVCxcclxuICAgICAgICAgICAgaXNTZWFyY2g6IHR5cGUgPT09IEF1dG9Db21wbGV0ZUl0ZW1WaWV3LlRZUEVTLlNFQVJDSFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudWkudGl0bGUuaHRtbCh0aGlzLmZpbHRlck1vZGVsLmhpZ2hsaWdodEtleSh0aGlzLm1vZGVsLmdldChcInRleHRcIikpKTtcclxuICAgICAgICB0aGlzLnVpLnRleHQuaHRtbCh0aGlzLmZpbHRlck1vZGVsLmhpZ2hsaWdodEtleSh0aGlzLm1vZGVsLmdldChcInZhbHVlXCIpKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIF9vbk1vdXNlRW50ZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJhdXRvY29tcGxldGU6aXRlbTpvdmVyXCIsIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBfb25DbGljazogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImF1dG9jb21wbGV0ZTppdGVtOmNsaWNrXCIpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBzZXRBY3RpdmU6IGZ1bmN0aW9uIChpc0FjdGl2ZSkge1xyXG4gICAgICAgIHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCdhY3RpdmUnLCBpc0FjdGl2ZSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbkF1dG9Db21wbGV0ZUl0ZW1WaWV3LlRZUEVTID0ge1xyXG4gICAgQ09OVEFDVDogMSxcclxuICAgIFNFQVJDSDogMixcclxuICAgIFJFQ0VOVDogM1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGVJdGVtVmlldztcclxuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwiYXV0b0NvbXBsZXRlIGF1dG9Db21wbGV0ZS1zaXplXFxcIj5cXHJcXG4gICAgPHVsIGNsYXNzPVxcXCJtZW51IGJyb3dzZXItc2Nyb2xsIGxpZ2h0IGRlZmF1bHQtbGlzdFxcXCI+PC91bD5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyLCBvcHRpb25zLCBmdW5jdGlvblR5cGU9XCJmdW5jdGlvblwiLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbiwgc2VsZj10aGlzLCBibG9ja0hlbHBlck1pc3Npbmc9aGVscGVycy5ibG9ja0hlbHBlck1pc3Npbmc7XG5cbmZ1bmN0aW9uIHByb2dyYW0xKGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXI7XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaWNvbiBjb250YWN0XFxcIj48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImNvbnRlbnRXcmFwcGVyXFxcIj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0aXRsZVxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnRleHQpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudGV4dCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0ZXh0XFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMudmFsdWUpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudmFsdWUpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuZnVuY3Rpb24gcHJvZ3JhbTMoZGVwdGgwLGRhdGEpIHtcbiAgXG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlcjtcbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpY29uIHNlYXJjaFxcXCI+PC9kaXY+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjb250ZW50V3JhcHBlclxcXCI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwidGl0bGVcXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy50ZXh0KSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnRleHQpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJkcm9wZG93bi1saS12YWx1ZVxcXCI+XFxyXFxuICAgIFwiO1xuICBvcHRpb25zPXtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgxLCBwcm9ncmFtMSwgZGF0YSksZGF0YTpkYXRhfVxuICBpZiAoaGVscGVyID0gaGVscGVycy5pc0NvbnRhY3QpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCBvcHRpb25zKTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuaXNDb250YWN0KTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCBvcHRpb25zKSA6IGhlbHBlcjsgfVxuICBpZiAoIWhlbHBlcnMuaXNDb250YWN0KSB7IHN0YWNrMSA9IGJsb2NrSGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgc3RhY2sxLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMSwgcHJvZ3JhbTEsIGRhdGEpLGRhdGE6ZGF0YX0pOyB9XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG5cXHJcXG4gICAgXCI7XG4gIG9wdGlvbnM9e2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDMsIHByb2dyYW0zLCBkYXRhKSxkYXRhOmRhdGF9XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmlzU2VhcmNoKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwgb3B0aW9ucyk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmlzU2VhcmNoKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCBvcHRpb25zKSA6IGhlbHBlcjsgfVxuICBpZiAoIWhlbHBlcnMuaXNTZWFyY2gpIHsgc3RhY2sxID0gYmxvY2tIZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBzdGFjazEsIHtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgzLCBwcm9ncmFtMywgZGF0YSksZGF0YTpkYXRhfSk7IH1cbiAgaWYoc3RhY2sxIHx8IHN0YWNrMSA9PT0gMCkgeyBidWZmZXIgKz0gc3RhY2sxOyB9XG4gIGJ1ZmZlciArPSBcIlxcclxcbjwvZGl2PlxcclxcblxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIERpYWxvZ1ZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy9kaWFsb2dWaWV3MVwiKTtcclxuXHJcbnZhciBBdXRvQ29tcGxldGUgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5lbCA9IG9wdGlvbnMuZWw7XHJcbiAgICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xyXG4gICAgICAgIHRoaXMudGl0bGUgPSBvcHRpb25zLnRpdGxlIHx8IFwiXCI7XHJcbiAgICAgICAgdGhpcy5pbnNpZGVWaWV3ID0gb3B0aW9ucy5pbnNpZGVWaWV3O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIHNob3dcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNob3c6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5kaWFsb2dWaWV3ID0gbmV3IERpYWxvZ1ZpZXcoe1xyXG4gICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgIGVsOiB0aGlzLmVsLFxyXG4gICAgICAgICAgICB0aXRsZTogdGhpcy50aXRsZSxcclxuICAgICAgICAgICAgemluZGV4OiAxMDAwLFxyXG4gICAgICAgICAgICBpbnNpZGVWaWV3OiB0aGlzLmluc2lkZVZpZXdcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmRpYWxvZ1ZpZXcucmVuZGVyKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGU7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi91aS90ZW1wbGF0ZXMvZGlhbG9nLmhic1wiKTtcclxuXHJcbnZhciBEaWFsb2dWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG5cclxuICAgIGNsYXNzTmFtZTogXCJkaWFsb2dcIixcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgIGluc2lkZVZpZXc6IG51bGwsXHJcbiAgICB0ZW1wbGF0ZUlkOiBudWxsLFxyXG5cclxuICAgIHVpOiB7XHJcbiAgICAgICAgYnRuQ2xvc2U6IFwiLmRpYWxvZy1oZWFkZXItY2xvc2VCdG5cIlxyXG4gICAgfSxcclxuXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgICBcImNsaWNrIEB1aS5idG5DbG9zZVwiOiBcImNsb3NlQnRuXCJcclxuICAgIH0sXHJcblxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuaW5zaWRlVmlldykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy50aXRsZSA9IG9wdGlvbnMudGl0bGU7XHJcbiAgICAgICAgICAgIHRoaXMuekluZGV4ID0gb3B0aW9ucy56SW5kZXg7XHJcbiAgICAgICAgICAgIHRoaXMuaW5zaWRlVmlldyA9IG9wdGlvbnMuaW5zaWRlVmlldztcclxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZUlkID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKS50b1N0cmluZygpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gcmVuZGVyXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25CZWZvcmVSZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5fJGVsID0gdGhpcy4kZWw7XHJcbiAgICAgICAgdGhpcy4kZWwgPSAkKFwiPGRpdi8+XCIpLmFkZENsYXNzKHRoaXMuY2xhc3NOYW1lKS5hZGRDbGFzcyh0aGlzLnRlbXBsYXRlSWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaW5zaWRlVmlldykge1xyXG4gICAgICAgICAgICB0aGlzLiRlbC5maW5kKFwiLmRpYWxvZy1oZWFkZXItdGl0bGVcIikuaHRtbCh0aGlzLnRpdGxlKTtcclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZChcIi5kaWFsb2ctaW5uZXJCb3hcIikuYXBwZW5kKHRoaXMuaW5zaWRlVmlldy5yZW5kZXIoKS5lbCk7XHJcbiAgICAgICAgICAgIHRoaXMuXyRlbC5hcHBlbmQodGhpcy4kZWwpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZChcIi5kaWFsb2ctb3V0ZXJib3hcIikuY3NzKFwibWFyZ2luLXRvcFwiLCAtdGhpcy5pbnNpZGVWaWV3LiRlbC5oZWlnaHQoKSAvIDIgKyBcInB4XCIpO1xyXG4gICAgICAgICAgICB0aGlzLiRlbC5maW5kKFwiLmRpYWxvZy1vdXRlcmJveFwiKS5jc3MoXCJtYXJnaW4tbGVmdFwiLCAtdGhpcy5pbnNpZGVWaWV3LiRlbC53aWR0aCgpIC8gMiArIFwicHhcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBjbG9zZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGNsb3NlQnRuOiBmdW5jdGlvbiAoZXYpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pbnNpZGVWaWV3LmRlc3Ryb3koKTtcclxuICAgICAgICB0aGlzLl8kZWwuZmluZChcIi5kaWFsb2cuXCIgKyB0aGlzLnRlbXBsYXRlSWQpLnJlbW92ZSgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRGlhbG9nVmlldztcclxuXHJcblxyXG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJkaWFsb2ctb3ZlcmxheVxcXCI+PC9kaXY+XFxyXFxuXFxyXFxuPGRpdiBjbGFzcz1cXFwiZGlhbG9nLW91dGVyYm94XFxcIj5cXHJcXG5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiZGlhbG9nLWhlYWRlclxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJkaWFsb2ctaGVhZGVyLXRpdGxlXFxcIj48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImRpYWxvZy1oZWFkZXItY2xvc2VCdG5cXFwiPjwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiZGlhbG9nLWlubmVyQm94XFxcIj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXCI7XG4gIH0pO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwiLi91aS90ZW1wbGF0ZXMvc2VhcmNoLmhic1wiKTtcclxuXHJcbnJlcXVpcmUoXCJwbHVnaW5zL2pxdWVyeS5iYS1vdXRzaWRlLWV2ZW50c1wiKTtcclxuXHJcbnZhciBLZXlDb2RlID0ge1xyXG4gICAgRVNDOiAyNyxcclxuICAgIEVOVEVSOiAxMyxcclxuICAgIEFSUk9XX1VQOiAzOCxcclxuICAgIEFSUk9XX0RPV046IDQwXHJcbn07XHJcblxyXG52YXIgU2VhcmNoVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuXHJcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBcInNlYXJjaElucHV0XCI6IFwiLnNlYXJjaC1pbnB1dFwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgLmJ0blNlYXJjaFwiOiBcInNlYXJjaFwiLFxyXG4gICAgICAgIFwia2V5dXAgLnNlYXJjaC1pbnB1dFwiOiBcIm9uQnV0dG9uS2V5VXBcIixcclxuICAgICAgICBcImlucHV0IC5zZWFyY2gtaW5wdXRcIjogXCJvbklucHV0Q2hhbmdlXCIsXHJcbiAgICAgICAgXCJjbGlja291dHNpZGVcIjogXCJvdXRzaWRlQ2xpY2tlZFwiXHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZWwgPSBvcHRpb25zLmVsO1xyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuICAgICAgICB0aGlzLmNhcHRpb24gPSBvcHRpb25zLmNhcHRpb247XHJcblxyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImF1dG9jb21wbGV0ZTppdGVtOnNlbGVjdGVkXCIsIHRoaXMuc2VhcmNoLCB0aGlzKTtcclxuICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJhdXRvY29tcGxldGU6aXRlbTphY3RpdmVcIiwgdGhpcy5vbkl0ZW1BY3RpdmUsIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNhcHRpb246IHRoaXMuY2FwdGlvblxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uSXRlbUFjdGl2ZTogZnVuY3Rpb24gKHRleHQsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy51aS5zZWFyY2hJbnB1dC52YWwodGV4dCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uQnV0dG9uS2V5VXA6IGZ1bmN0aW9uIChldmVudCkge1xyXG5cclxuICAgICAgICB2YXIga2V5ID0gZXZlbnQua2V5Q29kZTtcclxuXHJcbiAgICAgICAgaWYgKGtleSA9PT0gS2V5Q29kZS5BUlJPV19ET1dOIHx8IGtleSA9PT0gS2V5Q29kZS5BUlJPV19VUCB8fCBrZXkgPT09IEtleUNvZGUuRU5URVIpIHtcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJrZXk6cHJlc3NcIiwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbklucHV0Q2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJpbnB1dDpjaGFuZ2VcIiwgdGhpcy51aS5zZWFyY2hJbnB1dC52YWwoKSwge1wiYWRkU2VhcmNoS2V5XCI6IHRydWV9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNlYXJjaDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2xvc2VBbGxcIik7XHJcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJzZWFyY2hcIiwgdGhpcy51aS5zZWFyY2hJbnB1dC52YWwoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgY2xlYXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnVpLnNlYXJjaElucHV0LnZhbChcIlwiKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvdXRzaWRlQ2xpY2tlZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2xvc2VBbGxcIik7XHJcbiAgICB9XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFNlYXJjaFZpZXc7XHJcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxpbnB1dCBjbGFzcz1cXFwic2VhcmNoLWlucHV0XFxcIiB0eXBlPVxcXCJ0ZXh0XFxcIiBhdXRvY29tcGxldGU9XFxcIm9mZlxcXCIgdmFsdWU9XFxcIlxcXCI+XFxyXFxuPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIHByaW1lSWNvbiBidG5TZWFyY2hcXFwiPjxzcGFuIGNsYXNzPVxcXCJzZWFyY2hJY29uXFxcIj48L3NwYW4+PC9hPlwiO1xuICB9KTtcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFRhZ01vZGVsID0gcmVxdWlyZShcInVpLWNvbXBvbmVudHMvdGFncy9qcy9tb2RlbHMvdGFnTW9kZWxcIik7XHJcblxyXG52YXIgVGFnc0NvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XHJcbiAgICBtb2RlbDogVGFnTW9kZWxcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhZ3NDb2xsZWN0aW9uO1xyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgVGFnTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgICB0ZXh0OiBcIlwiLFxyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWVcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhZ01vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi91aS90ZW1wbGF0ZXMvdGFnLmhic1wiKTtcclxuXHJcbnZhciBUYWdJdGVtVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgIGNsYXNzTmFtZTogJ3RhZycsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBjb250ZW50OiBcIi5jb250ZW50XCIsXHJcbiAgICAgICAgYnRuQ2xvc2U6IFwiLmNsb3NlLWJ1dHRvblwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgLmNsb3NlLWJ1dHRvblwiOiBcIl9vbkNsb3NlQnRuQ2xpY2tcIlxyXG4gICAgfSxcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuICAgIH0sXHJcblxyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLiRlbC50b2dnbGVDbGFzcyhcImVyclwiLCAhdGhpcy5tb2RlbC5nZXQoXCJpc1ZhbGlkXCIpKTtcclxuICAgIH0sXHJcblxyXG4gICAgX29uQ2xvc2VCdG5DbGljazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidGFnOml0ZW06cmVtb3ZlXCIsIHRoaXMubW9kZWwuY2lkKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhZ0l0ZW1WaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi91aS90ZW1wbGF0ZXMvdGFnc0NvbnRhaW5lci5oYnNcIik7XHJcbnZhciBUYWdzSXRlbVZpZXcgPSByZXF1aXJlKFwiLi90YWdzSXRlbVZpZXdcIik7XHJcblxyXG5yZXF1aXJlKFwicGx1Z2lucy9qcXVlcnkuYmEtb3V0c2lkZS1ldmVudHNcIik7XHJcblxyXG52YXIgS2V5Q29kZSA9IHtcclxuICAgIEVTQzogMjcsXHJcbiAgICBFTlRFUjogMTMsXHJcbiAgICBBUlJPV19VUDogMzgsXHJcbiAgICBBUlJPV19ET1dOOiA0MFxyXG59O1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXcgPSBNYXJpb25ldHRlLkNvbXBvc2l0ZVZpZXcuZXh0ZW5kKHtcclxuXHJcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICBjaGlsZFZpZXc6IFRhZ3NJdGVtVmlldyxcclxuICAgIGNoaWxkVmlld0NvbnRhaW5lcjogXCIuc2VsZWN0ZWRUYWdzXCIsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBjb250YWluZXI6IFwiLnRhZ3MtY29udGFpbmVyXCIsXHJcbiAgICAgICAgdGFnU2VsZWN0b3I6IFwiLnRhZy1pbnB1dFwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2tcIjogXCJvbkNsaWNrXCIsXHJcbiAgICAgICAgXCJrZXlkb3duIC50YWctaW5wdXRcIjogXCJvbkJ1dHRvbktleURvd25cIixcclxuICAgICAgICBcImlucHV0IC50YWctaW5wdXRcIjogXCJvbklucHV0Q2hhbmdlXCIsXHJcbiAgICAgICAgXCJjbGlja291dHNpZGVcIjogXCJvdXRzaWRlQ2xpY2tlZFwiXHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gaW5pdGlhbGl6ZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy5lbCA9IG9wdGlvbnMuZWw7XHJcbiAgICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcInRhZzphZGRcIiwgdGhpcy5hZnRlckl0ZW1BZGRlZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBidWlsZENoaWxkVmlldzogZnVuY3Rpb24gKGl0ZW0sIEl0ZW1WaWV3KSB7XHJcblxyXG4gICAgICAgIHZhciB2aWV3ID0gbmV3IEl0ZW1WaWV3KHtcclxuICAgICAgICAgICAgbW9kZWw6IGl0ZW0sXHJcbiAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGFmdGVySXRlbUFkZGVkOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudWkudGFnU2VsZWN0b3IudGV4dChcIlwiKTtcclxuICAgICAgICBpZiAodGhpcy5pbkZvY3VzKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25DbGljaygpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBvbkNsaWNrXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIGlmIChfLmlzRW1wdHkodGhpcy51aS50YWdTZWxlY3Rvci50ZXh0KCkpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVzZXRTZWxlY3RvcigpO1xyXG4gICAgICAgICAgICB0aGlzLmluRm9jdXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICByZXNldFNlbGVjdG9yOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudWkudGFnU2VsZWN0b3IudGV4dChcIlwiKTtcclxuICAgICAgICB0aGlzLnVpLnRhZ1NlbGVjdG9yLnNob3coKTtcclxuICAgICAgICB0aGlzLnVpLnRhZ1NlbGVjdG9yLmZvY3VzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uQnV0dG9uS2V5RG93bjogZnVuY3Rpb24gKGV2ZW50KSB7XHJcblxyXG4gICAgICAgIHZhciBrZXkgPSBldmVudC5rZXlDb2RlO1xyXG5cclxuICAgICAgICBpZiAoa2V5ID09PSBLZXlDb2RlLkFSUk9XX0RPV04gfHwga2V5ID09PSBLZXlDb2RlLkFSUk9XX1VQKSB7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwia2V5OnByZXNzXCIsIGtleSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoa2V5ID09PSBLZXlDb2RlLkVOVEVSKSB7XHJcbiAgICAgICAgICAgIHRoaXMudWkudGFnU2VsZWN0b3IuaGlkZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcInRhZzppbnB1dDplbnRlclwiLCB0aGlzLnVpLnRhZ1NlbGVjdG9yLnRleHQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uSW5wdXRDaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImlucHV0OmNoYW5nZVwiLCB0aGlzLnVpLnRhZ1NlbGVjdG9yLnRleHQoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb3V0c2lkZUNsaWNrZWQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzRW1wdHkodGhpcy51aS50YWdTZWxlY3Rvci50ZXh0KCkpKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluRm9jdXMgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJjbG9zZUFsbFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXc7XHJcbiIsIiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICB2YXIgVGFnc1ZpZXcgPSByZXF1aXJlKFwiLi9qcy92aWV3cy90YWdzVmlld1wiKTtcclxuICAgIHZhciBUYWdNb2RlbCA9IHJlcXVpcmUoXCIuL2pzL21vZGVscy90YWdNb2RlbFwiKTtcclxuICAgIHZhciBUYWdzQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCIuL2pzL2NvbGxlY3Rpb25zL3RhZ0NvbGxlY3Rpb25cIik7XHJcblxyXG4gICAgdmFyIFRhZ3MgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBpbml0aWFsVGFncyA9IG9wdGlvbnMuaW5pdGlhbFRhZ3MgfHwgW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24gPSBuZXcgVGFnc0NvbGxlY3Rpb24oaW5pdGlhbFRhZ3MpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRvciA9IG9wdGlvbnMudmFsaWRhdG9yO1xyXG4gICAgICAgICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XHJcbiAgICAgICAgICAgIHRoaXMuZWwgPSBvcHRpb25zLmVsO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LFwidGFnOmlucHV0OmVudGVyXCIsIHRoaXMub25FbnRlcik7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LFwidGFnOml0ZW06cmVtb3ZlXCIsIHRoaXMub25SZW1vdmVJdGVtKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsXCJhdXRvY29tcGxldGU6aXRlbTpzZWxlY3RlZFwiLHRoaXMub25JdGVtU2VsZWN0ZWQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHNob3dcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvdzogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy50YWdzVmlldyA9IG5ldyBUYWdzVmlldyh7XHJcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLmNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgICAgICBlbDogdGhpcy5lbFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy50YWdzVmlldy5yZW5kZXIoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkVudGVyOmZ1bmN0aW9uKHZhbCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVudGVyU3RhdGUgPSBcInVuaGFuZGxlXCI7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwia2V5OnByZXNzXCIsIDEzKTtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoXy5iaW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuZW50ZXJTdGF0ZSA9PT0gXCJ1bmhhbmRsZVwiKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEl0ZW0odmFsLCB2YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB0aGlzKSwgMTAwKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkl0ZW1TZWxlY3RlZDpmdW5jdGlvbih0ZXh0LCB2YWx1ZSl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVudGVyU3RhdGUgPSBcImhhbmRsZVwiO1xyXG4gICAgICAgICAgICB0aGlzLmFkZEl0ZW0odGV4dCx2YWx1ZSx0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbW92ZUl0ZW06ZnVuY3Rpb24odGFnSWQpe1xyXG5cclxuICAgICAgICAgICAgdmFyIHRhZ01vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmdldCh0YWdJZCk7XHJcblxyXG4gICAgICAgICAgICBpZihfLmlzT2JqZWN0KHRhZ01vZGVsKSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ucmVtb3ZlKHRhZ01vZGVsKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidGFnOnJlbW92ZVwiLCB0YWdNb2RlbC5nZXQoXCJ2YWx1ZVwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBhZGRJdGVtOmZ1bmN0aW9uKHRleHQsIHZhbCl7XHJcblxyXG4gICAgICAgICAgICBpZighXy5pc0VtcHR5KHZhbCkpe1xyXG5cclxuICAgICAgICAgICAgICAgIHRleHQgPSBfLmlzRW1wdHkodGV4dCkgPyB2YWwgOiB0ZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnTW9kZWwoe3ZhbHVlOnZhbCwgdGV4dDp0ZXh0LCBpc1ZhbGlkOnRoaXMuX3ZhbGlkYXRlKHZhbCl9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5hZGQodGFnKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcInRhZzphZGRcIiwgdmFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF92YWxpZGF0ZTpmdW5jdGlvbih2YWwpe1xyXG5cclxuICAgICAgICAgICAgdmFyIGlzVmFsaWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYoXy5pc0Z1bmN0aW9uKHRoaXMudmFsaWRhdG9yKSl7XHJcbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdGhpcy52YWxpZGF0b3IodmFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaXNWYWxpZDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGFncztcclxuXHJcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXIsIGZ1bmN0aW9uVHlwZT1cImZ1bmN0aW9uXCIsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwiY29udGVudFxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnRleHQpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudGV4dCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJjbG9zZS1idXR0b25cXFwiPjwvZGl2PlxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcInRhZ3MtY29udGFpbmVyXFxcIj5cXHJcXG4gICA8ZGl2IGNsYXNzPVxcXCJzZWxlY3RlZFRhZ3NcXFwiPjwvZGl2PlxcclxcbiAgIDxkaXYgY2xhc3M9XFxcInRhZy1zZWxlY3RvclxcXCI+XFxyXFxuICAgICAgIDxzcGFuIGNsYXNzPVxcXCJ0YWctaW5wdXRcXFwiIGNvbnRlbnRlZGl0YWJsZT1cXFwidHJ1ZVxcXCIgdGFiaW5kZXg9XFxcIi0xXFxcIj48L3NwYW4+XFxyXFxuICAgPC9kaXY+XFxyXFxuPC9kaXY+XCI7XG4gIH0pO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZSgnYXBwJyk7XHJcbnZhciBGcmFtZUxheW91dCA9IHJlcXVpcmUoJy4vanMvdmlld3MvZnJhbWVMYXlvdXQnKTtcclxudmFyIExheW91dEhlbHBlcnMgPSByZXF1aXJlKFwicmVzb2x2ZXJzL2Ryb3Bkb3duRGlzcGxheWVyXCIpO1xyXG5cclxudmFyIEZyYW1lID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgY3VyclN1YkxheW91dDogXCJcIixcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gaW5pdGlhbGl6ZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLmZyYW1lTGF5b3V0ID0gbmV3IEZyYW1lTGF5b3V0KCk7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5UbyhhcHAuY29udGV4dCwgJ2NoYW5nZTptb2R1bGUnLCB0aGlzLmNoYW5nZVN1YmxheW91dCwgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBzZXRMYXlvdXRcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2V0TGF5b3V0OiBmdW5jdGlvbiAobWFpblJlZ2lvbikge1xyXG4gICAgICAgIG1haW5SZWdpb24uc2hvdyh0aGlzLmZyYW1lTGF5b3V0KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGNoYW5nZVN1YmxheW91dDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgc3ViTW9kdWxlID0gYXBwLnN1Ym1vZHVsZXNbYXBwLmNvbnRleHQuZ2V0KFwibW9kdWxlXCIpXTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNPYmplY3Qoc3ViTW9kdWxlKSAmJiBfLmlzRnVuY3Rpb24oc3ViTW9kdWxlLnNldExheW91dCkpIHtcclxuICAgICAgICAgICAgc3ViTW9kdWxlLnNldExheW91dCgpO1xyXG4gICAgICAgICAgICB0aGlzLmZyYW1lTGF5b3V0Lm9uTW9kdWxlQ2hhbmdlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGdldFJlZ2lvbnNcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNldFJlZ2lvbjogZnVuY3Rpb24gKHJlZ2lvbk5hbWUsIHZpZXcpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZnJhbWVMYXlvdXRbcmVnaW9uTmFtZSArIFwiUmVnaW9uXCJdICYmICFfLmlzRW1wdHkodmlldykpIHtcclxuICAgICAgICAgICAgdGhpcy5mcmFtZUxheW91dFtyZWdpb25OYW1lICsgXCJSZWdpb25cIl0uc2hvdyh2aWV3KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIERpYWxvZyA9IHJlcXVpcmUoXCJkaWFsb2dcIik7XHJcbnZhciBUZWNoQmFyVmlldyA9IHJlcXVpcmUoJ2ZyYW1lLXZpZXdzL3RlY2hCYXJWaWV3Jyk7XHJcbnZhciBMb2FkZXJWaWV3ID0gcmVxdWlyZSgnZnJhbWUtdmlld3MvbG9hZGVyVmlldycpO1xyXG52YXIgU2V0dGluZ3NWaWV3ID0gcmVxdWlyZSgnZnJhbWUtdmlld3Mvc2V0dGluZ3NWaWV3Jyk7XHJcbnZhciBGcmFtZVRlbXBsYXRlID0gcmVxdWlyZShcImZyYW1lLXRlbXBsYXRlcy9mcmFtZUxheW91dC5oYnNcIik7XHJcblxyXG52YXIgRnJhbWVMYXlvdXQgPSBNYXJpb25ldHRlLkxheW91dFZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiBGcmFtZVRlbXBsYXRlLFxyXG5cclxuICAgIHVpOiB7XHJcbiAgICAgICAgc3dpdGNoZXJDYXB0aW9uOiBcIi5tb2R1bGVTd2l0Y2hlciAuY2FwdGlvblwiLFxyXG4gICAgICAgIHRlY2hiYXJXcmFwcGVyOiBcIi50ZWNoYmFyLXdyYXBwZXJcIixcclxuICAgICAgICBsb2FkZXJXcmFwcGVyOiBcIi5sb2FkZXItd3JhcHBlclwiLFxyXG4gICAgICAgIGJ0blNldHRpbmdzOiBcIi5idG5TZXR0aW5nc1wiXHJcbiAgICB9LFxyXG5cclxuICAgIHJlZ2lvbnM6IHtcclxuICAgICAgICBzZXR0aW5nc1JlZ2lvbjogXCIuc2V0dGluZ3MtcmVnaW9uXCIsXHJcbiAgICAgICAgc2VhcmNoUmVnaW9uOiBcIi5zZWFyY2gtcmVnaW9uXCIsXHJcbiAgICAgICAgYWN0aW9uc1JlZ2lvbjogXCIuYWN0aW9ucy1yZWdpb25cIixcclxuICAgICAgICBtYWluUmVnaW9uOiBcIi5tYWluLXJlZ2lvblwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgQHVpLmJ0blNldHRpbmdzXCI6IFwib3BlblNldHRpbmdzXCJcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgdGVjaEJhclZpZXcgPSBuZXcgVGVjaEJhclZpZXcoe1xyXG4gICAgICAgICAgICBlbDogdGhpcy51aS50ZWNoYmFyV3JhcHBlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRlY2hCYXJWaWV3LnJlbmRlcigpO1xyXG5cclxuICAgICAgICB2YXIgbG9hZGVyVmlldyA9IG5ldyBMb2FkZXJWaWV3KHtcclxuICAgICAgICAgICAgZWw6IHRoaXMudWkubG9hZGVyV3JhcHBlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGxvYWRlclZpZXcucmVuZGVyKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9wZW5TZXR0aW5nczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgc2V0dGluZ3NWaWV3ID0gbmV3IFNldHRpbmdzVmlldyh7XHJcbiAgICAgICAgICAgIG1vZGVsOiBhcHAuc2V0dGluZ3NcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGRpYWxvZyA9IG5ldyBEaWFsb2coe1xyXG4gICAgICAgICAgICBlbDogdGhpcy5lbCxcclxuICAgICAgICAgICAgdGl0bGU6IGFwcC50cmFuc2xhdG9yLnRyYW5zbGF0ZShcImZyYW1lOnNldHRpbmdzXCIpLFxyXG4gICAgICAgICAgICBpbnNpZGVWaWV3OiBzZXR0aW5nc1ZpZXdcclxuICAgICAgICB9KTtcclxuICAgICAgICBkaWFsb2cuc2hvdygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbk1vZHVsZUNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudWkuc3dpdGNoZXJDYXB0aW9uLmh0bWwoYXBwLnRyYW5zbGF0b3IudHJhbnNsYXRlKFwiZnJhbWU6bW9kdWxlLlwiICsgYXBwLmNvbnRleHQuZ2V0KFwibW9kdWxlXCIpKSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZUxheW91dDtcclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJmcmFtZS10ZW1wbGF0ZXMvbG9hZGVyLmhic1wiKTtcclxuXHJcbnZhciBMb2FkaW5nVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOnRlbXBsYXRlLFxyXG5cclxuICAgIHVpOntcclxuICAgICAgICBsb2FkZXI6XCIubG9hZGVyXCJcclxuICAgIH0sXHJcblxyXG4gICAgc2hvd0xvYWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuJGVsLnNob3coKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvc2VMb2FkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLiRlbC5oaWRlKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2FkaW5nVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcImZyYW1lLXRlbXBsYXRlcy9zZXR0aW5nc1ZpZXcuaGJzXCIpO1xyXG5cclxudmFyIFNldHRpbmdzVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuXHJcbiAgICB1aToge1xyXG4gICAgICAgIGJ0bkRhcms6IFwiLmRhcmtUaGVtZVwiLFxyXG4gICAgICAgIGJ0bkR1c3Q6IFwiLmR1c3RUaGVtZVwiLFxyXG4gICAgICAgIGRkbExhbmc6IFwiLmxhbmd1YWdlLWJveFwiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgLnRoZW1lQm94XCI6IFwib25UaGVtZUNsaWNrXCIsXHJcbiAgICAgICAgXCJjaGFuZ2UgQHVpLmRkbExhbmdcIjogXCJvbkxhbmd1YWdlQ2hhbmdlXCJcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy51aS5kZGxMYW5nLnZhbChhcHAuc2V0dGluZ3MuZ2V0KFwibGFuZ1wiKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uTGFuZ3VhZ2VDaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIGxhbmcgPSB0aGlzLnVpLmRkbExhbmcudmFsKCk7XHJcblxyXG4gICAgICAgIGFwcC5zZXR0aW5ncy5zZXQoXCJsYW5nXCIsIGxhbmcpO1xyXG4gICAgICAgIGFwcC5zZXR0aW5ncy5zYXZlKG51bGwsIHtcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uVGhlbWVDbGljazogZnVuY3Rpb24gKGUpIHtcclxuXHJcbiAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5jdXJyZW50VGFyZ2V0IHx8IGUuc3JjRWxlbWVudCk7XHJcbiAgICAgICAgdmFyIHRoZW1lID0gdGFyZ2V0LmF0dHIoXCJkYXRhLW5hbWVcIik7XHJcblxyXG4gICAgICAgIGFwcC5zZXR0aW5ncy5zZXQoXCJ0aGVtZVwiLCB0aGVtZSk7XHJcbiAgICAgICAgYXBwLnNldHRpbmdzLnNhdmUobnVsbCwge1xyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBhcHAuc2V0dGluZ3NDb250cm9sbGVyLl9sb2FkVGhlbWUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJmcmFtZS10ZW1wbGF0ZXMvdGVjaEJhci5oYnNcIik7XHJcblxyXG52YXIgVGVjaEJhclZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBkZHNSZXNvdXJjZXM6IFwiLmRkc1Jlc291cmNlc1wiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgLmRkc1Jlc291cmNlc1wiOiBcIm9uUmVzb3VyY2VzTWVudUNsaWNrXCJcclxuICAgIH0sXHJcblxyXG4gICAgb25SZXNvdXJjZXNNZW51Q2xpY2s6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRlY2hCYXJWaWV3O1xyXG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyLCBvcHRpb25zLCBmdW5jdGlvblR5cGU9XCJmdW5jdGlvblwiLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbiwgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3Npbmc7XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJ0ZWNoYmFyLXdyYXBwZXJcXFwiPjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcImxvYWRlci13cmFwcGVyXFxcIj48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJoZWFkZXItd3JhcHBlclxcXCI+XFxyXFxuICAgICA8ZGl2IGNsYXNzPVxcXCJsb2dvXFxcIj48L2Rpdj5cXHJcXG4gICAgIDxkaXYgY2xhc3M9XFxcInNlYXJjaC1yZWdpb25cXFwiPjwvZGl2PlxcclxcbiAgICAgPGRpdiBjbGFzcz1cXFwiYWNjb3VudE5hbWVcXFwiIGFsdD1cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuYWNjb3VudE5hbWUpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuYWNjb3VudE5hbWUpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiIHRpdGxlPVxcXCJcIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuYWNjb3VudE5hbWUpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuYWNjb3VudE5hbWUpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJhY3Rpb25zLXdyYXBwZXJcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJtb2R1bGVTd2l0Y2hlclxcXCI+XFxyXFxuICAgICAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJidXR0b24gbGluayBkcm9wZG93biBkZHNJZF9kZHNNb2R1bGVzXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJ0b2dnbGVcXFwiPjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJkcm9wZG93bi1zbGlkZXIgZGRzTW9kdWxlc1xcXCI+XFxyXFxuICAgICAgICAgICA8YSBjbGFzcz1cXFwiZGRtIHNlbGVjdE1haWxcXFwiIGhyZWY9XFxcIiNpbmJveFxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6bW9kdWxlLm1haWxcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwiZnJhbWU6bW9kdWxlLm1haWxcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgICAgPGEgY2xhc3M9XFxcImRkbSBzZWxlY3RUYXNrc1xcXCIgaHJlZj1cXFwiI3Rhc2tzXFxcIj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcImZyYW1lOm1vZHVsZS50YXNrc1wiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTptb2R1bGUudGFza3NcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbiAgICAgPGRpdiBjbGFzcz1cXFwiYWN0aW9ucy1yZWdpb25cXFwiPjwvZGl2PlxcclxcbiAgICAgPGRpdiBjbGFzcz1cXFwiYnRuU2V0dGluZ3NcXFwiPjxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBwcmltZUljb24gX2J0blNldHRpbmdzXFxcIj48c3BhbiBjbGFzcz1cXFwic2V0dGluZ3NJY29uXFxcIj48L3NwYW4+PC9hPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcIm1haW4tcmVnaW9uXFxcIj48L2Rpdj5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJsb2FkZXJcXFwiPkxvYWRpbmcuLi4uLi48L2Rpdj5cXHJcXG5cXHJcXG5cXHJcXG5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwic2V0dGluZ3NWaWV3XFxcIj5cXHJcXG5cXHJcXG4gICAgICAgPGRpdiBjbGFzcz1cXFwic2VjdGlvblxcXCI+XFxyXFxuICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0aXRsZVxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6c2V0dGluZ3MubGFuZ3VhZ2VcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwiZnJhbWU6c2V0dGluZ3MubGFuZ3VhZ2VcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgICAgICAgIDxzZWxlY3QgY2xhc3M9XFxcImxhbmd1YWdlLWJveFxcXCIgbmFtZT1cXFwibGFuZ3VhZ2VzXFxcIiBkYXRhLWFjdGlvbj1cXFwibGFuZ3VhZ2VzXFxcIiA+XFxyXFxuICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiZW4tVVNcXFwiPkVuZ2xpc2ggKFVTKTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImVzLUVTXFxcIj5Fc3Bhw7FvbDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgPC9zZWxlY3Q+XFxyXFxuICAgICAgIDwvZGl2PlxcclxcblxcclxcbiAgICAgICA8ZGl2IGNsYXNzPVxcXCJzZWN0aW9uXFxcIj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0aXRsZVxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6c2V0dGluZ3MudGhlbWVcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwiZnJhbWU6c2V0dGluZ3MudGhlbWVcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0aGVtZUJveCBkdXN0VGhlbWVcXFwiIGRhdGEtbmFtZT1cXFwiZHVzdFxcXCI+PC9kaXY+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwidGhlbWVCb3ggZGFya1RoZW1lXFxcIiBkYXRhLW5hbWU9XFxcImRhcmtcXFwiPjwvZGl2PlxcclxcbiAgICAgICA8L2Rpdj5cXHJcXG48L2Rpdj5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwidGVjaGJhclxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcInRpdGxlXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTp0ZWNoYmFyLnNsb2dhblwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTp0ZWNoYmFyLnNsb2dhblwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJtZW51XFxcIj5cXHJcXG4gICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsaW5rIG1lbnVpdGVtXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6dGVjaGJhci5hYm91dFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTp0ZWNoYmFyLmFib3V0XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsaW5rIG1lbnVpdGVtXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6dGVjaGJhci50dXRvcmlhbFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTp0ZWNoYmFyLnR1dG9yaWFsXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsaW5rIGRyb3Bkb3duIG1lbnVpdGVtIGRkc0lkX2Rkc1Jlc291cmNlc1xcXCI+PHNwYW4gY2xhc3M9XFxcImNhcHRpb25cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcImZyYW1lOnRlY2hiYXIucmVzb3VyY2VzXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcImZyYW1lOnRlY2hiYXIucmVzb3VyY2VzXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJ0b2dnbGVcXFwiPjwvc3Bhbj48L2E+XFxyXFxuXFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJkcm9wZG93bi1zbGlkZXIgZGRzUmVzb3VyY2VzXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8dWw+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8bGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBjaGVja2VkPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpPjwvaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aDI+Q2xpZW50LXNpZGU8L2gyPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICA8cD5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW0gZmlyc3RcXFwiPkJhY2tib25lPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+QmFja2JvbmUuRGVlcE1vZGVsPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+TWFyaW9uZXR0ZTwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPlVuZGVyc2NvcmU8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5SZXF1aXJlSlMgKEFNRCk8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5NdXN0YWNoZTwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPlNhc3NcXFxcQ29tcGFzczwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPC9saT5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxsaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGNoZWNrZWQ+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGk+PC9pPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMj5TZXJ2ZXItc2lkZTwvaDI+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDxwPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbSBmaXJzdFxcXCI+Tm9kZS5qczwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPkV4cHJlc3MgNC4wPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+TW9uZ29EQjwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPk1vbmdvb3NlPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+U29ja2V0LmlvPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+QXN5bmMuanM8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8bGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBjaGVja2VkPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpPjwvaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aDI+VGVzdGluZyB0b29sczwvaDI+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDxwPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbSBmaXJzdFxcXCI+TW9jaGE8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5DaGFpPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+U2lub248L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5CbGFua2V0PC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+U3F1aXJlPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPGxpPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgY2hlY2tlZD5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aT48L2k+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGgyPkRlcGxveWluZyB0b29sczwvaDI+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDxwPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbSBmaXJzdFxcXCI+R3J1bnQ8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxcclxcblxcclxcbiAgICAgICAgICAgICAgICA8L3VsPlxcclxcbiAgICAgICAgICAgIDwvZGl2PlxcclxcblxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvZGl2PlxcclxcblxcclxcblxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBDb250YWN0TW9kZWwgPSByZXF1aXJlKFwibWFpbC1tb2RlbHMvY29udGFjdE1vZGVsXCIpO1xyXG52YXIgQmFzZUNvbGxlY3Rpb24gPSByZXF1aXJlKFwiYmFzZS1jb2xsZWN0aW9ucy9iYXNlQ29sbGVjdGlvblwiKTtcclxuXHJcbnZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcbnZhciBfc3RyQ29udGFjdHMgPSBmcy5yZWFkRmlsZVN5bmMoJy4vY2xpZW50L3NyYy9jb21tb24vZGF0YS9jb250YWN0cy5qc29uJywgJ3V0ZjgnKTtcclxuXHJcbnZhciBDb250YWN0c0NvbGxlY3Rpb24gPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIENvbnRhY3RzQ29sbGVjdGlvbiA9IEJhc2VDb2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIG1vZGVsOiBDb250YWN0TW9kZWwsXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXR0cnMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjb250YWN0TGlzdCA9IHRoaXMuX2NyZWF0ZUNvbnRhY3RMaXN0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KHtjb2xsZWN0aW9uOmNvbnRhY3RMaXN0fSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9jcmVhdGVDb250YWN0TGlzdDpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdmFyIGNvbnRhY3RMaXN0ID0gW10sIGNvbnRhY3RzID0gSlNPTi5wYXJzZShfc3RyQ29udGFjdHMpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGNvbnRhY3RzLCBmdW5jdGlvbihjb250YWN0KXtcclxuICAgICAgICAgICAgICAgIGNvbnRhY3RMaXN0LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOmNvbnRhY3QucmVwbGFjZShcIixcIiwgXCIgXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIGFkZHJlc3M6Y29udGFjdC5yZXBsYWNlKFwiLFwiLCBcIi5cIikudG9Mb3dlckNhc2UoKSArIFwiQG1haWxkby5jb21cIlxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udGFjdExpc3Q7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGdldFRpdGxlczpmdW5jdGlvbihhZGRyZXNzTGlzdCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVzID0gW107XHJcblxyXG4gICAgICAgICAgICBfLmVhY2goYWRkcmVzc0xpc3QsIF8uYmluZChmdW5jdGlvbihhZGRyZXNzKXtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSBfLmZpbmQodGhpcy5tb2RlbHMsZnVuY3Rpb24gKHJlY29yZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWNvcmQuZ2V0KFwiYWRkcmVzc1wiKSA9PT0gYWRkcmVzcztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2gobW9kZWwgPyBtb2RlbC5nZXQoXCJ0aXRsZVwiKSA6IGFkZHJlc3MpO1xyXG4gICAgICAgICAgICB9LHRoaXMpKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRhY3RzQ29sbGVjdGlvbjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIE1haWxNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9tYWlsTW9kZWxcIik7XHJcbnZhciBGaWx0ZXJlZENvbGxlY3Rpb24gPSByZXF1aXJlKFwiYmFzZS1jb2xsZWN0aW9ucy9maWx0ZXJlZENvbGxlY3Rpb25cIik7XHJcblxyXG52YXIgTWFpbENvbGxlY3Rpb24gPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxDb2xsZWN0aW9uID0gRmlsdGVyZWRDb2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGlzRmV0Y2hlZDogZmFsc2UsXHJcblxyXG4gICAgICAgIG1vZGVsOiBNYWlsTW9kZWwsXHJcblxyXG4gICAgICAgIHJlc291cmNlOiAnbWFpbHMnLFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXR0cnMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc29ja2V0ID0ge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdE5hbWU6IHRoaXMucmVzb3VyY2UsXHJcbiAgICAgICAgICAgICAgICBpbzogYXBwLnNvY2tldENvbnRyb2xsZXIuZ2V0U29ja2V0KClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHVybDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgXCIvXCIgKyB0aGlzLnJlc291cmNlO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgY29tcGFyYXRvcjogZnVuY3Rpb24gKG1vZGVsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtKG5ldyBEYXRlKG1vZGVsLmdldChcInNlbnRUaW1lXCIpKS5nZXRUaW1lKCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZmlsdGVyQnlMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlsdGVyZWQgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGlmKF8uaXNTdHJpbmcobGFiZWwpKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZCA9IF8uZmlsdGVyKHRoaXMubW9kZWxzLCBmdW5jdGlvbiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gISFtb2RlbC5nZXQoXCJsYWJlbHMuXCIrbGFiZWwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJlZDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbENvbGxlY3Rpb247XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcblxyXG52YXIgQWN0aW9uc0NvbnRyb2xsZXIgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIEFjdGlvbnNDb250cm9sbGVyID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJtYWlsOmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbHMsIFwiY2hhbmdlOm1ldGFkYXRhXCIsIHRoaXMuZml4VXJsLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6c2VuZCcsIHRoaXMuc2VuZCwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8obWFpbC5jaGFubmVsLnZlbnQsICdtYWlsOnNlbGVjdCcsIHRoaXMuc2VsZWN0LCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6bW92ZVRvJywgdGhpcy5tb3ZlVG8sIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKG1haWwuY2hhbm5lbC52ZW50LCAnbWFpbDpkZWxldGUnLCB0aGlzLmRlbGV0ZUl0ZW1zLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6bWFya0FzJywgdGhpcy5tYXJrQXMsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKG1haWwuY2hhbm5lbC52ZW50LCAnbWFpbDpkaXNjYXJkJywgdGhpcy5kaXNjYXJkLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6Y2hhbmdlJywgdGhpcy5zYXZlQXNEcmFmdCwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5zZWxlY3RCeSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWlscy5zZWxlY3RBbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ25vbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbHMuY2xlYXJTZWxlY3RlZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAncmVhZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWlscy5zZWxlY3RNb2RlbHModGhpcy5tYWlscy5maWx0ZXJCeUxhYmVsKFwicmVhZFwiKSwge2V4Y2x1c2l2ZWx5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd1bnJlYWQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbHMuc2VsZWN0TW9kZWxzKHRoaXMubWFpbHMuZmlsdGVyQnlMYWJlbChcInVucmVhZFwiKSwge2V4Y2x1c2l2ZWx5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbWFya0FzOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLCBpdGVtcyA9IG9wdGlvbnMuaXRlbXMgfHwgdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5tYWlscy5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5tYXJrQXMob3B0aW9ucy5sYWJlbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUl0ZW1zKGl0ZW1zLCBvcHRpb25zKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbW92ZVRvOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLCBpdGVtcyA9IG9wdGlvbnMuaXRlbXMgfHwgdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5tYWlscy5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5tb3ZlVG8ob3B0aW9ucy50YXJnZXQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVJdGVtcyhpdGVtcywgXy5leHRlbmQoe30sIG9wdGlvbnMsIHtcInJlZnJlc2hcIjogdHJ1ZX0pKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdXBkYXRlSXRlbXM6IGZ1bmN0aW9uIChpdGVtcywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWlscy51cGRhdGUoe1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkSXRlbXM6IGl0ZW1zLFxyXG4gICAgICAgICAgICAgICAgZmllbGRzOiBbJ2xhYmVscycsICdncm91cHMnXSxcclxuXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBfLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlZnJlc2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgdGhpcyksXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOnVwZGF0ZUl0ZW1zOmVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZGVsZXRlSXRlbXM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMuZGVzdHJveSh7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtczogdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpLFxyXG5cclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IF8uYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6ZGVsZXRlSXRlbXM6ZXJyb3JcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZW5kOiBmdW5jdGlvbiAobWFpbE1vZGVsKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc09iamVjdChtYWlsTW9kZWwpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbWFpbE1vZGVsLnNldChcImdyb3Vwc1wiLCBbXSwge3NpbGVudDogdHJ1ZX0pO1xyXG5cclxuICAgICAgICAgICAgICAgIG1haWxNb2RlbC5zYXZlKG51bGwsIHtcclxuICAgICAgICAgICAgICAgICAgICBzaWxlbnQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogXy5iaW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcyksXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6c2F2ZTplcnJvclwiLCBtYWlsTW9kZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGRpc2NhcmQ6IGZ1bmN0aW9uIChtYWlsTW9kZWwpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYWlsTW9kZWwuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5yb3V0ZXIucHJldmlvdXMoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG1haWxNb2RlbC5kZXN0cm95KHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBfLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVN1Y2Nlc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCB0aGlzKSxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpkZWxldGU6ZXJyb3JcIiwgbWFpbE1vZGVsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzYXZlQXNEcmFmdDogZnVuY3Rpb24gKG1haWxNb2RlbCkge1xyXG5cclxuICAgICAgICAgICAgbWFpbE1vZGVsLnNldChcImdyb3Vwcy5kcmFmdFwiLCB0cnVlLCB7c2lsZW50OiB0cnVlfSk7XHJcblxyXG4gICAgICAgICAgICBtYWlsTW9kZWwuc2F2ZShudWxsLCB7XHJcbiAgICAgICAgICAgICAgICBzYXZlQXM6IFwiZHJhZnRcIixcclxuICAgICAgICAgICAgICAgIHNpbGVudDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBmaXhVcmw6IGZ1bmN0aW9uIChtZXRhZGF0YSkge1xyXG4gICAgICAgICAgICBtYWlsLnJvdXRlci5maXhVcmwoe3BhZ2U6IG1ldGFkYXRhLmN1cnJQYWdlICsgMX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGhhbmRsZVN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvbi50eXBlXCIpID09PSBcImNvbXBvc2VcIikge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5yb3V0ZXIucHJldmlvdXMoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFpbHMucmVmcmVzaCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEFjdGlvbnNDb250cm9sbGVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgQ29udGVudExheW91dCA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL21haWxDb250ZW50TGF5b3V0XCIpO1xyXG52YXIgTWFpbHNWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvbWFpbHNWaWV3XCIpO1xyXG52YXIgUHJldmlld1ZpZXcgPSByZXF1aXJlKFwibWFpbC12aWV3cy9wcmV2aWV3Vmlld1wiKTtcclxudmFyIENvbXBvc2VWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvY29tcG9zZVZpZXcvY29tcG9zZVZpZXdcIik7XHJcbnZhciBFbXB0eU1haWxWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvZW1wdHlNYWlsVmlld1wiKTtcclxuXHJcbnZhciBNYWlsQ29udGVudENvbnRyb2xsZXIgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxDb250ZW50Q29udHJvbGxlciA9IE1hcmlvbmV0dGUuQ29udHJvbGxlci5leHRlbmQoe1xyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1haWxzLCBcImNoYW5nZTppdGVtc1wiLCB0aGlzLmNsb3NlUHJldmlldyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6c2VsZWN0aW9uXCIsIHRoaXMudG9nZ2xlUHJldmlldyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8obWFpbC5jaGFubmVsLnZlbnQsIFwibWFpbFRhYmxlOkl0ZW1DbGlja2VkXCIsIHRoaXMuc2hvd1ByZXZpZXcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG5ld0xheW91dFxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBuZXdMYXlvdXQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dCA9IG5ldyBDb250ZW50TGF5b3V0KCk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5jb250ZW50TGF5b3V0LCBcInJlbmRlclwiLCB0aGlzLm9uTGF5b3V0UmVuZGVyKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnRMYXlvdXQ7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uTGF5b3V0UmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb25cIik7XHJcblxyXG4gICAgICAgICAgICB2YXIgZW1wdHlNYWlsVmlldyA9IG5ldyBFbXB0eU1haWxWaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dC5wcmV2aWV3UmVnaW9uLmFkZChlbXB0eU1haWxWaWV3KTtcclxuXHJcbiAgICAgICAgICAgIHZhciB0YWJsZVZpZXcgPSBuZXcgTWFpbHNWaWV3KHtjb2xsZWN0aW9uOiB0aGlzLm1haWxzfSk7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dC5pdGVtc1JlZ2lvbi5hZGQodGFibGVWaWV3KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBzaG93UHJldmlld1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93UHJldmlldzogZnVuY3Rpb24gKG1haWxNb2RlbCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNPYmplY3QobWFpbE1vZGVsKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOnNlbGVjdFwiLCB7c2VsZWN0Qnk6IFwibm9uZVwifSk7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptYXJrQXNcIiwge2xhYmVsOiAncmVhZCcsIGl0ZW1zOiBbbWFpbE1vZGVsLmlkXX0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucHJldmlldyA9ICFtYWlsTW9kZWwuZ2V0KFwiZ3JvdXBzLmRyYWZ0XCIpID8gbmV3IFByZXZpZXdWaWV3KHttb2RlbDogbWFpbE1vZGVsfSkgOiBuZXcgQ29tcG9zZVZpZXcoe21vZGVsOiBtYWlsTW9kZWx9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dC5wcmV2aWV3UmVnaW9uLmFkZCh0aGlzLnByZXZpZXcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRvZ2dsZVByZXZpZXc6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzT2JqZWN0KHRoaXMucHJldmlldykpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSB0aGlzLm1haWxzLmdldFNlbGVjdGVkKCkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2aWV3LiRlbC50b2dnbGUoc2VsZWN0ZWQgPT09IDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGNsb3NlUHJldmlldzogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMucHJldmlldyAmJiB0aGlzLnByZXZpZXcubW9kZWwpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaXNNb2RlbEV4aXN0ID0gXy5pc09iamVjdCh0aGlzLm1haWxzLmdldCh0aGlzLnByZXZpZXcubW9kZWwuaWQpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzTW9kZWxFeGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dC5wcmV2aWV3UmVnaW9uLmNsZWFuKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbENvbnRlbnRDb250cm9sbGVyOyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBNYWlsQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCJtYWlsLWNvbGxlY3Rpb25zL21haWxDb2xsZWN0aW9uXCIpO1xyXG52YXIgQ29udGFjdHNDb2xsZWN0aW9uID0gcmVxdWlyZShcIm1haWwtY29sbGVjdGlvbnMvY29udGFjdHNDb2xsZWN0aW9uXCIpO1xyXG52YXIgU2VsZWN0YWJsZURlY29yYXRvciA9IHJlcXVpcmUoXCJkZWNvcmF0b3JzL3NlbGVjdGFibGVDb2xsZWN0aW9uRGVjb3JhdG9yXCIpO1xyXG5cclxudmFyIERhdGFDb250cm9sbGVyID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBEYXRhQ29udHJvbGxlciA9IE1hcmlvbmV0dGUuQ29udHJvbGxlci5leHRlbmQoe1xyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGluaXRpYWxpemVcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RDb2xsZWN0aW9uID0gbmV3IENvbnRhY3RzQ29sbGVjdGlvbigpO1xyXG4gICAgICAgICAgICB0aGlzLm1haWxDb2xsZWN0aW9uID0gbmV3IFNlbGVjdGFibGVEZWNvcmF0b3IobmV3IE1haWxDb2xsZWN0aW9uKCkpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZXRIYW5kbGVycygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlsQ29sbGVjdGlvbiwgXCJmZXRjaDpzdWNjZXNzXCIsIHRoaXMuX3VwZGF0ZVNlbGVjdGlvbiwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsIFwiY2hhbmdlOm1haWwuYWN0aW9uXCIsIHRoaXMuX3JlZnJlc2hNYWlsQ29sbGVjdGlvbiwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLnNldHRpbmdzLCBcImNoYW5nZTp1c2VyTmFtZVwiLCB0aGlzLl9zZXRVc2VyTmFtZSwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLnZlbnQsIFwiZGF0YTpjaGFuZ2VcIiwgdGhpcy5fb25EYXRhQ2hhbmdlLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfc2V0SGFuZGxlcnM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIG1haWwuY2hhbm5lbC5yZXFyZXMuc2V0SGFuZGxlcihcIm1haWw6Y29sbGVjdGlvblwiLCB0aGlzLl9nZXRNYWlsQ29sbGVjdGlvbiwgdGhpcyk7XHJcbiAgICAgICAgICAgIG1haWwuY2hhbm5lbC5yZXFyZXMuc2V0SGFuZGxlcihcImNvbnRhY3Q6Y29sbGVjdGlvblwiLCB0aGlzLl9nZXRDb250YWN0Q29sbGVjdGlvbiwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gZ2V0IGNvbGxlY3Rpb25zXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9nZXRNYWlsQ29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYWlsQ29sbGVjdGlvbjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfZ2V0Q29udGFjdENvbGxlY3Rpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGFjdENvbGxlY3Rpb247XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBkYXRhIGNoYW5nZVxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX29uRGF0YUNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoTWFpbENvbGxlY3Rpb24oKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfc2V0VXNlck5hbWU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciB1c2VyTmFtZSA9IGFwcC5zZXR0aW5ncy5nZXQoXCJ1c2VyTmFtZVwiKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbENvbGxlY3Rpb24udXNlck5hbWUgPSB1c2VyTmFtZTtcclxuICAgICAgICAgICAgdGhpcy5jb250YWN0Q29sbGVjdGlvbi51c2VyTmFtZSA9IHVzZXJOYW1lO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250YWN0Q29sbGVjdGlvbi5mZXRjaCh7fSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX3VwZGF0ZVNlbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLm1haWxDb2xsZWN0aW9uLnVwZGF0ZVNlbGVjdGlvbih7fSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfcmVmcmVzaE1haWxDb2xsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb25cIikgfHwge307XHJcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBhY3Rpb24ucGFyYW1zIHx8IHt9O1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNGaW5pdGUocGFyYW1zLnBhZ2UpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haWxDb2xsZWN0aW9uLmZldGNoQnkoe1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFnZU51bWJlcjogcGFyYW1zLnBhZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5OiBwYXJhbXMucXVlcnkgfHwgJ2dyb3VwczonICsgYWN0aW9uLnR5cGVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBEYXRhQ29udHJvbGxlcjtcclxuXHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgTWFpbE1vZGVsID0gcmVxdWlyZShcIm1haWwtbW9kZWxzL21haWxNb2RlbFwiKTtcclxudmFyIE1haW5MYXlvdXQgPSByZXF1aXJlKFwibWFpbC12aWV3cy9tYWlsTWFpbkxheW91dFwiKTtcclxudmFyIFNlYXJjaFZpZXcgPSByZXF1aXJlKFwibWFpbC12aWV3cy9zZWFyY2hWaWV3XCIpO1xyXG52YXIgTmF2VmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL25hdlZpZXdcIik7XHJcbnZhciBBY3Rpb25WaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvYWN0aW9uVmlldy9hY3Rpb25WaWV3XCIpO1xyXG52YXIgQ29tcG9zZVZpZXcgPSByZXF1aXJlKFwibWFpbC12aWV3cy9jb21wb3NlVmlldy9jb21wb3NlVmlld1wiKTtcclxudmFyIEVtcHR5Rm9sZGVyc1ZpZXcgPSByZXF1aXJlKFwibWFpbC12aWV3cy9lbXB0eUZvbGRlclZpZXdcIik7XHJcbnZhciBDb250ZW50TGF5b3V0Q29udHJvbGxlciA9IHJlcXVpcmUoXCIuL21haWxDb250ZW50TGF5b3V0Q29udHJvbGxlclwiKTtcclxuXHJcbnZhciBNYWluTGF5b3V0Q29udHJvbGxlciA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgTWFpbkxheW91dENvbnRyb2xsZXIgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250ZW50TGF5b3V0Q29udHJvbGxlciA9IG5ldyBDb250ZW50TGF5b3V0Q29udHJvbGxlcigpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKGFwcC5jb250ZXh0LCAnY2hhbmdlOm1haWwuYWN0aW9uJywgdGhpcy5vbkFjdGlvbkNoYW5nZSwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gc2V0Vmlld3NcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2V0Vmlld3M6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoVmlldyA9IG5ldyBTZWFyY2hWaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbkxheW91dCA9IG5ldyBNYWluTGF5b3V0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aW9uVmlldyA9IG5ldyBBY3Rpb25WaWV3KCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbkxheW91dCwgXCJyZW5kZXJcIiwgdGhpcy5vbk1haW5MYXlvdXRSZW5kZXIsIHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgYXBwLmZyYW1lLnNldFJlZ2lvbihcInNlYXJjaFwiLCB0aGlzLnNlYXJjaFZpZXcpO1xyXG4gICAgICAgICAgICBhcHAuZnJhbWUuc2V0UmVnaW9uKFwiYWN0aW9uc1wiLCB0aGlzLmFjdGlvblZpZXcpO1xyXG4gICAgICAgICAgICBhcHAuZnJhbWUuc2V0UmVnaW9uKFwibWFpblwiLCB0aGlzLm1haW5MYXlvdXQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbk1haW5MYXlvdXRSZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBuYXZWaWV3ID0gbmV3IE5hdlZpZXcoKTtcclxuICAgICAgICAgICAgdGhpcy5tYWluTGF5b3V0Lm5hdlJlZ2lvbi5hZGQobmF2Vmlldyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgZW1wdHlGb2xkZXJWaWV3ID0gbmV3IEVtcHR5Rm9sZGVyc1ZpZXcoKTtcclxuICAgICAgICAgICAgdGhpcy5tYWluTGF5b3V0LndvcmtSZWdpb24uYWRkKGVtcHR5Rm9sZGVyVmlldyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25BY3Rpb25DaGFuZ2VcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25BY3Rpb25DaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvbi50eXBlXCIpO1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJjb21wb3NlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01haWxzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgY29tcG9zZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGNvbXBvc2VWaWV3ID0gbmV3IENvbXBvc2VWaWV3KHtcclxuICAgICAgICAgICAgICAgIG1vZGVsOiBuZXcgTWFpbE1vZGVsKClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbkxheW91dC53b3JrUmVnaW9uLmFkZChjb21wb3NlVmlldyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNob3dNYWlsczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLmNvbnRlbnRMYXlvdXQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dCA9IHRoaXMuY29udGVudExheW91dENvbnRyb2xsZXIubmV3TGF5b3V0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5tYWluTGF5b3V0LndvcmtSZWdpb24uYWRkKHRoaXMuY29udGVudExheW91dCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE1haW5MYXlvdXRDb250cm9sbGVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG5cclxudmFyIE1haWxSb3V0ZXJDb250cm9sbGVyID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBNYWlsUm91dGVyQ29udHJvbGxlciA9IE1hcmlvbmV0dGUuQ29udHJvbGxlci5leHRlbmQoe1xyXG5cclxuICAgICAgICBjb21wb3NlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGFwcC5jb250ZXh0LnNldChcIm1haWwuYWN0aW9uXCIsIHsndHlwZSc6ICdjb21wb3NlJywgJ3BhcmFtcyc6IHt9fSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluYm94OiBmdW5jdGlvbiAocGFyYW0pIHtcclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibWFpbC5hY3Rpb25cIiwgeyd0eXBlJzogJ2luYm94JywgJ3BhcmFtcyc6IHRoaXMuYW5hbHl6ZVBhcmFtcyhwYXJhbSl9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2VudDogZnVuY3Rpb24gKHBhcmFtKSB7XHJcbiAgICAgICAgICAgIGFwcC5jb250ZXh0LnNldChcIm1haWwuYWN0aW9uXCIsIHsndHlwZSc6ICdzZW50JywgJ3BhcmFtcyc6IHRoaXMuYW5hbHl6ZVBhcmFtcyhwYXJhbSl9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZHJhZnQ6IGZ1bmN0aW9uIChwYXJhbSkge1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCB7J3R5cGUnOiAnZHJhZnQnLCAncGFyYW1zJzogdGhpcy5hbmFseXplUGFyYW1zKHBhcmFtKX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0cmFzaDogZnVuY3Rpb24gKHBhcmFtKSB7XHJcbiAgICAgICAgICAgIGFwcC5jb250ZXh0LnNldChcIm1haWwuYWN0aW9uXCIsIHsndHlwZSc6ICd0cmFzaCcsICdwYXJhbXMnOiB0aGlzLmFuYWx5emVQYXJhbXMocGFyYW0pfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNwYW06IGZ1bmN0aW9uIChwYXJhbSkge1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCB7J3R5cGUnOiAnc3BhbScsICdwYXJhbXMnOiB0aGlzLmFuYWx5emVQYXJhbXMocGFyYW0pfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNlYXJjaDogZnVuY3Rpb24gKHBhcmFtMSwgcGFyYW0yKSB7XHJcbiAgICAgICAgICAgIGFwcC5jb250ZXh0LnNldChcIm1haWwuYWN0aW9uXCIsIHsndHlwZSc6ICdzZWFyY2gnLCAncGFyYW1zJzogdGhpcy5hbmFseXplUGFyYW1zKHBhcmFtMiwgcGFyYW0xKX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBhbmFseXplUGFyYW1zOiBmdW5jdGlvbiAoaWQsIHF1ZXJ5KSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgcGFyYW1zID0ge3BhZ2U6IDEsIHF1ZXJ5OiBxdWVyeX07XHJcblxyXG4gICAgICAgICAgICBpZihfcy5zdGFydHNXaXRoKGlkLCBcInBcIikpe1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhZ2UgPSBpZC5zcGxpdChcInBcIilbMV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKF8uaXNGaW5pdGUocGFnZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbXMucGFnZSA9IHBhZ2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gYmVmb3JlUm91dGVcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGJlZm9yZVJvdXRlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtb2R1bGVcIiwgXCJtYWlsXCIpO1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCBudWxsLCB7c2lsZW50OiB0cnVlfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE1haWxSb3V0ZXJDb250cm9sbGVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgRGVlcE1vZGVsID0gcmVxdWlyZShcImJhc2UtbW9kZWxcIik7XHJcblxyXG52YXIgQ29udGFjdE1vZGVsID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBDb250YWN0TW9kZWwgPSBEZWVwTW9kZWwuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgZGVmYXVsdHMgOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOicnLFxyXG4gICAgICAgICAgICBhZGRyZXNzOicnXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKHJlc3BvbnNlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTpyZXNwb25zZS5yZXBsYWNlKFwiLFwiLCBcIiBcIiksXHJcbiAgICAgICAgICAgICAgICBhZGRyZXNzOnJlc3BvbnNlLnJlcGxhY2UoXCIsXCIsIFwiLlwiKS50b0xvd2VyQ2FzZSgpICsgXCJAbWFpbGRvLmNvbVwiXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb250YWN0TW9kZWw7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZUZpbHRlck1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHtcclxuXHJcbiAgICBzZXRJbnB1dDogZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgdGhpcy5pbnB1dCA9IF8uaXNTdHJpbmcoaW5wdXQpID8gaW5wdXQudG9Mb3dlckNhc2UoKSA6IFwiXCI7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBwcmVkaWNhdGU6IGZ1bmN0aW9uIChtb2RlbCkge1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy50ZXN0KG1vZGVsLmdldChcInRleHRcIikpIHx8IHRoaXMudGVzdChtb2RlbC5nZXQoXCJ2YWx1ZVwiKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdGVzdDogZnVuY3Rpb24gKHRleHQpIHtcclxuXHJcbiAgICAgICAgdmFyIHJlcyA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoXy5pc1N0cmluZyh0ZXh0KSkge1xyXG5cclxuICAgICAgICAgICAgdGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIHJlcyA9IF9zLnN0YXJ0c1dpdGgodGV4dCwgdGhpcy5pbnB1dCkgfHxcclxuICAgICAgICAgICAgICAgIF9zLmNvbnRhaW5zKHRleHQsIFwiIFwiICsgdGhpcy5pbnB1dCkgfHxcclxuICAgICAgICAgICAgICAgIF9zLmNvbnRhaW5zKHRleHQsIFwiOlwiICsgdGhpcy5pbnB1dCkgfHxcclxuICAgICAgICAgICAgICAgIF9zLmNvbnRhaW5zKHRleHQsIFwiLlwiICsgdGhpcy5pbnB1dCkgfHxcclxuICAgICAgICAgICAgICAgIF9zLmNvbnRhaW5zKHRleHQsIFwiQFwiICsgdGhpcy5pbnB1dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaGlnaGxpZ2h0S2V5OiBmdW5jdGlvbiAoa2V5KSB7XHJcblxyXG4gICAgICAgIGlmIChfLmlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGtleVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UobmV3IFJlZ0V4cChcIl5cIiArIHRoaXMuaW5wdXQsICdnaScpLCBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8Yj4nICsgc3RyICsgJzwvYj4nO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmlucHV0LCAnZ2knKSwgZnVuY3Rpb24gKHN0cikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnIDxiPicgKyBfcy5zdHJSaWdodChzdHIsICcgJykgKyAnPC9iPic7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UobmV3IFJlZ0V4cChcIjpcIiArIHRoaXMuaW5wdXQsIFwiZ2lcIiksIGZ1bmN0aW9uIChzdHIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzo8Yj4nICsgX3Muc3RyUmlnaHQoc3RyLCAnOicpICsgJzwvYj4nO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoXCJAXCIgKyB0aGlzLmlucHV0LCBcImdpXCIpLCBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdAPGI+JyArIF9zLnN0clJpZ2h0KHN0ciwgJ0AnKSArICc8L2I+JztcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKFwiXFxcXC5cIiArIHRoaXMuaW5wdXQsIFwiZ2lcIiksIGZ1bmN0aW9uIChzdHIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJy48Yj4nICsgX3Muc3RyUmlnaHQoc3RyLCAnLicpICsgJzwvYj4nO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBrZXk7XHJcbiAgICB9XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9Db21wbGV0ZUZpbHRlck1vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgQmFzZU1vZGVsID0gcmVxdWlyZShcImJhc2UtbW9kZWxcIik7XHJcblxyXG52YXIgTWFpbE1vZGVsID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBNYWlsTW9kZWwgPSBCYXNlTW9kZWwuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgZGVmYXVsdHM6IHtcclxuICAgICAgICAgICAgZnJvbTogJycsXHJcbiAgICAgICAgICAgIHRvOiAnJyxcclxuICAgICAgICAgICAgY2M6ICcnLFxyXG4gICAgICAgICAgICBiY2M6ICcnLFxyXG4gICAgICAgICAgICBzdWJqZWN0OiAnJyxcclxuICAgICAgICAgICAgc2VudFRpbWU6ICcnLFxyXG4gICAgICAgICAgICBib2R5OiAnJyxcclxuICAgICAgICAgICAgbGFiZWxzOiB7fSxcclxuICAgICAgICAgICAgZ3JvdXBzOiBbXVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlc291cmNlOiAnbWFpbCcsXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChhdHRycywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy51c2VyTmFtZSA9IGFwcC5zZXR0aW5ncy5nZXQoXCJ1c2VyTmFtZVwiKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc29ja2V0ID0ge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdE5hbWU6IHRoaXMucmVzb3VyY2UsXHJcbiAgICAgICAgICAgICAgICBpbzogYXBwLnNvY2tldENvbnRyb2xsZXIuZ2V0U29ja2V0KClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHVybDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgXCIvXCIgKyB0aGlzLnJlc291cmNlO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGdldCBhZGRyZXNzZXNcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZ2V0SW5nb2luZ0FkZHJlc3NlczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0QWRkcmVzc2VzKCdmcm9tJyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGdldE91dGdvaW5nQWRkcmVzc2VzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9nZXRBZGRyZXNzZXMoJ3RvJykuY29uY2F0KHRoaXMuX2dldEFkZHJlc3NlcygnY2MnKSwgdGhpcy5fZ2V0QWRkcmVzc2VzKCdiY2MnKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9nZXRBZGRyZXNzZXM6IGZ1bmN0aW9uIChhdHRyKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWRkcmVzc2VzID0gdGhpcy5nZXQoYXR0cikuc3BsaXQoXCI7XCIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNFbXB0eShfLmxhc3QoYWRkcmVzc2VzKSkpIHtcclxuICAgICAgICAgICAgICAgIGFkZHJlc3NlcyA9IF8uZmlyc3QoYWRkcmVzc2VzLCBhZGRyZXNzZXMubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFkZHJlc3NlcztcclxuICAgICAgICB9LFxyXG5cclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gYWRkXFxyZW1vdmUgYWRkcmVzc1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBhZGRBZGRyZXNzOiBmdW5jdGlvbiAoYXR0ciwgYWRkcmVzcykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy51cGRhdGVMYXN0QWRkcmVzcyhhdHRyLCBhZGRyZXNzICsgXCI7XCIpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB1cGRhdGVMYXN0QWRkcmVzczogZnVuY3Rpb24gKGF0dHIsIGFkZHJlc3MpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBhZGRyTGlzdCA9IHRoaXMuZ2V0KGF0dHIpLnNwbGl0KFwiO1wiKTtcclxuICAgICAgICAgICAgYWRkckxpc3RbYWRkckxpc3QubGVuZ3RoIC0gMV0gPSBhZGRyZXNzO1xyXG4gICAgICAgICAgICB0aGlzLnNldChhdHRyLCBhZGRyTGlzdC5qb2luKFwiO1wiKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJlbW92ZUFkZHJlc3M6IGZ1bmN0aW9uIChhdHRyLCBhZGRyZXNzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWRkckxpc3QgPSB0aGlzLmdldChhdHRyKS5yZXBsYWNlKGFkZHJlc3MgKyBcIjtcIiwgXCJcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KGF0dHIsIGFkZHJMaXN0KTtcclxuICAgICAgICB9LFxyXG5cclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gdmFsaWRhdGVcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdmFsaWRhdGU6IGZ1bmN0aW9uIChhdHRycywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zYXZlQXMgIT09IFwiZHJhZnRcIikge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBvdXRnb2luZ0FkZHJlc3NlcyA9IHRoaXMuZ2V0T3V0Z29pbmdBZGRyZXNzZXMoKTtcclxuICAgICAgICAgICAgICAgIGlmIChfLmlzRW1wdHkob3V0Z29pbmdBZGRyZXNzZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1haWxNb2RlbC5FcnJvcnMuTm9SZWNpcGllbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHRvID0gdGhpcy5fZ2V0QWRkcmVzc2VzKCd0bycpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0by5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWxpZGF0ZUFkZHJlc3ModG9baV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBNYWlsTW9kZWwuRXJyb3JzLkludmFsaWRUb0FkZHJlc3M7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjYyA9IHRoaXMuX2dldEFkZHJlc3NlcygnY2MnKTtcclxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWxpZGF0ZUFkZHJlc3MoY2NbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBNYWlsTW9kZWwuRXJyb3JzLkludmFsaWRDY0FkZHJlc3M7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHZhbGlkYXRlQWRkcmVzczogZnVuY3Rpb24gKGFkZHJlc3MpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciByZWcgPSAvXlxcdysoWy0rLiddXFx3KykqQFxcdysoWy0uXVxcdyspKlxcLlxcdysoWy0uXVxcdyspKiQvO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVnLnRlc3QoYWRkcmVzcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gbWFya0FzXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG1hcmtBczogZnVuY3Rpb24gKGxhYmVsKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgb3Bwb3NpdGVMYWJlbCA9IHRoaXMuX2dldE9wb3NpdGVMYWJlbChsYWJlbCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVMYWJlbChvcHBvc2l0ZUxhYmVsKTtcclxuICAgICAgICAgICAgdGhpcy5fYWRkTGFiZWwobGFiZWwpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfZ2V0T3Bvc2l0ZUxhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChfcy5zdGFydHNXaXRoKGxhYmVsLCBcInVuXCIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX3Muc3RyUmlnaHQobGFiZWwsIFwidW5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIFwidW5cIiArIGxhYmVsO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYWRkTGFiZWw6IGZ1bmN0aW9uIChsYWJlbCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLmdldChcImxhYmVscy5cIiArIGxhYmVsKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXQoXCJsYWJlbHMuXCIgKyBsYWJlbCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX3JlbW92ZUxhYmVsOiBmdW5jdGlvbiAobGFiZWxOYW1lKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbGFiZWxzID0gdGhpcy5nZXQoJ2xhYmVscycpO1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uaGFzKGxhYmVscywgbGFiZWxOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGxhYmVsc1tsYWJlbE5hbWVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gbW92ZVRvXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG1vdmVUbzogZnVuY3Rpb24gKGRlc3QpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBncm91cHMgPSB0aGlzLmdldCgnZ3JvdXBzJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5jb250YWlucyhncm91cHMsIFwidHJhc2hcIikgfHwgXy5jb250YWlucyhncm91cHMsIFwic3BhbVwiKSB8fCBkZXN0ID09PSBcInRyYXNoXCIgfHwgZGVzdCA9PT0gXCJzcGFtXCIpIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwcyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBncm91cHMucHVzaChkZXN0KTtcclxuICAgICAgICAgICAgdGhpcy5zZXQoJ2dyb3VwcycsIGdyb3Vwcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgTWFpbE1vZGVsLkVycm9ycyA9IHtcclxuXHJcbiAgICAgICAgTm9SZWNpcGllbnQ6IDEsXHJcbiAgICAgICAgSW52YWxpZFRvQWRkcmVzczogMixcclxuICAgICAgICBJbnZhbGlkQ2NBZGRyZXNzOiAzXHJcbiAgICB9O1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsTW9kZWw7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBNYWlsUm91dGVyID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBNYWlsUm91dGVyID0gTWFyaW9uZXR0ZS5BcHBSb3V0ZXIuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgYXBwUm91dGVzOiB7XHJcbiAgICAgICAgICAgIFwiXCI6IFwiaW5ib3hcIixcclxuICAgICAgICAgICAgXCJpbmJveFwiOiBcImluYm94XCIsXHJcbiAgICAgICAgICAgIFwiaW5ib3gvOnBhcmFtXCI6IFwiaW5ib3hcIixcclxuICAgICAgICAgICAgXCJkcmFmdFwiOiBcImRyYWZ0XCIsXHJcbiAgICAgICAgICAgIFwiZHJhZnQvOnBhcmFtXCI6IFwiZHJhZnRcIixcclxuICAgICAgICAgICAgXCJzZW50XCI6IFwic2VudFwiLFxyXG4gICAgICAgICAgICBcInNlbnQvOnBhcmFtXCI6IFwic2VudFwiLFxyXG4gICAgICAgICAgICBcInRyYXNoXCI6IFwidHJhc2hcIixcclxuICAgICAgICAgICAgXCJ0cmFzaC86cGFyYW1cIjogXCJ0cmFzaFwiLFxyXG4gICAgICAgICAgICBcInNwYW1cIjogXCJzcGFtXCIsXHJcbiAgICAgICAgICAgIFwic3BhbS86cGFyYW1cIjogXCJzcGFtXCIsXHJcbiAgICAgICAgICAgIFwic2VhcmNoLzpwYXJhbTFcIjogXCJzZWFyY2hcIixcclxuICAgICAgICAgICAgXCJzZWFyY2gvOnBhcmFtMS86cGFyYW0yXCI6IFwic2VhcmNoXCIsXHJcbiAgICAgICAgICAgIFwiY29tcG9zZVwiOiBcImNvbXBvc2VcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udHJvbGxlciA9IG9wdGlvbnMuY29udHJvbGxlcjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByb3V0ZTogZnVuY3Rpb24gKHJvdXRlLCBuYW1lLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICByZXR1cm4gQmFja2JvbmUuUm91dGVyLnByb3RvdHlwZS5yb3V0ZS5jYWxsKHRoaXMsIHJvdXRlLCBuYW1lLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2xsZXIuYmVmb3JlUm91dGUoKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIG1haWwucm91dGVyLm5hdmlnYXRlKFwiaW5ib3hcIiwge3RyaWdnZXI6IHRydWV9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZml4VXJsOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1haWxSb3V0ZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5yZXF1aXJlKFwicGx1Z2lucy90b2dnbGUuYmxvY2tcIik7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL21vcmVBY3Rpb25zVmlldy5oYnNcIik7XHJcblxyXG52YXIgTW9yZUFjdGlvbnNWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuICAgIE1vcmVBY3Rpb25zVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogJ2FjdGlvbk9wdGlvbnNWaWV3JyxcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgZGRpU3RhcnJlZDpcIi5hZGRTdGFyXCIsXHJcbiAgICAgICAgICAgIGRkaU5vdFN0YXJyZWQ6XCIucmVtb3ZlU3RhclwiLFxyXG4gICAgICAgICAgICBkZGlJbXA6XCIubWFya0ltcFwiLFxyXG4gICAgICAgICAgICBkZGlOb3RJbXA6XCIubWFya05vdEltcFwiLFxyXG4gICAgICAgICAgICBkZGlSZWFkOlwiLm1hcmtSZWFkXCIsXHJcbiAgICAgICAgICAgIGRkaVVucmVhZDpcIi5tYXJrVW5yZWFkXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpUmVhZFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptYXJrQXNcIiwge2xhYmVsOiAncmVhZCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpVW5yZWFkXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1hcmtBc1wiLCB7bGFiZWw6ICd1bnJlYWQnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaUltcFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptYXJrQXNcIiwge2xhYmVsOiAnaW1wb3J0YW50J30pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5kZGlOb3RJbXBcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHsgbGFiZWw6ICd1bmltcG9ydGFudCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpU3RhcnJlZFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptYXJrQXNcIiwge2xhYmVsOiAnc3RhcnJlZCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpTm90U3RhcnJlZFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptYXJrQXNcIiwge2xhYmVsOiAndW5zdGFycmVkJ30pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWlscyA9IG1haWwuY2hhbm5lbC5yZXFyZXMucmVxdWVzdChcIm1haWw6Y29sbGVjdGlvblwiKTtcclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1haWxzLCBcImNoYW5nZTppdGVtcyB1cGRhdGU6c3VjY2VzcyBjaGFuZ2U6c2VsZWN0aW9uXCIsIHRoaXMuc2V0RHJvcERvd25JdGVtcywgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2V0RHJvcERvd25JdGVtczpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdmFyIGl0ZW1zID0gdGhpcy5pdGVtc1RvU2hvdygpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy51aS5kZGlTdGFycmVkLnRvZ2dsZUJsb2NrKGl0ZW1zLnN0YXJlZCk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuZGRpTm90U3RhcnJlZC50b2dnbGVCbG9jayhpdGVtc1tcIm5vdC1zdGFyZWRcIl0pO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaUltcC50b2dnbGVCbG9jayhpdGVtcy5pbXBvcnRhbnQpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaU5vdEltcC50b2dnbGVCbG9jayhpdGVtc1tcIm5vdC1pbXBvcnRhbnRcIl0pO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaVJlYWQudG9nZ2xlQmxvY2soaXRlbXMucmVhZCk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuZGRpVW5yZWFkLnRvZ2dsZUJsb2NrKGl0ZW1zLnVucmVhZCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaXRlbXNUb1Nob3c6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcywgaXRlbXMgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLm1haWxzLmdldFNlbGVjdGVkKCksIGZ1bmN0aW9uIChpdGVtKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5tYWlscy5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZihtb2RlbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVscyA9IG1vZGVsLmdldChcImxhYmVsc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZUl0ZW1Ub1Nob3cobGFiZWxzLGl0ZW1zKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBpdGVtcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHVwZGF0ZUl0ZW1Ub1Nob3c6ZnVuY3Rpb24obGFiZWxzLGl0ZW1zKXtcclxuXHJcbiAgICAgICAgICAgIGlmKF8uaGFzKGxhYmVscyxcInN0YXJyZWRcIikpe1xyXG4gICAgICAgICAgICAgICAgaXRlbXNbXCJub3Qtc3RhcmVkXCJdID0gdHJ1ZTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBpdGVtcy5zdGFyZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKF8uaGFzKGxhYmVscyxcImltcG9ydGFudFwiKSl7XHJcbiAgICAgICAgICAgICAgICBpdGVtc1tcIm5vdC1pbXBvcnRhbnRcIl0gPSB0cnVlO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIGl0ZW1zLmltcG9ydGFudCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoXy5oYXMobGFiZWxzLFwicmVhZFwiKSl7XHJcbiAgICAgICAgICAgICAgICBpdGVtcy51bnJlYWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIGl0ZW1zLnJlYWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb3JlQWN0aW9uc1ZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9tb3ZlVG9WaWV3Lmhic1wiKTtcclxuXHJcbnJlcXVpcmUoXCJwbHVnaW5zL3RvZ2dsZS5ibG9ja1wiKTtcclxuXHJcbnZhciBNb3JlVmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcbiAgICBNb3JlVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogJ21vdmVUb1ZpZXcnLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBkZGlJbmJveDogXCIubW92ZVRvSW5ib3hcIixcclxuICAgICAgICAgICAgZGRpVHJhc2g6IFwiLm1vdmVUb1RyYXNoXCIsXHJcbiAgICAgICAgICAgIGRkaVNwYW06IFwiLm1vdmVUb1NwYW1cIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5kZGlJbmJveFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptb3ZlVG9cIiwge3RhcmdldDogJ2luYm94J30pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5kZGlUcmFzaFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptb3ZlVG9cIiwge3RhcmdldDogJ3RyYXNoJ30pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5kZGlTcGFtXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1vdmVUb1wiLCB7dGFyZ2V0OiAnc3BhbSd9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhhcHAuY29udGV4dCwgJ2NoYW5nZTptYWlsLmFjdGlvbicsIHRoaXMuc2hvd1JlbGV2YW50SXRlbXMsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvd1JlbGV2YW50SXRlbXM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3VyckFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uLnR5cGVcIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaUluYm94LnRvZ2dsZUJsb2NrKCFfLmNvbnRhaW5zKFtcImluYm94XCJdLCB0aGlzLmN1cnJBY3Rpb24pKTtcclxuICAgICAgICAgICAgdGhpcy51aS5kZGlTcGFtLnRvZ2dsZUJsb2NrKF8uY29udGFpbnMoW1wiaW5ib3hcIiwgXCJ0cmFzaFwiXSwgdGhpcy5jdXJyQWN0aW9uKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuZGRpVHJhc2gudG9nZ2xlQmxvY2soXy5jb250YWlucyhbXCJzcGFtXCIsIFwiaW5ib3hcIl0sIHRoaXMuY3VyckFjdGlvbikpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9yZVZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9wYWdlclZpZXcuaGJzXCIpO1xyXG5cclxudmFyIFBhZ2VyVmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcbiAgICBQYWdlclZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICBjbGFzc05hbWU6ICdwYWdlSW5mb1ZpZXcnLFxyXG4gICAgICAgIHBhZ2VJbmZvOiB7fSxcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgY29udGFpbmVyOlwiLnBhZ2VySW5uZXJDb250YWluZXJcIixcclxuICAgICAgICAgICAgYnRuTmV3ZXI6IFwiLmJ0bk5ld2VyXCIsXHJcbiAgICAgICAgICAgIGJ0bk9sZGVyOiBcIi5idG5PbGRlclwiLFxyXG4gICAgICAgICAgICBsYmxUb3RhbDogXCIudG90YWxcIixcclxuICAgICAgICAgICAgbGJsRnJvbTogXCIubGJsRm9ybVwiLFxyXG4gICAgICAgICAgICBsYmxUbzogXCIubGJsVG9cIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5idG5OZXdlclwiOiBcInNob3dOZXdlckl0ZW1zXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmJ0bk9sZGVyXCI6IFwic2hvd09sZGVySXRlbXNcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJtYWlsOmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbHMsIFwiY2hhbmdlOm1ldGFkYXRhXCIsdGhpcy5hZGp1c3RQYWdlLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25SZW5kZXI6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICB0aGlzLmFkanVzdFBhZ2UoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBhZGp1c3RQYWdlXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGFkanVzdFBhZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmKF8uaXNPYmplY3QodGhpcy5tYWlscy5tZXRhZGF0YSkgJiYgdGhpcy5tYWlscy5tZXRhZGF0YS50b3RhbCA+IDApe1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUGFnZUluZm8oKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRqdXN0QnV0dG9ucygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGp1c3RMYWJlbHMoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudWkuY29udGFpbmVyLnNob3coKTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVpLmNvbnRhaW5lci5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdXBkYXRlUGFnZUluZm86ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBtZXRhZGF0YSA9IHRoaXMubWFpbHMubWV0YWRhdGE7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBhZ2VJbmZvLnRvdGFsID0gbWV0YWRhdGEudG90YWw7XHJcbiAgICAgICAgICAgIHRoaXMucGFnZUluZm8uY3VyclBhZ2UgPSBtZXRhZGF0YS5jdXJyUGFnZSArIDE7XHJcbiAgICAgICAgICAgIHRoaXMucGFnZUluZm8uZnJvbSA9IG1ldGFkYXRhLmZyb20gKyAxO1xyXG4gICAgICAgICAgICB0aGlzLnBhZ2VJbmZvLnRvID0gTWF0aC5taW4obWV0YWRhdGEudG90YWwsIG1ldGFkYXRhLnRvICsgMSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGFkanVzdEJ1dHRvbnM6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVpLmJ0bk5ld2VyLnRvZ2dsZUNsYXNzKFwiZGlzYWJsZVwiLHRoaXMucGFnZUluZm8uZnJvbSA9PT0gMSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuYnRuT2xkZXIudG9nZ2xlQ2xhc3MoXCJkaXNhYmxlXCIsdGhpcy5wYWdlSW5mby50byA+PSB0aGlzLnBhZ2VJbmZvLnRvdGFsKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgYWRqdXN0TGFiZWxzOiBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy51aS5sYmxGcm9tLnRleHQodGhpcy5wYWdlSW5mby5mcm9tKTtcclxuICAgICAgICAgICAgdGhpcy51aS5sYmxUby50ZXh0KE1hdGgubWluKHRoaXMucGFnZUluZm8udG8sIHRoaXMucGFnZUluZm8udG90YWwpKTtcclxuICAgICAgICAgICAgdGhpcy51aS5sYmxUb3RhbC50ZXh0KHRoaXMucGFnZUluZm8udG90YWwpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGJ1dHRvbnMgY2xpY2tcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvd05ld2VySXRlbXM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBhZ2VJbmZvLmZyb20gPiAxKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubmF2aWdhdGUodGhpcy5wYWdlSW5mby5jdXJyUGFnZSAtIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNob3dPbGRlckl0ZW1zOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5wYWdlSW5mby50byA8IHRoaXMucGFnZUluZm8udG90YWwpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uYXZpZ2F0ZSh0aGlzLnBhZ2VJbmZvLmN1cnJQYWdlICsgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbmF2aWdhdGU6IGZ1bmN0aW9uKHBhZ2Upe1xyXG5cclxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB2YXIgc2VhcmNoID0gYWN0aW9uLnBhcmFtcy5xdWVyeSA/IFwiL1wiICsgYWN0aW9uLnBhcmFtcy5xdWVyeSA6IFwiXCI7XHJcbiAgICAgICAgICAgIG1haWwucm91dGVyLm5hdmlnYXRlKGFjdGlvbi50eXBlICsgc2VhcmNoICsgXCIvcFwiICsgcGFnZS50b1N0cmluZygpLCB7IHRyaWdnZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQYWdlclZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBQYWdlclZpZXcgPSByZXF1aXJlKFwiLi9fcGFnZXJWaWV3XCIpO1xyXG52YXIgTW92ZVRvVmlldyA9IHJlcXVpcmUoXCIuL19tb3ZlVG9WaWV3XCIpO1xyXG52YXIgTW9yZUFjdGlvbnNWaWV3ID0gcmVxdWlyZShcIi4vX21vcmVBY3Rpb25zVmlld1wiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL2FjdGlvblZpZXcuaGJzXCIpO1xyXG5cclxudmFyIEFjdGlvblZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG4gICAgQWN0aW9uVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiAnYWN0aW9uVmlldycsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIGJ0blNlbGVjdDogXCIuYnRuU2VsZWN0XCIsXHJcbiAgICAgICAgICAgIGJ0bk1vdmVUbzogXCIuYnRuTW92ZVRvXCIsXHJcbiAgICAgICAgICAgIGJ0bkRlbGV0ZTogXCIuYnRuRGVsZXRlXCIsXHJcbiAgICAgICAgICAgIGJ0bk1vcmU6IFwiLmJ0bk1vcmVcIixcclxuICAgICAgICAgICAgcGFnZXJSZWdpb246IFwiLnBhZ2VyXCIsXHJcbiAgICAgICAgICAgIHNlcnZlckFjdGlvbnNSZWdpb246IFwiLnNlcnZlckFjdGlvbnNcIixcclxuICAgICAgICAgICAgbGJsQ29tcG9zZTpcIi5sYmxDb21wb3NlXCIsXHJcbiAgICAgICAgICAgIGJ0bkRpc2NhcmREcmFmdHM6IFwiLmJ0bkRpc2NhcmREcmFmdHNcIixcclxuICAgICAgICAgICAgYnRuRGVsZXRlRm9yZXZlcjogXCIuYnRuRGVsZXRlRm9yZXZlclwiLFxyXG4gICAgICAgICAgICBidG5Ob3RTcGFtOiBcIi5idG5Ob3RTcGFtXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgXCJjbGljayAuc2VsZWN0QWxsXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOnNlbGVjdFwiLCB7c2VsZWN0Qnk6IFwiYWxsXCJ9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayAuc2VsZWN0Tm9uZVwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpzZWxlY3RcIiwge3NlbGVjdEJ5OiBcIm5vbmVcIn0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIC5zZWxlY3RSZWFkXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOnNlbGVjdFwiLCB7c2VsZWN0Qnk6IFwicmVhZFwifSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgLnNlbGVjdFVucmVhZFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpzZWxlY3RcIiwge3NlbGVjdEJ5OiBcInVucmVhZFwifSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmJ0bkRlbGV0ZVwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptb3ZlVG9cIiwge3RhcmdldDogJ3RyYXNoJ30pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5idG5Ob3RTcGFtXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1vdmVUb1wiLCB7dGFyZ2V0OiAnaW5ib3gnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmJ0bkRpc2NhcmREcmFmdHNcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6ZGVsZXRlXCIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5idG5EZWxldGVGb3JldmVyXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOmRlbGV0ZVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJtYWlsOmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKG1haWwuY2hhbm5lbC52ZW50LCBcIm1haWw6Y2hhbmdlXCIsIHRoaXMub25NYWlsQ2hhbmdlLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1haWxzLCBcImNoYW5nZTpzZWxlY3Rpb25cIiwgdGhpcy5zaG93UmVsZXZhbnRJdGVtcywgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsICdjaGFuZ2U6bWFpbC5hY3Rpb24nLCB0aGlzLnNob3dSZWxldmFudEl0ZW1zLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybntcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogX3MuY2FwaXRhbGl6ZShhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvbi50eXBlXCIpKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBhZ2VyVmlldyA9IG5ldyBQYWdlclZpZXcoe1xyXG4gICAgICAgICAgICAgICAgZWw6IHRoaXMudWkucGFnZXJSZWdpb25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMucGFnZXJWaWV3LnJlbmRlcigpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tb3JlQWN0aW9uc1ZpZXcgPSBuZXcgTW9yZUFjdGlvbnNWaWV3KHtcclxuICAgICAgICAgICAgICAgIGVsOiB0aGlzLnVpLmJ0bk1vcmVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMubW9yZUFjdGlvbnNWaWV3LnJlbmRlcigpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tb3ZlVG9WaWV3ID0gbmV3IE1vdmVUb1ZpZXcoe1xyXG4gICAgICAgICAgICAgICAgZWw6IHRoaXMudWkuYnRuTW92ZVRvXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLm1vdmVUb1ZpZXcucmVuZGVyKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBzaG93UmVsZXZhbnRJdGVtc1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNob3dSZWxldmFudEl0ZW1zOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb24udHlwZVwiKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucmVzZXRVSSgpO1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJjb21wb3NlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SXRlbXMoW1wibGJsQ29tcG9zZVwiXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xpc3RPcHRpb25zKGFjdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcmVzZXRVSTpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zaG93SXRlbXMoXy5rZXlzKHRoaXMudWkpLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkubGJsQ29tcG9zZS50ZXh0KGFwcC50cmFuc2xhdG9yLnRyYW5zbGF0ZShcIm1haWw6bmV3TWVzc2FnZVwiKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvd0xpc3RPcHRpb25zOiBmdW5jdGlvbiAoYWN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNob3dJdGVtcyhbXCJidG5TZWxlY3RcIiwgXCJwYWdlclJlZ2lvblwiXSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIV8uaXNFbXB0eSh0aGlzLm1haWxzLmdldFNlbGVjdGVkKCkpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZHJhZnRcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SXRlbXMoW1wiYnRuU2VsZWN0XCIsIFwiYnRuRGlzY2FyZERyYWZ0c1wiLCBcImJ0bk1vcmVcIl0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwic3BhbVwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dJdGVtcyhbXCJidG5TZWxlY3RcIiwgXCJidG5Ob3RTcGFtXCIsIFwiYnRuRGVsZXRlRm9yZXZlclwiLCBcImJ0bk1vcmVcIl0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidHJhc2hcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SXRlbXMoW1wiYnRuU2VsZWN0XCIsIFwiYnRuRGVsZXRlRm9yZXZlclwiLCBcImJ0bk1vdmVUb1wiLCBcImJ0bk1vcmVcIl0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dJdGVtcyhbXCJidG5TZWxlY3RcIiwgXCJidG5EZWxldGVcIiwgXCJidG5Nb3ZlVG9cIiwgXCJidG5Nb3JlXCJdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93SXRlbXM6IGZ1bmN0aW9uIChpdGVtcywgc2hvdykge1xyXG5cclxuICAgICAgICAgICAgc2hvdyA9IF8uaXNCb29sZWFuKHNob3cpID8gc2hvdyA6IHRydWU7XHJcblxyXG4gICAgICAgICAgICBfLmVhY2goaXRlbXMsIF8uYmluZChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51aVtpdGVtXS50b2dnbGUoc2hvdyk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG9uTWFpbENoYW5nZVxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uTWFpbENoYW5nZTpmdW5jdGlvbihtYWlsTW9kZWwpe1xyXG5cclxuICAgICAgICAgICAgdmFyIHN1YmplY3QgPSBtYWlsTW9kZWwuZ2V0KCdzdWJqZWN0Jyk7XHJcblxyXG4gICAgICAgICAgICBpZihfLmlzRW1wdHkoc3ViamVjdCkpe1xyXG4gICAgICAgICAgICAgICAgc3ViamVjdCA9IGFwcC50cmFuc2xhdG9yLnRyYW5zbGF0ZShcIm1haWw6bmV3TWVzc2FnZVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnVpLmxibENvbXBvc2UudGV4dChzdWJqZWN0KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFjdGlvblZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBUYWdzID0gcmVxdWlyZShcInRhZ3NcIik7XHJcbnZhciBBdXRvQ29tcGxldGUgPSByZXF1aXJlKFwiYXV0b0NvbXBsZXRlXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvX2FkZHJlc3NWaWV3Lmhic1wiKTtcclxudmFyIENvbnRhY3RzRmlsdGVyTW9kZWwgPSByZXF1aXJlKFwibWFpbC1tb2RlbHMvY29udGFjdHNGaWx0ZXJNb2RlbFwiKTtcclxuXHJcbnZhciBBZGRyZXNzVmlldyA9e307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcbiAgICBBZGRyZXNzVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lOiAnYWRkcmVzc1ZpZXcnLFxyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgdGFnc1BsYWNlaG9sZGVyOiBcIi50YWdzUGxhY2Vob2xkZXJcIixcclxuICAgICAgICAgICAgYXV0b0NvbXBsZXRlUGxhY2Vob2xkZXI6IFwiLmF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBpbml0aWFsaXplXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6ZnVuY3Rpb24ob3B0aW9ucyl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1vZGVsQXR0ciA9IG9wdGlvbnMubW9kZWxBdHRyO1xyXG4gICAgICAgICAgICB0aGlzLnZlbnQgPSBuZXcgQmFja2JvbmUuV3JlcXIuRXZlbnRBZ2dyZWdhdG9yKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJjb250YWN0OmNvbGxlY3Rpb25cIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsIFwidGFnOmFkZFwiLCB0aGlzLmFkZEFkZHJlc3MsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJ0YWc6cmVtb3ZlXCIsIHRoaXMucmVtb3ZlQWRkcmVzcywgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImlucHV0OmNoYW5nZVwiLCB0aGlzLnVwZGF0ZUxhc3RBZGRyZXNzLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLmNvbnRhY3RzLCBcImZldGNoOnN1Y2Nlc3NcIiwgdGhpcy5yZW5kZXJBdXRvQ29tcG9uZW50LCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBvblJlbmRlclxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbmRlcjpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJUYWdDb21wb25lbnQoKTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJBdXRvQ29tcG9uZW50KCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJlbmRlclRhZ0NvbXBvbmVudDpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy50YWdzID0gbmV3IFRhZ3Moe1xyXG4gICAgICAgICAgICAgICAgZWw6dGhpcy51aS50YWdzUGxhY2Vob2xkZXIsXHJcbiAgICAgICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3I6IHRoaXMubW9kZWwudmFsaWRhdGVBZGRyZXNzLFxyXG4gICAgICAgICAgICAgICAgaW5pdGlhbFRhZ3M6IHRoaXMuZ2V0QWRkcmVzc2VzKClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMudGFncy5zaG93KCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJlbmRlckF1dG9Db21wb25lbnQ6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIGlmKCF0aGlzLmF1dG9Db21wbGV0ZSAmJiAhdGhpcy5jb250YWN0cy5pc0VtcHR5KCkpe1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlID0gbmV3IEF1dG9Db21wbGV0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgdmVudDogdGhpcy52ZW50LFxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB0aGlzLmdldENvbnRhY3RBcnJheSgpLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsOnRoaXMudWkuYXV0b0NvbXBsZXRlUGxhY2Vob2xkZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyTW9kZWw6IG5ldyBDb250YWN0c0ZpbHRlck1vZGVsKClcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdXRvQ29tcGxldGUuc2hvdygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBnZXRDb250YWN0QXJyYXk6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBfY29udGFjdHMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdHMuZWFjaChmdW5jdGlvbihtb2RlbCl7XHJcbiAgICAgICAgICAgICAgICBfY29udGFjdHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogbW9kZWwuZ2V0KFwidGl0bGVcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG1vZGVsLmdldChcImFkZHJlc3NcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogQXV0b0NvbXBsZXRlLlRZUEVTLkNPTlRBQ1RcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIF9jb250YWN0cztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGdldEFkZHJlc3NlczpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlcyA9IFtdLCBhZGRyZXNzZXMgPSB0aGlzLm1vZGVsLmdldCh0aGlzLm1vZGVsQXR0cik7XHJcblxyXG4gICAgICAgICAgICBpZighXy5pc0VtcHR5KGFkZHJlc3Nlcykpe1xyXG4gICAgICAgICAgICAgICAgdmFyIGFkZHJlc3NBcnIgPSBfcy5zdHJMZWZ0QmFjayhhZGRyZXNzZXMsIFwiO1wiKS5zcGxpdChcIjtcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgXy5lYWNoKGFkZHJlc3NBcnIsIGZ1bmN0aW9uKGFkZHJlc3Mpe1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDptYWlsLmRhdGFDb250cm9sbGVyLmNvbnRhY3RDb2xsZWN0aW9uLmdldFRpdGxlcyhbYWRkcmVzc10pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTphZGRyZXNzXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgYWRkQWRkcmVzczogZnVuY3Rpb24oYWRkcmVzcyl7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWwuYWRkQWRkcmVzcyh0aGlzLm1vZGVsQXR0ciwgYWRkcmVzcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB1cGRhdGVMYXN0QWRkcmVzczogZnVuY3Rpb24oYWRkcmVzcyl7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWwudXBkYXRlTGFzdEFkZHJlc3ModGhpcy5tb2RlbEF0dHIsIGFkZHJlc3MpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcmVtb3ZlQWRkcmVzczogZnVuY3Rpb24oYWRkcmVzcyl7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWwucmVtb3ZlQWRkcmVzcyh0aGlzLm1vZGVsQXR0ciwgYWRkcmVzcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBZGRyZXNzVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIEFkZHJlc3NWaWV3ID0gcmVxdWlyZShcIi4vX2FkZHJlc3NWaWV3XCIpO1xyXG52YXIgTWFpbE1vZGVsID0gcmVxdWlyZShcIm1haWwtbW9kZWxzL21haWxNb2RlbFwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL2NvbXBvc2VWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBDb21wb3NlVmlldyA9e307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIG1iLCAgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuICAgIENvbXBvc2VWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICBjbGFzc05hbWU6ICdjb21wb3NlVmlldycsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIHRvSW5wdXRXcmFwcGVyOiBcIi50b0lucHV0V3JhcHBlclwiLFxyXG4gICAgICAgICAgICBjY0lucHV0V3JhcHBlcjogXCIuY2NJbnB1dFdyYXBwZXJcIixcclxuICAgICAgICAgICAgaW5wdXRTdWJqZWN0OiBcIi5zdWJqZWN0XCIsXHJcbiAgICAgICAgICAgIGlucHV0RWRpdG9yOiBcIi5jb21wb3NlLWVkaXRvclwiLFxyXG4gICAgICAgICAgICBoZWFkZXI6XCIuY29tcG9zZS1oZWFkZXJcIixcclxuICAgICAgICAgICAgY2NMaW5lOiAnLmNjTGluZScsXHJcbiAgICAgICAgICAgIHNlbmRCdG46XCIuc2VuZEJ0blwiLFxyXG4gICAgICAgICAgICBjbG9zZUJ0bjpcIi5jbG9zZUJ0blwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgIFwiY2xpY2sgIEB1aS5jbG9zZUJ0blwiOiBcIm9uQ2xvc2VCdG5DbGlja1wiLFxyXG4gICAgICAgICAgICBcImNsaWNrICBAdWkuc2VuZEJ0blwiOiBcIm9uU2VuZENsaWNrXCIsXHJcbiAgICAgICAgICAgIFwiYmx1ciAgIEB1aS5pbnB1dFN1YmplY3RcIjogXCJvblN1YmplY3RCbHVyXCIsXHJcbiAgICAgICAgICAgIFwiYmx1ciAgIEB1aS5pbnB1dEVkaXRvclwiOiBcIm9uRWRpdG9yQmx1clwiLFxyXG4gICAgICAgICAgICBcImNsaWNrICBAdWkudG9JbnB1dFdyYXBwZXJcIjogXCJvblRvSW5wdXRXcmFwcGVyQ2xpY2tcIixcclxuICAgICAgICAgICAgXCJjbGljayAgQHVpLmNjSW5wdXRXcmFwcGVyXCI6IFwib25DY0lucHV0V3JhcHBlckNsaWNrXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBtb2RlbEV2ZW50czp7XHJcbiAgICAgICAgICBjaGFuZ2U6XCJvbk1vZGVsQ2hhbmdlXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOmZ1bmN0aW9uKG9wdGlvbnMpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250YWN0cyA9IG9wdGlvbnMuY29udGFjdHM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBvblJlbmRlclxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJlbmRlclRvVmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlckNjVmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmlucHV0RWRpdG9yLmh0bWwodGhpcy5tb2RlbC5nZXQoJ2JvZHknKSk7XHJcbiAgICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW5kZXJUb1ZpZXc6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudG9WaWV3ID0gbmV3IEFkZHJlc3NWaWV3KHtcclxuICAgICAgICAgICAgICAgIG1vZGVsOnRoaXMubW9kZWwsXHJcbiAgICAgICAgICAgICAgICBtb2RlbEF0dHI6J3RvJyxcclxuICAgICAgICAgICAgICAgIGVsOiB0aGlzLnVpLnRvSW5wdXRXcmFwcGVyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnRvVmlldy5yZW5kZXIoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcmVuZGVyQ2NWaWV3OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNjVmlldyA9IG5ldyBBZGRyZXNzVmlldyh7XHJcbiAgICAgICAgICAgICAgICBtb2RlbDp0aGlzLm1vZGVsLFxyXG4gICAgICAgICAgICAgICAgbW9kZWxBdHRyOidjYycsXHJcbiAgICAgICAgICAgICAgICBlbDogdGhpcy51aS5jY0lucHV0V3JhcHBlclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5jY1ZpZXcucmVuZGVyKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gZXZlbnRzIGhhbmRsZXJzXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uU3ViamVjdEJsdXI6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWwuc2V0KCdzdWJqZWN0JywgdGhpcy51aS5pbnB1dFN1YmplY3QudmFsKCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkVkaXRvckJsdXI6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWwuc2V0KCdib2R5Jyx0aGlzLnVpLmlucHV0RWRpdG9yLmh0bWwoKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uU2VuZENsaWNrOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOnNlbmRcIix0aGlzLm1vZGVsKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25DbG9zZUJ0bkNsaWNrOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOmRpc2NhcmRcIix0aGlzLm1vZGVsKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25Ub0lucHV0V3JhcHBlckNsaWNrOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHRoaXMudWkudG9JbnB1dFdyYXBwZXIucmVtb3ZlQ2xhc3MoXCJlcnJvclwiKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25DY0lucHV0V3JhcHBlckNsaWNrOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHRoaXMudWkuY2NJbnB1dFdyYXBwZXIucmVtb3ZlQ2xhc3MoXCJlcnJvclwiKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25Nb2RlbENoYW5nZTpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpjaGFuZ2VcIix0aGlzLm1vZGVsKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25JbnZhbGlkOmZ1bmN0aW9uKG1vZGVsLCBlcnJvcil7XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2goZXJyb3Ipe1xyXG4gICAgICAgICAgICAgICAgY2FzZSBNYWlsTW9kZWwuRXJyb3JzLk5vUmVjaXBpZW50OiBjYXNlIE1haWxNb2RlbC5FcnJvcnMuSW52YWxpZFRvQWRkcmVzczpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVpLnRvSW5wdXRXcmFwcGVyLmFkZENsYXNzKFwiZXJyb3JcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIE1haWxNb2RlbC5FcnJvcnMuSW52YWxpZENjQWRkcmVzczpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVpLmNjSW5wdXRXcmFwcGVyLmFkZENsYXNzKFwiZXJyb3JcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvc2VWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvZW1wdHlGb2xkZXJWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBFbXB0eUZvbGRlclZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIEVtcHR5Rm9sZGVyVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgaXNQZXJtYW5lbnQ6IHRydWUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiBcImVtcHR5LWZvbGRlclwiLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBcIm1zZ1RpdGxlXCI6IFwiLm1zZ1RpdGxlXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJtYWlsOmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbHMsIFwiY2hhbmdlOml0ZW1zIHVwZGF0ZTpzdWNjZXNzIGRlbGV0ZTpzdWNjZXNzXCIsIHRoaXMuY2hlY2tJZkVtcHR5LCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGNoZWNrSWZFbXB0eTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGlzRW1wdHkgPSB0aGlzLm1haWxzLmlzRW1wdHkoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VtcHR5KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb25cIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVpLm1zZ1RpdGxlLmh0bWwoYXBwLnRyYW5zbGF0b3IudHJhbnNsYXRlKFwibWFpbDplbXB0eUZvbGRlci5cIiArIGFjdGlvbi50eXBlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy4kZWwudG9nZ2xlKGlzRW1wdHkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRW1wdHlGb2xkZXJWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvZW1wdHlNYWlsVmlldy5oYnNcIik7XHJcblxyXG52YXIgRW1wdHlNYWlsVmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgRW1wdHlNYWlsVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgaXNQZXJtYW5lbnQ6IHRydWUsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIGNvdW50ZXI6IFwiLmNvdW50ZXJcIixcclxuICAgICAgICAgICAgbWVzc2FnZTogXCIubWVzc2FnZVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWlscyA9IG1haWwuY2hhbm5lbC5yZXFyZXMucmVxdWVzdChcIm1haWw6Y29sbGVjdGlvblwiKTtcclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbHMsIFwiY2hhbmdlOnNlbGVjdGlvblwiLCB0aGlzLm9uU2VsZWN0aW9uQ2hhbmdlLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uU2VsZWN0aW9uQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSB0aGlzLm1haWxzLmdldFNlbGVjdGVkKCkubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgdGhpcy51aS5jb3VudGVyLmh0bWwoc2VsZWN0ZWQpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmNvdW50ZXIudG9nZ2xlKHNlbGVjdGVkID4gMCk7XHJcbiAgICAgICAgICAgIHRoaXMudWkubWVzc2FnZS50b2dnbGUoc2VsZWN0ZWQgPT09IDApO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRW1wdHlNYWlsVmlldztcclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBsYXlvdXRUZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9jb250ZW50TGF5b3V0Lmhic1wiKTtcclxuXHJcbnZhciBDb250ZW50TGF5b3V0ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBDb250ZW50TGF5b3V0ID0gTWFyaW9uZXR0ZS5MYXlvdXRWaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IGxheW91dFRlbXBsYXRlLFxyXG4gICAgICAgIGlzUGVybWFuZW50OiB0cnVlLFxyXG4gICAgICAgIHJlZ2lvbnM6IHtcclxuICAgICAgICAgICAgaXRlbXNSZWdpb246IFwiLm1haWwtaXRlbXMtcmVnaW9uXCIsXHJcbiAgICAgICAgICAgIHByZXZpZXdSZWdpb246IFwiLm1haWwtcHJldmlldy1yZWdpb25cIixcclxuICAgICAgICAgICAgbWVzc2FnZUJvYXJkOiBcIi5tYWlsLW1lc3NhZ2UtYm9hcmQtcmVnaW9uXCJcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRMYXlvdXQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBmb3JtYXR0ZXIgPSByZXF1aXJlKFwicmVzb2x2ZXJzL2Zvcm1hdHRlclwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL21haWxJdGVtVmlldy5oYnNcIik7XHJcblxyXG52YXIgTWFpbFRhYmxlUm93VmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgTWFpbFRhYmxlUm93VmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgdGFnTmFtZTogJ3RyJyxcclxuICAgICAgICBjbGFzc05hbWU6ICdpbmJveF9yb3cnLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBjaGVja0JveDogXCIuY2hrQm94XCIsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yOiBcIi5zZWxlY3RvclwiLFxyXG4gICAgICAgICAgICBzdGFySWNvbjogXCIuc3Rhci1pY29uXCIsXHJcbiAgICAgICAgICAgIGltcEljb246IFwiLmltcG9ydGFuY2UtaWNvblwiLFxyXG4gICAgICAgICAgICBhZGRyZXNzOiBcIi5hZGRyZXNzXCIsXHJcbiAgICAgICAgICAgIHN1YmplY3Q6IFwiLnN1YmplY3RcIixcclxuICAgICAgICAgICAgYm9keTogXCIuYm9keVwiLFxyXG4gICAgICAgICAgICBzZW50VGltZTogXCIuc2VudFRpbWVcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRyaWdnZXJzOiB7XHJcbiAgICAgICAgICAgIFwiY2xpY2sgLnN0YXJcIjogXCJjbGlja1wiLFxyXG4gICAgICAgICAgICBcImNsaWNrIC5pbXBvcnRhbmNlXCI6IFwiY2xpY2tcIixcclxuICAgICAgICAgICAgXCJjbGljayAuYWRkcmVzc1wiOiBcImNsaWNrXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgLmNvbnRlbnRcIjogXCJjbGlja1wiLFxyXG4gICAgICAgICAgICBcImNsaWNrIC5zZW50VGltZVwiOiBcImNsaWNrXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgXCJjbGljayAuc2VsZWN0b3JcIjogXCJvblJvd1NlbGVjdFwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbW9kZWxFdmVudHM6IHtcclxuICAgICAgICAgICAgXCJjaGFuZ2U6c3ViamVjdFwiOiBcIl9vblN1YmplY3RDaGFuZ2VkXCIsXHJcbiAgICAgICAgICAgIFwiY2hhbmdlOmJvZHlcIjogXCJfb25Cb2R5Q2hhbmdlZFwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvbi50eXBlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwiY29udGFjdDpjb2xsZWN0aW9uXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTpsYWJlbHMuKlwiLCB0aGlzLnRvZ2dsZVVJKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyB0ZW1wbGF0ZUhlbHBlcnNcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgaXNJbmJveDogdGhpcy5hY3Rpb24gPT09IFwiaW5ib3hcIixcclxuICAgICAgICAgICAgICAgIGlzU2VudDogdGhpcy5hY3Rpb24gPT09IFwic2VudFwiLFxyXG4gICAgICAgICAgICAgICAgaXNEcmFmdDogdGhpcy5hY3Rpb24gPT09IFwiZHJhZnRcIixcclxuICAgICAgICAgICAgICAgIGlzVHJhc2g6IHRoaXMuYWN0aW9uID09PSBcInRyYXNoXCIsXHJcbiAgICAgICAgICAgICAgICBpc1NwYW06IHRoaXMuYWN0aW9uID09PSBcInNwYW1cIixcclxuICAgICAgICAgICAgICAgIGlzU2VhcmNoOiB0aGlzLmFjdGlvbiA9PT0gXCJzZWFyY2hcIixcclxuXHJcbiAgICAgICAgICAgICAgICBib2R5OiBmb3JtYXR0ZXIuZm9ybWF0Q29udGVudCh0aGlzLm1vZGVsLmdldChcImJvZHlcIikpLFxyXG4gICAgICAgICAgICAgICAgc3ViamVjdDogZm9ybWF0dGVyLmZvcm1hdFN1YmplY3QodGhpcy5tb2RlbC5nZXQoXCJzdWJqZWN0XCIpLGFwcC50cmFuc2xhdG9yKSxcclxuICAgICAgICAgICAgICAgIHNlbnRUaW1lOiBmb3JtYXR0ZXIuZm9ybWF0U2hvcnREYXRlKHRoaXMubW9kZWwuZ2V0KFwic2VudFRpbWVcIiksYXBwLnRyYW5zbGF0b3IpLFxyXG4gICAgICAgICAgICAgICAgdG86IGZvcm1hdHRlci5mb3JtYXRBZGRyZXNzZXModGhpcy5jb250YWN0cy5nZXRUaXRsZXModGhpcy5tb2RlbC5nZXRPdXRnb2luZ0FkZHJlc3NlcygpKSksXHJcbiAgICAgICAgICAgICAgICBmcm9tOiBmb3JtYXR0ZXIuZm9ybWF0QWRkcmVzc2VzKHRoaXMuY29udGFjdHMuZ2V0VGl0bGVzKHRoaXMubW9kZWwuZ2V0SW5nb2luZ0FkZHJlc3NlcygpKSlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBvblJlbmRlclxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy50b2dnbGVVSSgpO1xyXG4gICAgICAgICAgICB0aGlzLnNldFNlbGVjdGlvbigpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0b2dnbGVVSTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGxhYmVscyA9IHRoaXMubW9kZWwuZ2V0KFwibGFiZWxzXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy51aS5zZW50VGltZS50b2dnbGVDbGFzcyhcInVucmVhZFwiLCAhXy5oYXMobGFiZWxzLCAncmVhZCcpKTtcclxuICAgICAgICAgICAgdGhpcy51aS5hZGRyZXNzLnRvZ2dsZUNsYXNzKFwidW5yZWFkXCIsICFfLmhhcyhsYWJlbHMsICdyZWFkJykpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLnN1YmplY3QudG9nZ2xlQ2xhc3MoXCJ1bnJlYWRcIiwgIV8uaGFzKGxhYmVscywgJ3JlYWQnKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuc3Rhckljb24udG9nZ2xlQ2xhc3MoXCJkaXNhYmxlXCIsICFfLmhhcyhsYWJlbHMsICdzdGFycmVkJykpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmltcEljb24udG9nZ2xlQ2xhc3MoXCJkaXNhYmxlXCIsICFfLmhhcyhsYWJlbHMsICdpbXBvcnRhbnQnKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2V0U2VsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSB0aGlzLm1vZGVsLmNvbGxlY3Rpb24uaXNTZWxlY3RlZCh0aGlzLm1vZGVsKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCdzZWxlY3RlZCcsIHNlbGVjdGVkKTtcclxuICAgICAgICAgICAgdGhpcy51aS5jaGVja0JveC5wcm9wKCdjaGVja2VkJywgc2VsZWN0ZWQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGRhdGFDaGFuZ2VkXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9vblN1YmplY3RDaGFuZ2VkOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVpLnN1YmplY3QudGV4dChmb3JtYXR0ZXIuZm9ybWF0U3ViamVjdCh0aGlzLm1vZGVsLmdldChcInN1YmplY3RcIikpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX29uQm9keUNoYW5nZWQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudWkuYm9keS50ZXh0KGZvcm1hdHRlci5mb3JtYXRDb250ZW50KHRoaXMubW9kZWwuZ2V0KFwiYm9keVwiKSkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHJvd0V2ZW50c1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJvd1NlbGVjdDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWxUYWJsZTpJdGVtQ2xpY2tlZFwiLCBudWxsKTtcclxuICAgICAgICAgICAgdGhpcy5tb2RlbC5jb2xsZWN0aW9uLnRvZ2dsZVNlbGVjdGlvbih0aGlzLm1vZGVsLCB7Y2FsbGVyTmFtZTogJ2l0ZW1WaWV3J30pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBtYXJrQXNDbGlja2VkOiBmdW5jdGlvbiAoY2xpY2tlZCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy4kZWwudG9nZ2xlQ2xhc3MoJ2NsaWNrZWRSb3cnLCBjbGlja2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbFRhYmxlUm93VmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIGxheW91dFRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL21haW5MYXlvdXQuaGJzXCIpO1xyXG5cclxudmFyIE1haWxMYXlvdXQgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCAgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgIE1haWxMYXlvdXQgPSBNYXJpb25ldHRlLkxheW91dFZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTpsYXlvdXRUZW1wbGF0ZSxcclxuICAgICAgICBpc1Blcm1hbmVudDp0cnVlLFxyXG4gICAgICAgIHJlZ2lvbnM6e1xyXG4gICAgICAgICAgICBuYXZSZWdpb246XCIubWFpbC1uYXYtcmVnaW9uXCIsXHJcbiAgICAgICAgICAgIHdvcmtSZWdpb246XCIubWFpbC13b3JrLXJlZ2lvblwiXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsTGF5b3V0O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvbWFpbHNWaWV3Lmhic1wiKTtcclxudmFyIE1haWxhYmxlUm93VmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL21haWxJdGVtVmlld1wiKTtcclxuXHJcbnZhciBNYWlsVGFibGVWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBNYWlsVGFibGVWaWV3ID0gTWFyaW9uZXR0ZS5Db21wb3NpdGVWaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgbmFtZTogJ21haWxUYWJsZScsXHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGNoaWxkVmlldzogTWFpbGFibGVSb3dWaWV3LFxyXG4gICAgICAgIGNoaWxkVmlld0NvbnRhaW5lcjogXCJ0Ym9keVwiLFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMsIFwiY2hpbGR2aWV3OmNsaWNrXCIsIHRoaXMuX2hhbmRsZUNoaWxkQ2xpY2spO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMuY29sbGVjdGlvbiwgXCJjaGFuZ2U6c2VsZWN0aW9uXCIsIHRoaXMub25TZWxlY3Rpb25DaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG9uU2VsZWN0aW9uQ2hhbmdlXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uU2VsZWN0aW9uQ2hhbmdlOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jYWxsZXJOYW1lICE9PSAnaXRlbVZpZXcnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuLmVhY2goXy5iaW5kKGZ1bmN0aW9uICh2aWV3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRTZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICB2aWV3Lm1hcmtBc0NsaWNrZWQodGhpcy5jb2xsZWN0aW9uLmdldFNlbGVjdGVkKCkubGVuZ3RoID09PSAwICYmIHZpZXcgPT09IHRoaXMuY2xpY2tlZEl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9oYW5kbGVDaGlsZENsaWNrOiBmdW5jdGlvbiAoX2l0ZW1WaWV3KSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLmVhY2goZnVuY3Rpb24gKGl0ZW1WaWV3KSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtVmlldy5tYXJrQXNDbGlja2VkKGZhbHNlKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoX2l0ZW1WaWV3KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrZWRJdGVtID0gX2l0ZW1WaWV3O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja2VkSXRlbS5tYXJrQXNDbGlja2VkKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWxUYWJsZTpJdGVtQ2xpY2tlZFwiLCB0aGlzLmNsaWNrZWRJdGVtLm1vZGVsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsVGFibGVWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvbmF2Vmlldy5oYnNcIik7XHJcblxyXG52YXIgTmF2VmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgTmF2VmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKGFwcC5jb250ZXh0LCAnY2hhbmdlOm1haWwuYWN0aW9uJywgdGhpcy5vbkFjdGlvbkNoYW5nZSwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkFjdGlvbkNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZCgnbGknKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uLnR5cGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuJGVsLmZpbmQoJy5uYXYtJyArIGFjdGlvbikuYWRkQ2xhc3MoJ3NlbGVjdGVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOYXZWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgZm9ybWF0dGVyID0gcmVxdWlyZShcInJlc29sdmVycy9mb3JtYXR0ZXJcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9wcmV2aWV3Vmlldy5oYnNcIik7XHJcblxyXG52YXIgUHJldmlld1ZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIFByZXZpZXdWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgc3ViamVjdDogXCIuc3ViamVjdFwiLFxyXG4gICAgICAgICAgICB0bzogXCIudG9cIixcclxuICAgICAgICAgICAgZnJvbTogXCIuZnJvbVwiLFxyXG4gICAgICAgICAgICBib2R5OiBcIi5ib2R5XCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwiY29udGFjdDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzdWJqZWN0OiBmb3JtYXR0ZXIuZm9ybWF0U3ViamVjdCh0aGlzLm1vZGVsLmdldChcInN1YmplY3RcIikpLFxyXG4gICAgICAgICAgICAgICAgdG86IGZvcm1hdHRlci5mb3JtYXRBZGRyZXNzZXModGhpcy5jb250YWN0cy5nZXRUaXRsZXModGhpcy5tb2RlbC5nZXRPdXRnb2luZ0FkZHJlc3NlcygpKSksXHJcbiAgICAgICAgICAgICAgICBmcm9tOiBmb3JtYXR0ZXIuZm9ybWF0QWRkcmVzc2VzKHRoaXMuY29udGFjdHMuZ2V0VGl0bGVzKHRoaXMubW9kZWwuZ2V0SW5nb2luZ0FkZHJlc3NlcygpKSlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlbC5oYXMoXCJyZWxhdGVkQm9keVwiKSkge1xyXG4gICAgICAgICAgICAgICAgLy9yZXF1aXJlKFtcIm9uRGVtYW5kTG9hZGVyIXRleHQhYXBwL2Fzc2V0cy9kYXRhL1wiICsgdGhpcy5tb2RlbC5nZXQoXCJyZWxhdGVkQm9keVwiKSArIFwiLnR4dFwiXSwgXy5iaW5kKGZ1bmN0aW9uICh0ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAvLyAgICB0aGlzLnVpLmJvZHkuaHRtbCh0ZXh0KTtcclxuICAgICAgICAgICAgICAgIC8vfSwgdGhpcykpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51aS5ib2R5Lmh0bWwodGhpcy5tb2RlbC5nZXQoXCJib2R5XCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJldmlld1ZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9zZWFyY2hWaWV3Lmhic1wiKTtcclxudmFyIENvbnRhY3RzRmlsdGVyTW9kZWwgPSByZXF1aXJlKFwibWFpbC1tb2RlbHMvY29udGFjdHNGaWx0ZXJNb2RlbFwiKTtcclxudmFyIEF1dG9Db21wbGV0ZSA9IHJlcXVpcmUoXCJ1aS1jb21wb25lbnRzL2F1dG9Db21wbGV0ZS9hdXRvQ29tcGxldGVcIik7XHJcbnZhciBTZWFyY2hDb21wb25lbnQgPSByZXF1aXJlKFwidWktY29tcG9uZW50cy9zZWFyY2gvc2VhcmNoXCIpO1xyXG5cclxudmFyIFNlYXJjaFZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIFNlYXJjaFZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogXCJzZWFyY2hQYW5lbFwiLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBzZWFyY2hQbGFjZWhvbGRlcjogXCIuc2VhcmNoLXBsYWNlaG9sZGVyXCIsXHJcbiAgICAgICAgICAgIGF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyOiBcIi5hdXRvQ29tcGxldGVQbGFjZWhvbGRlclwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy52ZW50ID0gbmV3IEJhY2tib25lLldyZXFyLkV2ZW50QWdncmVnYXRvcigpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwiY29udGFjdDpjb2xsZWN0aW9uXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcInNlYXJjaFwiLCB0aGlzLnNlYXJjaCwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsIFwiY2hhbmdlOm1haWwuYWN0aW9uXCIsIHRoaXMub25BY3Rpb25DaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMuY29udGFjdHMsIFwiZmV0Y2g6c3VjY2Vzc1wiLCB0aGlzLnJlbmRlckF1dG9Db21wb25lbnQsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25SZW5kZXJcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJTZWFyY2hDb21wb25lbnQoKTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJBdXRvQ29tcG9uZW50KCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcmVuZGVyU2VhcmNoQ29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaENvbXBvbmVudCA9IG5ldyBTZWFyY2hDb21wb25lbnQoe1xyXG4gICAgICAgICAgICAgICAgZWw6IHRoaXMudWkuc2VhcmNoUGxhY2Vob2xkZXIsXHJcbiAgICAgICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiBhcHAudHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOnNlYXJjaC5jYXB0aW9uXCIpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaENvbXBvbmVudC5yZW5kZXIoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW5kZXJBdXRvQ29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuYXV0b0NvbXBsZXRlICYmICF0aGlzLmNvbnRhY3RzLmlzRW1wdHkoKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlID0gbmV3IEF1dG9Db21wbGV0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHRoaXMuZ2V0Q29udGFjdEFycmF5KCksXHJcbiAgICAgICAgICAgICAgICAgICAgZWw6IHRoaXMudWkuYXV0b0NvbXBsZXRlUGxhY2Vob2xkZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyTW9kZWw6IG5ldyBDb250YWN0c0ZpbHRlck1vZGVsKCksXHJcbiAgICAgICAgICAgICAgICAgICAgdmVudDogdGhpcy52ZW50XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGdldENvbnRhY3RBcnJheTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIF9jb250YWN0cyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250YWN0cy5lYWNoKGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgX2NvbnRhY3RzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IG1vZGVsLmdldChcInRpdGxlXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtb2RlbC5nZXQoXCJhZGRyZXNzXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IEF1dG9Db21wbGV0ZS5UWVBFUy5DT05UQUNUXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBfY29udGFjdHM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBzZWFyY2hcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZWFyY2g6IGZ1bmN0aW9uIChrZXkpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghXy5pc0VtcHR5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgIG1haWwucm91dGVyLm5hdmlnYXRlKFwic2VhcmNoL1wiICsga2V5LCB7dHJpZ2dlcjogdHJ1ZX0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25BY3Rpb25DaGFuZ2VcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25BY3Rpb25DaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvbi50eXBlXCIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGFjdGlvbiAhPSBcInNlYXJjaFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWFyY2hDb21wb25lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaENvbXBvbmVudC5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZWFyY2hWaWV3O1xyXG4iLCIgICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcblxyXG4gICAgYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBBcHAsICBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgICAgICB2YXIgUm91dGVyID0gcmVxdWlyZShcIm1haWwtcm91dGVycy9tYWlsUm91dGVyXCIpO1xyXG4gICAgICAgIHZhciBNYWluTGF5b3V0Q29udHJvbGxlciA9IHJlcXVpcmUoXCJtYWlsLWNvbnRyb2xsZXJzL21haWxNYWluTGF5b3V0Q29udHJvbGxlclwiKTtcclxuICAgICAgICB2YXIgRGF0YUNvbnRyb2xsZXIgPSByZXF1aXJlKFwibWFpbC1jb250cm9sbGVycy9tYWlsRGF0YUNvbnRyb2xsZXJcIik7XHJcbiAgICAgICAgdmFyIEFjdGlvbnNDb250cm9sbGVyID0gcmVxdWlyZShcIm1haWwtY29udHJvbGxlcnMvbWFpbEFjdGlvbnNDb250cm9sbGVyXCIpO1xyXG4gICAgICAgIHZhciBSb3V0ZXJDb250cm9sbGVyID0gcmVxdWlyZShcIm1haWwtY29udHJvbGxlcnMvbWFpbFJvdXRlckNvbnRyb2xsZXJcIik7XHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gaW5pdFxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRoaXMuYWRkSW5pdGlhbGl6ZXIoZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2hhbm5lbCA9IEJhY2tib25lLldyZXFyLnJhZGlvLmNoYW5uZWwoXCJtYWlsXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGFDb250cm9sbGVyID0gbmV3IERhdGFDb250cm9sbGVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aW9uc0NvbnRyb2xsZXIgPSBuZXcgQWN0aW9uc0NvbnRyb2xsZXIoKTtcclxuICAgICAgICAgICAgdGhpcy5tYWluTGF5b3V0Q29udHJvbGxlciA9IG5ldyBNYWluTGF5b3V0Q29udHJvbGxlcihvcHRpb25zKTtcclxuICAgICAgICAgICAgdGhpcy5yb3V0ZXIgPSBuZXcgUm91dGVyKHsgY29udHJvbGxlcjogbmV3IFJvdXRlckNvbnRyb2xsZXIoKSB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBzZXRMYXlvdXRcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0aGlzLnNldExheW91dCA9ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFpbkxheW91dENvbnRyb2xsZXIuc2V0Vmlld3MoKTtcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhcHAubW9kdWxlKFwibWFpbFwiKTtcclxuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwidGFnc1BsYWNlaG9sZGVyXFxcIj48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJhdXRvQ29tcGxldGVQbGFjZWhvbGRlclxcXCI+PC9kaXY+XFxyXFxuXCI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBoZWxwZXIsIG9wdGlvbnMsIGhlbHBlck1pc3Npbmc9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXG4gIGJ1ZmZlciArPSBcIjxkaXYgY2xhc3M9XFxcImxibENvbXBvc2VcXFwiPk5ldyBNZXNzYWdlPC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwiYnV0dG9uc1Rvb2xiYXJcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJhY3Rpb24tbGlzdC1zZWN0aW9uXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0blNlbGVjdFxcXCI+XFxyXFxuICAgICAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGRyb3Bkb3duIGRkc0lkX2Rkc1NlbGVjdFxcXCI+PHNwYW4gY2xhc3M9XFxcImNhcHRpb25cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6c2VsZWN0XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJ0b2dnbGVcXFwiPjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiZHJvcGRvd24tc2xpZGVyIGRkc1NlbGVjdFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIHNlbGVjdEFsbFxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZWxlY3QuYWxsXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0LmFsbFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIHNlbGVjdE5vbmVcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZWxlY3Qubm9uZVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnNlbGVjdC5ub25lXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICAgICAgICAgICAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gc2VsZWN0UmVhZFxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNlbGVjdC5yZWFkXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0LnJlYWRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBzZWxlY3RVbnJlYWRcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZWxlY3QudW5yZWFkXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0LnVucmVhZFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0bkRlbGV0ZUZvcmV2ZXJcXFwiPjxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsZWZ0XFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLmRlbGV0ZUZvcmV2ZXJcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLmRlbGV0ZUZvcmV2ZXJcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuTm90U3BhbVxcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLm5vdFNwYW1cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLm5vdFNwYW1cIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuRGlzY2FyZERyYWZ0c1xcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLmRpc2NhcmREcmFmdFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMuZGlzY2FyZERyYWZ0XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0bkRlbGV0ZVxcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGxlZnRcXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMuZGVsZXRlXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5kZWxldGVcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuTW92ZVRvXFxcIj48L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJ0bk1vcmVcXFwiPjwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJwYWdlclxcXCI+PC9kaXY+XCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uLCBmdW5jdGlvblR5cGU9XCJmdW5jdGlvblwiO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwiY29tcG9zZVZpZXdcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb21wb3NlLWhlYWRlclxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJmaWVsZFxcXCI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6dG9cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDp0b1wiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImlucHV0Ym94XFxcIj48ZGl2IGNsYXNzPVxcXCJ0b0lucHV0V3JhcHBlclxcXCI+PC9kaXY+PC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImZpZWxkIGNjTGluZVxcXCI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6Y2NcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpjY1wiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImlucHV0Ym94XFxcIj48ZGl2IGNsYXNzPVxcXCJjY0lucHV0V3JhcHBlclxcXCI+PC9kaXY+PC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9ZmllbGQ+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6c3ViamVjdFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnN1YmplY3RcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpbnB1dGJveCBpbnB1dGJveDFcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwic3ViamVjdFxcXCIgdmFsdWU9XFxcIlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5zdWJqZWN0KSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnN1YmplY3QpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiXFxcIj48L2lucHV0PjwvZGl2PlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb21wb3NlLWVkaXRvciBicm93c2VyLXNjcm9sbFxcXCIgY29udGVudGVkaXRhYmxlPVxcXCJ0cnVlXFxcIj48L2Rpdj5cXHJcXG4gICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIHNlbmRCdG5cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6Y29tcG9zZXZpZXcuc2VuZFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmNvbXBvc2V2aWV3LnNlbmRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICA8YSBjbGFzcz1cXFwiY2xvc2VCdG5cXFwiPjwvYT5cXHJcXG48L2Rpdj5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJtYWlsLWl0ZW1zLXJlZ2lvbiBicm93c2VyLXNjcm9sbCBsaWdodFxcXCI+XFxyXFxuPC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwibWFpbC1wcmV2aWV3LXJlZ2lvbiBicm93c2VyLXNjcm9sbCBsaWdodFxcXCI+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwibXNnVGl0bGVcXFwiPjwvZGl2PlxcclxcblwiO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJlbXB0eU1haWxcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb3VudGVyXFxcIj48L2Rpdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwibWVzc2FnZVxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDplbXB0eU1haWwuc2VsZWN0aXRlbVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmVtcHR5TWFpbC5zZWxlY3RpdGVtXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9kaXY+XFxyXFxuPC9kaXY+XCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlciwgZnVuY3Rpb25UeXBlPVwiZnVuY3Rpb25cIiwgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb24sIGhlbHBlck1pc3Npbmc9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBzZWxmPXRoaXM7XG5cbmZ1bmN0aW9uIHByb2dyYW0xKGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXI7XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaW5ib3hcXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5mcm9tKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmZyb20pOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPGRpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuZnVuY3Rpb24gcHJvZ3JhbTMoZGVwdGgwLGRhdGEpIHtcbiAgXG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlciwgb3B0aW9ucztcbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJzZW50XFxcIj48c3BhbiBjbGFzcz1cXFwic2VudC10b1xcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDp0b1wiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnRvXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiOjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwic2VudC1hZGRyZXNzXFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMudG8pIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudG8pOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9zcGFuPjwvZGl2PlxcclxcbiAgICBcIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxuXG5mdW5jdGlvbiBwcm9ncmFtNShkZXB0aDAsZGF0YSkge1xuICBcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucztcbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJkcmFmdFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpkcmFmdFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmRyYWZ0XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgIFwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbmZ1bmN0aW9uIHByb2dyYW03KGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXI7XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwidHJhc2gtaWNvbi13cmFwcGVyXFxcIj48ZGl2IGNsYXNzPVxcXCJ0cmFzaC1pY29uXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJ0cmFzaC1hZGRyZXNzXFxcIj48ZGl2PlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5mcm9tKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmZyb20pOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+PC9kaXY+XFxyXFxuICAgIFwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbmZ1bmN0aW9uIHByb2dyYW05KGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXI7XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwic3BhbVxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmZyb20pIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuZnJvbSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuICBidWZmZXIgKz0gXCI8dGQgY2xhc3M9XFxcInNlbGVjdG9yXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGNsYXNzPVxcXCJjaGtCb3hcXFwiPjwvdGQ+XFxyXFxuPHRkIGNsYXNzPVxcXCJzdGFyXFxcIj48ZGl2IGNsYXNzPVxcXCJzdGFyLWljb25cXFwiPjwvZGl2PjwvdGQ+XFxyXFxuPHRkIGNsYXNzPVxcXCJpbXBvcnRhbmNlXFxcIj48ZGl2IGNsYXNzPVxcXCJpbXBvcnRhbmNlLWljb25cXFwiPjwvZGl2PjwvdGQ+XFxyXFxuPHRkIGNsYXNzPVxcXCJhZGRyZXNzXFxcIj5cXHJcXG4gICAgXCI7XG4gIHN0YWNrMSA9IGhlbHBlcnNbJ2lmJ10uY2FsbChkZXB0aDAsIChkZXB0aDAgJiYgZGVwdGgwLmlzSW5ib3gpLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMSwgcHJvZ3JhbTEsIGRhdGEpLGRhdGE6ZGF0YX0pO1xuICBpZihzdGFjazEgfHwgc3RhY2sxID09PSAwKSB7IGJ1ZmZlciArPSBzdGFjazE7IH1cbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgIFwiO1xuICBzdGFjazEgPSBoZWxwZXJzWydpZiddLmNhbGwoZGVwdGgwLCAoZGVwdGgwICYmIGRlcHRoMC5pc1NlbnQpLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMywgcHJvZ3JhbTMsIGRhdGEpLGRhdGE6ZGF0YX0pO1xuICBpZihzdGFjazEgfHwgc3RhY2sxID09PSAwKSB7IGJ1ZmZlciArPSBzdGFjazE7IH1cbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgIFwiO1xuICBzdGFjazEgPSBoZWxwZXJzWydpZiddLmNhbGwoZGVwdGgwLCAoZGVwdGgwICYmIGRlcHRoMC5pc0RyYWZ0KSwge2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDUsIHByb2dyYW01LCBkYXRhKSxkYXRhOmRhdGF9KTtcbiAgaWYoc3RhY2sxIHx8IHN0YWNrMSA9PT0gMCkgeyBidWZmZXIgKz0gc3RhY2sxOyB9XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICBcIjtcbiAgc3RhY2sxID0gaGVscGVyc1snaWYnXS5jYWxsKGRlcHRoMCwgKGRlcHRoMCAmJiBkZXB0aDAuaXNUcmFzaCksIHtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSg3LCBwcm9ncmFtNywgZGF0YSksZGF0YTpkYXRhfSk7XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgXCI7XG4gIHN0YWNrMSA9IGhlbHBlcnNbJ2lmJ10uY2FsbChkZXB0aDAsIChkZXB0aDAgJiYgZGVwdGgwLmlzU3BhbSksIHtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSg5LCBwcm9ncmFtOSwgZGF0YSksZGF0YTpkYXRhfSk7XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgXCI7XG4gIHN0YWNrMSA9IGhlbHBlcnNbJ2lmJ10uY2FsbChkZXB0aDAsIChkZXB0aDAgJiYgZGVwdGgwLmlzU2VhcmNoKSwge2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDEsIHByb2dyYW0xLCBkYXRhKSxkYXRhOmRhdGF9KTtcbiAgaWYoc3RhY2sxIHx8IHN0YWNrMSA9PT0gMCkgeyBidWZmZXIgKz0gc3RhY2sxOyB9XG4gIGJ1ZmZlciArPSBcIlxcclxcbjwvdGQ+XFxyXFxuPHRkPjxkaXYgY2xhc3M9XFxcImNvbnRlbnRcXFwiPjxzcGFuIGNsYXNzPVxcXCJzdWJqZWN0XFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuc3ViamVjdCkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5zdWJqZWN0KTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwic2VwYXJhdG9yXFxcIj4tPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJib2R5XFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuYm9keSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5ib2R5KTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvc3Bhbj48L2Rpdj48L3RkPlxcclxcbjx0ZD48ZGl2IGNsYXNzPVxcXCJzZW50VGltZVxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnNlbnRUaW1lKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnNlbnRUaW1lKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvZGl2PjwvdGQ+XCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwibWFpbC10YWJsZS1jb250YW5pZXJcXFwiPlxcclxcbiAgICA8dGFibGUgY2xhc3M9XFxcImRhdGEtdGFibGUgbWFpbC10YWJsZVxcXCI+XFxyXFxuICAgICAgICA8Y29sZ3JvdXA+XFxyXFxuICAgICAgICAgICAgPGNvbCBzdHlsZT1cXFwid2lkdGg6MzBweFxcXCIvPlxcclxcbiAgICAgICAgICAgIDxjb2wgc3R5bGU9XFxcIndpZHRoOjMwcHhcXFwiLz5cXHJcXG4gICAgICAgICAgICA8Y29sIHN0eWxlPVxcXCJ3aWR0aDozMHB4XFxcIi8+XFxyXFxuICAgICAgICAgICAgPGNvbCBzdHlsZT1cXFwid2lkdGg6MTkwcHhcXFwiLz5cXHJcXG4gICAgICAgICAgICA8Y29sLz5cXHJcXG4gICAgICAgICAgICA8Y29sIHN0eWxlPVxcXCJ3aWR0aDo4MHB4XFxcIi8+XFxyXFxuICAgICAgICA8L2NvbGdyb3VwPlxcclxcbiAgICAgICAgPHRib2R5PlxcclxcbiAgICAgICAgPC90Ym9keT5cXHJcXG4gICAgPC90YWJsZT5cXHJcXG48L2Rpdj5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJtYWlsLW5hdi1yZWdpb25cXFwiPlxcclxcbjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcIm1haWwtd29yay1yZWdpb25cXFwiPlxcclxcbjwvZGl2PlxcclxcblxcclxcblwiO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJidXR0b24gZHJvcGRvd24gZGRzSWRfZGRzTW9yZVxcXCI+PHNwYW4gY2xhc3M9XFxcImNhcHRpb25cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6YWN0aW9ucy5tb3JlXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5tb3JlXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJ0b2dnbGVcXFwiPjwvc3Bhbj48L2E+XFxyXFxuPGRpdiAgY2xhc3M9XFxcImRyb3Bkb3duLXNsaWRlciBkZHNNb3JlXFxcIj5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gbWFya1JlYWRcXFwiPjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6YWN0aW9ucy5tYXJrQXMucmVhZFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMubWFya0FzLnJlYWRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBtYXJrVW5yZWFkXFxcIj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6YWN0aW9ucy5tYXJrQXMudW5yZWFkXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5tYXJrQXMudW5yZWFkXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gbWFya0ltcFxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMubWFya0FzLmltcG9ydGFudFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMubWFya0FzLmltcG9ydGFudFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIG1hcmtOb3RJbXBcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLm1hcmtBcy5ub3RJbXBvcnRhbnRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLm1hcmtBcy5ub3RJbXBvcnRhbnRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBhZGRTdGFyXFxcIj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6YWN0aW9ucy5hZGQuc3RhclwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMuYWRkLnN0YXJcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSByZW1vdmVTdGFyXFxcIj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6YWN0aW9ucy5yZW1vdmUuc3RhclwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMucmVtb3ZlLnN0YXJcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbjwvZGl2PlxcclxcblxcclxcblxcclxcblxcclxcblxcclxcblxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJidXR0b24gZHJvcGRvd24gZGRzSWRfZGRzTW92ZVxcXCI+PHNwYW4gY2xhc3M9XFxcImNhcHRpb25cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6YWN0aW9ucy5tb3ZlVG9cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLm1vdmVUb1wiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwidG9nZ2xlXFxcIj48L3NwYW4+PC9hPlxcclxcbjxkaXYgIGNsYXNzPVxcXCJkcm9wZG93bi1zbGlkZXIgZGRzTW92ZVxcXCI+XFxyXFxuICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIG1vdmVUb0luYm94XFxcIj48L3NwYW4+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmluYm94XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6aW5ib3hcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBtb3ZlVG9TcGFtXFxcIj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6c3BhbVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnNwYW1cIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBtb3ZlVG9UcmFzaFxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnRyYXNoXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6dHJhc2hcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbjwvZGl2PlxcclxcblxcclxcblxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8YSBocmVmPVxcXCIjY29tcG9zZVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBwcmltZSBidG5Db21wb3NlXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpjb21wb3NlXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6Y29tcG9zZVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L3NwYW4+PC9hPjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcIm5hdmlnYXRvciBtYWlsTmF2XFxcIj5cXHJcXG4gIDx1bD5cXHJcXG4gICAgICA8bGkgY2xhc3M9XFxcIm5hdi1pbmJveFxcXCI+PGEgaHJlZj1cXFwiI2luYm94XFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmluYm94XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6aW5ib3hcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2E+PC9saT5cXHJcXG4gICAgICA8bGkgY2xhc3M9XFxcIm5hdi1zZW50XFxcIj48YSBocmVmPVxcXCIjc2VudFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZW50XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VudFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvYT48L2xpPlxcclxcbiAgICAgIDxsaSBjbGFzcz1cXFwibmF2LWRyYWZ0XFxcIj48YSBocmVmPVxcXCIjZHJhZnRcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6ZHJhZnRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpkcmFmdFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvYT48L2xpPlxcclxcbiAgICAgIDxsaSBjbGFzcz1cXFwibmF2LXRyYXNoXFxcIj48YSBocmVmPVxcXCIjdHJhc2hcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6dHJhc2hcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDp0cmFzaFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvYT48L2xpPlxcclxcbiAgICAgIDxsaSBjbGFzcz1cXFwibmF2LXNwYW1cXFwiPjxhIGhyZWY9XFxcIiNzcGFtXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNwYW1cIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpzcGFtXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9hPjwvbGk+XFxyXFxuICA8L3VsPlxcclxcbjwvZGl2PlxcclxcblxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJwYWdlcklubmVyQ29udGFpbmVyXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwicGFnZXJCdXR0b25zXFxcIj5cXHJcXG4gICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsZWZ0IGljb24gYnRuTmV3ZXJcXFwiIHRpdGxlPVxcXCJcIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnBhZ2UucHJldlwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnBhZ2UucHJldlwiLCBvcHRpb25zKSkpXG4gICAgKyBcIlxcXCI+PHNwYW4gY2xhc3M9XFxcImljb05ld2VyXFxcIj48L3NwYW4+PC9hPlxcclxcbiAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIHJpZ2h0IGljb24gYnRuT2xkZXJcXFwiIHRpdGxlPVxcXCJcIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnBhZ2UubmV4dFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnBhZ2UubmV4dFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIlxcXCI+PHNwYW4gY2xhc3M9XFxcImljb09sZGVyXFxcIj48L3NwYW4+PC9hPlxcclxcbiAgICA8L2Rpdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwicGFnZXJJbmZvXFxcIj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJsYmxGb3JtXFxcIj48L3NwYW4+XFxyXFxuICAgICAgICA8c3Bhbj4gLSA8L3NwYW4+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwibGJsVG9cXFwiPjwvc3Bhbj5cXHJcXG4gICAgICAgIDxzcGFuPiBvZiA8L3NwYW4+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwidG90YWxcXFwiPjwvc3Bhbj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlciwgZnVuY3Rpb25UeXBlPVwiZnVuY3Rpb25cIiwgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJwcmV2aWV3TWFpbFxcXCI+XFxyXFxuICAgPGRpdiBjbGFzcz1cXFwic3ViamVjdFxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnN1YmplY3QpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuc3ViamVjdCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICA8ZGl2IGNsYXNzPVxcXCJhZGRyZXNzUmVnaW9uXFxcIj5cXHJcXG4gICAgICAgPGRpdiBjbGFzcz1cXFwiaWNvblxcXCI+PC9kaXY+XFxyXFxuICAgICAgIDxkaXYgY2xhc3M9XFxcImZyb21cXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5mcm9tKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmZyb20pOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgIDxkaXYgY2xhc3M9XFxcInRvXFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMudG8pIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAudG8pOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgPC9kaXY+XFxyXFxuICAgPGRpdiBjbGFzcz1cXFwiYm9keVxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmJvZHkpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuYm9keSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG48L2Rpdj5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJzZWFyY2gtcGxhY2Vob2xkZXJcXFwiPjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcImF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyXFxcIj48L2Rpdj5cXHJcXG5cIjtcbiAgfSk7XG4iLCJ2YXIgYXBwID0gbmV3IE1hcmlvbmV0dGUuQXBwbGljYXRpb24oeyBjaGFubmVsTmFtZTogJ2FwcENoYW5uZWwnIH0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcHA7IiwicmVxdWlyZShcIi4vdmVuZG9yc0xvYWRlclwiKTtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCdhcHAnKTtcclxudmFyIEZyYW1lID0gcmVxdWlyZShcImZyYW1lXCIpO1xyXG52YXIgQ29udGV4dCA9IHJlcXVpcmUoXCJjb250ZXh0XCIpO1xyXG52YXIgTWFpbE1vZHVsZSA9IHJlcXVpcmUoXCJtYWlsLW1vZHVsZVwiKTtcclxudmFyIFRyYW5zbGF0b3IgPSByZXF1aXJlKFwicmVzb2x2ZXJzL3RyYW5zbGF0b3JcIik7XHJcbnZhciBTb2NrZXRDb250cm9sbGVyID0gcmVxdWlyZShcInNvY2tldC1jb250cm9sbGVyXCIpO1xyXG52YXIgU2V0dGluZ3NDb250cm9sbGVyID0gcmVxdWlyZShcInNldHRpbmdzLWNvbnRyb2xsZXJcIik7XHJcblxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gaW5pdFxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuYXBwLm9uKFwiYmVmb3JlOnN0YXJ0XCIsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICBhcHAudHJhbnNsYXRvciA9IFRyYW5zbGF0b3I7XHJcbiAgICBhcHAuY29udGV4dCA9IG5ldyBDb250ZXh0KCk7XHJcbiAgICBhcHAuZnJhbWUgPSBuZXcgRnJhbWUoKTtcclxuICAgIGFwcC5zb2NrZXRDb250cm9sbGVyID0gbmV3IFNvY2tldENvbnRyb2xsZXIoKTtcclxuICAgIGFwcC5zZXR0aW5nc0NvbnRyb2xsZXIgPSBuZXcgU2V0dGluZ3NDb250cm9sbGVyKCk7XHJcbn0pO1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gc3RhcnRcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbmFwcC5vbihcInN0YXJ0XCIsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICBhcHAuY2hhbm5lbC52ZW50Lm9uY2UoXCJvblNldHRpbmdzTG9hZGVkXCIsIG9uU2V0dGluZ3NMb2FkZWQpO1xyXG4gICAgYXBwLnNldHRpbmdzQ29udHJvbGxlci5mZXRjaCgpO1xyXG59KTtcclxuXHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxudmFyIG9uU2V0dGluZ3NMb2FkZWQgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgIHJlZ2lzdGVyVXNlcigpO1xyXG4gICAgc2V0TGF5b3V0KCk7XHJcbiAgICBzdGFydEhpc3RvcnkoKTtcclxuICAgIHJlbW92ZVNwbGFzaFNjcmVlbigpO1xyXG59O1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnZhciByZWdpc3RlclVzZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBhcHAuc29ja2V0Q29udHJvbGxlci5yZWdpc3RlclVzZXIoYXBwLnNldHRpbmdzLmdldChcInVzZXJOYW1lXCIpKTtcclxufTtcclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgc2V0TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIGFwcC5hZGRSZWdpb25zKHtcclxuICAgICAgICBtYWluUmVnaW9uOiAnLm1iJ1xyXG4gICAgfSk7XHJcbiAgICBhcHAuZnJhbWUuc2V0TGF5b3V0KGFwcC5tYWluUmVnaW9uKTtcclxufTtcclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgc3RhcnRIaXN0b3J5ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xyXG59O1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgcmVtb3ZlU3BsYXNoU2NyZWVuID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICQoXCIuc3Bpbm5lclwiKS5oaWRlKCk7XHJcbiAgICAkKFwiLm1iXCIpLnNob3coKTtcclxufTtcclxuXHJcbmFwcC5zdGFydCgpO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJ3aW5kb3cuJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG53aW5kb3cuXyA9ICByZXF1aXJlKFwidW5kZXJzY29yZVwiKTtcclxud2luZG93Ll9zID0gcmVxdWlyZShcInVuZGVyc2NvcmUuc3RyaW5nXCIpO1xyXG53aW5kb3cuQmFja2JvbmUgPSByZXF1aXJlKFwiYmFja2JvbmVcIik7XHJcbndpbmRvdy5NYXJpb25ldHRlID0gcmVxdWlyZSgnYmFja2JvbmUubWFyaW9uZXR0ZScpO1xyXG53aW5kb3cuSGFuZGxlYmFycyA9IHJlcXVpcmUoXCJoYnNmeS9ydW50aW1lXCIpO1xyXG5cclxucmVxdWlyZShcImV4dGVuc2lvbnMvYmFja2JvbmUuc3luY1wiKTtcclxucmVxdWlyZShcImV4dGVuc2lvbnMvdW5kZXJzY29yZS5taXhpbi5kZWVwRXh0ZW5kXCIpO1xyXG5yZXF1aXJlKFwiZXh0ZW5zaW9ucy9tYXJpb25ldHRlLmV4dGVuc2lvbnNcIik7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qZ2xvYmFscyBIYW5kbGViYXJzOiB0cnVlICovXG52YXIgYmFzZSA9IHJlcXVpcmUoXCIuL2hhbmRsZWJhcnMvYmFzZVwiKTtcblxuLy8gRWFjaCBvZiB0aGVzZSBhdWdtZW50IHRoZSBIYW5kbGViYXJzIG9iamVjdC4gTm8gbmVlZCB0byBzZXR1cCBoZXJlLlxuLy8gKFRoaXMgaXMgZG9uZSB0byBlYXNpbHkgc2hhcmUgY29kZSBiZXR3ZWVuIGNvbW1vbmpzIGFuZCBicm93c2UgZW52cylcbnZhciBTYWZlU3RyaW5nID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9zYWZlLXN0cmluZ1wiKVtcImRlZmF1bHRcIl07XG52YXIgRXhjZXB0aW9uID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9leGNlcHRpb25cIilbXCJkZWZhdWx0XCJdO1xudmFyIFV0aWxzID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy91dGlsc1wiKTtcbnZhciBydW50aW1lID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9ydW50aW1lXCIpO1xuXG4vLyBGb3IgY29tcGF0aWJpbGl0eSBhbmQgdXNhZ2Ugb3V0c2lkZSBvZiBtb2R1bGUgc3lzdGVtcywgbWFrZSB0aGUgSGFuZGxlYmFycyBvYmplY3QgYSBuYW1lc3BhY2VcbnZhciBjcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGhiID0gbmV3IGJhc2UuSGFuZGxlYmFyc0Vudmlyb25tZW50KCk7XG5cbiAgVXRpbHMuZXh0ZW5kKGhiLCBiYXNlKTtcbiAgaGIuU2FmZVN0cmluZyA9IFNhZmVTdHJpbmc7XG4gIGhiLkV4Y2VwdGlvbiA9IEV4Y2VwdGlvbjtcbiAgaGIuVXRpbHMgPSBVdGlscztcblxuICBoYi5WTSA9IHJ1bnRpbWU7XG4gIGhiLnRlbXBsYXRlID0gZnVuY3Rpb24oc3BlYykge1xuICAgIHJldHVybiBydW50aW1lLnRlbXBsYXRlKHNwZWMsIGhiKTtcbiAgfTtcblxuICByZXR1cm4gaGI7XG59O1xuXG52YXIgSGFuZGxlYmFycyA9IGNyZWF0ZSgpO1xuSGFuZGxlYmFycy5jcmVhdGUgPSBjcmVhdGU7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gSGFuZGxlYmFyczsiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBVdGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIEV4Y2VwdGlvbiA9IHJlcXVpcmUoXCIuL2V4Y2VwdGlvblwiKVtcImRlZmF1bHRcIl07XG5cbnZhciBWRVJTSU9OID0gXCIxLjMuMFwiO1xuZXhwb3J0cy5WRVJTSU9OID0gVkVSU0lPTjt2YXIgQ09NUElMRVJfUkVWSVNJT04gPSA0O1xuZXhwb3J0cy5DT01QSUxFUl9SRVZJU0lPTiA9IENPTVBJTEVSX1JFVklTSU9OO1xudmFyIFJFVklTSU9OX0NIQU5HRVMgPSB7XG4gIDE6ICc8PSAxLjAucmMuMicsIC8vIDEuMC5yYy4yIGlzIGFjdHVhbGx5IHJldjIgYnV0IGRvZXNuJ3QgcmVwb3J0IGl0XG4gIDI6ICc9PSAxLjAuMC1yYy4zJyxcbiAgMzogJz09IDEuMC4wLXJjLjQnLFxuICA0OiAnPj0gMS4wLjAnXG59O1xuZXhwb3J0cy5SRVZJU0lPTl9DSEFOR0VTID0gUkVWSVNJT05fQ0hBTkdFUztcbnZhciBpc0FycmF5ID0gVXRpbHMuaXNBcnJheSxcbiAgICBpc0Z1bmN0aW9uID0gVXRpbHMuaXNGdW5jdGlvbixcbiAgICB0b1N0cmluZyA9IFV0aWxzLnRvU3RyaW5nLFxuICAgIG9iamVjdFR5cGUgPSAnW29iamVjdCBPYmplY3RdJztcblxuZnVuY3Rpb24gSGFuZGxlYmFyc0Vudmlyb25tZW50KGhlbHBlcnMsIHBhcnRpYWxzKSB7XG4gIHRoaXMuaGVscGVycyA9IGhlbHBlcnMgfHwge307XG4gIHRoaXMucGFydGlhbHMgPSBwYXJ0aWFscyB8fCB7fTtcblxuICByZWdpc3RlckRlZmF1bHRIZWxwZXJzKHRoaXMpO1xufVxuXG5leHBvcnRzLkhhbmRsZWJhcnNFbnZpcm9ubWVudCA9IEhhbmRsZWJhcnNFbnZpcm9ubWVudDtIYW5kbGViYXJzRW52aXJvbm1lbnQucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogSGFuZGxlYmFyc0Vudmlyb25tZW50LFxuXG4gIGxvZ2dlcjogbG9nZ2VyLFxuICBsb2c6IGxvZyxcblxuICByZWdpc3RlckhlbHBlcjogZnVuY3Rpb24obmFtZSwgZm4sIGludmVyc2UpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgaWYgKGludmVyc2UgfHwgZm4pIHsgdGhyb3cgbmV3IEV4Y2VwdGlvbignQXJnIG5vdCBzdXBwb3J0ZWQgd2l0aCBtdWx0aXBsZSBoZWxwZXJzJyk7IH1cbiAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLmhlbHBlcnMsIG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaW52ZXJzZSkgeyBmbi5ub3QgPSBpbnZlcnNlOyB9XG4gICAgICB0aGlzLmhlbHBlcnNbbmFtZV0gPSBmbjtcbiAgICB9XG4gIH0sXG5cbiAgcmVnaXN0ZXJQYXJ0aWFsOiBmdW5jdGlvbihuYW1lLCBzdHIpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMucGFydGlhbHMsICBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJ0aWFsc1tuYW1lXSA9IHN0cjtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyRGVmYXVsdEhlbHBlcnMoaW5zdGFuY2UpIHtcbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbihhcmcpIHtcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiTWlzc2luZyBoZWxwZXI6ICdcIiArIGFyZyArIFwiJ1wiKTtcbiAgICB9XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdibG9ja0hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UgfHwgZnVuY3Rpb24oKSB7fSwgZm4gPSBvcHRpb25zLmZuO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHsgY29udGV4dCA9IGNvbnRleHQuY2FsbCh0aGlzKTsgfVxuXG4gICAgaWYoY29udGV4dCA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGZuKHRoaXMpO1xuICAgIH0gZWxzZSBpZihjb250ZXh0ID09PSBmYWxzZSB8fCBjb250ZXh0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgaWYoY29udGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzLmVhY2goY29udGV4dCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZuKGNvbnRleHQpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2VhY2gnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGZuID0gb3B0aW9ucy5mbiwgaW52ZXJzZSA9IG9wdGlvbnMuaW52ZXJzZTtcbiAgICB2YXIgaSA9IDAsIHJldCA9IFwiXCIsIGRhdGE7XG5cbiAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkgeyBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpOyB9XG5cbiAgICBpZiAob3B0aW9ucy5kYXRhKSB7XG4gICAgICBkYXRhID0gY3JlYXRlRnJhbWUob3B0aW9ucy5kYXRhKTtcbiAgICB9XG5cbiAgICBpZihjb250ZXh0ICYmIHR5cGVvZiBjb250ZXh0ID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcbiAgICAgICAgZm9yKHZhciBqID0gY29udGV4dC5sZW5ndGg7IGk8ajsgaSsrKSB7XG4gICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEuaW5kZXggPSBpO1xuICAgICAgICAgICAgZGF0YS5maXJzdCA9IChpID09PSAwKTtcbiAgICAgICAgICAgIGRhdGEubGFzdCAgPSAoaSA9PT0gKGNvbnRleHQubGVuZ3RoLTEpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0ID0gcmV0ICsgZm4oY29udGV4dFtpXSwgeyBkYXRhOiBkYXRhIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IodmFyIGtleSBpbiBjb250ZXh0KSB7XG4gICAgICAgICAgaWYoY29udGV4dC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBpZihkYXRhKSB7IFxuICAgICAgICAgICAgICBkYXRhLmtleSA9IGtleTsgXG4gICAgICAgICAgICAgIGRhdGEuaW5kZXggPSBpO1xuICAgICAgICAgICAgICBkYXRhLmZpcnN0ID0gKGkgPT09IDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0ID0gcmV0ICsgZm4oY29udGV4dFtrZXldLCB7ZGF0YTogZGF0YX0pO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmKGkgPT09IDApe1xuICAgICAgcmV0ID0gaW52ZXJzZSh0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaWYnLCBmdW5jdGlvbihjb25kaXRpb25hbCwgb3B0aW9ucykge1xuICAgIGlmIChpc0Z1bmN0aW9uKGNvbmRpdGlvbmFsKSkgeyBjb25kaXRpb25hbCA9IGNvbmRpdGlvbmFsLmNhbGwodGhpcyk7IH1cblxuICAgIC8vIERlZmF1bHQgYmVoYXZpb3IgaXMgdG8gcmVuZGVyIHRoZSBwb3NpdGl2ZSBwYXRoIGlmIHRoZSB2YWx1ZSBpcyB0cnV0aHkgYW5kIG5vdCBlbXB0eS5cbiAgICAvLyBUaGUgYGluY2x1ZGVaZXJvYCBvcHRpb24gbWF5IGJlIHNldCB0byB0cmVhdCB0aGUgY29uZHRpb25hbCBhcyBwdXJlbHkgbm90IGVtcHR5IGJhc2VkIG9uIHRoZVxuICAgIC8vIGJlaGF2aW9yIG9mIGlzRW1wdHkuIEVmZmVjdGl2ZWx5IHRoaXMgZGV0ZXJtaW5lcyBpZiAwIGlzIGhhbmRsZWQgYnkgdGhlIHBvc2l0aXZlIHBhdGggb3IgbmVnYXRpdmUuXG4gICAgaWYgKCghb3B0aW9ucy5oYXNoLmluY2x1ZGVaZXJvICYmICFjb25kaXRpb25hbCkgfHwgVXRpbHMuaXNFbXB0eShjb25kaXRpb25hbCkpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3VubGVzcycsIGZ1bmN0aW9uKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGluc3RhbmNlLmhlbHBlcnNbJ2lmJ10uY2FsbCh0aGlzLCBjb25kaXRpb25hbCwge2ZuOiBvcHRpb25zLmludmVyc2UsIGludmVyc2U6IG9wdGlvbnMuZm4sIGhhc2g6IG9wdGlvbnMuaGFzaH0pO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignd2l0aCcsIGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkgeyBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpOyB9XG5cbiAgICBpZiAoIVV0aWxzLmlzRW1wdHkoY29udGV4dCkpIHJldHVybiBvcHRpb25zLmZuKGNvbnRleHQpO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignbG9nJywgZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBsZXZlbCA9IG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmRhdGEubGV2ZWwgIT0gbnVsbCA/IHBhcnNlSW50KG9wdGlvbnMuZGF0YS5sZXZlbCwgMTApIDogMTtcbiAgICBpbnN0YW5jZS5sb2cobGV2ZWwsIGNvbnRleHQpO1xuICB9KTtcbn1cblxudmFyIGxvZ2dlciA9IHtcbiAgbWV0aG9kTWFwOiB7IDA6ICdkZWJ1ZycsIDE6ICdpbmZvJywgMjogJ3dhcm4nLCAzOiAnZXJyb3InIH0sXG5cbiAgLy8gU3RhdGUgZW51bVxuICBERUJVRzogMCxcbiAgSU5GTzogMSxcbiAgV0FSTjogMixcbiAgRVJST1I6IDMsXG4gIGxldmVsOiAzLFxuXG4gIC8vIGNhbiBiZSBvdmVycmlkZGVuIGluIHRoZSBob3N0IGVudmlyb25tZW50XG4gIGxvZzogZnVuY3Rpb24obGV2ZWwsIG9iaikge1xuICAgIGlmIChsb2dnZXIubGV2ZWwgPD0gbGV2ZWwpIHtcbiAgICAgIHZhciBtZXRob2QgPSBsb2dnZXIubWV0aG9kTWFwW2xldmVsXTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgY29uc29sZVttZXRob2RdKSB7XG4gICAgICAgIGNvbnNvbGVbbWV0aG9kXS5jYWxsKGNvbnNvbGUsIG9iaik7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuZXhwb3J0cy5sb2dnZXIgPSBsb2dnZXI7XG5mdW5jdGlvbiBsb2cobGV2ZWwsIG9iaikgeyBsb2dnZXIubG9nKGxldmVsLCBvYmopOyB9XG5cbmV4cG9ydHMubG9nID0gbG9nO3ZhciBjcmVhdGVGcmFtZSA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB2YXIgb2JqID0ge307XG4gIFV0aWxzLmV4dGVuZChvYmosIG9iamVjdCk7XG4gIHJldHVybiBvYmo7XG59O1xuZXhwb3J0cy5jcmVhdGVGcmFtZSA9IGNyZWF0ZUZyYW1lOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgZXJyb3JQcm9wcyA9IFsnZGVzY3JpcHRpb24nLCAnZmlsZU5hbWUnLCAnbGluZU51bWJlcicsICdtZXNzYWdlJywgJ25hbWUnLCAnbnVtYmVyJywgJ3N0YWNrJ107XG5cbmZ1bmN0aW9uIEV4Y2VwdGlvbihtZXNzYWdlLCBub2RlKSB7XG4gIHZhciBsaW5lO1xuICBpZiAobm9kZSAmJiBub2RlLmZpcnN0TGluZSkge1xuICAgIGxpbmUgPSBub2RlLmZpcnN0TGluZTtcblxuICAgIG1lc3NhZ2UgKz0gJyAtICcgKyBsaW5lICsgJzonICsgbm9kZS5maXJzdENvbHVtbjtcbiAgfVxuXG4gIHZhciB0bXAgPSBFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBtZXNzYWdlKTtcblxuICAvLyBVbmZvcnR1bmF0ZWx5IGVycm9ycyBhcmUgbm90IGVudW1lcmFibGUgaW4gQ2hyb21lIChhdCBsZWFzdCksIHNvIGBmb3IgcHJvcCBpbiB0bXBgIGRvZXNuJ3Qgd29yay5cbiAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgZXJyb3JQcm9wcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgdGhpc1tlcnJvclByb3BzW2lkeF1dID0gdG1wW2Vycm9yUHJvcHNbaWR4XV07XG4gIH1cblxuICBpZiAobGluZSkge1xuICAgIHRoaXMubGluZU51bWJlciA9IGxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSBub2RlLmZpcnN0Q29sdW1uO1xuICB9XG59XG5cbkV4Y2VwdGlvbi5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBFeGNlcHRpb247IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgVXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBFeGNlcHRpb24gPSByZXF1aXJlKFwiLi9leGNlcHRpb25cIilbXCJkZWZhdWx0XCJdO1xudmFyIENPTVBJTEVSX1JFVklTSU9OID0gcmVxdWlyZShcIi4vYmFzZVwiKS5DT01QSUxFUl9SRVZJU0lPTjtcbnZhciBSRVZJU0lPTl9DSEFOR0VTID0gcmVxdWlyZShcIi4vYmFzZVwiKS5SRVZJU0lPTl9DSEFOR0VTO1xuXG5mdW5jdGlvbiBjaGVja1JldmlzaW9uKGNvbXBpbGVySW5mbykge1xuICB2YXIgY29tcGlsZXJSZXZpc2lvbiA9IGNvbXBpbGVySW5mbyAmJiBjb21waWxlckluZm9bMF0gfHwgMSxcbiAgICAgIGN1cnJlbnRSZXZpc2lvbiA9IENPTVBJTEVSX1JFVklTSU9OO1xuXG4gIGlmIChjb21waWxlclJldmlzaW9uICE9PSBjdXJyZW50UmV2aXNpb24pIHtcbiAgICBpZiAoY29tcGlsZXJSZXZpc2lvbiA8IGN1cnJlbnRSZXZpc2lvbikge1xuICAgICAgdmFyIHJ1bnRpbWVWZXJzaW9ucyA9IFJFVklTSU9OX0NIQU5HRVNbY3VycmVudFJldmlzaW9uXSxcbiAgICAgICAgICBjb21waWxlclZlcnNpb25zID0gUkVWSVNJT05fQ0hBTkdFU1tjb21waWxlclJldmlzaW9uXTtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJUZW1wbGF0ZSB3YXMgcHJlY29tcGlsZWQgd2l0aCBhbiBvbGRlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiBcIitcbiAgICAgICAgICAgIFwiUGxlYXNlIHVwZGF0ZSB5b3VyIHByZWNvbXBpbGVyIHRvIGEgbmV3ZXIgdmVyc2lvbiAoXCIrcnVudGltZVZlcnNpb25zK1wiKSBvciBkb3duZ3JhZGUgeW91ciBydW50aW1lIHRvIGFuIG9sZGVyIHZlcnNpb24gKFwiK2NvbXBpbGVyVmVyc2lvbnMrXCIpLlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVXNlIHRoZSBlbWJlZGRlZCB2ZXJzaW9uIGluZm8gc2luY2UgdGhlIHJ1bnRpbWUgZG9lc24ndCBrbm93IGFib3V0IHRoaXMgcmV2aXNpb24geWV0XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYSBuZXdlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiBcIitcbiAgICAgICAgICAgIFwiUGxlYXNlIHVwZGF0ZSB5b3VyIHJ1bnRpbWUgdG8gYSBuZXdlciB2ZXJzaW9uIChcIitjb21waWxlckluZm9bMV0rXCIpLlwiKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0cy5jaGVja1JldmlzaW9uID0gY2hlY2tSZXZpc2lvbjsvLyBUT0RPOiBSZW1vdmUgdGhpcyBsaW5lIGFuZCBicmVhayB1cCBjb21waWxlUGFydGlhbFxuXG5mdW5jdGlvbiB0ZW1wbGF0ZSh0ZW1wbGF0ZVNwZWMsIGVudikge1xuICBpZiAoIWVudikge1xuICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJObyBlbnZpcm9ubWVudCBwYXNzZWQgdG8gdGVtcGxhdGVcIik7XG4gIH1cblxuICAvLyBOb3RlOiBVc2luZyBlbnYuVk0gcmVmZXJlbmNlcyByYXRoZXIgdGhhbiBsb2NhbCB2YXIgcmVmZXJlbmNlcyB0aHJvdWdob3V0IHRoaXMgc2VjdGlvbiB0byBhbGxvd1xuICAvLyBmb3IgZXh0ZXJuYWwgdXNlcnMgdG8gb3ZlcnJpZGUgdGhlc2UgYXMgcHN1ZWRvLXN1cHBvcnRlZCBBUElzLlxuICB2YXIgaW52b2tlUGFydGlhbFdyYXBwZXIgPSBmdW5jdGlvbihwYXJ0aWFsLCBuYW1lLCBjb250ZXh0LCBoZWxwZXJzLCBwYXJ0aWFscywgZGF0YSkge1xuICAgIHZhciByZXN1bHQgPSBlbnYuVk0uaW52b2tlUGFydGlhbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmIChyZXN1bHQgIT0gbnVsbCkgeyByZXR1cm4gcmVzdWx0OyB9XG5cbiAgICBpZiAoZW52LmNvbXBpbGUpIHtcbiAgICAgIHZhciBvcHRpb25zID0geyBoZWxwZXJzOiBoZWxwZXJzLCBwYXJ0aWFsczogcGFydGlhbHMsIGRhdGE6IGRhdGEgfTtcbiAgICAgIHBhcnRpYWxzW25hbWVdID0gZW52LmNvbXBpbGUocGFydGlhbCwgeyBkYXRhOiBkYXRhICE9PSB1bmRlZmluZWQgfSwgZW52KTtcbiAgICAgIHJldHVybiBwYXJ0aWFsc1tuYW1lXShjb250ZXh0LCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIlRoZSBwYXJ0aWFsIFwiICsgbmFtZSArIFwiIGNvdWxkIG5vdCBiZSBjb21waWxlZCB3aGVuIHJ1bm5pbmcgaW4gcnVudGltZS1vbmx5IG1vZGVcIik7XG4gICAgfVxuICB9O1xuXG4gIC8vIEp1c3QgYWRkIHdhdGVyXG4gIHZhciBjb250YWluZXIgPSB7XG4gICAgZXNjYXBlRXhwcmVzc2lvbjogVXRpbHMuZXNjYXBlRXhwcmVzc2lvbixcbiAgICBpbnZva2VQYXJ0aWFsOiBpbnZva2VQYXJ0aWFsV3JhcHBlcixcbiAgICBwcm9ncmFtczogW10sXG4gICAgcHJvZ3JhbTogZnVuY3Rpb24oaSwgZm4sIGRhdGEpIHtcbiAgICAgIHZhciBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV07XG4gICAgICBpZihkYXRhKSB7XG4gICAgICAgIHByb2dyYW1XcmFwcGVyID0gcHJvZ3JhbShpLCBmbiwgZGF0YSk7XG4gICAgICB9IGVsc2UgaWYgKCFwcm9ncmFtV3JhcHBlcikge1xuICAgICAgICBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV0gPSBwcm9ncmFtKGksIGZuKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcm9ncmFtV3JhcHBlcjtcbiAgICB9LFxuICAgIG1lcmdlOiBmdW5jdGlvbihwYXJhbSwgY29tbW9uKSB7XG4gICAgICB2YXIgcmV0ID0gcGFyYW0gfHwgY29tbW9uO1xuXG4gICAgICBpZiAocGFyYW0gJiYgY29tbW9uICYmIChwYXJhbSAhPT0gY29tbW9uKSkge1xuICAgICAgICByZXQgPSB7fTtcbiAgICAgICAgVXRpbHMuZXh0ZW5kKHJldCwgY29tbW9uKTtcbiAgICAgICAgVXRpbHMuZXh0ZW5kKHJldCwgcGFyYW0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuICAgIHByb2dyYW1XaXRoRGVwdGg6IGVudi5WTS5wcm9ncmFtV2l0aERlcHRoLFxuICAgIG5vb3A6IGVudi5WTS5ub29wLFxuICAgIGNvbXBpbGVySW5mbzogbnVsbFxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIG5hbWVzcGFjZSA9IG9wdGlvbnMucGFydGlhbCA/IG9wdGlvbnMgOiBlbnYsXG4gICAgICAgIGhlbHBlcnMsXG4gICAgICAgIHBhcnRpYWxzO1xuXG4gICAgaWYgKCFvcHRpb25zLnBhcnRpYWwpIHtcbiAgICAgIGhlbHBlcnMgPSBvcHRpb25zLmhlbHBlcnM7XG4gICAgICBwYXJ0aWFscyA9IG9wdGlvbnMucGFydGlhbHM7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSB0ZW1wbGF0ZVNwZWMuY2FsbChcbiAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgbmFtZXNwYWNlLCBjb250ZXh0LFxuICAgICAgICAgIGhlbHBlcnMsXG4gICAgICAgICAgcGFydGlhbHMsXG4gICAgICAgICAgb3B0aW9ucy5kYXRhKTtcblxuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsKSB7XG4gICAgICBlbnYuVk0uY2hlY2tSZXZpc2lvbihjb250YWluZXIuY29tcGlsZXJJbmZvKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG5leHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7ZnVuY3Rpb24gcHJvZ3JhbVdpdGhEZXB0aChpLCBmbiwgZGF0YSAvKiwgJGRlcHRoICovKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAzKTtcblxuICB2YXIgcHJvZyA9IGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBbY29udGV4dCwgb3B0aW9ucy5kYXRhIHx8IGRhdGFdLmNvbmNhdChhcmdzKSk7XG4gIH07XG4gIHByb2cucHJvZ3JhbSA9IGk7XG4gIHByb2cuZGVwdGggPSBhcmdzLmxlbmd0aDtcbiAgcmV0dXJuIHByb2c7XG59XG5cbmV4cG9ydHMucHJvZ3JhbVdpdGhEZXB0aCA9IHByb2dyYW1XaXRoRGVwdGg7ZnVuY3Rpb24gcHJvZ3JhbShpLCBmbiwgZGF0YSkge1xuICB2YXIgcHJvZyA9IGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiBmbihjb250ZXh0LCBvcHRpb25zLmRhdGEgfHwgZGF0YSk7XG4gIH07XG4gIHByb2cucHJvZ3JhbSA9IGk7XG4gIHByb2cuZGVwdGggPSAwO1xuICByZXR1cm4gcHJvZztcbn1cblxuZXhwb3J0cy5wcm9ncmFtID0gcHJvZ3JhbTtmdW5jdGlvbiBpbnZva2VQYXJ0aWFsKHBhcnRpYWwsIG5hbWUsIGNvbnRleHQsIGhlbHBlcnMsIHBhcnRpYWxzLCBkYXRhKSB7XG4gIHZhciBvcHRpb25zID0geyBwYXJ0aWFsOiB0cnVlLCBoZWxwZXJzOiBoZWxwZXJzLCBwYXJ0aWFsczogcGFydGlhbHMsIGRhdGE6IGRhdGEgfTtcblxuICBpZihwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiVGhlIHBhcnRpYWwgXCIgKyBuYW1lICsgXCIgY291bGQgbm90IGJlIGZvdW5kXCIpO1xuICB9IGVsc2UgaWYocGFydGlhbCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIHBhcnRpYWwoY29udGV4dCwgb3B0aW9ucyk7XG4gIH1cbn1cblxuZXhwb3J0cy5pbnZva2VQYXJ0aWFsID0gaW52b2tlUGFydGlhbDtmdW5jdGlvbiBub29wKCkgeyByZXR1cm4gXCJcIjsgfVxuXG5leHBvcnRzLm5vb3AgPSBub29wOyIsIlwidXNlIHN0cmljdFwiO1xuLy8gQnVpbGQgb3V0IG91ciBiYXNpYyBTYWZlU3RyaW5nIHR5cGVcbmZ1bmN0aW9uIFNhZmVTdHJpbmcoc3RyaW5nKSB7XG4gIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xufVxuXG5TYWZlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gXCJcIiArIHRoaXMuc3RyaW5nO1xufTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBTYWZlU3RyaW5nOyIsIlwidXNlIHN0cmljdFwiO1xuLypqc2hpbnQgLVcwMDQgKi9cbnZhciBTYWZlU3RyaW5nID0gcmVxdWlyZShcIi4vc2FmZS1zdHJpbmdcIilbXCJkZWZhdWx0XCJdO1xuXG52YXIgZXNjYXBlID0ge1xuICBcIiZcIjogXCImYW1wO1wiLFxuICBcIjxcIjogXCImbHQ7XCIsXG4gIFwiPlwiOiBcIiZndDtcIixcbiAgJ1wiJzogXCImcXVvdDtcIixcbiAgXCInXCI6IFwiJiN4Mjc7XCIsXG4gIFwiYFwiOiBcIiYjeDYwO1wiXG59O1xuXG52YXIgYmFkQ2hhcnMgPSAvWyY8PlwiJ2BdL2c7XG52YXIgcG9zc2libGUgPSAvWyY8PlwiJ2BdLztcblxuZnVuY3Rpb24gZXNjYXBlQ2hhcihjaHIpIHtcbiAgcmV0dXJuIGVzY2FwZVtjaHJdIHx8IFwiJmFtcDtcIjtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKG9iaiwgdmFsdWUpIHtcbiAgZm9yKHZhciBrZXkgaW4gdmFsdWUpIHtcbiAgICBpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGtleSkpIHtcbiAgICAgIG9ialtrZXldID0gdmFsdWVba2V5XTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0cy5leHRlbmQgPSBleHRlbmQ7dmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmV4cG9ydHMudG9TdHJpbmcgPSB0b1N0cmluZztcbi8vIFNvdXJjZWQgZnJvbSBsb2Rhc2hcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iZXN0aWVqcy9sb2Rhc2gvYmxvYi9tYXN0ZXIvTElDRU5TRS50eHRcbnZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn07XG4vLyBmYWxsYmFjayBmb3Igb2xkZXIgdmVyc2lvbnMgb2YgQ2hyb21lIGFuZCBTYWZhcmlcbmlmIChpc0Z1bmN0aW9uKC94LykpIHtcbiAgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbiAgfTtcbn1cbnZhciBpc0Z1bmN0aW9uO1xuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpID8gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XScgOiBmYWxzZTtcbn07XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBlc2NhcGVFeHByZXNzaW9uKHN0cmluZykge1xuICAvLyBkb24ndCBlc2NhcGUgU2FmZVN0cmluZ3MsIHNpbmNlIHRoZXkncmUgYWxyZWFkeSBzYWZlXG4gIGlmIChzdHJpbmcgaW5zdGFuY2VvZiBTYWZlU3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy50b1N0cmluZygpO1xuICB9IGVsc2UgaWYgKCFzdHJpbmcgJiYgc3RyaW5nICE9PSAwKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICAvLyBGb3JjZSBhIHN0cmluZyBjb252ZXJzaW9uIGFzIHRoaXMgd2lsbCBiZSBkb25lIGJ5IHRoZSBhcHBlbmQgcmVnYXJkbGVzcyBhbmRcbiAgLy8gdGhlIHJlZ2V4IHRlc3Qgd2lsbCBkbyB0aGlzIHRyYW5zcGFyZW50bHkgYmVoaW5kIHRoZSBzY2VuZXMsIGNhdXNpbmcgaXNzdWVzIGlmXG4gIC8vIGFuIG9iamVjdCdzIHRvIHN0cmluZyBoYXMgZXNjYXBlZCBjaGFyYWN0ZXJzIGluIGl0LlxuICBzdHJpbmcgPSBcIlwiICsgc3RyaW5nO1xuXG4gIGlmKCFwb3NzaWJsZS50ZXN0KHN0cmluZykpIHsgcmV0dXJuIHN0cmluZzsgfVxuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoYmFkQ2hhcnMsIGVzY2FwZUNoYXIpO1xufVxuXG5leHBvcnRzLmVzY2FwZUV4cHJlc3Npb24gPSBlc2NhcGVFeHByZXNzaW9uO2Z1bmN0aW9uIGlzRW1wdHkodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnRzLmlzRW1wdHkgPSBpc0VtcHR5OyIsIi8vIENyZWF0ZSBhIHNpbXBsZSBwYXRoIGFsaWFzIHRvIGFsbG93IGJyb3dzZXJpZnkgdG8gcmVzb2x2ZVxuLy8gdGhlIHJ1bnRpbWUgb24gYSBzdXBwb3J0ZWQgcGF0aC5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kaXN0L2Nqcy9oYW5kbGViYXJzLnJ1bnRpbWUnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImhhbmRsZWJhcnMvcnVudGltZVwiKVtcImRlZmF1bHRcIl07XG4iXX0=
