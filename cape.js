/*
 * Copyright (c) 2017 Blemundsbury AI Limited
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

$(function () {
    var text_question = '';
    var answers;
    var default_loading_response = '<i class="fa fa-spinner fa-pulse"></i>';
    var processing_container = $('.response-holder');
    var button_select = $('.btn-select ');
    button_select.addClass('btn-select-disabled');
    processing_container.html(default_loading_response);
    processing_container.hide();
    var text;
    var timer = 0;
    var tab_id = 0;
    var tts = false;

    var message_timer = setTimeout(function() { $("#message").show(0); }, 100);

    var recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = function() { $("#speech-input").removeClass("fa-microphone").addClass("fa-microphone-slash"); }
    recognition.onresult = function(ev) {
        var final_transcript = "";
        var interim_transcript = "";
        for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
               final_transcript += event.results[i][0].transcript;
            } else {
               interim_transcript += event.results[i][0].transcript;
            }
        }
        $(".question-text").val(final_transcript);
    }
    recognition.onerror = function(error) {
        if (error.error == "not-allowed") {
            // We can't ask for permission within the popup, but we can open
            // a page in another tab which can request permission for the
            // whole extension.
            chrome.tabs.create({
                url: chrome.runtime.getURL("speech-permissions.html")
            });
        }
    }
    recognition.onend = function() {
        $("#speech-input").removeClass("fa-microphone-slash").addClass("fa-microphone");
        ask_question($(".question-text"))
    }

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        tab_id = tabs[0].id;
        chrome.tabs.sendMessage(tab_id, {'command': 'convert'}, process_content);
    });

    function process_content(content) {
        if (typeof(content) === 'undefined') {
            chrome.tabs.sendMessage(tab_id, {'command': 'convert'}, process_content);
            return;
        }
        text = content.substr(0, 150000);
        clearTimeout(message_timer);
        $("#message").hide();
    }
        
    function ask_question(question_input) {
        text_question = question_input.val();
        if (text_question.length == 0) {
            return;
        }

        // Only submit question if the user hasn't been typing for half a second
        if (timer != 0) {
            clearTimeout(timer);
        }

        timer = setTimeout(function() {
            processing_container.html(default_loading_response);
            processing_container.show();

            $.post('https://responder.thecape.ai/api/0.1/answer?token=hj1-BZfR7IICCXtVHZXeEeiZdfXkVeDjnZnzZ3HcR_o',
                {
                    'text': text,
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
        if (tts) {
            chrome.tts.speak(answers[selected_answer]['answerText']);
        }
        chrome.tabs.sendMessage(tab_id, {'command': 'highlight', 'response': answers[selected_answer]}, function() {});
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

    $(".btn-close").click(function() {
        chrome.tabs.sendMessage(tab_id, {'command': 'clear'}, function() {});
        window.close();
    });

    $(".btn-speech-input").click(function() {
        recognition.start();
    });

    $(".btn-speech-output").click(function() {
        tts = !tts;
        chrome.storage.sync.set({
	        speechOutput: tts
	    }, function() {
            if (tts) {
                $("#speech-output").removeClass("fa-volume-off").addClass("fa-volume-up");
            } else {
                $("#speech-output").removeClass("fa-volume-up").addClass("fa-volume-off");
            }
	    });
    });

    chrome.storage.sync.get({
	        speechOutput: false
	    }, function(items) {
            if (items.speechOutput) {
                tts = items.speechOutput;
                $("#speech-output").removeClass("fa-volume-off").addClass("fa-volume-up");
            } else {
                $("#speech-output").removeClass("fa-volume-up").addClass("fa-volume-off");
            }
	    }
    );

});
