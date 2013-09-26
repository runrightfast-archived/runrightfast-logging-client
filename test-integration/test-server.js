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
 * This is meant to be used with ./test-harness.js. This script will start up
 * HapiServer logging server, and then restart the serer every second. The
 * logging client (in test-harness.js) posts messages every 100 msec. The point
 * of this test is to show that no events are lost while the Hapi Server is down
 * between restarts.
 */

'use strict';

var manifest = {
	pack : {},
	servers : [ {
		port : 8000,
		options : {
			labels : [ 'api' ]
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

var HapiServer = require('runrightfast-hapi-server');

var options = {
	manifest : manifest,
	logLevel : 'INFO'
};

var hapiServer = new HapiServer(options);

function restart() {
	setTimeout(function() {
		hapiServer.stop();
		hapiServer = new HapiServer(options);
		setTimeout(restart, 100);
	}, 1000);
}

restart();
