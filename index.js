/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Jo <jo@redcat.ninja> https://github.com/surikat/
	based on https://www.npmjs.com/package/php-loader by Tobias Koppers @sokra
*/

loaderUtils = require('loader-utils');
glob = require('glob');

module.exports = function(content) {
	// Hold the name of the file to be executed (a resource in webpack terminology)
	var resource = this.resource;

	// The directory where the original file was run. This is necessary
	// if the php script use the __DIR__ variable, wich refer to the original file.
	// So if the file is runned "inline", we need to change path into that path so that
	// __DIR__ point to the correct location.
	var cwd = this.context;


	// this.addDependency(headerPath); -> mark a dependancy for watching and cachable mode
	// this.cacheable && this.cacheable(); -> mark the file as cachable (true if dependancies are marked)
	var query = loaderUtils.parseQuery(this.query || '?');

	var callback = this.async();
	var options = Object.assign({
		proxyScript: null
	}, query);

	// Listen for any response from the child:
	var fullFile = "";
	var fullError = "";

	/**
	*
	* Run the PHP file inplace.
	*
	*/
	var args = [ ];
	if (options.proxy) {
		this.addDependency(options.proxy);
		args.push(options.proxy);
	}

	if (options.args) {
		args = args.concat(options.args);
	}

	this.addDependency(resource);
	args.push(resource);

	if (options.dependancies) {
		if (!Array.isArray(options.dependancies)) {
			options.dependancies = [ options.dependancies ];
		}
		for(a of options.dependancies) {
			for(b of glob.sync(a)) {
				if (options.debug) {
					fullFile += "<!-- dependant of " + b + "-->\n";
				}
				this.addDependency(b);
			}
		}
	}

	var self = this;
	
	const util = require('util');
	const exec = util.promisify(require('child_process').exec);

	console.log('php '+args.join(' '));
	async function runPhp() {
		const {stdout, stderr} = await exec('php '+args.join(' '));
		//console.log('stdout:', stdout);
		//console.log('stderr:', stderr);
		
		if (stdout && stderr) {
			if(stderr){
				self.emitError(stderr);
				callback(stderr);
			}
			else{
				callback(null, stdout);
			}
		}
		
	}
	runPhp();

};