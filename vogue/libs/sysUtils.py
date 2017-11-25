# -*- coding:utf-8 -*-
import urllib2
import csv
import time

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

def getContent(url, count):
    while count > 0:
        request = urllib2.Request(url)
        try:
            response = urllib2.urlopen(request, timeout=10)
            return response.read()
        except (urllib2.URLError, Exception), e:
            print e.reason, url
        count -= 1
        time.sleep(10)
    
    # 若仍然进行到此处，则证明一直为正常取到该url所对应的网页内容，返回None标记失败
    return None


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

def setToCSVString(s):
    res = ""
    for item in s:
        res = res + item + "\n"
    return res[0:-1]