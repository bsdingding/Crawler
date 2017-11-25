# -*- coding:utf-8 -*-
import json
import re
import libs.sysUtils as util

content = util.getContent("https://www.vogue.com/fashion-shows/spring-1994-ready-to-wear/calvin-klein-collection/slideshow/collection", 2)
jsonPattern = re.compile('window.__VOG__.initialState = \{ react: (\{.*?\})(, relay: \{\} \}|);')
jsonStr = re.search(jsonPattern, content).group(1)

util.printFile(jsonStr, "testJson.txt")

slides = json.loads(jsonStr)["context"]["dispatcher"]["stores"]["FashionShowCalendarStore"]["_extra"][0]["slides"]
for slide in slides:
    print slide["taggedPeople"]
    print slide["id"]
    if "photoCredits" in slide["slideDetails"]:
        print slide["slideDetails"]["photoCredits"].split(":")[1].strip()
        
    print "**************"
