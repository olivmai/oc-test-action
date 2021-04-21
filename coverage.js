requirejs.config({
    nodeRequire: require
});

var xml = require('fs').readFileSync('coverage.xml', 'utf8');
var options = {ignoreComment: true, alwaysChildren: true};
var result = convert.xml2js(xml, options);

console.log(result);