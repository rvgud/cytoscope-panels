import React, { useEffect, useRef } from 'react';
import { PanelProps } from '@grafana/data';
import cytoscape from 'cytoscape';
import { CytoscopePanelOptions } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';

interface Props extends PanelProps<CytoscopePanelOptions> {}

const getStyles = () => {
  return {
    wrapper: css`
      font-family: Open Sans;
      position: relative;
    `,
    cytoscapeContainer: css`
      width: 100%;
      height: 100%;
      background: #f8f9fa;
    `,
  };
};

export const CytoscopePanel: React.FC<Props> = ({ data, width, height, options }) => {
  const styles = useStyles2(getStyles);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const levelColors: Record<number, string> = {};
  var selectedLayout = options.typeOfLayout
  var selectedLayoutOptions = options.layoutOptions
  const transformDataToElements = () => {
    const elements: cytoscape.ElementDefinition[] = [];
    const resultArray: Array<{ [key: string]: string }> = [];

    var groupingKeys = options.groupingOrderOfLables ? options.groupingOrderOfLables.split(',') : [];
    
    data.series.forEach((series) => {
      const labelField = series.fields[1];
      const valueField = series.fields[1];

      if (!labelField || !valueField) {
        return;
      }
      const labelsArray = labelField.labels;
      const valuesArray = valueField.values.toArray();
      if (labelsArray && valuesArray.length > 0) {
        var result: any = {};
        if (selectedLayout && selectedLayout !== 'breadthfirst') {
          result=labelsArray
          
        }
        else{
          groupingKeys.forEach((key) => {
            result[key] = labelsArray[key] || "unknown";
          });
        }
        
        result.value = valuesArray[0];

        resultArray.push(result);
      }
    });

    const groupData = (data: Array<any>, keys: string[]) => {
      return data.reduce((acc, curr) => {
        let currentGroup = acc;

        keys.forEach((key) => {
          const keyValue = curr[key];
          if (!currentGroup[keyValue]) {
            currentGroup[keyValue] = {};
          }
          currentGroup = currentGroup[keyValue];
        });

        if (curr.value !== undefined) {
          currentGroup.health = curr.value;
        }

        return acc;
      }, {});
    };
    

    const getRandomColor = () =>
      `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    if (resultArray.length > 0 && groupingKeys.length ===0) {
      groupingKeys = Object.keys(resultArray[0]);
    } 
    const groupedData = groupData(resultArray, groupingKeys);
    const generateElements = (data: Record<string, any>, parentId: string = '',depth: number = 0) => {
      if (!levelColors[depth]) {
        levelColors[depth] = getRandomColor(); // Assign a random color for this depth level
      }
      Object.keys(data).forEach((key) => {
        if (key === 'health') return;

        const nodeId = parentId ? `${parentId}-${key}` : key;
        if (parentId) {
          elements.push({
            data: { id: `edge-${parentId}-${nodeId}`, level: depth,source: parentId, target: nodeId },
          });
        }
        if (data[key].health !== undefined) {
          elements.push({
            data: { id: nodeId, label: key.split(":")[0].replace("sa-search-fare", "aeromart"), health: data[key].health },
          });
        } else {
          elements.push({
            data: { id: nodeId, label: key.split(":")[0].replace("sa-search-fare", "aeromart") },
          });
        }
        if (typeof data[key] === 'object' && !data[key].value) {
          generateElements(data[key], nodeId, depth + 1);
        } else if (data[key].value !== undefined) {
          elements.push({
            data: { id: `edge-${parentId}-${nodeId}`, source: parentId, target: nodeId },
          });
        }
      });
    };

    generateElements(groupedData);

    return elements;
  };

  useEffect(() => {
    if (!cyRef.current) {
      var layout = {
        name: selectedLayout,
        directed: true, // default value
        spacingFactor: 1.5, // default value
      };
      
      try {
        if(selectedLayoutOptions){
          const parsedOptions = JSON.parse(selectedLayoutOptions);
          Object.keys(parsedOptions).forEach((key) => {
            if (!(key in layout)) {
              layout[key] = parsedOptions[key];
            }
          });
        }
      } catch (error) {
      }
      const elements = transformDataToElements();
      cyRef.current = cytoscape({
        container: document.getElementById('cytoscape-container'),
        elements: elements,
        style: [
          {
            selector: 'node',
            style: {
              shape: 'bottom-round-rectangle',
              'width': '30px',
              'height': '30px',
              "font-size": 2,
              color: '#ffffff',
              backgroundColor: '#0066cc',
              label: 'data(label)',
              "text-halign": "center",
              "text-valign": "center",
              'text-wrap': 'ellipsis',
              'text-max-width': '25px',
            },
          },
          {
            selector: '[health > 1]', // Level 0
            style: {
              backgroundColor: '#ff6600', // Orange
            },
          },
          {
            selector: '[health > 2]', // Level 0
            style: {
              backgroundColor: '#ff3300', // Red
            },
          },
          {
            selector: '[health < 1]', // Level 0
            style: {
              backgroundColor: '#009900', // Green
            },
          },
          {
            selector: 'edge',
            style: {
              width: 1,
              'target-arrow-shape': 'triangle',
              'line-color': '#9dbaea',
              'target-arrow-color': '#9dbaea',
              'curve-style': 'bezier',
            },
          },
        ],
        layout: layout,
      });

      let lastClickedNodeId: string | null = null;
      var nodeCount=0
      const showAllDescendants = (nodeId: string) => {
        if(cyRef.current){
          nodeCount++;
          const node = cyRef.current.getElementById(nodeId);
          if (!node) return;

          node.show(); // Show the clicked node

          // Recursively show children
          const childEdges = cyRef.current.edges(`[source="${nodeId}"]`);
          childEdges.forEach((edge) => {
            edge.target().show(); // Show child node
            showAllDescendants(edge.target().id()); // Recurse
          });
      }
      };

      const restructureLayout = () => {
        if (cyRef.current) {
          cyRef.current.style()
          .selector('node')
          .style({
            'width': '30px',
            'height': '30px',
            "font-size": 3,
            'text-wrap': 'ellipsis',
            'text-max-width': '25px',
          })
          .update();
          cyRef.current.layout({
            name: selectedLayout,
            directed: true,
            equidistant: true,
            minNodeSpacing: 0.1,
            spacingFactor: nodeCount/10>0.75?0.75:nodeCount/10, // Default spacing
            animate: true,
            nodeDimensionsIncludeLabels: true,
          }).run();
        }
        nodeCount=0;
      };
      const restructureLayoutBack = () => {
        if (cyRef.current) {
          cyRef.current.layout({
            name: selectedLayout,
            directed: true,
            spacingFactor: 1.5, // Pull nodes closer
          }).run();
        }
      };

      cyRef.current.on('tap', 'node', (event) => {
        if (cyRef.current) {
          const clickedNode = event.target;
          const clickedNodeId = clickedNode.id();
          if (lastClickedNodeId === clickedNodeId) {
            cyRef.current.nodes().show(); // Show all nodes
            restructureLayoutBack(); // Re-apply the layout
            lastClickedNodeId = null;
          } else {
            cyRef.current.nodes().hide(); // Hide all nodes
            showAllDescendants(clickedNodeId); // Show the clicked node and descendants
            restructureLayout(); // Re-apply the layout to bring nodes closer
            lastClickedNodeId = clickedNodeId;
          }
        }
      });
    }
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [data, options]);

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <div id="cytoscape-container" className={styles.cytoscapeContainer} />
    </div>
  );
};
