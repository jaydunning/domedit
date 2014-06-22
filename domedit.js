#!/usr/bin/env node

/*jshint node:true */
'use strict';

var jsdom = require('jsdom-nogyp').jsdom;
var domedit = require('./lib/domedit.js');
var fs = require('fs');
var Stream = require('stream');

(function() {

    var edit = function(html, editor) {

        // param html is either an html string (possibly a partial)
        // or a filename.

        if ( typeof html === 'string' ) {
            if ( /</.test(html) ) {
            } else if ( /:\/\//.test(html) ) {
                throw("URLs not supported: " + html);
            } else {
                html = fs.readFileSync(html, 'utf-8');
            }
        }

        var isPartial = (function() {
            var reComments          = new RegExp('<!--[\\s\\S]*?-->', 'mg');
            var reLeadingWhiteSpace = new RegExp('^\\s*', 'm');
            var reDoctype           = new RegExp('^<!doctype', 'i');
            var reHtml              = new RegExp('^<html', 'i');
            var cleaned = html.replace(reComments, '').replace(reLeadingWhiteSpace, '');
            return ! reDoctype.test(cleaned) && ! reHtml.test(cleaned);
        })();

        if ( isPartial ) {
            // prevent nwmatcher failure by enclosing in HTML tags.
            html = '<html>' + html + '</html>';
        }

        var document = jsdom(html);
        editor(document);
        
        if ( isPartial ) {
            return document.innerHTML.replace(/^<html>/, '').replace(/<\/html>$/, '');
        } else {
            var window = document.createWindow();
            return ((window.document.doctype == null ? '' : window.document.doctype ) 
               + document.outerHTML);
        }
    };

    var readFile = function(filename) {
        return fs.readFileSync(filename, 'utf8');
    };

    var readJson = function(filename) {
        return JSON.parse(readFile(filename));
    };

    var basename = function(s) {
        return s.replace(/.*[\\\/]/,'').replace(/\..*/,'');
    };

    var api = function(html, mods, log) {
        return edit(html, function(document) {
            domedit(document, mods, log ? log : console.warn);
        });
    };

    var cli = function() {

        var usage = 'Usage: node domedit -f modsfile htmlfile';

        var processFile = function(filename, mods) {
            fs.stat(arg, function(err, stat) {
                if ( err ) {
                    throw new Error('File not found: ' + arg);
                }

                process.stdout.write(
                    edit(arg, function(document) { 
                        domedit(document, mods, console.warn);
                    })
                );
            });
        };

        var args = (function(iterable) {
            var sequence = iterable;
            var i = -1;
            var self = {};
            self.hasNext = function() { return i < sequence.length - 1; };
            self.next    = function() { return sequence[++i]; };
            return self;
        })(process.argv.slice(2));

        if ( ! args.hasNext() ) {
            console.warn(usage);
            return;
        }

        var modsfile;
        var mods;
        var arg;
        while ( args.hasNext() ) {
            arg = args.next();
            if ( arg.charAt(0) === '-' ) {
                if ( arg.charAt(1) === 'f' ) {
                    if ( arg.length > 2 ) {
                        modsfile = arg.substr(2);
                    } else {
                        if ( ! args.hasNext() ) {
                            console.warn('-' + arg.charAt(1) + ' requires value');
                            console.warn(usage); 
                            return; 
                        }
                        arg = args.next();
                        modsfile = arg;
                    }
                    if ( modsfile ) {
                        mods = readJson(modsfile);
                    }
                    continue;
                }
                if ( arg.charAt(1) === 'h' ) {
                    console.warn(usage); 
                    return;
                }
                console.warn("Invalid option: " + arg);
                console.warn(usage);
                return;
            }

            if ( ! modsfile ) { 
                console.warn(usage);
                return;
            }
            processFile(arg, mods);
        }
    };

    var gulp = function(options) {
        options = options || {};

        var verbose = options.verbose;

        var log = function(s) {
            console.warn("domedit: " + s);
        };

        var replacePath = function(filepath, basepath, newbasepath, ext) {
            if ( filepath.indexOf(basepath) !== 0 ) { 
                throw "Not a base path relationship: " + filepath + ", " + basepath;
            }
            var result = newbasepath + filepath.substr(basepath.length);
            if ( ext ) {
                result = result.replace(/\..*$/, '') + ext;
            }
            return result;
        };

        var processFile = function(buf, mods, modsfile) {
            return edit(buf.toString(),
                function(document) { 
                    domedit(document, mods, function(s) {
                        console.warn(s.replace(']', '] ' + modsfile + ':'));
                    }); 
                }
            );
        };

        var stream = new Stream.Transform({objectMode: true});
        stream._transform = function(file, encoding, done) {
            if ( file.isNull() ) {
                stream.push(file);
                done();
                return;
            }

            var modsfile;
            // TODO: This may be oversimplified.
            if ( typeof options.modsfile === 'string' ) {
                modsfile = options.modsfile;
            } else if ( typeof options.modsfile === 'function' ) {
                modsfile = options.modsfile(basename(file.path), file.path);
            } else if ( typeof options.modsfile === 'object' ) {
                modsfile = options.modsfile[basename(file.path)];
            } else if ( typeof options.modsdir === 'string' ) {
                if ( options.modsdir.slice(-1) !== '/' ) {
                    options.modsdir += '/';
                }
                modsfile = replacePath(file.path, file.base, options.modsdir, '.mods');
            }

            if ( ! modsfile ) {
                verbose && log('Ignoring ' + file.path + ' because no mods file specified');
                stream.push(file);
                done();
                return;
            }

            if ( ! fs.existsSync(modsfile) ) {
                verbose && log('Ignoring ' + file.path + ' because mods file ' + modsfile + ' not found');
                stream.push(file);
                done();
                return;
            }

            var mods = readJson(modsfile);

            if ( file.isStream() ) {
                var gather = function(callback) {
                    var passthrough = new Stream.PassThrough();
                    passthrough.callback = done;
                    passthrough.buf = Buffer();
                    passthrough._transform = function(chunk, encoding, done) {
                        this.buf = Buffer.concat([this.buf, chunk], this.buf.length + chunk.length);
                        done();
                    };
                    passthrough._flush = function(done) {
                        var self = this;
                        this.callback(null, this.buf, function(err, buf) {
                            if ( buf && buf.length ) {
                                self.push(buf);
                            }
                            done();
                        });
                    };
                };

                try {
                    // TODO: Not tested
                    file.contents = new Buffer(processFile(file.contents.pipe(gather()), mods, modsfile));
                    stream.push(file);
                    done();
                } catch(x) {
                    x.message = file.path + ':' + x.message;
                    stream.emit('error', x);
                }
            } else {
                try {
                    file.contents = new Buffer(processFile(file.contents.toString(), mods, modsfile));
                    stream.push(file);
                    done();
                } catch(x) {
                    x.message = file.path + ':' + x.message;
                    stream.emit('error', x);
                }
            }
        };
        return stream;
    };

    if ( process.argv[1].indexOf('gulp') >= 0 ) {
        module.exports = gulp;
    } else if ( process.argv[1].indexOf('domedit.js') >= 0 ) {
        cli();
    } else {
        module.exports = api;
    }
})();
