/**
* @license
* Copyright 2019 The FOAM Authors. All Rights Reserved.
* http://www.apache.org/licenses/LICENSE-2.0
*/

foam.CLASS({
  package: 'org.chartjs',
  name: 'HorizontalBarDAOChartView',
  extends: 'org.chartjs.AbstractChartView',

  implements: [
    'foam.mlang.Expressions'
  ],

  properties: [
    {
      class: 'Date',
      name: 'startDate'
    },
    {
      class: 'Date',
      name: 'endDate'
    },
    {
      class: 'Reference',
      of: 'net.nanopay.account.Account',
      name: 'account',
    },
    {
      class: 'Enum',
      of: 'net.nanopay.liquidity.ui.dashboard.DateFrequency',
      name: 'dateFrequency',
    },
    {
      class: 'Map',
      name: 'config',
      documentation: `
        The config map that is expected by chartjs. Structure and information can be found in chartjs.org's documentation.
      `,
      factory: function () {
        return {
          type: 'horizontalBar',
          options: {
            legend: {
              display: false
            },
            elements: {
              rectangle: {
                borderWidth: 2,
              }
            },
          },
          scales: {
            xAxes: [{
              barPercentage: 0.5,
              barThickness: 6,
              maxBarThickness: 8,
              gridLines: {
                  offsetGridLines: true
              }
            }]
          }
        };
      }
    },
    {
      class: 'foam.mlang.ExprProperty',
      name: 'labelExpr',
    },
    {
      class: 'foam.mlang.ExprProperty',
      name: 'xExpr',
    },
    {
      class: 'foam.mlang.ExprProperty',
      name: 'yExpr',
    }
  ],

  reactions: [
    ['', 'propertyChange.account', 'dataUpdate'],
    ['', 'propertyChange.dateFrequency', 'dataUpdate'],
    ['', 'propertyChange.startDate', 'dataUpdate'],
    ['', 'propertyChange.endDate', 'dataUpdate'],
  ],

  listeners: [
    {
      name: 'dataUpdate',
      isFramed: true,
      code: function() {
        var self = this;
        var glang = {};
        glang = this.dateFrequency.glang.clone().copyFrom({
          delegate: net.nanopay.tx.model.Transaction.COMPLETION_DATE
        });

        self.data
          .where(
            this.AND(
              this.GTE(self.yExpr, self.startDate),
              this.LTE(self.yExpr, self.endDate)
            )
          )
          .select(this.GROUP_BY(glang, this.GROUP_BY(self.labelExpr, this.SUM(self.xExpr))))
          .then(function(sink) {
            self.config.data = { datasets: [] };
            var config = foam.Object.clone(self.config);
            config.data = {
              labels: sink.groupKeys.map(key => {
                return key.toLocaleDateString();
              }),
              datasets: [
                {
                  label: 'Cash In',
                  backgroundColor: '#b8e5b3',
                  data: Object.keys(sink.groups).map(key => {
                    return sink.groups[key].groups["AlternaCITransaction"] 
                      ? sink.groups[key].groups["AlternaCITransaction"].value 
                      : 0;
                  })
                },
                {
                  label: 'Cash Out',
                  backgroundColor: '#f79393',
                  data: Object.keys(sink.groups).map(key => {
                    return sink.groups[key].groups["AlternaCOTransaction"] 
                      ? sink.groups[key].groups["AlternaCOTransaction"].value 
                      : 0;
                  })
                }
              ]
            };
            self.config = config;
          })
      }
    }
  ]
});
