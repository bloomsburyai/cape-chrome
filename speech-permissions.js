navigator.webkitGetUserMedia({
    audio: true,
}, function(stream) {
	window.close();
}, function() {
	window.close();
});
