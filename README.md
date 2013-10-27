## GeoPuzzle
This game tests your geography skills by let you dragging and matching each polygon against the correct position on the map. Inspired on [Luke Mahe's hack](http://www.morethanamap.com/demos/visualization/puzzle) on GMaps draggable polygons. 

## Demo
[Swiss cantons](http://maps.vasile.ch/geopuzzle/)

## Requirements

* a webserver(i.e. Apache)

## Setup

* clone / download the project to a location that can be accessible via your webserver
* access the project in your browser (i.e. [http://localhost/geopuzzle/](http://localhost/geopuzzle/) )

## Customize the game for your area

- Grab a [GeoJSON](http://geojson.org/geojson-spec.html) file for your area of interest. 	
	Not sure how to get/make one ? [Contact me](https://docs.google.com/forms/d/1ZWCqfF8OvRBlMPHMc5FbL6T3zYhQ-p18B8IIwMt1sRs/) and I will try to help you.

- Edit the config: [static/map.js - app_config variable](https://github.com/vasile/geopuzzle/blob/master/static//map.js)

	    geojson_feeds: {
	        Cantons: 'geojson/G3K12.geojson'
	    },
	    area_mask_fusion_tables_query: null,
	    styles: {
	        polygon_draggable: {
	            strokeColor: "#FF0000",
	            strokeOpacity: 0.8,
	            strokeWeight: 2,
	            fillColor: "#FF0000",
	            fillOpacity: 0.1
	        },
	        polygon_final: {
	            strokeColor: '#347C17',
	            fillColor: '#347C2C',
	            fillOpacity: 0.8
	        }
	    }

	* *geojson_feeds*: Local paths for the [GeoJSON](http://geojson.org/geojson-spec.html) files containing the polygons
	* *styles*: [PolygonOptions objects](https://developers.google.com/maps/documentation/javascript/reference#PolygonOptions) for the entities that are draggable / fixed
	* *area_mask_fusion_tables_query:* [FusionTablesQuery object](https://developers.google.com/maps/documentation/javascript/reference#FusionTablesQuery) representing a mask polygon that highlights the area of interest. 
			
		Example for [Switzerland boundaries mask](https://www.google.com/fusiontables/DataSource?docid=1tDHsjdz7uhhAmWlmmwjR1P2Huf2LKMMiICPVdw)
	
			{
	    		select: 'geometry',
	    		from: '1tDHsjdz7uhhAmWlmmwjR1P2Huf2LKMMiICPVdw',
	    		where: 'id = 1'
			}
			
		If set to *null*, no mask will be displayed

## What's next ?

* make a version with [Districts of Switzerland](http://en.wikipedia.org/wiki/Districts_of_Switzerland), beta-testers are welcomed !
* **your idea ?**

## Stay in touch

Just [contact me](https://docs.google.com/forms/d/1ZWCqfF8OvRBlMPHMc5FbL6T3zYhQ-p18B8IIwMt1sRs/) if you are not a programmer and / or need help in building a similar game for your region/country.

## Contributors

* [John Pope](https://github.com/llamapope) - added [bramus](https://github.com/bramus/google-maps-polygon-moveto) google.maps.Polygon.moveTo support

## Have fun !