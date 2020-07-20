/**
 * @license
 * Copyright 2020 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.box.socket',
  name: 'SocketConnectionBoxManager',

  implements: [
    'foam.nanos.NanoService'
  ],

  javaImports: [
    'foam.box.Box',
    'foam.box.ReplyBox',
    'foam.core.Agency',
    'foam.core.ContextAgent',
    'foam.core.X',
    'foam.nanos.logger.PrefixLogger',
    'foam.nanos.logger.Logger',
    'java.io.IOException',
    'java.net.ConnectException',
    'java.net.InetSocketAddress',
    'java.net.Socket',
    'java.net.SocketAddress',
    'java.net.SocketException',
    'java.net.SocketTimeoutException'
  ],

  properties: [
    {
      documentation: 'So not to block server shutdown, have sockets timeout. Catch and continue on SocketTimeoutException.',
      class: 'Int',
      name: 'soTimeout',
      value: 60000
    },
    {
      documentation: 'Time to wait on initial creation for connection to be established',
      class: 'Int',
      name: 'connectTimeout',
      value: 60000
    },
    {
      class: 'Map',
      name: 'boxes',
      javaFactory: `
        return java.util.Collections.synchronizedMap(new java.util.HashMap());
      `
    },
    {
      name: 'logger',
      class: 'FObjectProperty',
      of: 'foam.nanos.logger.Logger',
      visibility: 'HIDDEN',
      javaFactory: `
        return new PrefixLogger(new Object[] {
          this.getClass().getSimpleName()
        }, (Logger) getX().get("logger"));
      `
    }
  ],

  methods: [
    {
      name: 'add',
      args: [
        {
          name: 'box',
          type: 'SocketConnectionBox'
        }
      ],
      javaCode: `
      getBoxes().put(makeKey(box.getHost(), box.getPort()), box);
      `
    },
    {
      name: 'remove',
      args: [
        {
          name: 'box',
          type: 'SocketConnectionBox'
        }
      ],
      javaCode: `
      if ( box != null ) {
        getBoxes().remove(makeKey(box.getHost(), box.getPort()));

        Socket socket = (Socket) box.getSocket();
        if ( socket != null &&
             socket.isConnected() ) {
          try {
            socket.getOutputStream().flush();
          } catch (IOException e) {
            // nop
          }
          try {
            getLogger().debug("socket,close",socket.getRemoteSocketAddress());
            socket.close();
          } catch (IOException e) {
            // nop
          }
        }
      }
      `
    },
    {
      name: 'makeKey',
      type: 'String',
      args: [
        {
          name: 'host',
          type: 'String'
        },
        {
          name: 'port',
          type: 'int'
        }
      ],
      javaCode: `
        return host + ":" + port;
      `
    },
    {
      name: 'get',
      type: 'foam.box.Box',
      args: [
        {
          name: 'x',
          type: 'X'
        },
        {
          name: 'host',
          type: 'String'
        },
        {
          name: 'port',
          type: 'int'
        }
      ],
      javaCode: `
        SocketConnectionBox box = (SocketConnectionBox) getBoxes().get(makeKey(host, port));
        if ( box != null ) {
          return box;
        }

        try {
          Socket socket = new Socket();
          socket.setSoTimeout(getSoTimeout());
          SocketAddress address = new InetSocketAddress(host, port);
          socket.connect(address, getConnectTimeout());
          box = new SocketConnectionBox(x, socket, host, port);
          add(box);
          Agency agency = (Agency) x.get("threadPool");
          agency.submit(x, (ContextAgent) box, socket.getRemoteSocketAddress().toString());
          return box;
        // } catch ( ConnectException | SocketException | SocketTimeoutException e ) {
        } catch ( IOException e ) {
          getLogger().error(host, port, e.getMessage());
          remove(box);
          throw new RuntimeException(e);
        } catch ( Throwable t ) {
          remove(box);
          throw new RuntimeException(t);
        }
      `
    },
    {
      name: 'getReplyBox',
      type: 'foam.box.Box',
      synchronized: true,
      args: [
        {
          name: 'x',
          type: 'X'
        },
        {
          name: 'key',
          type: 'String'
        },
      ],
      javaCode: `
      Box box = (Box) getBoxes().get(key);
      if ( box != null ) {
        return box;
      }

      box = new SocketConnectionReplyBox(x, key);
      getBoxes().put(key, box);
      return box;
      `
    },
    {
      name: 'removeReplyBox',
      args: [
        {
          name: 'box',
          type: 'SocketConnectionReplyBox'
        }
      ],
      javaCode: `
      getBoxes().remove(box.getKey());
      `
    },
    {
      name: 'start',
      javaCode: `
        return;
      `
    }
  ]
});

