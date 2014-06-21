// paizo_ignore.user.js
// Copyright 2014 Patrick Meade. All rights reserved.
//---------------------------------------------------------------------------

// ==UserScript==
// @name           paizo_ignore
// @version        7
// @updateURL      http://pages.cs.wisc.edu/~meade/greasemonkey/paizo_ignore.user.js
// @namespace      http://pages.cs.wisc.edu/~meade/greasemonkey/
// @description    Improve signal-to-noise ratio on Paizo's messageboards
// @match          http://paizo.com/*
// @match          http://*.paizo.com/*
// @match          https://paizo.com/*
// @match          https://*.paizo.com/*
// @require        http://code.jquery.com/jquery-2.1.0.min.js
// @grant          none
// ==/UserScript==

//---------------------------------------------------------------------------

// make sure our script runs in its own little pocket universe
(function() {
// http://wiki.greasespot.net/Third-Party_Libraries#Potential_conflict
this.$ = this.jQuery = jQuery.noConflict(true);

//---------------------------------------------------------------------------

var GM_getValue = function GM_getValue(key, def) {
    return localStorage[key] || def;
};

var GM_setValue = function GM_setValue(key, value) {
    return localStorage[key] = value;
};

//---------------------------------------------------------------------------

var BLOCK_LIST = "amBlockList";
var HIDE_LIST = "amHideList";

//---------------------------------------------------------------------------

var hiddenPostIds = [];

//---------------------------------------------------------------------------

var addToList = function addToList(listName, addElem) {
    // load the list from the browser's storage
    var list = loadList(listName);
    // add the provided element to the list
    list.push(addElem);
    // save the list to the browser's storage
    saveList(listName, list);
};

var annotatePosts = function annotatePosts() {
    // for each of the parent elements of the "itemscope" elements
    $("itemscope").parent().each(function(index, element) {
        // name the element that we're working with
        var postDiv = $(this);
        // create a link to hide the post
        var hidePost = createListAddLink('Hide', HIDE_LIST, postDiv.attr('id'));
        // create a link to block the user
        var blockUser = createListAddLink('Block User', BLOCK_LIST, findAuthor(postDiv));
        // append the links to the post header
        $(this).find(".ph-right").append(' | ', hidePost, ' | ', blockUser);
    });
};

var appendUnblock = function appendUnblock() {
    // remove any previous unblock lists in the DOM
    $("#"+BLOCK_LIST).remove();
    $("#"+HIDE_LIST).remove();
    // if we have hidden posts on this page
    if(hiddenPostIds.length > 0) {
        // create an unhide list
        var unhideList = $('<div id="' + HIDE_LIST + '"></div>');
        // for each hidden post on this page
        for(var postIndex in hiddenPostIds) {
            // create a remove link for that post
            var postId = hiddenPostIds[postIndex];
            var removeLink = createListRemoveLink(postId, HIDE_LIST, postId);
            // and add it to our reveal list
            if(postIndex > 0) {
                unhideList.append(' | ');
            } else {
                unhideList.append('Reveal Post: ');
            }
            unhideList.append(removeLink);
        }
        // append the finished list to the end of the page
        $("body").append(unhideList);
    }
    // load up the block list
    var blockList = loadList(BLOCK_LIST);
    // if there is anybody on the list to be unblocked
    if(blockList.length > 0) {
        // create an unblock list
        var unblockList = $('<div id="' + BLOCK_LIST + '"></div>');
        // for each user on the block list
        for(var userIndex in blockList) {
            // create a link to unblock that user
            var user = blockList[userIndex];
            var removeLink = createListRemoveLink(user, BLOCK_LIST, user);
            // append that link to the unblock list
            if(userIndex > 0) {
                unblockList.append(' | ');
            } else {
                unblockList.append('Unblock User: ');
            }
            unblockList.append(removeLink);
        }
        // append the finished list to the end of the page
        $("body").append(unblockList);
    }
};

var createListAddLink = function createListAddLink(linkText, listName, listItem) {
    // dress up the provided link text in HTML
    linkText = '<a href="javascript:void(0);">' + linkText + '</a>';
    // create a link element with the proper behavior
    return $(linkText).click(function() {
        addToList(listName, listItem);
        cullPosts();
        appendUnblock();
    });
};

var createListRemoveLink = function createListRemoveLink(linkText, listName, listItem) {
    // dress up the provided link text in HTML
    linkText = '<a href="javascript:void(0);">' + linkText + '</a>';
    // create a link element with the proper behavior
    return $(linkText).click(function() {
        hiddenPostIds = hiddenPostIds.filter(function(value, index, array) {
           return value !== listItem; 
        });
        removeFromList(listName, listItem);
        appendUnblock();
    });
};

var cullPosts = function cullPosts() {
    // load the lists from the browser's storage
    var lists = loadLists();
    // for each post on the hide list
    for(var hideIndex in lists.hide) {
        var postId = lists.hide[hideIndex];
        // remove the post from the page
        var post = $("#"+postId);
        if(post.length > 0) {
            hiddenPostIds.push(postId);
            post.remove();
        }
    }
    // for each author on the block list
    for(var blockIndex in lists.block) {
        // get the name of the blocked user
        var blockedUser = lists.block[blockIndex];
        // look at each post on the page
        $("itemscope").parent().each(function(index, element) {
            // name the element that we're working with
            var postDiv = $(this);
            // if the author of the post is the blocked user
            if(findAuthor(postDiv) === blockedUser) {
                postDiv.remove();
            }
        });
    }
};

var findAuthor = function findAuthor(postDiv) {
    var title = $(".messageboard-avatar-name a", postDiv).attr("title");
    if(title.indexOf(" aka ") !== -1) {
        title = title.substring(0, title.indexOf(" aka "));
    }
    if(title.indexOf("Alias of") !== -1) {
        title = title.substring(9);
    }
    if(title.indexOf("Pathfinder Society character of") !== -1) {
        title = title.substring(32);
    }
    return title;
};

var loadList = function loadList(listName) {
    // load the list JSON from the browser's storage
    var rawList = GM_getValue(listName, '[]');
    // attempt to parse the JSON list
    var cookedList = [];
    try { cookedList = JSON.parse(rawList); }
    catch(e) { cookedList = []; }
    // sort the list after loading
    cookedList.sort(function (a,b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    // return the parsed list to the caller
    return cookedList;
};

var loadLists = function loadLists() {
    // return the loaded and parsed lists to the caller
    return {
        block: loadList(BLOCK_LIST),
        hide: loadList(HIDE_LIST)
    };
};

var removeFromList = function removeFromList(listName, removeElem) {
    // load the list from the browser's storage
    var list = loadList(listName);
    // filter the list
    list = list.filter(function(value, index, array) {
        // accept elements that aren't the one we're removing
        return value !== removeElem;
    });
    // save the list to the browser's storage
    saveList(listName, list);
};

var saveList = function saveList(listName, list) {
    // convert the list to JSON and save it to the browser's storage
    GM_setValue(listName, JSON.stringify(list));
};

// when the document has finished loading
$(document).ready(function() {
    // remove hidden posts and posts by blocked users
    cullPosts();
    // add hide and block links to remaining posts
    annotatePosts();
    // append unblock lists at the bottom of the page
    appendUnblock();
});

//---------------------------------------------------------------------------

// make sure our script runs in its own little pocket universe
})();

//---------------------------------------------------------------------------
// end of paizo_ignore.user.js
