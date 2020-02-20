const _ = require('lodash');
const ListBucket = require("./src/ListBucket");
const axios = require('axios');

const fs = require('fs');
const { execSync } = require('child_process');



class Tools{
	constructor(){
		const method = _.get(process.argv, 2);
		if(typeof this[method] === "function"){
			this[method]();
		}
		else this.help();
	}


	help(){
		console.log('');
		console.log('🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️ ');
		console.log('You need some help. Here is where you will find it. It\'s not here yet: 👎 👎 👎 👎 👎');
		console.log('🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️  🏳️ ');
		console.log('');
		console.log('');
	}
}

new Tools();
