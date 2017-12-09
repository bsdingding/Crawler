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
    def __init__(self, name):
        self.name = name
        self.gender = ""
        self.shows = {}
    
    def setName(self, name):
        self.name = name
    def setGender(self, gender):
        self.gender = gender
    def getOrCreateShow(self, showName):
        if showName not in self.shows:
            self.shows[showName] = Show(showName)
        return self.shows[showName]
    def outPut(self):
        print "Name:\t" + self.name 
        print "Gender:\t" + self.gender
        print "Shows:\t" + self.shows

    def getInfo(self):
        s = "Name:\t" + self.name 
        s = s + "\nGender:\t" + self.gender
        s = s + "\nShows:\t" + utils.setToString(self.shows) + "\n"
        return s

    # 一个Show一行，返回该模特的所有信息（多行）
    def getLists(self):
        res = []
        for show in self.shows:
            line = []
            line.append(self.name)
            line.append(self.gender)
            line.extend(self.shows[show].getList())
            res.append(line)

        return res

class Show:
    def __init__(self, showName):
        # print "showName: " + showName
        show_with_brand = showName.split("@")
        self.brand = show_with_brand[1]
        self.name = show_with_brand[0]
        parts = re.split("(\d{4})",  self.name)
        # 无type模式
        if len(parts) >= 2:
            self.season = parts[0][0:-1]
            self.year = parts[1]
            self.type = "-"
        if len(parts) == 3:
            self.type = parts[2][1:]
        self.photoers = set()
        self.agencies = set()
    
    def addPhotoers(self, p):
        self.photoers.add(p.strip().title())
    def addAgencies(self, a):
        self.agencies.add(a.strip().upper())
    
    def toString(self):
        return self.year + "/" + self.season + "/" + self.type + "/" + self.brand

    def getList(self):
        res = []
        res.append(self.year)
        res.append(self.season)
        res.append(self.type)
        res.append(self.brand)
        res.append(utils.setToLine(self.agencies))
        res.append(utils.setToLine(self.photoers))
        return res

        


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
        # if brand != "rag-bone":
        #     continue

        if brand in brands:
            brands[brand].append(name)
        else:
            brands[brand] = []
            brands[brand].append(name)

        url = url_without_brand + "/" + brand + suffix_url
        print "    Brand:\t" + brand + "\t" + url
        
        res = extractInfoFromFinalPage(url, name + "@" + brand)
        # 返回-1,代表网页提取失败，记录下
        if res == -1:
            if name in failed_shows:
                failed_shows[name].append(brand)
            else:
                failed_shows[name] = []
                failed_shows[name].append(brand)

        time.sleep(2)
        # break
    
    
def extractInfoFromFinalPage(url, showName):
    content = utils.getContent(url, 5)
    if content == None:
        print "    Brand Failed!"
        return -1

    # 获取json对象
    jsonPattern = re.compile('window.__VOG__.initialState = \{ react: (\{.*?"plugins":\{\}\},"plugins":\{\}\}) \}')
    jsonStr = re.search(jsonPattern, content).group(1)
    # print jsonStr

    slides = json.loads(jsonStr)["context"]["dispatcher"]["stores"]["FashionShowCalendarStore"]["_extra"][0]["slides"]

    try:
        for slide in slides:

            peoples = slide["taggedPeople"]
            if peoples == None:
                continue
            for people in peoples:
                if people == None:
                    continue
                if "name" not in people:
                    continue
                else:
                    model_name = people["name"]

                    # 若该模特已存在，取出引用
                    if model_name in models:
                        model = models[model_name]
                    else:
                        # 否则new一个，并添加至引用
                        model = Model(model_name)
                        models[model_name] = model
                    
                    # 姑且当做性别可改变吧...
                    if "gender" in people and len(people["gender"].strip()) > 0:
                        model.setGender(people["gender"])
                    
                    show = model.getOrCreateShow(showName)
                    if "agencies" in people:
                        for agency in people["agencies"]:
                            show.addAgencies(agency["name"])

                    try:
                        photoInfo = slide["slideDetails"]
                        if "photoCredits" in photoInfo and len(photoInfo["photoCredits"]) > 0:
                            photoer = re.sub(re.compile("(photo:)|(/shoot digital)", re.I), "", slide["slideDetails"]["photoCredits"]).strip()
                            # model.addPhotographer(photoer)
                            show.addPhotoers(photoer)
                    except Exception, e:
                        print e, slide["id"]

                    # model.addShows(name)
    
    except Exception, e:
        print e
        utils.dump(models, ".\\res\\models_tmp.txt")
    
    return 0

base_dir = ".\\res\\"
def finalWork():
    utils.dump(failed_shows, base_dir+"failedShows.txt")
    # utils.dump(models, base_dir+"models.txt")
    # fileWriter = open(base_dir+"models.txt", 'w')
    # try:
    #     for model_name in models:
    #         fileWriter.write("******************************************************\n")
    #         fileWriter.write(models[model_name].getInfo())
    # finally:
    #     fileWriter.close()
    
    headers = []
    headers.append("Name")
    headers.append("Gender")
    headers.append("Year")
    headers.append("Season")
    headers.append("Type")
    headers.append("Brand")
    headers.append("Agencies")
    headers.append("Photographers")

    resList = []
    resList.append(headers)
    for model_name in models:
        model = models[model_name]
        resList.extend(model.getLists())
    
    try:
        utils.dumpToCSV(resList, base_dir+"models.csv")
    except Exception, e:
        print e
        utils.dumpToCSV(resList, base_dir+"models_backup.csv")


getShowLists()
work()
finalWork()

print "Work Done!"


