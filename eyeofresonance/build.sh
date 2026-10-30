#!/bin/sh
cd /workspace/eyeofresonance-site && cat src/p1.js src/p2.js src/p3.js src/p4.js src/p5.js src/p6.js > main.js && node --check main.js && echo BUILD_OK
