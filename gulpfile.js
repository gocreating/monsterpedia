/**
 * Load plugins
 */
var gulp          = require('gulp');
var less          = require('gulp-less');
var autoprefixer  = require('gulp-autoprefixer');
var minifycss     = require('gulp-minify-css');
var jshint        = require('gulp-jshint');
var uglify        = require('gulp-uglify');
// var imagemin      = require('gulp-imagemin');
var rename        = require('gulp-rename');
var concat        = require('gulp-concat');
var browserSync   = require('browser-sync');
var nodemon       = require('gulp-nodemon');
var changed       = require('gulp-changed');
var del           = require('del');
var notify        = require('gulp-notify');
var browserify    = require('browserify');
var source        = require('vinyl-source-stream');
var buffer        = require('vinyl-buffer');
var reactify      = require('reactify');
var globify       = require('require-globify');
var preprocess    = require('gulp-preprocess');
var preprocessify = require('preprocessify');
var babel         = require('gulp-babel');

/**
 * error handler
 */
var handleErrors = function() {
  var args = Array.prototype.slice.call(arguments);

  // Send error to notification center with gulp-notify
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>',
  }).apply(this, args);

  // Keep gulp from hanging on this task
  this.emit('end');
};

/**
 * clean the build files
 */
gulp.task('clean-dev', function(cb) {
  del(['build/debug/'], cb);
});

gulp.task('clean-prod', function(cb) {
  del(['build/release/'], cb);
});

/**
 * compile .less files
 */
gulp.task('styles-dev', function(cb) {
  // global style, material-ui style
  gulp.src(['src/assets/less/main.less', 'src/assets/less/material-ui.less'])
    .pipe(changed('build/debug/assets/css'))
    .pipe(less())
    .on('error', handleErrors)
    .pipe(autoprefixer(
      'last 2 version',
      'safari 5',
      'ie 8',
      'ie 9',
      'opera 12.1',
      'ios 6',
      'android 4'
    ))
    .pipe(gulp.dest('build/debug/assets/css'))
    .on('end', cb);
});

gulp.task('styles-prod', function(cb) {
  gulp.src(['src/assets/less/main.less', 'src/assets/less/material-ui.less'])
    .pipe(less())
    .on('error', handleErrors)
    .pipe(autoprefixer(
      'last 2 version',
      'safari 5',
      'ie 8',
      'ie 9',
      'opera 12.1',
      'ios 6',
      'android 4'
    ))
    // .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('build/release/assets/css'))
    .on('end', cb);
});

/**
 * compile front-end .js files
 */
gulp.task('frontend-scripts-dev', function(cb) {
  gulp.src('src/assets/js/**/*.js')
    .pipe(changed('build/debug/assets/js'))
    .pipe(babel())
    // .pipe(jshint('.jshintrc'))
    // .pipe(jshint.reporter('default'))
    .pipe(gulp.dest('build/debug/assets/js'))
    .on('end', cb);
});

gulp.task('frontend-scripts-prod', function(cb) {
  gulp.src('src/assets/js/**/*.js')
    // .pipe(jshint('.jshintrc'))
    // .pipe(jshint.reporter('default'))
    .pipe(babel())
    // .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('build/release/assets/js'))
    .on('end', cb);
});

/**
 * compressing images
 * TO-DO
 */
gulp.task('images-dev', function(cb) {
  gulp.src('src/assets/img/**/*')
    .pipe(changed('build/debug/assets/img'))
    // .pipe(cache(imagemin({
    //   optimizationLevel: 3,
    //   progressive: true,
    //   interlaced: true,
    // })))
    .pipe(gulp.dest('build/debug/assets/img'))
    .on('end', cb);
});

gulp.task('images-prod', function(cb) {
  gulp.src('src/assets/img/**/*')
    // .pipe(cache(imagemin({
    //   optimizationLevel: 3,
    //   progressive: true,
    //   interlaced: true,
    // })))
    .pipe(gulp.dest('build/release/assets/img'))
    .on('end', cb);
});

/**
 * compele backend .js files
 */
gulp.task('backend-scripts-dev', function(cb) {
  gulp.src(['src/**/*.js', '!src/assets/**/*.js'])
    .pipe(babel())
    .pipe(changed('build/debug'))
    .pipe(gulp.dest('build/debug'))
    .on('end', cb);
});

gulp.task('backend-scripts-prod', function(cb) {
  gulp.src(['src/**/*.js', '!src/assets/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('build/release'))
    .on('end', cb);
});

/**
 * compele backend .jsx view files
 */
gulp.task('backend-views-dev', function(cb) {
  browserify({
    debug: true,
    entries: './src/assets/js/index.js',
    transform: [reactify, globify],
  })
  .bundle()
  .pipe(source('bundle.js'))
  .pipe(gulp.dest('build/debug/assets/js'))
  .on('end', cb);
});

gulp.task('backend-views-prod', function(cb) {
  browserify({
    debug: false,
    entries: './src/assets/js/index.js',
    transform: [reactify, globify],
  })
  .bundle()
  .pipe(source('bundle.js'))
  .pipe(buffer())
  .pipe(uglify())
  .pipe(gulp.dest('build/release/assets/js'))
  .on('end', cb);
});

/**
 * copy files that does not need to be preprocessed,
 * like nodejs server files, controllers, models, etc.
 */
gulp.task('copy-dev', function(cb) {
  gulp.src(['src/**/*', '!src/assets/', '!src/**/*.js'])
    // .pipe(preprocess({context: { DEV: true}}))
    .pipe(changed('build/debug'))
    .pipe(gulp.dest('build/debug'))
    .on('end', cb);
});

gulp.task('copy-prod', function(cb) {
  gulp.src(['src/**/*', '!src/assets/', '!src/**/*.js'])
    // .pipe(preprocess({context: { PROD: true }}))
    .pipe(gulp.dest('build/release'))
    .on('end', cb);
});

/**
 * watch and reprocess files that changed
 */
gulp.task('watch', function(cb) {
  // watch .less files
  gulp.watch('src/assets/less/**/*.less', ['styles-dev']);

  // watch .js files
  gulp.watch('src/assets/js/**/*.js', ['frontend-scripts-dev']);
  gulp.watch(['src/**/*.js', '!src/assets/**/*.js'], ['backend-scripts-dev']);

  // watch .jsx files
  gulp.watch('src/views/**/*.jsx', ['backend-views-dev']);

  // watch image files
  gulp.watch('src/assets/img/**/*', ['images-dev']);

  // watch other files
  gulp.watch(['src/**/*', '!src/assets/', '!src/**/*.js'], ['copy-dev']);
});

/**
 * run the server
 */
gulp.task('nodemon', function(cb) {
  nodemon({
    script: 'build/debug/app.js',
  }).on('start', function() {
    cb();
  });
});

/**
 * livereload and synchronize the browser operations
 */
gulp.task('browser-sync', function(cb) {
  browserSync.init(null, {
    proxy: 'localhost:5000',
    files: ['build/debug/**/*.*'],
    port: 7000,
  });
});

/**
 * synchronize database
 */
gulp.task('syncdb', function(cb) {
  var models = require('./src/models/');
  models(function(err, db) {
    if (err) {
      return gulp.src('')
        .pipe(notify('[Sync Fail] Cannot connect to database'));
    }
    db.sync(function() {
      // add dummy data here
      db.models.group.create({
        name: 'default user',
      }, function(err, group) {

      });

      db.models.group.create({
        name: 'vip user',
      }, function(err, group) {

      });
    });
  });
});

/**
 * default task
 */
gulp.task('default', function() {
  gulp.start('dev');
});

/**
 * Development/Debug mode
 */
gulp.task('dev', ['clean-dev'], function() {
  gulp.start(
    'styles-dev',
    'frontend-scripts-dev',
    'images-dev',
    'backend-scripts-dev',
    'backend-views-dev',
    'copy-dev',
    'watch',
    'nodemon',
    'browser-sync'
  );
});

/**
 * Deployment/Production mode
 */
gulp.task('prod', ['clean-prod'], function() {
  gulp.start(
    'styles-prod',
    'frontend-scripts-prod',
    'images-prod',
    'backend-scripts-prod',
    'backend-views-prod',
    'copy-prod'
  );
});