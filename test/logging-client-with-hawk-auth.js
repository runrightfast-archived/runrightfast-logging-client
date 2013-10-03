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

'use strict';
var expect = require('chai').expect;

var Hawk = require('hawk');

var credentials = {
	d74s3nz2873n : {
		key : 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
		algorithm : 'sha256'
	}
};

var getCredentials = function(id, callback) {

	return callback(null, credentials[id]);
};

function startServer(callback) {
	var Hapi = require('hapi');

	var manifest = {
		pack : {},
		servers : [ {
			port : 8000,
			options : {
				labels : [ 'web' ],
				auth : {
					hawk : {
						scheme : 'hawk',
						defaultMode : true,
						getCredentialsFunc : getCredentials
					}
				}
			}
		} ],
		plugins : {
			'lout' : {},
			'furball' : {},
			'runrightfast-logging-service-hapi-plugin' : {
				logRoutePath : '/api/runrightfast-logging-service/log'
			}
		}
	};

	var composer = new Hapi.Composer(manifest);

	composer.compose(function(err) {
		if (err) {
			console.error('Failed composing servers : ' + err.message);
			callback(err);
		} else {
			console.log('Hapi is composed.');
			composer.start(function() {
				console.log('All servers started');
				callback();
			});
		}
	});

	return composer;
}

describe('LoggingClient with Hawk Auth', function() {
	var composer = null;

	beforeEach(function(done) {
		composer = startServer(done);
	});

	afterEach(function(done) {
		composer.stop({
			timeout : 1000
		}, function() {
			console.log('All servers stopped');
			Hawk.sntp.stop();
			done();
		});
	});

	it('log a valid event using Hawk Auth', function() {
		var loggingClient = require('..')({
			baseUrl : 'http://localhost:8000',
			logLevel : 'DEBUG',
			auth : {
				hawk : {
					credentials : {
						id : 'd74s3nz2873n',
						key : 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
						algorithm : 'sha256'
					}
				},
				logLevel : 'DEBUG',
				sntp : true
			}
		});
		var event = {
			tags : [ 'info' ],
			data : 'test : log a valid event'
		};

		loggingClient.log(event);
		expect(loggingClient.eventCount).to.equal(1);
		expect(loggingClient.invalidEventCount).to.equal(0);
	});

});