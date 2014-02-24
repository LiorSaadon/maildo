define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _ = require("underscore");
    var Backbone = require("backbone");
    var Marionette = require("marionette");

    //----------------------------------------------------
    // appendHtml
    //----------------------------------------------------

    Marionette.CompositeView.prototype.appendHtml = function (collectionView, itemView, index) {

        var childrenContainer = this.$(this.itemViewContainer);
        var children = childrenContainer.children();

        if (children.size() <= index) {
            childrenContainer.append(itemView.el);
        } else {
            childrenContainer.children().eq(index).before(itemView.el);
        }
    };

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

    return Marionette;
});
