define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Tags = require("assets-ui-component/tags/tags");
    var template = require("tpl!mail-templates/_addressView.tmpl");
    var AutoComplete = require("assets-ui-component/autoComplete/autoComplete");

    var AddressView ={};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {
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
                this.listenTo(this.vent, 'input:change', this.updateLastAddress, this);
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
                    validator: this.model.validateAddress
                });
                this.tags.show();
            },

            //----------------------------------------------------------------

            renderAutoComponent:function(){

                this.autoComplete = new AutoComplete({
                    collection:mail.dataController.getContactsCollection(),
                    el:this.ui.autoCompletePlaceholder,
                    vent: this.vent
                });
                this.autoComplete.show();
            },

            //-----------------------------------------------------------------

            addDefaultAddress: function(title, address){

                this.vent.trigger("item:selected",title,address);
            },

            //-----------------------------------------------------------------

            addAddress: function(address){

                this.model.addAddress(this.modelAttr, address);
            },

            //-----------------------------------------------------------------

            updateLastAddress: function(address){

                this.model.updateLastAddress(this.modelAttr, address);
            },

            //-----------------------------------------------------------------

            removeAddress: function(address){

                this.model.removeAddress(this.modelAttr, address);
            }
        });
    });

    return AddressView;
});