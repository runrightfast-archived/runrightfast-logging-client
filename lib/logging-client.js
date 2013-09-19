/**
 * Copyright [2013] [runrightfast.co]
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * The Logging Client is an LoggingService instance configured with a
 * logListener that is a REST client that posts the event to a Logging Server.
 * 
 * options: <code>
 * var options = {
 *	url : 'http://localhost:8000/log' // required
 *  retry : { // optional
 *  	initial : 100, // optional - initial delay in milliseconds after the first error response, must be > 0 - default = 100
 *  	multiplier : 2 // optional - multiplier for the delay on each subsequent failure used for exponential back offs, must be > 0 - default = 2
 *  	max : 1000 * 60 * 60 // optional - max delay in milliseconds, must be > 0 - default = 1 minute
 *  },
 *  timeout : 1000*60*2 // optional - duration in milliseconds before canceling the request. Non-positive values disable the timeout. - default is no timeout
 *	
 *};
 * </code>
 */
(function() {
	'use strict';

	var lodash = require('lodash');
	var Hoek = require('hoek');
	var assert = Hoek.assert;

	var defaultOptions = {
		retry : {
			initial : 100,
			multiplier : 2,
			// 1 minute
			max : 1000 * 60 * 60
		}
	};

	var validateConfig = function(config) {
		assert(lodash.isString(config.url), 'url is required');

		if (config.retry) {
			if (config.retry.initial) {
				assert(config.retry.initial > 0, 'retry.initial must be > 0');
			}

			if (config.retry.multiplier) {
				assert(config.retry.multiplier > 0, 'retry.multiplier must be > 0');
			}

			if (config.retry.max) {
				assert(config.retry.max > 0, 'retry.max must be > 0');
			}
		}

		if (config.timeout) {
			if (config.retry.initial) {
				assert(lodash.isNumber(config.timeout), 'timeout must be a Number');
			}
		}
	};

	var createRestClient = function(config) {
		var rest = require('rest');
		var errorCode = require('rest/interceptor/errorCode');
		var retry = require('rest/interceptor/retry');
		var timeout = require('rest/interceptor/timeout');

		return rest.chain(errorCode, {
			code : 400
		}).chain(retry, config.retry).chain(timeout, {
			timeout : config.timeout
		});
	};

	module.exports = function(options) {
		var config = Hoek.applyToDefaults(defaultOptions, options || {});
		validateConfig(config);
		var client = createRestClient(config);

		var Request = function(event) {
			this.path = config.url;
			this.entity = JSON.stringify(event);
		};

		var loggingServiceOptions = {
			logListener : function(event) {
				client(new Request(event)).otherwise(function(response) {
					var info = {
						statusCode : response.status.code,
						statusText : response.status.text,
						entity : response.entity
					};
					console.error('log request failed: ' + JSON.stringify(info));
				});
			}
		};

		return require('runrightfast-logging-service')(loggingServiceOptions);
	};

}());
