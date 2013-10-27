require 'json'

APP_PATH = File.expand_path(File.dirname(__FILE__)) + "/../"

json_in = "#{APP_PATH}/geojson/G3K12.geojson"

new_json = {
  'type' => 'FeatureCollection',
  'features' => []
}

def get_group_coordinates(groups)
  groups.each_with_index do |coords_group, k|
    new_coords = []
    coords_group.each do |coords|
      new_coords.push([coords[0].round(6), coords[1].round(6)])
    end
    groups[k] = new_coords
  end
  
  return groups
end

json = JSON.parse(File.open(json_in, "r").read)
json['features'].each do |f|
  new_properties = {
    'name' => f['properties']['name'].nil? ? f['properties']['NAME'] : f['properties']['name'],
    'code' => f['properties']['code'].nil? ? f['properties']['KURZ'] : f['properties']['code'],
  }

  if f['geometry']['type'] == 'Polygon'
    f['geometry']['coordinates'] = get_group_coordinates(f['geometry']['coordinates'])
  end
  
  if f['geometry']['type'] == 'MultiPolygon'
    f['geometry']['coordinates'].each_with_index do |polygon_coordinates, k|
      polygon_coordinates = get_group_coordinates(polygon_coordinates)
    end
  end
  
  new_json['features'].push({
    'type' => 'Feature',
    'properties' => new_properties,
    'geometry' => f['geometry']
  })
end

File.open(json_in, "w") {|f| f.write(JSON.pretty_generate(new_json)) }

