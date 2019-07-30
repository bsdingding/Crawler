/* vim: set ts=2 et sw=2 tw=80: */
var EXPORTED_SYMBOLS = ["SNS"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyGetter(this, "stringBundle", function() {
  return Cc["@mozilla.org/intl/stringbundle;1"]
          .getService(Ci.nsIStringBundleService)
          .createBundle("chrome://share_all_cn/locale/share_all_cn.properties");
});

XPCOMUtils.defineLazyGetter(this, "Application", function() {
  return Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
});

var _sns = {
  renren: {
    name: "renren",
    icon: "chrome://share_all_cn/skin/renren.png",
    height: 350,
    width: 600,
    getUrl: function(title, url, pic, extended) {
      return "http://share.renren.com/share/buttonshare.do?from=firefox&title="
              + encodeURIComponent(title)
              + "&link=" + encodeURIComponent(url);
    }
  },

  sina: {
    name: "sina",
    icon: "chrome://share_all_cn/skin/sina.png",
    height: 380,
    width: 630,
    getUrl: function(title, url, pic, extended) {
      return "http://v.t.sina.com.cn/share/share.php?appkey=1203606049&source=firefox&title="
              + encodeURIComponent(extended + "  ")
              + encodeURIComponent(title)
              + "&url=" + encodeURIComponent(url)
              + "&pic=" + encodeURIComponent(pic);
    }
  },

  kaixin: {
    name: "kaixin",
    icon: "chrome://share_all_cn/skin/kaixin.png",
    height: 350,
    width: 580,
    getUrl: function(title, url, pic, extended) {
      return "http://www.kaixin001.com/repaste/share.php?from=firefox&rtitle="
              + encodeURIComponent(title)
              + "&rurl=" + encodeURIComponent(url)
              + "&rcontent=" + encodeURIComponent(extended);
    }
  },

  douban: {
    name: "douban",
    icon: "chrome://share_all_cn/skin/douban.png",
    height: 350,
    width: 500,
    getUrl: function(title, url, pic, extended) {
      return "http://www.douban.com/recommend/?from=firefox&title="
              + encodeURIComponent(title)
              + "&url=" + encodeURIComponent(url)
              + "&comment=" + encodeURIComponent(extended) + "&v=1";
    }
  },

  // qzone
  qq: {
    name: "qq",
    icon: "chrome://share_all_cn/skin/qq.png",
    height: 436,
    width: 626,
    getUrl: function(title, url, pic, extended) {
      return "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?from=firefox&title="
              + encodeURIComponent(title)
              + "&url=" + encodeURIComponent(url)
              + "&desc=" + encodeURIComponent(extended ? extended : title);
    }
  },

  tqq: {
    name: "tqq",
    icon: "chrome://share_all_cn/skin/tqq.png",
    height: 436,
    width: 650,
    getUrl: function(title, url, pic, extended) {
      var _appkey = encodeURI("5e70da2800fb4c029072ee3df2344d79");
      var _site = encodeURI("http://firefox.com.cn");

      // new param, not currently included in the final url, will give user a option to follow mozilla_firefox@t.qq.com which is checked by default.
      // var _ass = "mozilla_firefox";
      return "http://share.v.t.qq.com/index.php?c=share&a=index&url="
              + encodeURIComponent(url)
              + "&appkey=" + _appkey
              + "&pic=" + pic
              + "&site=" + _site
              + "&title=" + encodeURIComponent(title);
    }
  },

  mail: {
    name: "mail",
    icon: "chrome://share_all_cn/skin/mail.png",
    height: 436,
    width: 626,
    getUrl: function(title, url, pic, extended) {
      var lab_mail = stringBundle.GetStringFromName("share_all_cn.mail");
      var body = encodeURIComponent(title) + '%0D%0A' + encodeURIComponent(url)+ '%0D%0A' +
          encodeURIComponent(extended) + '%0D%0A' + encodeURIComponent(pic) + '%0D%0A' +
          encodeURIComponent(lab_mail);
      return "mailto:?subject=" + encodeURIComponent(title) + "&body=" + body;
    }
  }
};

var SNS = {
  getSNSPrefName: function() {
    return "extensions.share_all_cn@mozillaonline.com.defaultTool";
  },

  /**
   * Return current share tool object.
   * If null, return qq as the current.
   */
  getCurrentSNS: function() {
    var sns = this.getSNSByName(Application.prefs.getValue(this.getSNSPrefName(), "qq"));
    return sns ? sns : this.getSNSByName("qq");
  },

  getSNSByName: function(name) {
    return _sns[name];
  }
};
