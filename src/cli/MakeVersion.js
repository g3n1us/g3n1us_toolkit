const fs = require('fs');
const path = require('path');
const basepath = process.env.PWD;


const default_options = {
    versions_directory: 'src/application_version',
    envDir: path.resolve(process.cwd()),
    whitelist: undefined,
    esm: true, //this sets es6 style exports: export default ...
    global: false,
    dojo: false,
};



module.exports = function(options = {}){
	const rand = 'v' + new Date().getTime().toString();
	process.env.APP_VERSION = rand;
	const defined_options = { ...default_options, ...getOptionsFromArgs(), ...options };

	const versions_directory = path.resolve(basepath, defined_options.versions_directory);
	if(!fs.existsSync(versions_directory)){
		fs.mkdirSync(versions_directory);
	}
	const files = [
		{
			filename: 'version.py',
			content: `version = '${rand}'\n`
		},
		{
			filename: 'version.js',
			content: `const version = '${rand}';\nexport default () => version;\n`
		},
		{
			filename: 'version_node.js',
			content: `process.env.APP_VERSION = '${rand}';\nmodule.exports = '${rand}';\n`
		},
		{
			filename: 'version.php',
			content: `<?php\nreturn '${rand}';\n`
		},
	];
	files.forEach(function(file){
		const writepath = path.resolve( versions_directory + '/' + file.filename);
		fs.writeFileSync(writepath, file.content);
		console.log(`\n${file.filename} written to: ${writepath}\n\n`);
	});


}


// pass arguments to the cli in the format --key=value
function getOptionsFromArgs(){
	let args = process.argv.filter(v => v.slice(0,2) == '--');
	let parsed_args = {};
	args.forEach((v) => {
		let explode = v.slice(2).split('=');
		let val = explode.length === 2 ? explode[1] : true;
		if(val === 'true') val = true;
		if(val === 'false') val = false;
		parsed_args[explode[0]] = val;
	});
	return parsed_args;
}
