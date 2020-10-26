'use strict';

function barChart() {
    
    var scope = this;
    var exports = {};

    scope.margins = {top: 10, bottom: 30, left: 35, right: 15};
    scope.cw = 900;
    scope.ch = 360;

    scope.ymax = undefined;
    
    scope.div        = undefined;
    scope.x0Scale    = undefined;
    scope.x1Scale    = undefined;
    scope.yScale     = undefined;
    scope.x0Axis     = undefined;
    scope.yAxis      = undefined;

    scope.barWidth   = undefined;
    scope.barPadding = undefined;

    scope.colorScale = undefined;

    scope.data       = undefined;

    scope.allowLegend = false;

    scope.appendSvg = function(div) {
    
        var node = d3.select(div).append('svg')
            .attr('width', scope.cw + scope.margins.left + scope.margins.right)
            .attr('height', scope.ch + scope.margins.top + scope.margins.bottom);

        return node;
    }

    scope.appendChartGroup = function(svg) {
        
        var chart = svg.append('g')
            .attr('width', scope.cw)
            .attr('height', scope.ch)
            .attr('transform', 'translate('+ scope.margins.left +','+ scope.margins.top +')' );

        return chart;
    }

    scope.createAxes = function(svg, data, classes) {
        
        var padding = 80;

        scope.x0Scale = d3.scaleBand()
            .domain(data.map(function(d) { return d.vx; }))
            .range([0, scope.cw])
            .round(true);

        scope.barWidth = scope.x0Scale.bandwidth() / classes.length;
        scope.barPadding = scope.barWidth * 0.3;

        scope.x1Scale = d3.scaleBand()
            .domain(classes)
            .range([scope.barPadding, scope.x0Scale.bandwidth() - scope.barPadding]);

        scope.yScale = d3.scaleLinear()
            .domain(d3.extent([0, scope.ymax]))
            .range([scope.ch,0]).nice();
    
        var x0AxisGroup = svg.append('g')
            .attr('class', 'xAxis')
            .attr('transform', 'translate('+ scope.margins.left +','+ (scope.ch + scope.margins.top) +')');

        var yAxisGroup = svg.append('g')
            .attr('class', 'yAxis')
            .attr('transform', 'translate('+ scope.margins.left +','+ scope.margins.top +')');
    
        scope.x0Axis = d3.axisBottom(scope.x0Scale)
            .tickSize(10)
            .tickPadding(10);

        scope.yAxis = d3.axisLeft(scope.yScale)
            .tickSize(-(scope.cw))
            .tickPadding(2)
            .tickFormat(d3.format('.2s'));

        x0AxisGroup.call(scope.x0Axis)

        yAxisGroup.call(scope.yAxis)
            .append('text')
            .attr('class', 'axisLabel')
            .attr('y', -20) 
            .attr('x', -170)
            .attr('transform', 'rotate(-90)')
            .text('Vitórias');
    }

    scope.appendBars = function(svg, data) {

        var vx = svg.append('g')
            .style('clip-path', 'url(#clip)')
            .selectAll('g')
            .data(data)
            .enter().append('g')
                .attr('class', 'barGroup')
                .attr('transform', function(d) { return "translate(" + scope.x0Scale(d.vx) + ",0)"; });
        
        vx.selectAll('rect')
            .data(function(d) { return d.classes.map((d1)=>{return {"vx":d.vx,"name":d1.name, "value":d1.value};}); })  
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('width', scope.x1Scale.bandwidth())
            .attr('x', function(d) { return scope.x1Scale(d.name); })
            .attr('y', function(d) { return scope.yScale(d.value); })
            .attr('height', function(d) { return scope.ch - scope.yScale(d.value); })
            .style('fill', function(d) { return scope.colorScale(d.name); });
    
        var addDataIdentification = function() {
        
            vx.selectAll('text')
                .data(function(d) { return d.classess; })
                .enter().append('text')
                .attr('x', function(d) { return scope.x1Scale(d.name) + scope.x1Scale.bandwidth()/2; } )
                .attr('y', function(d) { return scope.yScale(d.value) -5; })
                .attr('fill', 'black')
                .attr('font-size', '7px')
                .attr('text-anchor', 'middle')
                .text(function(d) { return d.value; });
        }
        
    }

    scope.appendLegend = function(svg, classes) {

        var legend = svg.selectAll('.legend')
            .data(classes.slice().reverse())
            .enter().append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i) { return 'translate(0,' + i * 20 + ')'; });
    
        legend.append('rect')
            .attr('x', scope.cw)
            .attr('y', 9)
            .attr('width', 18)
            .attr('height', 18)
            .style('fill', scope.colorScale);
    
        legend.append('text')
            .attr('x', scope.cw - 2)
            .attr('y', 9 + 9)
            .attr('dy', '.35em')
            .style('text-anchor', 'end')
            .text(function(d) { return d; });
    
    }

    scope.addZoom = function(svg, classes) {
    
        function zoomed() {
    
            var t = d3.event.transform;
    
            scope.x0Scale.range([0, scope.cw].map(d => t.applyX(d)));
            
            scope.barWidth = scope.x0Scale.bandwidth() / classes.length;
            scope.barPadding = scope.barWidth * 0.3;
            
            scope.x1Scale.range([scope.barPadding, scope.x0Scale.bandwidth() - scope.barPadding]);
    
            svg.selectAll('.barGroup').attr('transform', function(d) { return 'translate(' + scope.x0Scale(d.vx) + ',0)'; });
            svg.selectAll('.bar').attr('x', function(d) { return scope.x1Scale(d.name); }).attr('width', scope.x1Scale.bandwidth());
    
            svg.select(".xAxis").call(scope.x0Axis);
            
        }
    
        scope.zoom = d3.zoom()
            .scaleExtent([1, 8])
            .translateExtent([[0, 0], [scope.cw, scope.ch]])
            .extent([[0, 0], [scope.cw, scope.ch]])
            .on('zoom', () => { zoomed()});
    
        svg.call(scope.zoom);
        
    }

    scope.addBrush = function(svg, classes) {

        function brushed() {
            if (!d3.event.sourceEvent) return; // Only transition after input.
            if (!d3.event.selection) return; // Ignore empty selections.
    
            var s = d3.event.selection;
            var x0 =s[0];
            var x1 = s[1];
    
           var color = function (d) {
                //console.log("Color", d);
                const pos = scope.x0Scale(d.vx) + (scope.x1Scale(d.name) + scope.x1Scale.bandwidth()/2); 
                if ( pos >= x0 && pos <= x1 && (x1-x0) >= 1)
                    { return 'gray'; }
                else 
                    { return scope.colorScale(d.name); }    
            }; 
            
            svg.selectAll('.bar')
                .style('fill', color);
    
        }
    
        scope.brush = d3.brushX()
            .extent([[0,0], [scope.x0Scale.range()[1], 
                scope.yScale.range()[0]]])
            .on('brush', brushed);
        
        svg.append('g').attr('class', 'brush');
    
        svg.select('.brush').call(scope.brush);
    
    }

    scope.fileCSV = function(file, svg, cht) {

        d3.csv(file, function(error, data) {
            if (error) throw error;

            scope.ymax = d3.max(data,function(d) { return  +d.victories; });
            console.log(scope.ymax)

            var classes = []
            var vx = []
            var novoData = []
            data.forEach(d => {
                if (classes.includes(d.team)){
                } 
                else{
                    classes.push(d.team) 
                } 
                if (vx.includes(d.year)){ 
                    } 
                else{
                    novoData.push({"vx":d.year ,"classes":[] });
                    vx.push(d.year) 
                }    
            });
    
            console.log(classes);
            console.log(vx);
            //console.log(novoData);


            //Tratando os dados
            data.forEach(function(d) {
                
                for(var i=0;i<novoData.length;i++)
                {
                    if(novoData[i]["vx"] == d.year)
                    {
                        novoData[i]["classes"].push({"name":d.team,"value":d.victories});
                        novoData[i][d.team] = d.victories
                    }
                }
            });
            //console.log(novoData)
        
            data = novoData
    
    
        scope.colorScale = d3.scaleOrdinal()
            .range(['#808080', '#FF0000', '#F08080', '#000000'])
        
        scope.addZoom(svg, classes);
        scope.createAxes(svg, data, classes);
        scope.appendBars(cht, data);
        if (scope.allowLegend)
            scope.appendLegend(svg, classes);
    
        scope.addBrush(cht, classes);
    
        });
        
    }

    //------------- exported API -----------------------------------

    exports.run = function(div, data) {
        
        scope.div = div;
        //scope.callback = callback;

        var svg = scope.appendSvg(div);
        var cht = scope.appendChartGroup(svg); 

        scope.fileCSV(data, svg, cht);
    }

    return exports;

};