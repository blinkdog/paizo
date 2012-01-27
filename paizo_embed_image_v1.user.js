// paizo_image_embed_v1.user.js
// Copyright 2011 Patrick Meade

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// ==UserScript==
// @name           paizo_image_embed_v1
// @namespace      http://pages.cs.wisc.edu/~meade/greasemonkey/
// @description    Embed images and videos in messageboard posts
// @include        http://paizo.com/*
// @include        http://*.paizo.com/*
// @include        https://paizo.com/*
// @include        https://*.paizo.com/*
// ==/UserScript==

//---------------------------------------------------------------------------
// Functions
//---------------------------------------------------------------------------

function convertYoutubeLinkToEmbed(href) {
    var newHref = "http://www.youtube.com/embed/";
    var index = href.indexOf("v=");
    newHref = newHref + href.substr(index+2);
    return newHref;
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function startsWith(str, prefix) {
    return str.lastIndexOf(prefix, 0) === 0
}

//---------------------------------------------------------------------------
// Lights, Camera, Action!
//---------------------------------------------------------------------------

// obtain all the open-in-a-new-window links on the page
var allPosts = document.evaluate(
    "//a[@target='_blank']",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null);
//GM_log("allPosts.snapshotLength: " + allPosts.snapshotLength);

// based on what we are linking to, convert the inner HTML to embed the
// thing directly in the page
for(var i=0; i<allPosts.snapshotLength; i++)
{
    var thisPost = allPosts.snapshotItem(i);
    var href = thisPost.getAttribute("href");

//    GM_log("[" + i + "]: href = " + thisPost.getAttribute("href"));
//    GM_log("[" + i + "]: innerHTML = " + thisPost.innerHTML);

    // if it's a YouTube link, embed the video in an <iframe> tag
    if(startsWith(href, "http://www.youtube.com/")) {
        var newHtml = '<iframe width="420" height="315" src="';
        newHtml = newHtml + convertYoutubeLinkToEmbed(href);
        newHtml = newHtml + '" frameborder="0" allowfullscreen></iframe>';
        thisPost.innerHTML = newHtml;
    }

    // if it's an image, embed the image in an <img> tag
    if(   endsWith(href, ".bmp")
       || endsWith(href, ".gif")
       || endsWith(href, ".jpg")
       || endsWith(href, ".jpeg")
       || endsWith(href, ".png"))
    {
        var newHtml = '<img src="';
        newHtml = newHtml + href;
        newHtml = newHtml + '"/>';
        thisPost.innerHTML = newHtml;
    }

//    GM_log("[" + i + "]: href = " + thisPost.getAttribute("href"));
//    GM_log("[" + i + "]: innerHTML = " + thisPost.innerHTML);
}

// end of script

