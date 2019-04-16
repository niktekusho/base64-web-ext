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

async function getActiveTab() {
	// Get the current tab
	const activeTab = await browser.tabs.query({
		active: true,
		currentWindow: true
	});

	return activeTab[0];
}

class Message {
	constructor(type, title, translation) {
		this.type = type;
		this.title = title;
		this.translation = translation;
	}
}

function decode(src) {
	if (src == null) {
		return;
	}

	const transformedSrc = src.trim();
	console.log(`${extensionLogFormat} Transformed text is: ${transformedSrc}`);

	if (src.length === 0) {
		return;
	}

	try {
		const decoded = window.atob(transformedSrc);
		console.log(`${extensionLogFormat} Decoded text is: ${decoded}`);
		return new Message('decode', 'Decoded', decoded);
	} catch (error) {
		console.error(`${extensionLogFormat} ${error}`);
	}
}

function encode(src) {
	if (src == null) {
		return;
	}

	const transformedSrc = src.trim();
	console.log(`${extensionLogFormat} Transformed text is: ${transformedSrc}`);

	if (src.length === 0) {
		return;
	}

	try {
		const encoded = window.btoa(transformedSrc);
		console.log(`${extensionLogFormat} Encoded text is: ${encoded}`);
		return new Message('encode', 'Encoded', encoded);
	} catch (error) {
		console.error(`${extensionLogFormat} ${error}`);
	}
}

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
