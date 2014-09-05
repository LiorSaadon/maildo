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
                this.contacts = mail.channel.reqres.request("contact:collection");

                this._bindEvents();
            },

            //--------------------------------------------------------

            _bindEvents:function(){

                this.listenTo(this.vent, "tag:add", this.addAddress, this);
                this.listenTo(this.vent, "tag:remove", this.removeAddress, this);
                this.listenTo(this.vent, "input:change", this.updateLastAddress, this);
                this.listenTo(this.contacts, "fetch:success", this.renderAutoComponent, this);
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

                if(!this.autoComplete && !this.contacts.isEmpty()){

                    this.autoComplete = new AutoComplete({
                        vent: this.vent,
                        items: this.getContactArray(),
                        el:this.ui.autoCompletePlaceholder,
                        filterModel: new ContactsFilterModel()
                    });
                    this.autoComplete.show();
                }
            },

            //-----------------------------------------------------------------

            getContactArray:function(){

                var _contacts = [];

                this.contacts.each(function(model){
                    _contacts.push({
                        text: model.get("title"),
                        value: model.get("address"),
                        type: AutoComplete.TYPES.CONTACT
                    });
                });
                return _contacts;
            },

            //-----------------------------------------------------------------

            getAddresses:function(){

                var res = [], addresses = this.model.get(this.modelAttr);

                if(!_.isEmpty(addresses)){
                    var addressArr = _s.strLeftBack(addresses, ";").split(";");

                    _.each(addressArr, function(address){
                        res.push({
                            text:mail.dataController.contactCollection.getTitles([address]),
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