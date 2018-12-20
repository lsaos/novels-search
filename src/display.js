'use strict';

function GetLangString(str, maxLen = 0, withNewLine = false) {
    if(str.fr) {
        let fr = str.fr;
        if(maxLen > 0 && fr.length > maxLen) {
            fr = fr.substring(0, fr.lastIndexOf(' ', maxLen)) + '...';
        }

        let s = fr;

        if(str.en && str.en != str.fr) {
            let en = str.en;
            if(maxLen > 0 && en.length > maxLen) {
                en = en.substring(0, en.lastIndexOf(' ', maxLen)) + '...';
            }

            s += (withNewLine ? '<br>' : ' ')
                + '<small class="text-muted"><em>(' + en + ')</em></small>';
        }

        return s;
    } else {
        let en = str.en;
        if(maxLen > 0 && en.length > maxLen) {
            en = en.substring(0, en.lastIndexOf(' ', maxLen)) + '...';
        }

        return en;
    }
}

function ShowResults(term, results) {
    $('#section-loading').hide();
    $('#section-results').show();

    $('#results-count').html(results.length + ' résultats pour <strong>' + term + '</strong> :');
    $('#results-list').empty();

    for(let i = 0; i < results.length; i++) {
        let result = results[i];

        let card = $('<article class="card" data-uri="' + result.uri + '">'
            + '<div class="card-body">'
            + '<h5 class="card-title">' + GetLangString(result.title) + '</h5>'
            + '<h6 class="card-subtitle mb-2 text-muted">' + result.author + '</h6>'
            + '<p>' + GetLangString(result.abstract, 200) + '</p>'
            + '</div></article>');

        card.click(function() {
            LoadBook($(this).data('uri'));
        });

        $('#results-list').append(card);
    }
}

function ShowBook(book) {
    $('#section-loading').hide();
    $('#section-book').show();

    let s = '<div class="row">';
    
    if(book.thumbnail) {
        s += '<div class="col-4">'
            + '<img src="' + book.thumbnail + '" class="img-thumbnail">'
            + '</div><div class="col-8">';
    } else {
        s += '<div class="col">';
    }

    s += '<h1>' + GetLangString(book.title) + '</h1>';

    if(book.author) {
        s += '<p><i><b>Auteur : </i></b>' + book.author + '</p>';
    }
    if(book.releaseDate) {
        s += '<p><i><b>Année de publication : </i></b>' + book.releaseDate.getFullYear() + '</p>';
    }
    if(book.publisher) {
        s += '<p><i><b>Editeur : </i></b>' + book.publisher + '</p>';
    }
    if(book.langageBook) {
        s += '<p><i><b>Langue originale : </i></b>' + GetLangString(book.langageBook) + '</p>';
    }

    s += '<p><i><b>Résumé : </i></b>' + GetLangString(book.abstract, 0, true) + '</p></div></div>';

    s += '<div class="row"><div class="col" id="serie-book"></div></div>';
    s += '<div class="row"><div class="col" id="books-same-author"></div></div>';

    s += '<div class="row"><a class="text-center" style="width: 100%;" href="' + book.uri + '" target="blank">Lien DBPedia</a></div><br>';

    $('#section-book').html(s);
}

function ShowBooksSameAuthor(books) {
    $('#books-same-author').html('<div class="card"><div class="card-header text-center">Du même auteur</div>'
        + '<ul class="list-group list-group-flush"></ul></div>');

    for(let i = 0; i < books.length; i++) {
        let book = books[i];

        let element = $('<li class="list-group-item" data-uri="' + book.uri + '">' + GetLangString(book.title) + '</li>');

        element.click(function() {
            LoadBook($(this).data('uri'));
        });

        $('#books-same-author ul').append(element);
    }
}

function ShowSerieBook(serie) {
    let s = '<div class="card" style="margin-bottom: 2px;"><div class="card-header text-center">Série ' + GetLangString(serie.name) + '</div></div>';

    if(serie.previousBook || serie.nextBook) {
        s += '<div class="btn-group" role="group" style="width: 100%; margin-top: 0px; margin-bottom: 15px;">';
        s += '<button type="button" style="width: 50%;" class="btn btn-light" id="serie-book-previous">';
        
        if(serie.previousBook) {
            s += '<i class="fas fa-chevron-left"></i> ' + GetLangString(serie.previousBook.title);
        }

        s += ' </button>';
        s += '<button type="button" style="width: 50%;" class="btn btn-light" id="serie-book-next">';

        if(serie.nextBook) {
            s += GetLangString(serie.nextBook.title) + ' <i class="fas fa-chevron-right"></i>';
        }
        
        s += '</button>';
        s += '</div>';
    }

    $('#serie-book').html(s);

    if(serie.previousBook) {
        $('#serie-book-previous').click(function() {
            LoadBook(serie.previousBook.uri);
        });
    }

    if(serie.nextBook) {
        $('#serie-book-next').click(function() {
            LoadBook(serie.nextBook.uri);
        });
    }
}

function ShowLoading() {
    $('#section-welcome').hide();
    $('#section-no-results').hide();
    $('#section-results').hide();
    $('#section-book').hide();

    $('#section-loading').show();
}

function ShowNoResults() {
    $('#section-loading').hide();
    $('#section-no-results').show();
}

function AddAutoCompletion(results) {
     $('.autocomplete-items').empty();

    if(results.length == 0) {
		$('.autocomplete-items').hide();
        return;
    }
	
	$('.autocomplete-items').show();
    
    for (let i = 0; i < results.length; i++) {
    	let data = results[i].title;
    
        let label = $('<div></div>');
		
        label.attr('value', data);
        label.addClass('item');
        label.append(data);
		
        label.on('mousedown', function(e) {
            e.stopPropagation();
            e.preventDefault();
            $('#text-search').focus();  
            let value = label.attr("value");
            $('#text-search').val(value);
			$('.autocomplete-items').show();
        });
		
        $('.autocomplete-items').append(label);
    }
}
