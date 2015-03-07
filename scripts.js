// todo(ben): layout for individual problem sets
function pset_layout(pset) {
  console.log(pset);
}

d3.select("input[value=\"ps2\"]").on("click", function() {
  pset_layout(this.value);
});

d3.json("output/all.json", function(error, data) {
  console.log(data);
});
