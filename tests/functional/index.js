define(function (require) {
	var registerSuite = require('intern!object');
	var assert = require('intern/chai!assert');

	registerSuite({
		name: 'index',

		'greeting form': function () {
			return this.remote
				.get(require.toUrl('index.html'))
				.setFindTimeout(5000)
				.findByCssSelector('body.loaded')
				.findById('about-link')
					.click()
					.end()
				.findById('about-header')
				.getVisibleText()
				.then(function (text) {
					assert.strictEqual(text, 'Frameworks!',
						'The title Frameworks should be displayed');
				});
		}
	});
});