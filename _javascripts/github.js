const Octokit = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_API_KEY });
const { readdirSync } = require('fs');
let repos = [];

const createRepo = async name => {
  try {
    if (!repos.includes(name)) {
      await octokit.repos.createInOrg({
        org: 'VandelayEducation',
        name: name,
        private: true,
        homepage: `https://${name}`
      })
      console.log(`Created private GitHub repo for ${name}`);
    }
    if (!repos.includes(`preview.${name}`)) {
      await octokit.repos.createInOrg({
        org: 'VandelayEducation',
        name: `preview.${name}`,
        private: true,
        homepage: `https://preview.${name}`
      })
      console.log(`Created private GitHub repo for ${`preview.${name}`}`);
    }
  } catch (error) {
    console.warn(error)
  }
}

const createRepos = async () => {
  try {
    await listRepos(1);
    const configs = readdirSync('_configs');
    for (let i = 0; i < configs.length; i++) {
      await createRepo(`${configs[i].replace('.yml', '')}`)
    }
  } catch (e) {
    console.warn(e)
  }
}


const listRepos = async (page) => {
  let allRepos = false
  try {
    while (!allRepos) {
      const response = await octokit.repos.listForOrg({
        org: "VandelayEducation",
        type: "all",
        per_page: 100,
        page
      })
      repos = [...repos, ...response.data.map(repo => repo.name)]
      page++;
      if (response.data.length < 100) allRepos = true
    }
    return repos;
  } catch (error) {
    console.error(error)
  }
}

createRepos();