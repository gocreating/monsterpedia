var General = require('../controllers/GeneralController');
var User = require('../controllers/UserController');
var Api = require('../controllers/ApiController');

var PageNotFoundError = require('../errors/pageNotFound');

module.exports = function(app) {
  // general routing
  app.get ('/',              General.home);
  app.get ('/about',         General.about);

  // user routing
  app.get ('/user/register', User.register.get);
  app.post('/user/register', User.register.post);
  app.get ('/user/login',    User.login.get);
  app.post('/user/login',    User.login.post);
  app.get ('/user/logout',   User.logout);
  app.get ('/user/profile',  User.profile);

  // api routing
  app.post('/api/user/login', Api.userLogin);

  // 404 page not found
  app.use(function(req, res, next) {
    next(new PageNotFoundError());
  });
};