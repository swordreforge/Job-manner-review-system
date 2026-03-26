#!/bin/bash
for f in *.api; do cp "$f" "./api_txt/${f}.txt"; done
