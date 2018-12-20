'use strict';

function ParseDate(str) {
    let date = new Date(str);

    if(!(date instanceof Date) || isNaN(date)) {
        date = undefined;

        let tokens = str.split(' ');
        for(let i = 0; i < tokens.length; i++) {
            let nb = tokens[i].replace(/[^\d.]/g, '');
            if(nb) {
                date = new Date(nb);
                break;
            }
        }
    }

    return date;
}

function LoadSameWriterBooks(book) {
    let sparql = 'PREFIX linguisticsGold: <http://purl.org/linguistics/gold/>\n'
        + 'PREFIX author: <' + book.authorUri + '>\n'
        + 'SELECT * WHERE {\n'
            + '?book dbo:author|dbo:writer|dbo:Writer author:.\n'
            + '?book a dbo:Book.\n'
        
            + '{{?book linguisticsGold:hypernym dbr:Novel.}\n'
            + 'UNION\n'
            + '{?book linguisticsGold:hypernym dbr:Novella.}\n'
            + 'UNION\n'
            + '{?book linguisticsGold:hypernym dbr:Story.}}\n'
        
            + '?book rdfs:label ?title.\n'
            + 'FILTER(lang(?title) = "fr" || lang(?title) = "en")\n'
        +'}';

    $.ajax({
        url: 'http://dbpedia.org/sparql?query=' + encodeURIComponent(sparql),
        dataType: 'json'
    }).done(function(data) {
        let results = {};

        for (let i = 0; i < data.results.bindings.length; i++) {
            let binding = data.results.bindings[i];
            let bookUri = binding.book.value;

            if(bookUri == book.uri) {
                continue;
            }

            let result;

            if(bookUri in results) {
                result = results[bookUri];
            } else {
                result = {
                    uri: bookUri,
                    title: {}
                };

                results[bookUri] = result;
            }

            result.title[binding.title['xml:lang']] = binding.title.value;
        }

        results = Object.values(results);

        if(results.length > 0) {
            ShowBooksSameAuthor(results);
        }
    });
}

function LoadSerieBook(book) {
    let sparql = 'PREFIX linguisticsGold: <http://purl.org/linguistics/gold/>\n'
        + 'PREFIX book: <' + book.uri + '>\n'
        + 'SELECT * WHERE\n'
        + '{\n'
            + 'book: dbo:series ?serie.\n'
            + '?serie dbp:title|foaf:name|rdfs:label ?serieName.\n'

            + 'OPTIONAL {\n'
                + 'book: dbo:previousWork ?previousBook.\n'

                + '{{?previousBook linguisticsGold:hypernym dbr:Novel.}\n'
                + 'UNION\n'
                + '{?previousBook linguisticsGold:hypernym dbr:Novella.}\n'
                + 'UNION\n'
                + '{?previousBook linguisticsGold:hypernym dbr:Story.}}\n'

                + '?previousBook dbp:title|foaf:name|rdfs:label ?previousBookTitle.\n'
                + 'FILTER(lang(?previousBookTitle) = "en" || lang(?previousBookTitle) = "fr").\n'
            + '}\n'

            + 'OPTIONAL {\n'
                + 'book: dbo:subsequentWork ?nextBook.\n'

                + '{{?nextBook linguisticsGold:hypernym dbr:Novel.}\n'
                + 'UNION\n'
                + '{?nextBook linguisticsGold:hypernym dbr:Novella.}\n'
                + 'UNION\n'
                + '{?nextBook linguisticsGold:hypernym dbr:Story.}}\n'

                + '?nextBook dbp:title|foaf:name|rdfs:label ?nextBookTitle.\n'
                + 'FILTER(lang(?nextBookTitle) = "en" || lang(?nextBookTitle) = "fr").\n'
            + '}\n'

            + 'FILTER(\n'
                + '(lang(?serieName) = "fr" || lang(?serieName) = "en")\n'
            + ')\n'
        + '}';

    $.ajax({
        url: 'http://dbpedia.org/sparql?query=' + encodeURIComponent(sparql),
        dataType: 'json'
    }).done(function(data) {
        let serie = null;

        for (let i = 0; i < data.results.bindings.length; i++) {
            let binding = data.results.bindings[i];

            if(i == 0) {
                serie = {
                    uri: binding.serie.value,
                    name: {}
                };

                if(binding.previousBook) {
                    serie.previousBook = {
                        uri: binding.previousBook.value,
                        title: {}
                    };
                }
                if(binding.nextBook) {
                    serie.nextBook = {
                        uri: binding.nextBook.value,
                        title: {}
                    };
                }
            }

            serie.name[binding.serieName['xml:lang']] = binding.serieName.value;
            if(binding.previousBookTitle) {
                serie.previousBook.title[binding.previousBookTitle['xml:lang']] = binding.previousBookTitle.value;
            }
            if(binding.nextBookTitle) {
                serie.nextBook.title[binding.nextBookTitle['xml:lang']] = binding.nextBookTitle.value;
            }
        }

        if(serie != null) {
            ShowSerieBook(serie);
        }
    });
}

function LoadBook(uri) {
    ShowLoading();

    let sparql = 'PREFIX book: <' + uri + '>\n'
        + 'SELECT * WHERE\n'
        + '{\n'
            + 'book: dbo:abstract ?abstract.\n'
            + 'book: dbp:title|foaf:name|rdfs:label ?title.\n'

            + 'book: dbo:author|dbp:author|dbo:artists|dbo:creator ?author.\n'
            + '?author foaf:name|dbp:name ?author_name.\n'

            + 'OPTIONAL {\n'
                + 'book: dbp:releaseDate|dbo:publicationDate|dbp:published|dbo:releaseDate ?releaseDate.\n'
            + '}\n'

            + 'OPTIONAL {\n'
                + 'book: dbo:language|dbp:language ?lBook.\n'
                + 'OPTIONAL {\n'
                    + '?lBook rdfs:label ?langageBook.\n'
                + '}\n'
            + '}\n'

            + 'OPTIONAL {\n'
                + 'book: dc:publisher ?publisher.\n'
            + '}\n'

            + 'FILTER(\n'
                + '(lang(?abstract) = "fr" || lang(?abstract) = "en")\n'
                + '&& (lang(?title) = "fr" || lang(?title) = "en")\n'
            + ')\n'
        + '}';

    $.ajax({
        url: 'http://dbpedia.org/sparql?query=' + encodeURIComponent(sparql),
        dataType: 'json',
		async:false
    }).done(function(data) {
        let book = null;

        for (let i = 0; i < data.results.bindings.length; i++) {
            let binding = data.results.bindings[i];

            if(i == 0) {
                book = {
                    uri: uri,
                    title: {},
                    abstract: {},
                    authorUri: binding.author.value,
                    author: binding.author_name.value
                };

                if(binding.publisher) {
                    book.publisher = binding.publisher.value;
                }
                if(binding.releaseDate) {
                    book.releaseDate = ParseDate(binding.releaseDate.value);
                }
            }

            book.title[binding.title['xml:lang']] = binding.title.value;
            book.abstract[binding.abstract['xml:lang']] = binding.abstract.value;

            if(binding.langageBook) {
                if(!book.langageBook) {
                    book.langageBook = {};
                }
                book.langageBook[binding.langageBook['xml:lang']] = binding.langageBook.value;
            } else if(binding.lBook) {
                book.langageBook = { en: binding.lBook.value };
            }
        }
		
		//Partie modifiée : on recherche une image sur google image
		googleImageSearch(book);

        if(book == null) {
            ShowNoResults();
        } else {
            ShowBook(book);
            LoadSameWriterBooks(book);
            LoadSerieBook(book);
        }
    });
}

function googleImageSearch(book){
	let apiKey = 'AIzaSyC4nDIM_AfhNpuTv1CqOKQPu9ulxFnsVvw';
	let searchEngine = '007988130364519497545:ssqufxfdrn8';
	
	$.ajax({
		url: 'https://www.googleapis.com/customsearch/v1?key='+apiKey+'&cx='+searchEngine+'&searchType=image&q='+encodeURIComponent(book.author)+'+'+encodeURIComponent(book.title.en)+'+cover+book',
		dataType: 'json',
		async:false
	}).done(function(data){
		book.thumbnail = data.items[0].link;
	});
}

function Search(text, isSuggestion = false) {
    ShowLoading();

    let sparql = 'PREFIX linguisticsGold: <http://purl.org/linguistics/gold/>'
        + 'SELECT DISTINCT * WHERE\n'
        + '{\n'
            + '?book rdf:type dbo:Book.\n'

            + '{{?book linguisticsGold:hypernym|dbo:literaryGenre dbr:Novel.}\n'
            + 'UNION\n'
            + '{?book linguisticsGold:hypernym|dbo:literaryGenre dbr:Novella.}\n'
            + 'UNION\n'
            + '{?book linguisticsGold:hypernym|dbo:literaryGenre dbr:Story.}}\n'

            + '?book dbo:author|dbp:author|dbo:artists|dbo:creator ?author.\n'

            + '?author foaf:name|dbp:name ?author_name.\n'
            + '?book dbp:title|foaf:name|rdfs:label ?title.\n'

            + '?book dbo:abstract ?abstract.\n'

            + 'FILTER(\n'
                + '(lang(?abstract) = "fr" || lang(?abstract) = "en") &&\n'
                + '(contains(lcase(str(?author_name)), lcase("' + text + '")) ||\n'
                + ' contains(lcase(str(?title)), lcase("' + text + '"))) &&\n'
                + '(lang(?title) = "fr" || lang(?title) = "en")\n'
            + ')\n'
        + '}';

    $.ajax({
        url: 'http://dbpedia.org/sparql?query=' + encodeURIComponent(sparql),
        dataType: 'json'
    }).done(function(data) {
        let results = {};

        for (let i = 0; i < data.results.bindings.length; i++) {
            let binding = data.results.bindings[i];
            let bookUri = binding.book.value;

            let result;

            if(bookUri in results) {
                result = results[bookUri];
            } else {
                result = {
                    uri: bookUri,
                    author: binding.author_name.value,
                    title: {},
                    abstract: {}
                };

                results[bookUri] = result;
            }

            result.title[binding.title['xml:lang']] = binding.title.value;
            result.abstract[binding.abstract['xml:lang']] = binding.abstract.value;
        }

        results = Object.values(results);
        if(results.length == 0) {
            if(isSuggestion) {
                ShowNoResults();
            } else {
                SearchWord(text);
            }
        } else if(results.length == 1) {
            LoadBook(results[0].uri);
        } else {
            ShowResults(text, results);
        }
    });
}

function SearchWord(term) {
    $.ajax({
        url: 'http://suggestqueries.google.com/complete/search?callback=?&output=firefox&ds=dbpedia.org&hl=fr&q=' + encodeURIComponent(term),
        dataType: 'json'
    }).done(function(data) {
        if(data.length > 0 && data[1].length > 0) {
            Search(data[1][0], true);
        }
    });
}

function SearchWordForAuto(term) {
    if (term.length == 0) {
        $('.autocomplete-items').empty();
    } else {
		$.ajax({
			url: 'https://en.wikipedia.org/w/api.php?action=query&callback=?&list=search&format=json&srsearch=inCategory%3ANovels+' + encodeURIComponent(term),
			dataType: 'json'
		}).done(function(data) {
			if(data.query.search.length > 0) {
			   AddAutoCompletion(data.query.search)
			} else {
				$('.autocomplete-items').empty();
			}
		});
	}
}

var timer;

function TimerFunction(callback) {
    var argument = arguments[1];
    clearTimeout(timer);
    timer = setTimeout(function() {
		callback(argument);
    }, 100);
}

$(function() {
    $('#form-search').submit(function(e) {
        e.preventDefault();
        let text = $('#text-search').val().trim();
        if(text) {
            Search(text);
        }
    });
	
	$('#form-search').keyup(function(e) {
        e.preventDefault();
        let term = $('#text-search').val().trim();
		if(term) {
			TimerFunction(SearchWordForAuto, term);
		}
    });

    $(document.body).click(function() {
        $('.autocomplete-items').hide();
    });
});
