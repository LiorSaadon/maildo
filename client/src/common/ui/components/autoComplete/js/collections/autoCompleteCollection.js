"use strict";

var AutoCompleteModel = require("../models/autoCompleteModel");

var AutoCompleteCollection = Backbone.Collection.extend({

    model: AutoCompleteModel
});

module.exports = AutoCompleteCollection;
