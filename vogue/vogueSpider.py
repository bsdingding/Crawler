# -*- coding:utf-8 -*-
import urllib2
import re
import libs.sysUtils as utils
import time
import json

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

# 年份为key, value为该年份举办的showName列表
shows = {}
# 品牌名为key, value为含有该品牌名的所有showName列表
brands = {}
# 模特字典, 名字为key，value为Model对象
models = {}

# url与本名的映射
show_url_map = {}
brand_url_map = {}

failed_shows = {}

class Model:
    name = ""
    gender = ""
    agencies = set()
    photos = set()
    shows = set()
    
    def __init__(self, name):
        self.name = name
    
    def setName(self, name):
        self.name = name
    def setGender(self, gender):
        self.gender = gender
    def addAgencies(self, agency):
        self.agencies.add(agency)
    def addPhotographer(self, photo):
        self.photos.add(photo)
    def addShows(self, show):
        self.shows.add(show)

    def outPut(self):
        print "Name:\t" + self.name 
        print "Gender:\t" + self.gender
        print "Shows:\t" + self.shows
        print "Agency:\t" + self.agencies
        print "Photos:\t" + self.photos

    def getInfo(self):
        s = "Name:\t" + self.name 
        s = s + "\nGender:\t" + self.gender
        s = s + "\nShows:\t" + utils.setToString(self.shows)
        s = s + "\nAgency:\t" + utils.setToString(self.agencies)
        s = s + "\nPhotos:\t" + utils.setToString(self.photos) + "\n"
        return s


        


def getShowLists():
    fileInput = open("showlists.txt")
    
    try:
        for line in fileInput:
            showName = line.strip()
            # print showName
            yearPattern = re.compile("\d{4}")
            yearRes = re.search(yearPattern, showName)
            year = int(yearRes.group())
            # print showName, year
            if year in shows:
                shows[year].append(showName)
            else:
                shows[year] = []
                shows[year].append(showName)
    finally:
        fileInput.close()
    
    # print shows    

base_url = "https://www.vogue.com/fashion-shows/"
suffix_url = "/slideshow/collection"

def work():
    yearList = shows.keys()
    for year in yearList:
        for show_name in shows[year]:
            print "-----------------------------------------------------\nCrawling " + show_name + "..."
            doOneShow(show_name)

    # 检验
    # print utils.outPutDict(models)

def doOneShow(name):
    url_without_brand = base_url + name
    # print url_without_brand
    # print getContent(url_without_brand)
    print "Show:\t" + name, url_without_brand
    content = utils.getContent(url_without_brand, 3)
    if content == None:
        if name in failed_shows:
            failed_shows[name].append("ERROR")
        else:
            failed_shows[name] = []
            failed_shows[name].append("ERROR")
        return

    # 获取该走秀包含的所有品牌名
    brandPattern = re.compile("tab-list--item__brand.*?<a href=\"" + base_url + name +"/(.*?)\"", re.S)
    brandList = re.findall(brandPattern, content)

    # 构造品牌-秀倒排字典
    for brand in brandList:
        if brand in brands:
            brands[brand].append(name)
        else:
            brands[brand] = []
            brands[brand].append(name)

        url = url_without_brand + "/" + brand + suffix_url
        print "Brand:\t" + brand + "\t" + url
        
        res = extractInfoFromFinalPage(url, name+"@"+brand)
        # 返回-1,代表网页提取失败，记录下
        if res == -1:
            if name in failed_shows:
                failed_shows[name].append(brand)
            else:
                failed_shows[name] = []
                failed_shows[name].append(brand)

        time.sleep(2)
    
    
def extractInfoFromFinalPage(url, name):
    content = utils.getContent(url, 5)
    if content == None:
        return -1

    # 获取json对象
    jsonPattern = re.compile('window.__VOG__.initialState = \{ react: (\{.*?\})(, relay: \{\} \}|);')
    jsonStr = re.search(jsonPattern, content).group(1)

    slides = json.loads(jsonStr)["context"]["dispatcher"]["stores"]["FashionShowCalendarStore"]["_extra"][0]["slides"]

    for slide in slides:

        peoples = slide["taggedPeople"]
        for people in peoples:
            if "name" not in people:
                continue
            else:
                model_name = people["name"]

                model = None
                # 若该模特已存在，取出引用
                if model_name in models:
                    model = models[model_name]
                else:
                    # 否则new一个，并添加至引用
                    model = Model(model_name)
                    models[model_name] = model
                
                # 姑且当做性别可改变吧...
                if "gender" in people:
                    model.setGender(people["gender"])
                if "agencies" in people:
                    for agency in people["agencies"]:
                        model.addAgencies(agency["name"])

                try:
                    photoer = slide["slideDetails"]["photoCredits"].split(":")[1].strip()
                    model.addPhotographer(photoer)
                except Exception, e:
                    print e

                model.addShows(name)
    
    return 0

base_dir = ".\\res\\"
def finalWork():
    utils.dump(failed_shows, base_dir+"failedShows.txt")
    # utils.dump(models, base_dir+"models.txt")
    fileWriter = open(base_dir+"models.txt", 'w')
    try:
        for model_name in models:
            fileWriter.write("******************************************************\n")
            fileWriter.write(models[model_name].getInfo())
    finally:
        fileWriter.close()

getShowLists()
work()
finalWork()

print "Word Done!"


