"use strict";

// Root context menu
browser.contextMenus.create({
	id: "ext-root-menu",
	title: browser.runtime.getManifest().name,
	contexts: ["selection"]
});

browser.contextMenus.create({
	id: "decode-menu",
	parentId: "ext-root-menu",
	title: browser.i18n.getMessage("decodeMenu"),
	contexts: ["selection"]
});

browser.contextMenus.create({
	id: "encode-menu",
	parentId: "ext-root-menu",
	title: browser.i18n.getMessage("encodeMenu"),
	contexts: ["selection"]
});

const extensionLogFormat = `[${browser.runtime.getManifest().name}] >`;

/**
 * @returns {Promise<Tab>} Active tab in the current window
 */
async function getActiveTab() {
	// Get the current tab
	const activeTab = await browser.tabs.query({
		active: true,
		currentWindow: true
	});

	return activeTab[0];
}

/**
 * Factory for message objects
 */
class Message {
	/**
	 *
	 * @param {string} type Type of the message
	 * @param {string} title Title of the message (most likely shown to the user)
	 * @param {string} content Content of the message (could be shown to the user)
	 */
	constructor(type, title, content) {
		this.type = type;
		this.title = title;
		this.content = content;
	}
}

/**
 * Factory for error message objects
 */
class ErrorMessage extends Message {
	/**
	 *
	 * @param {string} message Content of the message
	 */
	constructor(message) {
		super('error', 'Error', message);
	}
}

/**
 * Try to decode the specified base64-encoded string.
 *
 * @param {string} src base64-encoded string
 * @returns {Message|ErrorMessage} message object
 */
function decode(src) {
	if (src == null) {
		return new ErrorMessage('No content to decode!');
	}

	const transformedSrc = src.trim();
	console.log(`${extensionLogFormat} Transformed text is: ${transformedSrc}`);

	if (src.length === 0) {
		return new ErrorMessage('No content to decode!');
	}

	try {
		const decoded = window.atob(transformedSrc);
		console.log(`${extensionLogFormat} Decoded text is: ${decoded}`);
		return new Message('decode', 'Decoded', decoded);
	} catch (error) {
		console.error(`${extensionLogFormat} ${error}`);
		return new ErrorMessage('Could not decode the selected text. Most likely the selected text is not a valid base64-encoded string.');
	}
}

/**
 * Try to encode the specified string to base64
 *
 * @param {string} src string to encode
 * @returns {Message|ErrorMessage} message object
 */
function encode(src) {
	if (src == null) {
		return new ErrorMessage('No content to encode!');
	}

	const transformedSrc = src.trim();
	console.log(`${extensionLogFormat} Transformed text is: ${transformedSrc}`);

	if (src.length === 0) {
		return new ErrorMessage('No content to encode!');
	}

	try {
		const encoded = window.btoa(transformedSrc);
		console.log(`${extensionLogFormat} Encoded text is: ${encoded}`);
		return new Message('encode', 'Encoded', encoded);
	} catch (error) {
		console.error(`${extensionLogFormat} ${error}`);
		// TODO: fact check!
		return new ErrorMessage('Could not encode the selected text. Most likely the selected text contains special characters that can not be encoded in base64.');
	}
}

/**
 * Cache tabs in which the user uses the extension
 */
const tabsRegistry = {};

browser.contextMenus.onClicked.addListener(async (info, tab) => {
	const { menuItemId, selectionText } = info;
	console.log(`${extensionLogFormat} ${JSON.stringify(info)}`);
	console.log(`${extensionLogFormat} Selected text is: ${selectionText}`);
	const activeTab = await getActiveTab();

	// lazy init script injection
	if (tabsRegistry[activeTab.id] == null) {
		try {
			// Wait for the script to be loaded and injected in the current tab
			await browser.tabs.executeScript(activeTab.id, { file: "/browser-polyfill.js" });
			await browser.tabs.executeScript(activeTab.id, {
				file: '/popup.js'
			});
			// Inject custom css
			await browser.tabs.insertCSS(activeTab.id, { file: "/popup.css" });
			tabsRegistry[activeTab.id] = true;
		} catch (error) {
			console.error(`${extensionLogFormat} Script injection error. ${error}`);
		}
	}

	console.log(`${extensionLogFormat} ${JSON.stringify(activeTab)}`);

	let msg = null;
	if (menuItemId === "decode-menu") {
		msg = decode(selectionText);
	} else {
		msg = encode(selectionText);
	}
	if (msg) {
		try {
			await browser.tabs.sendMessage(activeTab.id, msg);
		} catch (error) {
			console.error(`${extensionLogFormat} ${error}`);
		}
	}
});
