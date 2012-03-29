var SlideShow = function (opts) {
    var parent = opts.parent,
        imageUrls = opts.images;

    cycleImage = function () {
        var next = $(this).next();

        if (next.length === 0) {
            next = $(this).siblings().first();
        }

        $(this).fadeOut(500);
        next.fadeIn(500);
    };

    $.each(imageUrls, function (i, val) {
        var img = $("<img src='" + val + "'/>").appendTo(parent).click(cycleImage).css("position", "absolute");

        if (i !== 0) {
            //img.hide();
            img.css(img.prev().offset());
        }
    });

    setInterval(function() {
        $("img:visible").click();
    }, 5000);

};
