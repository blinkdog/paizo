// paizo_pbp_stats_v1.user.js
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
// @name           paizo_pbp_stats_v1
// @namespace      http://pages.cs.wisc.edu/~meade/greasemonkey/
// @description    Add character stat popup to Paizo Play-By-Post messageboards
// @include        http://paizo.com/campaigns/*
// ==/UserScript==

//---------------------------------------------------------------------------
// Google Chrome Compatability
//---------------------------------------------------------------------------
var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

//---------------------------------------------------------------------------
// Global Variables
//---------------------------------------------------------------------------
var popupContentMap = {}

var posterMap = {}

//---------------------------------------------------------------------------
// Functions
//---------------------------------------------------------------------------

/**
 * Accept a DOM element if it is the element with post author information
 * @param element the DOM element to check
 * @return true if this element contains author information, false otherwise
 */
function acceptAuthor(element) {
    if(element == null) {
        return false;
    }
    if(element.nodeName != "A") {
        return false;
    }
    if(element.getAttribute("itemprop") != "url") {
        return false;
    }
    if(element.getAttribute("href") == null) {
        return false;
    }
    if(element.getAttribute("href").indexOf("/people") != 0) {
        return false;
    }
    return true;
}

/**
 * Add the event listeners (mouseover, mouseout) necessary to create
 * popup behavior.
 * @param authorElement the element to which the listeners should be added
 */
function addPopupEventListeners(authorElement) {
//    GM_log("adding event handlers");
    authorElement.addEventListener("mouseover", showPopup, true);
    authorElement.addEventListener("mouseout", hidePopup, true);
}

/**
 * Perform a "breadth first search" (not really) starting with the provided
 * element using the provided accept function to know when to terminate the
 * search.
 *
 * This function could probably be rewritten to use a "true" breadth first
 * search and gain a little performance. But for now, it works well enough.
 *
 * @param element DOM element where the search is to begin
 * @param acceptFunction Function that will accept/reject a DOM element
 *                       (i.e.: search criteria function)
 * @return DOM element that was accepted, or null if no element matched
 */
function breadthFirstSearch(element, acceptFunction) {
    var myChildren = element.childNodes;
    for(var z=0; z<myChildren.length; z++) {
        var myChild = myChildren[z];
        if(acceptFunction(myChild)) {
            return myChild;
        }
    }
    for(var y=0; y<myChildren.length; y++) {
        var myChild = myChildren[y];
        var childValue = breadthFirstSearch(myChild, acceptFunction);
        if(childValue != null) {
            return childValue;
        }
    }
    return null;
}

/**
 * Create a DIV element to hold the popup information with an id based upon
 * the URL to the author's page. Append the newly create DIV to the page.
 * @param authorUrl the URL to the post's author's page
 */
function createPopupDiv(authorUrl) {
    var newDiv = document.createElement('div');
    var divId = getPopupDivId(authorUrl);
//    GM_log("creating popup div with id = " + divId);
    newDiv.setAttribute("id", divId);
    // hide the popup DIVs until we are ready to display them
    newDiv.setAttribute("class", "pbpPopupHide");
    document.body.appendChild(newDiv);
}

/**
 * Given the content of an author page, extract everything between the first
 * set of {popup}{/popup} tags encountered on that page.
 * @param content the HTML content of the author's page
 */
function filterPopupContent(content) {
    var popupOpen = content.indexOf("{popup}");
    var popupClose = content.indexOf("{/popup}");
//    GM_log("open: " + popupOpen + "  close: " + popupClose);
    if(popupOpen >= 0)
    if(popupClose >= 0)
        return content.substr(popupOpen+7, popupClose-(popupOpen+7));
    return "";
}

/**
 * Obtain the (top,left) position of the provided DOM element.
 * @param el DOM element for which to determine a position
 * @return map containing keys "top" and "left" with calculated positions
 * @see http://stackoverflow.com/questions/442404/dynamically-retrieve-html-element-x-y-position-with-javascript
 */
function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    // CHROME: need to add scroll offset
    if(is_chrome) {
        _x += self.pageXOffset;
        _y += self.pageYOffset;
    }

    return { top: _y, left: _x };
}

/**
 * Obtain the id attribute of the DIV element corresponding to the popup for
 * the author identified by the provided URL.
 * @param authorUrl the URL to the post's author's page
 */
function getPopupDivId(authorUrl) {
    return "popup" + authorUrl.substr(8);
}

/**
 * Hide the popup associated with the element that generated a call to
 * this function. (OnMouseOut event handler)
 */
function hidePopup(event) {
    // obtain the popup to be hidden
    var aTarget = event.currentTarget;
    var authorUrl = aTarget.getAttribute("href");
    var popupId = getPopupDivId(authorUrl);
    var popupElement = document.getElementById(popupId);
    // hide it!
    popupElement.setAttribute("class", "pbpPopupHide");
    popupElement.style.left = 0 + "px";
    popupElement.style.top = 0 + "px";
}

/**
 * Use an AJAX request to the load the author page. After doing so, obtain
 * the content between the {popup}{/popup} tags and place it into the element
 * whose id is provided.
 * @param popupId the id attribute of the element to be loaded with content
 * @param contentUrl the URL to the post's author's page, for popup content
 */
function loadPopupContent(popupId, contentUrl) {
    // if we already have the popup content
    if(popupContentMap[contentUrl]) {
        // populate the element from our cache
        var popupElement = document.getElementById(popupId);
        popupElement.innerHTML = popupContent;
        return;
    }
    // otherwise, we need to load it
//    GM_log("Loading popup content from " + contentUrl);
    GM_xmlhttpRequest({
        method: "GET",
        url: contentUrl,
        onload: function(response) {
            var popupContent = filterPopupContent(response.responseText);
            var popupElement = document.getElementById(popupId);
            popupContentMap[contentUrl] = popupContent;
            popupElement.innerHTML = popupContent;
        }
    });
}

/**
 * Show the popup associated with the element that generated a call to
 * this function. (OnMouseOver event handler)
 */
function showPopup(event) {
    // obtain the popup to be shown
    var aTarget = event.currentTarget;
    var authorUrl = aTarget.getAttribute("href");
    var popupId = getPopupDivId(authorUrl);
    var popupElement = document.getElementById(popupId);
    // calculate where the popup should be shown
    var imgTarget = event.target;
    var xLeft = parseInt(getOffset(imgTarget).left);
    var xWidth = parseInt(imgTarget.getAttribute("width"));
    var xTop = parseInt(getOffset(imgTarget).top);
    var popupLeft = xLeft + xWidth + 8;
    var popupTop = xTop + 4;
    // show it!
    popupElement.style.left = popupLeft + "px";
    popupElement.style.top = popupTop + "px";
    popupElement.setAttribute("class", "pbpPopupShow");
}

//---------------------------------------------------------------------------
// Lights, Camera, Action!
//---------------------------------------------------------------------------

// CSS style for hiding a popup from view
GM_addStyle(".pbpPopupHide { display: none; }");
// CSS style for showing a popup
GM_addStyle(".pbpPopupShow { display: block; background-color: white; padding: 8px; z-index: 10000; position: absolute; border-width: 1px; border-color: grey; border-style: dashed; }");

// find all of the post headers
var allPosts = document.evaluate(
    "//div[@class='messageboard' and @itemprop='commentText']",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null);
//GM_log("allPosts.snapshotLength: " + allPosts.snapshotLength);
// assign css classes to the tr tags that make up those posts
// the classes contain the username of the person posting them
for(i=0; i<allPosts.snapshotLength; i++) {
    var thisPost = allPosts.snapshotItem(i);
    var authorElement = breadthFirstSearch(thisPost, acceptAuthor);

    // if we find the element indicating the author of the post
    if(authorElement) {
        // obtain the URL of the author page
        var authorUrl = authorElement.getAttribute("href");
        // if we haven't added them to the map yet
        if(!posterMap[authorUrl]) {
            // add the author to the map
            posterMap[authorUrl] = authorElement;
            // create a div for the author
            createPopupDiv(authorUrl);
            // load content into the div
            loadPopupContent(getPopupDivId(authorUrl), authorUrl);
        }

        // add popup handlers
        addPopupEventListeners(authorElement);
    }
}

// end of script

