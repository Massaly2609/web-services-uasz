package sn.uasz.XML_RPC.Config;

import org.apache.xmlrpc.XmlRpcException;
import org.apache.xmlrpc.XmlRpcRequest;
import org.apache.xmlrpc.server.PropertyHandlerMapping;
import org.apache.xmlrpc.server.RequestProcessorFactoryFactory;
import org.apache.xmlrpc.server.XmlRpcServer;
import org.apache.xmlrpc.server.XmlRpcServerConfigImpl;
import org.apache.xmlrpc.webserver.WebServer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import sn.uasz.XML_RPC.XML_RPC.PersonneXmlRpcHandler;

@Configuration
public class XmlRpcConfig {

    @Bean(initMethod = "start", destroyMethod = "shutdown")
    public WebServer xmlRpcServer(
            PersonneXmlRpcHandler handler) throws Exception {

        WebServer webServer = new WebServer(8081);

        XmlRpcServer server = webServer.getXmlRpcServer();

        PropertyHandlerMapping mapping =
                new PropertyHandlerMapping();

        // Utiliser le bean Spring existant
        mapping.setRequestProcessorFactoryFactory(
                new RequestProcessorFactoryFactory() {

                    @Override
                    public RequestProcessorFactory
                    getRequestProcessorFactory(Class pClass) {

                        return new RequestProcessorFactory() {

                            @Override
                            public Object getRequestProcessor(
                                    XmlRpcRequest request)
                                    throws XmlRpcException {

                                return handler;
                            }
                        };
                    }
                }
        );

        // Enregistrer les méthodes XML-RPC
        mapping.addHandler(
                "Personne",
                PersonneXmlRpcHandler.class
        );

        server.setHandlerMapping(mapping);

        XmlRpcServerConfigImpl config =
                new XmlRpcServerConfigImpl();

        config.setEnabledForExtensions(true);

        server.setConfig(config);


        System.out.println(
                "Serveur XML-RPC démarré sur http://localhost:8081"
        );

        return webServer;
    }

}
