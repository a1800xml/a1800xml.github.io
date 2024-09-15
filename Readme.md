# Files

## XML

XML Files = 382MB
Minified XML Files = 185MB
GZip compression=9 xmlMin files = 26.9MB

## ICO

DDS
Batchscripting png at least 64x64 convert dds to png
8456 Files = 144/160MB

## 3d

rdm to glb with textures

DataAtribute

# Breakdown

Fetch the xml.gz > unpack
SAX the unpacked XML > get parenttag to define entrypoints
get all parenttags push into indexedDB
with indexeddb get with the keypath of the corresponding file
each db is a seperate file, except for texts_*; probably will rewrite depending on what is currently selected/searched //info could be stored in sessionstorage

# Credit

Layout: schwubbe
scripts: pnski

The basic functionality is mostly inspired by a1800.net. The scripts and this website is made to improve scripting and to see if a replicate can be made with github pages. It serves the purpose of a backup if a1800.net is down.