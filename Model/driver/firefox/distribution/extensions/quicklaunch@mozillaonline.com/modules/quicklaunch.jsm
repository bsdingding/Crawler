/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ['quicklaunchModule'];

const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;

if (typeof XPCOMUtils == 'undefined') {
  Cu.import('resource://gre/modules/XPCOMUtils.jsm');
}

XPCOMUtils.defineLazyModuleGetter(this, 'Services',
  'resource://gre/modules/Services.jsm');

var Application = Cc["@mozilla.org/fuel/application;1"]
                    .getService(Ci.fuelIApplication);

const PREF_MATCH_OS_LOCALE = "intl.locale.matchOS";
const PREF_SELECTED_LOCALE = "general.useragent.locale";

var debug = false;
function log(msg) {
  if (!debug) {
    return;
  }

  try {
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(msg);
  } catch(e) { }
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

var quicklaunchModule = {
  initDatabase: function() {
    if (this.createDatabase()) {
      return;
    }
    this.upgradeDB();
  },

  createDatabase: function() {
    log('Create database for quicklaunch.');

    var file = Components.classes["@mozilla.org/file/directory_service;1"]
                         .getService(Components.interfaces.nsIProperties)
                         .get("ProfD", Components.interfaces.nsIFile);
    file.append("quicklaunch.sqlite");
    var mDBConn = null;

    if (!file.exists() || file.fileSize == 0) {
      var storageService = Components.classes["@mozilla.org/storage/service;1"]
                                     .getService(Components.interfaces.mozIStorageService);
      mDBConn = storageService.openDatabase(file); // Will also create the file if it does not exist
      try {
        mDBConn.executeSimpleSQL("CREATE TABLE myquicklaunch (id INTEGER NOT NULL PRIMARY KEY, name VARCHAR(32) NOT NULL UNIQUE, path VARCHAR(1024), args VARCHAR(255))");
        quicklaunch_setPrefValue('lastDBUpgrade', '0.4');
        return true;
      } catch(e) { }
    }

    return false;
  },

  upgradeDB: function() {
    log('Upgrade database for quicklaunch.');

    var file = Components.classes["@mozilla.org/file/directory_service;1"]
                         .getService(Components.interfaces.nsIProperties)
                         .get("ProfD", Components.interfaces.nsIFile);
    file.append("quicklaunch.sqlite");

    if (!file.exists()) {
      return false;
    }

    // Upgrade table structure
    var lastDBUpgrade = quicklaunch_getPrefValue('lastDBUpgrade', '0.1');
    if (lastDBUpgrade < '0.4') {
      try {
        var storageService = Components.classes["@mozilla.org/storage/service;1"]
                                       .getService(Components.interfaces.mozIStorageService);
        var mDBConn = storageService.openDatabase(file);

        log('Create new table `myquicklaunch`');
        mDBConn.executeSimpleSQL("CREATE TABLE myquicklaunch (id INTEGER NOT NULL PRIMARY KEY, name VARCHAR(32) NOT NULL UNIQUE, path VARCHAR(1024), args VARCHAR(255))");

        log('Migrate data from `quicklaunch` to `myquicklaunch`');
        mDBConn.executeSimpleSQL('INSERT INTO myquicklaunch (name, path, args) SELECT name, path, args FROM quicklaunchs ');

        log('drop table `quicklaunchs`');
        mDBConn.executeSimpleSQL('DROP TABLE quicklaunchs');
        return true;
      } catch (e) { }

      quicklaunch_setPrefValue('lastDBUpgrade', '0.4');
    }

    return false;
  },

  getLocale: function() {
    return Cc["@mozilla.org/chrome/chrome-registry;1"]
             .getService(Ci.nsIXULChromeRegistry)
             .getSelectedLocale('quicklaunch');
  }
};
