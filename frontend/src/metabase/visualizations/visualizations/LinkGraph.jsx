/* @flow */
import React, { Component } from "react";
import { t } from "ttag";
import { Graph } from 'react-d3-graph';
import LinkGraphRenderer from "../components/LinkGraphRenderer.jsx";
import LegendHeader from "../components/LegendHeader";
import _ from "underscore";
import { TitleLegendHeader } from "metabase/visualizations/components/TitleLegendHeader";
import {
  LINKGRAPH_DATA_SETTINGS,
} from "../lib/settings/graph";


//configuration needed for D3 graph


const myConfig = {
  "automaticRearrangeAfterDropNode": true,
  "collapsible": false,
  "directed": false,
  "focusAnimationDuration": 0.75,
  "focusZoom": 1,
  "height": 400,
  "highlightDegree": 2,
  "highlightOpacity": 0.2,
  "linkHighlightBehavior": true,
  "maxZoom": 12,
  "minZoom": 0.05,
  "nodeHighlightBehavior": true,
  "panAndZoom": false,
  "staticGraph": false,
  "width": 800,
  "d3": {
    "alphaTarget": 0.05,
    "gravity": -250,
    "linkLength": 120,
    "linkStrength": 2
  },
  "node": {
    "color": "#d3d3d3",
    "fontColor": "black",
    "fontSize": 10,
    "fontWeight": "normal",
    "highlightColor": "red",
    "highlightFontSize": 14,
    "highlightFontWeight": "bold",
    "highlightStrokeColor": "red",
    "highlightStrokeWidth": 1.5,
    "mouseCursor": "crosshair",
    "opacity": 0.9,
    "renderLabel": true,
    "size": 200,
    "strokeColor": "none",
    "strokeWidth": 1.5,
    "svg": "",
    "symbolType": "circle"
  },
  "link": {
    "color": "lightgray",
    "fontColor": "black",
    "fontSize": 8,
    "fontWeight": "normal",
    "highlightColor": "red",
    "highlightFontSize": 8,
    "highlightFontWeight": "normal",
    "labelProperty": "label",
    "mouseCursor": "pointer",
    "opacity": 1,
    "renderLabel": false,
}
};
//LinkGraph Renderer was made looking at LineAreaBarChart.jsx
//thats where the visualization is checked and processed
export default class LinkGraph extends LinkGraphRenderer {
  //identifiers for registering visualizations
  static uiName = t`LinkGraph`;
  static identifier = "linkgraph";
  static iconName = "bubble";
  static noHeader = true;

//this what configures the popup "what fields do you want to select"
  static settings = {
    ...LINKGRAPH_DATA_SETTINGS,
  };

  render() {
    //data pulled from database in series object
    const {
      series,
    } = this.props;
      //////This is How the Data is Pulled for the Link Graph////
      let selectedFields = [];
      for (var i = 0; i < series.length; i++) {
        selectedFields.push(series[i].data.rows);
      }
      let colorpicker = ["green", "blue", "red", "yellow", "orange", "purple"]
      //hardcoded filter of whats to be selected
      //should replace with what filter is but isnt connected yet
      //let selectedProgram = "HOUSING COUNSELING ASSISTANCE PROGRAM";
      let selectedProgram = true;
      let nodeArray = [];
      let linkArray = [];
      //helps make all the nessisary nodes and connections
      for (var j = 0; j < selectedFields.length; j++) {
        for(var k = 0; k < selectedFields[j].length; k++){
          if(selectedFields[j][k][0] == selectedProgram){
            nodeArray.push({id:selectedFields[j][k][0]});
            nodeArray.push({id:selectedFields[j][k][1],color:colorpicker[j]});
            linkArray.push({source: selectedFields[j][k][0], target: selectedFields[j][k][1]});
          }
        }
      }
      const data = {
          nodes: nodeArray,
          links: linkArray
      };

      return (
      <Graph
    id="graph-id" // id is mandatory, if no id is defined rd3g will throw an error
    data={data}
    config={myConfig}
    />
      );

  }
}
