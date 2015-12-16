//--------------//
// DEPENDENCIES //
//--------------//

var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var compass = require('gulp-compass');
var rename = require('gulp-rename');
var minifyCSS = require('gulp-minify-css');
var serverFactory = require('spa-server');
var deploy = require('gulp-gh-pages');

//---------------//
// CONFIGURATION //
//---------------//

var cssDir = './css';
var scssDir = './scss';
var miniSuffix = '.min';
var deployTmpPath = './.deploy';

var demoServer;

//-------//
// TASKS //
//-------//

gulp.task('default', function(callback) {
  runSequence('clean', 'build', callback);
});

gulp.task('clean', function(callback) {
  del(cssDir + '/*').then(function () {
    callback();
  });
});

gulp.task('build', ['build:styles']);

gulp.task('build:styles', function() {

  var compassConfig = {
    css: cssDir,
    sass: scssDir,
    environment: 'development',
    style: 'expanded',
    comments: true
  };

  return gulp.src(scssDir + '/*.scss')

    // Writing development version.
    .pipe(compass(compassConfig))
    .pipe(gulp.dest(cssDir))

    // Writing minified version.
    .pipe(rename({suffix: miniSuffix}))
    .pipe(minifyCSS())
    .pipe(gulp.dest(cssDir))
  ;
});


//===========//
// WEBSERVER //
//===========//

gulp.task('webserver.start', function (callback) {
  demoServer = serverFactory.create({
    path: './site',
    port: 8888,
    serveStaticConfig: {
      index: 'index.html'
    }
  });
  demoServer.start(callback);
});

gulp.task('webserver.stop', function (callback) {
  demoServer.stop(callback);
});


//======//
// SITE //
//======//

gulp.task('site', ['webserver.start']);

gulp.task('site-deploy', function (done) {
  runSequence(
    'site-deploy-before',
    'site-deploy-actual',
    'site-deploy-after',
    done
  );
});

gulp.task('site-deploy-actual', function () {

  console.log('Starting to deploy files...');

  return gulp.src(deployTmpPath + '/**/*')
    .pipe(deploy())
  ;

});

gulp.task('site-deploy-before', function (done) {

  // Clearing temp directories and making a temp copy.
  deployClearTemp(function () {
    makeTempCopy(done);
  });


  /**
   * Makes a temporary copy of the site directory with symlinks resolved.
   *
   * @param {function} callback
   */
  function makeTempCopy (callback) {
    ncp('./site', deployTmpPath, {
      dereference: true
    }, function (error) {
      if (error) {
        return console.error(error);
      }
      console.log('Temporary copy created!');
      callback();
    });
  }

});

gulp.task('site-deploy-after', function (done) {
  deployClearTemp(done);
});


/**
 * Clears temp directory.
 *
 * @param {function} callback
 */
function deployClearTemp (callback) {
  del([deployTmpPath, './.publish'], function () {
    console.log('Temporary directories removed!');
    callback();
  });
}
