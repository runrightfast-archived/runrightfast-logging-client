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
 * The purpose of this test harness is to verify that the REST client is robust
 * enough to recover and retry HTTP requests when the server is not available.
 * 
 * To test this perform the following steps:
 * 
 * <pre>
 * 1. start this script with node from this project's base dir :  node ./test-integration/test-harness.js 
 * 2. start up the runrightfast-logging-server (which logs events to the console) in a separate window
 * 3. start up the runrightfast-api-gateway-server - which is configured to route to the runrightfast-logging-server and is enforcing Hawk auth
 * 4. restart the runrightfast-logging-server while the test-harness is running and watch the server console window - no event messages should be dropped
 * 		- the client console logs the counter for the logged events, which is part of the event data
 * </pre>
 * 
 * *** ./start-server.js peforms steps 2-4 listed above - start it with node in
 * a separate window to observe server side logging
 * 
 */

'use strict';

var config = require('runrightfast-commons').config;

// runrightfast-api-gateway-server should be listening on the same port
var port = parseInt(config.param('RRF_PORT', '8080'), 10);

var loggingClient = require('..')({
	url : 'http://localhost:' + port + '/api/runrightfast-logging-service/log',
	logLevel : 'WARN',
	auth : {
		hawk : {
			credentials : {
				"id" : "026700eff9054a30b1d732862e852e37",
				"key" : "685f3b2044164fc0a7cfa9169205908e",
				"algorithm" : "sha256"
			}
		},
		logLevel : 'WARN'
	}
});

var counter = 0;

function logEvent() {
	setTimeout(function() {
		counter++;
		var event = {
			tags : [ 'info' ],
			data : 'test-harness message # ' + counter,
			batch : false
		};

		loggingClient.log(event);
		logEvent();
		console.log(counter + ': loggingClient.eventCount = ' + loggingClient.eventCount);
	}, 100);
}

logEvent();
