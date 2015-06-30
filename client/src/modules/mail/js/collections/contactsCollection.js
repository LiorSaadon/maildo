"use strict";

var app = require("app");
var ContactModel = require("mail-models/contactModel");
var BaseCollection = require("base-collections/baseCollection");

var fs = require('fs');
var _strContacts = fs.readFileSync('./client/src/common/data/contacts.json', 'utf8');

var ContactsCollection = {};

app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

    ContactsCollection = BaseCollection.extend({

        model: ContactModel,

        //----------------------------------------------------

        initialize: function () {

            var contactList = this._createContactList();
            this.set(contactList);
        },

        //----------------------------------------------------

        _createContactList:function(){

            var contactList = [], contacts = JSON.parse(_strContacts);

            _.each(contacts, function(contact){
                contactList.push({
                    title:contact.replace(",", " "),
                    address:contact.replace(",", ".").toLowerCase() + "@maildo.com"
                });
            });

            return contactList;
        },

        //----------------------------------------------------

        getTitles:function(addressList){

            var res = [];

            _.each(addressList, _.bind(function(address){

                var model = _.find(this.models,function (record) {
                    return record.get("address") === address;
                });
                res.push(model ? model.get("title") : address);
            },this));

            return res;
        },

        //------------------------------------------------------

        addContact:function(contactInfo){

            var contactModel = new ContactModel({
                title:contactInfo,
                address:contactInfo + "@maildo.com"
            });
            this.add(contactModel, {silent:true});
        }
    });
});
module.exports = ContactsCollection;
