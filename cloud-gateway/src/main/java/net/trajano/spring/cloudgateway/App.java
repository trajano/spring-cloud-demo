package net.trajano.spring.cloudgateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.server.adapter.ForwardedHeaderTransformer;

import java.security.Security;

@SpringBootApplication
public class App {

//    @Bean
//    public ForwardedHeaderTransformer forwardedHeaderTransformer() {
//        return new ForwardedHeaderTransformer();
//    }

    public static void main(String[] args) {
        Security.setProperty("networkaddress.cache.ttl", "1");
        SpringApplication.run(App.class, args);
    }
}
