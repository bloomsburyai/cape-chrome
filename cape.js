$(function () {
    var text_question = '';
    var answers;
    var default_loading_response = '<i class="fa fa-spinner fa-pulse"></i>';
    var processing_container = $('.response-holder');
    var button_select = $('.btn-select ');
    button_select.addClass('btn-select-disabled');
    processing_container.html(default_loading_response);
    processing_container.hide();
    var turndown = new TurndownService();
    turndown.remove("script");
    turndown.remove("link");
    turndown.remove("meta");
    turndown.remove("style");
    var markdown;
    var timer = 0;
    var tab_id = 0;

	var recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
	recognition.onstart = function() { console.log("started recognition"); }
    recognition.onresult = function(event) { console.log(event) }
    recognition.start();

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        console.log(tabs);
        tab_id = tabs[0].id;
        chrome.tabs.sendMessage(tab_id, {'command': 'convert'}, parse_html);
    });

    function parse_html(html) {
        markdown = turndown.turndown(html).substr(0, 6789);
    }
        
    function ask_question(question_input) {
        text_question = question_input.val();
        processing_container.html(default_loading_response);
        processing_container.show();
        // Only submit question if the user hasn't been typing for half a second
        if (timer != 0) {
            clearTimeout(timer);
        }
        timer = setTimeout(function() {
            $.post('https://responder.thecape.ai/api/0.1/answer?token=hj1-BZfR7IICCXtVHZXeEeiZdfXkVeDjnZnzZ3HcR_o',
                {
                    'text': markdown,
                    'question': text_question,
                    'sourceType': 'document',
                    'numberOfItems': 5
                }, function (reply) {
                    answers = reply['result']['items'];
                    if (answers.length > 0) {
                        selected_answer = 0;
                        show_answer(answers[selected_answer]);
                    }
                })
                .done(function () {
                    if (answers.length > 0) {
                        processing_container.html('1/' + answers.length);
                        processing_container.show();
                        button_select.removeClass('btn-select-disabled');
                    } else {
                        processing_container.hide();
                        button_select.addClass('btn-select-disabled');
                    }
                })
        }, 500);
    }

    function show_answer(answer) {
        answer = answers[selected_answer]['answerText'];
        chrome.tts.speak(answer);
        answer = answer.replace("\n", "").replace("  ", " ");
        chrome.tabs.sendMessage(tab_id, {'command': 'highlight', 'text': answer}, function() {});
    }

    $(".question-text").keyup(function() {
        var question_input = $(this);
        ask_question(question_input);
        return false;
    });
        
    $(".btn-select-disabled").click(function() {
        return false;
    });
        
    $(".select-prev").click(function() {
        selected_answer--;
        if (selected_answer < 0) {
            selected_answer = answers.length - 1;
        }
        show_answer(answers[selected_answer]);
        processing_container.html((selected_answer + 1) + '/' + answers.length);
        processing_container.show();
    });

    $(".select-next").click(function() {
        selected_answer++;
        if (selected_answer >= answers.length) {
            selected_answer = 0;
        }
        show_answer(answers[selected_answer]);
        processing_container.html((selected_answer + 1) + '/' + answers.length);
        processing_container.show();
    });
});
