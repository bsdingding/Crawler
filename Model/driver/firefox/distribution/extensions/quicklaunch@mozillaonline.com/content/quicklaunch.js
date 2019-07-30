/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var ceQuickLaunch = {
  handleEvent: function UC_handleEvent(aEvent) {
    switch (aEvent.type) {
      case "load":
        setTimeout(this.onLoad.bind(this), 500);
        break;
      case "unload":
        this.onUnload();
        break;
    }
  },

  log: function(msg) {
    if (!this.console) {
      this.console = Components.classes["@mozilla.org/consoleservice;1"]
                               .getService(Components.interfaces.nsIConsoleService);
    }
    this.console.logStringMessage("quicklaunch: " + msg);
  },

  setPrefValue: function(prefName, value) {
    try {
      var prefs = Application.prefs;
      var name = "extensions.quicklaunch@mozillaonline.com." + prefName;
      return prefs.setValue(name, value);
    } catch(e) {
      Components.utils.reportError(e);
    }
  },

  getPrefValue: function(prefName, defValue) {
    try {
      var prefs = Application.prefs;
      var name = "extensions.quicklaunch@mozillaonline.com." + prefName;
      return prefs.getValue(name, defValue);
    } catch (e) {
      Components.utils.reportError(e);
    }
  },

  init: function() {
    try {
      this.rebuild_addonbar();
    } catch (e) {
      Components.utils.reportError(e);
    }
  },

  runProc: function(fileName, args) {
    try {
      var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

      file.initWithPath(fileName);
      var process=Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
      process.init(file);
      var argsArr = args.split(" ");
      process.run(false, argsArr, argsArr.length);
    } catch(e) {
      this.log(e);
    }
  },

  runProcInWinD: function(relPath, args) {
    try {
      var winDir = Components.classes["@mozilla.org/file/directory_service;1"].
        getService(Components.interfaces.nsIProperties).get("WinD", Components.interfaces.nsILocalFile);
      var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(winDir.path + "\\" +relPath);
      var process=Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
      process.init(file);
      process.run(false, args, args.length);
    } catch(e) {
      Components.utils.reportError(e);
    }
  },

  printScreen: function() {
    var mainwin = document.getElementById("main-window");
    if (!mainwin.getAttribute("xmlns:html"))
        mainwin.setAttribute("xmlns:html", "http://www.w3.org/1999/xhtml");

    var content = window.content;
    var desth = content.innerHeight + content.scrollMaxY;
    var destw = content.innerWidth + content.scrollMaxX;

    // Unfortunately there is a limit:
    if (desth > 16384) desth = 16384;

    var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
    var ctx = canvas.getContext("2d");

    canvas.height = desth;
    canvas.width = destw;
    ctx.clearRect(0, 0, destw, desth);
    ctx.save();
    ctx.drawWindow(content, 0, 0, destw, desth, "rgb(255,255,255)");

    return canvas.toDataURL("image/png", "");
  },

  toProfileManager: function() {
    const wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                         .getService(Components.interfaces.nsIWindowMediator);
    var promgrWin = wm.getMostRecentWindow("mozilla:profileSelection");
    if (promgrWin) {
      promgrWin.focus();
    } else {
      var params = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
                             .createInstance(Components.interfaces.nsIDialogParamBlock);
      params.SetNumberStrings(1);
      params.SetString(0, "menu");
      window.openDialog("chrome://quicklaunch/content/profileSelection.xul",
                        "",
                        "centerscreen,chrome,titlebar",
                        params);
    }
    // Here, we don't care about the result code
    // that was returned in the param block.
  },

  getScreenShot: function() {
    function runProc(relPath,args){
      try{
        var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
        file.initWithPath(relPath);
        var process=Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
        process.init(file);
        process.runw(false, args, args.length);
      }catch(e){alert(e);}
    }

    function printScreen() {
      var mainwin = document.getElementById("main-window");
      if (!mainwin.getAttribute("xmlns:html"))
          mainwin.setAttribute("xmlns:html", "http://www.w3.org/1999/xhtml");

      var content = window.content;
        if (content.document instanceof XULDocument) {
            var insideBrowser = content.document.querySelector('browser');
            content = insideBrowser ? insideBrowser.contentWindow : content;
        }
      var desth = content.innerHeight + content.scrollMaxY;
      var destw = content.innerWidth + content.scrollMaxX;

      // Unfortunately there is a limit:
      if (desth > 16384) desth = 16384;

      var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
      var ctx = canvas.getContext("2d");

      canvas.height = desth;
      canvas.width = destw;
      ctx.clearRect(0, 0, destw, desth);
        ctx.save();
      ctx.drawWindow(content, 0, 0, destw, desth, "rgb(255,255,255)");
      return canvas.toDataURL("image/png", "");
    }
    function iso8601FromDate(date, punctuation) {
      var string = date.getFullYear().toString();
      if (punctuation) {
        string += "-";
      }
      string += (date.getMonth() + 1).toString().replace(/\b(\d)\b/g, '0$1');
      if (punctuation) {
        string += "-";
      }
      string += date.getDate().toString().replace(/\b(\d)\b/g, '0$1');
      if (1 || date.time) {
  //      string += "T";
        string += date.getHours().toString().replace(/\b(\d)\b/g, '0$1');
        if (punctuation) {
          string += ":";
        }
        string += date.getMinutes().toString().replace(/\b(\d)\b/g, '0$1');
        if (punctuation) {
          string += ":";
        }
        string += date.getSeconds().toString().replace(/\b(\d)\b/g, '0$1');
        if (date.getMilliseconds() > 0) {
          if (punctuation) {
            string += ".";
          }
          string += date.getMilliseconds().toString();
        }
      }
      return string;
    }
    var _stringBundle = document.getElementById("quicklaunchStrings");
    var data = printScreen();
    var file = Cc["@mozilla.org/file/directory_service;1"]
                         .getService(Ci.nsIProperties)
                         .get("Desk", Ci.nsIFile);
    var filename = _stringBundle.getFormattedString("quicklaunch-screenShotFile",[iso8601FromDate(new Date()) + ".png"]);
    file.append(filename);
    file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt('0666', 8));

    var io = Cc["@mozilla.org/network/io-service;1"]
                  .getService(Ci.nsIIOService);
    var source = io.newURI(data, "UTF8", null);
    var target = io.newFileURI(file)
    // prepare to save the canvas data
    var persist = Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
                            .createInstance(Ci.nsIWebBrowserPersist);

    persist.persistFlags = Ci.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
    persist.persistFlags |= Ci.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
    // save the canvas data to the file
    var policy = Ci.nsIHttpChannel.REFERRER_POLICY_NO_REFERRER;
    if (!isNaN(policy)) {
      // extra referer policy required since Fx 36 <https://bugzil.la/704320>
      persist.saveURI(source, null, null, policy, null, null, file, null);
    } else {
      persist.saveURI(source, null, null, null, null, file, null);
    }
    if (Services.appinfo.OS == "WINNT"){
      var winDir = Cc["@mozilla.org/file/directory_service;1"].
        getService(Ci.nsIProperties).get("WinD", Ci.nsILocalFile);
      runProc(winDir.path + "\\system32\\mspaint.exe",[file.path]);
    } else if (Services.appinfo.OS == "Darwin") {
      runProc("/usr/bin/open", ['-a', 'Preview', file.path]);
    } else {
      var message = _stringBundle.getFormattedString("quicklaunch-screenShotSaved",[file.path]);
      alert(message)
    }
  },

  rebuild_addonbar: function() {
    var isWin = Services.appinfo.OS == "WINNT";
    var isCN = quicklaunchModule.getLocale() == 'zh-CN';
    var strbundle = document.getElementById("quicklaunchStrings");
    if (isWin) {
      // recreate these widgets for every call
      var widgets = CustomizableUI.getWidgetsInArea(CustomizableUI.AREA_NAVBAR);
      widgets.forEach(function(aWidget) {
        if (!aWidget || !aWidget.id) {
          return;
        }

        if (!aWidget.id.startsWith("qc-default-") &&
            !aWidget.id.startsWith("qc-customized")) {
          return;
        }

        CustomizableUI.destroyWidget(aWidget.id);
      });

      var userList = this.getPrefValue("addonbarlist", "");
      if (userList != "") {
        var userListArray = userList.split(",");
        var button;
        for(var i = 0; i < userListArray.length; i++){
          var id = userListArray[i].trim();
          if ('' == id) {
            continue;
          }

          this.buildButton(userListArray[i]);
        }
      }
    }

    // Show screen capture menu item from xul if zh-CN.
    if (isCN) {
      document.getElementById('quicklaunch-paintWebpage-button').hidden = false;
    }

    // create the main button only if not existed yet
    var id = "quickluanch-addonbar-item";
    var area = CustomizableUI.AREA_PANEL;

    var widget = CustomizableUI.getWidget(id);
    if (widget && widget.provider == CustomizableUI.PROVIDER_API) {
      return;
    }

    /*
     * On windows there is a long list of default menu items.
     * If zh-CN there is screen capture menu item.
     */
    if (isWin || isCN) {
      var prefKey = "extensions.quicklaunch@mozillaonline.com.ff4_version";
      if (Services.prefs.prefHasUserValue(prefKey)) {
        var migrationListener = {
          onWidgetAdded: function(aWidgetId, aArea) {
            if (aWidgetId == id && aArea != CustomizableUI.AREA_ADDONBAR) {
              CustomizableUI.removeListener(migrationListener);
              Services.prefs.clearUserPref(prefKey);

              var addonbar = document.getElementById(CustomizableUI.AREA_ADDONBAR);
              if (addonbar && addonbar._currentSetMigrated.has(id)) {
                CustomizableUI.addWidgetToArea(id, area);
                addonbar._currentSetMigrated.delete(id);
                addonbar._updateMigratedSet();
              };
            }
          }
        };

        CustomizableUI.addListener(migrationListener);
      }

      CustomizableUI.createWidget(
        { id : id,
          type : "view",
          viewId : "quicklaunch-PanelUI-View",
          defaultArea : area,
          label : strbundle.getString("quicklaunch-label"),
          tooltiptext : strbundle.getString("quicklaunch-label"),
          onViewShowing: this.onQuicklaunchPopupShown
        });
    } else {
      CustomizableUI.createWidget(
        {
          id : id,
          type : "button",
          defaultArea : area,
          label : strbundle.getString("quicklaunch-label"),
          tooltiptext : strbundle.getString("quicklaunch-label"),
          onCommand: function(aEvt) {
            var doc = aEvt.target && aEvt.target.ownerDocument;
            var win = doc && doc.defaultView;
            if (!win) {
              return;
            }

            win.ceQuickLaunch.toProfileManager();
          }
        });
    }
  },

  buildButton: function(buttonID) {
    var strbundle = document.getElementById("quicklaunchStrings");
    if (isNaN(buttonID)) {
      if (["notepad", "mspaint", "calc", "myComputer",
           "paintWebpage", "switchProfile"].indexOf(buttonID) > -1) {
        var id = "qc-default-" + buttonID;

        var widget = CustomizableUI.getWidget(id);
        if (widget && widget.provider == CustomizableUI.PROVIDER_API) {
          return;
        }

        CustomizableUI.createWidget(
          { id : id,
            type : "button",
            defaultArea : CustomizableUI.AREA_NAVBAR,
            label : strbundle.getString("quicklaunch-" + buttonID),
            tooltiptext : strbundle.getString("quicklaunch-" + buttonID),
            removable: false,
            onCreated: function(aNode) {
              aNode.classList.add("quicklaunch-addonbar");
              aNode.setAttribute("image", "chrome://quicklaunch/skin/image/" + buttonID + ".png");
            },
            onCommand: function(aEvt) {
              var doc = aEvt.target && aEvt.target.ownerDocument;
              var win = doc && doc.defaultView;
              if (!win) {
                return;
              }

              switch(buttonID) {
                case "notepad":
                  win.ceQuickLaunch.runProcInWinD('notepad.exe',['']);
                  break;
                case "mspaint":
                  win.ceQuickLaunch.runProcInWinD('system32\\mspaint.exe',['']);
                  break;
                case "calc":
                  win.ceQuickLaunch.runProcInWinD('system32\\calc.exe',['']);
                  break;
                case "myComputer":
                  win.ceQuickLaunch.runProcInWinD('explorer.exe',['::{20d04fe0-3aea-1069-a2d8-08002b30309d}']);
                  break;
                case "paintWebpage":
                  win.ceQuickLaunch.getScreenShot();
                  break;
                case "switchProfile":
                  win.ceQuickLaunch.toProfileManager();
                  break;
              }
            }
          });
      }
    } else {
      var id, name, path, args;
      var file = Cc["@mozilla.org/file/directory_service;1"]
              .getService(Ci.nsIProperties)
              .get("ProfD", Ci.nsIFile);
      file.append("quicklaunch.sqlite");
      var storageService = Cc["@mozilla.org/storage/service;1"]
                   .getService(Ci.mozIStorageService);
      var mDBConn = storageService.openDatabase(file);
      var statement = mDBConn.createStatement("SELECT id,name,path,args FROM myquicklaunch WHERE id=:id");
      statement.params.id = buttonID;
      try {
        while(statement.executeStep()) {
          id = statement.getInt32(0);
          name = statement.getUTF8String(1);
          path = statement.getUTF8String(2);
          args = statement.getUTF8String(3);

          var id = "qc-customized-" + id;

          var widget = CustomizableUI.getWidget(id);
          if (widget && widget.provider == CustomizableUI.PROVIDER_API) {
            return;
          }

          CustomizableUI.createWidget(
            { id : id,
              type : "button",
              defaultArea : CustomizableUI.AREA_NAVBAR,
              label : name,
              tooltiptext : name,
              removable: false,
              onCreated: function(aNode) {
                aNode.classList.add("quicklaunch-addonbar");
                aNode.setAttribute("image", "moz-icon:file:///" + path);
              },
              onCommand: function(aEvt) {
                var doc = aEvt.target && aEvt.target.ownerDocument;
                var win = doc && doc.defaultView;
                win.ceQuickLaunch.runProc(path, args);
              }
            });
        }
      } finally{
        statement.reset();
      }
    }
  },

  manageQuickLaunch: function() {
    const wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                         .getService(Components.interfaces.nsIWindowMediator);
    var promgrWin = wm.getMostRecentWindow( "mozilla:quickLaunchManager" );
    if (promgrWin) {
      promgrWin.focus();
    } else {
      var params = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
                             .createInstance(Components.interfaces.nsIDialogParamBlock);
      params.SetNumberStrings(1);
      params.SetString(0, "menu");
      window.openDialog("chrome://quicklaunch/content/quickLaunchManager.xul",
                        "",
                        "centerscreen,chrome,titlebar,modal",
                        params);
    }
  },

  onQuicklaunchPopupShown: function(event) {
    if (Services.appinfo.OS != "WINNT") {
      return;
    }

    var doc = event.target && event.target.ownerDocument;
    var win = doc && doc.defaultView;
    if (!win) {
      return;
    }

    var file = Components.classes["@mozilla.org/file/directory_service;1"]
                         .getService(Components.interfaces.nsIProperties)
                         .get("ProfD", Components.interfaces.nsIFile);
    file.append("quicklaunch.sqlite");
    if (!file.exists()  || file.fileSize == 0) {
      return;
    }

    var storageService = Components.classes["@mozilla.org/storage/service;1"]
                                   .getService(Components.interfaces.mozIStorageService);
    var mDBConn = storageService.openDatabase(file);

    var popup = doc.getElementById('quicklaunch-PanelUI-View');
    var items = popup.querySelectorAll('toolbarbutton.user-customized-item');
    for (let i = 0; i < items.length; i++) {
      popup.removeChild(items[i]);
    }

    var statement = mDBConn.createStatement("SELECT id,name,path,args FROM myquicklaunch");
    try {
      let hasItem = false;
      while (statement.executeStep()) {
        hasItem = true;
        id = statement.getInt32(0);
        name = statement.getUTF8String(1);
        path = statement.getUTF8String(2);
        args = statement.getUTF8String(3);
        var toolbarButton = doc.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
        toolbarButton.setAttribute('class', 'subviewbutton user-customized-item');
        toolbarButton.setAttribute('label', name);
        toolbarButton.setAttribute('image', 'moz-icon:file:///' + path);
        toolbarButton.setAttribute('commandPath', path);
        toolbarButton.setAttribute('commandArgs', args);
        toolbarButton.setAttribute('oncommand', 'ceQuickLaunch.runProc(this.getAttribute(\'commandPath\'),this.getAttribute(\'commandArgs\'));');
        try {
          popup.insertBefore(toolbarButton, doc.getElementById('quicklaunch-separator-manage'));
        } catch(e) {
          continue;
        }
      }
      doc.getElementById('quicklaunch-separator-manage').hidden = !hasItem;
    } catch(e) {
      Components.utils.reportError("Error occurs when rebuild menu: " +
                                   mDBConn.lastErrorString);
    } finally {
      statement.reset();
    }
  },

  QueryInterface: function(aIID) {
    if (aIID.equals(Components.interfaces.nsIObserver) ||
      aIID.equals(Components.interfaces.nsISupports) ||
      aIID.equals(Components.interfaces.nsISupportsWeakReference)) {
      return this;
    }
    throw Components.results.NS_NOINTERFACE;
  },

  observe: function(subject, topic, data) {
    if (topic == 'nsPref:changed') {
      if (data == 'extensions.quicklaunch@mozillaonline.com.addonbarlist' ||
          data == 'extensions.quicklaunch@mozillaonline.com.addonbarlist_changetime') {
        this.rebuild_addonbar();
      }
    }
  },

  onLoad: function() {
    Components.utils.import('resource://quicklaunch/quicklaunch.jsm');
    this.init();
    // upgrade database, if upgraded, then rebuid the quicklaunch menu.
    quicklaunchModule.upgradeDB();
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService)
                 .QueryInterface(Components.interfaces.nsIPrefBranch2);
    pref.addObserver('extensions.quicklaunch@mozillaonline.com.', this, true);
  },

  onUnload: function() {
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService)
                 .QueryInterface(Components.interfaces.nsIPrefBranch2);
    pref.removeObserver('extensions.quicklaunch@mozillaonline.com.', this, true);
  },
};

window.addEventListener("load", ceQuickLaunch, false);
window.addEventListener('unload', ceQuickLaunch, false);

