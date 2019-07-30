# -*- coding:utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.options import Options
import time, pickle, os
import libs.sysUtils as util

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

print "Initialize"
#dcap = dict(DesiredCapabilities.PHANTOMJS)  #设置useragent
#dcap['phantomjs.page.settings.userAgent'] = ('Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36')  #根据需要设置具体的浏览器信息
#driver = webdriver.PhantomJS(desired_capabilities=dcap)  #封装浏览器信息

def initChromeDriver():
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--hide-scrollbars')
    chrome_options.add_argument('blink-settings=imagesEnabled=false')
    chrome_options.add_argument('--headless')
    driver = webdriver.Chrome(executable_path='./chromedriver', options=chrome_options)
    return driver


def initFirefoxDriver():
    options = webdriver.FirefoxOptions()
    options.add_argument('-headless')

    geckodriver = './driver/geckodriver'
    browser = webdriver.Firefox(executable_path=geckodriver, firefox_options=options, firefox_binary="./driver/firefox/firefox")

    browser.get('https://www.duckduckgo.com')
    browser.save_screenshot("screenshots/duck.png")
    browser.quit()



def retry_get(driver, url, retry=3):
    count = 0
    while count < retry:
        count += 1
        try:
            driver.get(url)
        except:
            time.sleep(5)
            continue
        return

def reload(driver):
    print "Reloading..."
    retry_get(driver, "http://aibjx.org/plugin.php?id=levgift:levgift")
    driver.set_page_load_timeout(5)
    time.sleep(2)


def parseTime(timeStr):
    tmp = timeStr.split(":")
    try:
        second = int(tmp[2].strip())
        minute = int(tmp[1].strip())
        res = minute * 60 + second + 1
    except Exception as e:
        print "Parse Time Error: {}".format(timeStr)
        res = 60
    return res


url = "http://aibjx.org/plugin.php?id=levgift:levgift"
checkinUrl = "http://aibjx.org/plugin.php?id=dsu_paulsign:sign"

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


def checkin(driver):
    smile = driver.find_element_by_id("kx")
    ActionChainsDriver = ActionChains(driver).click(smile)
    ActionChainsDriver.perform()
    time.sleep(2)
    checkin = driver.find_element_by_class_name("btn")
    ActionChainsDriver = ActionChains(driver).click(checkin)
    ActionChainsDriver.perform()
    time.sleep(10)


def readCookie():
    filename = open('Cookie/cookie.pickle', 'rb')
    return pickle.load(filename)


def clickGift(driver):
    while True:
        giftElement = driver.find_element_by_id("isgetgift")
        if giftElement.text == u'\u9886\u53d6\u5956\u52b1':    
            print "bingo!!!"
            ActionChainsDriver = ActionChains(driver).click(giftElement)
            ActionChainsDriver.perform()
            time.sleep(20)
            return
        
        if giftElement.text == u'今日已领取':
            print "Work done today, quit"
            driver.close()
            driver.quit()
            exit(0)
        
        timeLeft = parseTime(giftElement.text)
        restTime = timeLeft if timeLeft < 300 else 99
            
        print "Gift is not ready yet, wait {}s, time left: {}".format(restTime, giftElement.text)
        time.sleep(restTime)
        reload(driver)
         

def loopwork(cookies, driver):
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
    reload(driver)
    #driver.maximize_window()
    #driver.save_screenshot("screenShots/Login.png")
    
    if driver.current_url == checkinUrl:
        checkin(driver)
        reload(driver)
    
    count = 0
    while True:
        count += 1
        clickGift(driver)
        print "click {} time".format(count)
    
    #import pdb; pdb.set_trace()

    driver.close()
    driver.quit()


if __name__ == "__main__":
    initFirefoxDriver()

    # driver = initChromeDriver()
    #dumpCookie()
<<<<<<< Updated upstream
    # cookies = readCookie()
    # foo(cookies, driver)
=======
    cookies = readCookie()
    loopwork(cookies, driver)
>>>>>>> Stashed changes
    




