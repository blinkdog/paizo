// paizo_ignore_v4.user.js
// Copyright 2010-2012 Patrick Meade

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
// @name           paizo_ignore_v4
// @namespace      http://pages.cs.wisc.edu/~meade/greasemonkey/
// @description    Ignore posters on Paizo's messageboards
// @include        http://paizo.com/*
// @include        http://*.paizo.com/*
// @include        https://paizo.com/*
// @include        https://*.paizo.com/*
// ==/UserScript==

//---------------------------------------------------------------------------
// Google Chrome Compatability
//---------------------------------------------------------------------------
var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

/**
 * Obtain a value previously stored under a key.
 * @param key Name of the value to be retrieved
 * @param defaultValue Value to be returned if no value is stored under the
 *                     provided key (name)
 * @return value (if stored), or defaultValue (if nothing is already stored)
 */
function PM_getValue(key, defaultValue)
{
    // if we detected Google Chrome, use the HTML5 storage
    if(is_chrome) {
        var storageKey = "GM_" + key;
        if(localStorage[storageKey])
            return localStorage.getItem(storageKey);
        return defaultValue;
    }
    // since we didn't detect Chrome, fall back to Greasemonkey
    return GM_getValue(key, defaultValue);
}

/**
 * Store a value under a key (name).
 * @param key Name to store the value under, for later retrieval 
 * @param value Value to be stored
 */
function PM_setValue(key, value)
{
    // if we detected Google Chrome, use the HTML5 storage
    if(is_chrome) {
        var storageKey = "GM_" + key;
	    return localStorage.setItem(storageKey, value);
    }
    // since we didn't detect Chrome, fall back to Greasemonkey
    return GM_setValue(key, value);
}

//---------------------------------------------------------------------------
// Debug
//---------------------------------------------------------------------------

// if we don't yet have an ignore list
if(typeof PM_getValue("ignoreList") == "undefined") {
    // create an empty ignore list
    PM_setValue("ignoreList", "");
}

//GM_log("is_chrome: " + is_chrome);
//GM_log("paizo_ignore_v3 list: " + PM_getValue("ignoreList", "<none defined>"));

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
 * Accept a DOM element if it is the header element of author information
 * @param element the DOM element to check
 * @return true if this element is an author header, false otherwise
 */
function acceptAuthorHeader(element) {
    if(element == null) {
        return false;
    }
    if(element.nodeName != "TABLE") {
        return false;
    }
    if(element.getAttribute("class") != "postHeader") {
        return false;
    }
    return true;
}

/**
 * Accept a DOM element if it is the messageboard prompt (i.e.: the line
 * of text that reads "Flag | List | Reply" on the right-hand side of
 * the post.
 * @param element the DOM element to check
 * @return true if this element is the messageboard prompt, false otherwise
 */
function acceptMessageboardPrompt(element) {
    if(element == null) {
        return false;
    }
    if(element.nodeName != "TD") {
        return false;
    }
    if(element.getAttribute("class") == null) {
        return false;
    }
    if(element.getAttribute("class").indexOf("messageboardPrompt") == -1) {
        return false;
    }
    return true;
}

/**
 * Add someone to the Ignore list. Due to limitations on event handlers
 * and Greasemonkey, the method is a little bit convoluted. Previously
 * the link has been annotated with an 'id' attribute containing the
 * name of the scoundrel to be ignored. In this method, we are being passed
 * the user's click event, we use that to obtain the link that generated
 * the event (i.e.: the word "Ignore" they clicked on), and from that
 * we are able to obtain the 'id' attribute, and thus the name of the
 * person to put on the list.
 * @param event Event generated by the user clicking "Ignore"
 */
function addIgnore(event) {
    event.preventDefault();
    var srcId = event.target.getAttribute("id");
    var authorName = srcId.substr(11);
    addToIgnoreList(authorName);
}

/**
 * Add a link with the text "Ignore" to the provided messageboard prompt
 * element. Due to limitations with Greasemonkey and event handlers, we
 * encode the name in the attribute 'id' and later retrieve it in the
 * event handling code when the user clicks.
 * @param messageboardPrompt DOM element to which the Ignore link is added
 * @param authorName the name of the poster to be ignored
 */
function addIgnoreLink(messageboardPrompt, authorName) {
    var linkId = generateId(10) + "_" + authorName;
    //var ignorePrompt = '<a ';
    var ignorePrompt = '\n|\n<a ';
    ignorePrompt = ignorePrompt + 'target="_self" ';
    ignorePrompt = ignorePrompt + 'title="Ignore this user" ';
    ignorePrompt = ignorePrompt + 'id="';
    ignorePrompt = ignorePrompt + linkId;
    ignorePrompt = ignorePrompt + '" href="#">';
    ignorePrompt = ignorePrompt + 'Ignore'
    //ignorePrompt = ignorePrompt + '</a>\n|';
    ignorePrompt = ignorePrompt + '</a>';

    //messageboardPrompt.innerHTML = ignorePrompt + messageboardPrompt.innerHTML;
    messageboardPrompt.innerHTML = messageboardPrompt.innerHTML + ignorePrompt;

    var elmLink = document.getElementById(linkId);
    elmLink.addEventListener("click", addIgnore, true);
}

/**
 * Create notice links (if you stop ignoring someone, you "notice" them
 * again) in the provided DOM element with the provided array of names.
 * Due to limitations with event handlers and Greasemonkey, the links are
 * generated with an 'id' attribute that encodes the name of the person
 * that we are to notice. The event handling code then parses this id in
 * order to remove the person from the ignore list.
 * @param element DOM div element in which the notice links are created
 * @param noticeArray Array of names for which to create links
 */
function addNoticeLinks(element, noticeArray) {
    // generate and save all the element IDs in advance
    var linkIdArray = new Array();
    for(i=0; i<noticeArray.length; i++) {
        linkIdArray[i] = generateId(10) + "_" + noticeArray[i];
    }
    // generate and identify all of the notice links
    var noticeHtml = "<div class='ignoredList'>Ignored: ";
    for(i=0; i<ignoreArray.length; i++) {
        noticeHtml += '\n<a title="Stop ignoring this user" target="_self" id="';
        noticeHtml += linkIdArray[i];
        noticeHtml += '" href="#">';
        noticeHtml += noticeArray[i];
        noticeHtml += '</a>\n|';
    }
    noticeHtml += "</div>";
    element.innerHTML = noticeHtml;
    // add event handlers to the notice links
    for(i=0; i<ignoreArray.length; i++) {
        var elmLink = document.getElementById(linkIdArray[i]);
        elmLink.addEventListener("click", removeIgnore, true);
    }
}

/**
 * Add the provided name to the ignore list.
 * @param ignoreMe Name of the poster to be added to the ignore list
 */
function addToIgnoreList(ignoreMe) {
    // obtain the ignore list
    var localIgnoreList = PM_getValue("ignoreList", "");
    var localIgnoreArray = localIgnoreList.split(";");
    var onTheList = false;
    for(i=0; i<localIgnoreArray.length; i++)
    {
        if(localIgnoreArray[i] == ignoreMe) {
            onTheList = true;
            break;
        }
    }
    if(onTheList == false) {
        localIgnoreList = localIgnoreList + ";"
        localIgnoreList = localIgnoreList + ignoreMe
    }
    PM_setValue("ignoreList", localIgnoreList);
    sortIgnoreList();
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
 * Remove/delete the contents of the provided DOM element.
 * @param expungeElement DOM element to be expunged (contents erased)
 */
function expunge(expungeElement) {
    // buh bye...
    expungeElement.innerHTML = '';
}

/**
 * Generate a random identifier code. Used to ensure that the ignore
 * and notice links go to the correct event handlers.
 * @param idLen length of the random identifier code to be generated
 * @return String containing random identifier code of the requested length
 */
function generateId(idLen)
{
    var VALID_CHAR = "abcdefghijklmnopqrstuvwxyz0123456789";
    var li=0;
    var genId = "";
    for(li=0; li<idLen; li++) {
        genId += VALID_CHAR.charAt(rand(0, VALID_CHAR.length));
    }
    return genId;
}

/**
 * Obtain the name of the author of the post
 * @param authorElement DOM element containing author information
 * @return String containing the name of the post author
 */
function getAuthor(authorElement) {
    if(authorElement == null)
        return null;
    if(authorElement.getAttribute("title") == null)
        return null;
    var authorTitle = authorElement.getAttribute("title");
    if(authorTitle.indexOf("Alias of ") != -1) {
        authorTitle = authorTitle.substring(9);
    }
    if(authorTitle.indexOf(" aka ") != -1) {
        authorTitle = authorTitle.substring(0, authorTitle.indexOf(" aka "));
    }
    return authorTitle;
}

/**
 * Determine the sort ordering between two string (ignore case)
 * @param a String to be checked
 * @param b String to be checked
 * @return -1 if a comes before b, 1 if b comes before a,
 *         0 if a and b are the same
 */
function ignoreCaseSort(a,b) {
   a = a.toLowerCase();
   b = b.toLowerCase();
   if(a < b) return -1;
   if(a > b) return 1;
   return 0;
}

/**
 * Generate a random number between the provided bounds.
 * @param theMin Minimum value to be generated
 * @param theMax Maximum value to be generated
 * @return random number between requested bounds
 */
function rand(theMin, theMax) {
    var floaty = (Math.random() * (theMax-theMin)) + theMin;
    return Math.floor(floaty);
}

/**
 * Remove someone from the ignore list. Due to limitations on event handlers
 * and Greasemonkey, the method is a little bit convoluted. Previously
 * the link has been annotated with an 'id' attribute containing the
 * name of the scoundrel to be redeemed. In this method, we are being passed
 * the user's click event, we use that to obtain the link that generated
 * the event (i.e.: the name of the scoundrel they clicked on), and from that
 * we are able to obtain the 'id' attribute, and thus the name of the
 * person to remove from the list.
 * @param event Event generated by the user clicking on a notice link
 */
function removeIgnore(event) {
    event.preventDefault();
    var srcId = event.target.getAttribute("id");
    var userName = srcId.substring(11, srcId.length);
    var localIgnoreList = PM_getValue("ignoreList", "");
    if(localIgnoreList == null) {
        return;
    }
    if(localIgnoreList.length == 0) {
        return;
    }
    var localIgnoreArray = localIgnoreList.split(";");
    var newLocalIgnoreList = "";
    for(i=0; i<localIgnoreArray.length; i++) {
        if(localIgnoreArray[i] != userName) {
            newLocalIgnoreList += ";";
            newLocalIgnoreList += localIgnoreArray[i];
        }
    }
    PM_setValue("ignoreList", newLocalIgnoreList);
    sortIgnoreList();
}

/**
 * Sort the ignore list in alphabetical order.
 */
function sortIgnoreList() {
    // obtain the ignore list
    var localIgnoreList = PM_getValue("ignoreList", "");
    var localIgnoreArray = localIgnoreList.split(";");
    localIgnoreArray.sort(ignoreCaseSort);
    // remove empty elements at the front of the array
    var breakLoop = 0;
    while(   (localIgnoreArray.length > 0)
          && (localIgnoreArray[0].length == 0))
    {
        localIgnoreArray = localIgnoreArray.splice(1,localIgnoreArray.length-1);
        breakLoop++;
        if(breakLoop > 500) break;
    }
    // set the ignore list to the sorted list
    localIgnoreList = localIgnoreArray.join(";");
    PM_setValue("ignoreList", localIgnoreList);
    //GM_log("new ignore list: " + PM_getValue("ignoreList"));
}

//---------------------------------------------------------------------------
// Lights, Camera, Action!
//---------------------------------------------------------------------------
// make sure the ignore list is sorted alphabetically
sortIgnoreList();
// obtain the ignore list
var ignoreList = PM_getValue("ignoreList", "");
// split the list into individual user names
var ignoreArray = ignoreList.split(";");

// obtain all the posts on the page
var allPosts = document.evaluate(
    "//itemscope[@itemtype='http://schema.org/UserComments']",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null);
//GM_log("allPosts.snapshotLength: " + allPosts.snapshotLength);

// for each post on the page
for(var i=0; i<allPosts.snapshotLength; i++)
{
    var thisPost = allPosts.snapshotItem(i);

    // determine who wrote it
    var authorHeaderElement = breadthFirstSearch(thisPost, acceptAuthorHeader);
    var authorElement = breadthFirstSearch(authorHeaderElement, acceptAuthor);
    var authorName = getAuthor(authorElement);

    // add a link to ignore the person
    var messageboardPrompt =
            breadthFirstSearch(thisPost, acceptMessageboardPrompt);
    addIgnoreLink(messageboardPrompt, authorName);

    // for each element in the ignore list
    for(var j=0; j<ignoreArray.length; j++)
    {
        // if the author is on the list
        if(ignoreArray[j] == authorName)
        {
            // expunge their post from the page
            expunge(thisPost);
        }
    }
}

// add a div to contain "remove from ignore list" links
var ignoredDiv = document.createElement('div');
document.body.appendChild(ignoredDiv);
addNoticeLinks(ignoredDiv, ignoreArray);

// end of script

