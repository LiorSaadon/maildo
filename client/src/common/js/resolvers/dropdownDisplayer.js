"use strict";

var dropdownDisplayer = (function () {

    $('body').on('click', function (e) {
        $('.dropdown-slider').hide();
        $(".clicked").removeClass("clicked");
    });

    $("body").on("click", ".button.dropdown", function (ev) {

        if (!$(this).hasClass('clicked')) {
            $('.dropdown-slider').hide();
            $(".clicked").removeClass("clicked");
        }

        var parentFloat = $(this).parent().css("float");
        var ddsId = getDropDownSliderId($(this));

        if(parentFloat === "right"){
            $('.dropdown-slider.' + ddsId).css("right", $(this).position().right);
        }else{
            $('.dropdown-slider.' + ddsId).css("left", $(this).position().left); // - 5
        }

        $('.dropdown-slider.' + ddsId).toggle();
        $(this).toggleClass('clicked');
        return false;
    });


    //-------------------------------------------------------

    var getDropDownSliderId = function (btn) {

        var ddsId = '';
        var classList = btn.attr('class').split(/\s+/);

        $.each(classList, function (index, item) {
            if (item.indexOf('ddsId_') === 0) {
                ddsId = item.replace('ddsId_', '');
                return false;
            }
        });
        return ddsId;
    };
}());
