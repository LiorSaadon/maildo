define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Backbone = require("backbone");
    var Tags = require("assets-ui-component/tags/tags");
    var template = require("tpl!mail-templates/_addressView.tmpl");
    var AutoComplete = require("assets-ui-component/autoComplete/autoComplete");

    var AddressView ={};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {
        AddressView = Marionette.ItemView.extend({

            className: 'addressView',
            template: template,

            ui: {
                tagsPlaceholder: ".tagsPlaceholder",
                autoCompletePlaceholder: ".autoCompletePlaceholder"
            },

            //----------------------------------------------------------------
            // initialize
            //----------------------------------------------------------------

            initialize:function(options){

                this.contacts = options.contacts;
                this.modelAttr = options.modelAttr;
                this.vent = new Backbone.Wreqr.EventAggregator();

                this.listenTo(this.vent, 'tag:add', this.addAddress, this);
                this.listenTo(this.vent, 'tag:remove', this.removeAddress, this);
            },

            //----------------------------------------------------------------
            // onRender
            //----------------------------------------------------------------

            onRender:function(){

                this.renderTagComponent();
                this.renderAutoComponent();
            },

            //----------------------------------------------------------------

            renderTagComponent:function(){

                this.tags = new Tags({
                    el:this.ui.tagsPlaceholder,
                    vent: this.vent,
                    maxItems: 5,
                    validator: this.model.validateAddress
                });
                this.tags.show();
            },

            //----------------------------------------------------------------

            renderAutoComponent:function(){

                this.autoComplete = new AutoComplete({
                    collection:app.dataController.contactsCollection,
                    el:this.ui.autoCompletePlaceholder,
                    footer: {text:"333", value:"222"},
                    vent: this.vent
                });
                this.autoComplete.show();
            },

            //-----------------------------------------------------------------

            addAddress: function(item){

                var arr = this.model.get(this.modelAttr);
                arr.push(item);
            },

            //-----------------------------------------------------------------

            removeAddress: function(_item){

                var arr = _.reject(this.model.get(this.modelAttr), function(item) {
                    return item === _item;
                });
                this.model.set(this.modelAttr, arr);
            }
        });
    });

    return AddressView;
});