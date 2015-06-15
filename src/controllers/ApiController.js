var log = function(str) {
  console.log('[ws] ' + str);
}

var onlineUsers = [];

module.exports = {
  userLogin: function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    console.log(username);
    console.log(password);
    if (username === 'xxx' && password === 'yyy') {
      res.send('1');
    } else {
      res.send('0');
    }
  },

  websocketHandler: function(socket){
    log('new connection established');
    var newUser = {
      x: 0,
      y: 0,
    };
    onlineUsers[socket.id] = newUser;
    
    log(onlineUsers);

    socket.on('new message', function(data){
      log('event');
    });
    socket.on('disconnect', function(){
      log('disconnect');
    });
  },
};