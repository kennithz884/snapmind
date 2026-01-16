
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { KnowledgeNode, KnowledgeLink } from '../types';

interface GraphProps {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
}

const KnowledgeGraph: React.FC<GraphProps> = ({ nodes, links }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", (d) => {
          switch(d.group) {
              case 'Technical': return '#3b82f6';
              case 'Shopping': return '#ef4444';
              case 'Chat': return '#10b981';
              default: return '#9ca3af';
          }
      })
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("title").text(d => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [nodes, links]);

  return (
    <div className="w-full h-[400px] bg-white rounded-3xl border border-gray-100 overflow-hidden relative">
      <div className="absolute top-4 left-6 z-10">
        <h4 className="text-sm font-semibold text-gray-900">Knowledge Mesh</h4>
        <p className="text-xs text-gray-500">Semantic connections between insights</p>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default KnowledgeGraph;
