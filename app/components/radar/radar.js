import {Component, SimpleChange, Output, EventEmitter, ChangeDetectionStrategy, Input} from "angular2/core";
import {IONIC_DIRECTIVES} from "ionic-angular";


@Component({
  selector: "radar",
  template: "<div id='map'></div>",
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ["initialLocation", "initialNearbyList", "currentLocation", "nearbyList"],
  directives: [IONIC_DIRECTIVES]
})
export class Radar {


  constructor() {
    mapboxgl.accessToken = "pk.eyJ1IjoidGFyYWx1a3R1cyIsImEiOiJjaWhqNWF6bDMwMGJ3dTltNHE0Znlwa3ZwIn0.5lBgI3iKqZg_0WvDzPU8-w";
    this.map = null;
    this.mapDataSource = null;
    this.CONFIG_RADARCIRCLE_SPEED = 100;
    this.CONFIG_RADARCIRCLE_DELTA = 0.05;
    this.CONFIG_RADARCIRCLE_UPPERBOUND = 0.9;
    this.CONFIG_RADARCIRCLE_LOWERBOUND = 0.1;
    this.CONFIG_RADARCIRCLE_WEIGHTFACTOR = 200;
    this.CONFIG_RADARCIRCLE_RADIUS_SU = 300;
    this.CONFIG_RADARCIRCLE_RADIUS_NORMAL = 200;
    this.CONFIG_RADARCIRCLE_RADIUS = this.CONFIG_RADARCIRCLE_RADIUS_NORMAL; // in Pixeln
    this.radarCircleOpacity = this.CONFIG_RADARCIRCLE_UPPERBOUND;
    this.radarCircleUpwards = false;
  }


  ngAfterContentInit() {
    let locToUse;
    if (this.currentLocation && this.currentLocation.latitude > 0) {
      locToUse = this.currentLocation;
    } else {
      locToUse = this.initialLocation;
    }
    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/taraluktus/cimjmn11000b9d0mcomw8woy5",
      // style: "mapbox://styles/mapbox/streets-v8",
      center: [locToUse.longitude, locToUse.latitude],
      zoom: 15,
      zoomControl: true,
      attributionControl: false
    });
    this.map.on("load", () => {
      this.initSourceAndLayers();
    });
  }


  ngOnChanges(changes) {
    if (!this.map) {
      return;
    }
    if (changes["currentLocation"]) {
      let currLoc = changes["currentLocation"].currentValue;
      this.map.jumpTo({ center: [currLoc.longitude, currLoc.latitude] });
    }
    if (!this.mapDataSource)
      return;
    if (changes["nearbyList"]) {
      let cV = changes["nearbyList"].currentValue;
      this.mapDataSource.setData(this.fromNearbyArrayToGeoJSON(cV));
      this.updateLayersVisibility(cV);
    }
  }


  fromNearbyArrayToGeoJSON(nearbyArray) {
    let resultJSON = {};
    if (nearbyArray.length >= 1) {
      resultJSON.type = "FeatureCollection";
      resultJSON.features = [];
      nearbyArray.forEach((entry, index) => {
        let selfTitle = "";
        if (index === 0)
          selfTitle = " ";
        let markerSymbol = "";
        switch (entry.flag) {
          case "alarmer":
            markerSymbol = "fire-station";
            break;
          case "confirmer":
            markerSymbol = "pitch";
            break;
          default:
            markerSymbol = "marker";
            break;
        }
        resultJSON.features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [entry.location.lng, entry.location.lat]
          },
          properties: {
            title: selfTitle,
            "marker-symbol": markerSymbol
          }
        });
      });
    }
    return resultJSON;
  }


  ngOnDestroy() {
    if (this.timerUpdateLayersVisibility)
      clearInterval(this.timerUpdateLayersVisibility);
    if (this.timerPulseRadarCircle)
      clearInterval(this.timerPulseRadarCircle);
    if (this.map) {
      if (this.mapDataSource) {
        this.map.batch((batch) => {
          batch.removeLayer("markersNormal");
          batch.removeLayer("markersConfirming");
          batch.removeLayer("markersAlarming");
          batch.removeLayer("circlesNormal");
          batch.removeLayer("circlesConfirming");
          batch.removeLayer("circlesAlarming");
          batch.removeSource("nearbySource");
        });
        this.mapDataSource = null;
      }
      this.map.remove();
      this.map = null;
    }
  }


  showLayer(id) {
    this.map.setLayoutProperty(id, "visibility", "visible");
  }


  hideLayer(id) {
    this.map.setLayoutProperty(id, "visibility", "none");
  }


  initSourceAndLayers() {
    // Erstmaliges Einrichten der Datenquelle
    let initNearbyList;
    if (!this.nearbyList) {
      initNearbyList = this.initialNearbyList;
    } else {
      initNearbyList = this.nearbyList;
    }
    this.mapDataSource = new mapboxgl.GeoJSONSource({ data: this.fromNearbyArrayToGeoJSON(initNearbyList) });

    this.map.batch((batch) => {
      batch.addSource("nearbySource", this.mapDataSource);
      // Einrichten der drei Layer für Radarkreis
      batch.addLayer({
        "id": "circlesNormal",
        "type": "circle",
        "source": "nearbySource",
        "paint": {
          "circle-blur": 0.05,
          "circle-radius": this.CONFIG_RADARCIRCLE_RADIUS_NORMAL,
          "circle-color": "blue",
          "circle-opacity": 1
        },
        "filter": ["all", ["==", "marker-symbol", "marker"], ["==", "title", " "]]
      });
      batch.addLayer({
        "id": "circlesAlarming",
        "type": "circle",
        "source": "nearbySource",
        "paint": {
          "circle-blur": 0.05,
          "circle-radius": this.CONFIG_RADARCIRCLE_RADIUS_NORMAL,
          "circle-color": "red",
          "circle-opacity": 1
        },
        "filter": ["==", "marker-symbol", "fire-station"]
      });
      batch.addLayer({
        "id": "circlesConfirming",
        "type": "circle",
        "source": "nearbySource",
        "paint": {
          "circle-blur": 0.05,
          "circle-radius": this.CONFIG_RADARCIRCLE_RADIUS_NORMAL,
          "circle-color": "yellow",
          "circle-opacity": 1
        },
        "filter": ["==", "marker-symbol", "pitch"]
      });

      // Einrichten der drei Layer
      batch.addLayer({
        "id": "markersNormal",
        "type": "symbol",
        "source": "nearbySource",
        "layout": {
          "icon-image": "{marker-symbol}-15",
          "icon-size": 1.5,
          "icon-allow-overlap": true,
          "text-field": "{title}"
        },
        "paint": {
          "icon-color": "blue",
          "icon-halo-color": "blue",
          "icon-halo-width": 3
        },
        "filter": ["==", "marker-symbol", "marker"]
      });
      batch.addLayer({
        "id": "markersAlarming",
        "type": "symbol",
        "source": "nearbySource",
        "layout": {
          "icon-image": "{marker-symbol}-15",
          "icon-size": 1.5,
          "icon-allow-overlap": true,
          "text-field": "{title}"
        },
        "paint": {
          "icon-color": "yellow",
          "icon-halo-color": "yellow",
          "icon-halo-width": 3
        },
        "filter": ["==", "marker-symbol", "fire-station"]
      });
      batch.addLayer({
        "id": "markersConfirming",
        "type": "symbol",
        "source": "nearbySource",
        "layout": {
          "icon-image": "{marker-symbol}-15",
          "icon-size": 1.5,
          "icon-allow-overlap": true,
          "text-field": "{title}"
        },
        "paint": {
          "icon-color": "red",
          "icon-halo-color": "red",
          "icon-halo-width": 3
        },
        "filter": ["==", "marker-symbol", "pitch"]
      });
    });

    this.updateLayersVisibility(initNearbyList);
    // Timer einrichten
    this.timerUpdateLayersVisibility = setInterval(() => this.updateLayersVisibility(), 10000);
    this.timerPulseRadarCircle = setInterval(() => this.setPulseRadarCircle(), this.CONFIG_RADARCIRCLE_SPEED);
  }



  updateLayersVisibility(changedNearbyList) {
    let nbListToUse;
    if (changedNearbyList) {
      nbListToUse = changedNearbyList;
    } else {
      nbListToUse = this.nearbyList;
    }
    // Wenn die Liste keine Einträge enthält, dann alle Layer verstecken
    if (nbListToUse.length < 1) {
      this.hideLayer("markersNormal");
      this.hideLayer("markersAlarming");
      this.hideLayer("markersConfirming");
      this.hideLayer("circlesNormal");
      this.hideLayer("circlesAlarming");
      this.hideLayer("circlesConfirming");
    } else {
      // Einträge ohne Flag?
      if (nbListToUse.some((entry) => entry.flag === "")) {
        this.showLayer("markersNormal");
        this.showLayer("circlesNormal");
      } else {
        this.hideLayer("markersNormal");
        this.hideLayer("circlesNormal");
      }
      // Einträge mit Alarming
      if (nbListToUse.some((entry) => entry.flag === "alarmer")) {
        this.showLayer("markersAlarming");
        this.showLayer("circlesAlarming");
      } else {
        this.hideLayer("markersAlarming");
        this.hideLayer("circlesAlarming");
      }
      // Einträge mit Confirming
      if (nbListToUse.some((entry) => entry.flag === "confirmer")) {
        this.showLayer("markersConfirming");
        this.showLayer("circlesConfirming");
      } else {
        this.hideLayer("markersConfirming");
        this.hideLayer("circlesConfirming");
      }
    }
  }


  setPulseRadarCircle() {
    if (this.radarCircleUpwards) {
      this.radarCircleOpacity = this.radarCircleOpacity + this.CONFIG_RADARCIRCLE_DELTA;
    } else {
      this.radarCircleOpacity = this.radarCircleOpacity - this.CONFIG_RADARCIRCLE_DELTA;
    }
    if (this.radarCircleOpacity >= this.CONFIG_RADARCIRCLE_UPPERBOUND) {
      this.radarCircleUpwards = false;
      this.radarCircleOpacity = this.CONFIG_RADARCIRCLE_UPPERBOUND;
    } else if (this.radarCircleOpacity <= this.CONFIG_RADARCIRCLE_LOWERBOUND) {
      this.radarCircleUpwards = true;
      this.radarCircleOpacity = this.CONFIG_RADARCIRCLE_LOWERBOUND;
    }
    if (this.map) {
      this.map.batch((batch) => {
        batch.setPaintProperty("circlesNormal", "circle-radius",
          this.radarCircleOpacity * this.CONFIG_RADARCIRCLE_WEIGHTFACTOR);
        batch.setPaintProperty("circlesNormal", "circle-opacity", this.radarCircleOpacity);
        batch.setPaintProperty("circlesAlarming", "circle-radius",
          this.radarCircleOpacity * this.CONFIG_RADARCIRCLE_WEIGHTFACTOR);
        batch.setPaintProperty("circlesAlarming", "circle-opacity", this.radarCircleOpacity);
        batch.setPaintProperty("circlesConfirming", "circle-radius",
          this.radarCircleOpacity * this.CONFIG_RADARCIRCLE_WEIGHTFACTOR);
        batch.setPaintProperty("circlesConfirming", "circle-opacity", this.radarCircleOpacity);
      });
    }
  }

}
