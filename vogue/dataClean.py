# -*- coding:utf-8 -*-
import libs.sysUtils as utils
import re

def showsToCSVString(shows):
    res = ""
    for show in shows:
        res = res + show.toString() + "\n"
    return res[0:-1]

class Model:    
    def __init__(self, name):
        self.name = name
        self.gender = "-"
        self.agencies = set()
        self.photos = set()
        self.shows = []
    
    def addAgencies(self, agency):
        self.agencies.add(agency)
    def addPhotographer(self, photo):
        self.photos.add(photo)
    def addShows(self, show):
        self.shows.append(show)
    
    def getList(self):
        res = []
        res.append(self.name)
        res.append(self.gender)
        res.append(showsToCSVString(self.shows))
        res.append(utils.setToCSVString(self.agencies))
        res.append(utils.setToCSVString(self.photos))
        return res

class Show:
    def __init__(self, showName):
        # print "showName: " + showName
        with_brand = showName.split("@")
        self.brand = with_brand[1]
        show = with_brand[0]
        parts = re.split("(\d{4})", show)
        # 无type模式
        if len(parts) >= 2:
            self.season = parts[0][0:-1]
            self.year = parts[1]
            self.type = "-"
        if len(parts) == 3:
            self.type = parts[2][1:]
    
    def toString(self):
        return self.year + "/" + self.season + "/" + self.type + "/" + self.brand

def getOrCreate(modelName):
    if modelName in models:
        return models[modelName]
    else:
        model = Model(modelName)
        models[modelName] = model
        return model

modelInfoList = utils.readFromCSV("res\\models_all.csv")

# for i in range(3):
#     print modelInfoList[i]
#     print "###################################"

models = {}
for i in range(1, len(modelInfoList)):
    row = modelInfoList[i]

    #model = Model(row[0].strip().title())
    model = getOrCreate(row[0].strip().title())
    # print model.name

    # Gender信息
    gender = row[1].strip()
    if len(gender) == 0:
            model.gender = "-"
    else:
        model.gender = gender

    # Show信息
    for showName in row[2].split():
        # if model.name == "Laurijn Bijnen":
        #     print "show:" + showName
        show = Show(showName)
        model.addShows(show)
    
    # Agency信息
    for agency in row[3].split():
        model.addAgencies(agency.strip().upper().replace("-", " "))

    # Photographer信息
    for photoers in row[4].split():
        model.addPhotographer(photoers.split("/")[0].strip().title())

print "Models Loaded and Cleaned"
print "Models size: " + str(len(models))

headers = []
headers.append("Name")
headers.append("Gender")
# headers.append("Shows")
headers.append("Year")
headers.append("Season")
headers.append("Type")
headers.append("Brand")
# headers.append("Agencies")
# headers.append("Photographers")

resList = []
resList.append(headers)
for modelName in models:
    model = models[modelName]
    # resList.append(model.getList())
    
    for show in model.shows:
        line = []
        line.append(model.name)
        line.append(model.gender)
        line.append(show.year)
        line.append(show.season)
        line.append(show.type)
        line.append(show.brand)
        resList.append(line)


# print len(resList)
# print resList[1]
base_dir = ".\\res\\"
try:
    utils.dumpToCSV(resList, base_dir+"models_Final.csv")
except Exception, e:
    print e
    utils.dumpToCSV(resList, base_dir+"models_Final_backup.csv")

print "Work Done!"