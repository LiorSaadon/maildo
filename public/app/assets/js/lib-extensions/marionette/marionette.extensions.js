define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _ = require("underscore");
    var Backbone = require("backbone");
    var Marionette = require("marionette");

    //----------------------------------------------------
    // appendHtml - Overriding default Marionette, otherwise it'll append the itemView at the end no matter the index is
    //----------------------------------------------------

//    Marionette.CompositeView.prototype.appendHtml = function (collectionView, itemView, index) {
//
//        var childrenContainer = this.$(this.itemViewContainer);
//        var children = childrenContainer.children();
//
//        if (children.size() <= index) {
//            childrenContainer.append(itemView.el);
//        } else {
//            childrenContainer.children().eq(index).before(itemView.el);
//        }
//    };

    //----------------------------------------------------
    // templateHelpers
    //----------------------------------------------------

    Marionette.View.prototype.templateHelpers = function () {

        var customTemplateHelpers = this.customTemplateHelpers;

        if (_.isFunction(customTemplateHelpers)) {
            customTemplateHelpers = customTemplateHelpers.call(this);
        }

        var templateHelpers = {
            _i18n: function () {
                return function (text) {
                    return app.translator.translate(text);
                };
            }
        };

        if (customTemplateHelpers) {
            templateHelpers = _.extend(customTemplateHelpers, templateHelpers);
        }

        return templateHelpers;
    };

    //-------------------------------------------------------
    // delegateEvents
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

    Marionette.Region.prototype.add = function(view) {

        if(_.isObject(view) && !_.isEmpty(view.cid)){

            this.views = this.views || {};
            this.ensureEl();
            this._clean(view);

            if (!this._hasView(view)) {
                this._addView(view);
                view.render();
                this.$el.append(view.el);
            }

            this._showView(view);
            Marionette.triggerMethod.call(view, "show");
            Marionette.triggerMethod.call(this, "show", view);
        }
    };

    //-------------------------------------------------------------

    Marionette.Region.prototype._clean = function(viewToShow) {

        for (var key in this.views) {

            var view = this.views[key];

            if (view && !view.isPermanent && !view.isClosed && view.cid !== viewToShow.cid) {
                if (view.close) {view.close();}
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

        this.listenTo(view, "close", function () {
            delete that.views[view.cid];
        });
    };

    //-------------------------------------------------------------

    Marionette.Region.prototype._showView = function (view) {

        for (var key in this.views) {
            var _view = this.views[key];
            if (_view.cid !== view.cid) {
                _view.$el.hide();
            }
        }
        view.$el.show();
    };


    //-------------------------------------------------------------
    // override close - called by region.show()
    //-------------------------------------------------------------

    var _originalClose = Marionette.Region.prototype.close;

    Marionette.Region.prototype.close = function () {

        _originalClose.apply(this, [].slice.apply(arguments));

        for (var key in this.views) {

            var view = this.views[key];

            if(_.isObject(view)){
                if (view.close) {view.close();}
                else if (view.remove) {view.remove();}
                delete this.views[key];
            }
        }
    };



    return Marionette;
});
