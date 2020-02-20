#!/usr/bin/env node

const fs = require('fs');
const child_process = require('child_process');
let cli = require('./src/cli/cjs');

const[,, ...args] = process.argv;

const arg_options = getOptionsFromArgs();

const potential_functions = args.filter(v => v.slice(0,2) !== '--');

const run_all = !!potential_functions.length;

const run_all_extra_arguments = {
	G3n1usConfig: {},
	DirectoryIndexes: {
		"continue": true,
	},
	MakeVersion: {},
}

const pwd = process.env.PWD;




function setup(){
	var is_initial_setup = false;

	if(!fs.existsSync(pwd + '/node_modules/laravel-mix')){
		console.log("\n⚠️  Installing laravel-mix...\n");
		child_process.execSync(`cd "${pwd}" && npm install --save-dev laravel-mix`);
		console.log("✅  Done...\n");
		is_initial_setup = true;
	}

	if(!fs.existsSync(pwd + '/node_modules/@babel/plugin-proposal-class-properties')){
		console.log("\n⚠️  Installing @babel/plugin-proposal-class-properties...\n");
		child_process.execSync(`cd "${pwd}" && npm install --save-dev @babel/plugin-proposal-class-properties`);
		console.log("✅  Done...\n");
		is_initial_setup = true;

	}

	if(!fs.existsSync(pwd + '/webpack.mix.js')){
		console.log("\n⚠️  No webpack.mix.js file is present, so copying a default one from g3n1us_toolkit\n");
		child_process.execSync(`cp "${__dirname}/webpack.mix.consumer.js" "${pwd}/webpack.mix.js"`);
		console.log("✅  Done...\n");
		is_initial_setup = true;
	}

	if(!fs.existsSync(pwd + '/.env.example')){
		console.log("\n⚠️  No .env.example file is present, so making an empty one.\n");
		child_process.execSync(`touch "${pwd}/.env.example"`);
		console.log("✅  Done...\n");
		is_initial_setup = true;
	}

	if(!fs.existsSync(pwd + '/.editorconfig')){
		console.log("\n⚠️  No .editorconfig file is present, so adding one...\n");
		child_process.execSync(`cp "${__dirname}/.editorconfig" "${pwd}/.editorconfig"`);
		console.log("✅  Done...\n");
		is_initial_setup = true;
	}

	if(!fs.existsSync(pwd + '/.env.whitelist')){
		console.log("\n⚠️  No .env.whitelist file is present, so making an empty one. This is used to state which environment variables should be made available to the browser.\n");
		child_process.execSync(`touch "${pwd}/.env.whitelist"`);
		console.log("✅  Done...\n");
		is_initial_setup = true;
	}

	if(!fs.existsSync(pwd + '/src')){
		console.log("\n⚠️  No /src directory is present, so adding one...\n");
		child_process.execSync(`mkdir "${pwd}/src"`);
		child_process.execSync(`touch "${pwd}/src/app.js" "${pwd}/src/app.scss"`);
		console.log("✅  Done...\n");
		is_initial_setup = true;
	}

	if(!fs.existsSync(pwd + '/public')){
		console.log("\n⚠️  No /public directory is present, so adding one...\n");
		child_process.execSync(`mkdir "${pwd}/public"`);
		console.log("✅  Done...\n");
		is_initial_setup = true;
	}

	return is_initial_setup;
}


function boot(is_initial_setup){
	const _args = run_all ? potential_functions : Object.keys(cli);
	_args.forEach(function(arg){
		const potential = cli[arg];
		if(typeof potential === 'function'){
			const x = (run_all && run_all_extra_arguments[arg]) ? run_all_extra_arguments[arg] : {};
			if(isClass(potential)) new potential(x);
			else potential(x);
		}
		else {
			throw new Error(`${ar} is not a function`);
			return;
		}
	});

	if(is_initial_setup){
		setup_instructions();
	}

}


function setup_instructions(){
	console.log('');
	console.log('✅  ✅  ✅  ✅  Initial setup is complete.');
	console.log("You should add the following lines to the scripts section in package.json...");
	console.log('');
	console.log('	"dev": "npm run development",');
    console.log('	"development": "cross-env NODE_ENV=development node_modules/webpack/bin/webpack.js --progress --hide-modules --config=node_modules/laravel-mix/setup/webpack.config.js",');
    console.log('	"watch": "npm run development -- --watch",');
    console.log('	"hot": "cross-env NODE_ENV=development node_modules/webpack-dev-server/bin/webpack-dev-server.js --inline --hot --config=node_modules/laravel-mix/setup/webpack.config.js",');
    console.log('	"prod": "npm run production",');
    console.log('	"production": "cross-env NODE_ENV=production node_modules/webpack/bin/webpack.js --no-progress --hide-modules --config=node_modules/laravel-mix/setup/webpack.config.js",');
    console.log('	"start": "npm run watch"');
	console.log('');
	console.log("Then run: ");
	console.log('npm run dev');
	console.log('to create an initial build.');
	console.log('');
}


const is_initial_setup = setup();

boot(is_initial_setup);


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

function isClass(v) {
	const regex = /^\s*class\s+/;
	return typeof v === 'function' && regex.test(v.toString());
}


