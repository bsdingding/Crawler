/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var gParams = window.arguments[0];

function StartUp() {
  document.getElementById("name").value = gParams.inn.name;
  document.getElementById("path").value = gParams.inn.path;
  document.getElementById("args").value = gParams.inn.args;
  document.getElementById("edit-qc-checkbox").checked = gParams.inn.checked;
}

/**
 * Sets the current profile to the selected profile (user choice: "Start Mozilla")
 */
function AcceptDialog() {
  if (document.getElementById("path").value != null && document.getElementById("path").value != "") {
    var out = { name: document.getElementById("name").value,
                path: document.getElementById("path").value,
                args: document.getElementById("args").value,
                checked: document.getElementById("edit-qc-checkbox").checked,
              };
    gParams.out = out;
  } else {
    gParams.out = null;
  }
  return true;
}

function openFilePicker(event) {
  const nsIFilePicker = Components.interfaces.nsIFilePicker;

  var fp = Components.classes["@mozilla.org/filepicker;1"]
           .createInstance(nsIFilePicker);
  var title = document.getElementById("quicklaunchStrings").getString("quicklaunch-browser");
  fp.init(window, title, nsIFilePicker.modeOpen);
  if (document.getElementById("path").value != null && document.getElementById("path").value != "") {
    var defaultFile = Components.classes["@mozilla.org/file/local;1"]
                        .createInstance(Components.interfaces.nsILocalFile);
    defaultFile.initWithPath(document.getElementById("path").value);
  }
  fp.displayDirectory = defaultFile;
  fp.appendFilters(nsIFilePicker.filterApps);
  fp.appendFilters(nsIFilePicker.filterAll);
  var rv = fp.show();
  if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
    var file = fp.file;
    // Get the path as string. Note that you usually won't
    // need to work with the string paths.
    var path = fp.file.path;
    // work with returned nsILocalFile...
    document.getElementById("path").value = path;
    document.getElementById("name").value = file.leafName.slice(0, file.leafName.lastIndexOf('.'));
  }
}

