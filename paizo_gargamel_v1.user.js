// paizo_gargamel_v1.user.js
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
// @name           paizo_gargamel_v1
// @namespace      http://pages.cs.wisc.edu/~meade/greasemonkey/
// @description    Replace smurf avatars with normal avatars
// @include        http://paizo.com/*
// @include        http://*paizo.com/*
// @include        https://paizo.com/*
// @include        https://*paizo.com/*
// ==/UserScript==

//---------------------------------------------------------------------------
// Google Chrome Compatability
//---------------------------------------------------------------------------
//var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

//---------------------------------------------------------------------------
// Global Variables
//---------------------------------------------------------------------------
var avatarLoading = {}
var avatarLoaded = {}
var avatarUrlMap = {}

//---------------------------------------------------------------------------
// Functions
//---------------------------------------------------------------------------

/**
 * Obtain the URL of the author's avatar picture from the provided HTML
 * text of the author's page.
 * @param authorHtml the full HTML of the author's page, where the real
 *                   avatar of the author can be located
 * @return String containing URL to the author's avatar, or null if no
 *         URL could be determined
 */
function filterAvatarImageUrl(authorHtml) {
    // find the table tag above the avatar
    var tableTagIndex = authorHtml.indexOf('<td align = "right" width = "90" valign = "middle">');

    if(tableTagIndex >= 0) {
        // find the indices of the img tag for the avatar
        var avatarImageTagIndex = authorHtml.indexOf('<img', tableTagIndex);
        var avatarImageTagCloseIndex = authorHtml.indexOf('/>', tableTagIndex);

        if(avatarImageTagIndex >= 0 && avatarImageTagCloseIndex >= 0) {
            // obtain the img tag
            var avatarImageTag = authorHtml.substr(avatarImageTagIndex, (avatarImageTagCloseIndex+2)-avatarImageTagIndex);

            // find the indices of the src attribute of the img tag
            var avatarUrlIndex = avatarImageTag.indexOf('src=');
            var avatarUrlCloseIndex = avatarImageTag.indexOf('"', avatarUrlIndex+5);

            if(avatarUrlIndex >= 0 && avatarUrlCloseIndex >= 0) {
                // obtain and return the avatar's url
                var avatarUrl = avatarImageTag.substr(avatarUrlIndex+5, (avatarUrlCloseIndex-1)-(avatarUrlIndex+4));

                return avatarUrl;
            }
        }
    }

    // unable to find avatar url ... bailing out
    return null;
}

/**
 * Load the real avatar for the provided element and URL to the author's page.
 * Makes an AJAX call to obtain the URL of the author's real avatar, and after
 * getting the response, calls a function to replace the smurf avatars.
 * @param thisPost the post responsible for triggering the avatar load
 * @param authorUrl the URL to the author's profile page
 */
function loadAvatar(thisPost, authorUrl) {
//    GM_log("loadAvatar: " + authorUrl);
    // since we're not loading it yet, load it up
    GM_xmlhttpRequest({
        method: "GET",
        url: authorUrl,
        onload: function(response) {
            //GM_log("Loaded " + authorUrl);
            // extract the author's real avatar image
            var realAvatar = filterAvatarImageUrl(response.responseText);
            // if we got a real response back
            if(realAvatar != null) {
                // add it to the cache
                avatarUrlMap[authorUrl] = realAvatar;
                // indicate that it has been loaded
                avatarLoaded[authorUrl] = true;
            	replaceAvatar(thisPost, authorUrl);
            } else {
//                GM_log("Unable to load avatarUrl for: " + authorUrl);
//                GM_log("response.responseText: " + response.responseText);
            }
        }
    });
}

/**
 * Replace smurf avatars with a real avatar.
 * @param avatarElement the post responsible for triggering the avatar load
 * @param authorUrl the URL to the author's profile page
 */
function replaceAvatar(avatarElement, authorUrl) {
//    GM_log("replaceAvatar: " + authorUrl);
    // reload all the posts from the document
    var replacePosts = document.evaluate(
        "//a[@class='avatar-link' and @itemprop='url']",
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null);

//    GM_log("Gargamel - replacePosts.snapshotLength: " + replacePosts.snapshotLength);

    // for each post we found
    for(i=0; i<replacePosts.snapshotLength; i++) {
        var replacePost = replacePosts.snapshotItem(i);
        var postAuthorUrl = replacePost.getAttribute("href");

        // if the avatar-link contains the word smurf
        if(replacePost.innerHTML.toLowerCase().indexOf("smurf") >= 0) {
            // and it's the same author
            if(postAuthorUrl == authorUrl) {
                // replace the smurf avatar with the real avatar
                replacePost.innerHTML = '<img border="0" width="90" height="90" alt="Gargamel" src="' + avatarUrlMap[authorUrl] + '" />';
            }
        } else {
//            GM_log("smurf not found!");
        }
    }
}

//---------------------------------------------------------------------------
// Lights, Camera, Action!
//---------------------------------------------------------------------------

// find all of the avatar link/images
var allPosts = document.evaluate(
    "//a[@class='avatar-link' and @itemprop='url']",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null);
//GM_log("Gargamel -- allPosts.snapshotLength: " + allPosts.snapshotLength);

// if any of them are smurfs, load the real avatar
for(i=0; i<allPosts.snapshotLength; i++) {
    var thisPost = allPosts.snapshotItem(i);
//    GM_log("href: " + thisPost.getAttribute("href") + "  innerHTML: " + thisPost.innerHTML);
    var authorUrl = thisPost.getAttribute("href");
    var innerHtml = thisPost.innerHTML;

//    GM_log("href: " + authorUrl);

    // if the avatar-link contains the word smurf
    if(innerHtml.toLowerCase().indexOf("smurf") >= 0) {
        if(!avatarLoading[authorUrl]) {
            avatarLoading[authorUrl] = true;
            loadAvatar(thisPost, authorUrl);
        }
    } else {
//        GM_log("innerHTML: " + innerHtml);
    }
}

// end of script

