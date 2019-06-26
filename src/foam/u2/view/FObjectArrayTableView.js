foam.CLASS({
  package: 'foam.u2.view',
  name: 'FObjectArrayTableView',
  extends: 'foam.u2.View',
  requires: [
    'foam.comics.v2.DAOBrowserView',
    'foam.dao.MDAO'
  ],
  properties: [
    {
      class: 'Class',
      name: 'of',
      expression: function(data) {
        return data[0].cls_;
      }
    }
  ],
  methods: [
    function fromProperty(p) {
      this.of = p.of;
    },
    function initE() {
      var self = this;
      self.SUPER();
      self.add(self.slot(function(data) {
        var dao = self.MDAO.create({
          of: self.of
        });
        data.forEach(d => dao.put(d));
        console.log(dao.select());
        return self.DAOBrowserView.create({
          data: dao
        });
      }));
    }
  ]
});
