package net.trajano.spring.cloudconfig;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

import javax.annotation.PostConstruct;

@SpringBootApplication
@EnableConfigServer
public class App {
    @Value("${spring.profiles.active}")
    private String activeProfile;

    @PostConstruct
    public void s() {
        System.out.println(activeProfile);
    }

    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }

}