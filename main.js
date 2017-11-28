// We want to make sure the view is big enough. So we take the max
// of the window dimensions and how big we want the dimensions to be.

var width = Math.max(960, window.innerWidth),
    height = Math.max(500, window.innerHeight);

// Basic math variables...

var pi = Math.PI,
    tau = 2 * pi;

// d3 has a native geoMercator generator, which we can use
// with the math variable "tau" we just created.

var projection = d3.geoMercator()
  .scale(1 / tau)
  .translate([0, 0]);

// Now we can make the actual path from the projection
// we just created.

var path = d3.geoPath()
  .projection(projection);

// We should make some tiles for the map, so we make the native
// d3 tile() feature, using the dimensions we created.

var tile = d3.tile()
  .size([width, height]);

// We want to control how much the zoom alters the view. Luckily,
// again we have a native d3 feature for this very purpose.
// We want to alter the x axis less than the y. From zoom, we want
// to start another method, which we'll describe later.

var zoom = d3.zoom()
  .scaleExtent([
    1 << 11,
    1 << 24
  ])
  .on('zoom', zoomed);

// Need to create circles for the earthquake data.

var radius = d3.scaleSqrt().range([0, 10]);

// Basic SVG element.

var svg = d3.select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

var raster = svg.append('g');

// render to a single path:
// var vector = svg.append('path');
// render to multiple paths:
var vector = svg.selectAll('path');

// Now, we go over the GeoJSON data we have in data/. 
// Everything will be manipulated in the callback.

d3.json('data/earthquakes_4326_cali.geojson', function(error, geojson) {
  if (error) throw error;
  
  console.log(geojson);

  // Want radius to apply to the magnitude of the earthquake.
  
  radius.domain([0, d3.max(geojson.features, function(d) { return d.properties.mag; })]);
  
  // And apply those to the path, so that they get drawn correctly.

  path.pointRadius(function(d) {
    return radius(d.properties.mag);
  });
  
  // render to a single path:
  // vector = vector.datum(geojson);
  // render to multiple paths:
  vector = vector
    .data(geojson.features)
    .enter().append('path')
    .attr('d', path)
    .on('mouseover', function(d) { console.log(d); });
  
  // Custom center on California.

  var center = projection([-119.665, 37.414]);
  
  // For the SVG element, we want to clarify the arguments
  // for the zoom feature on the map.

  svg.call(zoom)
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(1 << 14)
        .translate(-center[0], -center[1])
    );
});


// Finally, our zoom feature!

function zoomed() {

  // Start out with a native d3 event object, transform.

  var transform = d3.event.transform;
  
  // Alter the tiles in accordance with the new transform object.

  var tiles = tile
    .scale(transform.k)
    .translate([transform.x, transform.y])
    ();
  
  // (Let's briefly call the transform to see what properties
  // it has...)

  console.log(transform.x, transform.y, transform.k);
  
  // Now we want to alter the entire map projection with the 
  // transform properties, but in order to do this we need to 
  // recall the math variables created earlier.

  projection
    .scale(transform.k / tau)
    .translate([transform.x, transform.y]);
  
  vector.attr('d', path);
  
  var image = raster
    .attr('transform', stringify(tiles.scale, tiles.translate))
    .selectAll('image')
    .data(tiles, function(d) { return d; });
  
  image.exit().remove();
  
  image.enter().append('image')
    .attr('xlink:href', function(d) {
      return 'http://' + 'abc'[d[1] % 3] + '.basemaps.cartocdn.com/rastertiles/voyager/' +
        d[2] + "/" + d[0] + "/" + d[1] + ".png";
    })
    .attr('x', function(d) { return d[0] * 256; })
    .attr('y', function(d) { return d[1] * 256; })
    .attr('width', 256)
    .attr('height', 256);
}

function stringify(scale, translate) {
  var k = scale / 256,
      r = scale % 1 ? Number : Math.round;
  return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
}










///