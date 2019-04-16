'use strict';

browser.runtime.onMessage.addListener(eventHandler);

function eventHandler(msg) {
	const selection = document.getSelection();
	// console.log(msg);
	const title = msg.title;
	const translation = msg.translation;
	// console.log(selection, translation);
	// if (selection.anchorNode) {
	// 	console.log(selection.anchorNode);

	// } else {
	// 	alert(msg.decoded);
	// }

	const containerClass = 'base64-popup';

	const popup = document.querySelector(`.${containerClass}`);
	if (popup == null) {
		createPopupMarkup(containerClass);
	}

	const popupTitle = document.querySelector(`.${containerClass}-title`);
	popupTitle.textContent = title;

	const popupContent = document.querySelector(`.${containerClass}-content`);
	popupContent.textContent = translation;

	const copyBtn =  document.querySelector(`.${containerClass}-copy-btn`);
	copyBtn.addEventListener('click', () => {
		copyToClipboard(translation);
	});
}

function createPopupMarkup(containerClass) {
	// Overall popup markup
	const container = document.createElement('div');
	container.className = containerClass;

	// Popup title container
	const titleContainer = document.createElement('div');
	titleContainer.className = `${containerClass}-title-container`;
	container.appendChild(titleContainer);

	// Popup title ("decoded"/"encoded")
	const title = document.createElement('span');
	title.className = `${containerClass}-title`;
	titleContainer.appendChild(title);

	// Close popup
	const close = document.createElement('span');
	close.className = `${containerClass}-close`;
	close.innerHTML = '&times;';
	titleContainer.appendChild(close);
	close.addEventListener('click', () => container.remove());

	const contentContainer = document.createElement('div');
	contentContainer.className = `${containerClass}-content-container`;
	container.appendChild(contentContainer);

	// Popup content
	const content = document.createElement('p');
	content.className = `${containerClass}-content`;
	contentContainer.appendChild(content);

	// Toolbar
	const toolbar = document.createElement('div');
	toolbar.className = `${containerClass}-toolbar`;
	contentContainer.appendChild(toolbar);

	// Copy button
	const copyBtn = document.createElement('button');
	copyBtn.className = `${containerClass}-btn ${containerClass}-copy-btn`;
	copyBtn.textContent = 'Copy';
	toolbar.appendChild(copyBtn);

	document.body.appendChild(container);
}

/* From: https://gist.github.com/Chalarangelo/4ff1e8c0ec03d9294628efbae49216db#file-copytoclipboard-js */
const copyToClipboard = str => {
	const el = document.createElement('textarea');  // Create a <textarea> element
	el.value = str;                                 // Set its value to the string that you want copied
	el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
	el.style.position = 'absolute';
	el.style.left = '-9999px';                      // Move outside the screen to make it invisible
	document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
	const selected =
	  document.getSelection().rangeCount > 0        // Check if there is any content selected previously
		? document.getSelection().getRangeAt(0)     // Store selection if found
		: false;                                    // Mark as false to know no selection existed before
	el.select();                                    // Select the <textarea> content
	document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
	document.body.removeChild(el);                  // Remove the <textarea> element
	if (selected) {                                 // If a selection existed before copying
	  document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
	  document.getSelection().addRange(selected);   // Restore the original selection
	}
  };
