/**
 * @license
 * Copyright 2020 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.i18n',
  name: 'InlineLocaleEditor',
  extends: 'foam.u2.tag.Input',

  css: `
    ^ { border: 1px solid red; padding: 4px; }
  `,

  imports: [
    'localeDAO',
    'translationService'
  ],

  properties: [
    {
      name: 'source'
    },
    {
      name: 'defaultText'
    },
    {
      name: 'mode',
      value: foam.u2.DisplayMode.RW
    }
  ],

  methods: [
    function initE() {
      this.SUPER();
      this.addClass(this.myClass());
      this.data$.sub(this.onDataUpdate);
    }
  ],

  listeners: [
    function onDataUpdate() {
      console.log('**********', this.source);
    }
  ]
});