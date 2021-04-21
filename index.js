const core = require('@actions/core');
// const github = require('@actions/github');
const glob = require('@actions/glob');
const convert = require('xml-js');
const fs = require('fs');

try {
  // this is the default action code from the tutorial
  // I keep it for now, as we are sure it works and runs in the CI
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);

  ///////////////////////////////////////////
  // BELOW IS THE CODE FOR OUR REAL ACTION //
  ///////////////////////////////////////////

  // @actions/glob allow to access files in the current job workplace. See: https://github.com/actions/toolkit/tree/main/packages/glob
  const patterns = ['coverage.xml']
  const globber = glob.create(patterns)
  const file = globber.glob()
  
  // this shoul allow us to get file content
  const xmlContent = fs.readFileSync(file, { encoding: 'utf8' });

  // xml-js extension should ease the process to convert xml content to JSObject or json. See: https://www.npmjs.com/package/xml-js
  var options = {ignoreComment: true, alwaysChildren: true};
  var result = convert.xml2js(xml, options);

  // this result should be a JS object containing coverage infos
  console.log(result);

} catch (error) {
  core.setFailed(error.message);
}