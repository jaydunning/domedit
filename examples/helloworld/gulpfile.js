var gulp = require('gulp');
var domedit = require('../..');

gulp.task('domedit', function() {
  return gulp.src(['html/**/*.html', '!html/**/*-original.html'])
    .pipe(domedit({modsdir: 'mods', verbose: true}))
    .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['domedit']);
