/**
 * Created with IntelliJ IDEA.
 * User: itaik
 * Date: 2/13/13
 * Time: 2:59 PM
 * To change this template use File | Settings | File Templates.
 */
define(function (require) {
    "use strict";

    var Mustache = require("mustache");

    // This is a wrapper for templates engine implementation which only reveals
    // for the different modules the needed functionality
    // Currently we decided to use mustache as templates engine but using this wrapper
    // We will be able to easily switch it to something else if we would like to in the future
    var Template = (function () {

        var render = function (template, data) {

            return Mustache.render(template, data);
        };

        var compile = function (template) {

            return Mustache.compile(template);
        };

        var compilePartial = function (name, template) {

            return Mustache.compilePartial(name, template);
        };

        return {
            render:function (template, data) {
                return render(template, data);
            },
            compile:function (template) {
                return compile(template);
            },
            compilePartial:function (name, template) {
                return compilePartial(name, template);
            }
        };

    }());

    return Template;
});