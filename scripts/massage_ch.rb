require 'json'

APP_PATH = File.expand_path(File.dirname(__FILE__)) + "/../"

json_in = "#{APP_PATH}/geojson/G3K12.geojson"

new_json = {
  'type' => 'FeatureCollection',
  'features' => []
}

json = JSON.parse(File.open(json_in, "r").read)
json['features'].each do |f|
  new_properties = {
    'name' => f['properties']['name'].nil? ? f['properties']['NAME'] : f['properties']['name'],
    'code' => f['properties']['code'].nil? ? f['properties']['KURZ'] : f['properties']['code'],
  }

  new_json['features'].push({
    'type' => 'Feature',
    'properties' => new_properties,
    'geometry' => f['geometry']
  })
end

File.open(json_in, "w") {|f| f.write(JSON.pretty_generate(new_json)) }

