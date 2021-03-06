    "use strict";

    var app = require("app");

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

    Marionette.Region.prototype.add = function(view, options) {

        options = options || {};

        if(_.isObject(view) && !_.isEmpty(view.cid)){

            this.views = this.views || {};
            this._ensureElement();
            this.clean(view.cid);

            if (!this._hasView(view)) {
                this._addView(view);
                view.render();
                this.$el.append(view.el);
            }

            if(options.hideOtherViews){
                this._showView(view);
            }

            Marionette.triggerMethod.call(view, "show");
            Marionette.triggerMethod.call(this, "show", view);
        }
    };

    //-------------------------------------------------------------

    Marionette.Region.prototype.clean = function(currViewId) {

        for (var key in this.views) {

            var view = this.views[key];

            if (view && !view.isPermanent && !view.isDestroyed && view.cid !== currViewId) {
                if (view.destroy) {view.destroy();}
                else if (view.remove) {view.remove();}
                delete this.views[key];
            }
        }
    };

    //-------------------------------------------------------------

    Marionette.Region.prototype._hasView = function (view) {

        return _.isObject(this.views[view.cid]);
    };

    //-------------------------------------------------------------

    Marionette.Region.prototype._addView = function(view){

        var that = this;
        this.views[view.cid] = view;

        this.listenTo(view, "destroy", function () {
            delete that.views[view.cid];
        });
    };

    //-------------------------------------------------------------

    Marionette.Region.prototype._showView = function (view,options) {

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

            if(_.isObject(view)){
                if (view.destroy) {view.destroy();}
                else if (view.remove) {view.remove();}
                delete this.views[key];
            }
        }
    };

    module.exports = Marionette;
