package net.trajano.spring.cloudgateway;

import net.trajano.spring.swarm.discovery.DockerSwarmDiscoveryClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

import javax.annotation.PostConstruct;

@SpringBootApplication
//@EnableDiscoveryClient
public class App {
    @Autowired
    private DiscoveryClient client;

    @PostConstruct
    public void foo() {
        System.out.println(client);
    }
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
