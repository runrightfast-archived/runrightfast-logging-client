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
 * The Logging Client is a LoggingService instance configured with a logListener
 * that is a REST client that posts the event to a Logging Server.
 * 
 * options: <code>
 * var options = {
 *	url : 'http://localhost:8000/api/runrightfast-logging-service/log' // required,  
 *  retry : { // optional
 *  	initial : 100, // optional - initial delay in milliseconds after the first error response, must be > 0 - default = 100
 *  	multiplier : 2 // optional - multiplier for the delay on each subsequent failure used for exponential back offs, must be > 0 - default = 2
 *  	max : 1000 * 60 * 60 // optional - max delay in milliseconds, must be > 0 - default = 1 minute
 *  },
 *  timeout : 1000*60*2, // optional - duration in milliseconds before canceling the request. Non-positive values disable the timeout. - default is no timeout
 *  errorCallback : function(info) // optional - invoked if the HTTP request fails - info is an object with the following properties : event, statusCode, statusText, entity,
 *  batch : { //optional - if set to true, then the default batch settings are used
 *  	size : 10, // optional - if the batch size reaches this limit, then imediately submit the batch, and reset the batch interval timer - default is 10
 *  	interval : 1000*30, // optional - how often to submit the batch, specified in milliseconds - default is 30 seconds
 *  	releaseTags : ['error','warn'] // optional - array of tag names that are used to release the batch immediately if an event contains one of the specified tags - default is ['warn','error']
 *	},
 *	logLevel : 'WARN' // OPTIONAL - DEBUG | INFO | WARN | ERROR - default is WARN
 *  auth : {
 *  	hawk : {
 *  		credentials : {
 *			    id: 'dh37fgj492je',
 *			    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
 *			    algorithm: 'sha256'
 *			},
 *			ext : 'app-specific-data'
 *  	}	
 *  }
 *};
 * </code>
 */
(function() {
	'use strict';
	var logging = require('runrightfast-commons').logging;
	var logger = logging.getLogger('runrighfast-logging-client');

	var lodash = require('lodash');
	var extend = require('extend');
	var Hoek = require('hoek');
	var assert = Hoek.assert;

	var validateConfig = function(config) {
		assert(lodash.isString(config.url), 'url is required');

		if (!lodash.isUndefined(config.retry)) {
			if (!lodash.isUndefined(config.retry.initial)) {
				assert(lodash.isNumber(config.retry.initial) && config.retry.initial > 0, 'retry.initial must be > 0');
			}

			if (!lodash.isUndefined(config.retry.multiplier)) {
				assert(lodash.isNumber(config.retry.multiplier) && config.retry.multiplier > 0, 'retry.multiplier must be > 0');
			}

			if (!lodash.isUndefined(config.retry.max)) {
				assert(lodash.isNumber(config.retry.max) && config.retry.max > 0, 'retry.max must be > 0');
			}
		}

		if (!lodash.isUndefined(config.timeout)) {
			assert(lodash.isNumber(config.timeout), 'timeout must be a Number');
		}

		if (!lodash.isUndefined(config.errorCallback)) {
			assert(lodash.isFunction(config.errorCallback), 'errorCallback must be a function');
		}

		if (!lodash.isUndefined(config.batch)) {
			var defaultBatchOptions = {
				size : 10,
				interval : 1000 * 30,
				releaseTags : [ 'error', 'warn' ]
			};

			if (lodash.isBoolean(config.batch)) {
				if (config.batch) {
					config.batch = defaultBatchOptions;
				}
			} else if (lodash.isObject(config.batch)) {
				config.batch = extend(true, defaultBatchOptions, config.batch);
				assert(lodash.isNumber(config.batch.size) && config.batch.size > 0, 'batch.size must be a Number > 0');
				assert(lodash.isNumber(config.batch.interval) && config.batch.interval > 0, 'batch.interval must be a Number > 0');
				assert(lodash.isArray(config.batch.releaseTags), 'batch.releaseTags must be an Array');
			} else {
				throw new Error('config.batch is invalid - it must either be a Boolean or an Object');
			}
		}

		logging.setLogLevel(logger, config.logLevel);

		if (config.errorCallback) {
			assert(lodash.isFunction(config.errorCallback), 'errorCallback must be a function');
		}

	};

	var createRestClient = function(config) {
		var rest = require('rest');
		var errorCode = require('rest/interceptor/errorCode');
		var retry = require('rest/interceptor/retry');
		var timeout = require('rest/interceptor/timeout');

		if (config.auth) {
			if (config.auth.hawk) {
				if (logger.isDebugEnabled()) {
					logger.debug('chaining hawk-auth-interceptor to rest client');
				}
				var hawk = require('runrightfast-rest-auth-hawk-interceptor');
				rest = rest.chain(hawk.interceptor, config.auth);
			}
		}

		return rest.chain(retry, config.retry).chain(timeout, {
			timeout : config.timeout
		}).chain(errorCode);
	};

	var getConfig = function(options) {
		var config = {
			retry : {
				initial : 100,
				multiplier : 2,
				// 1 minute
				max : 1000 * 60 * 60
			},
			logLevel : 'WARN'
		};
		extend(true, config, options || {});
		validateConfig(config);
		logger.debug(config);
		return config;
	};

	module.exports = function(options) {
		var config = getConfig(options);
		var client = createRestClient(config);

		var Request = function(event) {
			this.path = config.url;
			this.entity = JSON.stringify(event);
		};

		var postEvent = function(event) {
			client(new Request(event)).then(function(response) {
				if (logger.isDebugEnabled()) {
					logger.debug('response.status.code = ' + response.status.code);
				}
			}, function(response) {
				var getEntity = function() {
					try {
						JSON.parse(response.entity);
					} catch (err) {
						return response.entity;
					}
				};

				var info = {
					statusCode : response.status.code,
					statusText : response.status.text,
					entity : getEntity()
				};
				logger.error('log request failed: ' + JSON.stringify(info));
				if (config.errorCallback) {
					if (logger.isDebugEnabled()) {
						logger.debug('notifying callback that log request failed');
					}
					info.event = event;
					config.errorCallback(info);
				}
			});
		};

		var createLogListener = function() {
			if (config.batch) {
				var eventsBatch = [];
				var timer = null;

				var releaseBatch = function(event) {
					if (eventsBatch.length >= config.batch.size) {
						if (logger.isDebugEnabled()) {
							logger.debug('releasing batch because of size');
						}
						return true;
					}

					// if any of the event tags matches one of the batch release
					// tags, then release the batched events
					return !!lodash.find(config.batch.releaseTags, function(tag) {
						return lodash.contains(event.tags, tag);
					});

				};

				return function(event) {
					eventsBatch.push(event);
					if (releaseBatch(event)) {
						postEvent(eventsBatch);
						eventsBatch = [];
						clearTimeout(timer);
						timer = null;
					} else {
						if (!timer) {
							timer = setTimeout(function() {
								if (eventsBatch.length > 0) {
									if (logger.isDebugEnabled()) {
										logger.debug('releasing batch because of time');
									}
									postEvent(eventsBatch);
									eventsBatch = [];
								}
								timer = null;
							}, config.batch.interval);
							if (logger.isDebugEnabled()) {
								logger.debug('timer created');
							}
						}
					}
				};
			}

			return postEvent;
		};

		var loggingServiceOptions = {
			logListener : createLogListener()
		};

		return require('runrightfast-logging-service')(loggingServiceOptions);
	};

}());
