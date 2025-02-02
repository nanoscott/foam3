/**
 * @license
 * Copyright 2021 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.google.flow',
  name: 'CellParser',
  extends: 'foam.parse.ImperativeGrammar',

  imports: [ 'cells' ],

  properties: [
    {
      name: 'symbols',
      factory: function() {
        return function(alt, sym, seq1, seq, literalIC, repeat, str, optional, plus, range, anyChar) {
          return {
            START: sym('expr'),

            expr: seq(sym('expr1'), optional(seq(alt('+', '-'), sym('expr')))),

            expr1: seq(sym('expr2'), optional(seq(alt('*', '/'), sym('expr1')))),

            expr2: seq(sym('expr3'), optional(seq('^', sym('expr2')))),

            expr3: alt(
              //sym('fun'),
              sym('cell'),
              sym('number'),
              sym('group')),

            xxxexpr: alt(
              //sym('cell'),
              sym('add'),
              sym('number'),
              sym('sub'),
              sym('mul'),
              sym('div'),
              sym('mod'),
              sym('sum'),
              sym('prod'),
              //sym('flow')
            ),

            add:  seq(sym('number'), '+', sym('number')),
            sub:  seq(literalIC('sub('),  sym('expr'), ',', sym('expr'), ')'),
            mul:  seq(literalIC('mul('),  sym('expr'), ',', sym('expr'), ')'),
            div:  seq(literalIC('div('),  sym('expr'), ',', sym('expr'), ')'),
            mod:  seq(literalIC('mod('),  sym('expr'), ',', sym('expr'), ')'),
            sum:  seq1(1, literalIC('sum('),  sym('vargs'), ')'),
            prod: seq1(1, literalIC('prod('), sym('vargs'), ')'),
            flow: seq(literalIC('flow('),  sym('symbol'), ',', sym('symbol'), ')'),

            vargs: repeat(alt(sym('range'), sym('expr')), ','),

            range: seq(sym('col'), sym('row'), ':', sym('col'), sym('row')),

            group: seq1(1, '(', sym('expr'), ')'),

            number: str(seq(
              optional('-'),
              str(alt(
                seq(str(repeat(sym('digit'))), '.', str(plus(sym('digit')))),
                plus(sym('digit')))))),

            cell: sym('symbol'),

            col: alt(sym('az'), sym('AZ')),

            digit: range('0', '9'),

            az: range('a', 'z'),

            AZ: range('A', 'Z'),

            row: str(repeat(sym('digit'), null, 1, 2)),

            symbol: str(seq(
              alt(range('a', 'z'), range('A', 'Z')),
              str(repeat(alt(range('a', 'z'), range('A', 'Z'), range('0', '9')))))),

            string: str(repeat(anyChar()))
          };
        }
      }
    }
  ],

  methods: [
    function init() {
      var slot  = this.slot.bind(this);
      var cell  = this.cells.cell.bind(this.cells);
      var scope = this.cells.scope;

      this.addActions({
        expr: function(a) {
          if ( ! a[1] ) return a[0];
          return slot(
            a[1][0] == '+' ?
              function(a, b) { return a + b; } :
              function(a, b) { return a - b; } ,
            a[0],
            a[1][1]);
        },
        expr1: function(a) {
          if ( ! a[1] ) return a[0];
          return slot(
            a[1][0] == '*' ?
              function(a, b) { return a * b; } :
              function(a, b) { return a / b; } ,
            a[0],
            a[1][1]);
        },
        expr2: function(a) {
          if ( ! a[1] ) return a[0];
          return slot(function(a, b) { return Math.pow(a, b); }, a[0], a[1][1]);
        },
        add: function(a) { return slot(function() { return a[0].get() + a[2].get(); }, a[0], a[2]); },
        sub: function(a) { return slot(function() { return a[1].get() - a[3].get(); }, a[1], a[3]); },
        mul: function(a) { return slot(function() { return a[1].get() * a[3].get(); }, a[1], a[3]); },
        div: function(a) { return slot(function() { return a[1].get() / a[3].get(); }, a[1], a[3]); },
        mod: function(a) { return slot(function() { return a[1].get() % a[3].get(); }, a[1], a[3]); },
        sum: function(s) { return s.map(function(s) {
          var a = s[0].get();
          var sum = 0;
          for ( var i = 0 ; i < a.length ; i++ ) sum += a[i];
          return sum;
        }); },
        prod: function(s) { return s.map(function(s) {
          var a = s[0].get();
          var prod = 0;
          for ( var i = 0 ; i < a.length ; i++ ) prod *= a[i];
          return prod;
        }); },
        flow: function(a) { return scope[a[1]].slot(a[3]); },
        az:  function(c) { return c.toUpperCase(); },
        row: function(c) { return parseInt(c); },
        number: function(s) {
          var f = parseFloat(s);
          return foam.core.ConstantSlot.create({value: f});
        },
        cell: function(a) { return cell(a[0]).numValue$; },
        vargs: function(a) {
          return foam.core.ExpressionSlot.create({
            code: function() {
              var ret = [];
              for ( var i = 0 ; i < a.length ; i++ ) {
                var r = a[i];
                if ( Array.isArray(r) )
                  ret.push.apply(ret, r);
                else
                  ret.push(r);
              }
              return ret;
            },
            args: a
          });
        },
        range: function(a) {
          var c1 = a[0], r1 = a[1], c2 = a[3], r2 = a[4];
          var slots = [];

          for ( var c = c1 ; c <= c2; c++ )
            for ( var r = r1 ; r <= r2 ; r++ )
              slots.push(cell(c + r).numValue$);

          return foam.core.ExpressionSlot.create({
            code: function() {
              return arguments;
            },
            args: slots
          });
        },
        string: function(s) {
          return foam.core.ConstantSlot.create({value: s});
        }
      });
    }
  ]
});


foam.CLASS({
  package: 'com.google.flow',
  name: 'Row',
  extends: 'foam.u2.Controller',

  imports: [ 'parser' ],

  css: `
    ^ .property-id input {
      font-weight: 700;
    }
  `,

  properties: [
    {
      class: 'String',
      name: 'id',
      width: 10
    },
    {
      class: 'String',
      name: 'expression',
      onKey: true,
      width: 50
    },
    {
      class: 'String',
      name: 'value'
    },
    {
      name: 'numValue',
      expression: function(value) { return parseFloat(value); }
    }
  ],

  methods: [
    function initE() {
      this.SUPER();

      this
        .addClass(this.myClass())
        .start('span')
          .add(this.ID)
        .end()
        .start('span')
          .add(this.EXPRESSION)
        .end()
        .start('span')
          .style({padding: 4, 'font-weight': 800})
          .add('=')
        .end()
        .start('span')
          .add(this.value$)
        .end();

        var s;
        this.expression$.sub(() => {
          s && s.detach();

          var slot = this.parser.parseString(this.expression);
          s = this.value$.follow(slot)
        });
    }
  ]
});

// https://www.artima.com/pins1ed/the-scells-spreadsheet.html
foam.CLASS({
  package: 'com.google.flow',
  name: 'Calc',
  extends: 'foam.u2.Element',

  requires: [
    'com.google.flow.CellParser',
    'com.google.flow.Row',
    'foam.u2.tag.Input'
  ],

  imports: [ 'scope?' ], // Used by flow() function
  exports: [ 'as cells', 'parser' ],

  classes: [
    {
      name: 'Cell',
      extends: 'foam.u2.ReadWriteView',

      requires: [ 'foam.u2.tag.Input', 'foam.u2.HTMLElement' ],

      documentation: `
        Doesn't build inner views until value is set or user clicks on view.
        This complicates the design but saves memory and startup time.
      `,

      css: `
        ^ > span {
          display: block;
          height: 15px;
          padding: 2px;
          width: 100%;
        }
        ^ > input {
          border: none;
          outline: 1px solid blue;
          outline-offset: 0;
          padding-left: 2px;
          width: 100%;
        }
      `,

      properties: [
        [ 'nodeName', 'span' ],
        {
          name: 'formula',
          displayWidth: 10
        },
        {
          name: 'data',
          adapt: function(_, v) {
            var ret = parseFloat(v);
            return ret && ! Number.isInteger(ret) ? ret.toFixed(2) : v;
          },
          displayWidth: 12
        },
        {
          name: 'numValue',
          expression: function(data) { return parseFloat(data); }
        }
      ],

      methods: [
        function initE() {
          this.SUPER();
          this.addClass(this.myClass());
        },

        function isLoaded() { return true; },

        // function isLoaded() { return this.value; },
        // function listenForLoad() { this.value$.sub(this.onDataLoad); },
        function toReadE() {
          return this.HTMLElement.create(
            {nodeName: 'span'},
            this).add(this.data$);
        },

        function toWriteE() {
          this.formula$.sub(this.onDataLoad);
          var e = this.Input.create(); //this.E('input');
          e.data$ = this.formula$;
          return e;
        }
      ]
    }
  ],

  css: `
    ^ tr, ^ td, ^ th, ^ input {
      color: #333;
      font: 13px roboto, arial, sans-serif;
    }
    ^ tr { height: 26px; }
    ^cell { min-width: 102px; }
    ^, ^ th, ^ td { border: 1px solid #ccc; }
    ^ td { height: 100%; }
    ^ th, ^ td {
      border-right: none;
      border-bottom: none;
    }
    ^ th {
      background: #eee;
      color: #333;
      padding: 2px 18px;
    }
    ^ {
      border-left: none;
      border-top: none;
      overflow: auto;
    }
  `,

  properties: [
//    [ 'rows',    99 ],
//    [ 'columns', 26 ],
//    [ 'rows',    10 ],
    [ 'columns', 7 ],
    {
      name: 'cells',
      factory: function() { return {}; }
    },
    {
      name: 'parser',
      factory: function() { return this.CellParser.create(); }
    },
    {
      class: 'FObjectArray',
      of: 'com.google.flow.Row',
      name: 'rows'
    }
  ],

  methods: [
    function init() {
      this.SUPER();

      return;
      // Two sample spreadsheets
      // Spreadsheet taken from Visicalc
 this.loadCells({"A0":"<b><u>Item</u></b>","B0":"<b><u>No.</u></b>","C0":"<b><u>Unit</u></b>","D0":"<b><u>Cost</u></b>","A1":"Muck Rake","B1":"43","C1":"12.95","D1":"=mul(B1,C1)","A2":"Buzz Cut","B2":"15","C2":"6.76","D2":"=mul(B2,C2)","A3":"Toe Toner","B3":"250","C3":"49.95","D3":"=mul(B3,C3)","A4":"Eye Snuff","B4":"2","C4":"4.95","D4":"=mul(B4,C4)","C5":"Subtotal","D5":"=sum(D1:D4)","B6":"9.75","C6":"Tax","D6":"=div(mul(B6,D5),100)","C7":"<b>Total</b>","D7":"=add(D5,D6)"});

      // Spreadsheet to test all functions
      // this.loadCells({"A0":"<b>Formulas</b>","B0":"<b>Values</b>","A1":" 1","B1":"1","A2":" 10","B2":"10","A3":" 10.12","B3":"10.12","A4":" -10.1","B4":"-10.1","A5":" foobar","B5":"foobar","A6":" =add(1,2)","B6":"=add(1,2)","A7":" =sub(2,1)","B7":"=sub(2,1)","A8":" =mul(2,3)","B8":"=mul(2,3)","A9":" =div(9,3)","B9":"=div(9,3)","A10":" =mod(8,3)","B10":"=mod(8,3)","A11":" =add(mul(2,3),div(3,2))","B11":"=add(mul(2,3),div(3,2))","A12":" =A1","B12":"=A1","A13":" =add(A1,B1)","B13":"=add(A1,B1)","A14":" =sum(1,2,3,4,5)","B14":"=sum(1,2,3,4,5)","A15":" =sum(B6:B10)","B15":"=sum(B6:B10)","A16":" =prod(B6:B10)","B16":"=prod(B6:B10)"});

//this.loadCells({"A0":"<div style=\"width:200px;\"><b><u>Benchmark</u></b></div>","B0":"<b><u>IndexedDB</u></b>","C0":"<b><u>DAO</u></b>","A1":"Create Albums","B1":"190","C1":"366","A2":"Create Photos","B2":"2772","C2":"2492","A3":"Select All Albums","B3":"168","C3":"1.93","A4":"Select All Photos","B4":"1361","C4":"3.86","B5":"1.43","C5":"0.06","B6":"1.56","C6":"0.63","B7":"10.28","C7":"1.12","D0":"<b><u>Speedup</u></b>","D1":"=div(B1,C1)","D2":"=div(B2,C2)","D3":"=div(B3,C3)","D4":"=div(B4,C4)","A5":"Single Key Query","D5":"=div(B5,C5)","A6":"Multi-Key Query","D6":"=div(B6,C6)","A7":"Multi-Key Query","D7":"=div(B7,C7)","A8":"Multi-Key Query","B8":"102","C8":"12.24","D8":"=div(B8,C8)","A9":"Multi-Key Query","B9":"561","C9":"15.24","D9":"=div(B9,C9)","A10":"Indexed Field Query","B10":"4.63","C10":"0.46","D10":"=div(B10,C10)","A11":"Ad-Hoc Query","B11":"658","C11":"9.91","D11":"=div(B11,C11)","A12":"Simple Inner-Join","B12":"721","C12":"9.55","D12":"=div(B12,C12)","A13":"Inner-Join Aggregation","B13":"647","C13":"38.56","D13":"=div(B13,C13)","A14":"Order-By","B14":"59","C14":"0.55","D14":"=div(B14,C14)","A15":"Order and Group By","B15":"1232","C15":"3.63","D15":"=div(B15,C15)","A16":"<b>Average:</b>","B16":"=SUM(B1:B15)","C16":"=SUM(C1:C15)","D16":"=div(B14,C14)"});
    },

    function nextRowId() {
      return String.fromCharCode(65 + this.rows.length);
    },

    function addRow() {
      var row = this.Row.create({id: this.nextRowId()});
      this.rows.push(row);
      this.add(row);
    },

    function initE() {
      this.SUPER();
      var self = this;

      this.addRow();
      this.addRow();
      this.addRow();
      this.addRow();
/*
      this.setNodeName('table').addClass(this.myClass()).attrs({cellspacing: 0}).
        start('tr').
          tag('th').
          repeat(0, this.columns-1, function (i) {
            this.start('th').add(String.fromCharCode(65 + i)).end();
          }).
        end().
        repeat(0, this.rows-1, function(i) {
          this.start('tr').
            start('th').add(i).end().
            repeat(0, this.columns-1, function(j) {
              this.start('td').add(self.cell(self.cellName(j, i))).end();
            }).
          end();
        });
        */
    },

    function loadCells(map) {
      for ( var key in map ) this.cell(key).formula = String(map[key]);
    },

    function save() {
      var map = {};
      for ( var key in this.cells ) {
        var cell = this.cells[key];
        if ( cell.formula !== '' ) map[key] = cell.formula;
      }
      return map;
    },

    function cell(name) {
      var ret = this.rows.find(row => row.id === name);
      return ret;
    }
  ]
});
