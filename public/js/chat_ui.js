/* Escape untrusted content, so that it displays as text and browsers avoid interpretation*/
function divEscapedContentElement (message) {
	return $('<div></div>').text(message);
}

/* Trusted content */
function divSystemContentElement (message) {
	return $('<div></div>').html('<i>' + message + '</i>');
}

/* Processing user input */
function processUserInput (chatApp, socket) {
	var message = $('#send-message').val(),
		systemMessage;

	if (message.charAt(0) == '/') {	/* User has entered a command */
		systemMessage = chatApp.processCommand(message);

		if (systemMessage) {
			$('#messages').append(divSystemContentElement(systemMessage));
		}
	}
	else {
		chatApp.sendMessage($('#room').text(), message); /* Non commands are broadcasted to other users */
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}

	$('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function () {
	var chatApp = new Chat(socket);

	socket.on('nameResult', function (result){	/* Name change */
		var message;

		if (result.success) {
			message = 'You are now known as ' + result.name + '.';
		}
		else {
			message = result.message;
		}

		$('#messages').append(divSystemContentElement(message));
	});

	socket.on('joinResult', function (result) { /* Change room */
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('Room changed.'));
	});

	socket.on('message', function (message) {	/* Message sent */
		var newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
	});

	socket.on('rooms', function(rooms) { /* Available rooms */
		$('#room-list').empty();

		for(var room in rooms) {

			room = room.substring(1, room.length);
			if (room != '') {
				$('#room-list').append(divEscapedContentElement(room));
			}
		}
		$('#room-list div').click(function() {
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
		});
	});

	$('#room-list div').click(function() {
		chatApp.processCommand('/join ' + $(this).text());
		$('#send-message').focus();
	});	

	//setInterval(function() {	/* Request room list evere second */
	//	socket.emit('rooms');
	//}, 1000);

	$('#send-message').focus();

	$('#send-form').submit(function () {	/* Submit form to send chat message */
		processUserInput(chatApp, socket);
		return false;
	});
});