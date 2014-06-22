var jsdom = require('jsdom-nogyp');
var domeditapi = require('../domedit.js');

var testrunner = function(tests) {
    var self = {};
    var attempted = 0;
    var passed = 0;

    self.runtest = function(test) {
        var logvalue = '';
        var log = function(s) { console.log(s); logvalue += s; };
        var actual = domeditapi(test.sHtml, test.mods);
        if ( actual === test.expected ) {
            ++passed;
            console.log("Pass: " + test.description);
        } else {
            console.log("Fail: " + test.description);
            console.log("      Expected: " + test.expected);
            console.log("      Actual:   " + actual);
        }

        if ( ++attempted === tests.length ) {
            console.log('Passed ' + passed + ' out of ' + attempted + ' tests');
            if ( attempted !== passed ) {
                throw new Error("Failed " + (attempted-passed) + " out of " + attempted + " tests");
            }
        }
    };

    self.runtests = function(tests) {
        tests.forEach(function(test) { self.runtest(test); } );
    };

    self.runtests(tests);
};

var it = function(description, sHtml, mods, expected) {
    var result = {};
    result.description = "It " + description;
    result.sHtml = sHtml;
    result.mods = mods;
    result.expected = expected;
    return result;
};

var doc = (
    '<!doctype html>\n' +
        '<html>' +
        '<head>' +
        '<title></title>' +
        '</head>' +
        '<body>' +
        '<div id="d1">' +
        '<p>My first paragraph</p>' +
        '<p>My second paragraph</p>' +
        '</div>' +
        '</body>' +
        '</html>'
);

testrunner([
    it('defaults to identity transformation', doc, {}, doc),
    it('inserts content', 
       doc, 
       { title: { content: 'My Title' } },
       doc.replace('<title></title>', '<title>My Title</title>')),
    it('replaces content', 
       doc.replace('<title></title>', '<title>My Title</title>'),
       { title: { content: 'My New Title' } },
       doc.replace('<title></title>', '<title>My New Title</title>')),
    it('adds attributes',
       doc,
       { '#d1': { '@class' : 'myclass', } },
       doc.replace('<div id="d1">', '<div id="d1" class="myclass">')),
    it('adds empty attributes',
       doc,
       { '#d1': { '@empty' : '' } },
       doc.replace('<div id="d1">', '<div id="d1" empty="">')),
    it('replaces attributes',
       doc,
       { '#d1': { '@id' : 'd2', } },
       doc.replace('<div id="d1">', '<div id="d2">')),
    it('modifies all elements matching selector',
       doc,
       { p: { '@class' : 'pclass' } },
       doc.replace(/<p>/g, '<p class="pclass">')),
    it('inserts text before an element', 
       doc,
       { '#d1': { before: 'inserted text' } },
       doc.replace('<div id="d1">', 'inserted text<div id="d1">')),
    it('inserts text before a non-empty element\'s content', 
       doc,
       { '#d1': { 'before-content': 'inserted text' } },
       doc.replace('<div id="d1">', '<div id="d1">inserted text')),
    it('inserts text after a non-empty element\'s content', 
       doc,
       { '#d1': { 'after-content': 'inserted text' } },
       doc.replace('</div>', 'inserted text</div>')),
    it('inserts text before an empty element\'s content', 
       doc,
       { title: { 'before-content': 'My Title' } },
       doc.replace('<title></title>', '<title>My Title</title>')),
    it('inserts text after an empty element\'s content', 
       doc,
       { title: { 'after-content': 'My Title' } },
       doc.replace('<title></title>', '<title>My Title</title>')),
    it('inserts text after an element', 
       doc,
       { '#d1': { after: 'inserted text' } },
       doc.replace('</div>', '</div>inserted text')),
    it('removes elements', 
       doc,
       { '#d1': { discard: 'element' } },
       doc.replace(/<div[^>]*>.*<\/div>/, '')),
    it('removes element tags', 
       doc,
       { '#d1': { discard: 'tag' } },
       doc.replace(/<div[^>]*>/, '').replace('</div>','')),
    it('removes element content', 
       doc,
       { '#d1': { discard: 'content' } },
       doc.replace(/(<div[^>]*>)(.*)(<\/div>)/, '$1$3')),
    it('removes element attributes', 
       doc.replace(/id="d1"/,'id="d1" class="xxx"'),
       { '#d1': { 'discard-attrs': 'class' } },
       doc),
    it('removes multiple element attributes', 
       doc.replace(/id="d1"/,'id="d1" class="xxx"'),
       { '#d1': { 'discard-attrs': 'id, class' } },
       doc.replace(/(<div[^>]*>)/, '<div>')),
    it('wraps elements', 
       doc,
       { 'p:first-child': { 'wrap': '<div id="d2"></div>' } },
       doc.replace(/(<p>My first paragraph<\/p>)/, 
                   '<div id="d2">$1</div>')),
    it('wraps element content', 
       doc,
       { '#d1': { 'wrap-content': '<div id="d2"></div>' } },
       doc.replace(/(<p>My first paragraph<\/p>)/, 
                   '<div id="d2">$1').replace(/<\/div>/, '</div></div>')),
    it('handles partial documents, even ones without a single root element', 
       doc.replace(/<!doctype.*>\n/, '').replace(/^.*<div/, '<div').replace(/<\/div>.*/, '</div><div id="d2">x</div>'),
       { p: { '@class' : 'pclass' } },
       doc.replace(/<!doctype.*>\n/, '').replace(/^.*<div/, '<div').replace(/<\/div>.*/, '</div><div id="d2">x</div>').replace(/<p>/g, '<p class="pclass">'))

]);
