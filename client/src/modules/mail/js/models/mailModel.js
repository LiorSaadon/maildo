"use strict";

var app = require("app");
var BaseModel = require("base-model");

var MailModel = {};

app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

    MailModel = BaseModel.extend({

        defaults: {
            from: '',
            to: '',
            cc: '',
            bcc: '',
            subject: '',
            sentTime: '',
            body: '',
            labels: {},
            groups: []
        },

        resource: 'mail',

        initialize: function (attrs, options) {

            this.userName = app.settings.get("userName");

            this.socket = {
                requestName: this.resource,
                io: app.socketController.getSocket()
            };
        },

        //--------------------------------------------------

        url: function () {
            return window.location.hostname + "/" + this.resource;
        },

        //-------------------------------------------------------------
        // get addresses
        //-------------------------------------------------------------

        getIngoingAddresses: function () {
            return this._getAddresses('from');
        },

        //-------------------------------------------------------------

        getOutgoingAddresses: function () {
            return this._getAddresses('to').concat(this._getAddresses('cc'), this._getAddresses('bcc'));
        },

        //-------------------------------------------------------------

        _getAddresses: function (attr) {

            var addresses = this.get(attr).split(";");

            if (_.isEmpty(_.last(addresses))) {
                addresses = _.first(addresses, addresses.length - 1);
            }
            return addresses;
        },


        //----------------------------------------------------------------
        // add\remove address
        //----------------------------------------------------------------

        addAddress: function (attr, address) {

            this.updateLastAddress(attr, address + ";");
        },

        //----------------------------------------------------------------

        updateLastAddress: function (attr, address) {

            var addrList = this.get(attr).split(";");
            addrList[addrList.length - 1] = address;
            this.set(attr, addrList.join(";"));
        },

        //----------------------------------------------------------------

        removeAddress: function (attr, address) {

            var addrList = this.get(attr).replace(address + ";", "");
            this.set(attr, addrList);
        },


        //----------------------------------------------------------------
        // validate
        //----------------------------------------------------------------

        validate: function (attrs, options) {

            options = options || {};

            if (options.saveAs !== "draft") {

                var outgoingAddresses = this.getOutgoingAddresses();
                if (_.isEmpty(outgoingAddresses)) {
                    return MailModel.Errors.NoRecipient;
                }

                var to = this._getAddresses('to');
                for (var i = 0; i < to.length; i++) {
                    if (!this.validateAddress(to[i])) {
                        return MailModel.Errors.InvalidToAddress;
                    }
                }

                var cc = this._getAddresses('cc');
                for (i = 0; i < cc.length; i++) {
                    if (!this.validateAddress(cc[i])) {
                        return MailModel.Errors.InvalidCcAddress;
                    }
                }
            }
        },

        //-------------------------------------------------------------

        validateAddress: function (address) {

            var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
            return reg.test(address);
        },

        //----------------------------------------------------------------
        // markAs
        //----------------------------------------------------------------

        markAs: function (label) {

            var oppositeLabel = this._getOpositeLabel(label);

            this._removeLabel(oppositeLabel);
            this._addLabel(label);
        },

        //----------------------------------------------------------------

        _getOpositeLabel: function (label) {

            if (_s.startsWith(label, "un")) {
                return _s.strRight(label, "un");
            }
            return "un" + label;
        },

        //----------------------------------------------------------------

        _addLabel: function (label) {

            if (!this.get("labels." + label)) {
                this.set("labels." + label, true);
            }
        },

        //----------------------------------------------------------------

        _removeLabel: function (labelName) {

            var labels = this.get('labels');

            if (_.has(labels, labelName)) {
                delete labels[labelName];
            }
        },

        //----------------------------------------------------------------
        // moveTo
        //----------------------------------------------------------------

        moveTo: function (dest) {

            var groups = this.get('groups');

            if (_.contains(groups, "trash") || _.contains(groups, "spam") || dest === "trash" || dest === "spam") {
                groups = [];
            }

            groups.push(dest);
            this.set('groups', groups);
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
