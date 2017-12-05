# -*- coding:utf-8 -*-
import json
import re
import libs.sysUtils as util

def testUrl():
    content = util.getContent("https://www.vogue.com/fashion-shows/pre-fall-2016/a-l-c-/slideshow/collection", 2)
    print content
    jsonPattern = re.compile('window.__VOG__.initialState = \{ react: (\{.*?"plugins":\{\}\},"plugins":\{\}\}) \}')
    jsonStr = re.search(jsonPattern, content).group(1)

    util.printFile(jsonStr, "testJson.txt")

    slides = json.loads(jsonStr)["context"]["dispatcher"]["stores"]["FashionShowCalendarStore"]["_extra"][0]["slides"]
    for slide in slides:
        print slide["taggedPeople"]
        print slide["id"]
        if "photoCredits" in slide["slideDetails"]:
            print re.sub(re.compile("(photo:)|(/shoot digital)", re.I), "", slide["slideDetails"]["photoCredits"]).strip()
            
        print "**************"

def testSplit():
    src = r"spring-2013-ready-to-wear@anna-sui\nspring-2013-ready-to-wear@theyskens-theory\nspring-2013-ready-to-wear@jean-paul-gaultier\nfall-2013-ready-to-wear@libertine\nresort-2013@anna-sui\nspring-2013-ready-to-wear@roksanda\nspring-2012-ready-to-wear@libertine\nfall-2013-ready-to-wear@l-wren-scott\nspring-2013-ready-to-wear@mulberry\nfall-2012-couture@chanel\nfall-2012-ready-to-wear@veronique-leroy\nspring-2013-ready-to-wear@mary-katrantzou"
    print src
    for line in src.split(r"\n"):
        print line

def testTitle():
    src = "HelLo, woRld tHIS"
    print src.title()

testUrl()