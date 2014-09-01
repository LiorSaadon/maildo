define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");
    var Tags = require("assets-ui-component/tags/tags");
    var template = require("tpl!mail-templates/_addressView.tmpl");
    var ContactsFilterModel = require("mail-models/contactsFilterModel");
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
                    validator: this.model.validateAddress,
                    initialTags: this.getAddresses()
                });
                this.tags.show();
            },

            //----------------------------------------------------------------

            renderAutoComponent:function(){

                this.autoComplete = new AutoComplete({
                    items: this.getContacts(),
                    filterModel: new ContactsFilterModel(),
                    el:this.ui.autoCompletePlaceholder,
                    vent: this.vent
                });
                this.autoComplete.show();
            },

            //-----------------------------------------------------------------

            getContacts:function(){

                var contacts = [];

                mail.dataController.contactCollection.each(function(model){
                    contacts.push({
                        text: model.get("title"),
                        value: model.get("address"),
                        type: AutoComplete.TYPES.CONTACT
                    });
                });
                return contacts;
            },

            //-----------------------------------------------------------------

            getAddresses:function(){

                var res = [], addresses = this.model.get(this.modelAttr);

                if(!_.isEmpty(addresses)){

                    var addrArr = _s.strLeftBack(addresses, ";").split(";");

                    _.each(addrArr, function(address){
                        res.push({
                            text:mail.dataController.contactCollection.getTitle(address),
                            value:address
                        });
                    });
                }
                return res;
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