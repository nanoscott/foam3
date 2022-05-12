/**
 * @license
 * Copyright 2022 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.u2.detail',
  name: 'RowPropertyView',
  extends: 'foam.u2.View',

  documentation: `
    View a property's label and value in a single row. The table cell formatter
    will be used to render the value.
  `,

  css: `
    ^ {
      display: flex;
      justify-content: space-between;
    }
  `,

  properties: [
    'prop'
  ],

  methods: [
    function render() {
      const self = this;
      this
        .addClass()
        .start()
          .add(this.prop.label)
        .end()
        .add(this.slot(function (data) {
          const el = this.E();
          const prop = self.prop;
          prop.tableCellFormatter.format(
            el,
            prop.f ? prop.f(data) : null,
            data,
            prop
          );
          return el;
        }))
        ;
    }
  ]
});