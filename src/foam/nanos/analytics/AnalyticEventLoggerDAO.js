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
    'foam.core.X',
    'foam.core.PropertyInfo',
    'foam.nanos.logger.Loggers',
    'foam.log.LogLevel',
    'foam.util.SafetyUtil'
  ],

  methods: [
    {
      name: 'put_',
      javaCode: `
        var evt = (AnalyticEvent) obj;

        // Log all events
        log(x, formatEvent(evt), evt.getLogLevel());
        Loggers.logger(x, this).log(formatEvent(evt));

        // Stop processing if this is just a log stream event
        if ( evt.getStream() == AnalyticEventStream.LOG ) {
          return evt;  
        } 
        
        return getDelegate().put_(x, obj);
      `
    },
    {
      name: 'log',
      args: 'X x, String message, LogLevel logLevel',
      javaCode: `
        if ( SafetyUtil.isEmpty(message) )
          return;

        var logger = Loggers.logger(x, this);
        switch ( logLevel ) {
          case DEBUG:
            logger.debug(message);
            break;

          case INFO:
            logger.info(message);
            break;

          case WARN:
            logger.warning(message);
            break;

          case ERROR:
            logger.error(message);
            break;
        }
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
        for ( var prop : properties ) {
          if ( !prop.isSet(evt) )
            continue;

          if ( sb.length() > 0 )
            sb.append(", ");

          sb.append(prop.getName())
            .append(":")
            .append(prop.get(evt));            
        }

        // Add any tags
        if ( evt.getTags() != null && evt.getTags().length > 0 ) {
          sb.append(", ")
            .append(AnalyticEvent.TAGS.getName())
            .append(":");

          boolean doneFirst = false;
          for ( var tag : evt.getTags() ) {
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
