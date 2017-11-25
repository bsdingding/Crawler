# -*- coding:utf-8 -*-
import json
import re
import libs.sysUtils as util

src = 'Photo:  Condé Nast Archive'
print src.split(":")[1].strip()

# content = util.getContent("https://www.vogue.com/fashion-shows/fall-1992-ready-to-wear/comme-des-garcons/slideshow/collection", 2)
# jsonPattern = re.compile('window.__VOG__.initialState = \{ react: (\{.*?\})(, relay: \{\} \}|);')
# jsonStr = re.search(jsonPattern, content).group(1)

# slides = json.loads(jsonStr)["context"]["dispatcher"]["stores"]["FashionShowCalendarStore"]["_extra"][0]["slides"]
# for slide in slides:
#     print slide["taggedPeople"]
#     print slide["slideDetails"]["photoCredits"]
#     print "**************"
