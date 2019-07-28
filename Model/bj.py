# -*- coding:utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import time, pickle, os
import libs.sysUtils as util

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

print "Initialize"
#dcap = dict(DesiredCapabilities.PHANTOMJS)  #设置useragent
#dcap['phantomjs.page.settings.userAgent'] = ('Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36')  #根据需要设置具体的浏览器信息
#driver = webdriver.PhantomJS(desired_capabilities=dcap)  #封装浏览器信息

driver = webdriver.Chrome(executable_path='./chromedriver')

url = "http://aibjx.org/plugin.php?id=levgift:levgift"

def dumpCookie():
    driver.get("http://aibjx.org/plugin.php?id=levgift:levgift")
    while True:
        print "please login"
        time.sleep(30)
        print "dumping"
        while driver.current_url == url:
            tmpCookies = driver.get_cookies()
            cookies = {}
            for item in tmpCookies:
                cookies[item['name']] = item['value']
            filename = open('Cookie/cookie.pickle', 'wb')
            pickle.dump(cookies, filename)
            filename.close()
            return cookies


def readCookie():
    filename = open('Cookie/cookie.pickle', 'rb')
    return pickle.load(filename)



def foo(cookies):
    driver.get("http://aibjx.org/plugin.php?id=levgift:levgift")
    #import pdb; pdb.set_trace()
    for cookie in cookies:
        driver.add_cookie({
            "domain":"aibjx.org",
            "name":cookie,
            "value":cookies[cookie],
            "path":'/',
            "expires":None
        })
    driver.get("http://aibjx.org/plugin.php?id=levgift:levgift")
    
    driver.set_page_load_timeout(5)
    #driver.maximize_window()
    driver.save_screenshot("screenShots/Login.png")

    #driver.close()
    #driver.quit()


if __name__ == "__main__":
    #dumpCookie()
    cookies = readCookie()
    foo(cookies)
    




