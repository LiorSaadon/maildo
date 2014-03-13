define(function (require) {
    "use strict";

    var app = require("mbApp");
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

            initialize:function(options){

                this.contacts = options.contacts;
                this.modelAttr = options.modelAttr;
                this.vent = new Backbone.Wreqr.EventAggregator();

                this.listenTo(this.vent, 'add:item', this.addItem, this);
                this.listenTo(this.vent, 'remove:item', this.removeItem, this);
                this.listenTo(this.vent, 'select:item', this.selectItem, this);
            },

            //-----------------------------------------------------------------

            onRender:function(){

                this.tags = new Tags({
                   el:this.ui.tagsPlaceholder,
                   vent: this.vent,
                    validator: this.model.validateAddress
                });
                this.tags.show();

                this.autoComplete = new AutoComplete({
                    collection:this.contacts,
                    el:this.ui.autoCompletePlaceholder,
                    vent: this.vent
                });
               this.autoComplete.show();
            },

            //-----------------------------------------------------------------

            addItem: function(item){
                this.model.set(this.modelAttr,item);
            },

            //-----------------------------------------------------------------

            removeItem: function(){

            },

            //----------------------------------------------------------------

            selectItem: function(){

            }
        });
    });

    return AddressView;
});