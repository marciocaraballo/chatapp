/* Chat messages and name change request processing on the front end */
var Chat = function (socket) {
	this.socket = socket;
}

Chat.prototype.sendMessage = function (room , text) {
	var message = {
		room : room , 
		text : text
	};

	this.socket.emit('message' , message);
}

Chat.prototype.changeRoom = function (room) {
	this.socket.emit('join', {
		newRoom : room
	});
}

/* Processing a chat command */
Chat.prototype.processCommand = function (command) {
	var words = command.split(' '),
		command = words[0].substring(1, words[0].lenght).toLowerCase(),	/* Getcommand , first word assumed */
		message = false;

	switch (command) {
		case 'join' : 
			words.shift();
			var room = words.join(' ');
			this.changeRoom(room);	/* Room creating, changing */
			break;
		case 'nick' : /* Nick change attempt */
			words.shift();
			var name = words.join(' ');
			this.socket.emit('nameAttempt', name);
			break;
		default : 
			message = 'Unrecognized command.'
			break;
	}

	return message;
}