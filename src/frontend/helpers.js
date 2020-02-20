import axios from 'axios';
import localforage from 'localforage';


const helpers = {};

export function config(){
	return {APP_URL: window.location.hostname};
}

helpers.app_url = rtrim(config().APP_URL.trim(), '/');


export function url(path){
    return helpers.app_url + (starts_with(path, '/') ? path : `/${path}`);
}

helpers.url = url;

export function rtrim(str, charlist) {
	charlist = !charlist ? ' \\s\u00A0' : (charlist + '')
	.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^:])/g, '\\$1')

	var re = new RegExp('[' + charlist + ']+$', 'g')

	return (str + '').replace(re, '');
}

helpers.rtrim = rtrim;


export function basename(path){
    const parts = path.split('/');
    return parts[parts.length - 1];
}

helpers.basename = basename;

export function starts_with(string, needle){
	return string.slice(0, needle.length) == needle;
}

helpers.starts_with = starts_with;

export function ends_with(string, ending){
	var realending = string.slice(ending.length * -1);
	return ending == realending;
}

helpers.ends_with = ends_with;

export function mime(filename){
	var path = filename.toLowerCase();
	var mime = "image/jpeg";
	if(ends_with(path, ".css")) mime = "text/css";
	else if(ends_with(path, ".less")) mime = "text/css";
	else if(ends_with(path, ".sass")) mime = "text/css";
	else if(ends_with(path, ".scss")) mime = "text/css";
	else if(ends_with(path, ".mp4")) mime = "video/mp4";
	else if(ends_with(path, ".mov")) mime = "video/quicktime";
	else if(ends_with(path, ".js")) mime = "application/javascript";
	else if(ends_with(path, ".pdf")) mime = "application/pdf";
	else if(ends_with(path, ".svg")) mime = "image/svg+xml";
	else if(ends_with(path, ".jpg")) mime = "image/jpeg";
	else if(ends_with(path, ".jpeg")) mime = "image/jpeg";
	else if(ends_with(path, ".png")) mime = "image/png";
	else if(ends_with(path, ".gif")) mime = "image/gif";
	else if(ends_with(path, ".tif")) mime = "image/tiff";
	else if(ends_with(path, ".tiff")) mime = "image/tiff";
	else if(ends_with(path, ".ico")) mime = "image/vnd.microsoft.icon";
	else if(ends_with(path, ".json")) mime = "application/json";
	else if(ends_with(path, ".ttf")) mime = "application/x-font-truetype";
	else if(ends_with(path, ".woff")) mime = "application/font-woff";
	else if(ends_with(path, ".woff2")) mime = "application/font-woff2";
	else if(ends_with(path, ".otf")) mime = "application/x-font-opentype";
	else if(ends_with(path, ".eot")) mime = "application/vnd.ms-fontobject";
	else if(ends_with(path, ".md")) mime = "text/markdown; charset=UTF-8";
	else if(ends_with(path, ".swf")) mime = "application/x-shockwave-flash";
	else if(ends_with(path, ".php")) mime = "text/html";
	else if(ends_with(path, ".hbs")) mime = "text/x-handlebars-template";
	else if(ends_with(path, ".json")) mime = "application/json";
	else if(ends_with(path, ".zip")) mime = "application/zip";
	else if(ends_with(path, ".ppt")) mime = "application/vnd.ms-powerpoint";
	else if(ends_with(path, ".pptx")) mime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
	else if(ends_with(path, ".doc")) mime = "application/msword";
	else if(ends_with(path, ".docx")) mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	else if(ends_with(path, ".xls")) mime = "application/vnd.ms-excel";
	else if(ends_with(path, ".xlsx")) mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
	else if(path.includes('http')) mime = "hyperlink";

	return mime;
}

helpers.mime = mime;

export function is_image(filename){
	return !!mime(filename).match(/^image\/.*?$/);
}

helpers.is_image = is_image;


export function getOrdinal(n) {
   var s=["th","st","nd","rd"],
       v=n%100;
   return n+(s[(v-20)%10]||s[v]||s[0]);
}

helpers.getOrdinal = getOrdinal;

/*
export function remember(url, minutes, callback){
  if(typeof arguments[1] === 'function'){
    callback = arguments[1];
    minutes = null;
  }

  minutes = minutes || 10; // 10 minutes by default
  if(typeof url === undefined) throw new Error('a url must be provided to "remember"');
  let urlparts = url.split('?');
  let slug = urlparts.map(function(segment){
    return segment.match(/[rstlncdmaeiou0-9]/gi).sort().join('').slice(-25);
  }).join('');

  let expires_after = new Date(localStorage[slug + "_timestamp"] || 'June 1, 1977');
  let now = new Date;
  let current_minutes = expires_after.getMinutes();
  expires_after.setMinutes(current_minutes + minutes);
  let not_expired = expires_after > now && typeof localStorage[slug] !== 'undefined';
  if(not_expired){
    console.log('retrieving from cache', slug);
    if(typeof callback === 'function'){
      callback(JSON.parse(localStorage[slug]));
    }
    else
      return JSON.parse(localStorage[slug]);
  }
  else{
    return axios.get(url).then(function(response){
      put_localstorage(slug, response.data);
      put_localstorage(slug + "_timestamp", new Date);
      if(typeof callback === 'function')
        callback(response.data);
    });
  }
}
*/



export function remember(url, minutes, callback){
	if(typeof arguments[1] === 'function'){
		callback = arguments[1];
		minutes = null;
	}
	if(typeof url === undefined) throw new Error('a url must be provided to "remember"');
	let urlparts = url.split('?');
	let slug = urlparts.map(function(segment){
		return segment.match(/[rstlncdmaeiou0-9]/gi).sort().join('').slice(-25);
	}).join('');

	return cachedPromise(slug, minutes, url);

}

helpers.remember = remember;



export function cachedPromise(slug, minutes, _promise_or_url){
  if(typeof arguments[1] === 'object'){
    _promise_or_url = arguments[1];
    minutes = null;
  }
  minutes = minutes || 10; // 10 minutes by default

  return new Promise(function(resolve, reject){
	  const _fetch_promises = Promise.all([get_localstorage(slug), get_localstorage(`${slug}_timestamp`)])
		  .then(function(D){
			  let [ data, expires_after ] = D;
			  expires_after = new Date(expires_after || 'June 1, 1977');

		      let now = new Date;
		      let current_minutes = expires_after.getMinutes();
		      expires_after.setMinutes(current_minutes + minutes);
		      let not_expired = data && expires_after > now;
		      if(not_expired){
		        console.log('retrieving promise from cache', slug);
		        resolve(data);
		      }
		      else{
		        let returnPromise = _.isString(_promise_or_url) ? axios.get(_promise_or_url) : new Promise(_promise_or_url);
		        returnPromise.then(function(data){
		          put_localstorage(slug, data.data);
		          put_localstorage(slug + "_timestamp", new Date);
		          resolve(data.data);
		        });
		      }

		  });


  });
}

helpers.cachedPromise = cachedPromise;




export function get_localstorage(key){
	return localforage.getItem(key);
}

helpers.get_localstorage = get_localstorage;


export function put_localstorage(key, val){
	return localforage.setItem(key, val);
}

helpers.put_localstorage = put_localstorage;



export function to_param(obj){
	let ret = [];
	for(let i in obj){
		ret.push(`${i}=${obj[i]}`);
	}
	return ret.join('&');
}

helpers.to_param = to_param;


export function validateEmail(email) {
	let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

helpers.validateEmail = validateEmail;


export function store_val(key, val = [], obj = window){
	Object.defineProperty(obj, key, {
		configurable: false,
		enumerable: false,
		writable: false, // The value MAY NOT be changed by assignment, eg. _arrSortedByVariableLabels = []. The values must be morphed in place
		value: val,
	});

	const proto = Object.getPrototypeOf(obj[key]);

	const source_descriptors = _(Object.getOwnPropertyDescriptors(proto)).toPairs().filter(function(desc){
		return desc[0] !== 'constructor' && typeof desc[1].value === 'function';
	}).value();
	const modified_descriptors = _(source_descriptors).map(function(tuple){
		const propname = tuple[0];
		const descriptor = _.clone(tuple[1]);
		const parent_fn = proto[propname];
		descriptor.value = function() {
			const oldval = _.clone(this);
			const returnval = parent_fn.call(this, ...arguments);
			if(key in ___.watchers){
				___.watchers[key](key, oldval, this);
			}
			return returnval;
		}

		return [tuple[0], descriptor];
	}).fromPairs().value();

	Object.defineProperties(obj[key], modified_descriptors);

}

helpers.store_val = store_val;

/***********************************************************************
Object.watch polyfill - allows for watching for changes in the value of a property of an object.
param:      property_name: The string value of the property to observe
param:      callback: The function to call when a change is detected. Receives three arguments: prop, oldval, newval
prop = the property
oldval = value prior to change
newval = value that the property is being set to

callback should return the final value the property should be set to. Returning nothing prevents the property's value from changing.

Note: native implementation is Object.watch; Our polyfill exists separately under the method name 'obj_watch' to avoid issues in Firefox which implements natively but overloading causes errors.
*****************************************************************/

if (!Object.prototype.obj_watch) {
	Object.defineProperty(Object.prototype, "obj_watch", {
		  enumerable: false,
		  configurable: true,
		  writable: false,
		  value: function (prop, handler) {
			var oldval = this[prop];
			var newval = oldval;
			var getter = function () {
				return newval;
			}
			var setter = function (val) {
				oldval = newval;

				if(_.isEqual(val, oldval)){
					console.log(prop + ' did not change', val, oldval)
					return newval = val;
				}
				return newval = handler.call(this, prop, oldval, val);
			}

			if (delete this[prop]) { // can't watch constants
				Object.defineProperty(this, prop, {
					get: getter,
					set: setter,
					enumerable: true,
					configurable: true,
				});
			}
		}
	});
}


export default helpers;
