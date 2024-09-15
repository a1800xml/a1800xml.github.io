#import xml.etree.cElementTree as ET
from lxml import etree

def getRecDict(Dict):
    return 0

def getAssetContext():
    # Get an iterable.
    tree = etree.parse("xml/assets.xml")
    root = tree.getroot()
#    t = {tag_names = {t.tag for t in root.findall('.//country/*')}}
    #t = {t.text for t in root.findall('.//Asset/Values/Standard/GUID')}
    #print(t)//a[contains(@href, '://')]
    for asset in root.xpath('//Asset[Values/Standard/GUID]'):
        tree = etree.ElementTree(asset)
        tree.write("docs/"+asset.find('.//GUID').text+".md", pretty_print=True)
        
    print("got here")
    return 0

getAssetContext()

"""  string = etree.tostring(asset)
        print(string)
        with open("docs/"+asset.find('.//GUID').text+".md","w") as f:
            asset.write("person.xml", encoding='utf-8', xml_declaration=True)
        #print(asset.find('.//GUID').text)
        #print(etree.tostring(asset)) """