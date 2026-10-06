import json,sys
from lupa import LuaRuntime
lua=LuaRuntime(unpack_returned_tuples=True)
def conv(o,depth=0):
    if lupa_type(o)=='table':
        keys=list(o.keys())
        if keys and all(isinstance(k,int) for k in keys) and sorted(keys)==list(range(1,len(keys)+1)):
            return [conv(o[k],depth+1) for k in sorted(keys)]
        return {str(k):conv(o[k],depth+1) for k in keys}
    if lupa_type(o)=='function': return '<function>'
    return o
from lupa import lua_type as lupa_type
src=open(sys.argv[1],encoding='utf-8').read()
# module may require others; stub require
lua.execute("require = function(n) return setmetatable({}, {__index=function() return nil end}) end")
fn=lua.execute("return function(src) local f,e=load(src) if not f then error(e) end return f() end")
t=fn(src)
d=conv(t)
json.dump(d,open(sys.argv[2],'w'),ensure_ascii=False,indent=0)
print(type(d),len(d))
