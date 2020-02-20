const fs = require('fs');
const path = require('path');
const basepath = process.env.PWD;

var readline = require('readline');

const default_options = {
    folders_to_generate: ['src'],
    "continue": false,
};


module.exports = function(options = {}){
	const rl = readline.createInterface(process.stdin, process.stdout);

	const defined_options = { ...default_options, ...getOptionsFromArgs(), ...options };

	if(typeof defined_options.folders_to_generate === 'string'){
		defined_options.folders_to_generate = [defined_options.folders_to_generate];
	}

	const folders_to_generate = defined_options.folders_to_generate;

	console.log('');
	console.log(`Generating index.js files recursively for the following folders: ${folders_to_generate}`);
	console.log(`This will overwrite any index.js files already there`);
	console.log('');

	if(defined_options.continue){
		write_indexes(folders_to_generate);
		console.log('');
		console.log('Finished.');
		console.log('');
		process.exit(0);

	}
	else{
		rl.question("Continue? [yes]/no: ", function(answer) {
			console.log('');
			if(answer.slice(0, 1) === "n") {
				console.log ("exiting... ");
				process.exit(0);
			} else {
				write_indexes(folders_to_generate);
				console.log('');
				console.log('Finished.');
				console.log('');
				process.exit(0);
			}
		});
	}


	function write_indexes(folders){
		folders.forEach(folder => {
			console.log(`${folder}/index.js being created...`);
			let files = fs.readdirSync(`${basepath}/${folder}`);
			files = files.filter(f => {
				let stats = fs.statSync(`${basepath}/${folder}/${f}`);
				if(stats.isDirectory()){
					write_indexes([`${folder}/${f}`]);
					return false;
				}
				let do_not_skip = f !== 'index.js' && f !== 'cjs.js' && f[0] !== '.' && /^.*?\.jsx?$/.test(f);
				if(!do_not_skip) console.log(`   - skipping file: ${f}`);

				return do_not_skip;
			});
			files = files.map(f => f.replace(/\.js(x?)/, ''));
			let imports = files.map(f => `import ${f} from './${f}';`);
			let cjs_imports = files.map(f => `module.exports.${f} = require('./${f}');`);
			let exports = files.join(', ');
			let export_statement = `export { ${exports} };`;
			let template = `//THIS IS AN AUTOMATICALLY GENERATED FILE, DO NOT EDIT\n\n${imports.join("\n")}\n\n${export_statement}\n`;
			fs.writeFileSync(`${folder}/index.js`, template);
			let amd_template = `//THIS IS AN AUTOMATICALLY GENERATED FILE, DO NOT EDIT\n\n${cjs_imports.join("\n")}\n`;
			fs.writeFileSync(`${folder}/cjs.js`, amd_template);
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

}
