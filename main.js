// Inspired by bower-away, but built with pnpm in mind

const fs = require('fs');
const { spawnSync } = require('child_process')
const { globSync } = require('glob');


const packageJson = JSON.parse(fs.readFileSync('package.json').toString());

spawnSync('bower', ['install']);

const { stdout } = spawnSync('bower', ['list', '-j'], { maxBuffer: 1024 * 1024 * 1024 });

const listOutput = JSON.parse(stdout.toString());

const dependenciesByName = {};

function recurseDependenciesList(dependencies) {
  for (const dependencyName of Object.keys(dependencies)) {
    const dependency = dependencies[dependencyName];

    dependenciesByName[dependencyName] = dependency;

    if (dependency.dependencies) {
      recurseDependenciesList(dependency.dependencies);
    }


  }
}

recurseDependenciesList(listOutput.dependencies);

for (const dependencyName of Object.keys(dependenciesByName)) {
  const dependency = dependenciesByName[dependencyName];
  packageJson.dependencies['@bower_components/' + dependencyName] = `${dependency.pkgMeta._source.startsWith('git@') ? 'git+ssh://' : ''}${dependency.pkgMeta._source}#${dependency.pkgMeta._resolution.tag}`;
}

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n')

spawnSync('pnpm', ['install']);

fs.rmSync('bower_components', { recursive: true, force: true });
fs.rmSync('bower.json', { recursive: true, force: true });

for (const filePath of globSync('**/*.{jade,js}')) {
  const contents = fs.readFileSync(filePath).toString();

  const replacement = contents.replace(/bower_components/g, 'node_modules/@bower_components');

  if (contents !== replacement) {
    fs.writeFileSync(filePath, replacement);
  }
}



