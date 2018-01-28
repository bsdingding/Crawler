# -*- coding:utf-8 -*-
import urllib2
import csv
import time

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

def getContent(url, count):
    i = 1
    while count > 0:
        if i > 1:
            print "Try for times " + str(i) + " " + url
        request = urllib2.Request(url)
        try:
            response = urllib2.urlopen(request, timeout=10)
            if i > 1:
                print "Finally Success with " + url
            return response.read()
        except (urllib2.URLError, Exception), e:
            print e, url
        count -= 1
        i += 1
        time.sleep(10)
    
    # 若仍然进行到此处，则证明一直未正常取到该url所对应的网页内容，返回None标记失败
    print "Failed to fetch " + url
    return None

def htmlDumpContent(url, count, fileName):
    content = getContent(url, count)
    print content
    printFile(content, fileName)


def outPutDict(dic):
    s = ""
    for key in dic.keys():
        s = s + "**************************************************\n"
        s = s + key + ":\n"
        for item in dic[key]:
            s = s + item + "\n"
    
    return s

def dump(dic, fileName):
    fileWriter = open(fileName, 'w')
    try:
        src = outPutDict(dic)
        if len(src) < 1:
            fileWriter.write("No Record")
        else:
            fileWriter.write(src)
    finally:
        fileWriter.close()

def printFile(s, fileName):
    fileWriter = open(fileName, 'w')
    try:
        fileWriter.write(s)
    finally:
        fileWriter.close()

def list2File(l, fileName):
    fileWriter = open(fileName, 'w')
    try:
        for item in l:
            fileWriter.write(item)
            fileWriter.write("\n")
    finally:
        fileWriter.close()

def setToString(s):
    res = "Count:" + str(len(s)) + "|"
    for item in s:
        res = res + item + ","
    return res[0:-1]

def dumpToCSV(l, fileName):
    out = open(fileName, 'wb')

    try:
        csv_writer = csv.writer(out, dialect='excel')
        csv_writer.writerows(l)
    except Exception, e:
        print e
    finally:
        out.close()

def readFromCSV(fileName):
    file = open(fileName, 'rb')

    res = []
    try:
        csv_reader = csv.reader(file, dialect='excel')
        for row in csv_reader:
            res.append(row)
    finally:
        file.close()

    return res

def setToCSVString(s):
    res = ""
    for item in s:
        res = res + item + "\n"
    return res[0:-1]

def setToLine(s):
    res = ""
    for item in s:
        res = res + item + ","
    return res[0:-1]
