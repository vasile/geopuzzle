$(document).delegate("#map_page", "pageinit", function(){
    setTimeout(function(){
        $("#game_init").panel("open");
    }, 1000);
});

$(document).delegate("#map_page", "pagebeforecreate", function(){
    $("#game_init").panel({
        display: 'push',
        dismissible: false
    });
    $("#game_end").panel({
        display: 'push',
        dismissible: false,
        position: 'right'
    });
    
    var map = (function(){
        var mapBounds = new google.maps.LatLngBounds(new google.maps.LatLng(45.78, 5.87), new google.maps.LatLng(47.87, 10.57));
        
        var mapOptions = {
            center: mapBounds.getCenter(),
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        };
        var map = new google.maps.Map($("#map_canvas")[0], mapOptions);
        map.fitBounds(mapBounds);

        var layer = new google.maps.FusionTablesLayer({
            suppressInfoWindows: true,
            clickable: false,
            map: map,
            query: {
                select: 'geometry',
                from: '812706',
                where: 'id = 1'
            }
        });
        
        return map;
    })();
    
    (function(){
        var styles = {
            'easy': [
                {
                    "featureType": "road",
                    "stylers": [
                        { "weight": 0.4 }
                    ]
                },{
                    "featureType": "road.highway",
                    "stylers": [
                        { "lightness": 40 }
                    ]
                },{
                    "featureType": "transit",
                    "stylers": [
                        { "lightness": -10 },
                        { "weight": 1 }
                    ]
                }
            ],
            'hard': [
                {
                    "elementType": "labels",
                    "stylers": [
                        { "visibility": "off" }
                    ]
                },{
                    "featureType": "road",
                    "elementType": "labels",
                    "stylers": [
                        { "visibility": "off" }
                    ]
                },{
                    "featureType": "administrative",
                    "stylers": [
                        { "visibility": "off" }
                    ]
                },{
                    "featureType": "road",
                    "stylers": [
                        { "weight": 0.5 },
                        { "lightness": 10 }
                    ]
                },{
                    "featureType": "road.highway",
                    "stylers": [
                        { "lightness": 70 }
                    ]
                },{
                    "featureType": "transit",
                    "stylers": [
                        { "lightness": -10 },
                        { "weight": 1 }
                    ]
                }
            ]
        };
        
        function mapSetStyles(value) {
            map.setOptions({
                styles: styles[value]
            });
        }
        
        var selector = $('#difficulty input:radio');
        selector.change(function(){
            mapSetStyles($(this).val());
        });
        mapSetStyles(selector.val());
    })();
    
    (function(){
        var timer = (function(){
            var s_no = 0;
            var interval = 0;

            function paintTimer() {
                function pad(val) {
                    val = '0' + val;
                    return val.substr(val.length - 2);
                }

                var minutes = Math.floor(s_no / 60);
                var seconds = s_no - (minutes * 60);

                $('#timer_stats').html(pad(minutes) + ':' + pad(seconds));
                s_no += 1;
            }

            function init() {
                interval = setInterval(paintTimer, 1000);
            }
            
            function stop() {
                clearInterval(interval);
            }
            
            return {
                init: init,
                stop: stop
            };
        })();
        
        var overlays = [];
        var ids_notpainted = [];
        var ids_matched = 0;
        
        var lastPolygon = null;
        
        var paintPolygon = function() {
            if (ids_notpainted.length === 0) {
                return;
            }

            var random_index = Math.floor((Math.random()*ids_notpainted.length));
            var overlay_id = ids_notpainted[random_index];
            var overlay = overlays[overlay_id];
            ids_notpainted.splice(random_index, 1);

            var shift_x = map.getCenter().lng() - overlay.bounds.getCenter().lng();
            var shift_y = map.getCenter().lat() - overlay.bounds.getCenter().lat();

            var new_paths = [];
            $.each(overlay.paths, function(k, path){
                var new_path = [];
                $.each(path, function(k, point){
                    var new_point = new google.maps.LatLng(point.lat() + shift_y, point.lng() + shift_x);
                    new_path.push(new_point);
                });
                new_paths.push(new_path);
            });

            overlay.polygon = new google.maps.Polygon({
                paths: new_paths,
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.1,
                map: map,
                draggable: true,
                zIndex: 2
            });
            overlay.polygon.set('did_not_move', true);
            overlay.polygon.set('overlay_id', overlay_id);
            
            // The last polygon wasn't moved by the user, he doesn't know where to put it ? 
            //      => remove it from the map for now.
            if ((lastPolygon !== null) && (lastPolygon.get('did_not_move'))) {
                lastPolygon.setMap(null);
                ids_notpainted.push(lastPolygon.get('overlay_id'));

                lastPolygon = null;
            }
            
            lastPolygon = overlay.polygon;

            google.maps.event.addListener(overlay.polygon, 'dragend', function() {
                overlay.polygon.set('did_not_move', false);
                
                var new_bounds = new google.maps.LatLngBounds();
                $.each(overlay.polygon.getPaths().getArray(), function(k, path){
                    $.each(path.getArray(), function(k, point){
                        new_bounds.extend(point);
                    });
                });

                var new_bounds_sw_x = new_bounds.getSouthWest().lng() - 0.05;
                var new_bounds_sw_y = new_bounds.getSouthWest().lat() - 0.05;
                var new_bounds_sw = new google.maps.LatLng(new_bounds_sw_y, new_bounds_sw_x);

                var new_bounds_ne_x = new_bounds.getNorthEast().lng() + 0.05;
                var new_bounds_ne_y = new_bounds.getNorthEast().lat() + 0.05;
                var new_bounds_ne = new google.maps.LatLng(new_bounds_ne_y, new_bounds_ne_x);

                new_bounds = new google.maps.LatLngBounds(new_bounds_sw, new_bounds_ne);
                if (new_bounds.contains(overlay.bounds.getSouthWest()) && new_bounds.contains(overlay.bounds.getNorthEast())) {
                    overlay.polygon.setPaths(overlay.paths);
                    overlay.polygon.setOptions({
                        strokeColor: '#347C17',
                        fillColor: '#347C2C',
                        fillOpacity: 0.8,
                        draggable: false,
                        zIndex: 1
                    });

                    paintPolygon();
                    ids_matched += 1;
                    
                    $('#polygon_stats').html(ids_matched + "/" + overlays.length);
                    
                    if (ids_matched === overlays.length) {
                        timer.stop();
                        $('#timer_stats_final').html($('#timer_stats').html());
                        $("#game_end").panel("open");
                    }
                }
            });
        };
        
        $("#game_init").on("panelclose", function(event, ui){
            $('#stats_time').removeClass('hidden');
            timer.init();
            paintPolygon();
        });
        
        $('#load_polygon').click(paintPolygon);

        function load(type) {
            var pathsGeoJSON = {
                'cantons': 'geojson/G3K12.geojson',
                'districts': 'geojson/G3B12.geojson'
            };
            
            $.getJSON(pathsGeoJSON[type], function(data) {
                $('#polygon_stats').html("0/" + data.features.length);
                $.each(data.features, function(k, feature){
                    var feature_polygons = null;
                    if ((feature.geometry.type === 'Polygon')) {
                        feature_polygons = [feature.geometry.coordinates];
                    } else {
                        feature_polygons = feature.geometry.coordinates;
                    }

                    var paths = [];
                    var bounds = new google.maps.LatLngBounds();
                    $.each(feature_polygons, function(k, polygon_coordinates){
                        $.each(polygon_coordinates, function(k, feature_paths){
                            var path = [];
                            $.each(feature_paths, function(k, point){
                                var latlng = new google.maps.LatLng(point[1], point[0]);
                                path.push(latlng);

                                bounds.extend(latlng);
                            });
                            paths.push(path);
                        });
                    });

                    var overlay = {
                        paths: paths,
                        bounds: bounds,
                        properties: feature.properties,
                        id: k
                    };
                    overlays.push(overlay);

                    ids_notpainted.push(k);
                });
            });
        }
        var selector = $('#game_type input:radio');
        selector.change(function(){
            load($(this).val());
        });
        load(selector.val());
    })();

    $('#new_game').click(function(){
        document.location.reload();
    });
});