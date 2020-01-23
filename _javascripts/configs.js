const fm = require('front-matter');
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs')

const createConfigs = () => {
  const schools = fm(readFileSync('./settings.html', 'utf-8')).attributes.schools
    .filter(school => school.active || process.env.JEKYLL_ENV === 'preview.')
    .map(school => school.key);
  if (!existsSync('./_configs')) mkdirSync('./_configs');
  schools.forEach(school => writeFileSync(`./_configs/${school}.com.yml`, `key: ${school}`))
}

createConfigs()