const path = require('path');
const fs = require('fs')
const dotenv = require('dotenv')
const browser_env = require('browser-env-vars');
let envDir = path.resolve(process.cwd());
const default_options = {
    outFile: path.resolve(process.cwd(), 'src/GENERATED_ENV_CONFIG.js'),
    envDir: envDir,
    whitelist: undefined,
    esm: true, //this sets es6 style exports: export default ...
    global: false,
    dojo: false,
    clobber: false,
    path: path.resolve(envDir, `.env`),
};


class G3n1usConfig{

	constructor(options = {}){
		if(G3n1usConfig.isCli()){
			this.options = { ...default_options, ...this.getOptionsFromArgs() };
		}
		else{
			this.options = { ...default_options, ...this.getOptionsFromArgs(), ...options };
		}
		this.dotenv_config = {
			path: this.options.path,
			debug: this.options.debug,
			clobber: this.options.clobber,
		}
		this.env_file();
		this.boot();

		this.generate();
	}


	boot(){
		const config = dotenv.config(this.dotenv_config);
		if(this.dotenv_config.clobber){
			for (const k in config.parsed) {
				process.env[k] = config.parsed[k]
			}
		}
		return config;
	}


	env_file(){
		const app_env_initial = this.options.node_env || process.env.APP_ENV || process.env.NODE_ENV || false;
		const DEFAULT_FILE = this.dotenv_config.path;
		if(app_env_initial !== false){
			const ENV_SPECIFIC_FILE = path.resolve(this.options.envDir, `.env.${app_env_initial}`);
			if(fs.existsSync(ENV_SPECIFIC_FILE)){
				this.dotenv_config.clobber = true;
				this.dotenv_config.path = ENV_SPECIFIC_FILE;
			}
		}
	}



	generate(){
		const output_types = this.getOutputTypes();
		if(output_types.length){
			const tmpname = `.tmp_${Math.floor((Math.random()*100000)+1)}.json`;
			output_types.forEach(k => this[`generate_${k}`](tmpname));
		}
		else{
		    browser_env.generate(this.getBrowserOptions());
		    let contents = fs.readFileSync(this.options.outFile);
		    console.log(`DONE! Wrote to ${this.options.outFile}`, "\r\n", contents.toString());
		}
	}



	generate_global(tmpname){
	    browser_env.generate({ ...this.getBrowserOptions(), outFile: tmpname });
	    let contents = fs.readFileSync(tmpname);
	    contents = `;(function(window){window.${this.options.global === true ? 'env' : this.options.global} = ${contents};})(window);\n`;
	    fs.writeFileSync(this.options.outFile, contents);
	    fs.unlinkSync(tmpname);
	    console.log(`DONE! Wrote to ${this.options.outFile}`, "\r\n", contents.toString());
	}


	generate_dojo(tmpname){
	    browser_env.generate({ ...this.getBrowserOptions(), outFile: tmpname });
	    let contents = fs.readFileSync(tmpname);
	    contents = `define(${contents});`;
	    fs.writeFileSync(this.options.outFile, contents);
	    fs.unlinkSync(tmpname);
	    console.log(`DONE! Wrote to ${this.options.outFile}`, "\r\n", contents.toString());
	}

	getOutputTypes(){
		return ['global', 'dojo'].filter(v => this.options[v]);
	}

	getBrowserOptions(){
		let { outFile, esm } = this.options;
		return {
			outFile: outFile,
			esm: esm,
			whitelist: this.getWhitelistedOptions(),
		};
	}

	static isCli(){
		return require.main === module;
	}


	// pass arguments to the cli in the format --key=value
	getOptionsFromArgs(){
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


	getWhitelistedOptions(){
		if(typeof this.options.whitelist === 'object'){
			return this.options.whitelist;
		}
		else{
			const { envDir } = this.options;
			if(fs.existsSync(`${envDir}/.env.whitelist`)){
				return Object.keys(dotenv.parse(fs.readFileSync(`${envDir}/.env.whitelist`)));
			}
			else{
				throw new Error(`You must pass a whitelist of properties to make available to the browser in some way. This can be either a file called .env.whitelist or a whitelist property can be assigned to configuration.`);
			}
		}

	}
}

if(G3n1usConfig.isCli()){
	new G3n1usConfig();
}

module.exports = G3n1usConfig;
