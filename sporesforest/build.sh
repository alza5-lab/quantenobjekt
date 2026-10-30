#!/bin/sh
cd /workspace/sporesforest-site && cat src/p1.js src/p2.js src/p3.js src/p4.js src/p4b.js src/p5.js > main.js && node --check main.js && echo BUILD_OK
