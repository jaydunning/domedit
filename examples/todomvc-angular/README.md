# TodoMVC Template to AngularJS

This example shows how DomEdit can be used to transform the 
[TodoMVC](http://todomvc.com) [template](https://github.com/tastejs/todomvc/tree/gh-pages/template)
into the [TodoMVC AngularJS example template](https://github.com/tastejs/todomvc/tree/gh-pages/architecture-examples/angularjs).

## Contents:
- html/index-original.html: The current TodoMVC template.
- html/index.html: The TodoMVC template, modified by adding one div (#todomvc).
  The extra div is necessary because the AngularJS template adds a script
  element that encloses three original template elements (section#todoapp,
  footer#footer, and footer#info) that are not the only children of their
  parent element (body). DomEdit does not support ranges (yet).
- mods/index.mods: DomEdit directives to transform the TodoMVC template 
  into the AngularJS template.
- ng-reference/index.html: The AngularJS TodoMVC example template, for 
  comparison.
- dist/index.html: The output file. This should be structurally equivalent to
  ng-reference/index.html, even if it is not diff-equivalent.
- build.bat: A DOS/Node.js build file.
- build.sh: A Bash/Node.js build file.
- gulpfile.js: A Gulp build file.

## Differences between generated file and reference file

- DomEdit uses platform newlines, which may vary from the reference file.
- Indentation and line breaks may vary.
- Comments are retained. DomEdit does not currently support comment removal.
- Empty elements are output using XML format (`<meta charset="utf-8" />`)
  or in non-collapsed form (`<ng-view></ng-view>`).
- Empty attributes are output in XML format (`autofocus=""`)
- Attribute order may vary.
