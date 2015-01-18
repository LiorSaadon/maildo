$(document).ready(function(){

    $('.tiptip a.button, .tiptip button').tipTip();

    $(window).scroll(function(){

        if($(this).scrollTop() < 10){
            $('.fixed-menu').hide();
            $('.header .nav').show();
            $(".header .title").css("margin-top","45px");
        }else{
            if ($(this).scrollTop() > 10) {
                $('.fixed-menu').show();
                $('.header .nav').hide();
                $(".header .title").css("margin-top","85px");
            }

            if ($(this).scrollTop() > 1100) {
                $('.btn-scroll-to-top').fadeIn();
            }else{
                $('.btn-scroll-to-top').fadeOut();
            }
        }
    });

    //Click event to scroll to top
    $('.btn-scroll-to-top').click(function(){
        $('html, body').animate({scrollTop : 740},740);
        return false;
    });

    $('.btn-about-me').click(function () {
        if ($(".aboutMe" ).is( ":hidden" ) ) {
            $('.aboutMe').slideDown("slow");
        } else {
            $('.aboutMe').slideUp("slow");
        }
    });

    $(document).mouseup(function (e)
    {
        var container = $(".aboutMe");
        if (!container.is(e.target) && container.has(e.target).length === 0){
            container.slideUp("slow");
        }
    });

    $('.intro-link').click(function(){
        setTimeout(function(){
            $('html,body').animate({
                scrollTop:  $(document).scrollTop() - 80
            })
        },40);
    });

    $('.libs-link').click(function(){
        setTimeout(function(){
            $('html,body').animate({
                scrollTop:  $(document).scrollTop() - 130
            })
        },40);
    });

    $('.project-structure-link').click(function(){
        setTimeout(function(){
            $('html,body').animate({
                scrollTop:  $(document).scrollTop() - 140
            })
        },40);
    });

    $('.project-init-link').click(function(){
        setTimeout(function(){
            $('html,body').animate({
                scrollTop:  $(document).scrollTop() - 140
            })
        },40);
    });
});
