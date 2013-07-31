var siteData = {
    home: {
        slides: [
            {
                titulo: 'Clear Fusão Herbal',
                descricao: 'Paolla Conta Tudo',
                imagens: [
                    'img/jobs/clear/image-1.jpg',
                    'img/jobs/clear/image-2.jpg',
                    'img/jobs/clear/image-3.jpg'
                ]
            },
            {
                titulo: 'Colegio Mackenzie',
                descricao: 'Site do colegio Mackenzie',
                imagens: [
                    'img/jobs/mack/image-1.jpg',
                    'img/jobs/mack/image-2.jpg',
                    'img/jobs/mack/image-3.jpg'
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
            {
                titulo: 'Teste',
                descricao: 'teste',
                imagens: [
                    'http://lorempixel.com/1000/400/people',
                    'http://lorempixel.com/1000/400/nature',
                    'http://lorempixel.com/1000/400/abstract',
                ]
            },
        ]
    }
};;(function ($, window, undefined) {
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

})(jQuery, this);


