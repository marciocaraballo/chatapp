/* Socketio various functions for this example */

var socketio = require('socket.io'),
	io,
	guestNumber = 1,
	nickNames = {},
	namesUsed = [],
	currentRoom = {};

exports.listen = function (server) {

	io = socketio.listen(server);	/* Starting socketio server */

	console.log(socketio.version);

	io.set('log level', 1);

	io.sockets.on('connection', function (socket) { /* Handling user connection */
		
		console.log('this works too too too nigga');

		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);	 /* Assign a guest name to connected user*/

		joinRoom(socket, 'Lobby');	/* User is placed in Lobby */

		handleMessageBroadcasting(socket, nickNames);	/* User management functions */

		handleNameChangeAttemps(socket, nickNames, namesUsed);

		handleRoomJoining(socket);

		socket.on('rooms', function (){
			socket.emit('rooms', io.sockets.manager.rooms);
		});

		handleClientDisconnection(socket, nickNames, namesUsed); /* User disconnection */

	});
}

/* Guest name : Guest + number */
function assignGuestName (socket, guestNumber, nickNames, namesUsed){

	var name = 'Guest' + guestNumber;
	nickNames[socket.id] = name;
	socket.emit('nameResult', {	/* User is informed about guest name */
		success : true,
		name : name
	});

	namesUsed.push(name);	/* Name in use */

	return guestNumber + 1 ;
}

/* Join room using join from a socket object */
function joinRoom (socket, room) {
	socket.join(room);	/* User joins room */
	currentRoom[socket.id] = room; /* User has joined the room */
	socket.emit('joinResult', { room : room });	/* User is informed about room join */
	socket.broadcast.to(room).emit('message', {	/* Broadcast to other users */
		text : nickNames[socket.id] + 'has joined ' + room + '.'
	});

	var usersInRoom = io.sockets.clients(room);

	if (usersInRoom.length > 1) {	/* Check what other users are in the same room */
		var usersInRoomSummary = 'Users curently in ' + room + ': ';

		for (var index in usersInRoom) {
			var userSocketId = usersInRoom[index].id;
			if (userSocketId != socket.id) {
				if (index > 0) {
					usersInRoomSummary += ', ';
				}

				usersInRoomSummary += nickNames[userSocketId];
			}
		}

		usersInRoomSummary += '.';
		socket.emit('message', {text : usersInRoomSummary});	/* List of other users in the same room */
	}
}

/* Name change request , name can't start with Guest */
function handleNameChangeAttempts (socket, nickNames, namesUsed) {
	socket.on('nameAttempt', function (name) {
		if (name.indexOf('Guest') == 0) {	/* Starts with Guest */
			socket.emit('nameResult', {
				success : false,
				message : 'Names cannot begin with "Guest". Please, try again.'
			});
		}
		else {
			if (namesUsed.indexOf(name) == -1) {	/* Registering new name */
				var previousName = nickNames[socket.id],
					previousNameIndex = namesUsed.indexOf(previousName);

					namesUsed.push(name);
					nickNames[socket.id] = name;
					delete namesUsed[previousNameIndex];	/* Make old name available */

					socket.emit('nameResult', {	/* Successfull name change */
						success : true,
						name : name
					});

					socket.broadcast.to(currentRoom[socket.id]).emit('message', {
						text : previousName + 'is now known as' + name + '.'
					});
			}
			else {	/* Name already exists*/
				socket.emit('nameResult', {
					success : false,
					message : 'That name is already in use.'
				});
			}
		}
	});
}

/* Send chat message to other users */
function handleMessageBroadcasting (socket) {
	socket.on('message', function (message){
		socket.broadcast.to(message.room).emit('message', {
			text : nickNames[socket.id] + ': ' + message.text
		});
	});
}

/* Join room */
function handleRoomJoining (socket) {
	socket.on('join', function (room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}

/* User disconnects */
function handleClientDisconnection (socket) {
	socket.on('disconnect', function (){
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}