class LineGraph {
    constructor(el, options) {
        this.data = options.data || [];
        this.width = options.width || 960;
        this.height = options.height || 500;
        this.dataKey = options.dataKey || "";
        this.errorKey = options.errorKey || "";
        this.variable = options.variable || "manpower";
        this.x = null;
        this.y = null;
        this.xLabel = options.xLabel || "Year"
        this.yLabel = options.yLabel || this.variable;

        this.tags = options.tags || [];

        this.colors = options.colors || []; //["#bf0404", "#e6df22", "#25e8e2", "#3af016"];
        this.render();
    }

    render(rerender=false) {
        if (rerender){
            d3.select("#chart").selectAll("*").remove();
        }
        var data = this.GetPrettyData()

        let margin = { top: 20, right: 20, bottom: 50, left: 50 };
        let height = this.height - margin.bottom - margin.top;
        let width = this.width - margin.right - margin.left;

        this.x = d3.scaleLinear().range([0, width]);
        this.y = d3.scaleLinear().range([height, 0]);

        let svg = d3.select("#chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        this.x.domain([d3.min(data, d => {
            return Math.min(d.date); }),
            d3.max(data, d => {
                return Math.max(d.date); })]);

         this.y.domain([d3.min(data, d => {
                return Math.min(...Array.from(this.tags, tag => {return parseFloat(d[tag])-(parseFloat(d[tag])*.10)}))}),
                d3.max(data, d => {
                return Math.max(...Array.from(this.tags, tag => {return parseFloat(d[tag])+(parseFloat(d[tag])*.10)}))})]);

        this.tags.forEach((tag, i) => {
            svg.append("path")
                .data([data])
                .attr("class", "line")
                .attr("id", tag + "Line")
                .style("stroke", this.colors[i])
                .attr("d", this.PathGenerator(tag));
        });

        // Add the X Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "axis")
            .call(d3.axisBottom(this.x));

        // Add the Y Axis
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(this.y));


        svg.append("text")
            .attr("transform",
                "translate(" + (width/2) + " ," +
                (height + margin.top + 20) + ")")
            .attr("class", "axisLabel")
            .attr("id", "xAxis")
            .text(this.xLabel);


        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .attr("class", "axisLabel")
            .attr("id", "yAxis")
            .text(this.yLabel);
        }

        PathGenerator(tag){
            return (d3.line()
            .x(d => { return this.x(d["date"]); })
            .y(d => { return this.y(parseFloat(d[tag])); }));
        }

        UpdateXAxisLabel(newLabel){
            this.xLabel = newLabel;
            document.getElementById("xAxis").innerHTML = newLabel;
        }

        UpdateYAxisLabel(newLabel){
            this.yLabel = newLabel;
            document.getElementById("yAxis").innerHTML = newLabel;
        }

        ChangeVariable(newVariable, newVariableLabel){
            this.variable = newVariable;
            this.UpdateYAxisLabel(newVariableLabel);
            this.render(true);
        }

        GetYearFromDateString(dateString){
            var dateArray = dateString.split(".");
            return parseFloat(dateArray[0]) + this.GetDecimalFromMonthAndDay(dateArray[1], dateArray[2]);
        }

        GetDecimalFromMonthAndDay(month, day){
            return Math.round((30 * (parseInt(month) - 1) + parseInt(day)) / 365 * 10) / 10
        }

        GetPrettyData(){
            var prettyData = [];
            this.data.ALL.date.forEach((date, i) => {
                var timePointObject = {"date": this.GetYearFromDateString(date)};
                this.tags.forEach((tag) => {
                    timePointObject[tag] =
                    this.data[tag][this.variable][i] === "NONE" ? 0 : this.data[tag][this.variable][i];
                });
                prettyData.push(timePointObject);
            });
            return prettyData;
        }

    }




const fs = require('fs');
const uiBuild = require("./dist/plotUIBuild.js")

let saveFile = fs.readFileSync('./saves/TUR_1450.1.1.json');
var data = JSON.parse(saveFile);

uiBuild.populateVariableSelect();
uiBuild.populateGraphCheckBoxes();

var chart = new LineGraph('#chart', {
    data: data,
    width: 960,
    height: 700,
    variable: "manpower",
    yLabel: "Manpower",
    tags: uiBuild.getActiveTags(),
    colors: uiBuild.getActiveTagColors(),
    });

document.getElementById("variableSelect").addEventListener("change", (event) => {
    chart.ChangeVariable(event.target.value, event.target.options[event.target.selectedIndex].text);
});
document.getElementsByName("tag").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
        let lineId = event.target.id + "Line"
        document.getElementById(lineId).style.display = event.target.checked ? "" : "None";
    });
});