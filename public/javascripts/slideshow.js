var SlideShow = function (opts) {
    var parent = opts.parent.css("position", "relative"),
        imageUrls = opts.images;

    cycleImage = function () {
        if ($(this).next().length === 0) {
            $(this).fadeOut(500).siblings().first().fadeIn(500);
        } else {
            $(this).fadeOut(500).next().fadeIn(500);
        }
    };

    $.each(imageUrls, function (i, val) {
        $("<img src='" + val + "' style='position:absolute; top:0px; left:0px;'/>").appendTo(parent).click(cycleImage);
    });

    setInterval(function () {
        $("img:visible").click();
    }, 5000);
};
