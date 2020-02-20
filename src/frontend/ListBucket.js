const axios = require('axios');
const kebabCase = require('lodash/kebabCase');
const xml2js = require('xml2js');
import { to_param } from './helpers';

class ListBucket{

	constructor(bucket, path = '', cache = 300){
		this.bucket_contents = [];
		this.bucket = bucket;
		this.path = path;
		this.cache = cache;

		return new Promise((resolve, reject) => {
			this.retrieveS3(resolve);
		});

	}

	retrieveS3(callback, ContinuationToken){
	    const listObjectsParams = {
	      Bucket: this.bucket,
	      Prefix: this.path,
	    };

	    if(typeof ContinuationToken === "string"){
	      listObjectsParams.ContinuationToken = ContinuationToken;
	    }

	    this.S3_listObjectsV2(listObjectsParams, (err, data) => {
	      if(err){
	        console.error(err);
	      }
	      else {
	        this.bucket_contents = this.bucket_contents.concat(data.Contents);
	        if(data.IsTruncated){
	          this.retrieveS3(callback, data.NextContinuationToken);
	        }
	        else{
	          callback(this.bucket_contents);
	        }
	      }
	    });
	}


    manage_caches(){
	    if(!env._UPDATED_AT){
		    throw new Error("The key _UPDATED_AT has not been set in the environment. Add this to your .env, or system's environment variables!");
	    }
		if((env._UPDATED_AT || '').toString() != (localStorage._UPDATED_AT || '').toString()){
	        console.log('app has been updated, clearing cache');
	        for(let i in localStorage) {
				delete localStorage[i];
	        }
			for(let i in JSON.parse(localStorage._existing_keys || '[]')) {
				delete localStorage[localStorage._existing_keys[i]];
			}
			localStorage._UPDATED_AT = env._UPDATED_AT;
		}
    }


    // This has an identical signature to S3.listObjectsV2 from the AWS SDK
    S3_listObjectsV2(listObjectsParams, callback){
	    return new Promise((resolve, reject) => {
		    const resolver_fn = (typeof callback === "function") ? callback : resolve;
	        let mapped_params = {};
	        for(let i in listObjectsParams){
	          mapped_params[kebabCase(i)] = listObjectsParams[i];
	        }
	        delete mapped_params.bucket;
	        let s3_api_url = "https://"+listObjectsParams.Bucket+".s3.amazonaws.com/?list-type=2&" + to_param(mapped_params);
	        axios.get(s3_api_url).then(response => {
	          let parser = new xml2js.Parser({
	            explicitRoot: false,
	            explicitArray: false,
	            valueProcessors: [xml2js.processors.parseNumbers, xml2js.processors.parseBooleans],
	            ignoreAttrs: true,
	          });

	          parser.parseString(response.data, resolver_fn);

	        });
	    });
    }

}


export default ListBucket;
