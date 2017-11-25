import re

file = open("FS170930.txt")
try:
    content = file.read()
finally:
    file.close()

pattern = re.compile("<a href=\"/fashion-shows/(.*?)\">", re.S)
showlists = re.findall(pattern, content)
print len(showlists)

filewriter = open("showlists.txt", 'w')
try:
    for show in showlists:
        filewriter.write(show + "\n")
finally:
    filewriter.close()