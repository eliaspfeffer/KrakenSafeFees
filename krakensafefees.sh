#!/bin/bash

# krakensafefees-background.sh - Startet den Krakensafefees-Server im Hintergrund
# ohne dass das Terminal geöffnet bleiben muss

# Konfigurationsoptionen
PROJECT_DIR="$HOME/Dokumente/Github/krakensafefees"
LOG_FILE="$PROJECT_DIR/dev-server.log"
PID_FILE="$PROJECT_DIR/.dev-server.pid"
CPU_PRIORITY=10

# Farbige Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funktionen definieren
start_server() {
    echo -e "${BLUE}===========================================================${NC}"
    echo -e "${GREEN}Krakensafefees Development Server${NC}"
    echo -e "${BLUE}===========================================================${NC}"
    
    # Prüfen, ob das Projektverzeichnis existiert
    if [ ! -d "$PROJECT_DIR" ]; then
        echo -e "${RED}Projektverzeichnis nicht gefunden: $PROJECT_DIR${NC}"
        exit 1
    fi
    
    # In das Projektverzeichnis wechseln
    echo -e "${BLUE}Wechsle in: ${PROJECT_DIR}${NC}"
    cd "$PROJECT_DIR"
    
    # Prüfen, ob bereits ein Server läuft
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null; then
            echo -e "${YELLOW}Server läuft bereits mit PID $PID${NC}"
            echo -e "${YELLOW}Verwende './$(basename $0) stop' zum Beenden${NC}"
            exit 1
        else
            echo -e "${YELLOW}Veraltete PID-Datei gefunden, wird entfernt...${NC}"
            rm "$PID_FILE"
        fi
    fi
    
    # Prüfen, ob node_modules existiert
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}node_modules nicht gefunden. Führe npm install aus...${NC}"
        npm install
    fi
    
    # Server im Hintergrund starten
    echo -e "${BLUE}Starte den Entwicklungsserver im Hintergrund...${NC}"
    echo -e "${YELLOW}Server-Logs werden in ${LOG_FILE} gespeichert${NC}"
    
    # Alte Log-Datei löschen/rotieren
    [ -f "$LOG_FILE" ] && mv "$LOG_FILE" "${LOG_FILE}.old"
    
    # Mit nohup im Hintergrund starten
    nohup nice -n $CPU_PRIORITY npm run dev > "$LOG_FILE" 2>&1 &
    
    # PID speichern
    echo $! > "$PID_FILE"
    echo -e "${GREEN}Server gestartet mit PID $(cat $PID_FILE)${NC}"
    echo -e "${BLUE}Der Server läuft jetzt im Hintergrund.${NC}"
    echo -e "${YELLOW}Um ihn zu beenden: './$(basename $0) stop'${NC}"
    echo -e "${YELLOW}Um die Logs anzusehen: 'tail -f $LOG_FILE'${NC}"
    echo -e "${BLUE}===========================================================${NC}"
}

stop_server() {
    echo -e "${BLUE}===========================================================${NC}"
    echo -e "${YELLOW}Beende den Krakensafefees-Server...${NC}"
    
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${RED}Keine PID-Datei gefunden. Server läuft vermutlich nicht.${NC}"
        echo -e "${BLUE}===========================================================${NC}"
        return
    fi
    
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null; then
        echo -e "${YELLOW}Beende Server-Prozess mit PID $PID...${NC}"
        # Sende SIGTERM und dann SIGKILL, wenn der Prozess nicht reagiert
        kill $PID
        sleep 2
        if ps -p $PID > /dev/null; then
            echo -e "${YELLOW}Server reagiert nicht, verwende SIGKILL...${NC}"
            kill -9 $PID
            sleep 1
        fi
    else
        echo -e "${YELLOW}Server mit PID $PID ist nicht mehr aktiv.${NC}"
    fi
    
    # PID-Datei entfernen
    rm "$PID_FILE"
    echo -e "${GREEN}Server wurde beendet.${NC}"
    echo -e "${BLUE}===========================================================${NC}"
}

status_server() {
    echo -e "${BLUE}===========================================================${NC}"
    echo -e "${YELLOW}Status des Krakensafefees-Servers:${NC}"
    
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${RED}Keine PID-Datei gefunden. Server läuft vermutlich nicht.${NC}"
    else
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null; then
            echo -e "${GREEN}Server läuft mit PID $PID${NC}"
            echo -e "${YELLOW}Server läuft seit: $(ps -o etime= -p $PID)${NC}"
            echo -e "${YELLOW}Log-Datei: $LOG_FILE${NC}"
            echo -e "${YELLOW}Letzte Log-Einträge:${NC}"
            echo -e "${BLUE}-----------------------------------------------------------${NC}"
            tail -n 5 "$LOG_FILE"
            echo -e "${BLUE}-----------------------------------------------------------${NC}"
        else
            echo -e "${RED}Server mit PID $PID ist nicht mehr aktiv.${NC}"
            echo -e "${YELLOW}(PID-Datei existiert noch, aber kein laufender Prozess)${NC}"
        fi
    fi
    echo -e "${BLUE}===========================================================${NC}"
}

# Hauptscript
case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        stop_server
        sleep 2
        start_server
        ;;
    status)
        status_server
        ;;
    *)
        echo -e "${BLUE}===========================================================${NC}"
        echo -e "${YELLOW}Verwendung: $0 {start|stop|restart|status}${NC}"
        echo -e "${BLUE}===========================================================${NC}"
        ;;
esac

exit 0

