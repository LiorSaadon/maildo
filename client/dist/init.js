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
    + "</span><span class=\"toggle\"></span></a>\r\n\r\n        <div class=\"dropdown-slider ddsResources\" display=\"none\">\r\n            <div class=\"container\">\r\n                <ul>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Client-side</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Backbone</span>\r\n                            <span class=\"item\">Backbone.DeepModel</span>\r\n                            <span class=\"item\">Marionette</span>\r\n                            <span class=\"item\">Underscore</span>\r\n                            <span class=\"item\">RequireJS (AMD)</span>\r\n                            <span class=\"item\">Mustache</span>\r\n                            <span class=\"item\">Sass\\Compass</span>\r\n                         </p>\r\n                    </li>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Server-side</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Node.js</span>\r\n                            <span class=\"item\">Express 4.0</span>\r\n                            <span class=\"item\">MongoDB</span>\r\n                            <span class=\"item\">Mongoose</span>\r\n                            <span class=\"item\">Socket.io</span>\r\n                            <span class=\"item\">Async.js</span>\r\n                         </p>\r\n                    </li>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Testing tools</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Mocha</span>\r\n                            <span class=\"item\">Chai</span>\r\n                            <span class=\"item\">Sinon</span>\r\n                            <span class=\"item\">Blanket</span>\r\n                            <span class=\"item\">Squire</span>\r\n                         </p>\r\n                    </li>\r\n                    <li>\r\n                        <input type=\"checkbox\" checked>\r\n                        <i></i>\r\n                        <h2>Deploying tools</h2>\r\n                         <p>\r\n                            <span class=\"item first\">Grunt</span>\r\n                          </p>\r\n                    </li>\r\n\r\n                </ul>\r\n            </div>\r\n\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n\r\n";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6XFxzbWRcXG1haWxkb1xcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2Jhc2UtY29sbGVjdGlvbnMvYmFzZUNvbGxlY3Rpb24uanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2Jhc2UtY29sbGVjdGlvbnMvZmlsdGVyZWRDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9iYXNlLW1vZGVscy9iYXNlTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2NvbnRleHQvY29udGV4dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvZGVjb3JhdG9ycy9GaWx0ZXJDb2xsZWN0aW9uRGVjb3JhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9kZWNvcmF0b3JzL3NlbGVjdGFibGVDb2xsZWN0aW9uRGVjb3JhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9saWItZXh0ZW5zaW9ucy9iYWNrYm9uZS5zeW5jLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9saWItZXh0ZW5zaW9ucy9tYXJpb25ldHRlLmV4dGVuc2lvbnMuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL2xpYi1leHRlbnNpb25zL3VuZGVyc2NvcmUubWl4aW4uZGVlcEV4dGVuZC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvcGx1Z2lucy9qcXVlcnkuYmEtb3V0c2lkZS1ldmVudHMuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3BsdWdpbnMvdG9nZ2xlLmJsb2NrLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9yZXNvbHZlcnMvZHJvcGRvd25EaXNwbGF5ZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3Jlc29sdmVycy9mb3JtYXR0ZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL2pzL3Jlc29sdmVycy90cmFuc2xhdG9yLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9zZXR0aW5ncy9zZXR0aW5ncy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vanMvc2V0dGluZ3Mvc2V0dGluZ3NDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi9qcy9zb2NrZXQvc29ja2V0Q29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9hdXRvQ29tcGxldGUvYXV0b0NvbXBsZXRlLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS9qcy9jb2xsZWN0aW9ucy9hdXRvQ29tcGxldGVDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS9qcy9tb2RlbHMvYXV0b0NvbXBsZXRlTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvYXV0b0NvbXBsZXRlL2pzL3ZpZXdzL2F1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvYXV0b0NvbXBsZXRlL2pzL3ZpZXdzL2F1dG9Db21wbGV0ZUl0ZW1WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2F1dG9Db21wbGV0ZS91aS90ZW1wbGF0ZXMvYXV0b0NvbXBsZXRlLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9hdXRvQ29tcGxldGUvdWkvdGVtcGxhdGVzL2F1dG9Db21wbGV0ZUl0ZW0uaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2RpYWxvZy9kaWFsb2cuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvZGlhbG9nL2pzL3ZpZXdzL2RpYWxvZ1ZpZXcxLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL2RpYWxvZy91aS90ZW1wbGF0ZXMvZGlhbG9nLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy9zZWFyY2gvc2VhcmNoLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2NvbW1vbi91aS9jb21wb25lbnRzL3NlYXJjaC91aS90ZW1wbGF0ZXMvc2VhcmNoLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL2pzL2NvbGxlY3Rpb25zL3RhZ0NvbGxlY3Rpb24uanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy9tb2RlbHMvdGFnTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy92aWV3cy90YWdzSXRlbVZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy9qcy92aWV3cy90YWdzVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL3RhZ3MuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvY29tbW9uL3VpL2NvbXBvbmVudHMvdGFncy91aS90ZW1wbGF0ZXMvdGFnLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9jb21tb24vdWkvY29tcG9uZW50cy90YWdzL3VpL3RlbXBsYXRlcy90YWdzQ29udGFpbmVyLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9mcmFtZS5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy9mcmFtZUxheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy9sb2FkZXJWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL2pzL3ZpZXdzL3NldHRpbmdzVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS9qcy92aWV3cy90ZWNoQmFyVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9mcmFtZS91aS90ZW1wbGF0ZXMvZnJhbWVMYXlvdXQuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy9sb2FkZXIuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy9zZXR0aW5nc1ZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL2ZyYW1lL3VpL3RlbXBsYXRlcy90ZWNoQmFyLmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29sbGVjdGlvbnMvY29udGFjdHNDb2xsZWN0aW9uLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb2xsZWN0aW9ucy9tYWlsQ29sbGVjdGlvbi5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29udHJvbGxlcnMvbWFpbEFjdGlvbnNDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb250cm9sbGVycy9tYWlsQ29udGVudExheW91dENvbnRyb2xsZXIuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL2NvbnRyb2xsZXJzL21haWxEYXRhQ29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvY29udHJvbGxlcnMvbWFpbE1haW5MYXlvdXRDb250cm9sbGVyLmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy9jb250cm9sbGVycy9tYWlsUm91dGVyQ29udHJvbGxlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvbW9kZWxzL2NvbnRhY3RNb2RlbC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvbW9kZWxzL2NvbnRhY3RzRmlsdGVyTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL21vZGVscy9tYWlsTW9kZWwuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL3JvdXRlcnMvbWFpbFJvdXRlci5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvYWN0aW9uVmlldy9fbW9yZUFjdGlvbnNWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9hY3Rpb25WaWV3L19tb3ZlVG9WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9hY3Rpb25WaWV3L19wYWdlclZpZXcuanMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL2pzL3ZpZXdzL2FjdGlvblZpZXcvYWN0aW9uVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvY29tcG9zZVZpZXcvX2FkZHJlc3NWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9jb21wb3NlVmlldy9jb21wb3NlVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvZW1wdHlGb2xkZXJWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9lbXB0eU1haWxWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9tYWlsQ29udGVudExheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvbWFpbEl0ZW1WaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9tYWlsTWFpbkxheW91dC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3MvbWFpbHNWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9uYXZWaWV3LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC9qcy92aWV3cy9wcmV2aWV3Vmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvanMvdmlld3Mvc2VhcmNoVmlldy5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvbWFpbC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL19hZGRyZXNzVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9hY3Rpb25WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2NvbXBvc2VWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2NvbnRlbnRMYXlvdXQuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvZW1wdHlGb2xkZXJWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL2VtcHR5TWFpbFZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvbWFpbEl0ZW1WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL21haWxzVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9tYWluTGF5b3V0LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL21vcmVBY3Rpb25zVmlldy5oYnMiLCJEOi9zbWQvbWFpbGRvL2NsaWVudC9zcmMvbW9kdWxlcy9tYWlsL3VpL3RlbXBsYXRlcy9tb3ZlVG9WaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL25hdlZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL21vZHVsZXMvbWFpbC91aS90ZW1wbGF0ZXMvcGFnZXJWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL3ByZXZpZXdWaWV3LmhicyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9tb2R1bGVzL21haWwvdWkvdGVtcGxhdGVzL3NlYXJjaFZpZXcuaGJzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL3NldHVwL2FwcC5qcyIsIkQ6L3NtZC9tYWlsZG8vY2xpZW50L3NyYy9zZXR1cC9pbml0LmpzIiwiRDovc21kL21haWxkby9jbGllbnQvc3JjL3NldHVwL3ZlbmRvcnNMb2FkZXIuanMiLCJEOi9zbWQvbWFpbGRvL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMucnVudGltZS5qcyIsIkQ6L3NtZC9tYWlsZG8vbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9iYXNlLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL2V4Y2VwdGlvbi5qcyIsIkQ6L3NtZC9tYWlsZG8vbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9ydW50aW1lLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3NhZmUtc3RyaW5nLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3V0aWxzLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9ydW50aW1lLmpzIiwiRDovc21kL21haWxkby9ub2RlX21vZHVsZXMvaGJzZnkvcnVudGltZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLFlBQVksQ0FBQzs7QUFFYixJQUFJLGNBQWMsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQzs7QUFFNUMsWUFBUSxFQUFFLEVBQUU7Ozs7OztBQU1aLFNBQUssRUFBRSxlQUFVLE9BQU8sRUFBRTs7QUFFdEIsZUFBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7O0FBRXhCLFlBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDbEMsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtB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QW9CLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDOUQsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQ3BFLENBQUMsQ0FBQzs7Ozs7O0FBTUgsUUFBSSxDQUFDLFNBQVMsR0FBRSxZQUFVO0FBQ3RCLGVBQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQy9DLENBQUM7Q0FDTCxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7QUNsQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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LE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgQmFzZUNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgbWV0YWRhdGE6IHt9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBvdmVycmlkZSBmZXRjaCBmb3IgdHJpZ2dlcmluZy5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZmV0Y2g6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICB2YXIgc3VjY2Vzc0Z1bmMgPSBvcHRpb25zLnN1Y2Nlc3M7XHJcbiAgICAgICAgdmFyIGVycm9yRnVuYyA9IG9wdGlvbnMuZXJyb3I7XHJcblxyXG4gICAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCByZXNwb25zZSwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKFwiZmV0Y2g6c3VjY2Vzc1wiLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24oc3VjY2Vzc0Z1bmMpKSB7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzRnVuYyhjb2xsZWN0aW9uLCByZXNwb25zZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIG9wdGlvbnMuZXJyb3IgPSBmdW5jdGlvbiAoY29sbGVjdGlvbiwgcmVzcG9uc2UsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcihcImZldGNoOmVycm9yXCIsIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihlcnJvckZ1bmMpKSB7XHJcbiAgICAgICAgICAgICAgICBlcnJvckZ1bmMoY29sbGVjdGlvbiwgcmVzcG9uc2UsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIEJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLmZldGNoLmNhbGwodGhpcywgb3B0aW9ucyk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gc2V0XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNldDogZnVuY3Rpb24gKHJlc3BvbnNlLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHJlc3BvbnNlID0gXy5pc09iamVjdChyZXNwb25zZSkgPyByZXNwb25zZSA6IHt9O1xyXG5cclxuICAgICAgICBpZiAoXy5pc09iamVjdChyZXNwb25zZS5jb2xsZWN0aW9uKSkge1xyXG4gICAgICAgICAgICBCYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5zZXQuY2FsbCh0aGlzLCByZXNwb25zZS5jb2xsZWN0aW9uLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKF8uaXNPYmplY3QocmVzcG9uc2UubWV0YWRhdGEpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTWV0YWRhdGEocmVzcG9uc2UubWV0YWRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHVwZGF0ZU1ldGFkYXRhOiBmdW5jdGlvbiAobWV0YWRhdGEpIHtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzRXF1YWwodGhpcy5tZXRhZGF0YSwgbWV0YWRhdGEpKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1ldGFkYXRhID0gXy5jbG9uZShtZXRhZGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcihcImNoYW5nZTptZXRhZGF0YVwiLCBtZXRhZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBkZXN0cm95XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVzdHJveTogZnVuY3Rpb24gKF9vcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgb3B0aW9ucyA9IF9vcHRpb25zID8gXy5jbG9uZShfb3B0aW9ucykgOiB7fSxcclxuICAgICAgICAgICAgc3VjY2VzcyA9IG9wdGlvbnMuc3VjY2VzcztcclxuXHJcbiAgICAgICAgaWYgKF8uaXNBcnJheShvcHRpb25zLnNlbGVjdGVkSXRlbXMpKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMuZGF0YSA9IG9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5zcGxpY2UoMCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgb3B0aW9ucy5kYXRhID0gdGhpcy5nZXRNb2RlbElkcygpOyAvLyBhbGwgaXRlbXNcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF8uZWFjaChvcHRpb25zLmRhdGEsIGZ1bmN0aW9uIChpdGVtKSB7IC8vIHJlbW92ZSBuZXcgb3Igbm90IGV4aXN0ZWQgaXRlbXNcclxuICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgIGlmICghbW9kZWwgfHwgbW9kZWwuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5kYXRhID0gb3B0aW9ucy5kYXRhLnNsaWNlKCQuaW5BcnJheShpdGVtLCBvcHRpb25zLmRhdGEpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoXy5pc0VtcHR5KG9wdGlvbnMuZGF0YSkpIHsgLy9ubyBpdGVtcyB0byBkZWxldGVcclxuICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwKSB7XHJcbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzKHRoYXQsIHJlc3AsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoYXQudHJpZ2dlcignZGVsZXRlOnN1Y2Nlc3MnLCB0aGF0LCByZXNwLCBvcHRpb25zKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gQmFja2JvbmUuc3luYy5hcHBseSh0aGlzLCBbJ2RlbGV0ZScsIHRoaXMsIG9wdGlvbnNdKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gdXBkYXRlXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAoX29wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICBvcHRpb25zID0gX29wdGlvbnMgPyBfLmNsb25lKF9vcHRpb25zKSA6IHt9LFxyXG4gICAgICAgICAgICBzdWNjZXNzRnVuYyA9IG9wdGlvbnMuc3VjY2VzcztcclxuXHJcbiAgICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3ApIHtcclxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NGdW5jKSB7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzRnVuYyh0aGF0LCByZXNwLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGF0LnRyaWdnZXIoJ3VwZGF0ZTpzdWNjZXNzJywgdGhhdCwgcmVzcCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIEJhY2tib25lLnN5bmMuYXBwbHkodGhpcywgWyd1cGRhdGUnLCB0aGlzLCBvcHRpb25zXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB0b0pTT046IGZ1bmN0aW9uIChfb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgYXJyID0gW10sXHJcbiAgICAgICAgICAgIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICBvcHRpb25zID0gX29wdGlvbnMgfHwge30sXHJcbiAgICAgICAgICAgIGl0ZW1zID0gb3B0aW9ucy5zZWxlY3RlZEl0ZW1zIHx8IHRoaXMuZ2V0TW9kZWxJZHMoKTtcclxuXHJcbiAgICAgICAgXy5lYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5nZXQoaXRlbSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgIGlmICghbW9kZWwuaXNOZXcoKSAmJiBvcHRpb25zLmZpZWxkcykge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZmllbGRzLnB1c2goXCJpZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbCA9IG1vZGVsLnRvSlNPTih7ZmllbGRzOiBvcHRpb25zLmZpZWxkc30pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbCA9IG1vZGVsLnRvSlNPTigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYXJyLnB1c2gobW9kZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBnZXRNb2RlbElkczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKG1vZGVsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb2RlbC5pZDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VDb2xsZWN0aW9uO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBCYXNlQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCIuL2Jhc2VDb2xsZWN0aW9uXCIpO1xyXG5cclxudmFyIEZpbHRlcmVkQ29sbGVjdGlvbiA9IEJhc2VDb2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgUEFHRV9TSVpFOiAxMCxcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBCYXNlQ29sbGVjdGlvbi5wcm90b3R5cGUuaW5pdGlhbGl6ZShvcHRpb25zKTtcclxuICAgICAgICB0aGlzLnNldEZpbHRlcnMob3B0aW9ucyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gZmV0Y2hCeVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZmV0Y2hCeTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgIHRoaXMuc2V0RmlsdGVycyhvcHRpb25zKTtcclxuXHJcbiAgICAgICAgdGhpcy5mZXRjaCh7XHJcblxyXG4gICAgICAgICAgICByZXNldDogdHJ1ZSxcclxuXHJcbiAgICAgICAgICAgIGRhdGE6IHRoaXMuZmlsdGVycyxcclxuXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IF8uYmluZChmdW5jdGlvbiAoY29sbGVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0ZldGNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihvcHRpb25zLnN1Y2Nlc3MpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKGNvbGxlY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB0aGlzKSxcclxuXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihvcHRpb25zLmVycm9yKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IoY29sbGVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2V0RmlsdGVyczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gb3B0aW9ucy5maWx0ZXJzID8gXy5jbG9uZShvcHRpb25zLmZpbHRlcnMpIDoge3F1ZXJ5OiAnJywgcGFnZTogMX07XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gcmVmcmVzaFxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgcmVmcmVzaDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLmZldGNoQnkoe2ZpbHRlcnM6IHRoaXMuZmlsdGVyc30pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmlsdGVyZWRDb2xsZWN0aW9uOyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIERlZXBNb2RlbCA9IHJlcXVpcmUoXCJiYWNrYm9uZS1kZWVwLW1vZGVsXCIpO1xyXG5cclxudmFyIEJhc2VNb2RlbCA9IERlZXBNb2RlbC5leHRlbmQoe1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gc2F2ZVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2F2ZTpmdW5jdGlvbiAoa2V5LCB2YWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaWYgKGtleSA9PSBudWxsIHx8IHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLmludmFsaWQpIHtcclxuICAgICAgICAgICAgdGhpcy5vbihcImludmFsaWRcIiwgb3B0aW9ucy5pbnZhbGlkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXN1bHQgPSBEZWVwTW9kZWwucHJvdG90eXBlLnNhdmUuY2FsbCh0aGlzLCBrZXksIHZhbCwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLmludmFsaWQpIHtcclxuICAgICAgICAgICAgdGhpcy5vZmYoXCJpbnZhbGlkXCIsIG9wdGlvbnMuaW52YWxpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyB0b0pTT05cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdG9KU09OOmZ1bmN0aW9uKG9wdGlvbnMpe1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgaWYob3B0aW9ucy5maWVsZHMpe1xyXG4gICAgICAgICAgICB2YXIgY29weSA9IHt9LCBjbG9uZSA9IF8uZGVlcENsb25lKHRoaXMuYXR0cmlidXRlcyk7XHJcblxyXG4gICAgICAgICAgICBfLmVhY2gob3B0aW9ucy5maWVsZHMsIGZ1bmN0aW9uKGZpZWxkKXtcclxuICAgICAgICAgICAgICAgIGNvcHlbZmllbGRdID0gY2xvbmVbZmllbGRdO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjb3B5O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gRGVlcE1vZGVsLnByb3RvdHlwZS50b0pTT04uY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VNb2RlbDtcclxuXHJcblxyXG5cclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIERlZXBNb2RlbCA9IHJlcXVpcmUoXCJiYWNrYm9uZS1kZWVwLW1vZGVsXCIpO1xyXG5cclxudmFyIENvbnRleHQgPSBEZWVwTW9kZWwuZXh0ZW5kKHtcclxuXHJcbiAgICBkZWZhdWx0czoge1xyXG4gICAgICAgIG1vZHVsZTogJycsXHJcbiAgICAgICAgbWFpbDoge1xyXG4gICAgICAgICAgICBhY3Rpb246IHt9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0YXNrczoge1xyXG4gICAgICAgICAgICBzZWxlY3RlZENhdGVnb3J5OiB7fVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRleHQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEZpbHRlckNvbGxlY3Rpb25EZWNvcmF0b3IgPSBmdW5jdGlvbiAob3JpZ2luYWwsIGZpbHRlck1vZGVsKSB7XHJcblxyXG4gICAgdmFyIGZpbHRlckNvbGxlY3Rpb24gPSAkLmV4dGVuZCh7fSwgb3JpZ2luYWwpO1xyXG5cclxuICAgIGZpbHRlckNvbGxlY3Rpb24ubW9kZWxzID0gW107XHJcbiAgICBmaWx0ZXJDb2xsZWN0aW9uLmZpbHRlck1vZGVsID0gZmlsdGVyTW9kZWw7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGZpbHRlckJ5XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGZpbHRlckNvbGxlY3Rpb24uZmlsdGVyQnkgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgdmFyIGl0ZW1zO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5maWx0ZXJNb2RlbCkge1xyXG4gICAgICAgICAgICBpdGVtcyA9IF8uZmlsdGVyKG9yaWdpbmFsLm1vZGVscywgXy5iaW5kKGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyTW9kZWwucHJlZGljYXRlKG1vZGVsKTtcclxuICAgICAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGl0ZW1zID0gb3JpZ2luYWwubW9kZWxzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKF8uaXNBcnJheShvcHRpb25zLm1hbmRhdG9yeUl0ZW1zKSkge1xyXG4gICAgICAgICAgICBpdGVtcyA9IF8udW5pb24ob3B0aW9ucy5tYW5kYXRvcnlJdGVtcywgaXRlbXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKF8uaXNGaW5pdGUob3B0aW9ucy5tYXhJdGVtcykpIHtcclxuICAgICAgICAgICAgaXRlbXMgPSBpdGVtcy5zbGljZSgwLCBvcHRpb25zLm1heEl0ZW1zKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChfLmlzRW1wdHkoaXRlbXMpKSB7XHJcbiAgICAgICAgICAgIGZpbHRlckNvbGxlY3Rpb24udHJpZ2dlcihcImVtcHR5OmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbHRlckNvbGxlY3Rpb24ucmVzZXQoaXRlbXMpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGZpbHRlckFsbFxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBmaWx0ZXJDb2xsZWN0aW9uLmZpbHRlckFsbCA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgZmlsdGVyQ29sbGVjdGlvbi50cmlnZ2VyKFwiZW1wdHk6Y29sbGVjdGlvblwiKTtcclxuICAgICAgICBmaWx0ZXJDb2xsZWN0aW9uLnJlc2V0KFtdKTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIGZpbHRlckNvbGxlY3Rpb247XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZpbHRlckNvbGxlY3Rpb25EZWNvcmF0b3I7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFNlbGVjdGFibGVDb2xsZWN0aW9uRGVjb3JhdG9yID0gZnVuY3Rpb24gKG9yaWdpbmFsKSB7XHJcblxyXG4gICAgdmFyIGRlY29yYXRlZENvbGxlY3Rpb24gPSAkLmV4dGVuZCh7fSwgb3JpZ2luYWwpO1xyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0ZWQgPSBbXTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVjb3JhdGVkQ29sbGVjdGlvbi5nZXRTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWQuc2xpY2UoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uaXNTZWxlY3RlZCA9IGZ1bmN0aW9uIChtb2RlbCkge1xyXG5cclxuICAgICAgICB2YXIgaWQgPSBtb2RlbC5nZXQoXCJpZFwiKTtcclxuICAgICAgICByZXR1cm4gJC5pbkFycmF5KGlkLCBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdGVkKSAhPT0gLTE7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24udW5zZWxlY3RNb2RlbCA9IGZ1bmN0aW9uIChtb2RlbCwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgaWQgPSBtb2RlbC5nZXQoXCJpZFwiKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZ2V0KGlkKSAmJiAkLmluQXJyYXkoaWQsIHRoaXMuc2VsZWN0ZWQpICE9PSAtMSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkLnNwbGljZSgkLmluQXJyYXkoaWQsIHRoaXMuc2VsZWN0ZWQpLCAxKTtcclxuICAgICAgICAgICAgcmFpc2VUcmlnZ2VyKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVjb3JhdGVkQ29sbGVjdGlvbi51cGRhdGVTZWxlY3Rpb24gPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgaXRlbXNUb1JlbW92ZSA9IFtdO1xyXG5cclxuICAgICAgICBfLmVhY2godGhpcy5zZWxlY3RlZCwgXy5iaW5kKGZ1bmN0aW9uIChzZWxlY3RlZEl0ZW0pIHtcclxuICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5nZXQoc2VsZWN0ZWRJdGVtKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzRW1wdHkobW9kZWwpKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtc1RvUmVtb3ZlLnB1c2goc2VsZWN0ZWRJdGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzRW1wdHkoaXRlbXNUb1JlbW92ZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IF8uZGlmZmVyZW5jZSh0aGlzLnNlbGVjdGVkLCBpdGVtc1RvUmVtb3ZlKTtcclxuICAgICAgICAgICAgcmFpc2VUcmlnZ2VyKG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uY2xlYXJTZWxlY3RlZCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWQubGVuZ3RoID0gMDtcclxuICAgICAgICByYWlzZVRyaWdnZXIob3B0aW9ucyk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdEFsbCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0TW9kZWxzKHRoaXMubW9kZWxzLCBvcHRpb25zKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0TW9kZWxzID0gZnVuY3Rpb24gKG1vZGVscywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgZXhjbHVzaXZlbHkgPSBvcHRpb25zID8gb3B0aW9ucy5leGNsdXNpdmVseSA6IG51bGwsIHJhaXNlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChleGNsdXNpdmVseSkge1xyXG4gICAgICAgICAgICByYWlzZSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQubGVuZ3RoID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF8uZWFjaChtb2RlbHMsIGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgICAgICAgICByYWlzZSA9IGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0TW9kZWwobW9kZWwsIHtzaWxlbnQ6IHRydWV9KSB8fCByYWlzZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgICAgaWYgKHJhaXNlKSB7XHJcbiAgICAgICAgICAgIHJhaXNlVHJpZ2dlcihvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBkZWNvcmF0ZWRDb2xsZWN0aW9uLnNlbGVjdE1vZGVsID0gZnVuY3Rpb24gKG1vZGVsLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHZhciBpZCA9IG1vZGVsLmdldChcImlkXCIpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5nZXQoaWQpICYmICQuaW5BcnJheShpZCwgdGhpcy5zZWxlY3RlZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQucHVzaChpZCk7XHJcbiAgICAgICAgICAgIHJhaXNlVHJpZ2dlcihvcHRpb25zKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZGVjb3JhdGVkQ29sbGVjdGlvbi50b2dnbGVTZWxlY3Rpb24gPSBmdW5jdGlvbiAobW9kZWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3RlZChtb2RlbCkpIHtcclxuICAgICAgICAgICAgdGhpcy51bnNlbGVjdE1vZGVsKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdE1vZGVsKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgcmFpc2VUcmlnZ2VyID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdmFyIHNpbGVudCA9IG9wdGlvbnMgPyBvcHRpb25zLnNpbGVudCA6IG51bGw7XHJcblxyXG4gICAgICAgIGlmICghc2lsZW50KSB7XHJcbiAgICAgICAgICAgIGRlY29yYXRlZENvbGxlY3Rpb24udHJpZ2dlcignY2hhbmdlOnNlbGVjdGlvbicsIGRlY29yYXRlZENvbGxlY3Rpb24uc2VsZWN0ZWQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBkZWNvcmF0ZWRDb2xsZWN0aW9uO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RhYmxlQ29sbGVjdGlvbkRlY29yYXRvcjtcclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gc29ja2V0c1N5bmNcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnZhciBzb2NrZXRTeW5jID0gZnVuY3Rpb24gKG1ldGhvZCwgbW9kZWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICB2YXIgb3B0cyA9IF8uZXh0ZW5kKHt9LCBvcHRpb25zKSxcclxuICAgICAgICBkZWZlciA9ICQuRGVmZXJyZWQoKSxcclxuICAgICAgICBwcm9taXNlID0gZGVmZXIucHJvbWlzZSgpLFxyXG4gICAgICAgIHJlcU5hbWUsXHJcbiAgICAgICAgc29ja2V0O1xyXG5cclxuICAgIG9wdHMuZGF0YSA9IG9wdHMuZGF0YSB8fCBtb2RlbC50b0pTT04ob3B0aW9ucyk7XHJcblxyXG4gICAgc29ja2V0ID0gb3B0cy5zb2NrZXQgfHwgbW9kZWwuc29ja2V0O1xyXG4gICAgcmVxTmFtZSA9IHNvY2tldC5yZXF1ZXN0TmFtZSArIFwiOlwiICsgbWV0aG9kO1xyXG5cclxuICAgIHNvY2tldC5pby5vbmNlKHJlcU5hbWUsIGZ1bmN0aW9uIChyZXMpIHtcclxuICAgICAgICB2YXIgc3VjY2VzcyA9IChyZXMgJiYgcmVzLnN1Y2Nlc3MpOyAvLyBFeHBlY3RzIHNlcnZlciBqc29uIHJlc3BvbnNlIHRvIGNvbnRhaW4gYSBib29sZWFuICdzdWNjZXNzJyBmaWVsZFxyXG4gICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24ob3B0aW9ucy5zdWNjZXNzKSkgb3B0aW9ucy5zdWNjZXNzKHJlcy5kYXRhKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShyZXMpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24ob3B0aW9ucy5lcnJvcikpIG9wdGlvbnMuZXJyb3IobW9kZWwsIHJlcyk7XHJcbiAgICAgICAgZGVmZXIucmVqZWN0KHJlcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzb2NrZXQuaW8uZW1pdChyZXFOYW1lLCBtb2RlbC51c2VyTmFtZSwgb3B0cy5kYXRhKTtcclxuICAgIG1vZGVsLnRyaWdnZXIoJ3JlcXVlc3QnLCBtb2RlbCwgcHJvbWlzZSwgb3B0cyk7XHJcblxyXG4gICAgcmV0dXJuIHByb21pc2U7XHJcbn07XHJcblxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gbG9jYWxTeW5jXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgbG9jYWxTeW5jID0gZnVuY3Rpb24gKG1ldGhvZCwgbW9kZWwsIG9wdGlvbnMpIHtcclxuXHJcbiAgICB2YXIgc3RvcmUgPSBtb2RlbC5sb2NhbFN0b3JhZ2UgfHwgbW9kZWwuY29sbGVjdGlvbi5sb2NhbFN0b3JhZ2U7XHJcblxyXG4gICAgdmFyIHJlc3AsIGVycm9yTWVzc2FnZSwgc3luY0RmZCA9ICQuRGVmZXJyZWQgJiYgJC5EZWZlcnJlZCgpOyAvL0lmICQgaXMgaGF2aW5nIERlZmVycmVkIC0gdXNlIGl0LlxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgc3dpdGNoIChtZXRob2QpIHtcclxuICAgICAgICAgICAgY2FzZSBcInJlYWRcIjpcclxuICAgICAgICAgICAgICAgIHJlc3AgPSBtb2RlbC5pZCAhPT0gdW5kZWZpbmVkID8gc3RvcmUuZmluZChtb2RlbCkgOiBzdG9yZS5maW5kQWxsKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXNwID0gc3RvcmUuY3JlYXRlKG1vZGVsKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwidXBkYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXNwID0gbW9kZWwuaWQgIT09IHVuZGVmaW5lZCA/IHN0b3JlLnVwZGF0ZShtb2RlbCkgOiBzdG9yZS51cGRhdGVCdWxrKG1vZGVsLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiZGVsZXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXNwID0gbW9kZWwuaWQgIT09IHVuZGVmaW5lZCA/IHN0b3JlLmRlc3Ryb3kobW9kZWwpIDogc3RvcmUuZGVzdHJveUFsbChtb2RlbCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gXCJQcml2YXRlIGJyb3dzaW5nIGlzIHVuc3VwcG9ydGVkXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaWYgKHJlc3ApIHtcclxuICAgICAgICBtb2RlbC50cmlnZ2VyKFwic3luY1wiLCBtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgIGlmIChCYWNrYm9uZS5WRVJTSU9OID09PSBcIjAuOS4xMFwiKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MobW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKHJlc3ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3luY0RmZCkge1xyXG4gICAgICAgICAgICBzeW5jRGZkLnJlc29sdmUocmVzcCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlcnJvck1lc3NhZ2UgPSBlcnJvck1lc3NhZ2UgPyBlcnJvck1lc3NhZ2UgOiBcIlJlY29yZCBOb3QgRm91bmRcIjtcclxuXHJcbiAgICAgICAgbW9kZWwudHJpZ2dlcihcImVycm9yXCIsIG1vZGVsLCBlcnJvck1lc3NhZ2UsIG9wdGlvbnMpO1xyXG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZXJyb3IpIHtcclxuICAgICAgICAgICAgaWYgKEJhY2tib25lLlZFUlNJT04gPT09IFwiMC45LjEwXCIpIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IobW9kZWwsIGVycm9yTWVzc2FnZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLmVycm9yKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN5bmNEZmQpIHtcclxuICAgICAgICAgICAgc3luY0RmZC5yZWplY3QoZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5jb21wbGV0ZSkge1xyXG4gICAgICAgIG9wdGlvbnMuY29tcGxldGUocmVzcCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN5bmNEZmQgJiYgc3luY0RmZC5wcm9taXNlKCk7XHJcbn07XHJcblxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gT3ZlcnJpZGUgQmFja2JvbmUuc3luY1xyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxudmFyIGFqYXhTeW5jID0gQmFja2JvbmUuc3luYztcclxuXHJcbnZhciBnZXRTeW5jTWV0aG9kID0gZnVuY3Rpb24gKG1vZGVsKSB7XHJcbiAgICBpZiAobW9kZWwubG9jYWxTdG9yYWdlIHx8IChtb2RlbC5jb2xsZWN0aW9uICYmIG1vZGVsLmNvbGxlY3Rpb24ubG9jYWxTdG9yYWdlKSkge1xyXG4gICAgICAgIHJldHVybiBsb2NhbFN5bmM7XHJcbiAgICB9XHJcbiAgICBpZiAobW9kZWwuc29ja2V0IHx8IChtb2RlbC5jb2xsZWN0aW9uICYmIG1vZGVsLmNvbGxlY3Rpb24uc29ja2V0KSkge1xyXG4gICAgICAgIHJldHVybiBzb2NrZXRTeW5jO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFqYXhTeW5jO1xyXG59O1xyXG5cclxuQmFja2JvbmUuc3luYyA9IGZ1bmN0aW9uIChtZXRob2QsIG1vZGVsLCBvcHRpb25zKSB7XHJcbiAgICBnZXRTeW5jTWV0aG9kKG1vZGVsKS5hcHBseSh0aGlzLCBbbWV0aG9kLCBtb2RlbCwgb3B0aW9uc10pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5TeW5jO1xyXG4iLCIgICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBhZGQgLSBhbiBhbHRlcm5hdGl2ZSB0byByZWdpb24uc2hvdygpLCBkb2Vzbid0IG5vdCByZW1vdmUgcGVybWFuZW50IHZpZXdzXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBNYXJpb25ldHRlLlJlZ2lvbi5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24odmlldywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgaWYoXy5pc09iamVjdCh2aWV3KSAmJiAhXy5pc0VtcHR5KHZpZXcuY2lkKSl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZpZXdzID0gdGhpcy52aWV3cyB8fCB7fTtcclxuICAgICAgICAgICAgdGhpcy5fZW5zdXJlRWxlbWVudCgpO1xyXG4gICAgICAgICAgICB0aGlzLmNsZWFuKHZpZXcuY2lkKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5faGFzVmlldyh2aWV3KSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYWRkVmlldyh2aWV3KTtcclxuICAgICAgICAgICAgICAgIHZpZXcucmVuZGVyKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRlbC5hcHBlbmQodmlldy5lbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKG9wdGlvbnMuaGlkZU90aGVyVmlld3Mpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd1ZpZXcodmlldyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIE1hcmlvbmV0dGUudHJpZ2dlck1ldGhvZC5jYWxsKHZpZXcsIFwic2hvd1wiKTtcclxuICAgICAgICAgICAgTWFyaW9uZXR0ZS50cmlnZ2VyTWV0aG9kLmNhbGwodGhpcywgXCJzaG93XCIsIHZpZXcpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgTWFyaW9uZXR0ZS5SZWdpb24ucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24oY3VyclZpZXdJZCkge1xyXG5cclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy52aWV3cykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHZpZXcgPSB0aGlzLnZpZXdzW2tleV07XHJcblxyXG4gICAgICAgICAgICBpZiAodmlldyAmJiAhdmlldy5pc1Blcm1hbmVudCAmJiAhdmlldy5pc0Rlc3Ryb3llZCAmJiB2aWV3LmNpZCAhPT0gY3VyclZpZXdJZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHZpZXcuZGVzdHJveSkge3ZpZXcuZGVzdHJveSgpO31cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZpZXcucmVtb3ZlKSB7dmlldy5yZW1vdmUoKTt9XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy52aWV3c1trZXldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBNYXJpb25ldHRlLlJlZ2lvbi5wcm90b3R5cGUuX2hhc1ZpZXcgPSBmdW5jdGlvbiAodmlldykge1xyXG5cclxuICAgICAgICByZXR1cm4gXy5pc09iamVjdCh0aGlzLnZpZXdzW3ZpZXcuY2lkXSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIE1hcmlvbmV0dGUuUmVnaW9uLnByb3RvdHlwZS5fYWRkVmlldyA9IGZ1bmN0aW9uKHZpZXcpe1xyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy52aWV3c1t2aWV3LmNpZF0gPSB2aWV3O1xyXG5cclxuICAgICAgICB0aGlzLmxpc3RlblRvKHZpZXcsIFwiZGVzdHJveVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGF0LnZpZXdzW3ZpZXcuY2lkXTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgTWFyaW9uZXR0ZS5SZWdpb24ucHJvdG90eXBlLl9zaG93VmlldyA9IGZ1bmN0aW9uICh2aWV3LG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMudmlld3MpIHtcclxuICAgICAgICAgICAgdmFyIF92aWV3ID0gdGhpcy52aWV3c1trZXldO1xyXG4gICAgICAgICAgICBpZiAoX3ZpZXcuY2lkICE9PSB2aWV3LmNpZCkge1xyXG4gICAgICAgICAgICAgICAgX3ZpZXcuJGVsLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB2aWV3LiRlbC5zaG93KCk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIG92ZXJyaWRlIGRlc3Ryb3kgLSBjYWxsZWQgYnkgcmVnaW9uLnNob3coKVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdmFyIF9vcmlnaW5hbERlc3Ryb3kgPSBNYXJpb25ldHRlLlJlZ2lvbi5wcm90b3R5cGUuZGVzdHJveTtcclxuXHJcbiAgICBNYXJpb25ldHRlLlJlZ2lvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgX29yaWdpbmFsRGVzdHJveS5hcHBseSh0aGlzLCBbXS5zbGljZS5hcHBseShhcmd1bWVudHMpKTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMudmlld3MpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciB2aWV3ID0gdGhpcy52aWV3c1trZXldO1xyXG5cclxuICAgICAgICAgICAgaWYoXy5pc09iamVjdCh2aWV3KSl7XHJcbiAgICAgICAgICAgICAgICBpZiAodmlldy5kZXN0cm95KSB7dmlldy5kZXN0cm95KCk7fVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodmlldy5yZW1vdmUpIHt2aWV3LnJlbW92ZSgpO31cclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnZpZXdzW2tleV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gTWFyaW9uZXR0ZTtcclxuIiwiICAgICAgICB2YXIgYXJyYXlzLCBiYXNpY09iamVjdHMsIGRlZXBDbG9uZSwgZGVlcEV4dGVuZCwgZGVlcEV4dGVuZENvdXBsZSwgaXNCYXNpY09iamVjdCxcclxuICAgICAgICAgICAgX19zbGljZSA9IFtdLnNsaWNlO1xyXG5cclxuXHJcbiAgICAgICAgZGVlcENsb25lID0gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgICAgICB2YXIgZnVuYywgaXNBcnI7XHJcbiAgICAgICAgICAgIGlmICghXy5pc09iamVjdChvYmopIHx8IF8uaXNGdW5jdGlvbihvYmopKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBCYWNrYm9uZS5Db2xsZWN0aW9uIHx8IG9iaiBpbnN0YW5jZW9mIEJhY2tib25lLk1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChfLmlzRGF0ZShvYmopKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGUob2JqLmdldFRpbWUoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKF8uaXNSZWdFeHAob2JqKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAob2JqLnNvdXJjZSwgb2JqLnRvU3RyaW5nKCkucmVwbGFjZSgvLipcXC8vLCBcIlwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaXNBcnIgPSBfLmlzQXJyYXkob2JqIHx8IF8uaXNBcmd1bWVudHMob2JqKSk7XHJcbiAgICAgICAgICAgIGZ1bmMgPSBmdW5jdGlvbiAobWVtbywgdmFsdWUsIGtleSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWVtby5wdXNoKGRlZXBDbG9uZSh2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtZW1vW2tleV0gPSBkZWVwQ2xvbmUodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lbW87XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJldHVybiBfLnJlZHVjZShvYmosIGZ1bmMsIGlzQXJyID8gW10gOiB7fSk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIGlzQmFzaWNPYmplY3QgPSBmdW5jdGlvbiAob2JqZWN0KSB7XHJcbiAgICAgICAgICAgIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICByZXR1cm4gKG9iamVjdC5wcm90b3R5cGUgPT09IHt9LnByb3RvdHlwZSB8fCBvYmplY3QucHJvdG90eXBlID09PSBPYmplY3QucHJvdG90eXBlKSAmJiBfLmlzT2JqZWN0KG9iamVjdCkgJiYgIV8uaXNBcnJheShvYmplY3QpICYmICFfLmlzRnVuY3Rpb24ob2JqZWN0KSAmJiAhXy5pc0RhdGUob2JqZWN0KSAmJiAhXy5pc1JlZ0V4cChvYmplY3QpICYmICFfLmlzQXJndW1lbnRzKG9iamVjdCk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIGJhc2ljT2JqZWN0cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZmlsdGVyKF8ua2V5cyhvYmplY3QpLCBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNCYXNpY09iamVjdChvYmplY3Rba2V5XSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICBhcnJheXMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmZpbHRlcihfLmtleXMob2JqZWN0KSwgZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uaXNBcnJheShvYmplY3Rba2V5XSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICBkZWVwRXh0ZW5kQ291cGxlID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uLCBzb3VyY2UsIG1heERlcHRoKSB7XHJcbiAgICAgICAgICAgIHZhciBjb21iaW5lLCByZWN1cnNlLCBzaGFyZWRBcnJheUtleSwgc2hhcmVkQXJyYXlLZXlzLCBzaGFyZWRPYmplY3RLZXksIHNoYXJlZE9iamVjdEtleXMsIF9pLCBfaiwgX2xlbiwgX2xlbjE7XHJcbiAgICAgICAgICAgIGlmIChtYXhEZXB0aCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBtYXhEZXB0aCA9IDIwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChtYXhEZXB0aCA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ18uZGVlcEV4dGVuZCgpOiBNYXhpbXVtIGRlcHRoIG9mIHJlY3Vyc2lvbiBoaXQuJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5leHRlbmQoZGVzdGluYXRpb24sIHNvdXJjZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2hhcmVkT2JqZWN0S2V5cyA9IF8uaW50ZXJzZWN0aW9uKGJhc2ljT2JqZWN0cyhkZXN0aW5hdGlvbiksIGJhc2ljT2JqZWN0cyhzb3VyY2UpKTtcclxuICAgICAgICAgICAgcmVjdXJzZSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgICAgIHNvdXJjZVtrZXldID0gZGVlcEV4dGVuZENvdXBsZShkZXN0aW5hdGlvbltrZXldLCBzb3VyY2Vba2V5XSwgbWF4RGVwdGggLSAxKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzb3VyY2Vba2V5XTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBzaGFyZWRPYmplY3RLZXlzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBzaGFyZWRPYmplY3RLZXkgPSBzaGFyZWRPYmplY3RLZXlzW19pXTtcclxuICAgICAgICAgICAgICAgIHJlY3Vyc2Uoc2hhcmVkT2JqZWN0S2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzaGFyZWRBcnJheUtleXMgPSBfLmludGVyc2VjdGlvbihhcnJheXMoZGVzdGluYXRpb24pLCBhcnJheXMoc291cmNlKSk7XHJcbiAgICAgICAgICAgIGNvbWJpbmUgPSBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2Vba2V5XSA9IF8udW5pb24oZGVzdGluYXRpb25ba2V5XSwgc291cmNlW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvdXJjZVtrZXldO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBzaGFyZWRBcnJheUtleXMubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XHJcbiAgICAgICAgICAgICAgICBzaGFyZWRBcnJheUtleSA9IHNoYXJlZEFycmF5S2V5c1tfal07XHJcbiAgICAgICAgICAgICAgICBjb21iaW5lKHNoYXJlZEFycmF5S2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXy5leHRlbmQoZGVzdGluYXRpb24sIHNvdXJjZSk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIGRlZXBFeHRlbmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBmaW5hbE9iaiwgbWF4RGVwdGgsIG9iamVjdHMsIF9pO1xyXG4gICAgICAgICAgICBvYmplY3RzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgX2kgPSBhcmd1bWVudHMubGVuZ3RoIC0gMSkgOiAoX2kgPSAwLCBbXSk7XHJcbiAgICAgICAgICAgIG1heERlcHRoID0gYXJndW1lbnRzW19pKytdO1xyXG4gICAgICAgICAgICBpZiAoIV8uaXNOdW1iZXIobWF4RGVwdGgpKSB7XHJcbiAgICAgICAgICAgICAgICBvYmplY3RzLnB1c2gobWF4RGVwdGgpO1xyXG4gICAgICAgICAgICAgICAgbWF4RGVwdGggPSAyMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob2JqZWN0cy5sZW5ndGggPD0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdHNbMF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG1heERlcHRoIDw9IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmV4dGVuZC5hcHBseSh0aGlzLCBvYmplY3RzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmaW5hbE9iaiA9IG9iamVjdHMuc2hpZnQoKTtcclxuICAgICAgICAgICAgd2hpbGUgKG9iamVjdHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgZmluYWxPYmogPSBkZWVwRXh0ZW5kQ291cGxlKGZpbmFsT2JqLCBkZWVwQ2xvbmUob2JqZWN0cy5zaGlmdCgpKSwgbWF4RGVwdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmaW5hbE9iajtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgXy5taXhpbih7XHJcbiAgICAgICAgICAgIGRlZXBDbG9uZTpkZWVwQ2xvbmUsXHJcbiAgICAgICAgICAgIGlzQmFzaWNPYmplY3Q6aXNCYXNpY09iamVjdCxcclxuICAgICAgICAgICAgYmFzaWNPYmplY3RzOmJhc2ljT2JqZWN0cyxcclxuICAgICAgICAgICAgYXJyYXlzOmFycmF5cyxcclxuICAgICAgICAgICAgZGVlcEV4dGVuZDpkZWVwRXh0ZW5kXHJcbiAgICAgICAgfSk7XHJcbiIsIi8qIVxyXG4gKiBqUXVlcnkgb3V0c2lkZSBldmVudHMgLSB2MS4xIC0gMy8xNi8yMDEwXHJcbiAqIGh0dHA6Ly9iZW5hbG1hbi5jb20vcHJvamVjdHMvanF1ZXJ5LW91dHNpZGUtZXZlbnRzLXBsdWdpbi9cclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDEwIFwiQ293Ym95XCIgQmVuIEFsbWFuXHJcbiAqIER1YWwgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIGxpY2Vuc2VzLlxyXG4gKiBodHRwOi8vYmVuYWxtYW4uY29tL2Fib3V0L2xpY2Vuc2UvXHJcbiAqL1xyXG5cclxuLy8gU2NyaXB0OiBqUXVlcnkgb3V0c2lkZSBldmVudHNcclxuLy9cclxuLy8gKlZlcnNpb246IDEuMSwgTGFzdCB1cGRhdGVkOiAzLzE2LzIwMTAqXHJcbi8vXHJcbi8vIFByb2plY3QgSG9tZSAtIGh0dHA6Ly9iZW5hbG1hbi5jb20vcHJvamVjdHMvanF1ZXJ5LW91dHNpZGUtZXZlbnRzLXBsdWdpbi9cclxuLy8gR2l0SHViICAgICAgIC0gaHR0cDovL2dpdGh1Yi5jb20vY293Ym95L2pxdWVyeS1vdXRzaWRlLWV2ZW50cy9cclxuLy8gU291cmNlICAgICAgIC0gaHR0cDovL2dpdGh1Yi5jb20vY293Ym95L2pxdWVyeS1vdXRzaWRlLWV2ZW50cy9yYXcvbWFzdGVyL2pxdWVyeS5iYS1vdXRzaWRlLWV2ZW50cy5qc1xyXG4vLyAoTWluaWZpZWQpICAgLSBodHRwOi8vZ2l0aHViLmNvbS9jb3dib3kvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL3Jhdy9tYXN0ZXIvanF1ZXJ5LmJhLW91dHNpZGUtZXZlbnRzLm1pbi5qcyAoMC45a2IpXHJcbi8vXHJcbi8vIEFib3V0OiBMaWNlbnNlXHJcbi8vXHJcbi8vIENvcHlyaWdodCAoYykgMjAxMCBcIkNvd2JveVwiIEJlbiBBbG1hbixcclxuLy8gRHVhbCBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgbGljZW5zZXMuXHJcbi8vIGh0dHA6Ly9iZW5hbG1hbi5jb20vYWJvdXQvbGljZW5zZS9cclxuLy9cclxuLy8gQWJvdXQ6IEV4YW1wbGVzXHJcbi8vXHJcbi8vIFRoZXNlIHdvcmtpbmcgZXhhbXBsZXMsIGNvbXBsZXRlIHdpdGggZnVsbHkgY29tbWVudGVkIGNvZGUsIGlsbHVzdHJhdGUgYSBmZXdcclxuLy8gd2F5cyBpbiB3aGljaCB0aGlzIHBsdWdpbiBjYW4gYmUgdXNlZC5cclxuLy9cclxuLy8gY2xpY2tvdXRzaWRlIC0gaHR0cDovL2JlbmFsbWFuLmNvbS9jb2RlL3Byb2plY3RzL2pxdWVyeS1vdXRzaWRlLWV2ZW50cy9leGFtcGxlcy9jbGlja291dHNpZGUvXHJcbi8vIGRibGNsaWNrb3V0c2lkZSAtIGh0dHA6Ly9iZW5hbG1hbi5jb20vY29kZS9wcm9qZWN0cy9qcXVlcnktb3V0c2lkZS1ldmVudHMvZXhhbXBsZXMvZGJsY2xpY2tvdXRzaWRlL1xyXG4vLyBtb3VzZW92ZXJvdXRzaWRlIC0gaHR0cDovL2JlbmFsbWFuLmNvbS9jb2RlL3Byb2plY3RzL2pxdWVyeS1vdXRzaWRlLWV2ZW50cy9leGFtcGxlcy9tb3VzZW92ZXJvdXRzaWRlL1xyXG4vLyBmb2N1c291dHNpZGUgLSBodHRwOi8vYmVuYWxtYW4uY29tL2NvZGUvcHJvamVjdHMvanF1ZXJ5LW91dHNpZGUtZXZlbnRzL2V4YW1wbGVzL2ZvY3Vzb3V0c2lkZS9cclxuLy9cclxuLy8gQWJvdXQ6IFN1cHBvcnQgYW5kIFRlc3RpbmdcclxuLy9cclxuLy8gSW5mb3JtYXRpb24gYWJvdXQgd2hhdCB2ZXJzaW9uIG9yIHZlcnNpb25zIG9mIGpRdWVyeSB0aGlzIHBsdWdpbiBoYXMgYmVlblxyXG4vLyB0ZXN0ZWQgd2l0aCwgd2hhdCBicm93c2VycyBpdCBoYXMgYmVlbiB0ZXN0ZWQgaW4sIGFuZCB3aGVyZSB0aGUgdW5pdCB0ZXN0c1xyXG4vLyByZXNpZGUgKHNvIHlvdSBjYW4gdGVzdCBpdCB5b3Vyc2VsZikuXHJcbi8vXHJcbi8vIGpRdWVyeSBWZXJzaW9ucyAtIDEuNC4yXHJcbi8vIEJyb3dzZXJzIFRlc3RlZCAtIEludGVybmV0IEV4cGxvcmVyIDYtOCwgRmlyZWZveCAyLTMuNiwgU2FmYXJpIDMtNCwgQ2hyb21lLCBPcGVyYSA5LjYtMTAuMS5cclxuLy8gVW5pdCBUZXN0cyAgICAgIC0gaHR0cDovL2JlbmFsbWFuLmNvbS9jb2RlL3Byb2plY3RzL2pxdWVyeS1vdXRzaWRlLWV2ZW50cy91bml0L1xyXG4vL1xyXG4vLyBBYm91dDogUmVsZWFzZSBIaXN0b3J5XHJcbi8vXHJcbi8vIDEuMSAtICgzLzE2LzIwMTApIE1hZGUgXCJjbGlja291dHNpZGVcIiBwbHVnaW4gbW9yZSBnZW5lcmFsLCByZXN1bHRpbmcgaW4gYVxyXG4vLyAgICAgICB3aG9sZSBuZXcgcGx1Z2luIHdpdGggbW9yZSB0aGFuIGEgZG96ZW4gZGVmYXVsdCBcIm91dHNpZGVcIiBldmVudHMgYW5kXHJcbi8vICAgICAgIGEgbWV0aG9kIHRoYXQgY2FuIGJlIHVzZWQgdG8gYWRkIG5ldyBvbmVzLlxyXG4vLyAxLjAgLSAoMi8yNy8yMDEwKSBJbml0aWFsIHJlbGVhc2VcclxuLy9cclxuLy8gVG9waWM6IERlZmF1bHQgXCJvdXRzaWRlXCIgZXZlbnRzXHJcbi8vXHJcbi8vIE5vdGUgdGhhdCBlYWNoIFwib3V0c2lkZVwiIGV2ZW50IGlzIHBvd2VyZWQgYnkgYW4gXCJvcmlnaW5hdGluZ1wiIGV2ZW50LiBPbmx5XHJcbi8vIHdoZW4gdGhlIG9yaWdpbmF0aW5nIGV2ZW50IGlzIHRyaWdnZXJlZCBvbiBhbiBlbGVtZW50IG91dHNpZGUgdGhlIGVsZW1lbnRcclxuLy8gdG8gd2hpY2ggdGhhdCBvdXRzaWRlIGV2ZW50IGlzIGJvdW5kIHdpbGwgdGhlIGJvdW5kIGV2ZW50IGJlIHRyaWdnZXJlZC5cclxuLy9cclxuLy8gQmVjYXVzZSBlYWNoIG91dHNpZGUgZXZlbnQgaXMgcG93ZXJlZCBieSBhIHNlcGFyYXRlIG9yaWdpbmF0aW5nIGV2ZW50LFxyXG4vLyBzdG9wcGluZyBwcm9wYWdhdGlvbiBvZiB0aGF0IG9yaWdpbmF0aW5nIGV2ZW50IHdpbGwgcHJldmVudCBpdHMgcmVsYXRlZFxyXG4vLyBvdXRzaWRlIGV2ZW50IGZyb20gdHJpZ2dlcmluZy5cclxuLy9cclxuLy8gIE9VVFNJREUgRVZFTlQgICAgIC0gT1JJR0lOQVRJTkcgRVZFTlRcclxuLy8gIGNsaWNrb3V0c2lkZSAgICAgIC0gY2xpY2tcclxuLy8gIGRibGNsaWNrb3V0c2lkZSAgIC0gZGJsY2xpY2tcclxuLy8gIGZvY3Vzb3V0c2lkZSAgICAgIC0gZm9jdXNpblxyXG4vLyAgYmx1cm91dHNpZGUgICAgICAgLSBmb2N1c291dFxyXG4vLyAgbW91c2Vtb3Zlb3V0c2lkZSAgLSBtb3VzZW1vdmVcclxuLy8gIG1vdXNlZG93bm91dHNpZGUgIC0gbW91c2Vkb3duXHJcbi8vICBtb3VzZXVwb3V0c2lkZSAgICAtIG1vdXNldXBcclxuLy8gIG1vdXNlb3Zlcm91dHNpZGUgIC0gbW91c2VvdmVyXHJcbi8vICBtb3VzZW91dG91dHNpZGUgICAtIG1vdXNlb3V0XHJcbi8vICBrZXlkb3dub3V0c2lkZSAgICAtIGtleWRvd25cclxuLy8gIGtleXByZXNzb3V0c2lkZSAgIC0ga2V5cHJlc3NcclxuLy8gIGtleXVwb3V0c2lkZSAgICAgIC0ga2V5dXBcclxuLy8gIGNoYW5nZW91dHNpZGUgICAgIC0gY2hhbmdlXHJcbi8vICBzZWxlY3RvdXRzaWRlICAgICAtIHNlbGVjdFxyXG4vLyAgc3VibWl0b3V0c2lkZSAgICAgLSBzdWJtaXRcclxuXHJcblxyXG52YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4oZnVuY3Rpb24oJCxkb2Msb3V0c2lkZSl7XHJcbiAgJyQ6bm9tdW5nZSc7IC8vIFVzZWQgYnkgWVVJIGNvbXByZXNzb3IuXHJcblxyXG4gICQubWFwKFxyXG4gICAgLy8gQWxsIHRoZXNlIGV2ZW50cyB3aWxsIGdldCBhbiBcIm91dHNpZGVcIiBldmVudCBjb3VudGVycGFydCBieSBkZWZhdWx0LlxyXG4gICAgJ2NsaWNrIGRibGNsaWNrIG1vdXNlbW92ZSBtb3VzZWRvd24gbW91c2V1cCBtb3VzZW92ZXIgbW91c2VvdXQgY2hhbmdlIHNlbGVjdCBzdWJtaXQga2V5ZG93biBrZXlwcmVzcyBrZXl1cCcuc3BsaXQoJyAnKSxcclxuICAgIGZ1bmN0aW9uKCBldmVudF9uYW1lICkgeyBqcV9hZGRPdXRzaWRlRXZlbnQoIGV2ZW50X25hbWUgKTsgfVxyXG4gICk7XHJcblxyXG4gIC8vIFRoZSBmb2N1cyBhbmQgYmx1ciBldmVudHMgYXJlIHJlYWxseSBmb2N1c2luIGFuZCBmb2N1c291dCB3aGVuIGl0IGNvbWVzXHJcbiAgLy8gdG8gZGVsZWdhdGlvbiwgc28gdGhleSBhcmUgYSBzcGVjaWFsIGNhc2UuXHJcbiAganFfYWRkT3V0c2lkZUV2ZW50KCAnZm9jdXNpbicsICAnZm9jdXMnICsgb3V0c2lkZSApO1xyXG4gIGpxX2FkZE91dHNpZGVFdmVudCggJ2ZvY3Vzb3V0JywgJ2JsdXInICsgb3V0c2lkZSApO1xyXG5cclxuICAvLyBNZXRob2Q6IGpRdWVyeS5hZGRPdXRzaWRlRXZlbnRcclxuICAvL1xyXG4gIC8vIFJlZ2lzdGVyIGEgbmV3IFwib3V0c2lkZVwiIGV2ZW50IHRvIGJlIHdpdGggdGhpcyBtZXRob2QuIEFkZGluZyBhbiBvdXRzaWRlXHJcbiAgLy8gZXZlbnQgdGhhdCBhbHJlYWR5IGV4aXN0cyB3aWxsIHByb2JhYmx5IGJsb3cgdGhpbmdzIHVwLCBzbyBjaGVjayB0aGVcclxuICAvLyA8RGVmYXVsdCBcIm91dHNpZGVcIiBldmVudHM+IGxpc3QgYmVmb3JlIHRyeWluZyB0byBhZGQgYSBuZXcgb25lLlxyXG4gIC8vXHJcbiAgLy8gVXNhZ2U6XHJcbiAgLy9cclxuICAvLyA+IGpRdWVyeS5hZGRPdXRzaWRlRXZlbnQoIGV2ZW50X25hbWUgWywgb3V0c2lkZV9ldmVudF9uYW1lIF0gKTtcclxuICAvL1xyXG4gIC8vIEFyZ3VtZW50czpcclxuICAvL1xyXG4gIC8vICBldmVudF9uYW1lIC0gKFN0cmluZykgVGhlIG5hbWUgb2YgdGhlIG9yaWdpbmF0aW5nIGV2ZW50IHRoYXQgdGhlIG5ld1xyXG4gIC8vICAgIFwib3V0c2lkZVwiIGV2ZW50IHdpbGwgYmUgcG93ZXJlZCBieS4gVGhpcyBldmVudCBjYW4gYmUgYSBuYXRpdmUgb3JcclxuICAvLyAgICBjdXN0b20gZXZlbnQsIGFzIGxvbmcgYXMgaXQgYnViYmxlcyB1cCB0aGUgRE9NIHRyZWUuXHJcbiAgLy8gIG91dHNpZGVfZXZlbnRfbmFtZSAtIChTdHJpbmcpIEFuIG9wdGlvbmFsIG5hbWUgZm9yIHRoZSBuZXcgXCJvdXRzaWRlXCJcclxuICAvLyAgICBldmVudC4gSWYgb21pdHRlZCwgdGhlIG91dHNpZGUgZXZlbnQgd2lsbCBiZSBuYW1lZCB3aGF0ZXZlciB0aGVcclxuICAvLyAgICB2YWx1ZSBvZiBgZXZlbnRfbmFtZWAgaXMgcGx1cyB0aGUgXCJvdXRzaWRlXCIgc3VmZml4LlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJuczpcclxuICAvL1xyXG4gIC8vICBOb3RoaW5nLlxyXG5cclxuICAkLmFkZE91dHNpZGVFdmVudCA9IGpxX2FkZE91dHNpZGVFdmVudDtcclxuXHJcbiAgZnVuY3Rpb24ganFfYWRkT3V0c2lkZUV2ZW50KCBldmVudF9uYW1lLCBvdXRzaWRlX2V2ZW50X25hbWUgKSB7XHJcblxyXG4gICAgLy8gVGhlIFwib3V0c2lkZVwiIGV2ZW50IG5hbWUuXHJcbiAgICBvdXRzaWRlX2V2ZW50X25hbWUgPSBvdXRzaWRlX2V2ZW50X25hbWUgfHwgZXZlbnRfbmFtZSArIG91dHNpZGU7XHJcblxyXG4gICAgLy8gQSBqUXVlcnkgb2JqZWN0IGNvbnRhaW5pbmcgYWxsIGVsZW1lbnRzIHRvIHdoaWNoIHRoZSBcIm91dHNpZGVcIiBldmVudCBpc1xyXG4gICAgLy8gYm91bmQuXHJcbiAgICB2YXIgZWxlbXMgPSAkKCksXHJcblxyXG4gICAgICAvLyBUaGUgXCJvcmlnaW5hdGluZ1wiIGV2ZW50LCBuYW1lc3BhY2VkIGZvciBlYXN5IHVuYmluZGluZy5cclxuICAgICAgZXZlbnRfbmFtZXNwYWNlZCA9IGV2ZW50X25hbWUgKyAnLicgKyBvdXRzaWRlX2V2ZW50X25hbWUgKyAnLXNwZWNpYWwtZXZlbnQnO1xyXG5cclxuICAgIC8vIEV2ZW50OiBvdXRzaWRlIGV2ZW50c1xyXG4gICAgLy9cclxuICAgIC8vIEFuIFwib3V0c2lkZVwiIGV2ZW50IGlzIHRyaWdnZXJlZCBvbiBhbiBlbGVtZW50IHdoZW4gaXRzIGNvcnJlc3BvbmRpbmdcclxuICAgIC8vIFwib3JpZ2luYXRpbmdcIiBldmVudCBpcyB0cmlnZ2VyZWQgb24gYW4gZWxlbWVudCBvdXRzaWRlIHRoZSBlbGVtZW50IGluXHJcbiAgICAvLyBxdWVzdGlvbi4gU2VlIHRoZSA8RGVmYXVsdCBcIm91dHNpZGVcIiBldmVudHM+IGxpc3QgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICAvL1xyXG4gICAgLy8gVXNhZ2U6XHJcbiAgICAvL1xyXG4gICAgLy8gPiBqUXVlcnkoJ3NlbGVjdG9yJykuYmluZCggJ2NsaWNrb3V0c2lkZScsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAvLyA+ICAgdmFyIGNsaWNrZWRfZWxlbSA9ICQoZXZlbnQudGFyZ2V0KTtcclxuICAgIC8vID4gICAuLi5cclxuICAgIC8vID4gfSk7XHJcbiAgICAvL1xyXG4gICAgLy8gPiBqUXVlcnkoJ3NlbGVjdG9yJykuYmluZCggJ2RibGNsaWNrb3V0c2lkZScsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAvLyA+ICAgdmFyIGRvdWJsZV9jbGlja2VkX2VsZW0gPSAkKGV2ZW50LnRhcmdldCk7XHJcbiAgICAvLyA+ICAgLi4uXHJcbiAgICAvLyA+IH0pO1xyXG4gICAgLy9cclxuICAgIC8vID4galF1ZXJ5KCdzZWxlY3RvcicpLmJpbmQoICdtb3VzZW92ZXJvdXRzaWRlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIC8vID4gICB2YXIgbW91c2VkX292ZXJfZWxlbSA9ICQoZXZlbnQudGFyZ2V0KTtcclxuICAgIC8vID4gICAuLi5cclxuICAgIC8vID4gfSk7XHJcbiAgICAvL1xyXG4gICAgLy8gPiBqUXVlcnkoJ3NlbGVjdG9yJykuYmluZCggJ2ZvY3Vzb3V0c2lkZScsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAvLyA+ICAgdmFyIGZvY3VzZWRfZWxlbSA9ICQoZXZlbnQudGFyZ2V0KTtcclxuICAgIC8vID4gICAuLi5cclxuICAgIC8vID4gfSk7XHJcbiAgICAvL1xyXG4gICAgLy8gWW91IGdldCB0aGUgaWRlYSwgcmlnaHQ/XHJcblxyXG4gICAgJC5ldmVudC5zcGVjaWFsWyBvdXRzaWRlX2V2ZW50X25hbWUgXSA9IHtcclxuXHJcbiAgICAgIC8vIENhbGxlZCBvbmx5IHdoZW4gdGhlIGZpcnN0IFwib3V0c2lkZVwiIGV2ZW50IGNhbGxiYWNrIGlzIGJvdW5kIHBlclxyXG4gICAgICAvLyBlbGVtZW50LlxyXG4gICAgICBzZXR1cDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgLy8gQWRkIHRoaXMgZWxlbWVudCB0byB0aGUgbGlzdCBvZiBlbGVtZW50cyB0byB3aGljaCB0aGlzIFwib3V0c2lkZVwiXHJcbiAgICAgICAgLy8gZXZlbnQgaXMgYm91bmQuXHJcbiAgICAgICAgZWxlbXMgPSBlbGVtcy5hZGQoIHRoaXMgKTtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgZmlyc3QgZWxlbWVudCBnZXR0aW5nIHRoZSBldmVudCBib3VuZCwgYmluZCBhIGhhbmRsZXJcclxuICAgICAgICAvLyB0byBkb2N1bWVudCB0byBjYXRjaCBhbGwgY29ycmVzcG9uZGluZyBcIm9yaWdpbmF0aW5nXCIgZXZlbnRzLlxyXG4gICAgICAgIGlmICggZWxlbXMubGVuZ3RoID09PSAxICkge1xyXG4gICAgICAgICAgJChkb2MpLmJpbmQoIGV2ZW50X25hbWVzcGFjZWQsIGhhbmRsZV9ldmVudCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIENhbGxlZCBvbmx5IHdoZW4gdGhlIGxhc3QgXCJvdXRzaWRlXCIgZXZlbnQgY2FsbGJhY2sgaXMgdW5ib3VuZCBwZXJcclxuICAgICAgLy8gZWxlbWVudC5cclxuICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0aGlzIGVsZW1lbnQgZnJvbSB0aGUgbGlzdCBvZiBlbGVtZW50cyB0byB3aGljaCB0aGlzXHJcbiAgICAgICAgLy8gXCJvdXRzaWRlXCIgZXZlbnQgaXMgYm91bmQuXHJcbiAgICAgICAgZWxlbXMgPSBlbGVtcy5ub3QoIHRoaXMgKTtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCBlbGVtZW50IHJlbW92ZWQsIHJlbW92ZSB0aGUgXCJvcmlnaW5hdGluZ1wiIGV2ZW50XHJcbiAgICAgICAgLy8gaGFuZGxlciBvbiBkb2N1bWVudCB0aGF0IHBvd2VycyB0aGlzIFwib3V0c2lkZVwiIGV2ZW50LlxyXG4gICAgICAgIGlmICggZWxlbXMubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgJChkb2MpLnVuYmluZCggZXZlbnRfbmFtZXNwYWNlZCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIENhbGxlZCBldmVyeSB0aW1lIGEgXCJvdXRzaWRlXCIgZXZlbnQgY2FsbGJhY2sgaXMgYm91bmQgdG8gYW4gZWxlbWVudC5cclxuICAgICAgYWRkOiBmdW5jdGlvbiggaGFuZGxlT2JqICkge1xyXG4gICAgICAgIHZhciBvbGRfaGFuZGxlciA9IGhhbmRsZU9iai5oYW5kbGVyO1xyXG5cclxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGV2ZXJ5IHRpbWUgdGhlIGV2ZW50IGlzIHRyaWdnZXJlZC4gVGhpcyBpc1xyXG4gICAgICAgIC8vIHVzZWQgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgZXZlbnQudGFyZ2V0IHJlZmVyZW5jZSB3aXRoIG9uZSB0aGF0IGlzXHJcbiAgICAgICAgLy8gbW9yZSB1c2VmdWwuXHJcbiAgICAgICAgaGFuZGxlT2JqLmhhbmRsZXIgPSBmdW5jdGlvbiggZXZlbnQsIGVsZW0gKSB7XHJcblxyXG4gICAgICAgICAgLy8gU2V0IHRoZSBldmVudCBvYmplY3QncyAudGFyZ2V0IHByb3BlcnR5IHRvIHRoZSBlbGVtZW50IHRoYXQgdGhlXHJcbiAgICAgICAgICAvLyB1c2VyIGludGVyYWN0ZWQgd2l0aCwgbm90IHRoZSBlbGVtZW50IHRoYXQgdGhlIFwib3V0c2lkZVwiIGV2ZW50IHdhc1xyXG4gICAgICAgICAgLy8gd2FzIHRyaWdnZXJlZCBvbi5cclxuICAgICAgICAgIGV2ZW50LnRhcmdldCA9IGVsZW07XHJcblxyXG4gICAgICAgICAgLy8gRXhlY3V0ZSB0aGUgYWN0dWFsIGJvdW5kIGhhbmRsZXIuXHJcbiAgICAgICAgICBvbGRfaGFuZGxlci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBXaGVuIHRoZSBcIm9yaWdpbmF0aW5nXCIgZXZlbnQgaXMgdHJpZ2dlcmVkLi5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZV9ldmVudCggZXZlbnQgKSB7XHJcblxyXG4gICAgICAvLyBJdGVyYXRlIG92ZXIgYWxsIGVsZW1lbnRzIHRvIHdoaWNoIHRoaXMgXCJvdXRzaWRlXCIgZXZlbnQgaXMgYm91bmQuXHJcbiAgICAgICQoZWxlbXMpLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgZWxlbSA9ICQodGhpcyk7XHJcblxyXG4gICAgICAgIC8vIElmIHRoaXMgZWxlbWVudCBpc24ndCB0aGUgZWxlbWVudCBvbiB3aGljaCB0aGUgZXZlbnQgd2FzIHRyaWdnZXJlZCxcclxuICAgICAgICAvLyBhbmQgdGhpcyBlbGVtZW50IGRvZXNuJ3QgY29udGFpbiBzYWlkIGVsZW1lbnQsIHRoZW4gc2FpZCBlbGVtZW50IGlzXHJcbiAgICAgICAgLy8gY29uc2lkZXJlZCB0byBiZSBvdXRzaWRlLCBhbmQgdGhlIFwib3V0c2lkZVwiIGV2ZW50IHdpbGwgYmUgdHJpZ2dlcmVkIVxyXG4gICAgICAgIGlmICggdGhpcyAhPT0gZXZlbnQudGFyZ2V0ICYmICFlbGVtLmhhcyhldmVudC50YXJnZXQpLmxlbmd0aCApIHtcclxuXHJcbiAgICAgICAgICAvLyBVc2UgdHJpZ2dlckhhbmRsZXIgaW5zdGVhZCBvZiB0cmlnZ2VyIHNvIHRoYXQgdGhlIFwib3V0c2lkZVwiIGV2ZW50XHJcbiAgICAgICAgICAvLyBkb2Vzbid0IGJ1YmJsZS4gUGFzcyBpbiB0aGUgXCJvcmlnaW5hdGluZ1wiIGV2ZW50J3MgLnRhcmdldCBzbyB0aGF0XHJcbiAgICAgICAgICAvLyB0aGUgXCJvdXRzaWRlXCIgZXZlbnQudGFyZ2V0IGNhbiBiZSBvdmVycmlkZGVuIHdpdGggc29tZXRoaW5nIG1vcmVcclxuICAgICAgICAgIC8vIG1lYW5pbmdmdWwuXHJcbiAgICAgICAgICBlbGVtLnRyaWdnZXJIYW5kbGVyKCBvdXRzaWRlX2V2ZW50X25hbWUsIFsgZXZlbnQudGFyZ2V0IF0gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG59KShqUXVlcnksZG9jdW1lbnQsXCJvdXRzaWRlXCIpOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbihmdW5jdGlvbiAoJCwgd2luZG93LCBkb2N1bWVudCkge1xyXG5cclxuICAgICQuZm4udG9nZ2xlQmxvY2sgPSBmdW5jdGlvbihzaG93KSB7XHJcblxyXG4gICAgICAgIHRoaXMuY3NzKFwiZGlzcGxheVwiLCBzaG93ID8gXCJibG9ja1wiIDogXCJub25lXCIpO1xyXG5cclxuICAgIH07XHJcbn0pKGpRdWVyeSwgd2luZG93LCBkb2N1bWVudCk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGRyb3Bkb3duRGlzcGxheWVyID0gKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAkKCdib2R5Jykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAkKCcuZHJvcGRvd24tc2xpZGVyJykuaGlkZSgpO1xyXG4gICAgICAgICQoXCIuY2xpY2tlZFwiKS5yZW1vdmVDbGFzcyhcImNsaWNrZWRcIik7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkKFwiYm9keVwiKS5vbihcImNsaWNrXCIsIFwiLmJ1dHRvbi5kcm9wZG93blwiLCBmdW5jdGlvbiAoZXYpIHtcclxuXHJcbiAgICAgICAgaWYgKCEkKHRoaXMpLmhhc0NsYXNzKCdjbGlja2VkJykpIHtcclxuICAgICAgICAgICAgJCgnLmRyb3Bkb3duLXNsaWRlcicpLmhpZGUoKTtcclxuICAgICAgICAgICAgJChcIi5jbGlja2VkXCIpLnJlbW92ZUNsYXNzKFwiY2xpY2tlZFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBwYXJlbnRGbG9hdCA9ICQodGhpcykucGFyZW50KCkuY3NzKFwiZmxvYXRcIik7XHJcbiAgICAgICAgdmFyIGRkc0lkID0gZ2V0RHJvcERvd25TbGlkZXJJZCgkKHRoaXMpKTtcclxuXHJcbiAgICAgICAgaWYocGFyZW50RmxvYXQgPT09IFwicmlnaHRcIil7XHJcbiAgICAgICAgICAgICQoJy5kcm9wZG93bi1zbGlkZXIuJyArIGRkc0lkKS5jc3MoXCJyaWdodFwiLCAkKHRoaXMpLnBvc2l0aW9uKCkucmlnaHQpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAkKCcuZHJvcGRvd24tc2xpZGVyLicgKyBkZHNJZCkuY3NzKFwibGVmdFwiLCAkKHRoaXMpLnBvc2l0aW9uKCkubGVmdCk7IC8vIC0gNVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJCgnLmRyb3Bkb3duLXNsaWRlci4nICsgZGRzSWQpLnRvZ2dsZSgpO1xyXG4gICAgICAgICQodGhpcykudG9nZ2xlQ2xhc3MoJ2NsaWNrZWQnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdmFyIGdldERyb3BEb3duU2xpZGVySWQgPSBmdW5jdGlvbiAoYnRuKSB7XHJcblxyXG4gICAgICAgIHZhciBkZHNJZCA9ICcnO1xyXG4gICAgICAgIHZhciBjbGFzc0xpc3QgPSBidG4uYXR0cignY2xhc3MnKS5zcGxpdCgvXFxzKy8pO1xyXG5cclxuICAgICAgICAkLmVhY2goY2xhc3NMaXN0LCBmdW5jdGlvbiAoaW5kZXgsIGl0ZW0pIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW0uaW5kZXhPZignZGRzSWRfJykgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGRkc0lkID0gaXRlbS5yZXBsYWNlKCdkZHNJZF8nLCAnJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZGRzSWQ7XHJcbiAgICB9O1xyXG59KCkpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBGb3JtYXR0ZXIgPSAoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciBmb3JtYXRBZGRyZXNzZXMgPSBmdW5jdGlvbiAodGl0bGVzKSB7XHJcblxyXG4gICAgICAgIHZhciByZXMgPSBcIlwiO1xyXG5cclxuICAgICAgICB0aXRsZXMgPSB0aXRsZXMgfHwgW107XHJcblxyXG4gICAgICAgIGlmICh0aXRsZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aXRsZXNbMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF8uZWFjaCh0aXRsZXMsIGZ1bmN0aW9uICh0aXRsZSkge1xyXG4gICAgICAgICAgICByZXMgKz0gX3Muc3RyTGVmdEJhY2sodGl0bGUsIFwiIFwiKSArIFwiLCBcIjtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIF9zLnN0ckxlZnRCYWNrKHJlcywgXCIsXCIpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgZm9ybWF0U2hvcnREYXRlID0gZnVuY3Rpb24gKHRpY2tzLHRyYW5zbGF0b3IpIHtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNGaW5pdGUodGlja3MpKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShwYXJzZUludCh0aWNrcywgMTApKTtcclxuICAgICAgICAgICAgdmFyIHRpbWVEaWZmID0gTWF0aC5hYnMobm93LmdldFRpbWUoKSAtIGRhdGUuZ2V0VGltZSgpKTtcclxuICAgICAgICAgICAgdmFyIGRpZmZEYXlzID0gTWF0aC5jZWlsKHRpbWVEaWZmIC8gKDEwMDAgKiAzNjAwICogMjQpKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkaWZmRGF5cyA+IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cmFuc2xhdG9yLnRyYW5zbGF0ZShcIm1haWw6dGltZXJhbmdlLm1vbnRocy5cIiArIGRhdGUuZ2V0TW9udGgoKSkgKyBcIiBcIiArIGRhdGUuZ2V0RGF5KCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaG91cnMgPSBkYXRlLmdldEhvdXJzKCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWludXRlcyA9IGRhdGUuZ2V0TWludXRlcygpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFtcG0gPSBob3VycyA+PSAxMiA/ICdwbScgOiAnYW0nO1xyXG5cclxuICAgICAgICAgICAgICAgIGhvdXJzID0gaG91cnMgJSAxMjtcclxuICAgICAgICAgICAgICAgIGhvdXJzID0gaG91cnMgPyBob3VycyA6IDEyOyAvLyB0aGUgaG91ciAnMCcgc2hvdWxkIGJlICcxMidcclxuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBtaW51dGVzIDwgMTAgPyAnMCcgKyBtaW51dGVzIDogbWludXRlcztcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaG91cnMgKyAnOicgKyBtaW51dGVzICsgJyAnICsgYW1wbTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdmFyIGZvcm1hdFN1YmplY3QgPSBmdW5jdGlvbiAoc3ViamVjdCx0cmFuc2xhdG9yKSB7XHJcblxyXG4gICAgICAgIGlmIChfLmlzRW1wdHkoc3ViamVjdCkpIHtcclxuICAgICAgICAgICAgc3ViamVjdCA9IFwiKFwiICsgdHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOm5vc3ViamVjdFwiKSArIFwiKVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc3ViamVjdDtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdmFyIGZvcm1hdENvbnRlbnQgPSBmdW5jdGlvbiAoY29udGVudCkge1xyXG5cclxuICAgICAgICBpZiAoIV8uaXNFbXB0eShjb250ZW50KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gY29udGVudC5yZXBsYWNlKC8oPChbXj5dKyk+KS9pZywgXCIgXCIpLnJlcGxhY2UoLyZuYnNwOy9pZywgXCIgXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY29udGVudDtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBmb3JtYXRTdWJqZWN0OiBmb3JtYXRTdWJqZWN0LFxyXG4gICAgICAgIGZvcm1hdENvbnRlbnQ6IGZvcm1hdENvbnRlbnQsXHJcbiAgICAgICAgZm9ybWF0U2hvcnREYXRlOiBmb3JtYXRTaG9ydERhdGUsXHJcbiAgICAgICAgZm9ybWF0QWRkcmVzc2VzOiBmb3JtYXRBZGRyZXNzZXNcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1hdHRlcjtcclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFRyYW5zbGF0b3IgPSAoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciBkaWN0aW9uYXJ5ID0ge307XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoXCJfaTE4blwiLCBmdW5jdGlvbih0ZXh0KSB7XHJcbiAgICAgICAgcmV0dXJuIHRyYW5zbGF0ZSh0ZXh0KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB2YXIgdXBkYXRlRGljdGlvbmFyeSA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgJC5leHRlbmQoZGljdGlvbmFyeSwgb2JqKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHZhciB0cmFuc2xhdGUgPSBmdW5jdGlvbiAoa2V5KSB7XHJcblxyXG4gICAgICAgIGlmIChfLmlzU3RyaW5nKGtleSkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdWJrZXlzID0ga2V5LnNwbGl0KFwiOlwiKTtcclxuXHJcbiAgICAgICAgICAgIGlmKHN1YmtleXMubGVuZ3RoID09IDIpe1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKF8uaGFzKGRpY3Rpb25hcnksIHN1YmtleXNbMF0pKXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRpY3Rpb25hcnlbc3Via2V5c1swXV1bc3Via2V5c1sxXV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZGljdGlvbmFyeSA6IGRpY3Rpb25hcnksXHJcbiAgICAgICAgdHJhbnNsYXRlIDogdHJhbnNsYXRlLFxyXG4gICAgICAgIHVwZGF0ZURpY3Rpb25hcnk6dXBkYXRlRGljdGlvbmFyeVxyXG4gICAgfTtcclxuXHJcbn0pKCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zbGF0b3I7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIEJhc2VNb2RlbCA9IHJlcXVpcmUoXCJiYXNlLW1vZGVsXCIpO1xyXG5cclxudmFyIFNldHRpbmdzTW9kZWwgPSBCYXNlTW9kZWwuZXh0ZW5kKHtcclxuXHJcbiAgICBkZWZhdWx0czoge1xyXG4gICAgICAgIGxhbmc6IFwiZW4tVVNcIixcclxuICAgICAgICB0aGVtZTogJ2R1c3QnLFxyXG4gICAgICAgIHVzZXJOYW1lOiAnZGVtb0BtYWlsYm9uZS5jb20nXHJcbiAgICB9LFxyXG5cclxuICAgIHVybDpmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiAnc2V0dGluZ3MnO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zZXQoXCJpZFwiLCBfLnVuaXF1ZUlkKCdfJykpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NNb2RlbDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZSgnYXBwJyk7XHJcbnZhciBTZXR0aW5ncyA9IHJlcXVpcmUoXCIuL3NldHRpbmdzXCIpO1xyXG5cclxudmFyIFNldHRpbmdzQ29udHJvbGxlciA9IE1hcmlvbmV0dGUuQ29udHJvbGxlci5leHRlbmQoe1xyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBhcHAuc2V0dGluZ3MgPSBuZXcgU2V0dGluZ3MoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZmV0Y2g6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgYXBwLnNldHRpbmdzLmZldGNoKHtcclxuICAgICAgICAgICAgc3VjY2VzczogXy5iaW5kKGZ1bmN0aW9uIChtb2RlbCwgcmVzcCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgJC53aGVuKHRoaXMubG9hZFRoZW1lKCksIHRoaXMubG9hZERpY3Rpb25hcnkoKSkudGhlbihmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm9uU2V0dGluZ3NMb2FkZWRcIik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSwgdGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgbG9hZFRoZW1lOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciB0aGVtZSA9IGFwcC5zZXR0aW5ncy5nZXQoXCJ0aGVtZVwiKTtcclxuXHJcbiAgICAgICAgcmV0dXJuICQuZ2V0KFwiZGlzdC9jc3MvdGhlbWVzL1wiICsgdGhlbWUgKyBcIi9cIiArIHRoZW1lICsgXCIuY3NzXCIsIGZ1bmN0aW9uIChfY3NzKSB7XHJcblxyXG4gICAgICAgICAgICAkKFwidGhlbWUtY3NzXCIpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAkKFsnPHN0eWxlIHR5cGU9XCJ0ZXh0L2Nzc1wiIGlkPVwidGhlbWUtY3NzXCI+JywgX2NzcywgJzwvc3R5bGU+J10uam9pbignJykpLmFwcGVuZFRvKCdoZWFkJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGxvYWREaWN0aW9uYXJ5OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHJldHVybiAkLmdldEpTT04oXCJkaXN0L2kxOG4vXCIgKyBhcHAuc2V0dGluZ3MuZ2V0KFwibGFuZ1wiKSArIFwiLmpzb25cIiwgZnVuY3Rpb24gKGkxOG5PYmplY3QpIHtcclxuICAgICAgICAgICAgYXBwLnRyYW5zbGF0b3IudXBkYXRlRGljdGlvbmFyeShpMThuT2JqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzQ29udHJvbGxlcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZSgnYXBwJyk7XHJcbnZhciBpbyA9IHJlcXVpcmUoJ3NvY2tldC5pby1jbGllbnQnKTtcclxuXHJcbnZhciBTb2NrZXRDb250cm9sbGVyID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgaW5pdGlhbGl6ZTpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICB2YXIgc29ja2V0VVJJID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgXCI6XCIgKyBcIjgwMDBcIiArIFwiL1wiO1xyXG4gICAgICAgIHRoaXMuX3NvY2tldCA9IGlvLmNvbm5lY3Qoc29ja2V0VVJJKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc29ja2V0Lm9uKCdjb25uZWN0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb25uZWN0aW9uIHRvIHNlcnZlciBlc3RhYmxpc2hlZC4nKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9zb2NrZXQub24oJ2Vycm9yJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzb3JyeSwgd2UgYXJlIGV4cGVyaWVuY2luZyB0ZWNobmljYWwgZGlmZmljdWx0aWVzLicpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX3NvY2tldC5vbignZGF0YTpjaGFuZ2UnLCBmdW5jdGlvbihtZXNzYWdlKXtcclxuICAgICAgICAgICAgYXBwLnZlbnQudHJpZ2dlcihcImRhdGE6Y2hhbmdlXCIsIG1lc3NhZ2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX3NvY2tldC5vbignZXJyb3IxJywgZnVuY3Rpb24oZXJyKXtcclxuICAgICAgICAgICAgYXBwLnZlbnQudHJpZ2dlcignc29ja2V0OmVycm9yJywgZXJyKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgdGhpcy5fc29ja2V0LmNsb3NlKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBnZXRTb2NrZXQ6ZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5fc29ja2V0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHJlZ2lzdGVyVXNlcjpmdW5jdGlvbih1c2VyTmFtZSl7XHJcbiAgICAgICAgdGhpcy5fc29ja2V0LmVtaXQoJ2FkZC11c2VyJyx1c2VyTmFtZSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb2NrZXRDb250cm9sbGVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVNb2RlbCA9IHJlcXVpcmUoXCIuL2pzL21vZGVscy9hdXRvQ29tcGxldGVNb2RlbFwiKTtcclxudmFyIEF1dG9Db21wbGV0ZUl0ZW1WaWV3ID0gcmVxdWlyZShcIi4vanMvdmlld3MvYXV0b0NvbXBsZXRlSXRlbVZpZXdcIik7XHJcbnZhciBBdXRvQ29tcGxldGVDb21wb3NpdGVWaWV3ID0gcmVxdWlyZShcIi4vanMvdmlld3MvYXV0b0NvbXBsZXRlQ29tcG9zaXRlVmlld1wiKTtcclxudmFyIEF1dG9Db21wbGV0ZUNvbGxlY3Rpb24gPSByZXF1aXJlKFwiLi9qcy9jb2xsZWN0aW9ucy9hdXRvQ29tcGxldGVDb2xsZWN0aW9uXCIpO1xyXG52YXIgRmlsdGVyQ29sbGVjdGlvbkRlY29yYXRvciA9IHJlcXVpcmUoXCJkZWNvcmF0b3JzL0ZpbHRlckNvbGxlY3Rpb25EZWNvcmF0b3JcIik7XHJcblxyXG52YXIgQXV0b0NvbXBsZXRlID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy5lbCA9IG9wdGlvbnMuZWw7XHJcbiAgICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xyXG4gICAgICAgIHRoaXMubWF4SXRlbXMgPSBvcHRpb25zLm1heEl0ZW1zIHx8IDU7XHJcbiAgICAgICAgdGhpcy5maWx0ZXJNb2RlbCA9IG9wdGlvbnMuZmlsdGVyTW9kZWw7XHJcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uID0gbmV3IEZpbHRlckNvbGxlY3Rpb25EZWNvcmF0b3IobmV3IEF1dG9Db21wbGV0ZUNvbGxlY3Rpb24ob3B0aW9ucy5pdGVtcyB8fCBbXSksIHRoaXMuZmlsdGVyTW9kZWwpO1xyXG5cclxuICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgJ2lucHV0OmNoYW5nZScsIHRoaXMub25JbnB1dENoYW5nZSwgdGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gb25GaWx0ZXJDaGFuZ2VcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uSW5wdXRDaGFuZ2U6IGZ1bmN0aW9uIChpbnB1dCwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNFbXB0eShpbnB1dCkpIHtcclxuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLmZpbHRlckFsbCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyTW9kZWwuc2V0SW5wdXQoaW5wdXQpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24uZmlsdGVyQnkoe1xyXG4gICAgICAgICAgICAgICAgbWF4SXRlbXM6IHRoaXMubWF4SXRlbXMsXHJcbiAgICAgICAgICAgICAgICBtYW5kYXRvcnlJdGVtczogb3B0aW9ucy5hZGRTZWFyY2hLZXkgPyBbbmV3IEF1dG9Db21wbGV0ZU1vZGVsKHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBpbnB1dCxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogQXV0b0NvbXBsZXRlLlRZUEVTLlNFQVJDSFxyXG4gICAgICAgICAgICAgICAgfSldIDogW11cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIHNob3dcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNob3c6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmNvbGxlY3Rpb24uZmlsdGVyQWxsKCk7XHJcblxyXG4gICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlVGFibGVWaWV3ID0gbmV3IEF1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXcoe1xyXG4gICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IHRoaXMuY29sbGVjdGlvbixcclxuICAgICAgICAgICAgZWw6IHRoaXMuZWxcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmF1dG9Db21wbGV0ZVRhYmxlVmlldy5yZW5kZXIoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5BdXRvQ29tcGxldGUuVFlQRVMgPSBBdXRvQ29tcGxldGVJdGVtVmlldy5UWVBFUztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXV0b0NvbXBsZXRlO1xyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgQXV0b0NvbXBsZXRlTW9kZWwgPSByZXF1aXJlKFwiLi4vbW9kZWxzL2F1dG9Db21wbGV0ZU1vZGVsXCIpO1xyXG5cclxudmFyIEF1dG9Db21wbGV0ZUNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgbW9kZWw6IEF1dG9Db21wbGV0ZU1vZGVsXHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGVDb2xsZWN0aW9uO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVNb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XHJcblxyXG4gICAgZGVmYXVsdDoge1xyXG4gICAgICAgIHRleHQ6IFwiXCIsXHJcbiAgICAgICAgdmFsdWU6IFwiXCJcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cXFxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvYmosIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcob2JqLnRleHQpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KFwidGV4dFwiLCBvYmoudGV4dC50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcob2JqLnZhbHVlKSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldChcInZhbHVlXCIsIG9iai52YWx1ZS50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9Db21wbGV0ZU1vZGVsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi91aS90ZW1wbGF0ZXMvYXV0b0NvbXBsZXRlLmhic1wiKTtcclxudmFyIEF1dG9Db21wbGV0ZUl0ZW1WaWV3ID0gcmVxdWlyZShcIi4vYXV0b0NvbXBsZXRlSXRlbVZpZXdcIik7XHJcblxyXG52YXIgS2V5Q29kZSA9IHtcclxuICAgIEVOVEVSOiAxMyxcclxuICAgIEFSUk9XX1VQOiAzOCxcclxuICAgIEFSUk9XX0RPV046IDQwXHJcbn07XHJcblxyXG52YXIgQXV0b0NvbXBsZXRlQ29tcG9zaXRlVmlldyA9IE1hcmlvbmV0dGUuQ29tcG9zaXRlVmlldy5leHRlbmQoe1xyXG5cclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgIGNoaWxkVmlldzogQXV0b0NvbXBsZXRlSXRlbVZpZXcsXHJcbiAgICBjaGlsZFZpZXdDb250YWluZXI6IFwiLm1lbnVcIixcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XHJcblxyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5jb2xsZWN0aW9uLCBcImVtcHR5OmNvbGxlY3Rpb25cIiwgdGhpcy5jbG9zZUVsKTtcclxuICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJhdXRvY29tcGxldGU6aXRlbTpjbGlja1wiLCB0aGlzLnNlbGVjdEl0ZW0pO1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcImF1dG9jb21wbGV0ZTppdGVtOm92ZXJcIiwgdGhpcy5vbkhvdmVyKTtcclxuICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJrZXk6cHJlc3NcIiwgdGhpcy5vbktleVByZXNzKTtcclxuICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJjbG9zZUFsbFwiLCB0aGlzLmNsb3NlRWwpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgYnVpbGRDaGlsZFZpZXc6IGZ1bmN0aW9uIChpdGVtLCBJdGVtVmlldykge1xyXG5cclxuICAgICAgICB2YXIgdmlldyA9IG5ldyBJdGVtVmlldyh7XHJcbiAgICAgICAgICAgIG1vZGVsOiBpdGVtLFxyXG4gICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgIGZpbHRlck1vZGVsOiB0aGlzLmNvbGxlY3Rpb24uZmlsdGVyTW9kZWxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdmlldztcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLmNsb3NlRWwoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvblJlbmRlckNvbGxlY3Rpb246IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jaGlsZEFyciA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmNoaWxkcmVuLmVhY2goXy5iaW5kKGZ1bmN0aW9uICh2aWV3KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRBcnIucHVzaCh2aWV3KTtcclxuICAgICAgICB9LCB0aGlzKSk7XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gMDtcclxuICAgICAgICB0aGlzLnNob3dFbCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBjbG9zZUVsOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgXy5kZWZlcihfLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkSXRlbSA9IC0xO1xyXG4gICAgICAgICAgICB0aGlzLiRlbC5oaWRlKCk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBzaG93RWw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnNldEFjdGl2ZSgpO1xyXG4gICAgICAgIHRoaXMuJGVsLnNob3coKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25LZXlQcmVzczogZnVuY3Rpb24gKGtleSkge1xyXG5cclxuICAgICAgICBzd2l0Y2ggKGtleSkge1xyXG4gICAgICAgICAgICBjYXNlIEtleUNvZGUuQVJST1dfVVA6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkSXRlbSA9IE1hdGgubWF4KDAsIHRoaXMuc2VsZWN0ZWRJdGVtIC0gMSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFjdGl2ZSgpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgS2V5Q29kZS5BUlJPV19ET1dOOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEl0ZW0gPSBNYXRoLm1pbih0aGlzLmNoaWxkcmVuLmxlbmd0aCAtIDEsIHRoaXMuc2VsZWN0ZWRJdGVtICsgMSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFjdGl2ZSgpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgS2V5Q29kZS5FTlRFUjpcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0SXRlbSgpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2V0QWN0aXZlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uZWFjaChmdW5jdGlvbiAodmlldykge1xyXG4gICAgICAgICAgICB2aWV3LnNldEFjdGl2ZShmYWxzZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciBzZWxlY3RlZFZpZXcgPSB0aGlzLmNoaWxkQXJyW3RoaXMuc2VsZWN0ZWRJdGVtXTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNPYmplY3Qoc2VsZWN0ZWRWaWV3KSkge1xyXG4gICAgICAgICAgICBzZWxlY3RlZFZpZXcuc2V0QWN0aXZlKHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImF1dG9jb21wbGV0ZTppdGVtOmFjdGl2ZVwiLCBzZWxlY3RlZFZpZXcubW9kZWwuZ2V0KFwidGV4dFwiKSwgc2VsZWN0ZWRWaWV3Lm1vZGVsLmdldChcInZhbHVlXCIpKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNlbGVjdEl0ZW06IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIHNlbGVjdGVkVmlldyA9IHRoaXMuY2hpbGRBcnJbdGhpcy5zZWxlY3RlZEl0ZW1dO1xyXG5cclxuICAgICAgICBpZiAoXy5pc09iamVjdChzZWxlY3RlZFZpZXcpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiYXV0b2NvbXBsZXRlOml0ZW06c2VsZWN0ZWRcIiwgc2VsZWN0ZWRWaWV3Lm1vZGVsLmdldChcInRleHRcIiksIHNlbGVjdGVkVmlldy5tb2RlbC5nZXQoXCJ2YWx1ZVwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2xvc2VFbCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25Ib3ZlcjogZnVuY3Rpb24gKGl0ZW0pIHtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkQXJyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkQXJyW2ldLmNpZCA9PT0gaXRlbS5jaWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gaTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9Db21wbGV0ZUNvbXBvc2l0ZVZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIi4uLy4uL3VpL3RlbXBsYXRlcy9hdXRvQ29tcGxldGVJdGVtLmhic1wiKTtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVJdGVtVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgIHRhZ05hbWU6ICdsaScsXHJcbiAgICBjbGFzc05hbWU6ICdsaV9yb3cnLFxyXG5cclxuICAgIHVpOiB7XHJcbiAgICAgICAgXCJ0aXRsZVwiOiBcIi50aXRsZVwiLFxyXG4gICAgICAgIFwidGV4dFwiOiBcIi50ZXh0XCJcclxuICAgIH0sXHJcblxyXG4gICAgZXZlbnRzOiB7XHJcbiAgICAgICAgXCJtb3VzZWVudGVyXCI6IFwiX29uTW91c2VFbnRlclwiLFxyXG4gICAgICAgIFwiY2xpY2tcIjogXCJfb25DbGlja1wiXHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuICAgICAgICB0aGlzLmZpbHRlck1vZGVsID0gb3B0aW9ucy5maWx0ZXJNb2RlbDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgdGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciB0eXBlID0gdGhpcy5tb2RlbC5nZXQoXCJ0eXBlXCIpO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBpc0NvbnRhY3Q6IHR5cGUgPT09IEF1dG9Db21wbGV0ZUl0ZW1WaWV3LlRZUEVTLkNPTlRBQ1QsXHJcbiAgICAgICAgICAgIGlzU2VhcmNoOiB0eXBlID09PSBBdXRvQ29tcGxldGVJdGVtVmlldy5UWVBFUy5TRUFSQ0hcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLnVpLnRpdGxlLmh0bWwodGhpcy5maWx0ZXJNb2RlbC5oaWdobGlnaHRLZXkodGhpcy5tb2RlbC5nZXQoXCJ0ZXh0XCIpKSk7XHJcbiAgICAgICAgdGhpcy51aS50ZXh0Lmh0bWwodGhpcy5maWx0ZXJNb2RlbC5oaWdobGlnaHRLZXkodGhpcy5tb2RlbC5nZXQoXCJ2YWx1ZVwiKSkpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBfb25Nb3VzZUVudGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiYXV0b2NvbXBsZXRlOml0ZW06b3ZlclwiLCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgX29uQ2xpY2s6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJhdXRvY29tcGxldGU6aXRlbTpjbGlja1wiKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgc2V0QWN0aXZlOiBmdW5jdGlvbiAoaXNBY3RpdmUpIHtcclxuICAgICAgICB0aGlzLiRlbC50b2dnbGVDbGFzcygnYWN0aXZlJywgaXNBY3RpdmUpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG5BdXRvQ29tcGxldGVJdGVtVmlldy5UWVBFUyA9IHtcclxuICAgIENPTlRBQ1Q6IDEsXHJcbiAgICBTRUFSQ0g6IDIsXHJcbiAgICBSRUNFTlQ6IDNcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXV0b0NvbXBsZXRlSXRlbVZpZXc7XHJcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcImF1dG9Db21wbGV0ZSBhdXRvQ29tcGxldGUtc2l6ZVxcXCI+XFxyXFxuICAgIDx1bCBjbGFzcz1cXFwibWVudSBicm93c2VyLXNjcm9sbCBsaWdodCBkZWZhdWx0LWxpc3RcXFwiPjwvdWw+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlciwgb3B0aW9ucywgZnVuY3Rpb25UeXBlPVwiZnVuY3Rpb25cIiwgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb24sIHNlbGY9dGhpcywgYmxvY2tIZWxwZXJNaXNzaW5nPWhlbHBlcnMuYmxvY2tIZWxwZXJNaXNzaW5nO1xuXG5mdW5jdGlvbiBwcm9ncmFtMShkZXB0aDAsZGF0YSkge1xuICBcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyO1xuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImljb24gY29udGFjdFxcXCI+PC9kaXY+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjb250ZW50V3JhcHBlclxcXCI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwidGl0bGVcXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy50ZXh0KSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnRleHQpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwidGV4dFxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnZhbHVlKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnZhbHVlKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIFwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbmZ1bmN0aW9uIHByb2dyYW0zKGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXI7XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaWNvbiBzZWFyY2hcXFwiPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiY29udGVudFdyYXBwZXJcXFwiPlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInRpdGxlXFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMudGV4dCkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC50ZXh0KTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIFwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwiZHJvcGRvd24tbGktdmFsdWVcXFwiPlxcclxcbiAgICBcIjtcbiAgb3B0aW9ucz17aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMSwgcHJvZ3JhbTEsIGRhdGEpLGRhdGE6ZGF0YX1cbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuaXNDb250YWN0KSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwgb3B0aW9ucyk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmlzQ29udGFjdCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwgb3B0aW9ucykgOiBoZWxwZXI7IH1cbiAgaWYgKCFoZWxwZXJzLmlzQ29udGFjdCkgeyBzdGFjazEgPSBibG9ja0hlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIHN0YWNrMSwge2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDEsIHByb2dyYW0xLCBkYXRhKSxkYXRhOmRhdGF9KTsgfVxuICBpZihzdGFjazEgfHwgc3RhY2sxID09PSAwKSB7IGJ1ZmZlciArPSBzdGFjazE7IH1cbiAgYnVmZmVyICs9IFwiXFxyXFxuXFxyXFxuICAgIFwiO1xuICBvcHRpb25zPXtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgzLCBwcm9ncmFtMywgZGF0YSksZGF0YTpkYXRhfVxuICBpZiAoaGVscGVyID0gaGVscGVycy5pc1NlYXJjaCkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIG9wdGlvbnMpOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5pc1NlYXJjaCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwgb3B0aW9ucykgOiBoZWxwZXI7IH1cbiAgaWYgKCFoZWxwZXJzLmlzU2VhcmNoKSB7IHN0YWNrMSA9IGJsb2NrSGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgc3RhY2sxLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMywgcHJvZ3JhbTMsIGRhdGEpLGRhdGE6ZGF0YX0pOyB9XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBEaWFsb2dWaWV3ID0gcmVxdWlyZShcIi4vanMvdmlld3MvZGlhbG9nVmlldzFcIik7XHJcblxyXG52YXIgQXV0b0NvbXBsZXRlID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgIHRoaXMuZWwgPSBvcHRpb25zLmVsO1xyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuICAgICAgICB0aGlzLnRpdGxlID0gb3B0aW9ucy50aXRsZSB8fCBcIlwiO1xyXG4gICAgICAgIHRoaXMuaW5zaWRlVmlldyA9IG9wdGlvbnMuaW5zaWRlVmlldztcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBzaG93XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBzaG93OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZGlhbG9nVmlldyA9IG5ldyBEaWFsb2dWaWV3KHtcclxuICAgICAgICAgICAgdmVudDogdGhpcy52ZW50LFxyXG4gICAgICAgICAgICBlbDogdGhpcy5lbCxcclxuICAgICAgICAgICAgdGl0bGU6IHRoaXMudGl0bGUsXHJcbiAgICAgICAgICAgIHppbmRleDogMTAwMCxcclxuICAgICAgICAgICAgaW5zaWRlVmlldzogdGhpcy5pbnNpZGVWaWV3XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5kaWFsb2dWaWV3LnJlbmRlcigpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXV0b0NvbXBsZXRlO1xyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwiLi4vLi4vdWkvdGVtcGxhdGVzL2RpYWxvZy5oYnNcIik7XHJcblxyXG52YXIgRGlhbG9nVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuXHJcbiAgICBjbGFzc05hbWU6IFwiZGlhbG9nXCIsXHJcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICBpbnNpZGVWaWV3OiBudWxsLFxyXG4gICAgdGVtcGxhdGVJZDogbnVsbCxcclxuXHJcbiAgICB1aToge1xyXG4gICAgICAgIGJ0bkNsb3NlOiBcIi5kaWFsb2ctaGVhZGVyLWNsb3NlQnRuXCJcclxuICAgIH0sXHJcblxyXG4gICAgZXZlbnRzOiB7XHJcbiAgICAgICAgXCJjbGljayBAdWkuYnRuQ2xvc2VcIjogXCJjbG9zZUJ0blwiXHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmluc2lkZVZpZXcpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudGl0bGUgPSBvcHRpb25zLnRpdGxlO1xyXG4gICAgICAgICAgICB0aGlzLnpJbmRleCA9IG9wdGlvbnMuekluZGV4O1xyXG4gICAgICAgICAgICB0aGlzLmluc2lkZVZpZXcgPSBvcHRpb25zLmluc2lkZVZpZXc7XHJcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVJZCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkudG9TdHJpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIHJlbmRlclxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uQmVmb3JlUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuXyRlbCA9IHRoaXMuJGVsO1xyXG4gICAgICAgIHRoaXMuJGVsID0gJChcIjxkaXYvPlwiKS5hZGRDbGFzcyh0aGlzLmNsYXNzTmFtZSkuYWRkQ2xhc3ModGhpcy50ZW1wbGF0ZUlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmluc2lkZVZpZXcpIHtcclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZChcIi5kaWFsb2ctaGVhZGVyLXRpdGxlXCIpLmh0bWwodGhpcy50aXRsZSk7XHJcbiAgICAgICAgICAgIHRoaXMuJGVsLmZpbmQoXCIuZGlhbG9nLWlubmVyQm94XCIpLmFwcGVuZCh0aGlzLmluc2lkZVZpZXcucmVuZGVyKCkuZWwpO1xyXG4gICAgICAgICAgICB0aGlzLl8kZWwuYXBwZW5kKHRoaXMuJGVsKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuJGVsLmZpbmQoXCIuZGlhbG9nLW91dGVyYm94XCIpLmNzcyhcIm1hcmdpbi10b3BcIiwgLXRoaXMuaW5zaWRlVmlldy4kZWwuaGVpZ2h0KCkgLyAyICsgXCJweFwiKTtcclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZChcIi5kaWFsb2ctb3V0ZXJib3hcIikuY3NzKFwibWFyZ2luLWxlZnRcIiwgLXRoaXMuaW5zaWRlVmlldy4kZWwud2lkdGgoKSAvIDIgKyBcInB4XCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gY2xvc2VcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBjbG9zZUJ0bjogZnVuY3Rpb24gKGV2KSB7XHJcblxyXG4gICAgICAgIHRoaXMuaW5zaWRlVmlldy5kZXN0cm95KCk7XHJcbiAgICAgICAgdGhpcy5fJGVsLmZpbmQoXCIuZGlhbG9nLlwiICsgdGhpcy50ZW1wbGF0ZUlkKS5yZW1vdmUoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERpYWxvZ1ZpZXc7XHJcblxyXG5cclxuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIFxuXG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwiZGlhbG9nLW92ZXJsYXlcXFwiPjwvZGl2PlxcclxcblxcclxcbjxkaXYgY2xhc3M9XFxcImRpYWxvZy1vdXRlcmJveFxcXCI+XFxyXFxuXFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImRpYWxvZy1oZWFkZXJcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiZGlhbG9nLWhlYWRlci10aXRsZVxcXCI+PC9kaXY+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJkaWFsb2ctaGVhZGVyLWNsb3NlQnRuXFxcIj48L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuXFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImRpYWxvZy1pbm5lckJveFxcXCI+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvZGl2PlxcclxcblxcclxcblxcclxcblwiO1xuICB9KTtcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIi4vdWkvdGVtcGxhdGVzL3NlYXJjaC5oYnNcIik7XHJcblxyXG5yZXF1aXJlKFwicGx1Z2lucy9qcXVlcnkuYmEtb3V0c2lkZS1ldmVudHNcIik7XHJcblxyXG52YXIgS2V5Q29kZSA9IHtcclxuICAgIEVTQzogMjcsXHJcbiAgICBFTlRFUjogMTMsXHJcbiAgICBBUlJPV19VUDogMzgsXHJcbiAgICBBUlJPV19ET1dOOiA0MFxyXG59O1xyXG5cclxudmFyIFNlYXJjaFZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG5cclxuICAgIHVpOiB7XHJcbiAgICAgICAgXCJzZWFyY2hJbnB1dFwiOiBcIi5zZWFyY2gtaW5wdXRcIlxyXG4gICAgfSxcclxuXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgICBcImNsaWNrIC5idG5TZWFyY2hcIjogXCJzZWFyY2hcIixcclxuICAgICAgICBcImtleXVwIC5zZWFyY2gtaW5wdXRcIjogXCJvbkJ1dHRvbktleVVwXCIsXHJcbiAgICAgICAgXCJpbnB1dCAuc2VhcmNoLWlucHV0XCI6IFwib25JbnB1dENoYW5nZVwiLFxyXG4gICAgICAgIFwiY2xpY2tvdXRzaWRlXCI6IFwib3V0c2lkZUNsaWNrZWRcIlxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLmVsID0gb3B0aW9ucy5lbDtcclxuICAgICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XHJcbiAgICAgICAgdGhpcy5jYXB0aW9uID0gb3B0aW9ucy5jYXB0aW9uO1xyXG5cclxuICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJhdXRvY29tcGxldGU6aXRlbTpzZWxlY3RlZFwiLCB0aGlzLnNlYXJjaCwgdGhpcyk7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsIFwiYXV0b2NvbXBsZXRlOml0ZW06YWN0aXZlXCIsIHRoaXMub25JdGVtQWN0aXZlLCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjYXB0aW9uOiB0aGlzLmNhcHRpb25cclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbkl0ZW1BY3RpdmU6IGZ1bmN0aW9uICh0ZXh0LCB2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMudWkuc2VhcmNoSW5wdXQudmFsKHRleHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbkJ1dHRvbktleVVwOiBmdW5jdGlvbiAoZXZlbnQpIHtcclxuXHJcbiAgICAgICAgdmFyIGtleSA9IGV2ZW50LmtleUNvZGU7XHJcblxyXG4gICAgICAgIGlmIChrZXkgPT09IEtleUNvZGUuQVJST1dfRE9XTiB8fCBrZXkgPT09IEtleUNvZGUuQVJST1dfVVAgfHwga2V5ID09PSBLZXlDb2RlLkVOVEVSKSB7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwia2V5OnByZXNzXCIsIGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25JbnB1dENoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiaW5wdXQ6Y2hhbmdlXCIsIHRoaXMudWkuc2VhcmNoSW5wdXQudmFsKCksIHtcImFkZFNlYXJjaEtleVwiOiB0cnVlfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBzZWFyY2g6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImNsb3NlQWxsXCIpO1xyXG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwic2VhcmNoXCIsIHRoaXMudWkuc2VhcmNoSW5wdXQudmFsKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGNsZWFyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy51aS5zZWFyY2hJbnB1dC52YWwoXCJcIik7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb3V0c2lkZUNsaWNrZWQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImNsb3NlQWxsXCIpO1xyXG4gICAgfVxyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBTZWFyY2hWaWV3O1xyXG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8aW5wdXQgY2xhc3M9XFxcInNlYXJjaC1pbnB1dFxcXCIgdHlwZT1cXFwidGV4dFxcXCIgYXV0b2NvbXBsZXRlPVxcXCJvZmZcXFwiIHZhbHVlPVxcXCJcXFwiPlxcclxcbjxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBwcmltZUljb24gYnRuU2VhcmNoXFxcIj48c3BhbiBjbGFzcz1cXFwic2VhcmNoSWNvblxcXCI+PC9zcGFuPjwvYT5cIjtcbiAgfSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBUYWdNb2RlbCA9IHJlcXVpcmUoXCJ1aS1jb21wb25lbnRzL3RhZ3MvanMvbW9kZWxzL3RhZ01vZGVsXCIpO1xyXG5cclxudmFyIFRhZ3NDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xyXG4gICAgbW9kZWw6IFRhZ01vZGVsXHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUYWdzQ29sbGVjdGlvbjtcclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFRhZ01vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHtcclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgdGV4dDogXCJcIixcclxuICAgICAgICB2YWx1ZTogXCJcIixcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlXHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUYWdNb2RlbDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwiLi4vLi4vdWkvdGVtcGxhdGVzL3RhZy5oYnNcIik7XHJcblxyXG52YXIgVGFnSXRlbVZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICBjbGFzc05hbWU6ICd0YWcnLFxyXG5cclxuICAgIHVpOiB7XHJcbiAgICAgICAgY29udGVudDogXCIuY29udGVudFwiLFxyXG4gICAgICAgIGJ0bkNsb3NlOiBcIi5jbG9zZS1idXR0b25cIlxyXG4gICAgfSxcclxuXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgICBcImNsaWNrIC5jbG9zZS1idXR0b25cIjogXCJfb25DbG9zZUJ0bkNsaWNrXCJcclxuICAgIH0sXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy4kZWwudG9nZ2xlQ2xhc3MoXCJlcnJcIiwgIXRoaXMubW9kZWwuZ2V0KFwiaXNWYWxpZFwiKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9vbkNsb3NlQnRuQ2xpY2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcInRhZzppdGVtOnJlbW92ZVwiLCB0aGlzLm1vZGVsLmNpZCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUYWdJdGVtVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwiLi4vLi4vdWkvdGVtcGxhdGVzL3RhZ3NDb250YWluZXIuaGJzXCIpO1xyXG52YXIgVGFnc0l0ZW1WaWV3ID0gcmVxdWlyZShcIi4vdGFnc0l0ZW1WaWV3XCIpO1xyXG5cclxucmVxdWlyZShcInBsdWdpbnMvanF1ZXJ5LmJhLW91dHNpZGUtZXZlbnRzXCIpO1xyXG5cclxudmFyIEtleUNvZGUgPSB7XHJcbiAgICBFU0M6IDI3LFxyXG4gICAgRU5URVI6IDEzLFxyXG4gICAgQVJST1dfVVA6IDM4LFxyXG4gICAgQVJST1dfRE9XTjogNDBcclxufTtcclxuXHJcbnZhciBBdXRvQ29tcGxldGVDb21wb3NpdGVWaWV3ID0gTWFyaW9uZXR0ZS5Db21wb3NpdGVWaWV3LmV4dGVuZCh7XHJcblxyXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgY2hpbGRWaWV3OiBUYWdzSXRlbVZpZXcsXHJcbiAgICBjaGlsZFZpZXdDb250YWluZXI6IFwiLnNlbGVjdGVkVGFnc1wiLFxyXG5cclxuICAgIHVpOiB7XHJcbiAgICAgICAgY29udGFpbmVyOiBcIi50YWdzLWNvbnRhaW5lclwiLFxyXG4gICAgICAgIHRhZ1NlbGVjdG9yOiBcIi50YWctaW5wdXRcIlxyXG4gICAgfSxcclxuXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgICBcImNsaWNrXCI6IFwib25DbGlja1wiLFxyXG4gICAgICAgIFwia2V5ZG93biAudGFnLWlucHV0XCI6IFwib25CdXR0b25LZXlEb3duXCIsXHJcbiAgICAgICAgXCJpbnB1dCAudGFnLWlucHV0XCI6IFwib25JbnB1dENoYW5nZVwiLFxyXG4gICAgICAgIFwiY2xpY2tvdXRzaWRlXCI6IFwib3V0c2lkZUNsaWNrZWRcIlxyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGluaXRpYWxpemVcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZWwgPSBvcHRpb25zLmVsO1xyXG4gICAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcclxuICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJ0YWc6YWRkXCIsIHRoaXMuYWZ0ZXJJdGVtQWRkZWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgYnVpbGRDaGlsZFZpZXc6IGZ1bmN0aW9uIChpdGVtLCBJdGVtVmlldykge1xyXG5cclxuICAgICAgICB2YXIgdmlldyA9IG5ldyBJdGVtVmlldyh7XHJcbiAgICAgICAgICAgIG1vZGVsOiBpdGVtLFxyXG4gICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnRcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdmlldztcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBhZnRlckl0ZW1BZGRlZDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLnVpLnRhZ1NlbGVjdG9yLnRleHQoXCJcIik7XHJcbiAgICAgICAgaWYgKHRoaXMuaW5Gb2N1cykge1xyXG4gICAgICAgICAgICB0aGlzLm9uQ2xpY2soKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gb25DbGlja1xyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25DbGljazogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICBpZiAoXy5pc0VtcHR5KHRoaXMudWkudGFnU2VsZWN0b3IudGV4dCgpKSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlc2V0U2VsZWN0b3IoKTtcclxuICAgICAgICAgICAgdGhpcy5pbkZvY3VzID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgcmVzZXRTZWxlY3RvcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzLnVpLnRhZ1NlbGVjdG9yLnRleHQoXCJcIik7XHJcbiAgICAgICAgdGhpcy51aS50YWdTZWxlY3Rvci5zaG93KCk7XHJcbiAgICAgICAgdGhpcy51aS50YWdTZWxlY3Rvci5mb2N1cygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbkJ1dHRvbktleURvd246IGZ1bmN0aW9uIChldmVudCkge1xyXG5cclxuICAgICAgICB2YXIga2V5ID0gZXZlbnQua2V5Q29kZTtcclxuXHJcbiAgICAgICAgaWYgKGtleSA9PT0gS2V5Q29kZS5BUlJPV19ET1dOIHx8IGtleSA9PT0gS2V5Q29kZS5BUlJPV19VUCkge1xyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImtleTpwcmVzc1wiLCBrZXkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGtleSA9PT0gS2V5Q29kZS5FTlRFUikge1xyXG4gICAgICAgICAgICB0aGlzLnVpLnRhZ1NlbGVjdG9yLmhpZGUoKTtcclxuICAgICAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJ0YWc6aW5wdXQ6ZW50ZXJcIiwgdGhpcy51aS50YWdTZWxlY3Rvci50ZXh0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbklucHV0Q2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJpbnB1dDpjaGFuZ2VcIiwgdGhpcy51aS50YWdTZWxlY3Rvci50ZXh0KCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG91dHNpZGVDbGlja2VkOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIGlmICghXy5pc0VtcHR5KHRoaXMudWkudGFnU2VsZWN0b3IudGV4dCgpKSkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pbkZvY3VzID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2xvc2VBbGxcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBBdXRvQ29tcGxldGVDb21wb3NpdGVWaWV3O1xyXG4iLCIgICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIFRhZ3NWaWV3ID0gcmVxdWlyZShcIi4vanMvdmlld3MvdGFnc1ZpZXdcIik7XHJcbiAgICB2YXIgVGFnTW9kZWwgPSByZXF1aXJlKFwiLi9qcy9tb2RlbHMvdGFnTW9kZWxcIik7XHJcbiAgICB2YXIgVGFnc0NvbGxlY3Rpb24gPSByZXF1aXJlKFwiLi9qcy9jb2xsZWN0aW9ucy90YWdDb2xsZWN0aW9uXCIpO1xyXG5cclxuICAgIHZhciBUYWdzID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgaW5pdGlhbFRhZ3MgPSBvcHRpb25zLmluaXRpYWxUYWdzIHx8IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uID0gbmV3IFRhZ3NDb2xsZWN0aW9uKGluaXRpYWxUYWdzKTtcclxuICAgICAgICAgICAgdGhpcy52YWxpZGF0b3IgPSBvcHRpb25zLnZhbGlkYXRvcjtcclxuICAgICAgICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xyXG4gICAgICAgICAgICB0aGlzLmVsID0gb3B0aW9ucy5lbDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCxcInRhZzppbnB1dDplbnRlclwiLCB0aGlzLm9uRW50ZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCxcInRhZzppdGVtOnJlbW92ZVwiLCB0aGlzLm9uUmVtb3ZlSXRlbSk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LFwiYXV0b2NvbXBsZXRlOml0ZW06c2VsZWN0ZWRcIix0aGlzLm9uSXRlbVNlbGVjdGVkKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBzaG93XHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNob3c6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudGFnc1ZpZXcgPSBuZXcgVGFnc1ZpZXcoe1xyXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy5jb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgdmVudDogdGhpcy52ZW50LFxyXG4gICAgICAgICAgICAgICAgZWw6IHRoaXMuZWxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMudGFnc1ZpZXcucmVuZGVyKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25FbnRlcjpmdW5jdGlvbih2YWwpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5lbnRlclN0YXRlID0gXCJ1bmhhbmRsZVwiO1xyXG4gICAgICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImtleTpwcmVzc1wiLCAxMyk7XHJcblxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KF8uYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLmVudGVyU3RhdGUgPT09IFwidW5oYW5kbGVcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRJdGVtKHZhbCwgdmFsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgdGhpcyksIDEwMCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25JdGVtU2VsZWN0ZWQ6ZnVuY3Rpb24odGV4dCwgdmFsdWUpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5lbnRlclN0YXRlID0gXCJoYW5kbGVcIjtcclxuICAgICAgICAgICAgdGhpcy5hZGRJdGVtKHRleHQsdmFsdWUsdHJ1ZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25SZW1vdmVJdGVtOmZ1bmN0aW9uKHRhZ0lkKXtcclxuXHJcbiAgICAgICAgICAgIHZhciB0YWdNb2RlbCA9IHRoaXMuY29sbGVjdGlvbi5nZXQodGFnSWQpO1xyXG5cclxuICAgICAgICAgICAgaWYoXy5pc09iamVjdCh0YWdNb2RlbCkpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLnJlbW92ZSh0YWdNb2RlbCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcihcInRhZzpyZW1vdmVcIiwgdGFnTW9kZWwuZ2V0KFwidmFsdWVcIikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgYWRkSXRlbTpmdW5jdGlvbih0ZXh0LCB2YWwpe1xyXG5cclxuICAgICAgICAgICAgaWYoIV8uaXNFbXB0eSh2YWwpKXtcclxuXHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gXy5pc0VtcHR5KHRleHQpID8gdmFsIDogdGV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRhZ01vZGVsKHt2YWx1ZTp2YWwsIHRleHQ6dGV4dCwgaXNWYWxpZDp0aGlzLl92YWxpZGF0ZSh2YWwpfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24uYWRkKHRhZyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJ0YWc6YWRkXCIsIHZhbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfdmFsaWRhdGU6ZnVuY3Rpb24odmFsKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBpc1ZhbGlkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmKF8uaXNGdW5jdGlvbih0aGlzLnZhbGlkYXRvcikpe1xyXG4gICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRoaXMudmFsaWRhdG9yKHZhbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGlzVmFsaWQ7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRhZ3M7XHJcblxyXG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyLCBmdW5jdGlvblR5cGU9XCJmdW5jdGlvblwiLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXG4gIGJ1ZmZlciArPSBcIjxkaXYgY2xhc3M9XFxcImNvbnRlbnRcXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy50ZXh0KSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnRleHQpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwiY2xvc2UtYnV0dG9uXFxcIj48L2Rpdj5cXHJcXG5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJ0YWdzLWNvbnRhaW5lclxcXCI+XFxyXFxuICAgPGRpdiBjbGFzcz1cXFwic2VsZWN0ZWRUYWdzXFxcIj48L2Rpdj5cXHJcXG4gICA8ZGl2IGNsYXNzPVxcXCJ0YWctc2VsZWN0b3JcXFwiPlxcclxcbiAgICAgICA8c3BhbiBjbGFzcz1cXFwidGFnLWlucHV0XFxcIiBjb250ZW50ZWRpdGFibGU9XFxcInRydWVcXFwiIHRhYmluZGV4PVxcXCItMVxcXCI+PC9zcGFuPlxcclxcbiAgIDwvZGl2PlxcclxcbjwvZGl2PlwiO1xuICB9KTtcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoJ2FwcCcpO1xyXG52YXIgRnJhbWVMYXlvdXQgPSByZXF1aXJlKCcuL2pzL3ZpZXdzL2ZyYW1lTGF5b3V0Jyk7XHJcbnZhciBMYXlvdXRIZWxwZXJzID0gcmVxdWlyZShcInJlc29sdmVycy9kcm9wZG93bkRpc3BsYXllclwiKTtcclxuXHJcbnZhciBGcmFtZSA9IE1hcmlvbmV0dGUuQ29udHJvbGxlci5leHRlbmQoe1xyXG5cclxuICAgIGN1cnJTdWJMYXlvdXQ6IFwiXCIsXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGluaXRpYWxpemVcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy5mcmFtZUxheW91dCA9IG5ldyBGcmFtZUxheW91dCgpO1xyXG4gICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsICdjaGFuZ2U6bW9kdWxlJywgdGhpcy5jaGFuZ2VTdWJsYXlvdXQsIHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gc2V0TGF5b3V0XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHNldExheW91dDogZnVuY3Rpb24gKG1haW5SZWdpb24pIHtcclxuICAgICAgICBtYWluUmVnaW9uLnNob3codGhpcy5mcmFtZUxheW91dCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBjaGFuZ2VTdWJsYXlvdXQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIHN1Yk1vZHVsZSA9IGFwcC5zdWJtb2R1bGVzW2FwcC5jb250ZXh0LmdldChcIm1vZHVsZVwiKV07XHJcblxyXG4gICAgICAgIGlmIChfLmlzT2JqZWN0KHN1Yk1vZHVsZSkgJiYgXy5pc0Z1bmN0aW9uKHN1Yk1vZHVsZS5zZXRMYXlvdXQpKSB7XHJcbiAgICAgICAgICAgIHN1Yk1vZHVsZS5zZXRMYXlvdXQoKTtcclxuICAgICAgICAgICAgdGhpcy5mcmFtZUxheW91dC5vbk1vZHVsZUNoYW5nZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBnZXRSZWdpb25zXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBzZXRSZWdpb246IGZ1bmN0aW9uIChyZWdpb25OYW1lLCB2aWV3KSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmZyYW1lTGF5b3V0W3JlZ2lvbk5hbWUgKyBcIlJlZ2lvblwiXSAmJiAhXy5pc0VtcHR5KHZpZXcpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhbWVMYXlvdXRbcmVnaW9uTmFtZSArIFwiUmVnaW9uXCJdLnNob3codmlldyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRnJhbWU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBEaWFsb2cgPSByZXF1aXJlKFwiZGlhbG9nXCIpO1xyXG52YXIgVGVjaEJhclZpZXcgPSByZXF1aXJlKCdmcmFtZS12aWV3cy90ZWNoQmFyVmlldycpO1xyXG52YXIgTG9hZGVyVmlldyA9IHJlcXVpcmUoJ2ZyYW1lLXZpZXdzL2xvYWRlclZpZXcnKTtcclxudmFyIFNldHRpbmdzVmlldyA9IHJlcXVpcmUoJ2ZyYW1lLXZpZXdzL3NldHRpbmdzVmlldycpO1xyXG52YXIgRnJhbWVUZW1wbGF0ZSA9IHJlcXVpcmUoXCJmcmFtZS10ZW1wbGF0ZXMvZnJhbWVMYXlvdXQuaGJzXCIpO1xyXG5cclxudmFyIEZyYW1lTGF5b3V0ID0gTWFyaW9uZXR0ZS5MYXlvdXRWaWV3LmV4dGVuZCh7XHJcbiAgICB0ZW1wbGF0ZTogRnJhbWVUZW1wbGF0ZSxcclxuXHJcbiAgICB1aToge1xyXG4gICAgICAgIHN3aXRjaGVyQ2FwdGlvbjogXCIubW9kdWxlU3dpdGNoZXIgLmNhcHRpb25cIixcclxuICAgICAgICB0ZWNoYmFyV3JhcHBlcjogXCIudGVjaGJhci13cmFwcGVyXCIsXHJcbiAgICAgICAgbG9hZGVyV3JhcHBlcjogXCIubG9hZGVyLXdyYXBwZXJcIixcclxuICAgICAgICBidG5TZXR0aW5nczogXCIuYnRuU2V0dGluZ3NcIlxyXG4gICAgfSxcclxuXHJcbiAgICByZWdpb25zOiB7XHJcbiAgICAgICAgc2V0dGluZ3NSZWdpb246IFwiLnNldHRpbmdzLXJlZ2lvblwiLFxyXG4gICAgICAgIHNlYXJjaFJlZ2lvbjogXCIuc2VhcmNoLXJlZ2lvblwiLFxyXG4gICAgICAgIGFjdGlvbnNSZWdpb246IFwiLmFjdGlvbnMtcmVnaW9uXCIsXHJcbiAgICAgICAgbWFpblJlZ2lvbjogXCIubWFpbi1yZWdpb25cIlxyXG4gICAgfSxcclxuXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgICBcImNsaWNrIEB1aS5idG5TZXR0aW5nc1wiOiBcIm9wZW5TZXR0aW5nc1wiXHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIHRlY2hCYXJWaWV3ID0gbmV3IFRlY2hCYXJWaWV3KHtcclxuICAgICAgICAgICAgZWw6IHRoaXMudWkudGVjaGJhcldyYXBwZXJcclxuICAgICAgICB9KTtcclxuICAgICAgICB0ZWNoQmFyVmlldy5yZW5kZXIoKTtcclxuXHJcbiAgICAgICAgdmFyIGxvYWRlclZpZXcgPSBuZXcgTG9hZGVyVmlldyh7XHJcbiAgICAgICAgICAgIGVsOiB0aGlzLnVpLmxvYWRlcldyYXBwZXJcclxuICAgICAgICB9KTtcclxuICAgICAgICBsb2FkZXJWaWV3LnJlbmRlcigpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvcGVuU2V0dGluZ3M6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIHNldHRpbmdzVmlldyA9IG5ldyBTZXR0aW5nc1ZpZXcoe1xyXG4gICAgICAgICAgICBtb2RlbDogYXBwLnNldHRpbmdzXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciBkaWFsb2cgPSBuZXcgRGlhbG9nKHtcclxuICAgICAgICAgICAgZWw6IHRoaXMuZWwsXHJcbiAgICAgICAgICAgIHRpdGxlOiBhcHAudHJhbnNsYXRvci50cmFuc2xhdGUoXCJmcmFtZTpzZXR0aW5nc1wiKSxcclxuICAgICAgICAgICAgaW5zaWRlVmlldzogc2V0dGluZ3NWaWV3XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZGlhbG9nLnNob3coKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgb25Nb2R1bGVDaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnVpLnN3aXRjaGVyQ2FwdGlvbi5odG1sKGFwcC50cmFuc2xhdG9yLnRyYW5zbGF0ZShcImZyYW1lOm1vZHVsZS5cIiArIGFwcC5jb250ZXh0LmdldChcIm1vZHVsZVwiKSkpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRnJhbWVMYXlvdXQ7XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwiZnJhbWUtdGVtcGxhdGVzL2xvYWRlci5oYnNcIik7XHJcblxyXG52YXIgTG9hZGluZ1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICB0ZW1wbGF0ZTp0ZW1wbGF0ZSxcclxuXHJcbiAgICB1aTp7XHJcbiAgICAgICAgbG9hZGVyOlwiLmxvYWRlclwiXHJcbiAgICB9LFxyXG5cclxuICAgIHNob3dMb2FkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLiRlbC5zaG93KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb3NlTG9hZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy4kZWwuaGlkZSgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9hZGluZ1ZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJmcmFtZS10ZW1wbGF0ZXMvc2V0dGluZ3NWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBTZXR0aW5nc1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBidG5EYXJrOiBcIi5kYXJrVGhlbWVcIixcclxuICAgICAgICBidG5EdXN0OiBcIi5kdXN0VGhlbWVcIixcclxuICAgICAgICBkZGxMYW5nOiBcIi5sYW5ndWFnZS1ib3hcIlxyXG4gICAgfSxcclxuXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgICBcImNsaWNrIC50aGVtZUJveFwiOiBcIm9uVGhlbWVDbGlja1wiLFxyXG4gICAgICAgIFwiY2hhbmdlIEB1aS5kZGxMYW5nXCI6IFwib25MYW5ndWFnZUNoYW5nZVwiXHJcbiAgICB9LFxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudWkuZGRsTGFuZy52YWwoYXBwLnNldHRpbmdzLmdldChcImxhbmdcIikpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvbkxhbmd1YWdlQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciBsYW5nID0gdGhpcy51aS5kZGxMYW5nLnZhbCgpO1xyXG5cclxuICAgICAgICBhcHAuc2V0dGluZ3Muc2V0KFwibGFuZ1wiLCBsYW5nKTtcclxuICAgICAgICBhcHAuc2V0dGluZ3Muc2F2ZShudWxsLCB7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBvblRoZW1lQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XHJcblxyXG4gICAgICAgIHZhciB0YXJnZXQgPSAkKGUuY3VycmVudFRhcmdldCB8fCBlLnNyY0VsZW1lbnQpO1xyXG4gICAgICAgIHZhciB0aGVtZSA9IHRhcmdldC5hdHRyKFwiZGF0YS1uYW1lXCIpO1xyXG5cclxuICAgICAgICBhcHAuc2V0dGluZ3Muc2V0KFwidGhlbWVcIiwgdGhlbWUpO1xyXG4gICAgICAgIGFwcC5zZXR0aW5ncy5zYXZlKG51bGwsIHtcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgYXBwLnNldHRpbmdzQ29udHJvbGxlci5sb2FkVGhlbWUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJmcmFtZS10ZW1wbGF0ZXMvdGVjaEJhci5oYnNcIik7XHJcblxyXG52YXIgVGVjaEJhclZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcblxyXG4gICAgdWk6IHtcclxuICAgICAgICBkZHNSZXNvdXJjZXM6IFwiLmRkc1Jlc291cmNlc1wiXHJcbiAgICB9LFxyXG5cclxuICAgIGV2ZW50czoge1xyXG4gICAgICAgIFwiY2xpY2sgLmRkc1Jlc291cmNlc1wiOiBcIm9uUmVzb3VyY2VzTWVudUNsaWNrXCJcclxuICAgIH0sXHJcblxyXG4gICAgb25SZXNvdXJjZXNNZW51Q2xpY2s6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRlY2hCYXJWaWV3O1xyXG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyLCBvcHRpb25zLCBmdW5jdGlvblR5cGU9XCJmdW5jdGlvblwiLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbiwgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3Npbmc7XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJ0ZWNoYmFyLXdyYXBwZXJcXFwiPjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcImxvYWRlci13cmFwcGVyXFxcIj48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJoZWFkZXItd3JhcHBlclxcXCI+XFxyXFxuICAgICA8ZGl2IGNsYXNzPVxcXCJsb2dvXFxcIj48L2Rpdj5cXHJcXG4gICAgIDxkaXYgY2xhc3M9XFxcInNlYXJjaC1yZWdpb25cXFwiPjwvZGl2PlxcclxcbiAgICAgPGRpdiBjbGFzcz1cXFwiYWNjb3VudE5hbWVcXFwiIGFsdD1cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuYWNjb3VudE5hbWUpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuYWNjb3VudE5hbWUpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiIHRpdGxlPVxcXCJcIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuYWNjb3VudE5hbWUpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuYWNjb3VudE5hbWUpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJhY3Rpb25zLXdyYXBwZXJcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJtb2R1bGVTd2l0Y2hlclxcXCI+XFxyXFxuICAgICAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJidXR0b24gbGluayBkcm9wZG93biBkZHNJZF9kZHNNb2R1bGVzXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJ0b2dnbGVcXFwiPjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJkcm9wZG93bi1zbGlkZXIgZGRzTW9kdWxlc1xcXCI+XFxyXFxuICAgICAgICAgICA8YSBjbGFzcz1cXFwiZGRtIHNlbGVjdE1haWxcXFwiIGhyZWY9XFxcIiNpbmJveFxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6bW9kdWxlLm1haWxcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwiZnJhbWU6bW9kdWxlLm1haWxcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgICAgPGEgY2xhc3M9XFxcImRkbSBzZWxlY3RUYXNrc1xcXCIgaHJlZj1cXFwiI3Rhc2tzXFxcIj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcImZyYW1lOm1vZHVsZS50YXNrc1wiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTptb2R1bGUudGFza3NcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbiAgICAgPGRpdiBjbGFzcz1cXFwiYWN0aW9ucy1yZWdpb25cXFwiPjwvZGl2PlxcclxcbiAgICAgPGRpdiBjbGFzcz1cXFwiYnRuU2V0dGluZ3NcXFwiPjxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBwcmltZUljb24gX2J0blNldHRpbmdzXFxcIj48c3BhbiBjbGFzcz1cXFwic2V0dGluZ3NJY29uXFxcIj48L3NwYW4+PC9hPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcIm1haW4tcmVnaW9uXFxcIj48L2Rpdj5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJsb2FkZXJcXFwiPkxvYWRpbmcuLi4uLi48L2Rpdj5cXHJcXG5cXHJcXG5cXHJcXG5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwic2V0dGluZ3NWaWV3XFxcIj5cXHJcXG5cXHJcXG4gICAgICAgPGRpdiBjbGFzcz1cXFwic2VjdGlvblxcXCI+XFxyXFxuICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0aXRsZVxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6c2V0dGluZ3MubGFuZ3VhZ2VcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwiZnJhbWU6c2V0dGluZ3MubGFuZ3VhZ2VcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgICAgICAgIDxzZWxlY3QgY2xhc3M9XFxcImxhbmd1YWdlLWJveFxcXCIgbmFtZT1cXFwibGFuZ3VhZ2VzXFxcIiBkYXRhLWFjdGlvbj1cXFwibGFuZ3VhZ2VzXFxcIiA+XFxyXFxuICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiZW4tVVNcXFwiPkVuZ2xpc2ggKFVTKTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImVzLUVTXFxcIj5Fc3Bhw7FvbDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgPC9zZWxlY3Q+XFxyXFxuICAgICAgIDwvZGl2PlxcclxcblxcclxcbiAgICAgICA8ZGl2IGNsYXNzPVxcXCJzZWN0aW9uXFxcIj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0aXRsZVxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6c2V0dGluZ3MudGhlbWVcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwiZnJhbWU6c2V0dGluZ3MudGhlbWVcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0aGVtZUJveCBkdXN0VGhlbWVcXFwiIGRhdGEtbmFtZT1cXFwiZHVzdFxcXCI+PC9kaXY+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwidGhlbWVCb3ggZGFya1RoZW1lXFxcIiBkYXRhLW5hbWU9XFxcImRhcmtcXFwiPjwvZGl2PlxcclxcbiAgICAgICA8L2Rpdj5cXHJcXG48L2Rpdj5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwidGVjaGJhclxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcInRpdGxlXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJmcmFtZTp0ZWNoYmFyLnNsb2dhblwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTp0ZWNoYmFyLnNsb2dhblwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJtZW51XFxcIj5cXHJcXG4gICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsaW5rIG1lbnVpdGVtXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6dGVjaGJhci5hYm91dFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTp0ZWNoYmFyLmFib3V0XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsaW5rIG1lbnVpdGVtXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwiZnJhbWU6dGVjaGJhci50dXRvcmlhbFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJmcmFtZTp0ZWNoYmFyLnR1dG9yaWFsXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBsaW5rIGRyb3Bkb3duIG1lbnVpdGVtIGRkc0lkX2Rkc1Jlc291cmNlc1xcXCI+PHNwYW4gY2xhc3M9XFxcImNhcHRpb25cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcImZyYW1lOnRlY2hiYXIucmVzb3VyY2VzXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcImZyYW1lOnRlY2hiYXIucmVzb3VyY2VzXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJ0b2dnbGVcXFwiPjwvc3Bhbj48L2E+XFxyXFxuXFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJkcm9wZG93bi1zbGlkZXIgZGRzUmVzb3VyY2VzXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8dWw+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8bGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBjaGVja2VkPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpPjwvaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aDI+Q2xpZW50LXNpZGU8L2gyPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICA8cD5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW0gZmlyc3RcXFwiPkJhY2tib25lPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+QmFja2JvbmUuRGVlcE1vZGVsPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+TWFyaW9uZXR0ZTwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPlVuZGVyc2NvcmU8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5SZXF1aXJlSlMgKEFNRCk8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5NdXN0YWNoZTwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPlNhc3NcXFxcQ29tcGFzczwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPC9saT5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxsaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGNoZWNrZWQ+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGk+PC9pPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMj5TZXJ2ZXItc2lkZTwvaDI+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDxwPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbSBmaXJzdFxcXCI+Tm9kZS5qczwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPkV4cHJlc3MgNC4wPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+TW9uZ29EQjwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIml0ZW1cXFwiPk1vbmdvb3NlPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+U29ja2V0LmlvPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+QXN5bmMuanM8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8bGk+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBjaGVja2VkPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpPjwvaT5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aDI+VGVzdGluZyB0b29sczwvaDI+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDxwPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbSBmaXJzdFxcXCI+TW9jaGE8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5DaGFpPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+U2lub248L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJpdGVtXFxcIj5CbGFua2V0PC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbVxcXCI+U3F1aXJlPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPGxpPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgY2hlY2tlZD5cXHJcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aT48L2k+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgPGgyPkRlcGxveWluZyB0b29sczwvaDI+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgIDxwPlxcclxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiaXRlbSBmaXJzdFxcXCI+R3J1bnQ8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxcclxcblxcclxcbiAgICAgICAgICAgICAgICA8L3VsPlxcclxcbiAgICAgICAgICAgIDwvZGl2PlxcclxcblxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvZGl2PlxcclxcblxcclxcblxcclxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBDb250YWN0TW9kZWwgPSByZXF1aXJlKFwibWFpbC1tb2RlbHMvY29udGFjdE1vZGVsXCIpO1xyXG52YXIgQmFzZUNvbGxlY3Rpb24gPSByZXF1aXJlKFwiYmFzZS1jb2xsZWN0aW9ucy9iYXNlQ29sbGVjdGlvblwiKTtcclxuXHJcbnZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcbnZhciBfc3RyQ29udGFjdHMgPSBmcy5yZWFkRmlsZVN5bmMoJy4vY2xpZW50L3NyYy9jb21tb24vZGF0YS9jb250YWN0cy5qc29uJywgJ3V0ZjgnKTtcclxuXHJcbnZhciBDb250YWN0c0NvbGxlY3Rpb24gPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIENvbnRhY3RzQ29sbGVjdGlvbiA9IEJhc2VDb2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIG1vZGVsOiBDb250YWN0TW9kZWwsXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXR0cnMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjb250YWN0TGlzdCA9IHRoaXMuX2NyZWF0ZUNvbnRhY3RMaXN0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KHtjb2xsZWN0aW9uOmNvbnRhY3RMaXN0fSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9jcmVhdGVDb250YWN0TGlzdDpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdmFyIGNvbnRhY3RMaXN0ID0gW10sIGNvbnRhY3RzID0gSlNPTi5wYXJzZShfc3RyQ29udGFjdHMpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGNvbnRhY3RzLCBmdW5jdGlvbihjb250YWN0KXtcclxuICAgICAgICAgICAgICAgIGNvbnRhY3RMaXN0LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOmNvbnRhY3QucmVwbGFjZShcIixcIiwgXCIgXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIGFkZHJlc3M6Y29udGFjdC5yZXBsYWNlKFwiLFwiLCBcIi5cIikudG9Mb3dlckNhc2UoKSArIFwiQG1haWxkby5jb21cIlxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udGFjdExpc3Q7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGdldFRpdGxlczpmdW5jdGlvbihhZGRyZXNzTGlzdCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVzID0gW107XHJcblxyXG4gICAgICAgICAgICBfLmVhY2goYWRkcmVzc0xpc3QsIF8uYmluZChmdW5jdGlvbihhZGRyZXNzKXtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSBfLmZpbmQodGhpcy5tb2RlbHMsZnVuY3Rpb24gKHJlY29yZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWNvcmQuZ2V0KFwiYWRkcmVzc1wiKSA9PT0gYWRkcmVzcztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2gobW9kZWwgPyBtb2RlbC5nZXQoXCJ0aXRsZVwiKSA6IGFkZHJlc3MpO1xyXG4gICAgICAgICAgICB9LHRoaXMpKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRhY3RzQ29sbGVjdGlvbjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIE1haWxNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9tYWlsTW9kZWxcIik7XHJcbnZhciBGaWx0ZXJlZENvbGxlY3Rpb24gPSByZXF1aXJlKFwiYmFzZS1jb2xsZWN0aW9ucy9maWx0ZXJlZENvbGxlY3Rpb25cIik7XHJcblxyXG52YXIgTWFpbENvbGxlY3Rpb24gPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxDb2xsZWN0aW9uID0gRmlsdGVyZWRDb2xsZWN0aW9uLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGlzRmV0Y2hlZDogZmFsc2UsXHJcblxyXG4gICAgICAgIG1vZGVsOiBNYWlsTW9kZWwsXHJcblxyXG4gICAgICAgIHJlc291cmNlOiAnbWFpbHMnLFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXR0cnMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc29ja2V0ID0ge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdE5hbWU6IHRoaXMucmVzb3VyY2UsXHJcbiAgICAgICAgICAgICAgICBpbzogYXBwLnNvY2tldENvbnRyb2xsZXIuZ2V0U29ja2V0KClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHVybDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgXCIvXCIgKyB0aGlzLnJlc291cmNlO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgY29tcGFyYXRvcjogZnVuY3Rpb24gKG1vZGVsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtKG5ldyBEYXRlKG1vZGVsLmdldChcInNlbnRUaW1lXCIpKS5nZXRUaW1lKCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZmlsdGVyQnlMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlsdGVyZWQgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGlmKF8uaXNTdHJpbmcobGFiZWwpKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZCA9IF8uZmlsdGVyKHRoaXMubW9kZWxzLCBmdW5jdGlvbiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gISFtb2RlbC5nZXQoXCJsYWJlbHMuXCIrbGFiZWwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJlZDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbENvbGxlY3Rpb247XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcblxyXG52YXIgQWN0aW9uc0NvbnRyb2xsZXIgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIEFjdGlvbnNDb250cm9sbGVyID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJtYWlsOmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbHMsIFwiY2hhbmdlOm1ldGFkYXRhXCIsIHRoaXMuZml4VXJsLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6c2VuZCcsIHRoaXMuc2VuZCwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8obWFpbC5jaGFubmVsLnZlbnQsICdtYWlsOnNlbGVjdCcsIHRoaXMuc2VsZWN0LCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6bW92ZVRvJywgdGhpcy5tb3ZlVG8sIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKG1haWwuY2hhbm5lbC52ZW50LCAnbWFpbDpkZWxldGUnLCB0aGlzLmRlbGV0ZUl0ZW1zLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6bWFya0FzJywgdGhpcy5tYXJrQXMsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKG1haWwuY2hhbm5lbC52ZW50LCAnbWFpbDpkaXNjYXJkJywgdGhpcy5kaXNjYXJkLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhtYWlsLmNoYW5uZWwudmVudCwgJ21haWw6Y2hhbmdlJywgdGhpcy5zYXZlQXNEcmFmdCwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5zZWxlY3RCeSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWlscy5zZWxlY3RBbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ25vbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbHMuY2xlYXJTZWxlY3RlZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAncmVhZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWlscy5zZWxlY3RNb2RlbHModGhpcy5tYWlscy5maWx0ZXJCeUxhYmVsKFwicmVhZFwiKSwge2V4Y2x1c2l2ZWx5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd1bnJlYWQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbHMuc2VsZWN0TW9kZWxzKHRoaXMubWFpbHMuZmlsdGVyQnlMYWJlbChcInVucmVhZFwiKSwge2V4Y2x1c2l2ZWx5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbWFya0FzOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLCBpdGVtcyA9IG9wdGlvbnMuaXRlbXMgfHwgdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5tYWlscy5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5tYXJrQXMob3B0aW9ucy5sYWJlbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUl0ZW1zKGl0ZW1zLCBvcHRpb25zKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbW92ZVRvOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLCBpdGVtcyA9IG9wdGlvbnMuaXRlbXMgfHwgdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpO1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5tYWlscy5nZXQoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5tb3ZlVG8ob3B0aW9ucy50YXJnZXQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVJdGVtcyhpdGVtcywgXy5leHRlbmQoe30sIG9wdGlvbnMsIHtcInJlZnJlc2hcIjogdHJ1ZX0pKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdXBkYXRlSXRlbXM6IGZ1bmN0aW9uIChpdGVtcywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWlscy51cGRhdGUoe1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkSXRlbXM6IGl0ZW1zLFxyXG4gICAgICAgICAgICAgICAgZmllbGRzOiBbJ2xhYmVscycsICdncm91cHMnXSxcclxuXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBfLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlZnJlc2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgdGhpcyksXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOnVwZGF0ZUl0ZW1zOmVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZGVsZXRlSXRlbXM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWFpbHMuZGVzdHJveSh7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtczogdGhpcy5tYWlscy5nZXRTZWxlY3RlZCgpLFxyXG5cclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IF8uYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6ZGVsZXRlSXRlbXM6ZXJyb3JcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZW5kOiBmdW5jdGlvbiAobWFpbE1vZGVsKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc09iamVjdChtYWlsTW9kZWwpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbWFpbE1vZGVsLnNldChcImdyb3Vwc1wiLCBbXSwge3NpbGVudDogdHJ1ZX0pO1xyXG5cclxuICAgICAgICAgICAgICAgIG1haWxNb2RlbC5zYXZlKG51bGwsIHtcclxuICAgICAgICAgICAgICAgICAgICBzaWxlbnQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogXy5iaW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcyksXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6c2F2ZTplcnJvclwiLCBtYWlsTW9kZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGRpc2NhcmQ6IGZ1bmN0aW9uIChtYWlsTW9kZWwpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYWlsTW9kZWwuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5yb3V0ZXIucHJldmlvdXMoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG1haWxNb2RlbC5kZXN0cm95KHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBfLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVN1Y2Nlc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCB0aGlzKSxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpkZWxldGU6ZXJyb3JcIiwgbWFpbE1vZGVsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzYXZlQXNEcmFmdDogZnVuY3Rpb24gKG1haWxNb2RlbCkge1xyXG5cclxuICAgICAgICAgICAgbWFpbE1vZGVsLnNldChcImdyb3Vwcy5kcmFmdFwiLCB0cnVlLCB7c2lsZW50OiB0cnVlfSk7XHJcblxyXG4gICAgICAgICAgICBtYWlsTW9kZWwuc2F2ZShudWxsLCB7XHJcbiAgICAgICAgICAgICAgICBzYXZlQXM6IFwiZHJhZnRcIixcclxuICAgICAgICAgICAgICAgIHNpbGVudDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBmaXhVcmw6IGZ1bmN0aW9uIChtZXRhZGF0YSkge1xyXG4gICAgICAgICAgICBtYWlsLnJvdXRlci5maXhVcmwoe3BhZ2U6IG1ldGFkYXRhLmN1cnJQYWdlICsgMX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGhhbmRsZVN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvbi50eXBlXCIpID09PSBcImNvbXBvc2VcIikge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5yb3V0ZXIucHJldmlvdXMoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFpbHMucmVmcmVzaCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEFjdGlvbnNDb250cm9sbGVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgQ29udGVudExheW91dCA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL21haWxDb250ZW50TGF5b3V0XCIpO1xyXG52YXIgTWFpbHNWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvbWFpbHNWaWV3XCIpO1xyXG52YXIgUHJldmlld1ZpZXcgPSByZXF1aXJlKFwibWFpbC12aWV3cy9wcmV2aWV3Vmlld1wiKTtcclxudmFyIENvbXBvc2VWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvY29tcG9zZVZpZXcvY29tcG9zZVZpZXdcIik7XHJcbnZhciBFbXB0eU1haWxWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvZW1wdHlNYWlsVmlld1wiKTtcclxuXHJcbnZhciBNYWlsQ29udGVudENvbnRyb2xsZXIgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxDb250ZW50Q29udHJvbGxlciA9IE1hcmlvbmV0dGUuQ29udHJvbGxlci5leHRlbmQoe1xyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1haWxzLCBcImNoYW5nZTppdGVtc1wiLCB0aGlzLmNsb3NlUHJldmlldyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6c2VsZWN0aW9uXCIsIHRoaXMudG9nZ2xlUHJldmlldyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8obWFpbC5jaGFubmVsLnZlbnQsIFwibWFpbFRhYmxlOkl0ZW1DbGlja2VkXCIsIHRoaXMuc2hvd1ByZXZpZXcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG5ld0xheW91dFxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBuZXdMYXlvdXQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dCA9IG5ldyBDb250ZW50TGF5b3V0KCk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5jb250ZW50TGF5b3V0LCBcInJlbmRlclwiLCB0aGlzLm9uTGF5b3V0UmVuZGVyKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnRMYXlvdXQ7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uTGF5b3V0UmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb25cIik7XHJcblxyXG4gICAgICAgICAgICB2YXIgZW1wdHlNYWlsVmlldyA9IG5ldyBFbXB0eU1haWxWaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dC5wcmV2aWV3UmVnaW9uLmFkZChlbXB0eU1haWxWaWV3KTtcclxuXHJcbiAgICAgICAgICAgIHZhciB0YWJsZVZpZXcgPSBuZXcgTWFpbHNWaWV3KHtjb2xsZWN0aW9uOiB0aGlzLm1haWxzfSk7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dC5pdGVtc1JlZ2lvbi5hZGQodGFibGVWaWV3KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBzaG93UHJldmlld1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93UHJldmlldzogZnVuY3Rpb24gKG1haWxNb2RlbCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNPYmplY3QobWFpbE1vZGVsKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOnNlbGVjdFwiLCB7c2VsZWN0Qnk6IFwibm9uZVwifSk7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptYXJrQXNcIiwge2xhYmVsOiAncmVhZCcsIGl0ZW1zOiBbbWFpbE1vZGVsLmlkXX0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucHJldmlldyA9ICFtYWlsTW9kZWwuZ2V0KFwiZ3JvdXBzLmRyYWZ0XCIpID8gbmV3IFByZXZpZXdWaWV3KHttb2RlbDogbWFpbE1vZGVsfSkgOiBuZXcgQ29tcG9zZVZpZXcoe21vZGVsOiBtYWlsTW9kZWx9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dC5wcmV2aWV3UmVnaW9uLmFkZCh0aGlzLnByZXZpZXcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRvZ2dsZVByZXZpZXc6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzT2JqZWN0KHRoaXMucHJldmlldykpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSB0aGlzLm1haWxzLmdldFNlbGVjdGVkKCkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2aWV3LiRlbC50b2dnbGUoc2VsZWN0ZWQgPT09IDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGNsb3NlUHJldmlldzogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMucHJldmlldyAmJiB0aGlzLnByZXZpZXcubW9kZWwpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaXNNb2RlbEV4aXN0ID0gXy5pc09iamVjdCh0aGlzLm1haWxzLmdldCh0aGlzLnByZXZpZXcubW9kZWwuaWQpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzTW9kZWxFeGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudExheW91dC5wcmV2aWV3UmVnaW9uLmNsZWFuKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbENvbnRlbnRDb250cm9sbGVyOyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBNYWlsQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCJtYWlsLWNvbGxlY3Rpb25zL21haWxDb2xsZWN0aW9uXCIpO1xyXG52YXIgQ29udGFjdHNDb2xsZWN0aW9uID0gcmVxdWlyZShcIm1haWwtY29sbGVjdGlvbnMvY29udGFjdHNDb2xsZWN0aW9uXCIpO1xyXG52YXIgU2VsZWN0YWJsZURlY29yYXRvciA9IHJlcXVpcmUoXCJkZWNvcmF0b3JzL3NlbGVjdGFibGVDb2xsZWN0aW9uRGVjb3JhdG9yXCIpO1xyXG5cclxudmFyIERhdGFDb250cm9sbGVyID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBEYXRhQ29udHJvbGxlciA9IE1hcmlvbmV0dGUuQ29udHJvbGxlci5leHRlbmQoe1xyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGluaXRpYWxpemVcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RDb2xsZWN0aW9uID0gbmV3IENvbnRhY3RzQ29sbGVjdGlvbigpO1xyXG4gICAgICAgICAgICB0aGlzLm1haWxDb2xsZWN0aW9uID0gbmV3IFNlbGVjdGFibGVEZWNvcmF0b3IobmV3IE1haWxDb2xsZWN0aW9uKCkpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZXRIYW5kbGVycygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlsQ29sbGVjdGlvbiwgXCJmZXRjaDpzdWNjZXNzXCIsIHRoaXMuX3VwZGF0ZVNlbGVjdGlvbiwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsIFwiY2hhbmdlOm1haWwuYWN0aW9uXCIsIHRoaXMuX3JlZnJlc2hNYWlsQ29sbGVjdGlvbiwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLnZlbnQsIFwiZGF0YTpjaGFuZ2VcIiwgdGhpcy5fb25EYXRhQ2hhbmdlLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfc2V0SGFuZGxlcnM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIG1haWwuY2hhbm5lbC5yZXFyZXMuc2V0SGFuZGxlcihcIm1haWw6Y29sbGVjdGlvblwiLCB0aGlzLl9nZXRNYWlsQ29sbGVjdGlvbiwgdGhpcyk7XHJcbiAgICAgICAgICAgIG1haWwuY2hhbm5lbC5yZXFyZXMuc2V0SGFuZGxlcihcImNvbnRhY3Q6Y29sbGVjdGlvblwiLCB0aGlzLl9nZXRDb250YWN0Q29sbGVjdGlvbiwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gZ2V0IGNvbGxlY3Rpb25zXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9nZXRNYWlsQ29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYWlsQ29sbGVjdGlvbjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfZ2V0Q29udGFjdENvbGxlY3Rpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGFjdENvbGxlY3Rpb247XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBkYXRhIGNoYW5nZVxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX29uRGF0YUNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoTWFpbENvbGxlY3Rpb24oKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfdXBkYXRlU2VsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbENvbGxlY3Rpb24udXBkYXRlU2VsZWN0aW9uKHt9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9yZWZyZXNoTWFpbENvbGxlY3Rpb246IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvblwiKSB8fCB7fTtcclxuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IGFjdGlvbi5wYXJhbXMgfHwge307XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc0Zpbml0ZShwYXJhbXMucGFnZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFpbENvbGxlY3Rpb24uZmV0Y2hCeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlTnVtYmVyOiBwYXJhbXMucGFnZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnk6IHBhcmFtcy5xdWVyeSB8fCAnZ3JvdXBzOicgKyBhY3Rpb24udHlwZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFDb250cm9sbGVyO1xyXG5cclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBNYWlsTW9kZWwgPSByZXF1aXJlKFwibWFpbC1tb2RlbHMvbWFpbE1vZGVsXCIpO1xyXG52YXIgTWFpbkxheW91dCA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL21haWxNYWluTGF5b3V0XCIpO1xyXG52YXIgU2VhcmNoVmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL3NlYXJjaFZpZXdcIik7XHJcbnZhciBOYXZWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvbmF2Vmlld1wiKTtcclxudmFyIEFjdGlvblZpZXcgPSByZXF1aXJlKFwibWFpbC12aWV3cy9hY3Rpb25WaWV3L2FjdGlvblZpZXdcIik7XHJcbnZhciBDb21wb3NlVmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL2NvbXBvc2VWaWV3L2NvbXBvc2VWaWV3XCIpO1xyXG52YXIgRW1wdHlGb2xkZXJzVmlldyA9IHJlcXVpcmUoXCJtYWlsLXZpZXdzL2VtcHR5Rm9sZGVyVmlld1wiKTtcclxudmFyIENvbnRlbnRMYXlvdXRDb250cm9sbGVyID0gcmVxdWlyZShcIi4vbWFpbENvbnRlbnRMYXlvdXRDb250cm9sbGVyXCIpO1xyXG5cclxudmFyIE1haW5MYXlvdXRDb250cm9sbGVyID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBNYWluTGF5b3V0Q29udHJvbGxlciA9IE1hcmlvbmV0dGUuQ29udHJvbGxlci5leHRlbmQoe1xyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRMYXlvdXRDb250cm9sbGVyID0gbmV3IENvbnRlbnRMYXlvdXRDb250cm9sbGVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsICdjaGFuZ2U6bWFpbC5hY3Rpb24nLCB0aGlzLm9uQWN0aW9uQ2hhbmdlLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBzZXRWaWV3c1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZXRWaWV3czogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZWFyY2hWaWV3ID0gbmV3IFNlYXJjaFZpZXcoKTtcclxuICAgICAgICAgICAgdGhpcy5tYWluTGF5b3V0ID0gbmV3IE1haW5MYXlvdXQoKTtcclxuICAgICAgICAgICAgdGhpcy5hY3Rpb25WaWV3ID0gbmV3IEFjdGlvblZpZXcoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWluTGF5b3V0LCBcInJlbmRlclwiLCB0aGlzLm9uTWFpbkxheW91dFJlbmRlciwgdGhpcyk7XHJcblxyXG4gICAgICAgICAgICBhcHAuZnJhbWUuc2V0UmVnaW9uKFwic2VhcmNoXCIsIHRoaXMuc2VhcmNoVmlldyk7XHJcbiAgICAgICAgICAgIGFwcC5mcmFtZS5zZXRSZWdpb24oXCJhY3Rpb25zXCIsIHRoaXMuYWN0aW9uVmlldyk7XHJcbiAgICAgICAgICAgIGFwcC5mcmFtZS5zZXRSZWdpb24oXCJtYWluXCIsIHRoaXMubWFpbkxheW91dCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uTWFpbkxheW91dFJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIG5hdlZpZXcgPSBuZXcgTmF2VmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLm1haW5MYXlvdXQubmF2UmVnaW9uLmFkZChuYXZWaWV3KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBlbXB0eUZvbGRlclZpZXcgPSBuZXcgRW1wdHlGb2xkZXJzVmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLm1haW5MYXlvdXQud29ya1JlZ2lvbi5hZGQoZW1wdHlGb2xkZXJWaWV3KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBvbkFjdGlvbkNoYW5nZVxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkFjdGlvbkNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uLnR5cGVcIik7XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNvbXBvc2VcIjpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TWFpbHMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBjb21wb3NlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgY29tcG9zZVZpZXcgPSBuZXcgQ29tcG9zZVZpZXcoe1xyXG4gICAgICAgICAgICAgICAgbW9kZWw6IG5ldyBNYWlsTW9kZWwoKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5tYWluTGF5b3V0LndvcmtSZWdpb24uYWRkKGNvbXBvc2VWaWV3KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvd01haWxzOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuY29udGVudExheW91dCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50TGF5b3V0ID0gdGhpcy5jb250ZW50TGF5b3V0Q29udHJvbGxlci5uZXdMYXlvdXQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm1haW5MYXlvdXQud29ya1JlZ2lvbi5hZGQodGhpcy5jb250ZW50TGF5b3V0KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbkxheW91dENvbnRyb2xsZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcblxyXG52YXIgTWFpbFJvdXRlckNvbnRyb2xsZXIgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxSb3V0ZXJDb250cm9sbGVyID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XHJcblxyXG4gICAgICAgIGNvbXBvc2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibWFpbC5hY3Rpb25cIiwgeyd0eXBlJzogJ2NvbXBvc2UnLCAncGFyYW1zJzoge319KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5ib3g6IGZ1bmN0aW9uIChwYXJhbSkge1xyXG4gICAgICAgICAgICBhcHAuY29udGV4dC5zZXQoXCJtYWlsLmFjdGlvblwiLCB7J3R5cGUnOiAnaW5ib3gnLCAncGFyYW1zJzogdGhpcy5hbmFseXplUGFyYW1zKHBhcmFtKX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZW50OiBmdW5jdGlvbiAocGFyYW0pIHtcclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibWFpbC5hY3Rpb25cIiwgeyd0eXBlJzogJ3NlbnQnLCAncGFyYW1zJzogdGhpcy5hbmFseXplUGFyYW1zKHBhcmFtKX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBkcmFmdDogZnVuY3Rpb24gKHBhcmFtKSB7XHJcbiAgICAgICAgICAgIGFwcC5jb250ZXh0LnNldChcIm1haWwuYWN0aW9uXCIsIHsndHlwZSc6ICdkcmFmdCcsICdwYXJhbXMnOiB0aGlzLmFuYWx5emVQYXJhbXMocGFyYW0pfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRyYXNoOiBmdW5jdGlvbiAocGFyYW0pIHtcclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibWFpbC5hY3Rpb25cIiwgeyd0eXBlJzogJ3RyYXNoJywgJ3BhcmFtcyc6IHRoaXMuYW5hbHl6ZVBhcmFtcyhwYXJhbSl9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc3BhbTogZnVuY3Rpb24gKHBhcmFtKSB7XHJcbiAgICAgICAgICAgIGFwcC5jb250ZXh0LnNldChcIm1haWwuYWN0aW9uXCIsIHsndHlwZSc6ICdzcGFtJywgJ3BhcmFtcyc6IHRoaXMuYW5hbHl6ZVBhcmFtcyhwYXJhbSl9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2VhcmNoOiBmdW5jdGlvbiAocGFyYW0xLCBwYXJhbTIpIHtcclxuICAgICAgICAgICAgYXBwLmNvbnRleHQuc2V0KFwibWFpbC5hY3Rpb25cIiwgeyd0eXBlJzogJ3NlYXJjaCcsICdwYXJhbXMnOiB0aGlzLmFuYWx5emVQYXJhbXMocGFyYW0yLCBwYXJhbTEpfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGFuYWx5emVQYXJhbXM6IGZ1bmN0aW9uIChpZCwgcXVlcnkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7cGFnZTogMSwgcXVlcnk6IHF1ZXJ5fTtcclxuXHJcbiAgICAgICAgICAgIGlmKF9zLnN0YXJ0c1dpdGgoaWQsIFwicFwiKSl7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFnZSA9IGlkLnNwbGl0KFwicFwiKVsxXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoXy5pc0Zpbml0ZShwYWdlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcy5wYWdlID0gcGFnZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBiZWZvcmVSb3V0ZVxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgYmVmb3JlUm91dGU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGFwcC5jb250ZXh0LnNldChcIm1vZHVsZVwiLCBcIm1haWxcIik7XHJcbiAgICAgICAgICAgIGFwcC5jb250ZXh0LnNldChcIm1haWwuYWN0aW9uXCIsIG51bGwsIHtzaWxlbnQ6IHRydWV9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbFJvdXRlckNvbnRyb2xsZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBEZWVwTW9kZWwgPSByZXF1aXJlKFwiYmFzZS1tb2RlbFwiKTtcclxuXHJcbnZhciBDb250YWN0TW9kZWwgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIENvbnRhY3RNb2RlbCA9IERlZXBNb2RlbC5leHRlbmQoe1xyXG5cclxuICAgICAgICBkZWZhdWx0cyA6IHtcclxuICAgICAgICAgICAgdGl0bGU6JycsXHJcbiAgICAgICAgICAgIGFkZHJlc3M6JydcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwYXJzZTogZnVuY3Rpb24ocmVzcG9uc2UsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOnJlc3BvbnNlLnJlcGxhY2UoXCIsXCIsIFwiIFwiKSxcclxuICAgICAgICAgICAgICAgIGFkZHJlc3M6cmVzcG9uc2UucmVwbGFjZShcIixcIiwgXCIuXCIpLnRvTG93ZXJDYXNlKCkgKyBcIkBtYWlsZG8uY29tXCJcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRhY3RNb2RlbDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgQXV0b0NvbXBsZXRlRmlsdGVyTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xyXG5cclxuICAgIHNldElucHV0OiBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICB0aGlzLmlucHV0ID0gXy5pc1N0cmluZyhpbnB1dCkgPyBpbnB1dC50b0xvd2VyQ2FzZSgpIDogXCJcIjtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHByZWRpY2F0ZTogZnVuY3Rpb24gKG1vZGVsKSB7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnRlc3QobW9kZWwuZ2V0KFwidGV4dFwiKSkgfHwgdGhpcy50ZXN0KG1vZGVsLmdldChcInZhbHVlXCIpKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICB0ZXN0OiBmdW5jdGlvbiAodGV4dCkge1xyXG5cclxuICAgICAgICB2YXIgcmVzID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChfLmlzU3RyaW5nKHRleHQpKSB7XHJcblxyXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgcmVzID0gX3Muc3RhcnRzV2l0aCh0ZXh0LCB0aGlzLmlucHV0KSB8fFxyXG4gICAgICAgICAgICAgICAgX3MuY29udGFpbnModGV4dCwgXCIgXCIgKyB0aGlzLmlucHV0KSB8fFxyXG4gICAgICAgICAgICAgICAgX3MuY29udGFpbnModGV4dCwgXCI6XCIgKyB0aGlzLmlucHV0KSB8fFxyXG4gICAgICAgICAgICAgICAgX3MuY29udGFpbnModGV4dCwgXCIuXCIgKyB0aGlzLmlucHV0KSB8fFxyXG4gICAgICAgICAgICAgICAgX3MuY29udGFpbnModGV4dCwgXCJAXCIgKyB0aGlzLmlucHV0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0sXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBoaWdobGlnaHRLZXk6IGZ1bmN0aW9uIChrZXkpIHtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICByZXR1cm4ga2V5XHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKFwiXlwiICsgdGhpcy5pbnB1dCwgJ2dpJyksIGZ1bmN0aW9uIChzdHIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzxiPicgKyBzdHIgKyAnPC9iPic7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UobmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuaW5wdXQsICdnaScpLCBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcgPGI+JyArIF9zLnN0clJpZ2h0KHN0ciwgJyAnKSArICc8L2I+JztcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKFwiOlwiICsgdGhpcy5pbnB1dCwgXCJnaVwiKSwgZnVuY3Rpb24gKHN0cikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnOjxiPicgKyBfcy5zdHJSaWdodChzdHIsICc6JykgKyAnPC9iPic7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UobmV3IFJlZ0V4cChcIkBcIiArIHRoaXMuaW5wdXQsIFwiZ2lcIiksIGZ1bmN0aW9uIChzdHIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ0A8Yj4nICsgX3Muc3RyUmlnaHQoc3RyLCAnQCcpICsgJzwvYj4nO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoXCJcXFxcLlwiICsgdGhpcy5pbnB1dCwgXCJnaVwiKSwgZnVuY3Rpb24gKHN0cikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnLjxiPicgKyBfcy5zdHJSaWdodChzdHIsICcuJykgKyAnPC9iPic7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGtleTtcclxuICAgIH1cclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gQXV0b0NvbXBsZXRlRmlsdGVyTW9kZWw7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBCYXNlTW9kZWwgPSByZXF1aXJlKFwiYmFzZS1tb2RlbFwiKTtcclxuXHJcbnZhciBNYWlsTW9kZWwgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxNb2RlbCA9IEJhc2VNb2RlbC5leHRlbmQoe1xyXG5cclxuICAgICAgICBkZWZhdWx0czoge1xyXG4gICAgICAgICAgICBmcm9tOiAnJyxcclxuICAgICAgICAgICAgdG86ICcnLFxyXG4gICAgICAgICAgICBjYzogJycsXHJcbiAgICAgICAgICAgIGJjYzogJycsXHJcbiAgICAgICAgICAgIHN1YmplY3Q6ICcnLFxyXG4gICAgICAgICAgICBzZW50VGltZTogJycsXHJcbiAgICAgICAgICAgIGJvZHk6ICcnLFxyXG4gICAgICAgICAgICBsYWJlbHM6IHt9LFxyXG4gICAgICAgICAgICBncm91cHM6IFtdXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVzb3VyY2U6ICdtYWlsJyxcclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKGF0dHJzLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVzZXJOYW1lID0gYXBwLnNldHRpbmdzLmdldChcInVzZXJOYW1lXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zb2NrZXQgPSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0TmFtZTogdGhpcy5yZXNvdXJjZSxcclxuICAgICAgICAgICAgICAgIGlvOiBhcHAuc29ja2V0Q29udHJvbGxlci5nZXRTb2NrZXQoKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdXJsOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyBcIi9cIiArIHRoaXMucmVzb3VyY2U7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gZ2V0IGFkZHJlc3Nlc1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBnZXRJbmdvaW5nQWRkcmVzc2VzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9nZXRBZGRyZXNzZXMoJ2Zyb20nKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZ2V0T3V0Z29pbmdBZGRyZXNzZXM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldEFkZHJlc3NlcygndG8nKS5jb25jYXQodGhpcy5fZ2V0QWRkcmVzc2VzKCdjYycpLCB0aGlzLl9nZXRBZGRyZXNzZXMoJ2JjYycpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2dldEFkZHJlc3NlczogZnVuY3Rpb24gKGF0dHIpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBhZGRyZXNzZXMgPSB0aGlzLmdldChhdHRyKS5zcGxpdChcIjtcIik7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc0VtcHR5KF8ubGFzdChhZGRyZXNzZXMpKSkge1xyXG4gICAgICAgICAgICAgICAgYWRkcmVzc2VzID0gXy5maXJzdChhZGRyZXNzZXMsIGFkZHJlc3Nlcy5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYWRkcmVzc2VzO1xyXG4gICAgICAgIH0sXHJcblxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBhZGRcXHJlbW92ZSBhZGRyZXNzXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGFkZEFkZHJlc3M6IGZ1bmN0aW9uIChhdHRyLCBhZGRyZXNzKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUxhc3RBZGRyZXNzKGF0dHIsIGFkZHJlc3MgKyBcIjtcIik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHVwZGF0ZUxhc3RBZGRyZXNzOiBmdW5jdGlvbiAoYXR0ciwgYWRkcmVzcykge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFkZHJMaXN0ID0gdGhpcy5nZXQoYXR0cikuc3BsaXQoXCI7XCIpO1xyXG4gICAgICAgICAgICBhZGRyTGlzdFthZGRyTGlzdC5sZW5ndGggLSAxXSA9IGFkZHJlc3M7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KGF0dHIsIGFkZHJMaXN0LmpvaW4oXCI7XCIpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcmVtb3ZlQWRkcmVzczogZnVuY3Rpb24gKGF0dHIsIGFkZHJlc3MpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBhZGRyTGlzdCA9IHRoaXMuZ2V0KGF0dHIpLnJlcGxhY2UoYWRkcmVzcyArIFwiO1wiLCBcIlwiKTtcclxuICAgICAgICAgICAgdGhpcy5zZXQoYXR0ciwgYWRkckxpc3QpO1xyXG4gICAgICAgIH0sXHJcblxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyB2YWxpZGF0ZVxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKGF0dHJzLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNhdmVBcyAhPT0gXCJkcmFmdFwiKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG91dGdvaW5nQWRkcmVzc2VzID0gdGhpcy5nZXRPdXRnb2luZ0FkZHJlc3NlcygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKF8uaXNFbXB0eShvdXRnb2luZ0FkZHJlc3NlcykpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWFpbE1vZGVsLkVycm9ycy5Ob1JlY2lwaWVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdG8gPSB0aGlzLl9nZXRBZGRyZXNzZXMoJ3RvJyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRvLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnZhbGlkYXRlQWRkcmVzcyh0b1tpXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1haWxNb2RlbC5FcnJvcnMuSW52YWxpZFRvQWRkcmVzcztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGNjID0gdGhpcy5fZ2V0QWRkcmVzc2VzKCdjYycpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNjLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnZhbGlkYXRlQWRkcmVzcyhjY1tpXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1haWxNb2RlbC5FcnJvcnMuSW52YWxpZENjQWRkcmVzcztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdmFsaWRhdGVBZGRyZXNzOiBmdW5jdGlvbiAoYWRkcmVzcykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlZyA9IC9eXFx3KyhbLSsuJ11cXHcrKSpAXFx3KyhbLS5dXFx3KykqXFwuXFx3KyhbLS5dXFx3KykqJC87XHJcbiAgICAgICAgICAgIHJldHVybiByZWcudGVzdChhZGRyZXNzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBtYXJrQXNcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbWFya0FzOiBmdW5jdGlvbiAobGFiZWwpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBvcHBvc2l0ZUxhYmVsID0gdGhpcy5fZ2V0T3Bvc2l0ZUxhYmVsKGxhYmVsKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUxhYmVsKG9wcG9zaXRlTGFiZWwpO1xyXG4gICAgICAgICAgICB0aGlzLl9hZGRMYWJlbChsYWJlbCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9nZXRPcG9zaXRlTGFiZWw6IGZ1bmN0aW9uIChsYWJlbCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKF9zLnN0YXJ0c1dpdGgobGFiZWwsIFwidW5cIikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfcy5zdHJSaWdodChsYWJlbCwgXCJ1blwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXCJ1blwiICsgbGFiZWw7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9hZGRMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZ2V0KFwibGFiZWxzLlwiICsgbGFiZWwpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldChcImxhYmVscy5cIiArIGxhYmVsLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfcmVtb3ZlTGFiZWw6IGZ1bmN0aW9uIChsYWJlbE5hbWUpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBsYWJlbHMgPSB0aGlzLmdldCgnbGFiZWxzJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5oYXMobGFiZWxzLCBsYWJlbE5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgbGFiZWxzW2xhYmVsTmFtZV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBtb3ZlVG9cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgbW92ZVRvOiBmdW5jdGlvbiAoZGVzdCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGdyb3VwcyA9IHRoaXMuZ2V0KCdncm91cHMnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmNvbnRhaW5zKGdyb3VwcywgXCJ0cmFzaFwiKSB8fCBfLmNvbnRhaW5zKGdyb3VwcywgXCJzcGFtXCIpIHx8IGRlc3QgPT09IFwidHJhc2hcIiB8fCBkZXN0ID09PSBcInNwYW1cIikge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXBzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdyb3Vwcy5wdXNoKGRlc3QpO1xyXG4gICAgICAgICAgICB0aGlzLnNldCgnZ3JvdXBzJywgZ3JvdXBzKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBNYWlsTW9kZWwuRXJyb3JzID0ge1xyXG5cclxuICAgICAgICBOb1JlY2lwaWVudDogMSxcclxuICAgICAgICBJbnZhbGlkVG9BZGRyZXNzOiAyLFxyXG4gICAgICAgIEludmFsaWRDY0FkZHJlc3M6IDNcclxuICAgIH07XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE1haWxNb2RlbDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIE1haWxSb3V0ZXIgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxSb3V0ZXIgPSBNYXJpb25ldHRlLkFwcFJvdXRlci5leHRlbmQoe1xyXG5cclxuICAgICAgICBhcHBSb3V0ZXM6IHtcclxuICAgICAgICAgICAgXCJcIjogXCJpbmJveFwiLFxyXG4gICAgICAgICAgICBcImluYm94XCI6IFwiaW5ib3hcIixcclxuICAgICAgICAgICAgXCJpbmJveC86cGFyYW1cIjogXCJpbmJveFwiLFxyXG4gICAgICAgICAgICBcImRyYWZ0XCI6IFwiZHJhZnRcIixcclxuICAgICAgICAgICAgXCJkcmFmdC86cGFyYW1cIjogXCJkcmFmdFwiLFxyXG4gICAgICAgICAgICBcInNlbnRcIjogXCJzZW50XCIsXHJcbiAgICAgICAgICAgIFwic2VudC86cGFyYW1cIjogXCJzZW50XCIsXHJcbiAgICAgICAgICAgIFwidHJhc2hcIjogXCJ0cmFzaFwiLFxyXG4gICAgICAgICAgICBcInRyYXNoLzpwYXJhbVwiOiBcInRyYXNoXCIsXHJcbiAgICAgICAgICAgIFwic3BhbVwiOiBcInNwYW1cIixcclxuICAgICAgICAgICAgXCJzcGFtLzpwYXJhbVwiOiBcInNwYW1cIixcclxuICAgICAgICAgICAgXCJzZWFyY2gvOnBhcmFtMVwiOiBcInNlYXJjaFwiLFxyXG4gICAgICAgICAgICBcInNlYXJjaC86cGFyYW0xLzpwYXJhbTJcIjogXCJzZWFyY2hcIixcclxuICAgICAgICAgICAgXCJjb21wb3NlXCI6IFwiY29tcG9zZVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250cm9sbGVyID0gb3B0aW9ucy5jb250cm9sbGVyO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJvdXRlOiBmdW5jdGlvbiAocm91dGUsIG5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBCYWNrYm9uZS5Sb3V0ZXIucHJvdG90eXBlLnJvdXRlLmNhbGwodGhpcywgcm91dGUsIG5hbWUsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udHJvbGxlci5iZWZvcmVSb3V0ZSgpO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcHJldmlvdXM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgbWFpbC5yb3V0ZXIubmF2aWdhdGUoXCJpbmJveFwiLCB7dHJpZ2dlcjogdHJ1ZX0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBmaXhVcmw6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbFJvdXRlcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnJlcXVpcmUoXCJwbHVnaW5zL3RvZ2dsZS5ibG9ja1wiKTtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvbW9yZUFjdGlvbnNWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBNb3JlQWN0aW9uc1ZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG4gICAgTW9yZUFjdGlvbnNWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG5cclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiAnYWN0aW9uT3B0aW9uc1ZpZXcnLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBkZGlTdGFycmVkOlwiLmFkZFN0YXJcIixcclxuICAgICAgICAgICAgZGRpTm90U3RhcnJlZDpcIi5yZW1vdmVTdGFyXCIsXHJcbiAgICAgICAgICAgIGRkaUltcDpcIi5tYXJrSW1wXCIsXHJcbiAgICAgICAgICAgIGRkaU5vdEltcDpcIi5tYXJrTm90SW1wXCIsXHJcbiAgICAgICAgICAgIGRkaVJlYWQ6XCIubWFya1JlYWRcIixcclxuICAgICAgICAgICAgZGRpVW5yZWFkOlwiLm1hcmtVbnJlYWRcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5kZGlSZWFkXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1hcmtBc1wiLCB7bGFiZWw6ICdyZWFkJ30pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5kZGlVbnJlYWRcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bWFya0FzXCIsIHtsYWJlbDogJ3VucmVhZCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuZGRpSW1wXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1hcmtBc1wiLCB7bGFiZWw6ICdpbXBvcnRhbnQnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaU5vdEltcFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDptYXJrQXNcIiwgeyBsYWJlbDogJ3VuaW1wb3J0YW50J30pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5kZGlTdGFycmVkXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1hcmtBc1wiLCB7bGFiZWw6ICdzdGFycmVkJ30pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIEB1aS5kZGlOb3RTdGFycmVkXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1hcmtBc1wiLCB7bGFiZWw6ICd1bnN0YXJyZWQnfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbHMsIFwiY2hhbmdlOml0ZW1zIHVwZGF0ZTpzdWNjZXNzIGNoYW5nZTpzZWxlY3Rpb25cIiwgdGhpcy5zZXREcm9wRG93bkl0ZW1zLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZXREcm9wRG93bkl0ZW1zOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgaXRlbXMgPSB0aGlzLml0ZW1zVG9TaG93KCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaVN0YXJyZWQudG9nZ2xlQmxvY2soaXRlbXMuc3RhcmVkKTtcclxuICAgICAgICAgICAgdGhpcy51aS5kZGlOb3RTdGFycmVkLnRvZ2dsZUJsb2NrKGl0ZW1zW1wibm90LXN0YXJlZFwiXSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuZGRpSW1wLnRvZ2dsZUJsb2NrKGl0ZW1zLmltcG9ydGFudCk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuZGRpTm90SW1wLnRvZ2dsZUJsb2NrKGl0ZW1zW1wibm90LWltcG9ydGFudFwiXSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuZGRpUmVhZC50b2dnbGVCbG9jayhpdGVtcy5yZWFkKTtcclxuICAgICAgICAgICAgdGhpcy51aS5kZGlVbnJlYWQudG9nZ2xlQmxvY2soaXRlbXMudW5yZWFkKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpdGVtc1RvU2hvdzpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLCBpdGVtcyA9IHt9O1xyXG5cclxuICAgICAgICAgICAgXy5lYWNoKHRoaXMubWFpbHMuZ2V0U2VsZWN0ZWQoKSwgZnVuY3Rpb24gKGl0ZW0pIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSB0aGF0Lm1haWxzLmdldChpdGVtKTtcclxuICAgICAgICAgICAgICAgIGlmKG1vZGVsKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGFiZWxzID0gbW9kZWwuZ2V0KFwibGFiZWxzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlSXRlbVRvU2hvdyhsYWJlbHMsaXRlbXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdXBkYXRlSXRlbVRvU2hvdzpmdW5jdGlvbihsYWJlbHMsaXRlbXMpe1xyXG5cclxuICAgICAgICAgICAgaWYoXy5oYXMobGFiZWxzLFwic3RhcnJlZFwiKSl7XHJcbiAgICAgICAgICAgICAgICBpdGVtc1tcIm5vdC1zdGFyZWRcIl0gPSB0cnVlO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIGl0ZW1zLnN0YXJlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoXy5oYXMobGFiZWxzLFwiaW1wb3J0YW50XCIpKXtcclxuICAgICAgICAgICAgICAgIGl0ZW1zW1wibm90LWltcG9ydGFudFwiXSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgaXRlbXMuaW1wb3J0YW50ID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihfLmhhcyhsYWJlbHMsXCJyZWFkXCIpKXtcclxuICAgICAgICAgICAgICAgIGl0ZW1zLnVucmVhZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgaXRlbXMucmVhZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vcmVBY3Rpb25zVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL21vdmVUb1ZpZXcuaGJzXCIpO1xyXG5cclxucmVxdWlyZShcInBsdWdpbnMvdG9nZ2xlLmJsb2NrXCIpO1xyXG5cclxudmFyIE1vcmVWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuICAgIE1vcmVWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG5cclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiAnbW92ZVRvVmlldycsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIGRkaUluYm94OiBcIi5tb3ZlVG9JbmJveFwiLFxyXG4gICAgICAgICAgICBkZGlUcmFzaDogXCIubW92ZVRvVHJhc2hcIixcclxuICAgICAgICAgICAgZGRpU3BhbTogXCIubW92ZVRvU3BhbVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaUluYm94XCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1vdmVUb1wiLCB7dGFyZ2V0OiAnaW5ib3gnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaVRyYXNoXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1vdmVUb1wiLCB7dGFyZ2V0OiAndHJhc2gnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmRkaVNwYW1cIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bW92ZVRvXCIsIHt0YXJnZXQ6ICdzcGFtJ30pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKGFwcC5jb250ZXh0LCAnY2hhbmdlOm1haWwuYWN0aW9uJywgdGhpcy5zaG93UmVsZXZhbnRJdGVtcywgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93UmVsZXZhbnRJdGVtczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jdXJyQWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb24udHlwZVwiKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudWkuZGRpSW5ib3gudG9nZ2xlQmxvY2soIV8uY29udGFpbnMoW1wiaW5ib3hcIl0sIHRoaXMuY3VyckFjdGlvbikpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmRkaVNwYW0udG9nZ2xlQmxvY2soXy5jb250YWlucyhbXCJpbmJveFwiLCBcInRyYXNoXCJdLCB0aGlzLmN1cnJBY3Rpb24pKTtcclxuICAgICAgICAgICAgdGhpcy51aS5kZGlUcmFzaC50b2dnbGVCbG9jayhfLmNvbnRhaW5zKFtcInNwYW1cIiwgXCJpbmJveFwiXSwgdGhpcy5jdXJyQWN0aW9uKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb3JlVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL3BhZ2VyVmlldy5oYnNcIik7XHJcblxyXG52YXIgUGFnZXJWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuICAgIFBhZ2VyVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuXHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogJ3BhZ2VJbmZvVmlldycsXHJcbiAgICAgICAgcGFnZUluZm86IHt9LFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBjb250YWluZXI6XCIucGFnZXJJbm5lckNvbnRhaW5lclwiLFxyXG4gICAgICAgICAgICBidG5OZXdlcjogXCIuYnRuTmV3ZXJcIixcclxuICAgICAgICAgICAgYnRuT2xkZXI6IFwiLmJ0bk9sZGVyXCIsXHJcbiAgICAgICAgICAgIGxibFRvdGFsOiBcIi50b3RhbFwiLFxyXG4gICAgICAgICAgICBsYmxGcm9tOiBcIi5sYmxGb3JtXCIsXHJcbiAgICAgICAgICAgIGxibFRvOiBcIi5sYmxUb1wiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmJ0bk5ld2VyXCI6IFwic2hvd05ld2VySXRlbXNcIixcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuYnRuT2xkZXJcIjogXCJzaG93T2xkZXJJdGVtc1wiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWlscyA9IG1haWwuY2hhbm5lbC5yZXFyZXMucmVxdWVzdChcIm1haWw6Y29sbGVjdGlvblwiKTtcclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6bWV0YWRhdGFcIix0aGlzLmFkanVzdFBhZ2UsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblJlbmRlcjpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgIHRoaXMuYWRqdXN0UGFnZSgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGFkanVzdFBhZ2VcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgYWRqdXN0UGFnZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgaWYoXy5pc09iamVjdCh0aGlzLm1haWxzLm1ldGFkYXRhKSAmJiB0aGlzLm1haWxzLm1ldGFkYXRhLnRvdGFsID4gMCl7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQYWdlSW5mbygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGp1c3RCdXR0b25zKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkanVzdExhYmVscygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51aS5jb250YWluZXIuc2hvdygpO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHRoaXMudWkuY29udGFpbmVyLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB1cGRhdGVQYWdlSW5mbzpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdmFyIG1ldGFkYXRhID0gdGhpcy5tYWlscy5tZXRhZGF0YTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucGFnZUluZm8udG90YWwgPSBtZXRhZGF0YS50b3RhbDtcclxuICAgICAgICAgICAgdGhpcy5wYWdlSW5mby5jdXJyUGFnZSA9IG1ldGFkYXRhLmN1cnJQYWdlICsgMTtcclxuICAgICAgICAgICAgdGhpcy5wYWdlSW5mby5mcm9tID0gbWV0YWRhdGEuZnJvbSArIDE7XHJcbiAgICAgICAgICAgIHRoaXMucGFnZUluZm8udG8gPSBNYXRoLm1pbihtZXRhZGF0YS50b3RhbCwgbWV0YWRhdGEudG8gKyAxKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgYWRqdXN0QnV0dG9uczogZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudWkuYnRuTmV3ZXIudG9nZ2xlQ2xhc3MoXCJkaXNhYmxlXCIsdGhpcy5wYWdlSW5mby5mcm9tID09PSAxKTtcclxuICAgICAgICAgICAgdGhpcy51aS5idG5PbGRlci50b2dnbGVDbGFzcyhcImRpc2FibGVcIix0aGlzLnBhZ2VJbmZvLnRvID49IHRoaXMucGFnZUluZm8udG90YWwpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBhZGp1c3RMYWJlbHM6IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVpLmxibEZyb20udGV4dCh0aGlzLnBhZ2VJbmZvLmZyb20pO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmxibFRvLnRleHQoTWF0aC5taW4odGhpcy5wYWdlSW5mby50bywgdGhpcy5wYWdlSW5mby50b3RhbCkpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmxibFRvdGFsLnRleHQodGhpcy5wYWdlSW5mby50b3RhbCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gYnV0dG9ucyBjbGlja1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93TmV3ZXJJdGVtczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMucGFnZUluZm8uZnJvbSA+IDEpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uYXZpZ2F0ZSh0aGlzLnBhZ2VJbmZvLmN1cnJQYWdlIC0gMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvd09sZGVySXRlbXM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBhZ2VJbmZvLnRvIDwgdGhpcy5wYWdlSW5mby50b3RhbCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5hdmlnYXRlKHRoaXMucGFnZUluZm8uY3VyclBhZ2UgKyAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBuYXZpZ2F0ZTogZnVuY3Rpb24ocGFnZSl7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb25cIik7XHJcbiAgICAgICAgICAgIHZhciBzZWFyY2ggPSBhY3Rpb24ucGFyYW1zLnF1ZXJ5ID8gXCIvXCIgKyBhY3Rpb24ucGFyYW1zLnF1ZXJ5IDogXCJcIjtcclxuICAgICAgICAgICAgbWFpbC5yb3V0ZXIubmF2aWdhdGUoYWN0aW9uLnR5cGUgKyBzZWFyY2ggKyBcIi9wXCIgKyBwYWdlLnRvU3RyaW5nKCksIHsgdHJpZ2dlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2VyVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIFBhZ2VyVmlldyA9IHJlcXVpcmUoXCIuL19wYWdlclZpZXdcIik7XHJcbnZhciBNb3ZlVG9WaWV3ID0gcmVxdWlyZShcIi4vX21vdmVUb1ZpZXdcIik7XHJcbnZhciBNb3JlQWN0aW9uc1ZpZXcgPSByZXF1aXJlKFwiLi9fbW9yZUFjdGlvbnNWaWV3XCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvYWN0aW9uVmlldy5oYnNcIik7XHJcblxyXG52YXIgQWN0aW9uVmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcbiAgICBBY3Rpb25WaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICBjbGFzc05hbWU6ICdhY3Rpb25WaWV3JyxcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgYnRuU2VsZWN0OiBcIi5idG5TZWxlY3RcIixcclxuICAgICAgICAgICAgYnRuTW92ZVRvOiBcIi5idG5Nb3ZlVG9cIixcclxuICAgICAgICAgICAgYnRuRGVsZXRlOiBcIi5idG5EZWxldGVcIixcclxuICAgICAgICAgICAgYnRuTW9yZTogXCIuYnRuTW9yZVwiLFxyXG4gICAgICAgICAgICBwYWdlclJlZ2lvbjogXCIucGFnZXJcIixcclxuICAgICAgICAgICAgc2VydmVyQWN0aW9uc1JlZ2lvbjogXCIuc2VydmVyQWN0aW9uc1wiLFxyXG4gICAgICAgICAgICBsYmxDb21wb3NlOlwiLmxibENvbXBvc2VcIixcclxuICAgICAgICAgICAgYnRuRGlzY2FyZERyYWZ0czogXCIuYnRuRGlzY2FyZERyYWZ0c1wiLFxyXG4gICAgICAgICAgICBidG5EZWxldGVGb3JldmVyOiBcIi5idG5EZWxldGVGb3JldmVyXCIsXHJcbiAgICAgICAgICAgIGJ0bk5vdFNwYW06IFwiLmJ0bk5vdFNwYW1cIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNsaWNrIC5zZWxlY3RBbGxcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6c2VsZWN0XCIsIHtzZWxlY3RCeTogXCJhbGxcIn0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNsaWNrIC5zZWxlY3ROb25lXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOnNlbGVjdFwiLCB7c2VsZWN0Qnk6IFwibm9uZVwifSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgLnNlbGVjdFJlYWRcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6c2VsZWN0XCIsIHtzZWxlY3RCeTogXCJyZWFkXCJ9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayAuc2VsZWN0VW5yZWFkXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOnNlbGVjdFwiLCB7c2VsZWN0Qnk6IFwidW5yZWFkXCJ9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuYnRuRGVsZXRlXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOm1vdmVUb1wiLCB7dGFyZ2V0OiAndHJhc2gnfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmJ0bk5vdFNwYW1cIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6bW92ZVRvXCIsIHt0YXJnZXQ6ICdpbmJveCd9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGljayBAdWkuYnRuRGlzY2FyZERyYWZ0c1wiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbDpkZWxldGVcIik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2sgQHVpLmJ0bkRlbGV0ZUZvcmV2ZXJcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6ZGVsZXRlXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWlscyA9IG1haWwuY2hhbm5lbC5yZXFyZXMucmVxdWVzdChcIm1haWw6Y29sbGVjdGlvblwiKTtcclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8obWFpbC5jaGFubmVsLnZlbnQsIFwibWFpbDpjaGFuZ2VcIiwgdGhpcy5vbk1haWxDaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubWFpbHMsIFwiY2hhbmdlOnNlbGVjdGlvblwiLCB0aGlzLnNob3dSZWxldmFudEl0ZW1zLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhhcHAuY29udGV4dCwgJ2NoYW5nZTptYWlsLmFjdGlvbicsIHRoaXMuc2hvd1JlbGV2YW50SXRlbXMsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJue1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBfcy5jYXBpdGFsaXplKGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uLnR5cGVcIikpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucGFnZXJWaWV3ID0gbmV3IFBhZ2VyVmlldyh7XHJcbiAgICAgICAgICAgICAgICBlbDogdGhpcy51aS5wYWdlclJlZ2lvblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5wYWdlclZpZXcucmVuZGVyKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1vcmVBY3Rpb25zVmlldyA9IG5ldyBNb3JlQWN0aW9uc1ZpZXcoe1xyXG4gICAgICAgICAgICAgICAgZWw6IHRoaXMudWkuYnRuTW9yZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5tb3JlQWN0aW9uc1ZpZXcucmVuZGVyKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1vdmVUb1ZpZXcgPSBuZXcgTW92ZVRvVmlldyh7XHJcbiAgICAgICAgICAgICAgICBlbDogdGhpcy51aS5idG5Nb3ZlVG9cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMubW92ZVRvVmlldy5yZW5kZXIoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHNob3dSZWxldmFudEl0ZW1zXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgc2hvd1JlbGV2YW50SXRlbXM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvbi50eXBlXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yZXNldFVJKCk7XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNvbXBvc2VcIjpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dJdGVtcyhbXCJsYmxDb21wb3NlXCJdKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TGlzdE9wdGlvbnMoYWN0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZXNldFVJOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNob3dJdGVtcyhfLmtleXModGhpcy51aSksIGZhbHNlKTtcclxuICAgICAgICAgICAgdGhpcy51aS5sYmxDb21wb3NlLnRleHQoYXBwLnRyYW5zbGF0b3IudHJhbnNsYXRlKFwibWFpbDpuZXdNZXNzYWdlXCIpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzaG93TGlzdE9wdGlvbnM6IGZ1bmN0aW9uIChhY3Rpb24pIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0l0ZW1zKFtcImJ0blNlbGVjdFwiLCBcInBhZ2VyUmVnaW9uXCJdKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghXy5pc0VtcHR5KHRoaXMubWFpbHMuZ2V0U2VsZWN0ZWQoKSkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJkcmFmdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dJdGVtcyhbXCJidG5TZWxlY3RcIiwgXCJidG5EaXNjYXJkRHJhZnRzXCIsIFwiYnRuTW9yZVwiXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzcGFtXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0l0ZW1zKFtcImJ0blNlbGVjdFwiLCBcImJ0bk5vdFNwYW1cIiwgXCJidG5EZWxldGVGb3JldmVyXCIsIFwiYnRuTW9yZVwiXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ0cmFzaFwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dJdGVtcyhbXCJidG5TZWxlY3RcIiwgXCJidG5EZWxldGVGb3JldmVyXCIsIFwiYnRuTW92ZVRvXCIsIFwiYnRuTW9yZVwiXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0l0ZW1zKFtcImJ0blNlbGVjdFwiLCBcImJ0bkRlbGV0ZVwiLCBcImJ0bk1vdmVUb1wiLCBcImJ0bk1vcmVcIl0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNob3dJdGVtczogZnVuY3Rpb24gKGl0ZW1zLCBzaG93KSB7XHJcblxyXG4gICAgICAgICAgICBzaG93ID0gXy5pc0Jvb2xlYW4oc2hvdykgPyBzaG93IDogdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIF8uZWFjaChpdGVtcywgXy5iaW5kKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVpW2l0ZW1dLnRvZ2dsZShzaG93KTtcclxuICAgICAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25NYWlsQ2hhbmdlXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25NYWlsQ2hhbmdlOmZ1bmN0aW9uKG1haWxNb2RlbCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3ViamVjdCA9IG1haWxNb2RlbC5nZXQoJ3N1YmplY3QnKTtcclxuXHJcbiAgICAgICAgICAgIGlmKF8uaXNFbXB0eShzdWJqZWN0KSl7XHJcbiAgICAgICAgICAgICAgICBzdWJqZWN0ID0gYXBwLnRyYW5zbGF0b3IudHJhbnNsYXRlKFwibWFpbDpuZXdNZXNzYWdlXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMudWkubGJsQ29tcG9zZS50ZXh0KHN1YmplY3QpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWN0aW9uVmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIFRhZ3MgPSByZXF1aXJlKFwidGFnc1wiKTtcclxudmFyIEF1dG9Db21wbGV0ZSA9IHJlcXVpcmUoXCJhdXRvQ29tcGxldGVcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9fYWRkcmVzc1ZpZXcuaGJzXCIpO1xyXG52YXIgQ29udGFjdHNGaWx0ZXJNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9jb250YWN0c0ZpbHRlck1vZGVsXCIpO1xyXG5cclxudmFyIEFkZHJlc3NWaWV3ID17fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCAgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuICAgIEFkZHJlc3NWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG5cclxuICAgICAgICBjbGFzc05hbWU6ICdhZGRyZXNzVmlldycsXHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICB0YWdzUGxhY2Vob2xkZXI6IFwiLnRhZ3NQbGFjZWhvbGRlclwiLFxyXG4gICAgICAgICAgICBhdXRvQ29tcGxldGVQbGFjZWhvbGRlcjogXCIuYXV0b0NvbXBsZXRlUGxhY2Vob2xkZXJcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIGluaXRpYWxpemVcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTpmdW5jdGlvbihvcHRpb25zKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxBdHRyID0gb3B0aW9ucy5tb2RlbEF0dHI7XHJcbiAgICAgICAgICAgIHRoaXMudmVudCA9IG5ldyBCYWNrYm9uZS5XcmVxci5FdmVudEFnZ3JlZ2F0b3IoKTtcclxuICAgICAgICAgICAgdGhpcy5jb250YWN0cyA9IG1haWwuY2hhbm5lbC5yZXFyZXMucmVxdWVzdChcImNvbnRhY3Q6Y29sbGVjdGlvblwiKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMudmVudCwgXCJ0YWc6YWRkXCIsIHRoaXMuYWRkQWRkcmVzcywgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy52ZW50LCBcInRhZzpyZW1vdmVcIiwgdGhpcy5yZW1vdmVBZGRyZXNzLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsIFwiaW5wdXQ6Y2hhbmdlXCIsIHRoaXMudXBkYXRlTGFzdEFkZHJlc3MsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMuY29udGFjdHMsIFwiZmV0Y2g6c3VjY2Vzc1wiLCB0aGlzLnJlbmRlckF1dG9Db21wb25lbnQsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG9uUmVuZGVyXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJlbmRlclRhZ0NvbXBvbmVudCgpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlckF1dG9Db21wb25lbnQoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcmVuZGVyVGFnQ29tcG9uZW50OmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRhZ3MgPSBuZXcgVGFncyh7XHJcbiAgICAgICAgICAgICAgICBlbDp0aGlzLnVpLnRhZ3NQbGFjZWhvbGRlcixcclxuICAgICAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudCxcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRvcjogdGhpcy5tb2RlbC52YWxpZGF0ZUFkZHJlc3MsXHJcbiAgICAgICAgICAgICAgICBpbml0aWFsVGFnczogdGhpcy5nZXRBZGRyZXNzZXMoKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy50YWdzLnNob3coKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgcmVuZGVyQXV0b0NvbXBvbmVudDpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgaWYoIXRoaXMuYXV0b0NvbXBsZXRlICYmICF0aGlzLmNvbnRhY3RzLmlzRW1wdHkoKSl7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5hdXRvQ29tcGxldGUgPSBuZXcgQXV0b0NvbXBsZXRlKHtcclxuICAgICAgICAgICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHRoaXMuZ2V0Q29udGFjdEFycmF5KCksXHJcbiAgICAgICAgICAgICAgICAgICAgZWw6dGhpcy51aS5hdXRvQ29tcGxldGVQbGFjZWhvbGRlcixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJNb2RlbDogbmV3IENvbnRhY3RzRmlsdGVyTW9kZWwoKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF1dG9Db21wbGV0ZS5zaG93KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGdldENvbnRhY3RBcnJheTpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdmFyIF9jb250YWN0cyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250YWN0cy5lYWNoKGZ1bmN0aW9uKG1vZGVsKXtcclxuICAgICAgICAgICAgICAgIF9jb250YWN0cy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBtb2RlbC5nZXQoXCJ0aXRsZVwiKSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbW9kZWwuZ2V0KFwiYWRkcmVzc1wiKSxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBBdXRvQ29tcGxldGUuVFlQRVMuQ09OVEFDVFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gX2NvbnRhY3RzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZ2V0QWRkcmVzc2VzOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVzID0gW10sIGFkZHJlc3NlcyA9IHRoaXMubW9kZWwuZ2V0KHRoaXMubW9kZWxBdHRyKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCFfLmlzRW1wdHkoYWRkcmVzc2VzKSl7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWRkcmVzc0FyciA9IF9zLnN0ckxlZnRCYWNrKGFkZHJlc3NlcywgXCI7XCIpLnNwbGl0KFwiO1wiKTtcclxuXHJcbiAgICAgICAgICAgICAgICBfLmVhY2goYWRkcmVzc0FyciwgZnVuY3Rpb24oYWRkcmVzcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Om1haWwuZGF0YUNvbnRyb2xsZXIuY29udGFjdENvbGxlY3Rpb24uZ2V0VGl0bGVzKFthZGRyZXNzXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOmFkZHJlc3NcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBhZGRBZGRyZXNzOiBmdW5jdGlvbihhZGRyZXNzKXtcclxuICAgICAgICAgICAgdGhpcy5tb2RlbC5hZGRBZGRyZXNzKHRoaXMubW9kZWxBdHRyLCBhZGRyZXNzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHVwZGF0ZUxhc3RBZGRyZXNzOiBmdW5jdGlvbihhZGRyZXNzKXtcclxuICAgICAgICAgICAgdGhpcy5tb2RlbC51cGRhdGVMYXN0QWRkcmVzcyh0aGlzLm1vZGVsQXR0ciwgYWRkcmVzcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW1vdmVBZGRyZXNzOiBmdW5jdGlvbihhZGRyZXNzKXtcclxuICAgICAgICAgICAgdGhpcy5tb2RlbC5yZW1vdmVBZGRyZXNzKHRoaXMubW9kZWxBdHRyLCBhZGRyZXNzKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFkZHJlc3NWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgQWRkcmVzc1ZpZXcgPSByZXF1aXJlKFwiLi9fYWRkcmVzc1ZpZXdcIik7XHJcbnZhciBNYWlsTW9kZWwgPSByZXF1aXJlKFwibWFpbC1tb2RlbHMvbWFpbE1vZGVsXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvY29tcG9zZVZpZXcuaGJzXCIpO1xyXG5cclxudmFyIENvbXBvc2VWaWV3ID17fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgbWIsICBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG4gICAgQ29tcG9zZVZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogJ2NvbXBvc2VWaWV3JyxcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgdG9JbnB1dFdyYXBwZXI6IFwiLnRvSW5wdXRXcmFwcGVyXCIsXHJcbiAgICAgICAgICAgIGNjSW5wdXRXcmFwcGVyOiBcIi5jY0lucHV0V3JhcHBlclwiLFxyXG4gICAgICAgICAgICBpbnB1dFN1YmplY3Q6IFwiLnN1YmplY3RcIixcclxuICAgICAgICAgICAgaW5wdXRFZGl0b3I6IFwiLmNvbXBvc2UtZWRpdG9yXCIsXHJcbiAgICAgICAgICAgIGhlYWRlcjpcIi5jb21wb3NlLWhlYWRlclwiLFxyXG4gICAgICAgICAgICBjY0xpbmU6ICcuY2NMaW5lJyxcclxuICAgICAgICAgICAgc2VuZEJ0bjpcIi5zZW5kQnRuXCIsXHJcbiAgICAgICAgICAgIGNsb3NlQnRuOlwiLmNsb3NlQnRuXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgXCJjbGljayAgQHVpLmNsb3NlQnRuXCI6IFwib25DbG9zZUJ0bkNsaWNrXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgIEB1aS5zZW5kQnRuXCI6IFwib25TZW5kQ2xpY2tcIixcclxuICAgICAgICAgICAgXCJibHVyICAgQHVpLmlucHV0U3ViamVjdFwiOiBcIm9uU3ViamVjdEJsdXJcIixcclxuICAgICAgICAgICAgXCJibHVyICAgQHVpLmlucHV0RWRpdG9yXCI6IFwib25FZGl0b3JCbHVyXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgIEB1aS50b0lucHV0V3JhcHBlclwiOiBcIm9uVG9JbnB1dFdyYXBwZXJDbGlja1wiLFxyXG4gICAgICAgICAgICBcImNsaWNrICBAdWkuY2NJbnB1dFdyYXBwZXJcIjogXCJvbkNjSW5wdXRXcmFwcGVyQ2xpY2tcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG1vZGVsRXZlbnRzOntcclxuICAgICAgICAgIGNoYW5nZTpcIm9uTW9kZWxDaGFuZ2VcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6ZnVuY3Rpb24ob3B0aW9ucyl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RzID0gb3B0aW9ucy5jb250YWN0cztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG9uUmVuZGVyXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyVG9WaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQ2NWaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuaW5wdXRFZGl0b3IuaHRtbCh0aGlzLm1vZGVsLmdldCgnYm9keScpKTtcclxuICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJlbmRlclRvVmlldzpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdGhpcy50b1ZpZXcgPSBuZXcgQWRkcmVzc1ZpZXcoe1xyXG4gICAgICAgICAgICAgICAgbW9kZWw6dGhpcy5tb2RlbCxcclxuICAgICAgICAgICAgICAgIG1vZGVsQXR0cjondG8nLFxyXG4gICAgICAgICAgICAgICAgZWw6IHRoaXMudWkudG9JbnB1dFdyYXBwZXJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMudG9WaWV3LnJlbmRlcigpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW5kZXJDY1ZpZXc6ZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2NWaWV3ID0gbmV3IEFkZHJlc3NWaWV3KHtcclxuICAgICAgICAgICAgICAgIG1vZGVsOnRoaXMubW9kZWwsXHJcbiAgICAgICAgICAgICAgICBtb2RlbEF0dHI6J2NjJyxcclxuICAgICAgICAgICAgICAgIGVsOiB0aGlzLnVpLmNjSW5wdXRXcmFwcGVyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmNjVmlldy5yZW5kZXIoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBldmVudHMgaGFuZGxlcnNcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25TdWJqZWN0Qmx1cjogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy5tb2RlbC5zZXQoJ3N1YmplY3QnLCB0aGlzLnVpLmlucHV0U3ViamVjdC52YWwoKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uRWRpdG9yQmx1cjogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy5tb2RlbC5zZXQoJ2JvZHknLHRoaXMudWkuaW5wdXRFZGl0b3IuaHRtbCgpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25TZW5kQ2xpY2s6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6c2VuZFwiLHRoaXMubW9kZWwpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkNsb3NlQnRuQ2xpY2s6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgbWFpbC5jaGFubmVsLnZlbnQudHJpZ2dlcihcIm1haWw6ZGlzY2FyZFwiLHRoaXMubW9kZWwpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvblRvSW5wdXRXcmFwcGVyQ2xpY2s6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy51aS50b0lucHV0V3JhcHBlci5yZW1vdmVDbGFzcyhcImVycm9yXCIpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkNjSW5wdXRXcmFwcGVyQ2xpY2s6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy51aS5jY0lucHV0V3JhcHBlci5yZW1vdmVDbGFzcyhcImVycm9yXCIpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbk1vZGVsQ2hhbmdlOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIG1haWwuY2hhbm5lbC52ZW50LnRyaWdnZXIoXCJtYWlsOmNoYW5nZVwiLHRoaXMubW9kZWwpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkludmFsaWQ6ZnVuY3Rpb24obW9kZWwsIGVycm9yKXtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaChlcnJvcil7XHJcbiAgICAgICAgICAgICAgICBjYXNlIE1haWxNb2RlbC5FcnJvcnMuTm9SZWNpcGllbnQ6IGNhc2UgTWFpbE1vZGVsLkVycm9ycy5JbnZhbGlkVG9BZGRyZXNzOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudWkudG9JbnB1dFdyYXBwZXIuYWRkQ2xhc3MoXCJlcnJvclwiKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgTWFpbE1vZGVsLkVycm9ycy5JbnZhbGlkQ2NBZGRyZXNzOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudWkuY2NJbnB1dFdyYXBwZXIuYWRkQ2xhc3MoXCJlcnJvclwiKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29tcG9zZVZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9lbXB0eUZvbGRlclZpZXcuaGJzXCIpO1xyXG5cclxudmFyIEVtcHR5Rm9sZGVyVmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgRW1wdHlGb2xkZXJWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICBpc1Blcm1hbmVudDogdHJ1ZSxcclxuICAgICAgICBjbGFzc05hbWU6IFwiZW1wdHktZm9sZGVyXCIsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIFwibXNnVGl0bGVcIjogXCIubXNnVGl0bGVcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWlscyA9IG1haWwuY2hhbm5lbC5yZXFyZXMucmVxdWVzdChcIm1haWw6Y29sbGVjdGlvblwiKTtcclxuICAgICAgICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2JpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6aXRlbXMgdXBkYXRlOnN1Y2Nlc3MgZGVsZXRlOnN1Y2Nlc3NcIiwgdGhpcy5jaGVja0lmRW1wdHksIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgY2hlY2tJZkVtcHR5OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgaXNFbXB0eSA9IHRoaXMubWFpbHMuaXNFbXB0eSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzRW1wdHkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhcHAuY29udGV4dC5nZXQoXCJtYWlsLmFjdGlvblwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudWkubXNnVGl0bGUuaHRtbChhcHAudHJhbnNsYXRvci50cmFuc2xhdGUoXCJtYWlsOmVtcHR5Rm9sZGVyLlwiICsgYWN0aW9uLnR5cGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLiRlbC50b2dnbGUoaXNFbXB0eSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbXB0eUZvbGRlclZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9lbXB0eU1haWxWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBFbXB0eU1haWxWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBFbXB0eU1haWxWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICBpc1Blcm1hbmVudDogdHJ1ZSxcclxuXHJcbiAgICAgICAgdWk6IHtcclxuICAgICAgICAgICAgY291bnRlcjogXCIuY291bnRlclwiLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIi5tZXNzYWdlXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haWxzID0gbWFpbC5jaGFubmVsLnJlcXJlcy5yZXF1ZXN0KFwibWFpbDpjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIF9iaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tYWlscywgXCJjaGFuZ2U6c2VsZWN0aW9uXCIsIHRoaXMub25TZWxlY3Rpb25DaGFuZ2UsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25TZWxlY3Rpb25DaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMubWFpbHMuZ2V0U2VsZWN0ZWQoKS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVpLmNvdW50ZXIuaHRtbChzZWxlY3RlZCk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuY291bnRlci50b2dnbGUoc2VsZWN0ZWQgPiAwKTtcclxuICAgICAgICAgICAgdGhpcy51aS5tZXNzYWdlLnRvZ2dsZShzZWxlY3RlZCA9PT0gMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbXB0eU1haWxWaWV3O1xyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIGxheW91dFRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL2NvbnRlbnRMYXlvdXQuaGJzXCIpO1xyXG5cclxudmFyIENvbnRlbnRMYXlvdXQgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIENvbnRlbnRMYXlvdXQgPSBNYXJpb25ldHRlLkxheW91dFZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTogbGF5b3V0VGVtcGxhdGUsXHJcbiAgICAgICAgaXNQZXJtYW5lbnQ6IHRydWUsXHJcbiAgICAgICAgcmVnaW9uczoge1xyXG4gICAgICAgICAgICBpdGVtc1JlZ2lvbjogXCIubWFpbC1pdGVtcy1yZWdpb25cIixcclxuICAgICAgICAgICAgcHJldmlld1JlZ2lvbjogXCIubWFpbC1wcmV2aWV3LXJlZ2lvblwiLFxyXG4gICAgICAgICAgICBtZXNzYWdlQm9hcmQ6IFwiLm1haWwtbWVzc2FnZS1ib2FyZC1yZWdpb25cIlxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29udGVudExheW91dDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIGZvcm1hdHRlciA9IHJlcXVpcmUoXCJyZXNvbHZlcnMvZm9ybWF0dGVyXCIpO1xyXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvbWFpbEl0ZW1WaWV3Lmhic1wiKTtcclxuXHJcbnZhciBNYWlsVGFibGVSb3dWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBNYWlsVGFibGVSb3dWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuICAgICAgICB0YWdOYW1lOiAndHInLFxyXG4gICAgICAgIGNsYXNzTmFtZTogJ2luYm94X3JvdycsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIGNoZWNrQm94OiBcIi5jaGtCb3hcIixcclxuICAgICAgICAgICAgc2VsZWN0b3I6IFwiLnNlbGVjdG9yXCIsXHJcbiAgICAgICAgICAgIHN0YXJJY29uOiBcIi5zdGFyLWljb25cIixcclxuICAgICAgICAgICAgaW1wSWNvbjogXCIuaW1wb3J0YW5jZS1pY29uXCIsXHJcbiAgICAgICAgICAgIGFkZHJlc3M6IFwiLmFkZHJlc3NcIixcclxuICAgICAgICAgICAgc3ViamVjdDogXCIuc3ViamVjdFwiLFxyXG4gICAgICAgICAgICBib2R5OiBcIi5ib2R5XCIsXHJcbiAgICAgICAgICAgIHNlbnRUaW1lOiBcIi5zZW50VGltZVwiXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHJpZ2dlcnM6IHtcclxuICAgICAgICAgICAgXCJjbGljayAuc3RhclwiOiBcImNsaWNrXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgLmltcG9ydGFuY2VcIjogXCJjbGlja1wiLFxyXG4gICAgICAgICAgICBcImNsaWNrIC5hZGRyZXNzXCI6IFwiY2xpY2tcIixcclxuICAgICAgICAgICAgXCJjbGljayAuY29udGVudFwiOiBcImNsaWNrXCIsXHJcbiAgICAgICAgICAgIFwiY2xpY2sgLnNlbnRUaW1lXCI6IFwiY2xpY2tcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNsaWNrIC5zZWxlY3RvclwiOiBcIm9uUm93U2VsZWN0XCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBtb2RlbEV2ZW50czoge1xyXG4gICAgICAgICAgICBcImNoYW5nZTpzdWJqZWN0XCI6IFwiX29uU3ViamVjdENoYW5nZWRcIixcclxuICAgICAgICAgICAgXCJjaGFuZ2U6Ym9keVwiOiBcIl9vbkJvZHlDaGFuZ2VkXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uLnR5cGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJjb250YWN0OmNvbGxlY3Rpb25cIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmxhYmVscy4qXCIsIHRoaXMudG9nZ2xlVUkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHRlbXBsYXRlSGVscGVyc1xyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBpc0luYm94OiB0aGlzLmFjdGlvbiA9PT0gXCJpbmJveFwiLFxyXG4gICAgICAgICAgICAgICAgaXNTZW50OiB0aGlzLmFjdGlvbiA9PT0gXCJzZW50XCIsXHJcbiAgICAgICAgICAgICAgICBpc0RyYWZ0OiB0aGlzLmFjdGlvbiA9PT0gXCJkcmFmdFwiLFxyXG4gICAgICAgICAgICAgICAgaXNUcmFzaDogdGhpcy5hY3Rpb24gPT09IFwidHJhc2hcIixcclxuICAgICAgICAgICAgICAgIGlzU3BhbTogdGhpcy5hY3Rpb24gPT09IFwic3BhbVwiLFxyXG4gICAgICAgICAgICAgICAgaXNTZWFyY2g6IHRoaXMuYWN0aW9uID09PSBcInNlYXJjaFwiLFxyXG5cclxuICAgICAgICAgICAgICAgIGJvZHk6IGZvcm1hdHRlci5mb3JtYXRDb250ZW50KHRoaXMubW9kZWwuZ2V0KFwiYm9keVwiKSksXHJcbiAgICAgICAgICAgICAgICBzdWJqZWN0OiBmb3JtYXR0ZXIuZm9ybWF0U3ViamVjdCh0aGlzLm1vZGVsLmdldChcInN1YmplY3RcIiksYXBwLnRyYW5zbGF0b3IpLFxyXG4gICAgICAgICAgICAgICAgc2VudFRpbWU6IGZvcm1hdHRlci5mb3JtYXRTaG9ydERhdGUodGhpcy5tb2RlbC5nZXQoXCJzZW50VGltZVwiKSxhcHAudHJhbnNsYXRvciksXHJcbiAgICAgICAgICAgICAgICB0bzogZm9ybWF0dGVyLmZvcm1hdEFkZHJlc3Nlcyh0aGlzLmNvbnRhY3RzLmdldFRpdGxlcyh0aGlzLm1vZGVsLmdldE91dGdvaW5nQWRkcmVzc2VzKCkpKSxcclxuICAgICAgICAgICAgICAgIGZyb206IGZvcm1hdHRlci5mb3JtYXRBZGRyZXNzZXModGhpcy5jb250YWN0cy5nZXRUaXRsZXModGhpcy5tb2RlbC5nZXRJbmdvaW5nQWRkcmVzc2VzKCkpKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIG9uUmVuZGVyXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZVVJKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U2VsZWN0aW9uKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRvZ2dsZVVJOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbGFiZWxzID0gdGhpcy5tb2RlbC5nZXQoXCJsYWJlbHNcIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVpLnNlbnRUaW1lLnRvZ2dsZUNsYXNzKFwidW5yZWFkXCIsICFfLmhhcyhsYWJlbHMsICdyZWFkJykpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmFkZHJlc3MudG9nZ2xlQ2xhc3MoXCJ1bnJlYWRcIiwgIV8uaGFzKGxhYmVscywgJ3JlYWQnKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuc3ViamVjdC50b2dnbGVDbGFzcyhcInVucmVhZFwiLCAhXy5oYXMobGFiZWxzLCAncmVhZCcpKTtcclxuICAgICAgICAgICAgdGhpcy51aS5zdGFySWNvbi50b2dnbGVDbGFzcyhcImRpc2FibGVcIiwgIV8uaGFzKGxhYmVscywgJ3N0YXJyZWQnKSk7XHJcbiAgICAgICAgICAgIHRoaXMudWkuaW1wSWNvbi50b2dnbGVDbGFzcyhcImRpc2FibGVcIiwgIV8uaGFzKGxhYmVscywgJ2ltcG9ydGFudCcpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBzZXRTZWxlY3Rpb246IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMubW9kZWwuY29sbGVjdGlvbi5pc1NlbGVjdGVkKHRoaXMubW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy4kZWwudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJywgc2VsZWN0ZWQpO1xyXG4gICAgICAgICAgICB0aGlzLnVpLmNoZWNrQm94LnByb3AoJ2NoZWNrZWQnLCBzZWxlY3RlZCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gZGF0YUNoYW5nZWRcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX29uU3ViamVjdENoYW5nZWQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudWkuc3ViamVjdC50ZXh0KGZvcm1hdHRlci5mb3JtYXRTdWJqZWN0KHRoaXMubW9kZWwuZ2V0KFwic3ViamVjdFwiKSkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfb25Cb2R5Q2hhbmdlZDogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy51aS5ib2R5LnRleHQoZm9ybWF0dGVyLmZvcm1hdENvbnRlbnQodGhpcy5tb2RlbC5nZXQoXCJib2R5XCIpKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gcm93RXZlbnRzXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUm93U2VsZWN0OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbFRhYmxlOkl0ZW1DbGlja2VkXCIsIG51bGwpO1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmNvbGxlY3Rpb24udG9nZ2xlU2VsZWN0aW9uKHRoaXMubW9kZWwsIHtjYWxsZXJOYW1lOiAnaXRlbVZpZXcnfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG1hcmtBc0NsaWNrZWQ6IGZ1bmN0aW9uIChjbGlja2VkKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLiRlbC50b2dnbGVDbGFzcygnY2xpY2tlZFJvdycsIGNsaWNrZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsVGFibGVSb3dWaWV3O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKFwiYXBwXCIpO1xyXG52YXIgbGF5b3V0VGVtcGxhdGUgPSByZXF1aXJlKFwibWFpbC10ZW1wbGF0ZXMvbWFpbkxheW91dC5oYnNcIik7XHJcblxyXG52YXIgTWFpbExheW91dCA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsICBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgTWFpbExheW91dCA9IE1hcmlvbmV0dGUuTGF5b3V0Vmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOmxheW91dFRlbXBsYXRlLFxyXG4gICAgICAgIGlzUGVybWFuZW50OnRydWUsXHJcbiAgICAgICAgcmVnaW9uczp7XHJcbiAgICAgICAgICAgIG5hdlJlZ2lvbjpcIi5tYWlsLW5hdi1yZWdpb25cIixcclxuICAgICAgICAgICAgd29ya1JlZ2lvbjpcIi5tYWlsLXdvcmstcmVnaW9uXCJcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1haWxMYXlvdXQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9tYWlsc1ZpZXcuaGJzXCIpO1xyXG52YXIgTWFpbGFibGVSb3dWaWV3ID0gcmVxdWlyZShcIm1haWwtdmlld3MvbWFpbEl0ZW1WaWV3XCIpO1xyXG5cclxudmFyIE1haWxUYWJsZVZpZXcgPSB7fTtcclxuXHJcbmFwcC5tb2R1bGUoJ21haWwnLCBmdW5jdGlvbiAobWFpbCwgYXBwLCBCYWNrYm9uZSwgTWFyaW9uZXR0ZSwgJCwgXykge1xyXG5cclxuICAgIE1haWxUYWJsZVZpZXcgPSBNYXJpb25ldHRlLkNvbXBvc2l0ZVZpZXcuZXh0ZW5kKHtcclxuICAgICAgICBuYW1lOiAnbWFpbFRhYmxlJyxcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgY2hpbGRWaWV3OiBNYWlsYWJsZVJvd1ZpZXcsXHJcbiAgICAgICAgY2hpbGRWaWV3Q29udGFpbmVyOiBcInRib2R5XCIsXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcywgXCJjaGlsZHZpZXc6Y2xpY2tcIiwgdGhpcy5faGFuZGxlQ2hpbGRDbGljayk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5jb2xsZWN0aW9uLCBcImNoYW5nZTpzZWxlY3Rpb25cIiwgdGhpcy5vblNlbGVjdGlvbkNoYW5nZSwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gb25TZWxlY3Rpb25DaGFuZ2VcclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25TZWxlY3Rpb25DaGFuZ2U6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNhbGxlck5hbWUgIT09ICdpdGVtVmlldycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uZWFjaChfLmJpbmQoZnVuY3Rpb24gKHZpZXcpIHtcclxuICAgICAgICAgICAgICAgICAgICB2aWV3LnNldFNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZpZXcubWFya0FzQ2xpY2tlZCh0aGlzLmNvbGxlY3Rpb24uZ2V0U2VsZWN0ZWQoKS5sZW5ndGggPT09IDAgJiYgdmlldyA9PT0gdGhpcy5jbGlja2VkSXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgX2hhbmRsZUNoaWxkQ2xpY2s6IGZ1bmN0aW9uIChfaXRlbVZpZXcpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uZWFjaChmdW5jdGlvbiAoaXRlbVZpZXcpIHtcclxuICAgICAgICAgICAgICAgIGl0ZW1WaWV3Lm1hcmtBc0NsaWNrZWQoZmFsc2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfaXRlbVZpZXcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tlZEl0ZW0gPSBfaXRlbVZpZXc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrZWRJdGVtLm1hcmtBc0NsaWNrZWQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBtYWlsLmNoYW5uZWwudmVudC50cmlnZ2VyKFwibWFpbFRhYmxlOkl0ZW1DbGlja2VkXCIsIHRoaXMuY2xpY2tlZEl0ZW0ubW9kZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE1haWxUYWJsZVZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJtYWlsLXRlbXBsYXRlcy9uYXZWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBOYXZWaWV3ID0ge307XHJcblxyXG5hcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIGFwcCwgQmFja2JvbmUsIE1hcmlvbmV0dGUsICQsIF8pIHtcclxuXHJcbiAgICBOYXZWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xyXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oYXBwLmNvbnRleHQsICdjaGFuZ2U6bWFpbC5hY3Rpb24nLCB0aGlzLm9uQWN0aW9uQ2hhbmdlLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uQWN0aW9uQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLiRlbC5maW5kKCdsaScpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYXBwLmNvbnRleHQuZ2V0KFwibWFpbC5hY3Rpb24udHlwZVwiKTtcclxuICAgICAgICAgICAgdGhpcy4kZWwuZmluZCgnLm5hdi0nICsgYWN0aW9uKS5hZGRDbGFzcygnc2VsZWN0ZWQnKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE5hdlZpZXc7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoXCJhcHBcIik7XHJcbnZhciBmb3JtYXR0ZXIgPSByZXF1aXJlKFwicmVzb2x2ZXJzL2Zvcm1hdHRlclwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL3ByZXZpZXdWaWV3Lmhic1wiKTtcclxuXHJcbnZhciBQcmV2aWV3VmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgUHJldmlld1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XHJcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxyXG5cclxuICAgICAgICB1aToge1xyXG4gICAgICAgICAgICBzdWJqZWN0OiBcIi5zdWJqZWN0XCIsXHJcbiAgICAgICAgICAgIHRvOiBcIi50b1wiLFxyXG4gICAgICAgICAgICBmcm9tOiBcIi5mcm9tXCIsXHJcbiAgICAgICAgICAgIGJvZHk6IFwiLmJvZHlcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJjb250YWN0OmNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN1YmplY3Q6IGZvcm1hdHRlci5mb3JtYXRTdWJqZWN0KHRoaXMubW9kZWwuZ2V0KFwic3ViamVjdFwiKSksXHJcbiAgICAgICAgICAgICAgICB0bzogZm9ybWF0dGVyLmZvcm1hdEFkZHJlc3Nlcyh0aGlzLmNvbnRhY3RzLmdldFRpdGxlcyh0aGlzLm1vZGVsLmdldE91dGdvaW5nQWRkcmVzc2VzKCkpKSxcclxuICAgICAgICAgICAgICAgIGZyb206IGZvcm1hdHRlci5mb3JtYXRBZGRyZXNzZXModGhpcy5jb250YWN0cy5nZXRUaXRsZXModGhpcy5tb2RlbC5nZXRJbmdvaW5nQWRkcmVzc2VzKCkpKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGVsLmhhcyhcInJlbGF0ZWRCb2R5XCIpKSB7XHJcbiAgICAgICAgICAgICAgICAvL3JlcXVpcmUoW1wib25EZW1hbmRMb2FkZXIhdGV4dCFhcHAvYXNzZXRzL2RhdGEvXCIgKyB0aGlzLm1vZGVsLmdldChcInJlbGF0ZWRCb2R5XCIpICsgXCIudHh0XCJdLCBfLmJpbmQoZnVuY3Rpb24gKHRleHQpIHtcclxuICAgICAgICAgICAgICAgIC8vICAgIHRoaXMudWkuYm9keS5odG1sKHRleHQpO1xyXG4gICAgICAgICAgICAgICAgLy99LCB0aGlzKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVpLmJvZHkuaHRtbCh0aGlzLm1vZGVsLmdldChcImJvZHlcIikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcmV2aWV3VmlldztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxudmFyIHRlbXBsYXRlID0gcmVxdWlyZShcIm1haWwtdGVtcGxhdGVzL3NlYXJjaFZpZXcuaGJzXCIpO1xyXG52YXIgQ29udGFjdHNGaWx0ZXJNb2RlbCA9IHJlcXVpcmUoXCJtYWlsLW1vZGVscy9jb250YWN0c0ZpbHRlck1vZGVsXCIpO1xyXG52YXIgQXV0b0NvbXBsZXRlID0gcmVxdWlyZShcInVpLWNvbXBvbmVudHMvYXV0b0NvbXBsZXRlL2F1dG9Db21wbGV0ZVwiKTtcclxudmFyIFNlYXJjaENvbXBvbmVudCA9IHJlcXVpcmUoXCJ1aS1jb21wb25lbnRzL3NlYXJjaC9zZWFyY2hcIik7XHJcblxyXG52YXIgU2VhcmNoVmlldyA9IHt9O1xyXG5cclxuYXBwLm1vZHVsZSgnbWFpbCcsIGZ1bmN0aW9uIChtYWlsLCBhcHAsIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgU2VhcmNoVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcclxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiBcInNlYXJjaFBhbmVsXCIsXHJcblxyXG4gICAgICAgIHVpOiB7XHJcbiAgICAgICAgICAgIHNlYXJjaFBsYWNlaG9sZGVyOiBcIi5zZWFyY2gtcGxhY2Vob2xkZXJcIixcclxuICAgICAgICAgICAgYXV0b0NvbXBsZXRlUGxhY2Vob2xkZXI6IFwiLmF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyXCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZlbnQgPSBuZXcgQmFja2JvbmUuV3JlcXIuRXZlbnRBZ2dyZWdhdG9yKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFjdHMgPSBtYWlsLmNoYW5uZWwucmVxcmVzLnJlcXVlc3QoXCJjb250YWN0OmNvbGxlY3Rpb25cIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBfYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnZlbnQsIFwic2VhcmNoXCIsIHRoaXMuc2VhcmNoLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhhcHAuY29udGV4dCwgXCJjaGFuZ2U6bWFpbC5hY3Rpb25cIiwgdGhpcy5vbkFjdGlvbkNoYW5nZSwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5jb250YWN0cywgXCJmZXRjaDpzdWNjZXNzXCIsIHRoaXMucmVuZGVyQXV0b0NvbXBvbmVudCwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBvblJlbmRlclxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJlbmRlclNlYXJjaENvbXBvbmVudCgpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlckF1dG9Db21wb25lbnQoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICByZW5kZXJTZWFyY2hDb21wb25lbnQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoQ29tcG9uZW50ID0gbmV3IFNlYXJjaENvbXBvbmVudCh7XHJcbiAgICAgICAgICAgICAgICBlbDogdGhpcy51aS5zZWFyY2hQbGFjZWhvbGRlcixcclxuICAgICAgICAgICAgICAgIHZlbnQ6IHRoaXMudmVudCxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246IGFwcC50cmFuc2xhdG9yLnRyYW5zbGF0ZShcIm1haWw6c2VhcmNoLmNhcHRpb25cIilcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoQ29tcG9uZW50LnJlbmRlcigpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHJlbmRlckF1dG9Db21wb25lbnQ6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hdXRvQ29tcGxldGUgJiYgIXRoaXMuY29udGFjdHMuaXNFbXB0eSgpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5hdXRvQ29tcGxldGUgPSBuZXcgQXV0b0NvbXBsZXRlKHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtczogdGhpcy5nZXRDb250YWN0QXJyYXkoKSxcclxuICAgICAgICAgICAgICAgICAgICBlbDogdGhpcy51aS5hdXRvQ29tcGxldGVQbGFjZWhvbGRlcixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJNb2RlbDogbmV3IENvbnRhY3RzRmlsdGVyTW9kZWwoKSxcclxuICAgICAgICAgICAgICAgICAgICB2ZW50OiB0aGlzLnZlbnRcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdXRvQ29tcGxldGUuc2hvdygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgZ2V0Q29udGFjdEFycmF5OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgX2NvbnRhY3RzID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRhY3RzLmVhY2goZnVuY3Rpb24gKG1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgICBfY29udGFjdHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogbW9kZWwuZ2V0KFwidGl0bGVcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG1vZGVsLmdldChcImFkZHJlc3NcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogQXV0b0NvbXBsZXRlLlRZUEVTLkNPTlRBQ1RcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIF9jb250YWN0cztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHNlYXJjaFxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHNlYXJjaDogZnVuY3Rpb24gKGtleSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCFfLmlzRW1wdHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgbWFpbC5yb3V0ZXIubmF2aWdhdGUoXCJzZWFyY2gvXCIgKyBrZXksIHt0cmlnZ2VyOiB0cnVlfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBvbkFjdGlvbkNoYW5nZVxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgICBvbkFjdGlvbkNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFwcC5jb250ZXh0LmdldChcIm1haWwuYWN0aW9uLnR5cGVcIik7XHJcblxyXG4gICAgICAgICAgICBpZiAoYWN0aW9uICE9IFwic2VhcmNoXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlYXJjaENvbXBvbmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VhcmNoQ29tcG9uZW50LmNsZWFyKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlYXJjaFZpZXc7XHJcbiIsIiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICB2YXIgYXBwID0gcmVxdWlyZShcImFwcFwiKTtcclxuXHJcbiAgICBhcHAubW9kdWxlKCdtYWlsJywgZnVuY3Rpb24gKG1haWwsIEFwcCwgIEJhY2tib25lLCBNYXJpb25ldHRlLCAkLCBfKSB7XHJcblxyXG4gICAgICAgIHZhciBSb3V0ZXIgPSByZXF1aXJlKFwibWFpbC1yb3V0ZXJzL21haWxSb3V0ZXJcIik7XHJcbiAgICAgICAgdmFyIE1haW5MYXlvdXRDb250cm9sbGVyID0gcmVxdWlyZShcIm1haWwtY29udHJvbGxlcnMvbWFpbE1haW5MYXlvdXRDb250cm9sbGVyXCIpO1xyXG4gICAgICAgIHZhciBEYXRhQ29udHJvbGxlciA9IHJlcXVpcmUoXCJtYWlsLWNvbnRyb2xsZXJzL21haWxEYXRhQ29udHJvbGxlclwiKTtcclxuICAgICAgICB2YXIgQWN0aW9uc0NvbnRyb2xsZXIgPSByZXF1aXJlKFwibWFpbC1jb250cm9sbGVycy9tYWlsQWN0aW9uc0NvbnRyb2xsZXJcIik7XHJcbiAgICAgICAgdmFyIFJvdXRlckNvbnRyb2xsZXIgPSByZXF1aXJlKFwibWFpbC1jb250cm9sbGVycy9tYWlsUm91dGVyQ29udHJvbGxlclwiKTtcclxuXHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBpbml0XHJcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgICAgdGhpcy5hZGRJbml0aWFsaXplcihmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jaGFubmVsID0gQmFja2JvbmUuV3JlcXIucmFkaW8uY2hhbm5lbChcIm1haWxcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YUNvbnRyb2xsZXIgPSBuZXcgRGF0YUNvbnRyb2xsZXIoKTtcclxuICAgICAgICAgICAgdGhpcy5hY3Rpb25zQ29udHJvbGxlciA9IG5ldyBBY3Rpb25zQ29udHJvbGxlcigpO1xyXG4gICAgICAgICAgICB0aGlzLm1haW5MYXlvdXRDb250cm9sbGVyID0gbmV3IE1haW5MYXlvdXRDb250cm9sbGVyKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB0aGlzLnJvdXRlciA9IG5ldyBSb3V0ZXIoeyBjb250cm9sbGVyOiBuZXcgUm91dGVyQ29udHJvbGxlcigpIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIC8vIHNldExheW91dFxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAgIHRoaXMuc2V0TGF5b3V0ID1mdW5jdGlvbigpe1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYWluTGF5b3V0Q29udHJvbGxlci5zZXRWaWV3cygpO1xyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGFwcC5tb2R1bGUoXCJtYWlsXCIpO1xyXG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJ0YWdzUGxhY2Vob2xkZXJcXFwiPjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcImF1dG9Db21wbGV0ZVBsYWNlaG9sZGVyXFxcIj48L2Rpdj5cXHJcXG5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIGhlbHBlciwgb3B0aW9ucywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cbiAgYnVmZmVyICs9IFwiPGRpdiBjbGFzcz1cXFwibGJsQ29tcG9zZVxcXCI+TmV3IE1lc3NhZ2U8L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJidXR0b25zVG9vbGJhclxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImFjdGlvbi1saXN0LXNlY3Rpb25cXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuU2VsZWN0XFxcIj5cXHJcXG4gICAgICAgICAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJidXR0b24gZHJvcGRvd24gZGRzSWRfZGRzU2VsZWN0XFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzZWxlY3RcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpzZWxlY3RcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PHNwYW4gY2xhc3M9XFxcInRvZ2dsZVxcXCI+PC9zcGFuPjwvYT5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJkcm9wZG93bi1zbGlkZXIgZGRzU2VsZWN0XFxcIj5cXHJcXG4gICAgICAgICAgICAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gc2VsZWN0QWxsXFxcIj48L3NwYW4+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNlbGVjdC5hbGxcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpzZWxlY3QuYWxsXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICAgICAgICAgICAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gc2VsZWN0Tm9uZVxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNlbGVjdC5ub25lXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c2VsZWN0Lm5vbmVcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgICAgICAgICAgICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBzZWxlY3RSZWFkXFxcIj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6c2VsZWN0LnJlYWRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpzZWxlY3QucmVhZFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIHNlbGVjdFVucmVhZFxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNlbGVjdC51bnJlYWRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpzZWxlY3QudW5yZWFkXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICAgICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuRGVsZXRlRm9yZXZlclxcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGxlZnRcXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMuZGVsZXRlRm9yZXZlclwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMuZGVsZXRlRm9yZXZlclwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+PC9kaXY+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJidG5Ob3RTcGFtXFxcIj48YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJidXR0b25cXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMubm90U3BhbVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMubm90U3BhbVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+PC9kaXY+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJidG5EaXNjYXJkRHJhZnRzXFxcIj48YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJidXR0b25cXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMuZGlzY2FyZERyYWZ0XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5kaXNjYXJkRHJhZnRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuRGVsZXRlXFxcIj48YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJidXR0b24gbGVmdFxcXCI+PHNwYW4gY2xhc3M9XFxcImNhcHRpb25cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6YWN0aW9ucy5kZWxldGVcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLmRlbGV0ZVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+PC9kaXY+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJidG5Nb3ZlVG9cXFwiPjwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuTW9yZVxcXCI+PC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcInBhZ2VyXFxcIj48L2Rpdj5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyLCBvcHRpb25zLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZywgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb24sIGZ1bmN0aW9uVHlwZT1cImZ1bmN0aW9uXCI7XG5cblxuICBidWZmZXIgKz0gXCI8ZGl2IGNsYXNzPVxcXCJjb21wb3NlVmlld1xcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbXBvc2UtaGVhZGVyXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImZpZWxkXFxcIj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDp0b1wiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnRvXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiaW5wdXRib3hcXFwiPjxkaXYgY2xhc3M9XFxcInRvSW5wdXRXcmFwcGVyXFxcIj48L2Rpdj48L2Rpdj5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiZmllbGQgY2NMaW5lXFxcIj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpjY1wiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmNjXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9kaXY+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiaW5wdXRib3hcXFwiPjxkaXYgY2xhc3M9XFxcImNjSW5wdXRXcmFwcGVyXFxcIj48L2Rpdj48L2Rpdj5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1maWVsZD5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzdWJqZWN0XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c3ViamVjdFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImlucHV0Ym94IGlucHV0Ym94MVxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJzdWJqZWN0XFxcIiB2YWx1ZT1cXFwiXCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnN1YmplY3QpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuc3ViamVjdCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCJcXFwiPjwvaW5wdXQ+PC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbXBvc2UtZWRpdG9yIGJyb3dzZXItc2Nyb2xsXFxcIiBjb250ZW50ZWRpdGFibGU9XFxcInRydWVcXFwiPjwvZGl2PlxcclxcbiAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJidXR0b24gc2VuZEJ0blxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpjb21wb3Nldmlldy5zZW5kXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6Y29tcG9zZXZpZXcuc2VuZFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgIDxhIGNsYXNzPVxcXCJjbG9zZUJ0blxcXCI+PC9hPlxcclxcbjwvZGl2PlwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcIm1haWwtaXRlbXMtcmVnaW9uIGJyb3dzZXItc2Nyb2xsIGxpZ2h0XFxcIj5cXHJcXG48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJtYWlsLXByZXZpZXctcmVnaW9uIGJyb3dzZXItc2Nyb2xsIGxpZ2h0XFxcIj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJtc2dUaXRsZVxcXCI+PC9kaXY+XFxyXFxuXCI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBoZWxwZXIsIG9wdGlvbnMsIGhlbHBlck1pc3Npbmc9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXG4gIGJ1ZmZlciArPSBcIjxkaXYgY2xhc3M9XFxcImVtcHR5TWFpbFxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvdW50ZXJcXFwiPjwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJtZXNzYWdlXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmVtcHR5TWFpbC5zZWxlY3RpdGVtXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6ZW1wdHlNYWlsLnNlbGVjdGl0ZW1cIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2Rpdj5cXHJcXG48L2Rpdj5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyLCBmdW5jdGlvblR5cGU9XCJmdW5jdGlvblwiLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbiwgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIHNlbGY9dGhpcztcblxuZnVuY3Rpb24gcHJvZ3JhbTEoZGVwdGgwLGRhdGEpIHtcbiAgXG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlcjtcbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpbmJveFxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmZyb20pIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuZnJvbSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8ZGl2PlxcclxcbiAgICBcIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxuXG5mdW5jdGlvbiBwcm9ncmFtMyhkZXB0aDAsZGF0YSkge1xuICBcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyLCBvcHRpb25zO1xuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcInNlbnRcXFwiPjxzcGFuIGNsYXNzPVxcXCJzZW50LXRvXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnRvXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6dG9cIiwgb3B0aW9ucykpKVxuICAgICsgXCI6PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJzZW50LWFkZHJlc3NcXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy50bykgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC50byk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L3NwYW4+PC9kaXY+XFxyXFxuICAgIFwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbmZ1bmN0aW9uIHByb2dyYW01KGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgaGVscGVyLCBvcHRpb25zO1xuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImRyYWZ0XFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmRyYWZ0XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6ZHJhZnRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuZnVuY3Rpb24gcHJvZ3JhbTcoZGVwdGgwLGRhdGEpIHtcbiAgXG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlcjtcbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ0cmFzaC1pY29uLXdyYXBwZXJcXFwiPjxkaXYgY2xhc3M9XFxcInRyYXNoLWljb25cXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInRyYXNoLWFkZHJlc3NcXFwiPjxkaXY+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmZyb20pIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuZnJvbSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj48L2Rpdj5cXHJcXG4gICAgXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuZnVuY3Rpb24gcHJvZ3JhbTkoZGVwdGgwLGRhdGEpIHtcbiAgXG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlcjtcbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJzcGFtXFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuZnJvbSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5mcm9tKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgICBcIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxuXG4gIGJ1ZmZlciArPSBcIjx0ZCBjbGFzcz1cXFwic2VsZWN0b3JcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgY2xhc3M9XFxcImNoa0JveFxcXCI+PC90ZD5cXHJcXG48dGQgY2xhc3M9XFxcInN0YXJcXFwiPjxkaXYgY2xhc3M9XFxcInN0YXItaWNvblxcXCI+PC9kaXY+PC90ZD5cXHJcXG48dGQgY2xhc3M9XFxcImltcG9ydGFuY2VcXFwiPjxkaXYgY2xhc3M9XFxcImltcG9ydGFuY2UtaWNvblxcXCI+PC9kaXY+PC90ZD5cXHJcXG48dGQgY2xhc3M9XFxcImFkZHJlc3NcXFwiPlxcclxcbiAgICBcIjtcbiAgc3RhY2sxID0gaGVscGVyc1snaWYnXS5jYWxsKGRlcHRoMCwgKGRlcHRoMCAmJiBkZXB0aDAuaXNJbmJveCksIHtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgxLCBwcm9ncmFtMSwgZGF0YSksZGF0YTpkYXRhfSk7XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgXCI7XG4gIHN0YWNrMSA9IGhlbHBlcnNbJ2lmJ10uY2FsbChkZXB0aDAsIChkZXB0aDAgJiYgZGVwdGgwLmlzU2VudCksIHtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgzLCBwcm9ncmFtMywgZGF0YSksZGF0YTpkYXRhfSk7XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXHJcXG4gICAgXCI7XG4gIHN0YWNrMSA9IGhlbHBlcnNbJ2lmJ10uY2FsbChkZXB0aDAsIChkZXB0aDAgJiYgZGVwdGgwLmlzRHJhZnQpLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oNSwgcHJvZ3JhbTUsIGRhdGEpLGRhdGE6ZGF0YX0pO1xuICBpZihzdGFjazEgfHwgc3RhY2sxID09PSAwKSB7IGJ1ZmZlciArPSBzdGFjazE7IH1cbiAgYnVmZmVyICs9IFwiXFxyXFxuICAgIFwiO1xuICBzdGFjazEgPSBoZWxwZXJzWydpZiddLmNhbGwoZGVwdGgwLCAoZGVwdGgwICYmIGRlcHRoMC5pc1RyYXNoKSwge2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDcsIHByb2dyYW03LCBkYXRhKSxkYXRhOmRhdGF9KTtcbiAgaWYoc3RhY2sxIHx8IHN0YWNrMSA9PT0gMCkgeyBidWZmZXIgKz0gc3RhY2sxOyB9XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICBcIjtcbiAgc3RhY2sxID0gaGVscGVyc1snaWYnXS5jYWxsKGRlcHRoMCwgKGRlcHRoMCAmJiBkZXB0aDAuaXNTcGFtKSwge2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDksIHByb2dyYW05LCBkYXRhKSxkYXRhOmRhdGF9KTtcbiAgaWYoc3RhY2sxIHx8IHN0YWNrMSA9PT0gMCkgeyBidWZmZXIgKz0gc3RhY2sxOyB9XG4gIGJ1ZmZlciArPSBcIlxcclxcbiAgICBcIjtcbiAgc3RhY2sxID0gaGVscGVyc1snaWYnXS5jYWxsKGRlcHRoMCwgKGRlcHRoMCAmJiBkZXB0aDAuaXNTZWFyY2gpLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMSwgcHJvZ3JhbTEsIGRhdGEpLGRhdGE6ZGF0YX0pO1xuICBpZihzdGFjazEgfHwgc3RhY2sxID09PSAwKSB7IGJ1ZmZlciArPSBzdGFjazE7IH1cbiAgYnVmZmVyICs9IFwiXFxyXFxuPC90ZD5cXHJcXG48dGQ+PGRpdiBjbGFzcz1cXFwiY29udGVudFxcXCI+PHNwYW4gY2xhc3M9XFxcInN1YmplY3RcXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5zdWJqZWN0KSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnN1YmplY3QpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJzZXBhcmF0b3JcXFwiPi08L3NwYW4+PHNwYW4gY2xhc3M9XFxcImJvZHlcXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5ib2R5KSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmJvZHkpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9zcGFuPjwvZGl2PjwvdGQ+XFxyXFxuPHRkPjxkaXYgY2xhc3M9XFxcInNlbnRUaW1lXFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuc2VudFRpbWUpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuc2VudFRpbWUpOyBzdGFjazEgPSB0eXBlb2YgaGVscGVyID09PSBmdW5jdGlvblR5cGUgPyBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pIDogaGVscGVyOyB9XG4gIGJ1ZmZlciArPSBlc2NhcGVFeHByZXNzaW9uKHN0YWNrMSlcbiAgICArIFwiPC9kaXY+PC90ZD5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJtYWlsLXRhYmxlLWNvbnRhbmllclxcXCI+XFxyXFxuICAgIDx0YWJsZSBjbGFzcz1cXFwiZGF0YS10YWJsZSBtYWlsLXRhYmxlXFxcIj5cXHJcXG4gICAgICAgIDxjb2xncm91cD5cXHJcXG4gICAgICAgICAgICA8Y29sIHN0eWxlPVxcXCJ3aWR0aDozMHB4XFxcIi8+XFxyXFxuICAgICAgICAgICAgPGNvbCBzdHlsZT1cXFwid2lkdGg6MzBweFxcXCIvPlxcclxcbiAgICAgICAgICAgIDxjb2wgc3R5bGU9XFxcIndpZHRoOjMwcHhcXFwiLz5cXHJcXG4gICAgICAgICAgICA8Y29sIHN0eWxlPVxcXCJ3aWR0aDoxOTBweFxcXCIvPlxcclxcbiAgICAgICAgICAgIDxjb2wvPlxcclxcbiAgICAgICAgICAgIDxjb2wgc3R5bGU9XFxcIndpZHRoOjgwcHhcXFwiLz5cXHJcXG4gICAgICAgIDwvY29sZ3JvdXA+XFxyXFxuICAgICAgICA8dGJvZHk+XFxyXFxuICAgICAgICA8L3Rib2R5PlxcclxcbiAgICA8L3RhYmxlPlxcclxcbjwvZGl2PlwiO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcIm1haWwtbmF2LXJlZ2lvblxcXCI+XFxyXFxuPC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwibWFpbC13b3JrLXJlZ2lvblxcXCI+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXCI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBoZWxwZXIsIG9wdGlvbnMsIGhlbHBlck1pc3Npbmc9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXG4gIGJ1ZmZlciArPSBcIjxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBkcm9wZG93biBkZHNJZF9kZHNNb3JlXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLm1vcmVcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLm1vcmVcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PHNwYW4gY2xhc3M9XFxcInRvZ2dsZVxcXCI+PC9zcGFuPjwvYT5cXHJcXG48ZGl2ICBjbGFzcz1cXFwiZHJvcGRvd24tc2xpZGVyIGRkc01vcmVcXFwiPlxcclxcbiAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBtYXJrUmVhZFxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLm1hcmtBcy5yZWFkXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5tYXJrQXMucmVhZFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIG1hcmtVbnJlYWRcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLm1hcmtBcy51bnJlYWRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDphY3Rpb25zLm1hcmtBcy51bnJlYWRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3NwYW4+PC9hPlxcclxcbiAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImRkbSBtYXJrSW1wXFxcIj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6YWN0aW9ucy5tYXJrQXMuaW1wb3J0YW50XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5tYXJrQXMuaW1wb3J0YW50XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvYT5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gbWFya05vdEltcFxcXCI+PHNwYW4gY2xhc3M9XFxcImxhYmVsXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmFjdGlvbnMubWFya0FzLm5vdEltcG9ydGFudFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMubWFya0FzLm5vdEltcG9ydGFudFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIGFkZFN0YXJcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLmFkZC5zdGFyXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5hZGQuc3RhclwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIHJlbW92ZVN0YXJcXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLnJlbW92ZS5zdGFyXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6YWN0aW9ucy5yZW1vdmUuc3RhclwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXFxyXFxuXFxyXFxuXFxyXFxuXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBoZWxwZXIsIG9wdGlvbnMsIGhlbHBlck1pc3Npbmc9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXG4gIGJ1ZmZlciArPSBcIjxhIGhyZWY9XFxcImphdmFzY3JpcHQ6dm9pZCgwKVxcXCIgY2xhc3M9XFxcImJ1dHRvbiBkcm9wZG93biBkZHNJZF9kZHNNb3ZlXFxcIj48c3BhbiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDphY3Rpb25zLm1vdmVUb1wiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmFjdGlvbnMubW92ZVRvXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJ0b2dnbGVcXFwiPjwvc3Bhbj48L2E+XFxyXFxuPGRpdiAgY2xhc3M9XFxcImRyb3Bkb3duLXNsaWRlciBkZHNNb3ZlXFxcIj5cXHJcXG4gICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJkZG0gbW92ZVRvSW5ib3hcXFwiPjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6aW5ib3hcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDppbmJveFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIG1vdmVUb1NwYW1cXFwiPjxzcGFuIGNsYXNzPVxcXCJsYWJlbFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpzcGFtXCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6c3BhbVwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiZGRtIG1vdmVUb1RyYXNoXFxcIj48c3BhbiBjbGFzcz1cXFwibGFiZWxcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6dHJhc2hcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDp0cmFzaFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvc3Bhbj48L2E+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBoZWxwZXIsIG9wdGlvbnMsIGhlbHBlck1pc3Npbmc9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXG4gIGJ1ZmZlciArPSBcIjxhIGhyZWY9XFxcIiNjb21wb3NlXFxcIiBjbGFzcz1cXFwiYnV0dG9uIHByaW1lIGJ0bkNvbXBvc2VcXFwiPjxzcGFuIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOmNvbXBvc2VcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpjb21wb3NlXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9zcGFuPjwvc3Bhbj48L2E+PC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwibmF2aWdhdG9yIG1haWxOYXZcXFwiPlxcclxcbiAgPHVsPlxcclxcbiAgICAgIDxsaSBjbGFzcz1cXFwibmF2LWluYm94XFxcIj48YSBocmVmPVxcXCIjaW5ib3hcXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6aW5ib3hcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDppbmJveFwiLCBvcHRpb25zKSkpXG4gICAgKyBcIjwvYT48L2xpPlxcclxcbiAgICAgIDxsaSBjbGFzcz1cXFwibmF2LXNlbnRcXFwiPjxhIGhyZWY9XFxcIiNzZW50XFxcIj5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5faTE4biB8fCAoZGVwdGgwICYmIGRlcHRoMC5faTE4biksb3B0aW9ucz17aGFzaDp7fSxkYXRhOmRhdGF9LGhlbHBlciA/IGhlbHBlci5jYWxsKGRlcHRoMCwgXCJtYWlsOnNlbnRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcIl9pMThuXCIsIFwibWFpbDpzZW50XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9hPjwvbGk+XFxyXFxuICAgICAgPGxpIGNsYXNzPVxcXCJuYXYtZHJhZnRcXFwiPjxhIGhyZWY9XFxcIiNkcmFmdFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDpkcmFmdFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOmRyYWZ0XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9hPjwvbGk+XFxyXFxuICAgICAgPGxpIGNsYXNzPVxcXCJuYXYtdHJhc2hcXFwiPjxhIGhyZWY9XFxcIiN0cmFzaFxcXCI+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuX2kxOG4gfHwgKGRlcHRoMCAmJiBkZXB0aDAuX2kxOG4pLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIFwibWFpbDp0cmFzaFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnRyYXNoXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC9hPjwvbGk+XFxyXFxuICAgICAgPGxpIGNsYXNzPVxcXCJuYXYtc3BhbVxcXCI+PGEgaHJlZj1cXFwiI3NwYW1cXFwiPlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6c3BhbVwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiX2kxOG5cIiwgXCJtYWlsOnNwYW1cIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L2E+PC9saT5cXHJcXG4gIDwvdWw+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBoZWxwZXIsIG9wdGlvbnMsIGhlbHBlck1pc3Npbmc9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXG4gIGJ1ZmZlciArPSBcIjxkaXYgY2xhc3M9XFxcInBhZ2VySW5uZXJDb250YWluZXJcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJwYWdlckJ1dHRvbnNcXFwiPlxcclxcbiAgICAgICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDp2b2lkKDApXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGxlZnQgaWNvbiBidG5OZXdlclxcXCIgdGl0bGU9XFxcIlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6cGFnZS5wcmV2XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6cGFnZS5wcmV2XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiXFxcIj48c3BhbiBjbGFzcz1cXFwiaWNvTmV3ZXJcXFwiPjwvc3Bhbj48L2E+XFxyXFxuICAgICAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OnZvaWQoMClcXFwiIGNsYXNzPVxcXCJidXR0b24gcmlnaHQgaWNvbiBidG5PbGRlclxcXCIgdGl0bGU9XFxcIlwiXG4gICAgKyBlc2NhcGVFeHByZXNzaW9uKChoZWxwZXIgPSBoZWxwZXJzLl9pMThuIHx8IChkZXB0aDAgJiYgZGVwdGgwLl9pMThuKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCBcIm1haWw6cGFnZS5uZXh0XCIsIG9wdGlvbnMpIDogaGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgXCJfaTE4blwiLCBcIm1haWw6cGFnZS5uZXh0XCIsIG9wdGlvbnMpKSlcbiAgICArIFwiXFxcIj48c3BhbiBjbGFzcz1cXFwiaWNvT2xkZXJcXFwiPjwvc3Bhbj48L2E+XFxyXFxuICAgIDwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJwYWdlckluZm9cXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImxibEZvcm1cXFwiPjwvc3Bhbj5cXHJcXG4gICAgICAgIDxzcGFuPiAtIDwvc3Bhbj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJsYmxUb1xcXCI+PC9zcGFuPlxcclxcbiAgICAgICAgPHNwYW4+IG9mIDwvc3Bhbj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJ0b3RhbFxcXCI+PC9zcGFuPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cXHJcXG5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyLCBmdW5jdGlvblR5cGU9XCJmdW5jdGlvblwiLCBlc2NhcGVFeHByZXNzaW9uPXRoaXMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXG4gIGJ1ZmZlciArPSBcIjxkaXYgY2xhc3M9XFxcInByZXZpZXdNYWlsXFxcIj5cXHJcXG4gICA8ZGl2IGNsYXNzPVxcXCJzdWJqZWN0XFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuc3ViamVjdCkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5zdWJqZWN0KTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvZGl2PlxcclxcbiAgIDxkaXYgY2xhc3M9XFxcImFkZHJlc3NSZWdpb25cXFwiPlxcclxcbiAgICAgICA8ZGl2IGNsYXNzPVxcXCJpY29uXFxcIj48L2Rpdj5cXHJcXG4gICAgICAgPGRpdiBjbGFzcz1cXFwiZnJvbVxcXCI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmZyb20pIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuZnJvbSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICAgICAgPGRpdiBjbGFzcz1cXFwidG9cXFwiPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy50bykgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC50byk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2Rpdj5cXHJcXG4gICA8L2Rpdj5cXHJcXG4gICA8ZGl2IGNsYXNzPVxcXCJib2R5XFxcIj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuYm9keSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5ib2R5KTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvZGl2PlxcclxcbjwvZGl2PlwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICBcblxuXG4gIHJldHVybiBcIjxkaXYgY2xhc3M9XFxcInNlYXJjaC1wbGFjZWhvbGRlclxcXCI+PC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwiYXV0b0NvbXBsZXRlUGxhY2Vob2xkZXJcXFwiPjwvZGl2PlxcclxcblwiO1xuICB9KTtcbiIsInZhciBhcHAgPSBuZXcgTWFyaW9uZXR0ZS5BcHBsaWNhdGlvbih7IGNoYW5uZWxOYW1lOiAnYXBwQ2hhbm5lbCcgfSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwcDsiLCJyZXF1aXJlKFwiLi92ZW5kb3JzTG9hZGVyXCIpO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoJ2FwcCcpO1xyXG52YXIgRnJhbWUgPSByZXF1aXJlKFwiZnJhbWVcIik7XHJcbnZhciBDb250ZXh0ID0gcmVxdWlyZShcImNvbnRleHRcIik7XHJcbnZhciBNYWlsTW9kdWxlID0gcmVxdWlyZShcIm1haWwtbW9kdWxlXCIpO1xyXG52YXIgVHJhbnNsYXRvciA9IHJlcXVpcmUoXCJyZXNvbHZlcnMvdHJhbnNsYXRvclwiKTtcclxudmFyIFNvY2tldENvbnRyb2xsZXIgPSByZXF1aXJlKFwic29ja2V0LWNvbnRyb2xsZXJcIik7XHJcbnZhciBTZXR0aW5nc0NvbnRyb2xsZXIgPSByZXF1aXJlKFwic2V0dGluZ3MtY29udHJvbGxlclwiKTtcclxuXHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vLyBpbml0XHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5hcHAub24oXCJiZWZvcmU6c3RhcnRcIiwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIGFwcC50cmFuc2xhdG9yID0gVHJhbnNsYXRvcjtcclxuICAgIGFwcC5jb250ZXh0ID0gbmV3IENvbnRleHQoKTtcclxuICAgIGFwcC5mcmFtZSA9IG5ldyBGcmFtZSgpO1xyXG4gICAgYXBwLnNvY2tldENvbnRyb2xsZXIgPSBuZXcgU29ja2V0Q29udHJvbGxlcigpO1xyXG4gICAgYXBwLnNldHRpbmdzQ29udHJvbGxlciA9IG5ldyBTZXR0aW5nc0NvbnRyb2xsZXIoKTtcclxufSk7XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vLyBzdGFydFxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuYXBwLm9uKFwic3RhcnRcIiwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIGFwcC5jaGFubmVsLnZlbnQub25jZShcIm9uU2V0dGluZ3NMb2FkZWRcIiwgb25TZXR0aW5nc0xvYWRlZCk7XHJcbiAgICBhcHAuc2V0dGluZ3NDb250cm9sbGVyLmZldGNoKCk7XHJcbn0pO1xyXG5cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG52YXIgb25TZXR0aW5nc0xvYWRlZCA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgcmVnaXN0ZXJVc2VyKCk7XHJcbiAgICBzZXRMYXlvdXQoKTtcclxuICAgIHN0YXJ0SGlzdG9yeSgpO1xyXG4gICAgcmVtb3ZlU3BsYXNoU2NyZWVuKCk7XHJcbn07XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxudmFyIHJlZ2lzdGVyVXNlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGFwcC5zb2NrZXRDb250cm9sbGVyLnJlZ2lzdGVyVXNlcihhcHAuc2V0dGluZ3MuZ2V0KFwidXNlck5hbWVcIikpO1xyXG59O1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnZhciBzZXRMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgYXBwLmFkZFJlZ2lvbnMoe1xyXG4gICAgICAgIG1haW5SZWdpb246ICcubWInXHJcbiAgICB9KTtcclxuICAgIGFwcC5mcmFtZS5zZXRMYXlvdXQoYXBwLm1haW5SZWdpb24pO1xyXG59O1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnZhciBzdGFydEhpc3RvcnkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBCYWNrYm9uZS5oaXN0b3J5LnN0YXJ0KCk7XHJcbn07XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnZhciByZW1vdmVTcGxhc2hTY3JlZW4gPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJChcIi5zcGlubmVyXCIpLmhpZGUoKTtcclxuICAgICQoXCIubWJcIikuc2hvdygpO1xyXG59O1xyXG5cclxuYXBwLnN0YXJ0KCk7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIndpbmRvdy4kID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbndpbmRvdy5fID0gIHJlcXVpcmUoXCJ1bmRlcnNjb3JlXCIpO1xyXG53aW5kb3cuX3MgPSByZXF1aXJlKFwidW5kZXJzY29yZS5zdHJpbmdcIik7XHJcbndpbmRvdy5CYWNrYm9uZSA9IHJlcXVpcmUoXCJiYWNrYm9uZVwiKTtcclxud2luZG93Lk1hcmlvbmV0dGUgPSByZXF1aXJlKCdiYWNrYm9uZS5tYXJpb25ldHRlJyk7XHJcbndpbmRvdy5IYW5kbGViYXJzID0gcmVxdWlyZShcImhic2Z5L3J1bnRpbWVcIik7XHJcblxyXG5yZXF1aXJlKFwiZXh0ZW5zaW9ucy9iYWNrYm9uZS5zeW5jXCIpO1xyXG5yZXF1aXJlKFwiZXh0ZW5zaW9ucy91bmRlcnNjb3JlLm1peGluLmRlZXBFeHRlbmRcIik7XHJcbnJlcXVpcmUoXCJleHRlbnNpb25zL21hcmlvbmV0dGUuZXh0ZW5zaW9uc1wiKTtcclxuXHJcbiIsIlwidXNlIHN0cmljdFwiO1xuLypnbG9iYWxzIEhhbmRsZWJhcnM6IHRydWUgKi9cbnZhciBiYXNlID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9iYXNlXCIpO1xuXG4vLyBFYWNoIG9mIHRoZXNlIGF1Z21lbnQgdGhlIEhhbmRsZWJhcnMgb2JqZWN0LiBObyBuZWVkIHRvIHNldHVwIGhlcmUuXG4vLyAoVGhpcyBpcyBkb25lIHRvIGVhc2lseSBzaGFyZSBjb2RlIGJldHdlZW4gY29tbW9uanMgYW5kIGJyb3dzZSBlbnZzKVxudmFyIFNhZmVTdHJpbmcgPSByZXF1aXJlKFwiLi9oYW5kbGViYXJzL3NhZmUtc3RyaW5nXCIpW1wiZGVmYXVsdFwiXTtcbnZhciBFeGNlcHRpb24gPSByZXF1aXJlKFwiLi9oYW5kbGViYXJzL2V4Y2VwdGlvblwiKVtcImRlZmF1bHRcIl07XG52YXIgVXRpbHMgPSByZXF1aXJlKFwiLi9oYW5kbGViYXJzL3V0aWxzXCIpO1xudmFyIHJ1bnRpbWUgPSByZXF1aXJlKFwiLi9oYW5kbGViYXJzL3J1bnRpbWVcIik7XG5cbi8vIEZvciBjb21wYXRpYmlsaXR5IGFuZCB1c2FnZSBvdXRzaWRlIG9mIG1vZHVsZSBzeXN0ZW1zLCBtYWtlIHRoZSBIYW5kbGViYXJzIG9iamVjdCBhIG5hbWVzcGFjZVxudmFyIGNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaGIgPSBuZXcgYmFzZS5IYW5kbGViYXJzRW52aXJvbm1lbnQoKTtcblxuICBVdGlscy5leHRlbmQoaGIsIGJhc2UpO1xuICBoYi5TYWZlU3RyaW5nID0gU2FmZVN0cmluZztcbiAgaGIuRXhjZXB0aW9uID0gRXhjZXB0aW9uO1xuICBoYi5VdGlscyA9IFV0aWxzO1xuXG4gIGhiLlZNID0gcnVudGltZTtcbiAgaGIudGVtcGxhdGUgPSBmdW5jdGlvbihzcGVjKSB7XG4gICAgcmV0dXJuIHJ1bnRpbWUudGVtcGxhdGUoc3BlYywgaGIpO1xuICB9O1xuXG4gIHJldHVybiBoYjtcbn07XG5cbnZhciBIYW5kbGViYXJzID0gY3JlYXRlKCk7XG5IYW5kbGViYXJzLmNyZWF0ZSA9IGNyZWF0ZTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBIYW5kbGViYXJzOyIsIlwidXNlIHN0cmljdFwiO1xudmFyIFV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgRXhjZXB0aW9uID0gcmVxdWlyZShcIi4vZXhjZXB0aW9uXCIpW1wiZGVmYXVsdFwiXTtcblxudmFyIFZFUlNJT04gPSBcIjEuMy4wXCI7XG5leHBvcnRzLlZFUlNJT04gPSBWRVJTSU9OO3ZhciBDT01QSUxFUl9SRVZJU0lPTiA9IDQ7XG5leHBvcnRzLkNPTVBJTEVSX1JFVklTSU9OID0gQ09NUElMRVJfUkVWSVNJT047XG52YXIgUkVWSVNJT05fQ0hBTkdFUyA9IHtcbiAgMTogJzw9IDEuMC5yYy4yJywgLy8gMS4wLnJjLjIgaXMgYWN0dWFsbHkgcmV2MiBidXQgZG9lc24ndCByZXBvcnQgaXRcbiAgMjogJz09IDEuMC4wLXJjLjMnLFxuICAzOiAnPT0gMS4wLjAtcmMuNCcsXG4gIDQ6ICc+PSAxLjAuMCdcbn07XG5leHBvcnRzLlJFVklTSU9OX0NIQU5HRVMgPSBSRVZJU0lPTl9DSEFOR0VTO1xudmFyIGlzQXJyYXkgPSBVdGlscy5pc0FycmF5LFxuICAgIGlzRnVuY3Rpb24gPSBVdGlscy5pc0Z1bmN0aW9uLFxuICAgIHRvU3RyaW5nID0gVXRpbHMudG9TdHJpbmcsXG4gICAgb2JqZWN0VHlwZSA9ICdbb2JqZWN0IE9iamVjdF0nO1xuXG5mdW5jdGlvbiBIYW5kbGViYXJzRW52aXJvbm1lbnQoaGVscGVycywgcGFydGlhbHMpIHtcbiAgdGhpcy5oZWxwZXJzID0gaGVscGVycyB8fCB7fTtcbiAgdGhpcy5wYXJ0aWFscyA9IHBhcnRpYWxzIHx8IHt9O1xuXG4gIHJlZ2lzdGVyRGVmYXVsdEhlbHBlcnModGhpcyk7XG59XG5cbmV4cG9ydHMuSGFuZGxlYmFyc0Vudmlyb25tZW50ID0gSGFuZGxlYmFyc0Vudmlyb25tZW50O0hhbmRsZWJhcnNFbnZpcm9ubWVudC5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBIYW5kbGViYXJzRW52aXJvbm1lbnQsXG5cbiAgbG9nZ2VyOiBsb2dnZXIsXG4gIGxvZzogbG9nLFxuXG4gIHJlZ2lzdGVySGVscGVyOiBmdW5jdGlvbihuYW1lLCBmbiwgaW52ZXJzZSkge1xuICAgIGlmICh0b1N0cmluZy5jYWxsKG5hbWUpID09PSBvYmplY3RUeXBlKSB7XG4gICAgICBpZiAoaW52ZXJzZSB8fCBmbikgeyB0aHJvdyBuZXcgRXhjZXB0aW9uKCdBcmcgbm90IHN1cHBvcnRlZCB3aXRoIG11bHRpcGxlIGhlbHBlcnMnKTsgfVxuICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMuaGVscGVycywgbmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpbnZlcnNlKSB7IGZuLm5vdCA9IGludmVyc2U7IH1cbiAgICAgIHRoaXMuaGVscGVyc1tuYW1lXSA9IGZuO1xuICAgIH1cbiAgfSxcblxuICByZWdpc3RlclBhcnRpYWw6IGZ1bmN0aW9uKG5hbWUsIHN0cikge1xuICAgIGlmICh0b1N0cmluZy5jYWxsKG5hbWUpID09PSBvYmplY3RUeXBlKSB7XG4gICAgICBVdGlscy5leHRlbmQodGhpcy5wYXJ0aWFscywgIG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBhcnRpYWxzW25hbWVdID0gc3RyO1xuICAgIH1cbiAgfVxufTtcblxuZnVuY3Rpb24gcmVnaXN0ZXJEZWZhdWx0SGVscGVycyhpbnN0YW5jZSkge1xuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaGVscGVyTWlzc2luZycsIGZ1bmN0aW9uKGFyZykge1xuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJNaXNzaW5nIGhlbHBlcjogJ1wiICsgYXJnICsgXCInXCIpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2Jsb2NrSGVscGVyTWlzc2luZycsIGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICB2YXIgaW52ZXJzZSA9IG9wdGlvbnMuaW52ZXJzZSB8fCBmdW5jdGlvbigpIHt9LCBmbiA9IG9wdGlvbnMuZm47XG5cbiAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkgeyBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpOyB9XG5cbiAgICBpZihjb250ZXh0ID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gZm4odGhpcyk7XG4gICAgfSBlbHNlIGlmKGNvbnRleHQgPT09IGZhbHNlIHx8IGNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGludmVyc2UodGhpcyk7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KGNvbnRleHQpKSB7XG4gICAgICBpZihjb250ZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLmhlbHBlcnMuZWFjaChjb250ZXh0LCBvcHRpb25zKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZm4oY29udGV4dCk7XG4gICAgfVxuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignZWFjaCcsIGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICB2YXIgZm4gPSBvcHRpb25zLmZuLCBpbnZlcnNlID0gb3B0aW9ucy5pbnZlcnNlO1xuICAgIHZhciBpID0gMCwgcmV0ID0gXCJcIiwgZGF0YTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKGNvbnRleHQpKSB7IGNvbnRleHQgPSBjb250ZXh0LmNhbGwodGhpcyk7IH1cblxuICAgIGlmIChvcHRpb25zLmRhdGEpIHtcbiAgICAgIGRhdGEgPSBjcmVhdGVGcmFtZShvcHRpb25zLmRhdGEpO1xuICAgIH1cblxuICAgIGlmKGNvbnRleHQgJiYgdHlwZW9mIGNvbnRleHQgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgICBmb3IodmFyIGogPSBjb250ZXh0Lmxlbmd0aDsgaTxqOyBpKyspIHtcbiAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgZGF0YS5pbmRleCA9IGk7XG4gICAgICAgICAgICBkYXRhLmZpcnN0ID0gKGkgPT09IDApO1xuICAgICAgICAgICAgZGF0YS5sYXN0ICA9IChpID09PSAoY29udGV4dC5sZW5ndGgtMSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXQgPSByZXQgKyBmbihjb250ZXh0W2ldLCB7IGRhdGE6IGRhdGEgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvcih2YXIga2V5IGluIGNvbnRleHQpIHtcbiAgICAgICAgICBpZihjb250ZXh0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIGlmKGRhdGEpIHsgXG4gICAgICAgICAgICAgIGRhdGEua2V5ID0ga2V5OyBcbiAgICAgICAgICAgICAgZGF0YS5pbmRleCA9IGk7XG4gICAgICAgICAgICAgIGRhdGEuZmlyc3QgPSAoaSA9PT0gMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXQgPSByZXQgKyBmbihjb250ZXh0W2tleV0sIHtkYXRhOiBkYXRhfSk7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYoaSA9PT0gMCl7XG4gICAgICByZXQgPSBpbnZlcnNlKHRoaXMpO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdpZicsIGZ1bmN0aW9uKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oY29uZGl0aW9uYWwpKSB7IGNvbmRpdGlvbmFsID0gY29uZGl0aW9uYWwuY2FsbCh0aGlzKTsgfVxuXG4gICAgLy8gRGVmYXVsdCBiZWhhdmlvciBpcyB0byByZW5kZXIgdGhlIHBvc2l0aXZlIHBhdGggaWYgdGhlIHZhbHVlIGlzIHRydXRoeSBhbmQgbm90IGVtcHR5LlxuICAgIC8vIFRoZSBgaW5jbHVkZVplcm9gIG9wdGlvbiBtYXkgYmUgc2V0IHRvIHRyZWF0IHRoZSBjb25kdGlvbmFsIGFzIHB1cmVseSBub3QgZW1wdHkgYmFzZWQgb24gdGhlXG4gICAgLy8gYmVoYXZpb3Igb2YgaXNFbXB0eS4gRWZmZWN0aXZlbHkgdGhpcyBkZXRlcm1pbmVzIGlmIDAgaXMgaGFuZGxlZCBieSB0aGUgcG9zaXRpdmUgcGF0aCBvciBuZWdhdGl2ZS5cbiAgICBpZiAoKCFvcHRpb25zLmhhc2guaW5jbHVkZVplcm8gJiYgIWNvbmRpdGlvbmFsKSB8fCBVdGlscy5pc0VtcHR5KGNvbmRpdGlvbmFsKSkge1xuICAgICAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG4gICAgfVxuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcigndW5sZXNzJywgZnVuY3Rpb24oY29uZGl0aW9uYWwsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gaW5zdGFuY2UuaGVscGVyc1snaWYnXS5jYWxsKHRoaXMsIGNvbmRpdGlvbmFsLCB7Zm46IG9wdGlvbnMuaW52ZXJzZSwgaW52ZXJzZTogb3B0aW9ucy5mbiwgaGFzaDogb3B0aW9ucy5oYXNofSk7XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCd3aXRoJywgZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgIGlmIChpc0Z1bmN0aW9uKGNvbnRleHQpKSB7IGNvbnRleHQgPSBjb250ZXh0LmNhbGwodGhpcyk7IH1cblxuICAgIGlmICghVXRpbHMuaXNFbXB0eShjb250ZXh0KSkgcmV0dXJuIG9wdGlvbnMuZm4oY29udGV4dCk7XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdsb2cnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGxldmVsID0gb3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuZGF0YS5sZXZlbCAhPSBudWxsID8gcGFyc2VJbnQob3B0aW9ucy5kYXRhLmxldmVsLCAxMCkgOiAxO1xuICAgIGluc3RhbmNlLmxvZyhsZXZlbCwgY29udGV4dCk7XG4gIH0pO1xufVxuXG52YXIgbG9nZ2VyID0ge1xuICBtZXRob2RNYXA6IHsgMDogJ2RlYnVnJywgMTogJ2luZm8nLCAyOiAnd2FybicsIDM6ICdlcnJvcicgfSxcblxuICAvLyBTdGF0ZSBlbnVtXG4gIERFQlVHOiAwLFxuICBJTkZPOiAxLFxuICBXQVJOOiAyLFxuICBFUlJPUjogMyxcbiAgbGV2ZWw6IDMsXG5cbiAgLy8gY2FuIGJlIG92ZXJyaWRkZW4gaW4gdGhlIGhvc3QgZW52aXJvbm1lbnRcbiAgbG9nOiBmdW5jdGlvbihsZXZlbCwgb2JqKSB7XG4gICAgaWYgKGxvZ2dlci5sZXZlbCA8PSBsZXZlbCkge1xuICAgICAgdmFyIG1ldGhvZCA9IGxvZ2dlci5tZXRob2RNYXBbbGV2ZWxdO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBjb25zb2xlW21ldGhvZF0pIHtcbiAgICAgICAgY29uc29sZVttZXRob2RdLmNhbGwoY29uc29sZSwgb2JqKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5leHBvcnRzLmxvZ2dlciA9IGxvZ2dlcjtcbmZ1bmN0aW9uIGxvZyhsZXZlbCwgb2JqKSB7IGxvZ2dlci5sb2cobGV2ZWwsIG9iaik7IH1cblxuZXhwb3J0cy5sb2cgPSBsb2c7dmFyIGNyZWF0ZUZyYW1lID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHZhciBvYmogPSB7fTtcbiAgVXRpbHMuZXh0ZW5kKG9iaiwgb2JqZWN0KTtcbiAgcmV0dXJuIG9iajtcbn07XG5leHBvcnRzLmNyZWF0ZUZyYW1lID0gY3JlYXRlRnJhbWU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBlcnJvclByb3BzID0gWydkZXNjcmlwdGlvbicsICdmaWxlTmFtZScsICdsaW5lTnVtYmVyJywgJ21lc3NhZ2UnLCAnbmFtZScsICdudW1iZXInLCAnc3RhY2snXTtcblxuZnVuY3Rpb24gRXhjZXB0aW9uKG1lc3NhZ2UsIG5vZGUpIHtcbiAgdmFyIGxpbmU7XG4gIGlmIChub2RlICYmIG5vZGUuZmlyc3RMaW5lKSB7XG4gICAgbGluZSA9IG5vZGUuZmlyc3RMaW5lO1xuXG4gICAgbWVzc2FnZSArPSAnIC0gJyArIGxpbmUgKyAnOicgKyBub2RlLmZpcnN0Q29sdW1uO1xuICB9XG5cbiAgdmFyIHRtcCA9IEVycm9yLnByb3RvdHlwZS5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuXG4gIC8vIFVuZm9ydHVuYXRlbHkgZXJyb3JzIGFyZSBub3QgZW51bWVyYWJsZSBpbiBDaHJvbWUgKGF0IGxlYXN0KSwgc28gYGZvciBwcm9wIGluIHRtcGAgZG9lc24ndCB3b3JrLlxuICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCBlcnJvclByb3BzLmxlbmd0aDsgaWR4KyspIHtcbiAgICB0aGlzW2Vycm9yUHJvcHNbaWR4XV0gPSB0bXBbZXJyb3JQcm9wc1tpZHhdXTtcbiAgfVxuXG4gIGlmIChsaW5lKSB7XG4gICAgdGhpcy5saW5lTnVtYmVyID0gbGluZTtcbiAgICB0aGlzLmNvbHVtbiA9IG5vZGUuZmlyc3RDb2x1bW47XG4gIH1cbn1cblxuRXhjZXB0aW9uLnByb3RvdHlwZSA9IG5ldyBFcnJvcigpO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IEV4Y2VwdGlvbjsiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBVdGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIEV4Y2VwdGlvbiA9IHJlcXVpcmUoXCIuL2V4Y2VwdGlvblwiKVtcImRlZmF1bHRcIl07XG52YXIgQ09NUElMRVJfUkVWSVNJT04gPSByZXF1aXJlKFwiLi9iYXNlXCIpLkNPTVBJTEVSX1JFVklTSU9OO1xudmFyIFJFVklTSU9OX0NIQU5HRVMgPSByZXF1aXJlKFwiLi9iYXNlXCIpLlJFVklTSU9OX0NIQU5HRVM7XG5cbmZ1bmN0aW9uIGNoZWNrUmV2aXNpb24oY29tcGlsZXJJbmZvKSB7XG4gIHZhciBjb21waWxlclJldmlzaW9uID0gY29tcGlsZXJJbmZvICYmIGNvbXBpbGVySW5mb1swXSB8fCAxLFxuICAgICAgY3VycmVudFJldmlzaW9uID0gQ09NUElMRVJfUkVWSVNJT047XG5cbiAgaWYgKGNvbXBpbGVyUmV2aXNpb24gIT09IGN1cnJlbnRSZXZpc2lvbikge1xuICAgIGlmIChjb21waWxlclJldmlzaW9uIDwgY3VycmVudFJldmlzaW9uKSB7XG4gICAgICB2YXIgcnVudGltZVZlcnNpb25zID0gUkVWSVNJT05fQ0hBTkdFU1tjdXJyZW50UmV2aXNpb25dLFxuICAgICAgICAgIGNvbXBpbGVyVmVyc2lvbnMgPSBSRVZJU0lPTl9DSEFOR0VTW2NvbXBpbGVyUmV2aXNpb25dO1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIlRlbXBsYXRlIHdhcyBwcmVjb21waWxlZCB3aXRoIGFuIG9sZGVyIHZlcnNpb24gb2YgSGFuZGxlYmFycyB0aGFuIHRoZSBjdXJyZW50IHJ1bnRpbWUuIFwiK1xuICAgICAgICAgICAgXCJQbGVhc2UgdXBkYXRlIHlvdXIgcHJlY29tcGlsZXIgdG8gYSBuZXdlciB2ZXJzaW9uIChcIitydW50aW1lVmVyc2lvbnMrXCIpIG9yIGRvd25ncmFkZSB5b3VyIHJ1bnRpbWUgdG8gYW4gb2xkZXIgdmVyc2lvbiAoXCIrY29tcGlsZXJWZXJzaW9ucytcIikuXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVc2UgdGhlIGVtYmVkZGVkIHZlcnNpb24gaW5mbyBzaW5jZSB0aGUgcnVudGltZSBkb2Vzbid0IGtub3cgYWJvdXQgdGhpcyByZXZpc2lvbiB5ZXRcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJUZW1wbGF0ZSB3YXMgcHJlY29tcGlsZWQgd2l0aCBhIG5ld2VyIHZlcnNpb24gb2YgSGFuZGxlYmFycyB0aGFuIHRoZSBjdXJyZW50IHJ1bnRpbWUuIFwiK1xuICAgICAgICAgICAgXCJQbGVhc2UgdXBkYXRlIHlvdXIgcnVudGltZSB0byBhIG5ld2VyIHZlcnNpb24gKFwiK2NvbXBpbGVySW5mb1sxXStcIikuXCIpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnRzLmNoZWNrUmV2aXNpb24gPSBjaGVja1JldmlzaW9uOy8vIFRPRE86IFJlbW92ZSB0aGlzIGxpbmUgYW5kIGJyZWFrIHVwIGNvbXBpbGVQYXJ0aWFsXG5cbmZ1bmN0aW9uIHRlbXBsYXRlKHRlbXBsYXRlU3BlYywgZW52KSB7XG4gIGlmICghZW52KSB7XG4gICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIk5vIGVudmlyb25tZW50IHBhc3NlZCB0byB0ZW1wbGF0ZVwiKTtcbiAgfVxuXG4gIC8vIE5vdGU6IFVzaW5nIGVudi5WTSByZWZlcmVuY2VzIHJhdGhlciB0aGFuIGxvY2FsIHZhciByZWZlcmVuY2VzIHRocm91Z2hvdXQgdGhpcyBzZWN0aW9uIHRvIGFsbG93XG4gIC8vIGZvciBleHRlcm5hbCB1c2VycyB0byBvdmVycmlkZSB0aGVzZSBhcyBwc3VlZG8tc3VwcG9ydGVkIEFQSXMuXG4gIHZhciBpbnZva2VQYXJ0aWFsV3JhcHBlciA9IGZ1bmN0aW9uKHBhcnRpYWwsIG5hbWUsIGNvbnRleHQsIGhlbHBlcnMsIHBhcnRpYWxzLCBkYXRhKSB7XG4gICAgdmFyIHJlc3VsdCA9IGVudi5WTS5pbnZva2VQYXJ0aWFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKHJlc3VsdCAhPSBudWxsKSB7IHJldHVybiByZXN1bHQ7IH1cblxuICAgIGlmIChlbnYuY29tcGlsZSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSB7IGhlbHBlcnM6IGhlbHBlcnMsIHBhcnRpYWxzOiBwYXJ0aWFscywgZGF0YTogZGF0YSB9O1xuICAgICAgcGFydGlhbHNbbmFtZV0gPSBlbnYuY29tcGlsZShwYXJ0aWFsLCB7IGRhdGE6IGRhdGEgIT09IHVuZGVmaW5lZCB9LCBlbnYpO1xuICAgICAgcmV0dXJuIHBhcnRpYWxzW25hbWVdKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiVGhlIHBhcnRpYWwgXCIgKyBuYW1lICsgXCIgY291bGQgbm90IGJlIGNvbXBpbGVkIHdoZW4gcnVubmluZyBpbiBydW50aW1lLW9ubHkgbW9kZVwiKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gSnVzdCBhZGQgd2F0ZXJcbiAgdmFyIGNvbnRhaW5lciA9IHtcbiAgICBlc2NhcGVFeHByZXNzaW9uOiBVdGlscy5lc2NhcGVFeHByZXNzaW9uLFxuICAgIGludm9rZVBhcnRpYWw6IGludm9rZVBhcnRpYWxXcmFwcGVyLFxuICAgIHByb2dyYW1zOiBbXSxcbiAgICBwcm9ncmFtOiBmdW5jdGlvbihpLCBmbiwgZGF0YSkge1xuICAgICAgdmFyIHByb2dyYW1XcmFwcGVyID0gdGhpcy5wcm9ncmFtc1tpXTtcbiAgICAgIGlmKGRhdGEpIHtcbiAgICAgICAgcHJvZ3JhbVdyYXBwZXIgPSBwcm9ncmFtKGksIGZuLCBkYXRhKTtcbiAgICAgIH0gZWxzZSBpZiAoIXByb2dyYW1XcmFwcGVyKSB7XG4gICAgICAgIHByb2dyYW1XcmFwcGVyID0gdGhpcy5wcm9ncmFtc1tpXSA9IHByb2dyYW0oaSwgZm4pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByb2dyYW1XcmFwcGVyO1xuICAgIH0sXG4gICAgbWVyZ2U6IGZ1bmN0aW9uKHBhcmFtLCBjb21tb24pIHtcbiAgICAgIHZhciByZXQgPSBwYXJhbSB8fCBjb21tb247XG5cbiAgICAgIGlmIChwYXJhbSAmJiBjb21tb24gJiYgKHBhcmFtICE9PSBjb21tb24pKSB7XG4gICAgICAgIHJldCA9IHt9O1xuICAgICAgICBVdGlscy5leHRlbmQocmV0LCBjb21tb24pO1xuICAgICAgICBVdGlscy5leHRlbmQocmV0LCBwYXJhbSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH0sXG4gICAgcHJvZ3JhbVdpdGhEZXB0aDogZW52LlZNLnByb2dyYW1XaXRoRGVwdGgsXG4gICAgbm9vcDogZW52LlZNLm5vb3AsXG4gICAgY29tcGlsZXJJbmZvOiBudWxsXG4gIH07XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgbmFtZXNwYWNlID0gb3B0aW9ucy5wYXJ0aWFsID8gb3B0aW9ucyA6IGVudixcbiAgICAgICAgaGVscGVycyxcbiAgICAgICAgcGFydGlhbHM7XG5cbiAgICBpZiAoIW9wdGlvbnMucGFydGlhbCkge1xuICAgICAgaGVscGVycyA9IG9wdGlvbnMuaGVscGVycztcbiAgICAgIHBhcnRpYWxzID0gb3B0aW9ucy5wYXJ0aWFscztcbiAgICB9XG4gICAgdmFyIHJlc3VsdCA9IHRlbXBsYXRlU3BlYy5jYWxsKFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBuYW1lc3BhY2UsIGNvbnRleHQsXG4gICAgICAgICAgaGVscGVycyxcbiAgICAgICAgICBwYXJ0aWFscyxcbiAgICAgICAgICBvcHRpb25zLmRhdGEpO1xuXG4gICAgaWYgKCFvcHRpb25zLnBhcnRpYWwpIHtcbiAgICAgIGVudi5WTS5jaGVja1JldmlzaW9uKGNvbnRhaW5lci5jb21waWxlckluZm8pO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG5cbmV4cG9ydHMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtmdW5jdGlvbiBwcm9ncmFtV2l0aERlcHRoKGksIGZuLCBkYXRhIC8qLCAkZGVwdGggKi8pIHtcbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDMpO1xuXG4gIHZhciBwcm9nID0gZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIFtjb250ZXh0LCBvcHRpb25zLmRhdGEgfHwgZGF0YV0uY29uY2F0KGFyZ3MpKTtcbiAgfTtcbiAgcHJvZy5wcm9ncmFtID0gaTtcbiAgcHJvZy5kZXB0aCA9IGFyZ3MubGVuZ3RoO1xuICByZXR1cm4gcHJvZztcbn1cblxuZXhwb3J0cy5wcm9ncmFtV2l0aERlcHRoID0gcHJvZ3JhbVdpdGhEZXB0aDtmdW5jdGlvbiBwcm9ncmFtKGksIGZuLCBkYXRhKSB7XG4gIHZhciBwcm9nID0gZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgcmV0dXJuIGZuKGNvbnRleHQsIG9wdGlvbnMuZGF0YSB8fCBkYXRhKTtcbiAgfTtcbiAgcHJvZy5wcm9ncmFtID0gaTtcbiAgcHJvZy5kZXB0aCA9IDA7XG4gIHJldHVybiBwcm9nO1xufVxuXG5leHBvcnRzLnByb2dyYW0gPSBwcm9ncmFtO2Z1bmN0aW9uIGludm9rZVBhcnRpYWwocGFydGlhbCwgbmFtZSwgY29udGV4dCwgaGVscGVycywgcGFydGlhbHMsIGRhdGEpIHtcbiAgdmFyIG9wdGlvbnMgPSB7IHBhcnRpYWw6IHRydWUsIGhlbHBlcnM6IGhlbHBlcnMsIHBhcnRpYWxzOiBwYXJ0aWFscywgZGF0YTogZGF0YSB9O1xuXG4gIGlmKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJUaGUgcGFydGlhbCBcIiArIG5hbWUgKyBcIiBjb3VsZCBub3QgYmUgZm91bmRcIik7XG4gIH0gZWxzZSBpZihwYXJ0aWFsIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gcGFydGlhbChjb250ZXh0LCBvcHRpb25zKTtcbiAgfVxufVxuXG5leHBvcnRzLmludm9rZVBhcnRpYWwgPSBpbnZva2VQYXJ0aWFsO2Z1bmN0aW9uIG5vb3AoKSB7IHJldHVybiBcIlwiOyB9XG5cbmV4cG9ydHMubm9vcCA9IG5vb3A7IiwiXCJ1c2Ugc3RyaWN0XCI7XG4vLyBCdWlsZCBvdXQgb3VyIGJhc2ljIFNhZmVTdHJpbmcgdHlwZVxuZnVuY3Rpb24gU2FmZVN0cmluZyhzdHJpbmcpIHtcbiAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7XG59XG5cblNhZmVTdHJpbmcucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBcIlwiICsgdGhpcy5zdHJpbmc7XG59O1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IFNhZmVTdHJpbmc7IiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKmpzaGludCAtVzAwNCAqL1xudmFyIFNhZmVTdHJpbmcgPSByZXF1aXJlKFwiLi9zYWZlLXN0cmluZ1wiKVtcImRlZmF1bHRcIl07XG5cbnZhciBlc2NhcGUgPSB7XG4gIFwiJlwiOiBcIiZhbXA7XCIsXG4gIFwiPFwiOiBcIiZsdDtcIixcbiAgXCI+XCI6IFwiJmd0O1wiLFxuICAnXCInOiBcIiZxdW90O1wiLFxuICBcIidcIjogXCImI3gyNztcIixcbiAgXCJgXCI6IFwiJiN4NjA7XCJcbn07XG5cbnZhciBiYWRDaGFycyA9IC9bJjw+XCInYF0vZztcbnZhciBwb3NzaWJsZSA9IC9bJjw+XCInYF0vO1xuXG5mdW5jdGlvbiBlc2NhcGVDaGFyKGNocikge1xuICByZXR1cm4gZXNjYXBlW2Nocl0gfHwgXCImYW1wO1wiO1xufVxuXG5mdW5jdGlvbiBleHRlbmQob2JqLCB2YWx1ZSkge1xuICBmb3IodmFyIGtleSBpbiB2YWx1ZSkge1xuICAgIGlmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwga2V5KSkge1xuICAgICAgb2JqW2tleV0gPSB2YWx1ZVtrZXldO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnRzLmV4dGVuZCA9IGV4dGVuZDt2YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuZXhwb3J0cy50b1N0cmluZyA9IHRvU3RyaW5nO1xuLy8gU291cmNlZCBmcm9tIGxvZGFzaFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Jlc3RpZWpzL2xvZGFzaC9ibG9iL21hc3Rlci9MSUNFTlNFLnR4dFxudmFyIGlzRnVuY3Rpb24gPSBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufTtcbi8vIGZhbGxiYWNrIGZvciBvbGRlciB2ZXJzaW9ucyBvZiBDaHJvbWUgYW5kIFNhZmFyaVxuaWYgKGlzRnVuY3Rpb24oL3gvKSkge1xuICBpc0Z1bmN0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmIHRvU3RyaW5nLmNhbGwodmFsdWUpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xuICB9O1xufVxudmFyIGlzRnVuY3Rpb247XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JykgPyB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgQXJyYXldJyA6IGZhbHNlO1xufTtcbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGVzY2FwZUV4cHJlc3Npb24oc3RyaW5nKSB7XG4gIC8vIGRvbid0IGVzY2FwZSBTYWZlU3RyaW5ncywgc2luY2UgdGhleSdyZSBhbHJlYWR5IHNhZmVcbiAgaWYgKHN0cmluZyBpbnN0YW5jZW9mIFNhZmVTdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnRvU3RyaW5nKCk7XG4gIH0gZWxzZSBpZiAoIXN0cmluZyAmJiBzdHJpbmcgIT09IDApIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIC8vIEZvcmNlIGEgc3RyaW5nIGNvbnZlcnNpb24gYXMgdGhpcyB3aWxsIGJlIGRvbmUgYnkgdGhlIGFwcGVuZCByZWdhcmRsZXNzIGFuZFxuICAvLyB0aGUgcmVnZXggdGVzdCB3aWxsIGRvIHRoaXMgdHJhbnNwYXJlbnRseSBiZWhpbmQgdGhlIHNjZW5lcywgY2F1c2luZyBpc3N1ZXMgaWZcbiAgLy8gYW4gb2JqZWN0J3MgdG8gc3RyaW5nIGhhcyBlc2NhcGVkIGNoYXJhY3RlcnMgaW4gaXQuXG4gIHN0cmluZyA9IFwiXCIgKyBzdHJpbmc7XG5cbiAgaWYoIXBvc3NpYmxlLnRlc3Qoc3RyaW5nKSkgeyByZXR1cm4gc3RyaW5nOyB9XG4gIHJldHVybiBzdHJpbmcucmVwbGFjZShiYWRDaGFycywgZXNjYXBlQ2hhcik7XG59XG5cbmV4cG9ydHMuZXNjYXBlRXhwcmVzc2lvbiA9IGVzY2FwZUV4cHJlc3Npb247ZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuICBpZiAoIXZhbHVlICYmIHZhbHVlICE9PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydHMuaXNFbXB0eSA9IGlzRW1wdHk7IiwiLy8gQ3JlYXRlIGEgc2ltcGxlIHBhdGggYWxpYXMgdG8gYWxsb3cgYnJvd3NlcmlmeSB0byByZXNvbHZlXG4vLyB0aGUgcnVudGltZSBvbiBhIHN1cHBvcnRlZCBwYXRoLlxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2Rpc3QvY2pzL2hhbmRsZWJhcnMucnVudGltZScpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiaGFuZGxlYmFycy9ydW50aW1lXCIpW1wiZGVmYXVsdFwiXTtcbiJdfQ==
