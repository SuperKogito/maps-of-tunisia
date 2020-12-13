var width = 550,
    height = 750;
    active = d3.select(null);

var path = d3.geo.path();

var svg = d3.select("div.map-graph")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

svg.append("rect")
   .attr("class", "background")
   .attr("width", width)
   .attr("height", height)
   .on("click", reset);

var g = svg.append("g")
           .style("stroke-width", "1.5px");


const tooltip = d3.select("div.map").append("div")
                  .attr("class", "tooltip")
                  .style("opacity", 0);

 d3.select("div.map-buttons")
   .append("input")
   .attr("type", "button")
   .attr("name", "toggle")
   .attr("value", "Show all delegations")
   .attr("onclick", "show_all_delegations()")
   .style("width", "200px")
   .style("margin", "5px");

d3.selectAll("div.map-buttons")
 .append("input")
 .attr("type", "button")
 .attr("name", "Reset")
 .attr("value", "Reset")
 .attr("onclick", "reset_all_delegations()")
 .style("width", "200px")
 .style("margin", "5px");

 function range(start, end, step) {
   var list = [];
   for (var i = start; i <= end; i=i+step) {
       list.push(i);
   }
   return list;
 }

function plot_governorates(governorate_parsed_data, delegation_parsed_data)
{
        var keys = Object.keys(delegation_parsed_data);
        min = Math.min.apply(null, keys.map(function(x) { return delegation_parsed_data[x]} ));;
        max = Math.max.apply(null, keys.map(function(x) { return delegation_parsed_data[x]} ));;
        let average = (array) => array.reduce((a, b) => a + b) / array.length;
        avg = average(Object.values(delegation_parsed_data));
        var r = range(min, max, 7)
        var color = d3.scale.log().domain(r)
                      .range(["#ff9690",
                              "#ff675f",
                              "#ff392e",
                              "#fc0c00",
                              "#cc0a00",
                              "#9b0700",
                              "#6a0500",
                              "#390200",
                              "#100000",
                              "black"]);

        //create a new SVG in the body
        const legend = d3.select("div.map-graph").append('svg')
            .attr('class', 'legend')
            .attr('width', 550)
            .attr('height', 148)
            //then either select all the 'g's inside the svg
            //or create placeholders
            .selectAll('g')
            //Fill the data into our placeholders in reverse order
            //This arranges our legend in descending order.
            //The 'data' here is the items we entered in the 'domain',
            //in this case [min, max]
            //We use 'slice()' to create a shallow copy of the array
            //Since we don't want to modify the original one
            .data(color.domain().slice().reverse())
            //Every node in teh data should have a 'g' appended
            .enter().append('g')
            //the 'g' should have this attribute
            .attr("transform", function(d, i) { return "translate(" + i * 80 + ",0)"; });

        // Inside every 'legend', insert a rect
        legend.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
              .attr("x", 24)
              .attr("y", 9)
              .attr("dy", ".35em")
              .style("color", "green")
              .text(function(d) { console.log(d); return `${d}%`}).style("fill", "grey");

        d3.json("jsons/tn.json", function(error, topology)
        {
                // console.clear();
                var delegations_feature_collection = topojson.feature(topology, topology.objects.delegations);
                var governorates_feature_collection = topojson.feature(topology, topology.objects.governorates);
                var governorates_bounds             = d3.geo.bounds(governorates_feature_collection);

                var center_x = d3.sum(governorates_bounds, function(d) {return d[0];}) / 2,
                    center_y = d3.sum(governorates_bounds, function(d) {return d[1];}) / 2;

                var projection = d3.geo.mercator()
                                   .scale(4950)
                                   .center([center_x+2.75, center_y+1.2]);

                path.projection(projection);

              console.log(topology.objects.governorates);
              topology.objects.governorates.geometries.forEach(function(item, index)
              {
                console.log(item.properties.gov_name_f);

                 /********************************************************
                  * Visualize governorates
                  *******************************************************/
                  g.selectAll("path")
                   .data(governorates_feature_collection.features)
                   .enter().append("path")

                   .attr("d", path)
                   .attr("class", "governorate")
                   .attr("id", item.properties.gov_name_f.split(" ").join("_"))

                    // style governorate class
                   .style('stroke', 'white')
                   .style('stroke-width', 2.5)
                   .style("opacity",0.8)

                    // tooltips
                   .style("stroke","white")
                   .style('stroke-width', 0.75)
                   .style('fill', function (d) { return color(governorate_parsed_data[d.properties.gov_name_f]); })

                    // handles
                   .on('mousemove', function(d) { return handle_mouse_move(d.properties.gov_name_f, d.properties.gov_name_a, governorate_parsed_data[d.properties.gov_name_f]); })
                   .on("mouseout", handle_mouse_out)
                   .on("click", clicked);

                       /********************************************************
                        * Visualize delegations
                        *******************************************************/
                       g.selectAll("#" + item.properties.gov_name_f)
                        .data(delegations_feature_collection.features)
                        .enter().append("path")
                        .filter( function (d) { return (d.properties.gov_id === item.properties.gov_id); })
                        .attr("d", path)
                        .attr("class", "delegation")
                        .attr("id", item.properties.gov_name_f.split(" ").join("_") + "_delegations")
                        .attr("visibility", "hidden")

                         // style element
                        .style('stroke', 'white')
                        .style('stroke-width', .5)
                        .style("opacity", 0.8)

                         // tooltips
                        .style("stroke","white")
                        .style('stroke-width', 0.25)
                        .style('fill', function (d) {
                                if   (delegation_parsed_data[d.properties.deleg_na_1] === undefined) {return "#9e9e9e"; }
                                else { return color(delegation_parsed_data[d.properties.deleg_na_1]); }
                        })
                        // handles
                        .on('mousemove', function (d) {
                          console.log(d.properties.deleg_na_1);
                              if (delegation_parsed_data[d.properties.deleg_na_1] === undefined) {return handle_mouse_move(d.properties.deleg_na_1, d.properties.deleg_name, ""); }
                              else { return handle_mouse_move(d.properties.deleg_na_1, d.properties.deleg_name, delegation_parsed_data[d.properties.deleg_na_1]); }
                        })
                        .on("mouseout", handle_mouse_out)
                        .on("click", clicked);
                });


                g.append("path")
                 .datum(topojson.mesh(topology, delegations_feature_collection.features, function(a, b) { return a !== b; }))
                 .attr("class", "mesh")
                 .attr("d", path);
        });

}

function handle_mouse_move(text_1, text_2, text_3)
{
    tooltip.transition()
           .duration(200)
           .style("opacity", .95);

    // any time the mouse moves, the tooltip should be at the same position
    tooltip.style("left", (d3.event.pageX) + "px")
           .style("top",  (d3.event.pageY) + "px")
           //The text inside should be State: rate%
           .text(()=> `${text_1}  ${text_2} %${text_3}`).style("color", "black")
}

function handle_mouse_out()
{
    // make the tooltip transparent
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
}

function clicked(d)
{
    console.log("SELECTED STATE: ", d.properties.gov_name_f, d.properties.gov_id);
    console.log("this: ", this, active.node())

    if (active.node() === this) return reset(d);
    active.classed("active", false);
    active = d3.select(this).classed("active", true);

    console.log("TEST ", this.__data__.properties.gov_id)

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x  = (bounds[0][0] + bounds[1][0]) / 2,
        y  = (bounds[0][1] + bounds[1][1]) / 2,

      scale = .9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

    g.transition()
      .duration(750)
      .style("stroke-width", 1.5 / scale + "px")
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

   g.selectAll(".delegation").attr("visibility", "hidden")
   g.selectAll("#" + d.properties.gov_name_f.split(" ").join("_") + "_delegations").attr("visibility", "visible")
}

function show_all_delegations() {
  g.selectAll(".delegation").attr("visibility", "visible")
  g.transition()
    .duration(750)
    .style("stroke-width", "1.5px")
    .attr("transform", "");
}

function reset_all_delegations() {
  g.selectAll(".delegation").attr("visibility", "hidden")
  g.transition()
    .duration(750)
    .style("stroke-width", "1.5px")
    .attr("transform", "");
}

function reset(d) {
  active.classed("active", false);
  active = d3.select(null);

  g.selectAll(".delegation").attr("visibility", "hidden")
  g.transition()
    .duration(750)
    .style("stroke-width", "1.5px")
    .attr("transform", "");
}




d3.csv("data/p17.csv", function(governorate_data) {
       governorate_parsed_data = {};
       for (i=0; i < governorate_data.length; i++) {
         governorate_parsed_data[governorate_data[i]["Governorate"]] = parseFloat(governorate_data[i]["nombre2018"].replace(",", ".")); }

       d3.csv("data/poverty_data_par_delegation.csv", function(delegation_data) {
              delegation_parsed_data = {};
              for (i=0; i < delegation_data.length; i++) {
                delegation_parsed_data[delegation_data[i]["Delegation"]] = parseFloat(delegation_data[i]["Poverty"].replace(",", ".")); }

       console.log(delegation_parsed_data);
       plot_governorates(governorate_parsed_data, delegation_parsed_data);
     });
});
