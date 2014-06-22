var domedit = function(document, mods, log) {
    'use strict';


    log = log || console.log;

    var nWarnings = 0;
    var warn = function(message) {
        log('[WARNING] ' + message);
        ++nWarnings;
    };

    var deferred = [];

    var discardElement = function(node) {
        if ( node.parentNode ) {
            node.parentNode.removeChild(node);
        }
    };

    var discardTag = function(node) {
        if ( node.parentNode ) {
            doInserts(node.parentNode, childNodes(node), node);
            node.parentNode.removeChild(node);
        }
    };

    var discardContent = function(node) {
        removeAllChildNodes(node);
    };

    var discardAttrs = function(node, attrs) {
        attrs.forEach(function(attr) {
            node.removeAttribute(attr);
        });
    };

    var leafDescendant = function(node) {
        while ( node.hasChildNodes && node.hasChildNodes() ) {
            node = node.lastChild;
        }
        return node;
    };

    var deferDiscard = function(node, directive) {
        if ( 'element' === directive ) {
            deferred.push(discardElement.bind(null, node));
        } else if ( 'tag' === directive ) {
            deferred.push(discardTag.bind(null, node));
        } else if ( 'content' === directive ) { 
            deferred.push(discardContent.bind(null, node));
        } else {
            warn("Unrecognized discard directive: " + directive);
        }
    };

    var childNodes = function(node) {
        var result = [];
        var child = node.firstChild;
        while ( child ) {
            result.push(child);
            child = child.nextSibling;
        }
        return result;
    };

    var removeAllChildNodes = function(node) {
        var result = [];
        while ( node.hasChildNodes() ) {
            result.unshift(node.removeChild(node.lastChild));
        }
        return result;
    };

    var doInserts = function(parent, inserts, before) {
        if ( before ) {
            inserts.forEach(function(insert) {
                parent.insertBefore(insert, before);
            });
        } else {
            inserts.forEach(function(insert) {
                parent.appendChild(insert);
            });
        }
    };

    var reDirectives  = /^(wrap|wrap-content|before|after|before-content|after-content|content)$/;
    var reADirectives = /^@(wrap|wrap-content|before|after|before-content|after-content|content|discard|discard-attr)$/;

    var applyDirectives = function(node, directives, selector) {
        for ( var directive in directives ) { if ( directives.hasOwnProperty(directive) ) { 
            if ( directive.charAt(0) === '@' ) {
                if ( reADirectives.test(directive) ) {
                    warn(selector + '[' + directive + ']: Did you mean to use "' + directive.substr(1) + '"?');
                } else {
                    if ( directive.indexOf('@@') === 0 && ! reDirectives.test(directive.substr(2)) ) {
                        warn(selector + '[' + directive + ']: Invalid directive');
                        continue;
                    }
                }
                node.setAttribute(directive.substr(directive.indexOf('@@') === 0 ? 2 : 1), directives[directive]);
            } else if ( reDirectives.test(directive) ) {

                var inserts = (function() {
                    var tmp = document.createElement('div');
                    tmp.innerHTML = directives[directive];
                    return childNodes(tmp);
                })();

                switch ( directive ) {
                case 'before': 
                    doInserts(node.parentNode, inserts, node);
                break;
                case 'before-content':
                    if ( node.hasChildNodes() ) {
                        doInserts(node, inserts, node.firstChild);
                    } else {
                        doInserts(node, inserts);
                    }
                break;
                case 'after': 
                    if ( node.nextSibling ) {
                        doInserts(node.parentNode, inserts, node.nextSibling);
                    } else {
                        doInserts(node.parentNode, inserts);
                    }
                break;
                case 'after-content':
                    doInserts(node, inserts);
                break;
                case 'content':
                    removeAllChildNodes(node);
                    doInserts(node, inserts);
                break;
                case 'wrap':
                    doInserts(node.parentNode, inserts, node);
                    node.parentNode.removeChild(node);
                    doInserts(leafDescendant(inserts[inserts.length-1]), [node]);
                break;
                case 'wrap-content':
                    var children = removeAllChildNodes(node);
                    doInserts(node, inserts);
                    doInserts(leafDescendant(node), children);
                break;
                }
            } else if ( directive === 'discard' ) {
                deferDiscard(node, directives.discard);
            } else if ( directive.indexOf('discard-attr') === 0 ) {
                deferred.push(discardAttrs.bind(null, node, directives[directive].split(/(\s+|(\s*,\s*))/)));
            } else {
                warn(selector + '[' + directive + ']: Unrecognized directive');
            }
        }}
    };

    var applyModSet = function(modSet) {
        for ( var selector in modSet ) { if ( modSet.hasOwnProperty(selector) ) {
            var nodes = document.querySelectorAll(selector);
            if ( ! nodes || nodes.length === 0 ) {
                warn('Selector not matched: ' + selector);
                continue;
            }
            /*jshint -W083*/
            [].forEach.call(nodes, function(node) { applyDirectives(node, modSet[selector], selector); });
            /*jshint +W083*/
        }}
        deferred.forEach(function(cmd) {
            cmd();
        });
    };

    applyModSet(mods);
};

if ( module ) {
    module.exports = domedit;
}
