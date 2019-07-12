const postcss = require('postcss')
const fs = require('fs')
const atImport = require('postcss-import')
const purgecss = require('@fullhuman/postcss-purgecss')
const cssnano = require('cssnano');
const amp = require('postcss-amp');

fs.readFile('assets/css/main.css', (err, css) => {
  postcss([atImport, amp, purgecss({
    content: ['./_site/**/*.html']
  }), cssnano({
    preset: ['advanced']
  })])
    .process(css, { from: 'assets/css/main.css', to: 'assets/css/main.min.css' })
    .then(result => {
      fs.writeFile('assets/css/main.min.css', result.css, () => true)
      if ( result.map ) {
        fs.writeFile('assets/css/main.min.css.map', result.map, () => true)
      }
    })
})