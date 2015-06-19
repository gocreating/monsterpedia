var log = function(str) {
  console.log('[ws] ' + str);
}

var onlineUsers = {};

module.exports = {
  userLogin: function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    console.log('[REST] username = ' + username);
    console.log('[REST] password = ' + password);
    if (username === 'xxx' && password === 'yyy') {
      res.send('1');
    } else {
      res.send('0');
    }
  },

  websocketHandler: function(io) {
    return function(socket) {
      log('new connection established, id = ' + socket.id);

      var newUser = {
        id: socket.id,
        posx: 0,
        posy: 0,
      };

      onlineUsers[socket.id] = newUser;

      log('online users = ');
      console.log(onlineUsers);

      socket.on('position', function(data) {
        log('[position]');
        log('\tdata = ');
        log(data);
        data = JSON.parse(data);

        onlineUsers[socket.id].posx = data.posx;
        onlineUsers[socket.id].posy = data.posy;

        socket.emit('ackId', {
          userId: socket.id,
          otherIds: onlineUsers,
        });

        socket.broadcast.emit('newUser', {
          userId: socket.id,
          posx: data.posx,
          posy: data.posy,
        });

        socket.broadcast.emit('updatePosition', {
          userId: socket.id,
          posx: data.posx,
          posy: data.posy,
        });
      });

      socket.on('updatePosition', function(data) {
        log('[updatePosition]');
        log('\tdata = ');
        log(data);
        data = JSON.parse(data);

        onlineUsers[socket.id].posx = data.posx;
        onlineUsers[socket.id].posy = data.posy;

        socket.broadcast.emit('updatePosition', {
          userId: socket.id,
          posx: data.posx,
          posy: data.posy,
        });

        log('online users = ');
        console.log(onlineUsers);
      });

      socket.on('requestChallenge', function(data) {
        log('[requestChallenge]');
        log('\tdata = ');
        log(data);
        data = JSON.parse(data);
        var userId = data.userId;
        var opponentId = data.opponentId;
        var userMonster = data.userMonster;
      });

      socket.on('disconnect', function() {
        log('[disconnect]');

        delete onlineUsers[socket.id];
        log('online users = ');
        console.log(onlineUsers);
      });
    };
  },
};