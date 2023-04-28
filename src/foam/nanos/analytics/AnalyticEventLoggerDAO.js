/**
 * @license
 * Copyright 2022 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.analytics',
  name: 'AnalyticEventLoggerDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: 'Create log message event',

  javaImports: [
    'foam.nanos.logger.Loggers',
    'foam.core.PropertyInfo'
  ],

  methods: [
    {
      name: 'put_',
      javaCode: `
        var evt = (AnalyticEvent) obj;

        // Log all events
        Loggers.logger(x, this).log(formatEvent(evt));

        // Stop processing if this is just a log stream event
        if ( "LOG".equalsIgnoreCase(evt.getStream()) ) {
          return evt;  
        } 
        
        return getDelegate().put_(x, obj);
      `
    },
    {
      name: 'formatEvent',
      args: 'AnalyticEvent evt',
      type: 'String',
      javaCode: `
        if ( evt == null ) 
          return null;

        // Properties to print
        PropertyInfo[] properties = new PropertyInfo[] {
          AnalyticEvent.NAME,
          AnalyticEvent.TIMESTAMP,
          AnalyticEvent.SESSION_ID,
          AnalyticEvent.TRACE_ID,
          AnalyticEvent.OBJECT_ID,
          AnalyticEvent.EXTRA,
          AnalyticEvent.DURATION
        };

        StringBuffer sb = new StringBuffer();
        for ( var prop in properties ) {
          if ( !prop.isSet(evt) )
            continue;

          if ( sb.getLength() > 0 )
            sb.append(", ");

          sb.append(prop.getName())
            .append(":")
            .append(prop.get(evt));            
        }

        // Add any tags
        if ( evt.getTags() != null ) {
          sb.append(", ")
            .append(AnalyticEvent.TAGS.getName())
            .append(":");

          boolean doneFirst = false;
          for ( var tag in evt.getTags() ) {
            if ( doneFirst )
              sb.append(",");

            sb.append(tag);
          }
        }

        return sb.toString();
      `
    }
  ]
});
