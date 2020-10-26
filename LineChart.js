'use strict';

function lineChart() {

    var scope = this;
    var exports = {};

    scope.margins = {top: 10, bottom: 60, left: 40, right: 15};
    
    scope.cw = 500;
    scope.ch = 260;
    //scope.ch2 = 40;

    scope.xScale = undefined;
    
    
    scope.yScale = undefined;
    scope.y2Scale = undefined;

    scope.xAxis = undefined;
    scope.x2Axis = undefined;

    scope.zoom = undefined;
    scope.brush = undefined;

    scope.allowLegend = true;

    scope.appendSvg = function(div) {
        
        var node = d3.select(div).append('svg')
            .attr('width', scope.cw + scope.margins.left + scope.margins.right)
            .attr('height', scope.ch + scope.margins.top + scope.margins.bottom);

        return node;
    }

    scope.appendFocus = function(svg) {

        var focus = svg.append('g')
            .attr('width', scope.cw)
            .attr('height', scope.ch)
            .attr('class', 'focus')
            .attr('transform', 'translate(' + scope.margins.left + ',' + scope.margins.top + ')');
        
            return focus;
        
    }

    scope.createFirstAxis = function(svg, data) {
        
        scope.xScale = d3.scaleTime()
            .domain(d3.extent(data, function(d) {
                return d.vx }))
            .range([0, scope.cw]);
            
        scope.yScale = d3.scaleLinear()
            .domain(d3.extent([0, d3.max(data, function(d) {
                return parseFloat(d.vy); })]))
            .range([scope.ch,0]).nice();
            
        scope.xAxisGroup = svg.append('g')
            .attr('class', 'xAxis')
            .attr('transform', 'translate('+ scope.margins.left +','+ (scope.ch + scope.margins.top) +')');
            
        scope.yAxisGroup = svg.append('g')
            .attr('class', 'yAxis')
            .attr('transform', 'translate('+ scope.margins.left +','+ scope.margins.top +')');

        scope.xAxis = d3.axisBottom(scope.xScale)
            .tickSize(-(scope.ch))
            .tickPadding(10);
        
        scope.yAxis = d3.axisLeft(scope.yScale)
            .tickSize(-(scope.cw))
            .tickPadding(10);
    
        scope.xAxisGroup.call(scope.xAxis)

            
        scope.yAxisGroup.call(scope.yAxis)
            .append('text')
            .attr('class', 'axisLabel')
            .attr('y', -28)//-28
            .attr('x', -0.4*scope.ch)//-170
            .attr('transform', 'rotate(-90)')
            .text('Vitórias');
            
    }
    
    
    
    scope.appendFirstLines = function(svg, nested, colorScale) {
        
        var lineGenerator = d3.line()
                .x(function(d) { return scope.xScale(d.vx); } )
                .y(function(d) { return scope.yScale(d.vy); } );
            
        svg.selectAll('.line-path').data(nested)
            .enter().append('path')
            .attr('class', 'line-path')
            .attr('d', function(d) { return lineGenerator(d.values); })
            .attr('stroke', function(d) { return colorScale(d.key)});
    }

    

    scope.appendLegend = function(svg, nested, colorScale) {

        var legend = svg.selectAll('.legend').data(nested)
            .enter().append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i) { return 'translate(0,' + i * 12 + ')'; });
    
        legend.append('rect')
            .attr('x', scope.cw - 10)
            .attr('y', scope.ch/2 + 55)
            .attr('width', 8)
            .attr('height', 8)
            .attr('fill', function(d) { return colorScale(d.key); });
    
        legend.append('text')
            .attr('x', scope.cw - 2 - 10)
            .attr('y', scope.ch/2 + 55 + 5)
            .attr('dy', '.35em')
            .style('text-anchor', 'end')
            .style('font-size', '10px')
            .text(function(d) { return d.key; });
    
    }


    scope.fileCSV = function(file, svg, focus, ctx) {

        d3.csv(file, function(error, data) {
    
            if (error) throw error;
    
            data.forEach(d => {
                //Variável y do gráfico de linhas
                d.vy= +d.victories;
                //Variável x do gráfico de linhas
                d.vx = new Date(d.year);
            });
            
            //Criando classes com a variável de times
            const nested = d3.nest()  
                .key(function(d) { return d.team; })
                .entries(data);
            console.log(nested);
            
            //Atribuindo cores a essas classes
            const colorScale = d3.scaleOrdinal()
                .range(['#808080', '#FF0000', '#F08080', '#000000'])
                .domain(nested.map(function(d) { return d.key; }));
    
            scope.createFirstAxis(svg, data);
            
            scope.appendFirstLines(focus, nested, colorScale);
            
            if (scope.allowLegend)
                scope.appendLegend(focus, nested, colorScale);

        
        })
        
    }
    
    //------------- exported API -----------------------------------
    exports.run = function(div, data) {
        
        scope.div = div;

        var svg = scope.appendSvg(div);
        var focus = scope.appendFocus(svg);
        
        scope.fileCSV(data, svg, focus);
    }

    return exports;

};
