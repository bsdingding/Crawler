/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import('resource://quicklaunch/quicklaunch.jsm');

function StartUp() {
  renewDialog();
  DoEnabling();
}

function renewDialog() {
  quicklaunchModule.initDatabase();

  var file = Components.classes["@mozilla.org/file/directory_service;1"]
                       .getService(Components.interfaces.nsIProperties)
                       .get("ProfD", Components.interfaces.nsIFile);
  file.append("quicklaunch.sqlite");
  var storageService = Components.classes["@mozilla.org/storage/service;1"]
                                 .getService(Components.interfaces.mozIStorageService);
  var mDBConn = storageService.openDatabase(file);

  var selectProgram = quicklaunch_getPrefValue("addonbarlist", "");
  var selectArray = selectProgram.split(",");
  var temphbox = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "hbox");
  temphbox.setAttribute("class", "quicklaunch-add-hbox");

  var quicklaunch_manager_box = document.getElementById("quicklaunch-addonbar-manager-box");
  for(let j = quicklaunch_manager_box.childNodes.length - 1; j > 3; j--) {
    quicklaunch_manager_box.removeChild(quicklaunch_manager_box.childNodes[j]);
  }

  let id, name, path;
  var statement = mDBConn.createStatement("SELECT id,name,path FROM myquicklaunch");

  try {
    while(statement.executeStep()) {
      id = statement.getInt32(0);
      name = statement.getUTF8String(1);
      path = statement.getUTF8String(2);
      var checkbox = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "checkbox");
      checkbox.id = "customized_"+id;
      checkbox.setAttribute("src", "moz-icon:file:///" + path);
      checkbox.setAttribute("label", name);;
      checkbox.setAttribute("flex", "1");
      checkbox.setAttribute("class", "quicklaunch-checkbox");
      temphbox.appendChild(checkbox);
      if (temphbox.childNodes.length == 2) {
        quicklaunch_manager_box.appendChild(temphbox);
        temphbox = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "hbox");
        temphbox.setAttribute("flex", "1");
      }
    }

    if (temphbox.hasChildNodes()) {
      quicklaunch_manager_box.appendChild(temphbox);
    }
  } catch(e) {
    Components.utils.reportError("quicklaunch database appears to have been corrupted - resetting it." +
              mDBConn.lastErrorString);
  } finally {
    statement.reset();
  }

  // Show screen capture button from default list if zh-CN.
  if (quicklaunchModule.getLocale() == 'zh-CN') {
    document.getElementById("default_paintWebpage").hidden = false;
  }

  for(let i=0; i < selectArray.length; i++) {
    if (document.getElementById("default_" + selectArray[i])) {
      document.getElementById("default_" + selectArray[i]).checked = true;
    } else if (document.getElementById("customized_" + selectArray[i])) {
      document.getElementById("customized_" + selectArray[i]).checked = true;
    }
  }

  return true;
}

function onClickQCPanel(event) {
  if (event.originalTarget.tagName == 'checkbox') {
    changeUserlist();
  }
}

function AcceptDialog() {
  changeUserlist();
  return true;
}

function changeUserlist() {
  var checkboxArray = document.getElementsByTagName("checkbox");
  var addonBarList = "";
  var addonBarString = "";
  for(let i = 0; i < checkboxArray.length; i++) {
    var id = checkboxArray[i].id;
    if (id.indexOf("default_") != -1 && checkboxArray[i].checked) {
      addonBarString = addonBarString + id.substring(8) + ",";
    } else if (id.indexOf("customized_") != -1 && checkboxArray[i].checked) {
      addonBarString = addonBarString + id.substring(11) + ",";
    }
  }

  if (addonBarString.length != 0) {
    addonBarString = addonBarString.substring(0, addonBarString.length - 1);
  }

  quicklaunch_setPrefValue("addonbarlist", addonBarString);
}

function QC_selectTab(aSelTab) {
  var tabbox = document.getElementById("quicklaunch-tabbox");
  tabbox.lastselectedIndex = tabbox.selectedIndex;
  tabbox.selectedIndex = (aSelTab) ? aSelTab : 0;
  var tabId = document.getElementsByTagName("tab")[aSelTab].id;
  var catButtons = document.getElementById("quicklaunchbuttonbox").childNodes;

  for(var i = 0; i < catButtons.length; i++) {
    if (catButtons[i].getAttribute("group", "categories")) {
      catButtons[i].setAttribute("checked", (catButtons[i].id == "button" + tabId));
    }
  }

  if (aSelTab == 0) {
    renewDialog();
    document.location = document.location;
  } else if (aSelTab == 1) {
    document.getElementById("quicklaunchs").builder.rebuild();
  }
}

function quicklaunch_setPrefValue(prefName, value) {
  try {
    var prefs = Application.prefs;
    var name = "extensions.quicklaunch@mozillaonline.com." + prefName;
    return prefs.setValue(name, value);
  } catch(e) {
    Components.utils.reportError(e);
  }
}

function quicklaunch_getPrefValue(prefName, defValue) {
  try {
    var prefs = Application.prefs;
    var name = "extensions.quicklaunch@mozillaonline.com." + prefName;
    return prefs.getValue(name, defValue);
  } catch (e) {
    Components.utils.reportError(e);
  }
}

// invoke the createProfile Wizard
function addQuickLaunch() {
  var params = {
    inn: {
      name: "",
      path: "",
      args: "",
      checked: false
    },
    out: null
  };

  window.openDialog('chrome://quicklaunch/content/editQuickLaunch.xul',
                    'QuickLaunchEdit', 'centerscreen,chrome,modal,titlebar', params);
  if (params.out) {
    var file = Components.classes["@mozilla.org/file/directory_service;1"]
                    .getService(Components.interfaces.nsIProperties)
                    .get("ProfD", Components.interfaces.nsIFile);
    file.append("quicklaunch.sqlite");
    var storageService = Components.classes["@mozilla.org/storage/service;1"]
                  .getService(Components.interfaces.mozIStorageService);
    var mDBConn = storageService.openDatabase(file); // Will also create the file if it does not exist

    var statement = mDBConn.createStatement("INSERT INTO myquicklaunch (name,path,args) VALUES(:name,:path,:args)");
    statement.params.name = params.out.name;
    statement.params.path = params.out.path;
    statement.params.args = params.out.args;
    statement.execute();

    statement = mDBConn.createStatement("SELECT id,name,path FROM myquicklaunch WHERE name == :name" );
    statement.params.name = params.out.name;
    while(statement.executeStep()) {
      var id = statement.getInt32(0);
      if (params.out.checked) {
        addPref(id);
      }
    }

    document.getElementById("quicklaunchs").builder.rebuild();
    renewDialog();
  }
}

function addPref(id) {
  var selectProgram = quicklaunch_getPrefValue("addonbarlist", "");
  var selectArray = selectProgram.split(",");
  var isIdExist = false;

  for (let i = 0; i < selectArray.length; i++) {
    if (id == selectArray[i]) {
      isIdExist = true;
      break;
    }
  }

  if (!isIdExist) {
    selectProgram = selectProgram + "," + id;
    quicklaunch_setPrefValue("addonbarlist", selectProgram);
  } else {
    quicklaunch_setPrefValue("addonbarlist_changetime", new Date().getTime());
  }
}

function delPref(id) {
  var selectProgram = quicklaunch_getPrefValue("addonbarlist", "");
  var newselectProgram = "";
  var selectArray = selectProgram.split(",");
  for (let i = 0; i < selectArray.length; i++) {
    if (id != selectArray[i]) {
      newselectProgram = newselectProgram + selectArray[i] + ",";
    }
  }

  if (newselectProgram.length != 0) {
    newselectProgram = newselectProgram.substring(0, newselectProgram.length - 1);
  }

  quicklaunch_setPrefValue("addonbarlist", newselectProgram);
}

/**
 * Do button enabling based on tree selection
 */
function DoEnabling() {
  var deleteButton = document.getElementById("deleteButton");
  var renameButton = document.getElementById("renameButton");

  var disabled = document.getElementById("quicklaunch-tree").view.selection.count == 0;
  deleteButton.disabled = disabled;
  renameButton.disabled = disabled;
}

function editQuickLaunch() {
  var tree = document.getElementById("quicklaunch-tree");
  Application.console.log(tree.currentIndex);
  var id = tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(4));
  var isChecked = false;

  if (document.getElementById("customized_" + id)) {
    isChecked = document.getElementById("customized_" + id).checked;
  }

  var params = {
    inn: {
      name: tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(1)),
      path: tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(2)),
      args: tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(3)),
      checked: isChecked
    },
    out: null
  };

  window.openDialog('chrome://quicklaunch/content/editQuickLaunch.xul',
                    'QuickLaunchEdit', 'centerscreen,chrome,modal,titlebar', params);
  if (params.out) {
    var file = Components.classes["@mozilla.org/file/directory_service;1"]
                         .getService(Components.interfaces.nsIProperties)
                         .get("ProfD", Components.interfaces.nsIFile);
    file.append("quicklaunch.sqlite");
    var storageService = Components.classes["@mozilla.org/storage/service;1"]
                                   .getService(Components.interfaces.mozIStorageService);
    var mDBConn = storageService.openDatabase(file); // Will also create the file if it does not exist

    var statement = mDBConn.createStatement("UPDATE myquicklaunch set name=:name,path=:path,args=:args where name=:inn_name");
    statement.params.name = params.out.name;
    statement.params.path = params.out.path;
    statement.params.args = params.out.args;
    statement.params.inn_name = params.inn.name;
    statement.execute();

    if (params.out.checked) {
      addPref(id);
    } else {
      delPref(id);
    }

    document.getElementById("quicklaunchs").builder.rebuild();
    renewDialog();
    return true;
  } else {
    //press cancel, do nothing.
    return false;
  }
}

function deleteQuickLaunch() {
  var tree = document.getElementById("quicklaunch-tree");
  var id = tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(4));
  var name = tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(1));
  var file = Components.classes["@mozilla.org/file/directory_service;1"]
                       .getService(Components.interfaces.nsIProperties)
                       .get("ProfD", Components.interfaces.nsIFile);
  file.append("quicklaunch.sqlite");
  var storageService = Components.classes["@mozilla.org/storage/service;1"]
                                 .getService(Components.interfaces.mozIStorageService);
  var mDBConn = storageService.openDatabase(file); // Will also create the file if it does not exist

  var statement = mDBConn.createStatement("DELETE FROM myquicklaunch WHERE name=:name");
  statement.params.name = name;
  statement.execute();

  document.getElementById("quicklaunchs").builder.rebuild();
  delPref(id);
  var delCheckbox = document.getElementById("customized_"+id);
  delCheckbox.parentNode.removeChild(delCheckbox);
  renewDialog();
}

function HandleClickEvent(aEvent) {
  if (aEvent.button == 0 && aEvent.target.parentNode.view.selection.count != 0 && editQuickLaunch()) {
    return true;
  }

  return false;
}

