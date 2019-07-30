/* vim: set ts=2 et sw=2 tw=80: */
(function() {
  const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

  var jsm = {};
  Components.utils.import("resource://share_all_cn/sns.jsm", jsm);

  // This is our javascript, which will pop up our message
  var mignore_share_all_cn = false;
  var share_all_cnService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
  var share_all_cnBranch = share_all_cnService.getBranch("extensions.share_all_cn@mozillaonline.com.");

  //URL
  var url_arr = new Array();
  var handle = new Array();
  var count = 1;

  //////////////////////////////////////////////////////////////////////////////
  function checkFromRenren(url) {
    if(/renren\.com/.test(url)) {
      var strbundle = document.getElementById("shareAllCNStrings");
      var disable_lab = strbundle.getString("share_all_cn.disable-from-renren");
      alert(disable_lab);
      return true;
    }
    return false;
  }

  function share_all_cn_showmenutext() {
    try {
      // modified @20101206
      var isImage = false;
      var isDefault = false;
      if(gContextMenu && gContextMenu.onImage) {
        isImage = true;
      } else {
        isImage = false;
      }

      var share_all_cn_pic_default = document.getElementById("share_all_cn_pic_default");
      var share_all_cn_menuitem_default = document.getElementById("share_all_cn_menuitem_default");

      // reset all context menu item as hidden.
      share_all_cn_pic_default.hidden = true;
      share_all_cn_menuitem_default.hidden = true;

      if (isImage) {
        share_all_cn_pic_default.hidden = false;
      } else {
        share_all_cn_menuitem_default.hidden = false;
      }
    } catch(e) { }
  }

  function share_all_cn_topbar() {
    return this;
  }

  var buttonID = 'share-all-cn-bar';
  var viewID = 'PanelUI-share-all-cn-view';

  share_all_cn_topbar.prototype = {
    init : function() {
      createButton();
      logUsage();
    }
  }

  function createButton() {
    let widget = CustomizableUI.getWidget(buttonID);
    if (widget && widget.provider == CustomizableUI.PROVIDER_API) {
      return;
    }

    CustomizableUI.addListener({
      onWidgetAfterDOMChange: function(aNode, aNextNode, aContainer, aWasRemoval) {
        if (aNode.id == buttonID) {
          initShareBar();
        }
      }
    });

    let strbundle = document.getElementById('shareAllCNStrings');
    CustomizableUI.createWidget({
      id: buttonID,
      type: 'button',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      label: strbundle.getString('share_all_cn.button.title'),
      tooltiptext: strbundle.getString('share_all_cn.button.tip'),
      onCreated: (aNode) => {
        aNode.setAttribute('type', 'menu-button');
        let doc = aNode.ownerDocument || document;
        let menupopup = doc.createElement('menupopup');
        menupopup.addEventListener('popupshowing', (aEvent) => {
          showSubViewFromArea(aEvent);
          aEvent.preventDefault();
          aEvent.stopPropagation();
        });
        aNode.appendChild(menupopup);
      },
      onCommand: (aEvent) => {
        let {areaType} = infoFromEvent(aEvent);
        if (areaType == CustomizableUI.TYPE_MENU_PANEL) {
          showSubViewFromArea(aEvent, areaType);
        } else {
          click_share_bar(aEvent);
        }
      }
    });
  }

  var gshare_all_cn_topbar = new share_all_cn_topbar();

  function share_all_cn_showinitmenu() {
    document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", share_all_cn_showmenutext, false);
  }

  function share_all_cn_Load() {
    gshare_all_cn_topbar.init();
  }

  function logUsage() {
    try {
      let jsm = {};
      Cu.import('resource://cmtracking/ExtensionUsage.jsm', jsm);
      jsm.ExtensionUsage.register('share-all-cn-bar', 'window:button',
        'share_all_cn@mozillaonline.com');
    } catch(e) {};
  }

  /**
   * Invoke initializing functions in the timeout function.
   */
  window.addEventListener("load", function() {
    window.setTimeout(function(event) {
      share_all_cn_showinitmenu();
      share_all_cn_Load();
    }, 1000);
  }, false);
  /**
   * contextMenu click function
   * type for pic, url, ...
   * modified @20101205
   */
  function show_share_all_cn_contextMenu(ev, type, val) {
    if(val == null)
      val = getShareDefaultTool();
    do_show_share_all_cn_channel(ev, val, type, false, 'right');
  }

  /*
   * val for channels: renren, sina, kaixin, ...
   * type for pic, url, ...
   * isUpdate for need change default channel or not
   */
  function show_share_all_cn_channel(ev, val, type, isUpdate, from) {
    try {
      do_show_share_all_cn_channel(ev, val, type, isUpdate, from);
    } catch(e) {
    }
  }

  function do_show_share_all_cn_channel(ev, val, type, isUpdate, from) {
    try {
      setShareAllCNDefault(val, isUpdate);
      let url = '';
      let title = '';
      let pic = '';

      let {doc, win} = infoFromEvent(ev);
      try {
        url = win.gContextMenu.linkURL();
        title = win.gContextMenu.linkText();
      } catch (ex) {
        url = win.gBrowser.selectedBrowser.currentURI.spec;
        title = win.gBrowser.selectedBrowser.contentTitle;
      }

      // 如果是通过人人分享，check是否分享了renren自己的页面，如是则不分享
      if(val == 'renren') {
        if(checkFromRenren(url))
          return;
      }

      let focusedWindow = doc.commandDispatcher.focusedWindow;
      let extended = focusedWindow.getSelection.call(focusedWindow).toString();

      if(extended.length > 200)
        extended = extended.substr(0, 200);
      if(title) {
        title += ' ';
      }
      if (ev.target.tagName == 'A') {
        url = ev.target.getAttribute('HREF');
        title = ev.target.text;
      }

      if (!!type && type == 'pic') {
        if (win.gContextMenu.onImage) {
          pic = win.gContextMenu.mediaURL;
          if(!pic) {
            pic = win.gContextMenu.imageURL;
          }
        }
        // sina 微博对pic做特殊处理
        if(val == 'sina') {
          title = '分享图片 ';
          if(!(pic.indexOf('.sina.com', 0) > 0 || pic.indexOf('i1.sinaimg.cn', 0) > 0 || pic.indexOf('i0.sinaimg.cn', 0) > 0 || pic.indexOf('www.sinaimg.cn', 0) > 0 || pic.indexOf('i2.sinaimg.cn', 0) > 0 || pic.indexOf('i3.sinaimg.cn', 0) > 0)) {
            title += pic;
          }
          url = '';
        } else if(val == 'kaixin') {
          try {
            extended = pic;
            title = pic.substring(pic.lastIndexOf('/') + 1, pic.length);
          } catch(ex) {
          }
        } else {
          url = pic;
        }
      }

      try {
        let shareWin = url_arr['handle_' + url_arr[url]];

        if (shareWin && shareWin.open && !shareWin.closed) {
          url_arr['handle_' + url_arr[url]].focus();
        } else {
          share_to_SNS(val, title, url, extended, pic);
        }
      } catch(e) {
        // closed window reference will be gc-ed since fx 16+
        share_to_SNS(val, title, url, extended, pic);
      }

      setStatic(val, type, from);
    } catch(e) {
    }
  }

  function _openInCenter(pageURL, title, w, h) {
    var left = (screen.width / 2) - (w / 2);
    var top = (screen.height / 2) - (h / 2);
    return window.open(pageURL, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
  }

  function share_to_SNS(channelId, title, url, extended, pic) {
    try {
      var h = null;
      let sns = jsm.SNS.getSNSByName(channelId);
      switch(channelId) {
        case 'renren':
        case 'sina':
        case 'kaixin':
        case 'douban':
        case 'qq':
        case 'tqq':
          // renren
          h = _openInCenter(sns.getUrl(title, url, pic, extended), channelId, sns.width, sns.height);
          break;
        case 'live':
          // live
          s_left = (screen.width - 860) / 2;
          h = window.open('https://favorites.live.com/quickadd.aspx?marklet=1&title=' + escape(title) + '&url=' + escape(url) + '&top=1', 'live', 'toolbar=0,status=0,resizable=1,width=860,height=436,left=' + s_left + ',top=' + s_top + ',status=no');
          break;
        case 'mail':
          // mail  @20101206
          var pic = "";
          if(gContextMenu && gContextMenu.onImage) {
            pic = gContextMenu.mediaURL;
            if(!pic) {
              pic = gContextMenu.imageURL;
            }
          }
          var extProtocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);
          var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
          var uri = ioService.newURI(sns.getUrl(title, url, pic, extended), null, null);
          extProtocolSvc.loadUrl(uri);
          break;
      }
      if(null != h) {
        url_arr["handle_" + count] = h;
        url_arr[url] = count;
        count = count + 1;
      }
    } catch(e) {
    }
  }

  /**
   * @param {} val: for channel, like renren, sina, ...
   * @param {} isUpdate: is need update
   */

  function shareBarSetIcon(choice) {
    let iconList = ["shareChannel_renren",
                    "shareChannel_sina",
                    "shareChannel_kaixin",
                    "shareChannel_douban",
                    "shareChannel_qq",
                    "shareChannel_mail",
                    "shareChannel_tqq",
                    "shareChannel_no"];
    let widget = CustomizableUI.getWidget(buttonID);
    try {
      widget.instances.forEach((instance) => {
        let shareBar = instance.node;
        iconList.forEach((icon) => shareBar.classList.remove(icon));
        shareBar.classList.add(choice);
      });
    } catch(e) {}
  }

  function setShareAllCNDefault(val, isUpdate) {
    try {
      if(!isUpdate)
        return;
      switch(val) {
        case 'renren':
          shareBarSetIcon("shareChannel_renren");
          setShareDefaultTool('renren');
          break;
        case 'sina':
          shareBarSetIcon("shareChannel_sina");
          setShareDefaultTool('sina');
          break;
        case 'kaixin':
          shareBarSetIcon("shareChannel_kaixin");
          setShareDefaultTool('kaixin');
          break;
        case 'douban':
          shareBarSetIcon("shareChannel_douban");
          setShareDefaultTool('douban');
          break;
        case 'qq':
          shareBarSetIcon("shareChannel_qq");
          setShareDefaultTool('qq');
          break;
        case 'live':
          shareBarSetIcon("shareChannel_live");
          setShareDefaultTool('live');
          break;
        case 'mail':
          // @20101206
          shareBarSetIcon("shareChannel_mail");
          setShareDefaultTool('mail');
          break;
        case 'tqq':
          // @20101206
          shareBarSetIcon("shareChannel_tqq");
          setShareDefaultTool('tqq');
          break;
        case 'no':
          shareBarSetIcon("shareChannel_no");
          setShareDefaultTool('no');
          break;
      }
    } catch(e) {
    }
  }

  function infoFromEvent(aEvent) {
    let doc = aEvent.target && aEvent.target.ownerDocument || document;
    let win = doc && doc.defaultView || window;
    let widgetGroup = CustomizableUI.getWidget(buttonID);
    return {
      doc: doc,
      win: win,
      widget: widgetGroup.forWindow(win),
      areaType: widgetGroup.areaType
    };
  }

  function showSubView(aWin, aAnchor, aArea) {
    let view = aWin.document.getElementById(viewID);
    view.addEventListener('ViewShowing', onViewShowing);
    view.addEventListener('ViewHiding', onViewHiding);
    aAnchor.setAttribute('closemenu', 'none');
    aWin.PanelUI.showSubView(viewID, aAnchor, aArea);
  }

  function showSubViewFromArea(aEvent, aAreaType) {
    let {doc, win, widget, areaType} = infoFromEvent(aEvent);
    if ((aAreaType || areaType) == CustomizableUI.TYPE_MENU_PANEL) {
      showSubView(win, widget.node, CustomizableUI.AREA_PANEL);
    } else {
      CustomizableUI.hidePanelForNode(widget.node);
      let dm = doc.getAnonymousElementByAttribute(widget.anchor, 'anonid', 'dropmarker');
      let anchor = dm ?
                   doc.getAnonymousElementByAttribute(dm, 'class', 'dropmarker-icon') :
                   widget.anchor;
      showSubView(win, anchor, CustomizableUI.AREA_NAVBAR);
    }
  }

  function onViewShowing(aEvent) {
    let {widget} = infoFromEvent(aEvent);
    widget.anchor.setAttribute('open', 'true');
    aEvent.target.removeEventListener('ViewShowing', onViewShowing);
  }

  function onViewHiding(aEvent) {
    let {widget} = infoFromEvent(aEvent);
    widget.anchor.removeAttribute('open');
    aEvent.target.removeEventListener('ViewHiding', onViewHiding);
  }

  function click_share_bar(aEvent) {
    try {
      if(aEvent.target.tagName != 'toolbarbutton') {
        return;
      }
      var defaultTool = getShareDefaultTool();
      var from = 'navi';
      if(defaultTool == 'no') {
        // 直接打开菜单
        var menubar = document.getElementById(buttonID);
        menubar.open = true;

        setStatic('no', 'url', from);
      } else if(defaultTool == 'renren') {
        do_show_share_all_cn_channel(aEvent, 'renren', 'url', false, from);
      } else if(defaultTool == 'sina') {
        do_show_share_all_cn_channel(aEvent, 'sina', 'url', false, from);
      } else if(defaultTool == 'kaixin') {
        do_show_share_all_cn_channel(aEvent, 'kaixin', 'url', false, from);
      } else if(defaultTool == 'douban') {
        do_show_share_all_cn_channel(aEvent, 'douban', 'url', false, from);
      } else if(defaultTool == 'qq') {
        do_show_share_all_cn_channel(aEvent, 'qq', 'url', false, from);
      } else if(defaultTool == 'live') {
        do_show_share_all_cn_channel(aEvent, 'live', 'url', false, from);
      } else if(defaultTool == 'mail') {
        do_show_share_all_cn_channel(aEvent, 'mail', 'url', false, from);
      } else if(defaultTool == 'tqq') {
        do_show_share_all_cn_channel(aEvent, 'tqq', 'url', false, from);
      }
    } catch(ex) {}
  }

  function initShareBar() {
    var defaultTool = getShareDefaultTool();
    setShareAllCNDefault(defaultTool, true);
  }

  // get Share Default Tool, if none, set 'no'
  function getShareDefaultTool() {
    var name = Application.prefs.getValue("extensions.share_all_cn@mozillaonline.com.defaultTool", 'no');
    return null == jsm.SNS.getSNSByName(name) ? "no" : name;
  }

  // set Share Default Tool
  function setShareDefaultTool(val) {
    try {
      Application.prefs.setValue("extensions.share_all_cn@mozillaonline.com.defaultTool", val);
    } catch(e) {}
  }

  // ajax
  function setStatic(source, type, from) {
    var tracker = Components.classes["@mozilla.com.cn/tracking;1"];
    if (!tracker || !tracker.getService().wrappedJSObject.ude) {
      return;
    }
    try {
      var url = "http://addons.g-fox.cn/sharetool.gif?s=" + source + "&t=" + type + "&f=" + from + "&cid=" + Application.prefs.getValue("app.chinaedition.channel", "www.firefox.com.cn") + "&r=" + Math.random();
      var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
      req.open('GET', url, true);
      req.send(null);
    } catch(e) {
    }
  }

  //get nav-bar pref
  function getShareToolPref() {
    return Application.prefs.getValue("extensions.share_all_cn@mozillaonline.com.manuallyRemovedShareToolButton", false);
  }

  // set Share Default Tool
  function setShareToolPref(val) {
    try {
      Application.prefs.setValue("extensions.share_all_cn@mozillaonline.com.manuallyRemovedShareToolButton", val);
    } catch(e) {
    }
  }

  var ns = MOA.ns("ShareAllCNTool");
  ns.show_share_all_cn_channel = function(ev, val, type, isUpdate, from) {
    return show_share_all_cn_channel(ev, val, type, isUpdate, from);
  };

  ns.show_share_all_cn_contextMenu = function(ev, type, val) {
    return show_share_all_cn_contextMenu(ev, type, val);
  };

  ns.click_share_bar = function(ev) {
    return click_share_bar(ev);
  };
})();
