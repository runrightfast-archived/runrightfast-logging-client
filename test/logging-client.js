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
			timeout : 1000
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

	it('log a valid event with timeout of 100 msec', function() {
		var loggingClient = require('..')({
			url : 'http://localhost:8000/log',
			timeout : 100
		});
		var event = {
			tags : [ 'info' ],
			data : 'test : log a valid event with timeout of 100 msec'
		};

		for ( var i = 0; i < 10; i++) {
			loggingClient.log(event);
		}
		expect(loggingClient.eventCount).to.equal(10);
		expect(loggingClient.invalidEventCount).to.equal(0);
	});

	it('log a valid event to an invalid URL', function(done) {
		var loggingClient = require('..')({
			url : 'http://localhost:8000/logXQZ',
			timeout : 10,
			retry : {
				initial : 1,
				multiplier : 2,
				max : 2
			},
			errorCallback : function() {
				done();
			}
		});
		var event = {
			tags : [ 'info' ],
			data : 'test : log a valid event to an invalid URL'
		};

		loggingClient.log(event);		
		expect(loggingClient.eventCount).to.equal(1);
		expect(loggingClient.invalidEventCount).to.equal(0);
	});

	it('log an invalid event', function() {
		var loggingClient = require('..')({
			url : 'http://localhost:8000/log'
		});
		var event = {
			data : 'test : log an invalid event'
		};

		loggingClient.log(event);
		expect(loggingClient.eventCount).to.equal(0);
		expect(loggingClient.invalidEventCount).to.equal(1);
	});

});