# -*- coding:utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import time
import libs.sysUtils as util

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

print "1"
dcap = dict(DesiredCapabilities.PHANTOMJS)  #设置useragent
dcap['phantomjs.page.settings.userAgent'] = ('Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36')  #根据需要设置具体的浏览器信息
driver = webdriver.PhantomJS(desired_capabilities=dcap)  #封装浏览器信息
driver.get("http://dict.youdao.com/")
driver.set_page_load_timeout(3)
driver.maximize_window()
driver.save_screenshot("origin.png")

print "2"
driver.execute_script("window.scrollTo(0,document.body.scrollHeight)")
time.sleep(5)
driver.save_screenshot("now.png")

time.sleep(2)
driver.close()
driver.quit()