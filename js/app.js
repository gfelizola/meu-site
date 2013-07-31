;(function ($, window, undefined) {
    'use strict';

    var dados = window.siteData;

})(jQuery, this);

/*===== HOME =====*/
;(function ($, window, undefined) {
    'use strict';

    var dados     = window.siteData.home;
    var ultimo    = 2 ;
    var slidesTpl = $('<div class="slides" data-orbit data-options="bullets:false;timer:true;slide_number:false;animation:fade;pause_on_hover:false;"></div>');
    var sliderTpl = $('<div class="slider-container large-12 columns"></div>');

    function addItem(indice) {
        var val     = dados.slides[indice];
        var preload = $('<div />').addClass('preloader');
        var box     = $('<div />').addClass('dados');
        var tit     = $('<h2 />').text( val.titulo ).appendTo( box );
        var desc    = $('<p />').text( val.descricao ).appendTo( box );
        var slider  = sliderTpl.clone();
        var slides  = slidesTpl.clone();

        slider.append(preload);
        slider.append(box);

        $.each(val.imagens, function(index, val) {
            var img = $('<img />');
            img.attr('src', val);
            slides.append(img);
        });

        slider.append(slides);

        $('#principal').append(slider);
        TweenMax.from( slider, 0.8, { css:{ marginTop: 200 }, ease:Cubic.easeOut, delay:0.2 });
    }

    if( dados.slides.length > 3 ){
        for (var i = 0; i < 3; i++) {
            addItem(i);
        };
    }

    $(document).foundation();

    $('footer').bind('inview', function(e, v, t) {
        console.log( 'inview', v, t );
        if( v && t == 'both' ){
            if( ultimo < dados.slides.length ){
                addItem(ultimo++);
                $(document).foundation('orbit');
            }
        }
    });

    $('#principal .slider-container').on('mouseover',function() {
        TweenMax.to( $(this), 0.5, { height: 400, ease:Circ.easeOut });
    }).on('mouseout', function() {
        TweenMax.to( $(this), 0.5, { height: 200, ease:Circ.easeOut });
    });

})(jQuery, this);


