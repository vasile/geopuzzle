var app_config = {
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
            fillOpacity: 0.1,
            visible: true
        },
        polygon_final: {
            strokeColor: '#347C17',
            fillColor: '#347C2C',
            fillOpacity: 0.8
        }
    }
};

$(document).delegate("#map_page", "pageinit", function(){
    setTimeout(function(){
        $("#game_init").panel("open");
    }, 1000);
});

$(document).delegate("#map_page", "pagebeforecreate", function(){
    var ua_is_mobile = navigator.userAgent.indexOf('iPhone') !== -1 || navigator.userAgent.indexOf('Android') !== -1;
    if (ua_is_mobile) {
        $('body').addClass('mobile');
    }
    
    var app_data = (function(){
        var data = [];
        $.each(app_config.geojson_feeds, function(k, geojson_url){
            var overlays = [];
            var area_bounds = new google.maps.LatLngBounds();
            $.ajax(geojson_url, {
              dataType: "json",
              async: false,
              success: function(data) {
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
                                  area_bounds.extend(latlng);
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
                  });
                }
            });
            data.push({
                name: k,
                overlays: overlays,
                bounds: area_bounds
            });
        });
        
        return data;
    })();
    
    var game_type = (function(){
        var type_id = 0;
        if (app_data.length > 1) {
            var game_type_rows = [];
            $.each(app_data, function(k, row){
                var game_type_row = '<input type="radio" name="game_type" id="game_type_' + row.name + '" value="' + k + '"' + (k === 0 ? ' checked="checked"' : '') + ' /><label for="game_type_' + row.name + '">' + row.name + '</label>';
                game_type_rows.push(game_type_row);
            });
            $('#game_types').html(game_type_rows.join("\n"));
            $('#game_type').removeClass('hidden');
        }
        
        function setTypeId(value) {
            type_id = value;
            $('#polygon_stats').html("0/" + app_data[type_id].overlays.length);
        }
        setTypeId(type_id);
        
        $('#game_type input:radio').change(function(){
            setTypeId($(this).val());
        });
        
        return {
            getId: function(){
                return type_id;
            }
        };
    })();
    
    $("#game_init").panel({
        display: 'push',
        dismissible: false
    });
    $("#game_end").panel({
        display: 'push',
        dismissible: false,
        position: 'right'
    });
    $("#game_info").panel({
        display: 'push',
        dismissible: false,
        position: 'right'
    });
    
    var mask_layer = null;
    var map = (function(){
        var mapBounds = app_data[game_type.getId()].bounds;
        
        var mapOptions = {
            center: mapBounds.getCenter(),
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            
            
            streetViewControl: false,
            panControl: false,
            mapTypeControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT
            }
        };
        var map = new google.maps.Map($("#map_canvas")[0], mapOptions);
        map.fitBounds(mapBounds);
        
        if (app_config.area_mask_fusion_tables_query !== null) {
            mask_layer = new google.maps.FusionTablesLayer({
                suppressInfoWindows: true,
                clickable: false,
                map: map,
                query: app_config.area_mask_fusion_tables_query
            });            
        }
        
        var el = $('#social')[0];
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(el);
        
        el = $('#game_bar_info')[0];
        map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(el);
        
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
                    "featureType": "road",
                    "elementType": "labels",
                    "stylers": [
                        { "visibility": "off" }
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
            
            if (mask_layer !== null) {
                mask_layer.setMap(value === 'easy' ? map : null);
            }
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

            function start() {
                s_no = 0;
                interval = setInterval(paintTimer, 1000);
                $('#stats_time').removeClass('hidden');
            }
            
            function stop() {
                clearInterval(interval);
                $('#stats_time').addClass('hidden');
            }
            
            return {
                start: start,
                stop: stop
            };
        })();
        
        var overlays, ids_notpainted, ids_matched_no, lastPolygon;

        function game_init() {
            ids_notpainted = [];
            
            overlays = app_data[game_type.getId()].overlays;
            $.each(overlays, function(k, overlay){
                if ((typeof overlay.polygon) !== 'undefined') {
                    overlay.polygon.setMap(null);
                }
                
                ids_notpainted.push(overlay.id);
            });
            ids_matched_no = 0;
            lastPolygon = null;
            
            $('#load_polygon').button("enable");

            timer.start();
            $('#stats_info').removeClass('hidden');
            paintPolygon();
        }
        
        $("#game_init").on("panelclose", game_init);
        function paintPolygon() {
            if (ids_notpainted.length === 0) {
                $('#load_polygon').button("disable");
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
                    // setting offset here causes shape not to match if dragging it very far north or sourth on the map
                    var new_point = new google.maps.LatLng(point.lat(), point.lng());
                    new_path.push(new_point);
                });
                new_paths.push(new_path);
            });

            overlay.polygon = new google.maps.Polygon({
                paths: new_paths,
                map: map,
                draggable: true,
                zIndex: 2,
                // hide the polygon until after it has been moved from it's original location
                visible: false
            });
            
            // move the polygon to the center of the screen
            overlay.polygon.moveTo(map.getCenter());
            
            overlay.polygon.setOptions(app_config.styles.polygon_draggable);
            
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
                        draggable: false,
                        zIndex: 1
                    });
                    overlay.polygon.setOptions(app_config.styles.polygon_final);

                    ids_matched_no += 1;
                    
                    $('#polygon_stats').html(ids_matched_no + "/" + overlays.length);
                    paintPolygon();
                    
                    $('#game_bar_info').html(overlay.properties.NAME);
                    $('#game_bar_info').removeClass('hidden');
                    setTimeout(function(){
                        $('#game_bar_info').addClass('hidden');
                    }, 2000);
                    
                    if (ids_matched_no === overlays.length) {
                        timer.stop();
                        var timer_stats = $('#timer_stats').html();
                        $('#timer_stats_final').html(timer_stats);
                        var tweet_text = 'Solved the Swiss GeoPuzzle in ' + timer_stats + ' ! Who can beat my time ?';
                        $('#game_end_tweet_placeholder').html('<iframe allowtransparency="true" frameborder="0" scrolling="no" src="https://platform.twitter.com/widgets/tweet_button.html?hashtags=quiz&count=none&text=' + encodeURIComponent(tweet_text) + '" style="width:100px; height:20px;"></iframe>');
                        $("#game_end").panel("open");
                    }
                }
            });
        }

        $('#load_polygon').click(paintPolygon);
        
        $('.new_game').click(function(){
            var yn = null;
            if ($(this).attr('data-ignore-warnings') === 'yes') {
                yn = true;
            } else {
                yn = confirm('Are you sure ? The current game progress will be lost !');
            }

            if (yn) {
                timer.stop();
                $("#game_init").panel("open");
            }
        });
    })();
});