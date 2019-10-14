`use strict`;

var gulp = require(`gulp`);
var del = require(`del`);
var plumber = require(`gulp-plumber`);
var concat = require(`gulp-concat`);
var rename = require(`gulp-rename`);
var newer = require('gulp-newer');
var imagemin = require(`gulp-imagemin`);
var svgstore = require(`gulp-svgstore`);
var webp = require(`gulp-webp`);

var sass = require(`gulp-sass`);
var postcss = require(`gulp-postcss`);
var autoprefixer = require(`autoprefixer`);
var csso = require(`gulp-csso`);

var uglify = require(`gulp-terser`);

var server = require(`browser-sync`).create();

gulp.task(`clean`, function () {
  return del(`build`);
});

gulp.task(`copy`, function () {
  return gulp.src([
    `source/fonts/**`, `source/movie/**`
  ], {
      base: `source`
    })
    .pipe(gulp.dest(`build`));
});

// СТИЛИ
gulp.task(`css`, function () {
  return gulp.src(`source/scss/style.scss`)
    .pipe(plumber())
    .pipe(sass({
      outputStyle: `expanded`
    }))
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest(`build/css`))
    .pipe(csso())
    .pipe(rename(`style.min.css`))
    .pipe(gulp.dest(`build/css`))
    .pipe(server.stream());
});

// ИЗОБРАЖЕНИЯ
gulp.task(`sprite`, function () {
  return gulp.src(`source/img/*.svg`)
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename(`sprite.svg`))
    .pipe(gulp.dest(`build/img`));
});

gulp.task(`webp`, function () {
  return gulp.src(`build/img/**/*.{png,jpg,gif}`)
    .pipe(webp({ quality: 90 }))
    .pipe(gulp.dest('build/img'));
});

gulp.task(`images`, function () {
  return gulp.src(`source/img/**/*.{png,jpg,svg,gif}`)
    .pipe(newer(`build/img`))
    .pipe(gulp.dest(`build/img`));
});

gulp.task(`imagemin`, function () {
  return gulp.src('build/img/**/*.{png,jpg,svg}')
    .pipe(imagemin([
      imagemin.optipng({ optimizationLevel: 3 }),
      imagemin.jpegtran({ progressive: true }),
      imagemin.svgo({
        plugins: [{
          removeViewBox: false
        }]
      })
    ]))
    .pipe(gulp.dest('build/img'));
});

// СКРИПТЫ
gulp.task(`js-vendor`, function () {
  return gulp.src([
    `source/js/vendor/*.js`,
  ])
    .pipe(plumber())
    .pipe(concat(`vendor.js`))
    .pipe(gulp.dest(`build/js`))
    .pipe(uglify())
    .pipe(rename({
      suffix: `.min`
    }))
    .pipe(gulp.dest(`build/js`));
});

gulp.task(`js`, function () {
  return gulp.src([
    `source/js/modules/*.js`,
    `source/js/global/*.js`
  ])
    .pipe(plumber())
    .pipe(concat(`script.js`))
    .pipe(gulp.dest(`build/js`))
    .pipe(uglify())
    .pipe(rename({
      suffix: `.min`
    }))
    .pipe(gulp.dest(`build/js`));
});

// HTML
gulp.task(`html`, function () {
  return gulp.src(`source/*.html`)
    .pipe(gulp.dest(`build`));
});

// СТРИМ
gulp.task(`server`, function () {
  server.init({
    server: `build/`,
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch(`source/scss/**/*.scss`, gulp.series(`css`));
  gulp.watch(`source/img/**/*`, gulp.series(`images`, `sprite`, `webp`, `refresh`));
  gulp.watch(`source/js/**/*.js`, gulp.series(`js`, `refresh`));
  gulp.watch(`source/*.html`).on(`change`, gulp.series(`html`, `refresh`));
});

gulp.task(`refresh`, function (done) {
  server.reload();
  done();
});

// СБОРКА И СТАРТ
gulp.task(`build`, gulp.series(`clean`, `copy`, `images`, `webp`, /*`imagemin`,*/ `sprite`, `css`, `js-vendor`, `js`, `html`));
gulp.task(`start`, gulp.series(`build`, `server`));
