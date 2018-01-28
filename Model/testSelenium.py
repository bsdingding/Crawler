# -*- coding:utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import time
import re
import libs.sysUtils as util

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

print "Initialize"
dcap = dict(DesiredCapabilities.PHANTOMJS)  #设置useragent
dcap['phantomjs.page.settings.userAgent'] = ('Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36')  #根据需要设置具体的浏览器信息
driver = webdriver.PhantomJS(desired_capabilities=dcap)  #封装浏览器信息
driver.get("https://models.com/account/settings/index.cfm?login")
driver.set_page_load_timeout(5)
driver.maximize_window()
driver.save_screenshot("screenShots/Login.png")

print "Login"
driver.find_element_by_id("LoginUSERID").send_keys("dxj0623@163.com")
driver.find_element_by_name("PASSWORD").send_keys("xiangxiang0623", Keys.ENTER)

print "Crawling"
driver.get("https://models.com/db/advertising")
driver.set_page_load_timeout(10)
time.sleep(10)
driver.maximize_window()
driver.save_screenshot("screenShots/data0.png")


# 拉去的次数上限
maxRolling = 100000
i = 0
last_len = 0

# 判断是否有新内容出现的阈值
newContentTag = 1000
source = ""

# 未拉到新内容重试次数
retry_num = 5
try:
    while i < maxRolling:
        print "i = " + str(i),
        driver.execute_script("window.scrollTo(0,document.body.scrollHeight)")
        driver.set_page_load_timeout(10)
        time.sleep(5)
        # driver.save_screenshot("data"+str(i)+".png")

        # driver.switch_to_window(driver.window_handles[0])
        # print driver.get_window_rect()
        # print driver.get_window_position()
        # print driver.get_window_rect()
        # print driver.get_window_size()
        source = driver.page_source
        cur_len = len(source)
        print cur_len, cur_len - last_len
        if cur_len - last_len < newContentTag:
            print "Retry time = " + str(5 - retry_num + 1)
            time.sleep(30)
            retry_num -= 1
            if retry_num == 0:
                break
        else:
            last_len = cur_len
            retry_num = 5
            i += 1
except Exception, e:
    print "Failed to Crawling, Stop Here i = " + str(i)
    print e
finally:
    util.printFile(source, "res/page.txt")

campaignPattern = re.compile("<div class=\"small-12 medium-12 columns mdcsearchResultsRecord\">.*?<a class=\"saveWorkSet.*?href=\"(.*?)\" title=\"(.*?)\"", re.S)
campaignList = re.findall(campaignPattern, source)
base_url = "https://models.com"

titles = []
hrefs = []
for item in campaignList:
    href = base_url + item[0]
    title = item[1]
    # print "href:\t" + href
    # print "title:\t" + title
    # print "***********************************************"
    titles.append(title)
    hrefs.append(href)
print len(campaignList)
print len(titles)
print len(hrefs)
util.list2File(titles, "res/titles.txt")
util.list2File(hrefs, "res/link.txt")

# 获得cookie信息
# cookie = driver.get_cookies()

#将获得cookie的信息打印
# print cookie

time.sleep(2)
driver.close()
driver.quit()