# -*- coding:utf-8 -*-
import urllib2
import re

request = urllib2.Request("https://www.vogue.com/fashion-shows/fall-1992-ready-to-wear/comme-des-garcons/slideshow/collection")

try:
    response = urllib2.urlopen(request, timeout=5)
except urllib2.URLError, e:
    print e.reason

fileWriter = open("jsonTest.txt", 'w')
fileWriter.write(response.read())

