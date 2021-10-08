foam.CLASS({
  name: 'Memento',

  properties: [
    'parent',
    {
      name: 'bindings',
      factory: function() { return {}; }
    },
    {
      name: 'frames',
      factory: function() { return []; }
    },
    'bound',
    {
      name: 'str',
      postSet: function(_, s) {
        var m = {};
        s.split('&').forEach(p => {
          var [k,v] = p.split('=');
          m[k] = v;
        });
        this.bindings = m;
      }
    }
  ],

  methods: [
    function init() {
      this.str = this.toString();
      /*
      for ( var key in this.bound ) {
        var slot = this.bound[key];
        this.onDetach(slot.sub(this.update));
        if ( this.bound[key] ) slot.set(this.bound[key]);
      }*/
    },

    function bind(memorable) {
      var bindings = {};

      memorable.cls_.getAxiomsByClass(foam.core.Property).filter(p => p.memorable).forEach(p => {
        console.log('**** MEMORABLE ', p.name);
        var slot = memorable.slot(p.name)
        bindings[p.shortName || p.name] = slot;
        memorable.onDetach(memorable.sub(this.update));
      });

      var l = this.bindings.length;
      memorable.onDetach(() => this.frames.length = l);
      this.frames.push(bindings);
    },

    function toString() {
      var str = this.parent ? this.parent.toString() : '';

      for ( var i = 0 ; i < this.frames.length ; i++ ) {
        var frame = this.frames[i];
        for ( var key in frame) {
          var slot = frame[key];
          if ( slot.get() ) {
            if ( str ) str = str + '&';
            str = str + key + '=' + slot.get();
          }
        }
      }

      return str;
    }
  ],

  listeners: [
    {
      name: 'update',
      isFramed: true,
      code: function() {
        this.str = this.toString();
      }
    }
  ]
});


foam.CLASS({
  name: 'MemorablePropertyRefinement',
  refines: 'foam.core.Property',

  properties: [
    {
      class: 'Boolean',
      name: 'memorable'
    }
  ]
});


foam.CLASS({
  name: 'Memorable',

  properties: [
    {
      name: 'memento',
      hidden: true,
      factory: function() { return this.__context__.memento || Memento.create(); },
      initObject: function(memorable) {
        memorable.memento.bind(memorable);
      }
    }
  ]
});


foam.CLASS({
  name: 'MementoTest',
  extends: 'foam.u2.Controller',

  mixins: [
    'Memorable'
  ],

  properties: [
    {
      name: 'skip',
      shortName: 's',
      value: 10,
      memorable: true
    },
    {
      name: 'limit',
      memorable: true
    },
    {
      name: 'query',
      shortName: 'q',
      memorable: true
    },
    {
      name: 'abc'
    }
  ],

  methods: [
    function render() {
      // this.subMemento.str = 'q=something';
      this.add('mementotest #');
      this.add(this.memento.str$);
      this.br();
      this.add('skip: ', this.SKIP);
      this.br();
      this.add('limit: ', this.LIMIT);
      this.br();
      this.add('query: ', this.QUERY);
      this.br();
    }
  ]
});