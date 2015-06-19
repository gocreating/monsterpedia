var colors = require('colors');

var SKILL = {
  PAPER: 0,
  SCISSOR: 1,
  STONE: 2,
};

var log = function(str) {
  console.log('[ws] '.green + str);
}

var onlineUsers = {};
var onlineChallenges = {};

module.exports = {
  userLogin: function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    console.log('[REST] Login'.green);
    console.log(('username = ' + username).yellow);
    console.log(('password = ' + password).yellow);
    if (username === 'xxx' && password === 'yyy') {
      res.send('1');
    } else {
      res.send('0');
    }
  },

  websocketHandler: function(io) {
    return function(socket) {
      log('[new connection]'.cyan);
      console.log(('socket.id: ' + socket.id).magenta);

      var newUser = {
        id: socket.id,
        posx: 0,
        posy: 0,
      };

      onlineUsers[socket.id] = newUser;

      log('online users: ');
      console.log(onlineUsers);

      socket.on('position', function(data) {
        log('[position]'.cyan);
        log('\traw data = '.grey);
        log(data.grey);
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
        log('[updatePosition]'.cyan);
        log('\traw data = '.grey);
        log(data.grey);
        data = JSON.parse(data);

        onlineUsers[socket.id].posx = data.posx;
        onlineUsers[socket.id].posy = data.posy;

        socket.broadcast.emit('updatePosition', {
          userId: socket.id,
          posx: data.posx,
          posy: data.posy,
        });

        log('online users: ');
        console.log(onlineUsers);
      });

      socket.on('requestChallenge', function(data) {
        log('[requestChallenge]'.cyan);
        log('\traw data = '.grey);
        log(data.grey);

        data = JSON.parse(data);
        var userId = data.userId;
        var opponentId = data.opponentId;
        var userMonster = data.userMonster;

        var challengeId = userId + '/' + opponentId;
        var newChallenge = {
          id: challengeId,
          attackerId: userId,
          defenderId: opponentId,
          attackerMonster: userMonster,
          defenderMonster: null,
          attackerSkill: null,
          defenderSkill: null,
        };
        onlineChallenges[challengeId] = newChallenge;

        io.to(opponentId).emit('sendChallenge', {
          challengeId: challengeId,
          opponentId: userId,
          opponentMonster: userMonster,
        });
      });

      socket.on('acceptChallenge', function(data) {
        log('[acceptChallenge]'.cyan);
        log('\traw data = '.grey);
        log(data.grey);

        data = JSON.parse(data);
        var challengeId = data.challengeId;
        var userMonster = data.userMonster;

        var challenge = onlineChallenges[challengeId];
        challenge.defenderMonster = userMonster;

        io.to(challenge.attackerId).emit('responseChallenge', {
          challengeId: challengeId,
          opponentMonster: userMonster,
        });
      });

      socket.on('rejectChallenge', function(data) {
        log('[rejectChallenge]'.cyan);
        log('\traw data = '.grey);
        log(data.grey);

        data = JSON.parse(data);
        var challengeId = data.challengeId;
        var challenge = onlineChallenges[challengeId];

        io.to(challenge.attackerId).emit('rejectChallenge', {});
        delete onlineChallenges[challengeId];
      });

      socket.on('sendBattle', function(data) {
        log('[sendBattle]'.cyan);
        log('\traw data = '.grey);
        log(data.grey);

        data = JSON.parse(data);
        var challengeId = data.challengeId;
        var skill = data.skill;
        var challenge = onlineChallenges[challengeId];

        if (socket.id == challenge.attackerId) {
          onlineChallenges[challengeId].attackerSkill = skill;
        } else if (socket.id == challenge.defenderId) {
          onlineChallenges[challengeId].defenderSkill = skill;
        }

        var as = onlineChallenges[challengeId].attackerSkill;
        var ds = onlineChallenges[challengeId].defenderSkill;
        if (as && ds) {
          // compare
          if ((as == SKILL.PAPER && ds == SKILL.STONE) ||
              (as == SKILL.SCISSOR && ds == SKILL.PAPER) ||
              (as == SKILL.STONE && ds == SKILL.SCISSOR)) {
            io.to(challenge.attackerId).emit('resultBattle', {
              result: 'win',
            });
            io.to(challenge.defenderId).emit('resultBattle', {
              result: 'lost',
            });
          } else if ((as == SKILL.PAPER && ds == SKILL.SCISSOR) ||
                     (as == SKILL.SCISSOR && ds == SKILL.STONE) ||
                     (as == SKILL.STONE && ds == SKILL.PAPER)) {
            io.to(challenge.attackerId).emit('resultBattle', {
              result: 'lost',
            });
            io.to(challenge.defenderId).emit('resultBattle', {
              result: 'win',
            });
          } else {
            io.to(challenge.attackerId).emit('resultBattle', {
              result: 'deuce',
            });
            io.to(challenge.defenderId).emit('resultBattle', {
              result: 'deuce',
            });
          }
        }
      });

      socket.on('disconnect', function() {
        log('[disconnect]'.cyan);

        socket.broadcast.emit('deleteUser', {
          userId: socket.id,
        });

        delete onlineUsers[socket.id];
        console.log(('user ' + socket.id + ' disconnected').magenta);

        log('online users: ');
        console.log(onlineUsers);
      });
    };
  },
};