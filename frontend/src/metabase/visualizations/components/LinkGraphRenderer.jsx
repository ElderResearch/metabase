/* @flow */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { t } from "ttag";
import CardRenderer from "./CardRenderer.jsx";
import LegendHeader from "./LegendHeader.jsx";
import { TitleLegendHeader } from "./TitleLegendHeader.jsx";
import { isNumeric, isDate } from "metabase/lib/schema_metadata";
import {getFriendlyName} from "metabase/visualizations/lib/utils";
import { formatValue } from "metabase/lib/formatting";
import { getComputedSettingsForSeries } from "metabase/visualizations/lib/settings/visualization";
import {
  MinRowsError,
  ChartSettingsError,
} from "metabase/visualizations/lib/errors";
import _ from "underscore";
import cx from "classnames";



import type { VisualizationProps } from "metabase/meta/types/Visualization";

export default class LinkGraphRenderer extends Component {
  props: VisualizationProps;
  static renderer: (element: Element, props: VisualizationProps) => any;
  static noHeader = true;


  static checkRenderable(series, settings) {
    const singleSeriesHasNoRows = ({ data: { cols, rows } }) => rows.length < 1;
    if (_.every(series, singleSeriesHasNoRows)) {
      throw new MinRowsError(1, 0);
    }
    const dimensions = (settings["graph.dimensions"] || []).filter(
      name => name,
    );
    const metrics = (settings["graph.metrics"] || []).filter(name => name);
    if (dimensions.length < 1 || metrics.length < 1) {
      throw new ChartSettingsError(
        t`Which fields do you want for nodes?`,
        { section: t`Data` },
        t`Choose fields`,
      );
    }
  }

  static transformSeries(series) {
    const newSeries = [].concat(
      ...series.map((s, seriesIndex) =>
        transformSingleSeries(s, series, seriesIndex),
      ),
    );
    if (_.isEqual(series, newSeries) || newSeries.length === 0) {
      return series;
    } else {
      return newSeries;
    }
  }

  static propTypes = {
    series: PropTypes.array.isRequired,
    actionButtons: PropTypes.node,
    showTitle: PropTypes.bool,
    isDashboard: PropTypes.bool,
  };

  static defaultProps = {};

  render() {
    const {
      series,
      hovered,
      showTitle,
      actionButtons,
      onChangeCardAndRun,
      onVisualizationClick,
      visualizationIsClickable,
    } = this.props;

    const settings = this.getSettings();

    let multiseriesHeaderSeries;
    if (series.length > 1) {
      multiseriesHeaderSeries = series;
    }

    const hasTitle = showTitle && settings["card.title"];

    //this returns nothing, because LinkGraph.jsx returns the graph
    return (null);
  }
}

function transformSingleSeries(s, series, seriesIndex) {
  const { card, data } = s;
  // HACK: prevents cards from being transformed too many times
  if (card._transformed) {
    return [s];
  }

  const { cols, rows } = data;
  const settings = getComputedSettingsForSeries([s]);
  const dimensions = settings["graph.dimensions"].filter(d => d != null);
  const metrics = settings["graph.metrics"].filter(d => d != null);
  const dimensionColumnIndexes = dimensions.map(dimensionName =>
    _.findIndex(cols, col => col.name === dimensionName),
  );
  const metricColumnIndexes = metrics.map(metricName =>
    _.findIndex(cols, col => col.name === metricName),
  );
  const bubbleColumnIndex =
    settings["scatter.bubble"] &&
    _.findIndex(cols, col => col.name === settings["scatter.bubble"]);
  const extraColumnIndexes =
    bubbleColumnIndex != null && bubbleColumnIndex >= 0
      ? [bubbleColumnIndex]
      : [];

  if (dimensions.length > 1) {
    const [dimensionColumnIndex, seriesColumnIndex] = dimensionColumnIndexes;
    const rowColumnIndexes = [dimensionColumnIndex].concat(
      metricColumnIndexes,
      extraColumnIndexes,
    );

    const breakoutValues = [];
    const breakoutRowsByValue = new Map();

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const seriesValue = row[seriesColumnIndex];

      let seriesRows = breakoutRowsByValue.get(seriesValue);
      if (!seriesRows) {
        breakoutRowsByValue.set(seriesValue, (seriesRows = []));
        breakoutValues.push(seriesValue);
      }

      const newRow = rowColumnIndexes.map(columnIndex => row[columnIndex]);
      // $FlowFixMe: _origin not typed
      newRow._origin = { seriesIndex, rowIndex, row, cols };
      seriesRows.push(newRow);
    }

    return breakoutValues.map(breakoutValue => ({
      card: {
        ...card,
        // if multiseries include the card title as well as the breakout value
        name: [
          // show series title if it's multiseries
          series.length > 1 && card.name,
          // always show grouping value
          formatValue(breakoutValue, { column: cols[seriesColumnIndex] }),
        ]
          .filter(n => n)
          .join(": "),
        _transformed: true,
        _breakoutValue: breakoutValue,
        _breakoutColumn: cols[seriesColumnIndex],
      },
      data: {
        rows: breakoutRowsByValue.get(breakoutValue),
        cols: rowColumnIndexes.map(i => cols[i]),
        _rawCols: cols,
      },
      // for when the legend header for the breakout is clicked
      clicked: {
        dimensions: [
          {
            value: breakoutValue,
            column: cols[seriesColumnIndex],
          },
        ],
      },
    }));
  } else {
    // dimensions.length <= 1
    const dimensionColumnIndex = dimensionColumnIndexes[0];
    return metricColumnIndexes.map(metricColumnIndex => {
      const col = cols[metricColumnIndex];
      const rowColumnIndexes = [dimensionColumnIndex].concat(
        metricColumnIndex,
        extraColumnIndexes,
      );
      const name = [
        // show series title if it's multiseries
        series.length > 1 && card.name,
        // show column name if there are multiple metrics or sigle series
        (metricColumnIndexes.length > 1 || series.length === 1) &&
          col &&
          getFriendlyName(col),
      ]
        .filter(n => n)
        .join(": ");

      return {
        card: {
          ...card,
          name: name,
          _transformed: true,
          _seriesIndex: seriesIndex,
          // use underlying column name as the seriesKey since it should be unique
          // EXCEPT for dashboard multiseries, so check seriesIndex == 0
          _seriesKey: seriesIndex === 0 && col ? col.name : name,
        },
        data: {
          rows: rows.map((row, rowIndex) => {
            const newRow = rowColumnIndexes.map(i => row[i]);
            // $FlowFixMe: _origin not typed
            newRow._origin = { seriesIndex, rowIndex, row, cols };
            return newRow;
          }),
          cols: rowColumnIndexes.map(i => cols[i]),
          _rawCols: cols,
        },
      };
    });
  }
}
