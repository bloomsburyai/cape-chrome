var capeMark = new Mark(document.querySelector("body"));
var capeTopOffset = 250;

chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    if (msg['command'] == 'convert') {
        // All frames get sent the message so we only respond if we're at the top level
        if (typeof(parent == 'undefined')) {
            var text = document.querySelector("body").innerText;
            if (text.length > 0) {
                callback(text);
            }
        }
    } else if (msg['command'] == 'highlight') {
        text = msg['text'];
        capeMark.unmark({
            done: function(){
                capeMark.mark(text, {
                    separateWordSearch: false,
                    acrossElements: true,
                    done: function() {
                        var element = document.querySelector("mark");
                        if (element !== null) {
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
