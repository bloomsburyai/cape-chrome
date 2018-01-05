var capeMark = new Mark(document.querySelector("body"));
var capeTopOffset = 250;
var searchAround = 10;

chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    if (window !== top) {
        // All frames get sent the message so we only respond if we're at the top level
        return;
    }
    if (msg['command'] == 'convert') {
        var text = document.querySelector("body").innerText;
        if (text.length > 0) {
            callback(text);
        }
    } else if (msg['command'] == 'highlight') {
        text = msg['response']['answerText'].replace("\n", " ");
        context = msg['response']['answerContext'].replace("\n", " ");
        capeMark.unmark({
            done: function(){
                capeMark.mark(text, {
                    separateWordSearch: false,
                    acrossElements: true,
                    iframes: true,
                    caseSensitive: true,
                    element: 'capemark',
                    done: function() {
                        var element = document.querySelector("capemark");
                        if (element !== null) {
                            element.style.background = 'yellow';
                            element.style.color = 'black';
                            element.scrollIntoView();
                            window.scrollTo(window.scrollX, window.scrollY - capeTopOffset);
                        }
                    },
                    filter: function(node, term, total, termTotal) {
                        // Check that characters on either side of the search term match the answer context to disambiguate
                        // results (number of characters to search on either side is defined by searchAround)
                        var termPos = node.wholeText.indexOf(term);
                        var startPos = Math.max(0, termPos - searchAround);
                        var endPos = term.length + searchAround * 2;
                        if (msg['response']['answerContextEndOffset'] - msg['response']['answerTextEndOffset'] < searchAround) {
                            endPos -= searchAround - (msg['response']['answerContextEndOffset'] - msg['response']['answerTextEndOffset']);
                        }

                        var subContext = node.wholeText.substr(startPos, endPos).trim();
                        return context.indexOf(subContext) !== -1;
                    }
                });
            }
        });
    } else if (msg['command'] == 'clear') {
        capeMark.unmark();
    }
});
