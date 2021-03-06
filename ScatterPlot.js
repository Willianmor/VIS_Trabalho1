'use strict';

function scatterPlot() {

    var scope = this;
    var exports = {};

    scope.margins = {top: 10, bottom: 30, left: 35, right: 15};
    scope.cw = 300;
    scope.ch = 300;
    
    scope.div        = undefined;

    scope.xScale = undefined;
    scope.yScale = undefined;

    scope.xAxis = undefined;
    scope.yAxis = undefined;

    scope.nScaleX = undefined;

    scope.allowLegend = true;

    scope.brush = undefined;


    scope.appendSvg = function(div, data) {

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

    scope.createAxes = function(svg, data) {

        const padding = 80;
        const xMin = d3.min(data, function(d) { return parseInt(d.vy); });
        const xMax = d3.max(data, function(d) { return parseInt(d.vy); });
        const yMin = d3.min(data, function(d) { return parseInt(d.vx); });
        const yMax = d3.max(data, function(d) { return parseInt(d.vx); });
    
        scope.xScale = d3.scaleLinear()
            .domain(d3.extent([xMin, xMax]))
            //.range([0, scope.cw - padding]).nice();
            .range([0, scope.cw]).nice();
            
        scope.yScale = d3.scaleLinear()
            .domain(d3.extent([yMin, yMax]))
            .range([scope.ch,0]).nice();
            
        var xAxisGroup = svg.append('g')
            .attr('class', 'xAxis')
            .attr('transform', 'translate('+ scope.margins.left +','+ (scope.ch + scope.margins.top) +')');
            
        var yAxisGroup = svg.append('g')
            .attr('class', 'yAxis')
            .attr('transform', 'translate('+ scope.margins.left +','+ scope.margins.top +')');
    
        scope.xAxis = d3.axisBottom(scope.xScale)
            .tickSize(-(scope.ch));      
        
        scope.yAxis = d3.axisLeft(scope.yScale)
            //.tickSize(-(scope.cw - padding))
            .tickSize(-(scope.cw))
            .tickFormat(d3.format('.2s'));
        
        xAxisGroup.call(scope.xAxis)
            .append('text')
            .attr('class', 'axisLabel')
            .attr('y', 25)
            .attr('x', 0.5*scope.cw)
            .attr('fill', 'black')
            .style('text-anchor', 'end')
            .text('Vitórias');
            
        yAxisGroup.call(scope.yAxis)
            .append('text')
            .attr('class', 'axisLabel')
            .attr('y', -22)
            .attr('x', -0.5*scope.ch)
            .attr('fill', 'black')
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'end')
            .text('Derrotas');
    
    }
    
    scope.appendCircles = function(svg, data, colorScale) {
        
        var circles = svg.selectAll('circle')
            .data(data)
            .enter()
            .append('g');
    
        circles.append('circle')
            .attr('r', 4)
            .attr('cx', function(d) { return scope.xScale(parseInt(d.vy)); })
            .attr('cy', function(d) { return scope.yScale(parseInt(d.vx)); })
            .attr('fill', function(d) { return colorScale(d.team)});
    
    }
    
    scope.appendLegend = function(svg, nested, colorScale) {
        
        var legend = svg.selectAll('.legend').data(nested.slice())
            .enter().append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i) { return 'translate(0,' + i * 12 + ')'; });
    
        legend.append('rect')
            .attr('x', scope.cw + 10)
            .attr('y', scope.ch - 50)
            .attr('width', 8)
            .attr('height', 8)
            .attr('fill', function(d) { return colorScale(d.key); });
    
        legend.append('text')
            .attr('x', scope.cw - 2 + 10)
            .attr('y', scope.ch - 50 + 5)
            .attr('dy', '.35em')
            .style('text-anchor', 'end')
            .text(function(d) { return d.key; });
    }

    scope.addZoom = function(svg) {
        
        function zoomed() {
            
            var t = d3.event.transform;
            
            scope.nScaleX = t.rescaleX(scope.xScale);

            svg.selectAll('circle')
                .attr('cx', function(d) { return scope.nScaleX(d.vy); })
            
            scope.xAxis.scale(scope.nScaleX);
            
            svg.select('.xAxis').call(scope.xAxis);
        }
        
        scope.zoom = d3.zoom()
            .scaleExtent([1, 8])
            .translateExtent([[0, 0], [scope.cw, scope.ch]])
            .extent([[0, 0], [scope.cw, scope.ch]])
            .on('zoom', function(d){return zoomed()});
    
        svg.append('circle')
            .attr('class', 'zoom')
            .attr('width', scope.cw)
            .attr('height', scope.ch)
            .attr('transform', 'translate('+ scope.margins.left +','+ (scope.ch+scope.margins.top) +')')
            .call(scope.zoom);   
    }
    
    scope.addBrush = function(svg, colorScale) {
        
        function brushed() {

            if (!d3.event.sourceEvent) return; // Only transition after input.
            if (!d3.event.selection) return; // Ignore empty selections.
        
            var s = d3.event.selection,
               x0 = s[0][0],
               y0 = s[0][1],
               x1 = s[1][0],
               y1 = s[1][1];
            
            let nScale = scope.xAxis.scale();
            var color = function (d) {
                if (nScale(d.vy) >= x0 && nScale(d.vy) <= x1 && 
                    scope.yScale(d.vx) >= y0 && scope.yScale(d.vx) <= y1)
                    { return 'purple'; }
                    
                else
                    
                    { return colorScale(d.team); }
            };
    
            svg.selectAll('circle')
                .style('fill', color);
                
        };
    
        scope.brush = d3.brush()
            .extent([[0,0], [scope.xScale.range()[1], 
                scope.yScale.range()[0]]])
            .on('brush', brushed);
    
        svg.append('g').attr('class', 'brush')
            //.call(scope.brush);
        
        svg.select('.brush').call(scope.brush);
            
        
    }
    
    scope.fileCSV  = function(file, svg, cht) {
            
        d3.csv(file, function(error, data) {
            if (error) throw error;        
            //console.log(data)
    
            //Editando as variáveis do gráfico
            data.forEach(d => {
                //Variável y do gráfico 
                d.vy= +d.victories;
                //Variável x do gráfico 
                d.vx = +d.losses;
            });

            //Criando classes com a variável de times
            var nested = d3.nest()
                .key(function(d) { return d.team; })
                .entries(data);

            console.log(nested)
            
            //Atribuindo cores
            const colorScale = d3.scaleOrdinal()
                .range(['#000000','#808080','#FF0000','#F08080'])
                .domain(nested.map(function(d) { return d.team; }));

            //Mudei a escala de cores para dar mais intuição aos usuários, mas a que gera automaticamente é:
            //d3.scaleOrdinal(d3.schemeCategory10)

            //Crindo os eixos
            scope.createAxes(svg, data);
            //Atribuindo o zoom
            scope.addZoom(svg);
            scope.appendCircles(cht, data, colorScale);
            
            if (scope.allowLegend)         
                scope.appendLegend(svg, nested, colorScale);

            scope.addBrush(cht, colorScale);
            
    
        });

    }

        //------------- exported API -----------------------------------

        exports.run = function(div, data) {
            
            scope.div = div;
            //scope.callback = callback;

            var svg = scope.appendSvg(div, data);
            var cht = scope.appendChartGroup(svg); 

            scope.fileCSV(data, svg, cht);
        }

        return exports;
        
    



}