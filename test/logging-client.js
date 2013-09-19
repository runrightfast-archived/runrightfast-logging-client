'use strict';
var expect = require('chai').expect;

function startServer(callback) {
	var Hapi = require('hapi');

	var manifest = {
		pack : {},
		servers : [ {
			port : 8000,
			options : {
				labels : [ 'web' ]
			}
		} ],
		plugins : {
			'lout' : {},
			'furball' : {},
			'runrightfast-logging-service-hapi-plugin' : {}
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

describe('LoggingClient', function() {
	var composer = null;

	before(function(done) {
		composer = startServer(done);
	});

	after(function(done) {
		composer.stop({
			timeout : 1 * 1000
		}, function() {
			console.log('All servers stopped');
			done();
		});
	});

	it('log a valid event', function() {
		var loggingClient = require('..')({
			url : 'http://localhost:8000/log'
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