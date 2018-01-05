var capeMark = new Mark(document.querySelector("body"));
var capeTopOffset = 250;

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
        text = msg['text'];
        capeMark.unmark({
            done: function(){
                capeMark.mark(text, {
                    separateWordSearch: false,
                    acrossElements: true,
                    iframes: true,
                    element: 'capemark',
                    done: function() {
                        var element = document.querySelector("capemark");
                        if (element !== null) {
                            element.style.background = 'yellow';
                            element.style.color = 'black';
                            element.scrollIntoView();
                            window.scrollTo(window.scrollX, window.scrollY - capeTopOffset);
                        }
                    }
                });
            }
        });
    } else if (msg['command'] == 'clear') {
        capeMark.unmark();
    }
});
