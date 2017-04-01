# Z-rapporter i CYB

Dette repoet genererer oppgjørsrapport i PDF med data som sendes fra
et Google Spreadsheet CYB bruker. PDF-filene genereres ved at det først
opprettes et LaTeX-dokument som så konverteres til PDF.

Dataene lagres også i `reports.json` for senere bruk til importering
til regnskapssystemet.

Systemet er laget av Henrik Steen som var kasserer i 2014 og 2015.

## Docker-oppsett

Repoet er koblet opp mot Docker Cloud som bygger et Docker image
hver gang vi pusher til repoet.

https://cloud.docker.com/swarm/cybrairai/repository/docker/cybrairai/z-backend/general

Se https://github.com/cybrairai/drift/tree/master/z-backend
for hvordan dette faktisk brukes.
