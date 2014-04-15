// paizo_aliases.user.js
// Copyright 2014 Patrick Meade. All rights reserved.
//---------------------------------------------------------------------------

// ==UserScript==
// @name           paizo_aliases
// @version        1
// @updateURL      http://pages.cs.wisc.edu/~meade/greasemonkey/paizo_aliases.user.js
// @namespace      http://pages.cs.wisc.edu/~meade/greasemonkey/
// @description    Manage aliases on Paizo's messageboards
// @match          http://paizo.com/*
// @match          http://*.paizo.com/*
// @match          https://paizo.com/*
// @match          https://*.paizo.com/*
// @require        http://code.jquery.com/jquery-2.1.0.min.js
// @require        https://userscripts.org/scripts/source/145813.user.js
// @grant          none
// ==/UserScript==

//---------------------------------------------------------------------------

// make sure our script runs in its own little pocket universe
(function() {
    // http://wiki.greasespot.net/Third-Party_Libraries#Potential_conflict
    this.$ = this.jQuery = jQuery.noConflict(true);
    
    var ALIAS_HIDE_LIST = "amAliasHideList";
    
    var addToList = function addToList(listName, addElem) {
        // load the list from the browser's storage
        var list = loadList(listName);
        // add the provided element to the list
        list.push(addElem);
        // save the list to the browser's storage
        saveList(listName, list);
    };
    
    var annotateAliases = function annotateAliases() {
        // load the list from the browser's storage
        var aliasHideList = loadList(ALIAS_HIDE_LIST);
        var tableCells = $("#main-slot #tabs table td");
        tableCells.each(function() {
            var tableCell = $(this);
            var alias = tableCell.find("b").html();
            var linkText = (($.inArray(alias, aliasHideList) !== -1) ? "Show" : "Hide");
            var aliasHideLink = $('<a href="javascript:void(0);" class="messageboard-prompt">' + linkText + '</a><br/>');
            aliasHideLink.click(function() {
                if(linkText === "Hide") {
                    addToList(ALIAS_HIDE_LIST, alias);
                    tableCell.remove();
                } else {
                    removeFromList(ALIAS_HIDE_LIST, alias);
                    $(this).remove();
                }
            });
            $(this).prepend(aliasHideLink);
        });
    }

    var annotateHideSome = function annotateHideSome() {
        $("#main-slot #tabs").find("h2").each(function() {
            var currentLocation = window.location.href;
            var noParams = currentLocation.substring(0, currentLocation.indexOf('?'));
            $(this).html($(this).html() + ' (<a href="' + noParams + '">Hide Some</a>)')
        });
    }
    
    var annotateShowAll = function annotateShowAll() {
        $("#main-slot #tabs").find("h2").each(function() {
           $(this).html($(this).html() + ' (<a href="' + window.location.href + '?showHiddenAliases=true">Show All</a>)')
        });
    }
    
    var cullAliases = function cullAliases() {
        // load the list from the browser's storage
        var aliasHideList = loadList(ALIAS_HIDE_LIST);
        // look at each alias on the page
        $("#main-slot #tabs table td").each(function(index, element) {
            // name the element that we're working with
            var tableCell = $(this);
            var alias = tableCell.find("b").html();
            // if the alias is on the hide list
            if($.inArray(alias, aliasHideList) !== -1) {
                tableCell.remove();
            }
        });
        // Not quite there yet...
//         var aliasDiv = $('<div id="aliases"></div>');
//         $("#main-slot #tabs table td").each(function(index, element) {
//             aliasDiv.append($(this));
//         });
//         $("#main-slot #tabs table").replaceWith(aliasDiv);
    }

    var cullAliasSelect = function cullAliasSelect() {
        // load the list from the browser's storage
        var aliasHideList = loadList(ALIAS_HIDE_LIST);
        var aliasOption = $('form[id="postPreviewForm"] select option');
        aliasOption.each(function() {
            var alias = $(this).html();
            if($.inArray(alias, aliasHideList) !== -1) {
                $(this).remove();
            }
        });
    }
    
    // See: http://stackoverflow.com/a/901144
    var getParameterByName = function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
    
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
        var hideMeList = loadList(ALIAS_HIDE_LIST);
        var activeTab = $(".tp-front-tab b").html();
        if(activeTab === "Aliases") {
            var showHiddenAliases = getParameterByName("showHiddenAliases");
            if(showHiddenAliases !== "true") {
                cullAliases();
                annotateShowAll();
            } else {
                annotateHideSome();
            }
            annotateAliases();
        }
        var previewForm = $('form[id="postPreviewForm"]');
        if(previewForm.length > 0) {
            cullAliasSelect();
        }
    }); // when the document has finished loading
})(); // make sure our script runs in its own little pocket universe

//---------------------------------------------------------------------------
// end of paizo_aliases.user.js

