/**
 * Created with IntelliJ IDEA.
 * User: shlomif
 * Date: 9/29/13
 * Time: 3:48 PM
 * To change this template use File | Settings | File Templates.
 */
define(function (require) {
    "use strict";

    var Backbone = require("backbone");

    var TagModel = Backbone.Model.extend({
        defaults: {
            value: "",          // tag text
            closeable: true     // has close button
            //separator: ""     // separator text, optional
        }
    });

    return TagModel;
});