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
var config = require('runrightfast-commons').config;

var credentials = {
	d74s3nz2873n : {
		key : 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
		algorithm : 'sha256'
	}
};

var getCredentials = function(id, callback) {

	return callback(null, credentials[id]);
};

module.exports = {
	pack : {},
	servers : [ {
		port : parseInt(config.param('RRF_PORT', '8080'), 10),
		options : {
			labels : [ 'api' ],
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
		'lout' : {
			endpoint : '/api/hapi/docs'
		},
		'furball' : {
			version : false,
			plugins : '/api/hapi/plugins'
		},
		'runrightfast-logging-server-proxy-hapi-plugin' : {
			proxy : {
				host : 'localhost',
				port : 8000
			}
		}
	}
};