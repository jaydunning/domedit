# DomEdit

A declarative DOM editor.

## Example

<table>
<tr><tr><td colspan="2" style="background-color:#0aa; color:#fff; text-align: center; font-weight: bold">Inputs</td></tr>
<tr><td style="vertical-align: top">_helloworld.html:
<div>
<pre>
&lt;div id="hello" /&gt;
</pre>
</div>
</td>
<td style="vertical-align: top">_helloworld.mods:
<div>
<pre>
{
    "#hello": {
        "content"       : "Hello World!",
        "discard-attr"  : "id",
        "@class"        : "greeting"
    }
}
</pre>
</div>
</td>
</tr>
<tr><td colspan="2" style="background-color:#0aa; color:#fff; text-align: center; font-weight: bold">Output</td></tr>
<tr><td colspan="2">
<pre>
&lt;div class="greeting"&gt;Hello World!&lt;/div&gt;
</pre>
</td>
</tr>
</table>        

## Install

`npm install domedit`

## Run

### CLI

`domedit -f mods-file html-file`

### Gulp

    var domedit = require('domedit');

    // For each html file html/**/x.html,
    // apply file mods/**/x.mods, creating file dist/**/x.html.
    gulp.task('domedit', function() {
      return gulp.src(['html/**/*.html')
        .pipe(domedit({modsdir: 'mods'}))
        .pipe(gulp.dest('./dist'));
    });

The argument to the domedit function may be any of the following:

- {modsfile: "_filename_"}: A string containing the name of the mods file.
- {modsfile: function()}: A function that takes a file name and returns a mods file name. 
  The function is passed two arguments: the file basename (e.g. `x`),
  and the file full name (e.g. `blah/blah/blah/x.html`).
- {modsfile: {_basename_:_modname_, ...}}: An object with file basenames as properties 
  and mods file names as property values.
- {modsdir: "_dirname_"}: A string containing the name of the mods file base directory.
  Mods files are selected by matching their relative path with the relative path of 
  the HTML file and by matching their basename with the basename of the HTML file. 
  Mods files must have the suffix '.mods'.

### Program API

    var domedit = require('domedit');
    var editedHtml = domedit(html, mods{, log});
        // html may be a filename or a string, and may be complete or partial HTML
        // mods is a mods object
        // log defaults to console.warn

## Mods file syntax

The DomEdit mods file is a JSON file containing a single object. Each
property of the object is a CSS selector that may match one or more 
elements within the HTML file. Each selector property value is an object 
containing a set of changes to apply to each matched element. 
Each change consists of a directive and a value.

### Mods file directives

<table id="directives">
<thead><tr><th>Directive</th><th>Value</th></tr></thead>
<tbody>
<tr>
  <td>@<i>name</i></td>
  <td>Text to be used as the value of the <i>name</i> attribute. If the attribute does not exist, it will be added.</td>
</tr>
<tr>
  <td>@@<i>name</i></td>
  <td>This directive allows attributes with the same name as other DomEdit directives to be added to an element.</td>
</tr>
<tr>
  <td>after</td>
  <td>Text or HTML to insert immediately after the element's end tag.</td>
</tr>
<tr>
  <td style="white-space:nowrap">after-content</td>
  <td>Text or HTML to insert immediately before the element's end tag.</td>
</tr>
<tr>
  <td>before</td>
  <td>Text or HTML to insert immediately before the element's start tag.</td>
</tr>
<tr>
  <td style="white-space:nowrap">before-content</td>
  <td>Text or HTML to insert immediately after the element's start tag.</td>
</tr>
<tr>
  <td>content</td>
  <td>Text or HTML to replace the content of the element.</td>
</tr>
<tr>
  <td>discard</td>
  <td>One of the following:
<ul>
<li>`element`: The element and its content will be removed from the output.</li>
<li>`tag`: The element's start and end tags will be removed from the output.</li>
<li>`content`: The element's content will be removed from the output.</li>
</ul>
</td>
</tr>
<tr>
  <td style="white-space:nowrap">discard-attr(s)</td>
  <td>A space- or comma-separated list of attributes to be removed from the output.</td>
</tr>
<tr>
  <td>wrap</td>
  <td>HTML to be inserted between the element and its parent. This HTML becomes
      a child of the parent, and the selected element becomes a child of 
      the right-most last child of the inserted HTML.</td>
</tr>
<tr>
  <td style="white-space:nowrap">wrap-content</td>
  <td>HTML to be inserted between the element and its content. This HTML becomes
      a child of the element, and the element's content becomes a child of 
      the rightt-most last child of the inserted HTML.</td>
</tr>
</tbody>
</table>

#### Notes

- HTML elements used within a directive must be complete (with both start and end tags).
- Selectors and directives have no sequence. Do not depend on sequence of operations.
- All discards (including discard-attr(s)) are deferred until after all other edits are run, so that discards do not break selectors.


## TODO
- Support text replacement (s/x/y/{g}) for attribute values and content.
- Support DOM range selection for a subset of directives.
- Support array type as top level of JSON file for sequenced operations.
