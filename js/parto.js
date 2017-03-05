var DEBUG = false,
	webpage = require('webpage'),
	page = webpage.create(),
	fs = require('fs'),
	system = require('system'),
	dateformat = require('./dateformat').dateformat,
	jsCookies = require('./cookieformat').jsCookies,
	globalJSessionID = null,
	common = require('./common.js'),
	getCredentials = common.getCredentials,
	waitFor = common.waitFor,
	createClickElementInDom = common.createClickElementInDom,
	processSequence = common.processSequence,
	credentials = {},
	store = {
		files: [],
		paths: []
	};

page.onConsoleMessage = function(msg, lineNum, sourceId) {
	if (DEBUG)
		console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};

page.onError = function(msg) {
	if (DEBUG)
		console.log('ERROR: ' + msg);
};

page.settings.loadImages = true;

var URL = "http://intranet.bagad-erguearmel.bzh/php/login.php";

processSequence([
	getCredentialsFromSystemKeychain,
	loadPage,
	fillLoginForm,
	validateForm,
	extractFolders,
	readCookie,
	exit
], 0);

function getCredentialsFromSystemKeychain(callback) {
	getCredentials("parto", function(login, password) {
		credentials.login = login;
		credentials.password = password;
		callback();
	});
}

function loadPage(callback) {
	page.open('http://intranet.bagad-erguearmel.bzh/php/login.php', function(status) {
		if (status !== "success") {
			console.log("Unable to access network");
		} else {
			waitFor(function() {
				return page.evaluate(function() {
					return document.getElementsByClassName("inb")[0] !== 'undefined';
				});
			}, function() {
				callback();
			});
		}
	});
}

function fillLoginForm(callback) {

	page.evaluate(function(login, pass) {
		document.getElementsByClassName("int")[0].value = login;
		document.getElementsByClassName("int")[1].value = pass;
	}, credentials.login, credentials.password);

	callback();

}

function validateForm(callback) {
	page.evaluate(function() {
		document.getElementsByTagName("form")[0].submit();
	});

	waitFor(
		function() {
			return page.evaluate(function() {
				return document.getElementsByTagName("h1").length > 0;
			});
		},
		function() {
			setTimeout(callback, 1000);
		}
	);
}

function extractFolders(callback) {
	var tree = [{ "name": "Porte Document", "href": "http://intranet.bagad-erguearmel.bzh/php/browser.php?dir=0&sort=0" }];
	extract(tree, "", function() {
		fs.write('tmp/files', store.files.join("\n"));
		fs.write('tmp/paths', store.paths.join("\n"));
		callback();
	});
}

function readCookie(callback) {

	var cookie = page.evaluate(function() {
		return document.cookie;
	});

	fs.write('tmp/cookie', cookie);
	callback();
}

function extract(tree, path, callback) {

	if (tree.length === 0) {
		callback();
	}

	store.paths.push(path);

	var object = tree.pop();

	//console.log(path, object.name, object.href);

	if (object.href.indexOf("file") > 0) {
		//console.log("FILE FOUND");
		// DO FILE EXTRACTION HERE
		store.files.push(path + object.name + "|" + object.href);
		// END OF FILE EXTRACTION
		extract(tree, path, callback);
	}


	//var page = webpage.create();
	page.open(object.href, function(status) {
		//console.log("\t" + status);
		if (status == "success") {

			var links = page.evaluate(function() {

				var subTree = [];
				var links = document.querySelectorAll("table:nth-of-type(2) td:nth-child(2)>a:first-child");

				for (var i = 0; i < links.length; i++) {
					if (i > 0) {
						subTree.push({ "name": links[i].innerText, "href": links[i].href });
					}
				}
				var json = JSON.stringify(subTree);
				//console.log(json);
				return json;
			});

			var subTree = [];
			try {
				subTree = JSON.parse(links);
			} catch (e) {
				console.log(e);
			}

			extract(subTree, path + object.name.trim() + "/", function() {
				extract(tree, path, callback);
			});
		}
	});

}

function exit() {

	if (page) {
		page.close();
	}
	setTimeout(function() {
		phantom.exit();
	}, 0);
	phantom.onError = function() {};
}
