// paizo_textarea_font.user.js
// Copyright 2014 Patrick Meade. All rights reserved.
//---------------------------------------------------------------------------

// ==UserScript==
// @name           paizo_textarea_font
// @version        1
// @updateURL      http://pages.cs.wisc.edu/~meade/greasemonkey/paizo_textarea_font.user.js
// @namespace      http://pages.cs.wisc.edu/~meade/greasemonkey/
// @description    Increase the font size of the textarea used to respond to posts
// @match          http://paizo.com/*
// @match          http://*.paizo.com/*
// @match          https://paizo.com/*
// @match          https://*.paizo.com/*
// @grant          GM_addStyle
// ==/UserScript==

GM_addStyle("#postBody { font-size: 14px; }");

//---------------------------------------------------------------------------
// end of paizo_textarea_font.user.js

