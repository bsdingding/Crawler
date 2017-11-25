import re

src = "hello world334!"
pattern = re.compile("\d{3}")
res = re.search(pattern, src)

print res.group()