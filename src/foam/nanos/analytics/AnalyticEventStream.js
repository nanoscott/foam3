/**
 * @license
 * Copyright 2023 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */


foam.ENUM({
  package: 'foam.nanos.analytics',
  name: 'AnalyticEventStream',

  values: [
    {
      name: 'ALL',
      label: 'All Streams'
    },
    {
      name: 'DAO',
      label: 'DAO Stream'
    },
    {
      name: 'LOG',
      label: 'Log Stream'
    }
  ]
});
  