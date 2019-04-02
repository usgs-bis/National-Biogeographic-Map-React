# The National Biogeographic Map

This is reworking/refactoring of the current NBM project:
https://github.com/usgs-bis/nbm_front_end


This project consists of a lightweight React APP and Leaflet map viewer.

Content is driven from a back end API:
https://sciencebase.usgs.gov/staging/bis/

## Technologies used:
1. React https://reactjs.org/
2. Leaflet https://leafletjs.com/
3. D3 https://d3js.org/
4. pdfmake http://pdfmake.org/#/


## To Run:
docker : `bash run.sh`

yarn (or npm) : yarn install yarn start

## Current Deploys:
DEV-IS k8s: https://master.staging.sciencebase.gov/biogeography

DEV-IS k8s: https://master.staging.sciencebase.gov/terrestrial-ecosystems-2011

DEV-IS https://dev-sciencebase.usgs.gov/biogeography

DEV-IS https://dev-sciencebase.usgs.gov/terrestrial-ecosystems-2011

